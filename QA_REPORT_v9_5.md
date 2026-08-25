# QA Report — Rayo v9.5 Phase 2

## بررسی‌های انجام‌شده
- Syntax همه فایل‌های JavaScript با `node --check`: PASS
- اعتبار JSON همه Seedها: PASS
- اسکن Runtime برای `SplitCost`: هیچ ارجاعی پیدا نشد
- URL Builder API برای 8 ماژول: PASS
- همه URLها از `RayoData/Load|Save?module=...` استفاده می‌کنند
- `personnel` به‌عنوان Backend module برای HR تأیید شد
- `finance` و `survey` در Gateway و Seed ثبت شده‌اند
- Importerهای Excel برای پرسنل، تأمین‌کنندگان، آیتم منو، رسپی، فروش، ضایعات، فاکتور خرید و اموال اضافه شده‌اند
- Import اموال Upsert است: شماره‌دار با شماره اموال و تعدادی با نام + دسته‌بندی + محل تطبیق داده می‌شود
- Import مواد اولیه و آخرین قیمت از قابلیت قبلی حفظ شده است
- فاکتور خرید Excel به stockReceipts و ingredientPriceHistory متصل است
- سناریوی نمونه سود/زیان: فرمول VAT 10٪ و عملکرد 5٪ به‌صورت مستقل از فروش محاسبه می‌شود
- نسخه Cache فایل‌های اصلی HTML/JS به 9.5.0 تغییر کرده است

## Browser QA
تلاش برای اجرای Chromium روی سرور محلی انجام شد اما محیط اجرا Navigation به localhost را با `ERR_BLOCKED_BY_ADMINISTRATOR` مسدود کرد. بنابراین ادعای تست کامل مرورگر محلی نداریم. تست نهایی UI/API باید بعد از آپلود روی هاست انجام شود.

## مواردی که بعد از آپلود باید Smoke Test شوند
1. بازشدن `finance.html` بدون خطای API
2. بازشدن `survey.html` بدون خطای API
3. ثبت نام کاربری/رمز روی یک پرسنل و ورود از `staff-login.html`
4. ارسال درخواست مرخصی و تأیید آن در پنل ادمین
5. ثبت یک فروش Excel و مشاهده آن در Inventory
6. ثبت یک Waste Excel
7. ثبت یک Invoice Excel و کنترل ورود انبار + بروزرسانی قیمت
8. ثبت یک نظرسنجی و Review مدیر
9. خروجی شماره تلفن مشتریان
10. گزارش سود و زیان یک ماه نمونه

## نکته امنیت
Login پرسنل در معماری فعلی Client-side است. برای Production امن باید Backend Authentication اضافه شود.
