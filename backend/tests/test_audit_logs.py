from models.audit_log import AuditLog


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


def test_owner_can_get_audit_logs(client):
    headers = login(
        client,
        "owner@test.local",
        "owner123"
    )

    response = client.get(
        "/audit-logs",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "audit_logs" in data
    assert isinstance(data["audit_logs"], list)


def test_admin_can_get_audit_logs(client):
    headers = login(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.get(
        "/audit-logs",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True


def test_cashier_cannot_get_audit_logs(client):
    headers = login(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.get(
        "/audit-logs",
        headers=headers
    )

    assert response.status_code == 403


def test_transaction_creates_audit_log(client, db):
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

    audit_log = (
        db.query(AuditLog)
        .filter(
            AuditLog.entity == "TRANSACTION"
        )
        .first()
    )

    assert audit_log is not None
    assert audit_log.action == "CREATE"
    assert audit_log.entity_id is not None