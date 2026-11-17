// Probe: «حقوق ماه» of an open (not final) month — each fine has «لغو»; cancelling one with a reason removes it from the
// month's deductions. Local dev server only: saves stay in memory. Prints counts and amounts only, no names.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const open=()=>$('#pnModal')?.classList.contains('open');
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/people/payroll';await wait(3000);const ms=$('#pyM');out.monthSel=!!ms;
 if(ms){const o=[...ms.options].find(x=>/مهر/.test(x.textContent));if(o){ms.value=o.value;ms.dispatchEvent(new Event('change'));await wait(2000)}}
 const H=()=>PeopleReal.doc(),PC=window.PayrollCore,ded=()=>PC.monthSummary(H(),1405,7).rows.reduce((a,r)=>a+r.deductions,0);
 out.state=PC.monthState(H(),1405,7,InvEngine.CAL.today);out.buttons=$$('[data-prs]').length;out.dedBefore=ded();
 const fine=(H().penaltiesRewards||[]).find(x=>+x.year===1405&&+x.month===7&&x.type==='جریمه'&&x.status==='تاییدشده');
 if(fine&&$('[data-prs="'+fine.id+'"]')){$('[data-prs="'+fine.id+'"]').click();await wait(500);out.modal=open();
  $('#pnModal [name=st]').value='لغوشده';$('#pnModal [name=reason]').value='probe';
  $$('#pnModal button').find(b=>/ذخیره روی سرور/.test(b.innerText)).click();for(let i=0;i<40&&open();i++)await wait(250);await wait(1000);
  const f2=H().penaltiesRewards.find(x=>x.id===fine.id);out.after={status:f2.status,amount:fine.amount,dedAfter:ded(),closed:!open(),err:$('#pnModal .err, #iwErr')?.textContent||''}}
 // the same from a person's payroll modal
 const f3=(H().penaltiesRewards||[]).find(x=>+x.year===1405&&+x.month===7&&x.type==='جریمه'&&x.status==='تاییدشده');
 if(f3){const row=$('[data-psd="'+f3.personnelId+'"]');row.click();await wait(700);out.detail={open:open(),buttons:$$('#pnModal [data-prs]').length};
  $('#pnModal [data-prs="'+f3.id+'"]').click();await wait(600);$('#pnModal [name=st]').value='لغوشده';$('#pnModal [name=reason]').value='probe';
  $$('#pnModal button').find(b=>/ذخیره روی سرور/.test(b.innerText)).click();for(let i=0;i<40&&open();i++)await wait(250);await wait(800);
  out.detail.after=H().penaltiesRewards.find(x=>x.id===f3.id).status}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
