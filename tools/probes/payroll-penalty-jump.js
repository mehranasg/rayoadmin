// Probe: one person's month window (payroll) — opened from «کارکرد ماه» for an earlier month (مهر); fine, reward, cancel,
// payment and contract forms come back to the window after saving; the page keeps its place (dev server, in-memory copy,
// never the real API). Run at 390 for a phone.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const title=()=>($('#pnModal.open .modal-head')||{}).innerText||'';
const saveWait=async()=>{const t0=title();$('#iwOk').click();for(let i=0;i<50;i++){await wait(300);if(title()&&title()!==t0)break}await wait(400)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/people/work';for(let i=0;i<40&&!window.PeopleReal?.doc?.();i++)await wait(500);await wait(1200);
 const H=PeopleReal.doc,st=PayrollReal.st;st.y=1405;st.m=7;P.render();await wait(800);
 out.workTitle=($('#pnTab .toolbar')||{}).innerText?.slice(0,60);out.pmButtons=$$('[data-pmd]').length;out.penBtn=!!$('#wkPen');
 const pid=$('.wk-pm')?.dataset.pmd;scrollTo(0,400);await wait(200);const y0=Math.round(scrollY);
 $(`.wk-pr[data-pmd="${pid}"]`).click();await wait(700);out.windowTitle=title();out.acts=$$('#pnModal [data-pda]').map(b=>b.innerText.trim()+(b.disabled?' (off)':''));out.monthSel=!!$('#pdMon');
 // fine for مهر
 $('#pnModal [data-pda=fine]').click();await wait(600);out.fineForm={title:title(),date:$('#pnModal [name=date]').value,hint:$('#prSm')?.textContent,type:$('#pnModal [name=type]').value,pid:$('#pnModal [name=pid]').value===pid,back:!!$('#pnModal [data-back]')};
 $('#pnModal [name=amount]').value='70000';$('#pnModal [name=reason]').value='آزمون پروندهٔ ماه';await saveWait();
 const it=(H().penaltiesRewards||[]).find(x=>x.reason==='آزمون پروندهٔ ماه');out.fineSaved=it&&[it.year,it.month,it.status,it.type];out.afterFine=title();out.listed=/آزمون پروندهٔ ماه/.test($('#pnModal').innerText);
 // reward
 $('#pnModal [data-pda=reward]').click();await wait(600);out.rewardType=$('#pnModal [name=type]').value;$('#pnModal [data-back]').click();await wait(600);out.backFromReward=title();
 // cancel the fine
 $(`#pnModal [data-prs="${it.id}"]`).click();await wait(600);out.cancelForm=title();$('#pnModal [name=reason]').value='آزمون لغو';await saveWait();
 out.cancelled=(H().penaltiesRewards||[]).find(x=>x.id===it.id)?.status;out.afterCancel=title();
 // payment and contract open with a way back
 $('#pnModal [data-pda=pay]').click();await wait(800);out.payForm={title:title(),back:!!$('#pnModal [data-back]')};$('#pnModal [data-back]').click();await wait(600);
 $('#pnModal [data-pda=terms]').click();await wait(800);out.termsForm={title:title(),eff:$('#pnModal [name=eff]')?.value,back:!!$('#pnModal [data-back]')};$('#pnModal [data-back]').click();await wait(600);out.final=title();
 out.hash=location.hash;out.scrollKept=Math.abs(Math.round(scrollY)-y0)<5;out.pageWidth=document.documentElement.scrollWidth<=innerWidth+1;
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
