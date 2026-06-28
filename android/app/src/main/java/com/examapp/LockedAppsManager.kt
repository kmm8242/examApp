package com.examapp

import android.content.Context
import org.json.JSONArray

object LockedAppsManager {
    private const val PREFS = "com.examapp.applock_prefs"
    private const val KEY_LOCKED = "locked_packages"
    private const val KEY_SUBJECTS = "selected_subjects"
    private const val KEY_GRACE_PREFIX = "grace_"
    private const val GRACE_MS = 30_000L

    fun getLockedApps(ctx: Context): Set<String> =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getStringSet(KEY_LOCKED, emptySet()) ?: emptySet()

    fun setLockedApps(ctx: Context, packages: Set<String>) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putStringSet(KEY_LOCKED, packages).apply()
    }

    fun getSelectedSubjects(ctx: Context): List<String> {
        val json = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_SUBJECTS, null) ?: return emptyList()
        return try {
            val arr = JSONArray(json)
            (0 until arr.length()).map { arr.getString(it) }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun setSelectedSubjects(ctx: Context, subjects: List<String>) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_SUBJECTS, JSONArray(subjects).toString()).apply()
    }

    // Grace period is persisted to SharedPreferences so it survives process restarts.
    // This prevents the bypass: unlock → force-kill service → reopen app within 30 s.
    fun markUnlocked(pkg: String, ctx: Context) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putLong("$KEY_GRACE_PREFIX$pkg", System.currentTimeMillis()).apply()
    }

    fun isRecentlyUnlocked(pkg: String, ctx: Context): Boolean {
        val t = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getLong("$KEY_GRACE_PREFIX$pkg", 0L)
        return System.currentTimeMillis() - t < GRACE_MS
    }
}
