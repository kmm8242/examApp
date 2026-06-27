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
        val set = (0 until packages.size()).mapNotNull { packages.getString(it) }.toSet()
        LockedAppsManager.setLockedApps(reactContext, set)
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
        val list = (0 until subjects.size()).mapNotNull { subjects.getString(it) }
        LockedAppsManager.setSelectedSubjects(reactContext, list)
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
