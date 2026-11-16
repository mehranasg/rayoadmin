// Probe: access list of the new panel — user form groups, preset fill, and what each preset role sees (sections, tabs,
// home summary, users tab). Writes nothing (the form is closed without saving; previews live in sessionStorage only).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/people/users';await wait(4000);
 out.usersTable=$$('#pnTab tbody tr').length;out.usersAccessCol=$$('#pnTab tbody tr').map(r=>r.cells[2]?.innerText.slice(0,200));
 const nb=$('[data-usr=""]');if(nb){nb.click();await wait(800);
  out.groups=$$('#pnModal fieldset legend').map(l=>l.innerText);out.boxes=$$('#pnModal [data-sec]').length;
  const st=$('#pnModal [data-preset="storekeeper"]');if(st){st.click();await wait(200);out.storekeeperFill=$$('#pnModal [data-sec]:checked').map(c=>c.dataset.sec)}
  await close()}
 const roles={};for(const p of AdminAccess.PRESETS){AdminAccess.setPreview(p);location.hash='#/home';P.render();await wait(1200);
  roles[p.id]={nav:$$('#pnSide .nav-link').map(a=>a.innerText.trim()).filter(Boolean),homeSummary:!!$('#hmChart')};
  const tabs={};for(const m of ['finance','inventory','people','menu','customers','reports','settings']){if(!P.can(m))continue;location.hash='#/'+m;P.render();await wait(300);tabs[m]=$$('.page-tabs .tab').map(t=>t.innerText.trim())}
  roles[p.id].tabs=tabs}
 AdminAccess.setPreview(null);P.render();out.roles=roles;out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs;try{AdminAccess.setPreview(null)}catch(_){}}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
