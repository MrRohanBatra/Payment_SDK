// ignore_for_file: unused_import, unused_field
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:payment_notifier_plugin/payment_notifier_plugin.dart';
import 'package:flutter_datetime_picker_plus/flutter_datetime_picker_plus.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MaterialApp(
      title: 'Payment Notifier Tester',
      debugShowCheckedModeBanner: false,
      home: const MyApp(), // Your main widget
      // localizationsDelegates: GlobalMaterialLocalizations.delegates,
      supportedLocales: const [
        Locale('en', ''), // Add more locales if needed
      ],
    ),
  );
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late PaymentNotifierPlugin plugin;
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _datecontroller = TextEditingController();
  final TextEditingController _ipController = TextEditingController();
  final TextEditingController _customMessageController =
      TextEditingController();
  final TextEditingController _sendLangController = TextEditingController();

  String ip = "http://10.0.2.2";
  String? _token;
  String? _result;
  String? _sendLang;
  bool _daterequired = false;
  @override
  void initState() {
    super.initState();
    plugin = PaymentNotifierPlugin(serv: ip);
    setupPlugin();

    _selectedValue = _options[0]['value']!;
  }

  Future<void> setupPlugin() async {
    await plugin.initFirebaseApp();
    final token = await plugin.getFCMToken();
    await FirebaseMessaging.instance.requestPermission();
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      plugin.showNotification(message);
    });
    setState(() {
      _token = token;
    });
  }

  String? _sendvalue;
  Future<void> testSendMessage() async {
    final result = await plugin.sendMessage(
      _nameController.text.trim(), // fromName
      _token ?? "fromToken", // fromFCM
      _sendvalue!,
      _sendLang!,
      _datecontroller.text,
      "Receiver",
      "e-XwjPRgSLexR_32IOMBoT:APA91bFLTwPR2Hd7LYZLwk05CbkCEBvjcD2maqtTGe1LVZuNU9374dxGPEziRtpeE164pv0v8zuiZshFvFeo5sIfR32Lor-KsvNuhuTUi4y_FW56WY6EIZE", // toName
      double.parse(_amountController.text.trim()), // amount
    );
    setState(() {
      _result = result ?? "Success!";
    });
  }

  bool _isCustom = false;
  final List<Map<String, String>> _options = [
    {'label': 'Money Sent', 'value': 'money_sent'},
    {'label': 'EMI Reminder', 'value': 'emi_reminder'},
    {'label': 'EMI Payment Failed', 'value': 'emi_payment_failed'},
    {'label': 'Transaction Failed', 'value': 'transaction_failed'},
    {'label': 'Custom Message', 'value': 'custom'},
  ];
  String? _selectedValue;
  void _pickDate() {
    DatePicker.showDatePicker(
      context,
      showTitleActions: true,
      minTime: DateTime(2000),
      maxTime: DateTime(2100),
      onConfirm: (date) {
        _datecontroller.text = date
            .toString()
            .split(' ')[0]
            .split('-')
            .reversed
            .join("-");
      },
      currentTime: DateTime.now(),
      locale: LocaleType.en,
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      themeMode: ThemeMode.system,
      home: Scaffold(
        appBar: AppBar(title: const Text("Payment Notifier Tester")),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              children: [
                Text("Your FCM token:\n${_token ?? "Loading..."}"),
                const SizedBox(height: 10),
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: "Sender Name",
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: "Amount (₹)",
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 20),
                Align(
                  alignment: Alignment.centerLeft,
                  child: AnimatedContainer(
                    duration: Duration(milliseconds: 500),

                    child: DropdownButton(
                      value: _selectedValue,
                      items:
                          _options.map((option) {
                            return DropdownMenuItem<String>(
                              value: option['value'],
                              child: Text(option['label']!),
                            );
                          }).toList(),
                      onChanged: (String? newValue) {
                        setState(() {
                          _selectedValue = newValue!;
                          _sendvalue = _selectedValue;
                          if (_selectedValue == _options[1]['value'] ||
                              _selectedValue == _options[2]['value']) {
                            _daterequired = true;
                            _isCustom = false;
                          } else if (_selectedValue == _options[4]['value']) {
                            _daterequired = false;
                            _isCustom = true;
                          } else {
                            _daterequired = false;
                            _isCustom = false;
                          }
                        });
                      },
                    ),
                  ),
                ),
                if (_daterequired)
                  TextField(
                    controller: _datecontroller,
                    readOnly: true,
                    decoration: const InputDecoration(
                      labelText: 'Select Date',
                      border: OutlineInputBorder(),
                    ),
                    onTap: _pickDate,
                  ),
                const SizedBox(height: 20),
                if (_isCustom)
                  TextField(
                    controller: _customMessageController,
                    decoration: const InputDecoration(
                      labelText: "Enter you message",
                      border: OutlineInputBorder(),
                    ),
                    onChanged: ((String? value) {
                      setState(() {
                        _sendvalue = value;
                      });
                    }),
                  ),

                const SizedBox(height: 20),
                TextField(
                  controller: _sendLangController,
                  decoration: const InputDecoration(
                    labelText: "Enter language",
                    border: OutlineInputBorder(),
                  ),
                  onChanged: ((String? value) {
                    setState(() {
                      _sendLang = value;
                    });
                  }),
                ),

                ElevatedButton(
                  onPressed: testSendMessage,
                  child: const Text("Send Test Notification"),
                ),
                const SizedBox(height: 10),
                Text("Result: $_result"),
                const SizedBox(height: 10),
                TextField(
                  controller: _ipController,
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: 'Server IP Address',
                    hintText: 'e.g. 192.168.1.100:5000',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.cloud),
                  ),
                  onChanged: (String? value) {
                    if (value != null) {
                      value = value.trim();
                      setState(() {
                        ip = "http://$value";
                        plugin = PaymentNotifierPlugin(serv: ip, lang: "en");
                      });
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
