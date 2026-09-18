from models.product import Product
from models.purchase import Purchase
from models.purchase import PurchaseItem
from models.inventory_movement import InventoryMovement


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


def create_supplier(client, token):
    response = client.post(
        "/suppliers",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "name": "Supplier Purchase Test",
            "phone": "08123456789",
            "email": "purchase@test.local",
            "address": "Alamat Supplier"
        }
    )

    assert response.status_code == 200

    return response.json()["supplier"]["id"]


def test_get_purchases(client):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.get(
        "/purchases",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["purchases"] == []


def test_create_purchase(client, db):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    supplier_id = create_supplier(
        client,
        token
    )

    response = client.post(
        "/purchases",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "supplier_id": supplier_id,
            "purchase_date": "2026-09-18",
            "items": [
                {
                    "product_id": 1,
                    "quantity": 10,
                    "purchase_price": 3000
                }
            ]
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    purchase = data["purchase"]

    assert purchase["status"] == "DRAFT"
    assert purchase["total_amount"] == 30000

    db.expire_all()

    saved_purchase = db.get(
        Purchase,
        purchase["id"]
    )

    assert saved_purchase is not None
    assert saved_purchase.status == "DRAFT"
    assert saved_purchase.total_amount == 30000

    items = (
        db.query(PurchaseItem)
        .filter(
            PurchaseItem.purchase_id
            == saved_purchase.id
        )
        .all()
    )

    assert len(items) == 1
    assert items[0].product_id == 1
    assert items[0].quantity == 10


def test_receive_purchase_increases_stock(
    client,
    db
):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    supplier_id = create_supplier(
        client,
        token
    )

    create_response = client.post(
        "/purchases",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "supplier_id": supplier_id,
            "purchase_date": "2026-09-18",
            "items": [
                {
                    "product_id": 1,
                    "quantity": 10,
                    "purchase_price": 3000
                }
            ]
        }
    )

    assert create_response.status_code == 200

    purchase_id = (
        create_response.json()
        ["purchase"]["id"]
    )

    response = client.post(
        f"/purchases/{purchase_id}/receive",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    db.expire_all()

    product = db.get(
        Product,
        1
    )

    assert product.current_stock == 30

    purchase = db.get(
        Purchase,
        purchase_id
    )

    assert purchase.status == "RECEIVED"

    movements = (
        db.query(InventoryMovement)
        .filter(
            InventoryMovement.reference_type
            == "PURCHASE",
            InventoryMovement.reference_id
            == purchase_id
        )
        .all()
    )

    assert len(movements) == 1

    movement = movements[0]

    assert movement.movement_type == "PURCHASE"
    assert movement.quantity == 10
    assert movement.stock_before == 20
    assert movement.stock_after == 30


def test_receive_purchase_cannot_be_received_twice(
    client,
    db
):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    supplier_id = create_supplier(
        client,
        token
    )

    create_response = client.post(
        "/purchases",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "supplier_id": supplier_id,
            "purchase_date": "2026-09-18",
            "items": [
                {
                    "product_id": 1,
                    "quantity": 10,
                    "purchase_price": 3000
                }
            ]
        }
    )

    purchase_id = (
        create_response.json()
        ["purchase"]["id"]
    )

    first_receive = client.post(
        f"/purchases/{purchase_id}/receive",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert first_receive.status_code == 200

    second_receive = client.post(
        f"/purchases/{purchase_id}/receive",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert second_receive.status_code == 400

    data = second_receive.json()

    assert data["success"] is False

    db.expire_all()

    product = db.get(
        Product,
        1
    )

    # Stok hanya boleh bertambah sekali.
    assert product.current_stock == 30

    movements = (
        db.query(InventoryMovement)
        .filter(
            InventoryMovement.reference_type
            == "PURCHASE",
            InventoryMovement.reference_id
            == purchase_id
        )
        .all()
    )

    assert len(movements) == 1