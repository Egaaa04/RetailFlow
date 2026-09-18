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


def test_purchase_increases_stock(client):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.post(
        "/inventory/movements",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "product_id": 1,
            "movement_type": "PURCHASE",
            "quantity": 10,
            "notes": "Test purchase"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["movement"]["stock_before"] == 20
    assert data["movement"]["stock_after"] == 30


def test_damage_decreases_stock(client):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.post(
        "/inventory/movements",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "product_id": 1,
            "movement_type": "DAMAGE",
            "quantity": 2,
            "notes": "Test damage"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["movement"]["stock_before"] == 20
    assert data["movement"]["stock_after"] == 18


def test_insufficient_stock_is_rejected(client):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.post(
        "/inventory/movements",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "product_id": 1,
            "movement_type": "DAMAGE",
            "quantity": 100,
            "notes": "Test insufficient stock"
        }
    )

    assert response.status_code == 400

    data = response.json()

    assert data["success"] is False