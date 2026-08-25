# QA Report — Rayo Admin v9.5.9

## هدف
Hotfix برای Crash / قفل‌شدن مرورگر هنگام لود `index.html` در v9.5.8.

## علت ریشه‌ای
در `js/26-access-brand-v9-5-8.js` نسخه 9.5.8 یک `MutationObserver` روی کل `document.documentElement` با `subtree:true` نصب شده بود. هر تغییر DOM در داشبورد باعث اجرای دوباره `applyBrand()` و Queryهای سراسری می‌شد. خود `applyBrand()` نیز بعضی Text Nodeها را تغییر می‌داد و این الگو می‌توانست موج تکراری Mutation و مصرف شدید CPU/Memory ایجاد کند.

## اصلاح
- حذف کامل MutationObserver سراسری.
- اعمال برند فقط در DOMContentLoaded و یک اجرای تأخیری محدود.
- دریافت نام برند از State/API بدون پایش دائمی DOM.
- عنوان صفحه همیشه از `ORIGINAL_TITLE` ساخته می‌شود تا جایگزینی نام برند تکرارشونده نشود.
- هیچ CSS، داده Seed یا منطق عملیاتی دیگری تغییر نکرد.

## تست‌ها
- `node --check`: 29 فایل JavaScript، 0 خطا.
- JSON validation: 9 فایل، 0 خطا.
- Hash فایل `css/style.css` با v9.5.8 کاملاً یکسان است.
- در فایل Brand جدید هیچ `MutationObserver` سراسری وجود ندارد.
- Chromium isolated stress test روی v9.5.9 با افزودن 5000 Node جدید: PASS، بدون Crash؛ تعداد Queryهای سراسری بعد از تغییرات فقط 3 مورد افزایش داشت.
- همان تست روی ماژول v9.5.8 تحت بار Mutation قفل شد/به Timeout رسید؛ این رفتار با علت ریشه‌ای فوق سازگار است.

## محدودیت محیط تست
Navigation مستقیم به localhost / URL مصنوعی در Chromium محیط اجرا با `ERR_BLOCKED_BY_ADMINISTRATOR` مسدود است؛ بنابراین Full-page navigation تست نشد. تست ماژول مشکل‌دار مستقیماً در Chromium انجام شد.
