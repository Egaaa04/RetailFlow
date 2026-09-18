from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from decimal import Decimal

from database import Base


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    purchase_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    supplier_id: Mapped[int] = mapped_column(
        ForeignKey("suppliers.id"),
        nullable=False
    )

    purchase_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="DRAFT",
        nullable=False
    )

    total_amount: Mapped[float] = mapped_column(
        Numeric(15, 2),
        default=0,
        nullable=False
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    purchase_id: Mapped[int] = mapped_column(
        ForeignKey("purchases.id"),
        nullable=False,
        index=True
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    purchase_price: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False
    )

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False
    )