// QA: newpanel/core/js/admin-access.js — sign-in and admin users must match the current panel (js/00 + js/44).
// Run: node qa_template_admin_access.js
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const store={};global.sessionStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
global.window={};eval(fs.readFileSync(path.join(__dirname,'../app/core/js/admin-access.js'),'utf8'));
const AA=window.AdminAccess;
// the current panel's own sha256 (js/44) and static users (js/00), evaluated separately
const src44=fs.readFileSync(path.join(__dirname,'../legacy/js/44-phase1-polish-v10-10-1.js'),'utf8').split(/\r?\n/),i=src44.findIndex(l=>l.startsWith('function sha256(text)'));
const ctx=vm.createContext({unescape,encodeURIComponent});vm.runInContext(src44.slice(i,i+4).join('\n')+';this.sha256=sha256',ctx);
for(const t of ['','abc','salt:رمز۱۲۳','x'.repeat(200)])ok(AA.sha256(t)===ctx.sha256(t),'sha256 equals js/44 for '+JSON.stringify(t.slice(0,12)));
ok(AA.sha256('abc')==='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad','sha256 is the standard SHA-256');
const base=fs.readFileSync(path.join(__dirname,'../legacy/js/00-base.js'),'utf8').match(/const STATIC_USERS_V5=\{[^}]*\};/)[0];
ok(fs.readFileSync(path.join(__dirname,'../app/core/js/admin-access.js'),'utf8').includes(base),'static owner sign-ins equal js/00');
const SU=vm.runInNewContext(base.replace('const STATIC_USERS_V5=','(').replace(/;$/,'')+')');const [owner,ownerPass]=Object.entries(SU)[0];
ok(AA.verify(null,owner,ownerPass)?.role==='owner'&&!AA.verify(null,owner,ownerPass+'x'),'owner sign-in');
const doc={settings:{adminUsers:[]},personnel:[{id:'P1'}]},c={actor:'qa',at:'2026-11-08T10:00:00Z'};
throws(()=>AA.saveUser(doc,c,{username:'ab',password:'123456',sections:['inventory']}),/۳ تا ۳۲/,'username rule');
throws(()=>AA.saveUser(doc,c,{username:owner,password:'123456',sections:['inventory']}),/قبلاً/,'static name reserved');
throws(()=>AA.saveUser(doc,c,{username:'store1',password:'123',sections:['inventory']}),/حداقل ۶/,'password length');
throws(()=>AA.saveUser(doc,c,{username:'store1',password:'123456',sections:[]}),/حداقل یک بخش/,'needs a section');
const u=AA.saveUser(doc,c,{username:'store1',displayName:'انباردار',password:'secret1',sections:['inventory','bogus']});
const rec=doc.settings.adminUsers[0];ok(/^ADM-/.test(u.id)&&rec.salt.length===16&&rec.passwordHash===ctx.sha256(rec.salt+':secret1')&&JSON.stringify(rec.sections)==='["inventory"]'&&rec.status==='فعال','record shape like js/44 (hash verifiable by the current panel)');
ok(AA.verify(doc,'STORE1','secret1')?.sections?.[0]==='inventory'&&!AA.verify(doc,'store1','nope'),'user sign-in, name case-insensitive');
throws(()=>AA.saveUser(doc,c,{username:'Store1',password:'abcdef',sections:['menu']}),/قبلاً/,'duplicate name');
const h0=rec.passwordHash;AA.saveUser(doc,c,{id:u.id,username:'store1',password:'',status:'غیرفعال',sections:['inventory']});ok(rec.passwordHash===h0&&!AA.verify(doc,'store1','secret1'),'edit keeps password; disabled user cannot sign in');
AA.signIn({username:'store1',role:'user',sections:['inventory']});ok(AA.has('inventory')&&!AA.has('menu')&&!AA.canManage(),'session sections');
ok(!AA.stillValid(doc),'disabled user is no longer valid');AA.signOut();ok(!AA.session(),'sign out clears the session');
// owner «view as»: only the owner may preview; sections narrow has(); the stored role keys of the current panel stay owner
AA.signIn({username:'store1',role:'user',sections:['inventory']});throws(()=>AA.setPreview(AA.PRESETS[0]),/فقط مالک/,'a non-owner cannot preview');AA.signOut();
AA.signIn({username:owner,role:'owner',sections:'*'});const cashier=AA.PRESETS.find(p=>p.id==='cashier');ok(cashier&&AA.PRESETS.some(p=>p.id==='accountant')&&AA.PRESETS.some(p=>p.id==='manager'),'preset roles');
AA.setPreview(cashier);const ps=AA.session();ok(ps.role==='user'&&ps.preview.label==='صندوقدار'&&ps.user===owner&&AA.has('cash')&&!AA.has('payroll')&&!AA.canManage(),'preview narrows the session');
ok(store.rayo_admin_role==='owner'&&AA.realSession().role==='owner','current-panel keys stay owner');ok(AA.stillValid(doc),'preview is not signed out by the users check');
AA.setPreview({id:'x',label:'x',sections:['menu','bogus']});ok(JSON.stringify(AA.session().sections)==='["menu"]','unknown sections dropped');
AA.setPreview(null);ok(AA.session().role==='owner'&&AA.has('payroll'),'back to owner');AA.setPreview(cashier);AA.signOut();ok(!AA.preview()&&!('rayo_np_preview' in store),'sign out clears the preview');
// access list of the new panel: every stored key of the current panel is kept (only «monitor» is hidden), new keys exist,
// presets use known keys, and editing a user keeps a hidden legacy key on the record
const keys=AA.SECTIONS.map(x=>x[0]),legacy=['dashboard','monitor','cash','sales','personnel','shift','payroll','menu','pricing','inventory','purchase','training','financeLedger','reports','assets','settings','inventoryEdit'];
ok(legacy.every(k=>keys.includes(k)||AA.LEGACY_SECTIONS.some(x=>x[0]===k)),'every key of the current panel is kept');
ok(['customers','petty'].every(k=>keys.includes(k))&&new Set(keys).size===keys.length,'new keys, no duplicates');
ok(AA.SECTIONS.every(x=>x[1]&&x[2]&&x[3])&&AA.SECTION_GROUPS.length>=7,'each key has a label, a group and a description');
ok(AA.PRESETS.every(p=>p.sections.every(k=>keys.includes(k))),'presets use known keys');
const d2={settings:{adminUsers:[{id:'ADM-1',username:'old1',salt:'s',passwordHash:'h',status:'فعال',sections:['dashboard','monitor','cash']}]}};
AA.saveUser(d2,c,{id:'ADM-1',username:'old1',status:'فعال',sections:['cash','petty','cash']});ok(JSON.stringify(d2.settings.adminUsers[0].sections)==='["cash","petty","monitor"]','edit keeps a hidden legacy key, drops duplicates');
ok(AA.sectionName('monitor').includes('مانیتورینگ')&&AA.sectionName('zzz')==='zzz','section names');
// staff of the staff app (app/staff.html, 1G-1): legacy staff-panel check, permissions → sections, only inside the staff app
{const hr={personnel:[{id:'EMP-1',name:'سارا',status:'فعال',username:'Sara',userPassword:'1234',userAccess:{enabled:true,permissions:{cashReport:true,beverageControl:true,tips:false}}},{id:'EMP-2',name:'علی',status:'فعال',username:'ali',userPassword:'x',userAccess:{enabled:false,permissions:{}}},{id:'EMP-3',name:'رفته',status:'غیرفعال',username:'old',userPassword:'y',userAccess:{enabled:true}}]};
 ok(AA.verifyStaff(hr,'sara','12345')===null&&AA.verifyStaff(hr,'ali','x')===null&&AA.verifyStaff(hr,'old','y')===null,'wrong password, disabled panel or inactive person refused');
 const r=AA.verifyStaff(hr,'SARA','1234');ok(r&&r.role==='staff'&&r.personnelId==='EMP-1'&&r.username==='سارا'&&r.sections.join()==='assets,cash,inventory','staff sign-in: username without case, sections from permissions');
 AA.signOut();AA.signInStaff(r);ok(AA.session()===null&&AA.staff()===null&&!AA.has('cash'),'outside the staff app a staff sign-in opens nothing');
 window.RAYO_STAFF_APP=1;ok(AA.staff().personnelId==='EMP-1'&&AA.staffCan('cashReport')&&!AA.staffCan('tips')&&AA.has('cash')&&!AA.has('payroll')&&!AA.canManage(),'inside the staff app: the person and their permissions');
 ok(JSON.parse(sessionStorage.getItem('rayo_staff_session')).personnelId==='EMP-1','legacy staff session key written');
 ok(AA.verifyStaff({personnel:[{id:'E',name:'ن',status:'فعال',username:'n',userPassword:'p',userAccess:{enabled:true,permissions:{tips:true,reservations:true,suppliersView:true}}}]},'n','p').sections.join()==='assets,personnel,customers','tips → personnel, reservations → customers, suppliersView needs no section');
 hr.personnel[0].userAccess.permissions.cashReport=false;ok(AA.stillValid(hr)&&!AA.staffCan('cashReport')&&!AA.has('cash'),'a permission removed by the manager is dropped on the next check');
 hr.personnel[0].userAccess.enabled=false;ok(!AA.stillValid(hr),'disabled panel signs the person out');
 AA.signOut();ok(!sessionStorage.getItem('rayo_staff_session')&&!sessionStorage.getItem('rayo_staff_perms'),'sign-out clears the staff keys');delete window.RAYO_STAFF_APP}
console.log(`qa_template_admin_access: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
