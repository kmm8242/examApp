package com.examapp

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONArray

object LockedAppsManager {
    // Versioned file name so a future migration doesn't read stale plain-text prefs.
    private const val PREFS = "com.examapp.applock_prefs_v2"
    private const val KEY_LOCKED = "locked_packages"
    private const val KEY_SUBJECTS = "selected_subjects"
    private const val KEY_GRACE_PREFIX = "grace_"
    private const val GRACE_MS = 30_000L

    private fun prefs(ctx: Context): SharedPreferences {
        return try {
            val masterKey = MasterKey.Builder(ctx)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                ctx,
                PREFS,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (_: Exception) {
            // Fall back to plain prefs on emulators that lack a hardware keystore.
            // Real devices always have one, so this path is emulator-only.
            ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        }
    }

    // Sets are stored as JSON strings because EncryptedSharedPreferences has limited
    // StringSet support across versions.
    fun getLockedApps(ctx: Context): Set<String> {
        val json = prefs(ctx).getString(KEY_LOCKED, null) ?: return emptySet()
        return try {
            val arr = JSONArray(json)
            (0 until arr.length()).map { arr.getString(it) }.toSet()
        } catch (_: Exception) {
            emptySet()
        }
    }

    fun setLockedApps(ctx: Context, packages: Set<String>) {
        prefs(ctx).edit()
            .putString(KEY_LOCKED, JSONArray(packages.toList()).toString())
            .apply()
    }

    fun getSelectedSubjects(ctx: Context): List<String> {
        val json = prefs(ctx).getString(KEY_SUBJECTS, null) ?: return emptyList()
        return try {
            val arr = JSONArray(json)
            (0 until arr.length()).map { arr.getString(it) }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun setSelectedSubjects(ctx: Context, subjects: List<String>) {
        prefs(ctx).edit()
            .putString(KEY_SUBJECTS, JSONArray(subjects).toString())
            .apply()
    }

    // Grace period persisted to encrypted prefs — survives process restarts and
    // prevents the bypass: unlock → force-kill service → reopen within 30 s.
    fun markUnlocked(pkg: String, ctx: Context) {
        prefs(ctx).edit()
            .putLong("$KEY_GRACE_PREFIX$pkg", System.currentTimeMillis())
            .apply()
    }

    fun isRecentlyUnlocked(pkg: String, ctx: Context): Boolean {
        val t = prefs(ctx).getLong("$KEY_GRACE_PREFIX$pkg", 0L)
        return System.currentTimeMillis() - t < GRACE_MS
    }
}
