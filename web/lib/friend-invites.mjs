import {readProgress} from './onboarding.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const validToken=token=>typeof token==='string'&&/^[a-f0-9]{32}$/.test(token);
const preview=row=>({id:row.user_id,name:row.nickname,age:row.age});
export async function handleFriendInvites(request,db,userId,path){
 if(!['GET','POST'].includes(request.method))return json({error:'METHOD_NOT_ALLOWED'},405);
 const now=Date.now();
 const one=(sql,...args)=>db.prepare(sql).bind(...args).first();
 const blocked=(a,b)=>one('SELECT 1 FROM blocks WHERE (source=? AND target=?) OR (source=? AND target=?)',a,b,b,a);
 if(path==='friends/invite'&&request.method==='POST'){
  if(!(await readProgress(db,userId)).complete)return json({error:'ONBOARDING_REQUIRED'},409);
  const recent=await one('SELECT count(*) AS count FROM friend_invites WHERE creator=? AND expires_at>?',userId,now);
  if(recent.count>=10)return json({error:'INVITE_LIMIT'},429);
  const bytes=crypto.getRandomValues(new Uint8Array(16)),token=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  const expiresAt=now+24*60*60*1000;
  await db.prepare('INSERT INTO friend_invites(token,creator,expires_at) VALUES(?,?,?)').bind(token,userId,expiresAt).run();
  return json({token,expiresAt});
 }
 let token;
 if(request.method==='GET')token=new URL(request.url).searchParams.get('token');
 else{
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'INVALID_CONTENT_TYPE'},415);
  const reader=request.body?.getReader();if(!reader)return json({error:'INVALID_REQUEST'},400);let bytes=0,text='';const decoder=new TextDecoder();for(;;){const r=await reader.read();if(r.done)break;bytes+=r.value.length;if(bytes>1024){await reader.cancel();return json({error:'INVALID_REQUEST'},400);}text+=decoder.decode(r.value,{stream:true});}
  try{const body=JSON.parse(text+decoder.decode());if(Object.keys(body).sort().join(',')!=='token')throw Error();token=body.token;}catch{return json({error:'INVALID_REQUEST'},400);}
 }
 if(!validToken(token))return json({error:'INVITE_INVALID'},404);
 const invite=await one('SELECT * FROM friend_invites WHERE token=?',token);
 if(!invite||invite.expires_at<=now||(invite.recipient&&invite.recipient!==userId)||await blocked(userId,invite.creator))return json({error:'INVITE_INVALID'},404);
 const creator=await one('SELECT * FROM profiles WHERE user_id=?',invite.creator);
 if(!creator)return json({error:'INVITE_INVALID'},404);
 if(path==='friends/invite'&&request.method==='GET')return json({inviter:preview(creator),self:invite.creator===userId,expiresAt:invite.expires_at});
 if(path!=='friends/accept'||request.method!=='POST')return json({error:'NOT_FOUND'},404);
 if(invite.creator===userId)return json({error:'INVITE_SELF'},409);
 if(!(await readProgress(db,userId)).complete||!(await readProgress(db,invite.creator)).complete)return json({error:'ONBOARDING_REQUIRED'},409);
 const claimed=await db.prepare('UPDATE friend_invites SET recipient=? WHERE token=? AND expires_at>? AND (recipient IS NULL OR recipient=?) RETURNING creator').bind(userId,token,now,userId).first();
 if(!claimed)return json({error:'INVITE_INVALID'},404);
 const safe=' AND NOT EXISTS (SELECT 1 FROM blocks WHERE (source=? AND target=?) OR (source=? AND target=?))';
 await db.batch([
  db.prepare('INSERT OR IGNORE INTO likes(source,target,created_at) SELECT ?,?,? WHERE 1=1'+safe).bind(invite.creator,userId,now,userId,invite.creator,invite.creator,userId),
  db.prepare('INSERT OR IGNORE INTO likes(source,target,created_at) SELECT ?,?,? WHERE 1=1'+safe).bind(userId,invite.creator,now,userId,invite.creator,invite.creator,userId)
 ]);
 if(await blocked(userId,invite.creator))return json({error:'CHAT_FORBIDDEN'},403);
 return json({matched:true,peer:invite.creator});
}
