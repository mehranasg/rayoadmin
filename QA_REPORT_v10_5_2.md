# QA Report — Rayo Admin v10.5.2

## Regression guard: Inventory
- Core invariant marker: PASS
- Sidebar اصلی: «انبار و کنترل مصرف» لینک مستقیم و بدون زیرمنو: PASS
- Sidebar تحلیل فروش: لینک مستقیم و بدون زیرمنو: PASS
- تعداد تب‌های Core: 12/12 PASS
- ترتیب عناوین ۱۲ تب: PASS
- تب‌های قدیمی فاکتور خرید/پرداخت تأمین‌کننده در Nav انبار: وجود ندارند — PASS
- ماژول نهایی v10.3 در صورت Core-12 از Override کردن View انبار خودداری می‌کند: PASS

## Bug fixes
- `ingredientUnit` تعریف شده: PASS
- micro runtime: recipeUnit و fallback unit: PASS
- فرم ضایعات از `ingredientUnit` استفاده می‌کند: PASS
- `data-jalali` از Money Formatter خارج است: PASS
- Labelهای «تاریخ / از تاریخ / تا تاریخ / روز / ماه / سال / ساعت» از Money Formatter خارج‌اند: PASS
- id/nameهای date / jalali / fromDate / toDate از Money Formatter خارج‌اند: PASS
- micro runtime: «تاریخ فروش» Money Input نیست: PASS
- micro runtime: «مبلغ فروش (تومان)» Money Input است: PASS

## Sales
- مبلغ محاسباتی هر ردیف فروش دستی عادی: PASS
- جمع محاسباتی کل فروش دستی عادی: PASS
- Import Excel فروش عادی در Core: PASS
- فروش اسنپ در Core تب فروش روزانه: PASS
- از تاریخ / تا تاریخ اسنپ: PASS
- مبلغ محاسباتی هر ردیف اسنپ: PASS
- جمع محاسباتی اسنپ: PASS
- Import Excel اسنپ: PASS
- ثبت `salesSource/source = SNAPP`: PASS
- Duplicate day/range check در Import/ثبت اسنپ: PASS

## Structural validation
- JavaScript syntax: 40/40 PASS
- JSON: 11/11 valid
- Local HTML refs checked: 387, missing: 0
- Cache/build references: v10.5.2

## Limitation
Full end-to-end test against the production RayoData backend is not possible in the build container. بعد از Deploy یک Smoke Test ثبت/Refresh روی هاست واقعی انجام شود.
