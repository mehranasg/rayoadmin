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

/* ---------- modal ---------- */
P.modal=({title,body,foot,size='',onMount})=>{
  const host=$('#pnModal'),m=$('.modal',host);
  m.className='modal '+size;
  m.innerHTML=`<div class="modal-head"><h2>${title}</h2><button class="btn btn-ghost btn-sm btn-icon" data-close aria-label="بستن">${P.ic('x')}</button></div>
    <div class="modal-body">${body}</div>
    <div class="modal-foot">${foot||'<button class="btn btn-ghost" data-close>بستن</button>'}</div>`;
  host.classList.add('open');RT.icons();
  onMount&&onMount(m);
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

/* ---------- roles ---------- */
P.role=()=>D.ROLES.find(r=>r.id===(store('pn_role')||'owner'))||D.ROLES[0];
P.can=(mod,need='view')=>{const lv=(D.PERM[P.role().id]||{})[mod]||'none';const rank={none:0,view:1,edit:2,full:3};return rank[lv]>=rank[need]};
P.tabOk=(mod,tab)=>{const a=(D.TAB_ALLOW[P.role().id]||{})[mod];return!a||a.includes(tab)};
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

/* ---------- registry & router ---------- */
P.mod=m=>{P.mods[m.id]=m;P.order.push(m.id)};
P.go=h=>{location.hash=h};
P.route=()=>{const p=(location.hash.replace(/^#\/?/,'')||'home').split('/');return{mod:p[0]||'home',tab:p[1]||'',param:p[2]||''}};

P.render=()=>{
  const r=P.route();let m=P.mods[r.mod];
  if(!m||!P.can(r.mod)){m=P.mods.home;r.mod='home';r.tab=''}
  const view=$('#pnView');
  let html;
  const tabs=(m.tabs||[]).filter(t=>!t.hidden&&P.tabOk(m.id,t.id));
  if(m.render){html=m.render(r)}
  else{
    let t=(m.tabs||[]).find(x=>x.id===r.tab&&P.tabOk(m.id,x.id))||tabs[0];
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
function buildSidebar(active){
  const side=$('#pnSide'),role=P.role();
  const item=id=>{const m=P.mods[id];if(!m||!P.can(id))return'';const bd=m.badge&&m.badge();
    return`<a class="nav-link ${id===active?'active':''}" href="#/${id}">${P.ic(m.icon)}<span>${m.label}</span>${bd?`<span class="badge badge-danger plain">${P.fa(bd)}</span>`:''}</a>`};
  side.innerHTML=`
    <div class="brand"><div class="brand-mark">ر</div><div><strong>رایو</strong><small>پنل مدیریت رستوران</small></div></div>
    <div class="proto-flag">${P.ic('flask-conical')}نمونهٔ استاتیک — داده‌ها ساختگی‌اند</div>
    <nav class="nav">
      ${item('home')}
      <div class="nav-label">کار روزانه و ماهانه</div>
      ${['finance','inventory','people','menu','customers'].map(item).join('')}
      <div class="nav-label">تحلیل و پیکربندی</div>
      ${['reports','settings'].map(item).join('')}
      ${['owner','manager','cashier'].includes(role.id)?`<div class="nav-label">نرم‌افزارهای داخل مجموعه</div>${[['pos.html','صندوق','monitor-smartphone'],['waiter.html','سفارش‌گیر ویتر','smartphone'],['kds.html','مانیتور آشپزخانه','monitor'],['staff.html','پنل پرسنل (گوشی)','user-round']].map(([h,l,i])=>`<a class="nav-link" href="${h}" target="_blank" rel="noopener">${P.ic(i)}<span>${l}</span><span class="nav-meta">${P.ic('external-link')}</span></a>`).join('')}`:''}
      ${P.can('plan')?`<div class="nav-label">طرح</div>${item('plan')}`:''}
    </nav>
    <div class="sidebar-foot"><button class="role-chip" id="roleBtn" title="نمایش پنل از دید نقش‌های مختلف">
      <div class="avatar">${P.ic(role.icon)}</div><div class="grow"><b>${role.name}</b><small>تغییر نقش برای دیدن منوی هر کاربر</small></div>${P.ic('repeat')}</button></div>`;
  $('#roleBtn').onclick=rolePicker;
  side.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
}
function rolePicker(){
  P.modal({title:'مشاهدهٔ پنل به‌عنوان…',body:`<p class="muted">هر نقش فقط بخش‌ها و کارهای خودش را می‌بیند. منو کوتاه می‌ماند.</p>
    <div class="list">${D.ROLES.map(r=>`<button class="role-chip" data-role="${r.id}" style="margin-bottom:6px;${r.id===P.role().id?'border-color:var(--accent)':''}"><div class="avatar">${P.ic(r.icon)}</div><div class="grow"><b>${r.name}</b><small>${r.desc}</small></div>${r.id===P.role().id?P.ic('check'):''}</button>`).join('')}</div>`,
    onMount:m=>$$('[data-role]',m).forEach(b=>b.onclick=()=>{store('pn_role',b.dataset.role);P.close();P.go('#/home');P.render();P.toast('نقش: '+P.role().name,'user')})});
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
function buildTopbar(){
  const top=$('#pnTop');
  top.innerHTML=`
    <button class="icon-btn menu-btn" id="pnMenu" aria-label="منو">${P.ic('menu')}</button>
    <label class="search">${P.ic('search')}<input placeholder="جستجو: کالا، پرسنل، فاکتور، طرف حساب…"><kbd>Ctrl K</kbd></label>
    <div class="topbar-spacer"></div>
    <span class="badge badge-accent plain" title="دورهٔ کاری جاری">${P.ic('calendar')}آبان ۱۴۰۵ · باز</span>
    <div class="quick-wrap"><button class="btn btn-primary" id="quickBtn">${P.ic('plus')}<span class="quick-label">ثبت جدید</span></button><div class="quick-menu" id="quickMenu"></div></div>
    <button class="icon-btn" id="pnSkinBtn" aria-label="پوستهٔ ظاهری" title="پوسته: کلاسیک / شب / بازار">${P.ic('palette')}</button>
    <button class="icon-btn" id="pnTheme" aria-label="تغییر تم">${P.ic('moon')}</button>
    <button class="icon-btn" aria-label="اعلان‌ها" onclick="P.go('#/home')">${P.ic('bell')}<span class="dot"></span></button>`;
  $('#pnSkinBtn').onclick=()=>{const L=[['classic','کلاسیک'],['night','شب'],['bazaar','بازار']],cur=document.documentElement.dataset.skin||'classic',n=L[(L.findIndex(x=>x[0]===cur)+1)%L.length];
    let ln=document.getElementById('pnSkin');if(n[0]==='classic'){ln&&ln.remove();delete document.documentElement.dataset.skin}else{if(!ln){ln=document.createElement('link');ln.rel='stylesheet';ln.id='pnSkin';document.head.appendChild(ln)}ln.href='skins/'+n[0]+'.css';document.documentElement.dataset.skin=n[0]}
    store('pn_skin',n[0]);setTimeout(()=>RT.refreshCharts(),150);P.toast('پوسته: '+n[1],'palette')};
  $('#pnMenu').onclick=()=>setMenu(!$('#pnSide').classList.contains('open'));
  $('#pnBack').onclick=()=>setMenu(false);
  $('#pnTheme').onclick=()=>{const cur=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');const n=cur==='dark'?'light':'dark';document.documentElement.dataset.theme=n;store('rt_theme',n);themeIcon();RT.refreshCharts()};
  const qm=$('#quickMenu');
  $('#quickBtn').onclick=e=>{e.stopPropagation();
    const list=QUICK.filter(q=>P.can(q.mod,q.need));
    qm.innerHTML=list.length?list.map(q=>`<button data-q="${q.k}"><span class="thumb kpi-icon">${P.ic(q.icon)}</span><span><b>${q.t}</b><small>${q.s}</small></span></button>`).join(''):'<p class="muted" style="padding:8px">ثبتی برای این نقش تعریف نشده</p>';
    RT.icons();qm.classList.toggle('open')};
  qm.onclick=e=>{const b=e.target.closest('[data-q]');if(!b)return;qm.classList.remove('open');const k=b.dataset.q;k==='pay'?P.pay():k==='invoiceAI'?window.InvoiceAI&&InvoiceAI.open():P.actions[k]&&P.actions[k]()};
  document.addEventListener('click',e=>{if(!e.target.closest('.quick-wrap'))qm.classList.remove('open')});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('.search input',top).focus()}});
  themeIcon();
}
function themeIcon(){const d=(document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))==='dark';$('#pnTheme').innerHTML=P.ic(d?'sun':'moon');RT.icons()}
function setMenu(o){$('#pnSide').classList.toggle('open',o);$('#pnBack').classList.toggle('open',o)}

P.start=()=>{
  buildTopbar();
  window.addEventListener('hashchange',()=>{P.render();window.scrollTo(0,0)});
  P.render();
};
window.P=P;
})();
