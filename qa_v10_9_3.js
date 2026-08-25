#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{spawnSync}=require('child_process');
const root=__dirname,read=f=>fs.readFileSync(path.join(root,f),'utf8'),pass=[],fail=[];
const check=(name,ok,detail='')=>(ok?pass:fail).push(`${name}${detail?' — '+detail:''}`);
for(const f of fs.readdirSync(path.join(root,'js')).filter(x=>x.endsWith('.js')).sort()){
  const r=spawnSync(process.execPath,['--check',path.join(root,'js',f)],{encoding:'utf8'});check(`JS syntax: ${f}`,r.status===0,(r.stderr||'').trim());
}
for(const f of [...fs.readdirSync(path.join(root,'seed')).filter(x=>x.endsWith('.json')).map(x=>'seed/'+x),'RAYO_DATA_MODEL_v10_8_0.json']){try{JSON.parse(read(f));check(`JSON parse: ${f}`,true)}catch(e){check(`JSON parse: ${f}`,false,e.message)}}
let refs=0;const missing=[];for(const f of fs.readdirSync(root).filter(x=>x.endsWith('.html'))){const h=read(f);for(const m of h.matchAll(/(?:src|href)=["']([^"']+)["']/g)){const x=m[1].split(/[?#]/)[0];if(!x||/^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(x))continue;refs++;if(!fs.existsSync(path.join(root,x)))missing.push(`${f}:${x}`)}}check('Local HTML references',missing.length===0,`${refs} checked; ${missing.length} missing`);
const html=fs.readdirSync(root).filter(x=>x.endsWith('.html')),patch=read('js/42-operations-v10-9-2.js'),css=read('css/06-operations-v10-9-2.css'),supMod=read('js/04-rayo-suppliers-admin-module.js'),access=read('js/25-user-management-v9-5-5.js'),config=read('js/config.js');
check('Build marker 10.9.3',read('js/app-config.js').includes("BUILD:'10.9.3'")&&config.includes("apiVersion:'10.9.3'"));
check('v10.9.3 CSS loaded on every HTML',html.every(f=>read(f).includes('06-operations-v10-9-2.css?v=10.9.3')));
check('v10.9.3 JS loaded after v10.9 on admin pages',['index.html','suppliers.html','cash-report-admin.html','personnel.html'].every(f=>{const h=read(f);return h.indexOf('42-operations-v10-9-2.js')>h.indexOf('40-rayo-v10-9-comprehensive.js')}));
check('Password eye has non-overlap left padding',css.includes('left:6px!important')&&css.includes('padding-left:50px!important'));
check('Access checkboxes use aligned flex labels',access.includes('um-permission-option')&&css.includes('align-items:center!important')&&css.includes('vertical-align:middle!important'));
check('Cash delete requires reason and exact confirmation',patch.includes("word!=='حذف'")&&patch.includes('v1092CashDeleteReason'));
check('Cash delete preserves audit metadata',patch.includes("action:'حذف گزارش صندوق با تأیید مدیر'")&&patch.includes('approvedBy:actor()')&&patch.includes('totalSales:'));
check('Cash delete rollback on failed save',patch.includes('st.reports=reportsBefore;st.changeLog=logBefore'));
check('Supplier workflow tabs exist',['میز سفارش‌گذاری','سفارش‌های ثبت‌شده','حساب و بدهی‌ها','ثبت پرداخت'].every(x=>patch.includes(x)));
check('Order desk reuses inventory analytics',patch.includes('RayoInventoryV10?.currentTotalPosition')&&patch.includes('RayoOpsAnalytics?.currentPosition'));
check('Supplier debt reuses inventory invoices/payments',patch.includes('inv?.purchaseInvoices')&&patch.includes('inv?.supplierPayments'));
check('Alternative suppliers and last price visible',patch.includes('تأمین‌کننده تعریف نشده')&&patch.includes('جایگزین')&&patch.includes('latestInvoicePrice'));
check('Order owner and supplier schedules editable',supMod.includes("name:'orderOwner'")&&supMod.includes("name:'orderDays'")&&supMod.includes("name:'deliveryDays'")&&supMod.includes("name:'deliveryTime'"));
check('Order delivery does not duplicate inventory receipts',patch.includes('موجودی را خودکار افزایش نمی‌دهد')&&!patch.includes('stockReceipts.push'));
check('Explicit supplier sync only',patch.includes('previewPricingSync')&&patch.includes('applyPricingSync')&&patch.includes('این عملیات هنگام Load اجرا نمی‌شود'));
check('Supplier sync has a dedicated visible tab',patch.includes("['sync','همگام‌سازی اقلام']")&&patch.includes("if(tab==='sync')return syncView()"));
check('Supplier list has top sync shortcut',supMod.includes("RayoV1092.supplierTab('sync')")&&supMod.includes('همگام‌سازی اقلام'));
check('Supplier items view has sync shortcut',patch.includes("if(tab==='items')")&&patch.includes("RayoV1092.supplierTab('sync')"));
check('Supplier sync downloads backup first',patch.indexOf('downloadJson(before')<patch.indexOf('sup.items=plan.items'));
check('Supplier sync rollback on failed save',patch.includes('Object.keys(sup).forEach(k=>delete sup[k]);Object.assign(sup,before)'));
check('Normal module load remains API-only',/async function loadOrBootstrap\(module\)[\s\S]*?return loadModule\(module\);/.test(config));
const invV10=read('js/32-inventory-cost-control-v10.js'),invNav=invV10.slice(invV10.indexOf('function nav()'),invV10.indexOf('function helpCard'));
check('Inventory stays exactly 12 tabs',(invNav.match(/\['(?:workflow|overview|valuation|receipts|sales|locations|transfer|waste|stock|cost|history|varianceReports)'/g)||[]).length===12);
const pricing=JSON.parse(read('seed/pricing-data.seed.json')),sup=JSON.parse(read('seed/suppliers-data.seed.json')),pc=new Set(pricing.ingredients.map(x=>String(x.code))),sc=new Set(sup.items.map(x=>String(x.code)));
check('Supplier seed contains 615 unique items',sup.items.length===615&&sc.size===615);
check('All 536 Sepidz pricing codes preserved',[...pc].every(x=>sc.has(x))&&sup.items.filter(x=>x.pricingIngredientId).length===536);
check('79 supplier-only items preserved',sup.items.filter(x=>!x.pricingIngredientId).length===79);
check('Supplier purchaseRequests remains existing module array',Array.isArray(sup.purchaseRequests)&&config.includes("'purchaseRequests'"));

async function gatewayTest(){let stored={},mode='live',posts=0,seedReads=0;const context={console,setTimeout,clearTimeout,AbortController,URL,structuredClone,location:{pathname:'/suppliers.html'},document:{getElementById:()=>null},fetch:async(url,o={})=>{if(String(url).includes('/seed/'))seedReads++;const module=new URL(url).searchParams.get('module');if((o.method||'GET')==='POST'){posts++;stored=JSON.parse(o.body);mode='stored';return{ok:true,status:200,text:async()=>JSON.stringify(stored)}}const body=mode==='stored'?stored:mode==='live'?{meta:{initialized:true},suppliers:[],items:[],supplierItems:[],purchaseRequests:[],changeLog:[],lists:{}}:{};return{ok:true,status:200,text:async()=>JSON.stringify(body)}}};context.window=context;vm.createContext(context);vm.runInContext(read('js/app-config.js'),context);vm.runInContext(config,context);const g=context.RAYO_API_GATEWAY;await g.loadModule('suppliers');await g.saveModule('suppliers',{meta:{initialized:true},suppliers:[],items:[],supplierItems:[],purchaseRequests:[],changeLog:[],lists:{}},{verify:true});check('Gateway live-load save succeeds with verification',posts===1&&!!stored.meta.serverSaveToken);check('Gateway normal load never reads Seed',seedReads===0);mode='empty';await g.loadModule('pricing');let blocked=false;try{await g.saveModule('pricing',{ingredients:[]})}catch(_){blocked=true}check('Gateway blocks save of uninitialized empty module',blocked)}
gatewayTest().then(()=>{console.log(`PASS ${pass.length}`);pass.forEach(x=>console.log('  ✓ '+x));if(fail.length){console.error(`FAIL ${fail.length}`);fail.forEach(x=>console.error('  ✗ '+x));process.exitCode=1}else console.log('ALL CHECKS PASSED')}).catch(e=>{console.error(e);process.exit(1)});
