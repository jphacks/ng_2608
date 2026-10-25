import '../public/demo/privacy.js';
import '../public/demo/safety.js';
import '../public/demo/insights.js';
const I=globalThis.KotonohaInsights,S=globalThis.KotonohaSafety;
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function readBody(request){const reader=request.body?.getReader();if(!reader)throw Error();let bytes=0,text='';const decoder=new TextDecoder();for(;;){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>8000){await reader.cancel();throw Error();}text+=decoder.decode(value,{stream:true});}return JSON.parse(text+decoder.decode());}
export async function handleInsights(request,db,userId,path){
 if(!['GET','POST'].includes(request.method))return json({error:'METHOD_NOT_ALLOWED'},405);
 if(request.method==='POST'&&!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'INVALID_CONTENT_TYPE'},415);
 const one=(sql,...args)=>db.prepare(sql).bind(...args).first();
 const all=async(sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
 let body;try{if(request.method==='POST')body=await readBody(request);}catch{return json({error:'INVALID_REQUEST'},400);}
 if(request.method==='POST'&&(!body||typeof body!=='object'||Array.isArray(body)))return json({error:'INVALID_REQUEST'},400);
 const peer=body?.peer||new URL(request.url).searchParams.get('peer');
 if(typeof peer!=='string'||!peer||peer===userId||peer.length>200)return json({error:'INVALID_REQUEST'},400);
 if(await one('SELECT 1 FROM blocks WHERE (source=? AND target=?) OR (source=? AND target=?)',userId,peer,peer,userId)||!await one('SELECT 1 FROM likes a JOIN likes b ON a.source=b.target AND a.target=b.source WHERE a.source=? AND a.target=?',userId,peer))return json({error:'CHAT_FORBIDDEN'},403);
 const enabled=async(source,target)=>!!(await one('SELECT enabled FROM insight_consents WHERE source=? AND target=?',source,target))?.enabled;
 const readFacts=async(source,target)=>(await all('SELECT * FROM insight_facts WHERE source=? AND target=?',source,target)).map(f=>({dimension:f.dimension,values:JSON.parse(f.values_json),messageId:f.message_id,quote:f.quote,updatedAt:f.updated_at}));
 if(path==='insights'&&request.method==='GET'){
  const ownEnabled=await enabled(userId,peer),peerEnabled=await enabled(peer,userId);
  return json({ownEnabled,peerEnabled,own:ownEnabled?await readFacts(userId,peer):[],peer:ownEnabled&&peerEnabled?await readFacts(peer,userId):[]});
 }
 if(path==='insights/consent'&&request.method==='POST'){
  if(Object.keys(body).sort().join(',')!=='enabled,peer'||typeof body.enabled!=='boolean')return json({error:'INVALID_REQUEST'},400);
  const statements=[db.prepare('INSERT INTO insight_consents(source,target,enabled) VALUES(?,?,?) ON CONFLICT(source,target) DO UPDATE SET enabled=excluded.enabled').bind(userId,peer,body.enabled?1:0)];
  if(!body.enabled)statements.push(db.prepare('DELETE FROM insight_facts WHERE (source=? AND target=?) OR (source=? AND target=?)').bind(userId,peer,peer,userId));
  await db.batch(statements);return json({saved:true});
 }
 if(path==='insights/facts'&&request.method==='POST'){
  if(Object.keys(body).sort().join(',')!=='approved,facts,peer'||body.approved!==true||!Array.isArray(body.facts)||body.facts.length>3||new Set(body.facts.map(f=>f?.dimension)).size!==body.facts.length)return json({error:'INVALID_REQUEST'},400);
  if(!await enabled(userId,peer)||!await enabled(peer,userId))return json({error:'CONSENT_REQUIRED'},403);
  for(const fact of body.facts){
   if(!I.validFact(fact)||S.scan(fact.quote).found.length)return json({error:'REVIEW_REQUIRED'},422);
   const message=await one('SELECT body FROM messages WHERE id=? AND sender=? AND recipient=?',fact.messageId,userId,peer);
   if(!message||!message.body.includes(fact.quote))return json({error:'EVIDENCE_REJECTED'},422);
  }
  // Replacement, including [], supports correction and withdrawal without keeping stale facts.
  await db.batch([db.prepare('DELETE FROM insight_facts WHERE source=? AND target=?').bind(userId,peer),...body.facts.map(f=>db.prepare('INSERT INTO insight_facts(source,target,dimension,values_json,message_id,quote,updated_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM insight_consents WHERE source=? AND target=? AND enabled=1) AND EXISTS(SELECT 1 FROM insight_consents WHERE source=? AND target=? AND enabled=1)').bind(userId,peer,f.dimension,JSON.stringify(f.values),f.messageId,f.quote,Date.now(),userId,peer,peer,userId))]);
  return json({saved:true});
 }
 return json({error:'NOT_FOUND'},404);
}
