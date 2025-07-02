# translate.py
import asyncio
import sys
from googletrans import Translator  # type: ignore

async def trans(text,lang):
    try:
        translator = Translator()
        translated = await translator.translate(text=text, dest=lang)
        return translated.text
    except Exception as e:
        return text

async def main():
    if len(sys.argv) < 3:
        print("Error: Missing arguments", file=sys.stderr)
        sys.exit(1)

    text = sys.argv[1]
    lang = sys.argv[2]
    data=await trans(text,lang)
    print(data)
if __name__=='__main__':
    asyncio.run(main())
