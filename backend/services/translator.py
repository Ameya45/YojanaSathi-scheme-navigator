from deep_translator import GoogleTranslator

def translate_text(text: str, target_lang: str) -> str:
    if target_lang == "en" or not target_lang:
        return text
    
    try:
        # Map our lang codes to Google Translate codes
        lang_map = {
            "hi": "hi",
            "mr": "mr"
        }
        
        google_lang = lang_map.get(target_lang, "en")
        
        # Split by lines to preserve formatting
        lines = text.split("\n")
        translated_lines = []
        
        for line in lines:
            if not line.strip():
                translated_lines.append("")
                continue
            translated = GoogleTranslator(
                source="en", 
                target=google_lang
            ).translate(line)
            translated_lines.append(translated or line)
        
        return "\n".join(translated_lines)
        
    except Exception as e:
        print(f"Translation error: {e}")
        return text