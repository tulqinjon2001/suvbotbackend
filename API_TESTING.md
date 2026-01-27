# API Testing Qo'llanmasi

Bu qo'llanma Suv Bot Backend API-larini test qilish uchun to'liq instruksiya beradi.

## 📋 Mundarija

1. [Server-ni ishga tushirish](#1-serverni-ishga-tushirish)
2. [Test usullari](#2-test-usullari)
3. [API Endpoint-lar ro'yxati](#3-api-endpoint-lar-ro'yxati)
4. [Test misollari](#4-test-misollari)
5. [Postman Collection](#5-postman-collection)

---

## 1. Server-ni ishga tushirish

### Local Development

```bash
cd D:\projects\suv_bot\Backend
npm run dev
```

Server `http://localhost:5000` da ishga tushadi.

### Health Check

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET

# yoki browser-da oching
http://localhost:5000/api/health
```

---

## 2. Test usullari

### A. Browser (GET requests uchun)

Faqat GET request-lar uchun ishlatiladi:
- `http://localhost:5000/api/health`
- `http://localhost:5000/api/webapp/products`
- `http://localhost:5000/api/webapp/categories`

### B. PowerShell (Invoke-WebRequest)

```powershell
# GET request
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET
$response.Content

# POST request
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$response.Content
```

### C. curl (Windows-da Git Bash yoki WSL)

```bash
# GET request
curl http://localhost:5000/api/health

# POST request
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### D. Postman / Insomnia

Postman yoki Insomnia kabi API client-lar ishlatish tavsiya etiladi.

### E. JavaScript (fetch)

```javascript
// GET request
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => console.log(data));

// POST request
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 3. API Endpoint-lar ro'yxati

### 🔓 Ochiq Endpoint-lar (Authentication kerak emas)

#### Health Check
- `GET /api/health` - Server holatini tekshirish

#### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/billing/auth/login` - Super Admin login

#### Web App (Telegram Web App uchun)
- `GET /api/webapp/products` - Barcha mahsulotlar
- `GET /api/webapp/categories` - Barcha kategoriyalar
- `GET /api/webapp/user/:telegramId` - User by Telegram ID
- `GET /api/webapp/user/phone/:phone` - User by phone
- `PUT /api/webapp/user/:id` - User yangilash
- `POST /api/webapp/orders` - Buyurtma yaratish
- `GET /api/webapp/orders/:id` - Buyurtma ma'lumotlari
- `GET /api/webapp/customer/:customerId/orders` - Mijoz buyurtmalari

---

### 🔒 Protected Endpoint-lar (Authentication kerak)

**Token olish:**
```bash
POST /api/auth/login
Body: { "username": "admin", "password": "admin123" }
Response: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Header-ga qo'shish:**
```
Authorization: Bearer <token>
```

#### Users (Admin)
- `GET /api/users` - Barcha foydalanuvchilar
- `GET /api/users/:id` - Foydalanuvchi ma'lumotlari
- `POST /api/users` - Yangi foydalanuvchi
- `PUT /api/users/:id` - Foydalanuvchi yangilash
- `DELETE /api/users/:id` - Foydalanuvchi o'chirish

#### Categories (Admin)
- `GET /api/categories` - Barcha kategoriyalar
- `GET /api/categories/:id` - Kategoriya ma'lumotlari
- `POST /api/categories` - Yangi kategoriya
- `PUT /api/categories/:id` - Kategoriya yangilash
- `DELETE /api/categories/:id` - Kategoriya o'chirish

#### Products (Admin)
- `GET /api/products` - Barcha mahsulotlar
- `GET /api/products/:id` - Mahsulot ma'lumotlari
- `POST /api/products` - Yangi mahsulot
- `PUT /api/products/:id` - Mahsulot yangilash
- `DELETE /api/products/:id` - Mahsulot o'chirish

#### Orders (Admin)
- `GET /api/orders` - Barcha buyurtmalar
- `GET /api/orders/:id` - Buyurtma ma'lumotlari
- `POST /api/orders` - Yangi buyurtma
- `PUT /api/orders/:id/status` - Buyurtma holatini yangilash

---

### 💳 Billing Endpoint-lar (Super Admin)

**Super Admin token olish:**
```bash
POST /api/billing/auth/login
Body: { "username": "superadmin", "password": "superadmin123" }
Response: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Header-ga qo'shish:**
```
Authorization: Bearer <super_admin_token>
```

#### Accounts
- `GET /api/billing/accounts` - Barcha hisoblar
- `GET /api/billing/accounts/:id` - Hisob ma'lumotlari
- `POST /api/billing/accounts` - Yangi hisob
- `PUT /api/billing/accounts/:id` - Hisob yangilash

#### Plans
- `GET /api/billing/plans` - Barcha rejalar
- `POST /api/billing/plans` - Yangi reja
- `PUT /api/billing/plans/:id` - Reja yangilash
- `DELETE /api/billing/plans/:id` - Reja o'chirish

#### Subscriptions
- `GET /api/billing/subscriptions` - Barcha obunalar
- `POST /api/billing/subscriptions` - Yangi obuna
- `PUT /api/billing/subscriptions/:id/cancel` - Obunani bekor qilish

#### Invoices
- `GET /api/billing/invoices` - Barcha fakturalar
- `GET /api/billing/invoices/:id` - Faktura ma'lumotlari
- `PUT /api/billing/invoices/:id/pay` - Fakturani to'langan deb belgilash

#### Stats
- `GET /api/billing/stats` - Statistika

---

## 4. Test misollari

### 4.1. Health Check

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET | Select-Object -ExpandProperty Content
```

**Kutilgan javob:**
```json
{
  "ok": true,
  "timestamp": "2026-01-26T10:30:00.000Z"
}
```

---

### 4.2. Admin Login

```powershell
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$token = ($response.Content | ConvertFrom-Json).token
Write-Host "Token: $token"
```

**Kutilgan javob:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

---

### 4.3. Barcha mahsulotlarni olish (Ochiq)

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/webapp/products" -Method GET
$response.Content | ConvertFrom-Json | Format-Table
```

---

### 4.4. Kategoriya yaratish (Admin)

```powershell
# Avval token olish
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$token = ($loginResponse.Content | ConvertFrom-Json).token

# Kategoriya yaratish
$categoryBody = @{
    name = "Suv"
    description = "Suv mahsulotlari"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/categories" `
    -Method POST `
    -Headers $headers `
    -Body $categoryBody

$response.Content
```

---

### 4.5. Mahsulot yaratish (Admin)

```powershell
# Token olish (yuqoridagi kabi)
$token = "..."

$productBody = @{
    name = "Suv 1.5L"
    description = "Toza suv"
    price = 5000
    category_id = 1
    stock = 100
    image_url = "https://example.com/water.jpg"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/products" `
    -Method POST `
    -Headers $headers `
    -Body $productBody

$response.Content
```

---

### 4.6. Buyurtma yaratish (Web App)

```powershell
$orderBody = @{
    customer_id = 1
    items = @(
        @{
            product_id = 1
            quantity = 2
            price_at_purchase = 5000
        }
    )
    delivery_address = "Toshkent shahar, Chilonzor tumani"
    phone = "+998901234567"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/webapp/orders" `
    -Method POST `
    -Body $orderBody `
    -ContentType "application/json"

$response.Content
```

---

### 4.7. Super Admin Login

```powershell
$body = @{
    username = "superadmin"
    password = "superadmin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/billing/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$token = ($response.Content | ConvertFrom-Json).token
Write-Host "Super Admin Token: $token"
```

---

### 4.8. Billing Stats (Super Admin)

```powershell
$token = "..." # Super Admin token

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/billing/stats" `
    -Method GET `
    -Headers $headers

$response.Content
```

---

## 5. Postman Collection

Postman-da collection yaratish:

### Collection yaratish:

1. Postman-ni oching
2. **New** → **Collection** → "Suv Bot API"
3. Environment yaratish:
   - **New** → **Environment** → "Suv Bot Local"
   - Variable-lar:
     - `base_url`: `http://localhost:5000`
     - `token`: (bo'sh, login dan keyin to'ldiriladi)
     - `super_admin_token`: (bo'sh)

### Request-lar yaratish:

#### 1. Health Check
- **Method**: GET
- **URL**: `{{base_url}}/api/health`

#### 2. Admin Login
- **Method**: POST
- **URL**: `{{base_url}}/api/auth/login`
- **Body** (raw JSON):
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- **Tests** (Postman Script):
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
}
```

#### 3. Get All Products (Protected)
- **Method**: GET
- **URL**: `{{base_url}}/api/products`
- **Headers**:
  - `Authorization`: `Bearer {{token}}`

#### 4. Create Category
- **Method**: POST
- **URL**: `{{base_url}}/api/categories`
- **Headers**:
  - `Authorization`: `Bearer {{token}}`
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
  "name": "Suv",
  "description": "Suv mahsulotlari"
}
```

---

## 6. JavaScript Test Script

`test-api.js` fayl yaratish:

```javascript
const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    // 1. Health Check
    console.log('1. Health Check...');
    const health = await fetch(`${BASE_URL}/health`);
    console.log('Health:', await health.json());

    // 2. Login
    console.log('\n2. Admin Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const { token } = await loginRes.json();
    console.log('Token received:', token ? '✅' : '❌');

    // 3. Get Products (Protected)
    console.log('\n3. Get Products (Protected)...');
    const productsRes = await fetch(`${BASE_URL}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const products = await productsRes.json();
    console.log('Products count:', products.length);

    // 4. Get Products (Open - Web App)
    console.log('\n4. Get Products (Open - Web App)...');
    const webappProductsRes = await fetch(`${BASE_URL}/webapp/products`);
    const webappProducts = await webappProductsRes.json();
    console.log('Web App Products count:', webappProducts.length);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
```

**Ishga tushirish:**
```bash
node test-api.js
```

---

## 7. Xatoliklar va yechimlar

### 401 Unauthorized
- Token noto'g'ri yoki muddati o'tgan
- Yechim: Qayta login qiling

### 404 Not Found
- Endpoint noto'g'ri yoki mavjud emas
- Yechim: URL-ni tekshiring

### 500 Internal Server Error
- Server xatosi
- Yechim: Server log-larini tekshiring

### DB_PASSWORD error
- `.env` fayl to'g'ri o'qilmayapti
- Yechim: `Backend/.env` fayl mavjudligini va path-ni tekshiring

---

## 8. Foydali linklar

- **Local API**: `http://localhost:5000`
- **API Docs**: (Agar Swagger qo'shilgan bo'lsa)
- **Postman**: https://www.postman.com/
- **Insomnia**: https://insomnia.rest/

---

## 9. Test Checklist

- [ ] Health check ishlayapti
- [ ] Admin login ishlayapti
- [ ] Token bilan protected endpoint-lar ishlayapti
- [ ] Web App endpoint-lar (ochiq) ishlayapti
- [ ] CRUD operatsiyalar (Create, Read, Update, Delete) ishlayapti
- [ ] Super Admin login ishlayapti
- [ ] Billing endpoint-lar ishlayapti
- [ ] Xatoliklar to'g'ri qaytarilmoqda

---

**Yordam kerakmi?** Log-larni tekshiring yoki muammoni tasvirlab bering.
