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
  console.log("Response from ULCA:", data);
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
    console.dir(compute_data);
    return compute_data.pipelineResponse[0].output[0].target;
  }
}


module.exports = { translate_text };