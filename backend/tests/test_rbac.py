def get_token(client, email, password):
    response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def test_owner_can_access_products(client):
    token = get_token(
        client,
        "owner@test.local",
        "owner123"
    )

    response = client.get(
        "/products",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200


def test_admin_can_access_products(client):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.get(
        "/products",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200


def test_cashier_cannot_access_products(client):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.get(
        "/products",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 403


def test_owner_can_access_users(client):
    token = get_token(
        client,
        "owner@test.local",
        "owner123"
    )

    response = client.get(
        "/users",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200


def test_admin_cannot_access_users(client):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.get(
        "/users",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 403


def test_cashier_cannot_access_users(client):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.get(
        "/users",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 403