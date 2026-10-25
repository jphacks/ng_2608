/* Standard rules work on every device; optional AI failures never silently downgrade. */
(function(root){
'use strict';
function prepare(text,known={}){
 const first=root.KotonohaSupport.prepare(text,{...known,privacyOnly:true},false);let current=first.text,labels=[...first.labels];
 for(let i=0;i<3;i++){const next=root.KotonohaSafety.scan(current);labels.push(...next.labels);if(next.text===current)break;current=next.text;}
 return {text:current,labels:[...new Set(labels)],changed:current!==text};
}
async function review({text,history=[],known={},local,requireAI=false}){
 if(typeof text!=='string'||!text.trim()||text.length>1000)throw Error('文章は1〜1,000文字で入力してください。');
 const first=prepare(text,known);
 if(first.changed||first.labels.length)return {status:'revise',text:first.text,labels:first.labels,sources:['ルール']};
 if(!local?.isReady?.()){
  if(requireAI)throw Error('追加AIチェックが使えません。送信していません。準備し直すか、設定から「標準チェック」に切り替えてください。');
  return {status:'allow',text:first.text,labels:[],sources:['標準チェック（端末内AI未使用）']};
 }
 const safeHistory=history.slice(-4).map(t=>prepare(String(t).slice(0,120),known).text);
 const checked=await local.check(first.text,safeHistory);
 if(!checked||typeof checked.text!=='string'||!Array.isArray(checked.risks)||checked.risks.some(v=>typeof v!=='string'))throw Error('端末内AIの確認結果を読めませんでした。送信していません。');
 const last=prepare(checked.text,known);
 if(last.changed||checked.text!==text||checked.risks.length||last.labels.length)return {status:'revise',text:last.text,labels:[...new Set([...checked.risks,...last.labels])],sources:['端末内AI',...(last.changed?['ルール']:[])]};
 return {status:'allow',text:first.text,labels:[],sources:['ルール','端末内AI']};
}
root.SukiTrustReview={prepare,review};
})(globalThis);
