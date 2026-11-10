(function(){
'use strict';

const BUILD='10.9.3';
const SHIFTS=['صبح','عصر'];
const STANDARD_MATRIX={
  'بار':['باریستا','مدیر/سرپرست'],
  'صندوق':['صندوقدار','مدیر/سرپرست'],
  'هاست':['هاست','مدیر/سرپرست'],
  'سالن':['سالن‌کار','ویتر','مدیر/سرپرست'],
  'قلیان‌خانه':['قلیان‌زن','مدیر/سرپرست'],
  'پیک':['پیک'],
  'پارکینگ':['پارک‌بان'],
  'آشپزخانه':['سرآشپز','آماده‌ساز','تخته‌کار','وسط‌کار','ظرفشور','سالادزن','ساندویچ‌زن','پاستازن','گریل‌کار','پیتزازن','فیش‌خوان'],
  'خدمات':['خدماتی']
};

const uniq=items=>[...new Set((items||[]).map(x=>String(x||'').trim()).filter(Boolean))];
const sectionLabel=section=>section==='پارکینگ'?'پوزیشن مستقل: پارک‌بان':section;
const tableSectionLabel=section=>section==='پارکینگ'?'— (پوزیشن مستقل)':section;
const locationKey=(section,subSection='')=>section==='سالن'&&subSection?subSection:section;
const recordLocation=r=>locationKey(r?.section,r?.subSection);

function configuredSections(){
  return uniq(state?.lists?.sections||[]);
}

function personnelPositionsFor(section,subSection=''){
  return uniq((state?.personnel||[]).filter(p=>{
    if(String(p.section||'')!==section)return false;
    if(section==='سالن'&&subSection&&String(p.subSection||'')!==subSection)return false;
    return true;
  }).flatMap(p=>[p.mainPosition,p.backupPosition]));
}

function positionsForOperationalSection(section,subSection=''){
  const fixed=STANDARD_MATRIX[section];
  if(fixed)return uniq([...fixed,...personnelPositionsFor(section,subSection).filter(p=>fixed.includes(p))]);
  return personnelPositionsFor(section,subSection);
}

function validRequirement(r){
  return Boolean(r&&positionsForOperationalSection(r.section,r.subSection).includes(String(r.position||'')));
}

function sectionOptions(selected=''){
  return '<option value="">انتخاب کنید</option>'+configuredSections().map(section=>`<option value="${esc(section)}" ${section===selected?'selected':''}>${esc(sectionLabel(section))}</option>`).join('');
}

function dayOptions(selected=''){
  return '<option value="">انتخاب کنید</option>'+(state?.lists?.weekdays||[]).map((x,i)=>`<option value="${i}" ${String(i)===String(selected)?'selected':''}>${esc(x)}</option>`).join('');
}

function shiftOptions(selected=''){
  return '<option value="">انتخاب کنید</option>'+SHIFTS.map(x=>`<option value="${x}" ${x===selected?'selected':''}>${x}</option>`).join('');
}

function subOptions(selected=''){
  return '<option value="">انتخاب کنید</option>'+uniq(state?.lists?.hallSubSections||[]).map(x=>`<option value="${esc(x)}" ${x===selected?'selected':''}>${esc(x)}</option>`).join('');
}

function refreshRequirementForm(selectedPosition='',selectedSub=''){
  const section=$('rq_section')?.value||'';
  const wrap=$('rq_sub_wrap'),sub=$('rq_sub'),position=$('rq_position');
  if(wrap&&sub){
    const show=section==='سالن';
    wrap.hidden=!show;
    sub.required=show;
    sub.innerHTML=show?subOptions(selectedSub||sub.value):'<option value="">انتخاب کنید</option>';
  }
  if(position){
    const arr=positionsForOperationalSection(section,section==='سالن'?(sub?.value||selectedSub):'');
    position.disabled=!section||!arr.length;
    position.innerHTML='<option value="">انتخاب کنید</option>'+arr.map(x=>`<option value="${esc(x)}" ${x===selectedPosition?'selected':''}>${esc(x)}</option>`).join('');
  }
  const note=$('rq_mapping_note');
  if(note)note.textContent=!section?'ابتدا سکشن را انتخاب کنید.':positionsForOperationalSection(section,sub?.value||'').length?'فقط پوزیشن‌های معتبر همین سکشن نمایش داده می‌شوند.':'برای این سکشن هنوز پوزیشن معتبری در اطلاعات پرسنل تعریف نشده است.';
}

function editRequirement(id=''){
  const r=id?(state.staffingRequirements||[]).find(x=>x.id===id):null;
  $('modalTitle').textContent=id?'ویرایش نیروی موردنیاز':'تعریف نیروی موردنیاز';
  $('modalBody').innerHTML=`<div class="taxonomy-note" id="rq_mapping_note">ابتدا سکشن را انتخاب کنید.</div><div class="form-grid staffing-single-v1091">
    <div class="field"><label>روز هفته *</label><select id="rq_day" required>${dayOptions(r?Number(r.dayIndex):'')}</select></div>
    <div class="field"><label>شیفت *</label><select id="rq_shift" required>${shiftOptions(r?.shift||'')}</select></div>
    <div class="field"><label>سکشن اصلی *</label><select id="rq_section" required onchange="RayoStaffingV1091.refreshRequirementForm()">${sectionOptions(r?.section||'')}</select></div>
    <div class="field" id="rq_sub_wrap" hidden><label>محدوده سالن *</label><select id="rq_sub" onchange="RayoStaffingV1091.refreshRequirementForm()"></select></div>
    <div class="field"><label>پوزیشن *</label><select id="rq_position" required disabled><option value="">انتخاب کنید</option></select></div>
    <div class="field"><label>تعداد موردنیاز (نفر) *</label><input id="rq_count" type="number" min="1" step="1" value="${r?Math.max(1,n(r.requiredCount)):''}" placeholder="مثلاً 2" required></div>
    <label class="staffing-active-v1091"><input id="rq_active" type="checkbox" ${r?.active===false?'':'checked'}><span>این نیاز فعال باشد</span></label>
  </div>`;
  $('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn" onclick="RayoStaffingV1091.saveRequirement('${id}',true)">ذخیره و ادامه</button><button class="btn btn-primary" onclick="RayoStaffingV1091.saveRequirement('${id}',false)">ذخیره</button>`;
  $('modalBackdrop').classList.add('open');
  refreshRequirementForm(r?.position||'',r?.subSection||'');
}

function readRequirementForm(){
  const dayRaw=$('rq_day')?.value??'',shift=$('rq_shift')?.value||'',section=$('rq_section')?.value||'',subSection=section==='سالن'?($('rq_sub')?.value||''):'',position=$('rq_position')?.value||'',requiredCount=Number($('rq_count')?.value);
  if(dayRaw===''||!shift||!section||!position||!Number.isInteger(requiredCount)||requiredCount<1)throw Error('روز، شیفت، سکشن، پوزیشن و تعداد معتبر الزامی است.');
  if(!SHIFTS.includes(shift))throw Error('شیفت معتبر نیست.');
  if(section==='سالن'&&!subSection)throw Error('محدوده سالن را انتخاب کنید.');
  if(!positionsForOperationalSection(section,subSection).includes(position))throw Error('پوزیشن انتخاب‌شده با سکشن سازگار نیست.');
  return{dayIndex:Number(dayRaw),shift,section,subSection,position,requiredCount,active:$('rq_active')?.checked!==false};
}

function findDuplicate(o,exceptId=''){
  return (state.staffingRequirements||[]).find(x=>x.id!==exceptId&&Number(x.dayIndex)===o.dayIndex&&x.shift===o.shift&&x.section===o.section&&String(x.subSection||'')===String(o.subSection||'')&&x.position===o.position);
}

async function persistMutation(reason,mutate){
  const before=structuredClone(state);
  try{
    mutate();
    const ok=await commit(reason);
    if(!ok)throw Error('ذخیره روی سرور تأیید نشد.');
    return true;
  }catch(err){
    state=before;
    renderView();
    toast(err?.message||'ذخیره انجام نشد',true);
    return false;
  }
}

async function saveRequirement(id='',keepOpen=false){
  let o;
  try{o=readRequirementForm()}catch(err){toast(err.message,true);return}
  const duplicate=findDuplicate(o,id),current=id?(state.staffingRequirements||[]).find(x=>x.id===id):null;
  const reason=current?'ویرایش نیاز نیرو':duplicate?'بروزرسانی نیاز تکراری':'تعریف نیاز نیرو';
  const ok=await persistMutation(reason,()=>{
    if(duplicate)Object.assign(duplicate,o);
    else if(current)Object.assign(current,o);
    else state.staffingRequirements.push({id:uid('REQ',state.staffingRequirements),...o});
  });
  if(!ok)return;
  if(keepOpen)editRequirement('');else closeModal();
}

function bulkRows(){
  const rows=[];
  for(const section of configuredSections()){
    if(section==='سالن'){
      for(const subSection of uniq(state?.lists?.hallSubSections||[]))for(const position of positionsForOperationalSection(section,subSection))rows.push({section,subSection,position,label:`سالن / ${subSection}`});
    }else for(const position of positionsForOperationalSection(section))rows.push({section,subSection:'',position,label:sectionLabel(section)});
  }
  return rows;
}

function openBulk(){
  const rows=bulkRows();
  $('modalTitle').textContent='ثبت گروهی نیروی موردنیاز';
  $('modalBody').innerHTML=`<div class="taxonomy-note">روز و شیفت را انتخاب کنید؛ سپس فقط تعداد ردیف‌های موردنظر را تغییر دهید. خانه‌های خالی، اطلاعات قبلی را حذف نمی‌کنند.</div>
    <div class="form-grid staffing-bulk-head-v1091"><div class="field"><label>روز هفته *</label><select id="rqb_day" onchange="RayoStaffingV1091.refreshBulk()">${dayOptions('')}</select></div><div class="field"><label>شیفت *</label><select id="rqb_shift" onchange="RayoStaffingV1091.refreshBulk()">${shiftOptions('')}</select></div></div>
    <div class="staffing-bulk-status-v1091" id="rqb_status">برای نمایش تعدادهای فعلی، روز و شیفت را انتخاب کنید.</div>
    <div class="table-wrap staffing-bulk-table-v1091"><table class="data-table"><thead><tr><th>سکشن / محدوده</th><th>پوزیشن</th><th>تعداد موردنیاز</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${esc(r.label)}</td><td><b>${esc(r.position)}</b></td><td><input class="rqb-count" id="rqb_${i}" type="number" min="1" step="1" placeholder="—" data-section="${esc(r.section)}" data-sub="${esc(r.subSection)}" data-position="${esc(r.position)}" oninput="this.dataset.dirty='1'"></td></tr>`).join('')||'<tr><td colspan="3" class="empty">برای سکشن‌های فعلی پوزیشن معتبری پیدا نشد.</td></tr>'}</tbody></table></div>`;
  $('modalFoot').innerHTML='<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="RayoStaffingV1091.saveBulk()">ذخیره موارد واردشده</button>';
  $('modalBackdrop').classList.add('open');
  refreshBulk();
}

function refreshBulk(){
  const dayRaw=$('rqb_day')?.value??'',shift=$('rqb_shift')?.value||'',ready=dayRaw!==''&&shift;
  let existingCount=0;
  qsa('.rqb-count').forEach(input=>{
    input.dataset.dirty='';
    if(!ready){input.value='';input.disabled=true;return}
    input.disabled=false;
    const row=(state.staffingRequirements||[]).find(x=>Number(x.dayIndex)===Number(dayRaw)&&x.shift===shift&&x.section===input.dataset.section&&String(x.subSection||'')===String(input.dataset.sub||'')&&x.position===input.dataset.position);
    input.value=row?Math.max(1,n(row.requiredCount)):'';
    if(row)existingCount++;
  });
  const status=$('rqb_status');
  if(status)status.textContent=ready?`${existingCount} مقدار قبلی نمایش داده شد؛ فقط خانه‌هایی که تغییر می‌دهید ذخیره می‌شوند.`:'برای نمایش تعدادهای فعلی، روز و شیفت را انتخاب کنید.';
}

async function saveBulk(){
  const dayRaw=$('rqb_day')?.value??'',shift=$('rqb_shift')?.value||'';
  if(dayRaw===''||!SHIFTS.includes(shift))return toast('روز و شیفت را انتخاب کنید.',true);
  const changed=qsa('.rqb-count').filter(x=>x.dataset.dirty==='1');
  if(!changed.length)return toast('حداقل تعداد یک ردیف را وارد یا تغییر دهید.',true);
  const rows=[];
  for(const input of changed){
    const requiredCount=Number(input.value),section=input.dataset.section||'',subSection=input.dataset.sub||'',position=input.dataset.position||'';
    if(!Number.isInteger(requiredCount)||requiredCount<1)return toast(`تعداد «${position}» باید عدد صحیح حداقل ۱ باشد.`,true);
    if(!positionsForOperationalSection(section,subSection).includes(position))return toast(`ترکیب «${section} / ${position}» معتبر نیست.`,true);
    rows.push({dayIndex:Number(dayRaw),shift,section,subSection,position,requiredCount,active:true});
  }
  const ok=await persistMutation(`ثبت گروهی ${rows.length} نیاز نیرو`,()=>{
    for(const o of rows){const duplicate=findDuplicate(o);if(duplicate)Object.assign(duplicate,o);else state.staffingRequirements.push({id:uid('REQ',state.staffingRequirements),...o})}
  });
  if(ok)closeModal();
}

function viewsNeeds(){
  const f=ui.staffingFilter||{};
  const rows=(state.staffingRequirements||[]).filter(r=>(f.dayIndex===''||f.dayIndex==null||Number(r.dayIndex)===Number(f.dayIndex))&&(!f.shift||r.shift===f.shift)&&(!f.section||r.section===f.section)&&(!f.subSection||(r.subSection||'')===f.subSection)&&(!f.position||r.position===f.position)).sort((a,b)=>Number(a.dayIndex)-Number(b.dayIndex)||String(a.shift).localeCompare(String(b.shift),'fa')||recordLocation(a).localeCompare(recordLocation(b),'fa')||String(a.position).localeCompare(String(b.position),'fa'));
  const filteredRequiredTotal=rows.reduce((sum,row)=>sum+n(row.requiredCount),0);
  const invalid=(state.staffingRequirements||[]).filter(r=>!validRequirement(r)).length;
  const warning=invalid?`<div class="card staffing-warning-v1091"><b>${invalid} رکورد قدیمی با ترکیب سکشن/پوزیشن ناسازگار پیدا شد.</b><span>هیچ رکوردی خودکار حذف یا اصلاح نشده است؛ از کلید «ویرایش» برای اصلاح آگاهانه استفاده کنید.</span></div>`:'';
  return pageHead('نیروی موردنیاز','تعریف ظرفیت هر روز و شیفت با پوزیشن‌های مجاز همان سکشن.',`<button class="btn" onclick="goView('staffingMap')">نقشه کمبود</button> <button class="btn" onclick="RayoStaffingV1091.openBulk()">ثبت گروهی</button> <button class="btn btn-primary" onclick="editStaffingRequirement()">+ تعریف نیاز</button>`)+warning+`<div class="card"><div class="requirements-filter">
    <div class="field"><label>روز</label><select onchange="ui.staffingFilter.dayIndex=this.value;renderView()"><option value="">همه روزها</option>${(state.lists.weekdays||[]).map((x,i)=>`<option value="${i}" ${String(f.dayIndex)===String(i)?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
    <div class="field"><label>شیفت</label><select onchange="ui.staffingFilter.shift=this.value;renderView()"><option value="">همه شیفت‌ها</option>${SHIFTS.map(x=>`<option ${f.shift===x?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="field"><label>سکشن اصلی</label><select onchange="ui.staffingFilter.section=this.value;ui.staffingFilter.subSection='';renderView()"><option value="">همه سکشن‌ها</option>${configuredSections().map(x=>`<option value="${esc(x)}" ${f.section===x?'selected':''}>${esc(sectionLabel(x))}</option>`).join('')}</select></div>
    <div class="field"><label>محدوده سالن</label><select onchange="ui.staffingFilter.subSection=this.value;renderView()"><option value="">همه محدوده‌ها</option>${uniq(state.lists.hallSubSections||[]).map(x=>`<option ${f.subSection===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
    <div class="field"><label>پوزیشن</label><select onchange="ui.staffingFilter.position=this.value;renderView()"><option value="">همه پوزیشن‌ها</option>${uniq(state.lists.positions||[]).map(x=>`<option ${f.position===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
    <button class="btn" onclick="ui.staffingFilter={dayIndex:'',shift:'',section:'',subSection:'',position:''};renderView()">پاک‌کردن فیلتر</button>
  </div></div><div class="card"><div class="section-head"><h2>فهرست نیروی موردنیاز</h2><span class="badge success">جمع تعداد: ${filteredRequiredTotal.toLocaleString('fa-IR')} نفر</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>روز</th><th>شیفت</th><th>سکشن اصلی</th><th>محدوده</th><th>پوزیشن</th><th>تعداد</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr class="${validRequirement(r)?'':'staffing-invalid-row-v1091'}"><td>${esc(state.lists.weekdays[Number(r.dayIndex)]||'—')}</td><td>${esc(r.shift)}</td><td>${esc(tableSectionLabel(r.section))}</td><td>${esc(r.subSection||'—')}</td><td>${esc(r.position)} ${validRequirement(r)?'':'<span class="badge warn">نیازمند اصلاح</span>'}</td><td><b>${n(r.requiredCount)}</b></td><td>${badge(r.active===false?'غیرفعال':'فعال')}</td><td><button class="btn btn-sm" onclick="editStaffingRequirement('${r.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('staffingRequirements','${r.id}','حذف نیاز نیرو')">حذف</button></td></tr>`).join('')||'<tr><td colspan="8" class="empty">نیازی تعریف نشده است.</td></tr>'}</tbody></table></div></div>`;
}

function statusForLocation(date,shift,loc){
  const di=dayIndexOfDate(date),reqs=staffingReqsFor(date,di,shift).filter(r=>recordLocation(r)===loc),details=reqs.map(r=>{const assigned=assignmentsForDate(date,loc,r.position,shift).length,required=n(r.requiredCount);return{position:r.position,assigned,required,delta:assigned-required}}),shortage=details.reduce((s,x)=>s+Math.max(-x.delta,0),0),surplus=details.reduce((s,x)=>s+Math.max(x.delta,0),0),status=!details.length?'undefined':shortage>0?'shortage':surplus>0?'surplus':'complete';
  return{section:loc,details,shortage,surplus,status};
}

function mapLabel(loc){return loc==='پارکینگ'?'پارک‌بان':loc}

function viewsMap(){
  const f=ui.staffingMap;if(!parseJDate(f.date))f.date=todayJ();
  const configured=(state.floorMap?.regions||[]).filter(r=>r.section!=='پارکینگ'),mapped=new Set(configured.map(r=>r.section)),statuses=configured.map(r=>({...r,...statusForLocation(f.date,f.shift,r.section)}));
  const allLocations=uniq(staffingReqsFor(f.date,dayIndexOfDate(f.date),f.shift).map(recordLocation)),unmapped=allLocations.filter(x=>!mapped.has(x)).map(x=>statusForLocation(f.date,f.shift,x)),all=statuses.concat(unmapped),totalShort=all.reduce((s,x)=>s+x.shortage,0),totalSurplus=all.reduce((s,x)=>s+x.surplus,0),image=state.floorMap?.imageUrl||'';
  const regions=statuses.map(x=>`<div class="floor-region ${x.status}" style="left:${n(x.x)}%;top:${n(x.y)}%;width:${n(x.w)}%;height:${n(x.h)}%"><h4>${esc(mapLabel(x.section))}</h4>${x.details.length?x.details.map(d=>`<div class="map-line">${esc(d.position)}: <b>${d.assigned}/${d.required}</b>${d.delta<0?` — کمبود ${Math.abs(d.delta)}`:d.delta>0?` — مازاد ${d.delta}`:' — کامل'}</div>`).join(''):'<div class="map-line muted">نیازی تعریف نشده</div>'}</div>`).join('');
  const list=all.filter(x=>x.details.length).map(x=>`<div class="map-summary-item ${x.status}"><b>${esc(mapLabel(x.section))}</b>${x.section==='پارکینگ'?'<small class="staffing-independent-v1091">پوزیشن مستقل؛ خارج از نقشه فیزیکی</small>':'<br>'}${x.details.map(d=>`${esc(d.position)} ${d.assigned}/${d.required}`).join(' • ')}</div>`).join('');
  return pageHead('نقشه ویژوال کمبود نیرو','سکشن‌های فیزیکی روی نقشه و پوزیشن مستقل پارک‌بان در فهرست جزئیات نمایش داده می‌شوند.',`<button class="btn" onclick="goView('staffingNeeds')">تنظیم نیاز نیرو</button>`)+`<div class="card"><div class="toolbar"><div class="field"><label>تاریخ</label><input value="${esc(f.date)}" onchange="ui.staffingMap.date=this.value;renderView()"></div><div class="field"><label>شیفت</label><select onchange="ui.staffingMap.shift=this.value;renderView()">${SHIFTS.map(x=>`<option ${f.shift===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="kpi"><div class="label">کمبود کل</div><div class="value danger-text">${totalShort}</div></div><div class="kpi"><div class="label">مازاد کل</div><div class="value positive">${totalSurplus}</div></div></div><div class="holiday-legend">${holidayInfo(f.date).title?`<span class="${holidayInfo(f.date).type==='holiday-official'?'official':'eve'}">${esc(holidayInfo(f.date).title)}</span>`:''}<span>منبع چیدمان: ${planSourceForDate(f.date)}</span></div></div><div class="floor-map-shell"><div class="card floor-map-scroll"><div class="floor-map-canvas" style="${image?`background-image:url('${esc(image)}');background-color:rgba(248,250,252,${1-n(state.floorMap.imageOpacity??.18)})`:''}">${regions}</div></div><div class="card"><h2>جزئیات سکشن‌ها و پوزیشن‌های مستقل</h2><div class="map-summary-list">${list||'<div class="empty">برای این تاریخ و شیفت نیازی تعریف نشده است.</div>'}</div></div></div>`;
}

function install(){
  if(typeof state==='undefined'||!state||typeof views==='undefined')return setTimeout(install,80);
  ui.staffingFilter=ui.staffingFilter||{dayIndex:'',shift:'',section:'',subSection:'',position:''};
  positionsForSectionV5=positionsForOperationalSection;
  editStaffingRequirement=editRequirement;
  viewsStaffingNeeds=viewsNeeds;
  viewsStaffingMap=viewsMap;
  views.staffingNeeds=viewsNeeds;
  views.staffingMap=viewsMap;
  window.editStaffingRequirement=editRequirement;
  window.RayoStaffingV1091={BUILD,refreshRequirementForm,saveRequirement,openBulk,refreshBulk,saveBulk,positionsForOperationalSection,validRequirement,viewsNeeds,viewsMap};
  document.documentElement.dataset.rayoBuild=BUILD;
  if(currentView==='staffingNeeds'||currentView==='staffingMap')renderView();
}

install();
})();
