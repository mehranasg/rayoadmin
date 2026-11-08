/* Rayo Panel prototype — تنظیمات روی دادهٔ واقعی (مرحلهٔ ۱۶)
   - «داده و بکاپ»: status of every RayoData module (last change, size, records) and the full backup ZIP of the current
     panel (js/38 downloadAll): every module loaded live from the server into data/<file>.json + manifest.json + README.txt;
     if one module cannot be loaded, no partial backup is downloaded. Read only — nothing is restored or written here.
   - «تاریخچهٔ تغییرات»: the changeLog rows of all modules side by side (who, when, what, from which panel).
   - «عمومی»: the key settings that drive calculations, with where each one is changed. */
(function(){
'use strict';
const IC=window.InvControl,E=window.InvEngine,mod=P.mods.settings;
const esc=P.esc,fa=P.fa,A=x=>Array.isArray(x)?x:[];
const MODULES=[['personnel','پرسنل و حقوق','personnel.json'],['suppliers','تأمین‌کنندگان','suppliers.json'],['pricing','قیمت‌گذاری و رسپی','pricing.json'],['inventory','انبار و کنترل مصرف','inventory.json'],['cashreport','گزارش صندوق و تحلیل فروش','cashreport.json'],['assets','اموال و دارایی','assets.json'],['finance','مالی','finance.json'],['survey','نظرسنجی','survey.json'],['errorlog','لاگ خطا','errorlog.json'],['sepidsaudit','Audit سپیدز','sepidsaudit.json'],['attendance','حضور و غیاب','attendance.json']];
const OPTIONAL=new Set(['attendance','sepidsaudit']);
const srcLine=()=>`<div class="row" style="gap:8px;margin-bottom:var(--s3);flex-wrap:wrap">${P.b(IC.source()==='live'?'دادهٔ زنده':'دادهٔ واقعی از فایل',IC.source()==='live'?'success':'info')}<span class="muted" style="font-size:12px">${esc(E.API_ROOT)}</span></div>`;
async function loadRaw(m){if(IC.source()!=='live'){const q=new URLSearchParams(location.search).get('data');if(!q)throw Error('فقط روی دادهٔ زنده');const r=await fetch(q+m+'.json',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return{text:await r.text()}}
 const r=await fetch(E.API_ROOT+`Load?module=${m}&_=`+Date.now(),{cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});if(!r.ok)throw Error('HTTP '+r.status);return{text:await r.text()}}
const unwrapText=t=>{const o=E.unwrap(JSON.parse(t));if(o&&o.code&&o.message&&!o.meta)throw Object.assign(Error(String(o.message).slice(0,160)),{notCreated:true});return o};

/* ---------- ZIP (stored, no compression) ---------- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
function makeZip(files){const te=new TextEncoder(),parts=[],central=[];let off=0;const u16=v=>[v&255,v>>>8&255],u32=v=>[v&255,v>>>8&255,v>>>16&255,v>>>24&255];
 for(const f of files){const name=te.encode(f.name),data=te.encode(f.data),crc=crc32(data),head=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0)]);parts.push(head,name,data);
  central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),name);off+=head.length+name.length+data.length}
 const csize=central.reduce((a,b)=>a+b.length,0),end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(csize),...u32(off),...u16(0)]);return new Blob([...parts,...central,end],{type:'application/zip'})}
const stamp=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');return `${E.CAL.today.replace(/\//g,'')}-${z(d.getHours())}${z(d.getMinutes())}`};

/* ---------- data & backup ---------- */
const st={busy:false,rows:null,err:''};
async function check(){st.busy=true;P.render();const rows=[];for(const [m,l,f] of MODULES){try{const {text}=await loadRaw(m),o=unwrapText(text),arrays=Object.entries(o||{}).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length]).sort((a,b)=>b[1]-a[1]);rows.push({m,l,f,ok:true,size:text.length,updated:o?.meta?.updatedAt||'',arrays})}catch(e){rows.push({m,l,f,ok:false,err:e.message,optional:OPTIONAL.has(m)})}}st.rows=rows;st.busy=false;P.render()}
async function backup(btn){const label=btn.innerHTML;btn.disabled=true;btn.innerHTML=P.ic('loader')+'در حال دریافت همهٔ ماژول‌ها…';RT.icons();
 try{const files=[],fail=[],skipped=[];for(const [m,l,f] of MODULES){try{const {text}=await loadRaw(m),o=unwrapText(text);files.push({name:`data/${f}`,data:JSON.stringify(o,null,2)})}catch(e){if(OPTIONAL.has(m))skipped.push(m);else fail.push(`${l}: ${e.message}`)}}
  if(fail.length)throw Error('بکاپ متوقف شد چون همهٔ ماژول‌ها از سرور دریافت نشدند:\n'+fail.join('\n'));
  const manifest={backupType:'Rayo live API data',createdAt:new Date().toISOString(),createdBy:'ui-template',apiOrigin:E.API_ROOT,seedPolicy:'manual-initialize-or-reset-only',modules:MODULES.filter(x=>!skipped.includes(x[0])).map(([module,label,file])=>({module,file:`data/${file}`,label})),notCreatedModules:skipped};
  files.unshift({name:'manifest.json',data:JSON.stringify(manifest,null,2)},{name:'README.txt',data:'Rayo live-data backup\nاین فایل فقط از داده زنده RayoData API ساخته شده و هیچ Seed در آن استفاده نشده است.\nاین فایل شامل اطلاعات حساس پرسنل (رمز، حساب بانکی) است؛ آن را امن نگه دارید.\n'});
  const a=document.createElement('a');a.href=URL.createObjectURL(makeZip(files));a.download=`rayo-backup-${stamp()}.zip`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},3000);P.toast(`بکاپ ${fa(files.length-2)} ماژول دانلود شد`,'check')}
 catch(e){P.toast(e.message,'alert-triangle')}finally{btn.disabled=false;btn.innerHTML=label;RT.icons()}}
function dataView(){const rows=st.rows;return srcLine()+P.card({title:'بکاپ داده‌های زنده',sub:'همهٔ ماژول‌ها مستقیم از RayoData API خوانده و در یک فایل ZIP دانلود می‌شوند (همان ساختار بکاپ پنل فعلی). اگر حتی یک ماژول دریافت نشود، بکاپ ناقص دانلود نمی‌شود.',actions:`<button class="btn btn-primary" id="stBackup">${P.ic('download')}تهیهٔ بکاپ کامل</button>`,body:P.note('فایل بکاپ اطلاعات حساس پرسنل (رمز ورود اپ پرسنل، حساب بانکی) را هم دارد؛ آن را در جای امن نگه دارید. بازگرداندن (Restore) فقط از پنل فعلی و با پیش‌نمایش انجام می‌شود.','shield-alert')})
 +`<div class="mt">${P.card({title:'وضعیت ماژول‌ها',actions:`<button class="btn btn-secondary btn-sm" id="stCheck" ${st.busy?'disabled':''}>${P.ic(st.busy?'loader':'refresh-cw')}بررسی</button>`,flush:1,body:rows?P.table(['ماژول','فایل','وضعیت',{t:'حجم',n:1},'آخرین تغییر','بزرگ‌ترین فهرست‌ها'],rows.map(r=>[esc(r.l),`<code>${esc(r.f)}</code>`,r.ok?P.b('سالم','success',1):P.b(r.optional?'ساخته نشده':'خطا','warning'),r.ok?`${fa(Math.round(r.size/1024))} KB`:'—',r.ok?esc(String(r.updated).slice(0,16).replace('T',' ')):`<small class="muted">${esc(r.err)}</small>`,r.ok?esc(r.arrays.slice(0,4).map(([k,n])=>`${k} ${n}`).join(' · ')):''])):`<div style="padding:var(--s4)">${P.note('برای دیدن وضعیت همهٔ ماژول‌ها «بررسی» را بزنید.','info')}</div>`})}</div>`}
function dataMount(root){const b=P.$('#stBackup',root);if(b)b.onclick=()=>backup(b);const c=P.$('#stCheck',root);if(c)c.onclick=()=>check()}

/* ---------- change history ---------- */
let logQ='',logMod='';
const LOGSRC=()=>[['inventory','انبار',IC.state.raw?.inventory],['pricing','منو و قیمت',IC.state.raw?.pricing],['personnel','پرسنل',window.PeopleReal?.doc?.()],['suppliers','تأمین‌کنندگان',window.FinanceReal?.suppliers?.()],['assets','اموال',window.ExtrasReal?.mods?.assets?.doc],['cashreport','صندوق',IC.state.raw?.cashreport]];
function logView(){if(!window.PeopleReal?.doc?.()&&!window.PeopleReal?.state?.err)window.PeopleReal?.load?.();if(!window.FinanceReal?.suppliers?.()&&!window.FinanceReal?.supState?.err)window.FinanceReal?.loadSuppliers?.();if(!window.ExtrasReal?.mods?.assets?.doc)window.ExtrasReal?.loadModule?.('assets');
 const src=LOGSRC(),rows=src.flatMap(([m,l,d])=>A(d?.changeLog).map(x=>({m,l,at:String(x.at||''),action:x.action||'',actor:x.actor||x.createdBy||'',via:x.via||'',entity:x.entityId||x.invoiceId||x.menuId||x.supplierId||''}))).filter(r=>(!logMod||r.m===logMod)&&(!logQ||`${r.action} ${r.actor} ${r.entity}`.toLowerCase().includes(logQ.toLowerCase()))).sort((a,b)=>b.at.localeCompare(a.at));
 return srcLine()+P.card({flush:1,title:'تاریخچهٔ تغییرات همهٔ بخش‌ها',sub:`${fa(rows.length)} ردیف · هر بخش فقط ردیف‌های نگه‌داشته‌شدهٔ خودش را دارد (پرسنل و قیمت ۵۰۰، تأمین ۳۰۰ ردیف آخر)`,actions:`<select class="select" id="lgMod" style="width:auto"><option value="">همهٔ بخش‌ها</option>${src.map(([m,l,d])=>`<option value="${m}" ${m===logMod?'selected':''} ${d?'':'disabled'}>${l}${d?` (${fa(A(d.changeLog).length)})`:' — در حال خواندن'}</option>`).join('')}</select><label class="search">${P.ic('search')}<input id="lgQ" placeholder="عملیات، کاربر یا کد" value="${esc(logQ)}"></label>`,
  body:P.table(['زمان','بخش','عملیات','کاربر','کد','از'],rows.slice(0,400).map(r=>[r.at?esc(new Date(r.at).toLocaleString('fa-IR')):'—',esc(r.l),`<span class="wrap">${esc(r.action)}</span>`,esc(r.actor),`<small>${esc(r.entity)}</small>`,r.via==='ui-template'?P.b('پنل جدید','info',1):P.b('پنل فعلی','neutral',1)]),{empty:'ردیفی نیست'})})}
function logMount(root){const s=P.$('#lgMod',root);if(s)s.onchange=e=>{logMod=e.target.value;P.render()};const q=P.$('#lgQ',root);if(q)q.onchange=e=>{logQ=e.target.value;P.render()}}

/* ---------- general ---------- */
function generalView(){const inv=IC.state.raw?.inventory||{},pr=IC.state.raw?.pricing||{},cr=IC.state.raw?.cashreport||{},hr=window.PeopleReal?.doc?.();if(!hr&&!window.PeopleReal?.state?.err)window.PeopleReal?.load?.();
 const fo=window.InvWrite?.oilSettings?.(inv,pr),row=(l,v,where)=>[l,`<b>${v}</b>`,where];
 const rows=[row('نام مجموعه',esc(hr?.settings?.restaurantName||pr?.meta?.restaurant||'—'),'پنل فعلی ← تنظیمات'),row('حالت انبار',inv.settings?.inventoryControlMode==='unified'?'تک‌انبار':esc(inv.settings?.inventoryControlMode||'—'),'پنل فعلی ← تنظیمات انبار'),
  row('حد مجاز مغایرت صندوق',`${P.t((Number(cr.settings?.discrepancyLimit)||1000000)/10)} تومان`,'پنل فعلی ← گزارش صندوق'),row('قفل گزارش صندوق پس از',`${fa(cr.settings?.reportLockAfterDays||'—')} روز`,'پنل فعلی ← گزارش صندوق'),
  row('گام قیمت منو',`${P.t(Math.max(1000,Number(pr.settings?.priceIncrementToman)||10000))} تومان`,'<a href="#/menu/settings">منو و قیمت ← تنظیمات</a>'),row('هدف پیش‌فرض بهای مواد',`غذا ${fa(pr.settings?.defaultFoodTargetPercent||35)}٪ · بار ${fa(pr.settings?.defaultBarTargetPercent||25)}٪`,'<a href="#/menu/settings">منو و قیمت ← تنظیمات</a>'),
  row('سرخ‌کن‌ها',fo?`${fa(fo.fryers.length)} سرخ‌کن · چگالی ${fa(fo.density)}${fo.logFrom?` · دفتر از ${fa(fo.logFrom)}`:''}`:'—','<a href="#/inventory/settings">انبار ← تنظیمات</a>'),row('نوشیدنی‌های کنترل روزانه',fa(A(inv.settings?.beverageControl?.itemIds).length),'پنل فعلی ← تنظیمات انبار'),
  row('فاصلهٔ شمارش اقلام سبک',`${fa(Number(inv.settings?.lightMaxGapDays)||90)} روز`,'<a href="#/inventory/settings">انبار ← تنظیمات</a>'),row('محل‌های پرداخت',fa(A(inv.settings?.paymentLocations).filter(x=>x.isActive!==false).length),'پنل فعلی ← تنظیمات نرم‌افزار'),
  ...(hr?[row('نرخ پایهٔ ساعتی',`${P.t(Number(hr.settings?.baseHourlyRate)||0)} تومان`,'پنل فعلی ← حقوق و دستمزد'),row('ضریب اضافه‌کار / تعطیل',`${fa(hr.settings?.overtimeFactor||'—')} / ${fa(hr.settings?.holidayFactor||'—')}`,'پنل فعلی ← حقوق و دستمزد'),row('نرخ بیمهٔ سهم کارکنان',`${fa(Math.round((Number(hr.settings?.employeeInsuranceRate)||0)*1000)/10)}٪`,'پنل فعلی ← حقوق و دستمزد'),row('ایاب و ذهاب پیش‌فرض',`${P.t(Number(hr.settings?.defaultTransport)||0)} تومان`,'پنل فعلی ← حقوق و دستمزد')]:[])];
 return srcLine()+P.card({title:'تنظیمات اصلی محاسبات',sub:'مقدار فعلی هر تنظیم و جایی که تغییر می‌کند',flush:1,body:P.table(['تنظیم','مقدار','کجا تغییر می‌کند'],rows)})+P.note('تنظیماتی که در طرح جدید قابل تغییرند لینک دارند؛ بقیه هنوز در پنل فعلی‌اند.','info')}

/* ---------- error log (errorlog module, read only) ---------- */
let errQ='';
function errorsView(){const X=window.ExtrasReal,s=X?.mods?.errorlog;if(!s?.doc&&!s?.err){X?.loadModule?.('errorlog');return srcLine()+P.note('در حال خواندن لاگ خطا…','loader')}if(s.err)return srcLine()+P.note('لاگ خطا خوانده نشد: '+esc(s.err),'alert-triangle');
 const all=A(s.doc.entries),rows=all.filter(x=>!errQ||`${x.message} ${x.user} ${x.context?.source||''} ${x.url}`.toLowerCase().includes(errQ.toLowerCase())).sort((a,b)=>String(b.at).localeCompare(String(a.at))),by={};all.forEach(x=>{const k=String(x.message||'').slice(0,80);by[k]=(by[k]||0)+1});const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,5);
 return srcLine()+P.card({title:'پرتکرارترین خطاها',sub:`${fa(all.length)} خطای نگه‌داشته‌شده (۱۰۰۰ ردیف آخر)`,flush:1,body:P.table(['پیام',{t:'تعداد',n:1}],top.map(([m,n])=>[`<span class="wrap">${esc(m)}</span>`,fa(n)]))})
 +`<div class="mt">${P.card({flush:1,title:'لاگ خطاها',sub:`${fa(rows.length)} ردیف`,actions:`<label class="search">${P.ic('search')}<input id="erQ" placeholder="پیام، کاربر یا منبع" value="${esc(errQ)}"></label>`,body:P.table(['زمان','پیام','منبع','کاربر','صفحه'],rows.slice(0,300).map(x=>[esc(x.at?new Date(x.at).toLocaleString('fa-IR'):x.localTime||'—'),`<span class="wrap">${esc(x.message)}</span>`,`<small>${esc(x.context?.source||'')}</small>`,esc(x.user||''),`<small>${esc(String(x.url||'').replace(/^https?:\/\/[^/]+/,'').split('?')[0])}</small>`]),{empty:'خطایی ثبت نشده'})})}</div>`}
function errorsMount(root){const q=P.$('#erQ',root);if(q)q.onchange=e=>{errQ=e.target.value;P.render()}}

/* ---------- wiring ---------- */
const hint=()=>P.note(`این صفحه <b>دادهٔ نمونه</b> است. برای دیدن دادهٔ واقعی، در «انبار ← داشبورد کنترل» به داده وصل شوید. <a href="#/inventory/control">اتصال</a>`,'database');
for(const [id,v] of Object.entries({general:{render:generalView},data:{render:dataView,mount:dataMount},log:{render:logView,mount:logMount},errors:{render:errorsView,mount:errorsMount}})){const t=mod?.tabs?.find(x=>x.id===id);if(!t)continue;const r0=t.render,m0=t.mount,a0=t.actions;t.render=r=>IC.ready()?v.render(r):hint()+r0(r);t.mount=(root,r)=>{if(IC.ready()){v.mount&&v.mount(root,r)}else m0&&m0(root,r)};if(a0)t.actions=r=>IC.ready()?'':a0(r)}
window.SettingsReal={makeZip,crc32,check};
})();
