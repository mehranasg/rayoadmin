(function(root){
'use strict';
/* Rayo attendance core: pure functions only (no DOM, no network), shared by the admin UI (51) and the node QA scripts.
   Data lives in the separate `attendance` module document (see docs/DATA_AND_API_REFERENCE.md):
   settings (single editable rules record), punches (raw, immutable, deduplicated by personnel + timestamp),
   importBatches, overrides and auditLog. Every rule value is read from settings; this file holds no schedule constants. */

const txt=v=>String(v??'').trim();
const pad=n=>String(n).padStart(2,'0');
const en=s=>String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const fa=s=>String(s??'').replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const normHeader=v=>txt(v).replace(/[‌‏‎]/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\sـ_\-\/\\()\[\]،,:؛.؟?!]/g,'').toLowerCase();
const isSerial=v=>!!v&&typeof v==='object'&&v.__serial!==undefined;
const isBlank=v=>v===null||v===undefined||(!(v instanceof Date)&&!isSerial(v)&&typeof v!=='number'&&/^[\s\-—–]*$/.test(String(v)));

/* ---------- Jalali calendar ---------- */
function g2j(gy,gm,gd){const g=[0,31,59,90,120,151,181,212,243,273,304,334],gy2=gm>2?gy+1:gy;let days=355666+365*gy+Math.floor((gy2+3)/4)-Math.floor((gy2+99)/100)+Math.floor((gy2+399)/400)+gd+g[gm-1],jy=-1595+33*Math.floor(days/12053);days%=12053;jy+=4*Math.floor(days/1461);days%=1461;if(days>365){jy+=Math.floor((days-1)/365);days=(days-1)%365}const jm=days<186?1+Math.floor(days/31):7+Math.floor((days-186)/30),jd=1+(days<186?days%31:(days-186)%30);return[jy,jm,jd]}
function j2g(jy,jm,jd){let gy=jy<=979?621:1600;jy-=jy<=979?0:979;let days=365*jy+Math.floor(jy/33)*8+Math.floor(((jy%33)+3)/4)+78+jd+(jm<7?(jm-1)*31:(jm-7)*30+186);gy+=400*Math.floor(days/146097);days%=146097;if(days>36524){days--;gy+=100*Math.floor(days/36524);days%=36524;if(days>=365)days++}gy+=4*Math.floor(days/1461);days%=1461;if(days>365){gy+=Math.floor((days-1)/365);days=(days-1)%365}let gd=days+1;const leap=(gy%4===0&&gy%100!==0)||gy%400===0,ml=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];let gm=0;while(gm<12&&gd>ml[gm]){gd-=ml[gm];gm++}return[gy,gm+1,gd]}
function jStr(y,m,d){return `${y}/${pad(m)}/${pad(d)}`}
function jParts(date){const m=txt(date).match(/^(\d{4})\/(\d{2})\/(\d{2})$/);return m?[+m[1],+m[2],+m[3]]:null}
/* A Jalali date is valid when it survives a round trip through the Gregorian calendar (handles 29/30 Esfand). */
function validJalali(y,m,d){if(!(y>=1300&&y<1500&&m>=1&&m<=12&&d>=1&&d<=31))return false;const [a,b,c]=g2j(...j2g(y,m,d));return a===y&&b===m&&c===d}
function dayNumber(date){const p=jParts(date);if(!p)return null;const [gy,gm,gd]=j2g(...p);return Math.round(Date.UTC(gy,gm-1,gd)/86400000)}
function fromDayNumber(n){const d=new Date(n*86400000);return jStr(...g2j(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate()))}
function addDays(date,days){const n=dayNumber(date);return n===null?'':fromDayNumber(n+days)}
const WEEKDAYS=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
/* 0 = Saturday … 6 = Friday (Iranian week). */
function weekdayIndex(date){const n=dayNumber(date);if(n===null)return -1;return (new Date(n*86400000).getUTCDay()+1)%7}
function weekdayName(date){const i=weekdayIndex(date);return i<0?'':WEEKDAYS[i]}
function monthLength(y,m){if(m<=6)return 31;if(m<=11)return 30;return validJalali(y,12,30)?30:29}
function monthDays(y,m){return Array.from({length:monthLength(+y,+m)},(_,i)=>jStr(+y,+m,i+1))}
/* Asia/Tehran offset: +03:30, with +04:30 daylight saving before its abolition in 1401 (2 Farvardin – 30 Shahrivar). */
function tehranOffset(date){const p=jParts(date);if(!p)return'+03:30';const [y,m,d]=p;return y<1401&&((m===1&&d>=2)||(m>1&&m<6)||(m===6&&d<=30))?'+04:30':'+03:30'}
function isoTimestamp(date,time){const p=jParts(date);if(!p)return'';const [gy,gm,gd]=j2g(...p);return `${gy}-${pad(gm)}-${pad(gd)}T${time}${tehranOffset(date)}`}

/* ---------- Clock values ---------- */
function minOf(hhmm){const m=txt(hhmm).match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);if(!m)return null;const h=+m[1],mi=+m[2];return h<=23&&mi<=59?h*60+mi:null}
function hhmm(min){const v=((Math.round(min)%1440)+1440)%1440;return `${pad(Math.floor(v/60))}:${pad(v%60)}`}
/* Excel serial (days since 1899-12-30) read in UTC so the browser timezone cannot shift it. */
function serialDate(v){const d=new Date(Math.round((Number(v)-25569)*86400000));return{y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()}}
function serialSeconds(v){const f=Number(v)-Math.floor(Number(v));return Math.round(f*86400)%86400}
/* → 'HH:MM:SS' or '' (text with Persian/Arabic/ASCII digits, HH:MM or HH:MM:SS, Excel time fraction or Date). */
function parseClock(v){
 if(isBlank(v))return'';
 let sec=null;
 if(isSerial(v))sec=serialSeconds(v.__serial);
 else if(v instanceof Date&&!isNaN(v))sec=v.getHours()*3600+v.getMinutes()*60+v.getSeconds();
 else if(typeof v==='number'){if(!(v>=0&&v<1))return'';sec=Math.round(v*86400)%86400}
 else{const m=en(txt(v)).match(/^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?$/);if(!m)return'';const h=+m[1],mi=+m[2],s=+(m[3]||0);if(h>23||mi>59||s>59)return'';sec=h*3600+mi*60+s}
 return `${pad(Math.floor(sec/3600))}:${pad(Math.floor(sec%3600/60))}:${pad(sec%60)}`;
}
const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
/* → Jalali 'YYYY/MM/DD' or ''. Text is Jalali (YYYY/MM/DD or «۵ آبان ۱۴۰۵»); a Gregorian year or an Excel date value is converted. */
function parseDate(v){
 if(isBlank(v))return'';
 const fromG=(y,m,d)=>{const [a,b,c]=g2j(y,m,d);return jStr(a,b,c)};
 if(isSerial(v)){if(Number(v.__serial)<1)return'';const p=serialDate(v.__serial);return fromG(p.y,p.m,p.d)}
 if(v instanceof Date&&!isNaN(v))return fromG(v.getFullYear(),v.getMonth()+1,v.getDate());
 if(typeof v==='number'){if(v>20000&&v<80000){const p=serialDate(v);return fromG(p.y,p.m,p.d)}return''}
 const s=en(txt(v)).replace(/ي/g,'ی').replace(/ك/g,'ک');
 let m=s.match(/^(\d{4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,2})$/);
 if(m){const y=+m[1],mo=+m[2],d=+m[3];if(y>=1900&&y<2200){const dt=new Date(Date.UTC(y,mo-1,d));return dt.getUTCMonth()===mo-1&&dt.getUTCDate()===d?fromG(y,mo,d):''}return validJalali(y,mo,d)?jStr(y,mo,d):''}
 m=s.match(/^(\d{1,2})\s+([^\d\s]+)\s+(\d{4})$/);
 if(m){const mo=MONTHS.indexOf(m[2].replace(/‌/g,''))+1,y=+m[3],d=+m[1];return mo&&validJalali(y,mo,d)?jStr(y,mo,d):''}
 return'';
}
function parseCode(v){if(isBlank(v))return'';if(typeof v==='number'&&Number.isFinite(v))return String(v);if(v instanceof Date||isSerial(v))return'';return en(txt(v)).replace(/\.0+$/,'')}
function parseType(v){const s=txt(v).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\s‌\/_\-]/g,'').toLowerCase();if(['ورود','in','checkin','cin','entry'].includes(s))return'in';if(['خروج','out','checkout','cout','exit'].includes(s))return'out';return''}

/* ---------- Business day ---------- */
/* Punches before the cutoff belong to the previous business day; the business day's weekday picks the schedule row. */
function businessDate(date,time,settings){const cut=minOf(settings?.businessDayCutoff),t=minOf(time);if(cut===null||t===null||!jParts(date))return'';return t<cut?addDays(date,-1):date}

/* ---------- Settings validation ---------- */
const WINDOW_KEYS=[['morning','بازه‌ی صبح (فقط ورود)'],['midday','بازه‌ی میانه (ورود و خروج)'],['night','بازه‌ی شب (فقط خروج)']];
function inWindow(min,w){const a=minOf(w?.from),b=minOf(w?.to);if(a===null||b===null||min===null)return false;return a<b?min>=a&&min<b:min>=a||min<b}
const isInt=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
/* Returns a list of Persian error messages; empty = valid. */
function validateSettings(s){
 const errors=[],t=(v,label)=>{if(minOf(v)===null){errors.push(`${label}: ساعت معتبر (HH:MM) وارد کنید`);return false}return true};
 if(!s||typeof s!=='object')return['تنظیمات حضور و غیاب تعریف نشده است'];
 const cutOk=t(s.businessDayCutoff,'مرز روز کاری');
 if(!isInt(s.standardRestMin,0,600))errors.push('مدت استراحت استاندارد باید عدد صحیح بین ۰ تا ۶۰۰ دقیقه باشد');
 if(!isInt(s.sameTypeMergeWindowMin,0,240))errors.push('بازه‌ی ادغام ترددهای هم‌نوع باید عدد صحیح بین ۰ تا ۲۴۰ دقیقه باشد');
 if(!isInt(s.oppositeTypeMergeWindowMin,0,60))errors.push('بازه‌ی ادغام ورود و خروج پشت سر هم باید عدد صحیح بین ۰ تا ۶۰ دقیقه باشد');
 if(!['full','excess'].includes(s.toleranceMode))errors.push('نحوه‌ی محاسبه‌ی تأخیر باید «کامل» یا «مازاد بر تلورانس» باشد');
 if(!['standard','worst_case'].includes(s.restFillMode))errors.push('نحوه‌ی تکمیل استراحت باید «استاندارد» یا «بدبینانه» باشد');
 for(const k of ['earlyArrivalCountsAsOvertime','overtimeRequiresApproval'])if(typeof s[k]!=='boolean')errors.push(`مقدار «${k==='earlyArrivalCountsAsOvertime'?'زودآمدن اضافه‌کار حساب شود':'اضافه‌کار نیاز به تأیید دارد'}» باید بله/خیر باشد`);
 const w=s.windows||{};let windowsOk=true;
 for(const [k,label] of WINDOW_KEYS){const a=t(w[k]?.from,`${label} — شروع`),b=t(w[k]?.to,`${label} — پایان`);if(!a||!b)windowsOk=false;else if(minOf(w[k].from)===minOf(w[k].to)){errors.push(`${label}: شروع و پایان نمی‌توانند یکی باشند`);windowsOk=false}}
 if(windowsOk){
  const cover=new Array(1440).fill(0);for(const [k] of WINDOW_KEYS)for(let i=0;i<1440;i++)if(inWindow(i,w[k]))cover[i]++;
  const gap=cover.findIndex(c=>c===0),overlap=cover.findIndex(c=>c>1);
  if(gap>=0)errors.push(`سه بازه‌ی صبح، میانه و شب باید کل ۲۴ ساعت را پوشش دهند؛ ساعت ${fa(hhmm(gap))} در هیچ بازه‌ای نیست`);
  if(overlap>=0)errors.push(`بازه‌های صبح، میانه و شب نباید هم‌پوشانی داشته باشند؛ ساعت ${fa(hhmm(overlap))} در بیش از یک بازه است`);
  if(cutOk&&minOf(s.businessDayCutoff)!==minOf(w.night?.to))errors.push('مرز روز کاری باید با پایان بازه‌ی شب یکی باشد تا خروج شب همیشه جزو همان روز کاری شود');
 }
 const rows=Array.isArray(s.weekly)?s.weekly:[];
 if(rows.length!==7||WEEKDAYS.some((_,i)=>!rows.some(r=>r&&r.weekday===i)))errors.push('برنامه‌ی هفتگی باید دقیقاً یک ردیف برای هر روز هفته (شنبه تا جمعه) داشته باشد');
 for(const r of rows){
  const day=WEEKDAYS[r?.weekday]||'روز نامعتبر',chk=(key,label,win,winLabel)=>{if(t(r[key],`${day} — ${label}`)&&win&&windowsOk&&!inWindow(minOf(r[key]),w[win]))errors.push(`${day} — ${label} (${fa(r[key])}) باید داخل ${winLabel} باشد`)};
  chk('morningArrival','حضور الزامی صبح','morning','بازه‌ی صبح');
  chk('opening','ساعت بازگشایی');
  chk('morningEnd','پایان شیفت صبح','midday','بازه‌ی میانه');
  chk('eveningStart','شروع شیفت عصر','midday','بازه‌ی میانه');
  chk('eveningEnd','پایان شیفت عصر','night','بازه‌ی شب');
  if(!isInt(r.morningLateToleranceMin,0,180))errors.push(`${day} — تلورانس تأخیر صبح باید عدد صحیح بین ۰ تا ۱۸۰ دقیقه باشد`);
  if(!isInt(r.eveningLateToleranceMin,0,180))errors.push(`${day} — تلورانس تأخیر عصر باید عدد صحیح بین ۰ تا ۱۸۰ دقیقه باشد`);
 }
 return errors;
}
function scheduleFor(date,settings){const i=weekdayIndex(date);return (settings?.weekly||[]).find(r=>r&&r.weekday===i)||null}

/* ---------- File parsing: adapters ---------- */
/* Each adapter: {id,label,detect(headerCells)→{score,cols,missing}|null,parseRows(rows,headerRow,cols)→{candidates,rejected,ignored}}.
   A candidate is one punch: {row,code,name,date,time,type,method,deviceCode}. Row numbers are 1-based sheet rows. */
function locate(headers,spec){const hs=headers.map(normHeader),cols={},missing=[];for(const [key,{names,required}] of Object.entries(spec)){const i=hs.findIndex(h=>names.some(n=>h===normHeader(n)));if(i>=0)cols[key]=i;else if(required)missing.push(names[0])}return{cols,missing}}
const PUNCH_SPEC={code:{names:['کد پرسنلی','کد پرسنل'],required:true},name:{names:['نام و نام خانوادگی','نام'],required:true},date:{names:['تاریخ'],required:true},time:{names:['ساعت'],required:true},type:{names:['نوع تردد'],required:true},method:{names:['روش ثبت'],required:true},deviceCode:{names:['کد دستگاه'],required:false}};
const punchAdapter={
 id:'rayo-punch-v1',label:'قالب رایو (هر ردیف یک تردد)',
 detect(headers){const {cols,missing}=locate(headers,PUNCH_SPEC);const found=Object.keys(cols).length;return found>=3?{score:found*10-missing.length,cols,missing}:null},
 parseRows(rows,headerRow,cols){
  const candidates=[],rejected=[],ignored={empty:0,noCode:0};
  rows.slice(headerRow+1).forEach((row,i)=>{
   const n=headerRow+2+i,get=k=>cols[k]===undefined?'':(row||[])[cols[k]];
   if(!(row||[]).some(v=>!isBlank(v))){ignored.empty++;return}
   const code=parseCode(get('code'));if(!code){ignored.noCode++;return}
   const reasons=[],rawDate=get('date'),rawTime=get('time'),date=parseDate(rawDate),time=parseClock(rawTime),type=parseType(get('type')),method=txt(get('method')),name=txt(get('name'));
   if(!name)reasons.push('نام و نام خانوادگی خالی است');
   if(!date)reasons.push(isBlank(rawDate)?'تاریخ خالی است':`تاریخ «${txt(rawDate)}» معتبر نیست (قالب YYYY/MM/DD شمسی)`);
   if(!time)reasons.push(isBlank(rawTime)?'ساعت خالی است':`ساعت «${txt(rawTime)}» معتبر نیست (قالب HH:MM:SS)`);
   if(!type)reasons.push(`نوع تردد «${txt(get('type'))}» باید «ورود» یا «خروج» باشد`);
   if(!method)reasons.push('روش ثبت خالی است');
   if(reasons.length){rejected.push({row:n,code,name,reason:reasons.join('؛ ')});return}
   candidates.push({row:n,code,name,date,time,type,method,deviceCode:txt(get('deviceCode'))});
  });
  return{candidates,rejected,ignored};
 }
};
/* Vendor's current export: paired rows «کارمند | تاریخ | ورود | خروج | کارکرد | ثبت», month-name dates, «—» for empty
   and a trailing «جمع» row. Each pair is exploded into separate punches; an exit earlier than its entry is next calendar day. */
const PAIRED_SPEC={employee:{names:['کارمند','پرسنل'],required:true},date:{names:['تاریخ'],required:true},in:{names:['ورود'],required:true},out:{names:['خروج'],required:true},worked:{names:['کارکرد'],required:false},method:{names:['ثبت','روش ثبت'],required:false}};
function splitEmployee(v){const s=en(txt(v));let m=s.match(/^(\d+)$/);if(m)return{code:m[1],name:''};m=s.match(/^(.*?)[\s\-–]*[(\[](\d+)[)\]]\s*$/)||s.match(/^(\d+)\s*[\-–:]\s*(.+)$/);if(m)return /^\d+$/.test(m[1])?{code:m[1],name:txt(m[2])}:{code:m[2],name:txt(m[1])};return{code:s?`name:${s}`:'',name:s}}
const pairedAdapter={
 id:'vendor-paired-v1',label:'خروجی فعلی دستگاه (ورود و خروج در یک ردیف)',
 detect(headers){const {cols,missing}=locate(headers,PAIRED_SPEC);if(cols.in===undefined||cols.out===undefined||cols.employee===undefined)return null;return{score:Object.keys(cols).length*10-missing.length,cols,missing}},
 parseRows(rows,headerRow,cols){
  const candidates=[],rejected=[],ignored={empty:0,noCode:0,total:0,noPunch:0};
  rows.slice(headerRow+1).forEach((row,i)=>{
   const n=headerRow+2+i,get=k=>cols[k]===undefined?'':(row||[])[cols[k]];
   if(!(row||[]).some(v=>!isBlank(v))){ignored.empty++;return}
   if((row||[]).some(v=>normHeader(v)==='جمع')){ignored.total++;return}
   const emp=splitEmployee(get('employee'));if(!emp.code){ignored.noCode++;return}
   const date=parseDate(get('date')),tin=parseClock(get('in')),tout=parseClock(get('out')),method=txt(get('method'))||'نامشخص',reasons=[];
   if(!date)reasons.push(isBlank(get('date'))?'تاریخ خالی است':`تاریخ «${txt(get('date'))}» معتبر نیست`);
   if(!isBlank(get('in'))&&!tin)reasons.push(`ساعت ورود «${txt(get('in'))}» معتبر نیست`);
   if(!isBlank(get('out'))&&!tout)reasons.push(`ساعت خروج «${txt(get('out'))}» معتبر نیست`);
   if(reasons.length){rejected.push({row:n,code:emp.code,name:emp.name,reason:reasons.join('؛ ')});return}
   if(!tin&&!tout){ignored.noPunch++;return}
   const base={row:n,code:emp.code,name:emp.name,method,deviceCode:''};
   if(tin)candidates.push({...base,date,time:tin,type:'in'});
   if(tout)candidates.push({...base,date:tin&&tout<tin?addDays(date,1):date,time:tout,type:'out'});
  });
  return{candidates,rejected,ignored};
 }
};
const ADAPTERS=[punchAdapter,pairedAdapter];
/* Picks the best adapter/header row over the first rows of every sheet. sheets: [{name,rows}] → parse result. */
function parseSheets(sheets){
 let best=null;
 for(const sheet of sheets||[])for(let r=0;r<Math.min(20,(sheet.rows||[]).length);r++)for(const a of ADAPTERS){const d=a.detect((sheet.rows[r]||[]).map(v=>typeof v==='string'||typeof v==='number'?String(v):''));if(d&&(!best||d.score>best.score))best={...d,adapter:a,sheet,headerRow:r}}
 if(!best)throw new Error('ستون‌های فایل شناخته نشد. سطر اول باید سرستون‌های «کد پرسنلی، نام و نام خانوادگی، تاریخ، ساعت، نوع تردد، روش ثبت» را داشته باشد.');
 if(best.missing.length)throw new Error(`ستون‌های الزامی در فایل پیدا نشد: ${best.missing.join('، ')}`);
 const out=best.adapter.parseRows(best.sheet.rows,best.headerRow,best.cols);
 return{adapter:best.adapter.id,adapterLabel:best.adapter.label,sheetName:best.sheet.name||'',headerRow:best.headerRow+1,rowsRead:Math.max(0,best.sheet.rows.length-best.headerRow-1),...out};
}
/* RFC-4180 style CSV (quoted fields, doubled quotes, BOM). */
function parseCsv(text){const s=String(text||'').replace(/^﻿/,''),rows=[];let row=[],cell='',q=false;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='"'){if(s[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c}else if(c==='"')q=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}else cell+=c}if(cell!==''||row.length){row.push(cell);rows.push(row)}return rows}
/* SheetJS worksheet → rows of cells; date/time-formatted numbers become {__serial} so parseDate/parseClock read them exactly. */
function sheetRows(XLSX,ws){const ref=ws&&ws['!ref'];if(!ref)return[];const R=XLSX.utils.decode_range(ref),out=[];for(let r=R.s.r;r<=R.e.r;r++){const row=[];for(let c=R.s.c;c<=R.e.c;c++){const cell=ws[XLSX.utils.encode_cell({r,c})];if(!cell)row.push('');else if(cell.t==='n'&&cell.z&&XLSX.SSF?.is_date?.(cell.z))row.push({__serial:cell.v});else if(cell.t==='d'&&cell.v instanceof Date)row.push(cell.v);else if(cell.t==='n')row.push(cell.v);else row.push(String(cell.w??cell.v??''))}out.push(row)}return out}

/* ---------- Import planning ---------- */
const punchKey=(personnelId,date,time)=>`${personnelId}|${date} ${time}`;
function codeIndex(personnel){const map=new Map();for(const p of personnel||[]){const c=parseCode(p?.attendanceCode);if(c&&!map.has(c))map.set(c,p.id)}return map}
/* Unknown codes with a suggested match: legacy device map (hr settings.attendanceDeviceMap), else exact name. Suggestions are never saved without admin confirmation. */
function unknownCodes(candidates,personnel,legacyMap={}){
 const known=codeIndex(personnel),groups=new Map(),nameKey=v=>normHeader(v);
 for(const c of candidates){if(known.has(c.code))continue;let g=groups.get(c.code);if(!g){g={code:c.code,name:c.name,rows:0,suggestion:''};groups.set(c.code,g)}g.rows++;if(!g.name&&c.name)g.name=c.name}
 for(const g of groups.values()){const legacy=legacyMap?.[g.code];const byLegacy=legacy&&(personnel||[]).find(p=>p.id===legacy&&!parseCode(p.attendanceCode));const byName=(personnel||[]).filter(p=>!parseCode(p.attendanceCode)&&nameKey(p.name)&&nameKey(p.name)===nameKey(g.name));g.suggestion=byLegacy?byLegacy.id:byName.length===1?byName[0].id:''}
 return[...groups.values()].sort((a,b)=>a.code.localeCompare(b.code,'en',{numeric:true}));
}
/* mapping: {code → personnelId | '' (skip)}. Returns what a confirm would write, without changing anything. */
function planImport({parsed,existingPunches=[],personnel=[],mapping={},settings}){
 const known=codeIndex(personnel),seen=new Set((existingPunches||[]).map(p=>punchKey(p.personnelId,p.date,p.time))),fresh=[],duplicates=[],unmapped=[],affected=new Map();
 for(const c of parsed.candidates||[]){
  const pid=known.get(c.code)||txt(mapping[c.code]);
  if(!pid){unmapped.push(c);continue}
  const key=punchKey(pid,c.date,c.time);
  if(seen.has(key)){duplicates.push({...c,personnelId:pid});continue}
  seen.add(key);
  const bd=businessDate(c.date,c.time,settings);
  fresh.push({...c,personnelId:pid,businessDate:bd});
  affected.set(`${pid}|${bd}`,{personnelId:pid,businessDate:bd});
 }
 const dates=fresh.map(p=>p.date).sort(),bds=fresh.map(p=>p.businessDate).sort();
 return{fresh,duplicates,unmapped,affectedDays:[...affected.values()].sort((a,b)=>a.businessDate.localeCompare(b.businessDate)||a.personnelId.localeCompare(b.personnelId)),dateRange:dates.length?{from:dates[0],to:dates[dates.length-1]}:null,businessRange:bds.length?{from:bds[0],to:bds[bds.length-1]}:null};
}
function nextSeq(rows,prefix){let mx=0;for(const r of rows||[]){const m=String(r?.id||'').match(new RegExp(`^${prefix}-(\\d+)$`));if(m)mx=Math.max(mx,+m[1])}return mx}
/* Appends the planned punches and one import batch to a copy of the module document. Existing punches are never changed. */
function applyImport(doc,plan,{parsed,fileName='',user='',at=new Date().toISOString()}={}){
 const out={...doc,punches:[...(doc.punches||[])],importBatches:[...(doc.importBatches||[])]};
 const batchId=`ATB-${String(nextSeq(out.importBatches,'ATB')+1).padStart(5,'0')}`;let seq=nextSeq(out.punches,'ATP');
 for(const p of plan.fresh)out.punches.push({id:`ATP-${String(++seq).padStart(7,'0')}`,personnelId:p.personnelId,code:p.code,date:p.date,time:p.time,ts:isoTimestamp(p.date,p.time),businessDate:p.businessDate,type:p.type,method:p.method,deviceCode:p.deviceCode||'',batchId,row:p.row});
 out.importBatches.push({id:batchId,fileName,adapter:parsed?.adapter||'',sheetName:parsed?.sheetName||'',importedAt:at,importedBy:user,rowsRead:parsed?.rowsRead||0,newCount:plan.fresh.length,duplicateCount:plan.duplicates.length,unmappedCount:plan.unmapped.length,rejected:(parsed?.rejected||[]).map(r=>({row:r.row,code:r.code||'',reason:r.reason})),ignored:parsed?.ignored||{},dateRange:plan.dateRange,businessRange:plan.businessRange,affectedDays:plan.affectedDays});
 return{doc:out,batchId};
}
function punchesFor(punches,personnelId,bd){return (punches||[]).filter(p=>p.personnelId===personnelId&&p.businessDate===bd).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))}

/* ---------- Calculation engine ---------- */
/* One employee + one business day → one attendance day. Days are derived on read from raw punches + overrides + settings;
   nothing here writes data. All durations are integer minutes; punch seconds are dropped (08:25:59 → 08:25).
   Times live on the business day's timeline: minutes from 00:00 of the business date, so a 01:00 exit on the next
   calendar date is 1500 and Thursday's 01:00 evening end is compared as 1500 too.
   Override (manager layer, never changes punches): {deletedPunchIds[], addedPunches[{id,time,type}], slots{s1..s4: 'HH:MM' | '' (clear)},
   status, note, overtime{decision:'approve'|'partial'|'reject', minutes, note}}. */
const SLOTS=['s1','s2','s3','s4'];
const SHIFT_LABELS={morning:'تک‌شیفت صبح',evening:'تک‌شیفت عصر',double:'دوشیفت',none:'بدون تردد'};
const STATUS_LABELS={present:'حاضر',absent:'غیبت',leave_entitled:'مرخصی استحقاقی',leave_sick:'مرخصی استعلاجی',off:'آف',undetermined:'تعیین‌نشده'};
const SOURCE_LABELS={actual:'ثبت دستگاه',merged:'ادغام‌شده',worst_case:'بدبینانه',rest_rule:'قانون استراحت',manual:'اصلاح مدیر'};
const SLOT_LABELS={s1:'ورود صبح',s2:'خروج صبح',s3:'ورود عصر',s4:'خروج عصر'};
/* Shift detected from the slots present (key = present slots) → which slots are filled and how. */
const SHIFT_TABLE={
 's1s2':['morning',{}],'s3s4':['evening',{}],'s1s2s3s4':['double',{}],
 's1':['morning',{s2:'worst'}],'s2':['morning',{s1:'worst'}],'s3':['evening',{s4:'worst'}],'s4':['evening',{s3:'worst'}],
 's1s2s3':['double',{s4:'worst'}],'s2s3s4':['double',{s1:'worst'}],
 's1s3s4':['double',{s2:'rest'}],'s1s2s4':['double',{s3:'rest'}],'s1s4':['double',{s2:'rest',s3:'rest'}],'':['none',{}]
};
const faHM=min=>{if(min===null||min===undefined)return'—';const v=Math.round(min),a=Math.abs(v);return fa(`${v<0?'-':''}${Math.floor(a/60)}:${pad(a%60)}`)};
const faClock=t=>t===null||t===undefined?'نامشخص':fa(hhmm(t));
function secondsOf(time){const m=txt(time).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);return m?(+m[1])*3600+(+m[2])*60+(+(m[3]||0)):null}
function lateness(entry,required,tol,mode){const d=entry-required;if(d<=tol)return 0;return mode==='excess'?d-tol:d}
function computeDay({personnelId='',businessDate,punches=[],settings,override=null}){
 const s=settings||{},sch=scheduleFor(businessDate,s),bdn=dayNumber(businessDate),cut=minOf(s.businessDayCutoff);
 if(!sch||bdn===null||cut===null)throw new Error(`برنامهٔ حضور و غیاب برای روز ${fa(businessDate)} معتبر نیست؛ تنظیمات را بررسی کنید`);
 const tl=c=>{const m=minOf(c);return m===null?null:m<cut?m+1440:m};
 const ov=override||{},deleted=new Set(ov.deletedPunchIds||[]),explain=[],flags={hasAutoFill:false,needsReview:false,hasPendingOvertime:false,manuallyEdited:false};
 /* 1) raw punches (minus deleted, plus manager-added) on the business-day timeline, sorted to the second */
 const list=[];
 for(const p of punches||[]){if(deleted.has(p.id))continue;const sec=secondsOf(p.time),dn=dayNumber(p.date);if(sec===null||dn===null)continue;list.push({ids:[p.id],type:p.type,ts:(dn-bdn)*86400+sec,manual:false})}
 for(const p of ov.addedPunches||[]){const t=tl(p.time);if(t===null)continue;list.push({ids:[p.id],type:p.type,ts:t*60,manual:true})}
 list.sort((a,b)=>a.ts-b.ts);
 /* 2) merge consecutive punches in the employee's favor */
 const sameWin=(s.sameTypeMergeWindowMin||0)*60,oppWin=(s.oppositeTypeMergeWindowMin||0)*60,groups=[];
 for(const p of list){
  const g=groups[groups.length-1];
  if(g&&g.type===p.type&&g.type!=='unknown'&&p.ts-g.lastTs<=sameWin){g.members.push(p);g.lastTs=p.ts;g.kind='same';continue}
  if(g&&g.members.length===1&&g.type!=='unknown'&&p.type!==g.type&&p.ts-g.lastTs<=oppWin){g.members.push(p);g.lastTs=p.ts;g.type='unknown';g.kind='opposite';continue}
  groups.push({type:p.type,members:[p],lastTs:p.ts,kind:''});
 }
 for(const g of groups){
  const rep=g.type==='out'?g.members[g.members.length-1]:g.members[0];g.t=Math.floor(rep.ts/60);g.ids=g.members.flatMap(m=>m.ids);g.manual=g.members.some(m=>m.manual);
  if(g.kind==='same')explain.push({kind:'merge_same',text:`چند ${g.type==='in'?'ورود':'خروج'} پشت سر هم ثبت شده بود؛ به نفع شما ${g.type==='in'?'زودترین ورود':'دیرترین خروج'} (${faClock(g.t)}) مبنا قرار گرفت.`});
  if(g.kind==='opposite')explain.push({kind:'merge_opposite',text:`یک ورود و خروج در فاصله‌ی کمتر از ${fa(s.oppositeTypeMergeWindowMin)} دقیقه ثبت شده بود و یک تردد حساب شد.`});
 }
 /* 3) slots: the window decides; the pressed button only breaks a tie in the midday window */
 const clock=t=>((t%1440)+1440)%1440,w=s.windows||{},inW=(g,k)=>inWindow(clock(g.t),w[k]);
 const morning=groups.filter(g=>inW(g,'morning')),midday=groups.filter(g=>inW(g,'midday')),night=groups.filter(g=>inW(g,'night'));
 let review=false;const slot={};
 const put=(k,g)=>{slot[k]={t:g.t,source:g.manual?'manual':g.members.length>1?'merged':'actual',punchIds:g.ids}};
 if(morning.length){put('s1',morning[0]);if(morning.length>1)review=true}
 if(night.length){put('s4',night[night.length-1]);if(night.length>1)review=true}
 if(midday.length===1){const g=midday[0];if(slot.s1&&slot.s4)put(g.type==='in'?'s3':'s2',g);else if(slot.s1)put('s2',g);else put(g.type==='out'?'s2':'s3',g)}
 else if(midday.length>=2){put('s2',midday[0]);put('s3',midday[midday.length-1]);if(midday.length>2)review=true}
 /* 4) manager slot overrides */
 const slotEdits=Object.entries(ov.slots||{}).filter(([k])=>SLOTS.includes(k));
 for(const [k,v] of slotEdits){if(txt(v)===''){delete slot[k];continue}const t=tl(v);if(t!==null)slot[k]={t,source:'manual',punchIds:[]}}
 flags.manuallyEdited=slotEdits.length>0||deleted.size>0||(ov.addedPunches||[]).length>0||!!ov.status;
 /* 5) shift inference and filling */
 const key=SLOTS.filter(k=>slot[k]).join(''),[shift,fills]=SHIFT_TABLE[key];
 const W={morningEnd:tl(w.morning?.to),middayStart:tl(w.midday?.from),middayEnd:tl(w.midday?.to),nightStart:tl(w.night?.from)},std=s.standardRestMin||0;
 const shiftWord=k=>shift==='double'?(k==='s1'||k==='s2'?'صبح':'عصر'):shift==='morning'?'صبح':'عصر';
 const worst=k=>{
  let t;if(k==='s1')t=Math.min(W.morningEnd,slot.s2.t);
  else if(k==='s3')t=Math.min(W.middayEnd,slot.s4.t);
  else if(k==='s2')t=Math.max(W.middayStart,slot.s1.t);
  else t=Math.max(W.nightStart,(slot.s3||slot.s2||slot.s1).t);
  slot[k]={t,source:'worst_case',punchIds:[]};const entry=k==='s1'||k==='s3';
  explain.push(entry?{kind:'fill_entry',text:`ورود ${shiftWord(k)} ثبت نشده بود. چون ساعت واقعی ورود مشخص نیست، طبق قانون رستوران دیرترین ساعت ممکن (${faClock(t)}) در نظر گرفته شد تا ثبت نکردن تردد به نفع کسی تمام نشود. اگر زودتر آمده‌اید، به مدیر اطلاع دهید تا اصلاح شود.`}:{kind:'fill_exit',text:`خروج ${shiftWord(k)} ثبت نشده بود. چون ساعت واقعی خروج مشخص نیست، طبق قانون رستوران زودترین ساعت ممکن (${faClock(t)}) در نظر گرفته شد تا ثبت نکردن تردد به نفع کسی تمام نشود. اگر دیرتر رفته‌اید، به مدیر اطلاع دهید تا اصلاح شود.`});
 };
 for(const k of ['s1','s2','s3','s4'])if(fills[k]==='worst')worst(k);
 let restUnknown=false;
 if(fills.s2==='rest'||fills.s3==='rest'){
  const restLabel={s2:'خروج برای استراحت',s3:'برگشت از استراحت'};
  if(s.restFillMode==='worst_case'){
   if(fills.s2){const t=Math.min(Math.max(W.middayStart,slot.s1.t),(slot.s3||slot.s4).t);slot.s2={t,source:'rest_rule',punchIds:[]};explain.push({kind:'fill_rest',text:`${restLabel.s2} ثبت نشده بود و طبق قانون رستوران بدبینانه‌ترین ساعت ممکن (${faClock(t)}) در نظر گرفته شد.`})}
   if(fills.s3){const t=Math.max(Math.min(W.middayEnd,slot.s4.t),slot.s2.t);slot.s3={t,source:'rest_rule',punchIds:[]};explain.push({kind:'fill_rest',text:`${restLabel.s3} ثبت نشده بود و طبق قانون رستوران بدبینانه‌ترین ساعت ممکن (${faClock(t)}) در نظر گرفته شد.`})}
  }else if(fills.s2&&fills.s3){
   restUnknown=true;slot.s2={t:null,source:'rest_rule',punchIds:[]};slot.s3={t:null,source:'rest_rule',punchIds:[]};
   explain.push({kind:'fill_rest',text:`${restLabel.s2} و ${restLabel.s3} ثبت نشده بود؛ استراحت استاندارد ${faHM(std)} کسر شد و ساعت استراحت نامشخص است.`});
  }else if(fills.s2){const t=Math.max(slot.s3.t-std,slot.s1.t);slot.s2={t,source:'rest_rule',punchIds:[]};explain.push({kind:'fill_rest',text:`${restLabel.s2} ثبت نشده بود و بر اساس استراحت استاندارد ${faHM(std)} محاسبه شد.`})}
  else{const t=Math.min(slot.s2.t+std,slot.s4.t);slot.s3={t,source:'rest_rule',punchIds:[]};explain.push({kind:'fill_rest',text:`${restLabel.s3} ثبت نشده بود و بر اساس استراحت استاندارد ${faHM(std)} محاسبه شد.`})}
 }
 flags.hasAutoFill=Object.keys(fills).length>0;
 /* 6) per-day figures against the business day's weekday schedule */
 const A_m=tl(sch.morningArrival),E_m=tl(sch.morningEnd),A_e=tl(sch.eveningStart),E_e=tl(sch.eveningEnd),mode=s.toleranceMode;
 const T=k=>slot[k]?.t??null,d=(a,b)=>a===null||b===null?null:Math.max(0,b-a);
 let late=0,earlyExit=0,exitOvertime=0,earlyArrival=0,rest=null,restOverrun=0,workedMorning=null,workedEvening=null,worked=0,required=0;
 if(shift==='morning'){late=lateness(T('s1'),A_m,sch.morningLateToleranceMin,mode);earlyExit=Math.max(0,E_m-T('s2'));exitOvertime=Math.max(0,T('s2')-E_m);earlyArrival=Math.max(0,A_m-T('s1'));workedMorning=d(T('s1'),T('s2'));worked=workedMorning;required=E_m-A_m}
 else if(shift==='evening'){late=lateness(T('s3'),A_e,sch.eveningLateToleranceMin,mode);earlyExit=Math.max(0,E_e-T('s4'));exitOvertime=Math.max(0,T('s4')-E_e);earlyArrival=Math.max(0,A_e-T('s3'));workedEvening=d(T('s3'),T('s4'));worked=workedEvening;required=E_e-A_e}
 else if(shift==='double'){
  late=lateness(T('s1'),A_m,sch.morningLateToleranceMin,mode);earlyExit=Math.max(0,E_e-T('s4'));exitOvertime=Math.max(0,T('s4')-E_e);earlyArrival=Math.max(0,A_m-T('s1'));required=E_e-A_m-std;
  if(restUnknown){rest=std;worked=Math.max(0,T('s4')-T('s1')-std)}
  else{rest=d(T('s2'),T('s3'));restOverrun=Math.max(0,rest-std);workedMorning=d(T('s1'),T('s2'));workedEvening=d(T('s3'),T('s4'));worked=workedMorning+workedEvening}
 }
 const overtimeRaw=exitOvertime+(s.earlyArrivalCountsAsOvertime?earlyArrival:0);
 let pending=0,approved=0,otStatus='none';const otd=ov.overtime||null;
 if(overtimeRaw>0){
  if(!s.overtimeRequiresApproval){approved=overtimeRaw;otStatus='approved'}
  else if(otd?.decision==='approve'){approved=overtimeRaw;otStatus='approved'}
  else if(otd?.decision==='partial'){approved=Math.min(overtimeRaw,Math.max(0,Math.round(Number(otd.minutes)||0)));otStatus='partial'}
  else if(otd?.decision==='reject'){otStatus='rejected'}
  else{pending=overtimeRaw;otStatus='pending'}
 }
 flags.hasPendingOvertime=pending>0;
 flags.needsReview=review&&!slotEdits.length;
 if(flags.needsReview)explain.push({kind:'review',text:'الگوی ترددها غیرعادی است و توسط مدیر بررسی می‌شود.'});
 /* manual edits replace the automatic explanation */
 const explanations=flags.manuallyEdited&&(slotEdits.length||deleted.size||(ov.addedPunches||[]).length)?[{kind:'manual',text:`توسط مدیر اصلاح شد${txt(ov.note)?`: ${txt(ov.note)}`:''}`}]:explain;
 const status=ov.status&&STATUS_LABELS[ov.status]?ov.status:shift==='none'?'undetermined':'present';
 const slots=Object.fromEntries(SLOTS.map(k=>{const x=slot[k];if(!x)return[k,null];return[k,{time:x.t===null?null:hhmm(x.t),nextDay:x.t!==null&&x.t>=1440,minute:x.t,source:x.source,punchIds:x.punchIds}]}));
 return{personnelId,businessDate,weekday:weekdayIndex(businessDate),weekdayName:weekdayName(businessDate),shift,shiftLabel:SHIFT_LABELS[shift],status,statusLabel:STATUS_LABELS[status],
  slots,restMinutes:rest,restKnown:shift==='double'?!restUnknown:null,
  workedMorning,workedEvening,worked,required,late,earlyExit,restOverrun,deficit:late+earlyExit+restOverrun,earlyArrival,
  overtime:{raw:overtimeRaw,pending,approved,status:otStatus,note:txt(otd?.note)},
  flags,explanations,note:txt(ov.note),expectedShift:null,punchCount:list.length};
}
function overrideFor(overrides,personnelId,bd){return (overrides||[]).find(o=>o&&o.personnelId===personnelId&&o.businessDate===bd&&!o.isArchived)||null}
/* ---------- Month save: overrides, audit log and result snapshot ---------- */
/* Saving an employee-month (explicit «ذخیره») writes the manager's day drafts as new override records (the previous one is
   archived, never deleted), one audit entry per changed day, and a snapshot of the computed month together with the settings
   it was computed with. A saved month keeps those frozen settings until the manager re-saves with the current settings,
   so later rule changes do not rewrite past months; reports read the snapshot. */
function nextId(rows,prefix,width){return `${prefix}-${String(nextSeq(rows,prefix)+1).padStart(width,'0')}`}
const OVERRIDE_META=['id','personnelId','businessDate','createdAt','createdBy','replaces','isArchived','archivedAt','archivedBy'];
/* Drops empty parts; null when nothing is left (= day back to computed). */
function cleanOverride(o){
 if(!o)return null;const out={};
 const clk=v=>{const m=minOf(en(txt(v)));return m===null?null:hhmm(m)};
 const slots=Object.fromEntries(Object.entries(o.slots||{}).filter(([k,v])=>SLOTS.includes(k)&&v!==undefined&&v!==null&&(txt(v)===''||clk(v)!==null)).map(([k,v])=>[k,txt(v)===''?'':clk(v)]));if(Object.keys(slots).length)out.slots=Object.fromEntries(SLOTS.filter(k=>k in slots).map(k=>[k,slots[k]]));
 const del=[...new Set((o.deletedPunchIds||[]).filter(Boolean))].sort();if(del.length)out.deletedPunchIds=del;
 const add=(o.addedPunches||[]).filter(p=>p&&clk(p.time)!==null&&['in','out'].includes(p.type)).map(p=>({id:txt(p.id),time:clk(p.time),type:p.type}));if(add.length)out.addedPunches=add;
 if(STATUS_LABELS[o.status]&&o.status!=='undetermined')out.status=o.status;
 if(txt(o.note))out.note=txt(o.note);
 const ot=o.overtime;if(ot&&['approve','partial','reject'].includes(ot.decision)){out.overtime={decision:ot.decision};if(ot.decision==='partial')out.overtime.minutes=Math.max(0,Math.round(Number(en(ot.minutes))||0));if(txt(ot.note))out.overtime.note=txt(ot.note)}
 return Object.keys(out).length?out:null;
}
function overrideSignature(o){if(!o)return'';const c={...o};for(const k of OVERRIDE_META)delete c[k];const x=cleanOverride(c);return x?JSON.stringify(x):''}
/* Audit lines between two overrides: [{field, old, new}] with readable values. */
function overrideChanges(before,after){
 const a=cleanOverride(before&&{...before})||{},b=cleanOverride(after&&{...after})||{},out=[];
 const val={slots:k=>o=>o.slots&&k in o.slots?(o.slots[k]||'پاک شد'):null,simple:k=>o=>o[k]??null,json:k=>o=>o[k]?JSON.stringify(o[k]):null};
 const fields=[...SLOTS.map(k=>[`slots.${k}`,val.slots(k)]),['status',val.simple('status')],['note',val.simple('note')],['deletedPunchIds',val.json('deletedPunchIds')],['addedPunches',val.json('addedPunches')],['overtime',val.json('overtime')]];
 for(const [field,get] of fields){const x=get(a),y=get(b);if(x!==y)out.push({field,old:x,new:y})}
 return out;
}
function compactDay(d){return{businessDate:d.businessDate,shift:d.shift,status:d.status,slots:Object.fromEntries(SLOTS.map(k=>[k,d.slots[k]?{time:d.slots[k].time,nextDay:d.slots[k].nextDay,source:d.slots[k].source}:null])),workedMorning:d.workedMorning,workedEvening:d.workedEvening,worked:d.worked,required:d.required,late:d.late,earlyExit:d.earlyExit,restMinutes:d.restMinutes,restKnown:d.restKnown,restOverrun:d.restOverrun,deficit:d.deficit,earlyArrival:d.earlyArrival,overtime:{...d.overtime},flags:{...d.flags},explanations:d.explanations.map(x=>x.text),note:d.note}}
const daySignature=d=>JSON.stringify(compactDay(d));
function activeMonthSave(saves,personnelId,year,month){return (saves||[]).find(s=>s&&s.personnelId===personnelId&&+s.year===+year&&+s.month===+month&&s.status==='active')||null}
/* Settings for a month: frozen with its last save, else (or when asked) the current settings. */
function monthSettings(doc,personnelId,year,month,useCurrent=false){const s=activeMonthSave(doc?.monthSaves,personnelId,year,month);return !useCurrent&&s?.settings?s.settings:doc?.settings}
/* drafts: {businessDate → override fields | null (back to computed)}; base: {businessDate → overrideSignature when editing began}. */
function applyMonthSave(doc,{personnelId,year,month,drafts={},base={},user='',at=new Date().toISOString(),useCurrentSettings=false}={}){
 if(!personnelId||!(+year)||!(+month>=1&&+month<=12))throw new Error('پرسنل و ماه برای ذخیره مشخص نیست');
 const out={...doc,overrides:[...(doc.overrides||[])],auditLog:[...(doc.auditLog||[])],monthSaves:[...(doc.monthSaves||[])]},prefix=`${year}/${pad(month)}/`;
 for(const bd of Object.keys(drafts)){
  if(!bd.startsWith(prefix))throw new Error(`روز ${fa(bd)} در این ماه نیست`);
  const cur=overrideFor(out.overrides,personnelId,bd);
  if(overrideSignature(cur)!==(base[bd]??''))throw new Error(`اصلاحات روز ${fa(bd)} پس از باز شدن این صفحه توسط کاربر دیگری تغییر کرده است؛ صفحه را تازه کنید و دوباره اعمال کنید.`);
 }
 const changed=[];
 for(const bd of Object.keys(drafts).sort()){
  const cur=overrideFor(out.overrides,personnelId,bd),next=cleanOverride(drafts[bd]),changes=overrideChanges(cur,next);
  if(!changes.length)continue;
  if(cur){const i=out.overrides.indexOf(cur);out.overrides[i]={...cur,isArchived:true,archivedAt:at,archivedBy:user}}
  if(next)out.overrides.push({id:nextId(out.overrides,'ATO',6),personnelId,businessDate:bd,...next,createdAt:at,createdBy:user,replaces:cur?.id||''});
  out.auditLog.push({id:nextId(out.auditLog,'ATA',7),at,by:user,kind:'day',action:next?(cur?'edit':'create'):'reset',personnelId,businessDate:bd,changes});
  changed.push(bd);
 }
 const prev=activeMonthSave(out.monthSaves,personnelId,year,month),settings=JSON.parse(JSON.stringify(useCurrentSettings||!prev?.settings?doc.settings:prev.settings));
 const errs=validateSettings(settings);if(errs.length)throw new Error(`تنظیمات حضور و غیاب معتبر نیست: ${errs[0]}`);
 const days=computeMonth({punches:out.punches,overrides:out.overrides,settings,personnelId,year:+year,month:+month});
 const saveId=nextId(out.monthSaves,'ATM',5);
 if(prev){const i=out.monthSaves.indexOf(prev);out.monthSaves[i]={...prev,status:'superseded',supersededAt:at,supersededBy:saveId}}
 out.monthSaves.push({id:saveId,personnelId,year:+year,month:+month,status:'active',savedAt:at,savedBy:user,settingsSource:prev&&!useCurrentSettings?'frozen':'current',settings,days:days.map(compactDay)});
 out.auditLog.push({id:nextId(out.auditLog,'ATA',7),at,by:user,kind:'monthSave',personnelId,year:+year,month:+month,saveId,supersedes:prev?.id||'',changedDays:changed,settingsSource:prev&&!useCurrentSettings?'frozen':'current'});
 return{doc:out,saveId,changedDays:changed,days};
}
/* Days whose live result differs from the month's saved snapshot (late imports, edits by others). */
function changedSinceSave(save,days){if(!save)return[];const map=new Map((save.days||[]).map(x=>[x.businessDate,JSON.stringify(x)]));return days.filter(d=>map.get(d.businessDate)!==daySignature(d)).map(d=>d.businessDate)}
function todayJalali(now=new Date()){return jStr(...g2j(now.getFullYear(),now.getMonth()+1,now.getDate()))}
/* All-staff «needs attention» for a month: review, auto-filled, pending overtime and undetermined days (up to today). */
function monthAttention({doc,personnelIds,year,month,today=''}){
 return (personnelIds||[]).map(pid=>{
  const save=activeMonthSave(doc?.monthSaves,pid,year,month),settings=monthSettings(doc,pid,year,month);
  const days=computeMonth({punches:doc?.punches,overrides:doc?.overrides,settings,personnelId:pid,year,month}),past=d=>!today||d.businessDate<=today;
  return{personnelId:pid,save,days,review:days.filter(d=>d.flags.needsReview),autoFill:days.filter(d=>d.flags.hasAutoFill),pendingOvertime:days.filter(d=>d.flags.hasPendingOvertime),undetermined:days.filter(d=>d.status==='undetermined'&&past(d)),changedSinceSave:changedSinceSave(save,days)};
 });
}
/* ---------- Monthly report ---------- */
/* Totals over a month's days (full computeDay output or saved compact days). Undetermined days count only up to today.
   net = approved overtime − deficit (positive = surplus). Shifts: single = 1, double = 2, only on «حاضر» days. */
function monthTotals(days,{today=''}={}){
 const t={worked:0,required:0,late:0,earlyExit:0,restOverrun:0,deficit:0,approvedOvertime:0,pendingOvertime:0,net:0,shifts:0,presentDays:0,singleShiftDays:0,doubleShiftDays:0,absent:0,leaveEntitled:0,leaveSick:0,off:0,undetermined:0,autoFilledDays:0,manuallyEditedDays:0,reviewDays:0,days:(days||[]).length};
 for(const d of days||[]){
  t.worked+=d.worked||0;t.required+=d.required||0;t.late+=d.late||0;t.earlyExit+=d.earlyExit||0;t.restOverrun+=d.restOverrun||0;t.deficit+=d.deficit||0;
  t.approvedOvertime+=d.overtime?.approved||0;t.pendingOvertime+=d.overtime?.pending||0;
  if(d.status==='present'){t.presentDays++;if(d.shift==='double'){t.doubleShiftDays++;t.shifts+=2}else if(d.shift==='morning'||d.shift==='evening'){t.singleShiftDays++;t.shifts+=1}}
  else if(d.status==='absent')t.absent++;else if(d.status==='leave_entitled')t.leaveEntitled++;else if(d.status==='leave_sick')t.leaveSick++;else if(d.status==='off')t.off++;
  else if(d.status==='undetermined'&&(!today||d.businessDate<=today))t.undetermined++;
  if(d.flags?.hasAutoFill)t.autoFilledDays++;if(d.flags?.manuallyEdited)t.manuallyEditedDays++;if(d.flags?.needsReview)t.reviewDays++;
 }
 t.net=t.approvedOvertime-t.deficit;return t;
}
/* Report source: the active month save (snapshot) when there is one, else a live preview marked «not saved». */
function monthReport({doc,personnelId,year,month,today=''}){
 const save=activeMonthSave(doc?.monthSaves,personnelId,year,month);
 const live=computeMonth({punches:doc?.punches,overrides:doc?.overrides,settings:monthSettings(doc,personnelId,year,month),personnelId,year,month});
 const days=save?save.days:live.map(compactDay);
 return{personnelId,year:+year,month:+month,source:save?'saved':'live',save,days,totals:monthTotals(days,{today}),changedSinceSave:changedSinceSave(save,live)};
}
const TOTAL_COLUMNS=[['worked','کارکرد','hm'],['required','ساعت موظف','hm'],['late','تأخیر','hm'],['earlyExit','تعجیل خروج','hm'],['deficit','کسر کار','hm'],['approvedOvertime','اضافه‌کار تأییدشده','hm'],['pendingOvertime','اضافه‌کار در انتظار','hm'],['net','خالص (اضافه‌کار تأییدشده − کسر کار)','hm'],['shifts','تعداد شیفت'],['presentDays','روز حضور'],['singleShiftDays','روز تک‌شیفت'],['doubleShiftDays','روز دوشیفت'],['absent','غیبت'],['leaveEntitled','مرخصی استحقاقی'],['leaveSick','مرخصی استعلاجی'],['off','آف'],['undetermined','تعیین‌نشده'],['autoFilledDays','روز تکمیل خودکار'],['manuallyEditedDays','روز اصلاح مدیر']];
const totalValue=(t,[k,,kind])=>kind==='hm'?faHM(t[k]):fa(t[k]);
/* Excel rows (first row = headers), values as displayed in the panel. */
function exportDayRows(days){
 const head=['روز کاری','روز','وضعیت','شیفت',...SLOTS.flatMap(k=>[SLOT_LABELS[k],`منبع ${SLOT_LABELS[k]}`]),'کارکرد','موظف','تأخیر','تعجیل','استراحت','کسر کار','اضافه‌کار در انتظار','اضافه‌کار تأییدشده','نیاز به بررسی','اصلاح مدیر','توضیح'];
 return[head,...(days||[]).map(d=>[fa(d.businessDate),weekdayName(d.businessDate),STATUS_LABELS[d.status]||d.status,d.shift==='none'?'':SHIFT_LABELS[d.shift],...SLOTS.flatMap(k=>{const x=d.slots?.[k];return x?[x.time?fa(x.time)+(x.nextDay?' (+۱)':''):'نامشخص',SOURCE_LABELS[x.source]||'']:['','']}),faHM(d.worked),faHM(d.required),faHM(d.late),faHM(d.earlyExit),d.shift==='double'?faHM(d.restMinutes):'',faHM(d.deficit),faHM(d.overtime?.pending||0),faHM(d.overtime?.approved||0),d.flags?.needsReview?'بله':'',d.flags?.manuallyEdited?'بله':'',(d.explanations||[]).map(x=>typeof x==='string'?x:x.text).join(' | ')])];
}
function exportTotalsRows(totals){return TOTAL_COLUMNS.map(c=>[c[1],totalValue(totals,c)])}
function exportSummaryRows(reports,nameOf=id=>id){return[['پرسنل','وضعیت ذخیره',...TOTAL_COLUMNS.map(c=>c[1])],...(reports||[]).map(r=>[nameOf(r.personnelId),r.source==='saved'?(r.changedSinceSave.length?'ذخیره‌شده (تغییر پس از ذخیره)':'ذخیره‌شده'):'ذخیره‌نشده',...TOTAL_COLUMNS.map(c=>totalValue(r.totals,c))])]}
/* Every business day of a Jalali month for one employee, including days without punches. */
function computeMonth({punches=[],overrides=[],settings,personnelId,year,month}){
 const mine=(punches||[]).filter(p=>p.personnelId===personnelId),byDay=new Map();
 for(const p of mine){if(!byDay.has(p.businessDate))byDay.set(p.businessDate,[]);byDay.get(p.businessDate).push(p)}
 return monthDays(year,month).map(bd=>computeDay({personnelId,businessDate:bd,punches:byDay.get(bd)||[],settings,override:overrideFor(overrides,personnelId,bd)}));
}

const api={g2j,j2g,validJalali,dayNumber,addDays,weekdayIndex,weekdayName,monthLength,monthDays,tehranOffset,isoTimestamp,WEEKDAYS,MONTHS,
 minOf,hhmm,parseClock,parseDate,parseCode,parseType,businessDate,inWindow,validateSettings,scheduleFor,
 ADAPTERS,parseSheets,parseCsv,sheetRows,splitEmployee,codeIndex,unknownCodes,planImport,applyImport,punchKey,punchesFor,normHeader,en,fa,
 computeDay,computeMonth,overrideFor,SHIFT_TABLE,SHIFT_LABELS,STATUS_LABELS,SOURCE_LABELS,SLOT_LABELS,faHM,faClock,
 nextId,cleanOverride,overrideSignature,overrideChanges,compactDay,daySignature,activeMonthSave,monthSettings,applyMonthSave,changedSinceSave,todayJalali,monthAttention,
 monthTotals,monthReport,TOTAL_COLUMNS,exportDayRows,exportTotalsRows,exportSummaryRows};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.RayoAttendanceCore=api;
})(typeof window!=='undefined'?window:null);
