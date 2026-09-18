# RetailFlow

RetailFlow adalah sistem **Point of Sale (POS) dan Inventory Management** berbasis web yang dikembangkan untuk membantu operasional toko retail dalam mengelola produk, persediaan, pembelian, transaksi penjualan, dan laporan.

Project ini merupakan pengembangan dari aplikasi kasir sederhana menjadi sistem yang memiliki pemisahan hak akses pengguna, pencatatan pergerakan stok, pengelolaan supplier, audit log, serta automated testing.

## Features

### Authentication & Authorization

* Login dan autentikasi pengguna
* Role-Based Access Control (RBAC)
* Tiga role pengguna:

  * Owner
  * Admin
  * Cashier
* Pembatasan akses berdasarkan role
* Pengelolaan pengguna oleh Owner

### Product Management

* CRUD produk
* SKU dan barcode
* Kategori produk
* Unit produk
* Harga beli
* Harga jual
* Stok saat ini
* Minimum stok
* Tanggal kedaluwarsa
* Status produk

### Inventory Management

* Monitoring stok produk
* Pencatatan setiap perubahan stok
* Jenis pergerakan stok:

  * PURCHASE
  * SALE
  * DAMAGE
  * ADJUSTMENT
  * RETURN
* Pencatatan stok sebelum dan sesudah perubahan
* Riwayat pergerakan stok
* Deteksi low stock

### Supplier & Purchase

* Pengelolaan supplier
* Pembuatan purchase order
* Detail item pembelian
* Penerimaan barang
* Penambahan stok secara otomatis setelah barang diterima
* Pencatatan purchase pada inventory movement

### Point of Sale

* Pencarian produk
* Keranjang transaksi
* Pengaturan quantity
* Diskon
* Metode pembayaran
* Perhitungan total
* Validasi pembayaran
* Perhitungan kembalian
* Penyelesaian transaksi
* Pencetakan receipt

### Transaction Management

* Riwayat transaksi
* Detail transaksi
* Informasi cashier
* Detail item transaksi
* Harga jual dan harga beli
* Metode pembayaran
* Total transaksi

### Reports

* Sales report
* Product sales report
* Inventory report
* Filter berdasarkan periode
* Total transaksi
* Total penjualan
* Total item terjual
* Estimasi gross profit
* Produk berdasarkan jumlah penjualan
* Monitoring stok dan low stock

> Gross profit pada project ini dihitung berdasarkan selisih harga jual dan harga beli produk dikalikan jumlah produk terjual.

### Dashboard

Dashboard menyediakan ringkasan:

* Jumlah produk aktif
* Jumlah produk low stock
* Jumlah transaksi hari ini
* Total penjualan hari ini
* Transaksi terbaru
* Daftar produk dengan stok rendah

### Audit Log

Aktivitas perubahan data penting dicatat melalui audit log, meliputi:

* User
* Action
* Entity
* Entity ID
* Description
* Timestamp

Audit log dapat digunakan untuk membantu menelusuri aktivitas pada sistem.

## User Roles

| Feature      | Owner | Admin | Cashier |
| ------------ | :---: | :---: | :-----: |
| Dashboard    |   ✓   |   ✓   |    ✓    |
| POS          |   ✓   |   ✓   |    ✓    |
| Transactions |   ✓   |   ✓   |    ✓    |
| Products     |   ✓   |   ✓   |    -    |
| Categories   |   ✓   |   ✓   |    -    |
| Inventory    |   ✓   |   ✓   |    -    |
| Suppliers    |   ✓   |   ✓   |    -    |
| Purchases    |   ✓   |   ✓   |    -    |
| Reports      |   ✓   |   ✓   |    -    |
| Users        |   ✓   |   -   |    -    |
| Audit Logs   |   ✓   |   ✓   |    -    |
| Settings     |   ✓   |   ✓   |    ✓    |

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* React Router
* Axios

### Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* JWT Authentication
* Argon2 Password Hashing

### Database

* MySQL / MariaDB

### Development Tools

* Laragon
* Visual Studio Code
* Git
* GitHub

## Architecture

RetailFlow menggunakan arsitektur frontend-backend terpisah.

```text
┌───────────────────────────┐
│       React Frontend      │
│     TypeScript + Vite     │
└─────────────┬─────────────┘
              │ HTTP / REST API
              ▼
┌───────────────────────────┐
│       FastAPI Backend     │
│    Authentication / RBAC  │
│      Business Logic       │
└─────────────┬─────────────┘
              │ SQLAlchemy
              ▼
┌───────────────────────────┐
│      MySQL / MariaDB      │
│        retailflow DB      │
└───────────────────────────┘
```

## Security

Beberapa mekanisme keamanan yang diterapkan:

* Password disimpan dalam bentuk hash menggunakan Argon2
* JWT digunakan untuk autentikasi
* Endpoint dilindungi berdasarkan role pengguna
* Validasi request menggunakan Pydantic
* Database access menggunakan SQLAlchemy ORM
* Secret key disimpan melalui environment variable
* File `.env` tidak disimpan di repository
* Audit log untuk aktivitas perubahan data penting
* CORS dibatasi pada origin frontend yang digunakan selama development

## Project Structure

```text
RetailFlow/
│
├── backend/
│   ├── models/
│   │   ├── audit_log.py
│   │   ├── category.py
│   │   ├── inventory_movement.py
│   │   ├── product.py
│   │   ├── purchase.py
│   │   ├── supplier.py
│   │   ├── transaction.py
│   │   └── user.py
│   │
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_rbac.py
│   │   ├── test_products.py
│   │   ├── test_categories.py
│   │   ├── test_inventory.py
│   │   ├── test_suppliers.py
│   │   ├── test_purchases.py
│   │   ├── test_transactions.py
│   │   ├── test_dashboard.py
│   │   ├── test_reports.py
│   │   └── test_audit_logs.py
│   │
│   ├── database.py
│   ├── main.py
│   ├── security.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── database/
│
├── docs/
│
└── README.md
```

## Installation

### Requirements

Pastikan environment berikut sudah tersedia:

* Python 3.12+
* Node.js 22+
* npm
* MySQL atau MariaDB
* Git

### 1. Clone Repository

```bash
git clone https://github.com/Egaaa04/RetailFlow.git
cd RetailFlow
```

### 2. Setup Database

Buat database MySQL/MariaDB:

```sql
CREATE DATABASE retailflow
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### 3. Setup Backend

Masuk ke folder backend:

```bash
cd backend
```

Buat virtual environment:

```bash
python -m venv .venv
```

Aktifkan virtual environment pada Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Buat file `.env` berdasarkan `.env.example`.

Contoh:

```env
SECRET_KEY=change-this-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/retailflow
```

Jalankan backend:

```bash
uvicorn main:app --reload
```

Backend akan berjalan pada:

```text
http://127.0.0.1:8000
```

API documentation tersedia pada:

```text
http://127.0.0.1:8000/docs
```

### 4. Setup Frontend

Buka terminal baru:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Frontend akan tersedia pada:

```text
http://localhost:5173
```

## Testing

RetailFlow memiliki automated testing menggunakan Pytest.

Untuk menjalankan seluruh test:

```bash
cd backend
pytest -q
```

Hasil pengujian saat pengembangan:

```text
47 passed
```

Test mencakup beberapa bagian utama sistem, termasuk:

* Authentication
* RBAC
* Products
* Categories
* Inventory
* Suppliers
* Purchases
* Transactions
* Dashboard
* Reports
* Audit Logs

## Current Status

### Completed

* Authentication
* Role-Based Access Control
* Dashboard
* Product Management
* Category Management
* Inventory Management
* Supplier Management
* Purchase Management
* Point of Sale
* Transaction Management
* Sales Reports
* Product Reports
* Inventory Reports
* User Management
* Audit Logs
* Automated Testing
* Git & GitHub integration

### Future Improvements

* Barcode scanner integration
* Low-stock notifications
* PDF and Excel export
* More advanced analytics
* Automated frontend testing
* Automated API documentation improvements
* Production deployment
* CI/CD pipeline

## Project Purpose

RetailFlow dikembangkan sebagai project portfolio untuk menerapkan konsep **full-stack web development** secara lebih terstruktur, mulai dari frontend, backend, database, authentication, authorization, inventory management, transaction processing, reporting, hingga automated testing.

Project ini juga berfokus pada pengembangan aplikasi retail yang tidak hanya menangani transaksi penjualan, tetapi juga menjaga konsistensi data stok dan menyediakan pencatatan aktivitas pengguna.

## License

This project is intended for portfolio and educational purposes.
