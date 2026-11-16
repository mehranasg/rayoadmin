/* =========================================================
   Rayo new panel — admin-access.js
   Sign-in and admin users exactly like the current panel (js/00 loginV5 + js/44 RayoAdminAccess):
   - fixed owner sign-ins (STATIC_USERS_V5 of js/00) → role «owner», full access;
   - other users from personnel settings.adminUsers {id ADM-…, username, displayName, salt, passwordHash
     (sha256 of "salt:password", same function as js/44), status فعال|غیرفعال, fullAccess, sections[], createdAt/By,
     updatedAt/By} → role «user» with their sections;
   - the same sessionStorage keys (rayo_admin_user / rayo_admin_role / rayo_admin_sections), so one sign-in serves both panels.
   This is a browser-side guard like the current panel, not a server security boundary (server work is a later stage).
   STATIC_USERS_V5 and sha256 are copied from js/00 and js/44 (qa_template_admin_access.js checks both).
   ========================================================= */
(function(){
'use strict';
const S=x=>String(x??'').trim(),A=x=>Array.isArray(x)?x:[];
const STATIC_USERS_V5={Admin:'Salar!%',Ziba:'Ziba123!',Mehran:'Ava!%'};
function sha256(text){const b=unescape(encodeURIComponent(String(text))),K=[],H=[];let n=2,c=0;const isP=v=>{for(let f=2;f*f<=v;f++)if(v%f===0)return false;return true},fr=v=>(v-Math.floor(v))*4294967296|0;while(c<64){if(isP(n)){if(c<8)H[c]=fr(Math.pow(n,1/2));K[c]=fr(Math.pow(n,1/3));c++}n++}
 const w=[],l=b.length*8;for(let i=0;i<b.length;i++)w[i>>2]|=b.charCodeAt(i)<<((3-i%4)*8);w[b.length>>2]|=0x80<<((3-b.length%4)*8);w[((b.length+8>>6)<<4)+15]=l;const r=(x,y)=>x>>>y|x<<32-y;
 for(let j=0;j<w.length;j+=16){const W=Array.from({length:16},(_,k)=>w[j+k]|0);let [a,bb,cc,d,e,f,g,h]=H;for(let i=0;i<64;i++){if(i>=16){const x=W[i-15],y=W[i-2];W[i]=(W[i-16]+(r(x,7)^r(x,18)^x>>>3)+W[i-7]+(r(y,17)^r(y,19)^y>>>10))|0}const t1=h+(r(e,6)^r(e,11)^r(e,25))+(e&f^~e&g)+K[i]+(W[i]|0),t2=(r(a,2)^r(a,13)^r(a,22))+(a&bb^a&cc^bb&cc);h=g;g=f;f=e;e=d+t1|0;d=cc;cc=bb;bb=a;a=t1+t2|0}H[0]=H[0]+a|0;H[1]=H[1]+bb|0;H[2]=H[2]+cc|0;H[3]=H[3]+d|0;H[4]=H[4]+e|0;H[5]=H[5]+f|0;H[6]=H[6]+g|0;H[7]=H[7]+h|0}
 return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')}
function passwordHash(salt,password){return sha256(`${salt}:${password}`)}
/* access keys, grouped by the sections of the new panel: [key, label, group, what it opens].
   The ids of the current panel (js/44) are kept unchanged because they are stored in settings.adminUsers; only the labels
   describe the new panel. New keys of the new panel: customers, petty. The tab → key map is in js/shell.js (MOD_KEYS/TAB_KEYS). */
const SECTIONS=[
 ['dashboard','خلاصهٔ میز کار','میز کار','فروش دیروز و ماه، نمودار فروش، کارهای عقب‌افتاده و خلاصهٔ ماه‌ها (بدون آن فقط «کارهای روزانه» دیده می‌شود)'],
 ['financeLedger','امور مالی','مالی','خلاصهٔ مالی، هزینه‌ها، بدهی و چک، سود و زیان، حساب‌ها، غذای پرسنل، محاسبه‌گر، تنظیمات مالی؛ و همهٔ تب‌های مالی'],
 ['purchase','فاکتور خرید و تأمین‌کنندگان','مالی','فاکتورها، پرداخت به تأمین‌کننده، طرف حساب‌ها و درخواست خرید'],
 ['cash','گزارش صندوق','مالی','صندوق (گزارش هر شیفت) و صندوق نقدی'],
 ['petty','تنخواه','مالی','کارت‌های تنخواه و هزینه‌های آن'],
 ['assets','دارایی‌ها','مالی','اموال، خرابی، تعمیر و شمارش دارایی'],
 ['inventory','انبار','انبار','موجودی، ورود کالا، ضایعات و پرتی، شمارش، سفارش، مصرف، گزارش‌ها و تنظیمات انبار'],
 ['inventoryEdit','ویرایش و ابطال ثبت‌های انبار','انبار','اصلاح، ابطال و بازگردانی ورود، ضایعات و شمارش'],
 ['personnel','پروندهٔ پرسنل','پرسنل','پرسنل، تخلفات، مرخصی، انعام و گزارش پرسنل'],
 ['shift','شیفت‌پلن و حضور','پرسنل','شیفت‌پلن و حضور و غیاب'],
 ['payroll','حقوق و دستمزد','پرسنل','حقوق ماه، کارکرد، پرداخت به پرسنل، انعام، جریمه و تنظیمات حقوق'],
 ['training','آموزش و چک‌لیست','پرسنل','قالب‌های چک‌لیست و آموزش'],
 ['menu','آیتم‌های منو و رسپی','منو و قیمت','آیتم‌های منو، رسپی و بهای تمام‌شده، مهندسی منو'],
 ['pricing','قیمت‌گذاری و قیمت مواد','منو و قیمت','تغییر قیمت منو، کالاها و مواد و قیمت آن‌ها'],
 ['customers','مشتریان','مشتریان','رزرو و بیعانه، نظرسنجی'],
 ['reports','گزارش‌های مدیریتی','گزارش‌ها','خلاصهٔ مالک، سود و زیان دوره، نمای مدیریتی، ماه به ماه'],
 ['sales','آمار و تحلیل فروش','گزارش‌ها','آمار فروش، روند محصولات، تحلیل فروش'],
 ['settings','تنظیمات','تنظیمات','تنظیمات عمومی، داده و بکاپ، تاریخچهٔ تغییرات و لاگ خطاها']];
/* keys of the current panel that the new panel no longer uses: hidden from the form, kept on the record when a user is edited */
const LEGACY_SECTIONS=[['monitor','پنل مانیتورینگ (پنل قبلی)']];
const SECTION_GROUPS=[...new Set(SECTIONS.map(x=>x[2]))];
const sectionName=k=>([...SECTIONS,...LEGACY_SECTIONS].find(x=>x[0]===k)||[k,k])[1];
const sameName=(a,b)=>S(a).toLowerCase()===S(b).toLowerCase();
const isStatic=u=>Object.prototype.hasOwnProperty.call(STATIC_USERS_V5,S(u));
const users=doc=>A(doc?.settings?.adminUsers);
/* {username, role, sections} or null; doc = the personnel module (needed only for non-owner users) */
function verify(doc,username,password){username=S(username);if(!username||!password)return null;if(STATIC_USERS_V5[username]===password)return{username,role:'owner',sections:'*'};
 const rec=users(doc).find(x=>sameName(x.username,username));if(!rec||S(rec.status)==='غیرفعال'||!rec.salt||rec.passwordHash!==passwordHash(rec.salt,password))return null;
 return{username:rec.username,role:'user',sections:rec.fullAccess?'*':A(rec.sections)}}
const KEYS=['rayo_admin_user','rayo_admin_role','rayo_admin_sections'];
const ss=(k,v)=>{try{if(v===undefined)return sessionStorage.getItem(k)||'';if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(_){return ''}};
function realSession(){const user=ss('rayo_admin_user');if(!user)return null;let sections=null;try{sections=JSON.parse(ss('rayo_admin_sections')||'null')}catch(_){}const role=ss('rayo_admin_role')||(isStatic(user)?'owner':'user');return{user,role,sections:role==='owner'?'*':sections}}
/* owner «view as»: the panel shows and allows only the sections of a preset role or of a real admin user; the owner
   stays the signed-in user (saves carry the owner name). Kept in its own sessionStorage key, which the current panel does not read. */
const PRESETS=[
 {id:'manager',label:'مدیر میانی',icon:'briefcase',desc:'عملیات روزانه: صندوق، تنخواه، انبار، پرسنل و شیفت، منو، مشتریان و آمار فروش؛ بدون حقوق، امور مالی و تنظیمات',sections:['dashboard','cash','petty','purchase','assets','inventory','personnel','shift','training','menu','pricing','customers','sales']},
 {id:'accountant',label:'حسابدار',icon:'calculator',desc:'مالی، خرید، صندوق، تنخواه، دارایی، حقوق و گزارش‌ها',sections:['dashboard','financeLedger','purchase','cash','petty','assets','payroll','pricing','reports','sales']},
 {id:'storekeeper',label:'انباردار',icon:'package',desc:'انبار، فاکتور خرید و قیمت مواد',sections:['inventory','purchase','pricing']},
 {id:'cashier',label:'صندوقدار',icon:'banknote',desc:'فقط گزارش صندوق',sections:['cash']}];
function preview(){const r=realSession();if(!r||r.role!=='owner')return null;try{const p=JSON.parse(ss('rayo_np_preview')||'null');return p&&Array.isArray(p.sections)?p:null}catch(_){return null}}
function setPreview(p){if(!p){ss('rayo_np_preview',null);return}const r=realSession();if(!r||r.role!=='owner')throw Error('فقط مالک می‌تواند پنل را از دید نقش‌ها ببیند');
 ss('rayo_np_preview',JSON.stringify({id:S(p.id),label:S(p.label),icon:S(p.icon)||'user',sections:A(p.sections).map(S).filter(k=>SECTIONS.some(x=>x[0]===k))}))}
function session(){const r=realSession();if(!r)return null;const p=preview();return p?{user:r.user,role:'user',sections:p.sections,preview:p}:r}
function signIn(r){ss('rayo_admin_user',r.username);ss('rayo_admin_role',r.role);ss('rayo_admin_sections',JSON.stringify(r.sections))}
function signOut(){KEYS.forEach(k=>ss(k,null));ss('rayo_np_preview',null)}
function has(key){const s=session();if(!s)return false;if(s.role==='owner'||s.sections==='*')return true;return Array.isArray(s.sections)&&s.sections.includes(key)}
const canManage=()=>{const s=session();return !!s&&(s.role==='owner'||s.sections==='*')};
/* a signed-in user that was disabled or removed in the live personnel data is signed out (js/44 guardPage) */
function stillValid(doc){const s=session();if(!s||s.role==='owner'||s.preview)return true;const rec=users(doc).find(x=>sameName(x.username,s.user));if(!rec||S(rec.status)==='غیرفعال')return false;ss('rayo_admin_sections',JSON.stringify(rec.fullAccess?'*':A(rec.sections)));return true}
/* add or edit a user inside the personnel document (js/44 saveUser rules) */
function saveUser(doc,ctx,x){const id=S(x.id),username=S(x.username),password=x.password||'',full=!!x.fullAccess;let sections=[...new Set(A(x.sections).map(S).filter(k=>SECTIONS.some(s=>s[0]===k)))];
 if(!/^[A-Za-z0-9_.-]{3,32}$/.test(username))throw Error('نام کاربری ۳ تا ۳۲ حرف انگلیسی، عدد، نقطه، خط تیره یا زیرخط باشد');
 doc.settings=doc.settings&&typeof doc.settings==='object'?doc.settings:{};const list=doc.settings.adminUsers=A(doc.settings.adminUsers);
 if(isStatic(username)||list.some(u=>u.id!==id&&sameName(u.username,username)))throw Error('این نام کاربری قبلاً استفاده شده است');
 if(!id&&password.length<6)throw Error('رمز عبور حداقل ۶ نویسه باشد');if(id&&password&&password.length<6)throw Error('رمز جدید حداقل ۶ نویسه باشد');
 if(!full&&!sections.length)throw Error('حداقل یک بخش را انتخاب کنید');
 let rec=list.find(u=>u.id===id);if(id&&!rec)throw Error('کاربر پیدا نشد');if(rec&&!sameName(rec.username,username))throw Error('نام کاربری تغییر نمی‌کند');
 if(rec)sections=sections.concat(A(rec.sections).filter(k=>LEGACY_SECTIONS.some(s=>s[0]===k)&&!sections.includes(k)));
 if(!rec){rec={id:`ADM-${Date.now().toString(36).toUpperCase()}`,username,createdAt:ctx.at,createdBy:ctx.actor};list.push(rec)}
 Object.assign(rec,{displayName:S(x.displayName),status:S(x.status)==='غیرفعال'?'غیرفعال':'فعال',fullAccess:full,sections:full?[]:sections,updatedAt:ctx.at,updatedBy:ctx.actor});
 if(password){rec.salt=sha256(`${Math.random()}:${Date.now()}:${username}`).slice(0,16);rec.passwordHash=passwordHash(rec.salt,password)}
 ctx.auditExtra={entityId:rec.id};return{id:rec.id,username:rec.username}}
window.AdminAccess={SECTIONS,LEGACY_SECTIONS,SECTION_GROUPS,sectionName,PRESETS,preview,setPreview,realSession,verify,session,signIn,signOut,has,canManage,stillValid,saveUser,isStatic,sha256,passwordHash};
})();
