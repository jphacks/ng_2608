import '../../public/demo/values.js';
import '../../public/demo/questionnaire.js';
import '../../public/demo/privacy.js';
import '../../public/demo/safety.js';
const V=globalThis.KotonohaValues,S=globalThis.KotonohaSafety;
const keys=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===k.split(',').sort().join(',');
const forbidden=/モテそう|相性抜群|協調性が高い|あなたは.{0,20}タイプ|成功率|相性.{0,5}\d|完全に匿名|絶対に安全/;
export function validValues(p){
 return keys(p,'purpose,version,stage,selection_answers,answers')&&globalThis.KotonohaQuestionnaire.valid(p.selection_answers)&&p.purpose==='values'&&p.version==='values-1'&&Number.isInteger(p.stage)&&p.stage>=1&&p.stage<=3&&Array.isArray(p.answers)&&p.answers.length===p.stage&&p.answers.every((a,i)=>keys(a,'id,text')&&a.id===i+1&&typeof a.text==='string'&&a.text.trim()&&a.text.length<=1000);
}
export function valuesInstructions(){return V.prompt+'\n【いま返事する回答】reactionはanswers配列の最後（id=stage）の回答だけを受け止めてください。前の回答へのリアクションを繰り返さないでください。\n【14問の選択肢定義】'+JSON.stringify(globalThis.KotonohaQuestionnaire.questions.map(q=>({id:q.id,title:q.title,options:q.options})))+'\n【アプリの出力契約】質問・導入・定型の終了文はアプリが固定表示します。あなたはJSONでreaction（1文のリアクション、質問文を含めない）、relevant（現在の回答が質問に沿うか。スキップ・場合による・短い返答はtrue）、summary（time,pace,disagreement,bio）、evidenceだけを返してください。段階1・2または脱線時はsummaryの4項目をすべて空文字、evidenceは空配列にしてください。段階3のsummaryには指定の4項目を入れてください。選択式も対話も未回答の項目は「今回は未回答」。脱線時のreactionは空文字にしてください。evidenceはfield（time/pace/disagreement/bio）、sourceId（自由回答はanswer:1など、14問はselection:holidayなど）、quote（その回答または選択肢の日本語ラベルに実在する短い連続引用）の配列です。未回答以外のまとめ4項目にそれぞれ根拠を付けます。人格評価や推測の根拠として引用を使わないでください。';}
export const valuesSchema={type:'object',additionalProperties:false,required:['reaction','relevant','summary','evidence'],properties:{reaction:{type:'string'},relevant:{type:'boolean'},summary:{type:'object',additionalProperties:false,required:['time','pace','disagreement','bio'],properties:Object.fromEntries(['time','pace','disagreement','bio'].map(k=>[k,{type:'string'}]))},evidence:{type:'array',items:{type:'object',additionalProperties:false,required:['field','sourceId','quote'],properties:{field:{type:'string',enum:['time','pace','disagreement','bio']},sourceId:{type:'string'},quote:{type:'string'}}}}}};
export function validValuesOutput(o,p){
 if(!keys(o,'reaction,relevant,summary,evidence')||typeof o.relevant!=='boolean'||typeof o.reaction!=='string'||o.reaction.length>160||/[?？]/.test(o.reaction)||!keys(o.summary,'time,pace,disagreement,bio')||!Array.isArray(o.evidence)||o.evidence.length>12)return false;
 const sources=Object.fromEntries(p.answers.map(a=>['answer:'+a.id,a.text]));for(const [id,value]of Object.entries(p.selection_answers.answers))sources['selection:'+id]=globalThis.KotonohaQuestionnaire.answerLabel(id,value);
 if(o.evidence.some(e=>!keys(e,'field,sourceId,quote')||!['time','pace','disagreement','bio'].includes(e.field)||typeof e.sourceId!=='string'||typeof e.quote!=='string'||!e.quote.trim()||e.quote.length>120||!sources[e.sourceId]?.includes(e.quote)||S.scan(e.quote).found.length))return false;
 const texts=[o.reaction,...Object.values(o.summary)];if(texts.some(t=>typeof t!=='string'||t.length>300||S.scan(t).found.length||forbidden.test(t)))return false;
 if(o.relevant&&p.stage===3){
  if(Object.values(o.summary).some(t=>!t.trim())||o.summary.bio.length>160)return false;
  if(Object.entries(o.summary).some(([field,text])=>text!=='今回は未回答'&&!o.evidence.some(e=>e.field===field)))return false;
  for(const [i,key]of ['time','pace','disagreement'].entries())if(!p.selection_answers.answers[['holiday','contact','__none__'][i]]&&/^(今回は未回答|スキップ|答えたくない)$/.test(p.answers[i].text)&&o.summary[key]!=='今回は未回答')return false;
 }else if(Object.values(o.summary).some(Boolean))return false; // Grounded intermediate evidence is harmless; it is not displayed as a result.
 return true;
}
