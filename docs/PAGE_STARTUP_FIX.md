# راه‌اندازی صفحات

ضمیمهٔ فنی startup؛ مرجع جاری [CURRENT_IMPLEMENTATION](CURRENT_IMPLEMENTATION.md) و نتایج تازه در [گزارش پالایش](DOCS_CLEANUP_REPORT.md). نسخهٔ محصول v10.12.1 مانده است.

## قرارداد اجرا

- `js/00-base.js` نخستین نوشتن view را تا اجرای scriptهای اولیه و handlerهای نصب عقب می‌اندازد؛ در این فاصله Loading حفظ می‌شود. view آماده‌نشده نباید به داشبورد تبدیل شود. render صریح بعدی همگام است.
- `js/16-mpa-shell.js` route اولیه را همگام انتخاب می‌کند؛ polling یا هدایت تأخیری به dashboard راه‌حل startup نیست.
- ۱۴ ورودی مدیریت فایل‌های 44، 45، 46 و 47 را با defer و CSS نهایی در head دارند. این فایل‌ها بعد از scriptهای معمولی اجرا می‌شوند؛ dynamic loader فقط fallback دارای guard است.
- نصب‌کننده‌های 15، 17، 23، 25، 29، 34، 36، 40، 42، 43، 46 و 47 نباید ناوبری/بازنویسی کامل اولیهٔ تکراری بسازند. ثبت دیرهنگام HR فقط route جاری را دوباره رسم می‌کند.
- تکمیل Load پس‌زمینهٔ انبار در 14/32 نباید صفحهٔ نامرتبط را رسم کند. guard ظاهر shell در CSS حتی در خطای render آزاد می‌شود.
- cache suffix، از جمله startup-1، نسخهٔ مستقل محصول نیست.

## آزمون و پذیرش

`node qa_page_startup.js` در ممیزی جاری ۴۱ بررسی را پاس کرد: routeهای اولیه، نصب دیرهنگام، شکست bootstrap/render، پایداری input، ترتیب assets، صفحهٔ مستقل settings و Load خواندنی با دادهٔ ساختگی. QAهای متنی/VM تأیید layout، زمان فونت و CLS مرورگر نیستند.

در مرورگر محیط آزمون، هر URL را مستقیم باز کنید؛ Loading همان صفحه، نبود چشمک dashboard، route صحیح بعد از دریافت کند، Back/Forward و Error قابل‌بازیابی را بررسی کنید. Network در Load عادی باید فاقد Seed/Save عملیاتی باشد.

این قرارداد schema، DTO، ID یا migration را عوض نمی‌کند. rollback تغییر startup با revert commit مربوط است و به restore داده نیاز ندارد.
