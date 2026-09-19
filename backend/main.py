import os
import shutil


from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from pwdlib import PasswordHash
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field


from database import Base, engine, get_db
from models.user import User
from security import create_access_token, decode_access_token
from models.category import Category
from models.product import Product
from models.audit_log import AuditLog
from datetime import date, datetime
from models.inventory_movement import InventoryMovement
from models.supplier import Supplier
from models.purchase import Purchase, PurchaseItem
from models.transaction import Transaction, TransactionItem
from decimal import Decimal

from typing import List, Optional

password_hash = PasswordHash.recommended()
security = HTTPBearer()

app = FastAPI(
    title="RetailFlow API",
    description="Retail Point of Sale & Inventory Management System API",
    version="1.0.0"
)

UPLOAD_DIR = "uploads/products"

os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Data yang dikirim tidak valid",
            "errors": exc.errors()
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException
):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception
):
    print(
        f"Unhandled error: {exc}"
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Terjadi kesalahan pada server"
        }
    )


class LoginRequest(BaseModel):
    email: str
    password: str

class CreateUserRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class UpdateUserStatusRequest(BaseModel):
    is_active: bool

class ResetPasswordRequest(BaseModel):
    new_password: str

class CreateCategoryRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=255
    )

class UpdateCategoryRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=255
    )

class CreateProductRequest(BaseModel):
    sku: str = Field(
        min_length=1,
        max_length=50
    )

    barcode: str | None = Field(
        default=None,
        max_length=100
    )

    name: str = Field(
        min_length=1,
        max_length=150
    )

    category_id: int

    unit: str = Field(
        min_length=1,
        max_length=30
    )

    purchase_price: Decimal = Field(
        ge=0
    )

    selling_price: Decimal = Field(
        ge=0
    )

    current_stock: int = Field(
        default=0,
        ge=0
    )

    minimum_stock: int = Field(
        default=0,
        ge=0
    )

    expiration_date: date | None = None

    status: str = "active"

class UpdateProductRequest(BaseModel):
    sku: str | None = Field(
        default=None,
        min_length=1,
        max_length=50
    )

    barcode: str | None = Field(
        default=None,
        max_length=100
    )

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150
    )

    category_id: int | None = None

    unit: str | None = Field(
        default=None,
        min_length=1,
        max_length=30
    )

    purchase_price: Decimal | None = Field(
        default=None,
        ge=0
    )

    selling_price: Decimal | None = Field(
        default=None,
        ge=0
    )

    minimum_stock: int | None = Field(
        default=None,
        ge=0
    )

    expiration_date: date | None = None

    status: str | None = None

class CreateInventoryMovementRequest(BaseModel):
    product_id: int

    movement_type: str

    quantity: int | None = Field(
        default=None,
        gt=0
    )

    actual_stock: int | None = Field(
        default=None,
        ge=0
    )

    notes: str | None = Field(
        default=None,
        max_length=500
    )

class CreateSupplierRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=150)
    address: str | None = Field(default=None, max_length=500)


class UpdateSupplierRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150
    )
    phone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=150)
    address: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None

class TransactionItemRequest(BaseModel):
    product_id: int

    quantity: int = Field(
        gt=0
    )

class CreateTransactionRequest(BaseModel):
    items: list[TransactionItemRequest]
    discount: Decimal = Decimal("0")
    payment_method: str
    payment_amount: Decimal

class PurchaseItemRequest(BaseModel):
    product_id: int

    quantity: int = Field(
        gt=0
    )

    purchase_price: Decimal = Field(
        ge=0
    )

class CreatePurchaseRequest(BaseModel):
    supplier_id: int
    purchase_date: date
    items: list[PurchaseItemRequest]

@app.get("/")
def root():
    return {
        "message": "RetailFlow API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/database-test")
def database_test(
    db: Session = Depends(get_db)
):
    try:
        db.execute(text("SELECT 1"))

        return {
            "success": True,
            "message": "Database connection successful"
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

def create_audit_log(
    session: Session,
    user_id: int,
    action: str,
    entity: str,
    entity_id: int | None,
    description: str
):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        description=description
    )

    session.add(audit_log)
    
def require_roles(allowed_roles: list[str]):
    def role_checker(
        current_user: dict = Depends(get_current_user)
    ):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Anda tidak memiliki izin untuk mengakses resource ini"
            )

        return current_user

    return role_checker

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Token tidak valid atau sudah kedaluwarsa"
        )

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Token tidak memiliki identitas pengguna"
        )

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Identitas pengguna tidak valid"
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Pengguna tidak ditemukan"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Akun pengguna tidak aktif"
        )

    return {
        "sub": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }

@app.post("/auth/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Email atau password salah"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Akun pengguna tidak aktif"
        )

    try:
        password_valid = password_hash.verify(
            data.password,
            user.password_hash
        )
    except Exception:
        password_valid = False

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Email atau password salah"
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id)
        }
    )

    return {
        "success": True,
        "message": "Login berhasil",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }
    
@app.get("/auth/me")
def get_me(
    current_user: dict = Depends(get_current_user)
):
    return {
        "success": True,
        "user": {
            "id": int(current_user["sub"]),
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user["role"],
        }
    }

@app.get("/admin-test")
def admin_test(
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    )
):
    return {
        "success": True,
        "message": "Anda memiliki akses admin",
        "user": current_user
    }

@app.post("/users")
def create_user(
    data: CreateUserRequest,
    current_user: dict = Depends(
        require_roles(["owner"])
    ),
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email sudah digunakan"
        )

    allowed_roles = [
        "owner",
        "admin",
        "cashier"
    ]

    if data.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Role tidak valid"
        )

    hashed_password = password_hash.hash(
        data.password
    )

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hashed_password,
        role=data.role,
        is_active=True
    )

    db.add(user)
    db.flush()

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="CREATE",
        entity="USER",
        entity_id=user.id,
        description=(
            f"Membuat pengguna {user.name} "
            f"dengan role {user.role}"
        )
    )

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Pengguna berhasil dibuat",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
    }

@app.get("/users")
def get_users(
    current_user: dict = Depends(
        require_roles(["owner"])
    ),
    db: Session = Depends(get_db)
):
    users = (
        db.query(User)
        .order_by(User.name.asc())
        .all()
    )

    return {
        "success": True,
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": (
                    user.created_at.isoformat()
                ),
                "updated_at": (
                    user.updated_at.isoformat()
                )
            }
            for user in users
        ]
    }

@app.put("/users/{user_id}")
def update_user(
    user_id: int,
    data: UpdateUserRequest,
    current_user: dict = Depends(
        require_roles(["owner"])
    ),
    db: Session = Depends(get_db)
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Pengguna tidak ditemukan"
        )

    if data.email is not None:
        existing_user = (
            db.query(User)
            .filter(
                User.email == data.email,
                User.id != user_id
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email sudah digunakan"
            )

        user.email = data.email

    if data.name is not None:
        user.name = data.name

    if data.role is not None:
        allowed_roles = [
            "owner",
            "admin",
            "cashier"
        ]

        if data.role not in allowed_roles:
            raise HTTPException(
                status_code=400,
                detail="Role tidak valid"
            )

        user.role = data.role

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="UPDATE",
        entity="USER",
        entity_id=user.id,
        description=(
            f"Memperbarui pengguna {user.name}"
        )
    )

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Pengguna berhasil diperbarui",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
    }

@app.patch("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    data: UpdateUserStatusRequest,
    current_user: dict = Depends(
        require_roles(["owner"])
    ),
    db: Session = Depends(get_db)
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Pengguna tidak ditemukan"
        )

    if user.id == int(current_user["sub"]):
        raise HTTPException(
            status_code=400,
            detail="Anda tidak dapat menonaktifkan akun sendiri"
        )

    user.is_active = data.is_active

    status_text = (
        "mengaktifkan"
        if data.is_active
        else "menonaktifkan"
    )

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="UPDATE",
        entity="USER",
        entity_id=user.id,
        description=(
            f"{status_text.capitalize()} "
            f"pengguna {user.name}"
        )
    )

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": (
            "Status pengguna berhasil diperbarui"
        ),
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
    }

@app.patch("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    data: ResetPasswordRequest,
    current_user: dict = Depends(
        require_roles(["owner"])
    ),
    db: Session = Depends(get_db)
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Pengguna tidak ditemukan"
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail=(
                "Password minimal 6 karakter"
            )
        )

    user.password_hash = password_hash.hash(
        data.new_password
    )

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="UPDATE",
        entity="USER",
        entity_id=user.id,
        description=(
            f"Mereset password pengguna "
            f"{user.name}"
        )
    )

    db.commit()

    return {
        "success": True,
        "message": (
            "Password pengguna berhasil direset"
        )
    }

@app.get("/categories")
def get_categories(
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    categories = (
        db.query(Category)
        .order_by(Category.name.asc())
        .all()
    )

    return {
        "success": True,
        "categories": [
            {
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "created_at": category.created_at,
                "updated_at": category.updated_at,
            }
            for category in categories
        ]
    }

@app.post("/categories")
def create_category(
    data: CreateCategoryRequest,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    existing_category = (
        db.query(Category)
        .filter(Category.name == data.name)
        .first()
    )

    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="Kategori sudah digunakan"
        )

    category = Category(
        name=data.name,
        description=data.description
    )

    db.add(category)
    db.flush()

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="CREATE",
        entity="CATEGORY",
        entity_id=category.id,
        description=f"Membuat kategori {category.name}"
    )

    db.commit()
    db.refresh(category)

    return {
        "success": True,
        "message": "Kategori berhasil ditambahkan",
        "category": {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "created_at": category.created_at,
            "updated_at": category.updated_at,
        }
    }

@app.put("/categories/{category_id}")
def update_category(
    category_id: int,
    data: UpdateCategoryRequest,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    category = db.get(Category, category_id)

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Kategori tidak ditemukan"
        )

    if data.name is not None:
        existing_category = (
            db.query(Category)
            .filter(
                Category.name == data.name,
                Category.id != category_id
            )
            .first()
        )

        if existing_category:
            raise HTTPException(
                status_code=400,
                detail="Nama kategori sudah digunakan"
            )

        category.name = data.name

    if data.description is not None:
        category.description = data.description

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="UPDATE",
        entity="CATEGORY",
        entity_id=category.id,
        description=f"Mengubah kategori {category.name}"
    )

    db.commit()
    db.refresh(category)

    return {
        "success": True,
        "message": "Kategori berhasil diperbarui",
        "category": {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "created_at": category.created_at,
            "updated_at": category.updated_at,
        }
    }

@app.get("/products")
def get_products(
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    products = db.query(Product).all()

    return {
        "success": True,
        "products": [
            {
                "id": product.id,
                "sku": product.sku,
                "barcode": product.barcode,
                "name": product.name,
                "category_id": product.category_id,
                "unit": product.unit,
                "purchase_price": float(product.purchase_price),
                "selling_price": float(product.selling_price),
                "current_stock": product.current_stock,
                "minimum_stock": product.minimum_stock,
                "expiration_date": (
                    product.expiration_date.isoformat()
                    if product.expiration_date
                    else None
                ),
                "status": product.status,
                "image_url": product.image_url,
                "created_at": product.created_at.isoformat(),
                "updated_at": product.updated_at.isoformat(),
            }
            for product in products
        ]
    }

@app.post("/products")
def create_product(
    sku: str = Form(...),
    barcode: str | None = Form(None),
    name: str = Form(...),
    category_id: int = Form(...),
    unit: str = Form(...),
    purchase_price: float = Form(...),
    selling_price: float = Form(...),
    current_stock: int = Form(0),
    minimum_stock: int = Form(0),
    expiration_date: date | None = Form(None),
    status: str = Form("active"),
    image: UploadFile | None = File(None),
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    existing_sku = (
        db.query(Product)
        .filter(Product.sku == sku)
        .first()
    )

    if existing_sku:
        raise HTTPException(
            status_code=400,
            detail="SKU sudah digunakan"
        )

    if barcode:
        existing_barcode = (
            db.query(Product)
            .filter(Product.barcode == barcode)
            .first()
        )

        if existing_barcode:
            raise HTTPException(
                status_code=400,
                detail="Barcode sudah digunakan"
            )

    category = db.get(Category, category_id)

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Kategori tidak ditemukan"
        )

    if status not in ["active", "inactive"]:
        raise HTTPException(
            status_code=400,
            detail="Status produk tidak valid"
        )

    product = Product(
        sku=sku,
        barcode=barcode,
        name=name,
        category_id=category_id,
        unit=unit,
        purchase_price=purchase_price,
        selling_price=selling_price,
        current_stock=current_stock,
        minimum_stock=minimum_stock,
        expiration_date=expiration_date,
        status=status
    )

    db.add(product)
    db.flush()

    # Simpan gambar produk jika ada
    if image is not None:
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ]

        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Format gambar harus JPG, PNG, atau WEBP"
            )

        extension_map = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        }

        extension = extension_map[image.content_type]

        filename = f"{product.id}{extension}"
        file_path = os.path.join(
            UPLOAD_DIR,
            filename
        )

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(
                image.file,
                buffer
            )

        product.image_url = (
            f"/uploads/products/{filename}"
        )

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="CREATE",
        entity="PRODUCT",
        entity_id=product.id,
        description=f"Membuat produk {product.name}"
    )

    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "message": "Produk berhasil ditambahkan",
        "product": {
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "image_url": product.image_url
        }
    }

@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    sku: str | None = Form(None),
    barcode: str | None = Form(None),
    name: str | None = Form(None),
    category_id: int | None = Form(None),
    unit: str | None = Form(None),
    purchase_price: float | None = Form(None),
    selling_price: float | None = Form(None),
    minimum_stock: int | None = Form(None),
    expiration_date: date | None = Form(None),
    status: str | None = Form(None),
    image: UploadFile | None = File(None),
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Produk tidak ditemukan"
        )

    # ==========================================
    # VALIDASI SKU
    # ==========================================

    if sku is not None and sku != product.sku:
        existing_sku = (
            db.query(Product)
            .filter(
                Product.sku == sku,
                Product.id != product_id
            )
            .first()
        )

        if existing_sku:
            raise HTTPException(
                status_code=400,
                detail="SKU sudah digunakan"
            )

    # ==========================================
    # VALIDASI BARCODE
    # ==========================================

    if barcode is not None and barcode != product.barcode:
        existing_barcode = (
            db.query(Product)
            .filter(
                Product.barcode == barcode,
                Product.id != product_id
            )
            .first()
        )

        if existing_barcode:
            raise HTTPException(
                status_code=400,
                detail="Barcode sudah digunakan"
            )

    # ==========================================
    # VALIDASI KATEGORI
    # ==========================================

    if category_id is not None:
        category = db.get(Category, category_id)

        if category is None:
            raise HTTPException(
                status_code=404,
                detail="Kategori tidak ditemukan"
            )

    # ==========================================
    # VALIDASI STATUS
    # ==========================================

    if status is not None:
        if status not in ["active", "inactive"]:
            raise HTTPException(
                status_code=400,
                detail="Status produk tidak valid"
            )

    changes = []

    # ==========================================
    # UPDATE DATA PRODUK
    # ==========================================

    if sku is not None and sku != product.sku:
        changes.append(
            f"SKU: {product.sku} → {sku}"
        )
        product.sku = sku

    if barcode is not None and barcode != product.barcode:
        changes.append(
            f"Barcode: {product.barcode} → {barcode}"
        )
        product.barcode = barcode

    if name is not None and name != product.name:
        changes.append(
            f"Nama: {product.name} → {name}"
        )
        product.name = name

    if (
        category_id is not None
        and category_id != product.category_id
    ):
        changes.append(
            f"Kategori ID: "
            f"{product.category_id} → {category_id}"
        )
        product.category_id = category_id

    if unit is not None and unit != product.unit:
        changes.append(
            f"Satuan: {product.unit} → {unit}"
        )
        product.unit = unit

    if (
        purchase_price is not None
        and purchase_price != float(product.purchase_price)
    ):
        changes.append(
            f"Harga beli: "
            f"{product.purchase_price} → {purchase_price}"
        )
        product.purchase_price = purchase_price

    if (
        selling_price is not None
        and selling_price != float(product.selling_price)
    ):
        changes.append(
            f"Harga jual: "
            f"{product.selling_price} → {selling_price}"
        )
        product.selling_price = selling_price

    if (
        minimum_stock is not None
        and minimum_stock != product.minimum_stock
    ):
        changes.append(
            f"Minimum stok: "
            f"{product.minimum_stock} → {minimum_stock}"
        )
        product.minimum_stock = minimum_stock

    if (
        expiration_date is not None
        and expiration_date != product.expiration_date
    ):
        changes.append(
            f"Tanggal kedaluwarsa: "
            f"{product.expiration_date} → {expiration_date}"
        )
        product.expiration_date = expiration_date

    if status is not None and status != product.status:
        changes.append(
            f"Status: {product.status} → {status}"
        )
        product.status = status

    # ==========================================
    # UPDATE GAMBAR
    # ==========================================
    old_image_url = product.image_url

    if image is not None:
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ]

        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Format gambar harus JPG, PNG, atau WEBP"
            )

        extension_map = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        }

        extension = extension_map[image.content_type]

        filename = f"{product.id}{extension}"

        file_path = os.path.join(
            UPLOAD_DIR,
            filename
        )

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(
                image.file,
                buffer
            )

        product.image_url = (
            f"/uploads/products/{filename}"
        )

        changes.append("Gambar produk diperbarui")

    # ==========================================
    # JIKA TIDAK ADA PERUBAHAN
    # ==========================================

    if not changes:
        return {
            "success": True,
            "message": "Tidak ada perubahan pada produk"
        }

    # ==========================================
    # AUDIT LOG
    # ==========================================

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="UPDATE",
        entity="PRODUCT",
        entity_id=product.id,
        description=(
            f"Mengubah produk {product.name}. "
            + "; ".join(changes)
        )
    )

    # ==========================================
    # COMMIT
    # ==========================================

    try:
        db.commit()
        db.refresh(product)

        if image is not None and old_image_url:
            old_filename = os.path.basename(
                old_image_url
            )

            old_file_path = os.path.join(
                UPLOAD_DIR,
                old_filename
            )

            new_filename = os.path.basename(
                product.image_url
            )

            if (
                old_filename != new_filename
                and os.path.exists(old_file_path)
            ):
                os.remove(old_file_path)

        return {
            "success": True,
            "message": "Produk berhasil diperbarui",
            "product": {
                "id": product.id,
                "sku": product.sku,
                "barcode": product.barcode,
                "name": product.name,
                "category_id": product.category_id,
                "unit": product.unit,
                "purchase_price": float(
                    product.purchase_price
                ),
                "selling_price": float(
                    product.selling_price
                ),
                "current_stock": product.current_stock,
                "minimum_stock": product.minimum_stock,
                "expiration_date": (
                    product.expiration_date.isoformat()
                    if product.expiration_date
                    else None
                ),
                "status": product.status,
                "image_url": product.image_url
            }
        }

    except Exception as e:
        db.rollback()

        print(
            f"ERROR UPDATE PRODUCT: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Terjadi kesalahan saat "
                "memperbarui produk"
            )
        )

@app.get("/pos/products")
def get_pos_products(
    current_user: dict = Depends(
        require_roles(["owner", "admin", "cashier"])
    ),
    db: Session = Depends(get_db)
):
    products = (
        db.query(Product)
        .filter(Product.status == "active")
        .order_by(Product.name.asc())
        .all()
    )

    return {
        "success": True,
        "products": [
            {
                "id": product.id,
                "sku": product.sku,
                "barcode": product.barcode,
                "name": product.name,
                "unit": product.unit,
                "selling_price": float(
                    product.selling_price
                ),
                "current_stock": product.current_stock,
                "image_url": product.image_url,
                "status": product.status
            }
            for product in products
        ]
    }

@app.get("/inventory")
def get_inventory(
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    products = (
        db.query(Product)
        .order_by(Product.name.asc())
        .all()
    )

    inventory = []

    for product in products:
        inventory.append({
            "id": product.id,
            "sku": product.sku,
            "barcode": product.barcode,
            "name": product.name,
            "unit": product.unit,
            "current_stock": product.current_stock,
            "minimum_stock": product.minimum_stock,
            "status": (
                "low_stock"
                if product.current_stock <= product.minimum_stock
                else "normal"
            ),
        })

    return {
        "success": True,
        "inventory": inventory
    }

@app.get("/inventory/movements")
def get_inventory_movements(
    product_id: int | None = None,
    movement_type: str | None = None,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryMovement)

    if product_id is not None:
        query = query.filter(
            InventoryMovement.product_id == product_id
        )

    if movement_type is not None:
        query = query.filter(
            InventoryMovement.movement_type == movement_type
        )

    movements = (
        query
        .order_by(InventoryMovement.created_at.desc())
        .all()
    )

    result = []

    for movement in movements:
        product = db.get(Product, movement.product_id)

        result.append({
            "id": movement.id,
            "product_id": movement.product_id,
            "product_name": (
                product.name
                if product
                else None
            ),
            "movement_type": movement.movement_type,
            "quantity": movement.quantity,
            "stock_before": movement.stock_before,
            "stock_after": movement.stock_after,
            "reference_type": movement.reference_type,
            "reference_id": movement.reference_id,
            "notes": movement.notes,
            "created_by": movement.created_by,
            "created_at": movement.created_at.isoformat(),
        })

    return {
        "success": True,
        "movements": result
    }
    
@app.post("/inventory/movements")
def create_inventory_movement(
    data: CreateInventoryMovementRequest,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    allowed_types = [
        "PURCHASE",
        "SALE",
        "DAMAGE",
        "ADJUSTMENT",
        "RETURN"
    ]

    if data.movement_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Jenis inventory movement tidak valid"
        )

    product = db.get(Product, data.product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Produk tidak ditemukan"
        )

    stock_before = product.current_stock

    # ADJUSTMENT
    if data.movement_type == "ADJUSTMENT":
        if data.actual_stock is None:
            raise HTTPException(
                status_code=400,
                detail="actual_stock wajib diisi untuk ADJUSTMENT"
            )

        stock_after = data.actual_stock
        quantity = abs(
            stock_after - stock_before
        )

    # PURCHASE / RETURN
    elif data.movement_type in [
        "PURCHASE",
        "RETURN"
    ]:
        if data.quantity is None:
            raise HTTPException(
                status_code=400,
                detail="quantity wajib diisi"
            )

        stock_after = (
            stock_before + data.quantity
        )

        quantity = data.quantity

    # SALE / DAMAGE
    elif data.movement_type in [
        "SALE",
        "DAMAGE"
    ]:
        if data.quantity is None:
            raise HTTPException(
                status_code=400,
                detail="quantity wajib diisi"
            )

        if data.quantity > stock_before:
            raise HTTPException(
                status_code=400,
                detail="Stok tidak mencukupi"
            )

        stock_after = (
            stock_before - data.quantity
        )

        quantity = data.quantity

    movement = InventoryMovement(
        product_id=product.id,
        movement_type=data.movement_type,
        quantity=quantity,
        stock_before=stock_before,
        stock_after=stock_after,
        reference_type=None,
        reference_id=None,
        notes=data.notes,
        created_by=int(current_user["sub"])
    )

    product.current_stock = stock_after

    db.add(movement)
    db.flush()

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="CREATE",
        entity="INVENTORY_MOVEMENT",
        entity_id=movement.id,
        description=(
            f"Perubahan stok produk {product.name}: "
            f"{stock_before} → {stock_after} "
            f"({data.movement_type})"
        )
    )

    try:
        db.commit()
        db.refresh(movement)

        return {
            "success": True,
            "message": "Inventory movement berhasil dibuat",
            "movement": {
                "id": movement.id,
                "product_id": movement.product_id,
                "movement_type": movement.movement_type,
                "quantity": movement.quantity,
                "stock_before": movement.stock_before,
                "stock_after": movement.stock_after,
                "notes": movement.notes,
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Terjadi kesalahan saat memperbarui stok"
        )

@app.get("/suppliers")
def get_suppliers(
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    suppliers = (
        db.query(Supplier)
        .order_by(Supplier.name.asc())
        .all()
    )

    return {
        "success": True,
        "suppliers": [
            {
                "id": supplier.id,
                "name": supplier.name,
                "phone": supplier.phone,
                "email": supplier.email,
                "address": supplier.address,
                "is_active": supplier.is_active,
                "created_at": supplier.created_at.isoformat(),
                "updated_at": supplier.updated_at.isoformat(),
            }
            for supplier in suppliers
        ]
    }

@app.post("/suppliers")
def create_supplier(
    data: CreateSupplierRequest,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    if not data.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Nama supplier wajib diisi"
        )

    supplier = Supplier(
        name=data.name.strip(),
        phone=data.phone,
        email=data.email,
        address=data.address,
        is_active=True
    )

    db.add(supplier)
    db.flush()

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="CREATE",
        entity="SUPPLIER",
        entity_id=supplier.id,
        description=f"Membuat supplier {supplier.name}"
    )

    try:
        db.commit()
        db.refresh(supplier)

        return {
            "success": True,
            "message": "Supplier berhasil ditambahkan",
            "supplier": {
                "id": supplier.id,
                "name": supplier.name,
                "phone": supplier.phone,
                "email": supplier.email,
                "address": supplier.address,
                "is_active": supplier.is_active
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Terjadi kesalahan saat menambahkan supplier"
        )

@app.put("/suppliers/{supplier_id}")
def update_supplier(
    supplier_id: int,
    data: UpdateSupplierRequest,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    supplier = db.get(Supplier, supplier_id)

    if supplier is None:
        raise HTTPException(
            status_code=404,
            detail="Supplier tidak ditemukan"
        )

    if data.name is not None:
        if not data.name.strip():
            raise HTTPException(
                status_code=400,
                detail="Nama supplier tidak boleh kosong"
            )

        supplier.name = data.name.strip()

    if data.phone is not None:
        supplier.phone = data.phone

    if data.email is not None:
        supplier.email = data.email

    if data.address is not None:
        supplier.address = data.address

    if data.is_active is not None:
        supplier.is_active = data.is_active

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="UPDATE",
        entity="SUPPLIER",
        entity_id=supplier.id,
        description=f"Mengubah supplier {supplier.name}"
    )

    try:
        db.commit()
        db.refresh(supplier)

        return {
            "success": True,
            "message": "Supplier berhasil diperbarui",
            "supplier": {
                "id": supplier.id,
                "name": supplier.name,
                "phone": supplier.phone,
                "email": supplier.email,
                "address": supplier.address,
                "is_active": supplier.is_active
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Terjadi kesalahan saat memperbarui supplier"
        )
    
@app.post("/purchases")
def create_purchase(
    data: CreatePurchaseRequest,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    # --------------------------------------------------------
    # Validasi supplier
    # --------------------------------------------------------

    supplier = db.get(
        Supplier,
        data.supplier_id
    )

    if supplier is None:
        raise HTTPException(
            status_code=404,
            detail="Supplier tidak ditemukan"
        )

    if not supplier.is_active:
        raise HTTPException(
            status_code=400,
            detail="Supplier tidak aktif"
        )

    # --------------------------------------------------------
    # Validasi item
    # --------------------------------------------------------

    if not data.items:
        raise HTTPException(
            status_code=400,
            detail="Item pembelian tidak boleh kosong"
        )

    # --------------------------------------------------------
    # Generate purchase number
    # --------------------------------------------------------

    purchase_number = (
        f"PO-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    )

    # --------------------------------------------------------
    # Buat purchase
    # --------------------------------------------------------

    purchase = Purchase(
        purchase_number=purchase_number,
        supplier_id=data.supplier_id,
        purchase_date=data.purchase_date,
        status="DRAFT",
        total_amount=Decimal("0"),
        created_by=int(current_user["sub"])
    )

    db.add(purchase)
    db.flush()

    # --------------------------------------------------------
    # Buat purchase items
    # --------------------------------------------------------

    total_amount = Decimal("0")

    for item in data.items:
        product = db.get(
            Product,
            item.product_id
        )

        if product is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Produk ID {item.product_id} "
                    f"tidak ditemukan"
                )
            )

        subtotal = (
            item.purchase_price
            * item.quantity
        )

        purchase_item = PurchaseItem(
            purchase_id=purchase.id,
            product_id=product.id,
            quantity=item.quantity,
            purchase_price=item.purchase_price,
            subtotal=subtotal
        )

        db.add(purchase_item)

        total_amount += subtotal

    purchase.total_amount = total_amount

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        session=db,
        user_id=int(current_user["sub"]),
        action="CREATE",
        entity="PURCHASE",
        entity_id=purchase.id,
        description=(
            f"Membuat purchase "
            f"{purchase.purchase_number}"
        )
    )

    # --------------------------------------------------------
    # Commit
    # --------------------------------------------------------

    try:
        db.commit()
        db.refresh(purchase)

        return {
            "success": True,
            "message": "Purchase berhasil dibuat",
            "purchase": {
                "id": purchase.id,
                "purchase_number": (
                    purchase.purchase_number
                ),
                "supplier_id": (
                    purchase.supplier_id
                ),
                "purchase_date": (
                    purchase.purchase_date.isoformat()
                ),
                "status": purchase.status,
                "total_amount": float(
                    purchase.total_amount
                )
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Terjadi kesalahan saat membuat purchase"
        )
    
@app.post("/purchases/{purchase_id}/receive")
def receive_purchase(
    purchase_id: int,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    # --------------------------------------------------------
    # Ambil purchase
    # --------------------------------------------------------

    purchase = db.get(
        Purchase,
        purchase_id
    )

    if purchase is None:
        raise HTTPException(
            status_code=404,
            detail="Purchase tidak ditemukan"
        )

    # --------------------------------------------------------
    # Validasi status
    # --------------------------------------------------------

    if purchase.status != "DRAFT":
        raise HTTPException(
            status_code=400,
            detail=(
                "Purchase sudah diterima "
                "atau tidak dapat diproses"
            )
        )

    # --------------------------------------------------------
    # Ambil purchase items
    # --------------------------------------------------------

    items = (
        db.query(PurchaseItem)
        .filter(
            PurchaseItem.purchase_id == purchase.id
        )
        .all()
    )

    if not items:
        raise HTTPException(
            status_code=400,
            detail="Purchase tidak memiliki item"
        )

    try:
        # ----------------------------------------------------
        # Update stock dan buat inventory movement
        # ----------------------------------------------------

        for item in items:
            product = db.get(
                Product,
                item.product_id
            )

            if product is None:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Produk ID {item.product_id} "
                        f"tidak ditemukan"
                    )
                )

            stock_before = product.current_stock

            stock_after = (
                stock_before + item.quantity
            )

            product.current_stock = stock_after

            movement = InventoryMovement(
                product_id=product.id,
                movement_type="PURCHASE",
                quantity=item.quantity,
                stock_before=stock_before,
                stock_after=stock_after,
                reference_type="PURCHASE",
                reference_id=purchase.id,
                notes=(
                    f"Stock-in dari "
                    f"{purchase.purchase_number}"
                ),
                created_by=int(current_user["sub"])
            )

            db.add(movement)

        # ----------------------------------------------------
        # Update status purchase
        # ----------------------------------------------------

        purchase.status = "RECEIVED"

        # ----------------------------------------------------
        # Audit log
        # ----------------------------------------------------

        create_audit_log(
            session=db,
            user_id=int(current_user["sub"]),
            action="RECEIVE",
            entity="PURCHASE",
            entity_id=purchase.id,
            description=(
                f"Menerima purchase "
                f"{purchase.purchase_number}"
            )
        )

        # ----------------------------------------------------
        # Commit semua perubahan sekaligus
        # ----------------------------------------------------

        db.commit()
        db.refresh(purchase)

        return {
            "success": True,
            "message": "Purchase berhasil diterima",
            "purchase": {
                "id": purchase.id,
                "purchase_number": (
                    purchase.purchase_number
                ),
                "status": purchase.status,
                "total_amount": float(
                    purchase.total_amount
                )
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Terjadi kesalahan "
                "saat menerima purchase"
            )
        )
    
@app.get("/purchases")
def get_purchases(
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    purchases = (
        db.query(Purchase)
        .order_by(Purchase.created_at.desc())
        .all()
    )

    result = []

    for purchase in purchases:
        supplier = db.get(
            Supplier,
            purchase.supplier_id
        )

        result.append({
            "id": purchase.id,
            "purchase_number": purchase.purchase_number,
            "supplier_id": purchase.supplier_id,
            "supplier_name": (
                supplier.name
                if supplier
                else None
            ),
            "purchase_date": (
                purchase.purchase_date.isoformat()
                if purchase.purchase_date
                else None
            ),
            "status": purchase.status,
            "total_amount": float(
                purchase.total_amount
            ),
            "created_by": purchase.created_by,
            "created_at": (
                purchase.created_at.isoformat()
                if purchase.created_at
                else None
            ),
            "updated_at": (
                purchase.updated_at.isoformat()
                if purchase.updated_at
                else None
            ),
        })

    return {
        "success": True,
        "purchases": result
    }

@app.get("/purchases/{purchase_id}")
def get_purchase(
    purchase_id: int,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    purchase = db.get(
        Purchase,
        purchase_id
    )

    if purchase is None:
        raise HTTPException(
            status_code=404,
            detail="Purchase tidak ditemukan"
        )

    supplier = db.get(
        Supplier,
        purchase.supplier_id
    )

    items = (
        db.query(PurchaseItem)
        .filter(
            PurchaseItem.purchase_id == purchase.id
        )
        .all()
    )

    result_items = []

    for item in items:
        product = db.get(
            Product,
            item.product_id
        )

        result_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": (
                product.name
                if product
                else None
            ),
            "quantity": item.quantity,
            "purchase_price": float(
                item.purchase_price
            ),
            "subtotal": float(
                item.subtotal
            ),
        })

    return {
        "success": True,
        "purchase": {
            "id": purchase.id,
            "purchase_number": purchase.purchase_number,
            "supplier_id": purchase.supplier_id,
            "supplier_name": (
                supplier.name
                if supplier
                else None
            ),
            "purchase_date": (
                purchase.purchase_date.isoformat()
                if purchase.purchase_date
                else None
            ),
            "status": purchase.status,
            "total_amount": float(
                purchase.total_amount
            ),
            "created_by": purchase.created_by,
            "created_at": (
                purchase.created_at.isoformat()
                if purchase.created_at
                else None
            ),
            "updated_at": (
                purchase.updated_at.isoformat()
                if purchase.updated_at
                else None
            ),
            "items": result_items
        }
    }

@app.post("/transactions")
def create_transaction(
    data: CreateTransactionRequest,
    current_user: dict = Depends(
        require_roles(["owner", "admin", "cashier"])
    ),
    db: Session = Depends(get_db)
):
    try:
        # =========================
        # VALIDASI AWAL
        # =========================

        if not data.items:
            raise HTTPException(
                status_code=400,
                detail="Item transaksi tidak boleh kosong"
            )

        if data.discount < 0:
            raise HTTPException(
                status_code=400,
                detail="Diskon tidak boleh negatif"
            )

        if data.payment_amount < 0:
            raise HTTPException(
                status_code=400,
                detail="Jumlah pembayaran tidak boleh negatif"
            )

        allowed_payment_methods = [
            "CASH",
            "TRANSFER",
            "QRIS",
            "DEBIT"
        ]

        if data.payment_method not in allowed_payment_methods:
            raise HTTPException(
                status_code=400,
                detail="Metode pembayaran tidak valid"
            )

        # =========================
        # HITUNG SUBTOTAL
        # =========================

        subtotal = Decimal("0")
        transaction_items_data = []

        requested_quantities = {}

        for item in data.items:
            if item.product_id in requested_quantities:
                requested_quantities[item.product_id] += item.quantity
            else:
                requested_quantities[item.product_id] = item.quantity


        for product_id, total_quantity in requested_quantities.items():
            product = db.get(
                Product,
                product_id
            )

            if product is None:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Produk ID {product_id} "
                        "tidak ditemukan"
                    )
                )

            if product.status != "active":
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Produk {product.name} "
                        "tidak aktif"
                    )
                )

            if total_quantity > product.current_stock:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Stok {product.name} "
                        "tidak mencukupi"
                    )
                )

            selling_price = product.selling_price
            purchase_price = product.purchase_price

            item_subtotal = (
                selling_price * total_quantity
            )

            subtotal += item_subtotal

            transaction_items_data.append({
                "product": product,
                "quantity": total_quantity,
                "selling_price": selling_price,
                "purchase_price": purchase_price,
                "subtotal": item_subtotal
            })

        # =========================
        # HITUNG TOTAL
        # =========================

        discount = data.discount

        total_amount = (
            subtotal - discount
        )

        if total_amount < 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Diskon tidak boleh melebihi subtotal"
                )
            )

        if data.payment_amount < total_amount:
            raise HTTPException(
                status_code=400,
                detail="Jumlah pembayaran tidak mencukupi"
            )

        change_amount = (
            data.payment_amount - total_amount
        )

        # =========================
        # BUAT TRANSACTION
        # =========================

        transaction_number = (
            f"TRX-"
            f"{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        )

        transaction = Transaction(
            transaction_number=transaction_number,
            cashier_id=int(current_user["sub"]),
            subtotal=subtotal,
            discount=discount,
            total_amount=total_amount,
            payment_method=data.payment_method,
            payment_amount=data.payment_amount,
            change_amount=change_amount,
            status="COMPLETED"
        )

        db.add(transaction)
        db.flush()

        # =========================
        # TRANSACTION ITEMS
        # + UPDATE STOCK
        # + INVENTORY MOVEMENT
        # =========================

        for item_data in transaction_items_data:

            product = item_data["product"]
            quantity = item_data["quantity"]

            transaction_item = TransactionItem(
                transaction_id=transaction.id,
                product_id=product.id,
                quantity=quantity,
                selling_price=(
                    item_data["selling_price"]
                ),
                purchase_price=(
                    item_data["purchase_price"]
                ),
                subtotal=(
                    item_data["subtotal"]
                )
            )

            db.add(transaction_item)

            # Simpan stok sebelum perubahan
            stock_before = product.current_stock

            # Kurangi stok
            stock_after = (
                stock_before - quantity
            )

            product.current_stock = stock_after

            # Catat inventory movement
            movement = InventoryMovement(
                product_id=product.id,
                movement_type="SALE",
                quantity=quantity,
                stock_before=stock_before,
                stock_after=stock_after,
                reference_type="TRANSACTION",
                reference_id=transaction.id,
                notes=(
                    f"Penjualan "
                    f"{transaction.transaction_number}"
                ),
                created_by=int(current_user["sub"])
            )

            db.add(movement)

        # =========================
        # AUDIT LOG
        # =========================

        create_audit_log(
            session=db,
            user_id=int(current_user["sub"]),
            action="CREATE",
            entity="TRANSACTION",
            entity_id=transaction.id,
            description=(
                f"Transaksi penjualan "
                f"{transaction.transaction_number} "
                f"sebesar {total_amount}"
            )
        )

        # =========================
        # COMMIT
        # =========================

        db.commit()
        db.refresh(transaction)

        return {
            "success": True,
            "message": "Transaksi berhasil dibuat",
            "transaction": {
                "id": transaction.id,
                "transaction_number": (
                    transaction.transaction_number
                ),
                "subtotal": float(
                    transaction.subtotal
                ),
                "discount": float(
                    transaction.discount
                ),
                "total_amount": float(
                    transaction.total_amount
                ),
                "payment_method": (
                    transaction.payment_method
                ),
                "payment_amount": float(
                    transaction.payment_amount
                ),
                "change_amount": float(
                    transaction.change_amount
                ),
                "status": transaction.status
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Terjadi kesalahan saat "
                "memproses transaksi"
            )
        )
    
@app.get("/transactions")
def get_transactions(
    current_user: dict = Depends(
        require_roles(["owner", "admin", "cashier"])
    ),
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(Transaction, User.name)
        .join(
            User,
            User.id == Transaction.cashier_id
        )
        .order_by(
            Transaction.created_at.desc()
        )
        .all()
    )

    return {
        "success": True,
        "transactions": [
            {
                "id": transaction.id,
                "transaction_number": (
                    transaction.transaction_number
                ),
                "cashier_id": transaction.cashier_id,
                "cashier_name": cashier_name,
                "subtotal": float(
                    transaction.subtotal
                ),
                "discount": float(
                    transaction.discount
                ),
                "total_amount": float(
                    transaction.total_amount
                ),
                "payment_method": (
                    transaction.payment_method
                ),
                "payment_amount": float(
                    transaction.payment_amount
                ),
                "change_amount": float(
                    transaction.change_amount
                ),
                "status": transaction.status,
                "created_at": (
                    transaction.created_at.isoformat()
                )
            }
            for transaction, cashier_name in transactions
        ]
    }

@app.get("/transactions/{transaction_id}")
def get_transaction(
    transaction_id: int,
    current_user: dict = Depends(
        require_roles(["owner", "admin", "cashier"])
    ),
    db: Session = Depends(get_db)
):
    transaction = db.get(
        Transaction,
        transaction_id
    )

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaksi tidak ditemukan"
        )

    items = (
        db.query(TransactionItem)
        .filter(
            TransactionItem.transaction_id
            == transaction.id
        )
        .all()
    )

    result_items = []

    for item in items:
        product = db.get(
            Product,
            item.product_id
        )

        result_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": (
                product.name
                if product
                else None
            ),
            "quantity": item.quantity,
            "selling_price": float(
                item.selling_price
            ),
            "purchase_price": float(
                item.purchase_price
            ),
            "subtotal": float(
                item.subtotal
            )
        })

    return {
        "success": True,
        "transaction": {
            "id": transaction.id,
            "transaction_number": (
                transaction.transaction_number
            ),
            "cashier_id": transaction.cashier_id,
            "subtotal": float(
                transaction.subtotal
            ),
            "discount": float(
                transaction.discount
            ),
            "total_amount": float(
                transaction.total_amount
            ),
            "payment_method": (
                transaction.payment_method
            ),
            "payment_amount": float(
                transaction.payment_amount
            ),
            "change_amount": float(
                transaction.change_amount
            ),
            "status": transaction.status,
            "created_at": (
                transaction.created_at.isoformat()
            ),
            "items": result_items
        }
    }

@app.get("/dashboard")
def get_dashboard(
    current_user: dict = Depends(
        require_roles([
            "owner",
            "admin",
            "cashier"
        ])
    ),
    db: Session = Depends(get_db)
):
    today = date.today()

    active_products = (
        db.query(Product)
        .filter(Product.status == "active")
        .count()
    )

    low_stock_products = (
        db.query(Product)
        .filter(
            Product.status == "active",
            Product.current_stock
            <= Product.minimum_stock
        )
        .count()
    )

    today_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.status == "COMPLETED",
            func.date(Transaction.created_at) == today
        )
        .count()
    )

    today_sales = (
        db.query(
            func.coalesce(
                func.sum(Transaction.total_amount),
                0
            )
        )
        .filter(
            Transaction.status == "COMPLETED",
            func.date(Transaction.created_at) == today
        )
        .scalar()
    )

    recent_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.status == "COMPLETED"
        )
        .order_by(
            Transaction.created_at.desc()
        )
        .limit(5)
        .all()
    )

    low_stock_list = (
        db.query(Product)
        .filter(
            Product.status == "active",
            Product.current_stock
            <= Product.minimum_stock
        )
        .order_by(
            Product.current_stock.asc()
        )
        .limit(5)
        .all()
    )

    return {
        "success": True,
        "summary": {
            "active_products": active_products,
            "low_stock_products": low_stock_products,
            "today_transactions": today_transactions,
            "today_sales": float(today_sales or 0)
        },
        "recent_transactions": [
            {
                "id": transaction.id,
                "transaction_number": (
                    transaction.transaction_number
                ),
                "cashier_name": (
                    db.query(User.name)
                    .filter(User.id == transaction.cashier_id)
                    .scalar()
                ),
                "total_amount": float(
                    transaction.total_amount
                ),
                "payment_method": (
                    transaction.payment_method
                ),
                "created_at": (
                    transaction.created_at.isoformat()
                )
            }
            for transaction in recent_transactions
        ],
        "low_stock_list": [
            {
                "id": product.id,
                "sku": product.sku,
                "name": product.name,
                "current_stock": (
                    product.current_stock
                ),
                "minimum_stock": (
                    product.minimum_stock
                )
            }
            for product in low_stock_list
        ]
    }

@app.get("/reports/sales")
def get_sales_report(
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    query = (
        db.query(Transaction)
        .filter(
            Transaction.status == "COMPLETED"
        )
    )

    if start_date is not None:
        query = query.filter(
            func.date(Transaction.created_at)
            >= start_date
        )

    if end_date is not None:
        query = query.filter(
            func.date(Transaction.created_at)
            <= end_date
        )

    transactions = (
        query
        .order_by(Transaction.created_at.desc())
        .all()
    )

    total_transactions = len(transactions)
    total_sales = Decimal("0")
    total_discount = Decimal("0")
    total_items = 0
    total_profit = Decimal("0")

    transaction_details = []

    for transaction in transactions:
        items = (
            db.query(TransactionItem)
            .filter(
                TransactionItem.transaction_id
                == transaction.id
            )
            .all()
        )

        transaction_profit = Decimal("0")
        transaction_items = 0

        for item in items:
            transaction_items += item.quantity

            transaction_profit += (
                item.selling_price
                - item.purchase_price
            ) * item.quantity

        total_sales += transaction.total_amount
        total_discount += transaction.discount
        total_items += transaction_items
        total_profit += transaction_profit

        transaction_details.append({
            "id": transaction.id,
            "transaction_number": (
                transaction.transaction_number
            ),
            "subtotal": float(
                transaction.subtotal
            ),
            "discount": float(
                transaction.discount
            ),
            "total_amount": float(
                transaction.total_amount
            ),
            "payment_method": (
                transaction.payment_method
            ),
            "payment_amount": float(
                transaction.payment_amount
            ),
            "change_amount": float(
                transaction.change_amount
            ),
            "items_count": transaction_items,
            "profit": float(
                transaction_profit
            ),
            "created_at": (
                transaction.created_at.isoformat()
            )
        })

    return {
        "success": True,
        "summary": {
            "total_transactions": total_transactions,
            "total_sales": float(total_sales),
            "total_discount": float(total_discount),
            "total_items": total_items,
            "total_profit": float(total_profit)
        },
        "transactions": transaction_details
    }

@app.get("/reports/products")
def get_products_report(
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    query = (
        db.query(TransactionItem)
        .join(
            Transaction,
            TransactionItem.transaction_id
            == Transaction.id
        )
        .filter(
            Transaction.status == "COMPLETED"
        )
    )

    if start_date is not None:
        query = query.filter(
            func.date(Transaction.created_at)
            >= start_date
        )

    if end_date is not None:
        query = query.filter(
            func.date(Transaction.created_at)
            <= end_date
        )

    items = query.all()

    product_data = {}

    for item in items:
        product_id = item.product_id

        if product_id not in product_data:
            product_data[product_id] = {
                "product_id": product_id,
                "product_name": None,
                "total_quantity": 0,
                "total_sales": Decimal("0"),
                "total_profit": Decimal("0")
            }

        product = db.get(
            Product,
            product_id
        )

        if product is not None:
            product_data[product_id][
                "product_name"
            ] = product.name

        product_data[product_id][
            "total_quantity"
        ] += item.quantity

        product_data[product_id][
            "total_sales"
        ] += item.subtotal

        product_data[product_id][
            "total_profit"
        ] += (
            item.selling_price
            - item.purchase_price
        ) * item.quantity

    products = list(product_data.values())

    products.sort(
        key=lambda item: item["total_quantity"],
        reverse=True
    )

    return {
        "success": True,
        "products": [
            {
                "product_id": item["product_id"],
                "product_name": item["product_name"],
                "total_quantity": item[
                    "total_quantity"
                ],
                "total_sales": float(
                    item["total_sales"]
                ),
                "total_profit": float(
                    item["total_profit"]
                )
            }
            for item in products
        ]
    }

@app.get("/reports/inventory")
def get_inventory_report(
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    products = (
        db.query(Product)
        .order_by(Product.name.asc())
        .all()
    )

    total_products = len(products)

    total_stock = sum(
        product.current_stock
        for product in products
    )

    low_stock_count = sum(
        1
        for product in products
        if product.current_stock
        <= product.minimum_stock
    )

    product_list = []

    for product in products:
        product_list.append({
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "unit": product.unit,
            "current_stock": (
                product.current_stock
            ),
            "minimum_stock": (
                product.minimum_stock
            ),
            "purchase_price": float(
                product.purchase_price
            ),
            "selling_price": float(
                product.selling_price
            ),
            "status": (
                "low_stock"
                if product.current_stock
                <= product.minimum_stock
                else "normal"
            )
        })

    movements = (
        db.query(InventoryMovement)
        .order_by(
            InventoryMovement.created_at.desc()
        )
        .limit(100)
        .all()
    )

    movement_list = []

    for movement in movements:
        product = db.get(
            Product,
            movement.product_id
        )

        movement_list.append({
            "id": movement.id,
            "product_id": movement.product_id,
            "product_name": (
                product.name
                if product
                else None
            ),
            "movement_type": (
                movement.movement_type
            ),
            "quantity": movement.quantity,
            "stock_before": (
                movement.stock_before
            ),
            "stock_after": (
                movement.stock_after
            ),
            "reference_type": (
                movement.reference_type
            ),
            "reference_id": (
                movement.reference_id
            ),
            "notes": movement.notes,
            "created_by": movement.created_by,
            "created_at": (
                movement.created_at.isoformat()
            )
        })

    return {
        "success": True,
        "summary": {
            "total_products": total_products,
            "total_stock": total_stock,
            "low_stock_count": low_stock_count
        },
        "products": product_list,
        "movements": movement_list
    }

@app.get("/audit-logs")
def get_audit_logs(
    current_user: dict = Depends(
        require_roles(["owner", "admin"])
    ),
    db: Session = Depends(get_db)
):
    audit_logs = (
        db.query(AuditLog)
        .order_by(
            AuditLog.created_at.desc()
        )
        .all()
    )

    result = []

    for log in audit_logs:
        user = db.get(
            User,
            log.user_id
        )

        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "user_name": (
                user.name
                if user
                else None
            ),
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "description": log.description,
            "created_at": (
                log.created_at.isoformat()
            )
        })

    return {
        "success": True,
        "audit_logs": result
    }