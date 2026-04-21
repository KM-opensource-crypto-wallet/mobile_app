package com.coinswallet;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.cert.Certificate;
import java.security.spec.ECGenParameterSpec;

public class AttestationModule extends ReactContextBaseJavaModule {

    private static final String KEY_ALIAS = "kiml_key";
    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";

    public AttestationModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AttestationModule";
    }

    /**
     * Generates a fresh EC P-256 key pair in the Android Keystore with the server
     * challenge embedded via setAttestationChallenge(). Tries StrongBox first
     * (Titan M chip), falls back to TEE if StrongBox is unavailable (most devices
     * and all emulators only have TEE).
     *
     * Returns a WritableMap with:
     *   keyId      — Keystore alias ("kiml_key")
     *   publicKey  — SPKI-encoded public key, Base64 no-wrap
     *   apkHash    — lowercase hex SHA-256 of the APK signing certificate
     *   certChain  — WritableArray of Base64 no-wrap DER X.509 certs (leaf first)
     */
    @ReactMethod
    public void register(String challenge, Promise promise) {
        try {
            generateKeyPairWithChallenge(challenge.getBytes("UTF-8"));

            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);

            java.security.cert.Certificate leafCert = keyStore.getCertificate(KEY_ALIAS);
            if (leafCert == null) {
                throw new Exception("Key generation succeeded but certificate not found in Keystore for alias: " + KEY_ALIAS);
            }
            byte[] publicKeyBytes = leafCert.getPublicKey().getEncoded();
            String publicKeyB64 = Base64.encodeToString(publicKeyBytes, Base64.NO_WRAP);
            String apkHash = getApkSigningHash();

            WritableArray certChainArray = Arguments.createArray();
            Certificate[] chain = keyStore.getCertificateChain(KEY_ALIAS);
            if (chain != null) {
                for (Certificate cert : chain) {
                    certChainArray.pushString(Base64.encodeToString(cert.getEncoded(), Base64.NO_WRAP));
                }
            }

            WritableMap result = Arguments.createMap();
            result.putString("keyId", KEY_ALIAS);
            result.putString("publicKey", publicKeyB64);
            result.putString("apkHash", apkHash);
            result.putArray("certChain", certChainArray);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ATTEST_REGISTER_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Signs data with the Keystore-backed EC P-256 private key using SHA256withECDSA.
     * Returns Base64 no-wrap DER-encoded signature.
     */
    @ReactMethod
    public void sign(String data, Promise promise) {
        try {
            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);

            PrivateKey privateKey = (PrivateKey) keyStore.getKey(KEY_ALIAS, null);
            if (privateKey == null) {
                promise.reject("ATTEST_SIGN_ERROR", "Key not found — call register() first");
                return;
            }

            Signature sig = Signature.getInstance("SHA256withECDSA");
            sig.initSign(privateKey);
            sig.update(data.getBytes("UTF-8"));

            promise.resolve(Base64.encodeToString(sig.sign(), Base64.NO_WRAP));
        } catch (Exception e) {
            promise.reject("ATTEST_SIGN_ERROR", e.getMessage(), e);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Generates a fresh EC P-256 key in the Android Keystore.
     *
     * Strategy:
     *   1. On API >= 28: try StrongBox (hardware security chip).
     *      StrongBoxUnavailableException is thrown from generateKeyPair() — NOT
     *      from setIsStrongBoxBacked() — so we catch it there and fall through.
     *   2. Fall back to TEE (software-emulated on emulators, hardware on real devices).
     */
    private void generateKeyPairWithChallenge(byte[] challengeBytes) throws Exception {
        KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            keyStore.deleteEntry(KEY_ALIAS);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // Attempt 1: StrongBox (Titan M or equivalent dedicated security chip).
            // The exception is thrown at generateKeyPair(), not at spec-build time,
            // so the try/catch must wrap generateKeyPair() — not setIsStrongBoxBacked().
            try {
                KeyGenParameterSpec strongBoxSpec =
                        new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_SIGN)
                                .setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"))
                                .setDigests(KeyProperties.DIGEST_SHA256)
                                .setAttestationChallenge(challengeBytes)
                                .setIsStrongBoxBacked(true)
                                .build();
                KeyPairGenerator kpg = KeyPairGenerator.getInstance(
                        KeyProperties.KEY_ALGORITHM_EC, KEYSTORE_PROVIDER);
                kpg.initialize(strongBoxSpec);
                kpg.generateKeyPair();
                return; // StrongBox succeeded
            } catch (android.security.keystore.StrongBoxUnavailableException e) {
                android.util.Log.i("AttestationModule", "StrongBox unavailable, falling back to TEE", e);
            } catch (Exception e) {
                android.util.Log.w("AttestationModule", "StrongBox key generation failed with non-StrongBox error, falling back to TEE", e);
            }
        }

        // Attempt 2: TEE (Trusted Execution Environment).
        // Available on all modern Android devices and emulators.
        KeyGenParameterSpec teeSpec =
                new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_SIGN)
                        .setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"))
                        .setDigests(KeyProperties.DIGEST_SHA256)
                        .setAttestationChallenge(challengeBytes)
                        .build();
        KeyPairGenerator kpg = KeyPairGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_EC, KEYSTORE_PROVIDER);
        kpg.initialize(teeSpec);
        kpg.generateKeyPair();
    }

    /**
     * Returns lowercase hex SHA-256 of the APK signing certificate.
     * Handles API >= 28 (GET_SIGNING_CERTIFICATES) and older (GET_SIGNATURES).
     */
    private String getApkSigningHash() throws Exception {
        String packageName = getReactApplicationContext().getPackageName();
        PackageManager pm = getReactApplicationContext().getPackageManager();

        byte[] certBytes;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            PackageInfo info = pm.getPackageInfo(
                    packageName, PackageManager.GET_SIGNING_CERTIFICATES);
            if (info.signingInfo == null
                    || info.signingInfo.getApkContentsSigners().length == 0) {
                throw new Exception("No signing certificates found");
            }
            certBytes = info.signingInfo.getApkContentsSigners()[0].toByteArray();
        } else {
            @SuppressWarnings("deprecation")
            PackageInfo info = pm.getPackageInfo(packageName, PackageManager.GET_SIGNATURES);
            if (info.signatures == null || info.signatures.length == 0) {
                throw new Exception("No signatures found");
            }
            certBytes = info.signatures[0].toByteArray();
        }

        byte[] hashBytes = MessageDigest.getInstance("SHA-256").digest(certBytes);
        StringBuilder sb = new StringBuilder(hashBytes.length * 2);
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
