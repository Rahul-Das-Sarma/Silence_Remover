@echo off
REM AI Silence Removal Web App - Windows Startup Script

echo 🚀 Starting AI Silence Removal Web App
echo ======================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] pnpm is not installed. Installing pnpm...
    npm install -g pnpm
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if FFmpeg is installed
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] FFmpeg is not installed. Please install FFmpeg first.
    echo [INFO] Download from: https://ffmpeg.org/download.html
    pause
    exit /b 1
)

echo [SUCCESS] All system requirements are met!

REM Setup frontend
echo [INFO] Setting up frontend...
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    pnpm install
) else (
    echo [INFO] Frontend dependencies already installed.
)

REM Setup backend
echo [INFO] Setting up backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
call venv\Scripts\activate.bat
if not exist "venv\pyvenv.cfg" (
    echo [INFO] Installing backend dependencies...
    pip install -r requirements.txt
) else (
    echo [INFO] Backend dependencies already installed.
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating .env file from template...
    copy env.example .env
    echo [WARNING] Please edit backend\.env with your configuration!
)

cd ..

echo [SUCCESS] Setup complete!
echo [INFO] Starting services...
echo [INFO] Frontend: http://localhost:5173
echo [INFO] Backend API: http://localhost:8000
echo [INFO] API Docs: http://localhost:8000/docs
echo [INFO] Press Ctrl+C to stop all services

REM Start backend in background
cd backend
call venv\Scripts\activate.bat
start /B python start.py
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
pnpm dev

pause
