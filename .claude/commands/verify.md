---
description: بررسی کامل بعد از تغییر (نحو، آزمون‌ها، آزمون مرورگر، diff)
---
1. `npm run check` و `npm test` را اجرا کن.
2. اگر `.local-data/` هست، `npm run smoke` را اجرا کن؛ هر صفحه‌ای که خطای JS داشت یا خالی بود را گزارش بده.
3. `git diff --stat` و `git diff` را بخوان و بررسی کن که اسناد مالکِ تغییرها (`docs/STATE.md`، `BUSINESS_RULES.md`، `ARCHITECTURE.md`، `DECISIONS.md`) به‌روز شده باشند.
4. نتیجه را به فارسی گزارش بده: آزمون‌ها، اثر روی دادهٔ JSON، اثر روی بک‌اند، کارهای مالک.
