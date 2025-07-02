const admin = require('firebase-admin');
const express = require('express');
const app = express();
const fs = require('fs');
const os = require('os');

function convertDateFormat(dateStr) {
    const [day, month, year] = dateStr.split("-");
    return `${month}-${day}-${year}`;
}

async function audio(content, lang) {
  const pipelineId = "64392f96daac500b55c543cd";
  const headers = {
    "Content-Type": "application/json",
    "userID": "067f343bd1c149f4934f48f8bf80c0f5",
    "ulcaApiKey": "17a4f97bce-0458-4e8b-ada9-9b7d98684b9b"
  };

  const payload = {
    pipelineTasks: [
      {
        taskType: "tts"
      }
    ],
    pipelineRequestConfig: {
      pipelineId: pipelineId
    }
  };
  const res = await fetch(
    "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline",
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) throw new Error(`Initial request failed: ${res.status}`);

  const data = await res.json();

  const inferenceUrl = data.pipelineInferenceAPIEndPoint.callbackUrl;
  const apiKeyHeader = data.pipelineInferenceAPIEndPoint.inferenceApiKey.name;
  const apiKeyValue = data.pipelineInferenceAPIEndPoint.inferenceApiKey.value;
  const serviceId = data.pipelineResponseConfig[0].config[0].serviceId
  const response = await fetch(inferenceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [apiKeyHeader]: apiKeyValue
    },
    body: JSON.stringify({
      "pipelineTasks": [
        {
          "taskType": "tts",
          "config": {
            "language": {
              "sourceLanguage": lang
            },
            "serviceId": serviceId,
            "gender": "female"
          }
        }
      ],
      "inputData": {
        "input": [
          {
            "source": content
          }
        ],
        "audio": [
          {
            "audioContent": null
          }
        ]
      }
    })

  });

  const result = await response.json();
  // console.log(result)
  const audioContent = result.pipelineResponse[0].audio[0].audioContent;
  const audioEncoding = result.pipelineResponse[0].config.encoding;
  const audioFormat = result.pipelineResponse[0].config.audioFformat || "wav";
  const audiobuffer = Buffer.from(audioContent, audioEncoding);
  const fs = require('fs');
  const { v4: uuidv4 } = require('uuid');
  const filePath = `audio/audio_${uuidv4()}.${audioFormat}`;
  fs.writeFileSync(filePath, audiobuffer);
  return `/${filePath}`;
  // console.log("✅ Request completed successfully");
  // console.log()
}

async function translate_text(content, source_language, target_language) {
  if (source_language === target_language) {
    return {
      source_text: content,
      source_language: source_language,
      translated_text: content,
      target_language: target_language,
    };
  }
  payload = {
    "pipelineTasks": [
      {
        "taskType": "translation",
        "config": {
          "language": {
            "sourceLanguage": source_language,
            "targetLanguage": target_language
          }
        }
      }
    ],
    "pipelineRequestConfig": {
      "pipelineId": "64392f96daac500b55c543cd"
    }
  }

  headers = {
    "Content-Type": "application/json",
    "userID": "067f343bd1c149f4934f48f8bf80c0f5",
    "ulcaApiKey": "17a4f97bce-0458-4e8b-ada9-9b7d98684b9b",
  }

  const resp = await fetch("https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline",
    {
      headers: headers,
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const data = await resp.json();
  // console.log("Response from ULCA:", data);
  const service_id = data.pipelineResponseConfig[0].config[0].serviceId;
  const compute_url = [data.pipelineInferenceAPIEndPoint.callbackUrl];

  const compute_payload = {
    "pipelineTasks": [
      {
        "taskType": "translation",
        "config": {
          "language": {
            "sourceLanguage": source_language,
            "targetLanguage": target_language
          },
          "serviceId": service_id
        }
      }
    ],
    "inputData": {
      "input": [
        {
          "source": content
        }
      ],
      "audio": [
        {
          "audioContent": null
        }
      ]
    }
  }
  const headers2 = {
    "Content-Type": "application/json",
    [data.pipelineInferenceAPIEndPoint.inferenceApiKey.name]: data.pipelineInferenceAPIEndPoint.inferenceApiKey.value
  }
  const compute_resp = await fetch(compute_url,
    {
      headers: headers2,
      method: "POST",
      body: JSON.stringify(compute_payload),
    }
  );
  // console.log("Response from compute:", compute_resp.status);
  if (compute_resp.status === 200) {
    const compute_data = await compute_resp.json();
    // console.log("Compute data:", compute_data);
    return compute_data.pipelineResponse[0].output[0].target;
  }
}


function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}
function getfiltered_language(lang) {
  const languageSet = new Set([
    "hi", "gom", "kn", "doi", "brx", "ur", "ta", "ks",
    "as", "bn", "mr", "sd", "mai", "pa", "ml", "mni",
    "te", "sa", "ne", "sat", "gu", "or"
  ]);

  return languageSet.has(lang) ? lang : "en";
}
const ip = getLocalIP();

const ServiceAccount = require('./firebase-admin.json');
const { exec, ChildProcess } = require("child_process");
const path = require("path");
async function generateAudio(text, lang) {
  return runPythonScript("generate_audio.py", [text, lang]);
}

app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(ServiceAccount),
});

app.post("/send", async (req, res) => {
  const data = await JSON.parse(JSON.stringify(req.body));
  data.send_lang = getfiltered_language(data.send_lang);
  if(data.date){
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
    const translated_message = await translate_text(body, "en", send_lang);
    const file_url = await audio(translated_message, send_lang);

    const payload = {
      notification: {
        title: title,
        body: translated_message,
      },
      data: {
        message: translated_message,
        lang: send_lang,
        url: file_url,
        date: date,
        fromName: fromName,
        amount: amount.toString(),
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
function cleanAmount(amount) {
    return amount % 1 === 0 ? parseInt(amount) : parseFloat(amount);
}
app.get("/", async (req, res) => {
  console.log(req);
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/audio/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, 'audio', fileName);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`'Audio file not found': /${fileName}`);
      return res.status(404).send('Audio file not found');
    }


    res.setHeader('Content-Type', 'audio/mpeg');


    console.log(`Sending file : /${fileName}`);
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  })
});

const port = 3000;
app.listen(port, () => {
  exec("source ./venv/bin/activate && python3 translate.py");
  console.log(`Server running at http://${ip}:${port}`);
});
