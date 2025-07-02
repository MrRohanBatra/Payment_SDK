const express = require("express");
const router = express.Router();
const admin = require("../firebase/admin");
const { tts } = require("../utils/tts");
const { getfiltered_language, convertDateFormat, cleanAmount } = require("../utils/helpers");
const { translate_text } = require("../utils/translate");
const ip = require("../utils/network").getLocalIP();
router.post("/send", async (req, res) => {

    const data = await JSON.parse(JSON.stringify(req.body));
    data.send_lang = getfiltered_language(data.send_lang);
    if (data.date) {
        data.date = convertDateFormat(String(data.date));
    }
    data.amount = cleanAmount(data.amount);
    console.log("Received data:", data);
    const { fromName, fromToken, message, send_lang, date, toName, toToken, amount } = data;
    let title = "Notification";
    let body = "You have a new update.";
    let recieverToken = toToken;
    switch (message) {
        case "money_sent":
            title = "Money Received";
            body = `₹${amount} received from ${fromName}.`;
            break;
        case "emi_reminder":
            title = "EMI Payment Reminder";
            body = amount ? `Your installment of ₹${amount} is scheduled for payment on ${date}.` : `Your installment is scheduled for payment on ${date}.`;
            break;
        case "emi_payment_failed":
            title = "EMI Payment Failed";
            body = amount ? `Your installment payment of ₹${amount} failed on ${date}.` : `Your installment payment failed on ${date}.`;
            break;
        case "transaction_failed":
            title = "Transaction Failed";
            recieverToken = fromToken;
            body = amount ? `Your transaction of ₹${amount} failed.` : `Your transaction failed.`;
            break;
        default:
            title = "Alert";
            body = message;
            break;
    }

    let translated_message = body;
    let file_url = "";
    try {
        const translated_message = send_lang != "en" ? await translate_text(body, "en", send_lang) : body;
        const file_url = await tts(translated_message, send_lang);
        const payload = {
            data: {
                title: title,
                body: translated_message,
                message: translated_message,
                lang: send_lang,
                url: file_url,
                date: date,
                fromName: fromName,
                amount: amount.toString(),
                server_url: `http://${ip}:3000`,
            },
            token: recieverToken,
        };
        console.dir(payload);
        const response = await admin.messaging().send(payload);
        console.log(`notification sent: ${response}`);
        res.status(200).json({ error: false, messageid: response });
    } catch (error) {
        console.error("Internal Error:", error);
        res.status(500).json({ error: true, messageid: null });
    }
});

module.exports = router;
