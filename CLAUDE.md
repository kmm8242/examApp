# ExamApp — Codebase Guide for Claude

> Keep this file updated after every significant change so future sessions start with full context.

---

## Project Overview

React Native **0.86.0** exam-study app (Android + iOS). Users study SAT / GRE / Academic questions in-app, via a home-screen widget (Android), and now via an App Lock gate that forces a correct answer before any locked app can be used.

**Core philosophy:** gamify screen time — make using locked apps contingent on answering a study question correctly.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.86.0 |
| Language | TypeScript (RN) + Kotlin (Android native) |
| Navigation | `@react-navigation/native-stack` v7 |
| State | React Context + `useReducer` (no Redux/Zustand) |
| Android native | Kotlin, AccessibilityService, AppWidgetProvider |
| iOS native | Bare RN (no iOS-specific features yet) |

---

## Directory Structure

```
examApp/
├── App.tsx                          # Root: NavigationContainer + providers
├── index.js                         # RN entry point
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Dashboard — exam cards + Settings section
│   │   ├── ExamListScreen.tsx       # Subject list within an exam type
│   │   ├── QuizScreen.tsx           # Question answering (MCQ)
│   │   └── AppLockScreen.tsx        # App Lock settings UI
│   ├── native/
│   │   └── AppLockModule.ts         # TS wrapper for Android AppLockModule bridge
│   ├── store/
│   │   └── ProgressContext.tsx      # Global progress state (answered / correct counts)
│   ├── navigation/
│   │   └── types.ts                 # RootStackParamList + screen prop types
│   ├── data/
│   │   ├── questionLoader.ts        # Filter/query helpers over question JSON
│   │   └── questions/
│   │       ├── sat.json             # SAT questions
│   │       ├── gre.json             # GRE questions
│   │       └── academic.json        # Academic questions
│   └── types/
│       └── question.ts              # Question, ExamType, QuestionAttempt types
└── android/app/src/main/
    ├── AndroidManifest.xml
    ├── java/com/examapp/
    │   ├── MainActivity.kt
    │   ├── MainApplication.kt       # Registers AppLockPackage
    │   ├── QuestionWidgetProvider.kt # Home-screen widget (AppWidgetProvider)
    │   ├── WidgetQuestion.kt         # Data class + JSON serialization
    │   ├── QuestionRepository.kt     # Loads questions from assets; getRandom / getRandomForSubjects
    │   ├── LockedAppsManager.kt      # SharedPrefs store for locked packages + topics + grace period
    │   ├── AppLockService.kt         # AccessibilityService — detects foreground app changes
    │   ├── AppLockActivity.kt        # Full-screen native question overlay (no RN dependency)
    │   ├── AppLockModule.kt          # RN NativeModule bridge
    │   └── AppLockPackage.kt         # ReactPackage that registers AppLockModule
    └── res/
        ├── layout/
        │   ├── widget_question.xml   # Home-screen widget layout
        │   └── activity_app_lock.xml # App Lock overlay layout
        ├── drawable/
        │   ├── widget_bg / widget_opt_*.xml     # Widget drawables
        │   └── lock_card_bg / lock_opt_*.xml / tag_indigo_bg.xml  # App Lock drawables
        ├── xml/
        │   ├── widget_info.xml               # Widget metadata
        │   └── accessibility_service_config.xml # AccessibilityService config
        └── values/
            └── strings.xml           # app_name, widget_description, accessibility_service_desc
```

---

## Navigation

```
RootStack (native-stack)
├── Home          → HomeScreen       (headerShown: false)
├── ExamList      → ExamListScreen   (params: { examType: ExamType })
├── Quiz          → QuizScreen       (params: { examType?, subject? })
└── AppLock       → AppLockScreen    (title: "App Lock")
```

`types.ts` exports `RootStackParamList` plus typed props for each screen.

---

## Question Data

**Format** (`sat.json`, `gre.json`, `academic.json`):
```json
{
  "examType": "SAT",
  "questions": [{
    "id": "sat_001",
    "examType": "SAT",
    "subject": "Math",
    "topic": "Algebra",
    "difficulty": "easy",
    "format": "multiple-choice",
    "text": "...",
    "options": [{"id": "A", "text": "..."}, ...],
    "correctOptionId": "B",
    "explanation": "..."
  }]
}
```

**Known subjects:**
- SAT: `Math`, `Reading & Writing`
- GRE: `Verbal`, `Quantitative`
- Academic: `Biology`, `Chemistry`, `Physics`, `History`, `Math`

These JSON files are **also copied to Android assets** at build time (Gradle task `copyQuestionsToAssets` in `android/app/build.gradle`) so the native widget and App Lock overlay can read them without the JS bundle.

---

## State Management

`src/store/ProgressContext.tsx` — single context wrapping the whole app.

```ts
interface UserProgress {
  byQuestion: Record<string, QuestionProgress>;
  totalAnswered: number;
  totalCorrect: number;
}
```

Hook: `useProgress()` → `{ progress, recordAttempt, getQuestionProgress }`

---

## Android Widget

Fully native, no React Native involvement at runtime.

| File | Role |
|---|---|
| `QuestionWidgetProvider.kt` | AppWidgetProvider; handles `WIDGET_NEXT` / `WIDGET_ANSWER` broadcasts |
| `WidgetQuestion.kt` | Data class with `toJson()` / `fromJson()` |
| `QuestionRepository.kt` | Loads all question JSON from assets; `getRandom(ctx)`, `getRandomForSubjects(ctx, subjects)` |
| `widget_question.xml` | 4×3 widget layout (subject tag, question text, 4 option buttons) |
| `widget_info.xml` | Min size 250×180dp, 1-hour update period |

Widget state stored in `SharedPreferences("com.examapp.widget_prefs")`.

---

## App Lock (Android)

### How it works
1. User opens **App Lock** (Settings section on HomeScreen)
2. Selects **topics** (chips grouped by exam type) and **apps** to lock (Switch per app)
3. Enables the **Accessibility Service** via the banner → system settings
4. `AppLockService` fires on every `TYPE_WINDOW_STATE_CHANGED` event
5. If the foreground package is in the locked list (and not in grace period), `AppLockActivity` is launched with `FLAG_ACTIVITY_NEW_TASK`
6. User must answer correctly → `finish()` brings locked app back to foreground
7. Wrong answer → reveals correct option, loads new question after 2 s; after 2 wrong answers a "Get a different question" link appears
8. **30-second grace period** — re-entering the same app within 30 s skips re-locking

### Key classes

| Class | Role |
|---|---|
| `AppLockService` | AccessibilityService; reads locked list, launches overlay |
| `AppLockActivity` | Native Activity (extends AppCompatActivity); shows question UI, blocks back button |
| `LockedAppsManager` | SharedPrefs singleton — locked packages (`Set<String>`), selected subjects (`JSON array`), in-memory grace-period map |
| `QuestionRepository.getRandomForSubjects(ctx, subjects)` | Filters by `"ExamType\|Subject"` keys; falls back to all questions if pool is empty |
| `AppLockModule` | RN NativeModule — `getInstalledApps`, `getLockedApps`, `setLockedApps`, `getSelectedSubjects`, `setSelectedSubjects`, `isAccessibilityServiceEnabled`, `openAccessibilitySettings` |
| `AppLockPackage` | ReactPackage registered in `MainApplication` |

### Topic key format
Topics are stored as `"ExamType|Subject"` (e.g., `"SAT|Math"`, `"Academic|Math"`). This keeps SAT Math and Academic Math distinct in both storage and filtering.

### SharedPreferences keys (`com.examapp.applock_prefs`)
- `locked_packages` — `Set<String>` of package names
- `selected_subjects` — JSON array string of `"ExamType|Subject"` keys
- `grace_<pkg>` — `Long` timestamp of when an app was last unlocked (grace period persisted across process restarts)

### Permissions (AndroidManifest.xml)
```xml
<!-- <queries> grants visibility into launcher apps — sufficient for getInstalledApps.
     QUERY_ALL_PACKAGES was intentionally removed (over-broad). -->
<queries>
  <intent>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent>
</queries>
```

### Native JS Bridge (`src/native/AppLockModule.ts`)
Wraps `NativeModules.AppLockModule` with typed functions. Falls back to a no-op stub on iOS so the screen renders safely on both platforms.

---

## HomeScreen Layout

- **Hero header** — dark indigo (`#1E1B4B`) with "EXAM PREP" eyebrow + white title
- **Stats bar** — shown only after first attempt; Accuracy value highlighted in indigo
- **Exam cards** — emoji icon box + question count on the right (number + "questions" label)
- **Settings section** — `SETTINGS` label + card containing App Lock row (🔒 icon, purple bg)

---

## AppLock Screen Layout

- **Service card** — dark indigo when disabled (dramatic CTA + "Enable →" button); soft green when active
- **Topics card** — white card; exam-type colored badge labels; chips show ✓ + color when selected
- **Apps section** — search bar with 🔍 prefix; rows grouped in a rounded card; each row has a **colored letter avatar** (deterministic color from app name), app name + package, "LOCKED" badge, Switch toggle
- **Empty state** — 📱 emoji + message

---

## Build & Run

```bash
# Start Metro
npm start

# Run on Android (builds + installs + launches)
npm run android

# Build APK only
cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Install APK manually via adb
export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

> **Important:** Any change to Kotlin files, `AndroidManifest.xml`, or new native modules requires a full `assembleDebug` rebuild + reinstall. Metro hot-reload only covers JS/TS changes.

---

## iOS Status

- Quiz flow works on iOS (pure RN)
- Widget: **not implemented** (requires WidgetKit Swift extension)
- App Lock: **not implemented** (requires Apple Family Controls entitlement + Screen Time API; sandboxing makes it much harder than Android)

---

## Security Model

### What was fixed (code-level)
| Risk | Fix |
|---|---|
| Screen recording leaks answers | `FLAG_SECURE` added to `AppLockActivity` window |
| Intent injection via `EXTRA_PACKAGE` | `AppLockActivity` validates package via `getLaunchIntentForPackage` before accepting |
| No input validation on bridge | `AppLockModule` enforces `PACKAGE_REGEX`, `TOPIC_KEY_REGEX`, and size caps (200 apps / 50 subjects) |
| Grace period lost on process death | `LockedAppsManager.markUnlocked` persists to SharedPreferences (`grace_<pkg>` key) |
| System dialogs / keyboards trigger lock | `AppLockService` skips `SYSTEM_SKIP` packages and Dialog/PopupWindow class names |
| Multi-window / split-screen peek | `AppLockActivity.onWindowFocusChanged` loads a fresh question when focus returns |
| `QUERY_ALL_PACKAGES` over-broad | Removed; `<queries>` intent filter is sufficient |

### Known remaining risks (inherent / require major arch change)
| Risk | Status |
|---|---|
| Correct answers visible in APK assets | By design for offline app; fix requires a backend server that validates answers and never sends `correctOptionId` to the client |
| Release build uses debug keystore | **MUST FIX before publishing** — see warning comment in `android/app/build.gradle` and https://reactnative.dev/docs/signed-apk-android |
| SharedPreferences not encrypted | Plain `MODE_PRIVATE`; on rooted devices the lock list can be read/cleared. Fix: migrate to `EncryptedSharedPreferences` (requires `androidx.security:security-crypto` dep) |
| ADB bypass | `adb shell am start -n <pkg>` bypasses the service; inherent to Android sideloading |
| Safe-mode bypass | Android safe mode disables third-party accessibility services; inherent |
| App Lock settings unprotected by PIN | Anyone with phone access can remove locks; fix requires a PIN screen before `AppLockScreen` |

---

## Conventions

- **No Redux** — use React Context for global state
- **No comment blocks** — code is self-documenting; add a comment only when the *why* is non-obvious
- **Native code is Android-only** — always provide an iOS stub in TS wrappers (see `AppLockModule.ts`)
- **Topic keys** always use `"ExamType|Subject"` format — never store bare subject strings
- Colors: indigo `#4F46E5` / dark indigo `#1E1B4B` / light indigo `#EEF2FF` are the primary brand palette
