const assert=require('assert');

async function run(){
  const targets=await fetch('http://127.0.0.1:9223/json').then(r=>r.json());
  const target=targets.find(x=>x.type==='page');
  assert(target,'مرورگر تست پیدا نشد');
  const socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
  let id=0;const pending=new Map();
  socket.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.id&&pending.has(msg.id)){const job=pending.get(msg.id);pending.delete(msg.id);msg.error?job.reject(new Error(msg.error.message)):job.resolve(msg.result)}};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const callId=++id;pending.set(callId,{resolve,reject});socket.send(JSON.stringify({id:callId,method,params}))});
  const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};

  await evaluate(`sessionStorage.setItem('rayo_admin_user','qa-admin')`);
  await call('Page.navigate',{url:'http://127.0.0.1:8765/suppliers.html?tab=relations&qa='+Date.now()});
  await new Promise(resolve=>setTimeout(resolve,2500));
  await evaluate(`(async()=>{await supEnsureLoaded(false,true);await pcEnsureLoaded(true,true);const sup=getSupplierState(),pricing=getPricingState();sup.lists={...(sup.lists||{}),orderMethods:['تماس تلفنی']};sup.suppliers=[{id:'SUP-1',code:'SUP-001',company:'فروشگاه بهار',contactName:'علی رضایی',status:'فعال'},{id:'SUP-2',code:'SUP-002',company:'بازرگانی تابان',contactName:'مریم احمدی',status:'فعال'}];sup.supplierItems=[];pricing.ingredients=[{id:'I-1',code:'1001',name:'سیب قرمز',status:'فعال',itemType:'MENU_INGREDIENT'},{id:'I-2',code:'1002',name:'سیب سبز',status:'فعال',itemType:'MENU_INGREDIENT'},{id:'I-3',code:'1003',name:'پرتقال',status:'فعال',itemType:'MENU_INGREDIENT'}];supplierUI.tab='relations';renderView()})()`);
  const tabFilters=await evaluate(`(()=>({supplier:[...document.querySelectorAll('label')].some(x=>x.textContent.includes('جست‌وجوی نام تأمین‌کننده')),item:[...document.querySelectorAll('label')].some(x=>x.textContent.includes('جست‌وجوی قلم'))}))()`);
  assert.deepStrictEqual(tabFilters,{supplier:true,item:true});

  await evaluate(`RayoCatalogV1010.editRelation()`);
  const modalFields=await evaluate(`(()=>({supplier:!!document.getElementById('v1010RelSupplierSearch'),item:!!document.getElementById('v1010RelSearch'),bulk:!!document.getElementById('v1010RelBulk')}))()`);
  assert.deepStrictEqual(modalFields,{supplier:true,item:true,bulk:true});
  const supplierHits=await evaluate(`(()=>{const x=document.getElementById('v1010RelSupplierSearch');x.value='بهار';RayoSearchPicker.filter('v1010RelSupplier',x.value);return [...document.querySelectorAll('#v1010RelSupplierList button')].map(x=>x.textContent)})()`);
  assert.strictEqual(supplierHits.length,1);assert(supplierHits[0].includes('فروشگاه بهار'));
  await evaluate(`RayoSearchPicker.pick('v1010RelSupplier','SUP-001');RayoCatalogV1010.searchRelationItems('سیب');RayoCatalogV1010.toggleFilteredItems(true)`);
  const selected=await evaluate(`(()=>({checked:document.querySelectorAll('#v1010RelChoices input:checked').length,summary:document.getElementById('v1010RelSummary').textContent}))()`);
  assert.strictEqual(selected.checked,2);assert(selected.summary.includes('۲ قلم انتخاب شده'));
  const relationModalStayedOpen=await evaluate(`(()=>{const b=document.getElementById('modalBackdrop');b.dispatchEvent(new MouseEvent('click',{bubbles:true}));return b.classList.contains('open')})()`);
  assert.strictEqual(relationModalStayedOpen,true);

  await evaluate(`closeModal();editSupplierAdmin()`);
  const supplierForm=await evaluate(`(()=>{const select=document.getElementById('f_orderMethod');return{sms:[...select.options].some(x=>x.textContent.trim()==='اس ام اس'),openBefore:document.getElementById('modalBackdrop').classList.contains('open')}})()`);
  assert.deepStrictEqual(supplierForm,{sms:true,openBefore:true});
  const supplierModalStayedOpen=await evaluate(`(()=>{const b=document.getElementById('modalBackdrop');b.dispatchEvent(new MouseEvent('click',{bubbles:true}));return b.classList.contains('open')})()`);
  assert.strictEqual(supplierModalStayedOpen,true);
  socket.close();
  console.log('PASS supplier UI runtime: search, multi-select, SMS and backdrop behavior');
}

run().catch(error=>{console.error(error);process.exitCode=1});
