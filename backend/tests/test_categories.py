from models.category import Category


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


def test_get_categories(client):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.get(
        "/categories",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert len(data["categories"]) == 1
    assert data["categories"][0]["name"] == "Makanan"


def test_create_category(client, db):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.post(
        "/categories",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "name": "Minuman",
            "description": "Kategori minuman"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    category_id = data["category"]["id"]

    db.expire_all()

    category = db.get(
        Category,
        category_id
    )

    assert category is not None
    assert category.name == "Minuman"


def test_create_duplicate_category(client):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.post(
        "/categories",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "name": "Makanan",
            "description": "Kategori duplikat"
        }
    )

    assert response.status_code == 400

    data = response.json()

    assert data["success"] is False


def test_update_category(client, db):
    token = get_token(
        client,
        "admin@test.local",
        "admin123"
    )

    response = client.put(
        "/categories/1",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "name": "Makanan Updated",
            "description": "Kategori yang diperbarui"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    db.expire_all()

    category = db.get(
        Category,
        1
    )

    assert category.name == "Makanan Updated"
    assert category.description == (
        "Kategori yang diperbarui"
    )