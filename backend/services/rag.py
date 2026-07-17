from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
import json
import os

CHROMA_PATH = "data/chroma_db"

def load_schemes():
    with open("data/schemes.json", "r", encoding="utf-8") as f:
        return json.load(f)

def build_vectorstore():
    print("Building vector store from schemes...")
    schemes = load_schemes()
    
    docs = []
    for scheme in schemes:
        # Convert scheme to readable text
        content = f"""
Scheme Name: {scheme.get('title', '')}
Description: {scheme.get('description', '')}
Ministry: {scheme.get('ministry', '')}
State: {scheme.get('state', 'Central')}
Benefits: {scheme.get('benefits', '')}
Eligibility: Age {scheme.get('eligibility', {}).get('min_age', 0)} to {scheme.get('eligibility', {}).get('max_age', 99)}
Income limit: Rs. {scheme.get('eligibility', {}).get('income', 999999)}
Caste: {', '.join(scheme.get('eligibility', {}).get('caste', []))}
Occupation: {', '.join(scheme.get('eligibility', {}).get('occupation', []))}
Documents needed: {', '.join(scheme.get('documents', []))}
Application: {scheme.get('application_process', '')}
Tags: {', '.join(scheme.get('tags', []))}
        """.strip()
        
        docs.append(Document(
            page_content=content,
            metadata={"id": scheme.get("id", ""), "title": scheme.get("title", "")}
        ))
    
    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)
    
    # Create embeddings using free HuggingFace model
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    # Store in ChromaDB
    vectorstore = Chroma.from_documents(
        chunks, embeddings, persist_directory=CHROMA_PATH
    )
    
    print(f"Vector store built! {len(chunks)} chunks from {len(schemes)} schemes.")
    return vectorstore

def get_vectorstore():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    if os.path.exists(CHROMA_PATH):
        return Chroma(
            persist_directory=CHROMA_PATH,
            embedding_function=embeddings
        )
    return build_vectorstore()

def query_schemes(user_query: str, k: int = 5) -> str:
    # Handle greetings
    greetings = ["hi", "hello", "hey", "namaste", "helo", "hii"]
    small_talk = ["how are you", "who are you", "what are you", 
                  "what can you do", "help"]
    
    query_lower = user_query.lower().strip()
    
    if query_lower in greetings:
        return "Hello! 👋 I'm your Scheme Navigator AI assistant. I can help you find government schemes you're eligible for. Try asking me:\n• 'What schemes are available for farmers?'\n• 'Show me health schemes'\n• 'I am a 35 year old SC student in Maharashtra'"
    
    if any(q in query_lower for q in small_talk):
        return "I'm your AI assistant for finding Indian government schemes! 🏛️\n\nI can:\n• Find schemes based on your profile\n• Answer questions about specific schemes\n• Tell you about eligibility and documents needed\n\nTry asking: 'What schemes are available for farmers in Maharashtra?'"
    
    # Original RAG search for real queries
    vectorstore = get_vectorstore()
    results = vectorstore.similarity_search(user_query, k=k)
    
    if not results:
        return "I couldn't find any schemes matching your query. Try asking about farmers, students, women, housing, health, or business schemes."
    
    reply = f"Based on your query, here are the most relevant schemes:\n\n"
    seen = set()
    count = 0
    
    for doc in results:
        title = doc.metadata.get("title", "")
        if title in seen:
            continue
        seen.add(title)
        count += 1
        reply += f"{count}. {title}\n"
        for line in doc.page_content.split("\n"):
            if "Benefits:" in line:
                reply += f"   {line.strip()}\n"
                break
        reply += "\n"
    
    reply += "Use the eligibility checker for a complete personalized list!"
    return reply