package com.coinswallet

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class SensitiveInfoV6MigrationTest {
  private val service = "myKeychain"
  private val key = "persist:root2"

  // react-native-sensitive-info 5.6.2 PersistedEntry.toJson() output for an unprotected item.
  private val legacy = """{"key":"persist:root2","service":"myKeychain","ciphertext":"Y2lwaGVy","iv":"aXYxMjM0NTY3ODk=","timestamp":1758000000,"securityLevel":"software","accessControl":"none","version":3,"authenticators":0,"requiresAuthentication":false,"invalidateOnEnrollment":false,"useStrongBox":false}"""

  @Test
  fun `preferences file name matches the 6x ServiceNameResolver`() {
    // sha256("myKeychain") = 0f5e7a7d... (first 8 bytes → 16 hex chars)
    val name = SensitiveInfoV6Migration.preferencesFileFor(service)
    assertEquals("sensitive_info_", name.substring(0, 15))
    assertEquals(31, name.length)
    assertEquals(sha256Hex(service).substring(0, 16), name.substring(15))
  }

  @Test
  fun `alias matches the 5_6_2 derivation`() {
    assertEquals(
      sha256Hex("$service::$key").substring(0, 32),
      SensitiveInfoV6Migration.legacyAliasFor(service, key)
    )
  }

  @Test
  fun `unprotected entry is re-shaped without touching ciphertext or iv`() {
    val v6 = SensitiveInfoV6Migration.legacyEntryToV6Json(service, key, legacy)
    assertNotNull(v6)
    v6!!
    assertEquals(SensitiveInfoV6Migration.legacyAliasFor(service, key), v6.getString("alias"))
    assertEquals("Y2lwaGVy", v6.getString("ciphertext"))
    assertEquals("aXYxMjM0NTY3ODk=", v6.getString("iv"))
    assertEquals(0, v6.getInt("authenticators"))
    assertFalse(v6.getBoolean("requiresAuth"))
    assertFalse(v6.getBoolean("invalidateOnEnrollment"))
    assertFalse(v6.getBoolean("useStrongBox"))
    assertEquals(1, v6.getInt("keyVersion"))
    assertFalse(v6.getBoolean("usesAad"))
    assertFalse(v6.has("integrityTag"))
    val metadata = v6.getJSONObject("metadata")
    assertEquals("software", metadata.getString("securityLevel"))
    assertEquals("androidKeystore", metadata.getString("backend"))
    assertEquals("none", metadata.getString("accessControl"))
    assertEquals(1758000000.0, metadata.getDouble("timestamp"), 0.0)
    assertEquals(1, metadata.getInt("keyVersion"))
    // Round-trips through org.json exactly as 6.x PersistedEntry.fromJson expects.
    assertNotNull(JSONObject(v6.toString()).optJSONObject("metadata"))
  }

  @Test
  fun `entries written before version 3 default to unprotected only when accessControl is none`() {
    val v1 = """{"key":"k","service":"s","ciphertext":"YQ==","iv":"Yg==","timestamp":1,"securityLevel":"software","accessControl":"none"}"""
    assertNotNull(SensitiveInfoV6Migration.legacyEntryToV6Json("s", "k", v1))
    val v1Biometric = """{"key":"k","service":"s","ciphertext":"YQ==","iv":"Yg==","timestamp":1,"securityLevel":"biometry","accessControl":"biometryCurrentSet"}"""
    assertNull(SensitiveInfoV6Migration.legacyEntryToV6Json("s", "k", v1Biometric))
  }

  @Test
  fun `protected, incomplete or corrupt entries are not migrated`() {
    val protected = legacy.replace("\"accessControl\":\"none\"", "\"accessControl\":\"biometryCurrentSet\"")
      .replace("\"requiresAuthentication\":false", "\"requiresAuthentication\":true")
    assertNull(SensitiveInfoV6Migration.legacyEntryToV6Json(service, key, protected))
    val noIv = legacy.replace("\"iv\":\"aXYxMjM0NTY3ODk=\",", "")
    assertNull(SensitiveInfoV6Migration.legacyEntryToV6Json(service, key, noIv))
    assertNull(SensitiveInfoV6Migration.legacyEntryToV6Json(service, key, "{not json"))
  }

  @Test
  fun `legacy preferences keys split at the first separator`() {
    assertEquals(
      "myKeychain" to "persist:root2",
      SensitiveInfoV6Migration.splitLegacyKey("myKeychain::persist:root2")
    )
    assertEquals(
      "dokwallet.vault" to "vault.dek.password",
      SensitiveInfoV6Migration.splitLegacyKey("dokwallet.vault::vault.dek.password")
    )
    assertNull(SensitiveInfoV6Migration.splitLegacyKey("no-separator"))
    assertNull(SensitiveInfoV6Migration.splitLegacyKey("::key"))
    assertNull(SensitiveInfoV6Migration.splitLegacyKey("service::"))
  }

  private fun sha256Hex(input: String): String =
    java.security.MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
      .joinToString("") { String.format("%02x", it) }
}
