import pytest
from decimal import Decimal


def test_create_quote_unauthenticated(client):
    """Test creating quote without authentication"""
    response = client.post(
        "/quote",
        json={
            "send_country": "Tanzania",
            "receive_country": "South Korea",
            "send_amount": 100000,
            "send_currency": "TZS",
            "receive_currency": "KRW"
        }
    )
    assert response.status_code == 403


def test_create_quote_success(client, auth_headers):
    """Test successful quote creation"""
    response = client.post(
        "/quote",
        headers=auth_headers,
        json={
            "send_country": "Tanzania",
            "receive_country": "South Korea",
            "send_amount": 100000,
            "send_currency": "TZS",
            "receive_currency": "KRW"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["send_amount"] == 100000
    assert "fx_rate" in data
    assert "fee_amount" in data
    assert "receive_amount" in data
    assert "expires_at" in data


def test_create_quote_invalid_amount(client, auth_headers):
    """Test quote with invalid amount"""
    response = client.post(
        "/quote",
        headers=auth_headers,
        json={
            "send_country": "Tanzania",
            "receive_country": "South Korea",
            "send_amount": -1000,  # Invalid
            "send_currency": "TZS",
            "receive_currency": "KRW"
        }
    )
    # Should fail validation
    assert response.status_code >= 400


def test_create_quote_missing_fields(client, auth_headers):
    """Test quote with missing required fields"""
    response = client.post(
        "/quote",
        headers=auth_headers,
        json={
            "send_country": "Tanzania",
            "receive_country": "South Korea"
            # Missing amount and currencies
        }
    )
    assert response.status_code == 422
