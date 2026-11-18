// Probe: the staff app (app/staff.html, phase 1G-1). Signs in as the first staff member with the staff panel enabled (the
// password is read from the local copy and never printed), walks the pages and saves on the dev server, which keeps
// saves in memory only (nothing is written to .local-data or the live server).
//   PAGE=staff.html NOSESSION=1 node tools/smoke.cjs tools/probes/staff-app.js 300 390
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const set=(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
const load=async m=>InvEngine.unwrap(await (await fetch(InvEngine.API_ROOT+'Load?module='+m+'&_='+Date.now())).json());
try{window.confirm=()=>true;await wait(1500);out.loginShown=!!$('#stLogin');out.adminRejected=AdminAccess.session()===null;
 const hr=await load('personnel'),p=hr.personnel.find(x=>x.status==='فعال'&&x.userAccess?.enabled===true&&x.username);
 if(!p)throw Error('no staff account in the local copy');
 const f=$('#stLogin');set(f.u,'wrong');set(f.p,'wrong');f.requestSubmit();await wait(1500);out.wrongRejected=!AdminAccess.staff()&&/اشتباه/.test($('#stLoginErr').textContent);
 set(f.u,p.username.toUpperCase());set(f.p,p.userPassword);f.requestSubmit();await wait(2500);
 const s=AdminAccess.staff();out.signedIn=!!s&&s.personnelId===p.id;out.perms=s?.perms;out.legacySession=!!JSON.parse(sessionStorage.getItem('rayo_staff_session')||'null')?.personnelId;
 for(let i=0;i<60&&!InvControl.ready();i++)await wait(500);await wait(2500);
 out.home={tiles:$$('.st-tile').map(a=>a.innerText.split('\n')[0]),tasks:$$('.st-task b').map(b=>b.innerText),nav:$$('#stNav a').length,today:$('.st-today')?.innerText.replace(/\s+/g,' ').slice(0,120)};await shot('staff-home');
 // management panel stays closed for a staff session: AdminAccess.has opens only the mapped sections
 out.sections={cash:AdminAccess.has('cash'),inventory:AdminAccess.has('inventory'),finance:AdminAccess.has('financeLedger'),payroll:AdminAccess.has('payroll')};
 // cash report: a new report for a past day without one, saved by Mutate on the dev server
 location.hash='#/s/cash';await wait(1500);out.cashPage=$('.st-cta')?.innerText.replace(/\s+/g,' ').slice(0,80);await shot('staff-cash');
 const cr=InvControl.state.raw.cashreport,has=new Set(cr.reports.map(r=>InvEngine.D(r.date)));let d=InvEngine.CAL.today;for(let i=0;i<60&&has.has(d);i++)d=InvEngine.CAL.k(InvEngine.CAL.i(d)-1);
 StaffApp.cash('',d);await wait(1200);const m=$('#pnModal .modal');out.cashForm={cashierLocked:!!m.querySelector('[name=cashier][type=hidden]'),title:m.querySelector('h2')?.innerText};
 set(m.querySelector('[name=netReceivable]'),'1000000');set(m.querySelector('[name=pos1]'),'1000000');await shot('staff-cash-form');
 m.querySelector('#crSteps [data-step="3"]').click();await wait(300);m.querySelector('#crSave').click();await wait(4000);
 const cr2=await load('cashreport'),rec=cr2.reports.find(r=>InvEngine.D(r.date)===d);out.cashSaved=rec?{type:rec.registeredByType,byMe:rec.registeredByPersonnelId===p.id,cashierMe:rec.cashierId===p.id,name:rec.registeredByName===p.name}:null;out.cashErr=$('#iwErr')?.textContent||'';
 // beverage table
 location.hash='#/s/bev';await wait(2500);out.bev={table:!!$('#stBev .rbc-by, #stBev table, #stBev [class^=rbc]'),autoRoles:/خودکار/.test($('#stBev')?.innerText||'')};await shot('staff-bev');
 // waste (permission granted in the dev server memory only): saved with the person and «در انتظار بررسی»
 {const h=await load('personnel'),q=h.personnel.find(x=>x.id===p.id);q.userAccess.permissions.inventoryWaste=true;await fetch(InvEngine.API_ROOT+'Save?module=personnel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(h)});PeopleReal.state.doc=null;PeopleReal.load();await wait(2000)}location.hash='#/s/waste';await wait(1500);out.wasteTitle=$('.st-cta b')?.innerText;
 InvEntry.event();await wait(900);const w=$('#pnModal .modal');out.wasteTypes=[...w.querySelectorAll('[name=type] option')].map(o=>o.value);
 const it=[...InvControl.state.M.ing.values()].find(i=>i.status!=='غیرفعال'&&i.recipeUnit==='کیلوگرم');set(w.querySelector('[name=item]'),it.name+(it.code?' — '+it.code:''));await wait(200);set(w.querySelector('[name=qty]'),'0.01');set(w.querySelector('[name=reason]'),'آزمون probe');
 const sec=w.querySelector('[name=section]');if(sec&&sec.options.length>1)set(sec,sec.options[1].value);(w.querySelector('#iwOk')||[...w.querySelectorAll('.modal-foot .btn-primary')].pop()).click();await wait(3500);
 if($('#pnModal').classList.contains('open')&&/منفی/.test($('#pnModal').innerText)){(w.querySelector('#iwOk')||[...w.querySelectorAll('.modal-foot .btn-primary')].pop()).click();await wait(3500)}
 const inv2=await load('inventory'),wr=[...inv2.wasteRecords].reverse().find(r=>r.reason==='آزمون probe');out.wasteSaved=wr?{review:wr.reviewStatus,byMe:wr.reportedByPersonnelId===p.id,status:wr.status}:null;out.wasteErr=$('#iwErr')?.textContent||'';
 await wait(800);location.hash='#/s/waste';await wait(1500);out.wasteMine=$$('.st-row').length;await shot('staff-waste');
 // 1G-2: grant count / invoice / order permissions in the dev server memory, then count, asset incident, invoice and order forms
 {const h=await load('personnel'),q=h.personnel.find(x=>x.id===p.id);Object.assign(q.userAccess.permissions,{inventoryCounts:true,purchaseInvoices:true,purchaseRequests:true});await fetch(InvEngine.API_ROOT+'Save?module=personnel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(h)});PeopleReal.state.doc=null;PeopleReal.load();await wait(2000)}
 location.hash='#/s/home';await wait(1200);out.tiles2=[...document.querySelectorAll('.st-tile b')].map(b=>b.innerText);
 location.hash='#/s/count';await wait(2500);out.countPage=$('.st-cta')?.innerText.replace(/\s+/g,' ').slice(0,160);await shot('staff-count');
 const it2=[...InvControl.state.M.ing.values()].find(i=>i.status!=='غیرفعال'&&i.recipeUnit==='کیلوگرم'&&i.inventoryTracked!==false);StaffApp.count([it2.id],'آزمون شمارش');await wait(1500);const cm=$('#pnModal .modal');out.countForm={title:cm.querySelector('h2')?.innerText,inputs:cm.querySelectorAll('[data-c]').length};
 const ci=cm.querySelector('[data-c]');if(ci){set(ci,'1')}(cm.querySelector('#iwOk')||[...cm.querySelectorAll('.modal-foot .btn-primary')].pop()).click();await wait(4000);
 if($('#pnModal').classList.contains('open')){const b=[...$('#pnModal').querySelectorAll('.modal-foot .btn-primary')].pop();out.countSecond=$('#iwErr')?.textContent||'';b&&b.click();await wait(4000)}
 const inv3=await load('inventory'),cl=inv3.stocktakes.flatMap(s=>(s.lines||[]).map(l=>({s,l}))).find(x=>x.l.countedByPersonnelId===p.id&&x.l.ingredientId===ci?.dataset.c);out.countSaved=cl?{status:cl.s.status,name:cl.l.countedByName===p.name}:null;
 location.hash='#/s/asset';await wait(3000);out.assetPage=!!$('.st-cta');AssetsEntry.incident();await wait(900);const am=$('#pnModal .modal'),as=am.querySelector('[name=asset]');if(as&&as.options.length>1)set(as,as.options[1].value);set(am.querySelector('[name=desc]'),'آزمون probe');
 [...am.querySelectorAll('.modal-foot .btn-primary')].pop().click();await wait(3500);const asd=await load('assets'),ai=[...(asd.assetIncidents||[])].reverse().find(x=>x.description==='آزمون probe');out.assetSaved=ai?{me:ai.reportedByPersonnelId===p.id,status:ai.status,note:ai.managerNote}:null;out.assetErr=$('#iwErr')?.textContent||'';await wait(500);await shot('staff-asset');
 location.hash='#/s/invoice';await wait(3500);out.invoicePage=$('.st-cta b')?.innerText;PurchaseEntry.detailed();await wait(1500);out.invoiceForm=$('#pnModal .modal h2')?.innerText;await shot('staff-invoice-form');P.close();
 location.hash='#/s/order';await wait(1500);out.orderPage=$('.st-cta b')?.innerText;PurchaseEntry.order();await wait(1200);out.orderForm=$('#pnModal .modal h2')?.innerText;P.close();
 // 1G-3: tips, reservations, suppliers (permissions granted in the dev server memory)
 {const h=await load('personnel'),q=h.personnel.find(x=>x.id===p.id);Object.assign(q.userAccess.permissions,{tips:true,reservations:true,suppliersView:true});await fetch(InvEngine.API_ROOT+'Save?module=personnel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(h)});PeopleReal.state.doc=null;PeopleReal.load();await wait(2000)}
 location.hash='#/s/tips';await wait(1500);PeopleEntry.tip();await wait(900);{const m=$('#pnModal .modal');set(m.querySelector('[name=total]'),'100000');const c=m.querySelector('[data-tp]');if(c&&!m.querySelector('[data-tp]:checked')){c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}set(m.querySelector('[name=notes]'),'آزمون probe');[...m.querySelectorAll('.modal-foot .btn-primary')].pop().click();await wait(3500)}
 {const h=await load('personnel'),t=[...(h.tipGroups||[])].reverse().find(x=>x.notes==='آزمون probe');out.tipSaved=t?{me:t.createdByPersonnelId===p.id,people:(t.participants||[]).length}:null;out.tipErr=$('#iwErr')?.textContent||''}
 await wait(500);out.tipRows=$$('.st-row').length;
 location.hash='#/s/res';await wait(1500);CustomersEntry.reservation();await wait(900);{const m=$('#pnModal .modal'),fd=InvEngine.CAL.k(InvEngine.CAL.i(InvEngine.CAL.today)+2);set(m.querySelector('[name=date]'),fd);set(m.querySelector('[name=time]'),'20:00');set(m.querySelector('[name=name]'),'آزمون probe');set(m.querySelector('[name=phone]'),'09120000000');set(m.querySelector('[name=size]'),'4');[...m.querySelectorAll('.modal-foot .btn-primary')].pop().click();await wait(3500)}
 {const h=await load('personnel'),r=[...(h.reservations||[])].reverse().find(x=>x.customerName==='آزمون probe');out.resSaved=r?{me:r.createdByPersonnelId===p.id,status:r.status}:null;out.resErr=$('#iwErr')?.textContent||''}
 await wait(500);out.resRows=$$('.st-row').length;await shot('staff-res');
 location.hash='#/s/sup';await wait(3000);out.supRows=$$('#stSupL .st-row').length;await shot('staff-sup');
 // shifts and leave request
 location.hash='#/s/shifts';await wait(2500);out.shifts=$$('.st-row').length||$('.st-page')?.innerText.slice(0,60);await shot('staff-shifts');
 location.hash='#/s/leave';await wait(1500);StaffApp.leave();await wait(800);const l=$('#pnModal .modal'),fd=InvEngine.CAL.k(InvEngine.CAL.i(InvEngine.CAL.today)+20);set(l.querySelector('[name=from]'),fd);set(l.querySelector('[name=to]'),fd);set(l.querySelector('[name=note]'),'آزمون probe');
 [...l.querySelectorAll('.modal-foot .btn-primary')].pop().click();await wait(3500);const hr2=await load('personnel'),lr=[...(hr2.leaveRequests||[])].reverse().find(r=>r.employeeNote==='آزمون probe');out.leaveSaved=lr?{me:lr.personnelId===p.id,status:lr.status,from:lr.fromDate===fd}:null;
 out.passwordKept=hr2.personnel.find(x=>x.id===p.id)?.userPassword===p.userPassword;await wait(500);out.leaveRows=$$('.st-row').length;await shot('staff-leave');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
