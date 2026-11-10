// Probe: people → standard structure preview and apply (dev server only, in-memory copy), then the person form with four groups.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/people/staff';await wait(5000);for(let i=0;i<20&&!PeopleReal.doc?.();i++)await wait(500);out.note=!!$('#stdOpen');$('#stdOpen')?.click();await wait(1200);
 out.preview=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,300);await shot('people-std');
 window.confirm=()=>true;$$('#pnModal .modal-foot button').find(b=>/اعمال/.test(b.innerText))?.click();for(let i=0;i<40&&$('.modal-backdrop.open');i++)await wait(300);await wait(1500);
 const d=PeopleReal.doc();out.after={version:d.lists?.structureVersion,groups:PeopleWrite.groupsOf(d),mgmt:d.personnel.filter(p=>p.personnelGroup==='مدیریت').length,noteGone:!$('#stdOpen')};
 const p=d.personnel.find(x=>x.personnelGroup==='آشپزخانه');PeopleHR.personForm(p.id);await wait(1200);out.form={groups:[...$$('#pnModal [name=grp] option')].map(o=>o.value),sec:[...$$('#pnModal [name=sec] option')].map(o=>o.value),pos:$('#pnModal [name=pos]').value};await shot('people-std-form');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
