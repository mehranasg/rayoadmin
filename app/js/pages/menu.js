/* Rayo Panel prototype — منو و قیمت‌گذاری
   One price source → سالن، بیرون‌بر، اسنپ‌فود، منوی QR. Recipe → inventory deduction. */
(function(){
'use strict';
const TARGET={'قهوه':30,'نوشیدنی گرم':30,'غذا':33,'پیش‌غذا':30,'نوشیدنی آماده':60};
const fc=m=>P.recipeCost(m)/m.price*100;
const round5=v=>Math.ceil(v/5000)*5000;
const fcB=(v,t)=>`<span class="${v>t+3?'down':v>t?'':'up'}">${RT.pct(v)}</span>`;

function items(){
  const act=D.MENU.filter(m=>m.active);
  return`<div class="grid grid-4">
    ${P.kpi({label:'آیتم فعال',icon:'utensils',value:P.fa(act.length),unit:'آیتم'})}
    ${P.kpi({label:'میانگین بهای مواد',icon:'percent',value:RT.pct(act.reduce((s,m)=>s+fc(m)*m.qty,0)/act.reduce((s,m)=>s+m.qty,0)),foot:'وزنی بر اساس فروش'})}
    ${P.kpi({label:'رسپی ناقص',icon:'alert-triangle',value:P.fa(D.MENU.filter(m=>m.incomplete).length),unit:'آیتم',tone:'warning',foot:'بها کمتر از واقع نشان داده می‌شود'})}
    ${P.kpi({label:'بالاتر از هدف',icon:'trending-up',value:P.fa(act.filter(m=>fc(m)>TARGET[m.cat]).length),unit:'آیتم',tone:'danger',foot:'<a href="#/menu/pricing">پیشنهاد قیمت</a>'})}
  </div>
  <div class="mt">${P.card({flush:1,body:`<div class="toolbar"><label class="search">${P.ic('search')}<input placeholder="نام آیتم"></label>${P.chips('mc',[['all','همه'],...Object.keys(TARGET).map(k=>[k,k])],'all')}</div>
    ${P.table(['آیتم','دسته',{t:'قیمت سالن',n:1},{t:'بهای مواد',n:1},{t:'درصد مواد',n:1},{t:'سود هر فروش',n:1},'کانال‌ها','رسپی','وضعیت'],D.MENU.map(m=>({cls:'click',attr:`onclick="P.go('#/menu/recipes/${m.id}')"`,c:[
      `<b>${m.name}</b>`,m.cat,P.t(m.price),P.t(P.recipeCost(m)),fcB(fc(m),TARGET[m.cat]),P.t(m.price-P.recipeCost(m)),
      `<span class="row">${D.CHANNELS.map(c=>`<span title="${c.name}" style="opacity:${m.ch.includes(c.id)?1:.2}">${P.ic(c.icon)}</span>`).join('')}</span>`,
      m.incomplete?P.b('ناقص','warning'):P.b('کامل','success',1),m.active?P.b('فعال','success'):P.b('غیرفعال','neutral')]})))}`})}</div>`;
}

function recipes(r){
  const m=D.MENU.find(x=>x.id===r.param)||D.MENU[0];
  const line=(l,i,kind)=>{const it=P.item(l[0]);return`<tr data-l="${kind}:${i}"><td>${P.cellMain(it.name,P.b(it.level,'neutral',1),it.icon)}</td><td><input class="input sm" value="${P.fa(l[1])}"></td><td>${it.unit}</td><td class="num">${P.fa(it.waste)}٪</td><td class="num">${RT.n1(P.unitCost(it))}</td><td class="num" data-c>${P.t(P.lineCost(l))}</td></tr>`};
  return`<div class="split">
    ${P.card({flush:1,body:`<div class="side-list">${D.MENU.map(x=>`<button class="${x.id===m.id?'active':''}" onclick="P.go('#/menu/recipes/${x.id}')"><div class="grow"><b>${x.name}</b><small>${x.cat} · ${RT.pct(fc(x))}</small></div>${x.incomplete?P.ic('alert-triangle','down'):''}</button>`).join('')}</div>`})}
    <div class="stack">
      ${P.card({title:'رسپی '+m.name,sub:'مقدار خالص مصرف در هر پرس. انبار مقدار ناخالص (با افت) را کم می‌کند.',actions:`<button class="btn btn-secondary btn-sm" onclick="P.toast('ردیف جدید از کاتالوگ (نمونه)')">${P.ic('plus')}ماده</button>`,flush:1,
        body:`${m.incomplete?`<div style="padding:0 var(--s5) var(--s3)">${P.note('<b>رسپی ناقص:</b> '+m.incomplete+' — بهای تمام‌شده کمتر از واقع است.','alert-triangle')}</div>`:''}
        <div class="table-wrap"><table class="table" id="rcp"><thead><tr><th>ماده</th><th>مقدار</th><th>واحد</th><th class="num">افت</th><th class="num">بهای خالص واحد</th><th class="num">بها</th></tr></thead><tbody>
        ${m.lines.map((l,i)=>line(l,i,'l')).join('')}
        <tr><td>${P.cellMain('سربار نمک و ادویه',P.ovh(m)?'نرخ ثابت هر پرس غذا — خودکار':'برای این دسته محاسبه نمی‌شود','sparkle')}</td><td colspan="4"><small class="muted">${P.ovh(m)?'از خرید ۳ ماه ÷ پرس‌های غذا · <a href="#/menu/settings">نرخ فعلی</a>':'—'}</small></td><td class="num">${P.t(P.ovh(m))}</td></tr>
        ${m.packLines.length?`<tr><td colspan="6" class="muted" style="font-size:12px">بسته‌بندی — فقط برای بیرون‌بر و اسنپ‌فود</td></tr>${m.packLines.map((l,i)=>line(l,i,'p')).join('')}`:''}
        </tbody></table></div>`,
        foot:`${m.lines.some(l=>l[0]==='i8')?'روغن: مقدار «جذب روغن» هر پرس است؛ تعویض روغن سرخ‌کن جدا در «انبار ← مدیریت مصرف» کنترل می‌شود. ':''}تغییر رسپی از تاریخ امروز نسخهٔ جدید می‌سازد؛ فروش‌های قبلی با نسخهٔ قبلی حساب می‌شوند.`})}
      <div class="grid grid-2">
        ${P.card({title:'بهای تمام‌شده',body:`<div class="minis"><div class="mini"><small>سالن</small><b id="rcDine"></b></div><div class="mini"><small>بیرون‌بر</small><b id="rcTake"></b></div><div class="mini"><small>درصد مواد (سالن)</small><b id="rcFc"></b></div><div class="mini"><small>هدف ${m.cat}</small><b>${P.fa(TARGET[m.cat])}٪</b></div></div>
          <div class="sum-box mt"><span>قیمت پیشنهادی با هدف</span><b id="rcSug"></b></div>`})}
        ${P.card({title:'نسخه‌ها',flush:1,body:P.table(['از تاریخ','تغییر','ثبت‌کننده'],[['۱ آبان ۱۴۰۵','شیر ۲۰۰ ← ۲۲۰','مالک'],['۱ تیر ۱۴۰۵','نسخهٔ اولیه','مدیر داخلی']]),
          foot:`<button class="btn btn-primary btn-sm" onclick="P.toast('نسخهٔ جدید رسپی از امروز ثبت شد')">${P.ic('save')}ذخیرهٔ نسخهٔ جدید</button>`})}
      </div>
    </div></div>`;
}
function mountRecipes(root,r){
  const m=D.MENU.find(x=>x.id===r.param)||D.MENU[0],tb=P.$('#rcp tbody',root);if(!tb)return;
  const calc=()=>{
    P.$$('[data-l]',tb).forEach(tr=>{const[k,i]=tr.dataset.l.split(':');const arr=k==='l'?m.lines:m.packLines;arr[+i][1]=P.num(P.$('input',tr).value);P.$('[data-c]',tr).textContent=P.t(P.lineCost(arr[+i]))});
    const c=P.recipeCost(m),ct=P.recipeCost(m,'take');
    P.$('#rcDine',root).textContent=P.t(c);P.$('#rcTake',root).textContent=P.t(ct);P.$('#rcFc',root).innerHTML=fcB(c/m.price*100,TARGET[m.cat]);
    P.$('#rcSug',root).innerHTML=P.T(round5(c/(TARGET[m.cat]/100)));
  };
  tb.addEventListener('input',calc);calc();
}

function pricing(){
  const rows=D.MENU.filter(m=>m.active).map(m=>{const c=P.recipeCost(m),sug=round5(c/(TARGET[m.cat]/100));return{m,c,sug,d:sug-m.price}}).sort((a,b)=>b.d-a.d);
  return`${P.card({flush:1,title:'پیشنهاد قیمت بر اساس درصد هدف بهای مواد',sub:'قیمت پیشنهادی = بهای تمام‌شده ÷ درصد هدف، گرد به ۵ هزار تومان',
    body:P.table(['آیتم',{t:'بهای مواد',n:1},{t:'قیمت فعلی',n:1},{t:'درصد فعلی',n:1},{t:'هدف',n:1},{t:'پیشنهادی',n:1},{t:'اختلاف',n:1},''],rows.map(({m,c,sug,d})=>[`<b>${m.name}</b>`,P.t(c),P.t(m.price),fcB(c/m.price*100,TARGET[m.cat]),P.fa(TARGET[m.cat])+'٪',P.t(sug),
      `<span class="${d>0?'down':'up'}">${d>0?'+':''}${P.t(d)}</span>`,P.can('menu','full')?`<button class="btn btn-ghost btn-sm" onclick="P.priceChange('${m.id}',${sug})">تغییر قیمت</button>`:'']))})}
  <div class="grid grid-2 mt">
    ${P.card({title:'تاریخچهٔ تغییر قیمت',flush:1,body:P.table(['تاریخ','آیتم',{t:'از',n:1},{t:'به',n:1},'علت','ثبت‌کننده'],D.PRICE_LOG.map(l=>[P.dd(l.date),D.MENU.find(m=>m.id===l.item).name,P.t(l.from),P.t(l.to),l.reason,l.by]))})}
    ${P.note('<b>قیمت فقط یک جا تغییر می‌کند.</b> با ثبت قیمت جدید از یک تاریخ، صندوق، منوی QR و (در فاز بعد) اسنپ‌فود از همان تاریخ قیمت جدید را می‌گیرند. قیمت هر کانال با قاعدهٔ کانال (مثلاً +۱۵٪ اسنپ‌فود) خودکار ساخته می‌شود.','tag')}
  </div>`;
}
P.priceChange=(id,sug)=>{const m=D.MENU.find(x=>x.id===id);P.form({title:'تغییر قیمت — '+m.name,ok:'ثبت قیمت جدید',body:`<div class="form-grid">
  ${P.field('قیمت فعلی',`<input class="input" disabled value="${P.t(m.price)}">`)}${P.field('قیمت جدید (سالن)',P.money('np',sug))}
  ${P.field('از تاریخ',`<input class="input" value="${P.d('1405/08/16')}">`)}${P.field('علت',`<input class="input" name="why" placeholder="مثلاً افزایش قیمت شیر">`)}
  <div class="full">${P.field('اعمال روی',D.CHANNELS.map(c=>`<label class="check" style="margin-inline-end:16px"><input type="checkbox" ${m.ch.includes(c.id)?'checked':''}>${c.name}${c.markup?` (+${P.fa(c.markup)}٪)`:''}</label>`).join(''))}</div></div>`,
  onOk:f=>{const np=P.num(f.np.value);D.PRICE_LOG.unshift({date:'1405/08/16',item:id,from:m.price,to:np,by:P.role().name,reason:f.why.value||'—'});m.price=np;P.toast('قیمت جدید ثبت شد و از ۱۶ آبان منتشر می‌شود')}})};

function channels(){
  return`<div class="grid grid-4">${D.CHANNELS.map(c=>P.card({body:`<div class="row"><span class="kpi-icon">${P.ic(c.icon)}</span><div><b>${c.name}</b><small class="muted" style="display:block">${c.markup?'+'+P.fa(c.markup)+'٪ قیمت':'قیمت پایه'}${c.commission?' · کارمزد '+P.fa(c.commission)+'٪':''}${c.pack?' · با بسته‌بندی':''}</small></div></div>
    <div class="mt">${c.id==='qr'?P.b('منتشر شده · ۱۴ آبان','success'):c.id==='snapp'?P.b('اتصال API — فاز بعد','neutral'):P.b('فعال','success')}</div>`})).join('')}</div>
  <div class="mt">${P.card({flush:1,title:'قیمت و سود خالص در هر کانال',sub:'سود خالص = قیمت − کارمزد − بهای مواد − بسته‌بندی',actions:`<button class="btn btn-primary btn-sm" onclick="P.toast('منوی QR با قیمت‌های امروز منتشر شد')">${P.ic('qr-code')}انتشار منوی QR</button>`,
    body:P.table(['آیتم',...D.CHANNELS.map(c=>({t:c.name,n:1}))],D.MENU.filter(m=>m.active).map(m=>[`<b>${m.name}</b>`,...D.CHANNELS.map(c=>{if(!m.ch.includes(c.id))return'<span class="muted">—</span>';const p=P.chPrice(m,c.id),net=p*(1-c.commission/100)-P.recipeCost(m,c.id);
      return`${P.t(p)}<small class="muted" style="display:block">سود ${P.t(net)}</small>`})]))})}</div>
  <div class="mt">${P.note('در فاز بعد: منوی QR مستقیم از همین داده خوانده می‌شود (عکس، توضیح، ناموجود شدن آیتم با تمام‌شدن موجودی) و فروش اسنپ‌فود از API پلتفرم وارد «دفتر فروش» و طلب از پلتفرم می‌شود.','plug')}</div>`;
}

function engineering(){return`<div class="grid grid-3"><div class="span-2">${P.card({title:'مهندسی منو',sub:'محبوبیت (تعداد فروش) در برابر سود هر فروش',body:'<div class="chart chart-lg" id="mnEng"></div>'})}</div>
  ${P.card({title:'چهار گروه',body:`<ul class="spec-list"><li><b>ستاره</b> (پرفروش، پرسود): حفظ کیفیت، جای اصلی منو.</li><li><b>اسب کاری</b> (پرفروش، کم‌سود): کمی قیمت یا کاهش بها.</li><li><b>معما</b> (کم‌فروش، پرسود): معرفی بهتر، پیشنهاد گارسون.</li><li><b>سگ</b> (کم‌فروش، کم‌سود): حذف یا بازطراحی.</li></ul>`})}</div>`}
function mountEng(){
  const a=D.MENU.filter(m=>m.active).map(m=>({n:m.name,q:m.qty,g:m.price-P.recipeCost(m)}));const mq=a.reduce((s,x)=>s+x.q,0)/a.length,mg=a.reduce((s,x)=>s+x.g,0)/a.length;
  RT.chart('mnEng',t=>Object.assign(RT.base(t),{grid:{left:16,right:16,top:24,bottom:24,containLabel:true},tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>`<b>${p.data[2]}</b>`+RT.tipRow(p.color,'فروش',P.fa(p.data[0]))+RT.tipRow(p.color,'سود هر فروش',P.t(p.data[1]))}),
    xAxis:RT.axis(t,{type:'value',name:'تعداد فروش',nameLocation:'middle',nameGap:26,nameTextStyle:{color:t.text3,fontFamily:t.font}}),yAxis:RT.axis(t,{type:'value',axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>RT.short(v)}}),
    series:[{type:'scatter',symbolSize:16,data:a.map(x=>[x.q,x.g,x.n]),itemStyle:{color:p=>p.data[0]>=mq?(p.data[1]>=mg?t.success:t.warning):(p.data[1]>=mg?t.accent:t.danger)},
      label:{show:true,position:'top',formatter:p=>p.data[2],color:t.text2,fontFamily:t.font,fontSize:11},
      markLine:{silent:true,symbol:'none',lineStyle:{color:t.border,type:'dashed'},label:{show:false},data:[{xAxis:mq},{yAxis:mg}]}}]}));
}

/* salt & spice overhead: one number, recalculated every 3 months, no counting */
function ovhCard(){const o=D.OVERHEAD,t=o.buys.reduce((a,b)=>a+b[2],0),r=P.ovhRate(),cur=Math.round(o.current.buys/o.current.portions);
  return P.card({title:'سربار نمک و ادویه',sub:'یک مبلغ ثابت برای هر پرس غذا — بدون شمارش، بدون ورود در هر رسپی',flush:1,
    body:P.table(['خرید '+o.window,{t:'مبلغ',n:1}],o.buys.map(b=>[b[0],P.t(b[2])]),{foot:['جمع',P.t(t)]})+
    `<div style="padding:var(--s4) var(--s5)"><div class="minis"><div class="mini"><small>پرس غذا در همین ۳ ماه</small><b>${P.fa(o.portions)}</b></div><div class="mini"><small>هر پرس</small><b>${P.t(Math.round(t/o.portions))}</b></div><div class="mini"><small>نرخ (گرد به ${P.t(o.roundTo)})</small><b>${P.T(r)}</b></div></div>
    <p class="muted" style="font-size:12px;margin-top:var(--s3)">شامل دسته‌های: ${o.cats.join('، ')}. نوشیدنی‌ها سربار ندارند. ${o.current.label}: ${P.t(cur)} تومان هر پرس (کنترل؛ بیش از ۳۰٪ بالاتر از نرخ = هشدار). هر ۳ ماه یک بار با یک کلیک به‌روز می‌شود؛ ادویهٔ گران (مثل زعفران) سطح «عادی» دارد و در رسپی همان غذا می‌آید.</p>
    <button class="btn btn-secondary btn-sm" onclick="P.toast('نرخ سربار از خرید ۳ ماه اخیر دوباره محاسبه شد (نمونه)')">${P.ic('refresh-cw')}محاسبهٔ دوباره</button></div>`})}
function settings(){return`<div class="grid grid-2">
  ${P.card({title:'درصد هدف بهای مواد',sub:'به تفکیک دسته',flush:1,body:P.table(['دسته',{t:'هدف',n:1}],Object.entries(TARGET).map(([k,v])=>[k,`<div class="input-group" style="max-width:110px;margin-inline-start:auto"><input class="input" value="${P.fa(v)}"><span class="suffix">٪</span></div>`]))})}
  ${P.card({title:'قواعد کانال‌ها',flush:1,body:P.table(['کانال',{t:'افزایش قیمت',n:1},{t:'کارمزد',n:1},'بسته‌بندی'],D.CHANNELS.map(c=>[c.name,P.fa(c.markup)+'٪',P.fa(c.commission)+'٪',c.pack?'دارد':'ندارد']))})}
  ${ovhCard()}
  ${P.card({title:'گرد کردن قیمت',body:`<div class="segmented"><button>۱ هزار</button><button class="active">۵ هزار</button><button>۱۰ هزار</button></div>`})}
  ${P.card({title:'دسته‌های منو',body:`<div class="row" style="flex-wrap:wrap">${Object.keys(TARGET).map(k=>`<span class="chip">${k}</span>`).join('')}<button class="chip">${P.ic('plus')}</button></div>`})}
</div>`}

P.mod({id:'menu',label:'منو و قیمت',icon:'utensils-crossed',desc:'آیتم‌ها، رسپی، بهای تمام‌شده و قیمت در همهٔ کانال‌ها',
  tabs:[
    {id:'items',label:'آیتم‌های منو',icon:'utensils',title:'منو و قیمت‌گذاری',render:items,actions:()=>`<button class="btn btn-primary" onclick="P.toast('فرم آیتم جدید (نمونه)')">${P.ic('plus')}آیتم جدید</button>`},
    {id:'campaign',label:'تکمیل رسپی‌ها',icon:'list-checks',desc:'آیتم‌های بی‌رسپی به ترتیب فروش، با کپی از آیتم مشابه',render:()=>P.note('این صفحه فقط روی دادهٔ واقعی کار می‌کند.','info')},
    {id:'recipes',label:'رسپی و بهای تمام‌شده',icon:'chef-hat',desc:'مواد هر پرس، افت، سربار و نسخه‌ها',render:recipes,mount:mountRecipes},
    {id:'pricing',label:'قیمت‌گذاری',icon:'tag',desc:'پیشنهاد قیمت، تغییر قیمت از تاریخ و تاریخچه',render:pricing},
    {id:'channels',label:'کانال‌های فروش',icon:'store',desc:'سالن، بیرون‌بر، اسنپ‌فود و منوی QR — از یک قیمت',render:channels},
    {id:'engineering',label:'مهندسی منو',icon:'chart-scatter',desc:'کدام آیتم‌ها سود می‌سازند',render:engineering,mount:mountEng},
    {id:'settings',label:'تنظیمات',icon:'settings-2',desc:'هدف بهای مواد، کانال‌ها، گرد کردن',render:settings}
  ]});
})();
