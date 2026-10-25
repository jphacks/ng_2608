(function(root){
  'use strict';
  const dimensions=[
    {id:'shared_time',title:'一緒に楽しみたい時間',options:{indoor:'家でゆっくり',outdoor:'外へ出かける',mixed:'家も外出も楽しむ'}},
    {id:'contact_pace',title:'心地よい連絡のペース',options:{occasional:'用事があるとき中心',daily:'一日の終わりなどに',frequent:'日常をこまめに共有',flexible:'場面やお互いの都合に合わせる'}},
    {id:'decision_style',title:'希望が違うときの決め方',options:{combine:'両方を取り入れる',alternate:'順番に希望をかなえる',separate:'別々に過ごしてあとで話す',discuss:'相談して決める'}}
  ];
  function validFact(f){const d=dimensions.find(d=>d.id===f?.dimension);return !!d&&Object.keys(f).sort().join(',')==='dimension,messageId,quote,values'&&Array.isArray(f.values)&&f.values.length>0&&f.values.length<=4&&new Set(f.values).size===f.values.length&&f.values.every(v=>Object.hasOwn(d.options,v))&&typeof f.messageId==='string'&&f.messageId.length>0&&f.messageId.length<=200&&typeof f.quote==='string'&&f.quote.trim().length>0&&f.quote.length<=120;}
  function compare(a=[],b=[]){
    const rows=dimensions.map(d=>{
      const left=a.find(f=>f.dimension===d.id),right=b.find(f=>f.dimension===d.id);
      if(!left||!right)return{...d,status:'unknown',similarity:null,left,right};
      const common=left.values.filter(v=>right.values.includes(v));
      const similarity=common.length/new Set([...left.values,...right.values]).size;
      return{...d,status:similarity===1?'shared':similarity===0?'different':'partial',similarity,left,right};
    });
    const known=rows.filter(r=>r.similarity!==null);
    return{rows,common:known.length,score:known.length===3?Math.round(known.reduce((n,r)=>n+r.similarity,0)/3*100):null};
  }
  function grounded(facts,messages){return Array.isArray(facts)&&facts.length<=3&&facts.every(validFact)&&new Set(facts.map(f=>f.dimension)).size===facts.length&&facts.every(f=>messages.some(m=>m.id===f.messageId&&m.text.includes(f.quote)));}
  root.KotonohaInsights={dimensions,validFact,compare,grounded};
})(globalThis);
