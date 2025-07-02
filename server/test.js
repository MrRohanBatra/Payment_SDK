const testPayload = {
    fromName: "rohan",
    fromToken: "cHsP2cX8R-C19gYtchTEOw:APA91bHrgkiFg5mLsW92pf0jDD04wlYDy23oJVNpPKCPGlbJOwqp4hr-1vCyESeYe1MYk1gTXAZaKpzUsCUziI3r9Dn8B7NrmK97T8Cx1-q9ZiBp5Y95WQc",
    message: "emi_reminder",
    send_lang: "hi",
    date: "02-07-2025",
    toName: "Receiver",
    toToken: "esHYK1rwRyq-dYo4tLc2rp:APA91bHoGSnbFnoHbYPC6860ylVcAhM8hcbaCKePjgKG6RkeEzOe9dBR_VdHjTf-Nx7AqZNUMqi5gCZca-eW3jE6A1Zzdb34HJvVzsYa_TRsVJco46lXHe0",
    amount: 100.0
}
fetch("http://localhost:1607/send", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(testPayload)
})
    .then(async (res) => {
        const result = await res.json();
        console.log("✅ Server response:", result);
    })
    .catch((err) => {
        console.error("❌ Error sending request:", err);
    });