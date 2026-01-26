# Vercel Deploy Sozlamalari

## Muammo: Entry Point Topilmayapti

Vercel-da quyidagi xatolik bo'lishi mumkin:
```
Error: No entrypoint found in output directory: "Backend"
```

## Yechim:

### 1. Vercel Dashboard-da Sozlamalar

Vercel Dashboard → Project Settings → General:

1. **Root Directory**: `Backend` (agar repo root-da `Backend` papkasi bo'lsa)
   - Yoki bo'sh qoldiring (agar repo root `Backend` bo'lsa)

2. **Build & Development Settings**:
   - **Framework Preset**: `Other`
   - **Build Command**: `npm run build` (yoki bo'sh)
   - **Output Directory**: `.` (root)
   - **Install Command**: `npm install`
   - **Development Command**: bo'sh qoldiring

### 2. Environment Variables

Vercel Dashboard → Settings → Environment Variables:

Quyidagi variable-larni qo'shing (Production, Preview, Development uchun):

```
PORT=5000
JWT_SECRET=tulqin@suv_bot
DB_HOST=ep-autumn-base-ahesfl0i-pooler.c-3.us-east-1.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_lZtoYUu8Wr1K
DB_SSL=true
CUSTOMER_BOT_TOKEN=8568616669:AAGoJd07nExdrjDKz-MyNh1mNaCqh-G_YMI
STAFF_BOT_TOKEN=8380730390:AAFZT812xr53D9I06kWTWSApKOalF7Yqxdk
WEB_APP_URL=https://your-vercel-domain.vercel.app
VERCEL=1
```

### 3. Git Repository Strukturasi

Agar repository struktura quyidagicha bo'lsa:
```
suvbotbackend/
  ├── Backend/
  │   ├── api/
  │   │   └── index.js
  │   ├── src/
  │   ├── package.json
  │   └── vercel.json
  └── ...
```

U holda Vercel Dashboard-da **Root Directory** ni `Backend` qilib sozlash kerak.

### 4. Agar Root Directory `Backend` Bo'lsa

`vercel.json` faylida `api/index.js` to'g'ri yo'l bo'lishi kerak:
- `api/index.js` (root directory `Backend` bo'lsa)

### 5. Test Qilish

Deploy qilgandan keyin:
```bash
curl https://your-vercel-domain.vercel.app/api/health
```

Javob: `{"ok":true}` bo'lishi kerak.

## Eslatmalar:

- **Telegram Bot-lar**: Vercel serverless muhitda ishlamaydi
- **Database**: Neon PostgreSQL cloud database ishlatilmoqda
- **Port**: Vercel avtomatik PORT beradi, `app.listen()` chaqirilmaydi
