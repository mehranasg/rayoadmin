# بازسازی و مهاجرت — چهار مسیر مستقل

مبنای وضعیت فعلی: [مرجع فنی](CURRENT_IMPLEMENTATION.md) و [قرارداد داده](DATA_AND_API_REFERENCE.md)، `main` پس از `1c31f0f` (2026-10-05). **تمام معماری، نام جدول، route و endpoint هدف در این سند `Planned` است** مگر جایی که صریحاً به فایل جاری ارجاع داده شود. React، Backend تازه، دیتابیس یا migration اجرایی در مخزن وجود ندارد.

## پیش‌شرط مشترک و تصمیم‌های ثبت‌شده

تصمیم‌های لازم‌الاجرا از درخواست/قواعد جاری: کاتالوگ واحد `pricing.ingredients`، استقلال category/itemType، تک‌انبار و ۱۰ تب انبار، حفظ ID/کد سپیدز، حفظ snapshot تاریخی، Load بدون Seed/Save خودکار، و عملیات مخرب فقط با Backup/Preview/Rollback. بازسازی برای رفع محدودیت‌ها مجوز تکرار حذف فیزیکی Legacy نیست.

### دفتر تصمیم‌ها

| تاریخ | تصمیم | دلیل | اثر داده / بازگشت |
|---|---|---|---|
| 2026-09-30 | حذف تب‌های «خروج از انبار» و «مغایرت دوره‌ای»؛ ۷ تب ثابت | درخواست مالک؛ یک انبار فیزیکی | رکوردهای انتقال قدیمی حفظ؛ revert کد |
| 2026-10-04 | نسخهٔ `rayocafe.ir/panel4` (شاخهٔ خارج از Git روی همان سرور داده) در `main` ادغام شد؛ از این تاریخ فقط `main` مبنای توسعه است | جلوگیری از دو نسخهٔ موازی | هر دو نسخه یک API/داده دارند (`js/app-config.js`)؛ هر انتشار باید از `main` باشد |
| 2026-10-04 | هاب «تنظیمات نرم‌افزار» (48) پیش‌فرض صفحهٔ تنظیمات؛ منوی «تنظیمات» و تب تنظیمات قیمت‌گذاری به آن می‌روند | تجمیع تنظیمات پراکنده بدون منبع دادهٔ دوم | فقط UI؛ ذخیره با ماژول مالک |
| 2026-10-05 | از panel نگه داشته شد: داشبورد، گزارش صندوق، پنل پرسنل، اموال، کنترل نوشیدنی، ورود چندسطری انبار، ورود CSV چک‌لیست | انتخاب مالک | — |
| 2026-10-05 | از panel4 آمد: مرتب‌سازی/فیلتر موجودی، ویرایش ورود با ابطال، سطح کنترل اقلام، شمارش هفتگی، صفرگذاری، بازنشانی شمارش، Ledger قلم، کارت ارزش و ۵ مغایرت، فاکتور سریع (+ داشبورد)، پیش‌بینی هزینهٔ ماه، پیش‌بینی/ویزارد پرسنل، رفع وسایل تحویلی، نمایش بها با پرت واقعی | انتخاب مالک | فیلدهای افزایشی (مرجع داده)؛ revert commit |
| 2026-10-05 | پیش‌فرض سطح کنترل «سبک» (قلم بدون سطح از آخرین شمارش خودش ادامه می‌دهد)، نه «دقیق» | panel4 نبودن سطح را «دقیق» می‌خواند و موجودی اقلامِ نیامده در آخرین شمارش را ناگهان «نامشخص» می‌کرد | سطح‌ها صریح ذخیره می‌شوند تا هر دو خوانش یکسان باشند |
| 2026-10-05 | تک‌انبار اجباری (`unifiedMode() = true`)؛ انتخاب حالت و مدیریت محل‌ها از UI برداشته شد | درخواست مالک؛ دادهٔ زنده پیش‌تر `unified` با یک محل و ۹۴ شمارش کل بود | بدون تغییر عدد موجودی؛ داده و توابع حفظ |
| 2026-10-05 | شمارش کل با یک ذخیرهٔ واحد ماند (ذخیرهٔ ردیف‌به‌ردیف panel4 آورده نشد) | دو گردش کار شمارش برای یک تاریخ تداخل دارند | با تصمیم 2026-10-13 جایگزین شد |
| 2026-10-05 | ورود اعداد: کلیک روی فیلد مبلغ آن را خالی می‌کند؛ ترک بدون تایپ مقدار را برمی‌گرداند | درخواست مالک: بدون Backspace، بدون پرش، ارقام فارسی سه‌رقمی | فقط UI |
| 2026-10-05 | داشبورد فقط دو کارت انبار (ارزش و ۵ مغایرت) را نشان می‌دهد | درخواست مالک؛ کارت‌های قدیمی ضایعات محاسبهٔ سنگین داشتند | فقط UI |
| 2026-10-06 | تب تنظیمات صفحه‌های تأمین، مالی و اموال (و مسیرهای مستقیم قدیمی) به بخش مربوط در هاب تنظیمات نرم‌افزار می‌رود | یک محل برای هر تنظیم | فقط UI؛ همان کارت و ذخیره |
| 2026-10-06 | پنل پرسنل گزینه و مجوز «انتقال موجودی» را نشان نمی‌دهد؛ صفحهٔ انتقال فقط پیام تک‌انبار دارد | تک‌انبار | کلید مجوز در داده حفظ شد؛ revert کد |
| 2026-10-06 | QAهای نسخه‌ای `qa_v10_*` نگه داشته شدند؛ بررسی‌های رفتار منسوخ با دلیل SKIP می‌شوند | حفظ پوشش Gateway/ایمنی بدون انتظار متناقض | — |
| 2026-10-06 | `docs/index.html` نمایشگر مستندات؛ `.claude/` از Git خارج شد | دسترسی ساده به مستندات؛ فایل ابزار محلی | — |
| 2026-10-13 | شمارش کل در چند نوبت در همان سند تاریخ + نوع مبنا ادغام می‌شود؛ شمارش با تاریخ عقب‌تر یا جایگزینی مقدار فقط هشدار می‌گیرد و مغایرت شمارش‌های بعدی خودکار بازمحاسبه می‌شود؛ شمارش کل قابل ابطال است؛ «شروع دوباره از تاریخ» سوابق انبار قبل از تاریخ و قیمت خرید قبل از آن را باطل/صفر می‌کند | درخواست مالک: شروع انبار از ۱۴۰۵/۰۶/۰۱، ورود موجودی در چند روز و از چند محل، ترتیب آزاد ثبت؛ نرم‌افزار داخلی است و برای موارد غیراصولی هشدار کافی است | افزایشی، بدون migration در Load؛ شروع دوباره فقط با پیش‌نمایش، دو فایل پشتیبان، تأیید مدیر و rollback از changeLog (`INVENTORY_START_FROM_DATE` و `PRICES_RESET_FOR_INVENTORY_START`)؛ فاکتور خرید، پرداخت و فهرست مواد دست نمی‌خورد |
| 2026-10-11 | کنترل روزانه نوشیدنی به «کنترل روزانه فروش نوشابه» با مدل `bev-v2` تغییر کرد: شمارش عصر و شماره برگه از فرم حذف شد؛ ورودی، فروش و خروج غیرفروش روزانه؛ مغایرت روز مثبت = کسری؛ مغایرت شبانه روی روز صبح؛ خالی هرگز صفر نیست؛ فرم موبایل یک‌نوشیدنی؛ پرسنل بدون انتخاب نام و با هویت حساب برای هر مرحله | درخواست مالک | افزایشی و بدون migration: فیلدهای قدیمی (evening، inMorning/inEvening، sheetNumber، notes) حفظ و فقط خوانده می‌شوند؛ روزهای قدیمی با جریان خالی اکنون «ناقص» نمایش داده می‌شوند؛ rollback = revert commit |
| 2026-10-14 | کنترل نوشابه: انتخاب شمارندهٔ صبح، شمارندهٔ شب و انباردار (`roles` روی رکورد تاریخ)؛ فروش آخرین ورودی و علت‌ها در ردیف جدا؛ مغایرت شبانه = صبح − تحویل انباردار شب قبل؛ گزارش روز/شب جدا و تجمیعی، نمودار و خلاصهٔ ماهانه؛ فهرست عمودی نوشیدنی برای موبایل؛ کاشی «کنترل نوشیدنی» از داشبورد حذف شد. انعام: سهم گروه دقیق و فقط جمع ماهانهٔ هر نفر به پایینِ ۵۰۰۰ گرد می‌شود. داشبورد «ثبت جریمه» (مودال با جست‌وجو و ذخیره و ادامه)؛ «ثبت تخلفات پرسنلی» در زیرمنوی پرسنل و دکمهٔ ثبت در پروفایل | درخواست مالک؛ گرد کردن روی جمع ماهانه تا ضرر گردکردن هر گروه به پرسنل نرسد | افزایشی، بدون migration در Load: `roles` اختیاری است و `counters` قدیمی فقط نمایش داده می‌شود؛ `shareRoundingStep` گروه‌های موجود حفظ ولی برای سهم استفاده نمی‌شود مگر سهم به تسویه لینک باشد (`entitlementToman`)؛ rollback = revert commit |
| 2026-10-24 | تب دهم انبار «مدیریت مصرف» (فقط‌خواندنی) بین «نیازمند سفارش» و «گزارش‌ها»: مصرف واقعی فقط از شمارش فیزیکی ابتدا/پایان (بدون شمارش پایان = داده ناکافی؛ ابتدای سیستمی = تخمینی)، پرتی ثبت‌شده جدا از مغایرت، مازاد از زیان کم نمی‌شود، اتلاف بدون ارتباط مستقیم با برچسب «تخصیص تخمینی بر اساس مصرف تئوریک رسپی» به آیتم منو می‌رسد؛ آستانه‌های پیش‌فرض (پرتی ۳/۵٪، مغایرت ۲/۵٪، بدون رسپی ۱۵/۲۵٪ بالای میانه، اتلاف از فروش = هدف بهای مواد ۳۵٪ × جمع حدها) قابل تنظیم و اختصاصی کالا/گروه؛ دسترسی = انبارداری + گزارش‌های مدیریتی | درخواست مالک: گزارش مدیریتی مصرف، پرتی، مغایرت و اثر مالی؛ آستانه‌ها پیش‌فرض عملیاتی‌اند نه استاندارد جهانی | افزایشی و بدون migration: فقط کلید اختیاری `inventory.settings.consumptionAlerts` با Save صریح (Load تازه، بازخوانی و `CONSUMPTION_ALERTS_CHANGED`)؛ Backend DTO و API تغییری ندارد؛ rollback = revert commit (کلید ذخیره‌شده بی‌اثر می‌ماند) |
| 2026-10-17 | گزارش صندوق با سپیدز هم‌تراز شد: فیلدهای «مالیات سپیدز» و «بدهکار سپیدز»؛ کل فروش = خالص دریافتی − مالیات + بدهکار − کرایه + اسنپ (بدون مالیات) و هشدار آماری با همین فروش مقایسه می‌شود؛ فرمول مغایرت صندوق تغییر نکرد | خالص دریافتی سپیدز مالیات دارد و فروش مشترکین بدهکار را ندارد؛ بدهکار بعداً توسط مدیر/پرسنل تسویه می‌شود؛ فروش سالن/مشترکین در پرینت بدون مالیات است؛ اسنپ جدا از سپیدز است | افزایشی، بدون migration: گزارش قدیمی بدون این دو فیلد همان کل فروش قبلی را دارد (در تحلیل فروش صفحهٔ گزارش‌ها کرایه هم اکنون کسر می‌شود)؛ `finalVariance` تغییر نمی‌کند؛ rollback = revert commit |
| 2026-10-18 | ثبت/ویرایش تخلف کاری فقط با تاریخ ماه جاری؛ پروفایل پرسنلی دکمهٔ ثبت تخلف ندارد | درخواست مالک: تخلف با جریمه در ماه گذشته/آینده وضعیت مالی بسته‌شده یا پیش‌بینی را بهم می‌زند | فقط UI/اعتبارسنجی؛ رکوردهای قبلی تغییر نمی‌کنند؛ revert کد |
| 2026-10-18 | وضعیت انعام در فهرست از دفتر تسویه (`payments.tipAllocations`) محاسبه می‌شود نه از `tipGroups.status` ذخیره‌شده؛ با فیلتر پرسنل، وضعیت سهم همان نفر | وضعیت ذخیره‌شدهٔ گروه با پرداخت تک‌نفره «تسویه جزئی» می‌ماند و با پرداخت‌ها هم‌خوان نبود | فقط نمایش؛ دادهٔ ذخیره‌شده تغییر نمی‌کند؛ revert کد |
| 2026-10-18 | «کنترل روزانه نوشیدنی» از زیرتب انبارگردانی به تب هشتم انبار منتقل شد | درخواست مالک | فقط UI؛ لینک قدیمی هدایت می‌شود؛ revert کد |
| 2026-10-18 | پرتی ظروف و تجهیزات به‌صورت رخداد اموال ثبت می‌شود و فرم پرتی می‌تواند جریمهٔ تأییدشده با تاریخ اعمال جدا بسازد | ظروف در اموال تعریف شده‌اند نه کاتالوگ انبار؛ پرتی آخر ماه ممکن است در حقوق ماه بعد کسر شود | رکورد جدید افزودنی (`assetIncidents`، `penaltiesRewards` با `source:'waste'`)؛ بدون مایگریشن؛ revert کد |
| 2026-10-18 | نوشیدنی شرکتی با پرچم `menuItems.labelPriceOnly` (و نام‌های رایج در نبود پرچم) از سقف درصد و پیشنهاد تغییر قیمت مستثنی است | فقط با قیمت درج‌شده روی کالا فروخته می‌شود | فیلد افزودنی؛ بدون مایگریشن |
| 2026-10-18 | چک‌لیست سکشنی بدون پوزیشن به همهٔ نفرات همان سکشن در آن شیفت داده می‌شود؛ افزودن فرد مشخص فقط برای چک‌لیست‌های قدیمی | چک‌لیست نباید به فرد وابسته باشد | فقط منطق نمایش؛ داده تغییر نمی‌کند |
| 2026-10-19 | گزارش صندوق: پیش‌فرض ۳ کارتخوان و افزودن تا ۶؛ واحد ریال یک‌بار بالای فرم؛ عنوان کوتاه در موبایل | درخواست مالک | فقط UI؛ فیلدهای pos1…pos6 ثابت؛ بیش از ۶ کارتخوان تغییر ساختار داده می‌خواهد |
| 2026-10-19 | زیربخش‌های «تنظیمات نرم‌افزار» به‌جای فهرست کشویی با تب نمایش داده می‌شوند | یکسانی با تب‌های سایر بخش‌ها (درخواست مالک) | فقط UI |
| 2026-10-21 | همهٔ نوارهای تب بالای صفحه یک ظاهر دارند (مرجع: تب‌های قیمت‌گذاری و انبار؛ گوشهٔ ۱۰px) | درخواست مالک: یکسانی در کل سیستم | فقط CSS (انتهای css/style.css) |
| 2026-10-21 | طرف حساب بدهی/طلب عمومی می‌تواند پرسنل فعال (`partySource: hr`) یا طرف عمومی جدید باشد؛ تأمین‌کننده فقط برای نمایش سوابق قدیمی؛ دسته‌بندی الزامی | بدهی/طلب بین افراد خود مجموعه یا موردی | منبع hr از قبل در partyName پشتیبانی می‌شد؛ بدون مایگریشن |
| 2026-10-21 | ریز گردش کارت و نقد اشخاص از جدید به قدیم، با فیلتر سریع شخص/حساب، بدون ستون «مرجع»؛ ردیف گزارش صندوق کلید «گزارش روز» دارد | درخواست مالک | فقط UI؛ ترتیب CSV و محاسبه تغییر نکرد |
| 2026-10-21 | کاربران پنل مدیریت با دسترسی بخش‌به‌بخش (`hr.settings.adminUsers`)؛ ورودهای ثابت قبلی مالک با دسترسی کامل می‌مانند | درخواست مالک: تعریف کاربر ادمین با دسترسی‌های مختلف | فیلد افزودنی بدون مایگریشن؛ Rollback = غیرفعال‌کردن کاربر؛ امنیت واقعی نیازمند مجوز سروری است |
| 2026-10-21 | انبار تب نهم «گزارش‌ها» گرفت (پرتی/ضایعات، مغایرت، ورود، گردش تجمیعی با خروجی AI) | درخواست صریح مالک برای گزارش تجمیعی ضایعات به تفکیک قلم و خروجی برای تحلیل AI | فقط UI و خواندنی |
| 2026-10-21 | پنل مانیتورینگ مدیر (`index.html?view=monitor`، فایل 49) | درخواست مالک برای دیدن وضعیت رستوران در یک نگاه | فقط خواندنی؛ سود/زیان از محاسبهٔ امور مالی |
| 2026-10-21 | پنل پرسنل با فونت Vazirmatn (`css/vazirmatn/`) و پوستهٔ مینیمال؛ بازطراحی ظاهری کل برنامه (گوشه، سایه، فوکوس، تب زیر عنوان در همهٔ بخش‌ها) | درخواست مالک | فقط CSS/جای تب؛ صفحات مدیریت همچنان IRANSansX |
| 2026-10-21 | تراز زندهٔ صندوق کنار عنوان فرم، لودر دکمهٔ ثبت، نوار دوره در خلاصهٔ صندوق؛ تشخیص مبلغ برای «کارتخوان» و حفظ فوکوس سراسری در جست‌وجوها | درخواست مالک | فقط UI؛ داده و محاسبه تغییر نکرد |
| 2026-10-21 | پنل پرسنل: «شمارش نوشیدنی‌ها» بعد از گزارش صندوق؛ پرسنل شمارنده را انتخاب نمی‌کند و نقش صبح/شب از ثبت‌کنندهٔ همان مرحله پر می‌شود | فرد با گوشی خودش وارد می‌شود و هویتش معلوم است (درخواست مالک) | فقط منطق فرم؛ `roles` همان ساختار قبلی |
| 2026-10-21 | فاکتور خرید پرسنل می‌تواند فروشندهٔ خارج از فهرست داشته باشد | خرید موردی از فروشندهٔ تعریف‌نشده | فیلدهای افزودنی `sellerOutsideList/sellerName/sellerPhone` با `supplierId` خالی (همان الگوی فاکتور سریع بدون تأمین‌کننده)؛ بدون مایگریشن |
| 2026-10-21 | صفحهٔ انتقال موجودی پرسنل حذف شد (فقط هدایت لینک قدیمی) و همهٔ بخش‌های مجاز منو در داشبورد پرسنل کاشی دارند | تک‌انبار؛ درخواست مالک | فقط UI |
| 2026-10-22 | ترتیب ثبت شمارش، ورود، فروش و پرتی مهم نیست: هر ذخیرهٔ انبار مغایرت شمارش‌های قدیمی‌شده را خودکار بازمحاسبه می‌کند و شمارش تأییدشده دیگر مانع ابطال/ویرایش ورود نیست؛ «دفتر همهٔ ثبت‌ها» زیرتب پیش‌فرض گزارش‌های انبار شد (تب جدید اضافه نشد) | درخواست مالک: ثبت ساده، یک جا برای دیدن و اصلاح همهٔ ثبت‌ها، مغایرت درست بدون توجه به ترتیب؛ ورودهای اشتباه هم‌تاریخ افتتاحیه قابل ابطال نبودند | بدون تغییر ساختار؛ فیلد افزودنی `stocktakes[].varianceCheckedAt`؛ مقدار قبلی مغایرت در `varianceRecalcHistory` می‌ماند. بازگشت: حذف فراخوانی `installVarianceRefresh()` در 32 |
| 2026-10-22 | ابطال/ویرایش/آرشیو ورود به انبار بدون دانلود پشتیبان و تیک تأیید هر مورد؛ به‌جای آن دسترسی `inventoryEdit` در کاربران مدیریت، پشتیبان خودکار رکورد پیشین در `inventory.changeLog[].before` و «بازگردانی ابطال» | درخواست مالک: ثبت و اصلاح ساده، کنترل با تعریف دسترسی؛ ابطال حذف فیزیکی نیست و با رکورد حفظ‌شده و بازگردانی، شرط پشتیبان/پیش‌نمایش/بازگشت برقرار می‌ماند | فیلدهای افزودنی `statusBeforeVoid`، `voidKind`، `voidHistory[]`؛ کاربران تعریف‌شدهٔ بدون «دسترسی کامل» تا گرفتن این دسترسی فقط مشاهده می‌کنند. بازگشت: برگرداندن `receiptManager` به بررسی نشست |
| 2026-10-27 | پرسنل غیرفعال تا یک ماه پس از `employmentEndDate` در فرم‌های ثبت حقوق و سوابق قابل انتخاب است؛ لیست‌های پرسنل انتخاب ستون و خروجی Excel دارند | درخواست مالک: جریمه، کارکرد و پرداخت فرد ترک‌کار اغلب پس از خروج ثبت می‌شود؛ ستون‌های غیرضروری لیست پنهان شوند | بدون تغییر ساختار JSON (فیلد موجود `employmentEndDate`)؛ ترجیح ستون‌ها فقط در localStorage؛ revert کد |
| 2026-10-28 | حضور و غیاب مبتنی بر تردد در ماژول جدای `attendance` (فایل `attendance-data.json`)، نه داخل سند `hr`؛ «ریز کارکرد» و «درخواست اصلاح کارکرد» قدیمی فعلاً کنار آن می‌مانند | درخواست مالک: حجم پانچ‌ها (هزاران در ماه) Save سند پرسنل را سنگین نکند؛ جایگزینی/اتصال به حقوق در فاز ۳ یا ۴ تصمیم‌گیری می‌شود | سند جدید؛ hr فقط `personnel[].attendanceCode` می‌گیرد. بازگشت: حذف اسکریپت‌های 50/51 و ثبت ماژول از config؛ فایل داده دست نمی‌خورد |
| 2026-10-29 | «ذخیره»ی ماه در کارکرد ماهانهٔ حضور و غیاب نتیجهٔ ماه را همراه تنظیماتِ محاسبه snapshot می‌کند (`monthSaves`)؛ ماه ذخیره‌شده با همان تنظیمات می‌ماند مگر مدیر صریحاً با تنظیمات فعلی دوباره ذخیره کند | انتخاب مالک بین snapshot ماه و تاریخ اجرای تنظیمات: تغییر قوانین نباید ماه‌های گذشته را عوض کند | آرایهٔ جدید `monthSaves`؛ نسخهٔ قبلی superseded می‌شود و حذف نمی‌شود. بازگشت: حذف آرایه و برگشت به محاسبهٔ زنده |
| 2026-10-22 | فرم شمارش کل انتخاب «نوع مبنا» ندارد: تاریخ دارای افتتاحیه یا اولین شمارش سیستم افتتاحیه ابتدای روز، بقیه پایان روز | درخواست مالک: سادگی ثبت؛ انتخاب اشتباه نوع مبنا موجودی و مغایرت را جابه‌جا می‌کرد | بدون تغییر داده؛ اسناد موجود همان نوع خود را دارند. شمارش پایان‌روز روی تاریخی که افتتاحیه دارد دیگر ثبت نمی‌شود (روز بعد را بزنید). بازگشت: برگرداندن فیلد انتخاب |

ترتیب ورود داده: مراجع واحد/دسته/محل و پرسنل→کاتالوگ/منو→تأمین و رابطه→نسخهٔ رسپی و قیمت→خرید/پرداخت→دفتر/شمارش/فروش→صندوق/مالی/حقوق→اموال/ممیزی/نظرسنجی. هویت کاربری و مجوز پیش از فعال‌شدن write عمومی آماده شوند. دادهٔ زنده در مخزن نیست؛ نمونه‌های واقعیِ مجاز برای شکل‌های خالی/متفاوت باید در Stage استخراج و حساسیت‌زدایی شوند.

## مسیر A — بازسازی از ابتدا

هدف، بازسازی قرارداد محصول است، نه بازتولید ۴۸ patch. [مشخصات محصول](PROJECT_MASTER_SPEC.md) جریان‌ها و پذیرش حوزه‌ها، ماتریس وضعیت دامنهٔ موجود و مرجع داده نام/معنای فیلدها را می‌دهند. پیاده‌سازی قدیمی فقط برای استخراج جزئیات و golden case استفاده شود؛ code path ناامن به الزام محصول تبدیل نشود.

| مرحله | خروجی نسخهٔ اول | وابستگی | معیار خروج |
|---|---|---|---|
| A0 | مرز محیط، auth، مجوز، backup/restore، ثبت خطا و قرارداد خطا | تصمیم مالک دربارهٔ نقش و محیط | حساب بدون مجوز از API رد شود؛ restore ساختگی آزموده شود |
| A1 | کاتالوگ، واحد/دسته، محل و پرسنل پایه | A0 | ID/code پایدار، inactive و unknown fields/LegacyId محفوظ |
| A2 | منو، نسخهٔ رسپی، افت، قیمت و گزارش هزینه | A1 | مثال افت، واحد نامعتبر، نسخهٔ تاریخ‌دار و قیمت دستی پاس |
| A3 | تأمین‌کننده، خرید/پرداخت (فاکتور تفصیلی و سریع)، ورود به انبار | A1–A2 | فاکتور موجودی نسازد؛ رسید یک اثر؛ هزینه سازگار |
| A4 | فروش، ضایعات، شمارش، سطح کنترل، دوره و مغایرت | A2–A3 | baseline تأییدشده، عدم دوباره‌شماری، snapshot دوره، تک‌انبار |
| A5 | صندوق، وجوه، تعهدات و گزارش مالی | A0–A4 | ریال/تومان، مالک تاریخی، ابطال، مانده و هزینه بدون تکرار |
| A6 | شیفت/حقوق/انعام، پنل پرسنل، آموزش | A1، auth | قرارداد ثابت/ساعتی، تسویه سهم، تأیید مرخصی و visibility صحیح |
| A7 | ممیزی، اموال، نظرسنجی، گزارش تکمیلی/forecast | دادهٔ حوزه‌های مربوط | import تکراری، دارایی تجمیعی، forecast ناقص و مجوز PII آزموده شوند |

MVP عملیاتی برای پایلوت می‌تواند A0 تا A5 باشد، اما **هم‌ارزی کامل محصول** تا تکمیل A6/A7 و نیازهای واقعی کاربران ادعا نشود. برای هر زیرماژول، سناریوی عادی، Empty، خطا، دوبارکلیک، قطع ارتباط، conflict، رکورد غیرفعال و سابقهٔ قدیمی تعریف شود.

تکرار نشود: mirror مستقل اقلام، ذخیرهٔ سند صفحه‌ای، fallback به Seed، رمز در JSON عمومی، حذف سابقه، قیمت/واحد حدسی، ساخت تاریخچهٔ گمشده، تغییر محاسبهٔ دورهٔ بسته، و وابستگی رفتار به ترتیب override. نوع بانک/حسابداری و قواعد حقوقی بدون تصمیم صاحب محصول اضافه نشود.

## مسیر B — ادامه توسعهٔ همین نسخه

1. `AGENTS.md` و [شروع AI](AI_START_HERE.md)، سپس فقط سند و فایل مربوط. از `git status` و HTML/loader شروع کنید؛ latest filename به‌تنهایی مالک اجرا نیست.
2. رفتار موردنظر و شاهد اختلاف را ثبت کنید. اثر JSON، DTO، migration و دادهٔ زنده را مشخص کنید؛ اگر صرفاً UI است صریح بنویسید.
3. مالک فعلی را تغییر دهید. patch تازه فقط وقتی اصلاح همان مالک ایمن نیست. شمارهٔ محصول برای کار ناقص تغییر نکند.
4. فیلد اختیاری با خواندن backward-compatible و نوشتن صریح اضافه شود؛ unknown fields و ID محفوظ. field absent، null، صفر و false را یکسان نکنید.
5. syntax و QA همان حوزه، Gateway و startup را اجرا کنید؛ تست دستی با fixture، Save/Load، شبکهٔ ناموفق و عدم Seed/Save در Load انجام شود.
6. diff و لینک‌های مستندات را بررسی، نتیجه و limitation را ثبت و commit کوچک بسازید. rollback کد، revert همان commit؛ rollback داده فقط با طرح مستقل و مقایسهٔ ثبت‌های جدیدتر.

### backlog حاصل از سورس فعلی

| اولویت | مسئله | اقدام/پذیرش مستقل |
|---|---|---|
| P0 | CUR-01/02: Save بدون version و snapshot ناقص | جداسازی full-document/collection state، version اجباری برای write، دو نویسنده→409 بدون Lost Update |
| P0 | CUR-03/04: حذف صندوق و entries عادی | حذف override مخرب، archive/reversal با audit و حفظ تاریخچه؛ QA روی آخرین تابع نصب‌شده |
| P0 | CUR-05: auth/permission Client | قرارداد هویت سروری و آزمون URL/API مستقیم بدون مجوز |
| P1 | CUR-06: چند Save و metadata جدا | ابتدا hardening کنترل نسخه/backup؛ سپس transaction DB و idempotency پایدار |
| P1 | CUR-07/08: validation و Error/Empty | schema بدون حذف unknown، رد نوع نادرست، نمایش read-only در شکست |
| P1 | CUR-09: errorlog | scrub اطلاعات حساس، retention، rate limit و audit سروری |
| P1 | تاریخچه/واحد/هزینه | نمونهٔ دادهٔ مجاز، ثبت uncertainty، عدم backfill حدسی |
| P2 | QA نسخه‌ای و وابستگی مرورگر | runner جاری با گزارش explicit legacy failures؛ fixture مستقل و E2E |
| P2 | فونت/CDN/markers/patchها | بستهٔ دارایی مجاز و reproducible؛ کاهش override مرحله‌ای |
| P2 | CUR-13: ماژول sepidsaudit روی سرور ساخته نشده | Initialize صریح مدیر از «مدیریت اطلاعات و بکاپ» در صورت نیاز به ممیزی |
| P2 | QA بدون پوشش: هاب تنظیمات، پیش‌بینی هزینه، صفرگذاری/بازنشانی/شمارش هفتگی، ویرایش ورود | QA VM مستقل |

این backlog دستور اجرای خودکار migration یا تغییر Runtime در تسک مستندات نیست.

## مسیر C — مهاجرت Frontend به React

### انتخاب و مرزبندی پیشنهادی

React + TypeScript با build مستقل، routeهای صریح و مهاجرت یک صفحه در هر مرحله پیشنهاد می‌شود. امکان اضافه‌کردن تدریجی React به پروژهٔ موجود در [راهنمای رسمی React](https://react.dev/learn/add-react-to-an-existing-project) پشتیبانی شده است. برای رایو، جداسازی route جدید از صفحهٔ classic از دست‌کاری مشترک یک DOM ساده‌تر است؛ این انتخاب طراحی پروژه است.

ساختار **پیشنهادی، هنوز ناموجود**:

```text
apps/web/src/
  app/             # router, session, providers, shell
  features/        # catalog, menu, inventory, cash, hr, finance, ...
  shared/          # rtl controls, dates, amounts, errors
  data/            # legacy gateway adapter, typed contracts
  domain/          # pure costing, units, payroll, variance
tests/             # contract, integration, e2e, migration fixtures
```

server state در TanStack Query و state فرم/فیلتر در component یا URL نگهداری شود؛ کپی همزمان تمام JSONها در store عمومی توصیه نمی‌شود. Query برای fetch/cache/synchronization سرور طراحی شده است؛ [مرجع رسمی](https://tanstack.com/query/latest/docs/framework/react/overview). context فقط session، theme و تنظیمات کم‌تغییر؛ افزودن store دیگر نیازمند مسئلهٔ مشخص است.

adapter قدیمی باید `{data, version, completeness, source}` را در مدل داخلی تفکیک کند؛ این wrapper پیشنهادی است، فیلد موجود API نیست. `saveFullDocument` فقط full snapshot معتبر بپذیرد و Mutate فقط record draft و version. parsing envelope، alias hr/personnel، unknown fields، خطا و currency داخل adapter باشند. conflict به UI برسد؛ retry خودکار برای write مالی/انبار یا version conflict خاموش باشد. requestId retry همان عملیات ثابت بماند.

فرم‌ها schema مشترک typed، خطای field-level فارسی، dirty state، کنترل دوبارکلیک و حفظ draft پس از خطا داشته باشند. فرم چندخطی و autocomplete با stable key/ID ساخته شود؛ input مبلغ/اعشار با هر keystroke format مخرب نشود. validation Client برای تجربهٔ کاربری است و Server دوباره آن را enforce می‌کند. انتخاب کتابخانه فرم/validation و pin نسخه در شروع implementation انجام شود؛ این سند نسخهٔ نصب‌شده ادعا نمی‌کند.

Design System کوچک: Button، Text/Number/MoneyField، JalaliDateField، SearchPicker، Modal، DataTable، StatusBadge، Empty/Error/Loading، PermissionBoundary و PrintLayout. tokens رنگ/فاصلهٔ موجود، IRANSansX مجاز، RTL و focus/keyboard حفظ شوند. تاریخ در domain از متن نمایش جدا شود؛ accessibility و نمایش ۳۶۰px/دسکتاپ و چاپ A4 معیار پذیرش باشند.

### نگاشت صفحه به route/component پیشنهادی

| صفحهٔ موجود | route پیشنهادی | component/feature پیشنهادی |
|---|---|---|
| index.html | `/app/dashboard` | AdminShell, Dashboard |
| base-data.html | `/app/catalog` | CatalogPage, ItemEditor |
| menu-management.html | `/app/menu/:tab` | MenuPage, RecipeEditor, RecipeVersions |
| pricing.html | `/app/pricing/:tab` | PricingSummary, PriceHistory |
| inventory.html | `/app/inventory/:tab` | InventoryPage و همان ۹ tab |
| suppliers.html | `/app/suppliers/:tab` | SupplierList, Relations, Accounts |
| cash-report-admin.html | `/app/cash/:tab` | CashReports, Destinations, CustodyLedger |
| cash-report.html | `/cash/entry` | CashEntry با هویت سروری مناسب |
| sales-analysis.html | `/app/sales` | SalesAnalytics |
| sepids-audit.html | `/app/sales/audit` | ImportPreview, AuditInbox |
| personnel.html?view=... | `/app/hr/:view` | Personnel, Shifts, Payroll, Tips |
| finance.html?view=... | `/app/finance/:view` | Obligations, Checks, MonthlyPL |
| reports.html | `/app/reports/:tab` | ReadOnlyReports |
| assets.html / survey.html | `/app/assets` / `/app/survey` | Assets / Survey |
| settings.html | `/app/settings/:view` | Settings, Backup, ExplicitDataOperations |
| personel/*.html، staff-login/panel | `/staff/:view`، `/login` | StaffShell و فرم‌های مجاز |

### هم‌زیستی و خروج مرحله‌ای

1. shell + adapter + حالت خواندنی کاتالوگ: old URL و new URL روی یک منبع معتبر؛ parity فیلتر/عدد/RTL با fixture. خروج: هیچ write ناخواسته و هیچ تفاوت شمارش/شناسه.
2. ویرایش کاتالوگ/منو/قیمت: ابتدا version و auth Backend روشن شود؛ یک نویسنده برای هر slice، flag مسیر. خروج: Save/refresh و تاریخچه/unknown fields و خطا پاس.
3. تأمین و انبار: مهاجرت فرم و محاسبات pure با golden data؛ خروج: receipt/count/variance/سطح کنترل و دورهٔ بسته برابر، no duplicate (انتقال قدیمی فقط خواندنی).
4. صندوق/مالی/سپیدز: query pagination، idempotency و archive؛ خروج: مانده، ریال/تومان، review و permission صحیح.
5. HR/حقوق/پرسنل و سپس اموال/نظرسنجی: خروج: سناریوهای محصول، پوشش role و UAT کاربران مربوط.
6. حذف route/patch قدیمی فقط وقتی مصرف‌کننده‌ای باقی نیست و یک دورهٔ عملیاتیِ موردتوافق با parity طی شده است؛ صرف ساخت صفحهٔ React پایان مرحله نیست.

dual-write مستقل به JSON و DB ممنوع. در دورهٔ هم‌زیستی، feature flag و routing مشخص می‌کند کدام UI حق نوشتن دارد؛ صفحهٔ قدیمی حوزهٔ منتقل‌شده read-only شود. هیچ DOM همزمان تحت مدیریت React و renderer سراسری نباشد. rollback هر slice بازگرداندن route/flag است، مشروط به سازگاری داده؛ اگر schema جدید ناسازگار است ابتدا adapter برگشتی آماده باشد.

Unit: واحد/افت/نسخهٔ رسپی/حقوق/مانده. Integration: envelope/unknown fields، full vs partial، Save verification، 409 و requestId. E2E: کاتالوگ تا رسپی، خرید تا receipt، فروش تا مصرف، count تا period close، صندوق تا گردش، تسویه انعام. RTL/keyboard/focus و شبکهٔ کند/قطع نیز پوشش داده شوند. harnessهای متنی قدیمی جای این‌ها را نمی‌گیرند.

## مسیر D — Client/Server واقعی با دیتابیس

### معماری هدف پیشنهادی

یک Backend ماژولار در یک سرویس (modular monolith)، یک DB رابطه‌ای و Frontend فوق برای مقیاس فعلی کافی است. وجود Controller C# دلیل انتخاب کم‌هزینهٔ ASP.NET Core/EF Core در صورت ادامهٔ تیم .NET است؛ فایل فعلی ASP.NET Web API قدیمی است و انتقالش کپی مستقیم به Core نیست. SQL Server برای زیرساخت .NET موجود گزینهٔ اول مشروط، PostgreSQL جایگزین در صورت تناسب میزبانی/هزینه است؛ تصمیم نهایی با مالک محصول.

مرز ماژول‌ها: Identity، Catalog/Menu/Pricing، Procurement، Inventory، HR/Payroll، Cash/Finance، Assets، Survey/Audit. محاسبه و validation مالی/انبار در service/domain Server؛ Frontend فقط پیش‌نمایش همسان ارائه کند. queue، microservice، event sourcing کامل و انبار دادهٔ جدا فقط پس از نیاز اثبات‌شده اضافه شوند.

auth: session سروری با cookie امن HttpOnly/Secure و حفاظت CSRF برای مرورگر هم‌مبدأ؛ برای client بیرونی احتمالی قرارداد token/OIDC مستقل. رمز خام JSON migrate مستقیم نشود؛ reset حساب‌ها یا تبدیل کنترل‌شدهٔ یک‌باره با سیاست تأییدشده. logout، expiry و ابطال نشست سمت سرور اعمال شود.

RBAC پیشنهادی: مدیر سیستم، مدیر رستوران، مالی، خرید، انباردار، صندوقدار و پرسنل. permission به module/action و scope شعبه/شخص وصل شود؛ هر API مجوز و مالکیت entity را کنترل کند. نقش‌های پیشنهادی تأیید محصول می‌خواهند؛ featureVisibility امنیت نیست.

### schema اولیهٔ پیشنهادی

این جدول طرح منطقی است، DDL آمادهٔ production نیست. PK داخلی و `LegacyModule+LegacyId` یکتا برای mapping؛ code سپیدز رشته و صفرهای ابتدایی محفوظ. tenant/branch باید از هویت معتبر Server بیاید، نه مقدار آزاد Client. برای masterها IsActive/IsArchived، زمان/actor و concurrency token؛ برای تراکنش posted، reversal به جای تغییر خاموش.

| حوزه | جدول‌های پیشنهادی و روابط کلیدی |
|---|---|
| هویت | Organizations, Branches, Users, Roles, Permissions, UserRoles, RolePermissions, Sessions |
| کاتالوگ | Units, UnitConversions, CatalogCategories, CatalogItems؛ نوع/flags/واحد FK؛ ItemPriceHistory |
| منو | MenuCategories, MenuItems, MenuPriceHistory, RecipeVersions, RecipeLines؛ نسخه→منو و خط→قلم |
| تأمین | Suppliers, SupplierBankAccounts, SupplierItems, SupplierQuotes؛ رابطه supplier+catalog item |
| خرید | PurchaseRequests/Lines, PurchaseOrders/Lines, PurchaseInvoices/Lines, SupplierPayments, SupplierOpeningBalances |
| انبار | InventoryLocations, InventoryTransactions/Lines, GoodsReceipts/Lines, WasteEvents/Lines, SalesImports/Lines, Stocktakes/Lines, InventoryPeriods, InventoryBalances, ReorderPolicies, OperationalConsumptionProfiles |
| منابع انسانی | Personnel, PersonnelBankAccounts, Sections, Positions, SectionPositions, ShiftDefinitions, StaffingRequirements, WeeklyPlans/Assignments, MonthlyPlans/Assignments, ShiftRecords, Holidays, LeaveRequests |
| حقوق | PayrollPeriods/Rows, PayrollAdjustments, PayrollPayments, TipGroups/Participants, TipPaymentAllocations, Advances, Violations |
| آموزش | Protocols, ChecklistTemplates/Items, ChecklistRuns/Results |
| صندوق و مالی | Cashiers, CashReports/Lines/Reviews, CashRecipients, TransferAccounts, CustodyEntries, FinancialParties, Obligations, Settlements, Checks, MonthlyOverrides |
| اموال/خدمات | Assets, AssetMaintenance, AssetQuantityTransactions, AssetIncidents, AssetCounts, Reservations, SurveyResponses/FollowUps |
| ممیزی/سیستم | SepidzImportBatches/RawBlocks/Events/EventItems/Changes/Alerts/Reviews/Links, AuditLogs, ErrorLogs, ImportJobs/Rows, LegacyMappings, LegacyDocuments, IdempotencyRequests, SystemSettings |

مبلغ هدف با currency صریح و decimal مناسب برای هزینهٔ واحد کسری؛ پیشنهاد اولیه decimal(19,4) برای مبلغ و decimal(19,6) برای quantity/conversion، با سیاست گردکردن نهایی ثبت‌شده. ذخیرهٔ مبلغ کل صحیح با cost کسری اشتباه نشود. BusinessDate میلادی date به‌علاوهٔ متن واردشدهٔ اصلی/تقویم؛ audit زمان UTC و timezone شعبه Asia/Tehran. دادهٔ تاریخی نامعتبر quarantine شود، نه تاریخ حدسی.

FK/indexهای لازم: item+location+date، supplier+date، personnel+period، status+dueDate، import hash و unique code در scope مصوب. نسخهٔ منتشرشدهٔ رسپی برای هر تاریخ overlap نداشته باشد. posted ledger و closure immutable؛ balance projection قابل بازسازی. فیلد ناشناخته در LegacyDocuments/extension bag تا تعیین mapping نگهداری شود.

### سازگاری، هم‌زمانی و transaction

API نسخه‌دار و قرارداد تولیدشده از OpenAPI پیشنهاد می‌شود. هر تغییر master با version/ETag، conflict با پاسخ صریح و بدون last-write-wins. EF Core concurrency token و مقایسهٔ نسخهٔ خوانده‌شده را پشتیبانی می‌کند؛ [مستند رسمی](https://learn.microsoft.com/en-us/ef/core/saving/concurrency). posting رسید/انتقال/تأیید شمارش و ثبت مالی وابسته در یک transaction انجام شود؛ تراکنش و savepointهای EF باید با provider منتخب آزموده شوند. [مرجع transaction](https://learn.microsoft.com/en-us/ef/core/saving/transactions).

requestId/idempotency در DB با scope هویت+عملیات و hash payload یکتا باشد؛ همان key با payload متفاوت خطا دهد. نتیجهٔ عملیات تا مدت موردتوافق قابل بازیابی بماند. retry پس از timeout باید همان نتیجه را بازگرداند؛ دوبارکلیک نباید receipt/payment تکراری بسازد. audit actor، action، entity، قبل/بعد کنترل‌شده، زمان و correlationId در همان transaction ذخیره شود؛ secret/PII در log عمومی نیاید.

### endpointهای صرفاً پیشنهادی

| endpoint هدف | هدف |
|---|---|
| `GET/POST /api/v2/catalog/items`، `PATCH /api/v2/catalog/items/{id}` | فهرست/ثبت/اصلاح با version |
| `POST /api/v2/menu-items/{id}/recipe-versions` | نسخهٔ تاریخ‌دار immutable |
| `POST /api/v2/inventory/receipts/{id}/post` | posting با idempotency |
| `POST /api/v2/inventory/stocktakes/{id}/approve` | تأیید مجاز و baseline |
| `GET /api/v2/inventory/balances` | query با scope/فیلتر/صفحه |
| `POST /api/v2/cash-reports/{id}/void` | ابطال مجاز با دلیل/audit |
| `POST /api/v2/obligations/{id}/settlements` | تسویهٔ اتمی با کنترل مانده |
| `POST /api/v2/import-jobs`، `GET /api/v2/import-jobs/{id}` | staging/preview/result |

هیچ‌کدام از این مسیرها در Gateway فعلی وجود ندارد. قرارداد پاسخ هدف: data، errors با field/code/message، traceId و metadata صفحه/نسخه. validation، نبود مجوز، تعارض و خطای داخلی status متمایز داشته باشند. export باید permission، scope و audit داشته باشد؛ import تا تأیید Preview فقط staging بنویسد.

### مهاجرت مرحله‌ای JSON → DB و rollback

| مرحله | اقدام | گیت ادامه | بازگشت |
|---|---|---|---|
| D0 | Backup تمام ماژول‌ها با hash، ثبت counts/amounts/IDs، freeze تغییر schema | دریافت کامل و restore آزمایشی موفق | بدون write جدید، حفظ سیستم فعلی |
| D1 | ورود raw JSON تغییرنیافته به staging؛ ثبت module/legacyId/importBatch/hash | duplicate/orphan/date/currency/unknown گزارش شده | حذف batch آزمایشی فقط در Stage؛ originals محفوظ |
| D2 | mapping و normalize در transaction؛ schema migration نسخه‌دار | count/FK/مجموع مبلغ/stock/debt/payroll/recipe نمونه برابر یا اختلاف توجیه‌شده | rollback transaction/restore Stage؛ عدم تغییر منبع |
| D3 | Compatibility API روی همان DB؛ Load/Query legacy و Save فقط با full snapshot/version | contract tests، هم‌زمانی، crash و unknown fields | flag به منبع قدیم فقط قبل از پذیرش write جدید یا با delta قابل بازپخش |
| D4 | پایلوت خواندنی، سپس writer واحد برای هر حوزه و React مرحله‌ای | UAT و reconciliation دوره‌ای، بدون dual-write مستقل | توقف write، export delta، mapping برگشتی آزموده، سپس بازگشت route |
| D5 | پنجره cutover، final backup/delta، قفل writer قدیمی، reconcile و فعال‌سازی | تمام خطاهای بحرانی صفر؛ مسئول عملیات تأیید کند | maintenance، restore point + replay تأییدشده، reconcile؛ restore کور ممنوع |

نام، ID/code، snapshot افت/واحد/مالک، نسخهٔ رسپی، void/archive و period closure همگی در migration preserved باشند. برای snapshot فاقد جزئیات، status «نامشخص/تخمینی» منتقل شود. تعداد دارایی‌های تجمیعی به ردیف ساختگی tag تبدیل نشود. دادهٔ Seed هرگز بر export زنده اولویت ندارد. سیستم قدیمی پس از cutover حداقل دورهٔ موردتوافق فقط‌خواندنی بماند.

### عملیات، امنیت و پذیرش هدف

- محیط‌های Development با fixture، Staging با دادهٔ حساسیت‌زدایی‌شده و Production با secret store/دسترسی محدود جدا؛ API origin/DB/tenant مشترک ناخواسته ممنوع.
- CI: build reproducible با lockfile، unit/contract/integration/E2E، migration dry-run، secret/dependency scan و artifact مشخص. deployment به مرحلهٔ approval عملیاتی جدا برسد.
- Backup رمزگذاری‌شده خارج از هاست اصلی، سیاست retention و restore drill؛ RPO/RTO عددی باید با مالک محصول توافق شود. backup بدون تمرین restore کافی نیست.
- log ساختاری، traceId، health/readiness، شمارندهٔ conflict/error/latency، هشدار شکست backup/import و audit دسترسی حساس؛ log شامل credential یا payload کامل HR نباشد.
- rate limit برای login، import بزرگ و export حساس؛ محدودیت اندازه/فرمت فایل، جلوگیری از formula injection در CSV و scope داده. مقدار limit از بار واقعی تعیین شود.
- تست چندکاربره: دو ویرایش متعارض، دوبار submit، timeout بعد از commit، restart بین عملیات، rollback مالی/موجودی، مجوز object-level و تطبیق ledger با balance.

## تصمیم‌های باز برای مالک محصول

۱. محصول تک‌رستوران می‌ماند یا سازمان/شعبه/tenant مستقل از ابتدا لازم است؟ ۲. نقش‌ها و مجوزهای دقیق و سیاست حساب مدیر چیست؟ ۳. زیرساخت و تیم Backend، SQL Server یا PostgreSQL و هزینهٔ میزبانی؟ ۴. مرز دفتر داخلی مالی با حسابداری رسمی و اتصال فروش سپیدز؟ ۵. واحد پول هدف و دقت/گردکردن، قواعد تاریخ و بستن دوره؟ ۶. سیاست نگهداری PII/audit/backup و RPO/RTO؟ ۷. ترتیب پایلوت، زمان قطع write و مدت نگهداری read-only؟

تک‌انبار و ۱۰ تب انبار و عدم بازنویسی به React در کار جاری **تصمیم باز نیستند**؛ تغییر آن‌ها درخواست صریح تازه می‌خواهد.
