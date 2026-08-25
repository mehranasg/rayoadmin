# Deploy Notes — Rayo Admin v10.0.0

1. کل فولدر نسخه 10 را جایگزین نسخه قبلی کنید تا HTML و Cache Queryهای `v=10.0.0` با JSهای جدید هماهنگ باشند.
2. در Backend RayoData، ماژول‌های `errorlog` و `sepidsaudit` را در Allowlist اضافه/تأیید کنید. جزئیات در `BACKEND_MODULES_v10.md` است.
3. Seedهای `inventory`, `pricing`, `sepidsaudit` را روی داده واقعی سرور overwrite نکنید. Migration در Runtime داده موجود را توسعه می‌دهد.
4. بعد از اولین Load نسخه 10، تنظیمات `انبار و کنترل مصرف → محل‌ها و نگاشت` را بررسی کنید و Location تولید آیتم‌های منو را تعیین کنید.
5. برای شروع قابل اتکای مغایرت، یک شمارش واقعی/Opening Balance برای Locationهای فعال ثبت و تأیید کنید.
6. رسپی‌های موجود در اولین Migration به‌عنوان نسخه Legacy با تاریخ اثر `0000/00/00` Snapshot می‌شوند. تغییرات تاریخی رسپی که قبلاً هیچ‌جا ثبت نشده‌اند قابل بازسازی خودکار نیستند.
7. Import کنترلی سپیدز فعلاً Parser واقعی برای Deleted Invoice و Edited Invoice دارد. سایر گزارش‌ها تا دریافت نمونه واقعی Parser اختصاصی ندارند.
8. موتور Excel ابتدا `js/xlsx.full.min.js` محلی را امتحان می‌کند و سپس fallback اینترنتی دارد. فایل محلی در این بسته Build به دلیل نبود نسخه Vendor در Source قبلی موجود نیست؛ اگر اجرای کاملاً آفلاین Excel لازم است، همان فایل سازگار با Loader را روی هاست در مسیر `js/xlsx.full.min.js` قرار دهید.
9. Smoke Testهای انتهای `QA_REPORT_v10_0_0.md` را بعد از Deploy روی API واقعی اجرا کنید.
