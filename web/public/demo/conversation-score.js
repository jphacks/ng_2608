(function(root){
'use strict';
const topics=[/映画|ドラマ|アニメ/,/カフェ|コーヒー|喫茶/,/旅行|旅先|温泉/,/散歩|テニス|スポーツ|運動/,/音楽|ライブ|歌/,/読書|小説|本屋/,/料理|自炊|食べ|ごはん/,/ゲーム/,/犬|猫|ペット/];
const warm=/ありがとう|うれしい|嬉しい|楽しみ|いいね|良いね|素敵|わかる|分かる/;
function score(messages=[]){
 const recent=messages.slice(-100).filter(m=>typeof m.text==='string'&&m.text.trim()).map(m=>({...m,text:m.text.slice(0,1000)}));
 const mine=recent.filter(m=>m.mine),peer=recent.filter(m=>!m.mine);
 if(!mine.length||!peer.length)return{score:null,samples:recent.length};
 const left=mine.map(m=>m.text).join(' '),right=peer.map(m=>m.text).join(' ');
 const shared=topics.filter(re=>re.test(left)&&re.test(right)).length;
 const turns=recent.reduce((n,m,i)=>n+(i>0&&m.mine!==recent[i-1].mine?1:0),0);
 const balance=Math.min(mine.length,peer.length)/Math.max(mine.length,peer.length);
 const rapport=(warm.test(left)?2:0)+(warm.test(right)?2:0);
 const invitation=/一緒に|いっしょに|行こう|行きたい|見よう|観よう/;
 const plans=invitation.test(left)&&invitation.test(right)?4:0;
 return{score:Math.min(98,80+Math.min(20,shared*5)+Math.min(6,turns)+Math.round(balance*4)+rapport+plans),samples:recent.length};
}
// Public, user-reviewed AI summaries can refine the questionnaire match.
function publicAI(a={},b={}){
 const rows=['shared_time','contact_pace','decision_style'].filter(k=>a[k]&&b[k]);
 if(!rows.length)return null;
 const terms=[...topics,/毎日|一日|日常/,/ゆっくり|ペース|都合/,/相談|話し合|話して|尊重/,/交代|順番|両方|合わせ/];
 const values=rows.map(k=>{const aa=new Set(terms.flatMap((r,i)=>r.test(a[k])?[i]:[])),bb=new Set(terms.flatMap((r,i)=>r.test(b[k])?[i]:[]));if(!aa.size||!bb.size)return null;return [...aa].filter(i=>bb.has(i)).length/new Set([...aa,...bb]).size;}).filter(v=>v!==null);
 return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
}
root.SukiConversation={score,publicAI};
})(globalThis);
