(function(root){
 const P=root.KotonohaPrivacy;
 const rules=[
  ['学校・所属',/(?:[一-龯ぁ-んァ-ヶA-Za-z]{2,15})(?:小学校|中学校|高校|高等学校|専門学校|学園)/g,'学校'],
  ['郵便番号',/〒?\d{3}[-ー]\d{4}/g,'非公開の地域'],
  ['番地',/\d{1,4}(?:丁目|番地|番|号|[-ー])\d{1,4}(?:(?:番|号|[-ー])\d{1,4})?/g,'詳しい場所は非公開'],
  ['行動日時',/(?:明日|今日|今夜|来週[月火水木金土日]曜(?:日)?|\d{1,2}月\d{1,2}日)(?:の|は)?(?:午前|午後)?\d{1,2}(?:時(?:\d{1,2}分)?|:\d{2})/g,'都合のよい時間'],
  ['氏名',/(?:本名|氏名|名前)(?:は|[:：])\s*[^\s。、！？!?,]{2,25}?(?=です|といいます|[\s。、！？!?,]|$)/g,'名前は非公開']
 ];
 function scan(raw){const first=P.scan(raw);let text=first.text;const found=[...first.found];for(const[label,re,replacement]of rules)text=text.replace(re,original=>{if(label==='氏名'&&/^(?:本名|氏名|名前)(?:は|[:：])\s*(?:非公開|秘密|内緒|(?:もう少し)?仲良くなってから(?:話すね|教えるね|話すよ|教えるよ|ね)?)$/.test(original))return original;found.push({label,original,replacement});return replacement;});return{text:found.length?text:String(raw),found,labels:[...new Set(found.map(x=>x.label))]};}
 function combinations(messages,draft=''){
  const entries=messages.map(m=>typeof m==='string'?m:m.text);if(draft)entries.push(draft);
  const categories=[['生活圏',/駅|沿線|近所|徒歩|地元|住ん|住ま|近く/],['所属・活動',/学校|大学|会社|仕事|勤務|部活|練習|サークル|学年/],['時間・習慣',/毎週|毎朝|いつも|曜日|[月火水木金土日]曜|\d{1,2}時|定期的/],['場所の特徴',/唯一|一軒|隣|向かい|目の前|赤い|看板|商店街/]];
  const hits=categories.map(([label,re])=>({label,indices:entries.flatMap((t,i)=>re.test(t)?[i]:[])})).filter(x=>x.indices.length);
  return {labels:hits.map(x=>x.label),warning:hits.length>=2,entries:entries.length};
 }
 async function review(raw,history,local){
  const logic=scan(raw);const ai=await local.check(logic.text,history.map(t=>scan(t).text));const final=scan(ai.text);
  return{text:final.text,changed:raw!==final.text,labels:[...new Set([...logic.labels,...ai.risks,...final.labels])],residual:final.found.length>0,combination:combinations(history,final.text)};
 }
 root.KotonohaSafety={scan,combinations,review};
})(globalThis);
