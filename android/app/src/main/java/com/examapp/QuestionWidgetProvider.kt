package com.examapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import org.json.JSONObject

class QuestionWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        ids.forEach { updateWidget(context, manager, it) }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(ComponentName(context, QuestionWidgetProvider::class.java))
        when (intent.action) {
            ACTION_NEXT -> {
                clearState(context)
                ids.forEach { updateWidget(context, manager, it) }
            }
            ACTION_ANSWER -> {
                val optionId = intent.getStringExtra(EXTRA_OPTION_ID) ?: return
                val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                if (prefs.getString(KEY_ANSWERED, null) != null) return
                prefs.edit().putString(KEY_ANSWERED, optionId).apply()
                ids.forEach { updateWidget(context, manager, it) }
            }
        }
    }

    private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val question = loadOrPickQuestion(context, prefs)
        val answered = prefs.getString(KEY_ANSWERED, null)

        val views = RemoteViews(context.packageName, R.layout.widget_question)
        views.setTextViewText(R.id.widget_subject_tag, "${question.examType} · ${question.subject}")
        views.setTextViewText(R.id.widget_question_text, question.text)

        val optViewIds = listOf(
            R.id.widget_opt_a,
            R.id.widget_opt_b,
            R.id.widget_opt_c,
            R.id.widget_opt_d,
        )

        question.options.take(4).forEachIndexed { i, option ->
            val viewId = optViewIds[i]
            views.setTextViewText(viewId, "${option.id}  ${option.text}")

            val bgRes = when {
                answered != null && option.id == question.correctOptionId -> R.drawable.widget_opt_correct
                answered == option.id && option.id != question.correctOptionId -> R.drawable.widget_opt_wrong
                else -> R.drawable.widget_opt_default
            }
            views.setInt(viewId, "setBackgroundResource", bgRes)

            val textColor = when {
                answered != null && option.id == question.correctOptionId -> 0xFF059669.toInt()
                answered == option.id && option.id != question.correctOptionId -> 0xFFEF4444.toInt()
                else -> 0xFF374151.toInt()
            }
            views.setTextColor(viewId, textColor)

            val answerIntent = Intent(context, QuestionWidgetProvider::class.java).apply {
                action = ACTION_ANSWER
                putExtra(EXTRA_OPTION_ID, option.id)
            }
            val pi = PendingIntent.getBroadcast(
                context,
                i,
                answerIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            views.setOnClickPendingIntent(viewId, pi)
        }

        val nextPi = PendingIntent.getBroadcast(
            context,
            100,
            Intent(context, QuestionWidgetProvider::class.java).apply { action = ACTION_NEXT },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        views.setOnClickPendingIntent(R.id.widget_btn_next, nextPi)

        manager.updateAppWidget(widgetId, views)
    }

    private fun loadOrPickQuestion(context: Context, prefs: SharedPreferences): WidgetQuestion {
        val json = prefs.getString(KEY_QUESTION, null)
        return if (json != null) {
            runCatching { WidgetQuestion.fromJson(JSONObject(json)) }.getOrElse { pickNew(context, prefs) }
        } else {
            pickNew(context, prefs)
        }
    }

    private fun pickNew(context: Context, prefs: SharedPreferences): WidgetQuestion {
        val q = QuestionRepository.getRandom(context) ?: return fallback()
        prefs.edit().putString(KEY_QUESTION, q.toJson().toString()).apply()
        return q
    }

    private fun clearState(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .remove(KEY_QUESTION)
            .remove(KEY_ANSWERED)
            .apply()
    }

    private fun fallback() = WidgetQuestion(
        id = "fallback",
        examType = "Study",
        subject = "App",
        text = "Open the app once to load your question bank into the widget.",
        options = listOf(
            WidgetOption("A", "SAT"),
            WidgetOption("B", "GRE"),
            WidgetOption("C", "Academic"),
            WidgetOption("D", "All of the above"),
        ),
        correctOptionId = "D",
    )

    companion object {
        const val PREFS = "com.examapp.widget_prefs"
        const val KEY_QUESTION = "current_question"
        const val KEY_ANSWERED = "answered_option"
        const val ACTION_NEXT = "com.examapp.WIDGET_NEXT"
        const val ACTION_ANSWER = "com.examapp.WIDGET_ANSWER"
        const val EXTRA_OPTION_ID = "option_id"
    }
}
