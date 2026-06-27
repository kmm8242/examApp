package com.examapp

import android.content.Context
import org.json.JSONObject

object QuestionRepository {
    private var cache: List<WidgetQuestion>? = null

    fun getRandom(context: Context): WidgetQuestion? =
        (cache ?: loadAll(context).also { cache = it }).randomOrNull()

    // subjects is a list of "ExamType|Subject" keys, e.g. ["SAT|Math", "GRE|Verbal"].
    // Empty list means no filter — pick from all questions.
    fun getRandomForSubjects(context: Context, subjects: List<String>): WidgetQuestion? {
        val all = cache ?: loadAll(context).also { cache = it }
        val pool = if (subjects.isEmpty()) all
                   else all.filter { "${it.examType}|${it.subject}" in subjects }
        return (if (pool.isEmpty()) all else pool).randomOrNull()
    }

    private fun loadAll(context: Context): List<WidgetQuestion> {
        val files = listOf("sat.json", "gre.json", "academic.json")
        return files.flatMap { file ->
            try {
                val text = context.assets.open("questions/$file").bufferedReader().readText()
                val arr = JSONObject(text).getJSONArray("questions")
                (0 until arr.length()).mapNotNull {
                    runCatching { WidgetQuestion.fromJson(arr.getJSONObject(it)) }.getOrNull()
                }
            } catch (_: Exception) {
                emptyList()
            }
        }
    }
}
