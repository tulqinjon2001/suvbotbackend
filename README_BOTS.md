# Telegram Botlar va Web App

## Botlar

### 1. Customer Bot (Mijozlar Boti)

**Vazifasi:**
- Mijozlarni ro'yxatdan o'tkazish (telefon raqam orqali)
- Web App'ga kirish eshigi
- Buyurtma holati o'zgarganda mijozga xabar berish

**Ishlash tartibi:**
1. `/start` - Telefon raqam so'raladi
2. Telefon yuborilganda - Bazaga `customer` sifatida saqlanadi
3. "Buyurtma berish" tugmasi ko'rsatiladi (Web App ochiladi)

**Env:**
```
CUSTOMER_BOT_TOKEN=your_customer_bot_token_from_botfather
WEB_APP_URL=https://yourdomain.com/webapp
```

### 2. Staff Bot (Xodimlar Boti)

**Vazifasi:**
- Xodimlarni autentifikatsiya qilish (telefon raqam orqali)
- Rolga qarab ishchi menyu ko'rsatish

**Rollar:**

#### Operator
- Yangi buyurtmalarni ko'rish
- "Tasdiqlash" tugmasi
- Yangi buyurtma tushganda avtomatik xabar

#### Yig'uvchi (Picker)
- Tasdiqlangan buyurtmalarni ko'rish
- "PDF yuklash" tugmasi
- "Yig'ildi" tugmasi (status → `preparing`)

#### Kuryer (Courier)
- Faqat o'ziga biriktirilgan va "Yo'lda" bo'lgan buyurtmalar
- Mijoz lokatsiyasini ko'rish
- "Yetkazildi" tugmasi
- "To'lovni olish" tugmasi

**Ishlash tartibi:**
1. `/start` - Telefon raqam so'raladi
2. Telefon bazadagi Users jadvalida xodim sifatida mavjud bo'lsa - menyu ko'rsatiladi
3. Begonalar uchun "Kirish taqiqlangan"

**Env:**
```
STAFF_BOT_TOKEN=your_staff_bot_token_from_botfather
```

## Web App API

### Buyurtma yaratish (Ochiq endpoint)

```
POST /api/webapp/orders
```

**Body:**
```json
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ],
  "address": "Toshkent, Chilonzor tumani",
  "location_lat": 41.2995,
  "location_long": 69.2401,
  "payment_type": "cash"
}
```

**Javob:**
- Buyurtma yaratiladi
- Barcha Operatorlarga avtomatik xabar yuboriladi

### Buyurtma holatini yangilash

```
PUT /api/orders/:id/status
Authorization: Bearer <token>
```

**Body:**
```json
{
  "status": "confirmed",
  "courier_id": 5  // ixtiyoriy
}
```

**Javob:**
- Status yangilanadi
- Mijozga avtomatik xabar yuboriladi (agar telegram_id bo'lsa)

## Bot Tokenlarni olish

1. [@BotFather](https://t.me/botfather) ga o'ting
2. `/newbot` yozing
3. Bot nomini va username'ni kiriting
4. Token oling va `.env` ga qo'ying

## Web App sozlash

1. Web App URL'ni `.env` da `WEB_APP_URL` ga qo'ying
2. Telegram Bot Settings'da Web App'ni yoqing
3. Customer Bot'da MenuButton avtomatik ko'rinadi
