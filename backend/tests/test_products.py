from models.product import Product


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


def test_get_products(client):
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

    data = response.json()

    assert data["success"] is True
    assert len(data["products"]) == 1

    product = data["products"][0]

    assert product["sku"] == "TEST-001"
    assert product["name"] == "Produk Test"
    assert product["selling_price"] == 5000


def test_create_product(client, db):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.post(
        "/products",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "sku": "TEST-002",
            "barcode": "8999999999998",
            "name": "Produk Baru",
            "category_id": 1,
            "unit": "pcs",
            "purchase_price": 4000,
            "selling_price": 6000,
            "current_stock": 10,
            "minimum_stock": 3,
            "expiration_date": None,
            "status": "active"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    product_id = data["product"]["id"]

    db.expire_all()

    product = db.get(
        Product,
        product_id
    )

    assert product is not None
    assert product.sku == "TEST-002"
    assert product.name == "Produk Baru"
    assert product.current_stock == 10


def test_create_product_duplicate_sku(client):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.post(
        "/products",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "sku": "TEST-001",
            "barcode": "8999999999997",
            "name": "Produk Duplikat",
            "category_id": 1,
            "unit": "pcs",
            "purchase_price": 4000,
            "selling_price": 6000,
            "current_stock": 5,
            "minimum_stock": 2,
            "expiration_date": None,
            "status": "active"
        }
    )

    assert response.status_code == 400

    data = response.json()

    assert data["success"] is False


def test_update_product(client, db):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.put(
        "/products/1",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "name": "Produk Test Updated",
            "selling_price": 5500,
            "minimum_stock": 7
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

    assert product.name == "Produk Test Updated"
    assert product.selling_price == 5500
    assert product.minimum_stock == 7
    assert product.current_stock == 20