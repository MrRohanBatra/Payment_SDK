package com.example.testapp_reciver

import android.media.MediaPlayer
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.*
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat

class MyFirebaseMessagingService : FirebaseMessagingService() {
    fun showCustomNotification(context: Context, title: String, body: String) {
    val channelId = "payment_channel"
    val notificationId = 1001

    val intent = Intent(context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
    }

    val pendingIntent = PendingIntent.getActivity(
        context, 0, intent,
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )

    val notificationBuilder = NotificationCompat.Builder(context, channelId)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(title)
        .setContentText(body)
        .setAutoCancel(true)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setContentIntent(pendingIntent)

    val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(
            channelId,
            "Payment Notifications",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Used for payment received alerts"
            enableLights(true)
            lightColor = Color.BLUE
        }
        notificationManager.createNotificationChannel(channel)
    }

    notificationManager.notify(notificationId, notificationBuilder.build())
}
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d("FCM", "🚀 onMessageReceived triggered")
        val title = remoteMessage.data["title"] ?: "Payment Received"
        val body = remoteMessage.data["body"] ?: "You got a new payment."
        showCustomNotification(this,title,body) 
        val baseUrl = remoteMessage.data["server_url"]
        val audioPath = remoteMessage.data["url"]

        Log.d("FCM", "server_url: $baseUrl")
        Log.d("FCM", "url: $audioPath")

        if (baseUrl.isNullOrEmpty() || audioPath.isNullOrEmpty()) {
            Log.e("FCM", "❌ Missing server_url or url in FCM payload")
            return
        }

        val audioUrl = "$baseUrl$audioPath"
        Log.d("FCM", "🎧 Final audio URL: $audioUrl")

        CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d("FCM_AUDIO", "🌐 Downloading audio from: $audioUrl")
                val connection = URL(audioUrl).openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.connect()

                if (connection.responseCode != 200) {
                    Log.e("FCM_AUDIO", "❌ Failed to fetch audio: ${connection.responseCode}")
                    return@launch
                }

                val tempFile = File(cacheDir, "audio_${System.currentTimeMillis()}.mp3")
                Log.d("FCM_AUDIO", "📁 Saving to: ${tempFile.absolutePath}")

                connection.inputStream.use { input ->
                    tempFile.outputStream().use { output -> input.copyTo(output) }
                }

                Log.d("FCM_AUDIO", "✅ Audio file downloaded")

                val mediaPlayer = MediaPlayer().apply {
                    setDataSource(tempFile.absolutePath)
                    prepare()
                    start()
                }

                Log.d("FCM_AUDIO", "▶️ Audio playback started")

                mediaPlayer.setOnCompletionListener {
                    Log.d("FCM_AUDIO", "⏹️ Playback completed, deleting file")
                    tempFile.delete()
                    it.release()
                }

            } catch (e: Exception) {
                Log.e("FCM_AUDIO", "❌ Playback failed: ${e.message}", e)
            }
        }
    }
}