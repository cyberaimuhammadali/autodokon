from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum, Float, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime


class RoleEnum(str, enum.Enum):
    owner = "owner"
    manager = "manager"
    cashier = "cashier"
    warehouse = "warehouse"


class PaymentMethodEnum(str, enum.Enum):
    cash = "cash"
    uzcard = "uzcard"
    humo = "humo"
    payme = "payme"
    click = "click"
    bonus = "bonus"


class OFDStatusEnum(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"


class ShiftStatusEnum(str, enum.Enum):
    open = "open"
    closed = "closed"


class Branch(Base):
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    users = relationship("User", back_populates="branch")
    shifts = relationship("Shift", back_populates="branch")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    pin_code = Column(String(4), nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.cashier)
    is_active = Column(Boolean, default=True)
    branch_id = Column(Integer, ForeignKey("branches.id"))

    branch = relationship("Branch", back_populates="users")
    receipts = relationship("Receipt", back_populates="user")
    shifts = relationship("Shift", back_populates="cashier")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float)
    cost_price = Column(Float, default=0.0)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    inventory = relationship("Inventory", back_populates="product")
    receipt_items = relationship("ReceiptItem", back_populates="product")


class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    branch_id = Column(Integer, ForeignKey("branches.id"))
    quantity = Column(Float, default=0.0)
    min_quantity = Column(Float, default=5.0)

    product = relationship("Product", back_populates="inventory")
    branch = relationship("Branch")


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    bonus_balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    receipts = relationship("Receipt", back_populates="customer")


class Shift(Base):
    __tablename__ = "shifts"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    cashier_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(ShiftStatusEnum), default=ShiftStatusEnum.open)
    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    opening_cash = Column(Float, default=0.0)
    expected_cash = Column(Float, default=0.0)
    actual_cash = Column(Float, nullable=True)
    difference = Column(Float, nullable=True)
    inkassation = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)

    branch = relationship("Branch", back_populates="shifts")
    cashier = relationship("User", back_populates="shifts")
    receipts = relationship("Receipt", back_populates="shift")


class Receipt(Base):
    __tablename__ = "receipts"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=True)
    total_amount = Column(Float)
    discount_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # OFD fields
    ofd_status = Column(Enum(OFDStatusEnum), default=OFDStatusEnum.pending)
    ofd_fiscal_id = Column(String, nullable=True)
    ofd_error = Column(Text, nullable=True)
    ofd_sent_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="receipts")
    customer = relationship("Customer", back_populates="receipts")
    shift = relationship("Shift", back_populates="receipts")
    items = relationship("ReceiptItem", back_populates="receipt")
    payments = relationship("ReceiptPayment", back_populates="receipt")
    returns = relationship("ReceiptReturn", back_populates="original_receipt")


class ReceiptItem(Base):
    __tablename__ = "receipt_items"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    price = Column(Float)
    total_price = Column(Float)

    receipt = relationship("Receipt", back_populates="items")
    product = relationship("Product", back_populates="receipt_items")


class ReceiptPayment(Base):
    __tablename__ = "receipt_payments"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id"))
    method = Column(Enum(PaymentMethodEnum))
    amount = Column(Float)
    terminal_ref = Column(String, nullable=True)

    receipt = relationship("Receipt", back_populates="payments")


class ReceiptReturn(Base):
    __tablename__ = "receipt_returns"
    id = Column(Integer, primary_key=True, index=True)
    original_receipt_id = Column(Integer, ForeignKey("receipts.id"))
    cashier_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(Text, nullable=True)
    total_refund = Column(Float)
    refund_method = Column(Enum(PaymentMethodEnum))
    returned_at = Column(DateTime, default=datetime.utcnow)

    original_receipt = relationship("Receipt", back_populates="returns")
    items = relationship("ReceiptReturnItem", back_populates="return_receipt")


class ReceiptReturnItem(Base):
    __tablename__ = "receipt_return_items"
    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("receipt_returns.id"))
    receipt_item_id = Column(Integer, ForeignKey("receipt_items.id"))
    quantity = Column(Float)
    amount = Column(Float)

    return_receipt = relationship("ReceiptReturn", back_populates="items")


class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    inn = Column(String, nullable=True)
    balance = Column(Float, default=0.0)

    supplies = relationship("Supply", back_populates="supplier")


class Supply(Base):
    __tablename__ = "supplies"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    branch_id = Column(Integer, ForeignKey("branches.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="supplies")
    items = relationship("SupplyItem", back_populates="supply")


class SupplyItem(Base):
    __tablename__ = "supply_items"
    id = Column(Integer, primary_key=True, index=True)
    supply_id = Column(Integer, ForeignKey("supplies.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    unit_cost = Column(Float)

    supply = relationship("Supply", back_populates="items")


class FinanceTransaction(Base):
    __tablename__ = "finance_transactions"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)  # "income" or "expense"
    amount = Column(Float)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
