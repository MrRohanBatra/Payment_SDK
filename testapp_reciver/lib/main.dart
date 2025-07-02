// ignore_for_file: unused_import

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:payment_notifier_plugin/payment_notifier_plugin.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String? _fcmToken;
  String _lastMessage = 'No messages yet';
  final plugin = PaymentNotifierPlugin(serv: "https://paymentapi.rohan.org.in",lang: "hi");

  @override
  void initState() {
    super.initState();
    setupFCM();
  }

  Future<void> setupFCM() async {
    WidgetsFlutterBinding.ensureInitialized();
    await plugin.initFirebaseApp();

    plugin.initNotifications();

    await FirebaseMessaging.instance.requestPermission();

    // FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    //   plugin.showNotification(message);
    //   setState((){ 
    //       _lastMessage =
    //           'Title: ${message.data["title"]}\nBody: ${message.data["body"]}\n';
        
    //   });
    // });
    FirebaseMessaging.onBackgroundMessage((RemoteMessage message) async {
      plugin.showNotification(message);
      _lastMessage =
          'Title: ${message.data["title"]}\nBody: ${message.data["body"]}\n';
    });
    final token = await plugin.getFCMToken();
    setState(() {
      _fcmToken = token;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text("Receiver App")),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Your FCM Token:",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                SelectableText(_fcmToken ?? "Loading..."),
                const SizedBox(height: 30),
                const Text("Last Notification:"),
                Text(_lastMessage),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
