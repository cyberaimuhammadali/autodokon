# 🏪 DokonPro ERP — Karzinka Darajasidagi To'liq Tizim
## Master Plan: Kichik Do'kondan Filiallar Tarmog'igacha

> Karzinka, Walmart, Carrefour kabi yirik retail zanjirlardan o'rganilgan.
> O'zbekiston bozoriga 100% moslashtirilgan. Hech qanday tashqi servis kerak emas.

---

## 🔍 KARZINKA VA YIRIK DO'KONLAR QANDAY ISHLAYDI?

### Karzinka texnologiyalari (tadqiqotdan):
- **150+ filial** — barchasi bitta markaziy tizimdan boshqariladi
- **Markaziy ombor (dark store)** — Toshkentda 15,000 turdagi mahsulot
- **Korzinka Go app** — onlayn buyurtma + 2 soatda yetkazib berish
- **Bonus karta tizimi** — 5% cashback, shaxsiylashtirilgan takliflar
- **ZoodPay integratsiya** — muddatli to'lov imkoniyati
- **Real-vaqt narx boshqaruvi** — barcha filiallarga bir vaqtda narx o'zgaradi
- **AI talab bashorati** — qaysi mahsulot qachon tugashini oldindan biladi
- **Avtomatik zakaz** — ombor kamaysa, yetkazib beruvchiga avtomatik xabar ketadi

### Ularda qanday tizim bor (taxminan):
```
├── Markaziy ERP (Oracle NetSuite yoki SAP)
├── POS tizim (har filialda)  
├── Ombor boshqaruv (WMS)
├── CRM (mijoz ma'lumotlari)
├── Marketing avtomatlashtirish
└── Buxgalteriya tizimi
```

**Biz bir tizimda barchasini quramiz — lekin sodda va arzon!**

---

## 🏗️ BIZNING TIZIM ARXITEKTURASI

```
┌─────────────────────────────────────────────────────────────────┐
│                    DokonPro ERP — MARKAZIY TIZIM                │
│                    (1 server, barcha filiallar ko'radi)          │
├──────────────┬──────────────┬────────────────┬──────────────────┤
│   DO'KON 1   │   DO'KON 2   │   FILIAL 1     │  FILIAL N...     │
│   (Asosiy)   │   (Yangi)    │   (Kelgusida)  │                  │
│              │              │                │                  │
│  💻 Kassa    │  💻 Kassa    │   💻 Kassa     │  💻 Kassa        │
│  📦 Ombor    │  📦 Ombor    │   📦 Ombor     │  📦 Ombor        │
└──────────────┴──────────────┴────────────────┴──────────────────┘
         │              │              │
         └──────────────┴──────────────┘
                        │
              ┌─────────▼──────────┐
              │   PostgreSQL DB    │
              │   (Barcha data)    │
              └─────────┬──────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    📊 Analytics   📱 Telegram    🧾 Soliq OFD
    Dashboard      Bot Admin      (ofd.soliq.uz)
```

---

## 📦 TO'LIQ 12 MODUL — BATAFSIL

---

### MODUL 1: 💰 KASSA (Point of Sale)
**Karzinka dan o'rganilgan:**
- Tezkor checkout — mijoz navbatda 30 sekunddan ko'p turmasligi
- Bir vaqtda bir nechta kassa oynasi (parallel)
- Offline rejim (internet uzilsa ham ishlaydi)

**Bizning funksiyalar:**
```
✅ Shtrix-kod skaneri (USB/Bluetooth)
✅ Tarozi integratsiyasi (go'sht, sabzavot — kg bo'yicha)
✅ Savat (karzinka) — bir vaqtda ko'p mahsulot
✅ To'lov: Naqd / Karta / QR (Payme, Click, Uzum)
✅ Aralash to'lov (naqd + karta birga)
✅ Chegirma: % yoki so'm, kupon kodi
✅ Mijozni topish (telefon bo'yicha) → bonus hisoblash
✅ Nasiya (qarz) — doimiy mijoz uchun
✅ Qaytarish (возврат) — kvitansiya bilan
✅ Smena ochish/yopish (kassir puli hisobi)
✅ Termal chek (80mm printer)
✅ Fiskal chek (OFD → Soliq)
✅ Offline rejim → sinxronlash
```

---

### MODUL 2: 📦 OMBOR (Inventory / WMS)
**Karzinka dan o'rganilgan:**
- Har filialda alohida ombor + markaziy ombor
- Muddati o'tayotgan mahsulotlar — 3 kun qolganda ogohlantirish
- Avtomatik min-max tartibga solish

**Bizning funksiyalar:**
```
✅ Real-vaqt qoldiq kuzatuvi (sotilganda avtomatik kamayadi)
✅ Ko'p filial — har filial o'z omborini ko'radi
✅ Filiallar orasida ko'chirish (transfer)
✅ Muddati kuzatuvi (oziq-ovqat uchun JUDA MUHIM)
   └── 7 kun qolsa: sariq ogohlantirish
   └── 3 kun qolsa: qizil + chegirma tavsiyasi
   └── O'tsa: hisobot (yo'qotish)
✅ Inventarizatsiya (санитация) — barcode bilan sanarish
✅ Kam qoldiq ogohlantirish (avtomatik Telegram xabar)
✅ ABC tahlil (qaysi mahsulot ko'p/kam sotiladigi)
✅ FIFO/LIFO (birinchi kirgan birinchi chiqsin)
✅ Partiya kuzatuvi (lot number)
✅ Yo'qotish/chiqim hujjati
```

---

### MODUL 3: 🏷️ MAHSULOTLAR (Product Catalog)
**Karzinka dan o'rganilgan:**
- 15,000+ SKU markaziy katalogda
- O'z brend mahsulotlari (Korzinka private label)
- Narx guruhlari: chakana, ulgurji, VIP

**Bizning funksiyalar:**
```
✅ 10,000+ mahsulot (tezkor qidiruv < 100ms)
✅ Iyerarxik kategoriyalar (Go'sht → Mol Go'shti → Qiyma)
✅ Ko'p barcode (bitta mahsulot — ko'p o'ram)
✅ O'lchov: dona, kg, litr, gramm, juft, quti
✅ Narx guruhlari (Chakana / Ulgurji / VIP / Xodim)
✅ Filialga qarab narx (1-filialda 5000, 2-filialda 5200)
✅ Narx tarixi (kim, qachon, mendan nechaga o'zgartirdi)
✅ Rasm yuklash
✅ Excel/CSV import (10k mahsulot bir vaqtda)
✅ QR kod va barcode generatsiya + chop etish
✅ Mahsulot bog'liqligi (Sut → Qaymoq, Non → Yog')
✅ Analog/o'rnini bosuvchi mahsulotlar
```

---

### MODUL 4: 🚛 YETKAZIB BERUVCHILAR VA ZAKAZ TIZIMI
**Karzinka dan o'rganilgan:**
- Yetkazib beruvchi portali — ular o'z zakazlarini ko'radi
- Avtomatik qayta zakaz (ombor kamaysa)
- Narx taqqoslash (kim arzonroq beradi)

**Bizning funksiyalar:**
```
✅ Yetkazib beruvchilar ma'lumotlar bazasi (STIR, bank, manzil)
✅ Har mahsulot uchun bir nechta yetkazib beruvchi
✅ ZAKAZ YARATISH TIZIMI:
   └── Qo'lda zakaz: mahsulot tanlash → miqdor → yuborish
   └── Avtomatik zakaz: qoldiq min_darajaga tushsa → avtomatik
   └── Zakaz Telegram/Email orqali yetkazib beruvchiga ketadi
✅ Yetkazib beruvchi portali (veb sahifa):
   └── Ular zakaz ko'radi → tasdiqlaydi → narx yozadi
✅ Narx taqqoslash (bir mahsulot uchun 3 yetkazib beruvchi narxi)
✅ Kirim qabul qilish (QR/barcode bilan tekshirish)
✅ Hujjatlar: накладная, счёт-фактура, СМР
✅ Qarzdorlik kuzatuvi (ularga qancha qarzdormiz)
✅ Yetkazib beruvchi reytingi (o'z vaqtida yetkazadimi?)
✅ Qaytarish yetkazib beruvchiga (браак товар)
```

---

### MODUL 5: 👥 MIJOZLAR VA LOYALTY TIZIMI
**Karzinka dan o'rganilgan:**
- Bonus karta — 5% cashback
- Shaxsiylashtirilgan takliflar (siz ko'p sut olasiz → sut chegirmasi)
- Tug'ilgan kun sovg'asi

**Bizning funksiyalar:**
```
✅ Mijoz profili (ism, telefon, tug'ilgan kun)
✅ BONUS KARTA TIZIMI:
   └── Har sotuvda ball to'plash (1000 so'm = 10 ball)
   └── Ball sarflash (100 ball = 1000 so'm chegirma)
   └── Ball muddati (6 oyda tugaydi → harakatga undash)
✅ Mijoz segmentlari:
   └── Yangi (birinchi xarid)
   └── Oddiy (oyiga 1-3 marta)
   └── Doimiy (oyiga 4+ marta)  
   └── VIP (oyiga 1M+ so'm)
✅ Xarid tarixi (qachon, nima, qancha)
✅ Shaxsiylashtirilgan chegirma
✅ Nasiya (qarz) tizimi:
   └── Limit belgilash
   └── Qaytarish sanasi
   └── Avtomatik eslatma (Telegram/SMS)
✅ Tug'ilgan kun → Avtomatik Telegram/SMS tabrigi + kupon
✅ Mijoz tahlili (eng yaxshi mijozlar, tark etganlar)
```

---

### MODUL 6: 🎯 MARKETING VA CHEGIRMALAR
**Karzinka dan o'rganilgan:**
- Haftalik aksiyalar (qizil narx yorliqlar)
- "2 ta olsang 3-si bepul" (3+1)
- Kategoriya chegirmalari (sut mahsulotlari -10%)
- Vaqt chegirmalari (kechqurun 18:00-21:00 da -5%)

**Bizning funksiyalar:**
```
✅ AKSIYA TURLARI:
   ├── Mahsulot chegirmasi (narxni kamaytirish)
   ├── % chegirma (10%, 20%, 50%)
   ├── "X dan Y gacha" aksiyasi
   ├── Kategoriya chegirmasi (barcha sut mahsulotlari -15%)
   ├── Kombinatsiya: "2 ta ol — 3-si bepul" (3+1)
   ├── Minimal summa: "100,000 so'mdan oshsa -10%"
   ├── Vaqt chegirmasi: "Har kuni 18:00-20:00 da -5%"
   ├── Muddati o'tayotganlar avtomatik chegirma:
   │   └── 7 kun qolsa → -10%
   │   └── 3 kun qolsa → -20%
   │   └── 1 kun qolsa → -50%
   ├── Filialga qarab aksiya (1-filialdagina)
   ├── Mijoz segmentiga qarab (faqat VIP lar uchun)
   └── Kupon kodi tizimi (BAHORI2025 → -15%)

✅ MARKETING KAMPANIYALAR:
   ├── Telegram kanal orqali aksiya e'lon qilish
   ├── Hamma mijozlarga SMS yuborish
   ├── Segmentlangan SMS (faqat sut xaridorlarga)
   └── Tug'ilgan kun kampaniyasi

✅ NARX BOSHQARUVI:
   ├── Bir vaqtda barcha filiallarga narx o'zgarishi
   ├── Filialga qarab alohida narx
   ├── Narx o'zgarishi tarixi va sababi
   └── Minimal foyda % chegarasi (narx past qo'yilmaslik uchun)
```

---

### MODUL 7: 🏢 KO'P FILIAL BOSHQARUVI
**Karzinka dan o'rganilgan:**
- Markaziy boshqaruv → barcha filiallar ko'rinadi
- Filiallar orasida mahsulot ko'chirish
- Har filial uchun alohida hisobot

**Bizning funksiyalar:**
```
✅ MARKAZIY BOSHQARUV PANELI:
   └── Barcha filiallarning real-vaqt holati
   └── Qaysi filial ko'p/kam sotayapti
   └── Har filialdagi kassa holati
   └── Umumiy kunlik/oylik sotuv

✅ FILIAL SOZLAMALARI:
   └── Har filialning o'z manzili, kassa apparati
   └── Har filial uchun alohida kassirlar
   └── Filialga qarab narx belgilash imkoniyati

✅ TRANSFER (MAHSULOT KO'CHIRISH):
   └── 1-filialda ko'p, 2-filialda kam → ko'chirish
   └── Transfer hujjati (kim yubordi, kim qabul qildi)
   └── Ombor avtomatik yangilanadi

✅ MARKAZIY KATALOG:
   └── Mahsulotlar bir joyda → barcha filiallarga ko'rinadi
   └── Har filial o'z qoldiqlarini ko'radi
   └── Aksiyalar markazdan boshqariladi

✅ KONSOLIDATSIYA:
   └── Barcha filiallar birlashgan hisobot
   └── Filial taqqoslash (qaysi biri samaraliroq?)
   └── Umumiy soliq hisoboti
```

---

### MODUL 8: 📊 ANALITIKA VA HISOBOTLAR
**Karzinka dan o'rganilgan:**
- Real-vaqt dashboard (director o'z telefonida ko'radi)
- ABC tahlil (A: 80% daromad keltiruvchi mahsulotlar)
- Demand forecasting (AI bilan)

**Bizning funksiyalar:**
```
✅ REAL-VAQT DASHBOARD:
   └── Bugungi sotuv (real-vaqt)
   └── Har filial solishtiruvi
   └── Eng ko'p sotiladigan mahsulotlar (Top-10)
   └── Kassa qoldig'i
   └── Kam qoldiqlar soni

✅ SOTUV HISOBOTLARI:
   └── Kunlik / haftalik / oylik / yillik
   └── Mahsulot bo'yicha
   └── Kategoriya bo'yicha
   └── Kassir bo'yicha (kim ko'p sotdi)
   └── To'lov usuli bo'yicha (naqd/karta/QR)
   └── Vaqt bo'yicha (qaysi soatda ko'p sotuv)
   └── Filial bo'yicha taqqoslash

✅ FOYDA HISOBOTI:
   └── Har mahsulot foydasi (sotuv - kirim narxi)
   └── Kategoriya bo'yicha foyda
   └── Oylik foyda/zarar balansi
   └── Xarajatlar (ijara, maosh, kommunal)

✅ OMBOR HISOBOTLARI:
   └── Qoldiq holati
   └── Eng tez/sekin sotiladigan mahsulotlar
   └── Muddati o'tgan/o'tayotganlar
   └── Yo'qotishlar hisoboti

✅ AI TAHLIL:
   └── Talab bashorati (ertaga/kelasi hafta nima ko'p kerak)
   └── Mavsumiy tahlil (Ramazon, yangi yil, yoz)
   └── Narx optimizatsiyasi tavsiyasi
   └── "Bu mahsulot har payshanba ko'p sotiladi"

✅ EKSPORT:
   └── Excel, PDF, CSV
   └── Avtomatik kunlik hisobot (email/Telegram)
   └── Soliq uchun hisobotlar
```

---

### MODUL 9: 🧾 MOLIYA VA BUXGALTERIYA
**Karzinka dan o'rganilgan:**
- O'zbekistondagi yirik soliq to'lovchisi
- Avtomatik QQS hisoblash
- Bank bilan to'g'ridan-to'g'ri integratsiya

**Bizning funksiyalar:**
```
✅ KASSA KIRIM/CHIQIM:
   └── Har kuni kassadan pul olish
   └── Xarajatlar kiritish (ijara, kommunal, maosh)
   └── Kassa balansi

✅ QQS (NDS) HISOBLASH:
   └── 12% avtomatik (mahsulot narxiga kiritilgan)
   └── Oylik QQS deklaratsiyasi
   └── Import/eksport uchun alohida

✅ OFD/FISKAL INTEGRATSIYA:
   └── Har sotuvda avtomatik fiskal chek
   └── Soliq Qo'mitasiga real-vaqt ma'lumot
   └── Z-hisobot (smena yopilganda)

✅ YETKAZIB BERUVCHIGA TO'LOV:
   └── Qarzdorlik kuzatuvi
   └── To'lov tarixi
   └── Bank o'tkazma hujjati

✅ XODIMLAR VA MAOSH:
   └── Kassir/xodim ro'yxati
   └── Oylik maosh hisoblash
   └── Bonus (sotuvdan % — kassir uchun motivatsiya)
```

---

### MODUL 10: 📱 TELEGRAM BOT ADMIN
**Karzinka dan o'rganilgan:**
- Rahbar harjoy bo'lsa ham do'konni ko'radi
- Ogohlantirmalar real-vaqtda keladi

**Bizning funksiyalar:**
```
✅ RAHBAR UCHUN BOT:
   └── /bugun — bugungi sotuv ko'rsatadi
   └── /filiallar — barcha filiallar holati
   └── /top10 — eng ko'p sotiladigan mahsulotlar
   └── /kam — kam qolgan mahsulotlar
   └── /foyda — oylik foyda hisoboti

✅ AVTOMATIK OGOHLANTIRISHLAR:
   └── Mahsulot tugayapti (5 dona qoldi)
   └── Muddati o'tayapti (3 kun qoldi)
   └── Katta sotuv (1M so'mdan ko'p bir chek)
   └── Kassir xatolari (qaytarish ko'p qilsa)
   └── Kunlik hisobot (har kuni 22:00 da)

✅ KASSIR UCHUN BOT:
   └── Smena boshlanishi/tugashi xabari
   └── Mahsulot qoldiq so'rash

✅ MIJOZ UCHUN BOT:
   └── Bonus balini tekshirish
   └── Xarid tarixi
   └── Aksiyalar haqida xabar
```

---

### MODUL 11: 🌐 ONLAYN BUYURTMA (Kelajak — Korzinka Go ga o'xshash)
```
✅ Veb-sayt yoki mini-ilova
✅ Mijoz mahsulotlarni ko'radi → savatga soladi
✅ Yetkazib berish manzili
✅ Kuryer kuzatuvi
✅ Onlayn to'lov (Payme/Click)
✅ Do'kondan olib ketish (Click & Collect)
```

---

### MODUL 12: ⚙️ TIZIM SOZLAMALARI
```
✅ Foydalanuvchilar va rollar (5 rol)
✅ Filiallar boshqaruvi
✅ Narx guruhlari
✅ Soliq sozlamalari
✅ Chek shabloni (do'kon nomi, manzil, logo)
✅ Avtomatik zaxira (har kuni tunda)
✅ Audit log (kim nima qildi — barcha amallar yoziladi)
✅ Tizimni yangilash
```

---

## 🎯 CHEGIRMA VA MARKETING QANDAY ISHLAYDI?

### Real misol — "Sut aksiyasi":
```
Admin:
1. Marketing → Yangi aksiya
2. Nomi: "Chorshanba Sut Kuni"
3. Turi: Kategoriya chegirmasi
4. Kategoriya: "Sut Mahsulotlari"
5. Chegirma: 15%
6. Muddati: Har chorshanba 08:00 - 22:00
7. Filiallar: Barchasi
8. [Saqlash]

Natija:
→ Har chorshanba kassada sut mahsulotlari 15% arzon ko'rsatiladi
→ Barcha filiallarda bir vaqtda
→ Telegram kanalga avtomatik e'lon ketadi
→ Statistika: nechta sut sotildi vs oddiy kunlar
```

### Real misol — "Muddati o'tayotgan":
```
Tizim avtomatik:
1. Har kuni 06:00 da tekshiradi
2. "Qatiq — muddati 3 kun qoldi, qoldig'i 45 dona"
3. Avtomatik -20% chegirma qo'shadi
4. Kassir yangi narxni ko'radi
5. Rahbarga Telegram: "⚠️ Qatiq: -20% chegirma berildi"
```

---

## 🚛 YETKAZIB BERUVCHIGA ZAKAZ QANDAY ISHLAYDI?

### Avtomatik zakaz (aqlli tizim):
```
1. Kun davomida "Smetana 400g" 30 dona sotiladi
2. Tizim: qoldig'i = 8 dona, min_qoldiq = 20 dona
3. Tizim avtomatik: qoldiq < min_qoldiq → ZAKAZ YARATISH
4. Tarix bo'yicha hisoblaydi: kuniga o'rtacha 30 dona ketadi
5. Yetkazib berish = 2 kun → 2×30 = 60 dona zakaz
6. Zakaz Telegram yoki email orqali "Sut zavodi" ga ketadi
7. Yetkazib beruvchi qabul qiladi → sanani tasdiqlaydi
8. Sana kelganda: qabul qilish — barcode bilan tekshirib qabul
9. Ombor avtomatik yangilanadi
```

### Qo'lda zakaz (filial boshqaruvchi):
```
1. Ombor → Zakaz yaratish
2. Yetkazib beruvchi tanlash: "Toshkent Sut"
3. Mahsulotlar qo'shish (barcode yoki qidiruv)
4. Miqdor kiritish
5. "Yuborish" → yetkazib beruvchiga Telegram/Email ketadi
6. Yetkazib beruvchi portali: ular narxlarni ko'radi
7. Filial boshqaruvchisi narxni tasdiqlaydi → kirim kutilmoqda
8. Yetkazib beruvchi kelganda → kirim tasdiqlash (barcode bilan)
```

---

## 📅 LOYIHA QURILISH REJASI — 16 HAFTA

```
FAZA 1: POYDEVOR (1-4 hafta)
├── Hafta 1: Server + Database + Auth + Filiallar tuzilmasi
├── Hafta 2: Mahsulotlar + Excel import (10k mahsulot)
├── Hafta 3: Kassa + Savat + Skaner integratsiya
└── Hafta 4: To'lov + OFD/Fiskal chek + Termal chek

FAZA 2: OMBOR VA YETKAZIB BERUVCHILAR (5-8 hafta)
├── Hafta 5: Ombor moduli + Muddati kuzatuvi
├── Hafta 6: Yetkazib beruvchilar + Zakaz tizimi
├── Hafta 7: Ko'p filial + Transfer tizimi
└── Hafta 8: Test + Asosiy do'konda ishga tushirish

FAZA 3: MARKETING VA MIJOZLAR (9-12 hafta)
├── Hafta 9: Mijozlar + Bonus karta tizimi
├── Hafta 10: Chegirma va aksiya tizimi
├── Hafta 11: Telegram bot (admin + kashir + mijoz)
└── Hafta 12: SMS marketing + Kampaniyalar

FAZA 4: ANALITIKA VA TAKOMIL (13-16 hafta)
├── Hafta 13: Batafsil hisobotlar + Dashboard
├── Hafta 14: AI tahlil + Talab bashorati
├── Hafta 15: Moliya + Buxgalteriya moduli
└── Hafta 16: Filial 2 ochish → tizimga ulash + trening

KELAJAK (6+ oy):
└── Onlayn buyurtma (Korzinka Go ga o'xshash)
```

---

## 🛠️ TEXNOLOGIYALAR — NIMA VA NIMA UCHUN

```
BACKEND:
├── Python + FastAPI       → Tez, kuchli API; AI kutubxonalari bor
├── PostgreSQL             → 10k+ mahsulot, murakkab so'rovlar
├── Redis                  → Savat, session, kesh (tezlik uchun)
├── Celery + Redis         → Fon vazifalar (SMS, zakaz, hisobot)
└── WebSocket              → Real-vaqt yangilanish (dashboard)

FRONTEND:
├── React 18               → Zamonaviy UI
├── Tailwind CSS           → Tez dizayn
├── Zustand                → Savat holati (tezkor)
├── React Query            → API so'rovlar + kesh
└── Recharts               → Grafiklar va diagrammalar

INTEGRATSIYALAR:
├── OFD API (soliq.uz)     → Majburiy fiskal
├── Payme API              → QR to'lov
├── Click API              → QR to'lov
├── Telegram Bot API       → Admin bot + xabarlar
├── Eskiz SMS              → SMS marketing
└── RS-232/USB Tarozi      → Og'irlik (go'sht, sabzavot)

INFRATUZILMA:
├── Docker Compose         → Oson o'rnatish
├── Nginx                  → Reverse proxy
├── Let's Encrypt          → Bepul SSL
└── VPS (Reg.ru / UZ)     → $15-30/oy server
```

---

## 💰 TO'LIQ XARAJATLAR TAHLILI

### Bir martalik xarajatlar:
| Narsa | Narxi (USD) |
|-------|-------------|
| Server 1 yil (VPS) | $180-360 |
| Fiskal modul (kassa apparati) | $200-400 |
| Shtrix-kod skaneri (×2) | $40-100 |
| Termal printer (80mm) | $50-100 |
| UPS (tok uzilganda) | $30-80 |
| Domen (.uz) | $15 |
| **Jami** | **$515 - $1,055** |

### Oylik xarajatlar:
| Narsa | Narxi |
|-------|-------|
| VPS server | $15-30/oy |
| OFD | Bepul |
| SMS (Eskiz) | ~$5-20/oy |
| **Jami oylik** | **~$20-50** |

### Tejash (taqqoslash):
| Variant | Narx |
|---------|------|
| Odoo Enterprise | $3,600+/yil |
| 1C: Trade | $500 + oylik xizmat |
| **Bizning tizim** | **$300-600 bir martalik** |

---

## 🤖 AI BILAN QURISH STRATEGIYASI

### Cursor bilan ishlash tartibi:
```
1. LOYIHA_HAQIDA.md faylini Cursor ga bering
2. TUZILMA.md faylini ham oching
3. AI_PROMPTLAR.md dan bitta-bitta bering
4. Har modul tugagach test qiling
5. Xato bo'lsa → xato matnini Cursor ga bering
```

### Claude bilan (men):
```
→ Arxitektura maslahat
→ Murakkab algoritmlar (chegirma, bonus hisoblash)
→ OFD integratsiya kodi
→ SQL optimizatsiya
→ Xatolarni tuzatish
```

### Gemini bilan:
```
→ Katta fayllarni tahlil (10k mahsulot Excel)
→ Hujjat generatsiya
```

---

## 📋 HOZIROQ BOSHLASH UCHUN KETMA-KET

```
BUGUN:
□ 1. GitHub account + yangi repo: "dokonpro-uz"
□ 2. Cursor yuklab olish (cursor.sh)
□ 3. VPS server olish (reg.ru yoki uzinfocom.uz)
□ 4. AI_PROMPTLAR.md → PROMPT 0 → Cursor ga bering

SHUBU HAFTA:
□ 5. PROMPT 1-4 (Database, Auth, Mahsulotlar, Kassa)
□ 6. Test: Mahsulot qo'sh → Kassa → Sotuv → Chek

KEYINGI HAFTA:
□ 7. PROMPT 5-8 (Ombor, Yetkazib beruvchi, Filial)
□ 8. Asosiy do'konda ishga tushirish

1 OY ICHIDA:
□ 9. Marketing, bonus, aksiya tizimi
□ 10. Telegram bot
□ 11. Filial 2 ga ulash
```

---

*DokonPro ERP — Karzinka darajasi, kichik do'kon narxida.*
*O'zbekiston uchun, O'zbekiston tomonidan.*
