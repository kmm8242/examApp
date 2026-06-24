package com.examapp

import org.json.JSONArray
import org.json.JSONObject

data class WidgetOption(val id: String, val text: String)

data class WidgetQuestion(
    val id: String,
    val examType: String,
    val subject: String,
    val text: String,
    val options: List<WidgetOption>,
    val correctOptionId: String,
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("id", id)
        put("examType", examType)
        put("subject", subject)
        put("text", text)
        put("correctOptionId", correctOptionId)
        val arr = JSONArray()
        options.forEach { opt ->
            arr.put(JSONObject().apply {
                put("id", opt.id)
                put("text", opt.text)
            })
        }
        put("options", arr)
    }

    companion object {
        fun fromJson(obj: JSONObject): WidgetQuestion {
            val arr = obj.getJSONArray("options")
            val opts = (0 until arr.length()).map {
                val o = arr.getJSONObject(it)
                WidgetOption(o.getString("id"), o.getString("text"))
            }
            return WidgetQuestion(
                id = obj.getString("id"),
                examType = obj.optString("examType", "Study"),
                subject = obj.optString("subject", "General"),
                text = obj.getString("text"),
                options = opts,
                correctOptionId = obj.getString("correctOptionId"),
            )
        }
    }
}
