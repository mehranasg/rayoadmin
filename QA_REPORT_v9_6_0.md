# QA Report — Rayo Admin v9.6.0

## Scope
فقط توسعه تحلیل گزارش فروش، آمار تفکیکی گزارش صندوق و راهنمای Contextual. طراحی/CSS و سایر منطق‌های پروژه تغییر نکرده‌اند.

## Excel samples checked
با `artifact_tool` فایل‌های واقعی بررسی شدند:
- `فروش به تفکیک تاریخ.xlsx`: Sheet1، 17 ردیف داده روزانه، تاریخ‌های فشرده مانند `14050501`.
- `فروش به تفکیک ماه.xlsx`: Sheet1، 8 ردیف ماهانه، تاریخ‌هایی مانند `140601`.
- `گزارش فروش یک کالا به تفکیک تاریخ (گزارش مدیریتی).xlsx`: Sheet1، 17 ردیف، تاریخ‌هایی مانند `1405/05/1`.
- نمونه‌ای با نام دقیق `ریز فروش یک روز` در فایل‌های قابل دسترس این گفتگو پیدا نشد؛ دکمه این بخش به Importer موجود ریز فروش سپیدز متصل شده و قرارداد Header آن در `EXCEL_IMPORT_FORMATS.md` مستند است.

## Sales analytics
- مسیر مستقل `فروش ← تحلیل گزارش فروش`: PASS
- View مستقل `reports.html?view=salesAnalysis`: PASS
- Import فروش روزانه بر اساس تاریخ، Skip رکورد موجود: PASS (contract/code review)
- Import فروش ماهانه بر اساس ماه، Skip رکورد موجود: PASS
- Import فروش هر کالا بر اساس `menuItemId + date`: PASS
- تاریخ `YYYYMMDD` و `YYYYMM`: پشتیبانی می‌شود
- YOY فقط با >= 2 سال: PASS
- معیار اصلی روند تاریخی: تعداد فیش؛ مبلغ ریالی معیار رشد/افت نیست: PASS
- ریز فروش یک روز: Import افزایشی `date + menuItemId` و عدم Duplicate: PASS (code contract)

## Cash report
- چهار فیلد `hallAmount`, `subscriberAmount`, `hallReceiptCount`, `subscriberReceiptCount`: PASS
- Admin entry/read/save: PASS
- Staff entry/save: PASS
- `salesBreakdownEntered` برای حفظ سازگاری گزارش‌های قدیمی: PASS
- هشدار غیرمسدودکننده مبلغ و تعداد: PASS
- نمودار مبلغ: کل/سالن/مشترکین/اسنپ: PASS
- نمودار تعداد فیش: کل/سالن/مشترکین/اسنپ: PASS

## Contextual help
- فایل مستقل `js/27-context-help-v9-6-0.js`: PASS
- دکمه `❓ راهنما` در صفحات اصلی مدیریت و پنل پرسنل: PASS
- متن بر اساس صفحه/View/Tab اصلی: PASS
- بدون MutationObserver: PASS

## Regression / static validation
- JavaScript syntax: 30/30 PASS (`node --check`)
- JSON parse: 9/9 PASS
- CSS SHA-256 v9.5.9 vs v9.6.0: identical
  `24d0591fc19969623f19172b1de09477bc897053cec08312583946297ba7af84`
- هیچ MutationObserver جدید در Sales Analytics یا Help وجود ندارد.
- Cache/build به `9.6.0` افزایش یافته است.

## Deploy smoke tests recommended
1. باز شدن `index.html` بدون افزایش غیرعادی CPU/Memory.
2. منوی فروش و باز شدن `تحلیل گزارش فروش`.
3. Import هر سه فایل نمونه و کنترل تعداد رکوردهای افزوده‌شده.
4. Import دوباره همان فایل و اطمینان از صفر Duplicate.
5. ثبت یک گزارش صندوق با تفکیک سالن/مشترکین و یک گزارش با اختلاف آماری؛ مورد دوم باید ذخیره شود ولی هشدار نشان دهد.
6. ثبت گزارش صندوق از پنل صندوقدار با همین چهار فیلد.
7. باز کردن راهنما در صفحات پرسنل، موجودی، صندوق، گزارش فروش و قیمت‌گذاری.
