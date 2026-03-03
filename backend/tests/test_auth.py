import pytest
from app.core.security import hash_password


def test_register_success(client, db_session):
    """Test user registration"""
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "securepass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"


def test_register_duplicate_email(client, test_user):
    """Test registration with duplicate email"""
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",  # Already exists
            "full_name": "Different User",
            "password": "securepass123"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_login_success(client, test_user):
    """Test successful login"""
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post(
        "/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrongpass"}
    )
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


def test_login_wrong_password(client, test_user):
    """Test login with wrong password"""
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "wrongpass"}
    )
    assert response.status_code == 401


def test_register_invalid_email(client):
    """Test registration with invalid email"""
    response = client.post(
        "/auth/register",
        json={
            "email": "not-an-email",
            "full_name": "Test User",
            "password": "password123"
        }
    )
    assert response.status_code == 422
