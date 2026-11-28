// Probe: the chart, icon and Excel libraries come from app/vendor/ (not a CDN), so the panel works where the CDNs are blocked.
(async()=>{const out={};try{await P.loadXLSX();out.xlsx=!!window.XLSX;out.scripts=[...document.scripts].map(s=>s.getAttribute('src')).filter(s=>s&&/echarts|lucide|xlsx/.test(s));out.echarts=window.echarts?.version;out.lucide=!!window.lucide}catch(e){out.err=String(e)}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
