from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Annotated, Literal
from datetime import datetime, timedelta
from app.database import get_db
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import text

app = FastAPI(title="Campus Connect API")

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
    content: str
    media_url: str | None = None

class Event(BaseModel):
    club_id: UUID
    title: str
    description: str
    venue: str
    start_time: datetime
    end_time: datetime
    capacity: int

class Complaint(BaseModel):
    student_id: UUID | None = None
    category: str
    subject: str
    description: str
    is_anonymous: bool = False

class Group(BaseModel):
    title: str
    type: Literal["private", "group", "automated"] = "group"  

class StudentRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    roll_number: str
    enrollment_number: str
    branch: str
    graduation_year: int

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):

        if not value.lower().endswith("nitrr.ac.in"):
            raise ValueError("Invalid institute email")

        return value
    
# LOGIN MODEL
class Login(BaseModel):
    email: EmailStr
    password: str
    

# Register API
@app.post("/register")
def register(user: StudentRegister, db: Session = Depends(get_db)):

    try:
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

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))



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
    INSERT INTO public.posts (student_id, content, media_url)
    VALUES (:student_id, :content, :media_url)
    RETURNING id, created_at;
    """

    result = db.execute(text(query), feed.model_dump())
    db.commit()

    post = result.fetchone()

    return {
        "message": "Feed created successfully",
        "post_id": str(post.id),
        "created_at": post.created_at
    }

@app.get("/feeds")
def get_feeds(db: Session = Depends(get_db)):

    query = """
    SELECT p.*, s.roll_number
    FROM public.posts p
    JOIN public.students s ON p.student_id = s.id
    ORDER BY p.created_at DESC
    """

    result = db.execute(text(query)).fetchall()

    return [dict(row._mapping) for row in result]

@app.get("/feeds/{post_id}")
def get_feed(post_id: UUID, db: Session = Depends(get_db)):

    query = """
    SELECT * FROM public.posts
    WHERE id = :post_id
    """

    result = db.execute(text(query), {"post_id": post_id}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Post not found")

    return dict(result._mapping)


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
    db.commit()

    event_id = result.fetchone()[0]

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
    db.commit()

    row = result.fetchone()

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
    db.commit()

    row = result.fetchone()

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

    feeds_count = db.execute(text("SELECT COUNT(*) FROM public.posts")).scalar()
    complaints_count = db.execute(text("SELECT COUNT(*) FROM public.complaints")).scalar()
    groups_count = db.execute(text("SELECT COUNT(*) FROM public.chat_rooms")).scalar()

    return {
        "total_feeds": feeds_count,
        "total_events": events_count,
        "total_complaints": complaints_count,
        "total_groups": groups_count
    }
