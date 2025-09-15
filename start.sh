#!/bin/bash

# AI Silence Removal Web App - Startup Script
# This script sets up and starts both frontend and backend services

set -e

echo "🚀 Starting AI Silence Removal Web App"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    
    # Check FFmpeg
    if ! command -v ffmpeg &> /dev/null; then
        print_error "FFmpeg is not installed. Please install FFmpeg first."
        print_status "Installation instructions:"
        print_status "  macOS: brew install ffmpeg"
        print_status "  Ubuntu: sudo apt install ffmpeg"
        print_status "  Windows: Download from https://ffmpeg.org/download.html"
        exit 1
    fi
    
    print_success "All system requirements are met!"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        pnpm install
    else
        print_status "Frontend dependencies already installed."
    fi
    
    print_success "Frontend setup complete!"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    if [ ! -f "venv/pyvenv.cfg" ] || [ ! -d "venv/lib" ]; then
        print_status "Installing backend dependencies..."
        pip install -r requirements.txt
    else
        print_status "Backend dependencies already installed."
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cp env.example .env
        print_warning "Please edit backend/.env with your configuration!"
    fi
    
    cd ..
    print_success "Backend setup complete!"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start backend in background
    print_status "Starting backend server..."
    cd backend
    source venv/bin/activate
    python start.py &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    print_status "Starting frontend server..."
    pnpm dev &
    FRONTEND_PID=$!
    
    print_success "Services started!"
    print_status "Frontend: http://localhost:5173"
    print_status "Backend API: http://localhost:8000"
    print_status "API Docs: http://localhost:8000/docs"
    
    # Function to cleanup on exit
    cleanup() {
        print_status "Shutting down services..."
        kill $BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        print_success "Services stopped!"
        exit 0
    }
    
    # Set trap to cleanup on script exit
    trap cleanup SIGINT SIGTERM
    
    # Wait for user to stop
    print_status "Press Ctrl+C to stop all services"
    wait
}

# Main execution
main() {
    check_requirements
    setup_frontend
    setup_backend
    start_services
}

# Run main function
main "$@"
