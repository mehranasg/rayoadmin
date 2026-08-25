const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pass = [];
const fail = [];
function check(name, condition, detail = '') {
  (condition ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`);
}

const jsDir = path.join(root, 'js');
const jsFiles = fs.readdirSync(jsDir).filter((name) => name.endsWith('.js')).sort();
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(jsDir, file)], { encoding: 'utf8' });
  check(`JS syntax: ${file}`, result.status === 0, (result.stderr || '').trim());
}

const jsonFiles = [
  ...fs.readdirSync(path.join(root, 'seed')).filter((name) => name.endsWith('.json')).map((name) => path.join('seed', name)),
  'RAYO_DATA_MODEL_v10_8_0.json'
];
for (const file of jsonFiles) {
  try {
    JSON.parse(read(file));
    check(`JSON parse: ${file}`, true);
  } catch (error) {
    check(`JSON parse: ${file}`, false, error.message);
  }
}

let refsChecked = 0;
const missingRefs = [];
for (const file of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
  const html = read(file);
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const ref = match[1].split(/[?#]/, 1)[0];
    if (!ref || /^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(ref)) continue;
    refsChecked += 1;
    if (!fs.existsSync(path.join(root, ref))) missingRefs.push(`${file}: ${ref}`);
  }
}
check('Local HTML references', missingRefs.length === 0, `${refsChecked} checked; ${missingRefs.length} missing`);

const config = read('js/config.js');
const manual = read('js/39-manual-initial-data-v10-8.js');
const shell = read('js/16-mpa-shell.js');
const menu = read('js/17-v9-3-admin-enhancements.js');
const coreInventory = read('js/14-ops-integration.js');
const personnelHtml = read('personnel.html');
const userManagement = read('js/25-user-management-v9-5-5.js');
const cashReport = read('js/11-rayo-cash-report-module.js');
const salesAnalysis = read('js/28-sales-analysis-page-v9-6-1.js');
const legacySalesAnalysis = read('js/24-sales-analytics-v9-5-4.js');
const v109 = read('js/40-rayo-v10-9-comprehensive.js');
const staffing = read('js/41-staffing-needs-v10-9-1.js');
const pricing = read('js/08-rayo-pricing-admin-module.js');
const inventoryV10 = read('js/32-inventory-cost-control-v10.js');
const staffPanel = read('js/22-staff-panel.js');

check('Build marker', read('js/app-config.js').includes("BUILD:'10.9.1'"));
check('HTML cache marker', fs.readdirSync(root).filter((name) => name.endsWith('.html')).every((file) => !read(file).includes('v=10.8.1')));
check('Normal load is API-only', /async function loadOrBootstrap\(module\)[\s\S]*?return loadModule\(module\);/.test(config));
check('Uninitialized save guard', config.includes("!initialized&&!allowInitialize"));
check('Live-load save guard', config.includes("!liveConfirmed&&!allowUnconfirmedWrite"));
check('Save token is mandatory', config.includes('data.meta.serverSaveToken=') && /if\(sentToken\)return !!receivedToken&&sentToken===receivedToken/.test(config));
check('Manual initialize confirmation', manual.includes("token!=='INITIALIZE'"));
check('Manual reset confirmation', manual.includes("token!=='RESET FROM SEED'"));
check('Manual reset backup first', manual.indexOf('downloadJson(') < manual.indexOf("token=prompt('برای تأیید نهایی"));
check('Data management dedicated view registered', manual.includes("views.dataManagement=dataManagementView"));
check('Data management route registered', shell.includes("'dataManagement'") && menu.includes('personnel.html?view=dataManagement'));
check('Data management script loaded', personnelHtml.includes('39-manual-initial-data-v10-8.js?v=10.9.1'));
check('Backup control available', manual.includes('RayoBackup.downloadAll()'));
check('Seed policy', config.includes("seedPolicy:'manual-initialize-or-reset-only'"));
const accessListView = userManagement.slice(userManagement.indexOf('function view()'), userManagement.indexOf('function openEditor'));
check('Extra permissions absent from access list', !accessListView.includes('دسترسی‌های اضافه'));
check('Admin can reveal user password with eye icon', userManagement.includes("RayoPassword.toggle('um_password',this)"));
check('Admin login uses eye icon', read('index.html').includes('password-eye-btn') && !read('index.html').includes('نمایش پسورد</button>'));
check('Staff login uses eye icon', read('staff-login.html').includes('password-eye-btn'));
check('Approximate invoice average label', cashReport.includes('میانگین رقم هر فاکتور (حدودی)'));
check('Invoice average floors to 10,000 Toman', cashReport.includes('Math.floor(toman/10000)*10000*10'));
check('Sales Excel data persists in cashreport.salesAnalytics', salesAnalysis.includes('latest.salesAnalytics=store()') && salesAnalysis.includes("saveModule('cashreport',latest,{verify:true})"));
check('Legacy sales analysis persistence preserved', legacySalesAnalysis.includes('latest.salesAnalytics=normalizeStore(data.salesAnalytics)') && legacySalesAnalysis.includes("saveModule('cashreport',latest,{verify:true})"));

const requiredTabs = [
  'راهنما و ورک‌فلو', 'موجودی و سفارش', 'ارزش روز موجودی', 'دریافت کالا',
  'ثبت فروش', 'محل‌ها و نگاشت‌ها', 'انتقال کالا', 'پرتی و ضایعات',
  'شمارش دوره‌ای', 'بهای تمام‌شده و بستن دوره', 'مغایرت و گردش', 'گزارش‌ها'
];
const coreNav = coreInventory.match(/function nav\(\)[\s\S]*?function externalBody/)?.[0] || '';
check('Inventory core has exactly 12 fixed tabs', requiredTabs.every((label) => coreNav.includes(label)) && (coreNav.match(/\['(?:workflow|overview|valuation|receipts|sales|locations|transfer|waste|stock|cost|history|varianceReports)'/g) || []).length === 12);
check('Inventory direct sidebar link', menu.includes("{type:'link',label:'انبار و کنترل مصرف',icon:'📦',href:'inventory.html',coreInventory:true}"));
check('v10.9 script loaded on admin pages', ['index.html','inventory.html','pricing.html','suppliers.html','cash-report-admin.html','personnel.html'].every((file) => read(file).includes('40-rayo-v10-9-comprehensive.js?v=10.9.1')));
check('v10.9 CSS loaded on all HTML pages', fs.readdirSync(root).filter((name) => name.endsWith('.html')).every((file) => read(file).includes('04-v10-9-fixes.css?v=10.9.1')));
check('Inventory sales history internal tab', v109.includes('سوابق فروش‌های ثبت‌شده') && v109.includes("setSalesMode('history')"));
check('Inventory sales renamed', coreInventory.includes("['sales','ثبت فروش']") && inventoryV10.includes("['sales','ثبت فروش']"));
check('Weighted average is explanatory, not a disabled setting', inventoryV10.includes('روش محاسبه ثابت:') && !inventoryV10.includes('value="میانگین موزون (Weighted Average)" disabled'));
check('Operational consumables schema and report', pricing.includes("itemType:'RECIPE'") && pricing.includes('OPERATIONAL_CONSUMABLE') && v109.includes('operationalUsagePeriods') && config.includes("'operationalUsagePeriods'"));
check('Reorder and variance deep links', v109.includes('inventory.html?tab=overview&orderOnly=1') && v109.includes('inventory.html?tab=history&varianceOnly=1'));
check('Manual final menu price modal', pricing.includes('قیمت نهایی دلخواه') && pricing.includes('pcConfirmAppliedPrice'));
check('Menu and ingredient category management', pricing.includes('pcIngredientCategoryRows') && pricing.includes('pcAddIngredientCategoryRow') && pricing.includes('<select id="pc_m_category">'));
check('Supplier payment page and full detail', v109.includes('supplierPaymentView') && v109.includes('ثبت پرداخت جدید') && v109.includes('شماره شبا') && v109.includes('supplierLedger'));
check('Cash review status, note, filter and print', v109.includes('managementReviewStatus') && v109.includes('managementNote') && v109.includes('وضعیت بررسی') && v109.includes('printCash'));
check('Dashboard leave and advance requests', v109.includes('درخواست مرخصی جدید') && v109.includes('درخواست مساعده جدید'));
check('Staff Jalali range fix is self-contained', staffPanel.includes("Intl.DateTimeFormat('en-CA-u-ca-persian'") && !staffPanel.includes("typeof parseJDate==='function'?parseJDate"));
check('Sidebar version marker', v109.includes('Rayo Admin v10.9.1'));
check('Manual operation rate grouping', v109.includes("set_baseHourlyRate") && v109.includes("el.type='text'"));
check('v10.9.1 staffing patch loaded', personnelHtml.includes('41-staffing-needs-v10-9-1.js?v=10.9.1') && personnelHtml.includes('05-staffing-v10-9-1.css?v=10.9.1'));
check('Exact section-position matrix', staffing.includes("'بار':['باریستا','مدیر/سرپرست']") && staffing.includes("'صندوق':['صندوقدار','مدیر/سرپرست']") && !staffing.includes("'بار':['صندوقدار"));
check('Required placeholders in single form', staffing.includes('روز هفته *') && staffing.includes('شیفت *') && staffing.includes('سکشن اصلی *') && staffing.includes('<option value="">انتخاب کنید</option>'));
check('Save and continue action', staffing.includes('ذخیره و ادامه') && staffing.includes("saveRequirement('${id}',true)"));
check('Bulk staffing entry', staffing.includes('ثبت گروهی نیروی موردنیاز') && staffing.includes('rqb-count') && staffing.includes("dataset.dirty==='1'"));
check('Bulk blank values do not delete data', staffing.includes('خانه‌های خالی، اطلاعات قبلی را حذف نمی‌کنند') && !staffing.includes('staffingRequirements.splice'));
check('Existing invalid rows are preserved and flagged', staffing.includes('هیچ رکوردی خودکار حذف یا اصلاح نشده است') && staffing.includes('نیازمند اصلاح'));
check('Parking removed from physical map', staffing.includes("filter(r=>r.section!=='پارکینگ')") && staffing.includes('پوزیشن مستقل؛ خارج از نقشه فیزیکی'));
check('Failed save restores in-memory state', staffing.includes('const before=structuredClone(state)') && staffing.includes('state=before'));
check('No new backend module required', !config.includes('staffingNeeds:') && config.includes("hr:{arrays:['personnel','weeklyPlans','monthlyPlans','shiftRecords','monthlyAdjustments','tipGroups','penaltiesRewards','delays','payments','consumptions','leaves','leaveRequests','payrollClosures','staffingRequirements'"));

async function gatewayRuntimeTest() {
  let stored = {};
  let mode = 'empty';
  let seedReads = 0;
  let posts = 0;
  const context = {
    console,
    setTimeout,
    clearTimeout,
    AbortController,
    URL,
    structuredClone,
    location: { pathname: '/personnel.html' },
    document: { getElementById: () => null },
    fetch: async (url, options = {}) => {
      const method = options.method || 'GET';
      if (String(url).includes('/seed/')) seedReads += 1;
      if (method === 'POST') {
        posts += 1;
        stored = JSON.parse(options.body);
        mode = 'stored';
        return { ok: true, status: 200, text: async () => 'ok' };
      }
      if (mode === 'error') return { ok: false, status: 500, text: async () => '{"Message":"An error has occurred."}' };
      const body = mode === 'stored' ? stored : mode === 'live' ? { meta: { initialized: true }, suppliers: [{ id: 'SUP-1' }], items: [], supplierItems: [], purchaseRequests: [], changeLog: [], lists: {} } : {};
      return { ok: true, status: 200, text: async () => JSON.stringify(body) };
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read('js/app-config.js'), context);
  vm.runInContext(config, context);
  const gateway = context.RAYO_API_GATEWAY;
  await gateway.loadModule('suppliers');
  check('Runtime empty module is uninitialized', gateway.getModuleStatus('suppliers').initialized === false);
  let blocked = false;
  try { await gateway.saveModule('suppliers', { suppliers: [] }); } catch (_) { blocked = true; }
  check('Runtime normal save before initialize is blocked', blocked && posts === 0);
  check('Runtime normal load does not read Seed', seedReads === 0);
  const initial = { meta: { initialized: true }, suppliers: [{ id: 'SUP-INIT' }], items: [], supplierItems: [], purchaseRequests: [], changeLog: [], lists: {} };
  await gateway.saveModule('suppliers', initial, { verify: true, allowInitialize: true });
  check('Runtime explicit initialize saves and verifies', posts === 1 && stored.meta.serverSaveToken === initial.meta.serverSaveToken);
  mode = 'live';
  await gateway.loadModule('suppliers');
  const live = { meta: { initialized: true }, suppliers: [{ id: 'SUP-2' }], items: [], supplierItems: [], purchaseRequests: [], changeLog: [], lists: {} };
  await gateway.saveModule('suppliers', live, { verify: true });
  check('Runtime normal save after initialized live load succeeds', posts === 2);
}

gatewayRuntimeTest().then(() => {
  console.log(`PASS ${pass.length}`);
  for (const item of pass) console.log(`  ✓ ${item}`);
  if (fail.length) {
    console.error(`FAIL ${fail.length}`);
    for (const item of fail) console.error(`  ✗ ${item}`);
    process.exitCode = 1;
  } else {
    console.log('ALL CHECKS PASSED');
  }
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
