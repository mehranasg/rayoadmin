/* =========================================================
   Rayo Panel prototype — shell.js
   Router (#/module/tab/param), flat sidebar, role switch, quick create,
   shared helpers, shared modal and the ONE payment form used everywhere.
   Static: actions mutate the in-memory sample data only.
   ========================================================= */
(function(){
'use strict';

const P={mods:{},order:[],actions:{}};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
P.$=$;P.$$=$$;

/* ---------- format helpers ---------- */
const FA='۰۱۲۳۴۵۶۷۸۹';
P.fa=s=>String(s).replace(/\d/g,d=>FA[d]);
P.en=s=>String(s).replace(/[۰-۹]/g,d=>FA.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
P.num=s=>Number(P.en(String(s)).replace(/[^\d.-]/g,''))||0;
P.d=s=>P.fa(s);                                             // 1405/08/15 → ۱۴۰۵/۰۸/۱۵
P.dd=s=>{const[,m,d]=s.split('/');return P.fa(+d)+' '+D.MONTHS[+m-1]};   // → ۱۵ آبان
P.t=v=>RT.n(v);                                             // full number
P.T=v=>RT.n(v)+' <small class="muted">تومان</small>';
/* display unit of amounts: «تنظیمات ← عمومی» (cashreport.settings.displayCurrency). Values are toman; inputs stay toman. */
P.unitName=()=>window.InvControl?.state?.raw?.cashreport?.settings?.displayCurrency==='ریال'?'ریال':'تومان';
P.mt=toman=>RT.n(Math.round(P.unitName()==='ریال'?Number(toman)*10:Number(toman))||0);      // number in the display unit
P.mT=toman=>P.mt(toman)+` <small class="muted">${P.unitName()}</small>`;
P.mShort=toman=>RT.money(P.unitName()==='ریال'?Number(toman)*10:Number(toman));
P.raw=s=>P.en(String(s)).trim();                            // ۱۴۰۵/۰۸/۱۵ → 1405/08/15
P.dayNo=s=>{const[y,m,d]=s.split('/').map(Number);return y*365+(m<=6?(m-1)*31:186+(m-7)*30)+d};
P.esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
P.b=(t,tone='neutral',plain)=>`<span class="badge badge-${tone}${plain?' plain':''}">${t}</span>`;
P.ic=(n,cls='')=>`<i data-lucide="${n}" class="${cls}"></i>`;

/* ---------- lookups ---------- */
P.party=id=>D.PARTIES.find(p=>p.id===id)||{name:'نامشخص',kind:'other'};
P.staff=id=>D.STAFF.find(s=>s.id===id)||{name:'—'};
P.item=id=>D.ITEMS.find(i=>i.id===id);
P.acc=id=>D.ACCOUNTS.find(a=>a.id===id)||{name:'—'};
P.initials=n=>n.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('‌');
P.KIND={supplier:'تأمین‌کننده',staff:'پرسنل',other:'سایر',platform:'پلتفرم فروش'};
P.DOCTYPE={purchase:['فاکتور خرید','shopping-cart'],expense:['هزینه','receipt'],payroll:['حقوق','wallet'],advance:['مساعده','hand-coins'],damage:['خسارت دارایی','hammer'],sale:['طلب فروش','bike'],tip:['انعام','hand-heart']};

/* ---------- business math (single place) ---------- */
P.rem=d=>d.amount-d.paid;
/* + = we owe the party, − = the party owes us */
P.balance=pid=>D.DOCS.filter(d=>d.party===pid).reduce((s,d)=>s+(d.dir==='out'?1:-1)*P.rem(d),0);
P.docState=d=>{
  if(P.rem(d)<=0)return P.b('تسویه','success');
  if(d.due<D.TODAY)return P.b('سررسید گذشته','danger');
  if(d.due===D.TODAY)return P.b('سررسید امروز','warning');
  return P.b(d.paid>0?'بخشی پرداخت شده':'باز','info');
};
P.unitCost=it=>it.price/it.pack/(1-(it.waste||0)/100);   // net usable unit cost
P.lineCost=([id,q])=>{const it=P.item(id);return it?P.unitCost(it)*q:0};
P.recipeCost=(m,ch)=>{
  const c=ch?D.CHANNELS.find(x=>x.id===ch):null;
  let s=m.lines.reduce((a,l)=>a+P.lineCost(l),0)+P.ovh(m);
  if(c&&c.pack)s+=m.packLines.reduce((a,l)=>a+P.lineCost(l),0);
  return s;
};
P.chPrice=(m,ch)=>{const c=D.CHANNELS.find(x=>x.id===ch);return Math.round(m.price*(1+c.markup/100)/5000)*5000};
P.gross=r=>r.base+r.otPay+r.bonus; /* tips are NOT part of payroll — see P.tipSplit */
/* salt & spice overhead: one rate per food portion from the last 3 months */
P.ovhRate=()=>{const o=D.OVERHEAD,t=o.buys.reduce((a,b)=>a+b[2],0);return Math.round(t/o.portions/o.roundTo)*o.roundTo};
P.ovh=m=>D.OVERHEAD.cats.includes(m.cat)?P.ovhRate():0;
/* tips: each entry has a target; everything is split EQUALLY among its recipients (no points, no hours)
   shift → hall crew of that shift · all → everyone present in that shift except the courier · person → that person only */
P.crew=(date,shift)=>{const d=+date.split('/')[2],weekend=d%7===0||d%7===6;   // prototype: from the shift plan (later: attendance)
  return D.STAFF.filter(s=>s.shift===shift||(s.shift==='آخر هفته'&&weekend))};
P.tipTo=e=>{
  if(e.target==='person')return[e.sid];
  const c=P.crew(e.date,e.shift);
  return(e.target==='shift'?c.filter(s=>D.TIP_RULES.hall.includes(s.section)):c.filter(s=>!D.TIP_RULES.excludeAll.includes(s.section))).map(s=>s.id)};
P.tipSplit=()=>{
  const R=D.TIP_RULES.round,by={};let rest=0;
  D.STAFF.forEach(s=>by[s.id]={sid:s.id,shift:0,all:0,person:0,spot:0,total:0,month:0});
  D.TIP_IN.forEach(e=>{const to=P.tipTo(e);if(!to.length){rest+=e.amount;return}
    const each=e.target==='person'?e.amount:Math.floor(e.amount/to.length/R)*R;rest+=e.amount-each*to.length;
    to.forEach(id=>{const x=by[id];x[e.target]+=each;x.total+=each;if(e.spot)x.spot+=each;else x.month+=each})});
  const rows=Object.values(by);rows.rest=rest;return rows};
P.tipPool=()=>D.TIP_IN.reduce((a,x)=>a+x.amount,0);
P.tipOf=sid=>(P.tipSplit().find(x=>x.sid===sid)||{total:0}).total;
P.ded=r=>r.ins+r.tax+r.adv+r.fine+r.meal+r.damage;
P.net=r=>P.gross(r)-P.ded(r);

/* ---------- UI builders ---------- */
P.card=({title,sub,actions='',body='',flush,cls='',foot})=>`
  <div class="card ${flush?'flush':''} ${cls}">
    ${title?`<div class="card-head"${flush?' style="padding-bottom:var(--s4)"':''}><div><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>${actions?`<div class="actions">${actions}</div>`:''}</div>`:''}
    <div class="card-body">${body}</div>
    ${foot?`<div class="card-foot">${foot}</div>`:''}
  </div>`;
P.kpi=({label,icon,value,unit='',foot='',tone=''})=>`
  <div class="card kpi">
    <div class="kpi-top"><span class="kpi-label"><span class="kpi-icon ${tone?'tone-'+tone:''}">${P.ic(icon)}</span>${label}</span></div>
    <div class="kpi-value">${value}${unit?`<small>${unit}</small>`:''}</div>
    ${foot?`<div class="kpi-foot">${foot}</div>`:''}
  </div>`;
/* cols: ['عنوان', {t:'مبلغ',n:1}] · rows: [[cells…]] or {c:[…],cls,attr} */
P.table=(cols,rows,{foot,cls='',empty='موردی نیست'}={})=>{
  const C=cols.map(c=>typeof c==='string'?{t:c}:c);
  const tr=r=>{const o=Array.isArray(r)?{c:r}:r;return`<tr class="${o.cls||''}" ${o.attr||''}>${o.c.map((v,i)=>`<td class="${C[i]&&C[i].n?'num':''} ${C[i]&&C[i].w?'wrap':''}">${v}</td>`).join('')}</tr>`};
  return`<div class="table-wrap"><table class="table ${cls}">
    <thead><tr>${C.map(c=>`<th class="${c.n?'num':''}">${c.t}</th>`).join('')}</tr></thead>
    <tbody>${rows.length?rows.map(tr).join(''):`<tr><td colspan="${C.length}"><div class="empty"><h3>${empty}</h3></div></td></tr>`}</tbody>
    ${foot?`<tfoot><tr>${foot.map((v,i)=>`<td class="${C[i]&&C[i].n?'num':''}">${v}</td>`).join('')}</tr></tfoot>`:''}
  </table></div>`;
};
P.note=(html,icon='info')=>`<div class="note">${P.ic(icon)}<div>${html}</div></div>`;
P.cellMain=(title,sub,icon,avatar)=>`<div class="cell-main">${avatar?`<div class="avatar">${P.initials(title)}</div>`:icon?`<div class="thumb">${P.ic(icon)}</div>`:''}<div><b>${title}</b>${sub?`<small>${sub}</small>`:''}</div></div>`;
P.chips=(name,list,active)=>`<div class="row" style="flex-wrap:wrap" data-chips="${name}">${list.map(([k,l,c])=>`<button class="chip ${k===active?'active':''}" data-k="${k}">${l}${c!=null?` <span class="count">${P.fa(c)}</span>`:''}</button>`).join('')}</div>`;
P.bindChips=(root,name,fn)=>{const g=$(`[data-chips="${name}"]`,root);if(!g)return;g.addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;$$('.chip',g).forEach(x=>x.classList.toggle('active',x===b));fn(b.dataset.k)})};
P.stepper=steps=>`<div class="stepper">${steps.map(([t,s,st])=>`<div class="step ${st||''}"><div class="dotn">${st==='done'?P.ic('check'):st==='cur'?P.ic('loader'):''}</div><b>${t}</b><small>${s||''}</small></div>`).join('')}</div>`;
P.opts=(list,sel)=>list.map(([v,l])=>`<option value="${v}" ${v===sel?'selected':''}>${l}</option>`).join('');
P.partyOptions=(sel,kinds)=>{
  const g={supplier:'تأمین‌کنندگان',staff:'پرسنل',platform:'پلتفرم‌ها',other:'سایر'};
  return Object.keys(g).filter(k=>!kinds||kinds.includes(k)).map(k=>`<optgroup label="${g[k]}">${D.PARTIES.filter(p=>p.kind===k).map(p=>`<option value="${p.id}" ${p.id===sel?'selected':''}>${p.name}</option>`).join('')}</optgroup>`).join('');
};
P.field=(label,input,hint)=>`<div class="field"><label>${label}</label>${input}${hint?`<span class="hint">${hint}</span>`:''}</div>`;
P.money=(name,val='',ph='۰')=>`<div class="input-group"><input class="input num" name="${name}" inputmode="numeric" value="${val===''?'':P.t(val)}" placeholder="${ph}"><span class="suffix">تومان</span></div>`;
/* live thousand-separator for money inputs */
document.addEventListener('input',e=>{
  const el=e.target;if(!el.matches('.input-group input.num,input.money'))return;
  const v=P.num(el.value);el.value=v?P.t(v):'';
});


/* ---------- standard filters, pick lists and form sections (one look for every long list and entry form) ----------
   P.norm(s): text for matching (ی/ک, Persian digits, ZWNJ, case). P.match(text,q): every word of q is in text.
   P.filters({id,q,ph,selects:[{k,label,opts:[[v,l]],v}]}) → toolbar; P.bindFilters(root,id,state,update) keeps state
   (q, and each select k) and calls update() — only the list is redrawn, so the search box keeps its focus.
   P.pickList({name,items:[{id,label,sub,group}],selected,multi,extra,height}) → searchable list with a group filter,
   «فقط انتخاب‌شده‌ها» and a counter; P.bindPickList(root,name) → {values(),extra(id)}.
   P.section(title,body,{open,hint,id}) → collapsible form section. */
P.norm=s=>String(s??'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,d=>FA.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[‌‎‏]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
P.match=(text,q)=>{const t=P.norm(text),ws=P.norm(q).split(' ').filter(Boolean);return ws.every(w=>t.includes(w))};
P.filters=({id,q='',ph='جست‌وجو',selects=[]})=>`<div class="toolbar pn-filters" data-filters="${id}"><label class="search grow">${P.ic('search')}<input data-fq placeholder="${ph}" value="${P.esc(q)}" autocomplete="off"></label>${selects.map(s=>`<label class="pn-fsel"><span>${s.label}</span><select class="select" data-fk="${s.k}">${s.opts.map(([v,l])=>`<option value="${P.esc(v)}" ${String(v)===String(s.v??'')?'selected':''}>${l}</option>`).join('')}</select></label>`).join('')}<span class="muted pn-fcount" data-fcount></span></div>`;
P.bindFilters=(root,id,state,update)=>{const box=$(`[data-filters="${id}"]`,root);if(!box)return;let t=0;const q=$('[data-fq]',box);
  q.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{state.q=q.value;update()},150)};q.onkeydown=e=>{if(e.key==='Escape'){q.value='';state.q='';update()}};
  $$('[data-fk]',box).forEach(s=>s.onchange=()=>{state[s.dataset.fk]=s.value;update()});update()};
P.fcount=(root,id,shown,total)=>{const c=$(`[data-filters="${id}"] [data-fcount]`,root);if(c)c.textContent=shown===total?`${P.fa(total)} مورد`:`${P.fa(shown)} از ${P.fa(total)}`};
P.pickList=({name,items,selected=[],multi=true,extra,height=320,ph='نام یا کد'})=>{const sel=new Set(selected),groups=[...new Set(items.map(i=>i.group).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));
  return`<div class="pick" data-pick="${name}" data-multi="${multi?1:0}"><div class="toolbar"><label class="search grow">${P.ic('search')}<input data-pq placeholder="${ph}" autocomplete="off"></label>${groups.length>1?`<select class="select" data-pg style="width:auto"><option value="">همهٔ گروه‌ها</option>${groups.map(g=>`<option>${P.esc(g)}</option>`).join('')}</select>`:''}${multi?`<label class="row" style="gap:4px;font-size:12.5px"><input type="checkbox" data-ponly>فقط انتخاب‌شده‌ها</label>`:''}<b class="pick-count" data-pcount></b></div>
  <div class="pick-list" style="max-height:${height}px">${items.map(i=>`<label class="pick-row" data-id="${P.esc(i.id)}" data-g="${P.esc(i.group||'')}" data-t="${P.esc(P.norm(`${i.label} ${i.sub||''}`))}"><input type="${multi?'checkbox':'radio'}" name="pk_${name}" value="${P.esc(i.id)}" ${sel.has(i.id)?'checked':''}><span class="grow"><b>${P.esc(i.label)}</b>${i.sub?`<small>${P.esc(i.sub)}</small>`:''}</span>${extra?extra(i,sel.has(i.id)):''}</label>`).join('')}</div><div class="pick-empty muted" hidden>موردی پیدا نشد</div></div>`};
P.bindPickList=(root,name)=>{const box=$(`[data-pick="${name}"]`,root);if(!box)return{values:()=>[]};const rows=$$('.pick-row',box),q=$('[data-pq]',box),g=$('[data-pg]',box),only=$('[data-ponly]',box),cnt=$('[data-pcount]',box);
  const apply=()=>{const ws=P.norm(q.value).split(' ').filter(Boolean),gv=g?.value||'',o=only?.checked;let n=0;for(const r of rows){const ok=ws.every(w=>r.dataset.t.includes(w))&&(!gv||r.dataset.g===gv)&&(!o||$('input',r).checked);r.hidden=!ok;if(ok)n++}$('.pick-empty',box).hidden=n>0;
   const c=rows.filter(r=>$('input',r).checked).length;cnt.textContent=box.dataset.multi==='1'?`${P.fa(c)} انتخاب`:''};
  let t=0;q.oninput=()=>{clearTimeout(t);t=setTimeout(apply,120)};if(g)g.onchange=apply;if(only)only.onchange=apply;box.addEventListener('change',e=>{if(e.target.matches('.pick-row>input'))apply()});apply();
  return{values:()=>rows.filter(r=>$('input',r).checked).map(r=>r.dataset.id),row:id=>rows.find(r=>r.dataset.id===id)}};
P.section=(title,body,{open=true,hint='',id=''}={})=>`<details class="fsec" ${open?'open':''} ${id?`id="${id}"`:''}><summary><b>${title}</b>${hint?`<small>${hint}</small>`:''}</summary><div class="fsec-body stack">${body}</div></details>`;
P.toggle=(name,label,on,hint='')=>`<label class="pn-toggle"><input type="checkbox" name="${name}" ${on?'checked':''}><span><b>${label}</b>${hint?`<small>${hint}</small>`:''}</span></label>`;


/* ---------- searchable pick for every «input + datalist» (receipt, waste, invoice, order, petty and recipe lines) ----------
   The browser's datalist is replaced on first focus by one standard dropdown: matching with P.match (ی/ک, Persian
   digits, ZWNJ, any word order), the first 60 matches with a counter, arrows / Enter / Esc, and a mark when the text
   is not one of the options. Choosing writes the same option text into the input and fires input + change, so every
   form reads the field exactly as before. */
(()=>{let box=null,cur=null,opts=[],shown=[],act=-1;
 const close=()=>{if(box)box.hidden=true;cur=null;act=-1};
 const place=()=>{if(!cur||!box||box.hidden)return;const r=cur.getBoundingClientRect(),below=innerHeight-r.bottom;box.style.width=Math.max(r.width,260)+'px';box.style.insetInlineStart='auto';box.style.left=Math.max(8,Math.min(r.left,innerWidth-Math.max(r.width,260)-8))+'px';
  if(below<220&&r.top>below){box.style.top='auto';box.style.bottom=(innerHeight-r.top+4)+'px'}else{box.style.bottom='auto';box.style.top=(r.bottom+4)+'px'}};
 const mark=el=>{const v=el.value.trim(),list=el._comboOpts||[];el.classList.toggle('combo-miss',!!v&&!list.some(o=>o.v===v))};
 const draw=()=>{const q=cur.value;shown=(q.trim()?opts.filter(o=>P.match(o.v,q)):opts);const n=shown.length;shown=shown.slice(0,60);if(act>=shown.length)act=shown.length-1;
  box.innerHTML=(shown.length?shown.map((o,i)=>`<div class="pn-combo-o ${i===act?'act':''}" data-i="${i}">${P.esc(o.v)}${o.l&&o.l!==o.v?`<small>${P.esc(o.l)}</small>`:''}</div>`).join(''):'<div class="pn-combo-empty">موردی پیدا نشد</div>')+(n>60?`<div class="pn-combo-more">${P.fa(60)} از ${P.fa(n)} — دقیق‌تر بنویسید</div>`:'');
  box.hidden=false;place();const a=box.querySelector('.act');if(a)a.scrollIntoView({block:'nearest'})};
 const pick=i=>{const o=shown[i];if(!o||!cur)return;const el=cur;el.value=o.v;close();mark(el);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
 const enhance=el=>{const id=el.getAttribute('list'),dl=id&&document.getElementById(id);if(!dl)return false;el._comboOpts=[...dl.options].map(o=>({v:o.value,l:o.label||''})).filter(o=>o.v);el.dataset.combo=id;el.removeAttribute('list');el.setAttribute('autocomplete','off');el.setAttribute('role','combobox');return true};
 document.addEventListener('focusin',e=>{const el=e.target;if(!(el instanceof HTMLInputElement))return;if(el.hasAttribute('list')&&!enhance(el))return;if(!el.dataset.combo)return;
  if(!box){box=document.createElement('div');box.className='pn-combo';box.hidden=true;document.body.appendChild(box);box.addEventListener('mousedown',ev=>{ev.preventDefault();const o=ev.target.closest('[data-i]');if(o)pick(+o.dataset.i)});addEventListener('resize',place);document.addEventListener('scroll',place,true)}
  const dl=document.getElementById(el.dataset.combo);if(dl)el._comboOpts=[...dl.options].map(o=>({v:o.value,l:o.label||''})).filter(o=>o.v);cur=el;opts=el._comboOpts||[];act=-1;draw()});
 document.addEventListener('input',e=>{if(e.target===cur){act=-1;draw()}});
 document.addEventListener('focusout',e=>{if(e.target===cur){mark(cur);close()}else if(e.target?.dataset?.combo)mark(e.target)});
 document.addEventListener('keydown',e=>{if(!cur||e.target!==cur||box.hidden&&e.key!=='ArrowDown')return;
  if(e.key==='ArrowDown'){e.preventDefault();if(box.hidden)draw();act=Math.min(shown.length-1,act+1);draw()}else if(e.key==='ArrowUp'){e.preventDefault();act=Math.max(0,act-1);draw()}
  else if(e.key==='Enter'&&shown.length&&(act>=0||shown.length===1)){e.preventDefault();e.stopPropagation();pick(act>=0?act:0)}else if(e.key==='Escape'){e.stopPropagation();close()}},true);
})();


/* long selects in forms (25+ options: assets, people, suppliers…) get a filter box above them; options that do not
   match are hidden, the select itself and its value are unchanged */
P.enhanceSelects=root=>{for(const sel of root.querySelectorAll('select')){if(sel.options.length<25||sel.dataset.sx||sel.multiple)continue;sel.dataset.sx=1;const f=document.createElement('input');f.className='input pn-sfilter';f.placeholder='جست‌وجو در '+P.fa(sel.options.length)+' گزینه';f.setAttribute('autocomplete','off');sel.before(f);
  f.oninput=()=>{const q=f.value;let first=null;for(const o of sel.options){const ok=!o.value||!q.trim()||P.match(o.textContent,q);o.hidden=!ok;if(ok&&o.value&&!first)first=o}if(first&&q.trim()&&(sel.selectedOptions[0]?.hidden||!sel.value)){sel.value=first.value;sel.dispatchEvent(new Event('change',{bubbles:true}))}};
  f.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();sel.focus()}}}};
document.addEventListener('focusin',e=>{const el=e.target;if(el instanceof HTMLSelectElement&&el.closest('#pnModal')&&!el.dataset.sx&&el.options.length>=25)P.enhanceSelects(el.parentElement)});

/* ---------- modal ---------- */
P.modal=({title,body,foot,size='',onMount})=>{
  const host=$('#pnModal'),m=$('.modal',host);
  m.className='modal '+size;
  m.innerHTML=`<div class="modal-head"><h2>${title}</h2><button class="btn btn-ghost btn-sm btn-icon" data-close aria-label="بستن">${P.ic('x')}</button></div>
    <div class="modal-body">${body}</div>
    <div class="modal-foot">${foot||'<button class="btn btn-ghost" data-close>بستن</button>'}</div>`;
  host.classList.add('open');RT.icons();
  onMount&&onMount(m);P.enhanceSelects(m);
  return m;
};
P.close=()=>$('#pnModal').classList.remove('open');
/* simple form: fields html + primary label; onOk(form) may return false to keep open */
P.form=({title,body,ok='ثبت',size='',onOk,onMount,info})=>P.modal({title,size,
  body:`<form id="pnForm" class="stack" style="gap:var(--s4)">${body}</form>${info?P.note(info,'sparkles'):''}`,
  foot:`<button class="btn btn-ghost" data-close>انصراف</button><button class="btn btn-primary" id="pnOk">${P.ic('check')}${ok}</button>`,
  onMount:m=>{
    $('#pnOk',m).onclick=e=>{e.preventDefault();const r=onOk?onOk($('#pnForm',m)):undefined;if(r!==false){P.close();P.render()}};
    onMount&&onMount(m);
  }
});
/* ---------- ONE way to change a setting that affects calculations ----------
   Always asks the scope. Finalized records and closed months never change; every change is logged with its effective date. */
P.setChange=({area,name,from,to,openNote,apply})=>{
  if(String(from)===String(to)){P.toast('تغییری داده نشده است');return}
  P.form({title:'تغییر تنظیمات: '+name,ok:'ثبت تغییر',
    body:`<div class="sum-box"><span>${name}</span><b>${P.fa(from)} ← ${P.fa(to)}</b></div>
      <div class="stack mt" style="gap:var(--s3)">
        <label class="check"><input type="radio" name="scope" value="future" checked><span><b>فقط از امروز به بعد</b> <small class="muted" style="display:block">ثبت‌های قبلی با تنظیمات زمان خودشان می‌مانند (پیشنهادی)</small></span></label>
        <label class="check"><input type="radio" name="scope" value="open"><span><b>ثبت‌های دورهٔ باز (آبان) هم دوباره حساب شوند</b> <small class="muted" style="display:block">${openNote||'فقط ثبت‌هایی که هنوز نهایی نشده‌اند'}</small></span></label>
      </div>`,
    info:'ماه‌های بسته‌شده و ثبت‌های نهایی هرگز تغییر نمی‌کنند. این تغییر با نام شما و تاریخ در «تنظیمات ← تاریخچهٔ تغییرات» ثبت می‌شود.',
    onOk:f=>{const scope=f.querySelector('[name=scope]:checked').value;const n=apply(scope)||0;
      D.SETTING_LOG.unshift({date:D.TODAY,by:P.role().name,area,text:`${name} ${P.fa(from)} ← ${P.fa(to)}`,scope:scope==='future'?'فقط از امروز':'دورهٔ باز هم ('+P.fa(n)+' ثبت)'});
      P.toast(scope==='future'?'ثبت شد؛ از امروز اعمال می‌شود':`ثبت شد؛ ${P.fa(n)} ثبت دورهٔ باز دوباره حساب شد`)}});
};
P.toast=(m,i)=>RT.toast(m,i);

/* ---------- ONE form to RECORD a payment / receipt that already happened ----------
   Money moves outside the panel (bank app, card, cash, cheque). This form only records it, usually afterwards,
   so the party balance is right. Used by finance, suppliers, payroll, tips and bank matching. */
P.pay=({party,dir='out',docs,title,date,amount,ref,method}={})=>{
  const open=pid=>D.DOCS.filter(d=>d.party===pid&&d.dir===dir&&P.rem(d)>0).sort((a,b)=>a.due.localeCompare(b.due));
  const firstParty=party||(D.DOCS.find(d=>d.dir===dir&&P.rem(d)>0)||{}).party||'sp1';
  const M=['نقد','کارت به کارت','انتقال بانکی','چک'],m0=M.includes(method)?method:'انتقال بانکی';
  const body=`
    ${P.note(dir==='out'?'پرداخت از این پنل انجام نمی‌شود. پولی را که از بانک یا صندوق رفته است، این‌جا ثبت کنید تا ماندهٔ طرف حساب درست شود.':'پولی را که به حساب یا صندوق رسیده است، این‌جا ثبت کنید.','info')}
    <div class="form-grid">
      ${P.field(dir==='out'?'پرداخت به':'دریافت از',`<select class="select" name="party">${P.partyOptions(firstParty)}</select>`,'تأمین‌کننده، پرسنل، موجر یا پلتفرم — همه در یک فهرست')}
      ${P.field(dir==='out'?'تاریخ پرداخت':'تاریخ دریافت',`<input class="input" name="date" value="${P.d(date||D.TODAY)}">`,'روزی که پول واقعاً جابه‌جا شد؛ می‌تواند قبل از امروز باشد')}
    </div>
    <div>
      <div class="row between" style="margin-bottom:6px"><b style="font-size:13px">${dir==='out'?'بابت کدام بدهی؟':'بابت کدام طلب؟'}</b><button class="btn btn-ghost btn-sm" type="button" id="payAuto">${P.ic('wand-sparkles')}تخصیص خودکار از قدیمی‌ترین</button></div>
      <div id="payDocs"></div>
    </div>
    <div class="form-grid">
      ${P.field('روش',`<div class="segmented" id="payMethod">${M.map(x=>`<button type="button" class="${x===m0?'active':''}">${x}</button>`).join('')}</div>`)}
      ${P.field(dir==='out'?'از حساب':'به حساب',`<select class="select" name="account">${P.opts(D.ACCOUNTS.map(a=>[a.id,a.name]),m0==='نقد'?'a1':'a2')}</select>`)}
      <div id="payRefBox">${P.field('شمارهٔ پیگیری / مرجع',`<input class="input" name="ref" value="${ref||''}" placeholder="از پیامک یا رسید بانک">`,'برای تطبیق با گردش بانک لازم است')}</div>
    </div>
    <div class="form-grid" id="payCheque" ${m0==='چک'?'':'hidden'}>
      ${P.field('شمارهٔ چک','<input class="input" name="chq" placeholder="مثلاً ۸۸۱۲۵۰">')}
      ${P.field('تاریخ سررسید چک','<input class="input" name="chqDue" placeholder="۱۴۰۵/۰۹/۰۵">','تا وصول، بدهی «در جریان» می‌ماند و قطعی تسویه نمی‌شود')}
    </div>
    ${P.field('شرح (اختیاری)','<input class="input" name="note" placeholder="مثلاً تسویهٔ فاکتورهای آبان">')}
    <div class="drop">${P.ic('image-plus')}<span>تصویر رسید یا پیامک بانک را اینجا بکشید (اختیاری)</span></div>
    <div id="payWarn"></div>
    <div class="sum-box"><span>جمع ${dir==='out'?'پرداخت':'دریافت'}</span><b id="paySum">۰ <small class="muted">تومان</small></b></div>`;
  P.modal({title:title||(dir==='out'?'ثبت پرداخت انجام‌شده':'ثبت دریافت'),size:'wide',body,
    foot:`<button class="btn btn-ghost" data-close>انصراف</button><button class="btn btn-primary" id="payOk">${P.ic('check')}ثبت ${dir==='out'?'پرداخت':'دریافت'}</button>`,
    onMount(m){
      const partySel=$('[name=party]',m),list=$('#payDocs',m),okBtn=$('#payOk',m);
      const sum=()=>{const f=$('[name=free]',m);const s=f?P.num(f.value):$$('[data-doc]',m).reduce((a,r)=>a+($('input[type=checkbox]',r).checked?P.num($('input.money',r).value):0),0);$('#paySum',m).innerHTML=P.T(s);return s};
      const reset=()=>{delete m.dataset.dupOk;$('#payWarn',m).innerHTML='';okBtn.innerHTML=`${P.ic('check')}ثبت ${dir==='out'?'پرداخت':'دریافت'}`;RT.icons()};
      const draw=(pre)=>{
        const ds=open(partySel.value);let left=amount||0;
        list.innerHTML=ds.length?P.table(['',  'سند','تاریخ / سررسید','شرح',{t:'مانده',n:1},{t:'مبلغ این پرداخت',n:1}],
          ds.map(d=>{let v=P.rem(d),on=!pre||pre.includes(d.id);if(amount){v=Math.min(v,left);left-=v;on=v>0}
            return{attr:`data-doc="${d.id}"`,c:[
            `<input type="checkbox" class="check" ${on?'checked':''}>`,
            `${P.b(P.DOCTYPE[d.type][0],'neutral',1)} <small class="muted">${P.fa(d.no)}</small>`,
            `${P.dd(d.date)} <small class="muted">/ ${P.dd(d.due)}</small>`,
            d.title,P.t(P.rem(d)),
            `<input class="input money num sm" value="${P.t(v||P.rem(d))}">`]}})):
          P.note('برای این طرف حساب سند بازی وجود ندارد. پرداخت به‌صورت «علی‌الحساب» ثبت می‌شود و با سند بعدی تسویه می‌شود.<div class="field mt"><label>مبلغ علی‌الحساب</label>'+P.money('free',amount||'')+'</div>','info');
        $$('input',list).forEach(i=>i.addEventListener('input',()=>{sum();reset()}));$$('input[type=checkbox]',list).forEach(i=>i.addEventListener('change',sum));
        sum();
      };
      partySel.onchange=()=>{draw();reset()};draw(docs);
      $('#payAuto',m).onclick=()=>{$$('[data-doc] input[type=checkbox]',m).forEach(c=>c.checked=true);sum()};
      const meth=$('#payMethod',m),refBox=$('#payRefBox',m);
      const setM=b=>{$$('button',meth).forEach(x=>x.classList.toggle('active',x===b));$('#payCheque',m).hidden=b.textContent!=='چک';refBox.style.visibility=b.textContent==='نقد'?'hidden':''};
      meth.onclick=e=>{const b=e.target.closest('button');if(!b)return;setM(b);$('[name=account]',m).value=b.textContent==='نقد'?'a1':'a2'};
      setM($('.active',meth));
      okBtn.onclick=()=>{
        const total=sum(),alloc=[];
        $$('[data-doc]',m).forEach(r=>{if($('input[type=checkbox]',r).checked){const v=P.num($('input.money',r).value);if(v>0)alloc.push([r.dataset.doc,v])}});
        if(total<=0){P.toast('مبلغی وارد نشده است','alert-triangle');return}
        const method=$('#payMethod .active',m).textContent,refV=$('[name=ref]',m).value.trim();
        if(method!=='نقد'&&method!=='چک'&&!refV){$('#payWarn',m).innerHTML=P.note('برای پرداخت غیرنقدی، شمارهٔ پیگیری را وارد کنید تا با گردش بانک تطبیق شود.','alert-triangle');return}
        /* same party + same amount in the last 7 days → probably recorded already */
        const dup=D.PAYMENTS.find(p=>p.party===partySel.value&&p.dir===dir&&p.amount===total&&Math.abs(P.dayNo(p.date)-P.dayNo(D.TODAY))<=7);
        if(dup&&!m.dataset.dupOk){m.dataset.dupOk=1;
          $('#payWarn',m).innerHTML=P.note(`<b>احتمالاً تکراری است:</b> ${P.fa(dup.no)} در ${P.dd(dup.date)} با همین مبلغ برای همین طرف حساب ثبت شده است (${dup.method}). اگر واقعاً پرداخت دومی است، دوباره بزنید.`,'alert-triangle');
          okBtn.innerHTML=`${P.ic('check')}پرداخت دوم است؛ ثبت شود`;RT.icons();return}
        alloc.forEach(([id,v])=>{const d=D.DOCS.find(x=>x.id===id);d.paid=Math.min(d.amount,d.paid+v)});
        const acc=P.acc($('[name=account]',m).value);acc.balance+=dir==='out'?-total:total;
        const when=P.raw($('[name=date]',m).value)||D.TODAY;
        const pay={id:'p'+Date.now(),no:'پر-'+P.fa(420+D.PAYMENTS.length),date:when,rec:D.TODAY,party:partySel.value,account:acc.id,method,ref:refV,amount:total,alloc,dir,by:P.role().name,
          cheque:method==='چک'?{no:$('[name=chq]',m).value||'—',due:'1405/09/05',status:'pending'}:null};
        D.PAYMENTS.unshift(pay);
        const bl=D.BANK_LINES.find(b=>!b.match&&b.dir===dir&&b.amount===total);if(bl)bl.match=pay.id;
        P.close();P.toast(`${dir==='out'?'پرداخت':'دریافت'} ${P.t(total)} تومان ثبت شد${bl?' و با گردش بانک تطبیق خورد':''} — مانده‌ها به‌روز شد`);P.render();
      };
    }});
};

/* ---------- session & access ----------
   Same sign-in as the current panel (core/js/admin-access.js): owners see everything; other users see the sections the
   current panel gives them (personnel settings.adminUsers). Each new-panel module/tab maps to those section keys.
   Writes are checked again inside every save (InvEntry.allowed); this is a browser-side guard, not server security. */
const AAx=()=>window.AdminAccess;
const MOD_KEYS={home:['dashboard','monitor'],finance:['financeLedger','purchase','cash','assets'],inventory:['inventory','inventoryEdit'],people:['personnel','payroll','shift','training'],menu:['menu','pricing'],customers:['reports','personnel'],reports:['reports','sales'],settings:['settings']};
const TAB_KEYS={finance:{overview:['financeLedger'],docs:['purchase','financeLedger'],payments:['purchase','financeLedger'],parties:['purchase','financeLedger'],cash:['cash','financeLedger'],petty:['financeLedger'],assets:['assets'],reports:['financeLedger'],legacy:['financeLedger','purchase','cash']},
 people:{payroll:['payroll'],tips:['payroll','personnel'],training:['training','personnel'],users:['settings'],attendance:['personnel','payroll','shift']},menu:{pricing:['pricing','menu']},reports:{sales:['sales','reports']},inventory:{requests:['inventory','purchase']}};
P.session=()=>AAx()?.session?.()||null;
P.owner=()=>P.session()?.role==='owner';
P.role=()=>{const s=P.session();return s?{id:s.role==='owner'?'owner':'user',name:s.user,desc:s.role==='owner'?'مالک — دسترسی کامل':'کاربر پنل — بخش‌های مجاز',icon:s.role==='owner'?'crown':'user'}:{id:'none',name:'',desc:'',icon:'user'}};
P.can=(mod,need='view')=>{const s=P.session();if(!s)return false;if(s.role==='owner')return true;if(mod==='plan')return false;if(mod==='home')return true;const ks=MOD_KEYS[mod];return !!ks&&ks.some(k=>AAx().has(k))};
P.tabOk=(mod,tab)=>{const s=P.session();if(!s||s.role==='owner')return true;const ks=TAB_KEYS[mod]?.[tab];return !ks||ks.some(k=>AAx().has(k))};
P.live=()=>!!window.InvControl?.ready?.();
P.CUR=()=>window.RAYO_CURRENT_PANEL||'/panel/';
/* tabs that are still sample designs in the new panel: hidden once real data is connected */
const SAMPLE_TABS={finance:['ai','close','forecast','calculator','settings','reports'],people:['planning','salarytools','reports','settings','attendance','requests'],reports:['library','ai','audit'],menu:['channels'],settings:['index','integrations']};
const sampleTab=(mod,id)=>P.live()&&(SAMPLE_TABS[mod]||[]).includes(id);
/* features of the current panel that are not in the new panel yet: one «در پنل فعلی» tab per section, opened in the same tab
   (the sign-in is kept for the browser tab, so the current panel opens signed in) */
P.LEGACY={
 finance:[['بدهی‌ها، تعهدات و سررسیدها','finance.html?view=obligations','financeLedger'],['پرداختنی‌ها','finance.html?view=payables','financeLedger'],['دریافتنی‌ها','finance.html?view=receivables','financeLedger'],['چک‌ها','finance.html?view=checks','financeLedger'],['اسناد هزینه و درآمد','finance.html?view=entries','financeLedger'],['ماندهٔ اول حساب‌ها','finance.html?view=opening','financeLedger'],['سود و زیان ماهانه','finance.html?view=monthly','financeLedger'],['پیش‌بینی','finance.html?view=forecast','financeLedger'],['محاسبه‌گر مالی','finance.html?view=calculator','financeLedger'],['تنظیمات مالی','finance.html?view=settings','financeLedger'],['تأمین‌کنندگان: فهرست کامل و Excel','suppliers.html','purchase']],
 people:[['افزودن و ویرایش پرسنل (با اطلاعات بانکی)','personnel.html?view=personnel','personnel'],['پروفایل پرسنلی','personnel.html?view=personnelProfile','personnel'],['ثبت تخلفات','personnel.html?view=violations','personnel'],['درخواست‌های مرخصی (تأیید)','personnel.html?view=leaveRequests','personnel'],['کارکرد ماهانهٔ حضور و غیاب','personnel.html?view=attendanceMonth','personnel'],['موارد نیازمند بررسی تردد','personnel.html?view=attendanceAttention','personnel'],['گزارش ماهانهٔ حضور و غیاب','personnel.html?view=attendanceReport','personnel'],['ورود فایل تردد','personnel.html?view=attendanceImport','personnel'],['تنظیمات حضور و غیاب','personnel.html?view=attendanceSettings','personnel'],['گزارشات پرسنلی','personnel.html?view=personnelReports','personnel'],
  ['برنامهٔ شیفت هفتگی','personnel.html?view=shiftPlan','shift'],['برنامهٔ شیفت ماهانه','personnel.html?view=monthlyShiftPlan','shift'],['نیروی موردنیاز و ظرفیت','personnel.html?view=staffingNeeds','shift'],['نقشهٔ کمبود نیرو','personnel.html?view=staffingMap','shift'],['تقویم سالانه','personnel.html?view=annualCalendar','shift'],['سوابق و گزارش شیفت','personnel.html?view=shiftReport','shift'],
  ['کارکرد ماه و بستن قطعی حقوق','personnel.html?view=payroll','payroll'],['درخواست‌های اصلاح کارکرد','personnel.html?view=attendanceCorrections','payroll'],['فیش حقوقی','personnel.html?view=payslip','payroll'],['تأخیر','personnel.html?view=delays','payroll'],['پرداخت حقوق','personnel.html?view=payments','payroll'],['محاسبه‌گر حقوق','personnel.html?view=salaryCalculator','payroll'],['تنظیمات حقوق','personnel.html?view=salarySettings','payroll'],
  ['آموزش‌ها و پروتکل‌ها (ویرایش)','personnel.html?view=protocols','training'],['تعریف چک‌لیست‌ها','personnel.html?view=checklistTemplates','training'],['گزارش چک‌لیست‌ها','personnel.html?view=checklistReports','training']],
 inventory:[['شمارش با تاریخ قبل از یک شمارش کل بعدی، و بازمحاسبهٔ شمارش‌ها','inventory.html','inventoryEdit'],['تنظیمات کامل انبار (محل‌ها، اقلام کنترل، نوشیدنی‌های کنترل روزانه)','inventory.html','inventory']],
 menu:[['ورود اقلام و قیمت‌ها از Excel','pricing.html','pricing']],
 reports:[['گزارش‌های مدیریتی کامل','reports.html','reports'],['آنالیز فروش','sales-analysis.html','sales'],['نظرسنجی مشتریان (فرم)','survey.html','reports']],
 settings:[['تنظیمات نرم‌افزار','settings.html?view=softwareSettings','settings'],['اطلاعات پایه و مدیریت اقلام','base-data.html','settings'],['بازگرداندن بکاپ (Restore)','settings.html?view=dataManagement','settings'],['تنظیمات پنل و امکانات','settings.html?view=settings','settings'],['تنظیمات تخلفات','settings.html?view=violationSettings','settings']]};
function legacyTab(mod){return{id:'legacy',label:'در پنل فعلی',icon:'external-link',liveOnly:true,desc:'امکاناتی از پنل فعلی که هنوز به پنل جدید منتقل نشده‌اند',
 render:()=>{const L=P.LEGACY[mod].filter(x=>P.owner()||AAx()?.has?.(x[2]));return P.card({title:'هنوز در پنل فعلی',sub:'روی دادهٔ مشترک کار می‌کنند؛ با همین ورود در همین زبانه باز می‌شوند',flush:1,body:P.table(['امکان',''],L.map(([l,h])=>[l,`<a class="btn btn-secondary btn-sm" href="${P.CUR()}${h}">${P.ic('external-link')}باز کردن</a>`]),{empty:'موردی برای دسترسی شما نیست'})})}}}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

/* ---------- registry & router ---------- */
P.mod=m=>{P.mods[m.id]=m;P.order.push(m.id)};
P.go=h=>{location.hash=h};
P.route=()=>{const p=(location.hash.replace(/^#\/?/,'')||'home').split('/');return{mod:p[0]||'home',tab:p[1]||'',param:p[2]||''}};

P.render=()=>{
  if(!P.session())return showLogin();
  const hrDoc=window.PeopleReal?.doc?.();if(hrDoc&&AAx()&&!AAx().stillValid(hrDoc)){AAx().signOut();P.toast('کاربر شما غیرفعال یا حذف شده است','alert-triangle');return showLogin()}
  const PD=window.PanelData;if(PD&&PD.expected()&&!P.live()){const st=PD.state();buildSidebar(P.route().mod);$('#pnView').innerHTML=st.err?P.card({title:'دادهٔ زنده خوانده نشد',body:P.note(P.esc(st.err),'alert-triangle')+`<button class="btn btn-primary mt" id="pnRetry">${P.ic('refresh-cw')}تلاش دوباره</button>`}):P.card({title:'در حال خواندن دادهٔ زنده…',body:P.note('انبار، منو و قیمت و گزارش صندوق از سرور خوانده می‌شوند.','loader')});const rb=$('#pnRetry');if(rb)rb.onclick=()=>PD.connect('live');RT.icons();return}
  const r=P.route();let m=P.mods[r.mod];
  if(!m||!P.can(r.mod)){m=P.mods.home;r.mod='home';r.tab=''}
  const view=$('#pnView');
  let html;
  const tabs=(m.tabs||[]).filter(t=>!t.hidden&&P.tabOk(m.id,t.id)&&!sampleTab(m.id,t.id)&&!(t.liveOnly&&!P.live()));
  if(m.render){html=m.render(r)}
  else{
    let t=(m.tabs||[]).find(x=>x.id===r.tab&&P.tabOk(m.id,x.id)&&!sampleTab(m.id,x.id)&&!(x.liveOnly&&!P.live()))||tabs[0];
    r.tab=t.id;
    const ro=!P.can(m.id,'edit');
    html=`<div class="page-head"><div><div class="crumbs">${P.ic(m.icon)}${m.label}${t.id!==tabs[0].id?` <span>›</span> ${t.label}`:''}${r.param?` <span>›</span> جزئیات`:''}</div><h1>${t.title||t.label}</h1><p>${t.desc||m.desc}</p></div>
        <div class="actions">${ro?P.b('فقط مشاهده','neutral'):''}${t.actions&&!ro?t.actions(r):''}</div></div>
      ${tabs.length>1?`<div class="tabs page-tabs">${tabs.map(x=>`<a class="tab ${x.id===t.id?'active':''}" href="#/${m.id}/${x.id}">${P.ic(x.icon)}${x.label}${x.badge&&x.badge()?` <span class="badge badge-danger">${P.fa(x.badge())}</span>`:''}</a>`).join('')}</div>`:''}
      <div id="pnTab">${t.render(r)}</div>`;
    m._t=t;
  }
  view.innerHTML=html;
  buildSidebar(r.mod);
  RT.icons();
  if(m.render&&m.mount)m.mount(view,r);
  else if(m._t&&m._t.mount)m._t.mount(view,r);
  RT.icons();
};

/* ---------- sidebar ---------- */
/* «اطلاعات پایه»: one place for the definitions that live inside other sections (live data only) */
const BASE_LINKS=[['#/inventory/catalog','book-open','کالاها و مواد','inventory',['pricing','inventory']],['#/menu/items','utensils','آیتم‌های منو','menu',['menu']],['#/finance/parties','truck','تأمین‌کنندگان','finance',['purchase','financeLedger']],['#/finance/assets','tag','دارایی‌ها','finance',['assets']]];
function baseLinks(){if(!P.live())return'';const h=location.hash||'',L=BASE_LINKS.filter(([,, ,mod,keys])=>P.can(mod)&&(P.owner()||keys.some(k=>AAx().has(k))));if(!L.length)return'';
  return '<div class="nav-label">اطلاعات پایه</div>'+L.map(([href,icon,label])=>`<a class="nav-link nav-base ${h.startsWith(href)?'active':''}" href="${href}">${P.ic(icon)}<span>${label}</span></a>`).join('')}
function buildSidebar(active){
  const side=$('#pnSide'),role=P.role();
  const item=id=>{const m=P.mods[id];if(!m||!P.can(id))return'';if(BASE_LINKS.some(([href])=>(location.hash||'').startsWith(href))&&P.live())active='';const bd=m.badge&&m.badge();
    return`<a class="nav-link ${id===active?'active':''}" href="#/${id}">${P.ic(m.icon)}<span>${m.label}</span>${bd?`<span class="badge badge-danger plain">${P.fa(bd)}</span>`:''}</a>`};
  side.innerHTML=`
    <div class="brand"><div class="brand-mark">ر</div><div><strong>رایو</strong><small>پنل مدیریت رستوران</small></div></div>
    <nav class="nav">
      ${item('home')}
      <div class="nav-label">کار روزانه و ماهانه</div>
      ${['finance','inventory','people','menu','customers'].map(item).join('')}
      <div class="nav-label">تحلیل و پیکربندی</div>
      ${baseLinks()}
      ${['reports','settings'].map(item).join('')}
      ${P.owner()?`<div class="nav-label">طرح</div>${item('plan')}`:''}
      ${P.live()?`<div class="nav-label">پنل فعلی</div><a class="nav-link" href="${P.CUR()}index.html">${P.ic('external-link')}<span>امکانات منتقل‌نشده</span></a>`:''}
    </nav>
    <div class="sidebar-foot"><div class="role-chip" style="cursor:default">
      <div class="avatar">${P.ic(role.icon)}</div><div class="grow"><b dir="auto">${P.esc(role.name)}</b><small>${role.desc}</small></div>
      <button class="icon-btn" id="pnLogout" title="خروج" aria-label="خروج">${P.ic('log-out')}</button></div></div>`;
  $('#pnLogout').onclick=()=>{AAx().signOut();P.close&&P.close();P.render()};
  side.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
}

/* ---------- sign-in (same static owners and admin users as the current panel) ---------- */
function showLogin(){
  document.body.classList.add('pn-locked');
  let el=$('#pnLogin');
  if(!el){el=document.createElement('div');el.id='pnLogin';el.className='pn-login';document.body.appendChild(el)}
  el.innerHTML=`<form class="card pn-login-card" id="pnLoginForm" autocomplete="on">
    <div class="brand" style="padding:0 0 var(--s4)"><div class="brand-mark">ر</div><div><strong>رایو</strong><small>ورود به پنل مدیریت</small></div></div>
    <div class="stack" style="gap:var(--s3)">${P.field('نام کاربری','<input class="input" name="u" dir="ltr" autocomplete="username" required>')}${P.field('رمز عبور','<input class="input" name="p" type="password" dir="ltr" autocomplete="current-password" required>')}</div>
    <div id="pnLoginErr" class="neg" role="alert" style="min-height:20px;font-size:13px"></div>
    <button class="btn btn-primary" type="submit" style="width:100%;justify-content:center">${P.ic('log-in')}ورود</button>
    <p class="muted" style="font-size:12px;margin:var(--s3) 0 0">همان نام کاربری و رمز پنل فعلی. ورود تا بستن این زبانه می‌ماند.</p></form>`;
  RT.icons();
  const f=$('#pnLoginForm',el),err=$('#pnLoginErr',el);setTimeout(()=>f.u.focus(),30);
  f.onsubmit=async e=>{e.preventDefault();const u=f.u.value.trim(),p=f.p.value,btn=f.querySelector('button');err.textContent='';
    let r=AAx().verify(null,u,p);
    if(!r&&!AAx().isStatic(u)){btn.disabled=true;err.textContent='در حال بررسی…';
      try{const E=window.InvEngine,res=await fetch(E.API_ROOT+'Load?module=personnel&_='+Date.now(),{cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});if(!res.ok)throw Error('HTTP '+res.status);r=AAx().verify(E.unwrap(await res.json()),u,p)}
      catch(_){btn.disabled=false;err.textContent='بررسی کاربر انجام نشد؛ اتصال به سرور را بررسی کنید.';return}btn.disabled=false}
    if(!r){err.textContent='نام کاربری یا رمز عبور اشتباه است.';f.p.value='';f.p.focus();return}
    AAx().signIn(r);el.remove();document.body.classList.remove('pn-locked');P.render()};
}

/* ---------- topbar ---------- */
const QUICK=[
  {k:'receipt',mod:'inventory',need:'edit',icon:'package-plus',t:'دریافت کالا',s:'بار رسید؛ موجودی و بدهی یک‌جا'},
  {k:'pay',mod:'finance',need:'full',icon:'send',t:'ثبت پرداخت انجام‌شده',s:'پولی که از بانک یا صندوق رفته — به هر طرف حساب'},
  {k:'invoiceAI',mod:'finance',need:'edit',icon:'scan-line',t:'فاکتور خرید با عکس',s:'عکس فاکتور ← پیش‌نویس AI ← تأیید مدیر'},
  {k:'pettyNew',mod:'finance',need:'edit',icon:'wallet',t:'هزینهٔ تنخواه',s:'خرید ریز با کارت تنخواه؛ عکس رسید و علت'},
  {k:'expense',mod:'finance',need:'edit',icon:'receipt',t:'هزینه',s:'اجاره، قبض، تعمیر، خرید جزئی'},
  {k:'cashClose',mod:'finance',need:'edit',icon:'banknote',t:'بستن صندوق شیفت',s:'فروش، نقد، کارت و کسری'},
  {k:'waste',mod:'inventory',need:'edit',icon:'trash-2',t:'ضایعات',s:'مادهٔ اولیه یا آیتم منو'},
  {k:'assetEvent',mod:'finance',need:'edit',icon:'hammer',t:'خرابی / شکستگی وسیله',s:'دارایی‌ها؛ با تعیین مسئولیت'},
  {k:'request',mod:'people',need:'edit',icon:'calendar-plus',t:'مرخصی / مساعده',s:'درخواست پرسنل'}
];
/* live data: the real entry forms; each opens on its own page once that page's data is loaded */
const QUICK_LIVE=[
  {mod:'inventory',key:'inventory',icon:'package-plus',t:'ورود کالا به انبار',s:'چند ردیف، واحد انبار یا خرید',go:'#/inventory/receipt',open:()=>InvEntry.receipt()},
  {mod:'inventory',key:'inventory',icon:'trash-2',t:'پرتی / مصرف',s:'ماده یا آیتم منو طبق رسپی',go:'#/inventory/waste',open:()=>InvEntry.event()},
  {mod:'inventory',key:'inventory',icon:'clipboard-check',t:'شمارش انبار',s:'شمارش کور پایان روز',go:'#/inventory/count',open:()=>InvEntry.count()},
  {mod:'inventory',key:'inventory',icon:'cup-soda',t:'کنترل روزانهٔ نوشیدنی',s:'شمارش و مغایرت نوشیدنی‌ها',go:'#/inventory/beverage'},
  {mod:'finance',key:'cash',icon:'banknote',t:'گزارش صندوق روزانه',s:'فروش، دریافتی‌ها و مغایرت',go:'#/finance/cash',ready:()=>!!window.CashReal,open:()=>CashReal.form()},
  {mod:'finance',key:'purchase',icon:'file-plus-2',t:'فاکتور خرید',s:'با جزئیات اقلام',go:'#/finance/docs',ready:()=>!!window.FinanceReal?.suppliers?.(),open:()=>PurchaseEntry.detailed()},
  {mod:'finance',key:'purchase',icon:'send',t:'پرداخت به تأمین‌کننده',s:'روی فاکتور باز یا علی‌الحساب',go:'#/finance/payments',ready:()=>!!window.FinanceReal?.suppliers?.(),open:()=>PurchaseEntry.payment({})},
  {mod:'finance',key:'financeLedger',icon:'wallet',t:'هزینهٔ تنخواه',s:'خرید ریز با کارت تنخواه',go:'#/finance/petty',ready:()=>!!window.ExtrasReal?.mods?.finance?.doc,open:()=>PettyEntry.expense()},
  {mod:'inventory',key:'pricing',icon:'book-plus',t:'قلم یا کالای جدید',s:'تعریف در کاتالوگ اصلی',go:'#/inventory/catalog',ready:()=>!!window.CatalogReal,open:()=>CatalogReal.ingredientForm()},
  {mod:'people',key:'payroll',icon:'hand-coins',t:'ثبت انعام',s:'نوع، مبلغ و افراد',go:'#/people/tips',ready:()=>!!window.PeopleReal?.doc?.(),open:()=>PeopleEntry.tip()},
  {mod:'people',key:'payroll',icon:'gavel',t:'جریمه / تشویق',s:'برای حقوق همان ماه',go:'#/people/payroll',ready:()=>!!window.PeopleReal?.doc?.(),open:()=>PeopleEntry.penalty()}
];
function openLive(q){if(location.hash!==q.go)P.go(q.go);if(!q.open)return;let n=0;const tick=()=>{const ok=P.live()&&(!q.ready||q.ready());if(ok){try{q.open()}catch(e){P.toast(e.message||String(e),'alert-triangle')}return}if(++n>60)return P.toast('داده هنوز خوانده نشده؛ چند لحظه بعد دوباره بزنید','alert-triangle');setTimeout(tick,250)};setTimeout(tick,150)}
function buildTopbar(){
  const top=$('#pnTop'),E=window.InvEngine,today=E?.CAL?.today||'';
  top.innerHTML=`
    <button class="icon-btn menu-btn" id="pnMenu" aria-label="منو">${P.ic('menu')}</button>
    <div class="topbar-spacer"></div>
    ${today?`<span class="badge badge-accent plain" title="امروز">${P.ic('calendar')}${P.fa(today)}</span>`:''}
    <div class="quick-wrap"><button class="btn btn-primary" id="quickBtn">${P.ic('plus')}<span class="quick-label">ثبت جدید</span></button><div class="quick-menu" id="quickMenu"></div></div>
    <button class="icon-btn" id="pnTheme" aria-label="تغییر تم روشن / تیره" title="تم روشن / تیره">${P.ic('moon')}</button>
    <button class="icon-btn" aria-label="کارهای امروز" title="کارهای امروز" onclick="P.go('#/home')">${P.ic('bell')}</button>`;
  $('#pnMenu').onclick=()=>setMenu(!$('#pnSide').classList.contains('open'));
  $('#pnBack').onclick=()=>setMenu(false);
  $('#pnTheme').onclick=()=>{const n=curTheme()==='dark'?'light':'dark';document.documentElement.dataset.theme=n;store('rt_theme',n);themeIcon();setTimeout(()=>RT.refreshCharts(),30)};
  const qm=$('#quickMenu');
  const liveList=()=>QUICK_LIVE.filter(q=>P.can(q.mod)&&(P.owner()||AAx().has(q.key)));
  $('#quickBtn').onclick=e=>{e.stopPropagation();
    const live=P.live(),list=live?liveList():QUICK.filter(q=>P.can(q.mod,q.need));
    qm.innerHTML=list.length?list.map((q,i)=>`<button data-q="${live?i:q.k}"><span class="thumb kpi-icon">${P.ic(q.icon)}</span><span><b>${q.t}</b><small>${q.s}</small></span></button>`).join(''):'<p class="muted" style="padding:8px">ثبتی برای دسترسی شما تعریف نشده</p>';
    RT.icons();qm.classList.toggle('open')};
  qm.onclick=e=>{const b=e.target.closest('[data-q]');if(!b)return;qm.classList.remove('open');const k=b.dataset.q;
    if(P.live())return openLive(liveList()[+k]);
    k==='pay'?P.pay():k==='invoiceAI'?window.InvoiceAI&&InvoiceAI.open():P.actions[k]&&P.actions[k]()};
  document.addEventListener('click',e=>{if(!e.target.closest('.quick-wrap'))qm.classList.remove('open')});
  themeIcon();
}
const curTheme=()=>document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
function themeIcon(){const b=$('#pnTheme');if(!b)return;b.innerHTML=P.ic(curTheme()==='dark'?'sun':'moon');RT.icons()}
function setMenu(o){$('#pnSide').classList.toggle('open',o);$('#pnBack').classList.toggle('open',o)}

P.start=()=>{
  /* the old visual skins are retired: one theme, light or dark */
  try{localStorage.removeItem('pn_skin')}catch(_){}
  for(const id of Object.keys(P.LEGACY)){const m=P.mods[id];if(m&&m.tabs&&!m.tabs.some(t=>t.id==='legacy'))m.tabs.push(legacyTab(id))}
  buildTopbar();
  window.addEventListener('hashchange',()=>{P.render();window.scrollTo(0,0)});
  P.render();
};
window.P=P;
})();
