# Vercel-ga Deploy Qilish

## Qadamlar:

### 1. Environment Variables Qo'shish

Vercel Dashboard-da quyidagi environment variable-larni qo'shing:

```
PORT=5000
JWT_SECRET=your-jwt-secret-change-in-production
DB_HOST=ep-autumn-base-ahesfl0i-pooler.c-3.us-east-1.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_lZtoYUu8Wr1K
DB_SSL=true
CUSTOMER_BOT_TOKEN=your_customer_bot_token
STAFF_BOT_TOKEN=your_staff_bot_token
WEB_APP_URL=https://your-vercel-domain.vercel.app
```

### 2. Build Settings

Vercel avtomatik ravishda quyidagilarni aniqlaydi:
- **Root Directory**: `Backend` (agar repo root-da bo'lsa)
- **Build Command**: `npm run build`
- **Output Directory**: `.` (root)
- **Install Command**: `npm install`

### 3. Deploy

1. GitHub repository-ni Vercel-ga ulang
2. Environment variable-larni qo'shing
3. Deploy qiling

### 4. Eslatmalar

- **Telegram Bot-lar**: Vercel serverless muhitda ishlamaydi. Bot-lar alohida serverda ishlashi kerak (masalan, Railway, Render, yoki VPS)
- **Database**: Neon PostgreSQL cloud database ishlatilmoqda
- **Port**: Vercel avtomatik PORT environment variable-ni beradi

### 5. Muammo Hal Qilish

Agar `EADDRINUSE` xatosi bo'lsa:
- `vercel.json` faylida `devCommand` o'chirilganligini tekshiring
- Vercel-da `dev` script ishlatilmaydi, faqat `build` va `start` ishlatiladi
- Serverless function sifatida ishlaydi, shuning uchun `app.listen()` chaqirilmaydi
