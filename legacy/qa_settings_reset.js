'use strict';
// Synthetic, in-memory API only. Never connects to the deployed application.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),{webcrypto}=require('crypto');
const read=f=>fs.readFileSync(f,'utf8'),clone=x=>JSON.parse(JSON.stringify(x));
const gatewaySource=read('js/config.js'),source=read('js/39-manual-initial-data-v10-8.js');
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name)}
function harness(initial){
  const nodes=Object.fromEntries(['rayoDataMsg','rayoDataPreview','rayoResetBtn','rayoRestoreBtn','rayoRollbackBtn','rayoInitModule','rayoInitializeBtn','rayoSeedPreview'].map(id=>[id,{value:'',innerHTML:'',textContent:'',disabled:false}]));
  const h={store:clone(initial||{}),calls:[],downloads:[],downloadContents:[],prompt:'RESET TABLES',confirm:true,failLoad:'',failSave:'',corruptSave:'',failRollback:false};
  const c={console,AbortController,Blob,URL,crypto:webcrypto,setTimeout,clearTimeout,views:{},titles:{},state:{},location:{pathname:'/settings.html'},document:{getElementById:id=>nodes[id]||null,querySelectorAll:()=>[],body:{appendChild(){}},createElement:()=>({click(){h.downloads.push(this.href);h.downloadContents.push(require('buffer').resolveObjectURL(this.href).text())},remove(){}})},confirm:()=>h.confirm,prompt:()=>typeof h.prompt==='function'?h.prompt():h.prompt,
    fetch:async(url,opts={})=>{
      const m=new URL(url,'https://example.test').searchParams.get('module'),method=opts.method||'GET';h.calls.push({m,method,url});
      if(url.includes('/seed/'))return{ok:true,status:200,text:async()=>JSON.stringify({meta:{},ingredients:[{id:'QA-seed'}]})};
      if(method==='POST'){
        const value=JSON.parse(opts.body);h.store[m]=value;if(h.missing===m)h.missing='';
        if(h.failSave===m){h.failSave='';h.failed=true;return{ok:false,status:500,text:async()=>'{"message":"synthetic ambiguous save failure"}'}}
        if(h.failed&&h.failRollback)return{ok:false,status:500,text:async()=>'{"message":"synthetic rollback failure"}'};
        if(h.corruptSave===m){h.corruptSave='';value.ingredients=[{id:'QA-unexpected'}]}
      }else if(h.failLoad===m)return{ok:false,status:500,text:async()=>'{"message":"synthetic load failure"}'};
      else if(h.missing===m)return{ok:false,status:404,text:async()=>'{"message":"synthetic missing module"}'};
      return{ok:true,status:200,text:async()=>JSON.stringify(h.store[m]||{})};
    }};
  c.window=c;c.RAYO_ENV={API_ORIGIN:'https://example.test',TIMEOUT_MS:200};vm.createContext(c);vm.runInContext(gatewaySource,c);
  h.gw=c.RAYO_API_GATEWAY;
  if(!initial)for(const module of h.gw.supportedModules()){
    const d=h.gw.emptyModuleShape(module);d.meta={initialized:true,module,schemaVersion:'qa',restaurant:'QA'};
    for(const [k,v] of Object.entries(d))if(Array.isArray(v))d[k]=[{id:'QA-'+k,code:'QA-100',value:12}];
    if(d.settings)d.settings={customRate:17,options:['QA-setting']};
    if(d.lists)d.lists={categories:['QA-category']};
    if(module==='hr'){d.shiftDayMessages={'1405/01/01':{text:'QA-message'}};d.salaryModel={rate:10,yearlyBases:[{year:1405}],draft:{personnelId:'QA-personnel',amount:100}};d.floorMap={regions:[{id:'QA-region'}]}}
    if(module==='cashreport')d.salesAnalytics={daily:[{date:'QA',amount:1}],monthly:[{amount:2}],itemDaily:[{item:'QA'}],itemDetails:{QA:[{amount:3}]},total:4};
    h.store[module==='hr'?'personnel':module]=d;
  }
  vm.runInContext(source,c);h.api=c.RayoInitialData;h.nodes=nodes;h.c=c;h.posts=()=>h.calls.filter(x=>x.method==='POST');h.message=()=>nodes.rayoDataMsg.textContent;
  h.modules=async()=>{const out={};for(const m of h.gw.supportedModules())out[m]=clone(await h.gw.loadModule(m));return out};
  return h;
}
async function run(){
  let h=harness();check('registration performs no Load, Seed or Save',()=>assert.equal(h.calls.length,0));
  const before=await h.modules();
  for(const [m,d] of Object.entries(before)){
    const original=clone(d),empty=h.api.emptyTables(m,d);
    check(m+': clears record arrays and preserves structure/configuration',()=>{
      assert.deepEqual(d,original);assert.deepEqual(Object.keys(empty).sort(),Object.keys(d).sort());
      for(const [key,value] of Object.entries(d))if(Array.isArray(value))assert.deepEqual(clone(empty[key]),m==='inventory'&&key==='locations'?value:[]);
      assert.deepEqual(clone(empty.meta),d.meta);if(d.lists)assert.deepEqual(clone(empty.lists),d.lists);if(d.settings)assert.deepEqual(clone(empty.settings),d.settings);
    });
  }
  check('nested sales, shift messages and personnel drafts are emptied',()=>{
    assert.deepEqual(clone(h.api.emptyTables('hr',before.hr).shiftDayMessages),{});
    assert.deepEqual(clone(h.api.emptyTables('hr',before.hr).salaryModel.draft),{});
    const sales=h.api.emptyTables('cashreport',before.cashreport).salesAnalytics;assert.equal(sales.daily.length,0);assert.equal(sales.monthly.length,0);assert.equal(sales.itemDaily.length,0);assert.deepEqual(clone(sales.itemDetails),{});assert.equal(sales.total,0);
  });
  await h.api.inspect();check('preview is read-only and includes nested table counts',()=>{assert.equal(h.posts().length,0);assert(h.nodes.rayoDataPreview.innerHTML.includes('salesAnalytics.itemDaily'));assert(h.calls.every(x=>!x.url.includes('seed')))});
  h.confirm=false;await h.api.resetTables();check('cancel sends no writes',()=>assert.equal(h.posts().length,0));
  h.confirm=true;h.prompt='wrong';await h.api.resetTables();check('typed confirmation mandatory and backup precedes prompt',()=>{assert.equal(h.posts().length,0);assert.equal(h.downloads.length,1)});
  h.prompt=()=>{assert.equal(h.downloads.length,2);assert.equal(h.posts().length,0);return 'RESET TABLES'};
  await h.api.resetTables();check('explicit reset clears all ten modules without Seed',()=>{assert.equal(h.posts().length,10);assert.equal(h.store.personnel.personnel.length,0);assert.equal(h.store.pricing.ingredients.length,0);assert.equal(h.store.inventory.locations.length,1);assert(h.calls.every(x=>!x.url.includes('seed')))});
  const backup=JSON.parse(await h.downloadContents.at(-1));
  await h.api.previewRollback();h.prompt='RESTORE DATA';await h.api.restore();check('in-session rollback restores IDs, codes and historical rows',()=>{assert.equal(h.store.pricing.ingredients[0].code,'QA-100');assert.equal(h.store.personnel.personnel[0].id,'QA-personnel');assert.equal(h.store.cashreport.salesAnalytics.total,4)});
  h=harness();await h.api.inspect();h.store.pricing.ingredients.push({id:'concurrent'});await h.api.resetTables();check('stale preview blocks all writes',()=>{assert.equal(h.posts().length,0);assert(h.message().includes('تغییر'))});
  h=harness();h.failLoad='inventory';await h.api.inspect();await h.api.resetTables();check('failed GET blocks preview and all saves',()=>{assert.equal(h.posts().length,0);assert(h.nodes.rayoResetBtn.disabled)});
  h=harness();await h.api.inspect();h.prompt=()=>{h.store.personnel.personnel.push({id:'concurrent-after-backup'});return 'RESET TABLES'};await h.api.resetTables();check('change during confirmation is detected',()=>assert.equal(h.posts().length,0));
  h=harness();await h.api.inspect();h.failSave='pricing';await h.api.resetTables();check('ambiguous partial save rolls back every attempted module',()=>{assert.equal(h.store.personnel.personnel.length,1);assert.equal(h.store.suppliers.suppliers.length,1);assert.equal(h.store.pricing.ingredients.length,1);assert(h.message().includes('برگشتند'))});
  h=harness();await h.api.inspect();h.corruptSave='pricing';await h.api.resetTables();check('content verification detects incomplete server save and rolls back',()=>{assert.equal(h.store.pricing.ingredients[0].id,'QA-ingredients');assert(h.message().includes('مطابقت ندارد'))});
  h=harness();await h.api.inspect();h.failSave='pricing';h.failRollback=true;await h.api.resetTables();check('failed rollback is reported with backup recovery path',()=>{assert(h.message().includes('کامل نشد'));assert.equal(h.downloads.length,1);assert(!h.nodes.rayoRollbackBtn.disabled)});
  h=harness();await h.api.inspect();await h.api.resetTables();const emptyStore=clone(h.store);h=harness(emptyStore);await h.api.restoreFile({target:{files:[{text:async()=>JSON.stringify(backup)}],value:'qa'}});check('backup import only previews after reload',()=>{assert.equal(h.posts().length,0);assert(!h.nodes.rayoRestoreBtn.disabled)});h.prompt='RESTORE DATA';await h.api.restore();check('downloaded backup can restore a fresh session',()=>assert.equal(h.store.pricing.ingredients[0].code,'QA-100'));
  h=harness();const invalid=clone(backup);delete invalid.modules.pricing.ingredients;await h.api.restoreFile({target:{files:[{text:async()=>JSON.stringify(invalid)}],value:'qa'}});await h.api.restore();check('malformed backup is rejected before writes',()=>{assert.equal(h.posts().length,0);assert(h.nodes.rayoRestoreBtn.disabled)});
  h=harness();h.nodes.rayoInitModule.value='pricing';await h.api.inspectSeed();check('seed initialization cannot replace an initialized module',()=>{assert.equal(h.posts().length,0);assert(h.nodes.rayoInitializeBtn.disabled);assert(h.calls.every(x=>!x.url.includes('seed')))});
  h=harness();h.nodes.rayoInitModule.value='pricing';h.failLoad='pricing';await h.api.inspectSeed();check('HTTP 500 never permits seed initialization',()=>{assert.equal(h.posts().length,0);assert(h.calls.every(x=>!x.url.includes('seed')))});
  for(const missing of [false,true]){
    h=harness();h.store.pricing={};if(missing)h.missing='pricing';h.nodes.rayoInitModule.value='pricing';await h.api.inspectSeed();assert(!h.nodes.rayoInitializeBtn.disabled);h.prompt='INITIALIZE';await h.api.initialize();check(`explicit initialization remains available for ${missing?'404':'empty'} modules`,()=>{assert.equal(h.posts().length,1);assert.equal(h.store.pricing.ingredients[0].id,'QA-seed')});
  }
  console.log(`PASS ${checks}: settings/reset safety checks`);
}
run().catch(e=>{console.error(e);process.exitCode=1});
