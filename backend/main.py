from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
import uuid
from typing import Optional, List
import asyncio
from celery import Celery

from database import get_db, engine, Base
from models import User, Job, Payment
from auth import create_access_token, verify_token, get_password_hash, verify_password
from schemas import (
    UserCreate, UserLogin, UserResponse, 
    JobCreate, JobResponse, JobStatus,
    PaymentCreate, PaymentResponse
)
from video_processor import VideoProcessor
from payment_service import PaymentService

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Silence Remover API",
    description="AI-powered silence removal from videos",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize services
video_processor = VideoProcessor()
payment_service = PaymentService()

# Celery for background tasks
celery_app = Celery(
    "silence_remover",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379")
)

@app.get("/")
async def root():
    return {"message": "Silence Remover API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        access_token=access_token
    )

@app.post("/auth/login", response_model=UserResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # Verify user credentials
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        access_token=access_token
    )

# Video processing endpoints
@app.post("/jobs", response_model=JobResponse)
async def create_job(
    file: UploadFile = File(...),
    use_premium: bool = Form(False),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Verify user authentication
    user_email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Validate file type
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Check file size (max 500MB)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    if file_size > 500 * 1024 * 1024:  # 500MB
        raise HTTPException(status_code=400, detail="File too large (max 500MB)")
    
    # Create job record
    job_id = str(uuid.uuid4())
    job = Job(
        id=job_id,
        user_id=user.id,
        filename=file.filename,
        file_size=file_size,
        use_premium=use_premium,
        status=JobStatus.PENDING
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Save uploaded file
    upload_dir = f"uploads/{job_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    with open(f"{upload_dir}/{file.filename}", "wb") as buffer:
        buffer.write(content)
    
    # Start processing job
    if use_premium:
        # For premium users, check payment first
        # This would integrate with your payment system
        process_video_premium.delay(job_id, f"{upload_dir}/{file.filename}")
    else:
        # Free processing for videos under 1 minute
        process_video_free.delay(job_id, f"{upload_dir}/{file.filename}")
    
    return JobResponse(
        id=job.id,
        filename=job.filename,
        status=job.status,
        use_premium=job.use_premium,
        created_at=job.created_at
    )

@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Verify user authentication
    user_email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get job
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobResponse(
        id=job.id,
        filename=job.filename,
        status=job.status,
        use_premium=job.use_premium,
        created_at=job.created_at,
        processed_file_url=job.processed_file_url,
        error_message=job.error_message
    )

@app.get("/jobs", response_model=List[JobResponse])
async def list_jobs(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Verify user authentication
    user_email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get user's jobs
    jobs = db.query(Job).filter(Job.user_id == user.id).order_by(Job.created_at.desc()).all()
    
    return [
        JobResponse(
            id=job.id,
            filename=job.filename,
            status=job.status,
            use_premium=job.use_premium,
            created_at=job.created_at,
            processed_file_url=job.processed_file_url,
            error_message=job.error_message
        )
        for job in jobs
    ]

# Payment endpoints
@app.post("/payments", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Verify user authentication
    user_email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Create payment intent
    payment_intent = payment_service.create_payment_intent(
        amount=payment_data.amount,
        currency=payment_data.currency,
        user_id=user.id
    )
    
    # Save payment record
    payment = Payment(
        id=payment_intent["id"],
        user_id=user.id,
        amount=payment_data.amount,
        currency=payment_data.currency,
        status="pending"
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return PaymentResponse(
        id=payment.id,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
        client_secret=payment_intent["client_secret"]
    )

# Celery tasks
@celery_app.task
def process_video_free(job_id: str, file_path: str):
    """Process video using free ffmpeg + Remsi method"""
    try:
        # Update job status
        db = next(get_db())
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return
        
        job.status = JobStatus.PROCESSING
        db.commit()
        
        # Process video using ffmpeg + Remsi
        output_path = video_processor.process_with_ffmpeg(file_path)
        
        # Update job with result
        job.status = JobStatus.COMPLETED
        job.processed_file_url = f"/downloads/{job_id}/processed_{os.path.basename(file_path)}"
        db.commit()
        
    except Exception as e:
        # Update job with error
        db = next(get_db())
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            db.commit()

@celery_app.task
def process_video_premium(job_id: str, file_path: str):
    """Process video using premium Whisper method"""
    try:
        # Update job status
        db = next(get_db())
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return
        
        job.status = JobStatus.PROCESSING
        db.commit()
        
        # Process video using Whisper
        output_path = video_processor.process_with_whisper(file_path)
        
        # Update job with result
        job.status = JobStatus.COMPLETED
        job.processed_file_url = f"/downloads/{job_id}/processed_{os.path.basename(file_path)}"
        db.commit()
        
    except Exception as e:
        # Update job with error
        db = next(get_db())
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            db.commit()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
