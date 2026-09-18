from models.product import Product
from models.transaction import Transaction
from models.transaction import TransactionItem
from models.inventory_movement import InventoryMovement
from models.audit_log import AuditLog


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


def test_get_pos_products(client):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.get(
        "/pos/products",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert len(data["products"]) == 1

    product = data["products"][0]

    assert product["id"] == 1
    assert product["name"] == "Produk Test"
    assert product["selling_price"] == 5000
    assert product["current_stock"] == 20


def test_create_transaction_success(client, db):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.post(
        "/transactions",
        headers={
            "Authorization": f"Bearer {token}"
        },
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

    data = response.json()

    assert data["success"] is True

    transaction = data["transaction"]

    assert transaction["subtotal"] == 10000
    assert transaction["discount"] == 0
    assert transaction["total_amount"] == 10000
    assert transaction["payment_amount"] == 10000
    assert transaction["change_amount"] == 0
    assert transaction["payment_method"] == "CASH"
    assert transaction["status"] == "COMPLETED"

    db.expire_all()

    product = db.get(Product, 1)

    assert product.current_stock == 18

    saved_transaction = db.get(
        Transaction,
        transaction["id"]
    )

    assert saved_transaction is not None

    transaction_items = (
        db.query(TransactionItem)
        .filter(
            TransactionItem.transaction_id
            == saved_transaction.id
        )
        .all()
    )

    assert len(transaction_items) == 1
    assert transaction_items[0].product_id == 1
    assert transaction_items[0].quantity == 2

    movements = (
        db.query(InventoryMovement)
        .filter(
            InventoryMovement.reference_type
            == "TRANSACTION",
            InventoryMovement.reference_id
            == saved_transaction.id
        )
        .all()
    )

    assert len(movements) == 1

    movement = movements[0]

    assert movement.movement_type == "SALE"
    assert movement.quantity == 2
    assert movement.stock_before == 20
    assert movement.stock_after == 18

    audit_logs = (
        db.query(AuditLog)
        .filter(
            AuditLog.entity == "TRANSACTION",
            AuditLog.entity_id
            == saved_transaction.id
        )
        .all()
    )

    assert len(audit_logs) == 1


def test_transaction_payment_insufficient(client, db):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.post(
        "/transactions",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "items": [
                {
                    "product_id": 1,
                    "quantity": 2
                }
            ],
            "discount": 0,
            "payment_method": "CASH",
            "payment_amount": 5000
        }
    )

    assert response.status_code == 400

    data = response.json()

    assert data["success"] is False
    assert data["message"] == (
        "Jumlah pembayaran tidak mencukupi"
    )

    db.expire_all()

    product = db.get(Product, 1)

    # Stok tidak boleh berubah
    assert product.current_stock == 20

    transactions = db.query(Transaction).all()

    # Transaksi juga tidak boleh tersimpan
    assert len(transactions) == 0


def test_transaction_stock_insufficient(client, db):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.post(
        "/transactions",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "items": [
                {
                    "product_id": 1,
                    "quantity": 100
                }
            ],
            "discount": 0,
            "payment_method": "CASH",
            "payment_amount": 500000
        }
    )

    assert response.status_code == 400

    data = response.json()

    assert data["success"] is False
    assert data["message"] == (
        "Stok Produk Test tidak mencukupi"
    )

    db.expire_all()

    product = db.get(Product, 1)

    assert product.current_stock == 20

    transactions = db.query(Transaction).all()

    assert len(transactions) == 0


def test_transaction_discount_cannot_exceed_subtotal(
    client,
    db
):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.post(
        "/transactions",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "items": [
                {
                    "product_id": 1,
                    "quantity": 2
                }
            ],
            "discount": 15000,
            "payment_method": "CASH",
            "payment_amount": 10000
        }
    )

    assert response.status_code == 400

    data = response.json()

    assert data["success"] is False
    assert data["message"] == (
        "Diskon tidak boleh melebihi subtotal"
    )

    db.expire_all()

    product = db.get(Product, 1)

    assert product.current_stock == 20

    transactions = db.query(Transaction).all()

    assert len(transactions) == 0

def test_duplicate_product_quantity_is_aggregated(
    client,
    db
):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.post(
        "/transactions",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "items": [
                {
                    "product_id": 1,
                    "quantity": 15
                },
                {
                    "product_id": 1,
                    "quantity": 10
                }
            ],
            "discount": 0,
            "payment_method": "CASH",
            "payment_amount": 200000
        }
    )

    assert response.status_code == 400

    data = response.json()

    assert data["success"] is False
    assert data["message"] == (
        "Stok Produk Test tidak mencukupi"
    )

    db.expire_all()

    product = db.get(Product, 1)

    assert product.current_stock == 20

    transactions = db.query(Transaction).all()

    assert len(transactions) == 0

def test_failed_transaction_leaves_no_partial_data(
    client,
    db
):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    response = client.post(
        "/transactions",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "items": [
                {
                    "product_id": 1,
                    "quantity": 2
                }
            ],
            "discount": 0,
            "payment_method": "CASH",
            "payment_amount": 5000
        }
    )

    assert response.status_code == 400

    db.expire_all()

    product = db.get(Product, 1)

    assert product.current_stock == 20

    transactions = db.query(Transaction).all()

    assert len(transactions) == 0

    transaction_items = (
        db.query(TransactionItem).all()
    )

    assert len(transaction_items) == 0

    movements = (
        db.query(InventoryMovement).all()
    )

    assert len(movements) == 0

    audit_logs = (
        db.query(AuditLog)
        .filter(
            AuditLog.entity == "TRANSACTION"
        )
        .all()
    )

    assert len(audit_logs) == 0

def test_get_transactions(client):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    create_response = client.post(
        "/transactions",
        headers={
            "Authorization": f"Bearer {token}"
        },
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

    assert create_response.status_code == 200

    response = client.get(
        "/transactions",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert len(data["transactions"]) == 1

    transaction = data["transactions"][0]

    assert transaction["total_amount"] == 10000
    assert transaction["payment_method"] == "CASH"
    assert transaction["status"] == "COMPLETED"

def test_get_transaction_detail(client):
    token = get_token(
        client,
        "cashier@test.local",
        "cashier123"
    )

    create_response = client.post(
        "/transactions",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "items": [
                {
                    "product_id": 1,
                    "quantity": 2
                }
            ],
            "discount": 500,
            "payment_method": "CASH",
            "payment_amount": 10000
        }
    )

    assert create_response.status_code == 200

    transaction_id = (
        create_response.json()
        ["transaction"]["id"]
    )

    response = client.get(
        f"/transactions/{transaction_id}",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    transaction = data["transaction"]

    assert transaction["id"] == transaction_id
    assert transaction["subtotal"] == 10000
    assert transaction["discount"] == 500
    assert transaction["total_amount"] == 9500

    assert len(transaction["items"]) == 1

    item = transaction["items"][0]

    assert item["product_id"] == 1
    assert item["product_name"] == "Produk Test"
    assert item["quantity"] == 2
    assert item["selling_price"] == 5000
    assert item["subtotal"] == 10000