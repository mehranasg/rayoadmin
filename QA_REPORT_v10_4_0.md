# QA Report — Rayo Admin v10.4.0

## نتیجه

- Acceptance Contract: **31 / 31 PASS**
- JavaScript Syntax: **40 / 40 PASS**
- JSON Validation: **11 / 11 PASS**
- Local HTML references: **PASS / 0 missing**
- Inventory final view isolated runtime: **PASS**
- Inventory calculation isolated runtime: **PASS**

## تست Runtime فروش اسنپ

سناریو:
- موجودی اولیه فیله: 10,000 گرم
- رسپی آیتم: 150 گرم فیله
- فروش اسنپ: 2 عدد

نتیجه مورد انتظار: 9,700 گرم

نتیجه واقعی موتور Inventory: **9,700 گرم — PASS**

Unit Cost تست: 1,200 تومان/گرم
ارزش موجودی نتیجه: **11,640,000 تومان — PASS**

## تست View نهایی Inventory

- تعداد تب‌ها: **12 / 12**
- عناوین:
  1. راهنما و ورک‌فلو
  2. موجودی و سفارش
  3. ارزش روز موجودی
  4. دریافت کالا
  5. فروش روزانه
  6. محل‌ها و نگاشت‌ها
  7. انتقال کالا
  8. پرتی و ضایعات
  9. شمارش دوره‌ای
  10. بهای مواد و بستن دوره
  11. روند مغایرت
  12. گزارش خسارت و مغایرت
- فروش روزانه اسنپ در تب فروش روزانه: **PASS**
- دکمه Import فروش روزانه Excel در View تست: **1 عدد — PASS**
- فیلد آخرین قیمت خرید در شمارش: **PASS**
- Baseline موجودی اولیه: **PASS**

## تست‌های Contract اصلی

- Sidebar اصلی: Inventory فقط لینک مستقیم — PASS
- Sidebar صفحه تحلیل فروش: Inventory فقط لینک مستقیم — PASS
- گزارش ارزش روز موجودی و Sort نزولی — PASS
- پیش‌بینی هزینه و حقوق + Actual Paid Salary — PASS
- پرداخت تأمین‌کننده خارج از Inventory Tabs — PASS
- Duplicate Cash Report Lock — PASS
- Future Cash Report Lock — PASS
- وضعیت «اتمام همکاری» در Default/Seed — PASS
- Reset مستقل Moduleها — PASS
- Import Invoice/Sales/Recipe de-duplication guard — PASS

## محدودیت تست

Navigation واقعی Chromium به localhost در محیط ابزار با `ERR_BLOCKED_BY_ADMINISTRATOR` مسدود است؛ بنابراین تست مرورگر End-to-End روی URL واقعی هاست انجام نشده. Runtimeهای حساس به‌صورت ایزوله با اجرای JavaScript واقعی ماژول‌ها و State تستی انجام شده‌اند. پس از Deploy یک Smoke Test کوتاه روی Backend واقعی توصیه می‌شود.
