// Probe (BL-095): «نی سایز 6» (base and purchase «بسته», «۱ بسته = ۱۰۰ عدد»): the pack line shows «هر بسته = ۱۰۰ عدد» and
// is editable (writes the conversion row); «تغییر واحد اصلی» opens with targets and a preview. Nothing is saved.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 const s=InvControl.state.raw.pricing.ingredients.find(i=>i.code==='6002');location.hash='#/inventory/catalog';await wait(2500);CatalogReal.ingredientForm(s.id);await wait(900);
 const pin=$('#pnModal [name=pack]'),pu=$('#pnModal [name=packU]');out.pack={v:pin.value,ro:pin.readOnly,u:pu.value,dis:pu.disabled,hint:$('#ingPkH').innerText.slice(0,90)};
 pin.focus();pin.value='۱۲۰';pin.dispatchEvent(new Event('input',{bubbles:true}));await wait(300);
 out.afterType=$$('.cu-row').map(r=>[r.querySelector('[data-f=a]').value,r.querySelector('[data-f=q]').value,r.querySelector('[data-f=b]').value,r.querySelector('[data-f=say]').innerText]);
 out.btn=!!$('#ingBaseChg');await shot('pack-line');
 window.confirm=()=>true;$('#ingBaseChg')?.click();await wait(900);
 out.change={opts:$$('#pnModal [name=to] option').map(o=>o.innerText),prev:$('#bcPrev')?.innerText.replace(/\s+/g,' ').slice(0,420)};await shot('base-change');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
