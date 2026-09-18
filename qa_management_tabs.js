'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8');
let nav=null,route='',calls=[];
function element(){return {children:[],dataset:{},classList:{toggle(){}},setAttribute(){},appendChild(child){this.children.push(child)},querySelectorAll(){return this.children},remove(){nav=null}}}
const root={prepend(value){nav=value}};
const context={URLSearchParams,location:{search:'',href:''},file:()=>route,currentView:'',goView:view=>calls.push(view),document:{getElementById:id=>id==='view'?root:nav,createElement:element}};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('const SUB='),source.indexOf('function vis()'))+source.slice(source.indexOf('function personnelTabs(){'),source.indexOf('function pageTabs(){'))+';this.groups=SUB;this.menu=MENU;',context);
let checked=0;
for(const group of ['personnel','shift','payroll','training','settings']){
  assert.equal(context.menu.find(row=>row[0]===group)[1],'link');
  for(const [label,href] of context.groups[group]){
    route=href.split('?')[0];context.currentView=new URLSearchParams(href.split('?')[1]).get('view');
    nav=null;vm.runInContext('personnelTabs()',context);
    assert.equal(nav.dataset.group,group);assert.equal(nav.children.length,context.groups[group].length);
    assert.equal(nav.children.filter(button=>button.className.includes('active')).length,1);
    assert.equal(nav.children.find(button=>button.className.includes('active')).textContent,label);
    vm.runInContext('personnelTabs()',context);assert.equal(nav.children.length,context.groups[group].length);
    for(const button of nav.children){button.onclick();if(button.dataset.href.startsWith(route+'?view='))assert.equal(calls.at(-1),new URLSearchParams(button.dataset.href.split('?')[1]).get('view'));else if(button.dataset.href!==href)assert.equal(context.location.href,button.dataset.href)}
    checked++;
  }
}
route='personnel.html';context.currentView='reservations';vm.runInContext('personnelTabs()',context);assert.equal(nav,null);
assert.equal(context.menu.find(row=>row[0]==='settings')[4],'settings.html');
assert(context.groups.settings.every(([,href])=>href==='base-data.html'||href.startsWith('settings.html?view=')));
function navigation(path,search=''){
  const handlers={},redirects=[],historyEntries=[];
  const location={pathname:'/'+path,search,href:'https://example.test/'+path+search,replace:href=>redirects.push(href)};
  const c={URL,URLSearchParams,location,currentView:'',views:{},window:null,document:{getElementById:()=>null,addEventListener(){}},sessionStorage:{getItem:()=> 'qa'},setTimeout(){},buildSidebar(){},addEventListener:(type,fn)=>handlers[type]=fn,history:{pushState(value,title,url){historyEntries.push(url.href);location.href=url.href;location.search=url.search}},goView(v){c.currentView=v}};
  c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('js/16-mpa-shell.js','utf8'),c);
  const legacy=fs.readFileSync('js/17-v9-3-admin-enhancements.js','utf8');
  vm.runInContext(legacy.slice(legacy.indexOf('function installHistoryRouting(){'),legacy.indexOf('// Dashboard operational tasks'))+';installHistoryRouting();',c);
  return{c,redirects,historyEntries,handlers};
}
for(const view of ['dataManagement','settings','violationSettings','changelog','errorLog']){
  const old=navigation('personnel.html','?view='+view+'&qa=1');assert.equal(old.redirects[0],'settings.html?view='+view+'&qa=1');
  const h=navigation('settings.html','?view='+view);assert.equal(h.c.currentView,view);h.c.goView('settings');assert.equal(h.c.currentView,'settings');assert(h.c.location.href.includes('settings.html?view=settings'));
  h.c.location.search='?view='+view;h.c.views[view]=()=>'';h.handlers.popstate();assert.equal(h.c.currentView,view);
}
{
  const h=navigation('settings.html');assert.equal(h.c.currentView,'dataManagement');h.c.goView('annualCalendar');assert.equal(h.c.location.href,'personnel.html?view=annualCalendar');assert.equal(h.historyEntries.length,0);
  const p=navigation('personnel.html');p.c.goView('violationSettings');assert.equal(p.c.location.href,'settings.html?view=violationSettings');assert.equal(p.historyEntries.length,0);
  assert.equal(navigation('settings.html','?view=personnel').c.currentView,'dataManagement');
}
console.log(`PASS: ${checked} routes, five flat menu entries, active tabs, repeat rendering and cross-page settings navigation`);
