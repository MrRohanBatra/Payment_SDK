
import sys
import uuid
import os
import asyncio
import edge_tts  # type: ignore

INDIAN_VOICE_MAP = {
    "en": "en-IN-NeerjaExpressiveNeural",
    "bn": "bn-IN-BashkarNeural",
    "gu": "gu-IN-DhwaniNeural",
    "hi": "hi-IN-MadhurNeural",
    "kn": "kn-IN-GaganNeural",
    "ml": "ml-IN-MidhunNeural",
    "mr": "mr-IN-AarohiNeural",
    "ta": "ta-IN-PallaviNeural",
    "te": "te-IN-MohanNeural",
    "ur": "ur-IN-GulNeural",
}

async def generate_audio(text, lang):
    try:
        filename = f"audio/audio_{uuid.uuid4().hex}.mp3"
        os.makedirs("audio", exist_ok=True)

        voice = INDIAN_VOICE_MAP.get(lang) 
        tts = edge_tts.Communicate(text=text, voice=voice) # type: ignore
        await tts.save(filename)

        return f"/{filename}"
    except Exception as e:
        filename = f"audio/audio_error_{uuid.uuid4().hex}.mp3"
        os.makedirs("audio", exist_ok=True)

        voice = INDIAN_VOICE_MAP.get("en", "en-IN-NeerjaExpressiveNeural") 
        tts = edge_tts.Communicate(text="there was an error generating audio", voice=voice)
        await tts.save(filename)

        return f"/{filename}"
        

async def main():
    if len(sys.argv) < 3:
        print("Usage: python generate_audio.py <text> <lang_code>", file=sys.stderr)
        sys.exit(1)

    text = sys.argv[1]
    lang = sys.argv[2]

    result = await generate_audio(text, lang)
    print(result)

if __name__ == "__main__":
    asyncio.run(main())