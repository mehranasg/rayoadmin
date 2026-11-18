/* Rayo staff app — app/staff.html (phase 1G-1, BL-001, APP_REVIEW N-03 / X-07)
   The phone app of the staff that replaces the legacy staff panel (legacy/personel/*) page by page.
   - Sign-in: personnel with «پنل پرسنل» enabled, same check and same permission keys as the legacy panel
     (AdminAccess.verifyStaff / signInStaff; session role «staff», so every save names the person).
   - It runs on the same pages and save code as the management panel (index.html scripts): the cash report form
     (CashReal.form), the waste form (InvEntry.event), the beverage table (RayoBeverageControl with autoRoles), the
     leave request (PeopleWrite.requestLeave). Records carry the person (registeredByPersonnelId / reportedByPersonnelId).
   - Pages by permission: cashReport → گزارش صندوق; beverageControl → شمارش نوشیدنی; inventoryWaste /
     inventoryConsumption → ضایعات و مصرف. Everyone: شیفت‌های من، مرخصی.
   - The management shell (sidebar, tabs, admin sign-in) is not used: P.render draws these pages.
   Later steps (1G-2/1G-3): inventory count, purchase request and invoice, asset incident, checklists, tips view. */
(function(){
'use strict';
if(!window.RAYO_STAFF_APP)return;
const AA=window.AdminAccess,IC=window.InvControl,E=window.InvEngine,IE=window.InvEntry,PW=window.PeopleWrite,SW=window.ShiftWrite,CW=window.CashWrite;
const $=(s,r=document)=>r.querySelector(s),esc=P.esc,fa=P.fa,A=x=>Array.isArray(x)?x:[],S=x=>String(x??'').trim();
const me=()=>AA.staff(),can=k=>AA.staffCan(k),PR=()=>window.PeopleReal;
const today=()=>E.CAL.today,dayAdd=(d,n)=>E.CAL.k(E.CAL.i(d)+n);
const WD=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'],wd=d=>WD[(E.CAL.i(d)+1)%7];
const dayName=d=>d===today()?'امروز':d===dayAdd(today(),1)?'فردا':d===dayAdd(today(),-1)?'دیروز':wd(d);

/* ---------- pages ---------- */
const PAGES=[
 {k:'home',t:'خانه',icon:'house',nav:1},
 {k:'cash',t:'گزارش صندوق',s:'گزارش هر شب و گزارش‌های من',icon:'banknote',ok:()=>can('cashReport'),data:1},
 {k:'bev',t:'شمارش نوشیدنی',s:'شمارش صبح و شب',icon:'cup-soda',ok:()=>can('beverageControl'),data:1},
 {k:'waste',t:'ضایعات و مصرف',s:'همان لحظه که اتفاق افتاد',icon:'trash-2',ok:()=>can('inventoryWaste')||can('inventoryConsumption'),data:1},
 {k:'count',t:'شمارش انبار',s:'اقلام موعددار امروز',icon:'clipboard-check',ok:()=>can('inventoryCounts'),data:1},
 {k:'invoice',t:'رسیدن بار / فاکتور',s:'فاکتور خرید و ورود به انبار',icon:'file-plus-2',ok:()=>can('purchaseInvoices'),data:1},
 {k:'order',t:'سفارش خرید',s:'سفارش به تأمین‌کننده',icon:'clipboard-pen',ok:()=>can('purchaseRequests'),data:1},
 {k:'tips',t:'ثبت انعام',s:'انعام دریافتی و افراد شریک',icon:'hand-coins',ok:()=>can('tips'),hr:1},
 {k:'res',t:'رزرو',s:'رزروهای پیش رو و رزرو تازه',icon:'calendar-plus',ok:()=>can('reservations'),hr:1},
 {k:'sup',t:'تأمین‌کنندگان',s:'تماس و زمان سفارش',icon:'truck',ok:()=>can('suppliersView'),data:1},
 {k:'asset',t:'خرابی و مفقودی وسیله',s:'شکستگی، آسیب یا گم شدن',icon:'hammer',data:1},
 {k:'shifts',t:'شیفت‌های من',s:'این ماه و ماه بعد',icon:'calendar-days',nav:1,hr:1},
 {k:'leave',t:'مرخصی',s:'درخواست و سوابق',icon:'calendar-off',nav:1,hr:1}];
const title=p=>p.k==='waste'?(can('inventoryWaste')&&can('inventoryConsumption')?'ضایعات و مصرف':can('inventoryWaste')?'ضایعات':'مصرف مجاز'):p.t;
const allowed=p=>!p.ok||p.ok();
const route=()=>{const m=location.hash.match(/^#\/s\/([a-z]+)/);return m?m[1]:'home'};

/* ---------- sign-in ---------- */
function loginView(){document.body.classList.add('pn-locked');$('#pnTop').innerHTML='';$('#stNav').innerHTML='';
 $('#pnView').innerHTML=`<form class="card st-login" id="stLogin" autocomplete="on">
  <div class="brand" style="padding:0 0 var(--s4)"><div class="brand-mark">ر</div><div><strong>رایو</strong><small>اپ پرسنل</small></div></div>
  <div class="stack" style="gap:var(--s3)">${P.field('نام کاربری','<input class="input" name="u" dir="ltr" autocomplete="username" autocapitalize="none" required>')}${P.field('رمز عبور','<input class="input" name="p" type="password" dir="ltr" autocomplete="current-password" required>')}</div>
  <div id="stLoginErr" class="neg" role="alert" style="min-height:20px;font-size:13px"></div>
  <button class="btn btn-primary" type="submit" style="width:100%;justify-content:center">${P.ic('log-in')}ورود</button>
  <p class="muted" style="font-size:12px;margin:var(--s3) 0 0">همان نام کاربری و رمز پنل پرسنل. اگر ندارید، از مدیر بخواهید در پروندهٔ شما «پنل پرسنل» را فعال کند.</p></form>`;RT.icons();
 const f=$('#stLogin'),err=$('#stLoginErr');
 f.onsubmit=async e=>{e.preventDefault();const btn=f.querySelector('button');err.textContent='در حال بررسی…';btn.disabled=true;
  try{const r=await fetch(E.API_ROOT+'Load?module=personnel&_='+Date.now(),{cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});if(!r.ok)throw Error('HTTP '+r.status);
   const u=AA.verifyStaff(E.unwrap(await r.json()),f.u.value,f.p.value);if(!u){err.textContent='نام کاربری یا رمز عبور اشتباه است، یا پنل پرسنل شما فعال نیست.';f.p.value='';f.p.focus();return}
   AA.signInStaff(u);err.textContent='';document.body.classList.remove('pn-locked');if(!/^#\/s\//.test(location.hash))location.hash='#/s/home';render()}
  catch(_){err.textContent='اتصال به سرور برقرار نشد؛ اینترنت را بررسی کنید.'}finally{btn.disabled=false}}}
function signOut(){if(!confirm('از اپ پرسنل خارج می‌شوید؟'))return;AA.signOut();location.hash='';render()}

/* ---------- chrome ---------- */
function chrome(page){const u=me();
 $('#pnTop').innerHTML=`<div class="st-top-in">${page.k==='home'?`<div class="brand-mark sm">ر</div>`:`<button class="icon-btn" aria-label="بازگشت" onclick="P.go('#/s/home')">${P.ic('arrow-right')}</button>`}<div class="grow"><b>${esc(page.k==='home'?'سلام '+u.name:title(page))}</b><small class="muted">${fa(today())} · ${wd(today())}</small></div><button class="icon-btn" aria-label="خروج" title="خروج" onclick="StaffApp.signOut()">${P.ic('log-out')}</button></div>`;
 $('#stNav').innerHTML=PAGES.filter(p=>p.nav&&allowed(p)).map(p=>`<a href="#/s/${p.k}" class="${p.k===page.k?'active':''}">${P.ic(p.icon)}<span>${esc(p.t)}</span></a>`).join('')}

/* ---------- data ---------- */
const CR=()=>IC.state.raw?.cashreport||null,INV=()=>IC.state.raw?.inventory||null;
function dataGate(){const st=window.PanelData?.state?.()||{};if(IC.ready())return'';
 return st.err?P.card({title:'اطلاعات خوانده نشد',body:P.note(esc(st.err),'alert-triangle')+`<button class="btn btn-primary mt" onclick="PanelData.connect('live')">${P.ic('refresh-cw')}تلاش دوباره</button>`}):P.note('در حال خواندن اطلاعات…','loader')}
function hrGate(){const pr=PR();if(!pr)return P.note('بخش پرسنل بارگذاری نشده است.','alert-triangle');if(pr.doc())return'';if(pr.state.err)return P.note('اطلاعات پرسنل خوانده نشد: '+esc(pr.state.err),'alert-triangle');if(IC.ready())pr.load();return P.note('در حال خواندن شیفت‌ها…','loader')}
const myCash=()=>{const u=me();return CW&&CR()?CW.reports(CR()).filter(r=>r.registeredByPersonnelId===u.personnelId||(r.registeredByType==='staff'&&r.cashierId===u.personnelId)).sort((a,b)=>S(b.date).localeCompare(S(a.date))):[]};
const cashOf=d=>CW&&CR()?CW.reports(CR()).find(r=>E.D(r.date)===d):null;
const cashEditable=r=>{const u=me();return!!r&&(r.registeredByPersonnelId===u.personnelId||(r.registeredByType==='staff'&&r.cashierId===u.personnelId))&&!r.managementReviewStatus&&S(r.managerReview||'بررسی نشده')==='بررسی نشده'};
const bevOf=d=>A(INV()?.beverageDailyControls).find(x=>x.status!=='void'&&E.D(x.date)===d);
function bevState(d){const n=A(IE.bevItems?.()).length,r=bevOf(d),has=(l,k)=>l&&l[k+'Upper']!==undefined&&l[k+'Upper']!==null&&l[k+'Upper']!=='';const ls=A(r?.lines);return{n,m:ls.filter(l=>has(l,'morning')).length,e:ls.filter(l=>has(l,'night')).length}}
/* my shifts from the published monthly plans (a draft plan is not shown to staff) */
function myShifts(){const hr=PR()?.doc?.();if(!hr)return null;const u=me(),out=[],t=today();
 for(const plan of A(hr.monthlyPlans)){if(SW.isDraft?.(plan))continue;const asg=SW.assignments(plan.cells)[u.personnelId]||{};for(const [d,v] of Object.entries(asg))if(d>=dayAdd(t,-1))for(const [sh,l] of [['صبح',v.m],['عصر',v.e]])if(l)out.push({date:d,shift:sh,where:l.map(x=>[x.location,x.position].filter(Boolean).join(' · ')).join('، ')})}
 return out.sort((a,b)=>a.date.localeCompare(b.date)||a.shift.localeCompare(b.shift))}
function team(date){const hr=PR()?.doc?.(),u=me();if(!hr)return[];const names=new Map(A(hr.personnel).map(p=>[p.id,p.name])),by={};
 for(const plan of A(hr.monthlyPlans)){if(SW.isDraft?.(plan))continue;for(const [k,ids] of Object.entries(plan.cells||{})){const x=SW.parseKey(k);if(!x||x.date!==date)continue;for(const id of A(ids))if(id!==u.personnelId)(by[x.shift]||=new Set).add(names.get(id)||id)}}
 return Object.entries(by).map(([sh,s])=>[sh,[...s]])}

/* ---------- home ---------- */
function homeView(){const t=today(),y=dayAdd(t,-1),tasks=[];
 if(can('cashReport')&&IC.ready()){const r=cashOf(t),ry=cashOf(y);
  tasks.push(r?{tone:'ok',icon:'check',t:'گزارش صندوق امروز ثبت شد',s:r.registeredByName?'ثبت: '+r.registeredByName:'',go:'#/s/cash'}:{tone:'todo',icon:'banknote',t:'گزارش صندوق امروز',s:'آخر شب ثبت کنید',btn:['ثبت گزارش',`StaffApp.cash('','${t}')`]});
  if(!ry)tasks.push({tone:'late',icon:'alert-triangle',t:'گزارش صندوق دیروز ثبت نشده',s:fa(y),btn:['ثبت گزارش دیروز',`StaffApp.cash('','${y}')`]})}
 if(can('beverageControl')&&IC.ready()){const b=bevState(t);if(b.n)tasks.push({tone:b.m>=b.n&&b.e>=b.n?'ok':'todo',icon:'cup-soda',t:'شمارش نوشیدنی امروز',s:`صبح ${fa(b.m)} از ${fa(b.n)} · شب ${fa(b.e)} از ${fa(b.n)}`,go:'#/s/bev'})}
 const sh=myShifts(),todayS=sh?sh.filter(x=>x.date===t):null,next=sh?sh.find(x=>x.date>t):null,tm=team(t);
 const tiles=PAGES.filter(p=>p.k!=='home'&&allowed(p));
 return`${!IC.ready()&&PAGES.some(p=>p.data&&allowed(p))?dataGate():''}
 <div class="card st-today"><div class="row" style="gap:10px;align-items:flex-start">${P.ic('calendar-clock')}<div class="grow"><b>شیفت امروز</b>
  <div class="mt-xs">${sh===null?`<span class="muted">${PR()?.state?.err?'شیفت‌ها خوانده نشد':'در حال خواندن…'}</span>`:todayS.length?todayS.map(x=>`<div>${P.b(x.shift,'accent',1)} ${esc(x.where||'')}</div>`).join(''):'<span class="muted">امروز شیفت ندارید.</span>'}</div>
  ${next?`<small class="muted">شیفت بعدی: ${esc(dayName(next.date))} ${fa(next.date)} · ${esc(next.shift)}</small>`:''}
  ${todayS&&todayS.length&&tm.length?`<small class="muted" style="display:block">همکاران امروز: ${tm.map(([s,n])=>`${esc(s)}: ${n.map(esc).join('، ')}`).join(' — ')}</small>`:''}</div></div></div>
 ${tasks.length?`<h3 class="st-h">کارهای امروز</h3><div class="stack" style="gap:8px">${tasks.map(x=>`<div class="st-task st-${x.tone}"${x.go&&!x.btn?` onclick="P.go('${x.go}')" role="link"`:''}>${P.ic(x.icon)}<div class="grow"><b>${esc(x.t)}</b>${x.s?`<small>${esc(x.s)}</small>`:''}</div>${x.btn?`<button class="btn btn-primary btn-sm" onclick="${x.btn[1]}">${esc(x.btn[0])}</button>`:P.ic('chevron-left')}</div>`).join('')}</div>`:''}
 <h3 class="st-h">ثبت‌ها و صفحه‌ها</h3><div class="st-tiles">${tiles.map(p=>`<a class="st-tile" href="#/s/${p.k}">${P.ic(p.icon)}<b>${esc(title(p))}</b><small>${esc(p.s||'')}</small></a>`).join('')}</div>
 ${tiles.filter(p=>p.ok).length?'':P.note('ثبتی برای شما فعال نیست؛ برای گزارش صندوق، شمارش، ضایعات یا خرید از مدیر بخواهید دسترسی بدهد.','info')}
 <p class="muted st-foot">اپ پرسنل رایو. مشکل یا پیشنهاد را به مدیر بگویید.</p>`}

/* ---------- cash report ---------- */
function cashView(){const g=dataGate();if(g)return g;const t=today(),r=cashOf(t),mine=myCash().slice(0,40),T=v=>P.mt(CW.N(v)/10);
 return`<div class="card st-cta">${r?`<b>گزارش امروز ثبت شده است</b><small class="muted">${esc(r.registeredByName||'')}</small>${cashEditable(r)?`<button class="btn btn-secondary" onclick="StaffApp.cash('${esc(r.id)}')">${P.ic('pencil')}ویرایش گزارش امروز</button>`:''}`:`<b>گزارش صندوق امروز (${fa(t)})</b><button class="btn btn-primary btn-lg" onclick="StaffApp.cash('','${t}')">${P.ic('plus')}ثبت گزارش امروز</button>`}
  <button class="btn btn-ghost btn-sm" onclick="StaffApp.cashOther()">${P.ic('calendar')}گزارش روز دیگر</button></div>
 <h3 class="st-h">گزارش‌های من</h3>${mine.length?`<div class="stack" style="gap:8px">${mine.map(x=>{const c=CW.calc(x),v=c.valid?c.finalVariance:CW.N(x.finalVariance),rv=CW.reviewStatus(x,CW.N(CR()?.settings?.discrepancyLimit)||1000000);return`<div class="st-row"><div class="grow"><b>${fa(E.D(x.date))} <small class="muted">${esc(wd(E.D(x.date)))}</small></b><small>فروش ${c.valid?T(c.totalSales)+' '+P.unitName():'—'} · ${v?`مغایرت <span class="${v<0?'down':'up'}">${v>0?'+':''}${T(v)}</span> ${P.unitName()}`:'بدون مغایرت'}</small></div>${P.b(rv,rv==='بررسی‌شده'?'success':rv==='نیازمند بررسی'?'danger':'neutral',1)}${cashEditable(x)?`<button class="btn btn-ghost btn-sm btn-icon" aria-label="ویرایش" onclick="StaffApp.cash('${esc(x.id)}')">${P.ic('pencil')}</button>`:''}</div>`}).join('')}</div>`:P.note('هنوز گزارشی از شما ثبت نشده است.','info')}
 ${P.note('گزارش را تا وقتی مدیر بررسی نکرده می‌توانید ویرایش کنید. بعد از بررسی، اصلاح را به مدیر بگویید.','info')}`}
function cashForm(id,date){if(!IC.ready())return P.toast('اطلاعات هنوز خوانده نشده است','loader');if(!id&&date){const ex=cashOf(date);if(ex){if(!cashEditable(ex))return P.toast(`گزارش ${fa(date)} قبلاً ثبت شده است`,'alert-triangle');id=ex.id}}window.CashReal.form(id,id?'':date)}
function cashOther(){IE.formModal({title:'گزارش صندوق روز دیگر',ok:'ادامه',size:'sm',body:P.field('تاریخ',`<input class="input num" name="d" value="${fa(dayAdd(today(),-1))}">`,'فقط روزهای گذشته که گزارش ندارند'),can:()=>true,why:()=>'',
 onSave:m=>{const d=E.D(P.$('[name=d]',m).value);if(!d||d>today())throw Error('تاریخ معتبر نیست');P.close();setTimeout(()=>cashForm('',d),50)}})}

/* ---------- beverage count ---------- */
function bevView(){const g=dataGate();if(g)return g;const items=A(IE.bevItems());if(!items.length)return P.note('فهرست نوشیدنی‌های شمارش روزانه هنوز تعیین نشده است؛ به مدیر بگویید.','info');
 return`<div class="card st-bev"><div id="stBev"></div></div>${P.note('خانهٔ خالی یعنی «شمرده نشده». اگر نوشیدنی‌ای تمام شده، «۰» بنویسید. نام شما برای مرحله‌ای که وارد می‌کنید خودکار ثبت می‌شود.','info')}`}
function bevMount(v){const h=$('#stBev',v),B=window.RayoBeverageControl;if(h&&B?.table){if(!PR()?.doc?.())PR()?.load?.();h.innerHTML=B.table.html(IE.bevCfg({staff:me()}))}}

/* ---------- waste and allowed use ---------- */
function wasteView(){const g=dataGate();if(g)return g;const u=me(),inv=INV(),names=new Map([...IC.state.M.ing.values()].map(i=>[i.id,i.name]));
 const mine=[...A(inv.wasteRecords),...A(inv.consumptionRecords)].filter(r=>r.reportedByPersonnelId===u.personnelId).sort((a,b)=>S(b.createdAt).localeCompare(S(a.createdAt))).slice(0,30);
 const menu=new Map(A(IC.state.raw?.pricing?.menuItems).map(m=>[m.id,m.name]));
 return`<div class="card st-cta"><b>${esc(title(PAGES.find(p=>p.k==='waste')))}</b><small class="muted">همان لحظه ثبت کنید: چه چیزی، چقدر، از کدام بخش و چرا.</small><button class="btn btn-primary btn-lg" onclick="InvEntry.event()">${P.ic('plus')}ثبت تازه</button></div>
 <h3 class="st-h">ثبت‌های من</h3>${mine.length?`<div class="stack" style="gap:8px">${mine.map(r=>`<div class="st-row"><div class="grow"><b>${esc(r.type==='menu'?menu.get(r.itemId)||r.itemId:names.get(r.itemId)||r.itemId)}</b><small>${fa(E.D(r.date))} · ${esc(window.InvWrite.EVENT_LABELS[r.eventType]||r.eventType||'')} · ${fa(String(r.entryQuantity??r.quantity))} ${esc(r.entryUnit||'')}</small></div>${r.status==='void'?P.b('باطل','neutral',1):P.b(r.reviewStatus==='تأییدشده'?'تأییدشده':'در انتظار بررسی',r.reviewStatus==='تأییدشده'?'success':'warning',1)}</div>`).join('')}</div>`:P.note('هنوز ثبتی از شما نیست.','info')}`}

/* ---------- inventory count (ABC due items first, the same count form as the panel) ---------- */
const badge=(s,map)=>P.b(s,map[s]||'neutral',1);
function countView(){const g=dataGate();if(g)return g;let cd=null;try{cd=IE.cycleData()}catch(_){}const due=cd?cd.rows.filter(r=>r.due):[],ids=f=>due.filter(f).map(r=>r.id),a=ids(r=>r.cls==='A'),ab=ids(r=>r.cls!=='C'),u=me();
 const by=new Map;for(const s of A(INV().stocktakes)){if(s.status==='void'||s.isArchived)continue;const n=A(s.lines).filter(l=>l.countedByPersonnelId===u.personnelId).length;if(n)by.set(E.D(s.date),(by.get(E.D(s.date))||0)+n)}
 const btn=(list,label,title,cls='btn-secondary')=>list.length?`<button class="btn ${cls}" onclick='StaffApp.count(${JSON.stringify(list)},${JSON.stringify(title)})'>${P.ic('clipboard-check')}${label} (${fa(list.length)})</button>`:'';
 return`<div class="card st-cta"><b>شمارش امروز</b><small class="muted">اقلام پرمصرف (گروه A) باید زودتر شمرده شوند. فقط چیزی را که واقعاً شمردید بنویسید؛ خانهٔ خالی یعنی «شمرده نشد».</small>
  ${a.length||ab.length?btn(a,'گروه A','شمارش گروه A','btn-primary btn-lg')+btn(ab.length>a.length?ab:[],'گروه A و B','شمارش گروه A و B'):P.note('امروز قلمی موعد شمارش ندارد.','check')}
  <button class="btn btn-ghost btn-sm" onclick="InvEntry.count()">${P.ic('list')}شمارش اقلام دلخواه</button></div>
 <h3 class="st-h">شمارش‌های من</h3>${by.size?`<div class="stack" style="gap:8px">${[...by].sort((x,y)=>y[0].localeCompare(x[0])).slice(0,20).map(([d,n])=>`<div class="st-row"><div class="grow"><b>${fa(d)} <small class="muted">${esc(wd(d))}</small></b><small>${fa(n)} قلم شمرده شد</small></div></div>`).join('')}</div>`:P.note('هنوز شمارشی از شما ثبت نشده است.','info')}`}

/* ---------- purchase invoice (goods arrived) and purchase order: the panel's forms, with the supplier list ---------- */
const SUP=()=>window.FinanceReal?.suppliers?.()||null;
function supGate(){const F=window.FinanceReal;if(SUP())return'';if(F?.supState?.err)return P.note('فهرست تأمین‌کنندگان خوانده نشد: '+esc(F.supState.err),'alert-triangle');F?.loadSuppliers?.();return P.note('در حال خواندن تأمین‌کنندگان…','loader')}
function invoiceView(){const g=dataGate()||supGate();if(g)return g;const u=me(),T=v=>P.t(Math.round(+v||0)),ST={finalized:'ثبت نهایی',draft:'پیش‌نویس',void:'لغوشده'};
 const mine=A(INV().purchaseInvoices).filter(x=>x.registeredByPersonnelId===u.personnelId).sort((a,b)=>S(b.createdAt).localeCompare(S(a.createdAt))).slice(0,30);
 return`<div class="card st-cta"><b>بار رسید</b><small class="muted">فاکتور را با اقلام ثبت کنید؛ همان ثبت کالا را وارد انبار می‌کند. اگر همان لحظه پول دادید (کارتخوان تأمین‌کننده، نقد)، پرداخت را هم در همان فرم بزنید. عکس فاکتور را هم می‌شود گذاشت.</small><button class="btn btn-primary btn-lg" onclick="PurchaseEntry.detailed()">${P.ic('plus')}ثبت فاکتور</button></div>
 <h3 class="st-h">فاکتورهای ثبت‌شدهٔ من</h3>${mine.length?`<div class="stack" style="gap:8px">${mine.map(x=>`<div class="st-row"><div class="grow"><b>${esc(x.supplierNameSnapshot||'')}</b><small>${fa(E.D(x.date))} · شماره ${esc(fa(x.invoiceNumber||x.number||''))} · ${T(x.totalToman)} تومان · ${fa(A(x.lines).length)} ردیف</small></div>${badge(ST[x.status]||x.status,{'ثبت نهایی':'success','پیش‌نویس':'warning','لغوشده':'neutral'})}</div>`).join('')}</div>`:P.note('هنوز فاکتوری از شما ثبت نشده است.','info')}
 ${P.note('اصلاح یا ابطال فاکتور ثبت‌شده با مدیر است.','info')}`}
function orderView(){const g=dataGate()||supGate();if(g)return g;const u=me(),mine=A(SUP().purchaseRequests).filter(x=>!x.isArchived&&(x.requestedByPersonnelId===u.personnelId||x.createdByPersonnelId===u.personnelId)).sort((a,b)=>S(b.createdAt||b.date).localeCompare(S(a.createdAt||a.date))).slice(0,30);
 return`<div class="card st-cta"><b>سفارش خرید</b><small class="muted">سفارشی که به تأمین‌کننده می‌دهید. موجودی، قیمت و بدهی را تغییر نمی‌دهد؛ وقتی بار رسید، فاکتورش ثبت می‌شود.</small><button class="btn btn-primary btn-lg" onclick="PurchaseEntry.order()">${P.ic('plus')}سفارش تازه</button></div>
 <h3 class="st-h">سفارش‌های من</h3>${mine.length?`<div class="stack" style="gap:8px">${mine.map(o=>`<div class="st-row"><div class="grow"><b>${esc(o.supplierNameSnapshot||'')}</b><small>${fa(E.D(o.date))} · تحویل ${fa(E.D(o.expectedDeliveryDate||''))} · ${A(o.lines).slice(0,3).map(l=>esc(l.itemName||l.ingredientNameSnapshot||l.name||'')).join('، ')}${A(o.lines).length>3?' و '+fa(A(o.lines).length-3)+' قلم دیگر':''}</small></div>${badge(o.status||'ثبت‌شده',{'تحویل‌شده':'success','لغوشده':'neutral','ارسال‌شده':'info','تأیید تأمین‌کننده':'info'})}</div>`).join('')}</div>`:P.note('هنوز سفارشی از شما ثبت نشده است.','info')}`}

/* ---------- broken or missing asset (everyone; the manager reviews it, stock of assets is not changed) ---------- */
function assetView(){const AE=window.AssetsEntry,st=AE?.state?.()||{};if(!AE)return P.note('بخش دارایی‌ها بارگذاری نشده است.','alert-triangle');if(!AE.doc()){if(st.err)return P.note('دارایی‌ها خوانده نشد: '+esc(st.err),'alert-triangle');if(IC.ready())AE.load();return P.note('در حال خواندن دارایی‌ها…','loader')}
 const u=me(),mine=A(AE.doc().assetIncidents).filter(x=>x.reportedByPersonnelId===u.personnelId).sort((a,b)=>S(b.createdAt).localeCompare(S(a.createdAt))).slice(0,30);
 return`<div class="card st-cta"><b>خرابی، شکستگی یا مفقودی</b><small class="muted">همان موقع ثبت کنید: کدام وسیله، چند عدد و چه اتفاقی افتاد. ثبت شما موجودی اموال را کم نمی‌کند؛ مدیر بررسی می‌کند.</small><button class="btn btn-primary btn-lg" onclick="AssetsEntry.incident()">${P.ic('plus')}گزارش تازه</button></div>
 <h3 class="st-h">گزارش‌های من</h3>${mine.length?`<div class="stack" style="gap:8px">${mine.map(x=>`<div class="st-row"><div class="grow"><b>${esc(x.assetName||'')}</b><small>${fa(E.D(x.date))} · ${esc(x.type||'')} · ${fa(String(x.quantity||1))} عدد</small>${x.managerNote?`<small class="muted">مدیر: ${esc(x.managerNote)}</small>`:''}</div>${badge(x.status||'جدید',{'جدید':'warning','بررسی‌شده':'success','بسته‌شده':'success','ردشده':'neutral'})}</div>`).join('')}</div>`:P.note('هنوز گزارشی از شما ثبت نشده است.','info')}`}

/* ---------- tips, reservations, suppliers (the panel's forms; tips and reservations live in the personnel module) ---------- */
function tipsView(){const g=hrGate();if(g)return g;const hr=PR().doc(),u=me(),T=v=>P.t(Math.round(+v||0)),mine=A(hr.tipGroups).filter(x=>x.createdByPersonnelId===u.personnelId).sort((a,b)=>S(b.createdAt).localeCompare(S(a.createdAt))).slice(0,30);
 return`<div class="card st-cta"><b>ثبت انعام</b><small class="muted">انعامی که مشتری داده: مبلغ، نوع و افرادی که در آن شریک‌اند. سهم هر نفر را مدیر در حقوق ماه می‌بیند.</small><button class="btn btn-primary btn-lg" onclick="PeopleEntry.tip()">${P.ic('plus')}انعام تازه</button></div>
 <h3 class="st-h">انعام‌های ثبت‌شده توسط من</h3>${mine.length?`<div class="stack" style="gap:8px">${mine.map(x=>`<div class="st-row"><div class="grow"><b>${T(x.totalAmount)} تومان <small class="muted">${esc(x.type||'')}</small></b><small>${fa(E.D(x.receiveDate||x.date||''))} · ${fa(A(x.participants).length)} نفر</small></div>${badge(x.status||'ثبت‌شده',{'ثبت‌شده':'info','تسویه‌شده':'success','ابطال‌شده':'neutral'})}</div>`).join('')}</div>`:P.note('هنوز انعامی ثبت نکرده‌اید.','info')}`}
function resView(){const g=hrGate();if(g)return g;const hr=PR().doc(),t=today(),T=v=>P.t(Math.round(+v||0)),up=A(hr.reservations).filter(r=>E.D(r.date)>=t&&!['لغو','لغوشده'].includes(r.status)).sort((a,b)=>(E.D(a.date)+S(a.time)).localeCompare(E.D(b.date)+S(b.time))).slice(0,60);
 return`<div class="card st-cta"><b>رزرو تازه</b><small class="muted">نام، تلفن، تعداد نفر، ساعت و بیعانه (اگر گرفتید).</small><button class="btn btn-primary btn-lg" onclick="CustomersEntry.reservation()">${P.ic('plus')}ثبت رزرو</button></div>
 <h3 class="st-h">رزروهای پیش رو</h3>${up.length?`<div class="stack" style="gap:8px">${up.map(r=>`<div class="st-row${E.D(r.date)===t?' st-now':''}"><div class="st-date"><b>${fa(+E.D(r.date).slice(8))}</b><small>${esc(wd(E.D(r.date)))}</small></div><div class="grow"><b>${esc(r.customerName||'')} <small class="muted">${fa(String(r.partySize||''))} نفر${r.time?' · ساعت '+fa(r.time):''}</small></b><small>${esc(r.area||'')}${+r.depositAmount?' · بیعانه '+T(r.depositAmount)+' تومان':''}${r.phone?` · <a href="tel:${esc(r.phone)}" dir="ltr">${fa(r.phone)}</a>`:''}</small></div>${badge(r.status||'رزرو',{'رزرو':'info','انجام‌شده':'success','نیامد':'danger'})}</div>`).join('')}</div>`:P.note('رزرو پیش رویی ثبت نشده است.','info')}`}
function supView(){const g=dataGate()||supGate();if(g)return g;const rows=A(SUP().suppliers).filter(x=>x.status!=='غیرفعال'&&!x.isArchived).sort((a,b)=>S(a.mainGroup).localeCompare(S(b.mainGroup),'fa')||S(a.company).localeCompare(S(b.company),'fa'));
 const tel=n=>n?`<a href="tel:${esc(S(n))}" dir="ltr">${fa(S(n))}</a>`:'';
 return`<label class="search">${P.ic('search')}<input id="stSupQ" placeholder="نام یا کالا"></label><div class="stack" id="stSupL" style="gap:8px">${rows.map(x=>`<div class="st-row" data-k="${esc([x.company,x.contactName,x.mainGroup,x.purchaseItemsSummary].join(' '))}"><div class="grow"><b>${esc(x.company||x.contactName||'')} <small class="muted">${esc(x.mainGroup||'')}</small></b><small>${[x.contactName&&esc(x.contactName),tel(x.mobile),tel(x.phone)].filter(Boolean).join(' · ')}</small>${(o=>o?`<small>سفارش: ${esc(o)}</small>`:'')([A(x.orderDays).length?A(x.orderDays).join('، '):Array.isArray(x.orderDays)?'':S(x.orderDays),S(x.orderTimeWindow),S(x.orderMethod)].filter(Boolean).join(' · '))}${x.purchaseItemsSummary?`<small class="muted">${esc(x.purchaseItemsSummary)}</small>`:''}</div></div>`).join('')}</div>`}
function supMount(v){const q=$('#stSupQ',v),l=$('#stSupL',v);if(q)q.oninput=()=>{const t=q.value.trim();for(const r of l.children)r.style.display=!t||P.match(r.dataset.k,t)?'':'none'}}

/* ---------- shifts ---------- */
function shiftsView(){const g=hrGate();if(g)return g;const sh=myShifts(),t=today();if(!sh.length)return P.note('شیفتی برای شما در برنامهٔ منتشرشده نیست.','info');
 const by=new Map;for(const x of sh)(by.get(x.date)||by.set(x.date,[]).get(x.date)).push(x);
 return`<div class="stack" style="gap:8px">${[...by].map(([d,xs])=>`<div class="st-row${d===t?' st-now':''}"><div class="st-date"><b>${fa(+d.slice(8))}</b><small>${esc(wd(d))}</small></div><div class="grow">${xs.map(x=>`<div>${P.b(x.shift,x.shift==='صبح'?'info':'accent',1)} ${esc(x.where||'')}</div>`).join('')}<small class="muted">${esc(dayName(d)===wd(d)?fa(d):dayName(d)+' · '+fa(d))}</small></div></div>`).join('')}</div>
 ${P.note('این برنامه از «شیفت‌پلن» منتشرشدهٔ مدیر است. برای جابه‌جایی یا مرخصی درخواست بدهید.','info')}`}

/* ---------- leave ---------- */
function leaveView(){const g=hrGate();if(g)return g;const hr=PR().doc(),u=me(),reqs=A(hr.leaveRequests).filter(r=>r.personnelId===u.personnelId).sort((a,b)=>S(b.createdAt).localeCompare(S(a.createdAt))),used=A(hr.leaves).filter(l=>l.personnelId===u.personnelId&&l.status!=='لغوشده'&&S(l.fromDate).startsWith(today().slice(0,4)));
 const tone=s=>s==='تاییدشده'?'success':s==='ردشده'||s==='لغوشده'?'danger':'warning';
 return`<div class="card st-cta"><b>درخواست مرخصی</b><small class="muted">مدیر درخواست را تأیید یا رد می‌کند و نتیجه همین‌جا دیده می‌شود.</small><button class="btn btn-primary btn-lg" onclick="StaffApp.leave()">${P.ic('plus')}درخواست تازه</button></div>
 <h3 class="st-h">درخواست‌های من</h3>${reqs.length?`<div class="stack" style="gap:8px">${reqs.map(r=>`<div class="st-row"><div class="grow"><b>${esc(r.type||'مرخصی')}</b><small>${fa(E.D(r.fromDate))}${E.D(r.toDate)!==E.D(r.fromDate)?' تا '+fa(E.D(r.toDate)):''} · ${fa(String(r.count||''))} روز</small>${r.managerNote?`<small class="muted">مدیر: ${esc(r.managerNote)}</small>`:''}</div>${P.b(r.status||'در انتظار',tone(r.status||'در انتظار'),1)}</div>`).join('')}</div>`:P.note('هنوز درخواستی نداده‌اید.','info')}
 ${used.length?`<p class="muted st-foot">مرخصی ثبت‌شدهٔ امسال: ${fa(used.reduce((a,l)=>a+(+l.count||0),0))} روز</p>`:''}`}
function leaveForm(){const hr=PR()?.doc?.();if(!hr)return;const types=A(hr.lists?.leaveTypes).length?hr.lists.leaveTypes:['مرخصی استحقاقی'],t=dayAdd(today(),1);
 IE.formModal({title:'درخواست مرخصی',ok:'ارسال درخواست',can:()=>IE.live(),why:()=>'ثبت فقط با اتصال به سرور ممکن است',
  body:`<div class="form-grid">${P.field('نوع',`<select class="select" name="type">${types.map(x=>`<option>${esc(x)}</option>`).join('')}</select>`)}${P.field('تعداد روز',`<input class="input num" name="count" inputmode="decimal" placeholder="خالی = همهٔ روزهای بازه">`,'نیم‌روز: ۰٫۵')}${P.field('از تاریخ',`<input class="input num" name="from" value="${fa(t)}">`)}${P.field('تا تاریخ',`<input class="input num" name="to" value="${fa(t)}">`)}</div>${P.field('توضیح برای مدیر','<textarea class="textarea" name="note" rows="2"></textarea>')}`,
  onSave:(m,btn)=>{const v=n=>P.$(`[name=${n}]`,m).value,x={personnelId:me().personnelId,type:v('type'),fromDate:E.D(v('from')),toDate:E.D(v('to')),count:IE.latin(v('count')).replace(/٫/g,'.'),note:v('note')};
   PR().saveHr(btn,{action:'LEAVE_REQUESTED',details:{fromDate:x.fromDate,toDate:x.toDate},mutate:(d,c)=>PW.requestLeave(d,c,x),done:r=>`درخواست مرخصی ${fa(r.fromDate)} ثبت شد؛ منتظر تأیید مدیر بمانید`})}})}

/* ---------- render ---------- */
const VIEWS={home:[homeView],cash:[cashView],bev:[bevView,bevMount],waste:[wasteView],count:[countView],invoice:[invoiceView],order:[orderView],asset:[assetView],tips:[tipsView],res:[resView],sup:[supView,supMount],shifts:[shiftsView],leave:[leaveView]};
function render(){if(!me())return loginView();document.body.classList.remove('pn-locked');
 const hr=PR()?.doc?.();if(hr&&!AA.stillValid(hr)){AA.signOut();P.toast('دسترسی پنل پرسنل شما غیرفعال شده است','alert-triangle');return loginView()}
 if(IC.ready()&&PR()&&!hr&&!PR().state.busy&&!PR().state.err)PR().load();
 let p=PAGES.find(x=>x.k===route())||PAGES[0];if(!allowed(p))p=PAGES[0];chrome(p);
 const v=$('#pnView'),[view,mount]=VIEWS[p.k];v.innerHTML=`<div class="st-page">${view()}</div>`;RT.icons();mount&&IC.ready()&&mount(v)}
P.render=render;P.route=()=>({mod:'staff',tab:route(),param:''});
window.StaffApp={start:()=>{window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});render()},render,signOut,cash:cashForm,cashOther,leave:leaveForm,count:(only,title)=>InvEntry.count({only,title}),pages:PAGES};
})();
