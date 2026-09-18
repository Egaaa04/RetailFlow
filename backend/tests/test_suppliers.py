from models.supplier import Supplier


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


def test_get_suppliers(client):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.get(
        "/suppliers",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["suppliers"] == []


def test_create_supplier(client, db):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.post(
        "/suppliers",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "name": "Supplier Test",
            "phone": "08123456789",
            "email": "supplier@test.local",
            "address": "Alamat Supplier"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    supplier_id = data["supplier"]["id"]

    db.expire_all()

    supplier = db.get(
        Supplier,
        supplier_id
    )

    assert supplier is not None
    assert supplier.name == "Supplier Test"
    assert supplier.phone == "08123456789"
    assert supplier.is_active is True


def test_update_supplier(client, db):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    create_response = client.post(
        "/suppliers",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "name": "Supplier Lama",
            "phone": "08000000000",
            "email": "lama@test.local",
            "address": "Alamat Lama"
        }
    )

    assert create_response.status_code == 200

    supplier_id = (
        create_response.json()
        ["supplier"]["id"]
    )

    response = client.put(
        f"/suppliers/{supplier_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "name": "Supplier Updated",
            "phone": "08111111111",
            "email": "updated@test.local",
            "address": "Alamat Baru"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    db.expire_all()

    supplier = db.get(
        Supplier,
        supplier_id
    )

    assert supplier.name == "Supplier Updated"
    assert supplier.phone == "08111111111"
    assert supplier.email == "updated@test.local"
    assert supplier.address == "Alamat Baru"