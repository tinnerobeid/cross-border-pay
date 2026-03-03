.PHONY: help install install-backend install-frontend dev-backend dev-frontend dev test test-backend lint format seed reset-db clean docker-build docker-up docker-down

help:
	@echo "Zuripay Cross-Border Payment Platform - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install              Install all dependencies"
	@echo "  make install-backend      Install backend dependencies"
	@echo "  make install-frontend     Install frontend dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev                  Run both backend and frontend"
	@echo "  make dev-backend          Run backend server (port 8000)"
	@echo "  make dev-frontend         Run frontend (port 5173)"
	@echo ""
	@echo "Database:"
	@echo "  make seed                 Seed database with sample data"
	@echo "  make reset-db             Reset database (WARNING: destroys data)"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test                 Run all tests"
	@echo "  make test-backend         Run backend tests only"
	@echo "  make lint                 Run linters"
	@echo "  make format               Format code"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build         Build Docker images"
	@echo "  make docker-up            Start Docker containers"
	@echo "  make docker-down          Stop Docker containers"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean                Clean all generated files"

install: install-backend install-frontend

install-backend:
	cd backend && pip install -r requirements.txt

install-frontend:
	cd frontend/zuripay-frontend && npm install

dev:
	@echo "Starting both services..."
	@echo "Backend: http://127.0.0.1:8000"
	@echo "Frontend: http://127.0.0.1:5173"
	@echo "API Docs: http://127.0.0.1:8000/docs"
	@echo ""
	@(cd backend && uvicorn app.main:app --reload &) && (cd frontend/zuripay-frontend && npm run dev)

dev-backend:
	cd backend && uvicorn app.main:app --reload

dev-frontend:
	cd frontend/zuripay-frontend && npm run dev

seed:
	cd backend && python scripts/seed.py

reset-db: clean
	cd backend && rm -f zuripay.db && python scripts/seed.py

test: test-backend

test-backend:
	cd backend && pytest -v

test-coverage:
	cd backend && pytest --cov=app tests/

lint:
	cd backend && pylint app/
	cd frontend/zuripay-frontend && npm run lint

format:
	cd backend && black . && isort .

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .coverage -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/logs/*.log
	rm -rf backend/htmlcov
	rm -rf frontend/zuripay-frontend/dist
	rm -rf frontend/zuripay-frontend/node_modules/.vite

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
