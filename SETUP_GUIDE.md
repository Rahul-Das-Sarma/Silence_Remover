# AI Silence Removal Web App - Setup Guide

## 🎯 Quick Start

### Option 1: Automated Setup (Recommended)

**For Linux/macOS:**

```bash
./start.sh
```

**For Windows:**

```cmd
start.bat
```

### Option 2: Manual Setup

1. **Install Prerequisites:**

   - Node.js 18+ and pnpm
   - Python 3.8+
   - FFmpeg
   - PostgreSQL (or SQLite for development)
   - Redis (for background tasks)

2. **Setup Frontend:**

   ```bash
   pnpm install
   pnpm dev
   ```

3. **Setup Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp env.example .env
   # Edit .env with your configuration
   python start.py
   ```

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/silence_remover

# JWT Secret
SECRET_KEY=your-secret-key-here

# Redis
REDIS_URL=redis://localhost:6379

# Stripe (for payments)
STRIPE_PUBLIC_KEY=pk_test_your_public_key
STRIPE_SECRET_KEY=sk_test_your_secret_key

# OpenAI (optional)
OPENAI_API_KEY=your_openai_api_key
```

## 🚀 Features Implemented

### ✅ Frontend Components

- **VideoUpload**: Drag-and-drop file upload with validation
- **AuthModal**: User registration and login
- **JobStatus**: Real-time processing status tracking
- **PricingCard**: Pricing display and selection
- **Main App**: Complete application with routing

### ✅ Backend API

- **Authentication**: JWT-based user auth
- **Video Processing**: FFmpeg + Remsi integration
- **AI Processing**: OpenAI Whisper integration
- **Payment System**: Stripe integration
- **Job Management**: Background processing with Celery
- **Database**: User, job, and payment models

### ✅ Processing Methods

- **Free Tier**: FFmpeg + Remsi for videos ≤1 minute
- **Premium Tier**: OpenAI Whisper for any length
- **Silence Detection**: Advanced algorithms for accurate detection
- **Video Output**: High-quality processed videos

## 📊 Architecture

```
Frontend (React) → Backend API (FastAPI) → Video Processing → Storage → Download
```

### Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, PostgreSQL, Redis, Celery
- **Processing**: FFmpeg, Remsi, OpenAI Whisper
- **Payments**: Stripe
- **Deployment**: Docker, Docker Compose

## 🎯 Usage

### Free Processing

1. Upload video (≤1 minute)
2. Select "Free Processing"
3. Wait for processing
4. Download result

### Premium Processing

1. Create account
2. Upload any video
3. Select "Premium Processing"
4. Complete payment
5. Wait for AI processing
6. Download result

## 🔌 API Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /jobs` - Create processing job
- `GET /jobs/{job_id}` - Get job status
- `GET /jobs` - List user jobs
- `POST /payments` - Create payment intent

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

This starts:

- Frontend (React app)
- Backend (FastAPI)
- Celery worker
- PostgreSQL database
- Redis

## 🧪 Testing

### Frontend

```bash
pnpm test
```

### Backend

```bash
cd backend
pytest
```

### Manual Testing

1. Start the application
2. Upload a test video
3. Verify processing works
4. Check download functionality

## 📝 Development

### Adding Features

1. **Frontend**: Add components in `src/components/`
2. **Backend**: Add endpoints in `main.py`
3. **Processing**: Extend `video_processor.py`
4. **Database**: Add models in `models.py`

### File Structure

```
silence-remover/
├── src/                    # Frontend React app
├── backend/               # Python FastAPI backend
├── docker-compose.yml     # Docker setup
├── start.sh              # Linux/macOS startup
├── start.bat             # Windows startup
└── README.md             # Main documentation
```

## 🔒 Security

- JWT authentication
- Password hashing
- File upload validation
- CORS protection
- Input sanitization

## 📈 Performance

- Background processing
- File streaming
- Optimized video processing
- Caching strategies

## 🆘 Troubleshooting

### Common Issues

1. **FFmpeg not found**

   - Install FFmpeg and add to PATH
   - Verify with `ffmpeg -version`

2. **Database connection failed**

   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running

3. **Redis connection failed**

   - Check REDIS_URL in .env
   - Ensure Redis server is running

4. **Build errors**
   - Run `pnpm install` to update dependencies
   - Check Node.js version (18+)

### Logs

- Frontend: Browser console
- Backend: Terminal output
- Docker: `docker-compose logs`

## 🎉 Success!

Your AI Silence Removal Web App is now ready!

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

Start uploading videos and removing silence! 🎥✨
