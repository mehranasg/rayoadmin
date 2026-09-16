'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=f=>fs.readFileSync(f,'utf8');
const base=read('js/00-base.js'),shell=read('js/16-mpa-shell.js');
const boot=base.slice(base.indexOf('let state=null,currentView='),base.indexOf('const ui={personnelSearch:'));
const renderer=base.slice(base.indexOf('function renderView(){'),base.indexOf('function afterRender(){'));
const loader=base.slice(base.indexOf('function showLoading(v)'),base.indexOf('function toast(msg'));
let checks=0;
function harness(path,search='',hasState=true){
  const timers=[],events=new Map(),writes=[],classes=new Set();
  const nodes={view:{set innerHTML(value){writes.push(value)},get innerHTML(){return writes.at(-1)||''}},topTitle:{},loading:{classList:{toggle(name,on){on?classes.add(name):classes.delete(name)}}},serverSaveButton:{style:{}}};
  const document={readyState:'loading',documentElement:{dataset:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}},getElementById:id=>nodes[id]||null,querySelectorAll:()=>[],addEventListener(name,fn){if(!events.has(name))events.set(name,[]);events.get(name).push(fn)}};
  const c={document,location:{pathname:'/'+path,search,replace(){throw Error('unexpected redirect')}},sessionStorage:{getItem:()=> 'qa'},URLSearchParams,setTimeout(fn,ms){timers.push({fn,ms});return timers.length},setInterval(){throw Error('startup must not poll the route')},afterRender(){},titles:{},views:{dashboard:()=>'<h1>DASHBOARD</h1>'},qsa:()=>[],$:id=>nodes[id]||null,goView(v){c.currentView=v;c.renderView()}};
  c.window=c;vm.createContext(c);vm.runInContext(boot+renderer+loader,c);vm.runInContext(shell,c);
  vm.runInContext(`state=${hasState?'{personnel:[],payrollClosures:[]}':'null'}`,c);
  return {c,timers,writes,classes,run:code=>vm.runInContext(code,c),fireReady(){document.readyState='interactive';for(const fn of events.get('DOMContentLoaded')||[])fn()},drain(){let budget=50;while(timers.length){assert(budget-->0,'bounded startup timers');timers.shift().fn()}}};
}
const routes={'index.html':'dashboard','personnel.html':'personnel','suppliers.html':'suppliers','pricing.html':'pricing','menu-management.html':'pricing','base-data.html':'pricing','inventory.html':'inventory','reports.html':'reports','cash-report-admin.html':'cashReport','assets.html':'assets','finance.html':'finance','survey.html':'survey','sepids-audit.html':'sepidsAudit'};
for(const [file,view] of Object.entries(routes)){
  const h=harness(file);assert.equal(h.run('currentView'),view);
  h.c.views[view]=()=>'<h1>OLD</h1>';
  h.run('renderView();renderView();showLoading(false)');
  assert.equal(h.writes.length,0,'no old view before patches');assert(h.classes.has('show'));
  h.fireReady();
  // Final patch listeners run later in the same DOMContentLoaded dispatch.
  h.c.views[view]=()=>'<h1>FINAL</h1>';h.run('renderView()');
  h.drain();assert.deepEqual(h.writes,['<h1>FINAL</h1>'],file);
  assert(!h.classes.has('show'));assert(!h.classes.has('rayo-starting'));
  h.run('renderView()');assert.equal(h.writes.length,2,'explicit later renders stay synchronous');checks++;
}
{
  const h=harness('personnel.html','?view=protocols',false);
  h.fireReady();h.drain();assert(!h.writes.some(x=>x.includes('DASHBOARD')));assert(h.classes.has('show'));
  h.run('state={personnel:[],payrollClosures:[]};renderView()');
  assert(!h.writes.some(x=>x.includes('DASHBOARD')),'a late view must not fall back to dashboard');
  h.c.views.protocols=()=>'<h1>PROTOCOLS</h1>';h.run('renderView();showLoading(false)');
  assert.equal(h.writes.at(-1),'<h1>PROTOCOLS</h1>');assert(!h.classes.has('show'));checks++;
}
{
  const h=harness('personnel.html','?view=not-a-view');assert.equal(h.run('currentView'),'personnel');checks++;
}
{
  const h=harness('inventory.html');h.c.views.inventory=()=>{throw Error('render failure')};h.fireReady();
  assert.throws(()=>h.drain(),/render failure/);assert(!h.classes.has('rayo-starting'),'render error must release bootstrap visibility');checks++;
}
// Exercise the actual final catalog installer, including typing after startup.
{
  const h=harness('base-data.html');
  h.c.document.readyState='interactive';
  h.c.document.currentScript={defer:true};h.c.pricingUI={};h.c.pcIngredientList=()=>'<input value="" oninput="pcIngredientFilter(\'ingredientSearch\',this.value)">';
  h.c.getPricingState=()=>({ingredients:[]});h.c.pageHead=()=>'';
  h.c.document.querySelectorAll=()=>[];
  vm.runInContext(read('js/47-base-data-v10-12-1.js'),h.c);
  assert(!h.c.views.pricing,'a deferred patch waits for earlier DOMContentLoaded installers');
  h.run('renderView()');h.fireReady();h.drain();assert.equal(h.writes.length,1);
  assert(h.writes[0].includes('data-live-filter="ingredientSearch"'));
  assert.equal(h.timers.length,0,'no 500/1200 ms rerenders to discard an edited input');checks++;
}
// Every admin entry declares the final scripts and CSS. Dynamic fallbacks must not duplicate them.
const pages=fs.readdirSync('.').filter(f=>f.endsWith('.html')&&read(f).includes('js/44-phase1-polish-v10-10-1.js'));
for(const file of pages){
  const html=read(file);let previous=-1;
  for(const name of ['44-phase1-polish-v10-10-1.js','45-menu-management-v10-11.js','46-inventory-operations-v10-12.js','47-base-data-v10-12-1.js']){
    const matches=[...html.matchAll(new RegExp('<script defer src="\\./js/'+name.replaceAll('.','\\.')+'[^\\"]*"><\\/script>','g'))];
    assert.equal(matches.length,1,`${file}: ${name} declared once`);assert(matches[0].index>previous);previous=matches[0].index;
  }
  for(const name of ['09-menu-management-v10-11.css','10-inventory-operations-v10-12.css'])assert(html.indexOf(name)<html.indexOf('</head>'),file+': blocking stylesheet');
  checks++;
}
for(const name of ['45-menu-management-v10-11.js','46-inventory-operations-v10-12.js','47-base-data-v10-12-1.js']){
  const source=read('js/'+name);assert(source.includes('document.currentScript?.defer'),'deferred final patches must register after legacy patches');
}
assert(read('js/46-inventory-operations-v10-12.js').includes('script[src*="47-base-data-v10-12-1.js"]'));
assert(!/setTimeout\(install,(500|1200)\)/.test(read('js/47-base-data-v10-12-1.js')));
assert(!read('js/46-inventory-operations-v10-12.js').includes('setTimeout(install,500)'));
for(const file of ['17-v9-3-admin-enhancements.js','23-personnel-management-v9-5-3.js','25-user-management-v9-5-5.js','29-training-checklists-v9-7-0.js','34-final-operational-review-v10-1.js'])assert(!/setTimeout\(\(\)=>goView\(/.test(read('js/'+file)),file+': no delayed navigation');
async function verifyReadOnlyLoad(){
  for(const mode of ['live','empty','failure']){
    const calls=[];
    const c={window:{RAYO_ENV:{API_ORIGIN:'https://example.test',TIMEOUT_MS:200}},location:{pathname:'/inventory.html'},document:{getElementById:()=>null},AbortController,setTimeout,clearTimeout,console,crypto:require('crypto').webcrypto,
      fetch:async(url,options={})=>{calls.push({url:String(url),method:options.method||'GET'});return{ok:mode!=='failure',status:mode==='failure'?500:200,text:async()=>JSON.stringify(mode==='failure'?{message:'offline'}:mode==='empty'?{}:{meta:{initialized:true},ingredients:[],menuItems:[],recipes:[]})}}};
    vm.createContext(c);vm.runInContext(read('js/config.js'),c);
    let error;try{await c.window.RAYO_API_GATEWAY.loadOrBootstrap('pricing')}catch(e){error=e}
    if(mode==='failure')assert(error);
    assert(calls.length>0);assert(calls.every(x=>x.method==='GET'&&x.url.includes('/Load?module=pricing')),mode+': no Seed, Save or mutation on load');
    checks++;
  }
}
verifyReadOnlyLoad().then(()=>console.log(`PASS ${checks}: initial routes, one final startup render, slow data/view registration, bootstrap errors, input stability, ordered assets, no delayed navigation and read-only loads`)).catch(error=>{console.error(error);process.exitCode=1});
