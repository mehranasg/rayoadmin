// Probe: people → work month (no horizontal scroll, help icon, fines column, «سایر» window), finalize buttons, tip rounding column. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/people/staff';for(let i=0;i<40&&!window.PeopleReal?.doc?.();i++)await wait(500);{const d=PeopleReal.doc();d.settings=d.settings||{};if(!d.settings.payrollStartYear){d.settings.payrollStartYear=1405;d.settings.payrollStartMonth=7;out.startSetInMemory=true}}location.hash='#/people/payroll';await wait(4000);out.closePrev=$('#pyClosePrev')?.innerText.trim()||null;out.close=$('#pyClose')?.innerText.trim()||null;
 location.hash='#/people/work';await wait(3500);const s=$('#wkM');out.months=s?[...s.options].map(o=>o.text):null;
 const pick=s&&[...s.options].find(o=>/مهر/.test(o.text));if(pick){s.value=pick.value;s.dispatchEvent(new Event('change',{bubbles:true}));await wait(2500)}
 const tw=$('.wk-table')?.closest('.table-wrap');out.work={w:tw?.scrollWidth,cw:tw?.clientWidth,head:[...($('.wk-table')?.tHead.rows[0].cells||[])].map(c=>c.innerText.replace(/\s+/g,' ').trim()),help:!!$('.wk-table .help-i'),closeBtn:$('#wkClose')?.innerText.trim()||null};await shot('work');
 const b=$('[data-othe]');if(b){b.click();await wait(700);out.oth=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,120);const x=$('#pnModal [name=op]');x.value='200000';$('#othOk').click();await wait(500);out.after={btn:$(`[data-oth="${b.dataset.othe}"]`)?.innerText.trim(),save:!$('#wkSave').disabled}}
 location.hash='#/people/tips';await wait(3500);const ent=$$('#pnTab button, #pnTab a, #pnTab [data-v]').find(x=>/ثبت‌ها/.test(x.innerText));if(ent){ent.click();await wait(1500)}
 const tt=[...$$('#pnTab table')].find(t=>/اختلاف رند/.test(t.tHead?.innerText||''));out.tips=tt?{rows:tt.tBodies[0].rows.length,first:tt.tBodies[0].rows[0]?.innerText.replace(/\s+/g,' ').slice(0,120)}:null;await shot('tips');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
