

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
    console.log(`Audio file saved to ./${filePath}`);
    console.log("✅ Request completed successfully");
    console.log()
}


(async () => {
    try {
        await audio("Hello, how are you?", "en");
    } catch (error) {
        console.error("Error during audio generation:", error);
    }
})();