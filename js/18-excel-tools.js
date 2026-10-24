(function(){
'use strict';
let xlsxPromise=null;
const txt=v=>String(v??'').trim();
const en=s=>String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const num=v=>{const n=Number(en(v).replace(/[٬,،\s]/g,'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:0};
const norm=v=>txt(v).replace(/\u200c/g,' ').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\sـ_\-\/\\()\[\]،,:؛.؟?!]/g,'').toLowerCase();
const uniq=a=>[...new Set((a||[]).map(txt).filter(Boolean))];
async function loadXLSX(){
  if(window.XLSX)return window.XLSX;
  if(xlsxPromise)return xlsxPromise;
  const sources=['./js/xlsx.full.min.js','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'];
  xlsxPromise=new Promise(async(resolve,reject)=>{
    for(const src of sources){
      try{
        await new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=fail;document.head.appendChild(s)});
        if(window.XLSX)return resolve(window.XLSX);
      }catch(_){ }
    }
    reject(new Error('کتابخانه خواندن Excel بارگذاری نشد. فایل xlsx.full.min.js را داخل پوشه js قرار دهید یا دسترسی اینترنت را بررسی کنید.'));
  });
  return xlsxPromise;
}
function findCol(headers,aliases){const hs=headers.map(norm),as=aliases.map(norm);return hs.findIndex(h=>as.some(a=>h===a||h.includes(a)||a.includes(h)))}
function bestTable(wb,spec,scan=30){let best=null;for(const sheetName of wb.SheetNames){const rows=window.XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,raw:false,defval:'',blankrows:false});for(let r=0;r<Math.min(scan,rows.length);r++){const headers=(rows[r]||[]).map(txt),map={},missing=[];let score=0;for(const [key,cfg] of Object.entries(spec)){const aliases=Array.isArray(cfg)?cfg:(cfg.aliases||[]),idx=findCol(headers,aliases);map[key]=idx;const required=Array.isArray(cfg)?false:!!cfg.required,weight=Array.isArray(cfg)?1:(cfg.weight||1);if(idx>=0)score+=weight;else if(required)missing.push(key)}const candidate={sheetName,rows,headerRow:r,headers,map,score,missing};if(!best||(!candidate.missing.length&&best.missing.length)||candidate.score>best.score)best=candidate}}return best}
async function readFile(file){const XLSX=await loadXLSX();const wb=XLSX.read(await file.arrayBuffer(),{type:'array',raw:false,cellDates:false});return wb}
async function readBest(file,spec,opts={}){const wb=await readFile(file),best=bestTable(wb,spec,opts.scan||30);if(!best||best.missing.length)throw new Error(`ستون‌های الزامی Excel پیدا نشد${best?.missing?.length?`: ${best.missing.join('، ')}`:''}`);const data=best.rows.slice(best.headerRow+1).filter(r=>r.some(v=>txt(v)!==''));return{...best,data,get:(row,key)=>best.map[key]>=0?row[best.map[key]]:''}}
function csv(rows){return rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n')}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
async function exportRows(rows,name='export.xlsx',sheetName='Data'){
  try{const XLSX=await loadXLSX();const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(rows);XLSX.utils.book_append_sheet(wb,ws,sheetName);XLSX.writeFile(wb,name)}catch(e){downloadBlob(new Blob(['\ufeff'+csv(rows)],{type:'text/csv;charset=utf-8'}),name.replace(/\.xlsx$/i,'.csv'))}
}
function template(specRows,name='template.xlsx'){return exportRows(specRows,name,'Template')}
window.RayoExcel={loadXLSX,readFile,readBest,bestTable,findCol,norm,txt,num,uniq,exportRows,template,downloadBlob};
})();

/* Attendance device import («کارکرد ماه» → ریز کارکرد) and the monthly attendance summary shared by the admin payroll page (19)
   and the staff panel (22). Pure helpers; nothing here loads or saves data. Data lives in hr.attendanceLogs (one active record
   per person-month; a re-import marks the previous record «replaced») and hr.attendanceCorrections (staff requests; an
   approved request replaces that day's in/out in the summary, the device record itself is never edited). */
(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[];
const txt=v=>String(v??'').trim();
const en=s=>String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const norm=v=>en(txt(v)).replace(/‌/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\sـ_\-\/\\()\[\]،,:؛.؟?!#]/g,'').toLowerCase();
const pad=v=>String(v).padStart(2,'0');
const EXCLUDED_SHIFT=['لغوشده','مرخصی','غیبت'];
const ROLE_ALIASES={
 key:['کدپرسنلی','کدپرسنل','کد','کدکارمند','کدکاربر','شمارهپرسنلی','شمارهکارت','شمارهکاربری','شناسه','شناسهکاربر','acno','userid','user','empid','empno','enno','badge','badgenumber','pin','id','code','personnelid','personnelcode','employeeid','employeecode','employeeno','staffid','cardno'],
 name:['نام','نامونامخانوادگی','نامکامل','نامپرسنل','نامکارمند','نامکاربر','name','fullname','employee','employeename','personnelname','username','staffname'],
 family:['نامخانوادگی','فامیل','lastname','family','surname'],
 datetime:['تاریخوساعت','تاریخوزمان','زمانثبت','زمانتردد','datetime','timestamp','checktime','punchtime','logtime','recordtime','clocktime','attendancetime'],
 date:['تاریخ','تاریختردد','روزکاری','date','day','workdate','attendancedate','logdate'],
 time:['ساعت','زمان','ساعتتردد','time','punch','clock'],
 punches:['ترددها','punches','times','clockings']
};
const IN_RE=/^(ورود|ساعتورود|زمانورود|in|timein|checkin|clockin|onduty|entry|intime|firstin|start|starttime)\d*$/;
const OUT_RE=/^(خروج|ساعتخروج|زمانخروج|out|timeout|checkout|clockout|offduty|exit|outtime|lastout|end|endtime)\d*$/;
function roleOf(header){const h=norm(header);if(!h)return'';if(IN_RE.test(h))return'in';if(OUT_RE.test(h))return'out';for(const [role,list] of Object.entries(ROLE_ALIASES))if(list.includes(h))return role;return''}
/* Gregorian → Jalali (arithmetic, timezone-free). */
function g2j(gy,gm,gd){const g=[0,31,59,90,120,151,181,212,243,273,304,334];let jy=gy<=1600?0:979;gy-=gy<=1600?621:1600;const gy2=gm>2?gy+1:gy;let days=365*gy+Math.floor((gy2+3)/4)-Math.floor((gy2+99)/100)+Math.floor((gy2+399)/400)-80+gd+g[gm-1];jy+=33*Math.floor(days/12053);days%=12053;jy+=4*Math.floor(days/1461);days%=1461;jy+=Math.floor((days-1)/365);if(days>365)days=(days-1)%365;const jm=days<186?1+Math.floor(days/31):7+Math.floor((days-186)/30),jd=1+(days<186?days%31:(days-186)%30);return[jy,jm,jd]}
function jStr(y,m,d){return `${y}/${pad(m)}/${pad(d)}`}
function ymd(y,m,d){y=+y;m=+m;d=+d;if(!(m>=1&&m<=12&&d>=1&&d<=31))return'';if(y>=1300&&y<1500)return jStr(y,m,d);if(y>=1900&&y<2200)return jStr(...g2j(y,m,d));return''}
/* Excel serial (days since 1899-12-30) → parts, read in UTC so the local timezone cannot shift it. */
function serialParts(v){const d=new Date(Math.round((Number(v)-25569)*86400000));return{y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate(),H:d.getUTCHours(),M:d.getUTCMinutes()}}
const isSerial=v=>!!v&&typeof v==='object'&&v.__serial!==undefined;
const blank=v=>!(v instanceof Date)&&!isSerial(v)&&!Array.isArray(v)&&txt(v)==='';
function parseDate(v){
 if(v===null||v===undefined||v==='')return'';
 if(isSerial(v)){if(Number(v.__serial)<1)return'';const p=serialParts(v.__serial);return ymd(p.y,p.m,p.d)}
 if(v instanceof Date&&!isNaN(v))return ymd(v.getFullYear(),v.getMonth()+1,v.getDate());
 if(typeof v==='number'){if(v>20000&&v<80000){const p=serialParts(v);return ymd(p.y,p.m,p.d)}const s=String(Math.trunc(v));return s.length===8?ymd(s.slice(0,4),s.slice(4,6),s.slice(6,8)):''}
 const s=en(txt(v));let m=s.match(/(\d{4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,2})/);if(m)return ymd(m[1],m[2],m[3]);
 m=s.match(/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4})/);if(m){const a=+m[1],b=+m[2];return b>12?ymd(m[3],a,b):ymd(m[3],b,a)}
 m=s.match(/^(\d{4})(\d{2})(\d{2})(?:\D|$)/);if(m)return ymd(m[1],m[2],m[3]);
 return'';
}
function parseTime(v){
 if(v===null||v===undefined||v==='')return'';
 if(isSerial(v)){const p=serialParts(v.__serial);return `${pad(p.H)}:${pad(p.M)}`}
 if(v instanceof Date&&!isNaN(v))return `${pad(v.getHours())}:${pad(v.getMinutes())}`;
 if(typeof v==='number'){if(v>=1)return'';const mins=Math.round(v*1440)%1440;return `${pad(Math.floor(mins/60))}:${pad(mins%60)}`}
 const s=en(txt(v)),m=s.match(/(\d{1,2})\s*:\s*(\d{2})(?:\s*:\s*\d{2})?\s*(am|pm|ق\.?\s*ظ|ب\.?\s*ظ|صبح|عصر)?/i);if(!m)return'';let H=+m[1];const M=+m[2],ap=(m[3]||'').replace(/[\s.]/g,'').toLowerCase();if(H>23||M>59)return'';if((ap==='pm'||ap==='بظ'||ap==='عصر')&&H<12)H+=12;if((ap==='am'||ap==='قظ'||ap==='صبح')&&H===12)H=0;return `${pad(H)}:${pad(M)}`;
}
function toMin(t){const m=txt(t).match(/^(\d{1,2}):(\d{2})$/);return m?(+m[1])*60+(+m[2]):null}
function keyText(v){if(typeof v==='number'&&Number.isFinite(v))return String(v);if(v instanceof Date||isSerial(v))return'';return en(txt(v)).replace(/\.0+$/,'')}
/* One row (header-indexed table row or JSON object) → {key,name,date,times,pairs}. */
function rowEntry(get,cols){
 const pick=role=>cols.filter(c=>c.role===role);
 const first=role=>{for(const c of pick(role)){const v=get(c);if(!blank(v))return v}return''};
 const key=keyText(first('key')),name=[first('name'),first('family')].map(x=>x instanceof Date||isSerial(x)?'':txt(x)).filter(Boolean).join(' ');
 let date='';const times=[],pairs=[],dt=first('datetime');
 if(dt!==''){date=parseDate(dt);const t=parseTime(dt);if(t)times.push(t)}
 if(!date)date=parseDate(first('date'));
 if(!date)return null;
 const ins=pick('in'),outs=pick('out');
 for(let i=0;i<Math.max(ins.length,outs.length);i++){const a=ins[i]?parseTime(get(ins[i])):'',b=outs[i]?parseTime(get(outs[i])):'';if(a||b)pairs.push({in:a,out:b})}
 for(const c of pick('time')){const t=parseTime(get(c));if(t)times.push(t)}
 for(const c of pick('punches')){const v=get(c);(Array.isArray(v)?v:txt(v).split(/[\s,،;|]+/)).forEach(x=>{const t=parseTime(x);if(t)times.push(t)})}
 return{key,name,date,times,pairs};
}
function headerScore(cols){const roles=new Set(cols.map(c=>c.role));if(!(roles.has('date')||roles.has('datetime')))return -1;if(!['datetime','time','in','out','punches'].some(r=>roles.has(r)))return -1;return roles.size}
function fromTable(rows){
 let best=null;for(let r=0;r<Math.min(30,rows.length);r++){const cols=A(rows[r]).map((h,index)=>({index,role:typeof h==='string'?roleOf(h):''})).filter(c=>c.role),sc=headerScore(cols);if(sc>=0&&(!best||sc>best.score))best={row:r,cols,score:sc}}
 if(!best)return null;
 const entries=[];let skipped=0;
 for(const row of rows.slice(best.row+1)){if(!A(row).some(v=>!blank(v)))continue;const e=rowEntry(c=>row[c.index],best.cols);if(e)entries.push(e);else skipped++}
 return{entries,skipped,headerRow:best.row};
}
/* ZKTeco attlog.dat style text without header: «  12\t2026-10-01 08:02:11\t1\t0…». */
function fromPlainText(text){const entries=[];let skipped=0;for(const line of en(text).split(/\r?\n/)){if(!txt(line))continue;const m=line.match(/^\s*([^\s,;]+)[\s,;]+(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})[\sT]+(\d{1,2}:\d{2})/);const date=m&&parseDate(m[2]),t=m&&parseTime(m[3]);if(!date||!t){skipped++;continue}entries.push({key:keyText(m[1]),name:'',date,times:[t],pairs:[]})}return entries.length?{entries,skipped}:null}
/* JSON: an array of rows, an object holding such an array, or per-person objects with nested day/punch arrays
   (parent scalar fields such as code/name are inherited by nested rows). */
function fromJson(data){
 const rows=[];
 const walk=(node,inherited)=>{if(Array.isArray(node)){node.forEach(x=>walk(x,inherited));return}if(!node||typeof node!=='object')return;const scalars={},children=[];for(const [k,v] of Object.entries(node)){if(Array.isArray(v)&&v.some(x=>x&&typeof x==='object'))children.push(v);else if(v&&typeof v==='object'&&!Array.isArray(v))children.push(v);else scalars[k]=v}const merged={...inherited,...scalars};if(Object.keys(scalars).some(k=>['date','datetime'].includes(roleOf(k))))rows.push(merged);children.forEach(c=>walk(c,merged))};
 walk(data,{});
 const entries=[];let skipped=0;
 for(const r of rows){const cols=Object.keys(r).map(field=>({field,role:roleOf(field)})).filter(c=>c.role),e=headerScore(cols)>=0?rowEntry(c=>r[c.field],cols):null;if(e)entries.push(e);else skipped++}
 return{entries,skipped};
}
function sheetRows(XLSX,ws){const ref=ws&&ws['!ref'];if(!ref)return[];const R=XLSX.utils.decode_range(ref),out=[];for(let r=R.s.r;r<=R.e.r;r++){const row=[];for(let c=R.s.c;c<=R.e.c;c++){const cell=ws[XLSX.utils.encode_cell({r,c})];if(!cell)row.push('');else if(cell.t==='n'&&cell.z&&XLSX.SSF?.is_date?.(cell.z))row.push({__serial:cell.v});else if(cell.t==='d'&&cell.v instanceof Date)row.push(cell.v);else if(cell.t==='n')row.push(cell.v);else row.push(String(cell.w??cell.v??''))}out.push(row)}return out}
async function parseFile(file){
 const fileName=txt(file?.name),ext=(fileName.split('.').pop()||'').toLowerCase();let result=null,format=ext;
 if(ext==='json'){let data;try{data=JSON.parse((await file.text()).replace(/^﻿/,''))}catch(_){throw new Error('فایل JSON معتبر نیست')}result=fromJson(data);format='json'}
 else{
  let text=null;if(['csv','txt','dat','log'].includes(ext)){text=(await file.text()).replace(/^﻿/,'');if(ext!=='csv')result=fromPlainText(text);format=ext==='csv'?'csv':'text'}else format='excel';
  if(!result){const XLSX=await window.RayoExcel.loadXLSX(),wb=text!==null?XLSX.read(text,{type:'string',raw:true}):XLSX.read(await file.arrayBuffer(),{type:'array'});for(const sheetName of wb.SheetNames){const r=fromTable(sheetRows(XLSX,wb.Sheets[sheetName]));if(r&&r.entries.length&&(!result||r.entries.length>result.entries.length))result={...r,sheetName}}}
 }
 if(!result||!result.entries.length)throw new Error('در فایل ستون تاریخ و ساعت (یا ورود/خروج) پیدا نشد. ستون‌ها باید مانند «کد، نام، تاریخ، ساعت» یا «کد، تاریخ، ورود، خروج» باشند.');
 return{format,fileName,...result};
}
function pairMinutes(p){const a=toMin(p?.in),b=toMin(p?.out);if(a===null||b===null)return null;return b>=a?b-a:b+1440-a}
/* Explicit in/out pairs are kept; loose punches are sorted and paired in order (an odd last punch stays open = «ناقص»). */
function finalizeDay(date,pairs,times){const out=A(pairs).map(p=>({in:txt(p?.in),out:txt(p?.out)})).filter(p=>p.in||p.out),ts=[...new Set(A(times).filter(Boolean))].sort((a,b)=>toMin(a)-toMin(b));for(let i=0;i<ts.length;i+=2)out.push({in:ts[i],out:ts[i+1]||''});const at=p=>toMin(p.in)??toMin(p.out)??0;out.sort((a,b)=>at(a)-at(b));let minutes=0,incomplete=false;for(const p of out){const m=pairMinutes(p);if(m===null)incomplete=true;else minutes+=m}return{date,pairs:out,minutes,incomplete}}
/* Groups parsed entries by device key (or by name when the file has no key column). */
function groupEntries(entries){const groups=new Map();for(const e of A(entries)){const gk=e.key||(e.name?`name:${norm(e.name)}`:'');let g=groups.get(gk);if(!g){g={groupKey:gk,key:e.key,name:e.name,days:new Map()};groups.set(gk,g)}if(!g.name&&e.name)g.name=e.name;let d=g.days.get(e.date);if(!d){d={pairs:[],times:[]};g.days.set(e.date,d)}d.pairs.push(...e.pairs);d.times.push(...e.times)}return[...groups.values()].map(g=>({groupKey:g.groupKey,key:g.key,name:g.name,days:[...g.days.entries()].map(([date,d])=>finalizeDay(date,d.pairs,d.times)).sort((a,b)=>a.date.localeCompare(b.date))}))}
function monthOf(date){const m=txt(date).match(/^(\d{4})\/(\d{2})\/\d{2}$/);return m?{year:+m[1],month:+m[2]}:null}
function inMonth(date,y,m){const p=monthOf(date);return!!p&&p.year===+y&&p.month===+m}
function activeLog(logs,pid,y,m){return A(logs).filter(x=>x&&x.personnelId===pid&&+x.year===+y&&+x.month===+m&&x.status!=='replaced'&&!x.isArchived).sort((a,b)=>txt(b.source?.importedAt).localeCompare(txt(a.source?.importedAt)))[0]||null}
const isApproved=s=>/تایید|تأیید/.test(txt(s));
const isPending=s=>!txt(s)||/انتظار/.test(txt(s));
function approvedValue(c,k){const v=c[`approved${k}`];return v!==undefined&&v!==null&&txt(v)!==''?txt(v):txt(c[`requested${k}`])}
/* Monthly summary (minutes): effective days = device log + approved corrections; planned minutes per day from shift records
   (cancelled/leave/absence excluded, as in payroll). With no shift record in the month, the standard shift length
   (contract hoursPerShift, else settings.attendanceStandardHours, else 8) is the plan for each day with attendance. */
function summary({logs,corrections,shiftRecords,person,personnelId,year,month,settings}={}){
 const pid=personnelId||person?.id,log=activeLog(logs,pid,year,month),days=new Map();
 for(const d of A(log?.days))if(inMonth(d.date,year,month))days.set(d.date,{...finalizeDay(d.date,d.pairs,[]),source:'device'});
 const approved=A(corrections).filter(c=>c&&c.personnelId===pid&&inMonth(c.date,year,month)&&isApproved(c.status)).sort((a,b)=>txt(a.reviewedAt).localeCompare(txt(b.reviewedAt)));
 for(const c of approved){const before=days.get(c.date);days.set(c.date,{...finalizeDay(c.date,[{in:approvedValue(c,'In'),out:approvedValue(c,'Out')}],[]),source:'correction',correctionId:c.id,original:before?before.pairs:[]})}
 const shifts=A(shiftRecords).filter(x=>x&&x.personnelId===pid&&inMonth(x.date,year,month)&&!EXCLUDED_SHIFT.includes(txt(x.status))),planned=new Map();
 for(const s of shifts){const h=Number(en(s.scheduledHours))||Number(en(s.actualHours))||0;planned.set(s.date,(planned.get(s.date)||0)+Math.round(h*60))}
 const standardHours=Number(person?.salaryContract?.hoursPerShift)||Number(settings?.attendanceStandardHours)||8,basis=shifts.length?'shifts':'standard';
 const rows=[...new Set([...days.keys(),...planned.keys()])].sort().map(date=>{const d=days.get(date)||{date,pairs:[],minutes:0,incomplete:false,source:''},expected=basis==='shifts'?(planned.get(date)||0):(d.pairs.length?Math.round(standardHours*60):0),diff=d.minutes-expected,status=d.incomplete?'ناقص':!d.pairs.length&&expected>0?'غیبت':diff>0?'اضافه‌کار':diff<0?'کسر کار':'عادی';return{...d,expected,diff,status}});
 const sum=f=>rows.reduce((s,r)=>s+f(r),0);
 return{log,rows,basis,standardHours,totals:{worked:sum(r=>r.minutes),expected:sum(r=>r.expected),overtime:sum(r=>Math.max(0,r.diff)),undertime:sum(r=>Math.max(0,-r.diff)),days:rows.filter(r=>r.pairs.length).length,absent:rows.filter(r=>r.status==='غیبت').length,incomplete:rows.filter(r=>r.incomplete).length,corrected:rows.filter(r=>r.source==='correction').length}};
}
function hm(minutes){const v=Math.round(Number(minutes)||0),a=Math.abs(v);return `${v<0?'-':''}${Math.floor(a/60)}:${pad(a%60)}`}
function hours(minutes){return Math.round((Number(minutes)||0)/60*100)/100}
const WEEKDAYS=['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
function weekday(date){const m=txt(date).match(/^(\d{4})\/(\d{2})\/(\d{2})$/);if(!m)return'';const jy=+m[1],jm=+m[2],jd=+m[3],approx=Date.UTC(jy+621,2,21)+((jm<=6?(jm-1)*31:186+(jm-7)*30)+jd-1)*86400000;for(let i=-3;i<=3;i++){const d=new Date(approx+i*86400000),j=g2j(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());if(j[0]===jy&&j[1]===jm&&j[2]===jd)return WEEKDAYS[d.getUTCDay()]}return''}
window.RayoAttendance={parseFile,fromJson,fromTable,fromPlainText,groupEntries,finalizeDay,parseDate,parseTime,g2j,toMin,pairMinutes,monthOf,inMonth,activeLog,summary,hm,hours,weekday,norm,isApproved,isPending};
})();
