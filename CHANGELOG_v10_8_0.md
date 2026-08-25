# ChangeLog — Rayo Admin v10.8.0

## هدف نسخه
حذف کامل Bootstrap/Seed خودکار از Runtime عادی و تبدیل Seed به ابزار کاملاً دستی در تنظیمات، همراه با مستند جامع انتقال و Blueprint مهاجرت داده به SQL Server.

## تغییرات اصلی

### 1. سیاست Seed جدید
- `loadOrBootstrap()` دیگر هیچ Bootstrap یا Migration از Seed انجام نمی‌دهد و فقط API زنده را Load می‌کند.
- Seed در Runtime عادی خوانده نمی‌شود.
- تنها فایل UI مجاز برای Seed: `js/39-manual-initial-data-v10-8.js`.
- Legacy Reset UI/handlerهای قدیمی غیرفعال شدند.

### 2. وضعیت Initialized برای هر Module
- Gateway اکنون برای هر Module علاوه بر state، فیلد `initialized` نگه می‌دارد.
- پاسخ خالی `{}` → `initialized=false`.
- پاسخ واقعی → `initialized=true`.
- Save عادی روی Module مقداردهی‌نشده مسدود است.
- اولین Write فقط با `allowInitialize=true` و از مسیر دستی مجاز است.

### 3. تنظیمات → بارگذاری اطلاعات اولیه
فایل جدید:
- `js/39-manual-initial-data-v10-8.js`

امکانات:
- انتخاب Module
- بررسی وضعیت Live API
- Preview تعداد رکوردهای Live و Seed
- Initial Load فقط اگر Module قبلاً مقداردهی نشده باشد
- تأیید متنی `INITIALIZE`
- Save + GET verification
- Reset جداگانه از Seed با Backup خودکار JSON همان Module
- تأیید متنی `RESET FROM SEED`

### 4. ایمنی HR
- `00-base.js` بعد از Load، `__RAYO_HR_SERVER_CONFIRMED__` را فقط وقتی true می‌کند که Module واقعاً initialized باشد.
- Refresh نیز همین قاعده را رعایت می‌کند.
- Defaultهای runtime نمی‌توانند Module خالی را بدون Initialize روی سرور ذخیره کنند.

### 5. Runtime Empty Schema
- برای Moduleهای غیر HR، پاسخ خالی به Empty Schema ساختاری تبدیل می‌شود و Default داده‌ای تزریق نمی‌شود.
- این Empty Schema فقط برای جلوگیری از Crash UI است و Save عادی آن مسدود است.

### 6. Backup
- سیاست ثبت‌شده Backup به `manual-initialize-or-reset-only` به‌روز شد.
- Backup زنده همچنان Seed را وارد ZIP نمی‌کند.

### 7. Seed manifest
- Build به `10.8.0` به‌روز شد.
- سیاست Seed به‌صورت صریح در Manifest ثبت شد.

### 8. Regressionهای ثابت حفظ شدند
- «انبار و کنترل مصرف» بدون زیرمنو.
- دقیقاً 12 تب Core انبار.
- تغییرات نسخه‌های قبلی Pricing، Staff UX، Save verification، Access و Sales Analytics حفظ شدند.

## مستندات جدید
- `RAYO_ADMIN_PROJECT_HANDOFF_v10_8_0.md`
- `RAYO_DATA_MODEL_SQL_MIGRATION_v10_8_0.md`
- `RAYO_DATA_MODEL_v10_8_0.json`
- `QA_REPORT_v10_8_0.md`

## Backend
Module جدید لازم نیست. همان 10 Module فعلی استفاده می‌شوند.
