# گزارش پالایش مستندات Rayo Admin

تاریخ ممیزی: 2026-09-19. شاخهٔ مبنا: `main`؛ commit مبنا: `39f5d1c67a82285a67c70e478b261db31afe4d09`. در شروع، working tree پاک بود. این گزارش و manifest فقط برای ممیزی و بازیابی‌اند؛ ورودی روزمره [راهنمای شروع](AI_START_HERE.md) است.

## نتیجه و محدوده

هفت مرجع موضوعی فارسی ساخته شد، README جایگزین و قواعد قبلی AGENTS با یک بخش کوتاه مسیر مطالعه تکمیل شد. master handoff پس از تکمیل و اعتبارسنجی جایگزین‌ها به ارجاع سازگار تبدیل شد. 121 فایل حذف، 18 مسیر اولیه حفظ/اصلاح و 9 فایل جدید ایجاد شد (۸ Markdown شامل این گزارش، یک manifest ممیزی). تمام نام‌ها، دلیل هر حذف/ادغام، مقصد و hash اصل فایل در [manifest نهایی](DOCS_CLEANUP_MANIFEST.json) ثبت است؛ گزارش‌های حذف‌شده در Git و ZIP خارجی قابل بازیابی‌اند.

هیچ HTML، CSS، JavaScript، QA، تنظیم API، Seed، Excel، schema JSON، Controller، ID یا کد سپیدز تغییر نکرده است. هر ۱۶۵ فایل غیرمستند با SHA-256 مبنا مقایسه و بدون تغییر تأیید شد. اثر JSON عملیاتی، Backend DTO، migration و دادهٔ زنده: **هیچ**. تنها JSON جدید، manifest مستندات است. نسخهٔ محصول افزایش نیافت؛ انتشار انجام نشد.

## پشتیبان و بازیابی

- ZIP خارج از مخزن: `E:\rayo-admin-docs-backups\rayo-admin-docs-backup-20260919-050944.zip`
- Manifest کنار ZIP: `E:\rayo-admin-docs-backups\rayo-admin-docs-backup-20260919-050944.manifest.json`
- زمان ایجاد UTC: `2026-09-19T01:39:45.7400715Z` (نام فایل با ساعت محلی میزبان ساخته شده است).
- SHA-256: `92f1e94cb3581b865e775833854016487341f55590788d909cb1dad1e37567f9`
- سلامت: PASS؛ هر ۱۳۹ entry باز و decompress شد؛ اندازه و SHA-256 هر entry با اصل پیش از تغییر مطابقت داشت. ZIP شامل همین مستندات اولیه است و runtime، دادهٔ زنده، cache و workbookها را شامل نمی‌شود. دادهٔ حساس تازه‌ای به پشتیبان افزوده نشده است.

برای بازیابی، ابتدا SHA-256 ZIP را با `Get-FileHash -Algorithm SHA256 -LiteralPath '<ZIP>'` کنترل کنید. ZIP را در پوشهٔ تازه و مجزایی **بیرون از مخزن فعال** باز کنید؛ مسیر مقصد و entryها نباید از آن پوشه خارج شوند. hash فایل موردنظر را با manifest کنار ZIP مقایسه کنید و فقط همان مسیر را پس از مقایسه با تغییرات جدید برگردانید. تمام پوشه را روی پروژهٔ جاری overwrite نکنید. برای برگشت همین تغییر مستندات، commit مخصوص این پالایش را در Git پیدا و پس از بررسی تغییرات بعدی revert کنید؛ reset سخت یا بازیابی دادهٔ عملیاتی لازم نیست.

## آمار قابل مقایسه

دامنهٔ شمارش: فایل‌های Markdown/TXT تحت Git، شامل AGENTS و README و تمام اسناد تاریخی. `temp/` و Backup خارجی خارج از دامنه‌اند. هر خط غیرخالی یا خالی با جداکنندهٔ متن شمارش شده و newline انتهایی خط اضافی محسوب نشده است. JSON عملیاتی و Excel از ابتدا مستند متنی شمرده نشده‌اند.

| شاخص | قبل | بعد |
|---|---:|---:|
| تعداد Markdown/TXT | 139 | 26 |
| مجموع بایت Markdown/TXT | 639148 | 446575 |
| مجموع خطوط Markdown/TXT | 11963 | 7056 |
| manifest ممیزی جدید، جدا از مقایسهٔ متن | 0 | 71586 بایت |
| کل مصنوعات مستند پس از افزودن manifest | 139 | 27 |
| مجموع حجم متن + manifest | 639148 | 518161 بایت |

تعداد متن‌ها 81.3٪ و حجم متن‌ها 30.1٪ کاهش یافته است. حجم خود manifest شفاف جدا آمده تا صرف انتقال تاریخچه به JSON با کاهش محتوا اشتباه نشود. چهار متن تاریخی حجیم برای احتیاط باقی‌اند و در مسیر خواندن پیش‌فرض نیستند. هفت مرجع جدید به همراه README فقط با توجه به نوع کار خوانده شوند.

## حذف، ادغام و فایل‌های محفوظ

| تصمیم | تعداد | توضیح |
|---|---:|---|
| ادغام موضوعی و حذف مسیر قدیمی | 35 | 11 سند موضوعی و 24 سند منسوخ/نسخه‌ای؛ فقط قواعد معتبر منتقل شد، ادعاهای ناسازگار کنار گذاشته شد |
| کنارگذاشتن گزارش و تاریخچهٔ قدیمی | 83 | وضعیت QA/انتشار مقطعی؛ سابقه در Git/Backup و نتیجهٔ تازه در این گزارش |
| حذف تکراری/خالی | 3 | یک نسخهٔ byte-identical از گزارش منشأ Seed و دو TXT صفر بایتی |
| کل حذف | 121 | نام و دلیل تک‌تک فایل‌ها در manifest |
| مسیرهای اولیهٔ حفظ/اصلاح‌شده | 18 | مراجع، شش ضمیمه، قرارداد/مهاجرت سازگار و چهار سند مبهم |

منظور از «ادغام» انتقال معنا و قواعد معتبر است، نه کپی همهٔ متن‌ها. برای مسیرهای تاریخی، مقصد manifest مرجع موضوعی جایگزین است و ادعای انتقال همهٔ متن تاریخی به آن نیست. اصل کامل همهٔ ۱۳۹ فایل در Backup حفظ شده است.

| سند موضوعی حذف‌شده | محل اطلاعات معتبر |
|---|---|
| `ASSET_VALUATION_v9_7_2.md` | مرجع داده §۳ اموال و مشخصات محصول §۸؛ نرخ‌ها و مبنای تاریخی با فرمول جاری تفکیک شد |
| `DATA_SAFETY_AUDIT_v10_7_0.md` | مرجع داده §۵–۶، مرجع فنی CUR-01 تا CUR-09 و راهنمای Reset |
| `INVENTORY_COST_CONTROL_v10.md` | مشخصات محصول §۵ و مرجع داده §۳؛ baseline، واحد، receipt، ledger، فروش، شمارش و closure |
| `INVENTORY_FUNCTION_FIX_v9_4_2.md` | مرجع فنی مالک انبار و ترتیب patchها؛ داستان باگ قدیمی فقط در Git/Backup |
| `INVENTORY_OPERATION_START_v9_6_0.md` | مشخصات محصول §۵ و مرجع داده §۳؛ baseline، واحد، receipt، ledger، فروش، شمارش و closure |
| `INVENTORY_START_AND_WORKFLOW_v10_2_0.md` | مشخصات محصول §۵ و مرجع داده §۳؛ baseline، واحد، receipt، ledger، فروش، شمارش و closure |
| `INVENTORY_WORKFLOW_v10_1_0.md` | مشخصات محصول §۵ و مرجع داده §۳؛ baseline، واحد، receipt، ledger، فروش، شمارش و closure |
| `INVENTORY_WORKFLOW_v10_3_0.md` | مشخصات محصول §۵ و مرجع داده §۳؛ baseline، واحد، receipt، ledger، فروش، شمارش و closure |
| `PHASE_2_README.md` | مشخصات محصول، ماتریس و مرجع داده؛ ورود/مجوز Client از امنیت سروری تفکیک شد |
| `SEPIDS_AUDIT_v10.md` | مشخصات محصول §۷ ممیزی و مرجع داده §۳؛ parser، dedup، risk، review و محدودیت اتصال invoice |
| `WASTE_CONTROL_v10_0_1.md` | مشخصات محصول §۵ ضایعات و KPI؛ واحدها و pending از تأیید جدا شد |

قراردادهای کاتالوگ و JSON/React و راهنمای Stage 1 حذف نشدند؛ مسیرهای آن‌ها اکنون به قرارداد جاری ارجاع می‌دهند و Bootstrap خودکار منسوخ را هشدار می‌دهند. قالب Excel و migration دستی کاتالوگ حفظ شدند. `RAYO_DATA_MODEL_v10_8_0.json`، Seedها، فایل‌های `seed/source-excel/archive/`، ابزارهای migration/import، تست‌ها و تمام assets از پاک‌سازی مستندات مستثنا و بدون تغییر ماندند. هیچ فایل ZIP قبلی تحت Git برای حذف شناسایی نشد؛ فایل‌های موقت/نادیده‌گرفته‌شدهٔ کاربر دست‌نخورده ماندند.

### نیازمند تصمیم کاربر؛ فعلاً محفوظ

| فایل | دلیل عدم حذف |
|---|---|
| [RAYO_ADMIN_PROJECT_HANDOFF_v10_5_0.md](../RAYO_ADMIN_PROJECT_HANDOFF_v10_5_0.md) | Handoff تفصیلی قدیمی شامل فرهنگ فیلدها و سابقه تصمیم‌ها؛ برای جلوگیری از حذف اطلاعات تأییدنشده حفظ تاریخی |
| [RAYO_ADMIN_PROJECT_HANDOFF_v10_8_0.md](../RAYO_ADMIN_PROJECT_HANDOFF_v10_8_0.md) | Handoff تفصیلی قدیمی؛ برابری همه جزئیات انتقال/قرارداد قدیمی قابل تضمین نیست؛ حفظ تاریخی |
| [RAYO_ADMIN_PROJECT_HANDOFF_v10_8_1.md](../RAYO_ADMIN_PROJECT_HANDOFF_v10_8_1.md) | Handoff تفصیلی قدیمی؛ جزئیات QA و انتقال نیازمند تطبیق محیط قدیمی؛ حفظ تاریخی |
| [RAYO_DATA_MODEL_SQL_MIGRATION_v10_8_0.md](../RAYO_DATA_MODEL_SQL_MIGRATION_v10_8_0.md) | طرح تفصیلی قدیمی SQL حاوی جزئیات انتقال؛ تطبیق کامل تمام ستون‌ها با محیط مستقر ممکن نیست؛ حفظ تاریخی |

تصمیم لازم برای حذف بعدی این چهار سند، تأیید بی‌نیازی از قرارداد/محیط قدیمی پس از تطبیق جزئیات آن است. همگی هشدار تاریخی دارند. نسخه‌ای‌بودن این فایل‌ها، دو مسیر قرارداد/مهاجرت کاتالوگ و master handoff سازگار مجوز حذف خودکار نیست. پس از پالایش هیچ دو متن باقی‌مانده hash یکسان ندارند. ارجاع‌های قدیمی QA/changelog در دو handoff تاریخی به توضیح Git/Backup تبدیل شدند.

## اعتبارسنجی

- وابستگی: جست‌وجوی نام و مسیر تک‌تک حذف‌ها در فایل‌های اجرایی/داده/تست؛ صفر مصرف‌کننده. بررسی ارجاع فعال و لینک نسبی اسناد باقی‌مانده؛ 176 لینک، بدون مقصد حذف‌شده در نتیجهٔ نهایی. نمونه‌های fenced JSON مرجع (4 نمونه) parse شدند.
- syntax: `node --check` برای هر ۵۰ فایل `js/*.js` و `cash-report/js/app.js`؛ ۵۱/۵۱ PASS.
- اجرای محلی: Node static HTTP روی loopback؛ ۴۰ HTML و تمام script/styleهای محلی آن‌ها، ۱۰۰ فایل یکتا، با status 200 و تطابق byte پاسخ با دیسک. این بررسی render یا اجرای مرورگر نیست؛ هیچ API یا write عملیاتی اجرا نشد.
- Build: برنامهٔ MPA فاقد package.json/build است؛ مرحلهٔ Build کاربرد ندارد. Controller مرجع C# بدون پروژهٔ میزبان/فایل solution قابل Build مستقل نیست.
- Git: تمام diff محتوایی و نام مسیرها بررسی شد؛ فقط مستندات، بدون تغییر ۱۶۵ فایل محافظت‌شده. نتیجهٔ `git diff --check`: PASS.
- Load/Save: QAهای Gateway/Settings با پاسخ‌های ساختگی، Load خالی/ناموفق، guard و GET تأییدی را بررسی کردند؛ normal Load هیچ Seed/Save عملیاتی ایجاد نکرد. errorlog در برنامه استثنای ثبت خطای Client است؛ ادعای «هیچ POST در هیچ شرایطی» مطرح نیست.
- بعد از حذف: qa_gateway.js: PASS؛ qa_page_startup.js: PASS؛ qa_settings_reset.js: PASS؛ qa_v10_12_1.js: PASS

نتیجهٔ اجرای پیش از ویرایش مستندات: **35 suite اجرا؛ 29 PASS، 6 FAIL؛ 5 SKIP**. هر FAIL زیر پیش از تغییرات وجود داشت. سورس و خود QAها در پایان byte-identical هستند؛ هیچ assertion برای سبزشدن این کار تغییر نکرد.

| QA | نتیجه | دامنه/علت |
|---|---|---|
| `qa_base_data_search_input.js` | SKIP | نیازمند مرورگر و fixture/CDP ایزوله |
| `qa_cash_custody.js` | PASS | اجرای محلی با exit code صفر |
| `qa_cash_destinations.js` | PASS | اجرای محلی با exit code صفر |
| `qa_cash_reports_query.js` | PASS | اجرای محلی با exit code صفر |
| `qa_cash_variance.js` | PASS | اجرای محلی با exit code صفر |
| `qa_finance_obligations.js` | PASS | اجرای محلی با exit code صفر |
| `qa_gateway.js` | PASS | اجرای محلی با exit code صفر |
| `qa_inventory_bulk_count.js` | PASS | اجرای محلی با exit code صفر |
| `qa_inventory_entry_issue.js` | PASS | اجرای محلی با exit code صفر |
| `qa_inventory_receipt_ui.js` | PASS | اجرای محلی با exit code صفر |
| `qa_management_tabs.js` | PASS | اجرای محلی با exit code صفر |
| `qa_menu_recipe_ui.js` | SKIP | نیازمند مرورگر و fixture/CDP ایزوله |
| `qa_operational_forecast.js` | PASS | اجرای محلی با exit code صفر |
| `qa_page_startup.js` | PASS | اجرای محلی با exit code صفر |
| `qa_personnel_counts.js` | PASS | اجرای محلی با exit code صفر |
| `qa_personnel_salary_account.js` | PASS | اجرای محلی با exit code صفر |
| `qa_remote_supplier_deploy.js` | SKIP | بررسی انتشار روی سرویس واقعی؛ خارج از QA محلی |
| `qa_reorder_point.js` | PASS | اجرای محلی با exit code صفر |
| `qa_sales_audit_navigation.js` | PASS | اجرای محلی با exit code صفر |
| `qa_settings_reset.js` | PASS | اجرای محلی با exit code صفر |
| `qa_shift_menu.js` | PASS | اجرای محلی با exit code صفر |
| `qa_standard_preparation_loss.js` | PASS | اجرای محلی با exit code صفر |
| `qa_supplier_company_input.js` | SKIP | نیازمند مرورگر و fixture/CDP ایزوله |
| `qa_supplier_modal_order_method.js` | PASS | اجرای محلی با exit code صفر |
| `qa_supplier_parties_debts.js` | PASS | اجرای محلی با exit code صفر |
| `qa_supplier_relation_search.js` | PASS | اجرای محلی با exit code صفر |
| `qa_supplier_ui_runtime.js` | SKIP | نیازمند مرورگر و fixture/CDP ایزوله |
| `qa_tip_form_filters.js` | PASS | اجرای محلی با exit code صفر |
| `qa_tip_monthly_settlement.js` | PASS | اجرای محلی با exit code صفر |
| `qa_tips_query.js` | PASS | اجرای محلی با exit code صفر |
| `qa_ui_lists_assets.js` | PASS | اجرای محلی با exit code صفر |
| `qa_v10_10_0.js` | PASS | اجرای محلی با exit code صفر |
| `qa_v10_10_1.js` | FAIL | شکست پیش از ویرایش مستندات؛ جزئیات پایین |
| `qa_v10_11_0.js` | FAIL | شکست پیش از ویرایش مستندات؛ جزئیات پایین |
| `qa_v10_12_0.js` | PASS | اجرای محلی با exit code صفر |
| `qa_v10_12_1.js` | PASS | اجرای محلی با exit code صفر |
| `qa_v10_8_1.js` | FAIL | شکست پیش از ویرایش مستندات؛ جزئیات پایین |
| `qa_v10_9_0.js` | FAIL | شکست پیش از ویرایش مستندات؛ جزئیات پایین |
| `qa_v10_9_1.js` | FAIL | شکست پیش از ویرایش مستندات؛ جزئیات پایین |
| `qa_v10_9_3.js` | FAIL | شکست پیش از ویرایش مستندات؛ جزئیات پایین |

### شکست‌های ثبت‌شده؛ برطرف نشده در این کار

| QA | assertion/خطای مشاهده‌شده |
|---|---|
| `qa_v10_10_1.js` | Error: FAIL: sales audit tab |
| `qa_v10_11_0.js` | Error: FAIL: v10.11 loader |
| `qa_v10_8_1.js` | ✗ Build marker؛ ✗ Manual initialize confirmation؛ ✗ Manual reset confirmation؛ ✗ Manual reset backup first؛ ✗ Data management route registered؛ ✗ Data management script loaded؛ ✗ Inventory core has exactly 12 fixed tabs |
| `qa_v10_9_0.js` | ✗ Build marker؛ ✗ Manual initialize confirmation؛ ✗ Manual reset confirmation؛ ✗ Manual reset backup first؛ ✗ Data management route registered؛ ✗ Data management script loaded؛ ✗ v10.9 script loaded on admin pages؛ ✗ v10.9 CSS loaded on all HTML pages؛ ✗ Operational consumables schema and report؛ ✗ Sidebar version marker |
| `qa_v10_9_1.js` | ✗ Build marker؛ ✗ Manual initialize confirmation؛ ✗ Manual reset confirmation؛ ✗ Manual reset backup first؛ ✗ Data management route registered؛ ✗ Data management script loaded؛ ✗ v10.9 script loaded on admin pages؛ ✗ v10.9 CSS loaded on all HTML pages؛ ✗ Operational consumables schema and report؛ ✗ Sidebar version marker؛ ✗ v10.9.1 staffing patch loaded |
| `qa_v10_9_3.js` | ✗ Build marker 10.9.3؛ ✗ v10.9.3 CSS loaded on every HTML؛ ✗ Supplier sync has a dedicated visible tab؛ ✗ Supplier list has top sync shortcut؛ ✗ Supplier items view has sync shortcut؛ ✗ All 536 Sepidz pricing codes preserved؛ ✗ 79 supplier-only items preserved |

بخشی از این انتظارها به build marker، loader، مسیر Reset/منو، تب قدیمی و شمارش تاریخی Seed مربوط‌اند. صرف قدیمی‌بودن نام تست اثبات بی‌اهمیت‌بودن شکست نیست؛ تطبیق assertion با نیاز فعلی، کار جداگانه است. latest QAهای v10.12.0 (26/26)، v10.12.1 (20)، gateway (13)، startup (41) و settings reset (30) پاس‌اند.

## محدودیت‌ها و تصمیم‌های باز

مرورگر متصل در بررسی ابزار وجود نداشت (apps/browsers خالی)؛ چهار QA وابسته به CDP و بررسی دستی RTL/موبایل اجرا نشد و **Unverified** است. بررسی انتشار remote نیز اجرا نشد. هیچ تضمینی دربارهٔ دیتای زنده، تنظیم میزبانی، auth/RBAC مستقر، سازگاری نسخهٔ Controller با سرور یا API production ارائه نمی‌شود. Python محلی قابل اجرا نبود؛ HTTP با Node انجام شد. فونت‌های IRANSansX ارجاع‌شده در CSS در checkout حاضر نیستند و fallback در تست بصری آینده باید بررسی شود.

Known Gapهای حاصل از کد، از جمله Save کامل بدون version، خطر snapshot صفحه‌ای، مسیر حذف فیزیکی صندوق/مالی و auth سمت Client، با شناسه‌های CUR در [مرجع فنی](CURRENT_IMPLEMENTATION.md) ثبت‌اند و در این کار اصلاح اجرایی نشده‌اند.

برای بازطراحی آینده تصمیم‌های مالک محصول شامل تک‌رستوران/چندشعبه/tenant، RBAC دقیق، زیرساخت DB، مرز حسابداری رسمی، پول/تاریخ/گردکردن، نگهداری PII و backup، RPO/RTO و پایلوت است؛ [راهنمای چهار مسیر](REBUILD_AND_MIGRATION_GUIDE.md). این‌ها مانع تکمیل پاک‌سازی نبودند. اجازهٔ تغییر ۹ تب یا اجرای React در این کار صادر نشده و انجام نشده است.

## پوشش چهار سناریو

| سناریو | مرجع و معیار |
|---|---|
| بازسازی از ابتدا | مسیر A: ماژول‌ها، وابستگی، اولویت، جریان‌ها و پذیرش؛ مشخصات محصول و قرارداد استنباط‌شدهٔ داده |
| ادامهٔ نسخهٔ فعلی | مسیر B: مالک کد، ریسک CUR، backlog، سازگاری و QA؛ نقشهٔ دقیق ۴۰ صفحه/script |
| React مرحله‌ای | مسیر C: route/component، adapter، state، فرم، RTL، هم‌زیستی، writer واحد و گیت خروج هر مرحله |
| Client/Server و DB | مسیر D: معماری پیشنهادی، schema منطقی، endpointهای Planned، auth/RBAC، transaction، migration، reconciliation و rollback |

این مجموعه مشخصات بازسازی محصول و طرح اجرایی مهاجرت است؛ جایگزین دادهٔ تاریخی مفقود، قرارداد Backend مستقرِ بررسی‌نشده یا تصمیم محصول نامعلوم نیست. پیشنهادهای آینده با وضعیت جاری مخلوط نشده‌اند.

## فهرست دقیق تغییرات Git

148 مسیر: 121 حذف، 18 اصلاح، 9 ایجاد. این فهرست با diff از commit مبنا تطبیق داده می‌شود؛ فایل‌های scratch در `temp/` نادیده‌گرفته‌شده‌اند و commit نمی‌شوند. برای حذف‌ها، دلیل و مقصد در manifest است. در این فهرست، نام فایل حذف‌شده عمداً لینک فعال نیست.

```text
M AGENTS.md
D API_STABILITY_FIX_v9_4_1.md
D ASSET_VALUATION_v9_7_2.md
D BACKEND_MODULES_v10.md
D BACKEND_MODULES_v9_5.md
D BACKEND_MODULES_v9_8.md
D BACKEND_NOTES_v10_11_0.md
D BACKEND_NOTES_v10_12_0.md
D BACKEND_NOTES_v10_12_1.md
D BACKEND_NOTES_v10_9_0.md
D BACKEND_NOTES_v10_9_1.md
D BACKEND_NOTES_v10_9_2.md
M CATALOG_DATA_MODEL_v10_10_0.md
D CHANGELOG_v10_0_0.md
D CHANGELOG_v10_0_1.md
D CHANGELOG_v10_1_0.md
D CHANGELOG_v10_10_0.md
D CHANGELOG_v10_10_1.md
D CHANGELOG_v10_11_0.md
D CHANGELOG_v10_12_0.md
D CHANGELOG_v10_12_1.md
D CHANGELOG_v10_2_0.md
D CHANGELOG_v10_3_0.md
D CHANGELOG_v10_3_1.md
D CHANGELOG_v10_4_0.md
D CHANGELOG_v10_4_1.md
D CHANGELOG_v10_5_0.md
D CHANGELOG_v10_5_1.md
D CHANGELOG_v10_5_2.md
D CHANGELOG_v10_6_0.md
D CHANGELOG_v10_6_1.md
D CHANGELOG_v10_7_0.md
D CHANGELOG_v10_8_0.md
D CHANGELOG_v10_8_1.md
D CHANGELOG_v10_9_0.md
D CHANGELOG_v10_9_1.md
D CHANGELOG_v10_9_2.md
D CHANGELOG_v10_9_3.md
D CHANGELOG_v9_5_2.md
D CHANGELOG_v9_5_3.md
D CHANGELOG_v9_5_4.md
D CHANGELOG_v9_5_5.md
D CHANGELOG_v9_5_6.md
D CHANGELOG_v9_5_7.md
D CHANGELOG_v9_5_8.md
D CHANGELOG_v9_5_9.md
D CHANGELOG_v9_6_0.md
D CHANGELOG_v9_6_1.md
D CHANGELOG_v9_7_0.md
D CHANGELOG_v9_7_1.md
D CHANGELOG_v9_7_2.md
D CHANGELOG_v9_8_0.md
D CHANGELOG_v9_8_1.md
D DATA_SAFETY_AUDIT_v10_7_0.md
D DEPLOY_NOTES_v10_0_0.md
D DEPLOY_NOTES_v9_8_0.md
D DEPLOY_VERIFY_v10_2_1.txt
A docs/AI_START_HERE.md
D docs/BUG_REPORT_2026-09-03.md
M docs/CASH_CUSTODY_AND_DESTINATIONS.md
A docs/CURRENT_IMPLEMENTATION.md
A docs/DATA_AND_API_REFERENCE.md
A docs/DOCS_CLEANUP_MANIFEST.json
A docs/DOCS_CLEANUP_REPORT.md
A docs/DOCUMENTATION_POLICY.md
A docs/FEATURE_STATUS_MATRIX.md
M docs/INVENTORY_RECEIPT_UI.md
M docs/OPERATIONAL_CONSUMPTION_FORECAST.md
M docs/PAGE_STARTUP_FIX.md
A docs/PROJECT_MASTER_SPEC.md
M docs/RAYO_ADMIN_MASTER_HANDOFF_v10_12_1.md
A docs/REBUILD_AND_MIGRATION_GUIDE.md
M docs/SETTINGS_SEPARATION_AND_TABLE_RESET.md
M docs/STANDARD_PREPARATION_LOSS.md
M EXCEL_IMPORT_FORMATS.md
D INITIAL_DATA_IMPORT_REPORT_v9_5_4.md
D INITIAL_DATA_IMPORT_REPORT.md
D INVENTORY_COST_CONTROL_v10.md
D INVENTORY_FUNCTION_FIX_v9_4_2.md
D INVENTORY_OPERATION_START_v9_6_0.md
D INVENTORY_START_AND_WORKFLOW_v10_2_0.md
D INVENTORY_WORKFLOW_v10_1_0.md
D INVENTORY_WORKFLOW_v10_3_0.md
M MIGRATION_GUIDE_v10_10_0.md
D New Text Document (2).txt
D New Text Document.txt
D NEXT_STAGES.md
D PHASE_2_README.md
D PHASE_PLAN_v10_10_1_TO_v10_12_0.md
D QA_REPORT_v10_0_0.md
D QA_REPORT_v10_0_1.md
D QA_REPORT_v10_1_0.md
D QA_REPORT_v10_10_0.md
D QA_REPORT_v10_12_0.md
D QA_REPORT_v10_12_1.md
D QA_REPORT_v10_2_0.md
D QA_REPORT_v10_2_1.md
D QA_REPORT_v10_3_0.md
D QA_REPORT_v10_3_1.md
D QA_REPORT_v10_4_0.md
D QA_REPORT_v10_4_1.md
D QA_REPORT_v10_5_0.md
D QA_REPORT_v10_5_1.md
D QA_REPORT_v10_5_2.md
D QA_REPORT_v10_6_0.md
D QA_REPORT_v10_6_1.md
D QA_REPORT_v10_7_0.md
D QA_REPORT_v10_8_0.md
D QA_REPORT_v10_8_1.md
D QA_REPORT_v10_9_0.md
D QA_REPORT_v10_9_1.md
D QA_REPORT_v10_9_2.md
D QA_REPORT_v10_9_3.md
D QA_REPORT_v9_3_1.md
D QA_REPORT_v9_4_1.md
D QA_REPORT_v9_5_2.md
D QA_REPORT_v9_5_3.md
D QA_REPORT_v9_5_4.md
D QA_REPORT_v9_5_7.md
D QA_REPORT_v9_5_8.md
D QA_REPORT_v9_5_9.md
D QA_REPORT_v9_5.md
D QA_REPORT_v9_6_0.md
D QA_REPORT_v9_6_1.md
D QA_REPORT_v9_7_0.md
D QA_REPORT_v9_7_1.md
D QA_REPORT_v9_7_2.md
D QA_REPORT_v9_8_0.md
D QA_REPORT_v9_8_1.md
D QA_REPORT.md
D RAYO_ADMIN_PROJECT_HANDOFF_v10_10_0.md
D RAYO_ADMIN_PROJECT_HANDOFF_v10_11_0.md
D RAYO_ADMIN_PROJECT_HANDOFF_v10_12_0.md
D RAYO_ADMIN_PROJECT_HANDOFF_v10_12_1.md
M RAYO_ADMIN_PROJECT_HANDOFF_v10_5_0.md
M RAYO_ADMIN_PROJECT_HANDOFF_v10_8_0.md
M RAYO_ADMIN_PROJECT_HANDOFF_v10_8_1.md
D RAYO_ADMIN_PROJECT_HANDOFF_v10_9_0.md
D RAYO_ADMIN_PROJECT_HANDOFF_v10_9_1.md
D RAYO_ADMIN_PROJECT_HANDOFF_v10_9_2.md
M RAYO_DATA_MODEL_SQL_MIGRATION_v10_8_0.md
M REACT_JSON_DATA_CONTRACT.md
D README_v10_1_0.md
D README_v10_2_0.md
M README.md
D SEPIDS_AUDIT_v10.md
M STAGE_1_API_DATA_MIGRATION.md
D WASTE_CONTROL_v10_0_1.md
```
