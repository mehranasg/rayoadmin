# Rayo Admin

پنل عملیاتی فارسی و RTL کافه‌رستوران رایو برای پرسنل، شیفت و حقوق، کاتالوگ و رسپی، خرید و انبار (تک‌انبار)، صندوق، فروش، مالی و اموال. مبنای محصول **v10.12.1** است؛ تنها مبنای توسعه شاخهٔ `main` این مخزن است. برنامهٔ چندصفحه‌ای HTML/CSS/JavaScript است و Build یا نصب npm ندارد.

## شروع سریع

1. [راهنمای شروع](docs/AI_START_HERE.md) و برای اجرای محلی [مرجع فنی](docs/CURRENT_IMPLEMENTATION.md) را بخوانید. همهٔ مستندات در مرورگر: `docs/index.html` روی همان سرور (مثلاً `http://127.0.0.1:8080/docs/index.html`).
2. ریشهٔ مخزن را با یک static HTTP server سرو کنید؛ ورودی مدیریت `index.html` است. روی ویندوز دارای Python: `py -m http.server 8765 --bind 127.0.0.1`. فونت‌های `css/fonts/` در Git نیستند و باید جدا کپی شوند.
3. `js/app-config.js` به **API و دادهٔ زندهٔ رستوران** اشاره دارد. هر نسخهٔ محلی یا سروری با همین تنظیم روی دادهٔ واقعی می‌نویسد؛ برای آزمون نوشتنی، کپی محیط آزمون با API مستقل بسازید.
4. بررسی بدون دادهٔ زنده: `node qa_gateway.js`، `node qa_page_startup.js`، `node qa_settings_reset.js` و `node qa_v10_12_1.js`.

Gateway چهار action به نام‌های Load، Save، Query و Mutate دارد. فایل مرجع C# در `backend-prefrence/` موجود است؛ پروژهٔ قابل Build، دیتابیس، تنظیمات میزبانی و اثبات استقرار آن در این مخزن وجود ندارد.

## مراجع رسمی

| نیاز | سند |
|---|---|
| شروع کار AI، ایمنی و انتخاب فایل مرتبط | [AI_START_HERE](docs/AI_START_HERE.md) |
| محصول، کاربران، جریان‌ها و پذیرش | [PROJECT_MASTER_SPEC](docs/PROJECT_MASTER_SPEC.md) |
| صفحات، مالک کد، ترتیب script، اجرا و QA | [CURRENT_IMPLEMENTATION](docs/CURRENT_IMPLEMENTATION.md) |
| JSON، API، شناسه و سازگاری | [DATA_AND_API_REFERENCE](docs/DATA_AND_API_REFERENCE.md) |
| تشخیص سریع وضعیت قابلیت‌ها | [FEATURE_STATUS_MATRIX](docs/FEATURE_STATUS_MATRIX.md) |
| دفتر تصمیم‌ها، backlog، React و Client/Server | [REBUILD_AND_MIGRATION_GUIDE](docs/REBUILD_AND_MIGRATION_GUIDE.md) |
| نگهداری اسناد و تقدم منابع | [DOCUMENTATION_POLICY](docs/DOCUMENTATION_POLICY.md) |

ضمیمه‌های حوزه‌ای (انبار، ورود، تأمین، تنظیمات، وجوه، افت، برآورد، Excel) از جدول [سیاست مستندات](docs/DOCUMENTATION_POLICY.md) قابل دسترس‌اند.

توسعه‌دهنده: شروع ← محصول/ماتریس ← مرجع فنی و سند مرتبط. AI: ابتدا `AGENTS.md` و سند شروع، سپس فقط بخش مرتبط و سورس/تست همان بخش. تاریخچه فقط در Git است.

دادهٔ زنده، Backup عملیاتی، رمز و اطلاعات بانکی را وارد Git نکنید. Load ناموفق مجوز Seed، Initialize یا Save نیست.
