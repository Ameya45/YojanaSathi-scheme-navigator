import hashlib
import secrets
from datetime import datetime, timedelta
from jose import jwt
import sys
sys.path.append("backend")
from database import get_connection

SECRET_KEY = "schemnavigator2026secretkey"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

def hash_password(password: str) -> str:
    # Simple SHA256 hashing — works perfectly on Windows
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain: str, hashed: str) -> bool:
    return hashlib.sha256(plain.encode()).hexdigest() == hashed

def create_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None

def register_user(name: str, email: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Check if email already exists
        existing = cursor.execute(
            "SELECT id FROM users WHERE email = ?", (email,)
        ).fetchone()
        if existing:
            return {"success": False, "error": "Email already registered"}
        
        hashed = hash_password(password)
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (name, email, hashed)
        )
        conn.commit()
        user_id = cursor.lastrowid
        token = create_token(user_id, email)
        return {"success": True, "token": token, "name": name}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def login_user(email: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        user = cursor.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        ).fetchone()
        
        if not user:
            return {"success": False, "error": "Email not found"}
        
        if not verify_password(password, user["password"]):
            return {"success": False, "error": "Wrong password"}
        
        token = create_token(user["id"], user["email"])
        return {"success": True, "token": token, "name": user["name"]}
    finally:
        conn.close()

def save_search(user_id: int, profile: dict, total_matched: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO search_history 
        (user_id, age, gender, caste, income, occupation, domicile_state, domicile_years, total_matched)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id, profile["age"], profile["gender"], profile["caste"],
        profile["income"], profile["occupation"], profile["domicile_state"],
        profile["domicile_years"], total_matched
    ))
    conn.commit()
    conn.close()

def get_history(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT * FROM search_history WHERE user_id = ? ORDER BY searched_at DESC LIMIT 10",
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]