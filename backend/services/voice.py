import whisper
import tempfile
import os

# Load model once at startup (not on every request)
model = whisper.load_model("small")

def transcribe_audio(audio_bytes: bytes) -> str:
    # Save audio to a temp file (Whisper needs a file path)
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        transcribe_path = tmp.name

    try:
        result = model.transcribe(transcribe_path, language="en")
        text = result["text"].strip()
    finally:
        os.remove(transcribe_path)

    return text