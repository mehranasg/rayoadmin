# Rayo Admin v10.10.0

نسخه مرجع فعلی پنل مدیریت کافه‌رستوران رایو.

## شروع سریع

1. از نسخه فعلی هاست و داده‌های Backend بکاپ بگیرید.
2. همه فایل‌های این ZIP را با حفظ ساختار پوشه‌ها آپلود کنید.
3. Hard Refresh انجام دهید.
4. وارد `تنظیمات → مدیریت اطلاعات و بکاپ` شوید.
5. وضعیت ۱۰ ماژول را بررسی کنید.
6. برای Module دارای داده، «بارگذاری اطلاعات اولیه» باید غیرفعال باشد.
7. در Reload عادی، Network نباید هیچ Request به `/seed/` داشته باشد.
8. برای ارتقای داده واقعی نسخه قبلی، «تأمین‌کنندگان → تنظیمات → مهاجرت یک‌باره به کاتالوگ مرکزی» را اجرا کنید.

## سیاست داده

- Load عادی: فقط API
- Save عادی: فقط پس از Load موفق و روی Module مقداردهی‌شده
- Seed: فقط Initialize یا Reset صریح مدیر
- HTTP 500: بدون Seed fallback و بدون Auto-save
- Backup: فقط داده زنده API؛ اگر یک Module Fail شود ZIP ناقص ساخته نمی‌شود

## مسیر مدیریت داده

```text
personnel.html?view=dataManagement
```

## QA

```bash
node qa_v10_10_0.js
```

## مستندات مرجع

- `RAYO_ADMIN_PROJECT_HANDOFF_v10_10_0.md`
- `CATALOG_DATA_MODEL_v10_10_0.md`
- `MIGRATION_GUIDE_v10_10_0.md`
- `CHANGELOG_v10_10_0.md`
- `QA_REPORT_v10_10_0.md`
- `BACKEND_NOTES_v10_9_0.md`
- `DATA_SAFETY_AUDIT_v10_7_0.md`
- `RAYO_DATA_MODEL_SQL_MIGRATION_v10_8_0.md`
- `RAYO_DATA_MODEL_v10_8_0.json`
