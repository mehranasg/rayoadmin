/* Rayo UI Template — beverage-control.js
   EXACT COPY of js/config.js lines between "// Daily soft-drink control" and the closing "})();" of that block (RayoBeverageControl):
   the same formula, blank handling, merge and conflict rules as the current panel and the staff panel.
   Do not edit here: change js/config.js and copy again; qa_template_beverage_sync.js fails when the two differ. */
// Daily soft-drink control (inventory.beverageDailyControls). One live record per date, one line per beverage
// (ingredientId from pricing.ingredients via settings.beverageControl.itemIds). Shared by the admin desktop table,
// the one-beverage mobile form, reports and the staff panel so every screen uses the same formula and merge rules.
// Blank is "not entered" and never becomes zero; a calculation with a missing input is "not computable".
(()=>{
const S=x=>String(x??'').trim(),A=x=>Array.isArray(x)?x:[],E=x=>S(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DG=x=>String(x??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const FORMULA='bev-v2',DAY=864e5,UNKNOWN_SAVE=['timeout','network_error','empty_response','invalid_json'];
// Entry order: sales is the last number the user enters (after the night count).
const COUNT_FIELDS=['morningUpper','morningLower','inflow','nonSale','nightUpper','nightLower','sales'],TEXT_FIELDS=['nonSaleReason','varianceNote'],FIELDS=[...COUNT_FIELDS,...TEXT_FIELDS];
const LABELS={morningUpper:'شمارش صبح بالا',morningLower:'شمارش صبح پایین',inflow:'ورودی روز',nonSale:'خروج غیر فروش',sales:'فروش',nightUpper:'مانده شب بالا',nightLower:'مانده شب پایین',nonSaleReason:'علت خروج غیر فروش',varianceNote:'علت مغایرت'};
// People of the day (record.roles): the morning counter takes the fridges over, the night counter makes the final count
// and the storekeeper takes the night count over. The next morning count must equal what the storekeeper took over;
// the difference is the overnight variance and belongs to that storekeeper.
const ROLES=[['morningCounter','شمارنده صبح','تحویل‌گیرنده صبح'],['nightCounter','شمارنده شب','شمارش نهایی شب'],['storekeeper','انباردار','تحویل از شمارنده شب']],ROLE_KEYS=ROLES.map(r=>r[0]);
const EDIT_CONFIRM='قبلاً اطلاعات این نوشیدنی را ثبت کرده‌اید. مطمئن هستید می‌خواهید تغییرش دهید؟';
function parseCount(v){if(v===null||v===undefined)return null;if(typeof v==='number')return Number.isInteger(v)&&v>=0?v:NaN;const s=DG(v).replace(/[٬,،\s]/g,'');if(s==='')return null;return /^\d+$/.test(s)?Number(s):NaN}
const num=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
// A count needs both fridges. A legacy record that only kept a total (morningTotal/nightTotal) keeps it, marked unsplit.
function pair(upper,lower,total){if(upper!==null&&lower!==null)return{total:upper+lower,split:true};if(upper===null&&lower===null&&total!==null)return{total,split:false};return{total:null,split:null}}
// Lines saved before bev-v2 kept morning/evening flows; their sum is the day flow, and all-blank parts stay unknown.
function legacyFlow(l,a,b){const x=num(l[a]),y=num(l[b]);return x===null&&y===null?null:(x||0)+(y||0)}
function values(line){const l=line||{},v2=l.formulaVersion===FORMULA,mu=num(l.morningUpper),ml=num(l.morningLower),nu=num(l.nightUpper),nl=num(l.nightLower),m=pair(mu,ml,num(l.morningTotal)),n=pair(nu,nl,num(l.nightTotal));
 return{morningUpper:mu,morningLower:ml,morning:m.total,morningSplit:m.split,inflow:v2?num(l.inflow):legacyFlow(l,'inMorning','inEvening'),nonSale:v2?num(l.nonSale):legacyFlow(l,'nonSaleMorning','nonSaleEvening'),sales:v2?num(l.sales):legacyFlow(l,'salesMorning','salesEvening'),nightUpper:nu,nightLower:nl,night:n.total,nightSplit:n.split,nonSaleReason:S(l.nonSaleReason),varianceNote:S(l.varianceNote),legacy:!!line&&!v2}}
function formValues(line){const v=values(line),out={};for(const f of FIELDS)out[f]=v[f];return out}
// expected night = (morning + day inflow) − (non-sale + sales); daily = expected − night (positive = shortage);
// overnight = this morning − previous calendar day's night (negative = stock went down overnight).
function metrics(line,prevLine){const v=values(line),prevNight=prevLine?values(prevLine).night:null,missingExpected=[['morning','شمارش صبح'],['inflow','ورودی روز'],['nonSale','خروج غیر فروش'],['sales','فروش']].filter(([k])=>v[k]===null).map(x=>x[1]);
 const expectedNight=missingExpected.length?null:(v.morning+v.inflow)-(v.nonSale+v.sales),daily=expectedNight===null||v.night===null?null:expectedNight-v.night,overnight=v.morning===null||prevNight===null?null:v.morning-prevNight;
 return{...v,prevNight,expectedNight,daily,overnight,complete:daily!==null,missingExpected,missingDaily:[...missingExpected,...(v.night===null?['مانده شب']:[])],missingOvernight:[...(v.morning===null?['شمارش صبح']:[]),...(prevNight===null?['مانده شب روز قبل']:[])]}}
function read(raw){const values={},errors=[],invalid=[];for(const f of COUNT_FIELDS){const v=parseCount(raw?.[f]);if(Number.isNaN(v)){errors.push(`${LABELS[f]} باید عدد صحیح نامنفی باشد`);invalid.push(f);values[f]=null}else values[f]=v}for(const f of TEXT_FIELDS)values[f]=S(raw?.[f]);if(values.nonSale>0&&!values.nonSaleReason){errors.push('برای خروج غیر فروش بیشتر از صفر، علت را بنویسید');invalid.push('nonSaleReason')}return{values,errors,invalid}}
let utcFormat=null;
function persianFormat(timeZone){try{return new Intl.DateTimeFormat('en-u-ca-persian-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'})}catch(_){return null}}
function jalaliOf(date,timeZone='UTC'){const f=timeZone==='UTC'?(utcFormat||(utcFormat=persianFormat('UTC'))):persianFormat(timeZone);if(!f)return '';const p=f.formatToParts(date),g=t=>DG(p.find(x=>x.type===t)?.value||'');return `${g('year')}/${g('month').padStart(2,'0')}/${g('day').padStart(2,'0')}`}
function today(){return jalaliOf(new Date(),'Asia/Tehran')||window.RayoJalali?.today?.()||''}
// Calendar arithmetic through the Persian calendar of Intl: esfand 29/30 and year changes come from the calendar itself.
function utcOf(s){const m=/^(\d{4})\/(\d{2})\/(\d{2})$/.exec(S(s));if(!m)return null;const y=+m[1],mo=+m[2],d=+m[3];if(mo<1||mo>12||d<1||d>(mo<=6?31:30))return null;let t=Date.UTC(y+621,2,20)+Math.round((mo-1)*30.6+d-1)*DAY;for(let i=0;i<12;i++){const j=jalaliOf(new Date(t));if(!j)return null;if(j===s)return t;t+=(j<s?1:-1)*DAY}return null}
function normDate(v){const m=DG(v).trim().replace(/-/g,'/').match(/^(1[34]\d{2})\/(\d{1,2})\/(\d{1,2})$/);if(!m)return '';const s=`${m[1]}/${m[2].padStart(2,'0')}/${m[3].padStart(2,'0')}`;return utcOf(s)===null?'':s}
function addDays(s,n){const t=utcOf(s);if(t===null)return typeof window.addJDays==='function'?window.addJDays(s,n):'';return jalaliOf(new Date(t+n*DAY))}
const live=x=>x&&typeof x==='object'&&x.status!=='void';
function records(doc){return A(doc?.beverageDailyControls).filter(live)}
function recordOf(doc,date){return records(doc).find(x=>x.date===date)||null}
function lineOf(record,itemId){return A(record?.lines).find(l=>l&&l.ingredientId===itemId)||null}
function prevLineOf(doc,date,itemId){const d=addDays(date,-1);return d?lineOf(recordOf(doc,d),itemId):null}
function fingerprint(line){return line?JSON.stringify(line):''}
function person(v){const id=S(v?.personnelId),name=S(v?.name);return id||name?{personnelId:id,name}:null}
function rolesOf(record){const r=record?.roles||{},out={};for(const k of ROLE_KEYS)out[k]=person(r[k]);return out}
// Role keys whose person differs from the record; `roles` undefined means roles are not part of this edit.
function changedRoles(record,roles){if(!roles)return [];const cur=rolesOf(record),key=p=>`${S(p?.personnelId)}|${S(p?.name)}`;return ROLE_KEYS.filter(k=>k in roles&&key(cur[k])!==key(person(roles[k])))}
function rolesMatch(doc,date,roles){return !changedRoles(recordOf(doc,date),roles).length}
function roleText(p){return p?S(p.name)||S(p.personnelId):''}
function changedFields(line,vals){const cur=formValues(line);return FIELDS.filter(f=>(cur[f]??null)!==(vals?.[f]??null))}
function savedMatches(doc,date,itemId,vals){const l=lineOf(recordOf(doc,date),itemId);return !!l&&!changedFields(l,vals).length}
function conflict(current){const e=new Error('اطلاعات این نوشیدنی پس از بارگذاری فرم توسط کاربر دیگری تغییر کرده است.');e.code='bev_conflict';e.current=current;return e}
// Applies one beverage line onto a freshly loaded inventory document. `baseline` is the fingerprint of the line the
// form was loaded with; a different server line is a concurrent edit. The morning/night counter is set only when that
// stage's counts change, so a night entry never renames the morning counter; created/updated keep first and last editor.
function applyEdit(doc,{date,item,values:vals,actor,at,baseline,recordId,roles}){
 if(!doc||typeof doc!=='object'||Array.isArray(doc))throw new Error('سند انبار برای ذخیره معتبر نیست');
 if(!date||!item?.id)throw new Error('تاریخ و نوشیدنی الزامی است');
 doc.beverageDailyControls=A(doc.beverageDailyControls);doc.changeLog=A(doc.changeLog);
 let record=recordOf(doc,date);const old=lineOf(record,item.id);
 if(baseline!==undefined&&baseline!==null&&fingerprint(old)!==baseline)throw conflict(old);
 const changed=changedFields(old,vals),roleKeys=changedRoles(record,roles);if(!changed.length&&!roleKeys.length)return{changed:false,record,line:old,fields:[],roles:[]};
 const who={type:S(actor?.type)||'admin',personnelId:S(actor?.personnelId),name:S(actor?.name),at},existed=!!record;
 if(!record){record={id:recordId||`BEV-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,date,status:'posted',source:who.type==='staff'?'staff':'admin',lines:[],createdAt:at,createdBy:who.name,...(who.personnelId?{createdByPersonnelId:who.personnelId,createdByName:who.name}:{})};doc.beverageDailyControls.push(record)}
 record.lines=A(record.lines);
 if(roleKeys.length){const cur=rolesOf(record);record.roles={...(record.roles||{})};for(const k of roleKeys)record.roles[k]=person(roles[k]);if(existed){record.updatedAt=at;record.updatedBy=who.name}doc.changeLog.push({at,action:'تعیین افراد کنترل روزانه نوشابه',actor:who.name,actorType:who.type,personnelId:who.personnelId,entityId:record.id,date,roles:roleKeys.map(k=>({role:k,from:roleText(cur[k]),to:roleText(roles[k])}))})}
 if(!changed.length)return{changed:true,record,line:old,created:false,fields:[],roles:roleKeys};
 const next={...(old||{}),ingredientId:item.id,itemNameSnapshot:old?.itemNameSnapshot||S(item.name),itemCodeSnapshot:old?(old.itemCodeSnapshot??''):S(item.code),unitSnapshot:old?.unitSnapshot||S(item.recipeUnit||item.unit)||'عدد'};
 for(const f of FIELDS)next[f]=vals[f]??(TEXT_FIELDS.includes(f)?'':null);next.formulaVersion=FORMULA;
 if(changed.some(f=>f==='morningUpper'||f==='morningLower'))next.morningCountedBy=who;
 if(changed.some(f=>f==='nightUpper'||f==='nightLower'))next.nightCountedBy=who;
 if(!old){next.createdAt=at;next.createdBy=who}
 next.updatedAt=at;next.updatedBy=who;
 if(old){record.lines[record.lines.indexOf(old)]=next;record.revisions=[...A(record.revisions),{kind:'line',ingredientId:item.id,line:JSON.parse(JSON.stringify(old)),replacedAt:at,replacedBy:who.name,replacedByPersonnelId:who.personnelId}].slice(-100)}else record.lines.push(next);
 if(existed){record.updatedAt=at;record.updatedBy=who.name}
 doc.changeLog.push({at,action:old?'اصلاح کنترل روزانه نوشابه':'ثبت کنترل روزانه نوشابه',actor:who.name,actorType:who.type,personnelId:who.personnelId,entityId:record.id,ingredientId:item.id,date,fields:changed});
 return{changed:true,record,line:next,created:!old,fields:changed,roles:roleKeys}}
const fa=n=>Number(n).toLocaleString('fa-IR');
// The signed number is a left-to-right isolate so the sign stays next to the digits inside Persian text.
function signed(n){return n===null||n===undefined?'—':`⁦${n>0?'+':n<0?'−':''}${fa(Math.abs(n))}⁩`}
function dailyText(n){return n===null||n===undefined?'قابل محاسبه نیست':n>0?`کسری ${signed(n)}`:n<0?`اضافه ${signed(n)}`:'بدون مغایرت (۰)'}
function overnightText(n){return n===null||n===undefined?'قابل محاسبه نیست':n<0?`کاهش موجودی ${signed(n)}`:n>0?`افزایش موجودی ${signed(n)}`:'بدون تغییر (۰)'}
function atText(iso){if(!iso)return '';try{return new Date(iso).toLocaleString('fa-IR',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(_){return S(iso).slice(0,16).replace('T',' ')}}
function byText(who,label){return who&&S(who.name)?`${label}: ${S(who.name)}${who.at?` — ${atText(who.at)}`:''}`:''}

// One-beverage-at-a-time form (admin on mobile and in the dashboard modal, staff panel). cfg: items(), load(),
// save(doc)→verified doc|null, actor()→{type,personnelId,name}, toast(msg,isError), optional people()→[{id,name}] (choices
// for the day's roles), onLoaded/onSaved/canEdit(date,existing)/confirm/title/date. Beverages are picked from a vertical
// list that shows each one's state for the date; the day's people are shared by every beverage of that date.
const st={date:'',itemId:'',seq:0,loading:false,saving:false,baseline:null,line:null,existing:false,blocked:'',doc:null,roles:null};
let cfg=null;
const $=id=>document.getElementById(id);
function css(){if(typeof document==='undefined'||!document.head||$('rbcStyle'))return;const s=document.createElement('style');s.id='rbcStyle';s.textContent='.rbc .rbc-sel,.rbc .rbc-fields{border:0;padding:0;margin:0;min-width:0}.rbc .rbc-sel{display:grid;grid-template-columns:1fr;gap:10px}.rbc .rbc-fields{display:grid;gap:10px}.rbc .rbc-fields[disabled]{opacity:.6}.rbc-label{display:block;font-size:13px;font-weight:600;margin-bottom:4px}.rbc-items{display:grid;gap:6px;max-height:46vh;overflow:auto;padding:2px}.rbc-item{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;min-height:46px;padding:8px 12px;border:1px solid var(--border,#e4e7ec);border-radius:10px;background:var(--surface,#fff);color:inherit;font:inherit;text-align:right;cursor:pointer}.rbc-item[aria-pressed=true]{border-color:var(--primary,#134e4a);box-shadow:inset 0 0 0 1px var(--primary,#134e4a);font-weight:700}.rbc-item small{color:var(--muted,#667085);font-weight:400;font-size:12px;white-space:nowrap}.rbc-item[data-done=full] small{color:#067647}.rbc-item[data-done=part] small{color:#b54708}.rbc-box{border:1px solid var(--border,#e4e7ec);border-radius:12px;padding:10px 12px}.rbc-box h3{margin:0 0 8px;font-size:14px}.rbc-roles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.rbc-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rbc-pair+.rbc-pair{margin-top:10px}.rbc-in{display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:600;min-width:0}.rbc-in input,.rbc-in textarea,.rbc-in select{width:100%;min-height:42px;font:inherit;box-sizing:border-box}.rbc-in small,.rbc-by{color:var(--muted,#667085);font-weight:400;font-size:12px}.rbc-by{display:block;margin-top:6px}.rbc-calc{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px 10px;background:var(--bg-soft,#f6f7f9);border-radius:10px;padding:9px 12px;font-size:13px}.rbc-calc small{color:var(--muted,#667085)}.rbc-calc output{font-weight:700}.rbc-calc output[data-tone=bad]{color:#b42318}.rbc-calc output[data-tone=good]{color:#067647}.rbc-calc output[data-tone=na]{color:var(--muted,#667085);font-weight:400}.rbc-status{margin:10px 0;font-size:13px;line-height:1.8}.rbc-status[data-tone=error]{color:#b42318}.rbc-status[data-tone=ok]{color:#067647}.rbc-status[data-tone=warn]{color:#b54708}.rbc [aria-invalid=true]{border-color:#b42318!important;outline-color:#b42318}.rbc-save{width:100%;min-height:44px}@media(max-width:620px){.rbc-roles{grid-template-columns:1fr}.rbc-reasons .rbc-pair{grid-template-columns:1fr}}';document.head.appendChild(s)}
const itemOf=id=>A(cfg?.items?.()).find(i=>i.id===id)||null;
const input=(f,label,hint='')=>`<label class="rbc-in">${E(label)}<input id="rbc_${f}" data-rbc-count="${f}" inputmode="numeric" autocomplete="off" aria-label="${E(LABELS[f])}" oninput="RayoBeverageControl.form.recalc()">${hint?`<small>${E(hint)}</small>`:''}</label>`;
// State of one beverage on the form date, from the last loaded document (indicator only; the line is reloaded on pick).
function itemState(id){if(!st.doc)return['',''];const l=lineOf(recordOf(st.doc,st.date),id);if(!l)return['','ثبت نشده'];return metrics(l,prevLineOf(st.doc,st.date,id)).complete?['full','✓ کامل']:['part','ناقص']}
function itemsHtml(){return A(cfg?.items?.()).map(i=>{const [done,text]=itemState(i.id);return `<button type="button" class="rbc-item" data-rbc-item="${E(i.id)}" data-done="${done}" aria-pressed="${i.id===st.itemId}" onclick="RayoBeverageControl.form.setItem(this.dataset.rbcItem)"><span>${E(i.name)}</span><small>${E(text)}</small></button>`}).join('')}
function refreshItems(){const box=$('rbcItem');if(box&&typeof box.innerHTML==='string')box.innerHTML=itemsHtml()}
function people(){return A(cfg?.people?.()).map(p=>({id:S(p?.id),name:S(p?.name)})).filter(p=>p.id)}
function peopleOptions(sel){const list=people();if(sel?.personnelId&&!list.some(p=>p.id===sel.personnelId))list.unshift({id:sel.personnelId,name:sel.name||sel.personnelId});return '<option value="">انتخاب نشده</option>'+list.map(p=>`<option value="${E(p.id)}"${sel?.personnelId===p.id?' selected':''}>${E(p.name)}</option>`).join('')}
function fillRoles(record){st.roles=rolesOf(record);for(const k of ROLE_KEYS){const el=$(`rbc_role_${k}`);if(!el)continue;el.innerHTML=peopleOptions(st.roles[k]);el.value=S(st.roles[k]?.personnelId)}}
// Only the roles the user changed are part of the edit, so an untouched select never overwrites another user's choice.
function readRoles(){const out={},key=p=>`${S(p?.personnelId)}|${S(p?.name)}`;for(const k of ROLE_KEYS){const el=$(`rbc_role_${k}`);if(!el)continue;const id=S(el.value),cur=st.roles?.[k]||null,p=id?(cur?.personnelId===id?cur:{personnelId:id,name:people().find(x=>x.id===id)?.name||id}):null;if(key(p)!==key(cur))out[k]=p}return Object.keys(out).length?out:undefined}
function html(config){cfg=config||{};css();const t=today();st.date=normDate(cfg.date)&&normDate(cfg.date)<=t?normDate(cfg.date):(st.date&&st.date<=t?st.date:t);st.itemId='';st.seq++;st.loading=false;st.baseline=null;st.line=null;st.existing=false;st.blocked='';st.roles=null;const items=A(cfg.items?.()),seq=st.seq;
 // Reads the document once so the list shows each beverage's state for the date; never overwrites a newer load.
 if(items.length)setTimeout(()=>Promise.resolve().then(()=>cfg.load()).then(d=>{if(seq!==st.seq||st.doc)return;st.doc=d;cfg.onLoaded?.(d);refreshItems();fillRoles(recordOf(d,st.date))}).catch(()=>{}),0);
 return `<form class="card rbc" id="rbcForm" novalidate onsubmit="event.preventDefault();RayoBeverageControl.form.save()">${cfg.title?`<div class="section-head"><h2>${E(cfg.title)}</h2></div>`:''}
 <fieldset id="rbcSel" class="rbc-sel"><div class="field"><label for="rbcDate">تاریخ *</label><input id="rbcDate" data-jalali="1" inputmode="numeric" value="${E(st.date)}" onchange="RayoBeverageControl.form.setDate(this.value)"></div><div><span class="rbc-label" id="rbcItemLabel">نوشیدنی *</span><div id="rbcItem" class="rbc-items" role="group" aria-labelledby="rbcItemLabel">${itemsHtml()}</div></div></fieldset>
 <p id="rbcStatus" class="rbc-status" role="status" aria-live="polite">${items.length?'نوشیدنی را انتخاب کنید.':'هنوز نوشیدنی برای کنترل روزانه تعیین نشده است.'}</p>
 <fieldset id="rbcFields" class="rbc-fields" disabled>
 ${cfg.autoRoles?'<p class="rbc-by">نام شما برای مرحله‌ای که وارد می‌کنید (شمارش صبح یا شب) خودکار ثبت می‌شود.</p>':`<section class="rbc-box"><h3>افراد این روز</h3><div class="rbc-roles">${ROLES.map(([k,l,h])=>`<label class="rbc-in">${E(l)}<select id="rbc_role_${k}" onchange="RayoBeverageControl.form.recalc()">${peopleOptions(null)}</select><small>${E(h)}</small></label>`).join('')}</div><small class="rbc-by">برای همهٔ نوشیدنی‌های این تاریخ مشترک است. شمارش صبح فردا باید با تحویل انباردار امشب برابر باشد؛ اختلاف، مغایرت شبانه است.</small></section>`}
 <section class="rbc-box"><h3>شمارش صبح</h3><div class="rbc-pair">${input('morningUpper','بالا')}${input('morningLower','پایین')}</div><small id="rbcMorningBy" class="rbc-by"></small></section>
 <section class="rbc-box"><h3>گردش روز</h3><div class="rbc-pair">${input('inflow','ورودی روز','مجموع شارژ هر دو یخچال')}${input('nonSale','خروج غیر فروش','پرسنلی، مهمان، شکسته…')}</div></section>
 <section class="rbc-box"><h3>مانده شب</h3><div class="rbc-pair">${input('nightUpper','بالا')}${input('nightLower','پایین')}</div><small id="rbcNightBy" class="rbc-by"></small></section>
 <section class="rbc-box"><h3>فروش</h3>${input('sales','فروش روز','از گزارش صندوق؛ آخرین عددی که وارد می‌شود')}</section>
 <section class="rbc-box rbc-reasons"><h3>علت‌ها</h3><div class="rbc-pair"><label class="rbc-in">علت خروج غیر فروش<input id="rbc_nonSaleReason" autocomplete="off" placeholder="پرسنلی، مهمان، شکسته…" oninput="RayoBeverageControl.form.recalc()"></label><label class="rbc-in">علت مغایرت<textarea id="rbc_varianceNote" rows="2" oninput="RayoBeverageControl.form.recalc()"></textarea></label></div></section>
 <div class="rbc-calc"><span>مانده مورد انتظار شب</span><output id="rbcExpected" data-tone="na">—</output></div>
 <div class="rbc-calc"><span>مغایرت روز <small>(مثبت = کسری، منفی = اضافه)</small></span><output id="rbcDaily" data-tone="na">—</output></div>
 <div class="rbc-calc"><span>مغایرت شبانه <small id="rbcPrevNight">(صبح امروز − تحویل انباردار شب قبل)</small></span><output id="rbcOvernight" data-tone="na">—</output></div>
 <button type="submit" class="btn btn-primary rbc-save" id="rbcSave">ذخیره این نوشیدنی</button>
 </fieldset></form>`}
function status(text,tone=''){const s=$('rbcStatus');if(s){s.textContent=text;s.dataset.tone=tone}}
function out(id,text,tone){const o=$(id);if(o){o.textContent=text;o.dataset.tone=tone}}
function fill(line){const v=formValues(line);for(const f of FIELDS){const el=$(`rbc_${f}`);if(el){el.value=v[f]===null||v[f]===undefined?'':String(v[f]);el.removeAttribute('aria-invalid')}}}
function readForm(){const raw={};for(const f of FIELDS)raw[f]=$(`rbc_${f}`)?.value??'';return read(raw)}
function lock(on){const sel=$('rbcSel'),fields=$('rbcFields'),btn=$('rbcSave');if(sel)sel.disabled=on;if(fields)fields.disabled=on||!st.itemId||st.baseline===null||!!st.blocked;if(btn)btn.textContent=on?'در حال ذخیره…':'ذخیره این نوشیدنی'}
function clearForm(){st.seq++;st.loading=false;st.baseline=null;st.line=null;st.existing=false;st.blocked='';fill(null);for(const id of ['rbcExpected','rbcDaily','rbcOvernight'])out(id,'—','na');for(const id of ['rbcMorningBy','rbcNightBy'])if($(id))$(id).textContent='';lock(false)}
function recalc(){if(!st.itemId||st.baseline===null)return;const {values:v,invalid}=readForm();for(const f of FIELDS)$(`rbc_${f}`)?.setAttribute('aria-invalid',invalid.includes(f)?'true':'false');const reason=$('rbc_nonSaleReason');if(reason)reason.required=v.nonSale>0;
 const bad=invalid.some(f=>COUNT_FIELDS.includes(f)),m=metrics({...(st.line||{}),...v,formulaVersion:FORMULA},st.doc?prevLineOf(st.doc,st.date,st.itemId):null);
 if(bad){for(const id of ['rbcExpected','rbcDaily','rbcOvernight'])out(id,'ورودی نامعتبر','bad');return}
 out('rbcExpected',m.expectedNight===null?`قابل محاسبه نیست — ${m.missingExpected.join('، ')} وارد نشده`:fa(m.expectedNight),m.expectedNight===null?'na':'');
 out('rbcDaily',m.daily===null?`قابل محاسبه نیست — ${m.missingDaily.join('، ')} وارد نشده`:dailyText(m.daily),m.daily===null?'na':m.daily>0?'bad':m.daily<0?'good':'');
 out('rbcOvernight',m.overnight===null?`قابل محاسبه نیست — ${m.missingOvernight.join('، ')} ${m.prevNight===null?'ثبت نشده':'وارد نشده'}`:overnightText(m.overnight),m.overnight===null?'na':m.overnight<0?'bad':m.overnight>0?'good':'');
 const pn=$('rbcPrevNight'),keeper=st.doc?roleText(rolesOf(recordOf(st.doc,addDays(st.date,-1))).storekeeper):'';if(pn)pn.textContent=m.prevNight===null?'(صبح امروز − تحویل انباردار شب قبل)':`(تحویل شب قبل: ${fa(m.prevNight)}${keeper?` — انباردار: ${keeper}`:''})`}
async function load(){const seq=++st.seq,date=st.date,itemId=st.itemId,item=itemOf(itemId);st.loading=true;st.baseline=null;st.line=null;st.existing=false;st.blocked='';fill(null);for(const id of ['rbcExpected','rbcDaily','rbcOvernight'])out(id,'—','na');lock(false);status(`در حال بررسی اطلاعات ثبت‌شدهٔ ${item?.name||''} برای ${date}…`);
 try{const doc=await cfg.load();if(seq!==st.seq)return;st.doc=doc;cfg.onLoaded?.(doc);const record=recordOf(doc,date),line=lineOf(record,itemId),v=values(line);st.line=line;st.baseline=fingerprint(line);st.existing=!!line;st.blocked=S(cfg.canEdit?.(date,!!line));fill(line);fillRoles(record);refreshItems();
  const mb=$('rbcMorningBy'),nb=$('rbcNightBy');if(mb)mb.textContent=v.morningSplit===false?`مقدار تاریخی بدون تفکیک بالا/پایین: ${fa(v.morning)}`:byText(line?.morningCountedBy,'ثبت صبح');if(nb)nb.textContent=v.nightSplit===false?`مقدار تاریخی بدون تفکیک بالا/پایین: ${fa(v.night)}`:byText(line?.nightCountedBy,'ثبت شب');
  const edited=line?.updatedBy?.name?` آخرین ویرایش: ${line.updatedBy.name} — ${atText(line.updatedAt)}.`:'';
  status(st.blocked||(line?`برای این تاریخ قبلاً اطلاعات ${item?.name||''} ثبت شده و در فرم بارگذاری شد.${edited}`:`اطلاعات ${item?.name||''} برای ${date} هنوز ثبت نشده است.`),st.blocked?'warn':'');lock(false);recalc();$('rbcFields')?.scrollIntoView?.({block:'start',behavior:'smooth'})}
 catch(e){if(seq!==st.seq)return;st.doc=null;status(`دریافت اطلاعات انجام نشد؛ ثبت ممکن نیست. ${S(e?.message)}`,'error')}
 finally{if(seq===st.seq)st.loading=false}}
function setDate(v){if(st.saving)return;const d=normDate(v),el=$('rbcDate');if(!d||d>today()){if(el)el.value=st.date;return cfg?.toast?.(d?'تاریخ نمی‌تواند بعد از امروز باشد':'تاریخ شمسی معتبر وارد کنید',true)}st.date=d;if(el)el.value=d;refreshItems();if(st.itemId)return load();if(st.doc)fillRoles(recordOf(st.doc,d));clearForm()}
function setItem(id){if(st.saving)return;st.itemId=S(id);refreshItems();if(st.itemId)return load();clearForm();status('نوشیدنی را انتخاب کنید.')}
async function save(){if(st.saving||st.loading)return;if(!st.itemId)return cfg.toast?.('نوشیدنی را انتخاب کنید',true);if(st.baseline===null)return cfg.toast?.('اطلاعات این نوشیدنی هنوز بارگذاری نشده است',true);if(st.blocked)return cfg.toast?.(st.blocked,true);
 const item=itemOf(st.itemId);if(!item)return cfg.toast?.('این نوشیدنی در فهرست کنترل نیست',true);
 const {values:vals,errors}=readForm();if(errors.length){status(errors.join('؛ '),'error');return cfg.toast?.(errors[0],true)}
 let roles=readRoles();const lineChanged=changedFields(st.line,vals).length>0;
 if(!lineChanged&&!roles)return cfg.toast?.(st.existing?'تغییری برای ذخیره وجود ندارد':'حداقل یک مقدار وارد کنید',true);
 const date=st.date,itemId=st.itemId;st.saving=true;lock(true);
 try{if(st.existing&&lineChanged&&!await (cfg.confirm||(m=>window.confirm(m)))(EDIT_CONFIRM))return status('ذخیره لغو شد؛ مقادیر فرم حفظ شده است.','warn');
  status('در حال ذخیره…');const who=await cfg.actor(),doc=await cfg.load(),at=new Date().toISOString(),requestId=window.RAYO_API_GATEWAY?.createRequestId?.()||String(Date.now());
  /* autoRoles (staff panel): whoever enters the morning / night count becomes that day's morning / night counter. */
  if(cfg.autoRoles&&who?.personnelId){const ch=changedFields(st.line,vals),self={personnelId:who.personnelId,name:who.name},auto={};if(ch.some(f=>f.startsWith('morning'))&&S(st.roles?.morningCounter?.personnelId)!==self.personnelId)auto.morningCounter=self;if(ch.some(f=>f.startsWith('night'))&&S(st.roles?.nightCounter?.personnelId)!==self.personnelId)auto.nightCounter=self;if(Object.keys(auto).length)roles={...(roles||{}),...auto}}
  const r=applyEdit(doc,{date,item,values:vals,actor:who,at,baseline:st.baseline,recordId:`BEV-${requestId}`,roles}),ok=c=>(!lineChanged||savedMatches(c,date,itemId,vals))&&(!roles||rolesMatch(c,date,roles));
  if(r.changed){let checked=null;try{checked=await cfg.save(doc)}catch(e){if(!UNKNOWN_SAVE.includes(S(e?.code)))throw e;checked=await cfg.load().catch(()=>null);if(!checked||!ok(checked))throw e}
   if(!checked)checked=await cfg.load();if(!ok(checked))throw new Error('ذخیره روی سرور تأیید نشد؛ مقادیر فرم حفظ شد. دوباره تلاش کنید.');st.doc=checked;cfg.onSaved?.(checked)}
  cfg.toast?.(`اطلاعات ${item.name} برای ${date} ذخیره شد`);st.itemId='';refreshItems();clearForm();status(`اطلاعات ${item.name} ذخیره شد. نوشیدنی بعدی را انتخاب کنید.`,'ok')}
 catch(e){if(e?.code==='bev_conflict'){st.line=e.current;st.baseline=fingerprint(e.current);st.existing=!!e.current;status('اطلاعات این نوشیدنی پس از بارگذاری فرم توسط کاربر دیگری تغییر کرده است. مقادیر شما حفظ شد؛ برای جایگزینی، دوباره «ذخیره» را بزنید.','error');cfg.toast?.('تغییر هم‌زمان؛ مقادیر فرم حفظ شد',true)}else{status(S(e?.message)||'ذخیره انجام نشد؛ مقادیر فرم حفظ شد.','error');cfg.toast?.(S(e?.message)||'ذخیره انجام نشد؛ مقادیر فرم حفظ شد',true)}}
 finally{st.saving=false;lock(false)}}
// Desktop table (staff panel on a PC): every beverage of the day in one table, saved together. Same values, validation,
// conflict check, edit confirmation and server verification as the one-beverage form; rows the config's canEdit blocks
// (older saved lines) are read-only. Roles are only set automatically (autoRoles): whoever changes a morning / night
// count becomes that day's morning / night counter.
const TB_COLS=[['morningUpper','صبح بالا'],['morningLower','صبح پایین'],['inflow','ورودی روز'],['nonSale','خروج غیر فروش'],['nightUpper','شب بالا'],['nightLower','شب پایین'],['sales','فروش']];
const tb={date:'',seq:0,loading:false,saving:false,doc:null,base:null,cfg:null};
function tbItems(){return A(tb.cfg?.items?.())}
function tbCss(){if(typeof document==='undefined'||!document.head||$('rbtStyle'))return;const s=document.createElement('style');s.id='rbtStyle';s.textContent='.rbt-head{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end}.rbt-head .field{min-width:180px}.rbt .table-wrap{overflow-x:auto}.rbt-table th,.rbt-table td{padding:5px 4px;text-align:center;white-space:nowrap;vertical-align:middle}.rbt-table td:first-child,.rbt-table th:first-child{text-align:right;white-space:normal;min-width:150px}.rbt-table td:first-child small{display:block;color:var(--muted,#667085);font-size:11px;font-weight:400}.rbt-in{width:60px;min-width:0;min-height:36px;padding:4px;text-align:center;font:inherit;box-sizing:border-box}.rbt-text{width:112px;min-height:36px;padding:4px 6px;font:inherit;box-sizing:border-box}.rbt-table [data-rbt-out],.rbt-table [data-rbt-total]{min-width:60px;font-weight:700}.rbt-table [data-tone=bad]{color:#b42318}.rbt-table [data-tone=good]{color:#067647}.rbt-table [data-tone=na]{color:var(--muted,#667085);font-weight:400;font-size:12px}.rbt-table tr[data-locked=true] td{background:var(--bg-soft,#f6f7f9)}.rbt-table [aria-invalid=true]{border-color:#b42318!important;outline-color:#b42318}.rbt .rbc-save{width:auto;min-width:220px;margin-top:10px;justify-self:start}';document.head.appendChild(s)}
function tbRowHtml(it,i){return `<tr data-rbt-row="${i}" data-rbt-item="${E(it.id)}"><td><b>${E(it.name)}</b><small data-rbt-who></small></td>${TB_COLS.map(([f,l])=>`<td><input class="rbt-in" data-rbt-f="${f}" inputmode="numeric" autocomplete="off" aria-label="${E(it.name)} ${E(l)}" oninput="RayoBeverageControl.table.recalc(${i})"></td>`).join('')}<td data-rbt-out="expectedNight" data-tone="na">—</td><td data-rbt-out="daily" data-tone="na">—</td><td data-rbt-out="overnight" data-tone="na">—</td><td><input class="rbt-text" data-rbt-f="nonSaleReason" autocomplete="off" placeholder="علت خروج غیر فروش" aria-label="${E(it.name)} علت خروج غیر فروش" oninput="RayoBeverageControl.table.recalc(${i})"></td><td><input class="rbt-text" data-rbt-f="varianceNote" autocomplete="off" placeholder="توضیح مغایرت" aria-label="${E(it.name)} توضیح مغایرت"></td></tr>`}
function tableHtml(config){tb.cfg=config||{};css();tbCss();const t=today();tb.date=normDate(tb.cfg.date)&&normDate(tb.cfg.date)<=t?normDate(tb.cfg.date):(tb.date&&tb.date<=t?tb.date:t);tb.seq++;tb.doc=null;tb.base=null;tb.loading=false;tb.saving=false;setTimeout(()=>tableLoad(),0);
 return `<form class="card rbc rbt" id="rbtForm" novalidate onsubmit="event.preventDefault();RayoBeverageControl.table.save()">${tb.cfg.title?`<div class="section-head"><h2>${E(tb.cfg.title)}</h2></div>`:''}
 <div class="rbt-head"><div class="field"><label for="rbtDate">تاریخ *</label><input id="rbtDate" data-jalali="1" inputmode="numeric" value="${E(tb.date)}" onchange="RayoBeverageControl.table.setDate(this.value)"></div><p class="rbc-by">خانهٔ خالی یعنی «وارد نشده»؛ نبودِ کالا را «۰» بنویسید. ورودی روز = مجموع شارژ هر دو یخچال. ${tb.cfg.autoRoles?'نام شما برای مرحله‌ای که وارد می‌کنید (شمارش صبح یا شب) خودکار ثبت می‌شود.':''}</p></div>
 <p class="rbc-status" id="rbtStatus" role="status">در حال دریافت اطلاعات این تاریخ…</p>
 <fieldset id="rbtFields" class="rbc-fields" disabled><div class="table-wrap"><table class="data-table rbt-table" data-pagination="native"><thead><tr><th>نوشیدنی</th>${TB_COLS.map(([,l])=>`<th>${E(l)}</th>`).join('')}<th>مانده مورد انتظار شب</th><th>مغایرت روز<br><small>(+ کسری)</small></th><th>مغایرت شبانه<br><small>(− کاهش)</small></th><th>علت خروج</th><th>توضیح</th></tr></thead><tbody>${tbItems().map(tbRowHtml).join('')}</tbody><tfoot><tr><th colspan="${TB_COLS.length+2}">جمع ردیف‌های قابل محاسبه</th><th data-rbt-total="daily">—</th><th data-rbt-total="overnight">—</th><th colspan="2"></th></tr></tfoot></table></div>
 <button type="submit" class="btn btn-primary rbc-save" id="rbtSave">ذخیرهٔ همهٔ نوشیدنی‌ها</button></fieldset></form>`}
function tbStatus(text,tone=''){const el=$('rbtStatus');if(el){el.textContent=text;el.dataset.tone=tone}}
function tbRow(i){return document.querySelector(`[data-rbt-row="${i}"]`)}
function tbRaw(row){const raw={};row?.querySelectorAll('[data-rbt-f]').forEach(x=>raw[x.dataset.rbtF]=x.value);return raw}
function tbSet(cell,text,tone){if(cell){const na=text==='قابل محاسبه نیست';cell.textContent=na?'—':text;cell.title=na?text:'';cell.dataset.tone=tone}}
function tableRecalc(i){const row=tbRow(i),id=row?.dataset.rbtItem;if(!row||!tb.base||!tb.doc)return;const {values:v,invalid}=read(tbRaw(row));row.querySelectorAll('[data-rbt-f]').forEach(x=>x.setAttribute('aria-invalid',invalid.includes(x.dataset.rbtF)?'true':'false'));
 const out=k=>row.querySelector(`[data-rbt-out="${k}"]`);if(invalid.some(f=>COUNT_FIELDS.includes(f))){for(const k of ['expectedNight','daily','overnight'])tbSet(out(k),'نامعتبر','bad');out('daily').dataset.v='';out('overnight').dataset.v='';return tbTotals()}
 const m=metrics({...(tb.base[id]?.line||{}),...v,formulaVersion:FORMULA},prevLineOf(tb.doc,tb.date,id));
 tbSet(out('expectedNight'),m.expectedNight===null?'قابل محاسبه نیست':fa(m.expectedNight),m.expectedNight===null?'na':'');
 tbSet(out('daily'),m.daily===null?'قابل محاسبه نیست':signed(m.daily),m.daily===null?'na':m.daily>0?'bad':m.daily<0?'good':'');
 tbSet(out('overnight'),m.overnight===null?'قابل محاسبه نیست':signed(m.overnight),m.overnight===null?'na':m.overnight<0?'bad':m.overnight>0?'good':'');
 out('daily').dataset.v=m.daily===null?'':String(m.daily);out('overnight').dataset.v=m.overnight===null?'':String(m.overnight);tbTotals()}
function tbTotals(){for(const k of ['daily','overnight']){const vals=[...document.querySelectorAll(`[data-rbt-out="${k}"]`)].map(c=>c.dataset.v).filter(x=>x!==undefined&&x!==''),sum=vals.reduce((a,x)=>a+Number(x),0),c=document.querySelector(`[data-rbt-total="${k}"]`);if(c)tbSet(c,vals.length?signed(sum):'—',!vals.length?'na':k==='daily'?(sum>0?'bad':sum<0?'good':''):(sum<0?'bad':sum>0?'good':''))}}
async function tableLoad(){const seq=++tb.seq,date=tb.date,fields=$('rbtFields');tb.loading=true;tb.base=null;if(fields)fields.disabled=true;tbStatus(`در حال دریافت اطلاعات ثبت‌شدهٔ ${date}…`);
 try{const doc=await tb.cfg.load();if(seq!==tb.seq)return;tb.doc=doc;tb.cfg.onLoaded?.(doc);const record=recordOf(doc,date),base={};let locked=0,saved=0;
  tbItems().forEach((it,i)=>{const row=tbRow(i);if(!row)return;const line=lineOf(record,it.id),v=formValues(line),vals=values(line),block=S(tb.cfg.canEdit?.(date,!!line));base[it.id]={line,fp:fingerprint(line),block};if(line)saved++;if(block)locked++;
   row.querySelectorAll('[data-rbt-f]').forEach(x=>{const val=v[x.dataset.rbtF];x.value=val===null||val===undefined?'':String(val);x.disabled=!!block;x.removeAttribute('aria-invalid')});row.dataset.locked=block?'true':'false';
   const who=[vals.morningSplit===false?`صبح (تاریخی): ${fa(vals.morning)}`:byText(line?.morningCountedBy,'صبح'),vals.nightSplit===false?`شب (تاریخی): ${fa(vals.night)}`:byText(line?.nightCountedBy,'شب'),block?'فقط مدیر می‌تواند اصلاح کند':''].filter(Boolean).join(' | '),w=row.querySelector('[data-rbt-who]');if(w)w.textContent=who});
  tb.base=base;tbItems().forEach((_,i)=>tableRecalc(i));if(fields)fields.disabled=false;
  tbStatus(saved?`برای ${date} اطلاعات ${fa(saved)} نوشیدنی قبلاً ثبت شده و در جدول بارگذاری شد.${locked?' ردیف‌های خاکستری قفل است: اصلاح تاریخ‌های قبل از دیروز فقط توسط مدیر انجام می‌شود.':''}`:`اطلاعات ${date} هنوز ثبت نشده است. اعداد را وارد و «ذخیرهٔ همهٔ نوشیدنی‌ها» را بزنید.`,locked?'warn':'');window.RayoNumberUX?.scan?.($('rbtForm'))}
 catch(e){if(seq!==tb.seq)return;tb.doc=null;tbStatus(`دریافت اطلاعات انجام نشد؛ ثبت ممکن نیست. ${S(e?.message)}`,'error')}
 finally{if(seq===tb.seq)tb.loading=false}}
function tableSetDate(v){if(tb.saving)return;const d=normDate(v),el=$('rbtDate');if(!d||d>today()){if(el)el.value=tb.date;return tb.cfg?.toast?.(d?'تاریخ نمی‌تواند بعد از امروز باشد':'تاریخ شمسی معتبر وارد کنید',true)}tb.date=d;if(el)el.value=d;return tableLoad()}
async function tableSave(){if(tb.saving||tb.loading)return;const cfg=tb.cfg,base=tb.base;if(!base||!tb.doc)return cfg?.toast?.('اطلاعات این تاریخ هنوز بارگذاری نشده است',true);
 const errors=[],edits=[];tbItems().forEach((it,i)=>{const b=base[it.id];if(!b||b.block)return;const r=read(tbRaw(tbRow(i)));if(r.errors.length)errors.push(`«${it.name}»: ${r.errors.join('، ')}`);else if(changedFields(b.line,r.values).length)edits.push({it,values:r.values,b})});
 if(errors.length){tbStatus(errors.join('؛ '),'error');return cfg.toast?.(errors[0],true)}
 if(!edits.length)return cfg.toast?.(Object.values(base).some(b=>b.line)?'تغییری برای ذخیره وجود ندارد':'حداقل یک مقدار وارد کنید',true);
 const date=tb.date,fields=$('rbtFields'),btn=$('rbtSave');tb.saving=true;if(fields)fields.disabled=true;if(btn)btn.textContent='در حال ذخیره…';
 try{const edited=edits.filter(x=>x.b.line);if(edited.length&&!await (cfg.confirm||(m=>window.confirm(m)))(edited.length===1?EDIT_CONFIRM:`قبلاً اطلاعات این نوشیدنی‌ها را ثبت کرده‌اید: ${edited.map(x=>x.it.name).join('، ')}. مطمئن هستید می‌خواهید تغییرشان دهید؟`))return tbStatus('ذخیره لغو شد؛ مقادیر جدول حفظ شده است.','warn');
  tbStatus('در حال ذخیره…');const who=await cfg.actor(),doc=await cfg.load(),at=new Date().toISOString(),requestId=window.RAYO_API_GATEWAY?.createRequestId?.()||String(Date.now()),conflicts=[];
  let roles;if(cfg.autoRoles&&who?.personnelId){const cur=rolesOf(recordOf(doc,date)),self={personnelId:who.personnelId,name:who.name},ch=edits.flatMap(x=>changedFields(x.b.line,x.values)),auto={};if(ch.some(f=>f.startsWith('morning'))&&S(cur.morningCounter?.personnelId)!==self.personnelId)auto.morningCounter=self;if(ch.some(f=>f.startsWith('night'))&&S(cur.nightCounter?.personnelId)!==self.personnelId)auto.nightCounter=self;if(Object.keys(auto).length)roles=auto}
  for(const [n,x] of edits.entries()){try{applyEdit(doc,{date,item:x.it,values:x.values,actor:who,at,baseline:x.b.fp,recordId:`BEV-${requestId}`,roles:n===0?roles:undefined})}catch(e){if(e?.code!=='bev_conflict')throw e;conflicts.push(x.it.name);x.b.line=e.current;x.b.fp=fingerprint(e.current)}}
  if(conflicts.length){tbStatus(`اطلاعات ${conflicts.join('، ')} پس از بارگذاری جدول توسط کاربر دیگری تغییر کرده است. چیزی ذخیره نشد و مقادیر شما حفظ شد؛ برای جایگزینی، دوباره «ذخیره» را بزنید.`,'error');return cfg.toast?.('تغییر هم‌زمان؛ مقادیر جدول حفظ شد',true)}
  const ok=c=>edits.every(x=>savedMatches(c,date,x.it.id,x.values))&&(!roles||rolesMatch(c,date,roles));let checked=null;
  try{checked=await cfg.save(doc)}catch(e){if(!UNKNOWN_SAVE.includes(S(e?.code)))throw e;checked=await cfg.load().catch(()=>null);if(!checked||!ok(checked))throw e}
  if(!checked)checked=await cfg.load();if(!ok(checked))throw new Error('ذخیره روی سرور تأیید نشد؛ مقادیر جدول حفظ شد. دوباره تلاش کنید.');
  tb.doc=checked;cfg.onSaved?.(checked);cfg.toast?.(`اطلاعات ${fa(edits.length)} نوشیدنی برای ${date} ذخیره شد`);tb.saving=false;await tableLoad();tbStatus(`اطلاعات ${fa(edits.length)} نوشیدنی ذخیره شد.`,'ok')}
 catch(e){tbStatus(S(e?.message)||'ذخیره انجام نشد؛ مقادیر جدول حفظ شد.','error');cfg.toast?.(S(e?.message)||'ذخیره انجام نشد؛ مقادیر جدول حفظ شد',true)}
 finally{tb.saving=false;if(btn)btn.textContent='ذخیرهٔ همهٔ نوشیدنی‌ها';if(fields&&tb.base)fields.disabled=false}}
window.RayoBeverageControl={FORMULA,COUNT_FIELDS,TEXT_FIELDS,FIELDS,LABELS,ROLES,ROLE_KEYS,EDIT_CONFIRM,parseCount,read,values,formValues,metrics,changedFields,applyEdit,savedMatches,fingerprint,records,recordOf,lineOf,prevLineOf,rolesOf,changedRoles,rolesMatch,roleText,today,normDate,addDays,signed,dailyText,overnightText,atText,byText,
 form:{html,setDate,setItem,recalc,save,state:()=>({...st})},
 table:{html:tableHtml,setDate:tableSetDate,recalc:tableRecalc,save:tableSave,load:tableLoad,state:()=>({...tb})}};
})();
