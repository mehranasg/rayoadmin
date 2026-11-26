// Probe (layout only): width of each column of the catalog list. Writes nothing.
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s);
try{for(let i=0;i<120&&!InvControl.ready();i++)await wait(500);location.hash='#/base/catalog';await wait(3500);const t=$('#catTable table'),w=t.closest('.table-wrap');
 out.frame=w.clientWidth;out.table=t.scrollWidth;out.cols=[...t.tHead.rows[0].cells].filter(c=>c.offsetWidth).map(c=>c.innerText.replace(/\s+/g,' ').trim()+': '+c.offsetWidth)}catch(e){out.err=String(e)}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
