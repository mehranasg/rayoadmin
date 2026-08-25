# QA Report — Rayo Admin v10.0.1

## محدوده
Hotfix و توسعه محدود Inventory/Waste روی v10.0.0. CSS و طراحی اصلی تغییر نکرده است.

## نتایج Static QA
- JavaScript syntax: **36/36 PASS** (`node --check`).
- JSON seeds: **11/11 valid**.
- Local HTML references: **345 checked / 0 missing**.
- HTML build metadata: **15/15 = 10.0.1-inventory-waste-control**.
- Runtime JS شامل متن خطای قدیمی `اطلاعات انبار، قیمت‌گذاری یا تأمین‌کنندگان آماده نیست`: **0 occurrence**.
- MutationObserver جدید در فایل‌های تغییرکرده: **0**.
- CSS SHA-256 با v10.0.0 یکسان: `24d0591fc19969623f19172b1de09477bc897053cec08312583946297ba7af84`.

## Routing Runtime Test
هر Route با `?tab=` مستقل Render شد:
- overview: PASS
- locations: PASS
- transfer: PASS
- waste: PASS
- stock: PASS
- cost: PASS
- history: PASS

در Runtime View ضایعات تعداد دکمه `ورود ضایعات Excel`: **1 — PASS**.

## Waste / Cost Runtime Test
سناریوی کنترل:
- فروش صندوق: 4,000,000,000 تومان
- Waste: 10 واحد × 2,000,000 تومان = 20,000,000 تومان
- مصرف استاندارد: 50 واحد × 2,000,000 تومان = 100,000,000 تومان

نتیجه:
- قبل از تأیید مدیر: Waste Value = 0 و روی موجودی اثر ندارد — PASS.
- پس از تأیید مدیر: Waste Value = 20,000,000 — PASS.
- Waste / Sales = **0.5%** — PASS.
- Waste / Standard Consumption = **20%** — PASS.
- Waste / known Material Consumption = **16.6667%** — PASS.
- موجودی قبل از تأیید = 50؛ بعد از تأیید = 40 — PASS.

## Staff Runtime Test
- گزینه `ضایعات / مصرف` در پنل کاربر دارای Permission: PASS.
- برای کاربر سکشن بار، Location بار نمایش و آشپزخانه پنهان شد: PASS.
- ثبت رویداد توسط پرسنل با `pending / در انتظار بررسی`: PASS.
- ثبت پایان شیفت با Event → `HAS_EVENT`: PASS.
- ثبت پایان شیفت بدون Event → `NO_EVENT`: PASS.
- Manager missing-declaration alert برای کاربر شیفت برنامه‌ریزی‌شده: PASS.

## Excel / Ledger Regression
- Resync Ledger پس از Import Waste در Importer فراخوانی می‌شود.
- Movement مربوط به Waste Record حذف‌شده در Import جایگزین به `void` تبدیل شد: PASS.
- بنابراین Import مجدد اثر موجودی قدیمی را زنده نگه نمی‌دارد.

## محدودیت تست
Browser end-to-end روی Backend production از داخل این محیط انجام نشده است. تست‌ها شامل Syntax/JSON/static contract و Runtime ایزوله واقعی توابع Routing، Inventory Metrics، Manager Approval، Staff workflow و Ledger Resync هستند. پس از Deploy، Smoke Test با Backend واقعی توصیه می‌شود.
