# Rayo Admin v9.4.1 — Stage 1: API & Data Migration

## هدف این مرحله
این نسخه فقط زیرساخت ذخیره‌سازی/بارگذاری و دیتای اولیه قیمت‌گذاری را اصلاح می‌کند تا توسعه‌های بعدی روی پایه پایدار انجام شوند.

## API معتبر
تنها این دو Endpoint استفاده می‌شوند:

- `GET  {API_ORIGIN}/api/v1.0/RayoData/Load?module=<module>`
- `POST {API_ORIGIN}/api/v1.0/RayoData/Save?module=<module>`

هیچ استفاده‌ای از `SplitCost/Load` یا `SplitCost/Save` در Runtime باقی نمانده است.

## فایل کانفیگ دامنه
فایل `js/app-config.js` تنها محل نگهداری دامنه است:

```js
window.RAYO_ENV = {
  API_ORIGIN: 'https://chat.yekzan.com',
  ...
}
```

در صورت تغییر دامنه فقط همین فایل باید اصلاح شود.

## ماژول‌های مستقل
| بخش | module در API |
|---|---|
| پرسنل، شیفت و حقوق فعلی | `personnel` |
| تأمین‌کنندگان | `suppliers` |
| قیمت تمام‌شده و رسپی | `pricing` |
| انبار و مغایرت | `inventory` |
| گزارش صندوق | `cashreport` |
| اموال و دارایی‌ها | `assets` |

کد قدیمی داخل Frontend هنوز برای سازگاری نام داخلی `hr` را استفاده می‌کند، اما Gateway آن را به `module=personnel` تبدیل می‌کند.

## قانون منبع داده
داده عملیاتی همیشه از `RayoData/Load` خوانده می‌شود. فایل‌های JSON روی هاست Runtime fallback نیستند.

پوشه `seed/` فقط برای راه‌اندازی یا Migration یک‌باره است. پس از اینکه اطلاعات با موفقیت داخل API ذخیره شدند، در Loadهای بعدی Seed خوانده نمی‌شود و حذف پوشه Seed باعث خطا نخواهد شد.

## Bootstrap یک‌باره
اگر ماژول API برای اولین بار خالی/ایجادنشده باشد، Gateway فایل Seed همان ماژول را یک‌بار می‌خواند، با `RayoData/Save?module=...` روی سرور ذخیره می‌کند و زمان Bootstrap را داخل `meta` ثبت می‌کند.

## Migration دیتای قیمت‌گذاری سپیدز
Seed قیمت‌گذاری از سه فایل زیر ساخته شده است:

- `Item.xlsx`
- `kham.xlsx`
- `Junction.xlsx`

Migration با شناسه زیر فقط یک‌بار اجرا می‌شود:

`pricing-sepids-master-1405-05-17-v1`

پس از اجرا این شناسه در `pricing.meta.appliedMigrations` ذخیره می‌شود و فایل Seed دیگر خوانده نمی‌شود.

## نکته مهم درباره قیمت‌ها
مبالغ سه فایل سپیدز ریال تشخیص داده شدند و هنگام ساخت Seed به تومان تبدیل شده‌اند (`÷ 10`). این تبدیل از تطابق بهای تمام‌شده Junction با قیمت مواد اولیه و ساختار قیمت‌های فعلی تأیید شده است.

## نکته مهاجرت پرسنل
Seed اولیه `personnel` از Snapshot فایل `initial-data.json` موجود در نسخه 9.3.1 ساخته شده است. اگر روی سرور اطلاعات پرسنلی جدیدتری از Snapshot دارید که هنوز به `RayoData?module=personnel` منتقل نشده، قبل از Bootstrap نهایی باید آخرین Export پرسنلی جایگزین Seed شود.

## فایل‌های Seed
- `seed/personnel-data.seed.json`
- `seed/suppliers-data.seed.json`
- `seed/pricing-data.seed.json`
- `seed/inventory-data.seed.json`
- `seed/cash-report-data.seed.json`
- `seed/assets-data.seed.json`

## تست سریع بعد از Deploy
در DevTools > Network باید درخواست‌ها فقط شبیه موارد زیر باشند:

- `RayoData/Load?module=personnel`
- `RayoData/Load?module=pricing`
- `RayoData/Save?module=inventory`

نباید هیچ Request به `SplitCost` یا فایل‌های `db/*.json` مشاهده شود.
