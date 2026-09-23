'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=f=>fs.readFileSync(f,'utf8');
const {setup,convert}=require('./qa_unified_inventory.js');

async function loadNineTabUI(t){
 const c=t.c;
 c.location={pathname:'/inventory.html',search:'?tab=stock'};
 c.views={inventory:()=>''};c.ops={};c.pageHead=(title,sub)=>`<h1>${title}</h1><p>${sub}</p>`;c.document.readyState='complete';
 const comp40=read('js/40-rayo-v10-9-comprehensive.js');
 vm.runInContext(comp40.slice(0,comp40.indexOf('function supplierLedger'))+'})();',c);
 vm.runInContext(read('js/46-inventory-operations-v10-12.js'),c);
 await Promise.resolve();
 return c;
}

async function run(){
 let groups=0;const test=async(name,fn)=>{await fn();groups++;console.log('PASS '+name)};

 await test('daily nav drops the transfer tab once single-warehouse mode is active, but the route stays reachable as read-only history',async()=>{
  const t=await setup();await convert(t);
  const c=await loadNineTabUI(t);
  t.inventory.inventoryMovements.push({id:'legacy-transfer',ingredientId:'flour',movementType:'TRANSFER',date:'1405/05/20',quantity:5,fromLocationId:'main',toLocationId:'kitchen',status:'posted',createdAt:'2026-08-20T00:00:00Z'});
  c.location.search='?tab=stock';
  let html=c.views.inventory();
  assert(!/href="inventory\.html\?tab=issue"/.test(html),'transfer tab link must not appear in the daily nav in unified mode');
  c.location.search='?tab=issue';
  html=c.views.inventory();
  assert(!html.includes('id="v1012IssueFrom"')&&!html.includes('id="v1012IssueTo"'),'new-transfer form fields must not render in unified mode');
  assert(html.includes('نیازی به ثبت انتقال داخلی نیست'),'unified issue tab must explain that transfers are unnecessary');
  assert(html.includes('قبل از تک‌انبار'),'a pre-existing transfer must carry the pre-single-warehouse label');
  assert(html.includes('آرد آزمایشی'),'the historical transfer row itself must still be visible');
 });

 await test('saveIssue/saveTransfer refuse to create new transfers once unified, even if called directly',async()=>{
  const t=await setup();await convert(t);
  const c=await loadNineTabUI(t);
  const before=t.inventory.inventoryMovements.length;
  await c.RayoInventoryV1012.saveIssue();
  assert.equal(t.inventory.inventoryMovements.length,before,'saveIssue must not add a movement in unified mode');
  assert(t.messages.some(m=>m.includes('نیازی به ثبت انتقال داخلی نیست')));
  await t.api.saveTransfer();
  assert.equal(t.inventory.inventoryMovements.length,before,'the legacy saveTransfer handler must also refuse in unified mode');
 });

 await test('direct receipt entry is force-attached to the main warehouse even without a location dropdown, and the total stays valid',async()=>{
  const t=await setup();await convert(t);
  const c=await loadNineTabUI(t);
  const html=c.RayoInventoryV1012 && (c.location.search='?tab=receipt',c.views.inventory());
  assert(!/<select id="v1012RecLoc">/.test(html),'the location field must not be an open dropdown in unified mode');
  assert(html.includes('<input type="hidden" id="v1012RecLoc" value="main">'),'location must still be carried as a hidden field with the real main-warehouse id');
  assert(!html.includes('محل ورود'),'no visible warehouse label/field of any kind (not even disabled) belongs in the daily entry form');
  assert(!html.includes('<th>محل</th>'),'the receipt history table must not show a warehouse column either');
  t.el('v1012RecDate').value='1405/06/02';t.el('v1012RecIng').value='flour';t.el('v1012RecQty').value='5';t.el('v1012RecTotal').value='';
  await c.RayoInventoryV1012.saveReceipt(false);
  const saved=t.server.inventory.stockReceipts.find(r=>r.ingredientId==='flour'&&r.quantity===5);
  assert(saved,'receipt must be saved');
  assert.equal(saved.locationId,'main','a new receipt must be attached to the main warehouse in unified mode');
  assert.equal(t.api.currentTotalPosition('flour').quantity,90,'85 + 5 receipt, resolved through a real (non-blank) location id');
  assert.deepEqual(t.server.inventory.unknownRoot,{preserve:['nested',1]},'unknown fields survive a save made through the simplified form');
 });

 await test('waste/consumption events are force-attached to the main warehouse in unified mode, with no warehouse field or column shown',async()=>{
  const t=await setup();await convert(t);
  const before=t.api.renderPane('waste');
  assert(!/<select id="v10EvLoc">/.test(before),'the location field must not be an open dropdown in unified mode');
  assert(before.includes(`<input type="hidden" id="v10EvLoc" value="main">`),'location must still be carried as a hidden field with the real main-warehouse id');
  assert(!before.includes('سکشن / محل'),'no visible warehouse label/field of any kind (not even disabled) belongs in the daily entry form');
  assert(!before.includes('<th>محل</th>'),'the waste/consumption records table must not show a warehouse column either');
  t.el('v10EvDate').value='1405/06/02';t.el('v10EvEventType').value='WASTE';t.el('v10EvItemType').value='ingredient';t.el('v10EvItem').value='flour';t.el('v10EvQty').value='1';t.el('v10EvReason').value='QA';
  await t.api.saveEvent();
  const rec=t.inventory.wasteRecords.at(-1);
  assert.equal(rec.locationId,'main','a new waste event must be attached to the main warehouse in unified mode');
  const mv=t.inventory.inventoryMovements.find(m=>m.referenceId===rec.id);
  assert.equal(mv.fromLocationId,'main');
  assert.equal(t.api.currentTotalPosition('flour').quantity,84,'85 - 1 waste, resolved through a real (non-blank) location id');
 });

 await test('location management and menu-location mapping collapse into an admin-only disclosure once unified',async()=>{
  const t=await setup();
  let html=t.api.renderPane('locations');
  assert(!html.includes('فقط برای بازگشت احتمالی به چندانباره'),'multi-location mode must keep these editors open, not collapsed');
  await convert(t);
  html=t.api.renderPane('locations');
  assert(html.includes('<details class="card"><summary><b>محل‌های نگهداری و مصرف (فقط برای بازگشت احتمالی به چندانباره)'),'unified mode must collapse location management behind a disclosure');
  assert(html.includes('نگاشت آیتم منو'),'the mapping table itself must still exist (not deleted), just tucked away');
 });

 await test('the stock table opens the merged ledger with one click (no location picker), and its ending balance matches the total position',async()=>{
  const t=await setup();await convert(t);
  const c=await loadNineTabUI(t);
  c.location.search='?tab=stock';
  const html=c.views.inventory();
  assert(!/<th[^>]*>محل<\/th>/.test(html),'the stock table must not carry a warehouse column in unified mode');
  assert(!html.includes('نمای موجودی'),'the total/per-location toggle must not be shown');
  assert(/>گردش<\/button>/.test(html),'the row action must read گردش, not جزئیات');
  assert(html.includes("RayoInventoryV10.drill('flour')"),'the button must open the ledger directly with no intermediate location-breakdown window');
  t.api.drill('flour');
  const modal=t.el('modalBody').innerHTML;
  assert(!modal.includes('محل'),'the ledger itself must carry no per-location breakdown, picker or column');
  assert(modal.includes('مانده ابتدای دوره'),'an explicit opening-balance row must anchor the running balance');
  assert(modal.includes('ورود خرید')&&modal.includes('مصرف فروش')&&modal.includes('ضایعات/پرتی')&&modal.includes('مصرف پرسنلی'),'purchase, sale consumption, waste and authorized consumption must each appear with their real operation type');
  assert(modal.includes('۸۵'),'the ledger must end at the same 85 the total position and qa_unified_inventory.js already agree on for this fixture');
  assert.equal(t.el('modalTitle').textContent,'گردش آرد آزمایشی');
 });

 await test('the unified banner states the exact daily-use guidance and the single-warehouse activation date',async()=>{
  const t=await setup();await convert(t);
  const html=t.api.controlNotice();
  assert(html.includes('در این حالت، همه موجودی عملیاتی در انبار اصلی مدیریت می‌شود. ورود، مصرف فروش و ضایعات ثبت می‌شوند و نیازی به ثبت انتقال داخلی نیست.'));
  assert(/فعال است/.test(html),'the banner must state the activation date of single-warehouse mode');
 });

 console.log(`PASS ${groups} single-warehouse operational simplification groups`);
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
