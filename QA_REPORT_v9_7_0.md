# QA Report — Rayo Admin v9.7.0

## Scope
فقط قابلیت‌های آموزش/پروتکل و چک‌لیست‌های عملیاتی توسعه داده شده‌اند.

## Static QA
- JavaScript files checked with `node --check`: 32
- Syntax errors: 0
- JSON files validated: 9
- Invalid JSON: 0
- CSS SHA-256 برابر با v9.6.1: PASS

## Runtime tests
- Admin views `protocols`, `checklistTemplates`, `checklistReports` با State نمونه: PASS
- Staff menu نمایش «آموزش و پروتکل‌ها»: PASS
- Staff menu نمایش «چک‌لیست‌های من»: PASS
- فیلتر محتوای آموزشی برای کاربر نمونه: PASS
- نمایش Checklist عمومی برای کاربر نمونه در شیفت صبح: PASS
- Save checklist record با 2 آیتم، 1 آیتم انجام‌شده، completion=50% و Notes: PASS

## Persistence
داده‌ها داخل Backend module موجود `personnel` ذخیره می‌شوند؛ Endpoint یا allowlist جدید نیاز نیست.

## Expected checklist logic
در گزارش مدیریت، انتظار انجام چک‌لیست بر اساس Shift Record و Monthly Plan همان روز ساخته می‌شود. رکوردهای ثبت‌شده حتی در صورت نبود Shift Plan نیز در گزارش دیده می‌شوند.

## Deploy smoke tests recommended
1. یک گروه پروتکل بسازید.
2. یک پروتکل برای «سالن» و یکی برای «همه» بسازید.
3. با کاربر سالن وارد Staff Panel شوید و نمایش هر دو را کنترل کنید.
4. یک Checklist عمومی فردی و یک Checklist سکشن با مسئول مشخص بسازید.
5. Staff Panel → چک‌لیست‌های من → یک مورد ناقص ذخیره شود.
6. Admin → گزارش چک‌لیست‌ها → همان روز: رکورد ناقص و درصد تکمیل بررسی شود.
7. آیتم‌ها کامل شوند و گزارش به «کامل» تغییر کند.
