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
    for(const button of nav.children){button.onclick();if(route==='personnel.html'&&button.dataset.href.startsWith('personnel.html?view='))assert.equal(calls.at(-1),new URLSearchParams(button.dataset.href.split('?')[1]).get('view'));else if(button.dataset.href!==href)assert.equal(context.location.href,button.dataset.href)}
    checked++;
  }
}
route='personnel.html';context.currentView='reservations';vm.runInContext('personnelTabs()',context);assert.equal(nav,null);
console.log(`PASS: ${checked} routes, five flat menu entries, active tabs, repeat rendering and cross-page settings navigation`);
