// Bulk checklist import from CSV: templates are created by position or as «عمومی فردی», never tied to selected personnel.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const els={};const el=id=>els[id]||(els[id]={id,textContent:'',innerHTML:'',value:'',classList:{add(){},remove(){}},style:{}});
const commits=[];
const state={lists:{shifts:['صبح','عصر'],sections:['بار','سالن'],positions:['باریستا','سالن‌کار']},personnel:[{id:'P1',name:'الف',status:'فعال',mainPosition:'باریستا'}],checklistTemplates:[{id:'CLT-00001',name:'چک‌لیست موجود',mode:'section',section:'بار',positions:['باریستا'],shifts:['صبح'],items:[{id:'x',stage:'start',text:'قدیمی'}]}],checklistRecords:[]};
const ctx={state,views:{},titles:{},currentView:'checklistTemplates',console,setTimeout:()=>0,clearTimeout(){},URLSearchParams,location:{pathname:'/personnel.html',search:'?view=checklistTemplates'},
 document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){},readyState:'complete',createElement:()=>({})},
 toast:(m,e)=>{if(e)ctx.lastError=m},closeModal(){},commit:async r=>{commits.push(r)},renderView(){},pageHead:()=>''};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'js/29-training-checklists-v9-7-0.js'),'utf8'),ctx);
const T=ctx.RayoTraining;assert.ok(T?.importChecklists,'RayoTraining.importChecklists exported');
const csv='﻿name,mode,section,positions,shifts,stage,item,active\nچک‌لیست باریستا,section,بار,باریستا,صبح|عصر,start,روشن کردن اسپرسو,1\nچک‌لیست باریستا,section,بار,باریستا,صبح|عصر,end,شستشوی گروپ‌هد,1\nچک‌لیست عمومی,general,,,,start,لباس فرم,1\nچک‌لیست موجود,section,بار,باریستا,صبح,start,جایگزین نشود,1\n';
(async()=>{
 await T.importChecklists({files:[{name:'list.csv',text:async()=>csv}],value:'x'});
 assert.ok(!/فایل معتبر نیست/.test(els.modalBody.innerHTML),'valid CSV shows no error');
 assert.ok(/ثبت ۲ چک‌لیست جدید/.test(els.modalFoot.innerHTML),'preview offers the 2 new checklists only');
 assert.equal(commits.length,0,'nothing is saved before confirm');
 await T.confirmChecklistImport();
 assert.equal(commits.length,1,'one explicit save after confirm');
 const added=state.checklistTemplates.filter(x=>x.importSource==='bulk');assert.equal(added.length,2);
 for(const t of added)assert.deepEqual([...t.responsiblePersonnelIds],[],'no personnel selection needed');
 const bar=added.find(x=>x.name==='چک‌لیست باریستا');assert.deepEqual([...bar.positions],['باریستا']);assert.equal(bar.items.length,2);
 assert.equal(added.find(x=>x.name==='چک‌لیست عمومی').mode,'generalIndividual');
 assert.equal(state.checklistTemplates.find(x=>x.name==='چک‌لیست موجود').items[0].text,'قدیمی','existing template is never replaced');
 commits.length=0;await T.importChecklists({files:[{name:'bad.csv',text:async()=>'name,stage,item\nبد,شروع ناشناخته,آیتم\n'}],value:''});
 assert.ok(/فایل معتبر نیست/.test(els.modalBody.innerHTML),'invalid stage is reported');assert.ok(!/confirmChecklistImport/.test(els.modalFoot.innerHTML),'invalid file cannot be confirmed');
 console.log('checklist CSV import ok');
})().catch(e=>{console.error(e);process.exit(1)});
