# Data Safety Audit — Rayo Admin v10.7.0

## هدف
جلوگیری قطعی از این سناریو که API موقتاً خالی/ناموفق باشد و Frontend، Seed یا Default/Migration را به‌جای داده واقعی روی Backend ذخیره کند.

## ماژول‌های زنده بررسی‌شده
| Frontend module | Backend module | وضعیت Guard |
|---|---|---|
| `hr` | `personnel` | API-only load + live-load save guard + HR-specific guard |
| `suppliers` | `suppliers` | API-only load + live-load save guard |
| `pricing` | `pricing` | API-only load + Seed migration disabled + live-load save guard |
| `inventory` | `inventory` | API-only load + auto schema/Ledger save disabled + live-load save guard |
| `cashreport` | `cashreport` | API-only load + live-load save guard + verified Sales Analytics saves |
| `assets` | `assets` | API-only load + Seed merge migration disabled + live-load save guard |
| `finance` | `finance` | API-only load + live-load save guard |
| `survey` | `survey` | API-only load + live-load save guard |
| `errorlog` | `errorlog` | API module؛ از live-load guard عمومی مستثناست تا ثبت خطای Bootstrap باعث بن‌بست نشود. Seed ندارد. |
| `sepidsaudit` | `sepidsaudit` | API-only load + live-load save guard |

## علت اصلی ریسک قبلی
1. `loadOrBootstrap()` در پاسخ خالی یا شرایط Bootstrap می‌توانست Seed را Load و Save کند.
2. Pricing Migration می‌توانست Seed را با داده Live Merge و سپس خودکار Save کند.
3. Assets initial migration Seed را Fetch/Merge و خودکار Persist می‌کرد.
4. چند Patch قدیمی HR در زمان Install، `saveData(false)` اجرا می‌کردند. اگر Load سرور Fail شده بود و برنامه با `DEFAULT_DATA` بالا می‌آمد، امکان Persist شدن Default وجود داشت.
5. Inventory V10 هنگام Load، Schema/Ledger migration را خودکار Save می‌کرد.

## سیاست جدید
- اجرای معمول برنامه **هیچ Seedی را Load-to-Save نمی‌کند**.
- Seed فقط در Settings → Reset و پس از دو تأیید مدیر استفاده می‌شود.
- `saveModule()` قبل از POST بررسی می‌کند Module در همان Session از API Live با موفقیت Load شده باشد.
- اگر Load وضعیت `error/idle` داشته باشد، Save قبل از ارسال HTTP مسدود می‌شود.
- Reset صریح تنها مسیر دارای `allowSeedWrite:true` و `allowUnconfirmedWrite:true` است.
- Migrationهای لازم در Load فقط In-memory انجام می‌شوند؛ با اولین عملیات واقعی و صریح کاربر Persist خواهند شد.

## نتیجه عملی
اگر Backend مثلاً برای `personnel` یا `assets` خطای HTTP 500 بدهد و UI مجبور شود داده خالی/Default نشان دهد، Frontend اجازه ندارد آن State را روی Backend ذخیره کند. کاربر باید ابتدا Load موفق از Server داشته باشد.

## بکاپ
دکمه «تهیه بک آپ کامل» همه Moduleهای Live بالا را مستقیماً از API دریافت می‌کند. اگر هر Module Fail شود، بکاپ ناقص ساخته نمی‌شود. Seed عمداً در فایل پشتیبان قرار نمی‌گیرد.

## نکته Backend
این تغییر جلوی Overwrite از سمت Frontend را می‌گیرد، اما اگر خود Backend فایل JSON را خارج از این Frontend جایگزین/پاک کند یا Storage سمت سرور مشکل داشته باشد، نیاز به Backup/Versioning سمت Backend نیز وجود دارد.
