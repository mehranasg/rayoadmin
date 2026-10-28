(()=>{'use strict';
/* Attendance admin (personnel.html): rules settings, punch-file import, monthly list with day edits + month save, all-staff attention view,
   monthly report (from month snapshots) with Excel export and a printable page per employee.
   Data: the separate `attendance` module (punches, importBatches, settings, auditLog); employee codes: hr personnel[].attendanceCode.
   Pure logic is in 50 (RayoAttendanceCore). Every save reloads the live document first and never writes defaults:
   an empty/missing module is initialized only from Settings ← «مدیریت اطلاعات و بکاپ» ← «بارگذاری اطلاعات اولیه». */
const C=()=>window.RayoAttendanceCore,GW=()=>window.RAYO_API_GATEWAY;
const S=x=>String(x??'').trim(),E=x=>S(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),F=x=>String(x??'').replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const VIEWS=['attendanceImport','attendanceSettings','attendanceMonth','attendanceAttention','attendanceReport'];
const user=()=>sessionStorage.getItem('rayo_admin_user')||'ادمین';
const clone=x=>JSON.parse(JSON.stringify(x));
const note=(text,error=false)=>typeof toast==='function'?toast(text,error):alert(text);
const $=id=>document.getElementById(id);
let att=null,load={state:'idle',error:''},busy=false,draft=null,draftBase='',imp=null,lastResult=null;

/* ---------- module load ---------- */
function missingError(e){return e?.status===404||e?.code==='unknown_module'||e?.code==='data_not_found'}
async function ensureLoaded(force=false){
 if(load.state==='loading'||(!force&&load.state!=='idle'))return;
 load={state:'loading',error:''};
 try{const doc=await GW().loadModule('attendance');att=doc;load={state:GW().getModuleStatus?.('attendance')?.initialized===true?'ready':'uninitialized',error:''}}
 catch(e){att=null;load={state:missingError(e)?'missing':'error',error:S(e?.message||e)}}
 if(VIEWS.includes(typeof currentView!=='undefined'?currentView:''))renderView();
}
function statusCard(){
 if(load.state==='idle'||load.state==='loading')return '<div class="card"><div class="empty">در حال دریافت اطلاعات حضور و غیاب از سرور…</div></div>';
 const init='<a class="btn" href="settings.html?view=dataManagement">مدیریت اطلاعات و بکاپ</a>';
 if(load.state==='missing')return `<div class="card"><h2>ماژول حضور و غیاب روی سرور ایجاد نشده است</h2><p>${E(load.error)}</p><div class="hint">۱) نسخهٔ جدید Controller بک‌اند (فایل <b>attendance-data.json</b> در AllowedFiles) باید روی سرور مستقر شود. ۲) سپس در «مدیریت اطلاعات و بکاپ» ← «بارگذاری اطلاعات اولیه»، بخش «حضور و غیاب» را انتخاب و تأیید کنید تا تنظیمات پیش‌فرض نوشته شود.</div><div class="toolbar">${init}<button class="btn" onclick="RayoAttendanceAdmin.reload()">تلاش دوباره</button></div></div>`;
 if(load.state==='uninitialized')return `<div class="card"><h2>ماژول حضور و غیاب مقداردهی اولیه نشده است</h2><div class="hint">از «مدیریت اطلاعات و بکاپ» ← «بارگذاری اطلاعات اولیه»، بخش «حضور و غیاب» را انتخاب و تأیید کنید. هیچ مقدار پیش‌فرضی خودکار ذخیره نمی‌شود.</div><div class="toolbar">${init}<button class="btn" onclick="RayoAttendanceAdmin.reload()">تلاش دوباره</button></div></div>`;
 return `<div class="card"><h2>دریافت اطلاعات حضور و غیاب ناموفق بود</h2><p class="danger-text">${E(load.error)}</p><div class="hint">تا Load موفق نشود هیچ ذخیره‌ای انجام نمی‌شود.</div><button class="btn" onclick="RayoAttendanceAdmin.reload()">تلاش دوباره</button></div>`;
}
/* Every write: fresh Load → change → Save with server verification. */
async function writeAttendance(mutator,reason){
 const live=await GW().loadModule('attendance');if(GW().getModuleStatus?.('attendance')?.initialized!==true)throw new Error('ماژول حضور و غیاب مقداردهی اولیه نشده است');
 const next=mutator(clone(live));next.changeLog=[{id:`ATL-${Date.now()}`,at:new Date().toISOString(),by:user(),action:reason},...(next.changeLog||[])].slice(0,500);
 await GW().saveModule('attendance',next);att=next;return next;
}

/* ---------- settings ---------- */
const TIME_FIELDS=[['morningArrival','حضور الزامی صبح'],['opening','بازگشایی (اطلاع)'],['morningLateToleranceMin','تلورانس تأخیر صبح (دقیقه)','int'],['morningEnd','پایان صبح'],['eveningStart','شروع عصر'],['eveningLateToleranceMin','تلورانس تأخیر عصر (دقیقه)','int'],['eveningEnd','پایان عصر']];
function readTime(v){const s=C().en(S(v)),m=C().minOf(s);return m===null?s:C().hhmm(m)}
function readInt(v){const s=C().en(S(v));return /^\d+$/.test(s)?Number(s):s}
function setPath(obj,path,value){const keys=path.split('.');let o=obj;for(const k of keys.slice(0,-1)){if(o[k]===undefined)o[k]=/^\d+$/.test(k)?[]:{};o=o[k]}o[keys[keys.length-1]]=value}
function getPath(obj,path){return path.split('.').reduce((o,k)=>o==null?undefined:o[k],obj)}
function startDraft(){const base=clone(att?.settings||{});if(!base.windows)base.windows={};for(const k of ['morning','midday','night'])base.windows[k]=base.windows[k]||{from:'',to:''};const rows=Array.isArray(base.weekly)?base.weekly:[];base.weekly=C().WEEKDAYS.map((_,i)=>rows.find(r=>r&&r.weekday===i)||{weekday:i});draft=base;draftBase=JSON.stringify(att?.settings||{})}
const dirty=()=>!!draft&&JSON.stringify(draft)!==draftBase;
function field(path,kind,label,extra=''){const v=getPath(draft,path);return `<label class="field"><span>${E(label)}</span><input dir="ltr" inputmode="numeric" ${kind==='time'?'placeholder="HH:MM"':''} value="${E(F(v??''))}" data-att-path="${path}" data-att-kind="${kind}" oninput="RayoAttendanceAdmin.edit(this)" ${extra}></label>`}
function select(path,label,options){const v=getPath(draft,path);return `<label class="field"><span>${E(label)}</span><select data-att-path="${path}" data-att-kind="select" onchange="RayoAttendanceAdmin.edit(this)">${options.map(([k,l])=>`<option value="${E(k)}" ${String(v)===String(k)?'selected':''}>${E(l)}</option>`).join('')}</select></label>`}
function checkbox(path,label){return `<label class="field"><span>${E(label)}</span><input type="checkbox" ${getPath(draft,path)===true?'checked':''} data-att-path="${path}" data-att-kind="bool" onchange="RayoAttendanceAdmin.edit(this)"></label>`}
function errorBox(){const errs=C().validateSettings(draft);return errs.length?`<div class="hint danger-text"><b>${F(errs.length)} مورد نیاز به اصلاح دارد:</b><ul>${errs.map(e=>`<li>${E(e)}</li>`).join('')}</ul></div>`:'<div class="hint">تنظیمات معتبر است.</div>'}
function refreshSettingsState(){const box=document.getElementById('attSettingsErrors');if(box)box.innerHTML=errorBox();const btn=document.getElementById('attSettingsSave');if(btn)btn.disabled=busy||!dirty()||C().validateSettings(draft).length>0;const d=document.getElementById('attSettingsDirty');if(d)d.textContent=dirty()?'● تغییرات ذخیره نشده است':''}
function edit(el){if(!draft)return;const kind=el.dataset.attKind,path=el.dataset.attPath;let v;if(kind==='time')v=readTime(el.value);else if(kind==='int')v=readInt(el.value);else if(kind==='bool')v=el.checked;else v=el.value;setPath(draft,path,v);refreshSettingsState()}
function settingsView(){
 ensureLoaded();const head=pageHead('تنظیمات حضور و غیاب','قوانین شیفت، بازه‌های تردد، تلورانس و نحوهٔ تکمیل ترددهای ثبت‌نشده. همهٔ محاسبات کارکرد از همین تنظیمات خوانده می‌شوند.',`<a class="btn" href="personnel.html?view=attendanceImport">ورود فایل تردد</a>`);
 if(load.state!=='ready')return head+statusCard();
 if(!draft)startDraft();
 const general=`<div class="card"><h2>تنظیمات عمومی</h2><div class="form-grid">
  ${field('businessDayCutoff','time','مرز روز کاری (ترددِ قبل از این ساعت جزو روز قبل است)')}
  ${field('standardRestMin','int','مدت استراحت استاندارد دوشیفت (دقیقه)')}
  ${select('toleranceMode','نحوهٔ محاسبهٔ تأخیرِ بیش از تلورانس',[['full','کامل، از ساعت حضور الزامی'],['excess','فقط مازاد بر تلورانس']])}
  ${select('restFillMode','تکمیل پانچ استراحتِ ثبت‌نشده',[['standard','بر اساس استراحت استاندارد'],['worst_case','بدبینانه (ابتدا/انتهای بازهٔ میانه)']])}
  ${field('sameTypeMergeWindowMin','int','ادغام ترددهای هم‌نوع پشت سر هم (دقیقه)')}
  ${field('oppositeTypeMergeWindowMin','int','ادغام ورود و خروج پشت سر هم (دقیقه)')}
  ${checkbox('earlyArrivalCountsAsOvertime','زودتر آمدن از ساعت الزامی اضافه‌کار حساب شود')}
  ${checkbox('overtimeRequiresApproval','اضافه‌کار پس از پایان شیفت نیاز به تأیید مدیر دارد')}
 </div><h3>بازه‌های تردد</h3><p class="muted">بازه‌ها باید با هم کل ۲۴ ساعت را بدون هم‌پوشانی بپوشانند. بازهٔ صبح فقط ورود، بازهٔ شب فقط خروج و بازهٔ میانه هر دو را می‌پذیرد.</p><div class="form-grid">
  ${field('windows.morning.from','time','صبح — از')}${field('windows.morning.to','time','صبح — تا')}
  ${field('windows.midday.from','time','میانه — از')}${field('windows.midday.to','time','میانه — تا')}
  ${field('windows.night.from','time','شب — از')}${field('windows.night.to','time','شب — تا')}
 </div></div>`;
 const weekly=`<div class="card"><h2>برنامهٔ هفتگی</h2><p class="muted">بر اساس روزِ هفتهٔ «روز کاری»: شیفت عصر پنجشنبه که ساعت ۰۱:۰۰ بامدادِ جمعه تمام می‌شود، شیفت پنجشنبه است. تأخیر از «حضور الزامی» سنجیده می‌شود، نه ساعت بازگشایی.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>روز</th>${TIME_FIELDS.map(f=>`<th>${E(f[1])}</th>`).join('')}</tr></thead><tbody>${draft.weekly.map((r,i)=>`<tr><td>${E(C().WEEKDAYS[r.weekday])}</td>${TIME_FIELDS.map(([k,l,t])=>`<td><input dir="ltr" inputmode="numeric" style="width:6em" aria-label="${E(C().WEEKDAYS[r.weekday]+' — '+l)}" value="${E(F(r[k]??''))}" data-att-path="weekly.${i}.${k}" data-att-kind="${t||'time'}" oninput="RayoAttendanceAdmin.edit(this)"></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
 setTimeout(refreshSettingsState,0);
 return head+general+weekly+`<div class="card"><div id="attSettingsErrors"></div><div class="toolbar"><button class="btn btn-primary" id="attSettingsSave" disabled onclick="RayoAttendanceAdmin.saveSettings()">ذخیره تنظیمات</button><button class="btn" onclick="RayoAttendanceAdmin.discardSettings()">بازگشت به مقادیر ذخیره‌شده</button><span class="muted" id="attSettingsDirty"></span></div></div>`;
}
function settingsChanges(before,after,path=''){const out=[];const keys=new Set([...Object.keys(before||{}),...Object.keys(after||{})]);for(const k of keys){const a=before?.[k],b=after?.[k],p=path?`${path}.${k}`:k;if(a&&b&&typeof a==='object'&&typeof b==='object')out.push(...settingsChanges(a,b,p));else if(JSON.stringify(a)!==JSON.stringify(b))out.push({path:p,old:a??null,new:b??null})}return out}
async function saveSettings(){
 if(busy||!draft)return;const errs=C().validateSettings(draft);if(errs.length)return note('ابتدا خطاهای تنظیمات را اصلاح کنید',true);
 busy=true;refreshSettingsState();
 try{
  const next=clone(draft);
  await writeAttendance(doc=>{if(JSON.stringify(doc.settings||{})!==draftBase)throw new Error('تنظیمات حضور و غیاب پس از باز شدن این صفحه توسط کاربر دیگری تغییر کرده است؛ صفحه را تازه کنید و دوباره اعمال کنید.');const changes=settingsChanges(doc.settings||{},next);doc.auditLog=[...(doc.auditLog||[]),{id:C().nextId(doc.auditLog,'ATA',7),at:new Date().toISOString(),by:user(),kind:'settings',changes}];doc.settings=next;return doc},'ویرایش تنظیمات حضور و غیاب');
  startDraft();note('تنظیمات حضور و غیاب ذخیره و روی سرور تأیید شد');
 }catch(e){note(S(e?.message)||'ذخیرهٔ تنظیمات انجام نشد',true)}
 finally{busy=false;renderView()}
}
function discardSettings(){if(dirty()&&!confirm('تغییرات ذخیره‌نشده کنار گذاشته شود؟'))return;draft=null;renderView()}

/* ---------- import ---------- */
const personnel=()=>Array.isArray(state?.personnel)?state.personnel:[];
const personName=id=>{const p=personnel().find(x=>x.id===id);return p?(typeof personDisplayName==='function'?personDisplayName(p):p.name):id};
function plan(){if(!imp?.parsed)return null;return C().planImport({parsed:imp.parsed,existingPunches:att?.punches||[],personnel:withMapping().personnel,mapping:{},settings:att?.settings})}
/* Personnel as they would be after the admin's code decisions (not saved until confirm). */
function withMapping(){const people=clone(personnel()),created=[];for(const u of imp?.unknown||[]){const choice=imp.mapping[u.code];if(!choice||choice==='__skip__')continue;if(choice==='__new__'){const p={id:`NEW:${u.code}`,name:u.name||`پرسنل ${u.code}`,attendanceCode:u.code};people.push(p);created.push(p)}else{const p=people.find(x=>x.id===choice);if(p)p.attendanceCode=u.code}}return{personnel:people,created}}
function mappingErrors(){const errs=[],used=new Map();for(const u of imp?.unknown||[]){const c=imp.mapping[u.code];if(!c){errs.push(`برای کد ${F(u.code)} تصمیم گرفته نشده است`);continue}if(c==='__skip__'||c==='__new__')continue;const p=personnel().find(x=>x.id===c);if(!p)errs.push(`پرسنل انتخاب‌شده برای کد ${F(u.code)} پیدا نشد`);else if(S(p.attendanceCode)&&S(p.attendanceCode)!==u.code)errs.push(`${personName(c)} قبلاً کد ${F(p.attendanceCode)} دارد`);if(used.has(c))errs.push(`${personName(c)} برای دو کد ${F(used.get(c))} و ${F(u.code)} انتخاب شده است`);used.set(c,u.code)}return errs}
async function readSheets(file){
 const ext=(S(file?.name).split('.').pop()||'').toLowerCase();
 if(ext==='csv')return[{name:file.name,rows:C().parseCsv(await file.text())}];
 if(!['xlsx','xls'].includes(ext))throw new Error('فقط فایل Excel (xlsx/xls) یا CSV پذیرفته می‌شود');
 const XLSX=await window.RayoExcel.loadXLSX(),wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
 return wb.SheetNames.map(name=>({name,rows:C().sheetRows(XLSX,wb.Sheets[name])}));
}
async function chooseFile(input){
 const file=input?.files?.[0];if(!file)return;lastResult=null;imp={fileName:file.name,parsed:null,error:'',mapping:{},unknown:[]};renderView();
 try{const parsed=C().parseSheets(await readSheets(file));const legacy=state?.settings?.attendanceDeviceMap||{};const unknown=C().unknownCodes(parsed.candidates,personnel(),legacy);const mapping={};unknown.forEach(u=>{if(u.suggestion)mapping[u.code]=u.suggestion});imp={fileName:file.name,parsed,error:'',mapping,unknown}}
 catch(e){imp={fileName:file.name,parsed:null,error:S(e?.message||e),mapping:{},unknown:[]}}
 renderView();
}
function setMapping(code,value){if(!imp)return;imp.mapping[code]=value;renderView()}
function range(r){return r?`${F(r.from)} تا ${F(r.to)}`:'—'}
function kpi(label,value,sub=''){return `<div class="card kpi"><div class="label">${E(label)}</div><div class="value">${value}</div>${sub?`<div class="sub">${sub}</div>`:''}</div>`}
function previewHtml(){
 if(!imp)return'';
 if(!imp.parsed)return imp.error?`<div class="card"><p class="danger-text">${E(imp.error)}</p></div>`:'<div class="card"><div class="empty">در حال خواندن فایل…</div></div>';
 const p=imp.parsed,pl=plan(),ig=p.ignored||{},mErr=mappingErrors(),sErr=C().validateSettings(att?.settings);
 const options=u=>{const people=personnel().filter(x=>!S(x.attendanceCode)||x.id===imp.mapping[u.code]).sort((a,b)=>(a.status==='فعال'?0:1)-(b.status==='فعال'?0:1)||S(a.name).localeCompare(S(b.name),'fa'));return `<option value="">— تصمیم بگیرید —</option><option value="__new__" ${imp.mapping[u.code]==='__new__'?'selected':''}>ایجاد پرسنل جدید «${E(u.name||u.code)}»</option><option value="__skip__" ${imp.mapping[u.code]==='__skip__'?'selected':''}>فعلاً وارد نشود</option>${people.map(x=>`<option value="${E(x.id)}" ${imp.mapping[u.code]===x.id?'selected':''}>${E(personName(x.id))}${x.status&&x.status!=='فعال'?` (${E(x.status)})`:''}</option>`).join('')}`};
 const unknown=imp.unknown.length?`<div class="card"><h3>کدهای پرسنلی ناشناخته (${F(imp.unknown.length)})</h3><p class="muted">هر کد را به یک پرسنل موجود وصل کنید، پرسنل جدید بسازید یا فعلاً کنار بگذارید. کد پس از تأیید روی پروندهٔ پرسنل ذخیره می‌شود. پیشنهادها از نگاشت قدیمی «ریز کارکرد» یا نام یکسان آمده‌اند.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>کد</th><th>نام در فایل</th><th>تعداد تردد</th><th>پرسنل</th></tr></thead><tbody>${imp.unknown.map(u=>`<tr><td>${E(F(u.code))}</td><td>${E(u.name||'—')}</td><td>${F(u.rows)}</td><td><select aria-label="پرسنل کد ${E(u.code)}" onchange="RayoAttendanceAdmin.setMapping(${E(JSON.stringify(u.code))},this.value)">${options(u)}</select></td></tr>`).join('')}</tbody></table></div></div>`:'';
 const rejected=p.rejected.length?`<div class="card"><h3>ردیف‌های ردشده (${F(p.rejected.length)})</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>ردیف</th><th>کد</th><th>علت</th></tr></thead><tbody>${p.rejected.map(r=>`<tr><td>${F(r.row)}</td><td>${E(F(r.code||'—'))}</td><td>${E(F(r.reason))}</td></tr>`).join('')}</tbody></table></div></div>`:'';
 const ignoredText=[ig.empty?`${F(ig.empty)} ردیف خالی`:'',ig.noCode?`${F(ig.noCode)} ردیف بدون کد پرسنلی (عنوان/جمع)`:'',ig.total?`${F(ig.total)} ردیف جمع`:'',ig.noPunch?`${F(ig.noPunch)} ردیف بدون ساعت`:''].filter(Boolean).join('، ');
 const blockers=[...mErr,...(sErr.length?['تنظیمات حضور و غیاب کامل یا معتبر نیست؛ ابتدا آن را اصلاح کنید']:[])],canSave=!busy&&!blockers.length&&(pl.fresh.length>0||imp.unknown.some(u=>imp.mapping[u.code]&&imp.mapping[u.code]!=='__skip__'));
 return `<div class="card"><h2>پیش‌نمایش «${E(imp.fileName)}»</h2><p class="muted">قالب: ${E(p.adapterLabel)}${p.sheetName?` — برگهٔ «${E(p.sheetName)}»`:''} — سطر سرستون ${F(p.headerRow)}${ignoredText?` — نادیده گرفته شد: ${ignoredText}`:''}</p>
  <div class="grid grid-4">${kpi('ردیف خوانده‌شده',F(p.rowsRead))}${kpi('تردد جدید',F(pl.fresh.length),`${F(pl.affectedDays.length)} روز کاری پرسنل`)}${kpi('تکراری (قبلاً ثبت شده)',F(pl.duplicates.length),'دوباره ثبت نمی‌شود')}${kpi('ردشده / بدون پرسنل',`${F(p.rejected.length)} / ${F(pl.unmapped.length)}`)}</div>
  <p>بازهٔ تاریخ تردد: <b>${range(pl.dateRange)}</b> — بازهٔ روز کاری: <b>${range(pl.businessRange)}</b></p>
  ${blockers.length?`<div class="hint danger-text"><ul>${blockers.map(b=>`<li>${E(b)}</li>`).join('')}</ul></div>`:''}
  <div class="toolbar"><button class="btn btn-primary" ${canSave?'':'disabled'} onclick="RayoAttendanceAdmin.confirmImport()">${busy?'در حال ثبت…':'تأیید و ثبت ترددها'}</button><button class="btn" onclick="RayoAttendanceAdmin.cancelImport()">انصراف</button></div></div>${unknown}${rejected}`;
}
function batchesHtml(){const rows=(att?.importBatches||[]).slice(-10).reverse();if(!rows.length)return'';return `<div class="card"><h3>آخرین ورودهای فایل</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>زمان</th><th>فایل</th><th>کاربر</th><th>جدید</th><th>تکراری</th><th>ردشده</th><th>بازهٔ روز کاری</th></tr></thead><tbody>${rows.map(b=>`<tr><td>${E(F(new Date(b.importedAt).toLocaleString('fa-IR')))}</td><td>${E(b.fileName)}</td><td>${E(b.importedBy)}</td><td>${F(b.newCount)}</td><td>${F(b.duplicateCount)}</td><td>${F((b.rejected||[]).length)}</td><td>${range(b.businessRange)}</td></tr>`).join('')}</tbody></table></div></div>`}
function importView(){
 ensureLoaded();const head=pageHead('ورود فایل تردد','خروجی دستگاه حضور و غیاب: هر ردیف یک تردد، برای همهٔ پرسنل و هر بازهٔ تاریخ. ترددهای تکراری دوباره ثبت نمی‌شوند و ورود دوباره، اصلاحات مدیر را تغییر نمی‌دهد.',`<a class="btn" href="personnel.html?view=attendanceSettings">تنظیمات حضور و غیاب</a>`);
 if(load.state!=='ready')return head+statusCard();
 const result=lastResult?`<div class="card"><div class="hint">${E(lastResult)}</div></div>`:'';
 return head+result+`<div class="card"><div class="hint">سرستون‌های لازم در سطر اول: <b>کد پرسنلی، نام و نام خانوادگی، تاریخ</b> (شمسی YYYY/MM/DD)، <b>ساعت</b> (HH:MM:SS)، <b>نوع تردد</b> (ورود/خروج)، <b>روش ثبت</b> و ستون اختیاری <b>کد دستگاه</b>. خروجی فعلی دستگاه (ردیف‌های «کارمند / تاریخ / ورود / خروج») هم پذیرفته می‌شود.</div><label class="field"><span>فایل Excel یا CSV</span><input type="file" accept=".xlsx,.xls,.csv" ${busy?'disabled':''} onchange="RayoAttendanceAdmin.chooseFile(this)"></label></div>`+previewHtml()+batchesHtml();
}
function cancelImport(){imp=null;renderView()}
/* Recalculates the days touched by an import (derived on read, nothing stored) and counts what needs the manager. */
function affectedSummary(days){try{let review=0,fill=0,ot=0;for(const a of days){const d=C().computeDay({personnelId:a.personnelId,businessDate:a.businessDate,punches:C().punchesFor(att?.punches,a.personnelId,a.businessDate),settings:att?.settings,override:C().overrideFor(att?.overrides,a.personnelId,a.businessDate)});if(d.flags.needsReview)review++;if(d.flags.hasAutoFill)fill++;if(d.flags.hasPendingOvertime)ot++}return `؛ پس از محاسبه: ${F(review)} روز نیاز به بررسی، ${F(fill)} روز با تکمیل خودکار و ${F(ot)} روز اضافه‌کار در انتظار تأیید`}catch(e){return `؛ محاسبهٔ روزها انجام نشد: ${S(e?.message)}`}}
async function confirmImport(){
 if(busy||!imp?.parsed)return;const errs=mappingErrors();if(errs.length)return note(errs[0],true);
 busy=true;renderView();const hrBackup=clone(personnel());
 try{
  /* 1) employee codes on hr personnel (only when the admin mapped/created someone) */
  const decided=imp.unknown.filter(u=>imp.mapping[u.code]&&imp.mapping[u.code]!=='__skip__');
  if(decided.length){
   for(const u of decided){const c=imp.mapping[u.code];if(c==='__new__'){const p={id:uid('EMP',state.personnel,4),name:u.name||`پرسنل ${u.code}`,status:'فعال',transportMonthly:0,fixedAllowance:0,hourlyRate:0,monthlyCredit:0,mealCredit:0,attendanceCode:u.code,notes:`ایجادشده از ورود فایل تردد (${imp.fileName})`};state.personnel.push(p);imp.mapping[u.code]=p.id}else{const p=state.personnel.find(x=>x.id===c);if(p)p.attendanceCode=u.code}}
   const ok=await commit(`ثبت کد حضور و غیاب برای ${decided.length} پرسنل`);
   if(!ok){state.personnel=hrBackup;throw new Error('ذخیرهٔ کد پرسنلی در پروندهٔ پرسنل انجام نشد؛ هیچ ترددی ثبت نشد.')}
  }
  /* 2) punches: re-planned against the live document so concurrent imports cannot duplicate */
  let summary=null;const parsed=imp.parsed,fileName=imp.fileName;
  await writeAttendance(doc=>{const pl=C().planImport({parsed,existingPunches:doc.punches||[],personnel:personnel(),mapping:{},settings:doc.settings});if(C().validateSettings(doc.settings).length)throw new Error('تنظیمات حضور و غیاب روی سرور معتبر نیست');const r=C().applyImport(doc,pl,{parsed,fileName,user:user()});summary={pl,batchId:r.batchId};return r.doc},`ورود فایل تردد ${fileName}`);
  lastResult=`ورود ${summary.batchId} ثبت و روی سرور تأیید شد: ${F(summary.pl.fresh.length)} تردد جدید، ${F(summary.pl.duplicates.length)} تکراری، ${F(parsed.rejected.length)} ردشده، ${F(summary.pl.unmapped.length)} بدون پرسنل. ${F(summary.pl.affectedDays.length)} روز کاری پرسنل تحت تأثیر قرار گرفت${affectedSummary(summary.pl.affectedDays)}.`;
  imp=null;
 }catch(e){note(S(e?.message)||'ثبت ترددها انجام نشد',true)}
 finally{busy=false;renderView()}
}

/* ---------- monthly list (per employee) ---------- */
/* Day edits are drafts until «ذخیره»: drafts {bd → override | null (back to computed)}, base {bd → signature of the stored
   override when editing began} so a save over someone else's change is refused. The save also snapshots the month (50::applyMonthSave). */
let mv={pid:'',y:0,m:0,drafts:{},base:{},useCurrent:false,init:false,modal:null,openDay:''};
const monthDirty=()=>Object.keys(mv.drafts).length>0;
const today=()=>C().todayJalali();
function initMonthFromUrl(){if(mv.init)return;mv.init=true;const q=new URLSearchParams(location.search),t=today().split('/');mv.pid=S(q.get('pid'));mv.y=+q.get('y')||+t[0];mv.m=+q.get('m')||+t[1];mv.openDay=S(q.get('day'))}
function attPeople(){const ids=new Set((att?.punches||[]).map(p=>p.personnelId));return personnel().filter(p=>S(p.attendanceCode)||ids.has(p.id)).sort((a,b)=>(a.status==='فعال'?0:1)-(b.status==='فعال'?0:1)||S(a.name).localeCompare(S(b.name),'fa'))}
function storedOverride(bd){return C().overrideFor(att?.overrides,mv.pid,bd)}
function effOverride(bd){return bd in mv.drafts?mv.drafts[bd]:storedOverride(bd)}
function effectiveOverrides(){const keys=new Set(Object.keys(mv.drafts));const rest=(att?.overrides||[]).filter(o=>!(o.personnelId===mv.pid&&keys.has(o.businessDate)));for(const [bd,o] of Object.entries(mv.drafts))if(o)rest.push({...o,personnelId:mv.pid,businessDate:bd});return rest}
function monthSave(){return C().activeMonthSave(att?.monthSaves,mv.pid,mv.y,mv.m)}
function liveSettings(){return C().monthSettings(att,mv.pid,mv.y,mv.m,mv.useCurrent)}
function liveDays(){return C().computeMonth({punches:att?.punches,overrides:effectiveOverrides(),settings:liveSettings(),personnelId:mv.pid,year:mv.y,month:mv.m})}
function confirmLeaveMonth(){return!monthDirty()||confirm('تغییرات ذخیره‌نشدهٔ این ماه کنار گذاشته شود؟')}
function setMonthFilter(key,value){if(!confirmLeaveMonth()){renderView();return}mv={...mv,[key]:key==='pid'?S(value):+value,drafts:{},base:{},useCurrent:false};renderView()}
function setUseCurrent(v){mv.useCurrent=!!v;renderView()}
const srcBadge=src=>src==='actual'||!src?'':`<span class="badge ${src==='worst_case'||src==='rest_rule'?'warn':src==='manual'?'success':''}" title="${E(C().SOURCE_LABELS[src])}">${E(C().SOURCE_LABELS[src])}</span>`;
function timeCell(x){if(!x)return'<td class="muted">—</td>';const auto=x.source==='worst_case'||x.source==='rest_rule';return `<td><span ${auto?'style="font-style:italic;text-decoration:underline dotted"':''}>${x.time?F(x.time):'نامشخص'}</span>${x.nextDay?'<small class="muted"> (+۱)</small>':''}<br>${srcBadge(x.source)}</td>`}
const hm=v=>v===null||v===undefined?'—':C().faHM(v);
function yearOptions(){const y=+today().split('/')[0],years=new Set([y-1,y,mv.y]);(att?.punches||[]).forEach(p=>years.add(+p.businessDate.slice(0,4)));return[...years].filter(Boolean).sort()}
function monthPicker(onYear,onMonth,y,m){return `<label class="field"><span>سال</span><select onchange="${onYear}">${yearOptions().map(v=>`<option value="${v}" ${v===+y?'selected':''}>${F(v)}</option>`).join('')}</select></label><label class="field"><span>ماه</span><select onchange="${onMonth}">${C().MONTHS.map((n,i)=>`<option value="${i+1}" ${i+1===+m?'selected':''}>${E(n)}</option>`).join('')}</select></label>`}
function monthView(){
 ensureLoaded();initMonthFromUrl();
 const head=pageHead('کارکرد ماهانهٔ حضور و غیاب','هر روز کاری ماه برای یک پرسنل: ساعت‌ها با منبع، تأخیر، تعجیل، استراحت، کسر کار، اضافه‌کار و توضیح. اصلاحات تا زدن «ذخیره» روی سرور نمی‌روند؛ ذخیره نتیجهٔ ماه را هم ثابت می‌کند.',`<a class="btn" href="personnel.html?view=attendanceAttention">موارد نیازمند بررسی</a><a class="btn" href="personnel.html?view=attendanceImport">ورود فایل تردد</a>`);
 if(load.state!=='ready')return head+statusCard();
 const people=attPeople();
 const filters=`<div class="card"><div class="toolbar"><label class="field"><span>پرسنل</span><select onchange="RayoAttendanceAdmin.setMonthFilter('pid',this.value)"><option value="">— انتخاب پرسنل —</option>${people.map(p=>`<option value="${E(p.id)}" ${p.id===mv.pid?'selected':''}>${E(personName(p.id))}${p.attendanceCode?` (کد ${E(F(p.attendanceCode))})`:''}${p.status&&p.status!=='فعال'?` — ${E(p.status)}`:''}</option>`).join('')}</select></label>${monthPicker("RayoAttendanceAdmin.setMonthFilter('y',this.value)","RayoAttendanceAdmin.setMonthFilter('m',this.value)",mv.y,mv.m)}</div></div>`;
 if(!mv.pid)return head+filters+'<div class="card"><div class="empty">پرسنل را انتخاب کنید.</div></div>';
 const sErr=C().validateSettings(liveSettings());if(sErr.length)return head+filters+`<div class="card"><p class="danger-text">تنظیمات حضور و غیاب معتبر نیست: ${E(sErr[0])}</p><a class="btn" href="personnel.html?view=attendanceSettings">تنظیمات حضور و غیاب</a></div>`;
 const days=liveDays(),save=monthSave(),t=today(),past=d=>d.businessDate<=t,changed=new Set(C().changedSinceSave(save,days));
 const frozenDiffers=save&&JSON.stringify(save.settings)!==JSON.stringify(att.settings);
 const count=f=>days.filter(f).length,undetermined=count(d=>d.status==='undetermined'&&past(d));
 const saveInfo=save?`ذخیره‌شده در ${E(F(new Date(save.savedAt).toLocaleString('fa-IR')))} توسط ${E(save.savedBy)}${changed.size?` — <b class="danger-text">${F(changed.size)} روز پس از ذخیره تغییر کرده؛ دوباره ذخیره کنید</b>`:''}`:'<b>این ماه هنوز ذخیره نشده است</b>';
 const settingsNote=frozenDiffers?`<label class="field"><span><input type="checkbox" ${mv.useCurrent?'checked':''} onchange="RayoAttendanceAdmin.setUseCurrent(this.checked)"> محاسبه با تنظیمات فعلی (این ماه با تنظیمات زمان ذخیره محاسبه شده و تنظیمات از آن زمان تغییر کرده است)</span></label>`:'';
 const kpis=`<div class="grid grid-4">${kpi('روز تعیین‌نشده',F(undetermined),'تا امروز؛ وضعیت را مشخص کنید')}${kpi('نیاز به بررسی',F(count(d=>d.flags.needsReview)))}${kpi('تکمیل خودکار',F(count(d=>d.flags.hasAutoFill)))}${kpi('اضافه‌کار در انتظار تأیید',F(count(d=>d.flags.hasPendingOvertime)),hm(days.reduce((s,d)=>s+d.overtime.pending,0)))}</div>`;
 const bar=`<div class="card"><div class="hint">${saveInfo}</div>${settingsNote}<div class="toolbar"><button class="btn btn-primary" ${busy?'disabled':''} onclick="RayoAttendanceAdmin.saveMonth()">${busy?'در حال ذخیره…':monthDirty()?`ذخیره (${F(Object.keys(mv.drafts).length)} روز اصلاح‌شده)`:save?'ذخیرهٔ دوباره':'ذخیره و ثابت‌کردن ماه'}</button><button class="btn" onclick="RayoAttendanceAdmin.exportMonthList()">خروجی Excel</button><a class="btn" href="personnel.html?view=attendanceReport&pid=${encodeURIComponent(mv.pid)}&y=${mv.y}&m=${mv.m}">گزارش و چاپ</a>${monthDirty()?'<button class="btn" onclick="RayoAttendanceAdmin.discardMonth()">کنار گذاشتن تغییرات</button><span class="danger-text">● تغییرات ذخیره نشده است</span>':''}</div></div>`;
 const rows=days.map(d=>{
  const future=!past(d),badges=[d.flags.needsReview?'<span class="badge warn">نیاز به بررسی</span>':'',d.flags.manuallyEdited?'<span class="badge success">اصلاح مدیر</span>':'',d.businessDate in mv.drafts?'<span class="badge warn">ویرایش ذخیره‌نشده</span>':'',changed.has(d.businessDate)&&!(d.businessDate in mv.drafts)?'<span class="badge warn">تغییر پس از ذخیره</span>':''].join(' ');
  const status=d.status==='undetermined'&&future?'<span class="muted">آینده</span>':d.status==='undetermined'?'<span class="badge warn">تعیین‌نشده</span>':E(d.statusLabel);
  const ot=d.overtime.raw?`${d.overtime.pending?`<span class="badge warn">${hm(d.overtime.pending)} در انتظار</span>`:''}${d.overtime.approved?`<span class="badge success">${hm(d.overtime.approved)} تأیید</span>`:''}${d.overtime.status==='rejected'?'<span class="muted">رد شد</span>':''}`:'—';
  const rest=d.shift==='double'?`${hm(d.restMinutes)}${d.restKnown===false?' <small class="muted">(نامشخص)</small>':''}`:'—';
  return `<tr ${d.flags.needsReview?'style="background:rgba(255,193,7,.08)"':''}><td>${F(d.businessDate)}</td><td>${E(d.weekdayName)}</td><td>${status} ${badges}</td><td>${d.shift==='none'?'—':E(d.shiftLabel)}</td>${['s1','s2','s3','s4'].map(k=>timeCell(d.slots[k])).join('')}<td>${hm(d.worked)}</td><td>${hm(d.required)}</td><td>${d.late?hm(d.late):'—'}</td><td>${d.earlyExit?hm(d.earlyExit):'—'}</td><td>${rest}</td><td>${d.deficit?hm(d.deficit):'—'}</td><td>${ot}</td><td style="min-width:16em;font-size:.85em">${d.explanations.map(x=>E(x.text)).join('<br>')}${d.note&&!d.explanations.some(x=>x.kind==='manual')?`<br><span class="muted">یادداشت: ${E(d.note)}</span>`:''}</td><td><button class="btn" onclick="RayoAttendanceAdmin.openDay('${d.businessDate}')">ویرایش</button></td></tr>`;
 }).join('');
 if(mv.openDay){const bd=mv.openDay;mv.openDay='';setTimeout(()=>openDay(bd),0)}
 return head+filters+bar+kpis+`<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>روز کاری</th><th>روز</th><th>وضعیت</th><th>شیفت</th><th>ورود صبح</th><th>خروج صبح</th><th>ورود عصر</th><th>خروج عصر</th><th>کارکرد</th><th>موظف</th><th>تأخیر</th><th>تعجیل</th><th>استراحت</th><th>کسر کار</th><th>اضافه‌کار</th><th>توضیح</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted">ساعت‌های <i>کج</i> با برچسب «بدبینانه» یا «قانون استراحت» خودکار پر شده‌اند. (+۱) یعنی روز تقویمی بعد.</p></div>`;
}
/* Day editor (modal). Times shown are the current results; only fields the manager changes become overrides. */
function dayFor(bd){return liveDays().find(d=>d.businessDate===bd)}
function openDay(bd){
 if(load.state!=='ready'||!mv.pid)return;const d=dayFor(bd);if(!d)return;
 mv.modal={bd,ov:clone(effOverride(bd)||{}),shown:Object.fromEntries(['s1','s2','s3','s4'].map(k=>[k,d.slots[k]?.time||'']))};renderModal();
 $('modalBackdrop').classList.add('open');
}
function curSlot(k){const o=mv.modal.ov;return o.slots&&k in o.slots?o.slots[k]:mv.modal.shown[k]}
function renderModal(){
 const {bd,ov}=mv.modal,d=C().computeDay({personnelId:mv.pid,businessDate:bd,punches:C().punchesFor(att.punches,mv.pid,bd),settings:liveSettings(),override:C().cleanOverride(ov)}),raw=C().punchesFor(att.punches,mv.pid,bd),del=new Set(ov.deletedPunchIds||[]),ot=ov.overtime||{};
 $('modalTitle').textContent=`${personName(mv.pid)} — ${F(bd)} ${d.weekdayName}`;
 $('modalBody').innerHTML=`<div class="hint">نتیجهٔ فعلی: ${E(d.shiftLabel)} — کارکرد ${hm(d.worked)} از ${hm(d.required)}، کسر کار ${hm(d.deficit)}${d.overtime.raw?`، اضافه‌کار ${hm(d.overtime.raw)}`:''}</div>
  <h3>ساعت‌ها</h3><p class="muted">خالی = پاک شود. ساعت بعد از نیمه‌شب (قبل از مرز روز کاری) جزو همین روز کاری است.</p><div class="form-grid">${['s1','s2','s3','s4'].map(k=>`<label class="field"><span>${E(C().SLOT_LABELS[k])}</span><input dir="ltr" inputmode="numeric" placeholder="HH:MM" id="attSlot_${k}" value="${E(F(curSlot(k)))}"></label>`).join('')}</div>
  <h3>ترددهای ثبت‌شده</h3>${raw.length?`<table class="data-table"><tbody>${raw.map(p=>`<tr><td>${F(p.date)} ${F(p.time)}</td><td>${p.type==='in'?'ورود':'خروج'}</td><td>${E(p.method)}</td><td><label><input type="checkbox" data-att-del="${E(p.id)}" ${del.has(p.id)?'checked':''}> حذف از محاسبه</label></td></tr>`).join('')}</tbody></table>`:'<p class="muted">ترددی از دستگاه ثبت نشده است.</p>'}
  ${(ov.addedPunches||[]).length?`<table class="data-table"><tbody>${ov.addedPunches.map((p,i)=>`<tr><td>${F(p.time)}</td><td>${p.type==='in'?'ورود':'خروج'} (افزودهٔ مدیر)</td><td><button class="btn" onclick="RayoAttendanceAdmin.removeAdded(${i})">حذف</button></td></tr>`).join('')}</tbody></table>`:''}
  <div class="toolbar"><label class="field"><span>افزودن تردد</span><input dir="ltr" inputmode="numeric" placeholder="HH:MM" id="attAddTime"></label><label class="field"><span>نوع</span><select id="attAddType"><option value="in">ورود</option><option value="out">خروج</option></select></label><button class="btn" onclick="RayoAttendanceAdmin.addPunch()">+ افزودن</button></div>
  <h3>وضعیت و یادداشت</h3><div class="form-grid"><label class="field"><span>وضعیت روز</span><select id="attStatus"><option value="">خودکار (${d.shift==='none'?'تعیین‌نشده':'حاضر'})</option>${['present','absent','leave_entitled','leave_sick','off'].map(k=>`<option value="${k}" ${ov.status===k?'selected':''}>${E(C().STATUS_LABELS[k])}</option>`).join('')}</select></label><label class="field"><span>یادداشت (برای پرسنل هم نمایش داده می‌شود)</span><input id="attNote" value="${E(ov.note||'')}"></label></div>
  ${d.overtime.raw||ot.decision?`<h3>اضافه‌کار ${hm(d.overtime.raw)}</h3><div class="form-grid"><label class="field"><span>تصمیم</span><select id="attOtDecision"><option value="">در انتظار تأیید</option><option value="approve" ${ot.decision==='approve'?'selected':''}>تأیید کامل</option><option value="partial" ${ot.decision==='partial'?'selected':''}>تأیید جزئی</option><option value="reject" ${ot.decision==='reject'?'selected':''}>رد</option></select></label><label class="field"><span>دقیقهٔ تأییدشده (جزئی)</span><input dir="ltr" inputmode="numeric" id="attOtMinutes" value="${E(F(ot.minutes??''))}"></label><label class="field"><span>توضیح تصمیم</span><input id="attOtNote" value="${E(ot.note||'')}"></label></div>`:''}
  <div class="hint">${d.explanations.map(x=>E(x.text)).join('<br>')||'—'}</div>`;
 $('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn" onclick="RayoAttendanceAdmin.resetDay()">بازگشت به محاسبهٔ خودکار</button><button class="btn btn-primary" onclick="RayoAttendanceAdmin.applyDay()">اعمال (تا ذخیرهٔ ماه)</button>`;
}
/* Reads the editor inputs into mv.modal.ov; returns an error text or ''. */
function readModal(){
 const ov=mv.modal.ov,val=id=>document.getElementById(id)?.value??'';
 for(const k of ['s1','s2','s3','s4']){const raw=C().en(S(val(`attSlot_${k}`)));if(raw&&C().minOf(raw)===null)return `${C().SLOT_LABELS[k]}: ساعت معتبر (HH:MM) وارد کنید`;const v=raw?C().hhmm(C().minOf(raw)):'';if(v!==curSlot(k)){ov.slots=ov.slots||{};ov.slots[k]=v}}
 ov.deletedPunchIds=[...document.querySelectorAll('[data-att-del]')].filter(x=>x.checked).map(x=>x.dataset.attDel);
 ov.status=S(val('attStatus'))||undefined;ov.note=S(val('attNote'));
 if(document.getElementById('attOtDecision')){const dec=S(val('attOtDecision'));if(!dec)delete ov.overtime;else{const mins=C().en(S(val('attOtMinutes')));if(dec==='partial'&&!/^\d+$/.test(mins))return'برای تأیید جزئی، دقیقهٔ تأییدشده را وارد کنید';ov.overtime={decision:dec,minutes:dec==='partial'?+mins:undefined,note:S(val('attOtNote'))}}}
 return'';
}
function addPunch(){const err=readModal();if(err)return note(err,true);const t=C().en(S(document.getElementById('attAddTime')?.value));if(C().minOf(t)===null)return note('ساعت تردد را به شکل HH:MM وارد کنید',true);const ov=mv.modal.ov;ov.addedPunches=[...(ov.addedPunches||[]),{id:`MAN-${Date.now()}`,time:C().hhmm(C().minOf(t)),type:document.getElementById('attAddType')?.value==='out'?'out':'in'}];renderModal()}
function removeAdded(i){const err=readModal();if(err)return note(err,true);mv.modal.ov.addedPunches.splice(i,1);renderModal()}
function setDraft(bd,value){
 const stored=storedOverride(bd),sig=C().overrideSignature(stored);
 if(!(bd in mv.base))mv.base[bd]=sig;
 const next=C().cleanOverride(value);
 if((next?JSON.stringify(next):'')===sig){delete mv.drafts[bd];delete mv.base[bd]}else mv.drafts[bd]=next;
}
function applyDay(){const err=readModal();if(err)return note(err,true);setDraft(mv.modal.bd,mv.modal.ov);mv.modal=null;closeModal();renderView()}
function resetDay(){if(!mv.modal)return;setDraft(mv.modal.bd,null);mv.modal=null;closeModal();renderView()}
function discardMonth(){if(!confirm('همهٔ اصلاحات ذخیره‌نشدهٔ این ماه کنار گذاشته شود؟'))return;mv.drafts={};mv.base={};renderView()}
async function saveMonth(){
 if(busy||!mv.pid)return;busy=true;renderView();
 const {pid,y,m,drafts,base,useCurrent}=mv;let res=null;
 try{
  await writeAttendance(doc=>{res=C().applyMonthSave(doc,{personnelId:pid,year:y,month:m,drafts,base,user:user(),useCurrentSettings:useCurrent});return res.doc},`ذخیرهٔ حضور و غیاب ${personName(pid)} — ${C().MONTHS[m-1]} ${y}`);
  mv.drafts={};mv.base={};mv.useCurrent=false;
  note(`ماه ذخیره و روی سرور تأیید شد${res.changedDays.length?`؛ ${F(res.changedDays.length)} روز اصلاح‌شده`:''}`);
 }catch(e){note(S(e?.message)||'ذخیرهٔ ماه انجام نشد',true)}
 finally{busy=false;renderView()}
}

/* ---------- all-staff «needs attention» ---------- */
let av={y:0,m:0};
function attentionView(){
 ensureLoaded();if(!av.y){const t=today().split('/');av={y:+t[0],m:+t[1]}}
 const head=pageHead('موارد نیازمند بررسی تردد','همهٔ پرسنل در یک ماه: روزهای «نیاز به بررسی»، تکمیل خودکار، اضافه‌کار در انتظار تأیید و روزهای تعیین‌نشده تا امروز. با «اصلاح» همان روز در کارکرد ماهانه باز می‌شود.',`<a class="btn" href="personnel.html?view=attendanceMonth">کارکرد ماهانه</a>`);
 if(load.state!=='ready')return head+statusCard();
 const picker=`<div class="card"><div class="toolbar">${monthPicker("RayoAttendanceAdmin.setAttention('y',this.value)","RayoAttendanceAdmin.setAttention('m',this.value)",av.y,av.m)}</div></div>`;
 const prefix=`${av.y}/${String(av.m).padStart(2,'0')}/`,inMonth=new Set((att.punches||[]).filter(p=>p.businessDate.startsWith(prefix)).map(p=>p.personnelId));
 const ids=attPeople().filter(p=>p.status==='فعال'||inMonth.has(p.id)).map(p=>p.id);
 let list;try{list=C().monthAttention({doc:att,personnelIds:ids,year:av.y,month:av.m,today:today()})}catch(e){return head+picker+`<div class="card"><p class="danger-text">${E(e.message)}</p></div>`}
 const link=(pid,bd)=>`personnel.html?view=attendanceMonth&pid=${encodeURIComponent(pid)}&y=${av.y}&m=${av.m}${bd?`&day=${encodeURIComponent(bd)}`:''}`;
 const summary=`<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>پرسنل</th><th>نیاز به بررسی</th><th>تکمیل خودکار</th><th>اضافه‌کار در انتظار</th><th>تعیین‌نشده</th><th>ذخیرهٔ ماه</th><th></th></tr></thead><tbody>${list.map(r=>`<tr><td>${E(personName(r.personnelId))}</td><td>${F(r.review.length)}</td><td>${F(r.autoFill.length)}</td><td>${F(r.pendingOvertime.length)}</td><td>${F(r.undetermined.length)}</td><td>${r.save?(r.changedSinceSave.length?`<span class="badge warn">${F(r.changedSinceSave.length)} روز تغییر پس از ذخیره</span>`:'<span class="badge success">ذخیره‌شده</span>'):'<span class="muted">ذخیره نشده</span>'}</td><td><a class="btn" href="${link(r.personnelId)}">کارکرد ماه</a></td></tr>`).join('')}</tbody></table></div></div>`;
 const flagged=[];for(const r of list)for(const d of r.days){const issues=[d.flags.needsReview?'نیاز به بررسی':'',d.flags.hasAutoFill?'تکمیل خودکار':'',d.flags.hasPendingOvertime?`اضافه‌کار ${hm(d.overtime.pending)} در انتظار`:'',r.undetermined.includes(d)?'وضعیت تعیین‌نشده':''].filter(Boolean);if(issues.length)flagged.push({r,d,issues})}
 flagged.sort((a,b)=>a.d.businessDate.localeCompare(b.d.businessDate));
 const detail=flagged.length?`<div class="card"><h3>روزها (${F(flagged.length)})</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>روز کاری</th><th>پرسنل</th><th>شیفت</th><th>موارد</th><th>توضیح</th><th></th></tr></thead><tbody>${flagged.map(({r,d,issues})=>`<tr><td>${F(d.businessDate)} ${E(d.weekdayName)}</td><td>${E(personName(r.personnelId))}</td><td>${d.shift==='none'?'—':E(d.shiftLabel)}</td><td>${issues.map(i=>`<span class="badge warn">${E(i)}</span>`).join(' ')}</td><td style="font-size:.85em">${d.explanations.map(x=>E(x.text)).join('<br>')}</td><td><a class="btn" href="${link(r.personnelId,d.businessDate)}">اصلاح</a></td></tr>`).join('')}</tbody></table></div></div>`:'<div class="card"><div class="empty">موردی برای بررسی در این ماه نیست.</div></div>';
 return head+picker+summary+detail;
}
function setAttention(key,value){av[key]=+value;renderView()}

/* ---------- monthly report, Excel export and print ---------- */
/* Saved months are reported from their snapshot (50::monthReport); an unsaved month is a live preview and is labelled so. */
let rv={y:0,m:0,pid:'',init:false};
function initReportFromUrl(){if(rv.init)return;rv.init=true;const q=new URLSearchParams(location.search),t=today().split('/');rv.pid=S(q.get('pid'));rv.y=+q.get('y')||+t[0];rv.m=+q.get('m')||+t[1]}
function reportIds(y,m){const prefix=`${y}/${String(m).padStart(2,'0')}/`,inMonth=new Set([...(att.punches||[]).filter(p=>p.businessDate.startsWith(prefix)).map(p=>p.personnelId),...(att.monthSaves||[]).filter(s=>s.status==='active'&&+s.year===+y&&+s.month===+m).map(s=>s.personnelId)]);return attPeople().filter(p=>p.status==='فعال'||inMonth.has(p.id)).map(p=>p.id)}
const reportFor=(pid,y,m)=>C().monthReport({doc:att,personnelId:pid,year:y,month:m,today:today()});
const monthTitle=(y,m)=>`${C().MONTHS[m-1]} ${F(y)}`;
function sourceBadge(r){return r.source==='saved'?(r.changedSinceSave.length?`<span class="badge warn">ذخیره‌شده — ${F(r.changedSinceSave.length)} روز تغییر پس از ذخیره</span>`:`<span class="badge success">ذخیره‌شده ${E(F(new Date(r.save.savedAt).toLocaleDateString('fa-IR')))}</span>`):'<span class="badge warn">ذخیره‌نشده (پیش‌نمایش زنده)</span>'}
function setReport(key,value){rv[key]=key==='pid'?S(value):+value;renderView()}
function reportView(){
 ensureLoaded();initReportFromUrl();
 const head=pageHead('گزارش ماهانهٔ حضور و غیاب','جمع کارکرد، موظف، تأخیر، تعجیل، کسر کار، اضافه‌کار تأییدشده و روزهای حضور/غیبت/مرخصی. ماه‌های ذخیره‌شده از نتیجهٔ ثابت‌شده خوانده می‌شوند.',`<a class="btn" href="personnel.html?view=attendanceMonth">کارکرد ماهانه</a>`);
 if(load.state!=='ready')return head+statusCard();
 const picker=`<div class="card"><div class="toolbar">${monthPicker("RayoAttendanceAdmin.setReport('y',this.value)","RayoAttendanceAdmin.setReport('m',this.value)",rv.y,rv.m)}<button class="btn" onclick="RayoAttendanceAdmin.exportSummary()">خروجی Excel همهٔ پرسنل</button></div></div>`;
 let reports;try{reports=reportIds(rv.y,rv.m).map(id=>reportFor(id,rv.y,rv.m))}catch(e){return head+picker+`<div class="card"><p class="danger-text">${E(e.message)}</p></div>`}
 const cols=C().TOTAL_COLUMNS,val=(t,c)=>c[2]==='hm'?C().faHM(t[c[0]]):F(t[c[0]]);
 const summary=`<div class="card"><h2>همهٔ پرسنل — ${monthTitle(rv.y,rv.m)}</h2>${reports.some(r=>r.source!=='saved')?'<p class="muted">ماه برای برخی پرسنل هنوز ذخیره نشده؛ ارقام آن‌ها پیش‌نمایش است و ممکن است تغییر کند.</p>':''}<div class="table-wrap"><table class="data-table"><thead><tr><th>پرسنل</th><th>وضعیت</th>${cols.map(c=>`<th>${E(c[1])}</th>`).join('')}<th></th></tr></thead><tbody>${reports.map(r=>`<tr ${r.personnelId===rv.pid?'style="background:rgba(0,0,0,.04)"':''}><td>${E(personName(r.personnelId))}</td><td>${sourceBadge(r)}</td>${cols.map(c=>`<td>${val(r.totals,c)}</td>`).join('')}<td><button class="btn" onclick="RayoAttendanceAdmin.setReport('pid','${E(r.personnelId)}')">جزئیات</button> <button class="btn" onclick="RayoAttendanceAdmin.printReport('${E(r.personnelId)}')">چاپ</button></td></tr>`).join('')}</tbody></table></div></div>`;
 const r=rv.pid?reports.find(x=>x.personnelId===rv.pid)||reportFor(rv.pid,rv.y,rv.m):null;
 const detail=r?`<div class="card"><div class="toolbar"><h2>${E(personName(r.personnelId))} — ${monthTitle(rv.y,rv.m)}</h2>${sourceBadge(r)}<button class="btn" onclick="RayoAttendanceAdmin.exportReport('${E(r.personnelId)}')">خروجی Excel</button><button class="btn" onclick="RayoAttendanceAdmin.printReport('${E(r.personnelId)}')">چاپ برای پرسنل</button><a class="btn" href="personnel.html?view=attendanceMonth&pid=${encodeURIComponent(r.personnelId)}&y=${rv.y}&m=${rv.m}">ویرایش در کارکرد ماهانه</a></div>
  <div class="grid grid-4">${cols.map(c=>kpi(c[1],val(r.totals,c))).join('')}</div></div>
  <div class="card"><div class="table-wrap">${dayTable(r.days)}</div></div>`:'';
 return head+picker+summary+detail;
}
/* Read-only day table shared by the report and the print page. */
function dayTable(days){const rows=C().exportDayRows(days),keep=[0,1,2,3,4,6,8,10,12,13,14,15,16,17,18,19,22];return `<table class="data-table att-print-table"><thead><tr>${keep.map(i=>`<th>${E(rows[0][i])}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(row=>`<tr>${keep.map(i=>`<td${i===22?' class="exp"':''}>${E([4,6,8,10].includes(i)&&row[i+1]&&row[i+1]!==C().SOURCE_LABELS.actual?`${row[i]} — ${row[i+1]}`:row[i])}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
function fileStamp(y,m){return `${y}-${String(m).padStart(2,'0')}`}
async function exportSummary(){try{const reports=reportIds(rv.y,rv.m).map(id=>reportFor(id,rv.y,rv.m));await window.RayoExcel.exportRows(C().exportSummaryRows(reports,personName),`Rayo_Attendance_Summary_${fileStamp(rv.y,rv.m)}.xlsx`,'Summary')}catch(e){note(S(e?.message)||'خروجی Excel انجام نشد',true)}}
async function exportReport(pid){try{const r=reportFor(pid,rv.y,rv.m),rows=[[`گزارش حضور و غیاب — ${personName(pid)} — ${C().MONTHS[rv.m-1]} ${rv.y}`],[r.source==='saved'?'ذخیره‌شده':'ذخیره‌نشده (پیش‌نمایش زنده)'],[],...C().exportTotalsRows(r.totals),[],...C().exportDayRows(r.days)];await window.RayoExcel.exportRows(rows,`Rayo_Attendance_${pid}_${fileStamp(rv.y,rv.m)}.xlsx`,'Attendance')}catch(e){note(S(e?.message)||'خروجی Excel انجام نشد',true)}}
/* Monthly list export: exactly what the list shows, including unsaved drafts (labelled in the first row). */
async function exportMonthList(){if(!mv.pid)return;try{const days=liveDays().map(C().compactDay),rows=[[`کارکرد ماهانه — ${personName(mv.pid)} — ${C().MONTHS[mv.m-1]} ${mv.y}${monthDirty()?' — شامل اصلاحات ذخیره‌نشده':''}`],[],...C().exportDayRows(days),[],...C().exportTotalsRows(C().monthTotals(days,{today:today()}))];await window.RayoExcel.exportRows(rows,`Rayo_Attendance_List_${mv.pid}_${fileStamp(mv.y,mv.m)}.xlsx`,'List')}catch(e){note(S(e?.message)||'خروجی Excel انجام نشد',true)}}
/* Printable RTL page per employee with daily explanations (A4 landscape). */
function printReport(pid){
 const r=reportFor(pid,rv.y,rv.m),w=window.open('','_blank','width=1100,height=760');if(!w)return note('مرورگر پنجرهٔ چاپ را مسدود کرده است',true);
 const p=personnel().find(x=>x.id===pid),font=`${location.origin}/css/fonts/woff/IRANSansX-Regular.woff`,bold=`${location.origin}/css/fonts/woff/IRANSansX-Bold.woff`,cols=C().TOTAL_COLUMNS,val=(t,c)=>c[2]==='hm'?C().faHM(t[c[0]]):F(t[c[0]]);
 const restaurant=S(state?.settings?.restaurantName)||'کافه‌رستوران رایو',status=r.source==='saved'?`ذخیره‌شده در ${F(new Date(r.save.savedAt).toLocaleString('fa-IR'))} توسط ${E(r.save.savedBy)}`:'ذخیره‌نشده — پیش‌نمایش؛ ارقام ممکن است تغییر کند';
 w.document.write(`<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>حضور و غیاب ${E(personName(pid))} — ${E(C().MONTHS[rv.m-1])} ${F(rv.y)}</title><style>@font-face{font-family:IRANSansX;src:url('${font}') format('woff')}@font-face{font-family:IRANSansX;src:url('${bold}') format('woff');font-weight:700}@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{font-family:IRANSansX,Tahoma,sans-serif;font-size:7.5pt;color:#000;margin:0}h1{font-size:12pt;margin:0 0 1mm}.meta{display:flex;gap:6mm;flex-wrap:wrap;margin-bottom:2mm}.totals{display:grid;grid-template-columns:repeat(7,1fr);gap:1mm;margin-bottom:2mm}.totals div{border:1px solid #555;padding:1mm}.totals b{display:block;font-size:9pt}table{width:100%;border-collapse:collapse}th,td{border:1px solid #444;padding:.8mm;text-align:center;vertical-align:top}th{background:#eee}td.exp{text-align:right;width:30%;font-size:6.8pt;line-height:1.5}.sign{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:4mm}.sign div{border:1px solid #444;min-height:16mm;padding:1.5mm}.note{font-size:6.8pt;margin-top:1.5mm}tr{page-break-inside:avoid}</style></head><body>
  <h1>${E(restaurant)} — گزارش ماهانهٔ حضور و غیاب</h1>
  <div class="meta"><span>پرسنل: <b>${E(personName(pid))}</b></span><span>کد پرسنلی: <b>${E(F(p?.attendanceCode||'—'))}</b></span><span>ماه: <b>${E(C().MONTHS[rv.m-1])} ${F(rv.y)}</b></span><span>${status}</span></div>
  <div class="totals">${cols.map(c=>`<div>${E(c[1])}<b>${val(r.totals,c)}</b></div>`).join('')}</div>
  ${dayTable(r.days)}
  <div class="note">ساعت‌های با منبع «بدبینانه» یا «قانون استراحت» به‌دلیل ثبت‌نشدن تردد طبق قانون رستوران پر شده‌اند؛ اگر ساعت واقعی متفاوت است به مدیر اطلاع دهید. (+۱) یعنی روز تقویمی بعد.</div>
  <div class="sign"><div>امضای پرسنل:</div><div>امضای مدیر:</div></div>
  <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
 w.document.close();
}

/* ---------- install ---------- */
function install(){
 if(typeof views==='undefined'||typeof titles==='undefined'||!C())return setTimeout(install,100);
 if(window.__rayoAttendanceAdmin)return;window.__rayoAttendanceAdmin=true;
 titles.attendanceImport='ورود فایل تردد';titles.attendanceSettings='تنظیمات حضور و غیاب';titles.attendanceMonth='کارکرد ماهانهٔ حضور و غیاب';titles.attendanceAttention='موارد نیازمند بررسی تردد';titles.attendanceReport='گزارش ماهانهٔ حضور و غیاب';
 views.attendanceImport=importView;views.attendanceSettings=settingsView;views.attendanceMonth=monthView;views.attendanceAttention=attentionView;views.attendanceReport=reportView;
 window.addEventListener('beforeunload',e=>{if(dirty()||busy||monthDirty()){e.preventDefault();e.returnValue=''}});
 if(VIEWS.includes(typeof currentView!=='undefined'?currentView:''))renderView();
}
window.RayoAttendanceAdmin={reload:()=>ensureLoaded(true),edit,saveSettings,discardSettings,chooseFile,setMapping,confirmImport,cancelImport,
 setMonthFilter,setUseCurrent,openDay,addPunch,removeAdded,applyDay,resetDay,discardMonth,saveMonth,setAttention,setReport,exportSummary,exportReport,exportMonthList,printReport,_state:()=>({att,load,draft,imp,mv,av,rv})};
install();
})();
