# Deploy Notes — v9.8.0

1. کل فولدر نسخه جدید را جایگزین نسخه قبلی کنید تا Cache queryهای `v=9.8.0` و فایل `js/30-operational-polish-v9-8-0.js` همزمان Deploy شوند.
2. اگر Backend Allowlist دارد، `errorlog` را اضافه کنید:
   ```csharp
   ["errorlog"] = "error-log-data.json"
   ```
3. هیچ Seed عملیاتی را دستی روی داده واقعی Server overwrite نکنید. Asset reset دارای Migration ID است و از مسیر Migration اجرا می‌شود.
4. بعد از Deploy، Smoke Testهای `QA_REPORT_v9_8_0.md` را اجرا کنید.
5. برای Excel آفلاین، در صورت نیاز `js/xlsx.full.min.js` را روی هاست نگه دارید؛ وگرنه Loader فعلی ممکن است به CDN متکی باشد.
