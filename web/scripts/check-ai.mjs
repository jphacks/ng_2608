import {handleAI} from '../lib/ai/gateway.mjs';
process.loadEnvFile('.env.local');
const p={version:globalThis.KotonohaPrivacy.VERSION,purpose:'question',intent:'ゆっくり話したい',answers:[{id:1,text:'休日は友達と運動したり、カフェに行きます。'}]};
const r=await handleAI(new Request('https://example.test/api/ai/respond',{method:'POST',headers:{origin:'https://example.test','content-type':'application/json'},body:JSON.stringify({approved:true,payload:p})}),{userId:'smoke',apiKey:process.env.OPENAI_API_KEY,model:'gpt-4.1-mini'},async(url,options)=>{try{const r=await fetch(url,options);const j=await r.clone().json();console.log(JSON.stringify({upstreamStatus:r.status,errorCode:j.error?.code,errorType:j.error?.type,responseStatus:j.status}));return r}catch(e){console.log(JSON.stringify({transportError:e.cause?.code||e.name}));throw e}});
console.log(JSON.stringify({gatewayStatus:r.status,result:await r.json()}));
