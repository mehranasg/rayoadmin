#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const pricingPath=path.join(root,'seed','pricing-data.seed.json');
const supplierPath=path.join(root,'seed','suppliers-data.seed.json');
const pricing=JSON.parse(fs.readFileSync(pricingPath,'utf8'));
const suppliers=JSON.parse(fs.readFileSync(supplierPath,'utf8'));
const norm=x=>String(x||'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f\u200e\s_\-–—()（）،,./\\]+/g,'').toLowerCase();
const old=Array.isArray(suppliers.items)?suppliers.items:[],used=new Set(),byName=new Map(),remap=new Map();
old.forEach((x,idx)=>{const k=norm(x.name);if(!byName.has(k))byName.set(k,[]);byName.get(k).push({x,idx})});
let matched=0;
const merged=(pricing.ingredients||[]).map(i=>{
  let idx=old.findIndex((x,j)=>!used.has(j)&&(x.pricingIngredientId===i.id||String(x.code||'')===String(i.code||''))),hit=idx>=0?old[idx]:null;
  if(!hit){const candidates=(byName.get(norm(i.name))||[]).filter(z=>!used.has(z.idx));if(candidates.length===1){hit=candidates[0].x;idx=candidates[0].idx}}
  if(hit){used.add(idx);matched++;if(String(hit.code)!==String(i.code))remap.set(String(hit.code),String(i.code))}
  const base=hit?JSON.parse(JSON.stringify(hit)):{},legacyCodes=[...new Set([...(Array.isArray(base.legacyCodes)?base.legacyCodes:[]),...(hit&&String(hit.code)!==String(i.code)?[String(hit.code)]:[])].filter(Boolean))];
  return {...base,id:base.id||i.id,code:String(i.code||''),name:i.name,mainGroup:base.mainGroup||i.category||'مواد اولیه',subGroup:base.subGroup||'',purchaseUnit:i.purchaseUnit||base.purchaseUnit||'',consumptionUnit:i.recipeUnit||base.consumptionUnit||'',conversionFactor:Number(i.packageQuantity)||Number(base.conversionFactor)||1,status:i.status||base.status||'فعال',pricingIngredientId:i.id,sepidsCode:String(i.code||''),source:'pricing',sourceCodeLocked:true,legacyCodes};
});
const extras=old.filter((_,idx)=>!used.has(idx));
suppliers.items=[...merged,...extras];
suppliers.supplierItems=(suppliers.supplierItems||[]).map(r=>({...r,itemCode:remap.get(String(r.itemCode))||r.itemCode}));
suppliers.purchaseRequests=Array.isArray(suppliers.purchaseRequests)?suppliers.purchaseRequests:[];
suppliers.meta={...(suppliers.meta||{}),schemaVersion:'1.1.0',seedRevision:'10.9.3',updatedAt:'2026-08-21T00:00:00.000Z'};
suppliers.lists=suppliers.lists||{};
suppliers.lists.itemGroups=[...new Set([...(suppliers.lists.itemGroups||[]),...(pricing.ingredients||[]).map(i=>i.category).filter(Boolean)])];
fs.writeFileSync(supplierPath,JSON.stringify(suppliers,null,2)+'\n');
process.stdout.write(JSON.stringify({pricing:(pricing.ingredients||[]).length,matched,added:(pricing.ingredients||[]).length-matched,extras:extras.length,total:suppliers.items.length},null,2)+'\n');
