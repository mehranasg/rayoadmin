// Probe: stage 3 count form (BL-077..BL-081). «+ محل» adds a second count of one item with its own place and unit and the
// hint shows the total; the Excel count sheet (generated in the page, filled, put back through the file input) fills the
// form; on a date with a daily beverage control the fridges' night count can be added; the stocktake detail has the edit
// pencil beside the counted value. Nothing is saved (no save button is pressed).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(400);const c=$$('#pnModal button').find(b=>/بستن بدون|بله|تأیید/.test(b.innerText));if(c)c.click();await wait(300)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/count';await wait(3000);
 // stocktake detail: pencil beside the count
 out.pencilInCount=$$('.cnt-cell [data-cle]').length;await shot('count-detail');
 // count form
 const inv=InvControl.state.raw.inventory,W=window.InvWrite;out.places=W.countPlaces(inv);
 window.InvEntry.count();await wait(1500);const it=InvControl.state.raw.pricing.ingredients.find(i=>W.stockItem(i)&&W.unitsOf(i).length>1);
 const q=$('#iwQ');q.value=it.name;q.dispatchEvent(new Event('input',{bubbles:true}));await wait(400);
 const main=$(`[data-c="${CSS.escape(it.id)}"]`);main.value='2';main.dispatchEvent(new Event('input',{bubbles:true}));
 $(`[data-xadd="${CSS.escape(it.id)}"]`).click();await wait(300);const xq=$(`[data-xq="${CSS.escape(it.id)}|0"]`);out.subRow=!!xq;
 if(xq){xq.value='3';xq.dispatchEvent(new Event('input',{bubbles:true}));const xu=$(`[data-xu="${CSS.escape(it.id)}|0"]`);xu.selectedIndex=xu.options.length-1;xu.dispatchEvent(new Event('change',{bubbles:true}));await wait(200)}
 out.item={name:it.name,units:W.unitsOf(it).map(u=>u.name+'='+u.factor),mainPlace:$(`[data-mp="${CSS.escape(it.id)}"]`)?.value,subPlace:$(`[data-xp="${CSS.escape(it.id)}|0"]`)?.value,hint:$(`[data-uu="${CSS.escape(it.id)}"]`)?.innerText,counter:$('#iwN').innerText};
 await shot('count-places');
 // Excel round-trip: build a filled sheet in the page and give it to the file input
 const X=await P.loadXLSX(),items=W.unitsOf(it),pl=out.places;const rows=[['کد','نام قلم','گروه','واحد',...pl,'سایر'],[it.code,it.name,it.category||'',items[0].name,'1','','2',''],[it.code,it.name,'',items[items.length-1].name,'','4','',''],['ZZZ','قلم ناموجود','','عدد','1','','','']];
 const prep=InvControl.state.raw.pricing.preparedItems?.find(p=>p.status!=='غیرفعال');if(prep)rows.push([prep.code||prep.id,prep.name,'اقلام آماده‌سازی',prep.countUnit,'2','1','','']);
 const wb=X.utils.book_new();X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(rows),'شمارش');const buf=X.write(wb,{type:'array',bookType:'xlsx'}),file=new File([buf],'count.xlsx');
 const fi=$('#iwF'),dt=new DataTransfer();dt.items.add(file);fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));await wait(1500);
 out.file={note:$('#iwFile').innerText.replace(/\s+/g,' ').slice(0,400),hint:$(`[data-uu="${CSS.escape(it.id)}"]`)?.innerText,subs:$$(`[data-xq^="${CSS.escape(it.id)}|"]`).map(x=>x.value),prep:prep?$(`[data-prep="${CSS.escape(prep.id)}"]`)?.value:null};
 await shot('count-file');await close();
 // beverages: a date with a daily beverage record
 const BC=window.RayoBeverageControl,rec=BC.records(inv).filter(r=>r.lines?.some(l=>BC.values(l).night!==null)).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
 if(rec){window.InvEntry.count();await wait(1500);const df=$('#pnModal [name=date]');df.value=P.fa(rec.date);df.dispatchEvent(new Event('change',{bubbles:true}));await wait(800);out.bev={date:rec.date,note:$('#iwBev').innerText.replace(/\s+/g,' ').slice(0,200)};
  $('#iwBevAdd')?.click();await wait(500);out.bev.after=$('#iwBev').innerText.replace(/\s+/g,' ').slice(0,120);out.bev.counter=$('#iwN').innerText;await shot('count-bev');await close()}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
