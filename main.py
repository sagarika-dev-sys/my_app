import re
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from supabase import create_client, Client

app = FastAPI()

# Enable CORS so Next.js can talk to FastAPI safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SUPABASE CONFIGURATION (ROTATED KEYS UPDATED) ---
SUPABASE_URL = "https://jjndjcolzqsfxxkkczvz.supabase.co"
SUPABASE_KEY = "sb_publishable_czKmjVmnhJRigC6OGRWAgQ_ZrRSE-Xp" 

# Start the cloud database client safely
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# --- VALIDATION SCHEMAS (PYDANTIC) ---

class LoginPayload(BaseModel):
    email: str
    password: str

class FeedPayload(BaseModel):
    student_id: str
    content: str
    media_url: Optional[str] = None

class ComplaintPayload(BaseModel):
    student_id: Optional[str] = None  # Optional to allow for anonymous options
    category: str
    subject: str
    description: str
    is_anonymous: bool

class CreateEventPayload(BaseModel):
    club_id: str  # Added to tie dynamically to the acting coordinator body
    title: str
    description: str
    venue: str
    start_time: str
    end_time: str
    capacity: int = Field(..., gt=0)  # Enforces constraint: check_positive_capacity

class ChatMessagePayload(BaseModel):
    sender_id: str
    content: str


# --- BASE ROUTE ---
@app.get("/")
def read_root():
    return {"status": "connected", "engine": "Supabase Cloud Integration Active"}


# --- AUTHENTICATION ENDPOINT ---
@app.post("/login")
def login_student(payload: LoginPayload):
    print("\n" + "="*40)
    print("🔑 AUTH REQUEST SUBMITTED TO ENGINE")
    print(f"Email attempted: {payload.email}")
    print("="*40 + "\n")
    
    # Clean and lowercase the email input string safely
    email_clean = payload.email.strip().lower()
    
    # SMART VALIDATION REGEX:
    # Matches standard domain '@nitrr.ac.in' AND subdomains like '@cse.nitrr.ac.in'
    nitrr_pattern = r"@[a-zA-Z0-9.\-_]*nitrr\.ac\.in$"
    
    if not re.search(nitrr_pattern, email_clean):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only official NITRR branch emails are authorized."
        )
        
    if len(payload.password) >= 4:
        return {
            "access_token": "mock-secure-session-token-abc123xyz",
            "token_type": "bearer"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Try using a stronger test password."
        )


# --- CAMPUS FEED ENDPOINTS ---
@app.get("/feeds")
def get_feeds():
    response = supabase.table("posts").select("*").order("created_at", desc=True).execute()
    return response.data

@app.post("/feeds")
def receive_feed_post(payload: FeedPayload):
    print("\n" + "="*40)
    print("🔥 CLOUD ENGINE: STREAMING NEW FEED BROADCAST")
    print(f"Content: {payload.content}")
    print("="*40 + "\n")
    
    new_post = {
        "student_id": payload.student_id,
        "content": payload.content,
        "media_url": payload.media_url
    }
    response = supabase.table("posts").insert(new_post).execute()
    return {"status": "success", "data": response.data}


# --- GRIEVANCE DECK ENDPOINTS ---
@app.get("/complaints")
def get_complaints():
    response = supabase.table("complaints").select("*").order("created_at", desc=True).execute()
    return response.data

@app.post("/complaints")
def receive_complaint(payload: ComplaintPayload):
    print("\n" + "="*40)
    print("🚀 CLOUD ENGINE: PROCESSING NEW GRIEVANCE")
    print(f"Subject: {payload.subject}")
    print("="*40 + "\n")
    
    new_entry = {
        "student_id": None if payload.is_anonymous else payload.student_id,
        "subject": payload.subject,
        "category": payload.category,
        "description": payload.description,
        "is_anonymous": payload.is_anonymous,
        "status": "open"  # Default state from database ENUM
    }
    response = supabase.table("complaints").insert(new_entry).execute()
    return {"status": "success", "data": response.data}


# --- CAMPUS EVENTS SYSTEM ---
@app.get("/events")
def get_campus_events():
    response = supabase.table("events").select("*").order("start_time", desc=False).execute()
    return response.data

@app.post("/events")
def create_campus_event(payload: CreateEventPayload):
    print("\n" + "="*40)
    print("📅 PUBLISHING ENGINE: COUPLING NEW EVENT TO CLOUD")
    print(f"Title: {payload.title} | Venue: {payload.venue}")
    print("="*40 + "\n")
    
    new_event = {
        "club_id": payload.club_id,
        "title": payload.title,
        "description": payload.description,
        "venue": payload.venue,
        "start_time": payload.start_time,
        "end_time": payload.end_time,
        "capacity": payload.capacity
    }
    response = supabase.table("events").insert(new_event).execute()
    return {"status": "success", "data": response.data}


# --- CLUB CHAT LOUNGE ENDPOINTS ---
@app.get("/chat/{room_id}")
def get_chat_messages(room_id: str):
    response = supabase.table("chat_messages").select("*").eq("room_id", room_id).order("created_at", desc=False).execute()
    return response.data

@app.post("/chat/{room_id}")
def post_chat_message(room_id: str, payload: ChatMessagePayload):
    print(f"💬 [Room ID: #{room_id}] New Cloud Text: {payload.content}")
    
    new_message = {
        "room_id": room_id,
        "sender_id": payload.sender_id,
        "message": payload.content
    }
    response = supabase.table("chat_messages").insert(new_message).execute()
    return {"status": "success", "data": response.data}


# --- CAMPUS CLUBS INFORMATION ENDPOINTS ---
@app.get("/clubs")
def get_campus_clubs():
    response = supabase.table("clubs").select("*").execute()
    return response.data