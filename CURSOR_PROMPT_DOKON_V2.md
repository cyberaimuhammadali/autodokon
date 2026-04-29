# DokonPro ERP v2 — Cursor Prompt (DOKON_ERP_FEATURES asosida)

> **Muhim:** Bu prompt `DOKON_ERP_FEATURES.md` hujjatidagi tizim uchun.
> Stack: FastAPI + SQLite→PostgreSQL + React (Vite) + Tailwind CSS v4 + TanStack Query + Recharts
> Barcode, chek chop, cashback — allaqachon ishlaydi. Quyidagilar yo'q.

---

## FAZA 1 — KRITIK (Productionga chiqishdan oldin majburiy)

---

### VAZIFA 1.1 — SQLite → PostgreSQL ko'chirish

```
MUAMMO: SQLite production uchun yaroqsiz — parallel so'rovlarda lock,
ma'lumot yo'qolishi, backup qiyinligi.

1. requirements.txt ga qo'shing:
   asyncpg
   psycopg2-binary
   alembic

2. .env fayl yarating:
   DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dokonpro
   # SQLite uchun fallback (local dev):
   # DATABASE_URL=sqlite+aiosqlite:///./dokonpro.db

3. database.py ni yangilang:
   - SQLAlchemy async engine ishlatsin
   - DATABASE_URL .env dan o'qilsin

4. Alembic sozlash:
   alembic init alembic
   alembic/env.py da Base.metadata + DATABASE_URL ulang

5. Birinchi migration:
   alembic revision --autogenerate -m "initial_schema"
   alembic upgrade head

6. docker-compose.yml:
   services:
     db:
       image: postgres:16-alpine
       environment:
         POSTGRES_DB: dokonpro
         POSTGRES_USER: dokon
         POSTGRES_PASSWORD: secret123
       volumes:
         - pgdata:/var/lib/postgresql/data
       ports:
         - "5432:5432"
     api:
       build: .
       depends_on: [db]
       environment:
         DATABASE_URL: postgresql+asyncpg://dokon:secret123@db:5432/dokonpro
```

---

### VAZIFA 1.2 — OFD Integratsiya (soliq.uz)

```
MUAMMO: O'zbekistonda elektron fiskal chek majburiy.
Hozir chek faqat ekranda ko'rinadi, soliq idorasiga yetmaydi.

1. models.py da Sale modeliga qo'shing:
   ofd_status = Column(Enum("pending","sent","failed"), default="pending")
   ofd_fiscal_id = Column(String, nullable=True)
   ofd_error = Column(Text, nullable=True)
   ofd_sent_at = Column(DateTime, nullable=True)

2. services/ofd_service.py yarating:

   class OFDService:
       BASE_URL = os.getenv("OFD_API_URL", "https://ofd.soliq.uz/api/v1")
       TOKEN = os.getenv("OFD_TOKEN")
       INN = os.getenv("OFD_INN")
       TERMINAL_ID = os.getenv("OFD_TERMINAL_ID")

       async def send(self, sale: Sale, items: list[SaleItem]) -> bool:
           payload = {
               "TerminalID": self.TERMINAL_ID,
               "Time": sale.created_at.strftime("%Y%m%dT%H%M%S"),
               "ReceivedCash": float(sale.cash_amount or 0),
               "ReceivedCard": float(sale.card_amount or 0),
               "Items": [
                   {
                       "Name": item.product.name,
                       "Barcode": item.product.barcode or "",
                       "Price": float(item.price) * 100,  # tiyin
                       "Amount": item.quantity,
                       "VAT": 12,  # 12% QQS
                   }
                   for item in items
               ]
           }
           async with httpx.AsyncClient() as client:
               r = await client.post(
                   f"{self.BASE_URL}/receipt",
                   json=payload,
                   headers={"Authorization": f"Bearer {self.TOKEN}"},
                   timeout=10.0
               )
           if r.status_code == 200:
               data = r.json()
               sale.ofd_fiscal_id = data.get("FiscalSign")
               sale.ofd_status = "sent"
               sale.ofd_sent_at = datetime.utcnow()
               return True
           else:
               sale.ofd_status = "failed"
               sale.ofd_error = r.text
               return False

       async def retry_all_failed(self, db: Session):
           sales = db.query(Sale).filter(Sale.ofd_status == "failed").limit(50).all()
           for sale in sales:
               await self.send(sale, sale.items)
           db.commit()

3. POST /sales endpointida sotuv yaratilgandan keyin:
   background_tasks.add_task(ofd_service.send, sale, sale_items)

4. .env ga qo'shing:
   OFD_API_URL=https://ofd.soliq.uz/api/v1
   OFD_TOKEN=your_token_here
   OFD_INN=your_inn_here
   OFD_TERMINAL_ID=your_terminal_id

5. GET /admin/ofd/failed endpointi:
   - ofd_status="failed" bo'lgan sotuvlar ro'yxati
   POST /admin/ofd/retry:
   - Barcha failed ni qayta yuborish

6. Chekda OFD fiskal raqami va QR kod ko'rsatish:
   Frontend receipt komponentida:
   {sale.ofd_fiscal_id && (
     <div>Fiskal: {sale.ofd_fiscal_id}</div>
     <QRCode value={`https://ofd.soliq.uz/check/${sale.ofd_fiscal_id}`} size={80}/>
   )}
   QR kutubxona: npm install qrcode.react
```

---

### VAZIFA 1.3 — Rollar tizimi (RBAC)

```
MUAMMO: Hozir faqat "admin" bor. Kassir ham barcha ma'lumotga kiradi.

1. User modeliga qo'shing:
   role = Column(Enum("owner","manager","cashier","warehouse"), default="cashier")
   pin_code = Column(String(4), nullable=True)  # kassir tez kirish uchun
   is_active = Column(Boolean, default=True)

2. core/permissions.py yarating:
   ROLE_PERMISSIONS = {
       "owner":     ["*"],
       "manager":   ["pos","inventory","reports","suppliers","customers"],
       "cashier":   ["pos","customers_read"],
       "warehouse": ["inventory","suppliers_receive"],
   }

   def require_role(*roles):
       def decorator(func):
           @wraps(func)
           async def wrapper(*args, current_user=Depends(get_current_user), **kwargs):
               if current_user.role not in roles and "owner" not in roles:
                   raise HTTPException(403, "Ruxsat yo'q")
               return await func(*args, current_user=current_user, **kwargs)
           return wrapper
       return decorator

3. Endpointlarga qo'shing:
   @router.get("/finance/transactions")
   @require_role("owner", "manager")
   async def get_transactions(...):

   @router.post("/sales")
   @require_role("owner", "manager", "cashier")
   async def create_sale(...):

   @router.get("/reports/...")
   @require_role("owner", "manager")
   ...

4. PIN orqali kassir kirishi:
   POST /auth/pin-login
   { "pin": "1234" }
   - PIN bo'yicha userni topish
   - 2 soatlik token berish
   - 3 marta xato → 10 daqiqa blok (Redis yoki in-memory)

5. Frontend:
   - AuthContext ga role saqlash
   - Sidebar: role ga qarab menu filtrlash
     owner: hamma
     manager: POS, Inventar, Hisobotlar, Mijozlar, Ta'minot
     cashier: faqat POS
     warehouse: Inventar, Ta'minot
   - PIN kirish ekrani (4 xonali raqam pad)
   - "Kassir almashtirish" tugmasi POS da (smena to'xtamasdan)
```

---

### VAZIFA 1.4 — Smena tizimi (Shift Management)

```
1. Shift modeli yarating:
   class Shift(Base):
       id, cashier_id (FK), branch_id
       status = Enum("open", "closed")
       opened_at, closed_at
       opening_cash = Column(Decimal)         # boshlang'ich naqd
       expected_cash = Column(Decimal)        # tizim hisoblagan
       actual_cash = Column(Decimal)          # kassir hisoblagan
       difference = Column(Decimal)           # farq
       inkassation = Column(Decimal, default=0)

2. Endpointlar:
   POST /shifts/open  → { opening_cash: 50000 }
   GET  /shifts/current  → joriy smena ma'lumoti
   POST /shifts/{id}/close  → { actual_cash: 125000 }
   POST /shifts/{id}/inkassation  → { amount: 100000 }
   GET  /shifts/{id}/report  → to'liq hisobot

3. Smena hisoboti (GET /shifts/{id}/report):
   {
     cashier: "Jasur",
     opened_at: "...", closed_at: "...",
     total_sales: 1250000,
     total_returns: 25000,
     by_payment: { cash: 800000, card: 425000, bonus: 25000 },
     discount_total: 15000,
     net: 1210000,
     transaction_count: 47,
     opening_cash: 50000,
     expected_cash: 850000,
     actual_cash: 848000,
     difference: -2000,
     inkassation: 700000
   }

4. Sale modeliga shift_id (FK) qo'shing — smena bo'lmasa sotuv bo'lmasin

5. Frontend — ShiftClose.jsx:
   - Barcha to'lov usullari bo'yicha jami
   - Kassir faktik naqd kiritadi
   - Farq ko'rsatiladi (rang bilan: yashil ok, qizil muammo)
   - "Smena yopish" tugmasi
   - Hisobotni print qilish (80mm format)
```

---

### VAZIFA 1.5 — Qaytarim (Return/Refund)

```
MUAMMO: Hozir qaytarim endpointi yo'q.

1. SaleReturn modeli:
   class SaleReturn(Base):
       id, sale_id (FK), cashier_id (FK)
       reason = Column(Text)
       returned_at = Column(DateTime)
       total_refund = Column(Decimal)
       refund_method = Enum("cash","card","bonus")

   class SaleReturnItem(Base):
       return_id (FK), sale_item_id (FK)
       quantity = Column(Integer)
       amount = Column(Decimal)

2. POST /sales/{id}/return endpointi:
   {
     "items": [{ "sale_item_id": 1, "quantity": 2 }],
     "reason": "Sifatsiz mahsulot",
     "refund_method": "cash"
   }
   - Stock tiklash (qaytarilgan miqdor omborda ortsin)
   - OFD ga qaytarim cheki yuborish
   - Finance tranzaksiya: expense qayd qilish
   - Mijoz bonusi (agar bonus bilan sotilgan bo'lsa) ayirish

3. GET /sales/{id}/returns — bu sotuvning barcha qaytarimlari

4. Frontend — POS da "Qaytarim" tugmasi:
   - Chek raqami bo'yicha sotuv topish
   - Qaytariladigan tovarlarni belgilash
   - Sabab kiritish
   - Qaytarim usuli tanlash
```

---

### VAZIFA 1.6 — Aralash To'lov

```
MUAMMO: Hozir bir sotuvda faqat bitta to'lov usuli — bu real hayotda ishlamaydi.

1. Sale modelini yangilang:
   # Eski: payment_type = Column(String)
   # Yangi: alohida jadval

   class SalePayment(Base):
       id, sale_id (FK)
       method = Column(Enum("cash","uzcard","humo","payme","click","bonus"))
       amount = Column(Decimal)
       terminal_ref = Column(String, nullable=True)  # plastik chek raqami

2. POST /sales:
   {
     "items": [...],
     "customer_id": null,
     "payments": [
       {"method": "cash", "amount": 30000},
       {"method": "uzcard", "amount": 20000}
     ]
   }
   Validatsiya: sum(payments) >= total_amount

3. Qaytim hisoblash:
   change = sum(payments) - total_amount
   # Faqat naqd qismidan qaytim beriladi

4. Frontend — PaymentModal.jsx (to'liq qayta yozing):
   - Jami summa ko'rsatilsin
   - Har bir to'lov usuli uchun tugma + miqdor maydoni
   - "Qoldi: X so'm" — real vaqtda
   - Naqd kiritilganda qaytim avtomatik: "Qaytim: 5 000 so'm"
   - To'lov usullari: [Naqd] [UZCARD] [HUMO] [Payme] [Click] [Bonus]
   - Bonus faqat mijoz tanlanganda aktiv bo'lsin
```

---

## FAZA 2 — MUHIM (Biznes uchun zarur)

---

### VAZIFA 2.1 — Zakupka (Kirim moduli)

```
1. Yangi modellar:
   class Supplier(Base):  # allaqachon bor, kengaytiring
       contact_person, phone, address, inn

   class PurchaseOrder(Base):
       id, supplier_id (FK), created_by (FK)
       status = Enum("draft","ordered","received","cancelled")
       order_date, expected_date, received_date
       total_amount = Column(Decimal)
       notes = Column(Text)

   class PurchaseOrderItem(Base):
       po_id (FK), product_id (FK)
       ordered_qty, received_qty
       unit_cost = Column(Decimal)  # sotib olish narxi

2. Endpointlar:
   POST /purchase-orders          → yangi zakupka
   GET  /purchase-orders          → ro'yxat (status filter bilan)
   POST /purchase-orders/{id}/receive → qabul qilish
     { items: [{ product_id, received_qty, unit_cost, expiry_date }] }
     → Stock oshirish
     → Lot yaratish (expiry_date bilan)
     → Supplier balansiga qarz qo'shish

3. Frontend — PurchaseOrders.jsx:
   - Yangi zakupka: supplier, tovarlar, miqdor, kutilgan sana
   - "Qabul qilish" ekrani: har tovar uchun faktik miqdor + muddati kiriting
   - Supplier qarzlari ro'yxati
   POST /finance/suppliers/{id}/pay → qarzni to'lash
```

---

### VAZIFA 2.2 — Muddati va FIFO Inventar

```
1. Lot modeli (agar yo'q bo'lsa yarating):
   class ProductLot(Base):
       id, product_id (FK), branch_id (FK)
       quantity = Column(Decimal)
       unit_cost = Column(Decimal)   # sotib olish narxi
       expiry_date = Column(Date, nullable=True)
       received_at = Column(DateTime)
       po_id (FK, nullable)          # qaysi zakupkadan kelgan

2. FIFO sotuv:
   # services/inventory.py
   def allocate_fifo(product_id, quantity, db):
       lots = db.query(ProductLot).filter(
           ProductLot.product_id == product_id,
           ProductLot.quantity > 0
       ).order_by(
           ProductLot.expiry_date.asc().nullslast(),
           ProductLot.received_at.asc()
       ).all()

       allocated = []
       remaining = quantity
       for lot in lots:
           take = min(lot.quantity, remaining)
           allocated.append({"lot_id": lot.id, "qty": take})
           lot.quantity -= take
           remaining -= take
           if remaining <= 0:
               break
       if remaining > 0:
           raise HTTPException(400, f"{remaining} dona yetishmaydi")
       return allocated

3. Muddati alertlar:
   GET /inventory/expiring?days=7:
   → Muddati {days} kundan kam qolgan lotlar

   Avtomatik chegirma (kunlik cron, APScheduler):
   days_left <= 3 → 50% chegirma (lot.discount_pct = 50)
   days_left <= 7 → 25%
   days_left <= 14 → 10%
   POS da bu chegirma avtomatik qo'llanilsin

4. Frontend — Inventory.jsx:
   - "Muddati yaqin" tab — ranglar bilan: qizil(<3), sariq(<7), yashil(<14)
   - Lotlar bo'yicha mahsulot ko'rish
   - Muddati o'tgan → avtomatik "Expired" badge
```

---

### VAZIFA 2.3 — Ko'p Filial (Multi-Branch)

```
1. Branch modeli (agar yo'q bo'lsa):
   class Branch(Base):
       id, name, address, phone
       is_active = Column(Boolean, default=True)

2. User + Sale + Stock modellariga branch_id (FK) qo'shing

3. Filial izolyatsiyasi:
   - Kassir faqat o'z filiali sotuvlarini ko'rsin
   - Stock faqat o'z filiali bo'yicha
   - GET so'rovlarda: WHERE branch_id = current_user.branch_id
   - Owner va Manager: barcha filiallar (query param: ?branch_id=all)

4. Filiallararo transfer:
   class Transfer(Base):
       from_branch_id, to_branch_id
       status = Enum("pending","shipped","received")
       created_by (FK)

   class TransferItem(Base):
       transfer_id (FK), product_id (FK), quantity

   POST /transfers/create
   POST /transfers/{id}/ship
   POST /transfers/{id}/receive → stock maqsad filialdа oshsin

5. Frontend:
   - Owner uchun filial tanlash dropdownи (barcha sahifalarda)
   - Transfer yaratish va kuzatish sahifasi
```

---

### VAZIFA 2.4 — Xodimlar Moduli

```
1. Employee modeli (User ni kengaytiring):
   full_name, phone, position, salary
   hire_date = Column(Date)
   is_active = Column(Boolean, default=True)

2. Endpointlar:
   GET  /employees          → ro'yxat
   POST /employees          → yangi xodim
   PUT  /employees/{id}     → tahrirlash
   DELETE /employees/{id}   → o'chirish (is_active=False)

3. Smena hisobotidan kassir KPI:
   GET /reports/cashier-performance?from=&to=:
   {
     cashier_id, name,
     total_sales, total_transactions,
     avg_check, returns_count,
     working_days, shifts_count
   }

4. Frontend — Employees.jsx:
   - Xodimlar jadvali: ism, lavozim, filial, holat
   - Xodim qo'shish/tahrirlash modali
   - Kassir hisoboti sahifasi (owner/manager uchun)
```

---

### VAZIFA 2.5 — Chegirma va Kupon Tizimi

```
1. Modellar:
   class Discount(Base):
       name, discount_type = Enum("percent","fixed","bogo")
       value = Column(Decimal)          # 10 (%) yoki 5000 (so'm)
       applies_to = Enum("product","category","total")
       product_id (FK, nullable)
       category_id (FK, nullable)
       min_amount = Column(Decimal, nullable=True)  # minimal xarid summasi
       starts_at, ends_at = Column(DateTime)
       is_active = Column(Boolean, default=True)

   class Coupon(Base):
       code = Column(String, unique=True)
       discount_id (FK)
       max_uses, used_count
       expires_at

2. POS endpointida:
   POST /sales/calculate-discount:
   { cart_items: [...], coupon_code: "SAVE10", customer_id: null }
   → Chegirma hisoblangan summa qaytsin

3. Frontend POS da:
   - "Kupon" maydon (kod kiriting)
   - Aktiv aksiyalar avtomatik ko'rsatilsin (masalan: "3 ta olsang, 1 ta bepul")
   - Chegirma qo'llanilganda savatda ko'rsatilsin: "Tejadingiz: 15 000 so'm"
```

---

### VAZIFA 2.6 — Inventarizatsiya

```
1. InventoryCheck modeli:
   class InventoryCheck(Base):
       branch_id (FK), created_by (FK)
       status = Enum("in_progress","completed")
       started_at, completed_at

   class InventoryCheckItem(Base):
       check_id (FK), product_id (FK)
       system_qty = Column(Decimal)    # tizim bo'yicha
       actual_qty = Column(Decimal)    # hisoblangan
       difference = Column(Decimal)    # farq (actual - system)

2. Jarayon:
   POST /inventory/checks/start → yangi inventarizatsiya boshlash
   PUT  /inventory/checks/{id}/item → har bir mahsulot faktik miqdori
   POST /inventory/checks/{id}/complete → farqlarni tizimga kiritish
   GET  /inventory/checks/{id}/report → hisobot (farqlar, umumiy yo'qotish)

3. Frontend:
   - Inventarizatsiya ro'yxati (barcode scanner bilan jadval to'ldirish)
   - Farq > 0: qizil, < 0: sariq, = 0: yashil
   - "Tasdiqlash" va "Rad etish" (menejer ruxsati bilan)
```

---

## FAZA 3 — KENGAYTIRISH

---

### VAZIFA 3.1 — Kengaytirilgan Hisobotlar

```
Barcha hisobotlar GET /reports/... endpointida:

1. /reports/sales-summary?from=&to=&branch_id=&group_by=day|week|month
   → Daromad dinamikasi (Recharts LineChart uchun data)

2. /reports/product-margin:
   → Har mahsulot: sotib olish narxi, sotuv narxi, gross margin %
   → Saralash: eng foydali / eng zarar

3. /reports/abc-analysis:
   → A guruh: top 20% mahsulot → 80% daromad
   → B guruh: o'rta
   → C guruh: kam sotiladigan (omborda yotar)

4. /reports/cashier?cashier_id=&from=&to=
   → Kassir KPI: sotuvlar, qaytarimlar, o'rtacha chek, smena soni

5. /reports/customer-loyalty:
   → Eng faol mijozlar, umumiy xarid, bonus holati

6. Frontend — Reports.jsx:
   - Sana filtri (DateRangePicker)
   - Filial filtri (owner uchun)
   - Har hisobot uchun jadval + grafik
   - "Excel eksport" tugmasi (SheetJS / xlsx library)
   - "PDF" tugmasi (react-to-print)
```

---

### VAZIFA 3.2 — O'zbekcha Lokalizatsiya va Printer

```
1. i18n (react-i18next):
   npm install react-i18next i18next

   src/locales/uz.json:
   { "pos": "Kassa", "inventory": "Ombor", "reports": "Hisobotlar", ... }

   src/locales/ru.json:
   { "pos": "Касса", "inventory": "Склад", "reports": "Отчеты", ... }

   Til settings da saqlansin (localStorage → server da user.language)

2. UZS formatlash (src/utils/format.js):
   export const uzs = (n) =>
     new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm";
   // 1250000 → "1 250 000 so'm"

   export const uzsShort = (n) => n >= 1e6
     ? (n/1e6).toFixed(1) + " mln"
     : uzs(n);

3. Termal chek (80mm) — PrintReceipt.jsx:
   @media print {
     body { width: 80mm; font-size: 12px; }
     .no-print { display: none; }
   }

   Chek tarkibi:
   - Do'kon nomi + manzil + telefon
   - Sana: DD.MM.YYYY HH:mm
   - ───────────────────
   - Tovarlar: nomi, miqdor × narx = summa
   - ───────────────────
   - Jami: X so'm
   - Chegirma: Y so'm
   - To'lov: naqd X / UZCARD Y
   - Qaytim: Z so'm
   - Kassir: [ism]
   - Fiskal: [ofd_fiscal_id]
   - QR kod (OFD tekshirish uchun)
   - ───────────────────
   - Rahmat! Yana keling!

4. Til tugmasi — Header da:
   <button onClick={() => i18n.changeLanguage('uz')}>O'z</button>
   <button onClick={() => i18n.changeLanguage('ru')}>Ru</button>
```

---

### VAZIFA 3.3 — Telegram Bot (Hisobot va Alertlar)

```
1. pip install python-telegram-bot

2. bot/telegram_bot.py:

   CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")  # owner Telegram ID
   BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

   async def send_daily_report():
       report = await get_daily_summary()
       text = f"""
   📊 Kunlik hisobot — {today}

   💰 Jami sotuv: {uzs(report.total)}
   🧾 Sotuvlar soni: {report.count}
   📦 Qaytarimlar: {uzs(report.returns)}
   🏆 Top mahsulot: {report.top_product}

   🏪 Filialar:
   {branches_summary}
       """
       await bot.send_message(CHAT_ID, text)

   async def send_low_stock_alert(product_name, qty, branch):
       await bot.send_message(CHAT_ID,
           f"⚠️ Kam qoldiq: {product_name}\n"
           f"Qoldi: {qty} dona — {branch}"
       )

3. Schedulerga qo'shing (APScheduler):
   - Kunlik hisobot: har kuni 22:00 da
   - Smena yopilganda: hisobot
   - Low-stock: darhol

4. Bot komandalar:
   /start — botni ishga tushirish
   /today — bugungi hisobot
   /stock — kam qoldiq ro'yxati
   /shifts — faol smena holati
```

---

### VAZIFA 3.4 — Xavfsizlik va Production Tayyor

```
1. Rate limiting (slowapi):
   pip install slowapi
   - /auth/login: 5 req/min per IP
   - /auth/pin-login: 3 req/5min per IP
   - Umumiy: 200 req/min per user

2. CORS production uchun:
   # .env
   ALLOWED_ORIGINS=https://yourdomain.uz,https://www.yourdomain.uz
   # Dev: ALLOWED_ORIGINS=*

3. JWT sozlash:
   ACCESS_TOKEN_EXPIRE = 8 soat (smena uchun)
   REFRESH_TOKEN_EXPIRE = 30 kun
   SECRET_KEY = os.getenv("SECRET_KEY")  # uzun random string

4. Structured logging:
   pip install structlog
   - Har request: user_id, role, method, path, status, duration_ms
   - Har sotuv: sale_id, cashier_id, total, items_count

5. Sentry:
   pip install sentry-sdk[fastapi]
   sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"))
   - Backend xatoliklar avtomatik Sentry ga

   npm install @sentry/react
   - Frontend xatoliklar ham

6. Backup (scripts/backup.sh):
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   pg_dump $DATABASE_URL > backup_$DATE.sql
   # Telegram ga yuborish:
   curl -F document=@backup_$DATE.sql \
     "https://api.telegram.org/bot$BOT_TOKEN/sendDocument?chat_id=$CHAT_ID"

   Cron: 0 3 * * * /scripts/backup.sh  (har kuni 03:00)

7. Nginx config (production):
   server {
     listen 80;
     server_name yourdomain.uz;
     return 301 https://$host$request_uri;
   }
   server {
     listen 443 ssl;
     ssl_certificate /etc/letsencrypt/live/yourdomain.uz/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/yourdomain.uz/privkey.pem;

     location /api { proxy_pass http://api:8000; }
     location / { root /usr/share/nginx/html; try_files $uri /index.html; }
   }
```

---

## Ishlab chiqish tartibi

```
HAFTA 1:
  [ ] SQLite → PostgreSQL (VAZIFA 1.1)
  [ ] Aralash to'lov (VAZIFA 1.6)
  [ ] Smena tizimi (VAZIFA 1.4)

HAFTA 2:
  [ ] RBAC rollar (VAZIFA 1.3)
  [ ] Qaytarim (VAZIFA 1.5)
  [ ] OFD integratsiya (VAZIFA 1.2)

HAFTA 3-4:
  [ ] Zakupka moduli (VAZIFA 2.1)
  [ ] Muddati + FIFO (VAZIFA 2.2)
  [ ] Ko'p filial (VAZIFA 2.3)

HAFTA 5-6:
  [ ] Hisobotlar (VAZIFA 3.1)
  [ ] Xodimlar (VAZIFA 2.4)
  [ ] Lokalizatsiya + Printer (VAZIFA 3.2)
  [ ] Xavfsizlik + Production (VAZIFA 3.4)

KEYINCHALIK:
  [ ] Telegram bot (VAZIFA 3.3)
  [ ] Chegirma tizimi (VAZIFA 2.5)
  [ ] Inventarizatsiya (VAZIFA 2.6)
```

---

## Cursor da ishlatish usuli

**Har bir vazifani alohida so'rang:**
```
@CURSOR_PROMPT_DOKON_V2.md — VAZIFA 1.1 ni amalga oshir
(SQLite dan PostgreSQL ga ko'chirish)
```

```
@CURSOR_PROMPT_DOKON_V2.md — VAZIFA 1.3 ni amalga oshir
(RBAC rollar tizimi — faqat backend)
```

```
@CURSOR_PROMPT_DOKON_V2.md — VAZIFA 1.4 ni amalga oshir
(Smena tizimi — model, endpointlar va frontend)
```

**Bir vaqtda ko'p vazifa bermang — natija sifatli bo'lmaydi.**
**Har vazifadan keyin test qiling, keyin keyingisiga o'ting.**

---

*Bu prompt DokonPro ERP (FastAPI + React + SQLite/PostgreSQL) tizimini
to'liq retail-ready darajaga olib chiqish uchun tuzilgan.*
