package com.examapp

import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap

class AppLockModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AppLockModule"

    companion object {
        // Android package names: dot-separated segments of [a-zA-Z][a-zA-Z0-9_]*
        private val PACKAGE_REGEX = Regex("""^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$""")
        // Topic keys are stored as "ExamType|Subject", e.g. "SAT|Math"
        private val TOPIC_KEY_REGEX = Regex("""^[A-Za-z ]{1,40}\|[A-Za-z &]{1,40}$""")
        private const val MAX_LOCKED_APPS = 200
        private const val MAX_SUBJECTS = 50
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val launchIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
            }
            @Suppress("DEPRECATION")
            val infos = pm.queryIntentActivities(
                launchIntent,
                PackageManager.GET_META_DATA
            ).filter { it.activityInfo.packageName != reactContext.packageName }
                .sortedBy { it.loadLabel(pm).toString().lowercase() }

            val result = WritableNativeArray()
            for (info in infos) {
                val map = WritableNativeMap()
                map.putString("packageName", info.activityInfo.packageName)
                map.putString("appName", info.loadLabel(pm).toString())
                result.pushMap(map)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERR_APPS", e.message)
        }
    }

    @ReactMethod
    fun getLockedApps(promise: Promise) {
        val arr = WritableNativeArray()
        LockedAppsManager.getLockedApps(reactContext).forEach { arr.pushString(it) }
        promise.resolve(arr)
    }

    @ReactMethod
    fun setLockedApps(packages: ReadableArray, promise: Promise) {
        if (packages.size() > MAX_LOCKED_APPS) {
            promise.reject("ERR_TOO_MANY", "Cannot lock more than $MAX_LOCKED_APPS apps")
            return
        }
        val validated = (0 until packages.size())
            .mapNotNull { packages.getString(it) }
            .filter { PACKAGE_REGEX.matches(it) }
            .toSet()
        LockedAppsManager.setLockedApps(reactContext, validated)
        promise.resolve(null)
    }

    @ReactMethod
    fun getSelectedSubjects(promise: Promise) {
        val arr = WritableNativeArray()
        LockedAppsManager.getSelectedSubjects(reactContext).forEach { arr.pushString(it) }
        promise.resolve(arr)
    }

    @ReactMethod
    fun setSelectedSubjects(subjects: ReadableArray, promise: Promise) {
        if (subjects.size() > MAX_SUBJECTS) {
            promise.reject("ERR_TOO_MANY", "Cannot select more than $MAX_SUBJECTS subjects")
            return
        }
        val validated = (0 until subjects.size())
            .mapNotNull { subjects.getString(it) }
            .filter { TOPIC_KEY_REGEX.matches(it) }
        LockedAppsManager.setSelectedSubjects(reactContext, validated)
        promise.resolve(null)
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        val enabledServices = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        val ourService = "${reactContext.packageName}/.AppLockService"
        val isEnabled = enabledServices.split(":").any {
            it.trim().equals(ourService, ignoreCase = true)
        }
        promise.resolve(isEnabled)
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactContext.startActivity(intent)
        promise.resolve(null)
    }
}
