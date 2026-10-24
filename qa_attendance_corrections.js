'use strict';
// QA: ریز کارکرد دستگاه حضور و غیاب (ورود فایل در «کارکرد ماه»)، گزارش «کارکرد ماه من» در پنل پرسنل و درخواست اصلاح کارکرد.
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

let passed=0;
function check(name,condition){if(!condition)throw new Error(`FAIL: ${name}`);passed++;console.log(`  ✓ ${name}`)}
async function rejects(name,promise,pattern){let err=null;try{await promise}catch(e){err=e}check(name,!!err&&pattern.test(String(err.message)))}

const excel=fs.readFileSync('js/18-excel-tools.js','utf8');
const admin=fs.readFileSync('js/19-phase2-admin.js','utf8');
const staff=fs.readFileSync('js/22-staff-panel.js','utf8');
const base=fs.readFileSync('js/00-base.js','utf8');
const shell=fs.readFileSync('js/16-mpa-shell.js','utf8');
const polish=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8');
const page=fs.readFileSync('personel/attendance.html','utf8');

/* Minimal SheetJS stand-in: enough for sheetRows (cells with t/v/z/w) without network access. */
function fakeXLSX(sheets){const col=c=>String.fromCharCode(65+c);return{
 utils:{decode_range:ref=>{const [a,b]=ref.split(':'),p=s=>({c:s.charCodeAt(0)-65,r:+s.slice(1)-1});return{s:p(a),e:p(b)}},encode_cell:({r,c})=>`${col(c)}${r+1}`},
 SSF:{is_date:z=>/[ymdhs]/i.test(z)&&!/^General$/i.test(z)},
 read:()=>({SheetNames:Object.keys(sheets),Sheets:sheets})}}
function sheet(rows){const ws={};let maxC=0;rows.forEach((row,r)=>row.forEach((cell,c)=>{maxC=Math.max(maxC,c);if(cell===undefined||cell==='')return;ws[`${String.fromCharCode(65+c)}${r+1}`]=typeof cell==='object'?cell:typeof cell==='number'?{t:'n',v:cell}:{t:'s',v:cell,w:cell}}));ws['!ref']=`A1:${String.fromCharCode(65+maxC)}${rows.length}`;return ws}
const file=(name,content)=>({name,text:async()=>content,arrayBuffer:async()=>new ArrayBuffer(8)});

(async()=>{
 console.log('هسته مشترک RayoAttendance (js/18)');
 new vm.Script(excel,{filename:'js/18-excel-tools.js'});
 const ctx={window:{},console};vm.createContext(ctx);vm.runInContext(excel,ctx);
 const R=ctx.window.RayoAttendance;
 check('RayoAttendance در فایل مشترک 18 تعریف شده',!!R&&typeof R.parseFile==='function'&&typeof R.summary==='function');
 check('تبدیل میلادی به شمسی',R.parseDate('2026-10-22')==='1405/07/30'&&R.parseDate('2026-03-21')==='1405/01/01'&&R.parseDate('2025-03-20')==='1403/12/30');
 check('تاریخ شمسی با ارقام فارسی و قالب‌های مختلف',R.parseDate('۱۴۰۵/۷/۹')==='1405/07/09'&&R.parseDate('14050709')==='1405/07/09'&&R.parseDate('1405-07-09 08:00')==='1405/07/09');
 check('سریال Excel بدون اثر منطقه زمانی',R.parseDate({__serial:46296.75})==='1405/07/09'&&R.parseTime({__serial:46296.75})==='18:00'&&R.parseTime(0.3541666)==='08:30');
 check('ساعت ۱۲ساعته و فارسی',R.parseTime('04:30 PM')==='16:30'&&R.parseTime('۰۸:۱۵')==='08:15'&&R.parseTime('12:10 AM')==='00:10'&&R.parseTime('25:00')==='');
 check('روز هفته شمسی',R.weekday('1405/07/30')==='پنجشنبه'&&R.weekday('1405/01/01')==='شنبه');

 let g=R.groupEntries(R.fromTable([['گزارش تردد'],['AC-No.','Name','Date/Time','State'],['5','Ali','2026/10/01 08:02','C/In'],['5','Ali','2026/10/01 16:10','C/Out'],['7','Sara','2026/10/01 09:00',''],['7','Sara','2026/10/02 09:00',''],['7','Sara','2026/10/02 22:00','']]).entries);
 check('قالب ZKTeco (هر تردد یک ردیف، سطر عنوان بالای جدول)',g.length===2&&g[0].days[0].minutes===488&&g[0].days[0].date==='1405/07/09');
 check('تردد فرد روز ناقص است',g[1].days[0].incomplete===true&&g[1].days[0].minutes===0&&g[1].days[1].minutes===780);
 g=R.groupEntries(R.fromTable([['کد','نام','نام خانوادگی','تاریخ','ورود 1','خروج 1','ورود 2','خروج 2'],['12','رضا','احمدی','1405/07/09','08:00','12:00','18:00','01:00']]).entries);
 check('چند جفت ورود/خروج و شیفت عبوری از نیمه‌شب',g[0].name==='رضا احمدی'&&g[0].days[0].pairs.length===2&&g[0].days[0].minutes===660);
 g=R.groupEntries(R.fromJson({data:[{code:'5',name:'Ali',days:[{date:'1405/07/09',in:'08:00',out:'16:30'},{date:'1405/07/10',punches:['08:00','12:00','13:00','17:00']}]}]}).entries);
 check('JSON تودرتو با فیلدهای والد و آرایه ترددها',g.length===1&&g[0].key==='5'&&g[0].days[0].minutes===510&&g[0].days[1].minutes===480);
 g=R.groupEntries(R.fromJson([{userId:3,timestamp:'2026-10-01T08:00:00'},{userId:3,timestamp:'2026-10-01T17:15:00'}]).entries);
 check('JSON آرایه ساده با timestamp میلادی',g.length===1&&g[0].key==='3'&&g[0].days[0].minutes===555);
 const dat=R.fromPlainText('  1\t2026-10-01 08:02:11\t1\t0\n  1\t2026-10-01 17:00:00\t1\t0\nnoise');
 check('فایل متنی attlog.dat',dat.entries.length===2&&dat.skipped===1);

 ctx.window.RayoExcel={loadXLSX:async()=>fakeXLSX({Sheet1:sheet([['کد پرسنلی','تاریخ','ساعت'],[{t:'n',v:5,w:'5'},{t:'n',v:46296,z:'yyyy-mm-dd'},{t:'n',v:0.3333333333,z:'hh:mm'}],[5,{t:'n',v:46296,z:'yyyy-mm-dd'},{t:'n',v:0.7083333333,z:'hh:mm'}]])})};
 let parsed=await R.parseFile(file('device.xlsx',''));
 check('Excel با سلول‌های تاریخ/ساعت واقعی',parsed.format==='excel'&&parsed.entries.length===2&&parsed.entries[0].date==='1405/07/09'&&parsed.entries[0].times[0]==='08:00'&&parsed.entries[1].times[0]==='17:00');
 parsed=await R.parseFile(file('device.json',JSON.stringify({records:[{code:'9',date:'1405/07/09',in:'08:00',out:'16:00'}]})));
 check('parseFile برای JSON',parsed.format==='json'&&parsed.entries.length===1);
 await rejects('JSON نامعتبر خطای روشن می‌دهد',R.parseFile(file('bad.json','{oops')),/JSON معتبر نیست/);
 await rejects('فایل بدون ستون تاریخ/ساعت رد می‌شود',R.parseFile(file('x.json','[{"a":1}]')),/ستون تاریخ و ساعت/);

 const logs=[{personnelId:'P1',year:1405,month:7,status:'replaced',source:{importedAt:'2026-10-01'},days:[{date:'1405/07/09',pairs:[{in:'10:00',out:'11:00'}]}]},{personnelId:'P1',year:1405,month:7,status:'active',source:{importedAt:'2026-10-02'},days:[{date:'1405/07/09',pairs:[{in:'08:00',out:'17:00'}]},{date:'1405/07/10',pairs:[{in:'08:00',out:''}]},{date:'1405/08/01',pairs:[{in:'08:00',out:'09:00'}]}]}];
 const shifts=[{personnelId:'P1',date:'1405/07/09',scheduledHours:8},{personnelId:'P1',date:'1405/07/10',scheduledHours:8},{personnelId:'P1',date:'1405/07/11',scheduledHours:8},{personnelId:'P1',date:'1405/07/12',scheduledHours:8,status:'مرخصی'}];
 let s=R.summary({logs,corrections:[],shiftRecords:shifts,personnelId:'P1',year:1405,month:7});
 check('فقط ریز کارکرد فعال و روزهای همان ماه',s.log.status==='active'&&s.rows.length===3&&s.totals.worked===540);
 check('اضافه‌کار، کسر کار، غیبت و روز ناقص روزانه',s.totals.overtime===60&&s.totals.undertime===960&&s.totals.absent===1&&s.totals.incomplete===1&&s.basis==='shifts');
 const corrections=[{id:'C1',personnelId:'P1',date:'1405/07/10',requestedIn:'08:00',requestedOut:'15:00',approvedIn:'08:00',approvedOut:'16:00',status:'تاییدشده'},{id:'C2',personnelId:'P1',date:'1405/07/11',requestedIn:'08:00',requestedOut:'16:00',status:'در انتظار'},{id:'C3',personnelId:'P1',date:'1405/07/09',requestedIn:'07:00',requestedOut:'17:00',status:'ردشده'}];
 s=R.summary({logs,corrections,shiftRecords:shifts,personnelId:'P1',year:1405,month:7});
 const d10=s.rows.find(r=>r.date==='1405/07/10');
 check('درخواست تأییدشده (با ساعت اصلاح‌شده مدیر) جای ثبت دستگاه را می‌گیرد',d10.source==='correction'&&d10.minutes===480&&d10.original[0].out===''&&s.totals.corrected===1);
 check('درخواست در انتظار یا ردشده اثری ندارد',s.rows.find(r=>r.date==='1405/07/11').status==='غیبت'&&s.rows.find(r=>r.date==='1405/07/09').minutes===540);
 s=R.summary({logs,corrections:[],shiftRecords:[],person:{id:'P1',salaryContract:{hoursPerShift:7}},year:1405,month:7});
 check('بدون شیفت: ساعت موظف قرارداد برای هر روز حضور',s.basis==='standard'&&s.totals.expected===840&&s.rows.every(r=>r.status!=='غیبت'));
 check('نمایش ساعت:دقیقه',R.hm(485)==='8:05'&&R.hm(-60)==='-1:00'&&R.hours(485)===8.08);

 console.log('مدیریت: کارکرد ماه و درخواست‌های اصلاح (js/19، js/00)');
 new vm.Script(admin,{filename:'js/19-phase2-admin.js'});
 check('آرایه‌های جدید در ensureHr',admin.includes("for(const k of ['leaveRequests','attendanceLogs','attendanceCorrections'])"));
 check('ورود فایل Excel/CSV/JSON/متنی',admin.includes('accept=".xlsx,.xls,.csv,.json,.txt,.dat"'));
 check('ورود دوباره، نسخه قبلی را حذف نمی‌کند و «replaced» می‌کند',admin.includes("Object.assign(prev,{status:'replaced',replacedAt:at,replacedBy:user})")&&!/attendanceLogs\s*=\s*state\.attendanceLogs\.filter/.test(admin));
 check('در ماه قطعی‌شده ورود فایل مسدود است',/function attOpenImport[\s\S]*?isPeriodClosed\(y,m\)\)return msg/.test(admin)&&/async function attSaveImport[\s\S]*?isPeriodClosed\(y,m\)\)return msg/.test(admin));
 check('Save ناموفق، state را برمی‌گرداند',/catch\(e\)\{state\.attendanceLogs=backup\.logs;state\.monthlyAdjustments=backup\.adj;state\.settings=backup\.settings/.test(admin)&&/if\(!ok\)\{Object\.keys\(c\)/.test(admin));
 check('رد درخواست بدون علت ممکن نیست',admin.includes("if(rejecting&&!note)return msg('برای رد درخواست، ثبت علت رد الزامی است',true)"));
 check('کارکرد واقعی فقط وقتی از ریز کارکرد آمده خودکار به‌روز می‌شود',admin.includes("a.hoursFromAttendanceLog!==true||isPeriodClosed(y,m))return false"));
 check('نمای درخواست‌ها ثبت شده است',admin.includes("views.attendanceCorrections=attCorrectionsView")&&admin.includes('installAttendance();'));
 check('دکمه‌های جدول کارکرد ماه',base.includes('onclick="p2AttOpenImport()"')&&base.includes("onclick=\"p2AttShowLog('${r.personnelId}')\"")&&base.includes('personnel.html?view=attendanceCorrections'));
 {
  const els={},el=id=>els[id]||(els[id]={id,value:'',checked:false,textContent:'',innerHTML:'',disabled:false,dataset:{},classList:{add(){},remove(){},toggle(){}}});
  const msgs=[];let commits=0,commitOk=true,closed=false;
  const state={personnel:[{id:'P1',name:'علی',status:'فعال'},{id:'P2',name:'سارا',status:'فعال'}],shiftRecords:shifts,monthlyAdjustments:[],leaveRequests:[],leaves:[],settings:{},attendanceLogs:[{id:'ATTL-0001',personnelId:'P1',year:1405,month:7,status:'active',source:{importedAt:'2026-09-30'},days:[{date:'1405/07/01',pairs:[{in:'08:00',out:'09:00'}]}]}],attendanceCorrections:[]};
  const a={console,URLSearchParams,structuredClone,Promise,Date,JSON,Math,setTimeout:()=>{},state,ui:{payroll:{year:1405,month:7}},views:{},titles:{},
   location:{pathname:'/personnel.html',search:'?view=payroll'},sessionStorage:{getItem:()=>'مدیر'},
   document:{querySelectorAll:s=>s==='[data-att-group]'?selects:[],querySelector:()=>null,getElementById:el,body:{appendChild(){}},createElement:()=>({dataset:{},classList:{add(){}},style:{}})},
   $:el,toast:(m,e)=>msgs.push([m,!!e]),closeModal:()=>{},renderView:()=>{},pageHead:t=>`<h1>${t}</h1>`,badge:x=>`<span>${x}</span>`,personLabel:id=>id,monthName:m=>`M${m}`,isPeriodClosed:()=>closed,
   adjFor:(pid,y,m)=>{let x=state.monthlyAdjustments.find(r=>r.personnelId===pid&&r.year===y&&r.month===m);if(!x){x={personnelId:pid,year:y,month:m,hoursOverride:''};state.monthlyAdjustments.push(x)}return x},
   commit:async()=>{commits++;return commitOk}};
  let selects=[];a.window=a;a.globalThis=a;vm.createContext(a);vm.runInContext(excel,a);vm.runInContext(admin,a,{filename:'js/19-phase2-admin.js'});
  check('نمای درخواست‌های اصلاح روی صفحه مدیریت نصب می‌شود',typeof a.views.attendanceCorrections==='function'&&a.titles.attendanceCorrections==='درخواست‌های اصلاح کارکرد');
  a.RayoExcel={loadXLSX:async()=>fakeXLSX({S:sheet([['AC-No.','Name','Date/Time'],['5','Ali','2026/10/01 08:00'],['5','Ali','2026/10/01 17:00'],['5','Ali','2026/11/01 08:00'],['9','Sara','2026/10/02 10:00'],['9','Sara','2026/10/02 14:00']])})};
  a.p2AttOpenImport('');await a.p2AttFileChosen({name:'device.xlsx',arrayBuffer:async()=>new ArrayBuffer(1)});
  check('پیش‌نمایش: تطبیق نام با پرسنل و روزهای خارج از ماه',el('attPreview').innerHTML.includes('خارج از ماه')&&el('attImportSave').disabled===false);
  selects=[{dataset:{attGroup:'0'},value:'P1'},{dataset:{attGroup:'1'},value:'P1'}];el('attSetHours').checked=true;
  await a.p2AttSaveImport();
  check('یک نفر برای دو کد دستگاه پذیرفته نمی‌شود',commits===0&&msgs.some(([m])=>/دو کد دستگاه/.test(m)));
  selects=[{dataset:{attGroup:'0'},value:'P1'},{dataset:{attGroup:'1'},value:'P2'}];commitOk=false;
  await a.p2AttSaveImport();
  check('Save ناموفق: هیچ تغییری در state نمی‌ماند',commits===1&&state.attendanceLogs.length===1&&state.attendanceLogs[0].status==='active'&&!state.monthlyAdjustments.length&&!state.settings.attendanceDeviceMap);
  commitOk=true;await a.p2AttSaveImport();
  const p1=state.attendanceLogs.filter(x=>x.personnelId==='P1');
  check('ورود موفق: نسخه قبلی «replaced» و نسخه جدید فقط روزهای همین ماه',state.attendanceLogs.length===3&&p1[0].status==='replaced'&&p1[0].replacedBy==='مدیر'&&p1[1].status==='active'&&p1[1].days.length===1&&p1[1].totalMinutes===540&&p1[1].source.fileName==='device.xlsx');
  check('کارکرد واقعی و نگاشت کد دستگاه ذخیره می‌شود',state.monthlyAdjustments.find(x=>x.personnelId==='P1').hoursOverride==='9'&&state.monthlyAdjustments.find(x=>x.personnelId==='P1').hoursFromAttendanceLog===true&&state.settings.attendanceDeviceMap['5']==='P1'&&state.settings.attendanceDeviceMap['9']==='P2');
  state.attendanceCorrections.push({id:'ATTC-00001',personnelId:'P1',date:'1405/07/09',currentPairs:[{in:'08:00',out:'17:00'}],requestedIn:'08:00',requestedOut:'18:00',status:'در انتظار'},{id:'ATTC-00002',personnelId:'P2',date:'1405/07/10',requestedIn:'09:00',requestedOut:'15:00',status:'در انتظار'});
  check('شمارنده درخواست‌های در انتظار',a.p2AttPendingCount()===2&&a.views.attendanceCorrections().includes('ATTC-00001'));
  a.p2AttReview('ATTC-00002','ردشده');el('attMgrNote').value='';await a.p2AttSubmitReview('ATTC-00002','ردشده');
  check('رد بدون علت ذخیره نمی‌شود',state.attendanceCorrections[1].status==='در انتظار');
  el('attMgrNote').value='در دوربین حضور نداشتید';await a.p2AttSubmitReview('ATTC-00002','ردشده');
  check('رد با علت ثبت می‌شود و کارکرد واقعی دستی را تغییر نمی‌دهد',state.attendanceCorrections[1].status==='ردشده'&&state.attendanceCorrections[1].managerNote==='در دوربین حضور نداشتید'&&state.monthlyAdjustments.find(x=>x.personnelId==='P2').hoursOverride==='4');
  a.p2AttReview('ATTC-00001','تاییدشده');el('attApprIn').value='08:00';el('attApprOut').value='17:30';el('attMgrNote').value='';
  await a.p2AttSubmitReview('ATTC-00001','تاییدشده');
  check('تأیید با ساعت اصلاح‌شده مدیر و به‌روزرسانی کارکرد واقعی',state.attendanceCorrections[0].status==='تاییدشده'&&state.attendanceCorrections[0].approvedOut==='17:30'&&state.attendanceCorrections[0].reviewedBy==='مدیر'&&state.monthlyAdjustments.find(x=>x.personnelId==='P1').hoursOverride==='9.5');
  check('ریز کارکرد دستگاه هنگام تأیید ویرایش نمی‌شود',state.attendanceLogs.find(x=>x.personnelId==='P1'&&x.status==='active').days[0].pairs[0].out==='17:00');
  closed=true;const before=commits;a.p2AttOpenImport('');
  check('ماه قطعی: ورود فایل باز نمی‌شود',msgs.some(([m])=>/ماه قطعی است/.test(m))&&commits===before);
 }
 check('مسیر و منوی مدیریت',shell.includes("'attendanceCorrections'")&&polish.includes("['درخواست‌های اصلاح کارکرد','personnel.html?view=attendanceCorrections']")&&polish.includes("['payroll','attendanceCorrections','payslip'"));

 console.log('پنل پرسنل: کارکرد ماه من (js/22)');
 new vm.Script(staff,{filename:'js/22-staff-panel.js'});
 check('صفحه و منوی پرسنل',staff.includes("attendance:'attendance.html'")&&staff.includes("['attendance','⏱️','کارکرد ماه من']")&&staff.includes('attendance:staffAttendanceView'));
 check('صفحه HTML پرسنل، 18 را قبل از 22 بارگذاری می‌کند',page.includes('data-staff-view="attendance"')&&page.indexOf('18-excel-tools.js')>0&&page.indexOf('18-excel-tools.js')<page.indexOf('22-staff-panel.js'));
 check('درخواست تکراری در انتظار برای یک روز پذیرفته نمی‌شود',staff.includes("throw new Error('برای این تاریخ یک درخواست در انتظار بررسی دارید')"));
 check('توضیح، ورود و خروج الزامی و تاریخ آینده ممنوع',staff.includes("return toastStaff('توضیح درخواست الزامی است',true)")&&staff.includes("return toastStaff('ساعت ورود و خروج صحیح را وارد کنید',true)")&&staff.includes('date>DG(today())'));
 check('ثبت درخواست با Snapshot ثبت دستگاه',staff.includes('currentPairs:cur?cur.pairs:[]')&&staff.includes("status:'در انتظار'"));

 // Staff page run through the real staffInit against an in-memory hr document (no network, no real Save).
 const els={},el=id=>els[id]||(els[id]={id,value:'',textContent:'',innerHTML:'',dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(x){(this.children||(this.children=[])).push(x)}});
 const server={hr:{personnel:[{id:'P1',name:'علی',status:'فعال',userAccess:{enabled:true,permissions:{}}},{id:'P2',name:'سارا',status:'فعال',userAccess:{enabled:true,permissions:{}}}],attendanceLogs:JSON.parse(JSON.stringify(logs)),attendanceCorrections:[{id:'ATTC-00001',personnelId:'P1',date:'1405/07/11',status:'در انتظار'}],shiftRecords:shifts,monthlyAdjustments:[{personnelId:'P1',year:1405,month:7,overtimeHours:'1',undertimeHours:''}],lists:{},meta:{},unknownRoot:{keep:1}}};
 let saves=0;
 const c={console,URL,URLSearchParams,Intl,Date,Math,JSON,Promise,clearTimeout,setTimeout:()=>{},innerWidth:1200,confirm:()=>true,
  location:{pathname:'/personel/attendance.html',search:'',replace:u=>{c.redirect=u}},sessionStorage:{getItem:()=>JSON.stringify({personnelId:'P1',name:'علی'}),removeItem(){}},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  document:{readyState:'complete',head:{appendChild(){}},body:{dataset:{staffView:'attendance'},appendChild(){}},getElementById:el,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({dataset:{},classList:{add(){},remove(){}},style:{},remove(){}}),addEventListener(){},documentElement:{dataset:{}}},
  RayoJalali:{today:()=>'1405/07/30',mark(){}},
  RAYO_API_GATEWAY:{loadOrBootstrap:async m=>{if(!server[m])throw new Error('not loaded');return JSON.parse(JSON.stringify(server[m]))},saveModule:async(m,d)=>{saves++;server[m]=JSON.parse(JSON.stringify(d));return{ok:true}}}};
 c.window=c;c.globalThis=c;vm.createContext(c);vm.runInContext(excel,c);vm.runInContext(staff,c,{filename:'js/22-staff-panel.js'});
 await c.staffInit();
 check('صفحه برای پرسنل بدون مجوز خاص باز می‌شود',!c.redirect);
 const html=el('staffView').innerHTML;
 check('نمای پرسنل جمع کارکرد، اضافه‌کار و کسر کار را نشان می‌دهد',html.includes('جمع کارکرد')&&html.includes('اضافه‌کار')&&html.includes('کسر کار')&&html.includes('۹:۰۰')&&html.includes('staffAttPrefill'));
 check('روزی که درخواست در انتظار دارد دکمه دوباره ندارد',!html.includes("staffAttPrefill('1405/07/11')")&&html.includes("staffAttPrefill('1405/07/10')"));
 check('اضافه‌کار ثبت‌شده در حقوق نمایش داده می‌شود',html.includes('ثبت‌شده در حقوق این ماه'));
 check('باز کردن صفحه هیچ Save انجام نمی‌دهد',saves===0);
 const setForm=(date,tin,tout,note)=>{el('staffAttDate').value=date;el('staffAttIn').value=tin;el('staffAttOut').value=tout;el('staffAttNote').value=note};
 setForm('1405/07/11','08:00','16:00','دستگاه خاموش بود');await c.staffSaveAttendanceCorrection();
 check('درخواست تکراری در انتظار ذخیره نمی‌شود',saves===0&&server.hr.attendanceCorrections.length===1);
 setForm('1405/07/10','08:00','16:00','');await c.staffSaveAttendanceCorrection();
 check('بدون توضیح ذخیره نمی‌شود',saves===0);
 setForm('1405/08/05','08:00','16:00','آینده');await c.staffSaveAttendanceCorrection();
 check('تاریخ آینده ذخیره نمی‌شود',saves===0);
 setForm('۱۴۰۵/۰۷/۱۰','08:00','16:00','خروج ثبت نشد');await c.staffSaveAttendanceCorrection();
 const added=server.hr.attendanceCorrections.at(-1);
 check('درخواست معتبر روی سند تازه hr ذخیره می‌شود',saves===1&&server.hr.attendanceCorrections.length===2&&added.personnelId==='P1'&&added.date==='1405/07/10'&&added.currentPairs[0].in==='08:00'&&added.currentPairs[0].out===''&&added.requestedOut==='16:00'&&added.status==='در انتظار');
 check('فیلدهای ناشناخته سند hr حفظ می‌شوند',server.hr.unknownRoot?.keep===1&&server.hr.attendanceLogs.length===2);
 assert.strictEqual(added.id,'ATTC-00002');
 console.log(`PASS ${passed}: attendance import formats, monthly summary, corrections, admin wiring and staff request flow`);
})().catch(e=>{console.error(e);process.exit(1)});
