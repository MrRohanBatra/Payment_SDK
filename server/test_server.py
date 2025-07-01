from flask import Flask, request, jsonify, send_file
import os
from gtts import gTTS
from googletrans import Translator
from flask_cors import CORS
import uuid

app = Flask(__name__)
CORS(app)
translator = Translator()

@app.route("/translate", methods=['POST'])
async def translate():
    data = request.get_json()
    text = data.get("text", "")
    lang = data.get("lang", "en") or "en"

    if not text:
        return jsonify({"error": "Missing 'text'"}), 400

    try:
        translated = await translator.translate(text=text, dest=lang)
        return jsonify({"text": translated.text}), 200
    except Exception as e:
        print("Translation error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/audio", methods=["POST"])
async def audio():
    data = request.get_json()
    text = data.get("text", "")
    lang = data.get("lang", "en") or "en"

    if not text:
        return jsonify({"error": "Missing 'text'"}), 400

    try:
        filename = f"audio/audio_{uuid.uuid4().hex}.mp3"
        gTTS(text=text, lang=lang).save(filename)
        return jsonify({
            "text": text,
            "lang": lang,
            "file": f"/{filename}"
        }), 200
    except Exception as e:
        print("Audio generation error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/audio/<filename>", methods=["GET"])
def give(filename):
    try:
        return send_file(
            f"./audio/{filename}",
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='tts_audio.mp3'
        )
    except Exception as e:
        print("File send error:", e)
        return jsonify({"error": "File not found"}), 404

if __name__ == '__main__':
    if not os.path.exists('audio'):
        os.makedirs('audio')
    app.run(port=1607, debug=True, host='0.0.0.0')
