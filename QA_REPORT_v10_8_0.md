# QA Report — Rayo Admin v10.8.0

## Scope
تمرکز QA این نسخه روی Data Safety، Seed policy، Initialize دستی، Save guard و Regression انبار بوده است.

## Static / Syntax
- JavaScript: **42/42 PASS**
- Seed JSON: **11/11 PASS**
- Local HTML references: **389 checked / 0 missing**
- Build marker: **10.8.0 PASS**

## Data-safety contracts
**13/13 PASS**

1. `loadOrBootstrap()` فقط `loadModule()` را فراخوانی می‌کند.
2. Save عادی نیازمند `initialized=true` است.
3. Seed policy برابر `manual-initialize-or-reset-only` است.
4. Seed loader فقط از Gateway export شده و خودکار اجرا نمی‌شود.
5. Manual Initial Data Manager در Settings load می‌شود.
6. دکمه Initial Load وجود دارد.
7. Initial Load نیازمند `INITIALIZE` است.
8. Reset نیازمند Backup + `RESET FROM SEED` است.
9. Legacy Reset غیرفعال است.
10. دسترسی runtime به Seed فقط در `config.js` و `39-manual-initial-data-v10-8.js` وجود دارد.
11. Inventory 12-tab core حفظ شده است.
12. Inventory sidebar direct-link حفظ شده است.
13. Build v10.8.0 در app-config ثبت شده است.

## Runtime Gateway test (Node VM)
Scenario با Backend mock اجرا شد:

### Empty module
- API returns `{}`
- `initialized=false` → **PASS**
- Normal Save قبل از Initialize → **BLOCKED / PASS**
- Seed قبل از فراخوانی صریح خوانده نشد → **PASS**
- `loadSeedFile()` فقط با اقدام صریح اجرا شد → **PASS**
- Manual Initialize با flags مخصوص توانست POST کند → **PASS**

### Existing live module
- API returns valid HR data
- `initialized=true` → **PASS**
- Normal Save مجاز → **PASS**

## Seed-access audit
پس از غیرفعال‌کردن resetهای Legacy، reference عملیاتی Seed فقط در:
- `js/config.js`
- `js/39-manual-initial-data-v10-8.js`

وجود دارد.

## Inventory regression
Source of Truth تب‌ها:
- `js/14-ops-integration.js`

نتیجه:
- **12/12 tab labels found**
- direct sidebar guard found
- زیرمنوی قدیمی نباید برگردد

## Limitations
- Write واقعی روی Backend Production از محیط Build انجام نشده است.
- پس از Deploy باید یک Module آزمایشی/خالی با ابزار Settings Initialize شود و GET بعدی تأیید شود.
- HTTP 500 سمت Backend توسط Frontend قابل رفع نیست؛ نسخه جدید فقط مانع fallback/overwrite ناخواسته می‌شود.

## Smoke test پیشنهادی بعد از Deploy
1. Network را باز کنید؛ Reload عادی نباید هیچ `/seed/` request داشته باشد.
2. Settings → بارگذاری اطلاعات اولیه → یک Module موجود را انتخاب کنید؛ Initial Load باید Disabled باشد.
3. برای Module خالی واقعی، status باید مقداردهی‌نشده باشد و Initial Load فعال شود.
4. بدون `INITIALIZE` هیچ POST انجام نشود.
5. پس از Initial Load، GET تأییدی باید داده را برگرداند و status initialized شود.
6. Inventory باید بدون زیرمنو و با 12 تب نمایش داده شود.
