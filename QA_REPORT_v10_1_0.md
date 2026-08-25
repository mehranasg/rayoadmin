# QA Report — Rayo Admin v10.1.0 Final Operational Review

## نتیجه
نسخه برای تحویل Static/Isolated Runtime آماده است. تست مرورگر واقعی روی هاست به‌دلیل محدودیت محیط تست محلی انجام‌پذیر نبود و بعد از Deploy یک Smoke Test واقعی توصیه می‌شود.

## Syntax / Data
- JavaScript: **37/37 PASS**
- JSON: **11/11 PASS**
- HTML local src/href references: **356 checked / 0 missing**
- Primary pages: build marker **10.1.0 PASS**

## Contract QA
**67/67 PASS**، شامل:
- ترتیب منو حقوق → گزارش صندوق → قیمت تمام‌شده → انبار
- Route مستقل Audit سپیدز و تحلیل سود/فروش
- Routeهای 11 زیرصفحه انبار
- صفحه مستقل Location، Transfer، COGS، History، Workflow، Receiving و Variance Reports
- حذف دسترسی‌ها از لیست پرسنل
- واحد رسپی/خرید و عدم وجود Labelهای عمومی مقدار/تعداد/مبلغ بدون واحد
- حذف اقلام شرکتی از Price Change Needed
- تبدیل یک‌باره ریال→تومان اموال
- پیام مدیر، پیام شیفت، تخلف با/بدون جریمه، گزارش 1/3/6/12 ماهه
- رزرو/بیعانه، مساعده، Show Password و اصلاح واحد مرخصی
- Permission شمارش موجودی و امکانات پنل پرسنل
- خرید دو مرحله‌ای با Stock Receipt وضعیت pending

## Runtime Isolated — Admin
PASS:
- `workflow` → راهنما و ورک‌فلو مغایرت‌گیری
- `receipts` → دریافت کالا / ورود به انبار
- `locations` → محل‌ها و نگاشت‌ها
- `transfer` → انتقال کالا
- `cost` → COGS و بستن دوره
- `history` → مغایرت و گردش کالا
- `sales` → ورود فروش برای مغایرت
- `varianceReports` → گزارش خسارت و مغایرت
- Supplier invoice → ثبت فاکتور خرید / حسابداری
- Supplier payment → پرداخت تأمین‌کننده
- Runtime errors: 0

## Runtime Isolated — Staff
PASS:
- init/login view
- آموزش در پایین منو
- عدم نمایش/اجرای شمارش بدون Permission
- مشاهده انعام
- رزرو برای صندوقدار مجاز
- دریافتی‌ها و مساعده
- پیام مدیر در Dashboard
- Dashboard cards بر اساس Permission
- هفته قبل/بعد و فیلتر سکشن
- مرخصی + سوابق
- Back
- جست‌وجوی اموال
- تقسیم انعام وزن‌دار
- باز/بسته شدن منوی موبایل
- فاکتور پرسنل → Stock Receipt pending

## Routing delayed-load
- `sepids-audit.html` با نصب دیرهنگام View → **PASS**
- `reports.html` با نصب دیرهنگام View → **PASS**

## Duplicate / Migration targeted tests
- نرمال‌سازی دو Tab «حساب و سوابق خرید» به دقیقاً یک Tab → **PASS**
- نمونه 100,000,000 ریال → 10,000,000 تومان → **PASS**
- ارزش 190k/94k سپس تبدیل ریال→تومان → **20,212,766 تومان PASS**

## Mobile
- Jalali picker width constrained to viewport.
- Select columns use `minmax(0,1fr)` and `max-width:100%`.
- Staff sidebar Backdrop closes menu on outside tap.

## محدودیت Screenshot
جلوگیری قابل اتکا از Screenshot در یک Web App مرورگری ممکن نیست. نسخه v10.1.0 ادعای امنیتی ساختگی برای این مورد اضافه نمی‌کند. در صورت نیاز می‌توان Watermark نام کاربر/زمان را به‌عنوان عامل بازدارنده در نسخه بعدی اضافه کرد.

## نکته Deploy
پس از آپلود کامل پوشه، Cache قدیمی پاک شود. سپس روی هاست واقعی حداقل این Smoke Testها انجام شوند: Login، منوی انبار، Supplier invoice/payment، Sepidz Audit، Reports، Staff login، Staff shift navigation و Mobile Jalali picker.
