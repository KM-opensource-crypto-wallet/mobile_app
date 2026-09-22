package com.coinswallet

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONObject
import java.security.MessageDigest
import java.util.Locale

/**
 * One-time re-shape of the react-native-sensitive-info 5.6.2 Android store into the 6.x layout.
 *
 * 5.6.2 kept every entry in one SharedPreferences file (`sensitive_info`) under the key
 * `"<service>::<key>"`; 6.x keeps one file per service (`sensitive_info_<sha256(service)[0:8]>`)
 * keyed by `<key>`, with a different JSON envelope. The ciphertext, IV, cipher (AES/GCM, no AAD)
 * and the AndroidKeyStore key are identical, so rewriting the envelope — without decrypting
 * anything — is enough for 6.x to read the old entries with the existing Keystore key
 * (its alias is recomputed exactly as 5.6.2 derived it).
 *
 * Runs from [MainApplication.onCreate] before React starts, so no JS code ever sees the old
 * layout. Idempotent: a marker file records completion and a target key that already exists is
 * never overwritten. Only unprotected entries (`accessControl == "none"`) are migrated; a
 * biometric-bound entry is left behind and re-enrolled by the app after the next password
 * unlock. The source file is retained for now (removal pending Sentry confirmation, like the
 * other legacy readers); once 6.x deletes an item its Keystore alias goes with it, so the
 * retained ciphertext is not recoverable data.
 */
object SensitiveInfoV6Migration {
  private const val TAG = "SensitiveInfoV6Migration"
  const val LEGACY_PREFS = "sensitive_info"
  const val MARKER_PREFS = "rnsi_v6_migration"
  private const val MARKER_DONE = "done"
  private const val MARKER_COUNT = "count"
  private const val MARKER_AT = "at"
  private const val SEPARATOR = "::"

  /** Mirrors 6.x `ServiceNameResolver.preferencesFileFor`. */
  fun preferencesFileFor(service: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(service.toByteArray())
    val suffix = digest.take(8).joinToString("") { String.format(Locale.US, "%02x", it) }
    return "sensitive_info_$suffix"
  }

  /** Mirrors 5.6.2 `SecureStorage.generateKeyAlias`: sha256("service::key") hex, first 32 chars. */
  fun legacyAliasFor(service: String, key: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest("$service$SEPARATOR$key".toByteArray())
    return digest.joinToString("") { String.format(Locale.US, "%02x", it) }.take(32)
  }

  /**
   * Converts one 5.6.2 entry to the 6.x envelope, or returns null when the entry must not be
   * migrated (unparseable, missing ciphertext/IV, or protected by user authentication).
   */
  fun legacyEntryToV6Json(service: String, key: String, legacyJson: String): JSONObject? {
    val legacy = try {
      JSONObject(legacyJson)
    } catch (_: Throwable) {
      return null
    }
    val ciphertext = legacy.optString("ciphertext", "")
    val iv = legacy.optString("iv", "")
    if (ciphertext.isEmpty() || iv.isEmpty()) return null

    val accessControl = legacy.optString("accessControl", "")
    val requiresAuth = legacy.optBoolean("requiresAuthentication", accessControl != "none")
    if (accessControl != "none" || requiresAuth) return null

    val metadata = JSONObject()
      .put("securityLevel", legacy.optString("securityLevel", "software").ifEmpty { "software" })
      .put("backend", "androidKeystore")
      .put("accessControl", "none")
      .put("timestamp", legacy.optDouble("timestamp", 0.0))
      .put("keyVersion", 1)

    return JSONObject()
      .put("alias", legacyAliasFor(service, key))
      .put("authenticators", 0)
      .put("requiresAuth", false)
      .put("invalidateOnEnrollment", false)
      .put("useStrongBox", legacy.optBoolean("useStrongBox", false))
      .put("keyVersion", 1)
      .put("usesAad", false)
      .put("ciphertext", ciphertext)
      .put("iv", iv)
      .put("metadata", metadata)
  }

  /** Splits a 5.6.2 preferences key `"<service>::<key>"`; null when it is not one. */
  fun splitLegacyKey(storageKey: String): Pair<String, String>? {
    val index = storageKey.indexOf(SEPARATOR)
    if (index <= 0 || index + SEPARATOR.length >= storageKey.length) return null
    return storageKey.substring(0, index) to storageKey.substring(index + SEPARATOR.length)
  }

  /** Never throws: a failure here must not stop the app from starting. */
  fun runIfNeeded(context: Context) {
    try {
      run(context.applicationContext)
    } catch (error: Throwable) {
      Log.e(TAG, "migration failed", error)
    }
  }

  private fun run(context: Context) {
    val marker = context.getSharedPreferences(MARKER_PREFS, Context.MODE_PRIVATE)
    if (marker.getBoolean(MARKER_DONE, false)) return

    val source = context.getSharedPreferences(LEGACY_PREFS, Context.MODE_PRIVATE)
    val entries = source.all
    var migrated = 0
    var skipped = 0
    if (entries.isNotEmpty()) {
      val targets = HashMap<String, SharedPreferences.Editor>()
      for ((storageKey, value) in entries) {
        val raw = value as? String ?: continue
        val (service, key) = splitLegacyKey(storageKey) ?: continue
        val target = context.getSharedPreferences(preferencesFileFor(service), Context.MODE_PRIVATE)
        if (target.contains(key)) {
          skipped += 1
          continue
        }
        val converted = legacyEntryToV6Json(service, key, raw)
        if (converted == null) {
          skipped += 1
          continue
        }
        targets.getOrPut(preferencesFileFor(service)) { target.edit() }.putString(key, converted.toString())
        migrated += 1
      }
      for (editor in targets.values) {
        if (!editor.commit()) {
          throw IllegalStateException("SharedPreferences commit failed")
        }
      }
    }

    marker.edit()
      .putBoolean(MARKER_DONE, true)
      .putInt(MARKER_COUNT, migrated)
      .putLong(MARKER_AT, System.currentTimeMillis())
      .commit()
    Log.i(TAG, "migrated=$migrated skipped=$skipped")
  }
}
