# Changelog — Rayo Admin v10.0.0

## Inventory / Cost Control
- اضافه‌شدن Location-based Inventory با انبار اصلی، آشپزخانه، بار، قلیان و سالن.
- Ledger استاندارد انتقال، برگشت، ضایعات، ریزش، فساد، شکستگی، مفقودی، مصرف پرسنلی/مهمان/تست و Adjustment.
- Migration داده‌های فعلی خرید، Stock Receipt، Waste و Opening موجودی به مدل جدید بدون حذف ساختار قبلی.
- Mapping آیتم منو به Location تولید.
- Recipe Versioning با Effective Date.
- Weighted Average Cost و COGS استاندارد/واقعی.
- تفکیک Price Effect از مغایرت فیزیکی.
- Cycle Count روزانه/هفتگی/ماهانه با Blind Count پرسنل و تأیید مدیر.
- Period Closure Snapshot.
- Drill-down ماده تا Movement + Standard Sale Consumption + لینک به Audit سپیدز.

## Staff Panel
- Permissionهای مستقل Waste، Authorized Consumption، Transfer و Count.
- ثبت ضایعات/مصرف مجاز از پنل پرسنل و نمایش در مدیریت.
- انتقال موجودی از پنل پرسنل.
- Blind Count و ارسال برای تأیید مدیر.
- اصلاح Runtime View انتقال و همگام‌سازی وضعیت Review بین رکورد مدیریتی و Ledger.

## Sepidz Audit
- صفحه مستقل `sepids-audit.html`.
- Parser واقعی Block-based برای `deleted.xlsx` و `edited.xlsx`.
- Preview قبل از Import، ImportBatch، RawBlock، Hash، Dedup و Conflict detection.
- BEFORE/AFTER Snapshot و Diff آیتم‌ها.
- Rule Engine، Risk Score و Manager Review Inbox.
- Link به Waste / Authorized Consumption / Adjustment.
- Raw Block قابل مشاهده در Drill-down.
- قالب‌های نمونه Sanitized برای دو فرمت.

## Error Log
- حذف View قدیمی LocalStorage از Routing.
- `errorlog` JSON سرور Source of Truth است.
- Early errors فقط موقتاً در Memory Queue نگه داشته و بعد از آماده‌شدن API منتقل می‌شوند.
- یک‌بار داده Legacy LocalStorage در صورت وجود migrate و سپس حذف می‌شود.

## Compatibility
- CSS تغییر نکرده است.
- Runtime همچنان فقط از RayoData API استفاده می‌کند.
- SplitCost Runtime fallback اضافه نشده است.
