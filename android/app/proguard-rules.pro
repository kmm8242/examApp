# ──────────────────────────────────────────────────────────────────────────────
# ExamApp ProGuard / R8 rules
# ──────────────────────────────────────────────────────────────────────────────

# React Native calls bridge methods by name at runtime via reflection.
# Without these rules R8 renames/removes the methods and the bridge crashes.
-keep class com.examapp.AppLockModule { *; }
-keep class com.examapp.AppLockPackage { *; }
-keep class com.examapp.LockedAppsManager { *; }

-keepclassmembers class ** {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# React Native framework — the RN Gradle Plugin adds most rules automatically,
# but these are extra guards for Hermes + the bridge layer.
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep interface com.facebook.react.** { *; }

# System-called components (declared in AndroidManifest) are kept automatically
# by Android's build tools, but listing them here documents the intent.
-keep class com.examapp.AppLockService { *; }
-keep class com.examapp.AppLockActivity { *; }
-keep class com.examapp.QuestionWidgetProvider { *; }
-keep class com.examapp.QuestionRepository { *; }

# AndroidX Security (EncryptedSharedPreferences + Tink)
-keep class androidx.security.crypto.** { *; }
-keep class com.google.crypto.tink.** { *; }
# Tink's optional KeysDownloader references google-http-client and joda-time,
# which are not dependencies. EncryptedSharedPreferences never uses that path.
-dontwarn com.google.api.client.http.**
-dontwarn org.joda.time.Instant

# org.json is used for question parsing in QuestionRepository
-keep class org.json.** { *; }

# Kotlin metadata — needed for Kotlin reflection and coroutines
-keep class kotlin.Metadata { *; }
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod
