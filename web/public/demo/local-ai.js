// Model files are downloaded; message text stays inside this browser worker.
const MODEL='Qwen2.5-1.5B-Instruct-q4f32_1-MLC';
let worker, ready=false, sequence=0, pending=new Map();
export function isReady(){return ready;}
export async function load(onProgress=()=>{}){
  if(ready)return;
  if(!navigator.gpu)throw Error('このブラウザは端末内AIに必要なWebGPUに対応していません。対応ブラウザ・端末で開いてください。');
  if(!worker){
    worker=new Worker(new URL('./local-ai-worker.js',import.meta.url),{type:'module'});
    worker.onmessage=({data})=>{
      if(data.progress){onProgress(data.progress);return;}
      const task=pending.get(data.id);if(!task)return;pending.delete(data.id);
      clearTimeout(task.timer);data.error?task.reject(Error(data.error)):task.resolve(data.result);
    };
    worker.onerror=()=>{ready=false;for(const task of pending.values()){clearTimeout(task.timer);task.reject(Error('端末内AIを起動できませんでした。通信・空きメモリ・WebGPUの設定を確認してください。'));}pending.clear();worker?.terminate();worker=null;};
  }
  try{await call('load',{model:MODEL},600000);ready=true;}
  catch(error){ready=false;worker?.terminate();worker=null;throw error;}
}
function call(type,data,timeout=90000){return new Promise((resolve,reject)=>{
  const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);ready=false;worker?.terminate();worker=null;reject(Error('端末内AIの処理が時間内に終わりませんでした。文章は送信していません。'));},timeout);
  pending.set(id,{resolve,reject,timer});worker.postMessage({id,type,...data});
});}
export async function check(text,history=[]){
  if(!ready)throw Error('先に「端末内AIを準備する」を押してください。準備前の文章は送信されません。');
  const result=await call('check',{text,history:history.slice(-6).map(t=>t.slice(0,180))});
  const labels={phone:'電話番号',address:'住所',person_name:'氏名',affiliation:'学校・勤務先',location:'生活圏',schedule:'行動日時',contact:'連絡先',combination:'情報の組み合わせ',private_circumstances:'私的な事情'};
  if(!result||!Array.isArray(result.findings)||result.findings.length>12||result.findings.some(f=>!f||!Object.hasOwn(labels,f.kind)||typeof f.quote!=='string'||f.quote.length<2||!text.includes(f.quote)||typeof f.replacement!=='string'||!f.replacement.trim()||f.replacement.length>1000))throw Error('端末内AIの検出結果を確認できませんでした。文章は送信していません。');
  let prepared=text;const risks=[];
  for(const f of result.findings){prepared=prepared.split(f.quote).join(f.replacement);risks.push(labels[f.kind]);}
  if(!prepared.trim()||prepared.length>1000)throw Error('端末内AIの修正文を確認できませんでした。文章は送信していません。');
  return {text:prepared,risks:[...new Set(risks)]};
}
export async function extract(messages){
  if(!ready)throw Error('端末内AIが未準備です。');
  const recent=messages.slice(-6).map(m=>({id:m.id,text:m.text.slice(0,500)}));
  const output=await call('extract',{messages:recent.map(m=>({text:m.text}))});
  if(!output||!Array.isArray(output.facts)||output.facts.length>3)throw Error('希望の候補を確認できませんでした。');
  return {facts:output.facts.map(f=>{
    const source=recent.findLast(m=>typeof f?.quote==='string'&&m.text.includes(f.quote));
    if(!source)throw Error('希望の根拠を確認できませんでした。');
    return {...f,messageId:source.id};
  })};
}
