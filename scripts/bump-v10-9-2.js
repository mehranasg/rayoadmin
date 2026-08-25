#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
for(const name of fs.readdirSync(root).filter(x=>x.endsWith('.html'))){
  const p=path.join(root,name);let s=fs.readFileSync(p,'utf8').replaceAll('10.9.2','10.9.3');
  if(!s.includes('06-operations-v10-9-2.css'))s=s.replace('</head>','<link rel="stylesheet" href="./css/06-operations-v10-9-2.css?v=10.9.3"></head>');
  if(s.includes('40-rayo-v10-9-comprehensive.js')&&!s.includes('42-operations-v10-9-2.js'))s=s.replace('</body>','<script src="./js/42-operations-v10-9-2.js?v=10.9.3"></script></body>');
  fs.writeFileSync(p,s);
}
for(const rel of ['js/app-config.js','js/config.js','seed/manifest.json']){const p=path.join(root,rel);if(fs.existsSync(p))fs.writeFileSync(p,fs.readFileSync(p,'utf8').replaceAll('10.9.2','10.9.3'))}
