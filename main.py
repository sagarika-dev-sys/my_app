from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI()

# Enable CORS so Next.js can talk to FastAPI safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SCHEMAS ---

# Structure for Member 2's Sign In Portal
class LoginPayload(BaseModel):
    email: str
    password: str

# Structure for Member 2's Campus Feed
class FeedPayload(BaseModel):
    student_id: str
    content: str
    media_url: Optional[str] = None

# Structure for Member 2's Grievance Deck
class ComplaintPayload(BaseModel):
    student_id: str
    category: str
    subject: str
    description: str
    is_anonymous: bool

# Structure for Member 4's Interactive Event Publishing Modal Form
class CreateEventPayload(BaseModel):
    title: str
    description: str
    venue: str
    start_time: str
    end_time: str
    capacity: int

# Structure for Member 4's High-Speed Chat System
class ChatMessagePayload(BaseModel):
    content: str


# --- LOCAL MEMORY STORAGE ---
db_complaints = []
db_feeds = [
    {
        "id": 1,
        "roll_number": "NITR-2026-CORE",
        "content": "Welcome to the CampusBuzz live feed! Local engine optimization layer active."
    }
]

# Seeding original mock events data to cleanly support the front-end layout state rules
db_events = [
    {
        "id": "evt-101",
        "title": "HackFest 2026 Briefing Session",
        "description": "Mandatory structural orientation and team sync-up rules for all registered internal campus hackathon participants.",
        "venue": "Main Audi Hall 2",
        "start_time": "2026-06-28T16:30:00.000Z",
        "end_time": "2026-06-28T18:30:00.000Z",
        "capacity": 120,
        "club_id": "club-turing",
        "profiles": {"full_name": "Computer Science Society"}
    },
    {
        "id": "evt-102",
        "title": "Crystallography & Physics Lab Seminar",
        "description": "An introductory presentation analyzing Miller indices structural alignments and applications of Bragg's Law.",
        "venue": "Solid State Physics Block",
        "start_time": "2026-06-26T11:00:00.000Z",
        "end_time": "2026-06-26T13:00:00.000Z",
        "capacity": 60,
        "club_id": "club-physics",
        "profiles": {"full_name": "Physics Core Research Wing"}
    }
]

db_chat_messages = [
    {
        "club_id": "programming-club",
        "content": "Welcome to the official Programming Club chat lounge! Local engine stream layer active."
    }
]


# --- BASE ROUTE ---
@app.get("/")
def read_root():
    return {"status": "connected", "engine": "local full-stack architecture active"}


# --- AUTHENTICATION ENDPOINT ---
@app.post("/login")
def login_student(payload: LoginPayload):
    print("\n" + "="*40)
    print("🔑 AUTH REQUEST SUBMITTED TO ENGINE")
    print(f"Email attempted: {payload.email}")
    print("="*40 + "\n")
    
    if payload.password == "password" or payload.password == "12345678" or len(payload.password) >= 4:
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
    return db_feeds

@app.post("/feeds")
def receive_feed_post(payload: FeedPayload):
    print("\n" + "="*40)
    print("🔥 LOCAL ENGINE STREAMED A NEW FEED BROADCAST!")
    print(f"Content: {payload.content}")
    print("="*40 + "\n")
    
    new_post = {
        "id": len(db_feeds) + 1,
        "roll_number": "Local Session",
        "content": payload.content
    }
    db_feeds.insert(0, new_post)
    return {"status": "success", "message": "Feed broadcast synced smoothly"}


# --- GRIEVANCE DECK ENDPOINTS ---
@app.get("/complaints")
def get_complaints():
    return db_complaints

@app.post("/complaints")
def receive_complaint(payload: ComplaintPayload):
    print("\n" + "="*40)
    print("🚀 LOCAL ENGINE RECEIVED A NEW GRIEVANCE!")
    print(f"Subject: {payload.subject}")
    print("="*40 + "\n")
    
    new_entry = {
        "id": len(db_complaints) + 1,
        "subject": payload.subject,
        "category": payload.category,
        "description": payload.description,
        "is_anonymous": payload.is_anonymous,
        "status": "locally verified"
    }
    db_complaints.append(new_entry)
    return {"status": "success", "message": "Grievance logged securely"}


# --- CAMPUS EVENTS SYSTEM V2 ---
@app.get("/events")
def get_campus_events():
    return db_events

@app.post("/events")
def create_campus_event(payload: CreateEventPayload):
    print("\n" + "="*40)
    print("📅 PUBLISHING ENGINE ACTIVE: NEW EVENT LOGGED")
    print(f"Title: {payload.title} | Venue: {payload.venue}")
    print("="*40 + "\n")
    
    new_id = f"evt-{len(db_events) + 101}"
    new_event = {
        "id": new_id,
        "title": payload.title,
        "description": payload.description,
        "venue": payload.venue,
        "start_time": payload.start_time,
        "end_time": payload.end_time,
        "capacity": payload.capacity,
        "club_id": "club-turing",
        "profiles": {"full_name": "Turing Club (Sandbox Local)"}
    }
    db_events.append(new_event)
    return {"status": "success", "event_id": new_id}


# --- CLUB CHAT LOUNGE ENDPOINTS ---
@app.get("/chat/{room_id}")
def get_chat_messages(room_id: str):
    room_messages = [msg for msg in db_chat_messages if msg["club_id"] == room_id]
    return room_messages

@app.post("/chat/{room_id}")
def post_chat_message(room_id: str, payload: ChatMessagePayload):
    print(f"💬 [Room ID: #{room_id}] New distributed trace text: {payload.content}")
    new_message = {
        "club_id": room_id,
        "content": payload.content
    }
    db_chat_messages.append(new_message)
    return {"status": "success", "message": "Message appended and broad-cast synced successfully"}
# --- CAMPUS CLUBS INFORMATION ENDPOINTS ---

# Mock profiles table matching Member 4's structural canvas parameters
db_clubs = [
    {
        "id": "club-turing",
        "full_name": "Computer Science Society",
        "role": "club",
        "category": "Technical",
        "tagline": "Building core developmental pipelines and tracking algorithmic events."
    },
    {
        "id": "club-physics",
        "full_name": "Physics & Core Research Wing",
        "role": "club",
        "category": "Research",
        "tagline": "The epicenter of structural crystallography, solid-state models, and campus research."
    }
]

@app.get("/clubs")
def get_campus_clubs():
    return db_clubs