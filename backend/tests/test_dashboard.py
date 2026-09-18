from datetime import date

from models.product import Product
from models.transaction import Transaction


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


def test_owner_can_get_dashboard(client):
    headers = login(
        client,
        "owner@test.local",
        "owner123"
    )

    response = client.get(
        "/dashboard",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "summary" in data
    assert "recent_transactions" in data
    assert "low_stock_list" in data


def test_admin_can_get_dashboard(client):
    headers = login(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.get(
        "/dashboard",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True


def test_cashier_can_get_dashboard(client):
    headers = login(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.get(
        "/dashboard",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True


def test_dashboard_reflects_transaction(client, db):
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

    dashboard_response = client.get(
        "/dashboard",
        headers=headers
    )

    assert dashboard_response.status_code == 200

    data = dashboard_response.json()

    assert data["success"] is True

    summary = data["summary"]

    assert summary["today_transactions"] == 1
    assert float(summary["today_sales"]) == 10000