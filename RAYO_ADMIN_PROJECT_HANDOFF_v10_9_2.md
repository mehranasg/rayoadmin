# تحویل پروژه Rayo Admin — v10.9.2

## معماری

- Frontend: HTML/CSS/JavaScript کلاسیک و چندصفحه‌ای
- Backend: تنها `RayoData/Load?module=...` و `RayoData/Save?module=...`
- ماژول‌ها: `personnel`، `suppliers`، `pricing`، `inventory`، `cashreport`، `assets`، `finance`، `survey`، `errorlog`، `sepidsaudit`
- Seed فقط برای مقداردهی اولیه یا Reset صریح مدیر است. Load عادی API-only است.
- Save عادی فقط پس از Load موفق همان Module در Session مجاز است.

## قاعده حیاتی داده

هیچ کد جدیدی نباید در Load، Migration یا Render صفحه، Seed/Default را روی سرور Save کند. Empty Schema فقط برای جلوگیری از Crash رابط است. هر Merge داده باید Preview، تأیید صریح، Backup و Rollback داشته باشد.

## انبار

انبار یک آیتم مستقیم Sidebar و دقیقاً ۱۲ تب ثابت دارد:

1. راهنما و ورک‌فلو
2. موجودی و سفارش
3. ارزش روز موجودی
4. دریافت کالا
5. ثبت فروش
6. محل‌ها و نگاشت‌ها
7. انتقال کالا
8. پرتی و ضایعات
9. شمارش دوره‌ای
10. بهای تمام‌شده و بستن دوره
11. مغایرت و گردش
12. گزارش‌ها

ماژول تأمین‌کنندگان نباید موجودی، فاکتور یا پرداخت را دوباره ذخیره کند؛ فقط آن‌ها را از Inventory می‌خواند.

## وضعیت تأمین‌کنندگان در v10.9.2

- فهرست Seed: ۶۱۵ قلم یکتا
- ۵۳۶ قلم متصل به Pricing با کد دقیق سپیدز
- ۷۹ قلم فقط-تأمین‌کننده حفظ‌شده
- همگام‌سازی داده زنده: `تأمین‌کنندگان ← تنظیمات ← بررسی و همگام‌سازی اقلام`
- ثبت سفارش و پیگیری: `suppliers.purchaseRequests`
- مانده حساب: محاسبه از `inventory.purchaseInvoices` و `inventory.supplierPayments`
- موجودی: محاسبه از Analytics ماژول Inventory

## مسیر سفارش روزانه

1. نقطه سفارش و موجودی هدف در کنترل موجودی/قلم تعریف می‌شود.
2. قلم به یک یا چند تأمین‌کننده مرتبط می‌شود و یکی می‌تواند اصلی باشد.
3. برنامه سفارش/تحویل و مسئول سفارش روی تأمین‌کننده یا قلم ثبت می‌شود.
4. «میز سفارش‌گذاری» اقلام رسیده به نقطه سفارش را نشان می‌دهد.
5. مدیر سفارش را با ETA ثبت می‌کند.
6. وضعیت در «سفارش‌های ثبت‌شده» تا تحویل پیگیری می‌شود.
7. فاکتور و دریافت واقعی فقط در انبار ثبت می‌شود.

## JSON جدید

Module جدیدی اضافه نشده است. جزئیات فیلدهای جدید در `BACKEND_NOTES_v10_9_2.md` آمده است. Backendهای JSON-opaque تغییری لازم ندارند؛ Backend سخت‌گیر باید فیلدهای جدید `suppliers.items`، `suppliers.suppliers` و `suppliers.purchaseRequests` را Preserve کند.

## فایل‌های کلیدی نسخه

- `js/42-operations-v10-9-2.js`
- `css/06-operations-v10-9-2.css`
- `seed/suppliers-data.seed.json`
- `qa_v10_9_2.js`
- `CHANGELOG_v10_9_2.md`
- `BACKEND_NOTES_v10_9_2.md`
- `QA_REPORT_v10_9_2.md`

## QA

`node qa_v10_9_2.js` باید `PASS 84` و `ALL CHECKS PASSED` بدهد.

