# pg_dump va psql yordamida ko'chirish

Bu usul eng ishonchli va to'liq ma'lumotlarni ko'chiradi.

## 1. Local database-dan dump olish

```bash
pg_dump -h 127.0.0.1 -p 5432 -U postgres -d suv_bot -F c -f suv_bot_backup.dump
```

Parol so'ralganda: `tulqin`

## 2. Neon database-ga yuklash

```bash
pg_restore -h ep-autumn-base-ahesfl0i-pooler.c-3.us-east-1.aws.neon.tech -p 5432 -U neondb_owner -d neondb --no-owner --no-acl -v suv_bot_backup.dump
```

Parol so'ralganda: `npg_lZtoYUu8Wr1K`

## Yoki connection string bilan:

```bash
# Dump olish
pg_dump "postgresql://postgres:tulqin@127.0.0.1:5432/suv_bot" -F c -f suv_bot_backup.dump

# Yuklash
pg_restore "postgresql://neondb_owner:npg_lZtoYUu8Wr1K@ep-autumn-base-ahesfl0i-pooler.c-3.us-east-1.aws.neon.tech:5432/neondb?sslmode=require" --no-owner --no-acl -v suv_bot_backup.dump
```

## Eslatma:
- `-F c` - custom format (binary)
- `--no-owner` - owner ma'lumotlarini o'tkazmaydi (Neon-da kerak emas)
- `--no-acl` - access control list-ni o'tkazmaydi
