# DokonPro ERP - Tizimning Joriy Imkoniyatlari (Features Overview)

Ushbu hujjat DokonPro ERP tizimida hozirgi vaqtda to'liq ishlab turgan barcha funksiyalar va modullarni o'z ichiga oladi. Buni AI yordamchilariga (Claude, ChatGPT) ko'rsatib, tizimni yanada qanday kengaytirish yoki qanday yangi biznes mantiqlar qo'shish mumkinligini maslahatlashish uchun ishlating.

## 🛠 Texnologiyalar Steki (Tech Stack)
* **Backend:** Python, FastAPI, SQLAlchemy, Pydantic, JWT Authentication.
* **Database:** SQLite (Lokal kompyuter uchun sozlangan) / PostgreSQL (serverga moslashuvchan).
* **Frontend:** React (Vite), Tailwind CSS v4, React Router, TanStack Query (React Query), Recharts (Grafiklar uchun), Lucide React (Ikonkalar).
* **Arxitektura:** REST API.

---

## 🚀 Tayyor va Ishlayotgan Modullar (Mavjud Funksiyalar)

### 1. Xavfsizlik va Avtorizatsiya (Authentication)
* **JWT Token:** Tizimga kirish (Login/Password) faqat tasdiqlangan foydalanuvchilar (Admin) uchundir.
* **Route Protection:** Barcha Backend API'lar (`Depends(get_current_user)`) va Frontend sahifalar faqat avtorizatsiyadan o'tgan foydalanuvchilar uchungina ochiladi. 
* **Avto-Seeding:** Baza yangi bo'lganda avtomatik ravishda `admin` (parol: `admin123`) yaratuvchi tizim mavjud.

### 2. Asosiy Panel (Dashboard & Analytics)
* **Statistika kartochkalari:** Bugungi kunlik sotuv summasi, jami tovarlar turlari soni, mijozlar bazasi soni va zaxirasi tugayotgan (min_quantity'dan kam) tovarlar soni real vaqtda ko'rsatiladi.
* **Sotuvlar Dinamikasi Grafigi:** Oxirgi 7 kunlik savdo hajmi interaktiv chiziqli grafik (Recharts LineChart) orqali chiroyli dizaynda tasvirlangan.

### 3. Kassa va Savdo (Point of Sale - POS)
* **Shtrix-kod Skaneri:** Mahsulotni shtrix-kod orqali qidirib tezkor savatga (Cart) qo'shish.
* **Mijozni Qidirish:** Xaridorning telefon raqamini kiritib tizimdan topish va savdoni uning nomiga rasmiylashtirish.
* **To'lov Turlari:** Naqd va Plastik karta orqali to'lovlarni qabul qilish. Savatni tozalash tugmasi.
* **Chek Chop Etish (Print Receipt):** To'lov tugagach, do'kon logotipi, tovarlar, xaridor ismi va to'lov usuli yozilgan haqiqiy Kassa qog'oz formatidagi chek ekranga chiqadi va Uni printerga (Print) yuborish mumkin. 
* **Keshbek (Cashback):** Ro'yxatdan o'tgan mijoz xarid qilsa, umumiy summaning ma'lum qismi uning bonus balansiga avtomat qo'shiladi.

### 4. Sotuvlar Tarixi (Sales History)
* Tizimda urilgan barcha cheklar ro'yxatini ko'rish (Chek raqami, sana, to'lov turi va jami summa).
* Har bir chekning ichini ochib (accordion) unda aynan qanday tovarlar (narxi, soni) sotilganini detallarigacha kuzatish.

### 5. Mahsulotlar va Ombor (Products & Inventory)
* Yangi mahsulot qo'shish (Shtrix-kod, Nomi, Narxi, Kategoriyasi).
* Barcha mavjud mahsulotlarni jadval (Table) ko'rinishida ko'rish.
* Tizimda real vaqtda mahsulotlar qoldig'i va nomi bo'yicha tezkor qidiruv (Search).

### 6. Mijozlar Bazasi (CRM)
* Yangi xaridor qo'shish (Ism, Telefon).
* Mijozlar jadvali: kimning qancha bonus ochkolari (cashback) to'plangani. 

### 7. Ta'minot va Moliya (Supply & Finance)
* Yetkazib beruvchilarni (Suppliers) kiritish. 
* Ularning qarz (balans) miqdorini monitoring qilish.
* Asosiy moliyaviy tranzaksiyalarni (Income/Expense) qayd etish imkoniyati.

---

## ❓ Yana nimalar qo'shish mumkin? (Claude / AI uchun savol)

Hurmatli Claude, ushbu ERP tizim tayyor bo'ldi. Men ushbu ERP'ni mukammal chakana savdo (Retail) dasturiga aylantirmoqchiman. **Yana qanday murakkab biznes-mantiqlar, hisobot turlari yoki ombor jarayonlarini (masalan, inventarizatsiya, xodimlarning oylik hisoboti) qo'shsam dastur bozorbop va mukammal bo'ladi? Menga qadam-baqadam (Step by Step) rejalar taklif qiling.**
