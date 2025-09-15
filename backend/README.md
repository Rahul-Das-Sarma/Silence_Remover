# Silence Remover Backend

A FastAPI-based backend service for AI-powered silence removal from videos.

## Features

- **Free Processing**: FFmpeg + Remsi for videos under 1 minute
- **Premium Processing**: OpenAI Whisper for high-accuracy processing
- **User Authentication**: JWT-based authentication system
- **Payment Integration**: Stripe payment processing
- **Job Management**: Background processing with Celery
- **File Storage**: Local file storage with S3 support

## Prerequisites

### System Requirements

1. **Python 3.8+**
2. **FFmpeg** - Required for video processing
3. **PostgreSQL** - Database (or SQLite for development)
4. **Redis** - For Celery task queue

### FFmpeg Installation

**Windows:**

1. Download from https://ffmpeg.org/download.html
2. Add to PATH environment variable

**macOS:**

```bash
brew install ffmpeg
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install ffmpeg
```

## Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd silence-remover/backend
```

2. **Create virtual environment:**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**

```bash
pip install -r requirements.txt
```

4. **Setup environment variables:**

```bash
cp env.example .env
# Edit .env with your configuration
```

5. **Setup database:**

```bash
# For PostgreSQL
createdb silence_remover

# For SQLite (development)
# No setup required
```

## Configuration

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/silence_remover

# JWT Secret
SECRET_KEY=your-secret-key-here

# Redis (for Celery)
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# OpenAI (optional, for API usage)
OPENAI_API_KEY=your_openai_api_key_here

# AWS S3 (optional, for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1
```

## Running the Application

### Development Mode

```bash
python start.py
```

This will:

- Check system requirements
- Setup database tables
- Start the development server

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### With Celery Worker

For background processing, start a Celery worker:

```bash
celery -A main.celery_app worker --loglevel=info
```

## API Documentation

Once the server is running, visit:

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Video Processing

- `POST /jobs` - Create processing job
- `GET /jobs/{job_id}` - Get job status
- `GET /jobs` - List user jobs

### Payments

- `POST /payments` - Create payment intent

## Processing Methods

### Free Processing (FFmpeg + Remsi)

- Videos under 1 minute
- Uses FFmpeg silence detection
- Fast processing
- Good accuracy for most content

### Premium Processing (OpenAI Whisper)

- Any video length
- AI-powered speech detection
- Superior accuracy
- Requires payment

## File Structure

```
backend/
├── main.py              # FastAPI application
├── models.py            # Database models
├── schemas.py           # Pydantic schemas
├── database.py          # Database configuration
├── auth.py              # Authentication utilities
├── video_processor.py   # Video processing logic
├── payment_service.py   # Payment integration
├── requirements.txt     # Python dependencies
├── start.py            # Startup script
└── README.md           # This file
```

## Development

### Adding New Features

1. **Models**: Add new database models in `models.py`
2. **Schemas**: Add Pydantic schemas in `schemas.py`
3. **Endpoints**: Add new API endpoints in `main.py`
4. **Processing**: Extend video processing in `video_processor.py`

### Testing

```bash
# Run tests (when implemented)
pytest

# Test specific endpoint
curl -X POST "http://localhost:8000/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123", "full_name": "Test User"}'
```

## Deployment

### Docker (Recommended)

```dockerfile
FROM python:3.9-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

```env
DATABASE_URL=postgresql://user:password@db:5432/silence_remover
SECRET_KEY=your-production-secret-key
REDIS_URL=redis://redis:6379
STRIPE_PUBLIC_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key
```

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure FFmpeg is installed and in PATH
2. **Database connection failed**: Check DATABASE_URL and database server
3. **Redis connection failed**: Ensure Redis server is running
4. **File upload fails**: Check file size limits and permissions

### Logs

Check application logs for detailed error information:

```bash
# Development
python start.py

# Production
uvicorn main:app --log-level debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
