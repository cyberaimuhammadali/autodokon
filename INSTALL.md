# DokonPro ERP — VPS ga O'rnatish va Telegram Bot Qo'llanmasi

---

## 1. 🤖 Telegram Bot Sozlash (5 daqiqa)

### Qadam 1 — Bot yaratish
1. Telegram da **@BotFather** ni toping
2. `/newbot` yuboring
3. Botga nom bering: `DokonPro_Sizniki_Bot`
4. BotFather sizga **TOKEN** beradi:
   `7512345678:AAHxxxxxxxxxxxxxxxxxxxxxx`
5. Bu tokenni nusxalab oling ✅

### Qadam 2 — Chat ID olish
1. Telegram da **@userinfobot** ni toping
2. `/start` yuboring
3. U sizga **Chat ID** beradi: `123456789`

### Qadam 3 — `.env` faylga yozish
`C:\dokon\backend\.env` faylini oching va qo'shing:
```
TELEGRAM_BOT_TOKEN=7512345678:AAHxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=123456789
```

### Qadam 4 — Sinab ko'rish
Dasturni qayta ishga tushiring. Yon menyu da **"Kam Zaxira & Buyurtma"** sahifasiga kiring va:
- **"Kunlik Hisobot yuborish"** tugmasini bosing → Telegram ga xabar keladi!
- Endi har kuni **soat 21:00** da avtomatik keladi 🎉

---

## 2. 🌐 VPS ga O'rnatish (Internet orqali ishlash)

### Qadam 1 — Server sotib olish
**Tavsiya etilgan provayderlar (O'zbekistonga yaqin):**

| Provayder | Narxi | Link |
|---|---|---|
| **Beget.ru** | ~60k so'm/oy | beget.ru |
| **TimeWeb.ru** | ~50k so'm/oy | timeweb.ru |
| **reg.ru** | ~70k so'm/oy | reg.ru |

**Tarif:** Ubuntu 22.04 LTS, 2GB RAM, 20GB disk — kifoya

### Qadam 2 — Domain olish (ixtiyoriy, lekin tavsiya)
- **NIC.UZ** dan `.uz` domain: ~100k so'm/yil
- Yoki provayderdagi bepul subdomain ishlaydi

### Qadam 3 — Serverga ulaning
Provayder sizga bergan **IP manzil, login, parol** bilan:

**Windows da:** `PuTTY` dasturini yuklab oling (putty.org)
- Host: `123.45.67.89` (serveringiz IP si)
- Port: `22`
- Connect bosing, login/parolni kiriting

### Qadam 4 — Bir buyruq bilan o'rnatish
Serverga ulangach, shu buyruqni yuboring:
```bash
curl -fsSL https://raw.githubusercontent.com/cyberaimuhammadali/autodokon/main/deploy/setup.sh | bash
```
Yoki GitHub dan `setup.sh` faylni yuklab:
```bash
wget https://raw.githubusercontent.com/cyberaimuhammadali/autodokon/main/deploy/setup.sh
chmod +x setup.sh
bash setup.sh
```
- Domain nomi so'raladi → `dokon.example.com` yoki serveringiz IP si
- Telegram token va Chat ID so'raladi
- **~5-10 daqiqada hammasi tayyor!**

### Qadam 5 — Brauzerda oching
```
https://dokon.siznikidomain.uz
```
Dunyoning istalgan joyidan — telefon, planshet, kompyuter — ishlaydi!

---

## 3. 🔄 Avtomatik Buyurtma Tizimi — Qanday ishlaydi?

```
Tovar zaxirasi kamayadi
        ↓
Tizim har 30 daqiqada tekshiradi
        ↓
Minimum miqdorga yetdimi? → Ha
        ↓
Telegram ga xabar keladi:
"⚠️ KAM ZAXIRA: Coca-Cola 3 dona qoldi!"
        ↓
"Kam Zaxira & Buyurtma" sahifasida
→ "Buyurtma ro'yxatini yuborish" tugmasini bosasiz
        ↓
Telegram ga yuboriladi:
🛒 BUYURTMA RO'YXATI
1. Coca-Cola — 50 dona buyurtma (taxm: 250,000 so'm)
2. Pepsi     — 30 dona buyurtma (taxm: 180,000 so'm)
```

**Kelajakda qo'shiladi:**
- Ta'minotchiga to'g'ridan-to'g'ri email/WhatsApp buyurtma
- Bir tugma bilan buyurtmani Ma'lumotlar Bazasiga yozish
- Buyurtma tasdiqlangach, ta'minotchi qachon yetkazishini bildiradi

---

## 4. 📱 Telefonda ishlash

VPS dan foydalanganda, ixtiyoriy telefon brauzerida (`Chrome`, `Safari`) oching:
```
https://dokon.siznikidomain.uz
```
Kassa ekrani telefonda ham chiroyli ko'rinadi.

**PWA (Telefon ilovasi sifatida) qo'shish:**
- Chrome da `...` menyusini bosing
- `"Bosh ekranga qo'shish"` ni tanlang
- Endi u telefon ilovasi kabi ishga tushadi!
