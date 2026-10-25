import '../../public/demo/privacy.js';import '../../public/demo/support.js';
const P=globalThis.KotonohaPrivacy;
export function json(body,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
async function boundedJson(request){const reader=request.body?.getReader();if(!reader)throw Error();let size=0;const chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();throw Error()}chunks.push(value)}const buf=new Uint8Array(size);let pos=0;for(const c of chunks){buf.set(c,pos);pos+=c.length}return JSON.parse(new TextDecoder().decode(buf))}
export async function handleAI(request,{apiKey,model,userId,db},fetcher=fetch){
 if(!userId)return json({error:'AUTH_REQUIRED'},401);
 if(request.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
 const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return json({error:'ORIGIN_REJECTED'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'INVALID_CONTENT_TYPE'},415);
 let body;try{body=await boundedJson(request)}catch{return json({error:'INVALID_REQUEST'},400)}
 if(!body||!['approved,payload','approved,automatic,payload'].includes(Object.keys(body).sort().join(','))||body.approved!==true||!P.validatePayload(body.payload))return json({error:'INVALID_REQUEST'},400);
 const payload=body.payload;const privateInfo=db?await db.prepare('SELECT ai_assist,real_name FROM account_details WHERE user_id=?').bind(userId).first():null;if(body.automatic!==undefined){if(body.automatic!==true||!privateInfo?.ai_assist)return json({error:'AUTO_ASSIST_DISABLED'},403);}if(privateInfo?.real_name){const n=privateInfo.real_name.normalize('NFKC');if(payload.answers.some(a=>[n,n.replace(/\s/g,'')].some(v=>v.length>=2&&a.text.normalize('NFKC').includes(v))))return json({error:'REVIEW_REQUIRED'},422);}
 // Re-check the exact approved content. Never silently alter it on the server.
 if(payload.answers.some(a=>P.scan(a.text).found.length))return json({error:'REVIEW_REQUIRED'},422);
 if(!apiKey||!model)return json({error:'AI_NOT_CONFIGURED'},503);
 if(db){const day=new Date().toISOString().slice(0,10);const used=await db.prepare('INSERT INTO ai_usage (user_id, day, count) VALUES (?, ?, 1) ON CONFLICT(user_id, day) DO UPDATE SET count=count+1 WHERE count<60 RETURNING count').bind(userId,day).first();if(!used)return json({error:'DAILY_LIMIT'},429);}
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
 try{
  const upstream=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,store:false,instructions:P.instructionsFor(payload),input:JSON.stringify(payload),max_output_tokens:1800,text:{format:{type:'json_schema',name:'kotonoha_response',strict:true,schema:P.schemaFor(payload)}}}),signal:controller.signal});
  if(!upstream.ok){let err;try{err=await upstream.json()}catch{};const code=err?.error?.code;const type=err?.error?.type;return json({error:code==='credit_balance_exhausted'||code==='insufficient_quota'||type==='insufficient_quota'?'AI_QUOTA_EXCEEDED':'AI_UNAVAILABLE'},502);}
  const result=await upstream.json();if(result.status!=='completed')return json({error:'OUTPUT_REJECTED'},502);
  const content=(result.output||[]).filter(x=>x.type==='message').flatMap(x=>x.content||[]);
  if(content.some(x=>x.type==='refusal'))return json({error:'OUTPUT_REJECTED'},502);
  const text=content.filter(x=>x.type==='output_text').map(x=>x.text).join('');let output;try{output=JSON.parse(text)}catch{return json({error:'OUTPUT_REJECTED'},502)}
  if(!P.validateOutput(output,payload)||(payload.purpose==='rewrite'&&!globalThis.KotonohaSupport.outputAllowed(output.text)))return json({error:'OUTPUT_REJECTED'},502);
  return json({output});
 }catch{return json({error:'AI_UNAVAILABLE'},502)}finally{clearTimeout(timer)}
}
