# Render-ga Deploy Qilish

## Qadamlar:

### 1. Render Dashboard-da Service Yaratish

1. Render Dashboard-ga kiring
2. "New +" → "Web Service" ni tanlang
3. GitHub repository-ni ulang: `tulqinjon2001/suvbotbackend`
4. Quyidagi sozlamalarni kiriting:

#### Build & Deploy Settings:
- **Name**: `suv-bot-backend` (yoki istalgan nom)
- **Environment**: `Node`
- **Region**: Istalgan region (masalan, `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: `Backend` (agar repo root-da `Backend` papkasi bo'lsa)
- **Build Command**: `npm install` (yoki bo'sh qoldiring)
- **Start Command**: `npm start` (muhim!)

#### Environment Variables:

Render Dashboard → Environment → Add Environment Variable:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=tulqin@suv_bot
DB_HOST=ep-autumn-base-ahesfl0i-pooler.c-3.us-east-1.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_lZtoYUu8Wr1K
DB_SSL=true
CUSTOMER_BOT_TOKEN=8568616669:AAGoJd07nExdrjDKz-MyNh1mNaCqh-G_YMI
STAFF_BOT_TOKEN=8380730390:AAFZT812xr53D9I06kWTWSApKOalF7Yqxdk
WEB_APP_URL=https://your-render-domain.onrender.com
```

### 2. Muammo Hal Qilish

#### A. "Unknown constraint error" xatosi:

Bu database sync muammosi. Yechim:
- Production-da `alter: false` ishlatiladi (kodda allaqachon sozlangan)
- Agar muammo davom etsa, database-da jadvallar allaqachon mavjud bo'lishi mumkin

#### B. "No open ports detected" xatosi:

- **Start Command** `npm start` bo'lishi kerak (nodemon emas!)
- PORT environment variable Render tomonidan avtomatik beriladi
- Server `0.0.0.0` ga bind qilinishi kerak (kodda allaqachon sozlangan)

### 3. Database Sync

Agar database sync muammosi bo'lsa:

1. Neon Dashboard-ga kiring
2. Database jadvallarini tekshiring
3. Agar jadvallar mavjud bo'lsa, `alter: false` ishlatiladi
4. Agar jadvallar yo'q bo'lsa, `alter: true` ishlatiladi (development)

### 4. Telegram Bot-lar

Render-da Telegram bot-lar ishlaydi (Vercel-dan farqli o'laroq).

### 5. Health Check

Deploy qilgandan keyin:
```bash
curl https://your-render-domain.onrender.com/api/health
```

Javob: `{"ok":true}` bo'lishi kerak.

### 6. Logs

Render Dashboard → Logs bo'limida real-time log-larni ko'rishingiz mumkin.

## Eslatmalar:

- **Port**: Render avtomatik PORT beradi, kodda `process.env.PORT` ishlatiladi
- **Database**: Neon PostgreSQL cloud database ishlatilmoqda
- **Build**: `npm install` - dependencies o'rnatiladi
- **Start**: `npm start` - production server ishga tushadi
