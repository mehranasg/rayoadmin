/* =========================================================
   Rayo UI Template — invoice-ai.js
   Purchase invoice capture with AI extraction (design; extraction is simulated).
   The real call goes browser → Rayo backend → Claude API; the API key never reaches the browser.
   ========================================================= */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=new Intl.NumberFormat('fa-IR'),TF=v=>v==null||!Number.isFinite(v)?'—':fa.format(Math.round(v))+' تومان',q=v=>v==null?'—':fa.format(v);
const N=v=>{const n=Number(String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٬,]/g,''));return Number.isFinite(n)?n:0};

/* catalog subset (mock) — in the panel: pricing.ingredients + supplier item aliases */
const CATALOG=[{id:'ING-1001',name:'پنیر موزارلا',unit:'کیلوگرم',purchaseUnit:'کیلوگرم',pack:1,last:685000,aliases:['موزارلا','پنیر پیتزا']},{id:'ING-2034',name:'خامه پاکتی',unit:'لیتر',purchaseUnit:'کارتن ۱۲ عددی',pack:12,last:4800000,aliases:['خامه صبحانه','خامه ۲۰۰']},{id:'ING-2050',name:'شیر پرچرب',unit:'عدد',purchaseUnit:'عدد',pack:1,last:85000,aliases:['شیر کم‌چرب','شیر تتراپک']},{id:'ING-3011',name:'کره حیوانی',unit:'کیلوگرم',purchaseUnit:'کیلوگرم',pack:1,last:1045000,aliases:['کره ۱۰۰ گرمی','کره']}];
const SUPPLIERS=[{id:'SUP-012',name:'پخش لبنیات نمونه',code:'012'}];
/* simulated AI output for the sample photo (same JSON schema the backend returns) */
const SAMPLE={supplier:{name:'پخش لبنیات نمونه',phone:'۰۲۱-۰۰۰۰۰۰۰۰',confidence:0.95},invoice_number:'۴۸۲۱۷',date:'۱۴۰۵/۰۸/۱۴',currency:'IRR',
 lines:[{description:'پنیر پیتزا موزارلا ۲ کیلویی',quantity:10,unit:'کیلو',unit_price:7100000,line_total:71000000,confidence:0.93},
  {description:'خامه صبحانه ۲۰۰ گرمی کارتن',quantity:2,unit:'کارتن',unit_price:49000000,line_total:98000000,confidence:0.88},
  {description:'کره ۱۰۰ گرمی',quantity:5,unit:'کیلو',unit_price:12900000,line_total:64500000,confidence:0.61},
  {description:'شیر تتراپک پرچرب',quantity:24,unit:'عدد',unit_price:880000,line_total:21120000,confidence:0.9}],
 discount:0,tax:22862000,total:277482000,notes:'قیمت‌ها به ریال',warnings:['ردیف ۳: عدد مقدار کم‌رنگ است']};

let draft=null,step=1;
const steps=()=>`<div class="ia-steps">${[['۱. عکس فاکتور','با دوربین گوشی؛ چند صفحه هم ممکن است'],['۲. استخراج AI','تأمین‌کننده، شماره، تاریخ، اقلام و جمع‌ها'],['۳. بازبینی','تطبیق با کاتالوگ، تبدیل واحد، کنترل قیمت و جمع'],['۴. تأیید مدیر','پس از تأیید، فاکتور خرید نهایی ثبت می‌شود']].map(([b,s],i)=>`<div class="${i+1<=step?'on':''}"><b>${b}</b>${s}</div>`).join('')}</div>`;
function match(desc){const d=String(desc);let best=null;for(const c of CATALOG){const keys=[c.name,...c.aliases];const hit=keys.find(k=>d.includes(k));if(hit&&(!best||hit.length>best.len))best={c,len:hit.length}}return best?.c||null}
// rial → toman; purchase unit → recipe unit; reference price check vs last purchase (±15%)
function enrich(x){const rial=x.currency==='IRR',f=rial?0.1:1;return{...x,lines:x.lines.map((l,i)=>{const c=match(l.description),unitPrice=l.unit_price*f,total=l.line_total*f,perUnit=c?unitPrice:null,ref=c?.last??null,diff=ref?(perUnit-ref)/ref*100:null;return{...l,i,c,unitPrice,total,ref,diff,calcOk:Math.abs(l.quantity*l.unit_price-l.line_total)<=Math.max(1,l.line_total*0.005)}}),totalT:x.total*f,taxT:x.tax*f,discountT:x.discount*f}}
function checks(d){const sum=d.lines.reduce((a,l)=>a+l.total,0),out=[];if(Math.abs(sum+d.taxT-d.discountT-d.totalT)>Math.max(10,d.totalT*0.005))out.push(['danger',`جمع ردیف‌ها + مالیات − تخفیف (${TF(sum+d.taxT-d.discountT)}) با جمع فاکتور (${TF(d.totalT)}) نمی‌خواند`]);else out.push(['success','جمع ردیف‌ها با جمع فاکتور می‌خواند']);
 for(const l of d.lines){if(!l.c)out.push(['warning',`ردیف ${q(l.i+1)}: قلم کاتالوگ پیدا نشد — انتخاب کنید یا قلم جدید بسازید`]);if(!l.calcOk)out.push(['danger',`ردیف ${q(l.i+1)}: مقدار × قیمت واحد ≠ جمع ردیف`]);if(l.confidence<0.75)out.push(['warning',`ردیف ${q(l.i+1)}: اطمینان AI پایین (${q(Math.round(l.confidence*100))}٪) — با عکس مقایسه کنید`]);if(l.diff!==null&&Math.abs(l.diff)>15)out.push([l.diff>0?'danger':'warning',`ردیف ${q(l.i+1)}: قیمت ${q(Math.round(l.diff))}٪ ${l.diff>0?'بیشتر':'کمتر'} از آخرین خرید (${TF(l.ref)})`])}
 out.push(['info','شمارهٔ فاکتور ۴۸۲۱۷ برای این تأمین‌کننده تکراری نیست']);if(d.currency==='IRR')out.push(['info','مبالغ فاکتور ریال بود و به تومان تبدیل شد']);return out}
function newView(el){el.innerHTML=steps()+`<div class="grid grid-3"><div class="card"><div class="card-head"><div><h2>عکس فاکتور</h2><p>روی گوشی مستقیم دوربین باز می‌شود</p></div></div><div class="card-body stack">
 <label class="ia-photo" id="iaPhoto">${draft?.img?`<img src="${draft.img}" alt="فاکتور">`:'<span><i data-lucide="camera" style="width:40px;height:40px"></i><br>برای گرفتن یا انتخاب عکس بزنید</span>'}<input type="file" accept="image/*" capture="environment" id="iaFile" hidden></label>
 <button class="btn btn-primary" id="iaRun"><i data-lucide="sparkles"></i>${step>=2?'استخراج دوباره':'استخراج با AI'} (نمونه)</button>
 <p class="mut" style="font-size:12px">در نسخهٔ واقعی عکس به سرور رایو می‌رود و سرور آن را برای Claude می‌فرستد؛ کلید API فقط روی سرور است.</p></div></div>
 <div class="card span-2"><div class="card-head"><div><h2>پیش‌نویس استخراج‌شده</h2><p>خانه‌های زرد = اطمینان پایین؛ قرمز = ناسازگار. همه قابل ویرایش‌اند.</p></div></div><div class="card-body" id="iaDraft">${draft?.data?draftHtml(draft.data):'<div class="empty">هنوز استخراجی انجام نشده است</div>'}</div></div></div>`;
 $('iaPhoto').onclick=()=>$('iaFile').click();$('iaFile').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{draft={...(draft||{}),img:r.result};newView(el);RT.icons()};r.readAsDataURL(f)};
 $('iaRun').onclick=()=>{$('iaDraft').innerHTML='<div class="empty"><i data-lucide="loader"></i> در حال خواندن فاکتور…</div>';RT.icons();setTimeout(()=>{draft={...(draft||{}),data:enrich(SAMPLE)};step=3;newView(el);RT.icons()},900)}}
function draftHtml(d){const sup=SUPPLIERS.find(s=>s.name===d.supplier.name);return `<div class="grid grid-3"><div class="field"><label>تأمین‌کننده</label><select class="select"><option>${esc(sup?.name||d.supplier.name)}</option></select><span class="ia-conf">${sup?'تطبیق با تأمین‌کنندهٔ ثبت‌شده':'تأمین‌کنندهٔ جدید'} · اطمینان ${q(Math.round(d.supplier.confidence*100))}٪</span></div><div class="field"><label>شمارهٔ فاکتور</label><input class="input" value="${esc(d.invoice_number)}"></div><div class="field"><label>تاریخ</label><input class="input" value="${esc(d.date)}"></div></div>
 <div class="table-wrap mt"><table class="table"><thead><tr><th>شرح در فاکتور</th><th>قلم کاتالوگ</th><th class="num">مقدار</th><th>واحد</th><th class="num">قیمت واحد (تومان)</th><th class="num">جمع</th><th class="num">آخرین خرید</th><th>کنترل</th></tr></thead><tbody>
 ${d.lines.map(l=>`<tr class="${!l.calcOk?'ia-bad':l.confidence<0.75?'ia-low':''}"><td>${esc(l.description)}<div class="ia-conf">اطمینان ${q(Math.round(l.confidence*100))}٪</div></td><td><select class="select">${l.c?`<option>${esc(l.c.name)}</option>`:'<option>— انتخاب قلم —</option>'}${CATALOG.filter(c=>c!==l.c).map(c=>`<option>${esc(c.name)}</option>`).join('')}<option>+ قلم جدید</option></select>${l.c?`<div class="ia-conf">واحد خرید: ${esc(l.c.purchaseUnit)}${l.c.pack>1?` = ${q(l.c.pack)} ${esc(l.c.unit)}`:''}</div>`:''}</td><td class="num"><input class="input num" value="${q(l.quantity)}"></td><td>${esc(l.unit)}</td><td class="num"><input class="input num" value="${fa.format(l.unitPrice)}"></td><td class="num">${TF(l.total)}</td><td class="num">${TF(l.ref)}</td><td>${l.diff===null?'':`<span class="badge badge-${Math.abs(l.diff)>15?(l.diff>0?'danger':'warning'):'success'}">${l.diff>0?'+':''}${q(Math.round(l.diff))}٪</span>`}</td></tr>`).join('')}
 </tbody></table></div>
 <div class="grid grid-3 mt"><div class="pc-sum"><span class="mut">مالیات</span><br><b>${TF(d.taxT)}</b></div><div><span class="mut">تخفیف</span><br><b>${TF(d.discountT)}</b></div><div><span class="mut">جمع فاکتور</span><br><b>${TF(d.totalT)}</b></div></div>
 <div class="stack mt">${checks(d).map(([s,t])=>`<div class="alert alert-${s}" style="padding:8px 12px"><div><p>${esc(t)}</p></div></div>`).join('')}</div>
 <div class="row mt" style="justify-content:flex-end;gap:8px"><label class="check"><input type="checkbox" checked>ورود به انبار هم ثبت شود</label><button class="btn btn-ghost" onclick="RT.toast('پیش‌نویس رد شد')">رد</button><button class="btn btn-secondary" onclick="RT.toast('برای تأیید مدیر فرستاده شد')">ارسال برای تأیید مدیر</button><button class="btn btn-primary" onclick="RT.toast('در قالب ذخیره نمی‌شود — مدیر تأیید و فاکتور نهایی می‌شود')">تأیید و نهایی (مدیر)</button></div>`}
function queueView(el){const rows=[['۱۴۰۵/۰۸/۱۴','پخش لبنیات نمونه','۴۸۲۱۷',27748200,'مسئول خرید','۲ هشدار'],['۱۴۰۵/۰۸/۱۵','تره‌بار نمونه','—',3850000,'سرآشپز','تأمین‌کنندهٔ جدید'],['۱۴۰۵/۰۸/۱۶','پخش بسته‌بندی نمونه','۹۰۳۳',12600000,'مسئول خرید','بدون هشدار']];
 el.innerHTML=`<div class="card"><div class="card-head"><div><h2>پیش‌نویس‌های منتظر تأیید</h2><p>فقط مدیر (دسترسی «ثبت فاکتور») نهایی می‌کند؛ تا تأیید، فاکتور در حساب تأمین‌کننده و انبار اثری ندارد.</p></div></div><div class="card-body"><div class="table-wrap"><table class="table"><thead><tr><th>تاریخ</th><th>تأمین‌کننده</th><th>شماره</th><th class="num">جمع</th><th>ثبت‌کننده</th><th>کنترل</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="num">${TF(r[3])}</td><td>${r[4]}</td><td><span class="badge badge-${r[5]==='بدون هشدار'?'success':'warning'}">${r[5]}</span></td><td><button class="btn btn-ghost btn-sm" onclick="InvoiceAI._goNew()">بازبینی</button></td></tr>`).join('')}</tbody></table></div></div></div>`}
const SCHEMA={type:'object',additionalProperties:false,required:['supplier','invoice_number','date','currency','lines','discount','tax','total','warnings'],properties:{supplier:{type:'object',additionalProperties:false,required:['name','phone','confidence'],properties:{name:{type:'string'},phone:{type:'string'},confidence:{type:'number'}}},invoice_number:{type:'string'},date:{type:'string',description:'Jalali yyyy/mm/dd as printed'},currency:{type:'string',enum:['IRR','IRT']},lines:{type:'array',items:{type:'object',additionalProperties:false,required:['description','quantity','unit','unit_price','line_total','confidence'],properties:{description:{type:'string'},quantity:{type:'number'},unit:{type:'string'},unit_price:{type:'number'},line_total:{type:'number'},confidence:{type:'number'}}}},discount:{type:'number'},tax:{type:'number'},total:{type:'number'},warnings:{type:'array',items:{type:'string'}}}};
function designView(el){el.innerHTML=`<div class="card"><div class="card-head"><div><h2>جریان داده</h2></div></div><div class="card-body"><ol style="line-height:2.2;margin:0;padding-inline-start:20px">
 <li><b>گوشی</b>: <code>&lt;input type=file accept=image/* capture=environment&gt;</code>؛ عکس در مرورگر کوچک می‌شود (ضلع بلند حدود ۲۰۰۰ پیکسل، JPEG) تا ارسال سریع باشد.</li>
 <li><b>سرور رایو</b> (<code>POST /RayoData/ExtractInvoice</code>): عکس را ذخیره می‌کند (فایل پیوست فاکتور)، همراه با دستورالعمل و JSON Schema برای Claude می‌فرستد. <b>کلید API فقط روی سرور</b>؛ مرورگر هرگز مستقیم Claude را صدا نمی‌زند.</li>
 <li><b>Claude</b> (مدل <code>claude-opus-5-5</code>): خروجی ساختاریافته طبق Schema (<code>output_config.format</code>)؛ فارسی و ارقام فارسی را می‌خواند و برای هر ردیف «اطمینان» می‌دهد.</li>
 <li><b>سرور</b>: تطبیق با تأمین‌کننده و کاتالوگ (نام، نام‌های مستعار ثبت‌شده برای هر تأمین‌کننده)، تبدیل ریال/تومان و واحد خرید، کنترل جمع، قیمت در برابر آخرین خرید و تکراری بودن شماره → ذخیره به‌صورت <code>suppliers.invoiceDrafts</code> با وضعیت «پیش‌نویس AI».</li>
 <li><b>بازبینی</b> در همین صفحه؛ <b>مدیر</b> تأیید می‌کند ← <code>purchaseInvoices</code> (و در صورت انتخاب، ورود به انبار). هر اصلاح مدیر روی پیش‌نویس ذخیره می‌شود و برای بهبود نام‌های مستعار به کار می‌رود.</li></ol>
 <p class="mut">هزینه: یک عکس فاکتور حدود ۱٫۵ تا ۲ هزار توکن ورودی و حدود ۱ هزار توکن خروجی است؛ با قیمت فعلی Opus 5.5 (۴ / ۲۰ دلار در هر میلیون توکن) حدود ۳ سنت برای هر فاکتور. همین سرویس برای رسید تنخواه هم استفاده می‌شود.</p></div></div>
 <div class="card mt"><div class="card-head"><div><h2>JSON Schema خروجی</h2><p>همان شکلی که بازبینی از آن پر می‌شود</p></div></div><div class="card-body"><div class="ia-code">${esc(JSON.stringify(SCHEMA,null,2))}</div></div></div>
 <div class="card mt"><div class="card-head"><div><h2>درخواست به Claude (HTTP)</h2></div></div><div class="card-body"><div class="ia-code">${esc(`POST https://api.anthropic.com/v1/messages
x-api-key: <ANTHROPIC_API_KEY on the server only>
anthropic-version: 2023-06-01
content-type: application/json

{
  "model": "claude-opus-5-5",
  "max_tokens": 16000,
  "output_config": {
    "effort": "low",
    "format": { "type": "json_schema", "schema": <JSON Schema above> }
  },
  "system": "You read photos of Iranian purchase invoices (Persian text, Persian or Latin digits). Extract exactly what is printed; never invent values. Use 0 or an empty string when a field is missing and add a short note to warnings. currency is IRR when amounts are in rials (ریال), IRT for tomans. confidence is 0-1 per line.",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "<base64 photo>" } },
      { "type": "text", "text": "Extract this purchase invoice." }
    ]
  }]
}`)}</div><p class="mut">پاسخ: <code>content[0].text</code> یک JSON مطابق Schema است. پیش از خواندن، <code>stop_reason</code> بررسی شود (<code>max_tokens</code> یا <code>refusal</code> = پیش‌نویس با خطا، نه نتیجهٔ خالی).</p></div></div>
 <div class="card mt"><div class="card-head"><div><h2>نمونهٔ سرور (C#، SDK رسمی Anthropic)</h2><p>پروژهٔ Backend رایو C# است؛ نام نوع بلوک تصویر هنگام Build با کامپایلر تأیید شود</p></div></div><div class="card-body"><div class="ia-code">${esc(`using System.Text.Json;
using Anthropic;
using Anthropic.Models.Messages;

// AnthropicClient reads ANTHROPIC_API_KEY from the server environment.
AnthropicClient client = new();

var message = await client.Messages.Create(new MessageCreateParams
{
    Model = "claude-opus-5-5",
    MaxTokens = 16000,
    System = InvoicePrompt.System,                 // the system text above
    OutputConfig = new OutputConfig
    {
        Effort = Effort.Low,
        Format = new JsonOutputFormat { Schema = InvoicePrompt.Schema },  // Dictionary<string, JsonElement>
    },
    Messages = [ new UserMessageParam {
        Content = new List<ContentBlockParam> {
            // image block: base64 JPEG of the photo (type names checked at build)
            new ImageBlockParam { Source = new Base64ImageSource { Data = base64Jpeg, MediaType = "image/jpeg" } },
            new TextBlockParam { Text = "Extract this purchase invoice." },
        },
    } ],
});
if (message.StopReason != "end_turn") { /* save draft with error, do not guess */ }
// parse the JSON text block → InvoiceDraft, then match supplier/catalog and save as suppliers.invoiceDrafts`)}</div></div></div>`}
function render(k,host){({new:newView,queue:queueView,design:designView})[k](host||document.querySelector(`[data-panel="ia:${k}"]`));RT.icons()}
/* Embedding (panel): the capture flow in a modal, the queue and the design in a finance tab */
window.InvoiceAI_go=()=>goNew();let goNew=()=>document.querySelector('#iaTabs [data-tab=new]')?.click();
window.InvoiceAI={VIEWS:{queue:'صف تأیید مدیر',design:'طرح فنی'},render(view,host,openNew){if(openNew)goNew=openNew;render(view,host)},open(){if(!window.P?.modal)return;draft=null;step=1;const m=P.modal({title:'ثبت فاکتور خرید با عکس (AI)',size:'wide',body:'<div id="iaModalHost"></div>'});render('new',m.querySelector('#iaModalHost'))},queueCount:()=>3,_goNew:()=>goNew()};
document.addEventListener('DOMContentLoaded',()=>{if(!$('iaTabs'))return;RT.tabs($('iaTabs'),k=>render(k));render('new')});
})();
