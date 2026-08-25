(function(){
'use strict';
let xlsxPromise=null;
const txt=v=>String(v??'').trim();
const en=s=>String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const num=v=>{const n=Number(en(v).replace(/[٬,،\s]/g,'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:0};
const norm=v=>txt(v).replace(/\u200c/g,' ').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\sـ_\-\/\\()\[\]،,:؛.؟?!]/g,'').toLowerCase();
const uniq=a=>[...new Set((a||[]).map(txt).filter(Boolean))];
async function loadXLSX(){
  if(window.XLSX)return window.XLSX;
  if(xlsxPromise)return xlsxPromise;
  const sources=['./js/xlsx.full.min.js','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'];
  xlsxPromise=new Promise(async(resolve,reject)=>{
    for(const src of sources){
      try{
        await new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=fail;document.head.appendChild(s)});
        if(window.XLSX)return resolve(window.XLSX);
      }catch(_){ }
    }
    reject(new Error('کتابخانه خواندن Excel بارگذاری نشد. فایل xlsx.full.min.js را داخل پوشه js قرار دهید یا دسترسی اینترنت را بررسی کنید.'));
  });
  return xlsxPromise;
}
function findCol(headers,aliases){const hs=headers.map(norm),as=aliases.map(norm);return hs.findIndex(h=>as.some(a=>h===a||h.includes(a)||a.includes(h)))}
function bestTable(wb,spec,scan=30){let best=null;for(const sheetName of wb.SheetNames){const rows=window.XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,raw:false,defval:'',blankrows:false});for(let r=0;r<Math.min(scan,rows.length);r++){const headers=(rows[r]||[]).map(txt),map={},missing=[];let score=0;for(const [key,cfg] of Object.entries(spec)){const aliases=Array.isArray(cfg)?cfg:(cfg.aliases||[]),idx=findCol(headers,aliases);map[key]=idx;const required=Array.isArray(cfg)?false:!!cfg.required,weight=Array.isArray(cfg)?1:(cfg.weight||1);if(idx>=0)score+=weight;else if(required)missing.push(key)}const candidate={sheetName,rows,headerRow:r,headers,map,score,missing};if(!best||(!candidate.missing.length&&best.missing.length)||candidate.score>best.score)best=candidate}}return best}
async function readFile(file){const XLSX=await loadXLSX();const wb=XLSX.read(await file.arrayBuffer(),{type:'array',raw:false,cellDates:false});return wb}
async function readBest(file,spec,opts={}){const wb=await readFile(file),best=bestTable(wb,spec,opts.scan||30);if(!best||best.missing.length)throw new Error(`ستون‌های الزامی Excel پیدا نشد${best?.missing?.length?`: ${best.missing.join('، ')}`:''}`);const data=best.rows.slice(best.headerRow+1).filter(r=>r.some(v=>txt(v)!==''));return{...best,data,get:(row,key)=>best.map[key]>=0?row[best.map[key]]:''}}
function csv(rows){return rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n')}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
async function exportRows(rows,name='export.xlsx',sheetName='Data'){
  try{const XLSX=await loadXLSX();const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(rows);XLSX.utils.book_append_sheet(wb,ws,sheetName);XLSX.writeFile(wb,name)}catch(e){downloadBlob(new Blob(['\ufeff'+csv(rows)],{type:'text/csv;charset=utf-8'}),name.replace(/\.xlsx$/i,'.csv'))}
}
function template(specRows,name='template.xlsx'){return exportRows(specRows,name,'Template')}
window.RayoExcel={loadXLSX,readFile,readBest,bestTable,findCol,norm,txt,num,uniq,exportRows,template,downloadBlob};
})();
