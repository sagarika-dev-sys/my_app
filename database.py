import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path

env_path=Path(__file__).resolve().parent/".env"
load_dotenv(dotenv_path=env_path)
# 1. Database URL
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Create engine (connection to DB)
engine = create_engine(DATABASE_URL)

# 3. Session (used to talk to DB)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Base (used for models if you use ORM)
Base = declarative_base()


# 5. Dependency (FastAPI uses this)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()