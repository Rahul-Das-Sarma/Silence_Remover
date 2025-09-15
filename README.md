# AI Silence Removal Web App

A comprehensive web application that removes silent sections from videos using AI. Features both free processing for short videos and premium AI-powered processing for longer content.

## 🚀 Features

### Free Tier (≤1 minute videos)

- **FFmpeg + Remsi Processing**: Fast, open-source silence detection
- **No Account Required**: Instant processing for short videos
- **High Accuracy**: Good results for most content types

### Premium Tier (>1 minute videos)

- **OpenAI Whisper Integration**: AI-powered speech detection
- **Superior Accuracy**: Advanced AI processing for any video length
- **User Accounts**: Secure authentication and job management
- **Payment Integration**: Pay-per-minute pricing ($0.006/min)

### Core Features

- 🎥 **Video Upload**: Drag-and-drop interface with file validation
- 🔐 **User Authentication**: JWT-based auth with registration/login
- 💳 **Payment Processing**: Stripe integration for premium features
- 📊 **Job Management**: Real-time status tracking and progress indicators
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🌙 **Dark Mode**: Built-in dark/light theme support

## 🏗️ Architecture

```
Frontend (React) → Backend API (FastAPI) → Video Processing → Storage → Download
```

### Tech Stack

**Frontend:**

- React 19 with TypeScript
- Tailwind CSS for styling
- React Dropzone for file uploads
- React Hot Toast for notifications
- Lucide React for icons

**Backend:**

- FastAPI (Python) for REST API
- PostgreSQL for data storage
- Redis + Celery for background processing
- FFmpeg for video processing
- OpenAI Whisper for AI processing
- Stripe for payments

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js 18+** and **pnpm**
- **Python 3.8+**
- **FFmpeg** (for video processing)
- **PostgreSQL** (or SQLite for development)
- **Redis** (for background tasks)

### Quick Start

1. **Clone the repository:**

```bash
git clone <repository-url>
cd silence-remover
```

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
python start.py
```

4. **Access the application:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
silence-remover/
├── src/                          # Frontend React app
│   ├── components/              # React components
│   │   ├── VideoUpload.tsx     # File upload component
│   │   ├── AuthModal.tsx       # Authentication modal
│   │   ├── JobStatus.tsx       # Job status tracking
│   │   └── PricingCard.tsx     # Pricing display
│   ├── App.tsx                 # Main application
│   └── main.tsx                # Entry point
├── backend/                     # Python FastAPI backend
│   ├── main.py                 # FastAPI application
│   ├── models.py               # Database models
│   ├── schemas.py              # Pydantic schemas
│   ├── auth.py                 # Authentication logic
│   ├── video_processor.py      # Video processing
│   ├── payment_service.py      # Payment integration
│   └── requirements.txt        # Python dependencies
├── package.json                # Frontend dependencies
└── README.md                   # This file
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

# Stripe
STRIPE_PUBLIC_KEY=pk_test_your_public_key
STRIPE_SECRET_KEY=sk_test_your_secret_key

# OpenAI (optional)
OPENAI_API_KEY=your_openai_api_key
```

## 🎯 Usage

### Free Processing

1. Upload a video file (≤1 minute)
2. Select "Free Processing"
3. Wait for processing to complete
4. Download the processed video

### Premium Processing

1. Create an account or sign in
2. Upload any video file
3. Select "Premium Processing"
4. Complete payment (if required)
5. Wait for AI processing
6. Download the processed video

## 🔌 API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Video Processing

- `POST /jobs` - Create processing job
- `GET /jobs/{job_id}` - Get job status
- `GET /jobs` - List user jobs

### Payments

- `POST /payments` - Create payment intent

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
pnpm build
# Deploy dist/ folder
```

### Backend (Docker)

```bash
cd backend
docker build -t silence-remover-backend .
docker run -p 8000:8000 silence-remover-backend
```

### Environment Variables for Production

```env
DATABASE_URL=postgresql://user:password@db:5432/silence_remover
SECRET_KEY=your-production-secret-key
REDIS_URL=redis://redis:6379
STRIPE_PUBLIC_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key
```

## 🧪 Development

### Running Tests

```bash
# Frontend
pnpm test

# Backend
cd backend
pytest
```

### Adding New Features

1. **Frontend**: Add components in `src/components/`
2. **Backend**: Add endpoints in `main.py`
3. **Processing**: Extend `video_processor.py`
4. **Database**: Add models in `models.py`

## 📊 Processing Methods

### FFmpeg + Remsi (Free)

- Uses FFmpeg's silence detection
- Fast processing
- Good for most content
- Limited to 1-minute videos

### OpenAI Whisper (Premium)

- AI-powered speech detection
- Superior accuracy
- Works with any length
- Requires payment

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- File upload validation
- CORS protection
- Rate limiting (recommended for production)

## 📈 Performance

- Background processing with Celery
- File streaming for large uploads
- Optimized video processing
- Caching for frequently accessed data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Create a GitHub issue
- **Documentation**: Check the API docs at `/docs`
- **Community**: Join our Discord server

## 🗺️ Roadmap

- [ ] Batch processing for multiple videos
- [ ] Advanced silence detection settings
- [ ] Video preview before/after comparison
- [ ] Export options (different formats)
- [ ] API rate limiting and usage analytics
- [ ] Mobile app (React Native)
- [ ] Integration with cloud storage (S3, Google Drive)
