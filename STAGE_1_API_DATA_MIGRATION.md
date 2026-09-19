# راهنمای Stage 1 تاریخی — منسوخ

**Deprecated:** Bootstrap/Migration خودکارِ توضیح‌داده‌شده در نسخهٔ قدیمی مجاز نیست. Load خالی/ناموفق نباید Seed بخواند یا Save کند. `loadOrBootstrap` فعلی فقط Load می‌کند و `applySeedMigration` نوشتنی نیست.

این مسیر به‌عنوان هشدار سازگاری راهنمای migration حفظ شده است. قرارداد معتبر و منشأ Seed در [مرجع داده](docs/DATA_AND_API_REFERENCE.md)، Initialize/Reset صریح در [راهنمای عملیات داده](docs/SETTINGS_SEPARATION_AND_TABLE_RESET.md)، و migration آینده در [راهنمای چهار مسیر](docs/REBUILD_AND_MIGRATION_GUIDE.md) آمده‌اند. برای تغییر دامنه فقط `js/app-config.js` مرجع است. هیچ دستور نسخهٔ قدیمی بدون تطبیق با این مراجع اجرا نشود.
