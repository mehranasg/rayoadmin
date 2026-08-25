# Sepidz Control Audit — Rayo Admin v10.0.0

## گزارش‌های واقعی پشتیبانی‌شده

- فاکتورهای حذف‌شده (`Deleted Invoice`)
- فاکتورهای ویرایش‌شده (`Edited Invoice`)

Parser بر اساس ساختار واقعی Block-based نمونه‌های پروژه ساخته شده است؛ هر ردیف Excel یک Event مستقل فرض نمی‌شود.

## Data Model

ماژول مستقل `sepidsaudit`:

- `importBatches`
- `rawBlocks`
- `events`
- `eventItems`
- `changes`
- `alerts`
- `reviews`
- `links`
- `settings`

## Deleted

از هر Block یک Parent Event و Child Itemهای `DELETED` ساخته می‌شود.

## Edited

Markerهای واقعی `قبل از تغييرات` و `بعد از تغييرات` تشخیص داده می‌شوند. Snapshotها جدا ذخیره و Diff تولید می‌شود:

- `ITEM_REMOVED`
- `ITEM_ADDED`
- `QTY_DECREASED`
- `QTY_INCREASED`
- `PRICE_CHANGED`
- `ITEM_REPLACED` (Summary Candidate)

## Duplicate Control

برای هر Block:

- Logical Event Key بر اساس نوع + شماره فاکتور + تاریخ/ساعت رویداد + کاربر
- `RawBlockHash`

Hash یکسان Duplicate است. Event منطقی مشابه با Hash متفاوت Overwrite نمی‌شود و `ImportConflict` می‌گیرد.

## Raw Audit

Raw rows هر Block در `rawBlocks` نگه داشته می‌شوند و از Drill-down Event قابل مشاهده‌اند. ImportBatch نیز نام فایل، Hash فایل، بازه، تعداد Block، New/Duplicate و Importer را نگه می‌دارد.

## Rule Engine

Ruleهای فعلی:

- مبلغ بالای حذف
- حذف دیرهنگام نسبت به صدور
- PrintCount > 0
- آیتم پرریسک
- حذف/کاهش آیتم در Edited
- Edit مکرر یک Invoice
- مصرف احتمالی بدون Link/توضیح

Risk Score فقط Signal است. `تخلف تأییدشده` فقط با انتخاب مدیر ثبت می‌شود.

## Link به انبار

Event می‌تواند به این رکوردها Link شود:

- Waste
- Authorized Consumption
- Inventory Adjustment
- Manager Review/Explanation

از Drill-down ماده اولیه در Inventory نیز لینک مستقیم به Audit سپیدز همان ماده وجود دارد.

Related Sale در سطح Invoice فعلاً به‌صورت قطعی Link نمی‌شود، چون فایل فروش موجود پروژه شماره فاکتور/ساختار کافی برای Mapping قطعی همه Eventها ندارد. این قسمت پس از نمونه گزارش نهایی فاکتور فروش تکمیل می‌شود و نباید حدس زده شود.

## قالب‌های نمونه

در `templates/` دو فایل Sanitized وجود دارد:

- `sepids_deleted_template.xlsx`
- `sepids_edited_template.xlsx`

هدف آنها نمایش ساختار مورد انتظار Parser است. در عملیات واقعی بهتر است خروجی اصلی سپیدز Import شود.
