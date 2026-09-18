import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db

from models.user import User
from models.category import Category
from models.product import Product

from pwdlib import PasswordHash


TEST_DATABASE_URL = (
    "mysql+pymysql://root:@127.0.0.1:3306/retailflow_test"
)

test_engine = create_engine(
    TEST_DATABASE_URL,
    echo=False
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def client():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    db = TestingSessionLocal()

    password_hash = PasswordHash.recommended()

    owner = User(
        name="Test Owner",
        email="owner@test.local",
        password_hash=password_hash.hash("owner123"),
        role="owner",
        is_active=True
    )

    admin = User(
        name="Test Admin",
        email="admin@test.local",
        password_hash=password_hash.hash("admin123"),
        role="admin",
        is_active=True
    )

    cashier = User(
        name="Test Cashier",
        email="cashier@test.local",
        password_hash=password_hash.hash("cashier123"),
        role="cashier",
        is_active=True
    )

    category = Category(
        name="Makanan",
        description="Kategori makanan untuk testing"
    )

    db.add_all([
        owner,
        admin,
        cashier,
        category
    ])

    db.commit()

    db.refresh(category)

    product = Product(
        sku="TEST-001",
        barcode="8999999999999",
        name="Produk Test",
        category_id=category.id,
        unit="pcs",
        purchase_price=3000,
        selling_price=5000,
        current_stock=20,
        minimum_stock=5,
        status="active"
    )

    db.add(product)

    db.commit()

    db.close()

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def db(client):
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()