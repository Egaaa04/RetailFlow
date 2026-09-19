                    ┌─────────────────────┐
                    │       User          │
                    │ Owner/Admin/Cashier │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ React + TypeScript  │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │ HTTP/JSON
                               ▼
                    ┌─────────────────────┐
                    │       FastAPI       │
                    │       Backend       │
                    ├─────────────────────┤
                    │ Authentication/JWT  │
                    │ RBAC                │
                    │ Business Logic      │
                    │ Validation          │
                    │ Audit Logging       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     SQLAlchemy      │
                    │         ORM         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    MySQL/MariaDB    │
                    │     RetailFlow DB   │
                    └─────────────────────┘