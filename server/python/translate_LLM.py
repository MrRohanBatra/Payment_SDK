from flask import Flask, request, jsonify
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit.processor import IndicProcessor

app = Flask(__name__)

# Set device: MPS for Apple Silicon, fallback to CPU
DEVICE = "cuda" if torch.backends.mps.is_available() else "cpu"

INDIC_LANGUAGE_TAGS = {
    "as": "asm_Beng", "brx": "brx_Deva", "bn": "ben_Beng", "doi": "doi_Deva", "en": "eng_Latn",
    "gom": "gom_Deva", "gu": "guj_Gujr", "hi": "hin_Deva", "kn": "kan_Knda",
    "kas_arab": "kas_Arab", "kas_deva": "kas_Deva", "mai": "mai_Deva", "ml": "mal_Mlym",
    "mni_beng": "mni_Beng", "mni_mtei": "mni_Mtei", "mr": "mar_Deva", "ne": "npi_Deva",
    "or": "ory_Orya", "pa": "pan_Guru", "sa": "san_Deva", "sat": "sat_Olck",
    "sd": "snd_Arab", "sd_deva": "snd_Deva", "ta": "tam_Taml", "te": "tel_Telu", "ur": "urd_Arab"
}

# Load model and tokenizer once
model_name = "ai4bharat/indictrans2-en-indic-1B"
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)

model = AutoModelForSeq2SeqLM.from_pretrained(
    model_name,
    trust_remote_code=True,
    torch_dtype=torch.float32 if DEVICE == "mps" else torch.float16
).to(DEVICE)

# Load processor
ip = IndicProcessor(inference=True)

def translate_to_indic(text: str, target_lang: str) -> str:
    src_lang = "eng_Latn"
    batch = ip.preprocess_batch([text], src_lang=src_lang, tgt_lang=target_lang)
    inputs = tokenizer(batch, truncation=True, padding="max_length", max_length=96, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        output = model.generate(
            **inputs,
            use_cache=True,
            max_length=128,
            num_beams=2,
            num_return_sequences=1
        )
    decoded = tokenizer.batch_decode(output, skip_special_tokens=True)
    result = ip.postprocess_batch(decoded, lang=target_lang)
    return result[0]

@app.route("/translate", methods=["POST"])
def translate():
    try:
        data = request.json
        text = data.get("text")
        target_lang = data.get("target_lang")

        if not text or not target_lang:
            return jsonify({"error": "Missing 'text' or 'target_lang'"}), 400

        if target_lang not in INDIC_LANGUAGE_TAGS:
            return jsonify({"error": f"Unsupported target language: {target_lang}"}), 400

        target_lang_tag = INDIC_LANGUAGE_TAGS[target_lang]
        translated_text = translate_to_indic(text, target_lang_tag)
        return jsonify({
            "input_text": text,
            "target_lang": target_lang_tag,
            "translated_text": translated_text
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True,host="0.0.0.0", port=1607)