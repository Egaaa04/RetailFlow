def login(client, email, password):
    response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    data = response.json()

    return {
        "Authorization": f"Bearer {data['access_token']}"
    }


def create_transaction(client):
    headers = login(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.post(
        "/transactions",
        headers=headers,
        json={
            "items": [
                {
                    "product_id": 1,
                    "quantity": 2
                }
            ],
            "discount": 0,
            "payment_method": "CASH",
            "payment_amount": 10000
        }
    )

    assert response.status_code == 200


def test_owner_can_get_sales_report(client):
    headers = login(
        client,
        "owner@test.local",
        "owner123"
    )

    response = client.get(
        "/reports/sales",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True


def test_cashier_cannot_get_sales_report(client):
    headers = login(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.get(
        "/reports/sales",
        headers=headers
    )

    assert response.status_code == 403


def test_owner_can_get_products_report(client):
    headers = login(
        client,
        "owner@test.local",
        "owner123"
    )

    create_transaction(client)

    response = client.get(
        "/reports/products",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True


def test_owner_can_get_inventory_report(client):
    headers = login(
        client,
        "owner@test.local",
        "owner123"
    )

    response = client.get(
        "/reports/inventory",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True