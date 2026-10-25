import '../../public/demo/chat-policy.js';
import {readProgress} from '../onboarding.mjs';
import '../../public/demo/privacy.js';import '../../public/demo/support.js';
import '../../public/demo/safety.js';
import {validValues,valuesInstructions,valuesSchema,validValuesOutput} from './values-contract.mjs';
const P=globalThis.KotonohaPrivacy;
export function json(body,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
async function boundedJson(request){const reader=request.body?.getReader();if(!reader)throw Error();let size=0;const chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();throw Error()}chunks.push(value)}const buf=new Uint8Array(size);let pos=0;for(const c of chunks){buf.set(c,pos);pos+=c.length}return JSON.parse(new TextDecoder().decode(buf))}
export async function handleAI(request,{apiKey,model,userId,db},fetcher=fetch){
 if(!userId)return json({error:'AUTH_REQUIRED'},401);
 if(request.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
 const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return json({error:'ORIGIN_REJECTED'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'INVALID_CONTENT_TYPE'},415);
 let body;try{body=await boundedJson(request)}catch{return json({error:'INVALID_REQUEST'},400)}
 // This UI requires an explicit action and review for every external-AI request.
 // Keep legacy clients from invoking the former automatic rewriting path.
 if(body?.automatic!==undefined)return json({error:'AUTO_ASSIST_DISABLED'},403);
 if(body?.payload&&((body.payload.purpose==='values'&&body.payload.version!==globalThis.KotonohaValues.VERSION)||(['question','traits','rewrite'].includes(body.payload.purpose)&&body.payload.version!==P.VERSION)))return json({error:'PRIVACY_CHECK_REQUIRED'},422);
 if(!body||Object.keys(body).sort().join(',')!=='approved,payload'||body.approved!==true||!(validValues(body.payload)||P.validatePayload(body.payload)))return json({error:'INVALID_REQUEST'},400);
 const payload=body.payload;if(payload.answers.some(a=>!globalThis.SukiChatPolicy.check(a.text).allowed))return json({error:'CONTENT_BLOCKED'},422);const privateInfo=db?await db.prepare('SELECT ai_assist,real_name FROM account_details WHERE user_id=?').bind(userId).first():null;if(privateInfo?.real_name&&payload.answers.some(a=>globalThis.KotonohaSupport.prepare(a.text,{realName:privateInfo.real_name},false).hasPrivacy))return json({error:'REVIEW_REQUIRED'},422);
 // Re-check the exact approved content. Never silently alter it on the server.
 if(payload.answers.some(a=>globalThis.KotonohaSafety.scan(a.text).found.length))return json({error:'REVIEW_REQUIRED'},422);
 if(payload.purpose==='values'&&db){const stage=await readProgress(db,userId);if(!stage.basics||!stage.photo||!stage.questions)return json({error:'ONBOARDING_REQUIRED'},409);}
 if(!apiKey||!model)return json({error:'AI_NOT_CONFIGURED'},503);
 if(db){const day=new Date().toISOString().slice(0,10);const used=await db.prepare('INSERT INTO ai_usage (user_id, day, count) VALUES (?, ?, 1) ON CONFLICT(user_id, day) DO UPDATE SET count=count+1 WHERE count<60 RETURNING count').bind(userId,day).first();if(!used)return json({error:'DAILY_LIMIT'},429);}
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
 try{
  const upstream=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,store:false,instructions:payload.purpose==='values'?valuesInstructions():P.instructionsFor(payload),input:JSON.stringify(payload),max_output_tokens:1800,text:{format:{type:'json_schema',name:'kotonoha_response',strict:true,schema:payload.purpose==='values'?valuesSchema:P.schemaFor(payload)}}}),signal:controller.signal});
  if(!upstream.ok){let err;try{err=await upstream.json()}catch{};const code=err?.error?.code;const type=err?.error?.type;return json({error:code==='credit_balance_exhausted'||code==='insufficient_quota'||type==='insufficient_quota'?'AI_QUOTA_EXCEEDED':'AI_UNAVAILABLE'},502);}
  const result=await upstream.json();if(result.status!=='completed')return json({error:'OUTPUT_REJECTED'},502);
  const content=(result.output||[]).filter(x=>x.type==='message').flatMap(x=>x.content||[]);
  if(content.some(x=>x.type==='refusal'))return json({error:'OUTPUT_REJECTED'},502);
  const text=content.filter(x=>x.type==='output_text').map(x=>x.text).join('');let output;try{output=JSON.parse(text)}catch{return json({error:'OUTPUT_REJECTED'},502)}
  if(!(payload.purpose==='values'?validValuesOutput(output,payload):P.validateOutput(output,payload))||(payload.purpose==='rewrite'&&!globalThis.KotonohaSupport.outputAllowed(output.text)))return json({error:'OUTPUT_REJECTED'},502);
  if(!globalThis.SukiChatPolicy.check(JSON.stringify(output)).allowed)return json({error:'OUTPUT_REJECTED'},502);
  if(payload.purpose==='values'&&payload.stage===3&&output.relevant&&db)await db.prepare('UPDATE account_details SET ai_diagnosed_at=?,ai_diagnosis=?,ai_confirmed=0 WHERE user_id=?').bind(Date.now(),JSON.stringify(output.summary),userId).run();
  return json({output});
 }catch{return json({error:'AI_UNAVAILABLE'},502)}finally{clearTimeout(timer)}
}
