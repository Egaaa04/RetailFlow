from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from decimal import Decimal

from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    transaction_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    cashier_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False
    )

    discount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        default=0,
        nullable=False
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False
    )

    payment_method: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    payment_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False
    )

    change_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="COMPLETED",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id"),
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

    selling_price: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
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