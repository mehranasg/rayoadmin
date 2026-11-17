// Probe: «تخلفات» — a violation of an earlier month whose salary is not final shows «ابطال»; voiding it cancels its fine
// (a cancelled fine leaves «حقوق ماه»). Local dev server only: saves stay in memory. Prints counts only, no names.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const open=()=>$('#pnModal')?.classList.contains('open');
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/people/violations';await wait(3000);const H=()=>PeopleReal.doc(),PC=window.PayrollCore,today=InvEngine.CAL.today,blk=x=>PeopleWrite.violationVoidBlock(H(),x);
 const all=(H().workViolations||[]),inM=k=>all.filter(x=>String(x.date).startsWith(k)),months=[...new Set(all.map(x=>String(x.date).slice(0,7)))].sort();
 out.months=months.map(k=>{const [y,m]=k.split('/').map(Number);return{k,state:PC.monthState(H(),y,m,today),n:inM(k).length,voidable:inM(k).filter(x=>!blk(x)).length}});
 const prev=out.months.filter(x=>x.state==='open'&&x.voidable).pop();out.prev=prev?prev.k:'';
 if(prev){const ms=$('[data-filters=vi] [data-fk=month]');ms.value=prev.k;ms.dispatchEvent(new Event('change'));await wait(1500);
  out.buttons={void:$$('#viTable [data-vv]').length,edit:$$('#viTable [data-ve]').length};
  const cand=inM(prev.k).filter(x=>!blk(x)),v=cand.find(x=>x.hasFine&&x.penaltyId)||cand[0];
  out.hasFine=!!v.hasFine;$('#viTable [data-vv="'+v.id+'"]').click();await wait(500);out.modal=open();$('#pnModal [name=r]').value='probe';
  $$('#pnModal button').find(b=>/ابطال روی سرور/.test(b.innerText)).click();for(let i=0;i<40&&open();i++)await wait(250);await wait(800);
  const v2=H().workViolations.find(x=>x.id===v.id),pr=v2.penaltyId&&H().penaltiesRewards.find(r=>r.id===v2.penaltyId);out.after={status:v2.status,fine:pr?pr.status:'-',closed:!open()}}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
