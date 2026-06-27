package com.examapp

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

class AppLockService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return

        // Ignore our own app and core Android system
        if (pkg == applicationContext.packageName) return
        if (pkg == "android") return

        val locked = LockedAppsManager.getLockedApps(applicationContext)
        if (pkg in locked && !LockedAppsManager.isRecentlyUnlocked(pkg)) {
            val intent = Intent(applicationContext, AppLockActivity::class.java).apply {
                putExtra(AppLockActivity.EXTRA_PACKAGE, pkg)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            startActivity(intent)
        }
    }

    override fun onInterrupt() {}
}
