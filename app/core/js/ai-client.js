/* =========================================================
   Rayo — ai-client.js
   Optional connection to an OpenAI-compatible chat API (ChatGPT) for reading invoice photos (APP_REVIEW P-13).
   Every flow works without it: the photo is shown next to the form and the lines are typed by hand.
   The connection (API key, model, address) is kept ONLY in this browser (localStorage «rayo.ai»), never in the live
   data: the data API has no sign-in yet (BL-003), so a key stored there could be read by anyone. Each device that
   should read invoices sets it once in «تنظیمات ← عمومی ← هوش مصنوعی». The address can point to a proxy that
   forwards to api.openai.com (useful where the API is not reachable directly).
   AiClient.invoice(file) → {supplier, number, date, currency, lines:[{name, quantity, unit, unitPrice, total}],
   discount, tax}; amounts in toman (a rial invoice is divided by 10 here).
   ========================================================= */
(function(){
'use strict';
const KEY='rayo.ai',DEF={base:'https://api.openai.com/v1',model:'gpt-4o-mini',enabled:true};
function get(){try{return{...DEF,...(JSON.parse(localStorage.getItem(KEY)||'null')||{})}}catch(_){return{...DEF}}}
function set(v){const c={base:String(v.base||DEF.base).trim(),model:String(v.model||DEF.model).trim(),key:String(v.key||'').trim(),enabled:v.enabled!==false};try{localStorage.setItem(KEY,JSON.stringify(c))}catch(_){throw Error('این مرورگر اجازهٔ ذخیره نمی‌دهد')}return c}
function clear(){try{localStorage.removeItem(KEY)}catch(_){}}
const ready=()=>{const c=get();return !!c.key&&c.enabled!==false};
async function chat(messages,{json=true,max=2000}={}){const c=get();if(!c.key)throw Error('اتصال هوش مصنوعی تنظیم نشده است (تنظیمات ← عمومی ← هوش مصنوعی)');
 const base=c.base.replace(/\/+$/,'');let r;
 try{r=await fetch(base+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+c.key},body:JSON.stringify({model:c.model,messages,max_tokens:max,temperature:0,...(json?{response_format:{type:'json_object'}}:{})})})}
 catch(e){throw Error('به سرویس هوش مصنوعی وصل نشد ('+(e.message||e)+'). نشانی یا اینترنت را بررسی کنید.')}
 const t=await r.text();if(!r.ok)throw Error(`هوش مصنوعی: HTTP ${r.status} ${t.slice(0,180)}`);let j;try{j=JSON.parse(t)}catch(_){throw Error('پاسخ سرویس قابل خواندن نبود')}
 return j.choices?.[0]?.message?.content||''}
/* the photo is resized to at most 1600 px (fewer tokens, faster upload) */
function shrink(file,max=1600){return new Promise((ok,no)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);ok(c.toDataURL('image/jpeg',0.85))};img.onerror=()=>{URL.revokeObjectURL(url);no(Error('تصویر خوانده نشد'))};img.src=url})}
const PROMPT=`You read Iranian purchase invoices (فاکتور خرید) of a café-restaurant. Return ONLY a JSON object:
{"supplier":"seller name as written","number":"invoice number","date":"Jalali date YYYY/MM/DD or empty","currency":"ریال or تومان as printed (if unclear, تومان)",
 "lines":[{"name":"item name as written","quantity":number,"unit":"unit as written (کیلو، عدد، بسته، کارتن…)","unitPrice":number,"total":number}],
 "discount":number,"tax":number}
Numbers are plain numbers with Latin digits, no separators. Do not invent lines; skip totals rows. Use 0 when a value is missing.`;
const num=v=>{const n=Number(String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g,''));return Number.isFinite(n)?n:0};
async function invoice(file){const url=await shrink(file);const out=await chat([{role:'system',content:PROMPT},{role:'user',content:[{type:'text',text:'Extract this invoice.'},{type:'image_url',image_url:{url}}]}],{max:3000});
 let j;try{j=JSON.parse(out)}catch(_){throw Error('پاسخ هوش مصنوعی JSON نبود')}const k=/ریال/.test(String(j.currency||''))?0.1:1;
 const lines=(Array.isArray(j.lines)?j.lines:[]).map(l=>({name:String(l.name||'').trim(),quantity:num(l.quantity),unit:String(l.unit||'').trim(),unitPrice:Math.round(num(l.unitPrice)*k),total:Math.round(num(l.total)*k)})).filter(l=>l.name);
 return{supplier:String(j.supplier||'').trim(),number:String(j.number||'').trim(),date:String(j.date||'').trim().replace(/-/g,'/'),currency:k===1?'تومان':'ریال',lines,discount:Math.round(num(j.discount)*k),tax:Math.round(num(j.tax)*k)}}
async function test(){const t=await chat([{role:'user',content:'Return the JSON object {"ok":true}'}],{max:20});return /true/.test(t)}
window.AiClient={get,set,clear,ready,chat,invoice,test,shrink};
})();
