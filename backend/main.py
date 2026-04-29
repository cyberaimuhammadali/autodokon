from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from typing import Optional, List
from pydantic import BaseModel
import models, crud, auth
from database import engine, get_db
from scheduler import create_scheduler
from bot import send_telegram, get_daily_report, get_purchase_suggestions, get_low_stock_alert

app = FastAPI(title="DokonPro ERP API v2", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── DB INIT ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    # Seed initial data
    async with AsyncSession(engine) as db:
        branch = await crud.get_branches(db)
        if not branch:
            new_branch = await crud.create_branch(db, {"name": "Asosiy Filial", "address": "Toshkent", "phone": "+998901234567"})
            branch_id = new_branch.id
        else:
            branch_id = branch[0].id

        admin = await crud.get_user_by_username(db, "admin")
        if not admin:
            await crud.create_user(db, {
                "username": "admin",
                "full_name": "Administrator",
                "hashed_password": auth.get_password_hash("admin123"),
                "role": models.RoleEnum.owner,
                "pin_code": "0000",
                "branch_id": branch_id,
                "is_active": True,
            })

    # Start background scheduler
    scheduler = create_scheduler()
    scheduler.start()
    app.state.scheduler = scheduler
    print("[OK] Scheduler ishga tushdi (Telegram hisobotlar yoqilgan)")


@app.on_event("shutdown")
async def shutdown():
    if hasattr(app.state, 'scheduler'):
        app.state.scheduler.shutdown()


# ─── PYDANTIC SCHEMAS ─────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    user_id: int

class PinLoginRequest(BaseModel):
    pin: str

class ProductCreate(BaseModel):
    barcode: Optional[str] = None
    name: str
    price: float
    cost_price: float = 0.0
    category_id: Optional[int] = None
    description: Optional[str] = None

class CustomerCreate(BaseModel):
    full_name: str
    phone: Optional[str] = None

class ReceiptPaymentIn(BaseModel):
    method: str
    amount: float
    terminal_ref: Optional[str] = None

class ReceiptItemIn(BaseModel):
    product_id: int
    quantity: float
    price: float
    total_price: float

class ReceiptCreate(BaseModel):
    branch_id: int = 1
    customer_id: Optional[int] = None
    shift_id: Optional[int] = None
    total_amount: float
    discount_amount: float = 0.0
    items: List[ReceiptItemIn]
    payments: List[ReceiptPaymentIn]

class ShiftOpenRequest(BaseModel):
    branch_id: int = 1
    opening_cash: float = 0.0

class ShiftCloseRequest(BaseModel):
    actual_cash: float
    notes: Optional[str] = ""

class ReturnItemIn(BaseModel):
    receipt_item_id: int
    quantity: float
    amount: float

class ReturnCreate(BaseModel):
    items: List[ReturnItemIn]
    reason: Optional[str] = ""
    refund_method: str = "cash"

class UserCreate(BaseModel):
    username: str
    full_name: str
    password: str
    role: str = "cashier"
    pin_code: Optional[str] = None
    branch_id: int = 1

class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    inn: Optional[str] = None

class SupplyItemIn(BaseModel):
    product_id: int
    quantity: float
    unit_cost: float = 0.0

class SupplyCreate(BaseModel):
    supplier_id: int
    branch_id: int = 1
    total_amount: float = 0.0
    notes: Optional[str] = None
    items: List[SupplyItemIn]

class FinanceCreate(BaseModel):
    branch_id: int = 1
    type: str
    amount: float
    description: Optional[str] = None
    category: Optional[str] = None

class BranchCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None


# ─── AUTH ENDPOINTS ────────────────────────────────────────────────────────────

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await crud.get_user_by_username(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login yoki parol xato")
    token = auth.create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "full_name": user.full_name, "user_id": user.id}


@app.post("/auth/pin-login", response_model=Token)
async def pin_login(req: PinLoginRequest, db: AsyncSession = Depends(get_db)):
    user = await crud.get_user_by_pin(db, req.pin)
    if not user:
        raise HTTPException(status_code=401, detail="PIN noto'g'ri")
    token = auth.create_access_token({"sub": user.username}, expires_delta=timedelta(hours=2))
    return {"access_token": token, "token_type": "bearer", "role": user.role, "full_name": user.full_name, "user_id": user.id}


# ─── USERS ─────────────────────────────────────────────────────────────────────

@app.get("/users/me")
async def read_me(current_user: models.User = Depends(auth.get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "full_name": current_user.full_name, "role": current_user.role, "branch_id": current_user.branch_id}


@app.get("/users/")
async def read_users(current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner, models.RoleEnum.manager)), db: AsyncSession = Depends(get_db)):
    return await crud.get_all_users(db)


@app.post("/users/")
async def create_user(user_data: UserCreate, current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner)), db: AsyncSession = Depends(get_db)):
    data = user_data.dict()
    data["hashed_password"] = auth.get_password_hash(data.pop("password"))
    data["role"] = models.RoleEnum(data["role"])
    return await crud.create_user(db, data)


# ─── BRANCHES ─────────────────────────────────────────────────────────────────

@app.get("/branches/")
async def read_branches(current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    return await crud.get_branches(db)


@app.post("/branches/")
async def create_branch(branch: BranchCreate, current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner)), db: AsyncSession = Depends(get_db)):
    return await crud.create_branch(db, branch.dict())


# ─── PRODUCTS ─────────────────────────────────────────────────────────────────

@app.get("/products/")
async def read_products(search: str = "", skip: int = 0, limit: int = 200, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    return await crud.get_products(db, skip=skip, limit=limit, search=search)


@app.get("/products/barcode/{barcode}")
async def get_by_barcode(barcode: str, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    product = await crud.get_product_by_barcode(db, barcode)
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    return product


@app.post("/products/")
async def create_product(product: ProductCreate, current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner, models.RoleEnum.manager, models.RoleEnum.warehouse)), db: AsyncSession = Depends(get_db)):
    return await crud.create_product(db, product.dict())


# ─── CUSTOMERS ────────────────────────────────────────────────────────────────

@app.get("/customers/")
async def read_customers(current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    return await crud.get_customers(db)


@app.get("/customers/phone/{phone}")
async def get_customer_by_phone(phone: str, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    customer = await crud.get_customer_by_phone(db, phone)
    if not customer:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    return customer


@app.post("/customers/")
async def create_customer(customer: CustomerCreate, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    return await crud.create_customer(db, customer.dict())


# ─── SHIFTS ───────────────────────────────────────────────────────────────────

@app.get("/shifts/current")
async def get_current_shift(branch_id: int = 1, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    shift = await crud.get_current_shift(db, branch_id)
    if not shift:
        raise HTTPException(status_code=404, detail="Ochiq smena topilmadi")
    return shift


@app.post("/shifts/open")
async def open_shift(req: ShiftOpenRequest, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    existing = await crud.get_current_shift(db, req.branch_id)
    if existing:
        raise HTTPException(status_code=400, detail="Bu filialda allaqachon ochiq smena bor")
    return await crud.open_shift(db, req.branch_id, current_user.id, req.opening_cash)


@app.post("/shifts/{shift_id}/close")
async def close_shift(shift_id: int, req: ShiftCloseRequest, current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner, models.RoleEnum.manager)), db: AsyncSession = Depends(get_db)):
    shift = await crud.close_shift(db, shift_id, req.actual_cash, req.notes)
    if not shift:
        raise HTTPException(status_code=404, detail="Smena topilmadi")
    return shift


# ─── RECEIPTS ─────────────────────────────────────────────────────────────────

@app.post("/receipts/")
async def create_receipt(receipt: ReceiptCreate, background_tasks: BackgroundTasks, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    data = receipt.dict()
    items = data.pop("items")
    payments = data.pop("payments")
    new_receipt = await crud.create_receipt(db, data, items, payments, current_user)

    # Mock OFD (background)
    background_tasks.add_task(mock_ofd_send, new_receipt.id)
    return new_receipt


async def mock_ofd_send(receipt_id: int):
    """OFD ga yuborish simulyatsiyasi (haqiqiy token bo'lganda to'g'ri servis yoziladi)"""
    import asyncio
    await asyncio.sleep(1)
    # Real OFD integratsiyasida bu yerda soliq.uz ga HTTP so'rov ketadi


@app.get("/receipts/history")
async def read_receipts_history(skip: int = 0, limit: int = 100, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    return await crud.get_receipts_history(db, skip=skip, limit=limit)


@app.post("/receipts/{receipt_id}/return")
async def return_receipt(receipt_id: int, ret: ReturnCreate, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    result = await crud.create_return(
        db,
        original_receipt_id=receipt_id,
        items_data=[i.dict() for i in ret.items],
        reason=ret.reason,
        refund_method=ret.refund_method,
        cashier_id=current_user.id,
    )
    return result


# ─── SUPPLIERS & SUPPLY ───────────────────────────────────────────────────────

@app.get("/suppliers/")
async def read_suppliers(current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    return await crud.get_suppliers(db)


@app.post("/suppliers/")
async def create_supplier(supplier: SupplierCreate, current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner, models.RoleEnum.manager)), db: AsyncSession = Depends(get_db)):
    return await crud.create_supplier(db, supplier.dict())


@app.get("/supply/")
async def read_supplies(current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    return await crud.get_supplies(db)


@app.post("/supply/")
async def create_supply(supply: SupplyCreate, current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner, models.RoleEnum.manager, models.RoleEnum.warehouse)), db: AsyncSession = Depends(get_db)):
    data = supply.dict()
    items = data.pop("items")
    return await crud.create_supply(db, data, items, current_user)


# ─── FINANCE ──────────────────────────────────────────────────────────────────

@app.get("/finance/")
async def read_finance(current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner, models.RoleEnum.manager)), db: AsyncSession = Depends(get_db)):
    return await crud.get_finance_transactions(db)


@app.post("/finance/")
async def create_finance(tx: FinanceCreate, current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner, models.RoleEnum.manager)), db: AsyncSession = Depends(get_db)):
    data = tx.dict()
    data["user_id"] = current_user.id
    return await crud.create_finance_transaction(db, data)


# ─── ANALYTICS ────────────────────────────────────────────────────────────────

@app.get("/analytics/dashboard")
async def dashboard_analytics(branch_id: int = None, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    return await crud.get_dashboard_analytics(db, branch_id)


@app.get("/analytics/chart")
async def chart_data(current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    return await crud.get_sales_chart_data(db)


# ─── TELEGRAM BOT ENDPOINTS ───────────────────────────────────────────────────

@app.post("/bot/send-daily-report")
async def trigger_daily_report(current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner, models.RoleEnum.manager))):
    """Qo'lda kunlik hisobotni Telegram ga yuborish"""
    report = await get_daily_report()
    success = await send_telegram(report)
    return {"success": success, "message": "Hisobot yuborildi" if success else "Xatolik (Token yoki Chat ID tekshiring)"}


@app.post("/bot/send-low-stock-alert")
async def trigger_low_stock_alert(current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner, models.RoleEnum.manager))):
    """Qo'lda kam zaxira ogohlantirishini yuborish"""
    alert = await get_low_stock_alert()
    if not alert:
        return {"success": True, "message": "Kam zaxira yo'q — hamma tovarlar yetarli"}
    success = await send_telegram(alert)
    return {"success": success}


# ─── PURCHASE SUGGESTIONS (AVTOMATIK BUYURTMA) ───────────────────────────────

@app.get("/purchase-suggestions")
async def get_purchase_suggestions_api(current_user: models.User = Depends(auth.get_current_user)):
    """Sotib olish kerak bo'lgan tovarlar ro'yxati (avtomatik tavsiya)"""
    return await get_purchase_suggestions()


@app.post("/purchase-suggestions/send-telegram")
async def send_purchase_suggestions_to_telegram(current_user: models.User = Depends(auth.require_roles(models.RoleEnum.owner, models.RoleEnum.manager))):
    """Buyurtma tavsiyalarini Telegram ga yuborish"""
    suggestions = await get_purchase_suggestions()
    if not suggestions:
        return {"success": True, "message": "Barcha tovarlar yetarli, buyurtma kerak emas"}

    lines = "\n".join([
        f"  {i+1}. <b>{s['product_name']}</b>\n     Hozir: {s['current_qty']:.0f} | Buyurtma: <b>{s['suggested_qty']:.0f} dona</b> | ~{s['estimated_cost']:,.0f} so'm"
        for i, s in enumerate(suggestions)
    ])

    message = f"""\U0001f6d2 <b>AVTOMATIK BUYURTMA RO'YXATI</b>
\U0001f4c5 {__import__('datetime').date.today().strftime("%d.%m.%Y")}

Quyidagi tovarlarni sotib olish tavsiya etiladi:

{lines}

<i>Jami {len(suggestions)} ta tovar — Tizim avtomatik tayyorladi</i>"""

    success = await send_telegram(message)
    return {"success": success, "count": len(suggestions)}
