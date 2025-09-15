#!/usr/bin/env python3
"""
Startup script for the Silence Remover backend
"""
import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if required system dependencies are installed"""
    print("Checking system requirements...")
    
    # Check if ffmpeg is installed
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        print("✓ FFmpeg is installed")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ FFmpeg is not installed. Please install FFmpeg first.")
        print("  Windows: Download from https://ffmpeg.org/download.html")
        print("  macOS: brew install ffmpeg")
        print("  Ubuntu: sudo apt install ffmpeg")
        return False
    
    # Check if Python dependencies are installed
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        print("✓ Python dependencies are installed")
    except ImportError as e:
        print(f"✗ Missing Python dependency: {e}")
        print("  Run: pip install -r requirements.txt")
        return False
    
    return True

def setup_database():
    """Setup database tables"""
    print("Setting up database...")
    try:
        from database import engine, Base
        from models import User, Job, Payment
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created")
        return True
    except Exception as e:
        print(f"✗ Database setup failed: {e}")
        return False

def start_server():
    """Start the FastAPI server"""
    print("Starting server...")
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"✗ Failed to start server: {e}")
        return False

def main():
    """Main startup function"""
    print("🚀 Starting Silence Remover Backend")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Setup database
    if not setup_database():
        sys.exit(1)
    
    # Start server
    print("\n✅ All checks passed! Starting server...")
    print("📡 Server will be available at: http://localhost:8000")
    print("📚 API docs will be available at: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 50)
    
    start_server()

if __name__ == "__main__":
    main()
