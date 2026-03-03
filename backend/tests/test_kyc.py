import pytest
from app.models.kyc import KYCProfile


def test_get_kyc_status_unauthenticated(client):
    """Test getting KYC status without authentication"""
    response = client.get("/kyc")
    assert response.status_code == 403


def test_get_kyc_status_no_profile(client, auth_headers):
    """Test getting KYC status when no profile exists"""
    response = client.get("/kyc", headers=auth_headers)
    assert response.status_code == 200
    # Should return None/empty when no profile exists
    data = response.json()
    assert data is None or data == {}


def test_kyc_submit_missing_files(client, auth_headers):
    """Test KYC submission without required files"""
    response = client.post(
        "/kyc/submit",
        headers=auth_headers,
        data={
            "country": "Tanzania",
            "id_type": "passport",
            "id_number": "PA123456"
        }
    )
    assert response.status_code == 422  # Missing required file fields


def test_kyc_resubmit_approved(client, db_session, auth_headers, test_user):
    """Test that approved KYC cannot be resubmitted"""
    # Create approved KYC profile
    kyc = KYCProfile(
        user_id=test_user.id,
        country="Tanzania",
        id_type="passport",
        id_number="PA123456",
        status="approved"
    )
    db_session.add(kyc)
    db_session.commit()
    
    # Try to resubmit
    response = client.post(
        "/kyc/submit",
        headers=auth_headers,
        data={
            "country": "Tanzania",
            "id_type": "passport",
            "id_number": "PA654321"
        },
        files={
            "selfie": ("selfie.jpg", b"fake image data"),
            "id_front": ("id_front.jpg", b"fake image data")
        }
    )
    assert response.status_code == 400
    assert "already approved" in response.json()["detail"].lower()
