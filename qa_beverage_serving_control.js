'use strict';
// QA: daily beverage control (js/46) and serving-item counts/breakage (js/12). Node/VM with mocked DOM and gateway.
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const read=f=>fs.readFileSync(f,'utf8');

function el(value=''){return {value,textContent:'',disabled:false,dataset:{},className:''}}
function inventoryHarness(){
 const items=[{id:'coke',name:'نوشابه کوکا',code:'B1',recipeUnit:'عدد'},{id:'water',name:'آب معدنی',code:'B2',recipeUnit:'عدد'},{id:'flour',name:'آرد',recipeUnit:'گرم'}];
 const state={settings:{mainLocationId:'main',beverageControl:{itemIds:['coke','water']}},stocktakes:[],changeLog:[],unknownRoot:{keep:1}};
 const els={v1012BevDate:el('۱۴۰۵/۰۷/۰۸'),v1012BevSheet:el('12'),v1012BevCM:el('علی'),v1012BevCE:el('رضا'),v1012BevCN:el('انباردار'),v1012BevNote:el(''),v1012BevFields:el(),v1012BevStatus:el()};
 const rows={0:[],1:[]};const setRow=(i,vals)=>{rows[i]=Object.entries(vals).map(([f,v])=>({value:String(v),dataset:{bevField:f}}))};
 let saves=0,failure=null;const msgs=[];
 const c={console,URL,URLSearchParams,location:{pathname:'/inventory.html',search:'?tab=count&sub=beverage',href:''},history:{replaceState(){},pushState(){}},sessionStorage:{getItem:()=> 'admin'},prompt:()=> 'اشتباه ثبت',
  document:{readyState:'loading',querySelector:()=>null,createElement:()=>({}),head:{appendChild(){}},addEventListener(){},getElementById:id=>els[id],querySelectorAll:s=>{const m=s.match(/^\[data-bev-row="(\d+)"\]$/);return m?(rows[m[1]]||[]):[]},documentElement:{dataset:{}}},
  setTimeout(){},getInventoryState:()=>state,getPricingState:()=>({ingredients:items}),RayoJalali:{today:()=> '1405/07/08'},addJDays:(d,n)=>{const [y,m,x]=d.split('/').map(Number);const v=x+n;return `${y}/${String(m).padStart(2,'0')}/${String(v).padStart(2,'0')}`},
  RayoInventoryV10:{isReady:()=>true},renderView(){},toast:(m,e)=>msgs.push([m,!!e]),closeModal(){},
  RAYO_API_GATEWAY:{createRequestId:()=>`R${saves+1}`,saveModule:async(module,doc)=>{assert.equal(module,'inventory');saves++;if(failure)throw failure;return {ok:true}},loadModule:async()=>{throw Error('offline')}}};
 c.window=c;vm.createContext(c);vm.runInContext(read('js/46-inventory-operations-v10-12.js'),c);
 return {c,api:c.RayoInventoryV1012,state,els,setRow,msgs,saves:()=>saves,fail:e=>failure=e};
}

async function assetsHarness(doc,loadFails=false){
 const server=JSON.parse(JSON.stringify(doc));let saves=0;const msgs=[];
 const c={console,URLSearchParams,location:{pathname:'/assets.html',search:''},sessionStorage:{getItem:()=> 'admin'},prompt:()=> 'ثبت اشتباه',confirm:()=>true,
  views:{},titles:{},currentView:'assets',renderView(){},toast:(m,e)=>msgs.push([m,!!e]),pageHead:t=>`<h1>${t}</h1>`,closeModal(){},todayJ:()=> '1405/07/08',jMonthLength:(y,m)=>m<=6?31:30,
  document:{querySelector:s=>s==='.sidebar'?{appendChild(){}}:null,querySelectorAll:()=>[],createElement:()=>({dataset:{}}),getElementById:()=>null},
  RAYO_API_GATEWAY:{loadOrBootstrap:async()=>{if(loadFails)throw Error('HTTP 500');return JSON.parse(JSON.stringify(server))},saveModule:async(m,d)=>{saves++;Object.assign(server,JSON.parse(JSON.stringify(d)))}},RAYO_CONFIG:{}};
 c.window=c;vm.createContext(c);vm.runInContext(read('js/12-rayo-assets-module.js'),c);
 for(let i=0;i<50&&!c.__RAYO_ASSETS__.isLoaded()&&!c.__RAYO_ASSETS__.loadError();i++)await new Promise(r=>setImmediate(r));
 return {c,server,msgs,saves:()=>saves};
}

(async()=>{
 let groups=0;const test=async(name,fn)=>{await fn();groups++;console.log('PASS '+name)};

 await test('beverage math: shift, daily and overnight variance; blank count is incomplete, blank flow is zero',()=>{
  const {api}=inventoryHarness();
  const line={morningUpper:10,morningLower:5,eveningUpper:8,eveningLower:5,nightUpper:6,nightLower:4,inMorning:6,inEvening:null,salesMorning:4,salesEvening:3,nonSaleMorning:1,nonSaleEvening:null};
  const m=api.bevLineMetrics(line,{morningUpper:9,morningLower:0});
  assert.equal(m.shiftMorning,-3,'evening 13 vs expected 15+6-4-1=16');
  assert.equal(m.shiftEvening,0,'night 10 vs expected 13-3=10');
  assert.equal(m.daily,-3,'daily = sum of shift variances');
  assert.equal(m.overnight,-1,'next morning 9 vs night 10');assert.equal(m.overnightUpper,3);assert.equal(m.overnightLower,-4);
  const partial=api.bevLineMetrics({...line,nightLower:null});
  assert.equal(partial.complete,false);assert.equal(partial.daily,null,'a blank fridge count is never treated as zero');
  assert.equal(api.bevLineMetrics({...line,eveningUpper:null}).daily,-3,'missing evening handover does not block the daily result');
 });

 await test('beverage save: one record per date with snapshots, revision on edit, audit, unknown fields kept, failed save restores',async()=>{
  const t=inventoryHarness();assert.equal(t.saves(),0,'loading the module never saves');
  t.setRow(0,{morningUpper:10,morningLower:5,nightUpper:6,nightLower:4,salesMorning:'۴',salesEvening:3,inMorning:''});
  await t.api.bevSave();
  assert.equal(t.saves(),1);const rec=t.state.beverageDailyControls[0];
  assert.equal(rec.date,'1405/07/08');assert.equal(rec.lines.length,1,'an untouched row is not stored');
  assert.equal(rec.lines[0].itemNameSnapshot,'نوشابه کوکا');assert.equal(rec.lines[0].salesMorning,4,'Persian digits parsed');assert.equal(rec.lines[0].inMorning,null,'blank stays null');
  assert.equal(rec.counters.night,'انباردار');assert.deepEqual(t.state.unknownRoot,{keep:1});
  t.setRow(0,{morningUpper:10,morningLower:5,nightUpper:7,nightLower:4});await t.api.bevSave();
  assert.equal(t.state.beverageDailyControls.length,1,'same date updates the record instead of duplicating');
  assert.equal(rec.lines[0].nightUpper,7);assert.equal(rec.revisions.length,1);assert.equal(rec.revisions[0].lines[0].nightUpper,6,'previous version kept');
  assert(t.state.changeLog.some(x=>x.entityId===rec.id));
  t.setRow(0,{morningUpper:'x'});await t.api.bevSave();assert.equal(t.saves(),2,'invalid number blocks save');
  t.setRow(0,{morningUpper:1,morningLower:1,nightUpper:1,nightLower:1});t.fail(Object.assign(Error('HTTP 500'),{code:'http_error'}));await t.api.bevSave();
  assert.equal(t.state.beverageDailyControls[0].lines[0].nightUpper,7,'failed save restores the previous state');
  t.fail(null);t.els.v1012BevDate.value='1405/07/09';t.setRow(0,{morningUpper:1});await t.api.bevSave();
  assert.equal(t.state.beverageDailyControls.length,1,'a future date is rejected');
  await t.api.bevVoid();const voided=t.state.beverageDailyControls[0];assert.equal(voided.status,'void');assert.equal(voided.voidReason,'اشتباه ثبت');assert.equal(t.state.beverageDailyControls.length,1,'void keeps history');
 });

 await test('beverage day metrics and dashboard card use only live records',()=>{
  const t=inventoryHarness();
  t.state.beverageDailyControls=[{id:'a',date:'1405/07/07',status:'posted',lines:[{ingredientId:'coke',morningUpper:5,morningLower:5,nightUpper:3,nightLower:1,salesMorning:2,salesEvening:2},{ingredientId:'water',morningUpper:4,morningLower:null,nightUpper:1,nightLower:1}]},{id:'b',date:'1405/07/08',status:'posted',lines:[{ingredientId:'coke',morningUpper:2,morningLower:3,nightUpper:1,nightLower:1}]},{id:'v',date:'1405/07/06',status:'void',lines:[{ingredientId:'coke',morningUpper:1,morningLower:1,nightUpper:9,nightLower:9}]}];
  const d=t.api.bevDayMetrics(t.state.beverageDailyControls[0]);
  assert.equal(d.net,-2);assert.equal(d.shortage,2);assert.equal(d.incomplete,1);assert.equal(d.overnight,1,'next morning 5 vs night 4');
  const html=t.api.bevDashboardCard();
  assert(html.includes('کنترل روزانه نوشیدنی و اقلام سرو')&&html.includes('inventory.html?tab=count&sub=beverage'));
  const quick=fs.readFileSync(require('path').join(__dirname,'js/00-base.js'),'utf8');
  assert(quick.includes('assets.html?panel=count')&&quick.includes('assets.html?panel=events')&&quick.includes('RayoInventoryV1012.bevOpenModal()'),'dashboard quick access opens the beverage form in place and links breakage/serving count');
  assert(html.includes('گزارش مغایرت نوشیدنی')&&html.includes('لیست مغایرت نوشیدنی')&&html.includes('نمودار مغایرت'),'report card with two tabs');
  assert(html.includes('1405/07/02')&&html.includes('فرم ثبت نشده'),'dashboard defaults to the last 7 days and lists missing days');
  t.api.bevTab('chart');let chart=t.api.bevReport();
  assert(chart.includes('<polyline class="line"')&&chart.includes('<circle class="dot neg"')&&chart.includes('همه نوشیدنی‌ها'),'line chart of the total');
  assert(!chart.includes('<table'),'chart tab replaces the list');
  t.api.bevRangeSet('item','water');chart=t.api.bevReport();
  assert(chart.includes('— آب معدنی')&&chart.includes('مغایرت خالص روزانه آب معدنی'),'dropdown filters the chart to one beverage');
  t.api.bevRangeSet('item','');t.api.bevRangeSet('preset',30);assert(t.api.bevReport().includes('1405/07/08'));
 });

 await test('settings search hides non-matching rows even though rows use display:flex',()=>{
  const t=inventoryHarness(),rows=[{dataset:{search:'نوشابه کوکا b1'},style:{}},{dataset:{search:'آرد'},style:{}}];
  t.c.document.querySelectorAll=s=>s==='[data-bev-opt]'?rows:[];
  t.api.bevSettingsFilter('نوشابه');assert.equal(rows[0].style.display,'flex');assert.equal(rows[1].style.display,'none');
  t.api.bevSettingsFilter('');assert(rows.every(r=>r.style.display==='flex'));
 });

 await test('staff panel: permission gate, blind form, one submission per date, then read-only for staff',async()=>{
  const hr={personnel:[{id:'P1',name:'سارا',status:'فعال',username:'sara',userAccess:{enabled:true,permissions:{beverageControl:true}}},{id:'P2',name:'نیما',status:'فعال',userAccess:{enabled:true,permissions:{}}}],lists:{}};
  const server={hr,pricing:{ingredients:[{id:'coke',name:'نوشابه کوکا',recipeUnit:'عدد'},{id:'water',name:'آب معدنی'}]},inventory:{settings:{beverageControl:{itemIds:['coke','water']}},changeLog:[],keepMe:{x:1}},suppliers:{},assets:{}};
  const run=async personnelId=>{const els={},get=id=>els[id]||(els[id]={id,value:'',textContent:'',innerHTML:'',dataset:{},classList:{add(){},remove(){}},disabled:false,appendChild(x){(this.children||(this.children=[])).push(x)}});let saves=0;const toasts=[],inputs=[];
   const c={console,URLSearchParams,location:{pathname:'/personel/beverage-control.html',replace:u=>{c.redirect=u}},sessionStorage:{getItem:()=>JSON.stringify({personnelId}),removeItem(){}},innerWidth:1200,
    document:{body:{dataset:{staffView:'beverageControl'},appendChild(){}},getElementById:get,querySelectorAll:s=>{const m=s.match(/^\[data-st-bev="(.+)"\]$/);return m?inputs.filter(x=>x.dataset.stBev===m[1]):[]},querySelector:()=>null,createElement:()=>({classList:{add(){},remove(){}}}),addEventListener(){}},
    setTimeout:(f)=>{},RayoJalali:{today:()=> '1405/07/08'},toast(){},
    RAYO_API_GATEWAY:{loadOrBootstrap:async m=>JSON.parse(JSON.stringify(server[m])),saveModule:async(m,d)=>{saves++;server[m]=JSON.parse(JSON.stringify(d))}}};
   c.window=c;vm.createContext(c);vm.runInContext(read('js/22-staff-panel.js'),c);await c.staffInit();
   return {c,get,inputs,saves:()=>saves};};
  const denied=await run('P2');assert.equal(denied.c.redirect,'index.html?denied=1','staff without permission cannot open the page');
  const t=await run('P1');let html=t.get('staffView').innerHTML;
  assert(html.includes('فرم روزانه نوشیدنی')&&html.includes('data-st-bev-field="nightUpper"'));
  assert(!html.includes('مغایرت (')&&!html.includes('شب تا صبح'),'blind form: no variance shown to staff');
  t.get('stBevDate').value='۱۴۰۵/۰۷/۰۸';t.get('stBevCN').value='سارا';
  for(const [k,v] of Object.entries({morningUpper:'10',morningLower:'5',nightUpper:'۶',nightLower:'4',salesMorning:'3'}))t.inputs.push({value:v,dataset:{stBev:'coke',stBevField:k}});
  t.inputs.push({value:'',dataset:{stBev:'water',stBevField:'morningUpper'}});
  await t.c.staffSaveBeverage();
  const recs=server.inventory.beverageDailyControls;assert.equal(t.saves(),1);assert.equal(recs.length,1);
  assert.equal(recs[0].source,'staff');assert.equal(recs[0].createdByPersonnelId,'P1');assert.equal(recs[0].lines.length,1,'empty beverage is skipped');assert.equal(recs[0].lines[0].nightUpper,6);assert.equal(recs[0].lines[0].inMorning,null);
  assert.deepEqual(server.inventory.keepMe,{x:1},'unknown inventory fields kept');
  html=t.get('staffView').innerHTML;assert(html.includes('اصلاح فقط توسط مدیر')&&!html.includes('id="stBevSave"'),'after submit the date is read-only for staff');
  await t.c.staffSaveBeverage();assert.equal(t.saves(),1,'second submission for the same date is refused');
  assert.equal(server.inventory.beverageDailyControls.length,1);
 });

 const baseAssets={meta:{},settings:{},lists:{categories:['ظروف و سرو'],quantityEventTypes:['افزایش موجودی','شکستگی','مفقودی','خروج از رده','اصلاح موجودی']},
  assets:[{id:'AST-0001',trackingMode:'quantity',name:'چنگال',category:'ظروف و سرو',unit:'عدد',initialQuantity:100,minimumRequired:80,status:'فعال',customField:'keep'},{id:'AST-0002',trackingMode:'quantity',name:'لیوان',category:'ظروف و سرو',unit:'عدد',initialQuantity:50,minimumRequired:10,status:'فعال'}],
  quantityTransactions:[{id:'QTY-0001',assetId:'AST-0001',date:'1405/07/01',type:'شکستگی',quantity:5,effect:-5,sourceIncidentId:'AINC-1'}],
  assetIncidents:[{id:'AINC-0001',assetId:'AST-0002',assetName:'لیوان',date:'1405/07/02',type:'شکستگی',quantity:1,status:'جدید'}],counts:[],maintenanceRecords:[],changeLog:[]};

 await test('assets: unknown fields survive normalization; failed load shows an error and never becomes an empty working copy',async()=>{
  const t=await assetsHarness(baseAssets);
  const s=t.c.getAssetsState();
  assert.equal(s.assets[0].customField,'keep');assert.equal(s.quantityTransactions[0].sourceIncidentId,'AINC-1');assert.equal(s.assetIncidents[0].assetName,'لیوان');
  const f=await assetsHarness(baseAssets,true);
  assert(f.c.views.assets().includes('بارگذاری اطلاعات اموال از سرور انجام نشد'));assert.equal(f.c.__RAYO_ASSETS__.isLoaded(),false);assert.equal(f.saves(),0);
 });

 await test('assets: void instead of delete, voided events stop counting, archive instead of deleting an item with history',async()=>{
  const t=await assetsHarness(baseAssets);const s=()=>t.c.getAssetsState();
  assert.equal(t.c.__RAYO_ASSETS__.currentQuantity('AST-0001'),95);
  await t.c.amDeleteTransaction('QTY-0001');
  assert.equal(s().quantityTransactions.length,1,'record kept');assert.equal(s().quantityTransactions[0].status,'void');
  assert.equal(t.c.__RAYO_ASSETS__.currentQuantity('AST-0001'),100,'void no longer affects quantity');
  assert.equal(t.server.quantityTransactions[0].status,'void','persisted');
  await t.c.amDeleteAsset('AST-0001');assert(s().assets.find(a=>a.id==='AST-0001').isArchived,'item with history is archived');
 });

 await test('assets: weekly group count stores counts + linked adjustments in one save; blank is skipped; later events block backdating',async()=>{
  const t=await assetsHarness(baseAssets);const s=()=>t.c.getAssetsState();
  const inputs=[{value:'۹۰',dataset:{ambCount:'AST-0001'}},{value:'',dataset:{ambCount:'AST-0002'}}],ids={amb_date:{value:'1405/07/08'},amb_person:{value:'مریم'},amb_save:{disabled:false}};
  t.c.document.getElementById=id=>ids[id]||null;t.c.document.querySelectorAll=sel=>sel==='[data-amb-count]'?inputs:[];t.c.document.querySelector=sel=>sel==='.sidebar'?{}:null;
  const before=t.saves();await t.c.amSaveBulkCount();
  assert.equal(t.saves(),before+1,'one save for the whole sheet');
  assert.equal(s().counts.length,1,'blank row is not counted');assert.equal(s().counts[0].countedQuantity,90);assert.equal(s().counts[0].variance,-5);
  const adj=s().quantityTransactions.find(x=>x.sourceCountId===s().counts[0].id);assert.equal(adj.effect,-5);assert.equal(t.c.__RAYO_ASSETS__.currentQuantity('AST-0001'),90);
  ids.amb_date.value='1405/06/20';inputs[0].value='70';await t.c.amSaveBulkCount();
  assert.equal(s().counts.length,1,'a count dated before existing events is rejected');
  assert(t.msgs.some(([m,e])=>e&&m.includes('رویداد با تاریخ بعد')));
  const sum=t.c.__RAYO_ASSETS__.serviceSummary();assert.equal(sum.lastCount,'1405/07/08');assert.equal(sum.low.length,0,'90 is above minimum 80');
 });

 console.log(`PASS ${groups} beverage & serving control groups`);
})().catch(e=>{console.error(e);process.exit(1)});
