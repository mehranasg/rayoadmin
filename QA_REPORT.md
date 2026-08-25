# QA Report — Rayo Admin v9.4.1

## API
- `SplitCost` در Runtime: صفر مورد
- دامنه hard-code شده خارج از `js/app-config.js`: صفر مورد Runtime
- Load تمام ماژول‌ها: `RayoData/Load?module=...`
- Save تمام ماژول‌ها: `RayoData/Save?module=...`
- HR داخلی به backend module=`personnel` نگاشت شد

## Persistence
- fallback عملیاتی به `db/*.json`: حذف شد
- LocalStorage cache برای داده HR: حذف شد
- Seed فقط برای Bootstrap/Migration یک‌باره است

## Bootstrap Test
تست شبیه‌سازی‌شده انجام شد:
- `personnel` خالی → یک بار Seed خوانده شد → یک بار Save به `module=personnel`
- بارگذاری دوم → Seed دوباره خوانده نشد

## Pricing Migration Test
روی pricing-data نسخه 9.3.1 تست شد:
- قبل: 153 menu item / 0 ingredient / 0 recipe
- بعد: 379 menu item / 536 ingredient / 912 recipe
- Migration Seed فقط یک بار خوانده و ذخیره شد
- تمام Recipe referenceها معتبر هستند

## Excel Source Validation
- Item.xlsx: 379 رکورد، کد تکراری 0
- kham.xlsx: 536 رکورد، کد تکراری 0
- Junction.xlsx: 912 رکورد
- Missing menu reference: 0
- Missing ingredient reference: 0
- Duplicate recipe pair: 0

## Static Validation
- Syntax تمام فایل‌های JavaScript با `node --check`: موفق
- لینک تمام CSS/JSهای HTML: موجود
- direct runtime reference به `db/`: صفر
