package com.examapp

import android.content.Context
import org.json.JSONArray

object LockedAppsManager {
    private const val PREFS = "com.examapp.applock_prefs"
    private const val KEY_LOCKED = "locked_packages"
    private const val KEY_SUBJECTS = "selected_subjects"

    private val recentlyUnlocked = mutableMapOf<String, Long>()
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

    // In-memory grace period so re-entering the same app within 30s doesn't re-lock
    fun markUnlocked(pkg: String) {
        recentlyUnlocked[pkg] = System.currentTimeMillis()
    }

    fun isRecentlyUnlocked(pkg: String): Boolean {
        val t = recentlyUnlocked[pkg] ?: return false
        return System.currentTimeMillis() - t < GRACE_MS
    }
}
