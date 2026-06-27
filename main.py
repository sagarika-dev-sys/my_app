from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Annotated, Literal
from datetime import datetime, timedelta
from database import get_db
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import text

app = FastAPI(title="Campus Connect API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[""
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# In-Memory Database
# ----------------------------

SECRET_KEY = "CHANGE_THIS_TO_A_RANDOM_SECRET_KEY"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)

def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )

def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update(
        {"exp": expire}
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

# ----------------------------
# Models
# ----------------------------

class Feed(BaseModel):
    student_id: UUID
    title: str | None = None
    description: str | None = None
    content: str
    media_url: str | None = None
    image_url: str | None = None
    hashtag_id: UUID | None = None
    expires_at: datetime | None = None

class Event(BaseModel):
    club_id: UUID
    title: str
    description: str
    venue: str
    start_time: datetime
    end_time: datetime
    capacity: int = Field(gt=0)

class Complaint(BaseModel):
    student_id: UUID | None = None
    category: Literal["academic","hostel","mess","technical","other"]
    subject: str
    description: str
    is_anonymous: bool = False

class Group(BaseModel):
    title: str
    type: Literal["private", "group", "automated"] = "group"  

class StudentRegister(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length = 8, max_length = 50
    )
    full_name: str

    roll_number: str= Field(
        min_length = 8, max_length = 50
    )
    enrollment_number: str
    branch: str
    graduation_year: int

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):

        if not value.lower().endswith("@nitrr.ac.in"):
            raise ValueError("Invalid institute email")

        return value
    
# LOGIN MODEL
class Login(BaseModel):
    email: EmailStr
    password: str
    

# CHAT MESSAGE
class ChatMessage(BaseModel):
    room_id: UUID
    sender_id: UUID
    content: str
    image_url: str | None = None


# Register API
@app.post("/register")
def register(user: StudentRegister, db: Session = Depends(get_db)):

    try:
        # Check if email already exists
        check_query = """
        SELECT id
        FROM public.profiles
        WHERE email = :email;
        """

        existing = db.execute(
            text(check_query),
            {"email": user.email.lower()}
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Email already exists"
            )
        # 1. create profile
        profile_query = """
        INSERT INTO public.profiles
        (id, role, full_name, email, password_hash)
        VALUES
        (gen_random_uuid(), 'student', :full_name, :email, :password_hash)
        RETURNING id;
        """

        result = db.execute(text(profile_query), {
            "full_name": user.full_name,
            "email": user.email.lower(),
            "password_hash": hash_password(user.password)
        })

        profile_id = result.fetchone()[0]

        # 2. create student
        student_query = """
        INSERT INTO public.students
        (id, roll_number, enrollment_number, branch, graduation_year)
        VALUES
        (:id, :roll_number, :enrollment_number, :branch, :graduation_year)
        """

        db.execute(text(student_query), {
            "id": profile_id,
            "roll_number": user.roll_number,
            "enrollment_number": user.enrollment_number,
            "branch": user.branch,
            "graduation_year": user.graduation_year
        })

        db.commit()

        return {"message": "Student registered successfully"}

    except HTTPException:
        db.rollback()
        raise
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



# LOGIN API
@app.post("/login")
def login(data: Login, db: Session = Depends(get_db)):

    # ❌ BLOCK OUTSIDE USERS
    if not data.email.lower().endswith("nitrr.ac.in"):
        raise HTTPException(
            status_code=403,
            detail="Only institute email allowed"
        )

    query = """
    SELECT p.id, p.password_hash, p.role
    FROM public.profiles p
    WHERE p.email = :email
    """

    result = db.execute(text(query), {
        "email": data.email.lower()
    }).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.password, result.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password")

    token = create_access_token({
        "user_id": str(result.id),
        "role": result.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": result.role
    }
# ----------------------------
# Home Route
# ----------------------------

@app.get("/")
def home():
    return {"message": "Campus Connect API Running"}

# ----------------------------
# Feed APIs
# ----------------------------

@app.post("/feeds")
def create_feed(feed: Feed, db: Session = Depends(get_db)):

    query = """
    INSERT INTO public.posts (student_id, title, description, content,media_url, image_url, hashtag_id, expires_at)
    VALUES (:student_id, :title, :description, :content,:media_url, :image_url, :hashtag_id, :expires_at)
    RETURNING id, created_at;
    """

    result = db.execute(text(query), feed.model_dump())
    post = result.fetchone()
    db.commit()

    return {
        "message": "Feed created successfully",
        "post_id": str(post.id),
        "created_at": post.created_at
    }

@app.get("/feeds")
def get_feeds(db: Session = Depends(get_db)):

    query = """
    SELECT
    p.*,s.roll_number, h.name AS hashtag_name, h.display_name 
    FROM public.posts p
    JOIN public.students s
    ON p.student_id=s.id
    JOIN public.hashtags h
    ON p.hashtag_id=h.id
    ORDER BY p.created_at DESC
    """

    result = db.execute(text(query)).fetchall()

    return [dict(row._mapping) for row in result]

@app.get("/feeds/{post_id}")
def get_feed(post_id: UUID, db: Session = Depends(get_db)):

    query = """
    SELECT
    p.*,
    h.name AS hashtag_name,
    h.display_name
    FROM public.posts p
    JOIN public.hashtags h
    ON p.hashtag_id = h.id
    WHERE p.id = :post_id;
    """

    result = db.execute(text(query), {"post_id": post_id}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Post not found")

    return dict(result._mapping)


# Live Chat message
@app.post("/chat/messages")
def send_message(message: ChatMessage, db: Session = Depends(get_db)):

    query = """
    INSERT INTO public.chat_messages
    (room_id, sender_id, content, image_url)
    VALUES
    (:room_id, :sender_id, :content, :image_url)
    RETURNING id, created_at;
    """

    result = db.execute(text(query), message.model_dump())
    row = result.fetchone()
    db.commit()

    return {
        "message": "Message sent",
        "message_id": str(row.id),
        "created_at": row.created_at
    }

@app.get("/chat/{room_id}/messages")
def get_messages(room_id: UUID, db: Session = Depends(get_db)):

    query = """
    SELECT
        m.*,
        p.full_name
    FROM public.chat_messages m
    JOIN public.profiles p
        ON m.sender_id = p.id
    WHERE m.room_id = :room_id
    ORDER BY m.created_at ASC;
    """

    result = db.execute(text(query), {
        "room_id": room_id
    }).fetchall()

    return [
        dict(row._mapping)
        for row in result
    ]

# ----------------------------
# Event APIs
# ----------------------------

@app.post("/events")
def create_event(event: Event, db: Session = Depends(get_db)):

    query = """
    INSERT INTO public.events
    (club_id, title, description, venue, start_time, end_time, capacity)
    VALUES
    (:club_id, :title, :description, :venue, :start_time, :end_time, :capacity)
    RETURNING id;
    """

    result = db.execute(text(query), event.model_dump())
    event_id = result.fetchone()[0]
    db.commit()

    return {
        "message": "Event created successfully",
        "event_id": str(event_id)
    }


@app.get("/events")
def get_events(db: Session = Depends(get_db)):

    query = "SELECT * FROM public.events ORDER BY created_at DESC"

    result = db.execute(text(query))

    events = result.fetchall()

    return [
        dict(row._mapping) for row in events
    ]

@app.get("/events/{event_id}")
def get_event(event_id: UUID, db: Session = Depends(get_db)):

    query = "SELECT * FROM public.events WHERE id = :event_id"

    result = db.execute(text(query), {"event_id": event_id}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Event not found")

    return dict(result._mapping)

@app.delete("/events/{event_id}")
def delete_event(event_id: UUID, db: Session = Depends(get_db)):

    query = "DELETE FROM public.events WHERE id = :event_id RETURNING id"

    result = db.execute(text(query), {"event_id": event_id}).fetchone()

    db.commit()

    if not result:
        raise HTTPException(status_code=404, detail="Event not found")

    return {"message": "Event deleted successfully"}


# hashtag
@app.get("/hashtags")
def get_hashtags(db: Session = Depends(get_db)):

    query = """
    SELECT
        id,
        name,
        display_name,
        expiry_enabled,
        default_expiry_minutes,
        min_expiry_minutes,
        max_expiry_minutes,
        contact_display
    FROM public.hashtags
    WHERE is_active = TRUE
    ORDER BY display_name;
    """

    result = db.execute(text(query)).fetchall()

    return [
        dict(row._mapping)
        for row in result
    ]

# ----------------------------
# Complaint APIs
# ----------------------------

@app.post("/complaints")
def create_complaint(complaint: Complaint, db: Session = Depends(get_db)):

    query = """
    INSERT INTO public.complaints
    (student_id, category, subject, description, is_anonymous)
    VALUES
    (:student_id, :category, :subject, :description, :is_anonymous)
    RETURNING id, status, created_at;
    """

    result = db.execute(text(query), complaint.model_dump())
    row = result.fetchone()
    db.commit()

    return {
        "message": "Complaint submitted successfully",
        "complaint_id": str(row.id),
        "status": row.status,
        "created_at": row.created_at
    }

@app.get("/complaints")
def get_complaints(db: Session = Depends(get_db)):

    query = """
    SELECT c.*, s.roll_number
    FROM public.complaints c
    LEFT JOIN public.students s ON c.student_id = s.id
    ORDER BY c.created_at DESC
    """

    result = db.execute(text(query)).fetchall()

    return [dict(row._mapping) for row in result]

@app.put("/complaints/{complaint_id}")
def update_complaint_status(
    complaint_id: UUID,
    status: str,
    db: Session = Depends(get_db)
):

    query = """
    UPDATE public.complaints
    SET status = :status,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = :complaint_id
    RETURNING id, status;
    """

    result = db.execute(text(query), {
        "status": status,
        "complaint_id": complaint_id
    }).fetchone()

    db.commit()

    if not result:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return {
        "message": "Complaint status updated",
        "complaint_id": str(result.id),
        "status": result.status
    }

# ----------------------------
# Group APIs
# ----------------------------

@app.post("/groups")
def create_group(group: Group, db: Session = Depends(get_db)):

    query = """
    INSERT INTO public.chat_rooms (title, type)
    VALUES (:title, :type)
    RETURNING id, created_at;
    """

    result = db.execute(text(query), group.model_dump())
    row = result.fetchone()
    db.commit()

    return {
        "message": "Group created successfully",
        "group_id": str(row.id),
        "created_at": row.created_at
    }

@app.get("/groups")
def get_groups(db: Session = Depends(get_db)):

    query = """
    SELECT * FROM public.chat_rooms
    ORDER BY created_at DESC
    """

    result = db.execute(text(query)).fetchall()

    return [dict(row._mapping) for row in result]

@app.post("/groups/{group_id}/join")
def join_group(group_id: UUID, user_id: UUID, db: Session = Depends(get_db)):

    # Check whether group exists
    check_query = """
    SELECT id
    FROM public.chat_rooms
    WHERE id = :group_id;
    """

    group = db.execute(
        text(check_query),
        {"group_id": group_id}
    ).fetchone()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Group not found"
        )

    query = """
    INSERT INTO public.chat_room_members (room_id, user_id)
    VALUES (:room_id, :user_id)
    ON CONFLICT DO NOTHING;
    """

    db.execute(text(query), {
        "room_id": group_id,
        "user_id": user_id
    })

    db.commit()

    return {"message": "Joined group successfully"}

@app.get("/groups/{group_id}/members")
def get_group_members(group_id: UUID, db: Session = Depends(get_db)):

    query = """
    SELECT p.id, p.full_name, p.role
    FROM public.chat_room_members m
    JOIN public.profiles p ON p.id = m.user_id
    WHERE m.room_id = :group_id
    """

    result = db.execute(text(query), {"group_id": group_id}).fetchall()

    return [dict(row._mapping) for row in result]

# ----------------------------
# Dashboard API
# ----------------------------

@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):

    events_count = db.execute(text("SELECT COUNT(*) FROM public.events")).scalar()

    feeds_count = db.execute(text("SELECT COUNT(*) FROM public.posts WHERE is_active = TRUE")).scalar()
    complaints_count = db.execute(text("SELECT COUNT(*) FROM public.complaints")).scalar()
    groups_count = db.execute(text("SELECT COUNT(*) FROM public.chat_rooms")).scalar()

    return {
        "total_feeds": feeds_count,
        "total_events": events_count,
        "total_complaints": complaints_count,
        "total_groups": groups_count
    }
