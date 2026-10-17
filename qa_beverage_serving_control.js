'use strict';
// QA: daily soft-drink control (shared window.RayoBeverageControl in js/config.js, admin js/46, staff js/22) and
// serving-item counts/breakage (js/12). Node/VM with mocked DOM and gateway.
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const read=f=>fs.readFileSync(f,'utf8'),clone=x=>JSON.parse(JSON.stringify(x));
const ENV={API_ORIGIN:'https://example.test',API_PREFIX:'/api/v1.0',API_CONTROLLER:'/RayoData',TIMEOUT_MS:200};
const tick=()=>new Promise(r=>setImmediate(r));

// Lazily created fake elements: every getElementById returns a stable object with the properties the forms use.
function fakeDom(){const els={},get=id=>els[id]||(els[id]={id,value:'',textContent:'',innerHTML:'',outerHTML:'',title:'',dataset:{},disabled:false,required:false,attrs:{},classList:{add(){},remove(){},toggle(){}},setAttribute(k,v){this.attrs[k]=String(v)},removeAttribute(k){delete this.attrs[k]},appendChild(x){(this.children||(this.children=[])).push(x)}});return{els,get}}
// A gateway over one in-memory server document. saveModule mirrors the real Save: it returns the re-read document.
function fakeGateway(server,{delay}={}){const g={saves:0,loads:0,fail:null,loadFail:null,createRequestId:()=>`R${++g.ids}`,ids:0,
 loadModule:async m=>{g.loads++;if(delay)await delay(m);if(g.loadFail)throw g.loadFail;return clone(server[m])},
 saveModule:async(m,d)=>{g.saves++;await tick();if(g.fail)throw g.fail;server[m]=clone(d);return{ok:true,verified:true,checked:clone(server[m])}}};
 g.loadOrBootstrap=g.loadModule;return g}
function sharedContext(extra={}){const dom=fakeDom(),c={console,URL,URLSearchParams,Intl,Date,Math,JSON,Promise,setTimeout,clearTimeout,location:{pathname:'/x.html',search:'',href:''},sessionStorage:{getItem:()=> 'admin',removeItem(){}},document:{readyState:'complete',head:{appendChild(){}},body:{dataset:{},appendChild(){}},getElementById:dom.get,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({dataset:{},classList:{add(){},remove(){}},style:{}}),addEventListener(){},documentElement:{dataset:{}}},RAYO_ENV:ENV,...extra};
 c.window=c;c.globalThis=c;vm.createContext(c);vm.runInContext(read('js/config.js'),c,{filename:'js/config.js'});return{c,dom}}

const ITEMS=[{id:'water',name:'آب',code:'B1',recipeUnit:'عدد'},{id:'coke',name:'کوکا',code:'B2',recipeUnit:'عدد'},{id:'zir',name:'زیر',code:'B3',recipeUnit:'عدد'},{id:'flour',name:'آرد',recipeUnit:'گرم'}];
function inventoryHarness(serverInv){
 const server={inventory:serverInv||{settings:{mainLocationId:'main',beverageControl:{itemIds:['water','coke','zir']}},stocktakes:[],changeLog:[],unknownRoot:{keep:1}}};
 const {c,dom}=sharedContext({setTimeout(){},getPricingState:()=>({ingredients:ITEMS}),RayoJalali:{today:()=> '1405/07/08'},RayoInventoryV10:{isReady:()=>true,openModal(t,b){c.modal={title:t,body:b}}},renderView(){},toast:(m,e)=>msgs.push([m,!!e]),closeModal(){},confirm:()=>confirmAnswer});
 const msgs=[];let confirmAnswer=true;const rows={};
 c.document.readyState='loading';c.location.pathname='/inventory.html';c.location.search='?tab=count&sub=beverage';c.history={replaceState(){},pushState(){}};c.prompt=()=> 'اشتباه ثبت';
 c.document.querySelectorAll=s=>{const m=s.match(/^\[data-bev-row="(\d+)"\]$/);return m?(rows[m[1]]||[]):[]};
 const gw=fakeGateway(server);c.RAYO_API_GATEWAY=gw;
 const local=clone(server.inventory);c.getInventoryState=()=>local;
 vm.runInContext(read('js/46-inventory-operations-v10-12.js'),c);
 c.RayoBeverageControl.today=()=> '1405/07/08';dom.get('v1012BevDate').value='۱۴۰۵/۰۷/۰۸';
 const setRow=(i,vals)=>{rows[i]=Object.entries(vals).map(([f,v])=>({value:String(v),dataset:{bevField:f},setAttribute(){}}))};
 return{c,api:c.RayoInventoryV1012,R:c.RayoBeverageControl,server,local,gw,dom,setRow,msgs,confirm:v=>{confirmAnswer=v}};
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

 await test('formula: requested example, blank is not zero, overnight uses the previous calendar day',()=>{
  const R=sharedContext().c.RayoBeverageControl;
  const today={formulaVersion:R.FORMULA,morningUpper:20,morningLower:10,inflow:10,nonSale:2,sales:16,nightUpper:12,nightLower:8};
  const m=R.metrics(today,null);
  assert.equal(m.morning,30);assert.equal(m.expectedNight,22,'(30+10)-(2+16)');assert.equal(m.night,20);assert.equal(m.daily,2,'positive daily variance = shortage');
  assert.equal(m.overnight,null,'no previous night is not a zero variance');assert(m.missingOvernight.includes('مانده شب روز قبل'));
  const next=R.metrics({formulaVersion:R.FORMULA,morningUpper:11,morningLower:8},today);
  assert.equal(next.overnight,-1,'19 next morning − 20 previous night');
  assert(R.dailyText(2).includes('کسری')&&R.dailyText(-1).includes('اضافه')&&R.overnightText(-1).includes('کاهش'));
  const blank=R.metrics({...today,inflow:null});assert.equal(blank.expectedNight,null);assert.equal(blank.daily,null);assert.deepEqual(blank.missingExpected,['ورودی روز']);
  const zero=R.metrics({...today,inflow:0});assert.equal(zero.expectedNight,12,'explicit zero is a value');assert.equal(zero.daily,-8);
  assert.equal(R.metrics({...today,nightLower:null}).daily,null,'one fridge missing is incomplete, never zero');
  assert.equal(R.metrics({formulaVersion:R.FORMULA,morningUpper:5,morningLower:5}).expectedNight,null,'morning-only stage is allowed and not computable yet');
  assert.equal(R.parseCount('۱۲'),12);assert.equal(R.parseCount(''),null);assert.equal(R.parseCount('0'),0);assert(Number.isNaN(R.parseCount('1.5')));assert(Number.isNaN(R.parseCount('-1')));assert(Number.isNaN(R.parseCount('x')));
  const r=R.read({nonSale:'2',nonSaleReason:''});assert(r.errors.some(e=>e.includes('علت')),'non-sale > 0 needs a reason');assert.equal(R.read({nonSale:'0'}).errors.length,0);
  assert.equal(R.read({inflow:'۳'}).values.inflow,3);assert.equal(R.read({}).values.sales,null,'blank stays null');
 });

 await test('calendar: Tehran today, month/year edges and esfand leap days; previous day is calendar based',()=>{
  const R=sharedContext().c.RayoBeverageControl;
  assert(/^14\d\d\/\d\d\/\d\d$/.test(R.today()));
  assert.equal(R.addDays('1405/07/01',-1),'1405/06/31');assert.equal(R.addDays('1405/06/31',1),'1405/07/01');assert.equal(R.addDays('1405/08/01',-1),'1405/07/30');
  assert.equal(R.addDays('1405/01/01',-1),'1404/12/29');assert.equal(R.addDays('1404/01/01',-1),'1403/12/30','1403 is a leap year');assert.equal(R.addDays('1403/12/30',1),'1404/01/01');
  assert.equal(R.normDate('۱۴۰۵/۷/۹'),'1405/07/09');assert.equal(R.normDate('1404/12/30'),'','30 esfand 1404 does not exist');assert.equal(R.normDate('1405/07/31'),'');
  const doc={beverageDailyControls:[{id:'a',date:'1405/06/29',status:'posted',lines:[{ingredientId:'coke',nightUpper:5,nightLower:5}]},{id:'b',date:'1404/12/29',status:'posted',lines:[{ingredientId:'coke',nightUpper:1,nightLower:2}]},{id:'v',date:'1405/06/31',status:'void',lines:[{ingredientId:'coke',nightUpper:9,nightLower:9}]}]};
  assert.equal(R.prevLineOf(doc,'1405/07/01','coke'),null,'06/31 has no live record: never falls back to the last day with data');
  assert.equal(R.values(R.prevLineOf(doc,'1405/01/01','coke')).night,3,'year boundary');
 });

 await test('legacy lines: unsplit totals stay totals, morning/evening flows are summed, all-blank flows stay unknown',()=>{
  const R=sharedContext().c.RayoBeverageControl;
  const v=R.values({morningUpper:4,morningLower:6,nightTotal:7,inMorning:3,inEvening:null,salesMorning:2,salesEvening:1});
  assert.equal(v.night,7);assert.equal(v.nightSplit,false,'a total-only night is not split into upper/lower');assert.equal(v.nightUpper,null);
  assert.equal(v.inflow,3);assert.equal(v.sales,3);assert.equal(v.nonSale,null,'no legacy non-sale part means not entered');
  assert.equal(R.metrics({morningUpper:4,morningLower:6,nightTotal:7,inMorning:3,salesMorning:3,nonSaleMorning:0}).daily,3);
 });

 await test('merge: one line per date and beverage, stage identity, last editor, revisions, conflicts and unknown fields',()=>{
  const R=sharedContext().c.RayoBeverageControl,doc={keep:{x:1},beverageDailyControls:[],changeLog:[]},coke=ITEMS[1];
  const sara={type:'staff',personnelId:'P1',name:'سارا'},nima={type:'staff',personnelId:'P3',name:'نیما'};
  const r1=R.applyEdit(doc,{date:'1405/07/08',item:coke,values:R.read({morningUpper:'20',morningLower:'10'}).values,actor:sara,at:'2026-10-10T05:00:00Z',baseline:'',recordId:'BEV-1'});
  assert(r1.changed&&r1.created);const line=()=>R.lineOf(R.recordOf(doc,'1405/07/08'),'coke');
  assert.equal(line().morningCountedBy.personnelId,'P1');assert.equal(line().nightCountedBy,undefined);assert.equal(line().itemNameSnapshot,'کوکا');
  line().extraField='keep';
  const night=R.read({morningUpper:'20',morningLower:'10',inflow:'10',nonSale:'2',nonSaleReason:'پرسنلی',sales:'16',nightUpper:'12',nightLower:'8'}).values;
  assert.throws(()=>R.applyEdit(doc,{date:'1405/07/08',item:coke,values:night,actor:nima,at:'t2',baseline:''}),e=>e.code==='bev_conflict','a stale form cannot overwrite');
  R.applyEdit(doc,{date:'1405/07/08',item:coke,values:night,actor:nima,at:'2026-10-10T19:00:00Z',baseline:R.fingerprint(line())});
  assert.equal(doc.beverageDailyControls.length,1);assert.equal(R.recordOf(doc,'1405/07/08').lines.length,1,'no duplicate line');
  assert.equal(line().morningCountedBy.name,'سارا','night entry by another person keeps the morning counter');assert.equal(line().nightCountedBy.name,'نیما');
  assert.equal(line().createdBy.personnelId,'P1');assert.equal(line().updatedBy.personnelId,'P3');assert.equal(line().extraField,'keep');
  assert.equal(R.recordOf(doc,'1405/07/08').revisions.length,1);assert.equal(R.recordOf(doc,'1405/07/08').revisions[0].line.nightUpper,undefined);
  assert.equal(R.metrics(line()).daily,2);assert.deepEqual(doc.keep,{x:1});assert.equal(doc.changeLog.length,2);
  const same=R.applyEdit(doc,{date:'1405/07/08',item:coke,values:night,actor:sara,at:'t3',baseline:R.fingerprint(line())});assert.equal(same.changed,false,'unchanged values do not touch the record');assert.equal(line().updatedBy.personnelId,'P3');
  const legacy={beverageDailyControls:[{id:'L',date:'1405/07/01',status:'posted',sheetNumber:'12',counters:{morning:'علی',evening:'رضا'},lines:[{ingredientId:'coke',morningUpper:3,morningLower:3,nightTotal:5,inMorning:2,eveningUpper:4}]}]};
  const lv=R.formValues(R.lineOf(legacy.beverageDailyControls[0],'coke'));R.applyEdit(legacy,{date:'1405/07/01',item:coke,values:{...lv,sales:1},actor:sara,at:'t',baseline:R.fingerprint(legacy.beverageDailyControls[0].lines[0])});
  const keeper={personnelId:'P9',name:'انباردار'},rr=R.applyEdit(doc,{date:'1405/07/08',item:coke,values:night,actor:sara,at:'t4',baseline:R.fingerprint(line()),roles:{storekeeper:keeper}});
  assert(rr.changed&&!rr.fields.length&&rr.roles[0]==='storekeeper','roles alone are an edit; the line is untouched');assert.equal(line().updatedBy.personnelId,'P3');
  assert.deepEqual(R.rolesOf(R.recordOf(doc,'1405/07/08')).storekeeper,keeper);assert(R.rolesMatch(doc,'1405/07/08',{storekeeper:keeper}));assert.equal(doc.changeLog.at(-1).action,'تعیین افراد کنترل روزانه نوشابه');
  assert.equal(R.applyEdit(doc,{date:'1405/07/08',item:coke,values:night,actor:sara,at:'t5',baseline:R.fingerprint(line()),roles:{storekeeper:keeper}}).changed,false,'same people are no change');
  const ll=legacy.beverageDailyControls[0].lines[0];assert.equal(ll.nightTotal,5);assert.equal(ll.inMorning,2);assert.equal(ll.eveningUpper,4,'historical evening count kept');assert.equal(legacy.beverageDailyControls[0].sheetNumber,'12','historical sheet number kept');assert.equal(R.values(ll).night,5);
 });

 await test('mobile form: sequential beverages, reload, confirm/cancel edit, failed save keeps input, double submit, stale responses',async()=>{
  const server={inventory:{beverageDailyControls:[],changeLog:[],keep:{y:1}}};let gate=null;
  const {c,dom}=sharedContext();const gw=fakeGateway(server,{delay:async()=>{if(gate)await gate.p}});c.RAYO_API_GATEWAY=gw;
  const R=c.RayoBeverageControl,toasts=[];let answer=false,asked=0;
  const cfg={items:()=>ITEMS.slice(0,3),load:()=>gw.loadModule('inventory'),save:async d=>(await gw.saveModule('inventory',d)).checked,actor:async()=>({type:'admin',name:'مدیر'}),toast:(m,e)=>toasts.push([m,!!e]),confirm:async m=>{asked++;assert.equal(m,R.EDIT_CONFIRM);return answer}};
  const html=R.form.html({...cfg,date:'1405/07/08'});
  assert(html.includes('rbc_morningUpper')&&html.includes('rbc_nightLower')&&!html.includes('شماره برگه')&&!html.includes('عصر'),'no sheet number or evening count');
  ['افراد این روز','شمارش صبح','ورودی روز','خروج غیر فروش','مانده شب</h3>','id="rbc_sales"','علت‌ها','مانده مورد انتظار شب','مغایرت روز','مغایرت شبانه'].reduce((pos,h)=>{const i=html.indexOf(h,pos);assert(i>=0,`${h} in entry order (sales last, reasons on their own row)`);return i+1},0);
  assert(['شمارنده صبح','شمارنده شب','انباردار'].every(x=>html.includes(x)),'the day\'s three people are part of the form');
  assert(html.includes('data-rbc-item="coke"')&&!html.includes('<select id="rbcItem"'),'beverages are a vertical list, not a dropdown');
  assert(/<output id="rbcExpected"/.test(html),'calculated values are outputs, not inputs');
  const el=id=>dom.get(id),type=v=>{for(const [k,x] of Object.entries(v))el(`rbc_${k}`).value=x};
  await R.form.setItem('coke');assert.equal(el('rbcFields').disabled,false);
  type({morningUpper:'20',morningLower:'10',inflow:'10',nonSale:'2',sales:'16'});R.form.recalc();
  assert.equal(el('rbcExpected').textContent,'۲۲');assert(el('rbcDaily').textContent.includes('قابل محاسبه نیست'),'night not entered yet');
  await R.form.save();assert.equal(gw.saves,0,'non-sale without reason is rejected');assert.equal(el('rbc_morningUpper').value,'20');
  type({nonSaleReason:'پرسنلی'});await R.form.save();
  assert.equal(gw.saves,1);assert.equal(R.form.state().itemId,'');assert.equal(R.form.state().date,'1405/07/08','date kept for the next beverage');assert.equal(el('rbc_morningUpper').value,'','form cleared');assert.equal(el('rbcItem').value,'');
  await R.form.setItem('water');type({morningUpper:'5',morningLower:'0'});await R.form.save();
  assert.equal(gw.saves,2);assert.equal(server.inventory.beverageDailyControls.length,1);assert.equal(server.inventory.beverageDailyControls[0].lines.length,2);assert.deepEqual(server.inventory.keep,{y:1});
  await R.form.setItem('coke');assert.equal(el('rbc_morningUpper').value,'20','saved values reload');assert.equal(el('rbc_nonSaleReason').value,'پرسنلی');assert(el('rbcStatus').textContent.includes('قبلاً'));
  type({nightUpper:'12',nightLower:'8'});R.form.recalc();assert(el('rbcDaily').textContent.includes('کسری')&&el('rbcDaily').textContent.includes('۲'));
  answer=false;await R.form.save();assert.equal(asked,1);assert.equal(gw.saves,2,'cancel does not save');assert.equal(el('rbc_nightUpper').value,'12','cancel keeps edits');
  gw.fail=Object.assign(new Error('HTTP 500'),{code:'http_error'});answer=true;await R.form.save();
  assert.equal(gw.saves,3);assert.equal(el('rbc_nightUpper').value,'12','failed save keeps input');assert.equal(R.form.state().itemId,'coke');assert.equal(el('rbcStatus').dataset.tone,'error');
  assert.equal(R.lineOf(R.recordOf(server.inventory,'1405/07/08'),'coke').nightUpper,null,'server unchanged');
  gw.fail=null;const p1=R.form.save(),p2=R.form.save();await Promise.all([p1,p2]);assert.equal(gw.saves,4,'double submit saves once');
  const saved=R.lineOf(R.recordOf(server.inventory,'1405/07/08'),'coke');assert.equal(saved.nightUpper,12);assert.equal(server.inventory.beverageDailyControls.length,1);assert.equal(server.inventory.beverageDailyControls[0].lines.length,2,'edit updates, never duplicates');
  assert.equal(R.metrics(saved).daily,2);
  // Stale responses: the first (slow) answer must not fill the form after the user switched beverage.
  let release;gate={p:new Promise(r=>release=r)};const slow=R.form.setItem('coke');gate=null;await R.form.setItem('water');release();await slow;
  assert.equal(R.form.state().itemId,'water');assert.equal(el('rbc_morningUpper').value,'5','water values shown, not the late coke response');
  await R.form.setDate('1405/07/09');assert.equal(el('rbc_morningUpper').value,'','other date has no record');
  const before=R.form.state().date;await R.form.setDate('1499/01/01');assert.equal(R.form.state().date,before,'future date rejected');
 });

 await test('admin desktop: columns, no pagination, one save per date, confirm edits, conflict and failed save keep inputs',async()=>{
  const t=inventoryHarness();assert.equal(t.gw.saves,0,'loading never saves');
  const html=t.api.bevEntry();
  assert(html.includes('data-pagination="native"'),'beverage rows are not paginated');assert(!html.includes('v1012BevSheet')&&!html.includes('شماره برگه'),'sheet number removed');
  const head=html.slice(html.indexOf('<thead>'),html.indexOf('</thead>')),order=['شمارش صبح','ورودی روز','خروج غیر فروش','مانده شب','فروش','مانده مورد انتظار شب','مغایرت روز','مغایرت شبانه'];
  order.reduce((pos,h)=>{const i=head.indexOf(h,pos);assert(i>=0,`column ${h} in order`);return i+1},0);assert(!head.includes('عصر'),'no evening count');
  ['water','coke','zir'].forEach(id=>assert(html.includes(`data-bev-item="${id}"`)));
  t.setRow(1,{morningUpper:'۲۰',morningLower:10,inflow:10,nonSale:2,nonSaleReason:'مهمان',sales:16,nightUpper:12,nightLower:8,varianceNote:''});t.setRow(0,{});t.setRow(2,{});
  await t.api.bevSave();assert.equal(t.gw.saves,1);
  const rec=t.server.inventory.beverageDailyControls[0];assert.equal(rec.lines.length,1,'untouched rows are not stored');assert.equal(rec.lines[0].morningUpper,20);assert.equal(rec.lines[0].formulaVersion,'bev-v2');
  assert.equal(rec.lines[0].morningCountedBy.name,'admin');assert.deepEqual(t.server.inventory.unknownRoot,{keep:1});assert.equal(t.local.beverageDailyControls.length,1,'in-memory state synced from the verified document');
  t.api.bevEntry();t.setRow(1,{morningUpper:20,morningLower:10,inflow:10,nonSale:2,nonSaleReason:'مهمان',sales:16,nightUpper:13,nightLower:8});
  t.confirm(false);await t.api.bevSave();assert.equal(t.gw.saves,1,'cancelled edit is not saved');
  t.confirm(true);await t.api.bevSave();assert.equal(t.gw.saves,2);assert.equal(t.server.inventory.beverageDailyControls.length,1);assert.equal(t.server.inventory.beverageDailyControls[0].lines[0].nightUpper,13);assert.equal(t.server.inventory.beverageDailyControls[0].revisions.length,1);
  t.api.bevEntry();t.server.inventory.beverageDailyControls[0].lines[0].sales=99;t.setRow(1,{morningUpper:20,morningLower:10,inflow:10,nonSale:2,nonSaleReason:'مهمان',sales:16,nightUpper:14,nightLower:8});
  await t.api.bevSave();assert.equal(t.gw.saves,2,'concurrent server change blocks the overwrite');assert(t.msgs.some(([m,e])=>e&&m.includes('کاربر دیگری')));
  t.gw.fail=Object.assign(new Error('HTTP 500'),{code:'http_error'});await t.api.bevSave();assert.equal(t.server.inventory.beverageDailyControls[0].lines[0].nightUpper,13,'failed save leaves the server unchanged');
  t.gw.fail=null;await t.api.bevSave();assert.equal(t.server.inventory.beverageDailyControls[0].lines[0].nightUpper,14,'second save after the conflict replaces on purpose');
  t.setRow(1,{morningUpper:'1.5'});t.api.bevEntry();t.setRow(1,{morningUpper:'1.5'});const n=t.gw.saves;await t.api.bevSave();assert.equal(t.gw.saves,n,'decimals are rejected');
  await t.api.bevVoid();const voided=t.server.inventory.beverageDailyControls[0];assert.equal(voided.status,'void');assert.equal(voided.voidReason,'اشتباه ثبت');assert.equal(t.server.inventory.beverageDailyControls.length,1,'void keeps history');
 });

 await test('reports and dashboard: same formula, previous calendar day, incomplete rows excluded from totals',()=>{
  const t=inventoryHarness();
  t.local.beverageDailyControls=[{id:'a',date:'1405/07/07',status:'posted',lines:[{ingredientId:'coke',formulaVersion:'bev-v2',morningUpper:20,morningLower:10,inflow:10,nonSale:2,sales:16,nightUpper:12,nightLower:8},{ingredientId:'water',formulaVersion:'bev-v2',morningUpper:4,morningLower:null,nightUpper:1,nightLower:1}]},{id:'b',date:'1405/07/08',status:'posted',lines:[{ingredientId:'coke',formulaVersion:'bev-v2',morningUpper:11,morningLower:8}]}];
  const d=t.api.bevDayMetrics(t.local.beverageDailyControls[0]);
  assert.equal(d.net,2);assert.equal(d.shortage,2);assert.equal(d.incomplete,1);assert.equal(d.overnightKnown,false,'07/06 has no record');
  const d2=t.api.bevDayMetrics(t.local.beverageDailyControls[1]);assert.equal(d2.overnight,-1);assert.equal(d2.incomplete,1);
  const html=t.api.bevDashboardCard();
  assert(html.includes('کنترل روزانه نوشیدنی و اقلام سرو')&&html.includes('inventory.html?tab=count&sub=beverage'));
  const base=read('js/00-base.js');assert(base.includes("'ثبت اطلاعات کنترل مغایرت نوشابه'")&&!base.includes("'ثبت فرم نوشیدنی'"),'dashboard quick tile renamed');assert(!base.includes("'inventory.html?tab=count&sub=beverage','🥤'"),'the separate beverage-control link is not a dashboard tile');
  assert(base.includes('assets.html?panel=count')&&base.includes('assets.html?panel=events')&&base.includes('RayoInventoryV1012.bevOpenModal()'));
  assert(html.includes('گزارش مغایرت نوشیدنی')&&html.includes('لیست روزانه')&&html.includes('نمودار مغایرت روز و شب')&&html.includes('خلاصه ماهانه'));
  assert(html.includes('مغایرت روز')&&html.includes('مغایرت شب')&&html.includes('جمع مغایرت'),'day and night variance shown separately and together');
  const st=t.api.bevStats(['1405/07/07','1405/07/08'],[{id:'coke',name:'کوکا'}]);assert.equal(st.tot.day,2);assert.equal(st.tot.night,1,'morning 08 (19) vs night 07 (20)');assert.equal(st.tot.total,3);
  assert(html.includes('1405/07/02')&&html.includes('فرم ثبت نشده'),'dashboard defaults to the last 7 days and lists missing days');
  t.api.bevTab('chart');let chart=t.api.bevReport();
  assert(chart.includes('<circle class="dot"'),'day series drawn');assert(chart.includes('class="dot night"'),'night series drawn');assert(!chart.includes('<table'));
  t.api.bevRangeSet('item','water');chart=t.api.bevReport();assert(chart.includes('— آب'));
  t.api.bevTab('list');t.api.bevRangeSet('item','');const list=t.api.bevReport();assert(list.includes('ردیف ناقص'));
  t.api.bevTab('month');t.api.bevMonth('1405/07');const month=t.api.bevReport();assert(month.includes('مهر ۱۴۰۵')&&month.includes('در مجموع')&&month.includes('روند ماهانه'),'monthly summary in one place');t.api.bevTab('list');
  t.api.bevOpenModal();assert.equal(t.c.modal.title,'ثبت اطلاعات کنترل مغایرت نوشابه');
 });

 await test('settings search hides non-matching rows even though rows use display:flex',()=>{
  const t=inventoryHarness(),rows=[{dataset:{search:'کوکا b2'},style:{}},{dataset:{search:'آرد'},style:{}}];
  t.c.document.querySelectorAll=s=>s==='[data-bev-opt]'?rows:[];
  t.api.bevSettingsFilter('کوکا');assert.equal(rows[0].style.display,'flex');assert.equal(rows[1].style.display,'none');
  t.api.bevSettingsFilter('');assert(rows.every(r=>r.style.display==='flex'));
 });

 await test('staff panel: permission gate, no counter-name fields, identity from the live personnel record per stage',async()=>{
  const access=p=>({enabled:true,permissions:p});
  const hr={personnel:[{id:'P1',name:'سارا',status:'فعال',username:'sara',userAccess:access({beverageControl:true})},{id:'P2',name:'نیما',status:'فعال',userAccess:access({})},{id:'P3',name:'رضا',status:'فعال',userAccess:access({beverageControl:true})}],lists:{}};
  const server={hr,pricing:{ingredients:ITEMS},inventory:{settings:{beverageControl:{itemIds:['water','coke','zir']}},changeLog:[],keepMe:{x:1}},suppliers:{},assets:{}};
  const run=async(personnelId,sessionName='جعلی')=>{const {c,dom}=sharedContext({innerWidth:1200,toast(){},RayoJalali:{today:()=> '1405/07/08'}});const gw=fakeGateway(server);c.RAYO_API_GATEWAY=gw;
   c.location={pathname:'/personel/beverage-control.html',replace:u=>{c.redirect=u}};c.sessionStorage={getItem:()=>JSON.stringify({personnelId,name:sessionName}),removeItem(){}};c.document.body.dataset.staffView='beverageControl';c.setTimeout=()=>{};c.confirm=()=>true;
   vm.runInContext(read('js/22-staff-panel.js'),c);c.RayoBeverageControl.today=()=> '1405/07/08';await c.staffInit();return{c,dom,gw,el:dom.get,R:c.RayoBeverageControl}};
  const denied=await run('P2');assert.equal(denied.c.redirect,'index.html?denied=1','staff without permission cannot open the page');
  const a=await run('P1');let html=a.el('staffView').innerHTML;
  assert(html.includes('کنترل روزانه فروش نوشابه')&&html.includes('rbcForm')&&html.includes('rbc_nightUpper'));
  assert(html.includes('rbc_role_morningCounter')&&html.includes('rbc_role_nightCounter')&&html.includes('rbc_role_storekeeper')&&!html.includes('stBevCM'),'the three people of the day are picked from personnel');
  assert(html.includes('مانده مورد انتظار شب')&&html.includes('مغایرت شبانه'),'staff see the same calculated fields');
  await a.R.form.setDate('1405/07/08');await a.R.form.setItem('coke');assert.equal(a.gw.saves,0,'opening and loading the form never saves');
  for(const [k,v] of Object.entries({morningUpper:'20',morningLower:'10',role_morningCounter:'P1',role_storekeeper:'P3'}))a.el(`rbc_${k}`).value=v;await a.R.form.save();
  assert.deepEqual(JSON.parse(JSON.stringify(a.R.rolesOf(server.inventory.beverageDailyControls[0]))),{morningCounter:{personnelId:'P1',name:'سارا'},nightCounter:null,storekeeper:{personnelId:'P3',name:'رضا'}},'roles saved on the date record');
  assert.equal(a.gw.saves,1);let line=a.R.lineOf(a.R.recordOf(server.inventory,'1405/07/08'),'coke');
  assert.equal(line.morningCountedBy.personnelId,'P1');assert.equal(line.morningCountedBy.name,'سارا','name from the personnel record, not the session text');assert.equal(server.inventory.beverageDailyControls[0].source,'staff');
  const b=await run('P3');await b.R.form.setDate('1405/07/08');await b.R.form.setItem('coke');assert.equal(b.el('rbc_morningUpper').value,'20');
  for(const [k,v] of Object.entries({inflow:'10',nonSale:'2',nonSaleReason:'شکسته',sales:'16',nightUpper:'12',nightLower:'8'}))b.el(`rbc_${k}`).value=v;await b.R.form.save();
  line=b.R.lineOf(b.R.recordOf(server.inventory,'1405/07/08'),'coke');
  assert.equal(line.morningCountedBy.personnelId,'P1','night entry keeps the morning counter');assert.equal(line.nightCountedBy.personnelId,'P3');assert.equal(line.updatedBy.personnelId,'P3');assert.equal(line.createdBy.personnelId,'P1');
  assert.equal(b.R.metrics(line).daily,2);assert.deepEqual(server.inventory.keepMe,{x:1},'unknown inventory fields kept');assert.equal(server.inventory.beverageDailyControls.length,1);
  hr.personnel[2].userAccess.permissions.beverageControl=false;await b.R.form.setItem('zir');b.el('rbc_morningUpper').value='1';b.el('rbc_morningLower').value='1';const n=b.gw.saves;await b.R.form.save();
  assert.equal(b.gw.saves,n,'permission is re-read from the server at save time');assert.equal(b.el('rbc_morningUpper').value,'1','input kept after a refused save');
  hr.personnel[2].userAccess.permissions.beverageControl=true;
  server.inventory.beverageDailyControls.push({id:'old',date:'1405/07/01',status:'posted',lines:[{ingredientId:'water',morningUpper:1,morningLower:1}]});
  await b.R.form.setDate('1405/07/01');await b.R.form.setItem('water');assert.equal(b.el('rbcFields').disabled,true,'staff cannot change lines older than yesterday');
  await b.R.form.setItem('coke');assert.equal(b.el('rbcFields').disabled,false,'a new line for an older date is still allowed');
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
