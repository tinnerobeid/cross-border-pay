# Local Development Setup

## Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

## Backend Setup

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
# Copy example configuration
cp .env.example .env

# Edit .env if needed (defaults work for SQLite MVP)
```

### 4. Initialize Database
```bash
# Create tables and seed sample data
python scripts/seed.py
```

### 5. Run Backend
```bash
# Development server with auto-reload
uvicorn app.main:app --reload

# Server will run on http://127.0.0.1:8000
# API docs: http://127.0.0.1:8000/docs
```

### 6. Run Tests
```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_auth.py

# Run with coverage report
pytest --cov=app tests/
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend/zuripay-frontend
npm install
```

### 2. Configure Environment (optional)
```bash
# Create .env file
echo "VITE_API_BASE_URL=http://127.0.0.1:8000" > .env.local
```

### 3. Run Development Server
```bash
npm run dev

# Frontend will run on http://localhost:5173
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

## Testing

### Backend Tests
```bash
# Run all tests
pytest

# With coverage
pytest --cov=app

# Specific test module
pytest tests/test_auth.py -v
```

### Test Structure
- `tests/test_auth.py` - Authentication endpoints
- `tests/test_kyc.py` - KYC submission and verification
- `tests/test_quote.py` - Quote calculation
- `conftest.py` - Pytest fixtures and configuration

## Database Management

### SQLite (Default)
Database is stored in `zuripay.db` in the backend root.

```bash
# Reset database
rm zuripay.db
python scripts/seed.py
```

### Switch to PostgreSQL (Optional)
1. Update `.env`:
```
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/zuripay
```

2. Create database:
```bash
createdb zuripay
```

3. Seed:
```bash
python scripts/seed.py
```

## Debugging

### Backend Logs
- Logs output to console and `logs/app.log`
- Configure log level in `app/core/logger.py`

### API Documentation
- Visit `http://127.0.0.1:8000/docs` for interactive Swagger UI
- Visit `http://127.0.0.1:8000/redoc` for ReDoc

### Test Credentials
After running `seed.py`:
- Email: `user@example.com` / Password: `password123`
- Email: `jane@example.com` / Password: `password123`
- Email: `admin@example.com` / Password: `admin123`

## Common Issues

### Port Already in Use
```bash
# Kill process on port 8000 (macOS/Linux)
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Module Not Found
```bash
# Ensure you're in correct directory and venv is activated
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

### CORS Errors
- Currently CORS is open to all origins for development
- In production, update `CORS_ORIGINS` in config

## Next Steps

1. **Add Alembic migrations** (once major schema changes complete)
2. **Set up CI/CD** with GitHub Actions
3. **Add containerization** with Docker
4. **Deploy to Azure** or preferred cloud provider
