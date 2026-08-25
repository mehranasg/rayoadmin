# مستند تحویل پروژه — Rayo Admin v10.10.0

## وضعیت نسخه

این نسخه بر پایه v10.9.3 ساخته شده و همه اصلاحات قبلی شامل ایمنی داده/Seed، مدیریت دسترسی، Backup، گزارش صندوق، شیفت پلن، قیمت‌گذاری، انبار و جریان سفارش تأمین‌کنندگان را حفظ می‌کند.

تغییر معماری اصلی v10.10.0، حذف دو فهرست موازی کالا و ایجاد یک کاتالوگ مرجع مشترک است.

## معماری ذخیره‌سازی

- Frontend: HTML/CSS/JavaScript بدون Build step
- Gateway: `RAYO_API_GATEWAY`
- Load عادی: فقط API → Browser
- Save: فقط پس از Load موفق همان Module در Session
- Seed: فقط مقداردهی اولیه یا Reset صریح مدیر
- هیچ Auto-save مبتنی بر Seed در Load عادی وجود ندارد

## ماژول‌های مرتبط با کاتالوگ

- `pricing.ingredients`: مرجع اصلی قلم
- `pricing.recipes`: اتصال آیتم منو به قلم‌های Recipe-capable
- `inventory.*`: گردش، شمارش، خرید، ارزش‌گذاری و کنترل مصرف با `ingredientId`
- `suppliers.supplierItems`: رابطه قلم مرجع با تأمین‌کننده
- `suppliers.purchaseRequests`: سفارش و پیگیری تحویل با `ingredientId`

## UX نهایی

### بهای تمام‌شده و قیمت‌گذاری

تب «کاتالوگ اقلام و مواد» محل تعریف و ویرایش همه اقلام است. نوع قلم تعیین می‌کند در کدام جریان‌ها قابل استفاده باشد.

### تأمین‌کنندگان

تأمین‌کنندگان فقط یک گزینه در Sidebar دارد و تمام بخش‌ها در Tabهای همان صفحه‌اند:

1. تأمین‌کنندگان
2. اقلام هر تأمین‌کننده
3. میز سفارش‌گذاری
4. سفارش‌های ثبت‌شده
5. حساب و بدهی‌ها
6. ثبت پرداخت
7. تنظیمات

فهرست مستقل اقلام و تب همگام‌سازی وجود ندارد.

### انبار

ساختار ۱۲ تب ثابت بدون تغییر حفظ شده است. همه انواع موجودی‌پذیر در انبار قابل کنترل‌اند و `NON_STOCK` وارد انبار نمی‌شود.

## مهاجرت داده زنده

مهاجرت از تنظیمات تأمین‌کنندگان، صریح و یک‌باره است. جزئیات در `MIGRATION_GUIDE_v10_10_0.md` آمده است. برای داده موجود ورود مجدد لازم نیست.

## تغییر JSON

Module جدید لازم نیست. فیلدهای جدید به دو JSON فعلی اضافه می‌شوند:

- `pricing.ingredients[].itemType`
- `pricing.ingredients[].recipeCapable`
- `pricing.ingredients[].inventoryTracked`
- `pricing.ingredients[].procurementEnabled`
- `suppliers.supplierItems[].ingredientId`
- Snapshotهای نام/کد در رابطه تأمین
- Metadata مهاجرت در `pricing.meta` و `suppliers.meta`

## فایل‌های اصلی نسخه

- `js/43-central-catalog-v10-10.js`
- `css/07-central-catalog-v10-10.css`
- `seed/pricing-data.seed.json`
- `seed/suppliers-data.seed.json`
- `qa_v10_10_0.js`

## ادامه توسعه

برای افزودن قابلیت جدید به قلم، فیلد را به رکورد `pricing.ingredients` اضافه کنید و از ایجاد Item master جدید در Suppliers یا Inventory خودداری کنید. همه Joinها باید بر اساس `ingredientId` انجام شوند؛ Code فقط برای نمایش، Import و Snapshot سازگاری است.

