// Probe: people section UI (tab order, work and payments column alignment, staff report, payroll settings card,
// person file «بازگشت», menu credit lines of the payslip, visual salary report). Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const go=async h=>{location.hash=h;await wait(2500)};
// header cell and first body cell of every column: same horizontal centre (±2px) means the columns line up
const cols=tb=>{if(!tb||!tb.tBodies[0]?.rows[0])return null;const h=[...tb.tHead.rows[0].cells],b=[...tb.tBodies[0].rows[0].cells];return h.map((c,i)=>{const mid=e=>{const r=e.getBoundingClientRect();return Math.round(r.left+r.width/2)};const inner=b[i]?.querySelector('input,button,b,span')||b[i];return{t:c.innerText.replace(/\s+/g,' ').trim().slice(0,14),al:getComputedStyle(c).textAlign,d:b[i]?mid(c)-mid(b[i]):null,di:inner?mid(c)-mid(inner):null}})};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/people/staff';for(let i=0;i<40&&!window.PeopleReal?.doc?.();i++)await wait(500);await wait(1500);
 out.tabs=$$('.page-tabs .tab').map(a=>a.innerText.trim());out.staffCols=$$('#hpTable thead th').map(c=>c.innerText.trim()).filter(t=>/شیفت/.test(t));await shot('pu-staff');
 // person file: open a sub-form and come back
 const row=$('[data-hp]');if(row){(row.querySelector('[data-prof]')||row).click();await wait(800);out.file={title:$('#pnModal h2')?.innerText.trim().slice(0,40),acts:$$('#pnModal [data-act]').map(b=>b.innerText.trim())};await shot('pu-file');
  const b=$('#pnModal [data-act="salary"]')||$('#pnModal [data-act="info"]');if(b&&!b.disabled){b.click();await wait(800);out.sub={title:$('#pnModal h2')?.innerText.trim().slice(0,50),back:!!$('#pnModal [data-back]'),credit:!!$('#pnModal [name=credit]'),weekly:!!$('#pnModal [name=wsh]')};{const w=$('#pnModal [name=wsh]');if(w){w.value='6';w.dispatchEvent(new Event('input',{bubbles:true}));out.sub.weeklyHint=$('#sfWk')?.innerText}}await shot('pu-sub');const bk=$('#pnModal [data-back]');if(bk){bk.click();await wait(700);out.afterBack=$('#pnModal h2')?.innerText.trim().slice(0,40);out.openAfterBack=$('#pnModal').classList.contains('open')}}
  window.P.close()}
 await go('#/people/work');{const s=$('#wkM'),pick=s&&[...s.options].find(o=>/مهر/.test(o.text));if(pick&&s.value!==pick.value){s.value=pick.value;s.dispatchEvent(new Event('change',{bubbles:true}));await wait(2000)}}
 {const tw=$('.wk-table')?.closest('.table-wrap');out.work={w:tw?.scrollWidth,cw:tw?.clientWidth,cols:cols($('.wk-table'))};await shot('pu-work')}
 await go('#/people/payments');{const s=$('#pfYm');if(s){s.value='all';s.dispatchEvent(new Event('change',{bubbles:true}));await wait(1500)}const tb=$('#pnTab table.table');const tw=tb?.closest('.table-wrap');out.pay={w:tw?.scrollWidth,cw:tw?.clientWidth,cols:cols(tb)};await shot('pu-payments')}
 await go('#/people/staffreport');{const tb=$('#pnTab table.table');out.rep={cols:cols(tb)};await shot('pu-report')}
 await go('#/people/payset');out.set={credit:!!$('[name=mc]'),hint:(()=>{const b=$('#psMe'),h=b?.parentElement.querySelector('.hint');if(!b||!h)return null;const a=b.getBoundingClientRect(),c=h.getBoundingClientRect();return{below:c.top>=a.bottom,gap:Math.round(c.top-a.bottom)}})()};await shot('pu-payset');
 await go('#/people/payroll');out.payroll={visual:!!$('#pyVis'),slips:!!$('#pySlips')};await shot('pu-payroll');
 if($('#pyVis')){$('#pyVis').click();await wait(1200);out.vis={title:$('#pnModal h2')?.innerText.trim().slice(0,60),groups:$$('#pnModal .sv-group').length,total:$('#pnModal .sv-total b')?.innerText.trim(),donut:!!$('#pnModal .sv-donut svg')};await shot('pu-visual');window.P.close()}
 // salary detail always shows the menu block; «فیش» opens a preview modal with the menu table
 {const r=$('[data-psd]');if(r){r.click();await wait(700);out.detail={menu:/اعتبار منو در ماه/.test($('#pnModal')?.innerText||'')};$('#pdSlip')?.click();await wait(900);const fr=$('#pvFrame');out.slipModal={frame:!!fr,menu:/حق استفاده از منو/.test(fr?.contentDocument?.body?.innerText||''),print:!!$('#pvPrint')};await shot('pu-slip');window.P.close()}}
 // base lists: handed-over items
 await go('#/settings');{const b=$('#stBaseHr')||$('[data-st="stBaseHr"]');if(b){b.click();await wait(800);const t=$('#pnModal [name=l_equipmentTypes]');out.equip={field:!!t,lines:t?t.value.split('\n').length:0};await shot('pu-equip');window.P.close()}else out.equip='no button'}
 // payslip menu lines on an in-memory person (nothing saved)
 if(window.PayrollReal?.slipHtml){const PC=PayrollCore,d=PeopleReal.doc(),ms=PC.months(d,InvEngine.CAL.today),x=ms.at(-1),r=PC.monthRows(d,x.year,x.month)[0];if(r){const h=PayrollReal.slipHtml(r.personnelId,x.year,x.month);out.slip={menu:/حق استفاده از منو/.test(h),share:/سهم پرسنل پس از اعمال تخفیف/.test(h)}}}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
