// Probe: item units — «ویرایش قلم» (sections apart, واحدها: base / purchase in grams / use / count / other units), recipe in
// grams, count «۵ بسته + ۱۰۰ گرم», waste starting in the use unit. Local dev server only: saves stay in memory.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const saveModal=async()=>{const b=$$('#pnModal button').find(b=>/ذخیره روی سرور/.test(b.innerText));b.click();const open=()=>$('#pnModal')?.classList.contains('open');for(let i=0;i<40&&open()&&!$('#iwErr')?.textContent;i++)await wait(250);await wait(500);return $('#iwErr')?.textContent||(open()?'still open':'')};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 const ing=()=>InvControl.state.raw.pricing.ingredients,byName=n=>ing().find(i=>i.name===n&&i.status!=='غیرفعال');
 const fil=byName('فیله گوساله'),pea=byName('بادام زمینی نمکی');out.found=[!!fil,!!pea];
 location.hash='#/inventory/catalog';await wait(3000);
 // 1. peanut item form: purchase unit بسته = 350 g, other unit «بسته ۱۰۰ گرمی = 100 g», count unit بسته
 CatalogReal.unitsForm();await wait(600);$('#unNew').value='بسته ۱۰۰ گرمی';$('#unAdd').click();await wait(200);await saveModal();
 CatalogReal.ingredientForm(pea.id);await wait(900);const m=$('#pnModal');
 const secs=$$('#pnModal .fsec').map(s=>s.getBoundingClientRect()).filter(r=>r.height>0);out.secGaps=secs.slice(1).map((r,k)=>Math.round(r.top-secs[k].bottom));
 out.sections=$$('#pnModal .fsec>summary b').map(b=>b.innerText);out.autoUnits=$('#cuAuto')?.innerText;
 m.querySelector('[name=pu]').value='بسته';m.querySelector('[name=pack]').value='۳۵۰';const pu=m.querySelector('[name=packU]');pu.value='گرم';pu.dispatchEvent(new Event('change',{bubbles:true}));
 $('#cuAdd').click();await wait(200);const r=$$('.cu-row').at(-1),sel=(f,v)=>{const x=r.querySelector(`[data-f=${f}]`);x.value=v;x.dispatchEvent(new Event('change',{bubbles:true}))};sel('a','بسته ۱۰۰ گرمی');r.querySelector('[data-f=q]').value='۱۰۰';sel('b','گرم');await wait(200);
 const cu=m.querySelector('[name=cntU]');out.countOpts=[...cu.options].map(o=>o.text);cu.value='بسته';out.useOpt=m.querySelector('[name=useU]').value;out.prev=$('#ingPrev')?.innerText;
 await shot('units-item');out.e1=await saveModal();const pea2=byName('بادام زمینی نمکی');out.peaSaved={pk:pea2.packageQuantity,pu:pea2.purchaseUnit,cu:pea2.countUnit,use:pea2.useUnit,units:(pea2.countingUnits||[]).map(u=>u.name+'='+u.factor)};
 // 2. a recipe with fillet: shown in grams, saved unchanged in kg
 const pr=InvControl.state.raw.pricing,line=pr.recipes.find(l=>l.ingredientId===fil.id),menu=pr.menuItems.find(x=>x.id===line.menuItemId);out.recipeBefore=line.quantity;
 MenuEntry.recipe(menu.id);await wait(1200);const rr=$$('.mr-row').find(x=>x.querySelector('[data-f=item]').value.startsWith('فیله گوساله'));out.recipeRow=rr?[rr.querySelector('[data-f=qty]').value,rr.querySelector('[data-f=unit]').value,[...rr.querySelector('[data-f=unit]').options].map(o=>o.value).join('/')]:null;
 out.recipeCostBefore=$('#mrSum')?.innerText.replace(/\s+/g,' ').slice(0,60);await shot('units-recipe');await close();
 // 3. count «۵ بسته + ۱۰۰ گرم»
 InvEntry.count();await wait(1200);const q=$('#iwQ');q.value='بادام زمینی نمکی';q.oninput({target:q});await wait(400);
 const qi=$(`[data-c="${pea.id}"]`),ri=$(`[data-r="${pea.id}"]`),us=$(`[data-u="${pea.id}"]`);out.countUnit=us?.value;out.restVisible=ri&&getComputedStyle(ri.closest('.iw-rest')).visibility;
 qi.value='۵';qi.dispatchEvent(new Event('input',{bubbles:true}));ri.value='۱۰۰';ri.dispatchEvent(new Event('input',{bubbles:true}));await wait(200);out.countHint=$(`[data-uu="${pea.id}"]`)?.innerText;
 await shot('units-count');window.confirm=()=>true;out.e3=await saveModal();
 const st=InvControl.state.raw.inventory.stocktakes.filter(s=>s.status!=='void').at(-1),cl=st&&st.lines.find(l=>l.ingredientId===pea.id);out.countLine=cl&&{actual:cl.actual,eq:cl.entryQuantity,eu:cl.entryUnit,rq:cl.entryRestQuantity,ru:cl.entryRestUnit};
 // 4. waste starts in the use unit
 InvEntry.event();await wait(900);const it=$('#pnModal [name=item]');it.value=[...document.querySelectorAll('#iwIng option')].find(o=>o.value.startsWith('فیله گوساله'))?.value||'فیله گوساله';it.onchange();await wait(200);out.wasteUnit=$('#pnModal [name=unit]')?.value;await close();
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
