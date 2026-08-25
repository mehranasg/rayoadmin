# Rayo Admin v10.7.0 — Data Safety, Access, Backup & Sales Persistence

## تغییرات این نسخه

### حفاظت حیاتی از داده‌ها / Seed
- `loadOrBootstrap()` در اجرای عادی فقط از RayoData API می‌خواند و دیگر Seed را به‌صورت خودکار Bootstrap یا Merge نمی‌کند.
- Migration تاریخی Pricing مبتنی بر Seed غیرفعال شد و در Load عادی هیچ Write انجام نمی‌دهد.
- Migration اولیه Assets دیگر Seed را Merge یا Save نمی‌کند.
- Saveهای خودکار زمان نصب Patchهای قدیمی HR حذف شدند تا پس از Load ناموفق، `DEFAULT_DATA` روی سرور نوشته نشود.
- Schema/Ledger migration ماژول Inventory در Load فقط in-memory انجام می‌شود و خودکار روی سرور Save نمی‌شود.
- Gateway عمومی قبل از هر Save (به‌جز errorlog) بررسی می‌کند که همان Module در Session جاری با موفقیت از API زنده Load شده باشد. در غیر این صورت POST مسدود می‌شود.
- Seed فقط از عملیات صریح Reset مدیر مجاز است و Reset از `allowSeedWrite:true, allowUnconfirmedWrite:true` استفاده می‌کند.

### مدیریت دسترسی و رمز عبور
- ستون/نمایش «دسترسی‌های اضافه» از لیست مدیریت دسترسی‌ها حذف شد؛ دسترسی‌ها فقط داخل Modal ویرایش باقی مانده‌اند.
- مدیر می‌تواند رمز عبور کاربر را با آیکون استاندارد چشم مشاهده/پنهان کند.
- فرم ورود ادمین و فرم ورود پرسنل به‌جای کلید متنی «نمایش رمز»، آیکون چشم داخل فیلد دارند.

### بکاپ
- در تنظیمات پنل دکمه «تهیه بک آپ کامل» اضافه شد.
- بکاپ تمام Moduleهای زنده RayoData API را مستقیم از Backend می‌خواند و داخل ZIP قرار می‌دهد.
- Seed وارد بکاپ نمی‌شود.
- اگر حتی یک Module قابل دریافت نباشد، ZIP ناقص دانلود نمی‌شود.
- ZIP شامل `manifest.json`، `README.txt` و فایل JSON هر Module در پوشه `data/` است.

### گزارش صندوق / تحلیل فروش
- عنوان KPI به «میانگین رقم هر فاکتور (حدودی)» تغییر کرد.
- میانگین رقم هر فاکتور به سمت پایین تا نزدیک‌ترین ۱۰٬۰۰۰ تومان گرد می‌شود؛ مثال: ۲٬۶۵۴٬۲۳۴ → ۲٬۶۵۰٬۰۰۰ تومان.

### ماندگاری داده‌های Excel فروش
- داده Import شده تحلیل فروش در `cashreport.salesAnalytics` ذخیره می‌شود.
- Save هر دو مسیر Sales Analytics با `verify:true` انجام می‌شود.
- `salesAnalytics` رسماً به Schema/default ماژول `cashreport` اضافه شد.
- Backend Module جدید لازم نیست؛ همان `cashreport` استفاده می‌شود.

### Regression Guard انبار
- «انبار و کنترل مصرف» همچنان Sidebar زیرمنو ندارد.
- دقیقاً ۱۲ Tab ثابت Core حفظ شده است.
