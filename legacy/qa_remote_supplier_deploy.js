const url='https://rayocafe.ir/panel3/suppliers.html?tab=relations&codexcheck='+Date.now();

async function run(){
  const response=await fetch(url,{headers:{'cache-control':'no-cache'}});
  const html=await response.text();
  console.log('PAGE',response.status,response.url,html.length);
  const sources=[...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(x=>x[1]);
  const relevant=sources.filter(x=>/(30-operational|43-central|44-phase1|08-phase1)/.test(x));
  console.log(relevant.join('\n'));
  for(const source of relevant.filter(x=>x.includes('.js'))){
    const assetUrl=new URL(source,response.url);assetUrl.searchParams.set('codexcheck',Date.now());
    const assetResponse=await fetch(assetUrl,{headers:{'cache-control':'no-cache'}}),body=await assetResponse.text();
    console.log('ASSET',assetResponse.status,assetUrl.pathname,body.length,{
      supplierSearch:body.includes('جست‌وجوی نام تأمین‌کننده'),
      multiSelect:body.includes('toggleFilteredItems'),
      sms:body.includes("[...values,'اس ام اس']"),
      supplierBackdrop:body.includes("['personnel.html','suppliers.html'].includes(file())")
    });
  }
}

run().catch(error=>{console.error(error);process.exitCode=1});
