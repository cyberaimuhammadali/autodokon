import os
import asyncio
from datetime import datetime, date, time, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal
import models

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


async def send_telegram(message: str):
    """Telegram ga xabar yuborish"""
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print("[BOT] TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID .env da yo'q!")
        return False

    import httpx
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML",
            })
            return resp.status_code == 200
    except Exception as e:
        print(f"[BOT] Xatolik: {e}")
        return False


async def get_daily_report() -> str:
    """Bugungi savdo hisobotini tayyorlash"""
    async with AsyncSessionLocal() as db:
        today_start = datetime.combine(date.today(), time.min)
        today_end = datetime.combine(date.today(), time.max)

        receipts_result = await db.execute(
            select(models.Receipt).where(
                models.Receipt.created_at >= today_start,
                models.Receipt.created_at <= today_end,
            )
        )
        receipts = receipts_result.scalars().all()

        total_sales = sum(r.total_amount for r in receipts)
        total_count = len(receipts)

        # To'lov turlari bo'yicha
        by_method = {}
        for r in receipts:
            pays_result = await db.execute(
                select(models.ReceiptPayment).where(models.ReceiptPayment.receipt_id == r.id)
            )
            for p in pays_result.scalars().all():
                by_method[p.method] = by_method.get(p.method, 0) + p.amount

        method_lines = "\n".join([
            f"  • {m.upper()}: {a:,.0f} so'm" for m, a in by_method.items()
        ]) or "  • Ma'lumot yo'q"

        # Kam zaxira
        low_result = await db.execute(
            select(models.Product, models.Inventory).join(
                models.Inventory, models.Inventory.product_id == models.Product.id
            ).where(models.Inventory.quantity <= models.Inventory.min_quantity)
        )
        low_items = low_result.all()
        low_lines = "\n".join([
            f"  ⚠️ {p.name}: {inv.quantity:.0f} dona (min: {inv.min_quantity:.0f})"
            for p, inv in low_items[:10]
        ]) or "  ✅ Hammasi yetarli"

        report = f"""📊 <b>DokonPro ERP — Kunlik Hisobot</b>
📅 {date.today().strftime("%d.%m.%Y")}
━━━━━━━━━━━━━━━━━━━━

🛒 <b>Sotuvlar:</b>
  • Jami sotuv: <b>{total_sales:,.0f} so'm</b>
  • Cheklar soni: {total_count} ta

💳 <b>To'lov turlari:</b>
{method_lines}

📦 <b>Kam zaxiradagi tovarlar:</b>
{low_lines}

━━━━━━━━━━━━━━━━━━━━
🕐 Hisobot vaqti: {datetime.now().strftime("%H:%M")}"""

        return report


async def get_low_stock_alert() -> str | None:
    """Kam zaxira borligini tekshirish va xabar tayyorlash"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(models.Product, models.Inventory).join(
                models.Inventory, models.Inventory.product_id == models.Product.id
            ).where(models.Inventory.quantity <= models.Inventory.min_quantity)
        )
        low_items = result.all()

        if not low_items:
            return None

        lines = "\n".join([
            f"  ▪️ <b>{p.name}</b>: {inv.quantity:.0f} dona (min: {inv.min_quantity:.0f})"
            for p, inv in low_items[:15]
        ])

        return f"""⚠️ <b>KAM ZAXIRA OGOHLANTIRISHI!</b>

Quyidagi tovarlar minimum miqdorga yetdi:

{lines}

🔗 Tizimga kiring va buyurtma bering."""


async def get_purchase_suggestions() -> list[dict]:
    """Sotib olish tavsiyalari ro'yxatini qaytarish"""
    suggestions = []
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(models.Product, models.Inventory).join(
                models.Inventory, models.Inventory.product_id == models.Product.id
            ).where(models.Inventory.quantity <= models.Inventory.min_quantity)
        )
        for product, inv in result.all():
            # Tavsiya miqdori: minimum x 3 (1 oylik zaxira)
            suggested_qty = max(inv.min_quantity * 3 - inv.quantity, inv.min_quantity)
            suggestions.append({
                "product_id": product.id,
                "product_name": product.name,
                "barcode": product.barcode,
                "current_qty": inv.quantity,
                "min_qty": inv.min_quantity,
                "suggested_qty": suggested_qty,
                "estimated_cost": suggested_qty * product.cost_price,
            })
    return suggestions


async def send_daily_report():
    """Scheduler tomonidan chaqiriladigan kunlik hisobot"""
    print(f"[BOT] Kunlik hisobot yuborilmoqda... {datetime.now()}")
    report = await get_daily_report()
    success = await send_telegram(report)
    if success:
        print("[BOT] Hisobot muvaffaqiyatli yuborildi!")


async def check_and_notify_low_stock():
    """Har 30 daqiqada kam zaxira tekshiruvi"""
    alert = await get_low_stock_alert()
    if alert:
        await send_telegram(alert)
        print("[BOT] Kam zaxira ogohlantirishi yuborildi!")


# ─── Manual test ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    async def test():
        print("=== BOT TEST ===")
        report = await get_daily_report()
        print(report)
        print("\n=== KAM ZAXIRA ===")
        alert = await get_low_stock_alert()
        print(alert or "Hamma narsa yetarli")

    asyncio.run(test())
