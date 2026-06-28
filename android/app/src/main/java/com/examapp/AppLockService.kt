package com.examapp

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

class AppLockService : AccessibilityService() {

    // System packages that should never trigger a lock screen regardless of what the user
    // has configured. These generate window-state events but are not user-launchable apps.
    private val SYSTEM_SKIP = setOf(
        "android",
        "com.android.systemui",
        "com.android.inputmethod.latin",
        "com.google.android.inputmethod.latin",
        "com.samsung.android.honeyboard",     // Samsung keyboard
        "com.android.permissioncontroller",
        "com.google.android.permissioncontroller",
    )

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return

        if (pkg == applicationContext.packageName) return
        if (pkg in SYSTEM_SKIP) return

        // Skip events that come from dialogs or input panels (class name contains "Dialog"
        // or "PopupWindow") — these overlay the real foreground app rather than replacing it.
        val cls = event.className?.toString() ?: ""
        if (cls.contains("Dialog", ignoreCase = true) ||
            cls.contains("PopupWindow", ignoreCase = true)) return

        val ctx = applicationContext
        val locked = LockedAppsManager.getLockedApps(ctx)
        if (pkg in locked && !LockedAppsManager.isRecentlyUnlocked(pkg, ctx)) {
            val intent = Intent(ctx, AppLockActivity::class.java).apply {
                putExtra(AppLockActivity.EXTRA_PACKAGE, pkg)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            startActivity(intent)
        }
    }

    override fun onInterrupt() {}
}
