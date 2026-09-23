(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const E=x=>S(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=x=>{const n=Number(String(x??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٬,،,\s]/g,''));return Number.isFinite(n)?n:0};
const now=()=>new Date().toISOString();
const today=()=>window.RayoJalali?.today?.()||'';
const F=n=>Number(n||0).toLocaleString('fa-IR',{maximumFractionDigits:1});
const uid=(prefix,rows)=>{let m=0;A(rows).forEach(x=>{const q=S(x.id).match(/(\d+)$/);if(q)m=Math.max(m,+q[1])});return `${prefix}-${String(m+1).padStart(5,'0')}`};
const modal=()=>({title:document.getElementById('modalTitle'),body:document.getElementById('modalBody'),foot:document.getElementById('modalFoot'),back:document.getElementById('modalBackdrop')});
const checked=id=>!!document.getElementById(id)?.checked;
const val=id=>S(document.getElementById(id)?.value);
const PROTOCOL_TYPES=['آموزش','پروتکل','آیین‌نامه'];
const PROTOCOL_IMPORT_SCHEMA_VERSION=1;
const PROTOCOL_IMPORT_MAX_ITEMS=200;
const PROTOCOL_IMPORT_MAX_BYTES=2*1024*1024;
const PROTOCOL_IMPORT_RECORD_KEYS=['title','content','type','group','audienceAll','audienceSections','isActive'];
const PROTOCOL_IMPORT_TOP_KEYS=['schemaVersion','items'];
const AMBIGUOUS_SAVE_MARK='اطلاعات این صفحه را نبندید';
const normText=x=>S(x).replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ');
const isAmbiguousSaveError=e=>['timeout','network_error','empty_response','invalid_json'].includes(S(e?.code))||String(e?.message||'').includes(AMBIGUOUS_SAVE_MARK);
let importState=null;
function importResolveRef(name,candidates){const key=normText(name).toLowerCase();if(!key)return{status:'empty'};const hits=candidates.filter(c=>normText(c.label).toLowerCase()===key);if(hits.length===1)return{status:'match',item:hits[0]};if(hits.length>1)return{status:'ambiguous',items:hits};return{status:'none'}}
function protocolSig(type,title,content,groupKey,audienceAll,audienceSections){return [normText(type).toLowerCase(),normText(title).toLowerCase(),normText(content).toLowerCase(),groupKey||'',audienceAll?'ALL':A(audienceSections).map(s=>normText(s).toLowerCase()).sort().join('|')].join('␟')}
function buildImportRow(raw,i,ctx){
  const label=`ردیف ${i+1}`,errors=[];
  if(typeof raw!=='object'||raw===null||Array.isArray(raw))return{status:'invalid',errors:[`${label}: هر محتوا باید یک شیء JSON باشد`]};
  const extra=Object.keys(raw).filter(k=>!PROTOCOL_IMPORT_RECORD_KEYS.includes(k));
  if(extra.length)errors.push(`${label}: فیلد غیرمجاز (${extra.join('، ')})`);
  if(typeof raw.title!=='string'||!S(raw.title))errors.push(`${label}: عنوان الزامی و باید متن باشد`);
  if(typeof raw.content!=='string'||!S(raw.content))errors.push(`${label}: متن محتوا الزامی و باید متن باشد`);
  let type='';
  if(typeof raw.type!=='string'||!raw.type)errors.push(`${label}: نوع الزامی است`);
  else{const m=PROTOCOL_TYPES.find(t=>normText(t)===normText(raw.type));if(!m)errors.push(`${label}: نوع باید یکی از ${PROTOCOL_TYPES.join('، ')} باشد`);else type=m}
  let groupName='',groupId='',isNewGroup=false,newGroupKey='';
  if(raw.group!=null){
    if(typeof raw.group!=='string')errors.push(`${label}: group باید متن باشد`);
    else{groupName=S(raw.group);if(groupName){const m=importResolveRef(groupName,ctx.groupCandidates);if(m.status==='match')groupId=m.item.id;else if(m.status==='ambiguous')errors.push(`${label}: گروه «${groupName}» با چند گروه فعلی مطابقت مبهم دارد`);else{isNewGroup=true;newGroupKey=normText(groupName).toLowerCase()}}}
  }
  let audienceAll=null;
  if(typeof raw.audienceAll!=='boolean')errors.push(`${label}: audienceAll باید true یا false باشد`);else audienceAll=raw.audienceAll;
  let sectionsRaw=raw.audienceSections===undefined?[]:raw.audienceSections,audienceSections=[];
  if(!Array.isArray(sectionsRaw))errors.push(`${label}: audienceSections باید آرایه باشد`);
  else if(audienceAll===false){
    if(!sectionsRaw.length)errors.push(`${label}: حداقل یک بخش مخاطب یا audienceAll=true لازم است`);
    for(const s of sectionsRaw){
      if(typeof s!=='string'||!S(s)){errors.push(`${label}: نام بخش نامعتبر است`);continue}
      const m=importResolveRef(s,ctx.sectionCandidates);
      if(m.status==='match')audienceSections.push(m.item.label);
      else if(m.status==='ambiguous')errors.push(`${label}: بخش «${S(s)}» مبهم است`);
      else errors.push(`${label}: بخش «${S(s)}» در فهرست بخش‌های فعلی وجود ندارد`);
    }
  }
  let isActive=null;
  if(typeof raw.isActive!=='boolean')errors.push(`${label}: isActive باید true یا false باشد`);else isActive=raw.isActive;
  if(errors.length)return{status:'invalid',errors};
  return{status:'valid',errors:[],value:{title:S(raw.title),content:S(raw.content),type,groupName,groupId,isNewGroup,newGroupKey,audienceAll,audienceSections,isActive}};
}
function annotateImportDuplicates(rows,existingProtocols){
  const bySigExisting=new Set(),byTitleExisting=new Map();
  for(const p of A(existingProtocols)){
    const sig=protocolSig(p.type,p.title,p.content,p.groupId||'',p.audienceAll===true,A(p.audienceSections));
    bySigExisting.add(sig);
    const tk=normText(p.title).toLowerCase();
    if(!byTitleExisting.has(tk))byTitleExisting.set(tk,new Set());
    byTitleExisting.get(tk).add(sig);
  }
  const seenSig=new Map(),seenTitle=new Map();
  rows.forEach((row,idx)=>{
    if(row.baseStatus!=='valid')return;
    row.status='valid';row.dupWith='';row.conflictWith='';
    const v=row.value,groupKey=v.isNewGroup?`NEW:${v.newGroupKey}`:(v.groupId||''),sig=protocolSig(v.type,v.title,v.content,groupKey,v.audienceAll,v.audienceSections),tk=normText(v.title).toLowerCase();
    if(bySigExisting.has(sig)){row.status='duplicate';row.dupWith='محتوای موجود';return}
    if(seenSig.has(sig)){row.status='duplicate';row.dupWith=`ردیف ${seenSig.get(sig)+1}`;return}
    const existingTitleSigs=byTitleExisting.get(tk);
    if(existingTitleSigs&&!existingTitleSigs.has(sig)){row.status='conflict';row.conflictWith='محتوای موجود با همین عنوان'}
    else if(seenTitle.has(tk)&&seenTitle.get(tk).sig!==sig){row.status='conflict';row.conflictWith=`ردیف ${seenTitle.get(tk).index+1}`}
    seenSig.set(sig,idx);
    if(!seenTitle.has(tk))seenTitle.set(tk,{sig,index:idx});
  });
}
function reResolveGroupsAgainstFresh(rows,freshGroups){
  const candidates=A(freshGroups).map(g=>({id:g.id,label:g.name}));
  for(const row of rows){
    if(row.baseStatus!=='valid'||!row.value.isNewGroup)continue;
    const m=importResolveRef(row.value.groupName,candidates);
    if(m.status==='match'){row.value.isNewGroup=false;row.value.groupId=m.item.id}
  }
}
function protocolImportCounts(rows){
  const c={total:rows.length,duplicate:0,invalid:0,conflict:0,includable:0,newGroups:new Set()};
  for(const r of rows){
    if(r.status==='invalid')c.invalid++;
    else if(r.status==='duplicate')c.duplicate++;
    else if(r.status==='conflict'){c.conflict++;if(r.forceInclude){c.includable++;if(r.value.isNewGroup)c.newGroups.add(r.value.groupName)}}
    else{c.includable++;if(r.value.isNewGroup)c.newGroups.add(r.value.groupName)}
  }
  return c;
}
function ensure(){state.lists=state.lists||{};state.lists.protocolGroups=A(state.lists.protocolGroups);state.protocols=A(state.protocols);state.checklistTemplates=A(state.checklistTemplates);state.checklistRecords=A(state.checklistRecords)}
function openHelp(kind){const m=modal(),map={protocols:['راهنمای آموزش‌ها و پروتکل‌ها','ابتدا گروه‌های دلخواه خود را تعریف کنید؛ مثل «قوانین حضور»، «آموزش سالن» یا «آیین‌نامه‌ها». سپس هر محتوا را با نوع، گروه و مخاطب ثبت کنید. مخاطب می‌تواند همه پرسنل یا یک/چند بخش باشد. فقط محتوای فعال و مرتبط در پنل هر پرسنل دیده می‌شود.'],templates:['راهنمای تعریف چک‌لیست','برای هر چک‌لیست نام، نوع، مسئول یا مسئولان و شیفت‌های اجرا را مشخص کنید. آیتم‌ها را در سه مرحله «شروع شیفت»، «حین شیفت» و «پایان شیفت» وارد کنید؛ هر خط یک آیتم است. چک‌لیست «عمومی فردی» برای تمام پرسنل فعال در هر شیفت نمایش داده می‌شود. چک‌لیست سکشن فقط برای مسئولان تعیین‌شده نمایش داده می‌شود.'],reports:['راهنمای گزارش چک‌لیست','تاریخ را انتخاب کنید. سیستم برنامه شیفت همان روز را با قالب‌های فعال تطبیق می‌دهد و علاوه بر موارد انجام‌شده، چک‌لیست‌های ناقص و ثبت‌نشده را هم نشان می‌دهد. درصد انجام، توضیح پرسنل و زمان آخرین ثبت برای پیگیری مدیریتی نمایش داده می‌شود.']};const x=map[kind]||['راهنما',''];m.title.textContent=x[0];m.body.innerHTML=`<div class="hint">${E(x[1])}</div>`;m.foot.innerHTML='<button class="btn btn-primary" onclick="closeModal()">متوجه شدم</button>';m.back.classList.add('open')}
function groupName(id){return A(state.lists.protocolGroups).find(x=>x.id===id)?.name||'بدون گروه'}
function audienceText(p){const a=A(p.audienceSections);return p.audienceAll?'همه پرسنل':(a.length?a.join('، '):'—')}
function protocolsView(){ensure();const rows=A(state.protocols).slice().sort((a,b)=>S(b.updatedAt||b.createdAt).localeCompare(S(a.updatedAt||a.createdAt)));return pageHead('آموزش‌ها و پروتکل‌های کاری','ثبت آموزش، پروتکل و آیین‌نامه و تعیین مخاطب آن',`<button class="btn" onclick="RayoTraining.openHelp('protocols')">❓ راهنما</button> <button class="btn" onclick="RayoTraining.openProtocolGroup()">+ گروه جدید</button> <button class="btn btn-primary" onclick="RayoTraining.openProtocol()">+ محتوای جدید</button> <button class="btn" onclick="RayoTraining.openProtocolImport()">+ محتوای جدید (جیسون)</button>`)+`<div class="grid grid-2"><div class="card"><div class="section-head"><h2>گروه‌بندی محتوا</h2></div><div class="table-wrap"><table class="data-table"><thead><tr><th>گروه</th><th>تعداد محتوا</th><th></th></tr></thead><tbody>${A(state.lists.protocolGroups).map(g=>`<tr><td>${E(g.name)}</td><td>${rows.filter(x=>x.groupId===g.id).length}</td><td><button class="btn btn-sm" onclick="RayoTraining.openProtocolGroup('${g.id}')">ویرایش</button> <button class="btn btn-sm btn-danger" onclick="RayoTraining.deleteProtocolGroup('${g.id}')">حذف</button></td></tr>`).join('')||'<tr><td colspan="3" class="empty">هنوز گروهی تعریف نشده است.</td></tr>'}</tbody></table></div></div><div class="card"><div class="section-head"><h2>خلاصه</h2></div><div class="grid grid-3"><div class="kpi"><div class="label">کل محتوا</div><div class="value">${rows.length}</div></div><div class="kpi"><div class="label">فعال</div><div class="value">${rows.filter(x=>x.isActive!==false).length}</div></div><div class="kpi"><div class="label">گروه‌ها</div><div class="value">${A(state.lists.protocolGroups).length}</div></div></div></div></div><div class="card"><div class="section-head"><h2>لیست آموزش‌ها و پروتکل‌ها</h2></div><div class="table-wrap"><table class="data-table"><thead><tr><th>عنوان</th><th>نوع</th><th>گروه</th><th>مخصوص</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${E(x.title)}</b></td><td>${E(x.type||'پروتکل')}</td><td>${E(groupName(x.groupId))}</td><td>${E(audienceText(x))}</td><td>${x.isActive!==false?'<span class="badge success">فعال</span>':'<span class="badge warn">غیرفعال</span>'}</td><td><button class="btn btn-sm" onclick="RayoTraining.viewProtocol('${x.id}')">مشاهده</button> <button class="btn btn-sm" onclick="RayoTraining.openProtocol('${x.id}')">ویرایش</button> <button class="btn btn-sm btn-danger" onclick="RayoTraining.deleteProtocol('${x.id}')">حذف</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">محتوایی ثبت نشده است.</td></tr>'}</tbody></table></div></div></div>`}
function openProtocolGroup(id=''){ensure();const g=A(state.lists.protocolGroups).find(x=>x.id===id)||{name:''},m=modal();m.title.textContent=id?'ویرایش گروه':'گروه جدید';m.body.innerHTML=`<div class="form-grid"><div class="field full"><label>نام گروه</label><input id="trGroupName" value="${E(g.name)}" placeholder="مثلاً قوانین حضور در شیفت"></div></div>`;m.foot.innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="RayoTraining.saveProtocolGroup('${id}')">ذخیره</button>`;m.back.classList.add('open')}
async function saveProtocolGroup(id){ensure();const name=val('trGroupName');if(!name)return toast('نام گروه را وارد کنید',true);if(A(state.lists.protocolGroups).some(x=>x.id!==id&&S(x.name)===name))return toast('این گروه قبلاً ثبت شده است',true);if(id){const g=state.lists.protocolGroups.find(x=>x.id===id);if(g)g.name=name}else state.lists.protocolGroups.push({id:uid('PGRP',state.lists.protocolGroups),name,createdAt:now()});closeModal();await commit(id?'ویرایش گروه پروتکل':'ثبت گروه پروتکل')}
async function deleteProtocolGroup(id){ensure();if(A(state.protocols).some(x=>x.groupId===id))return toast('این گروه در محتواها استفاده شده و قابل حذف نیست',true);if(!confirm('گروه حذف شود؟'))return;state.lists.protocolGroups=state.lists.protocolGroups.filter(x=>x.id!==id);await commit('حذف گروه پروتکل')}
function openProtocol(id=''){ensure();const x=A(state.protocols).find(q=>q.id===id)||{title:'',type:'پروتکل',groupId:'',content:'',audienceAll:true,audienceSections:[],isActive:true},sections=A(state.lists.sections),groups=A(state.lists.protocolGroups),m=modal();m.title.textContent=id?'ویرایش آموزش / پروتکل':'محتوای جدید';m.body.innerHTML=`<div class="form-grid"><div class="field"><label>عنوان</label><input id="trTitle" value="${E(x.title)}"></div><div class="field"><label>نوع</label><select id="trType">${PROTOCOL_TYPES.map(v=>`<option ${x.type===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>گروه</label><select id="trGroup"><option value="">بدون گروه</option>${groups.map(g=>`<option value="${E(g.id)}" ${x.groupId===g.id?'selected':''}>${E(g.name)}</option>`).join('')}</select></div><div class="field"><label>وضعیت</label><select id="trActive"><option value="1" ${x.isActive!==false?'selected':''}>فعال</option><option value="0" ${x.isActive===false?'selected':''}>غیرفعال</option></select></div><div class="field full"><label><input type="checkbox" id="trAudienceAll" ${x.audienceAll?'checked':''}> برای همه پرسنل</label></div><div class="field full"><label>بخش‌های مخاطب — در صورت انتخاب «همه» نادیده گرفته می‌شود</label><select id="trAudienceSections" multiple size="7">${sections.map(s=>`<option value="${E(s)}" ${A(x.audienceSections).includes(s)?'selected':''}>${E(s)}</option>`).join('')}</select></div><div class="field full"><label>متن آموزش / پروتکل / آیین‌نامه</label><textarea id="trContent" rows="12">${E(x.content)}</textarea></div></div>`;m.foot.innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="RayoTraining.saveProtocol('${id}')">ذخیره</button>`;m.back.classList.add('open')}
async function saveProtocol(id){ensure();const title=val('trTitle'),content=val('trContent');if(!title||!content)return toast('عنوان و متن محتوا الزامی است',true);const audienceAll=checked('trAudienceAll'),audienceSections=[...document.getElementById('trAudienceSections').selectedOptions].map(o=>o.value);if(!audienceAll&&!audienceSections.length)return toast('حداقل یک بخش مخاطب یا گزینه همه پرسنل را انتخاب کنید',true);let x=A(state.protocols).find(q=>q.id===id);if(!x){x={id:uid('PROT',state.protocols),createdAt:now()};state.protocols.push(x)}Object.assign(x,{title,type:val('trType')||'پروتکل',groupId:val('trGroup'),content,audienceAll,audienceSections,isActive:val('trActive')!=='0',updatedAt:now()});closeModal();await commit(id?'ویرایش آموزش / پروتکل':'ثبت آموزش / پروتکل')}
function viewProtocol(id){ensure();const x=A(state.protocols).find(q=>q.id===id);if(!x)return;const m=modal();m.title.textContent=x.title;m.body.innerHTML=`<div class="hint"><b>${E(x.type||'پروتکل')}</b> — ${E(groupName(x.groupId))} — مخاطب: ${E(audienceText(x))}</div><div class="card" style="white-space:pre-wrap;line-height:2">${E(x.content)}</div>`;m.foot.innerHTML='<button class="btn btn-primary" onclick="closeModal()">بستن</button>';m.back.classList.add('open')}
async function deleteProtocol(id){if(!confirm('این محتوا حذف شود؟'))return;state.protocols=A(state.protocols).filter(x=>x.id!==id);await commit('حذف آموزش / پروتکل')}
function protocolImportGuide(){
  const sections=A(state.lists.sections),sampleSection=sections[0]||'سالن بالا';
  const sample={schemaVersion:PROTOCOL_IMPORT_SCHEMA_VERSION,items:[
    {title:'قوانین حضور و غیاب',content:'ساعت شروع شیفت ۱۵ دقیقه زودتر در محل حاضر باشید.\nکارت تردد را قبل و بعد از شیفت بزنید.',type:'آیین‌نامه',group:'قوانین حضور',audienceAll:true,audienceSections:[],isActive:true},
    {title:'آموزش نظافت سکشن',content:'ابتدای هر شیفت میزها و صندلی‌ها را تمیز کنید.',type:'آموزش',group:'آموزش سالن',audienceAll:false,audienceSections:[sampleSection],isActive:true}
  ]};
  return `<div class="hint"><b>راهنمای فایل جیسون محتوا</b><br>فایل باید JSON معتبر، UTF-8 و بدون کامنت یا ویرگول اضافه باشد؛ کلید <code>schemaVersion</code> باید برابر ${PROTOCOL_IMPORT_SCHEMA_VERSION} و <code>items</code> آرایه‌ای از محتواها باشد (حداکثر ${PROTOCOL_IMPORT_MAX_ITEMS} مورد، حداکثر حجم ${(PROTOCOL_IMPORT_MAX_BYTES/1024/1024).toFixed(0)} مگابایت).<br>فیلدهای هر محتوا: <b>title</b> و <b>content</b> (الزامی)، <b>type</b> (یکی از: ${PROTOCOL_TYPES.map(E).join('، ')})، <b>group</b> (اختیاری؛ نام گروه — در صورت عدم تطبیق با گروه فعلی، به‌عنوان گروه جدید با تأیید شما ساخته می‌شود)، <b>audienceAll</b> (true برای همه پرسنل)، <b>audienceSections</b> (در صورت audienceAll=false، آرایه‌ای از نام بخش‌های فعلی: ${sections.map(E).join('، ')||'—'})، <b>isActive</b> (true یا false).<br>برای متن چندخطی از <code>\\n</code> به‌جای Enter واقعی استفاده کنید. فیلد یا کلید اضافه پذیرفته نمی‌شود؛ شناسه رکورد و زمان ثبت را برنامه خودکار می‌سازد.</div><pre class="json-note">${E(JSON.stringify(sample,null,2))}</pre>`;
}
function protocolImportRowHtml(r){
  const statusBadge={valid:'<span class="badge success">قابل ثبت</span>',duplicate:'<span class="badge">تکراری</span>',invalid:'<span class="badge danger">نامعتبر</span>',conflict:'<span class="badge warn">تعارض عنوان</span>'}[r.status]||'';
  const title=r.value?E(r.value.title):(typeof r.raw==='object'&&r.raw?E(S(r.raw.title)):'—');
  const typeCell=r.value?E(r.value.type):'—';
  const groupCell=!r.value?'—':r.value.isNewGroup?`${E(r.value.groupName)} <span class="badge warn">گروه جدید</span>`:r.value.groupId?E(groupName(r.value.groupId)):'بدون گروه';
  const audienceCell=!r.value?'—':r.value.audienceAll?'همه پرسنل':E(r.value.audienceSections.join('، ')||'—');
  const preview=r.value?E(r.value.content.replace(/\s+/g,' ').slice(0,80))+(r.value.content.length>80?'…':''):'—';
  const note=r.status==='invalid'?r.errors.map(E).join('<br>'):r.status==='duplicate'?`مطابق ${E(r.dupWith)}`:r.status==='conflict'?`عنوان تکراری با ${E(r.conflictWith)} — متن یا مخاطب متفاوت است`:'';
  const action=r.status==='conflict'?`<label><input type="checkbox" ${r.forceInclude?'checked':''} ${importState.saving?'disabled':''} onchange="RayoTraining.toggleImportConflict(${r.index})"> با تعارض هم ثبت شود</label>`:'';
  return `<tr><td>${r.index+1}</td><td>${title}</td><td>${preview}</td><td>${typeCell}</td><td>${groupCell}</td><td>${audienceCell}</td><td>${statusBadge}</td><td>${note}</td><td>${action}</td></tr>`;
}
function protocolImportModalBody(){
  const picker=`<div class="toolbar"><div class="field"><label>فایل JSON محتوا</label><input type="file" accept=".json,application/json" onchange="RayoTraining.handleProtocolImportFile(event)" ${importState&&importState.saving?'disabled':''}></div><button type="button" class="btn" onclick="RayoTraining.downloadProtocolImportTemplate()">⬇ دانلود فرمت جیسون خام</button></div>`;
  const result=importState?(()=>{const c=protocolImportCounts(importState.rows);return `<div class="hint">فایل: ${E(importState.fileName)} — ${c.total} ردیف — قابل ثبت: ${c.includable} — تکراری: ${c.duplicate} — نامعتبر: ${c.invalid} — تعارض: ${c.conflict}${c.newGroups.size?` — گروه جدید: ${[...c.newGroups].map(E).join('، ')}`:''}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>عنوان</th><th>پیش‌نمایش متن</th><th>نوع</th><th>گروه</th><th>مخاطب</th><th>وضعیت</th><th>توضیح</th><th></th></tr></thead><tbody>${importState.rows.map(protocolImportRowHtml).join('')}</tbody></table></div>`})():'';
  return picker+result+protocolImportGuide();
}
function protocolImportModalFoot(){
  const canSubmit=importState&&!importState.saving&&protocolImportCounts(importState.rows).includable>0;
  return `<button class="btn" onclick="closeModal()">بستن</button>${importState?`<button class="btn btn-primary" ${canSubmit?'':'disabled'} onclick="RayoTraining.submitProtocolImport()">${importState.saving?'در حال بررسی و ذخیره…':'ثبت همه محتواها'}</button>`:''}`;
}
function renderProtocolImportModal(){const m=modal();if(!m.body||!m.back.classList.contains('open'))return;m.body.innerHTML=protocolImportModalBody();m.foot.innerHTML=protocolImportModalFoot()}
function openProtocolImport(){ensure();importState=null;const m=modal();m.title.textContent='افزودن گروهی محتوا (جیسون)';m.body.innerHTML=protocolImportModalBody();m.foot.innerHTML=protocolImportModalFoot();m.back.classList.add('open')}
function downloadProtocolImportTemplate(){
  const sample={schemaVersion:PROTOCOL_IMPORT_SCHEMA_VERSION,items:[{title:'',content:'',type:PROTOCOL_TYPES[1],group:'',audienceAll:true,audienceSections:[],isActive:true}]};
  const blob=new Blob([JSON.stringify(sample,null,2)],{type:'application/json;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='protocol-import-template.json';a.click();URL.revokeObjectURL(a.href);
}
function handleProtocolImportFile(e){
  const f=e.target.files[0];e.target.value='';
  if(!f)return;
  if(f.size===0){toast('فایل خالی است',true);return}
  if(f.size>PROTOCOL_IMPORT_MAX_BYTES){toast(`حجم فایل نباید بیشتر از ${(PROTOCOL_IMPORT_MAX_BYTES/1024/1024).toFixed(0)} مگابایت باشد`,true);return}
  const reader=new FileReader();
  reader.onerror=()=>toast('خواندن فایل انجام نشد',true);
  reader.onload=()=>{
    try{
      const text=String(reader.result||'').replace(/^﻿/,'');
      if(!text.trim())throw new Error('فایل خالی است');
      let json;
      try{json=JSON.parse(text)}catch(_){throw new Error('فایل JSON معتبر نیست')}
      if(typeof json!=='object'||json===null||Array.isArray(json))throw new Error('ساختار فایل باید یک شیء JSON باشد');
      const topExtra=Object.keys(json).filter(k=>!PROTOCOL_IMPORT_TOP_KEYS.includes(k));
      if(topExtra.length)throw new Error(`کلید غیرمجاز در فایل: ${topExtra.join('، ')}`);
      if(json.schemaVersion!==PROTOCOL_IMPORT_SCHEMA_VERSION)throw new Error(`نسخه قالب پشتیبانی نمی‌شود؛ نسخه مورد انتظار: ${PROTOCOL_IMPORT_SCHEMA_VERSION}`);
      if(!Array.isArray(json.items)||!json.items.length)throw new Error('فایل هیچ محتوایی ندارد');
      if(json.items.length>PROTOCOL_IMPORT_MAX_ITEMS)throw new Error(`حداکثر ${PROTOCOL_IMPORT_MAX_ITEMS} محتوا در هر فایل مجاز است`);
      ensure();
      const ctx={groupCandidates:A(state.lists.protocolGroups).map(g=>({id:g.id,label:g.name})),sectionCandidates:A(state.lists.sections).map(s=>({id:s,label:s}))};
      const rows=json.items.map((raw,i)=>{const built=buildImportRow(raw,i,ctx);return Object.assign({index:i,raw,forceInclude:false,baseStatus:built.status},built)});
      annotateImportDuplicates(rows,A(state.protocols));
      importState={fileName:f.name,rows,saving:false};
    }catch(err){
      importState=null;
      toast(err.message||'فایل JSON معتبر نیست',true);
    }
    renderProtocolImportModal();
  };
  reader.readAsText(f,'utf-8');
}
function toggleImportConflict(index){if(!importState||importState.saving)return;const row=importState.rows.find(r=>r.index===index);if(row)row.forceInclude=!row.forceInclude;renderProtocolImportModal()}
async function submitProtocolImport(){
  if(!importState||importState.saving)return;
  const preview=importState.rows.filter(r=>r.status==='valid'||(r.status==='conflict'&&r.forceInclude));
  if(!preview.length){toast('محتوای قابل ثبتی انتخاب نشده است',true);return}
  const newGroupNames=[...new Set(preview.filter(r=>r.value.isNewGroup).map(r=>r.value.groupName))];
  if(newGroupNames.length&&!confirm(`${newGroupNames.length} گروه جدید ساخته خواهد شد:\n${newGroupNames.join('، ')}\n\nادامه می‌دهید؟`))return;
  importState.saving=true;renderProtocolImportModal();
  try{
    const fresh=migrate(await RAYO_API_GATEWAY.loadOrBootstrap('hr'));
    reResolveGroupsAgainstFresh(importState.rows,fresh.lists.protocolGroups);
    annotateImportDuplicates(importState.rows,fresh.protocols);
    const includable=importState.rows.filter(r=>r.status==='valid'||(r.status==='conflict'&&r.forceInclude));
    if(!includable.length){
      state=fresh;importState=null;closeModal();
      toast('همه محتواهای انتخاب‌شده از قبل روی سرور ثبت شده بودند؛ نیازی به ذخیره نبود');
      renderView();
      return;
    }
    const groupIdByKey={};
    for(const name of [...new Set(includable.filter(r=>r.value.isNewGroup).map(r=>r.value.groupName))]){
      const key=normText(name).toLowerCase(),existsNow=A(fresh.lists.protocolGroups).find(g=>normText(g.name).toLowerCase()===key);
      if(existsNow)groupIdByKey[key]=existsNow.id;
      else{const g={id:uid('PGRP',fresh.lists.protocolGroups),name,createdAt:now()};fresh.lists.protocolGroups.push(g);groupIdByKey[key]=g.id}
    }
    fresh.protocols=A(fresh.protocols);
    const pushedIds=[];
    for(const r of includable){
      const groupId=r.value.isNewGroup?groupIdByKey[r.value.newGroupKey]:r.value.groupId,id=uid('PROT',fresh.protocols);
      fresh.protocols.push({id,title:r.value.title,type:r.value.type,groupId,content:r.value.content,audienceAll:r.value.audienceAll,audienceSections:r.value.audienceAll?[]:r.value.audienceSections,isActive:r.value.isActive,createdAt:now(),updatedAt:now()});
      pushedIds.push(id);
    }
    fresh.changeLog=A(fresh.changeLog);
    fresh.changeLog.unshift({id:uid('LOG',fresh.changeLog),at:now(),action:`افزودن گروهی محتوا (JSON) — ${pushedIds.length} مورد`});
    fresh.changeLog=fresh.changeLog.slice(0,500);
    let result;
    try{
      result=await RAYO_API_GATEWAY.saveModule('hr',fresh,{verify:true});
    }catch(saveErr){
      if(isAmbiguousSaveError(saveErr)){
        const loaded=await RAYO_API_GATEWAY.loadModule('hr').catch(()=>null),landed=A(loaded?.protocols);
        if(loaded&&pushedIds.every(id=>landed.some(p=>p.id===id))){
          state=migrate(loaded);importState=null;closeModal();
          toast(`${pushedIds.length} محتوا با موفقیت ذخیره و پس از بازخوانی تأیید شد`);
          renderView();
          return;
        }
        throw new Error('نتیجه ذخیره نامشخص است؛ اتصال را بررسی کنید و دوباره روی «ثبت همه محتواها» بزنید.');
      }
      throw saveErr;
    }
    state=fresh;importState=null;closeModal();
    toast(`${pushedIds.length} محتوا با موفقیت ذخیره و تأیید شد`);
    renderView();
  }catch(e){
    toast(e.message||'ذخیره محتوای گروهی انجام نشد',true);
  }finally{
    if(importState){importState.saving=false;renderProtocolImportModal()}
  }
}
function templateModeLabel(x){return x.mode==='generalIndividual'?'عمومی فردی':`سکشن: ${x.section||'—'}`}
function peopleNames(ids){return A(ids).map(id=>A(state.personnel).find(p=>p.id===id)?.name||id).join('، ')}
function checklistTemplatesView(){ensure();const rows=A(state.checklistTemplates).slice().sort((a,b)=>S(b.updatedAt||b.createdAt).localeCompare(S(a.updatedAt||a.createdAt)));return pageHead('تعریف چک‌لیست‌های کاری','تعریف چک‌لیست روزانه برای شروع، حین و پایان هر شیفت',`<button class="btn" onclick="RayoTraining.openHelp('templates')">❓ راهنما</button> <button class="btn btn-primary" onclick="RayoTraining.openChecklistTemplate()">+ چک‌لیست جدید</button>`)+`<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>نام</th><th>نوع / سکشن</th><th>مسئول</th><th>شیفت</th><th>آیتم‌ها</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${E(x.name)}</b></td><td>${E(templateModeLabel(x))}</td><td>${x.mode==='generalIndividual'?'همه پرسنل فعال':E(peopleNames(x.responsiblePersonnelIds)||'—')}</td><td>${E(A(x.shifts).join('، ')||'همه')}</td><td>${A(x.items).length}</td><td>${x.isActive!==false?'<span class="badge success">فعال</span>':'<span class="badge warn">غیرفعال</span>'}</td><td><button class="btn btn-sm" onclick="RayoTraining.openChecklistTemplate('${x.id}')">ویرایش</button> <button class="btn btn-sm btn-danger" onclick="RayoTraining.deleteChecklistTemplate('${x.id}')">حذف</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">چک‌لیستی تعریف نشده است.</td></tr>'}</tbody></table></div></div>`}
function itemLines(x,stage){return A(x.items).filter(i=>i.stage===stage).map(i=>i.text).join('\n')}
function openChecklistTemplate(id=''){ensure();const x=A(state.checklistTemplates).find(q=>q.id===id)||{name:'',mode:'section',section:'',responsiblePersonnelIds:[],shifts:A(state.lists.shifts),items:[],isActive:true},m=modal(),people=A(state.personnel).filter(p=>p.status==='فعال'),zones=[...new Set([...A(state.lists.sections),...A(state.lists.positions)])],shifts=A(state.lists.shifts);m.title.textContent=id?'ویرایش چک‌لیست':'چک‌لیست جدید';m.body.innerHTML=`<div class="form-grid"><div class="field"><label>نام چک‌لیست</label><input id="clName" value="${E(x.name)}" placeholder="مثلاً چک‌لیست صندوق"></div><div class="field"><label>نوع</label><select id="clMode" onchange="RayoTraining.toggleChecklistMode()"><option value="section" ${x.mode!=='generalIndividual'?'selected':''}>چک‌لیست سکشن / مسئول</option><option value="generalIndividual" ${x.mode==='generalIndividual'?'selected':''}>چک‌لیست عمومی فردی</option></select></div><div class="field" id="clSectionWrap"><label>سکشن / حوزه کاری</label><select id="clSection"><option value="">انتخاب کنید</option>${zones.map(s=>`<option value="${E(s)}" ${x.section===s?'selected':''}>${E(s)}</option>`).join('')}</select></div><div class="field"><label>وضعیت</label><select id="clActive"><option value="1" ${x.isActive!==false?'selected':''}>فعال</option><option value="0" ${x.isActive===false?'selected':''}>غیرفعال</option></select></div><div class="field full" id="clPeopleWrap"><label>مسئول یا مسئولان — چند انتخاب ممکن است</label><select id="clPeople" multiple size="8">${people.map(p=>`<option value="${E(p.id)}" ${A(x.responsiblePersonnelIds).includes(p.id)?'selected':''}>${E(p.id)} | ${E(p.name)} — ${E(p.mainPosition||p.section||'')}</option>`).join('')}</select></div><div class="field full"><label>شیفت‌های اجرا</label><select id="clShifts" multiple size="${Math.max(2,shifts.length)}">${shifts.map(s=>`<option value="${E(s)}" ${!A(x.shifts).length||A(x.shifts).includes(s)?'selected':''}>${E(s)}</option>`).join('')}</select><small>برای اجرا در همه شیفت‌ها، همه گزینه‌ها را انتخاب کنید.</small></div><div class="field full"><label>شروع شیفت — هر خط یک مورد</label><textarea id="clStart" rows="6" placeholder="تحویل گرفتن بیسیم\nبررسی نظافت سکشن">${E(itemLines(x,'start'))}</textarea></div><div class="field full"><label>حین شیفت — هر خط یک مورد</label><textarea id="clDuring" rows="6">${E(itemLines(x,'during'))}</textarea></div><div class="field full"><label>پایان شیفت — هر خط یک مورد</label><textarea id="clEnd" rows="6">${E(itemLines(x,'end'))}</textarea></div></div>`;m.foot.innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="RayoTraining.saveChecklistTemplate('${id}')">ذخیره</button>`;m.back.classList.add('open');setTimeout(toggleChecklistMode,0)}
function toggleChecklistMode(){const general=val('clMode')==='generalIndividual';const a=document.getElementById('clSectionWrap'),b=document.getElementById('clPeopleWrap');if(a)a.style.display=general?'none':'';if(b)b.style.display=general?'none':''}
function lines(id,stage,prefix){return S(document.getElementById(id)?.value).split('\n').map(S).filter(Boolean).map((text,i)=>({id:`${prefix}-${stage}-${String(i+1).padStart(2,'0')}`,stage,text,required:true}))}
async function saveChecklistTemplate(id){ensure();const name=val('clName'),mode=val('clMode')||'section',section=val('clSection'),responsiblePersonnelIds=document.getElementById('clPeople')?[...document.getElementById('clPeople').selectedOptions].map(o=>o.value):[],shifts=[...document.getElementById('clShifts').selectedOptions].map(o=>o.value),base=id||uid('CLT',state.checklistTemplates),items=[...lines('clStart','start',base),...lines('clDuring','during',base),...lines('clEnd','end',base)];if(!name)return toast('نام چک‌لیست را وارد کنید',true);if(!items.length)return toast('حداقل یک آیتم برای چک‌لیست وارد کنید',true);if(mode==='section'&&!section)return toast('سکشن / حوزه کاری را انتخاب کنید',true);if(mode==='section'&&!responsiblePersonnelIds.length)return toast('حداقل یک مسئول انتخاب کنید',true);if(!shifts.length)return toast('حداقل یک شیفت را انتخاب کنید',true);let x=A(state.checklistTemplates).find(q=>q.id===id);if(!x){x={id:base,createdAt:now()};state.checklistTemplates.push(x)}Object.assign(x,{name,mode,section:mode==='section'?section:'عمومی فردی',responsiblePersonnelIds:mode==='section'?responsiblePersonnelIds:[],shifts,items,isActive:val('clActive')!=='0',updatedAt:now()});closeModal();await commit(id?'ویرایش چک‌لیست':'ثبت چک‌لیست')}
async function deleteChecklistTemplate(id){ensure();if(A(state.checklistRecords).some(x=>x.templateId===id))return toast('برای این چک‌لیست سابقه اجرایی وجود دارد؛ آن را غیرفعال کنید تا تاریخچه حفظ شود',true);if(!confirm('چک‌لیست حذف شود؟'))return;state.checklistTemplates=state.checklistTemplates.filter(x=>x.id!==id);await commit('حذف چک‌لیست')}
const reportUI={date:'',personnelId:'',templateId:'',status:''};
function shiftRows(date){const rows=[];for(const x of A(state.shiftRecords).filter(x=>S(x.date)===S(date)&&!['لغوشده','مرخصی','غیبت'].includes(x.status)))rows.push({date:x.date,shift:x.shift,section:x.section,personnelId:x.personnelId});for(const plan of A(state.monthlyPlans)){for(const [key,ids] of Object.entries(plan.cells||{})){const parts=key.split('|');if(parts.length<3||S(parts[0])!==S(date))continue;let loc='';try{loc=decodeURIComponent(parts[1]||'')}catch(_){loc=parts[1]||''}const section=loc.split('~')[0]||'',shift=parts[2];for(const pid of A(ids))if(!rows.some(r=>r.date===date&&r.shift===shift&&r.personnelId===pid))rows.push({date,shift,section,personnelId:pid})}}return rows}
function expectedRows(date){ensure();const shifts=shiftRows(date),people=A(state.personnel);let out=[];for(const t of A(state.checklistTemplates).filter(x=>x.isActive!==false)){if(t.mode==='generalIndividual'){for(const s of shifts){const p=people.find(x=>x.id===s.personnelId);if(!p||p.status!=='فعال'||!A(t.shifts).includes(s.shift))continue;out.push({template:t,person:p,shift:s.shift,section:s.section||p.section||''})}}else{for(const pid of A(t.responsiblePersonnelIds)){const p=people.find(x=>x.id===pid);if(!p||p.status!=='فعال')continue;for(const s of shifts.filter(q=>q.personnelId===pid&&A(t.shifts).includes(q.shift)))out.push({template:t,person:p,shift:s.shift,section:t.section||s.section||p.section||''})}}}const uniq=new Map;out.forEach(x=>uniq.set(`${x.template.id}|${x.person.id}|${x.shift}`,x));return [...uniq.values()]}
function checklistReportRows(date){const records=A(state.checklistRecords).filter(x=>S(x.date)===S(date)),expected=expectedRows(date),map=new Map;for(const x of expected){const key=`${x.template.id}|${x.person.id}|${x.shift}`,r=records.find(q=>q.templateId===x.template.id&&q.personnelId===x.person.id&&q.shift===x.shift);map.set(key,{templateId:x.template.id,templateName:x.template.name,personnelId:x.person.id,personnelName:x.person.name,section:x.section,shift:x.shift,record:r||null,status:!r?'ثبت‌نشده':N(r.completionPercent)>=100?'کامل':'ناقص',percent:r?N(r.completionPercent):0,notes:r?.notes||'',updatedAt:r?.updatedAt||''})}for(const r of records){const key=`${r.templateId}|${r.personnelId}|${r.shift}`;if(map.has(key))continue;map.set(key,{templateId:r.templateId,templateName:r.templateName||A(state.checklistTemplates).find(t=>t.id===r.templateId)?.name||r.templateId,personnelId:r.personnelId,personnelName:A(state.personnel).find(p=>p.id===r.personnelId)?.name||r.personnelName||r.personnelId,section:r.section||'',shift:r.shift,record:r,status:N(r.completionPercent)>=100?'کامل':'ناقص',percent:N(r.completionPercent),notes:r.notes||'',updatedAt:r.updatedAt||''})}return [...map.values()]}
function checklistReportsView(){ensure();if(!reportUI.date)reportUI.date=today();let rows=checklistReportRows(reportUI.date);if(reportUI.personnelId)rows=rows.filter(x=>x.personnelId===reportUI.personnelId);if(reportUI.templateId)rows=rows.filter(x=>x.templateId===reportUI.templateId);if(reportUI.status)rows=rows.filter(x=>x.status===reportUI.status);const all=rows.length,full=rows.filter(x=>x.status==='کامل').length,partial=rows.filter(x=>x.status==='ناقص').length,missing=rows.filter(x=>x.status==='ثبت‌نشده').length;return pageHead('گزارش روزانه چک‌لیست‌ها','کنترل انجام چک‌لیست هر نفر در هر شیفت',`<button class="btn" onclick="RayoTraining.openHelp('reports')">❓ راهنما</button>`)+`<div class="card"><div class="toolbar"><div class="field"><label>تاریخ</label><input data-jalali="1" value="${E(reportUI.date)}" onchange="RayoTraining.reportUI.date=this.value;renderView()"></div><div class="field"><label>پرسنل</label><select onchange="RayoTraining.reportUI.personnelId=this.value;renderView()"><option value="">همه</option>${A(state.personnel).map(p=>`<option value="${E(p.id)}" ${reportUI.personnelId===p.id?'selected':''}>${E(p.name)}</option>`).join('')}</select></div><div class="field"><label>چک‌لیست</label><select onchange="RayoTraining.reportUI.templateId=this.value;renderView()"><option value="">همه</option>${A(state.checklistTemplates).map(t=>`<option value="${E(t.id)}" ${reportUI.templateId===t.id?'selected':''}>${E(t.name)}</option>`).join('')}</select></div><div class="field"><label>وضعیت</label><select onchange="RayoTraining.reportUI.status=this.value;renderView()"><option value="">همه</option>${['کامل','ناقص','ثبت‌نشده'].map(s=>`<option ${reportUI.status===s?'selected':''}>${s}</option>`).join('')}</select></div></div></div><div class="grid grid-4"><div class="card kpi"><div class="label">مورد انتظار</div><div class="value">${all}</div></div><div class="card kpi"><div class="label">کامل</div><div class="value positive">${full}</div></div><div class="card kpi"><div class="label">ناقص</div><div class="value">${partial}</div></div><div class="card kpi"><div class="label">ثبت‌نشده</div><div class="value danger-text">${missing}</div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>پرسنل</th><th>چک‌لیست</th><th>سکشن</th><th>شیفت</th><th>وضعیت</th><th>درصد</th><th>توضیحات</th><th>آخرین ثبت</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${E(x.personnelName)}</td><td>${E(x.templateName)}</td><td>${E(x.section||'—')}</td><td>${E(x.shift||'—')}</td><td>${x.status==='کامل'?'<span class="badge success">کامل</span>':x.status==='ناقص'?'<span class="badge warn">ناقص</span>':'<span class="badge danger">ثبت‌نشده</span>'}</td><td>${F(x.percent)}٪</td><td>${E(x.notes||'—')}</td><td>${x.updatedAt?E(new Date(x.updatedAt).toLocaleString('fa-IR')):'—'}</td><td>${x.record?`<button class="btn btn-sm" onclick="RayoTraining.viewChecklistRecord('${x.record.id}')">جزئیات</button>`:''}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">برای این تاریخ رکورد یا شیفت مورد انتظاری وجود ندارد.</td></tr>'}</tbody></table></div></div>`}
function viewChecklistRecord(id){ensure();const r=A(state.checklistRecords).find(x=>x.id===id);if(!r)return;const m=modal(),stageName={start:'شروع شیفت',during:'حین شیفت',end:'پایان شیفت'};m.title.textContent=`جزئیات — ${r.templateName||'چک‌لیست'}`;m.body.innerHTML=`<div class="hint">${E(r.personnelName||A(state.personnel).find(p=>p.id===r.personnelId)?.name||r.personnelId)} — ${E(r.date)} — شیفت ${E(r.shift)} — ${F(r.completionPercent)}٪</div><div class="table-wrap"><table class="data-table"><thead><tr><th>مرحله</th><th>مورد</th><th>انجام</th></tr></thead><tbody>${A(r.items).map(i=>`<tr><td>${E(stageName[i.stage]||i.stage)}</td><td>${E(i.text)}</td><td>${i.done?'✓':'—'}</td></tr>`).join('')}</tbody></table></div><div class="card"><b>توضیحات:</b><div style="white-space:pre-wrap">${E(r.notes||'—')}</div></div>`;m.foot.innerHTML='<button class="btn btn-primary" onclick="closeModal()">بستن</button>';m.back.classList.add('open')}
function install(){if(typeof state==='undefined'||typeof views==='undefined'||typeof titles==='undefined'||!state)return setTimeout(install,100);ensure();titles.protocols='آموزش‌ها و پروتکل‌ها';titles.checklistTemplates='تعریف چک‌لیست‌ها';titles.checklistReports='گزارش چک‌لیست‌ها';views.protocols=protocolsView;views.checklistTemplates=checklistTemplatesView;views.checklistReports=checklistReportsView;const q=new URLSearchParams(location.search).get('view');if((location.pathname.split('/').pop()||'').toLowerCase()==='personnel.html'&&q&&views[q])(currentView===q&&renderView())}
window.RayoTraining={openHelp,openProtocolGroup,saveProtocolGroup,deleteProtocolGroup,openProtocol,saveProtocol,viewProtocol,deleteProtocol,openProtocolImport,handleProtocolImportFile,toggleImportConflict,downloadProtocolImportTemplate,submitProtocolImport,openChecklistTemplate,toggleChecklistMode,saveChecklistTemplate,deleteChecklistTemplate,viewChecklistRecord,reportUI};
install();
})();
