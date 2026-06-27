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
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class AppLockActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_PACKAGE = "target_package"
    }

    private var targetPackage = ""
    private var wrongCount = 0
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

        // Show over lock screen so the overlay appears even if device was sleeping
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

        targetPackage = intent.getStringExtra(EXTRA_PACKAGE) ?: ""
        updateAppHeader()
        tvSkip.setOnClickListener { loadQuestion() }
        loadQuestion()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val newPkg = intent.getStringExtra(EXTRA_PACKAGE) ?: return
        if (newPkg != targetPackage) {
            targetPackage = newPkg
            wrongCount = 0
            updateAppHeader()
            loadQuestion()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Back is blocked — user must answer to unlock
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
        // Disable all options immediately
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

            // Reveal correct answer
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
        LockedAppsManager.markUnlocked(targetPackage)
        // Finishing brings the locked app (which is behind us in the task stack) back to foreground
        finish()
    }

    private fun dpToPx(dp: Int): Int = (dp * resources.displayMetrics.density + 0.5f).toInt()
}
