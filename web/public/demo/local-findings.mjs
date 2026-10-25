// The model identifies spans; application code chooses every replacement.
export const replacements={phone:['電話番号','連絡先は非公開'],address:['住所','近くの地域'],person_name:['氏名','名前は非公開'],affiliation:['学校・勤務先','学校や職場'],location:['地名・生活圏','近くの地域'],schedule:['行動日時','都合のよい時間'],contact:['連絡先','連絡先は非公開'],combination:['情報の組み合わせ','詳しいことは、もう少し仲良くなってから'],private_circumstances:['私的な事情','詳しい事情は非公開'],payment:['カード・口座情報','支払い情報は非公開'],credential:['認証情報','秘密の情報は非公開']};
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===keys;
export function applyFindings(result,text){
 if(!exact(result,'findings')||!Array.isArray(result.findings)||result.findings.length>12)throw Error('端末内AIの検出形式を確認できませんでした。送信していません。');
 const spans=[],risks=[];
 for(const f of result.findings){
  if(!exact(f,'kind,quote')||!Object.hasOwn(replacements,f.kind)||typeof f.quote!=='string'||f.quote.trim().length<2||f.quote.length>1000||!text.includes(f.quote))throw Error('端末内AIの根拠を確認できませんでした。送信していません。');
  risks.push(replacements[f.kind][0]);
  let pos=0;while((pos=text.indexOf(f.quote,pos))!==-1){spans.push({start:pos,end:pos+f.quote.length,kinds:[f.kind]});pos+=f.quote.length;if(spans.length>128)throw Error('検出候補が多すぎます。短く書き直してください。');}
 }
 spans.sort((a,b)=>a.start-b.start||b.end-a.end);const merged=[];
 for(const span of spans){const last=merged.at(-1);if(last&&span.start<last.end){last.end=Math.max(last.end,span.end);last.kinds=[...new Set([...last.kinds,...span.kinds])];}else merged.push({...span});}
 let prepared='',pos=0;for(const span of merged){prepared+=text.slice(pos,span.start)+(span.kinds.length===1?replacements[span.kinds[0]][1]:'詳しい情報は非公開');pos=span.end;}prepared+=text.slice(pos);
 if(!prepared.trim()||prepared.length>1000)throw Error('端末内AIの修正結果を確認できませんでした。送信していません。');
 return {text:prepared,risks:[...new Set(risks)]};
}
