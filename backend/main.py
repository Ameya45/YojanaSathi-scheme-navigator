from fastapi import FastAPI, Header, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io
import sys
import json
sys.path.append("backend/services")
sys.path.append("backend")
from matcher import match_schemes
from auth import register_user, login_user, decode_token, save_search, get_history
from database import init_db

init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserProfile(BaseModel):
    age: int
    gender: str
    caste: str
    income: int
    occupation: str
    domicile_state: str
    domicile_years: int

class ChatMessage(BaseModel):
    message: str
    lang: str = "en"

class RegisterBody(BaseModel):
    name: str
    email: str
    password: str

class LoginBody(BaseModel):
    email: str
    password: str

def load_schemes():
    with open("data/schemes.json", "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/")
def root():
    return {"message": "YojanaSaathi API is running!"}

@app.post("/register")
def register(body: RegisterBody):
    return register_user(body.name, body.email, body.password)

@app.post("/login")
def login(body: LoginBody):
    return login_user(body.email, body.password)

@app.get("/history")
def history(authorization: str = Header(None)):
    if not authorization:
        return {"error": "Not logged in"}
    token = authorization.replace("Bearer ", "")
    user = decode_token(token)
    if not user:
        return {"error": "Invalid token"}
    return {"history": get_history(user["user_id"])}

@app.post("/match")
def get_matched_schemes(profile: UserProfile, authorization: str = Header(None)):
    results = match_schemes(profile.dict())
    if authorization:
        token = authorization.replace("Bearer ", "")
        user = decode_token(token)
        if user:
            save_search(user["user_id"], profile.dict(), len(results))
    return {"total": len(results), "schemes": results}

@app.post("/export-pdf")
def export_pdf(profile: UserProfile, authorization: str = Header(None)):
    from services.pdf_generator import generate_pdf
    results = match_schemes(profile.dict())
    pdf_bytes = generate_pdf(results, profile.dict())
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=my_schemes.pdf"}
    )

@app.post("/chat")
def chat(msg: ChatMessage):
    from services.rag import query_schemes
    
    # Detect greetings in original message BEFORE translation
    query_lower = msg.message.lower().strip()
    greetings = ["hi", "hello", "hey", "namaste", "helo", "hii", "नमस्ते", "हेलो"]
    
    if query_lower in greetings:
        if msg.lang == "hi":
            reply = "नमस्ते! 👋 मैं आपका योजना सहायक हूं। मुझसे पूछें जैसे:\n• 'किसानों के लिए कौन सी योजनाएं हैं?'\n• 'स्वास्थ्य योजनाएं दिखाएं'\n• 'मैं महाराष्ट्र में 35 साल का SC छात्र हूं'"
        elif msg.lang == "mr":
            reply = "नमस्ते! 👋 मी तुमचा योजना सहाय्यक आहे. मला विचारा:\n• 'शेतकऱ्यांसाठी कोणत्या योजना आहेत?'\n• 'आरोग्य योजना दाखवा'\n• 'मी महाराष्ट्रातील ३५ वर्षांचा SC विद्यार्थी आहे'"
        else:
            reply = "Hello! 👋 I'm your Scheme Navigator assistant. Try asking:\n• 'What schemes are available for farmers?'\n• 'Show me health schemes'\n• 'I am a 35 year old SC student in Maharashtra'"
        return {"reply": reply}
    
    # For real queries — get RAG reply then translate
    reply = query_schemes(msg.message)
    
    if msg.lang != "en":
        from services.translator import translate_text
        reply = translate_text(reply, msg.lang)
    
    return {"reply": reply}

@app.post("/voice-chat")
async def voice_chat(audio: UploadFile = File(...)):
    from services.voice import transcribe_audio
    from services.rag import query_schemes
    audio_bytes = await audio.read()
    transcribed_text = transcribe_audio(audio_bytes)
    if not transcribed_text:
        return {"transcribed_text": "", "reply": "Sorry, I couldn't understand the audio. Please try again."}
    reply = query_schemes(transcribed_text)
    return {"transcribed_text": transcribed_text, "reply": reply}

