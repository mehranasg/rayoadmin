// Probe: money unit (rial fields read as toman, headers with the unit), modal not closed by an outside click, invoices of an
// item (catalog button → modal → filtered invoice list, line-name search). Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const open=()=>$('#pnModal').classList.contains('open');
const clickBack=()=>{const b=$('#pnModal');b.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));b.dispatchEvent(new MouseEvent('click',{bubbles:true}))};
const leak=()=>/\$\{/.test(document.getElementById('pnView').innerText+($('#pnModal.open')?.innerText||''));
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 out.unit=P.unitName();
 // 1. money input: shows the display unit, .value is toman
 document.body.insertAdjacentHTML('beforeend',`<div id="qaM">${P.money('qa',12345)}</div>`);const mi=$('#qaM input');
 out.money={shown:P.rawVal(mi),value:mi.value};mi.value='2500';out.money.afterSet=P.rawVal(mi);P.rawVal(mi,'۱۲٬۳۴۵');out.money.typed=mi.value;
 const plain=document.createElement('input');plain.value='۱۲۳';out.money.plainUntouched=plain.value==='۱۲۳';$('#qaM').remove();
 // 2. modal: outside click keeps a form, closes a window without fields; Esc asks when a field changed
 P.form({title:'qa',body:P.field('x','<input class="input" name="x">'),onOk:()=>false});await wait(200);clickBack();await wait(100);out.modal={formKept:open()};
 const inp=$('#pnModal [name=x]');inp.value='a';inp.dispatchEvent(new Event('input',{bubbles:true}));const c0=window.confirm;let asked=0;window.confirm=()=>{asked++;return false};
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await wait(100);out.modal.escAsked=asked===1;out.modal.escKept=open();window.confirm=()=>true;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await wait(100);out.modal.escClosedOnYes=!open();window.confirm=c0;
 P.modal({title:'qa2',body:'<p>فقط متن</p>'});await wait(200);clickBack();await wait(100);out.modal.infoClosed=!open();
 // 3. catalog: invoices button → modal
 location.hash='#/inventory/catalog';await wait(3500);const ib=$('#catTable [data-invs]');out.catalog={buttons:$$('#catTable [data-invs]').length,priceHead:[...$$('#catTable th')].map(t=>t.innerText).find(t=>/آخرین قیمت/.test(t))||null};
 if(ib){const id=ib.dataset.invs;ib.click();await wait(800);out.catalog.modalTitle=$('#pnModal .modal-head h2')?.innerText;out.catalog.rows=$$('#pnModal tbody tr[data-pi]').length;out.catalog.heads=[...$$('#pnModal th')].map(t=>t.innerText).slice(0,9);
  const all=$('#iiAll');if(all){all.click();await wait(3500);out.docs={hash:location.hash,item:$('#pdItem')?.value===id,rows:$$('#pdTable tbody tr[data-pi]').length,heads:[...$$('#pdTable th')].map(t=>t.innerText)}}}
 // 4. invoice list: item-name search
 const q=$('#pdQ'),sel=$('#pdItem');if(q&&sel){sel.value='';sel.dispatchEvent(new Event('change',{bubbles:true}));$('#pdOnly').value='all';$('#pdOnly').dispatchEvent(new Event('change',{bubbles:true}));q.value='روغن';q.dispatchEvent(new Event('input',{bubbles:true}));await wait(400);out.search={rows:$$('#pdTable tbody tr[data-pi]').length}}
 out.leak={docs:leak()};
 // 5. item form: price field in the unit
 location.hash='#/inventory/catalog';await wait(3000);const r=$$('#catTable [data-ing]').find(x=>/[۱-۹]/.test(x.cells[8]?.innerText||''));if(r){r.click();await wait(1200);const p=$('#pnModal [name=price]');out.form=p?{suffix:p.parentElement.querySelector('.suffix')?.innerText,shown:P.rawVal(p),value:p.value}:null;
  const c1=window.confirm;window.confirm=()=>true;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));window.confirm=c1;await wait(300)}
 // 6. pages that show amounts: no template leak
 for(const h of ['#/inventory/control','#/settings','#/finance/payments','#/menu','#/finance/cash','#/people/payroll']){location.hash=h;await wait(2500);out.leak[h]=leak()}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
