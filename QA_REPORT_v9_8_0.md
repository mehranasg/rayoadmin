# QA Report — Rayo Admin v9.8.0

## نتیجه کلی
**Static / contract QA: PASS**

## Syntax و فایل‌ها
- JavaScript Syntax (`node --check`): **35/35 PASS**
- JSON validation: **10/10 PASS**
- Static / feature contract checks: **60/60 PASS**
- Runtime helper test برای Parse نرخ ارز فارسی/انگلیسی و مرز یک‌سال کامل استهلاک: **PASS**
- CSS SHA-256 نسبت به v9.7.2: **کاملاً یکسان**
  - `24d0591fc19969623f19172b1de09477bc897053cec08312583946297ba7af84`

## اموال
- Seed دارایی‌ها: **190 نوع دارایی**
- `baseExchangeRateToman = 190000`: PASS
- `currentExchangeRateToman = 190000`: PASS
- `valuationBaseDate = 1405/05/20`: PASS
- Parser نرخ `۱۹۰٬۰۰۰` و `190,000`: PASS
- محاسبه سال کامل:
  - 1405/05/20 → 0 سال: PASS
  - 1406/05/19 → 0 سال: PASS
  - 1406/05/20 → 1 سال: PASS
  - 1407/05/20 → 2 سال: PASS
- `assetIncidents[]` در Schema/Seed/Frontend: PASS
- ثبت incident توسط staff + review مدیر: Contract PASS
- راهنمای اموال: PASS

## درخواست خرید
- نمایش سوابق درخواست خود کاربر: PASS
- Admin review: موجود و حفظ شده
- Admin close + status `بسته‌شده`: PASS

## تأمین‌کنندگان
- Schedule fields در Schema/Migration: PASS
- Schedule fields در فرم Add/Edit: PASS
- Schedule fields در Excel importer: PASS
- جلوگیری از نصب چندباره Supplier Excel importer: PASS
- Detail page مستقل: PASS
- سوابق Requests / Invoices / Payments در detail: PASS
- Popup جزئیات هر رکورد با cache امن و بدون JSON خام در onclick: PASS
- Permission `suppliersView` در User Management و access popup قدیمی: PASS
- Read-only supplier view در Staff Panel: PASS
- Dashboard card برای order day امروز: PASS
- خلاصه گروه و اقلام از Relationها در صورت خالی بودن summary دستی: PASS

## Excel Template
Header template برای 14 نوع Import تعریف شده است:
- personnel
- suppliers
- menu
- ingredients
- ingredientPrices
- recipes
- salesDaily
- waste
- invoices
- assets
- salesSummaryDaily
- salesSummaryMonthly
- salesDayDetail
- salesItemHistory

صفحه مستقل Sales Analysis نیز دکمه دانلود نمونه برای چهار فرمت خودش دارد.

## React/JSON technical contract
- Runtime filter برای حذف کارت قرارداد JSON: PASS
- Salary JSON technical note: PASS
- Supplier storage technical card: PASS
- مستند مستقل `REACT_JSON_DATA_CONTRACT.md`: PASS

## Error Log
- `errorlog` در config Allowlist Frontend: PASS
- Seed `error-log-data.seed.json`: PASS
- `manifest.json` شامل errorlog: PASS
- Save Runtime به `module=errorlog`: PASS
- forwarding خطاهای listener قدیمی به ErrorLog جدید: PASS
- کلاینت مستقل Error Log برای `staff-login.html`، `staff-panel.html`، `sales-analysis.html` و `cash-report.html`: PASS

## Browser Smoke Test
تلاش برای اجرای Chromium headless در محیط container انجام شد، اما فرآیند `--dump-dom` در این محیط به‌موقع terminate نشد و خروجی DOM قابل اتکا تولید نکرد. در لاگ Chromium علامت Crash/FATAL مربوط به اپلیکیشن مشاهده نشد، اما این تست را **Browser PASS** محسوب نمی‌کنیم.

### Smoke Test لازم بعد از Deploy
1. تغییر نرخ دلار اموال → Save → Refresh → باقی ماندن مقدار.
2. مشاهده ارزش یک دارایی با دلار 190,000 و استهلاک صفر در سال اول.
3. ثبت شکستگی از Staff Panel → مشاهده در Admin Assets → Review.
4. ثبت سفارش خرید از Staff Panel → مشاهده در Admin → بستن درخواست.
5. Supplier Add/Edit با روزهای سفارش و ارسال → Refresh → Persistence.
6. Supplier detail → درخواست/فاکتور/پرداخت → Popup جزئیات.
7. User Access → فعال‌کردن `مشاهده اطلاعات تأمین‌کنندگان` → Staff Panel.
8. Dashboard در روزی که Supplier order day دارد → نمایش کارت همان Supplier.
9. کلیک روی «دانلود نمونه» در Importهای اصلی.
10. ایجاد یک خطای تستی → مشاهده در Error Log و کنترل `RayoData/Save?module=errorlog` در Network.

## Deployment dependency مهم
اگر Backend `RayoData` Allowlist ثابت دارد، قبل از انتظار برای ذخیره Error Log باید این ماژول اضافه شود:

```csharp
["errorlog"] = "error-log-data.json"
```

عدم افزودن آن سایر ماژول‌ها را متوقف نمی‌کند، ولی Error Log روی سرور Persist نخواهد شد.
