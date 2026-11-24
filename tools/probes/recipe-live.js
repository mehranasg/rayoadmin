// Probe: stage 2 recipe page (BL-073, BL-075). Recipe form: changing a row's quantity or unit updates that row's cost and
// the total at once; the recipe view: each ingredient row has a price edit button that opens the price form for that item.
// Nothing is saved (dev server, forms only).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 const pr=InvControl.state.raw.pricing,MW=window.MenuWrite,m=pr.menuItems.find(x=>x.status!=='غیرفعال'&&MW.recipeLines(pr,x.id).filter(l=>l.ingredientId).length>=2);
 location.hash='#/menu/recipes/'+m.id;await wait(3000);out.item=m.name;
 out.viewPriceBtns=$$('[data-ingprice]').length;await shot('recipe-view');
 const b=$('[data-ingprice]');if(b){b.click();await wait(800);out.priceForm={title:$('#pnModal .modal-head, #pnModal header')?.textContent?.trim().slice(0,80)||'',hasPrice:!!$('#pnModal [name=price]')};await shot('recipe-price');P.close&&P.close();await wait(400)}
 MenuEntry.recipe(m.id);await wait(1200);const r=$('#mrRows .mr-row'),cost=()=>r.querySelector('[data-f=cost]').textContent,sum=()=>$('#mrSum').innerText.replace(/\s+/g,' ');
 out.before={cost:cost(),sum:sum()};const qi=r.querySelector('[data-f=qty]'),q0=qi.value;qi.value=String(Number(String(q0).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))*2||2);qi.dispatchEvent(new Event('input',{bubbles:true}));await wait(200);out.doubled={q:qi.value,cost:cost(),sum:sum()};
 const us=r.querySelector('[data-f=unit]');out.units=[...us.options].map(o=>o.value);if(us.options.length>1){us.selectedIndex=(us.selectedIndex+1)%us.options.length;us.dispatchEvent(new Event('change',{bubbles:true}));await wait(200);out.unitChanged={u:us.value,cost:cost(),sum:sum()}}
 await shot('recipe-form');out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
