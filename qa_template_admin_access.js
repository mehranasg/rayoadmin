// QA: newpanel/core/js/admin-access.js — sign-in and admin users must match the current panel (js/00 + js/44).
// Run: node qa_template_admin_access.js
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const throws=(f,re,m)=>{try{f();ok(false,m+' (no error)')}catch(e){ok(re.test(e.message),m+' → '+e.message)}};
const store={};global.sessionStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
global.window={};eval(fs.readFileSync(path.join(__dirname,'newpanel/core/js/admin-access.js'),'utf8'));
const AA=window.AdminAccess;
// the current panel's own sha256 (js/44) and static users (js/00), evaluated separately
const src44=fs.readFileSync(path.join(__dirname,'js/44-phase1-polish-v10-10-1.js'),'utf8').split(/\r?\n/),i=src44.findIndex(l=>l.startsWith('function sha256(text)'));
const ctx=vm.createContext({unescape,encodeURIComponent});vm.runInContext(src44.slice(i,i+4).join('\n')+';this.sha256=sha256',ctx);
for(const t of ['','abc','salt:رمز۱۲۳','x'.repeat(200)])ok(AA.sha256(t)===ctx.sha256(t),'sha256 equals js/44 for '+JSON.stringify(t.slice(0,12)));
ok(AA.sha256('abc')==='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad','sha256 is the standard SHA-256');
const base=fs.readFileSync(path.join(__dirname,'js/00-base.js'),'utf8').match(/const STATIC_USERS_V5=\{[^}]*\};/)[0];
ok(fs.readFileSync(path.join(__dirname,'newpanel/core/js/admin-access.js'),'utf8').includes(base),'static owner sign-ins equal js/00');
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
console.log(`qa_template_admin_access: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
