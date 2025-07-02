import threading
from flask import Flask, request, send_file, jsonify
from gtts import gTTS
from googletrans import Translator
import asyncio
import uuid
import os
import time
from flask_cors import CORS
from colorama import init, Fore, Style
import datetime


init()
app = Flask(__name__)
CORS(app)
translator = Translator()

generated_files = set()

# Background cleanup thread
def cleanup_old_files():
    temp=os.listdir(f"{os.curdir}/audio")
    for i in temp:
        generated_files.add(f"audio/{i}")
    while True:
        now = time.time()
        for filename in list(generated_files):
            try:
                filepath=filename
                os.remove(filepath)
                    # print(f"\naudio file deleted: {filename}\n")
                print(f"\n{Fore.BLUE}{datetime.datetime.now()} {Fore.RED}audio file deleted: {filename}{Style.RESET_ALL}\n")
                generated_files.remove(filename)
            except Exception:
                pass
        time.sleep(30)

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
cleanup_thread.start()

@app.route('/tts_audio', methods=['POST'])
async def tts():
    data =  request.get_json()
    text = data.get('text')
    lang = data.get('language', 'en')

    if not text:
        return jsonify({"error": "Missing 'text' field"}), 400

    try:
        if lang != 'en':
            translated = await translator.translate(text, dest=lang)
            text = translated.text

        # Create unique filename to avoid collision
        filename = f"audio/audio_{uuid.uuid4().hex}.mp3"
        # gTTS is blocking, so run in a thread
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: gTTS(text=text, lang=lang).save(filename))
        generated_files.add(filename)
        # print(f"\naudio file generated at: {filename}\n")
        print(f"\n{Fore.BLUE}{datetime.datetime.now()} {Fore.GREEN}{filename}{Style.RESET_ALL}\n")
        response = send_file(
            filename,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='tts_audio.mp3'
        )

        # Cleanup after sending
        @response.call_on_close
        def remove_file():
            try:
                os.remove(filename)
            except OSError:
                pass

        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
if __name__ == '__main__':
    app.run(host="0.0.0.0",debug=True,port=8080)