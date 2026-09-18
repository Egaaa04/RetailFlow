def test_login_owner_success(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "owner@test.local",
            "password": "owner123"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == "owner@test.local"
    assert data["user"]["role"] == "owner"


def test_login_wrong_password(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "owner@test.local",
            "password": "password-salah"
        }
    )

    assert response.status_code == 401

    data = response.json()

    assert data["success"] is False