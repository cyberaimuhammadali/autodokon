from pydantic import BaseModel
from typing import Optional, List
from models import RoleEnum, MovementTypeEnum, PaymentMethodEnum, FinanceCategoryEnum, FinanceTypeEnum
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    full_name: str
    role: RoleEnum
    branch_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class BranchBase(BaseModel):
    name: str
    address: Optional[str] = None

class BranchCreate(BranchBase):
    pass

class BranchResponse(BranchBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    barcode: str
    sku: Optional[str] = None
    unit_of_measure: str = "dona"
    category_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class PriceGroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class PriceGroupCreate(PriceGroupBase):
    pass

class PriceGroupResponse(PriceGroupBase):
    id: int

    class Config:
        from_attributes = True

class ProductPriceBase(BaseModel):
    product_id: int
    branch_id: Optional[int] = None
    price_group_id: int
    price: float

class ProductPriceCreate(ProductPriceBase):
    pass

class ProductPriceResponse(ProductPriceBase):
    id: int

    class Config:
        from_attributes = True

class InventoryBase(BaseModel):
    product_id: int
    branch_id: int
    quantity: float = 0.0
    min_quantity: float = 5.0
    expiry_date: Optional[datetime] = None

class InventoryCreate(InventoryBase):
    pass

class InventoryResponse(InventoryBase):
    id: int

    class Config:
        from_attributes = True

class StockMovementBase(BaseModel):
    product_id: int
    branch_id: int
    type: MovementTypeEnum
    quantity: float
    note: Optional[str] = None

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementResponse(StockMovementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ReceiptItemBase(BaseModel):
    product_id: int
    quantity: float
    price: float
    total_price: float

class ReceiptItemCreate(ReceiptItemBase):
    pass

class ReceiptItemResponse(ReceiptItemBase):
    id: int

    class Config:
        from_attributes = True

class ReceiptBase(BaseModel):
    branch_id: int
    user_id: int
    customer_id: Optional[int] = None
    total_amount: float
    discount_amount: float = 0.0
    payment_method: PaymentMethodEnum

class ReceiptCreate(ReceiptBase):
    items: List[ReceiptItemCreate]

class ReceiptResponse(ReceiptBase):
    id: int
    created_at: datetime
    items: List[ReceiptItemResponse]

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    phone: str
    full_name: str
    birth_date: Optional[datetime] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    bonus_points: float
    is_active: bool

    class Config:
        from_attributes = True

class SupplierBase(BaseModel):
    name: str
    phone: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    balance: float
    is_active: bool

    class Config:
        from_attributes = True

class FinanceTransactionBase(BaseModel):
    branch_id: int
    user_id: int
    type: FinanceTypeEnum
    category: FinanceCategoryEnum
    amount: float
    description: Optional[str] = None

class FinanceTransactionCreate(FinanceTransactionBase):
    pass

class FinanceTransactionResponse(FinanceTransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SupplyItemCreate(BaseModel):
    product_id: int
    quantity: float
    incoming_price: float

class SupplyCreate(BaseModel):
    supplier_id: int
    branch_id: int
    paid_amount: float
    items: List[SupplyItemCreate]



