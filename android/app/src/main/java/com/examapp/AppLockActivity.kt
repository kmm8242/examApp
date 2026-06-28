package com.examapp

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class AppLockActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_PACKAGE = "target_package"
    }

    private var targetPackage = ""
    private var wrongCount = 0
    private var isUnlocked = false
    private val handler = Handler(Looper.getMainLooper())

    private lateinit var ivAppIcon: ImageView
    private lateinit var tvAppName: TextView
    private lateinit var tvExamTag: TextView
    private lateinit var tvSubjectTag: TextView
    private lateinit var tvQuestion: TextView
    private lateinit var optionsContainer: LinearLayout
    private lateinit var tvWrongMsg: TextView
    private lateinit var tvSkip: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // FLAG_SECURE: blocks screenshots, screen recording, and the Recent Tasks thumbnail
        // so correct answers cannot be captured or previewed outside this activity.
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)

        @Suppress("DEPRECATION")
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        }

        setContentView(R.layout.activity_app_lock)

        ivAppIcon = findViewById(R.id.iv_app_icon)
        tvAppName = findViewById(R.id.tv_app_name)
        tvExamTag = findViewById(R.id.tv_exam_tag)
        tvSubjectTag = findViewById(R.id.tv_subject_tag)
        tvQuestion = findViewById(R.id.tv_question)
        optionsContainer = findViewById(R.id.options_container)
        tvWrongMsg = findViewById(R.id.tv_wrong_msg)
        tvSkip = findViewById(R.id.tv_skip)

        // Validate the package: only accept packages that have a real launcher intent
        // to prevent intent-injection attacks from arbitrary senders.
        val requested = intent.getStringExtra(EXTRA_PACKAGE) ?: ""
        targetPackage = requested.takeIf { pkg ->
            pkg.isNotEmpty() && packageManager.getLaunchIntentForPackage(pkg) != null
        } ?: ""

        if (targetPackage.isEmpty()) {
            finish()
            return
        }

        updateAppHeader()
        tvSkip.setOnClickListener { loadQuestion() }
        loadQuestion()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val requested = intent.getStringExtra(EXTRA_PACKAGE) ?: return
        val validated = requested.takeIf { pkg ->
            pkg.isNotEmpty() && packageManager.getLaunchIntentForPackage(pkg) != null
        } ?: return

        if (validated != targetPackage) {
            targetPackage = validated
            wrongCount = 0
            isUnlocked = false
            updateAppHeader()
            loadQuestion()
        }
    }

    // When focus returns to this activity (e.g. user dismissed a split-screen pane or
    // a system dialog), load a fresh question so the user cannot peek at the question
    // in one context and look up the answer before returning.
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus && !isUnlocked) {
            handler.removeCallbacksAndMessages(null)
            wrongCount = 0
            loadQuestion()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Back is intentionally blocked — the user must answer to proceed.
    }

    private fun updateAppHeader() {
        try {
            val appInfo = packageManager.getApplicationInfo(targetPackage, 0)
            val name = packageManager.getApplicationLabel(appInfo).toString()
            tvAppName.text = "${name.uppercase()} IS LOCKED"
            ivAppIcon.setImageDrawable(packageManager.getApplicationIcon(appInfo))
        } catch (_: Exception) {
            tvAppName.text = "APP IS LOCKED"
        }
    }

    private fun loadQuestion() {
        handler.removeCallbacksAndMessages(null)
        tvWrongMsg.visibility = View.GONE
        tvSkip.visibility = View.GONE
        optionsContainer.removeAllViews()

        val subjects = LockedAppsManager.getSelectedSubjects(applicationContext)
        val question = QuestionRepository.getRandomForSubjects(applicationContext, subjects)

        if (question == null) {
            tvExamTag.text = ""
            tvSubjectTag.text = ""
            tvQuestion.text =
                "No questions configured.\nOpen ExamApp and select topics under App Lock."
            return
        }

        tvExamTag.text = question.examType
        tvSubjectTag.text = question.subject
        tvQuestion.text = question.text

        for (option in question.options) {
            addOptionView(option, question)
        }
    }

    private fun addOptionView(option: WidgetOption, question: WidgetQuestion) {
        val tv = TextView(this).apply {
            tag = option.id
            text = "${option.id}.  ${option.text}"
            textSize = 14f
            setTextColor(0xFF374151.toInt())
            background = ContextCompat.getDrawable(this@AppLockActivity, R.drawable.lock_opt_default)
            setPadding(dpToPx(14), dpToPx(13), dpToPx(14), dpToPx(13))
            setOnClickListener { handleAnswer(option, question, this) }
        }
        val params = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = dpToPx(8) }
        optionsContainer.addView(tv, params)
    }

    private fun handleAnswer(selected: WidgetOption, question: WidgetQuestion, selectedView: View) {
        for (i in 0 until optionsContainer.childCount) {
            optionsContainer.getChildAt(i).isClickable = false
        }

        if (selected.id == question.correctOptionId) {
            selectedView.background = ContextCompat.getDrawable(this, R.drawable.lock_opt_correct)
            (selectedView as TextView).setTextColor(0xFF065F46.toInt())
            handler.postDelayed({ unlockApp() }, 600)
        } else {
            wrongCount++
            selectedView.background = ContextCompat.getDrawable(this, R.drawable.lock_opt_wrong)
            (selectedView as TextView).setTextColor(0xFF7F1D1D.toInt())

            for (i in 0 until optionsContainer.childCount) {
                val child = optionsContainer.getChildAt(i)
                if (child.tag == question.correctOptionId) {
                    child.background = ContextCompat.getDrawable(this, R.drawable.lock_opt_correct)
                    (child as TextView).setTextColor(0xFF065F46.toInt())
                    break
                }
            }

            tvWrongMsg.visibility = View.VISIBLE
            if (wrongCount >= 2) tvSkip.visibility = View.VISIBLE

            handler.postDelayed({ loadQuestion() }, 2000)
        }
    }

    private fun unlockApp() {
        isUnlocked = true
        LockedAppsManager.markUnlocked(targetPackage, applicationContext)
        finish()
    }

    private fun dpToPx(dp: Int): Int = (dp * resources.displayMetrics.density + 0.5f).toInt()
}
