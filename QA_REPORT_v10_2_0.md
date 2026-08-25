# QA Report — Rayo Admin v10.2.1

## نتیجه کلی
PASS برای تست‌های Static / Contract / Isolated Runtime انجام‌شده در محیط فعلی.

## Syntax و Data
- JavaScript: **38/38 PASS** با `node --check`
- JSON: **11/11 valid**
- Local HTML references: **371 reference / 0 missing**

## Contract QA
**37/37 PASS**

موارد پوشش‌داده‌شده شامل:
- Inventory sidebar یک لینک واحد
- انتقال Cost Forecast به Reports
- حذف Payment/Invoice از تب‌های Inventory
- عنوان‌های فارسی شمارش دوره‌ای و بهای مواد
- تب ارزش روز موجودی
- تب فروش روزانه
- ثبت Snapp در `salesPeriods`
- محاسبه مصرف موجودی از همه `salesPeriods`
- گزارش ارزش روز بر اساس Current Position
- Opening Baseline شمارش
- ثبت آخرین قیمت خرید در شمارش
- اولویت قیمت جدید شمارش نسبت به Receipt قدیمی
- Dropdown واقعی مواد در روند مغایرت
- Redirect مسیر قدیمی پرداخت به Suppliers
- قفل تاریخ آینده گزارش صندوق
- قفل Duplicate گزارش صندوق
- وضعیت اتمام همکاری
- فیلتر پیش‌فرض پرسنل فعال
- Reset مستقل Moduleها
- فرمت سه‌رقمی مبلغ
- حذف Duplicate Import Buttonها
- Guard برای Recipe/Sales Import
- Modal غیر Full-screen موبایل
- Safe Area Toolbar
- کنترل Jalali Picker موبایل
- عدم بسته‌شدن Popup با Backdrop Click
- Build v10.2.1 روی HTMLها
- Workflow شروع Baseline
- Actual Salary + Forecast
- عنوان مستقل Viewهای Inventory

## Isolated Inventory Runtime Test
Scenario:
- Opening kitchen stock: 10,000 g beef
- Snapp sales: 2 burgers
- Recipe: 150 g beef per burger
- Expected closing stock: 9,700 g
- Latest stocktake price: 1,200,000 Toman / kg = 1,200 Toman / g

Actual result:
- Quantity: **9,700 g**
- Unit cost: **1,200 Toman/g**
- Value: **11,640,000 Toman**

Result: **PASS**

این تست ثابت می‌کند فروش Snapp فقط در UI ذخیره نمی‌شود و وارد موتور مصرف رسپی/موجودی می‌شود. همچنین قیمت جدید Stocktake نسبت به Receipt قدیمی اولویت می‌گیرد.

## محدودیت تست
محیط اجرایی فعلی امکان Smoke Test کامل با Navigation واقعی روی Backend/هاست Rayo را به‌صورت قابل اتکا فراهم نکرد. بنابراین ادعای Browser E2E یا Backend E2E نشده است. بعد از Deploy، تست کوتاه Login/Load/Save و Import روی سرور واقعی توصیه می‌شود.
