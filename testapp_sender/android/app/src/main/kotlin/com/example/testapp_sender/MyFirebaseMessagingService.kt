package com.example.testapp_sender

import android.media.MediaPlayer
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.*
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d("FCM", "🚀 onMessageReceived triggered")

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