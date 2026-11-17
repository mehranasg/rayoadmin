// Probe: a pack item used by the piece — «نی سایز 6»: other unit shown as «عدد: ۱۰۰ در هر بسته», use عدد, count بسته with the
// remainder in عدد; recipe row: the cost cell never overlaps the unit select. Read only (no save).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 const pr=InvControl.state.raw.pricing,s=pr.ingredients.find(i=>i.code==='6002');
 location.hash='#/inventory/catalog';await wait(2500);CatalogReal.ingredientForm(s.id);await wait(900);
 const r=$('.cu-row');out.cuRow=r&&{a:r.querySelector('[data-f=a]').value,q:r.querySelector('[data-f=q]').value,b:r.querySelector('[data-f=b]').value,say:r.querySelector('[data-f=say]')?.innerText};
 out.use=$('#pnModal [name=useU]')?.value;out.cnt=$('#pnModal [name=cntU]')?.value;
 $$('#pnModal .fsec')[1]?.scrollIntoView();await shot('straw-item');await close();
 InvEntry.count();await wait(1200);const q=$('#iwQ');q.value='نی سایز 6';q.oninput({target:q});await wait(400);
 const qi=$(`[data-c="${s.id}"]`),ri=$(`[data-r="${s.id}"]`);out.countUnit=$(`[data-u="${s.id}"]`)?.value;out.restUnit=ri?.closest('.iw-rest')?.innerText.trim();qi.value='۳';qi.dispatchEvent(new Event('input',{bubbles:true}));ri.value='۴۰';ri.dispatchEvent(new Event('input',{bubbles:true}));await wait(200);out.countHint=$(`[data-uu="${s.id}"]`)?.innerText;await close();
 const m=pr.menuItems.find(x=>x.name==='رد ماک');MenuEntry.recipe(m.id);await wait(1200);
 const ov=$$('.mr-row').map(row=>{const u=row.querySelector('[data-f=unit]').getBoundingClientRect(),c=row.querySelector('[data-f=cost]').getBoundingClientRect();return{item:row.querySelector('[data-f=item]').value.split(' — ')[0],q:row.querySelector('[data-f=qty]').value,unit:row.querySelector('[data-f=unit]').value,cost:row.querySelector('[data-f=cost]').innerText,overlap:c.width>0&&u.width>0&&!(c.right<=u.left+1||c.left>=u.right-1)&&!(c.bottom<=u.top||c.top>=u.bottom)}});out.recipe=ov;await shot('straw-recipe');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
