from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date, time, timedelta
import models
import auth


# ─── PRODUCTS ───────────────────────────────────────────────────────────────

async def get_products(db: AsyncSession, skip: int = 0, limit: int = 200, search: str = ""):
    stmt = select(models.Product).where(models.Product.is_active == True)
    if search:
        stmt = stmt.where(models.Product.name.ilike(f"%{search}%"))
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_product_by_barcode(db: AsyncSession, barcode: str):
    result = await db.execute(select(models.Product).where(models.Product.barcode == barcode))
    return result.scalar_one_or_none()

async def create_product(db: AsyncSession, product_data: dict):
    product = models.Product(**product_data)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


# ─── CUSTOMERS ───────────────────────────────────────────────────────────────

async def get_customers(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(models.Customer).offset(skip).limit(limit))
    return result.scalars().all()

async def get_customer_by_phone(db: AsyncSession, phone: str):
    result = await db.execute(select(models.Customer).where(models.Customer.phone == phone))
    return result.scalar_one_or_none()

async def create_customer(db: AsyncSession, customer_data: dict):
    customer = models.Customer(**customer_data)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


# ─── SHIFTS ──────────────────────────────────────────────────────────────────

async def get_current_shift(db: AsyncSession, branch_id: int):
    result = await db.execute(
        select(models.Shift).where(
            models.Shift.branch_id == branch_id,
            models.Shift.status == models.ShiftStatusEnum.open
        )
    )
    return result.scalar_one_or_none()

async def open_shift(db: AsyncSession, branch_id: int, cashier_id: int, opening_cash: float):
    shift = models.Shift(branch_id=branch_id, cashier_id=cashier_id, opening_cash=opening_cash)
    db.add(shift)
    await db.commit()
    await db.refresh(shift)
    return shift

async def close_shift(db: AsyncSession, shift_id: int, actual_cash: float, notes: str = ""):
    result = await db.execute(select(models.Shift).where(models.Shift.id == shift_id))
    shift = result.scalar_one_or_none()
    if not shift:
        return None

    # Calculate total cash sales in this shift
    receipts_result = await db.execute(
        select(models.Receipt).where(models.Receipt.shift_id == shift_id)
    )
    receipts = receipts_result.scalars().all()

    cash_total = 0.0
    for r in receipts:
        pays_result = await db.execute(
            select(models.ReceiptPayment).where(
                models.ReceiptPayment.receipt_id == r.id,
                models.ReceiptPayment.method == models.PaymentMethodEnum.cash
            )
        )
        for p in pays_result.scalars().all():
            cash_total += p.amount

    expected = shift.opening_cash + cash_total - shift.inkassation
    shift.expected_cash = expected
    shift.actual_cash = actual_cash
    shift.difference = actual_cash - expected
    shift.status = models.ShiftStatusEnum.closed
    shift.closed_at = datetime.utcnow()
    shift.notes = notes
    await db.commit()
    await db.refresh(shift)
    return shift


# ─── RECEIPTS ─────────────────────────────────────────────────────────────────

async def create_receipt(db: AsyncSession, receipt_data: dict, items_data: list, payments_data: list, current_user: models.User):
    # Create receipt
    receipt = models.Receipt(
        branch_id=receipt_data.get("branch_id", 1),
        user_id=current_user.id,
        customer_id=receipt_data.get("customer_id"),
        shift_id=receipt_data.get("shift_id"),
        total_amount=receipt_data["total_amount"],
        discount_amount=receipt_data.get("discount_amount", 0),
    )
    db.add(receipt)
    await db.flush()

    # Create items & update inventory
    for item in items_data:
        ri = models.ReceiptItem(
            receipt_id=receipt.id,
            product_id=item["product_id"],
            quantity=item["quantity"],
            price=item["price"],
            total_price=item["total_price"],
        )
        db.add(ri)

        # Reduce inventory
        inv_result = await db.execute(
            select(models.Inventory).where(
                models.Inventory.product_id == item["product_id"],
                models.Inventory.branch_id == receipt_data.get("branch_id", 1)
            )
        )
        inv = inv_result.scalar_one_or_none()
        if inv:
            inv.quantity = max(0, inv.quantity - item["quantity"])

    # Create payments
    for pay in payments_data:
        rp = models.ReceiptPayment(
            receipt_id=receipt.id,
            method=pay["method"],
            amount=pay["amount"],
            terminal_ref=pay.get("terminal_ref"),
        )
        db.add(rp)

    # Cashback for customer
    if receipt_data.get("customer_id"):
        cust_result = await db.execute(select(models.Customer).where(models.Customer.id == receipt_data["customer_id"]))
        cust = cust_result.scalar_one_or_none()
        if cust:
            cust.bonus_balance += round(receipt_data["total_amount"] * 0.02, 0)

    await db.commit()
    await db.refresh(receipt)
    return receipt


async def get_receipts_history(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(models.Receipt).order_by(models.Receipt.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


# ─── RETURN / REFUND ─────────────────────────────────────────────────────────

async def create_return(db: AsyncSession, original_receipt_id: int, items_data: list, reason: str, refund_method: str, cashier_id: int):
    total_refund = sum(i["amount"] for i in items_data)
    ret = models.ReceiptReturn(
        original_receipt_id=original_receipt_id,
        cashier_id=cashier_id,
        reason=reason,
        total_refund=total_refund,
        refund_method=refund_method,
    )
    db.add(ret)
    await db.flush()

    for item_data in items_data:
        ri = models.ReceiptReturnItem(
            return_id=ret.id,
            receipt_item_id=item_data["receipt_item_id"],
            quantity=item_data["quantity"],
            amount=item_data["amount"],
        )
        db.add(ri)

        # Restore inventory
        orig_item_result = await db.execute(select(models.ReceiptItem).where(models.ReceiptItem.id == item_data["receipt_item_id"]))
        orig_item = orig_item_result.scalar_one_or_none()
        if orig_item:
            orig_receipt_result = await db.execute(select(models.Receipt).where(models.Receipt.id == original_receipt_id))
            orig_receipt = orig_receipt_result.scalar_one_or_none()
            if orig_receipt:
                inv_result = await db.execute(
                    select(models.Inventory).where(
                        models.Inventory.product_id == orig_item.product_id,
                        models.Inventory.branch_id == orig_receipt.branch_id
                    )
                )
                inv = inv_result.scalar_one_or_none()
                if inv:
                    inv.quantity += item_data["quantity"]

    await db.commit()
    await db.refresh(ret)
    return ret


# ─── ANALYTICS ────────────────────────────────────────────────────────────────

async def get_dashboard_analytics(db: AsyncSession, branch_id: int = None):
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)

    receipts_q = await db.execute(
        select(models.Receipt).where(
            models.Receipt.created_at >= today_start,
            models.Receipt.created_at <= today_end,
        )
    )
    receipts_today = receipts_q.scalars().all()
    total_sales_today = sum(r.total_amount for r in receipts_today)

    products_count = (await db.execute(select(func.count(models.Product.id)))).scalar()
    customers_count = (await db.execute(select(func.count(models.Customer.id)))).scalar()

    low_stock_stmt = select(func.count(models.Inventory.id)).where(
        models.Inventory.quantity <= models.Inventory.min_quantity
    )
    low_stock = (await db.execute(low_stock_stmt)).scalar()

    return {
        "total_sales_today": total_sales_today,
        "total_products": products_count,
        "total_customers": customers_count,
        "low_stock_items": low_stock,
    }


async def get_sales_chart_data(db: AsyncSession):
    today = date.today()
    data = []
    for i in range(6, -1, -1):
        target = today - timedelta(days=i)
        start = datetime.combine(target, time.min)
        end = datetime.combine(target, time.max)
        result = await db.execute(
            select(models.Receipt).where(
                models.Receipt.created_at >= start,
                models.Receipt.created_at <= end,
            )
        )
        total = sum(r.total_amount for r in result.scalars().all())
        data.append({"name": target.strftime("%d-%b"), "sotuv": total})
    return data


# ─── USERS ───────────────────────────────────────────────────────────────────

async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(models.User).where(models.User.username == username))
    return result.scalar_one_or_none()

async def get_user_by_pin(db: AsyncSession, pin: str):
    result = await db.execute(
        select(models.User).where(
            models.User.pin_code == pin,
            models.User.is_active == True
        )
    )
    return result.scalar_one_or_none()

async def get_all_users(db: AsyncSession):
    result = await db.execute(select(models.User))
    return result.scalars().all()

async def create_user(db: AsyncSession, user_data: dict):
    user = models.User(**user_data)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ─── SUPPLIERS & SUPPLY ───────────────────────────────────────────────────────

async def get_suppliers(db: AsyncSession):
    result = await db.execute(select(models.Supplier))
    return result.scalars().all()

async def create_supplier(db: AsyncSession, data: dict):
    supplier = models.Supplier(**data)
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier

async def get_supplies(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(models.Supply).order_by(models.Supply.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()

async def create_supply(db: AsyncSession, supply_data: dict, items_data: list, current_user: models.User):
    supply = models.Supply(
        supplier_id=supply_data["supplier_id"],
        branch_id=supply_data.get("branch_id", 1),
        user_id=current_user.id,
        total_amount=supply_data.get("total_amount", 0),
        notes=supply_data.get("notes"),
    )
    db.add(supply)
    await db.flush()

    for item in items_data:
        si = models.SupplyItem(
            supply_id=supply.id,
            product_id=item["product_id"],
            quantity=item["quantity"],
            unit_cost=item.get("unit_cost", 0),
        )
        db.add(si)
        inv_result = await db.execute(
            select(models.Inventory).where(
                models.Inventory.product_id == item["product_id"],
                models.Inventory.branch_id == supply_data.get("branch_id", 1)
            )
        )
        inv = inv_result.scalar_one_or_none()
        if inv:
            inv.quantity += item["quantity"]
        else:
            db.add(models.Inventory(
                product_id=item["product_id"],
                branch_id=supply_data.get("branch_id", 1),
                quantity=item["quantity"]
            ))

    await db.commit()
    await db.refresh(supply)
    return supply


# ─── FINANCE ─────────────────────────────────────────────────────────────────

async def get_finance_transactions(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(models.FinanceTransaction).order_by(models.FinanceTransaction.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()

async def create_finance_transaction(db: AsyncSession, data: dict):
    tx = models.FinanceTransaction(**data)
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return tx


# ─── BRANCHES ─────────────────────────────────────────────────────────────────

async def get_branches(db: AsyncSession):
    result = await db.execute(select(models.Branch))
    return result.scalars().all()

async def create_branch(db: AsyncSession, data: dict):
    branch = models.Branch(**data)
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    return branch
