# QA Report — Rayo Admin v9.4.1

## اصلاحات تست‌شده

- ثابت اشتباه `SUPPLIERS_EMPTY_DATA` به `SUPPLIER_EMPTY_DATA` اصلاح شد.
- بعد از خطای Load تأمین‌کنندگان، state معتبر خالی ایجاد می‌شود و دیگر `null` باقی نمی‌ماند.
- درخواست API شامل QueryString اجباری `module` است.
- روی HTTP 500 یک Retry محدود انجام می‌شود و سپس نام دقیق ماژول در خطا نمایش داده می‌شود.
- درخواست‌های همزمان یک ماژول Deduplicate می‌شوند.
- Toast یکسان در فاصله ۵ ثانیه دوباره نمایش داده نمی‌شود.
- HR روی صفحات suppliers/pricing/inventory/cash-report/assets بی‌دلیل Load نمی‌شود.
- Cash Report و Assets روی همه صفحات به صورت خودکار Load نمی‌شوند.
- Dashboard ماژول‌های جانبی را در حالت silent بارگذاری می‌کند.
- دکمه Refresh بالای صفحات ماژولی به Refresh همان ماژول متصل می‌شود، نه JSON پرسنل.
- دکمه Save عمومی روی صفحات گزارش/صندوق/اموال که Save عمومی مناسب ندارند مخفی می‌شود.
- Syntax تمام فایل‌های JavaScript با `node --check` بررسی شد.
- تست Mock API تأیید کرد درخواست Pricing به شکل `RayoData/Load?module=pricing` ارسال و خطای 500 با نام ماژول گزارش می‌شود.

## نکته Backend

HTTP 500 پاسخ خود سرور است. این نسخه به عمد روی HTTP 500 فایل Seed را خودکار روی سرور Save نمی‌کند؛ چون اگر 500 ناشی از خطای موقت Backend باشد، Bootstrap خودکار می‌تواند دیتای واقعی را بازنویسی کند.
