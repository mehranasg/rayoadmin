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

check('Build marker', read('js/app-config.js').includes("BUILD:'10.8.1'"));
check('HTML cache marker', fs.readdirSync(root).filter((name) => name.endsWith('.html')).every((file) => !read(file).includes('v=10.8.0')));
check('Normal load is API-only', /async function loadOrBootstrap\(module\)[\s\S]*?return loadModule\(module\);/.test(config));
check('Uninitialized save guard', config.includes("!initialized&&!allowInitialize"));
check('Live-load save guard', config.includes("!liveConfirmed&&!allowUnconfirmedWrite"));
check('Save token is mandatory', config.includes('data.meta.serverSaveToken=') && /if\(sentToken\)return !!receivedToken&&sentToken===receivedToken/.test(config));
check('Manual initialize confirmation', manual.includes("token!=='INITIALIZE'"));
check('Manual reset confirmation', manual.includes("token!=='RESET FROM SEED'"));
check('Manual reset backup first', manual.indexOf('downloadJson(') < manual.indexOf("token=prompt('برای تأیید نهایی"));
check('Data management dedicated view registered', manual.includes("views.dataManagement=dataManagementView"));
check('Data management route registered', shell.includes("'dataManagement'") && menu.includes('personnel.html?view=dataManagement'));
check('Data management script loaded', personnelHtml.includes('39-manual-initial-data-v10-8.js?v=10.8.1'));
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
  'فروش روزانه', 'محل‌ها و نگاشت‌ها', 'انتقال کالا', 'پرتی و ضایعات',
  'شمارش دوره‌ای', 'بهای تمام‌شده و بستن دوره', 'مغایرت و گردش', 'گزارش‌ها'
];
const coreNav = coreInventory.match(/function nav\(\)[\s\S]*?function externalBody/)?.[0] || '';
check('Inventory core has exactly 12 fixed tabs', requiredTabs.every((label) => coreNav.includes(label)) && (coreNav.match(/\['(?:workflow|overview|valuation|receipts|sales|locations|transfer|waste|stock|cost|history|varianceReports)'/g) || []).length === 12);
check('Inventory direct sidebar link', menu.includes("{type:'link',label:'انبار و کنترل مصرف',icon:'📦',href:'inventory.html',coreInventory:true}"));

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
