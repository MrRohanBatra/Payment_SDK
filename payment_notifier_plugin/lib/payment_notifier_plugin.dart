// ignore_for_file: unused_import, prefer_typing_uninitialized_variables, avoid_print

import 'dart:io';
import 'payment_notifier_plugin_platform_interface.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:payment_notifier_plugin/firebase_options.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'dart:convert';

class PaymentNotifierPlugin {
  String _lang = "en";

  String _server = "https://paymentapi.rohan.org.in";
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();
  PaymentNotifierPlugin({required String serv, String lang = "en"}) {
    _lang = lang;
    _server = serv;
  }

  Future<void> initFirebaseApp() async {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }

  Future<String?> getFCMToken() async {
    final messaging = FirebaseMessaging.instance;
    return await messaging.getToken();
  }

  Future<void> downloadAndPlay(String serverUrl, String relativeUrl) async {
    final audioPlayer = AudioPlayer();
    final baseUrl = serverUrl;
    final fullUrl = "$baseUrl$relativeUrl";

    try {
      // 1. Download audio file
      final response = await http.get(Uri.parse(fullUrl));
      if (response.statusCode != 200) {
        print("Failed to download audio: ${response.statusCode}");
        return;
      }

      // 2. Get temp directory
      final tempDir = await getTemporaryDirectory();
      final filePath = '${tempDir.path}/tts.mp3';

      // 3. Write file
      final file = File(filePath);
      await file.writeAsBytes(response.bodyBytes);
      print("Audio saved to: $filePath");

      // 4. Play downloaded file
      await audioPlayer.play(DeviceFileSource(filePath));
      audioPlayer.onPlayerComplete.listen((event) async {
        if (await file.exists()) {
          await file.delete();
          print("Deleted audio file: $filePath");
        }
      });
    } catch (e) {
      print("Error during download or playback: $e");
    }
  }

  void showNotification(RemoteMessage message) async {
    const androidDetails = AndroidNotificationDetails(
      'channel_id',
      'Payment Alerts',
      importance: Importance.max,
      priority: Priority.high,
      playSound: false,
      enableVibration: true,
    );
    const notifDetails = NotificationDetails(android: androidDetails);

    final title = message.data['title'] ?? "Payment Received";
    final body = message.data['body'] ?? "You got a new payment.";
    await flutterLocalNotificationsPlugin.show(0, title, body, notifDetails);
    final url = message.data['url'];
    downloadAndPlay(_server, url);
  }

  Future<void> backgroundNotification(RemoteMessage message) async {
    showNotification(message);
  }

  void initNotifications() async {
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);
    await flutterLocalNotificationsPlugin.initialize(initSettings);
  }

  //   Future<String?> sendMessage(
  //     String fromName,
  //     String fromFCM,
  //     String message,
  //     String sendLang,
  //     String? date,
  //     String toName,
  //     String toFCM,
  //     double amount,
  //   ) async {
  //     final port = 3000;
  //     final url = Uri.parse("$_server:$port/send");
  //     // final payload = {
  //     //   'fromName': fromName,
  //     //   'fromToken': fromFCM,
  //     //   'message': message,
  //     //   'send_lang':sendLang,
  //     //   'date': date ?? "null",
  //     //   'toName': toName,
  //     //   'toToken': toFCM,
  //     //   'amount': amount,
  //     // };
  //   final payload = {
  //   'fromName': fromName,
  //   'fromToken': fromFCM,
  //   'message': message,         // "money_sent", "emi_reminder", etc.
  //   'send_lang': sendLang,      // e.g., "hi" or "en"
  //   'date': date ?? "null",     // Only for EMI cases
  //   'toName': toName,
  //   'toToken': toFCM,
  //   'amount': amount,           // Can be double or int
  // };
  //     final response = await http.post(
  //       url,
  //       headers: {'Content-Type': 'application/json'},
  //       body: jsonEncode(payload),
  //     );
  //     if (response.statusCode == 200) {
  //       return null;
  //     } else {
  //       return response.body.toString();
  //     }
  //   }
  // }
  Future<String?> sendMessage(
    String fromName,
    String fromFCM,
    String message,
    String sendLang,
    String? date,
    String toName,
    String toFCM,
    double amount,
  ) async {
    final port = 3000;
    final url = Uri.parse("$_server/send");

    final payload = {
      'fromName': fromName,
      'fromToken': fromFCM,
      'message': message, // "money_sent", etc.
      'send_lang': sendLang.isNotEmpty ? sendLang : "en", // ✅ fallback to "en"
      'date': date ?? "null",
      'toName': toName,
      'toToken': toFCM,
      'amount': amount.toString(), // ✅ must be String for FCM
    };

    try {
      print("Sending data\n");
      print(payload);
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200) {
        return null; // success
      } else {
        print("Server error: ${response.body}");
        return response.body.toString(); // failure
      }
    } catch (e) {
      print("Exception during HTTP call: $e");
      return e.toString();
    }
  }
}
