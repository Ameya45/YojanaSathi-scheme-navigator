# AI-Powered Government Scheme Navigator for Rural India

An AI-driven platform that helps rural users discover, understand, and apply for government welfare schemes they're eligible for — through a conversational chatbot, eligibility matching, multilingual voice input, and automated document generation.

Built solo as a final-year major project.

---

## 🚩 Problem

Millions of eligible citizens in rural India miss out on government welfare schemes simply because they don't know these schemes exist, can't navigate complex eligibility criteria, or face language and literacy barriers when trying to find and apply for them.

## 💡 Solution

This platform bridges that gap with:
- **Eligibility Matching** – Input basic details (income, occupation, location, category, etc.) and get matched against a database of government schemes.
- **RAG-based Chatbot** – Ask questions in natural language ("Am I eligible for a farmer loan waiver?") and get accurate, source-grounded answers pulled from actual scheme documentation.
- **Voice Input** – Speak your query instead of typing, powered by Whisper speech-to-text — built for users who are more comfortable speaking than typing/reading.
- **Multilingual Support** – Hindi translation pipeline so users aren't limited to English.
- **PDF Application Summaries** – Auto-generated, downloadable PDF summarizing matched schemes and next steps for applying.

---

## 🛠️ Tech Stack

**Backend**
- FastAPI – REST API layer
- LangChain + ChromaDB – Retrieval-Augmented Generation (RAG) pipeline for the chatbot
- Sentence-Transformers – Embedding generation for semantic search over scheme data
- SQLite – User authentication and application data storage
- ReportLab – Automated PDF generation
- Whisper (OpenAI) – Speech-to-text for voice queries
- Helsinki-NLP MarianMT – English–Hindi translation

**Frontend**
- React + Vite – Single-page application
- (add any UI library you used, e.g. Tailwind/Material UI)

---

## ⚙️ How It Works

1. User enters basic profile details (or the chatbot pulls this out of conversation).
2. The eligibility engine filters the scheme database against the user's profile.
3. For open-ended questions, the RAG pipeline retrieves relevant chunks from scheme documents (via ChromaDB vector search) and generates a grounded answer using an LLM.
4. Voice queries are transcribed via Whisper before being passed into the same pipeline.
5. Non-English users can interact via a Hindi translation layer wrapping the chatbot.
6. Once matched, users can download a PDF summary of eligible schemes and application steps.

---

## 🚀 Running Locally

```bash
# Clone the repo
git clone https://github.com/Ameya45/YojanaSathi-scheme-navigator.git
cd YojanaSathi-scheme-navigator

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend setup
cd ../frontend
npm install
npm run dev
```

Create a `.env` file in the backend directory with your required API keys / config (see `.env.example`).

---

## 🌐 Live Demo

- **Frontend:** https://yojana-sathi-scheme-navigator-git-main-ab-45.vercel.app/
- **Backend API:** https://yojanasathi-api.onrender.com
- **API Docs (Swagger):** https://yojanasathi-api.onrender.com/docs

---

## 📌 Status

Core features complete: eligibility matching, RAG chatbot, authentication, PDF export, voice input, and Hindi translation. Actively being refined and deployed.

---

## 👤 Author

**Ameya Kailas Bhalerao**
Final-year B.Tech, AI & Data Science — Smt. Indira Gandhi College of Engineering
[GitHub](https://github.com/Ameya45) · [LinkedIn](https://linkedin.com/in/ameyabhalerao)