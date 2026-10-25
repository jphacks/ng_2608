const backgrounds=[{name:'アイボリー',css:'#f5f0e8',colors:['#f5f0e8']},{name:'ピンク',css:'#fae5ee',colors:['#fae5ee']},{name:'セージ',css:'#e3ebe1',colors:['#e3ebe1']},{name:'空色',css:'linear-gradient(135deg,#e3edfa,#f6e8ee)',colors:['#e3edfa','#f6e8ee']},{name:'水玉',css:'radial-gradient(#cab9bf 2px,transparent 2px) 0 0/16px 16px #f8f1f3',colors:['#f8f1f3'],dots:true}];
const $=q=>document.querySelector(q);
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
let segmenterPromise;
async function segmenter(){if(!segmenterPromise)segmenterPromise=(async()=>{const v=await import('/demo/vision/face/vision_bundle.mjs');const files=await v.FilesetResolver.forVisionTasks('/demo/vision/face/wasm');return v.ImageSegmenter.createFromOptions(files,{baseOptions:{modelAssetPath:'/demo/vision/face/selfie.tflite',delegate:'CPU'},runningMode:'IMAGE',outputCategoryMask:false,outputConfidenceMasks:true});})().catch(e=>{segmenterPromise=null;throw e;});return segmenterPromise;}
export class BackgroundPhoto{
 static backgrounds=backgrounds;
 constructor({notify,save}){this.notify=notify;this.save=save;this.generation=0;this.mode='erase';this.background=0;this.undo=[];this.ready=false;this.busy=false;this.zoom=1;this.size=25;}
 clear(){this.generation++;this.source=null;this.mask=null;this.initial=null;this.undo=[];this.ready=false;this.busy=false;}
 bind(){
  if(!$('#photoFile'))return;$('#photoFile').onchange=()=>this.load($('#photoFile').files[0]);
  const view=$('#photoCanvas');view.onpointerdown=e=>{if(!this.ready||this.busy)return;e.preventDefault();view.setPointerCapture(e.pointerId);this.snapshot();this.last=this.point(e);this.stroke(this.last,this.last);};
  view.onpointermove=e=>{if(!this.last)return;const next=this.point(e);this.stroke(this.last,next);this.last=next;};view.onpointerup=view.onpointercancel=()=>this.last=null;
  document.querySelectorAll('[data-photo-brush]').forEach(b=>b.onclick=()=>{this.mode=b.dataset.photoBrush;this.show();});
  $('#photoUndo').onclick=()=>{if(!this.undo.length)return;this.mask.getContext('2d').putImageData(this.undo.pop(),0,0);this.invalidate();this.show();};
  $('#photoReset').onclick=()=>{if(!this.ready)return;this.snapshot();this.mask.getContext('2d').putImageData(this.initial,0,0);this.invalidate();this.show();};
  $('#photoBrushSize').value=this.size;$('#photoBrushSize').oninput=e=>this.size=Number(e.target.value);
  $('#photoZoom').value=this.zoom;$('#photoZoom').oninput=e=>{this.zoom=Number(e.target.value);this.show();};
  document.querySelectorAll('[data-photo-background]').forEach(b=>b.onclick=()=>{this.background=Number(b.dataset.photoBackground);this.invalidate();this.show();});
  $('#photoConfirm').onchange=()=>this.show();
  $('#savePhoto').onclick=async()=>{if(!this.ready||this.busy||!$('#photoConfirm').checked)return;this.busy=true;this.show();try{await this.save(await this.export());this.notify('加工済みの画像を保存しました。');}catch(e){this.notify(e.message);}finally{this.busy=false;this.show();}};
  $('#photoDownload').onclick=async()=>{try{const url=URL.createObjectURL(await this.export());const a=document.createElement('a');a.href=url;a.download='kotonoha-background.jpg';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(e){this.notify(e.message);}};
  this.show();
 }
 invalidate(){if($('#photoConfirm'))$('#photoConfirm').checked=false;}
 status(text){this.statusText=text;if($('#photoInfo'))$('#photoInfo').textContent=text;}
 async load(file){
  if(!file)return;this.clear();const generation=this.generation;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15000000){this.notify('JPEG・PNG・WebPの15MB以下の画像を選んでください。');return;}
  this.busy=true;this.show();this.status('人物と背景を端末内で分離しています…');
  try{
   const image=await createImageBitmap(file);if(image.width*image.height>30000000){image.close();throw Error('画像が大きすぎます。小さくして選び直してください。');}
   const scale=Math.min(1,1280/Math.max(image.width,image.height));const source=canvas(Math.round(image.width*scale),Math.round(image.height*scale));source.getContext('2d').drawImage(image,0,0,source.width,source.height);image.close();
   const model=await segmenter();if(generation!==this.generation)return;
   const mask=canvas(source.width,source.height);
   let coverage=0;
   model.segment(source,result=>{const confidence=result.confidenceMasks?.[0];if(!confidence)throw Error('人物の範囲を取得できませんでした。');const data=confidence.getAsFloat32Array();const small=canvas(confidence.width,confidence.height),pixels=small.getContext('2d').createImageData(small.width,small.height);for(let i=0;i<data.length;i++){const alpha=Math.round(Math.max(0,Math.min(1,(data[i]-.25)/.5))*255);pixels.data.set([255,255,255,alpha],i*4);coverage+=alpha/255;}coverage/=data.length;small.getContext('2d').putImageData(pixels,0,0);mask.getContext('2d').drawImage(small,0,0,mask.width,mask.height);});
   if(coverage<.01||coverage>.99)throw Error('人物と背景をうまく分けられませんでした。別の写真を選んでください。');
   const detection=await globalThis.KotonohaPhotoDetection.detect(source);if(generation!==this.generation)return;
   if(detection.faces>1)throw Error('複数の顔が見つかりました。一人で写った写真を選び直してください。');
   if(detection.failures.includes('顔の検出'))throw Error('人数の確認に失敗しました。写真を選び直してください。');
   this.source=source;this.mask=mask;this.initial=mask.getContext('2d').getImageData(0,0,mask.width,mask.height);this.ready=true;this.undo=[];this.zoom=1;this.invalidate();
   this.status('背景を変更しました。髪・服・残った背景を確認し、消す／戻すで調整できます。'+(detection.boxes.some(b=>b.kind==='text')?'写真に文字の候補があります。人物側の名札なども確認してください。':'')+(detection.failures.length?'文字の自動確認は未完了です。写真全体を確認してください。':''));
  }catch(e){if(generation===this.generation){this.ready=false;this.status(e.message||'写真の処理に失敗しました。');}}
  finally{if(generation===this.generation){this.busy=false;this.show();}}
 }
 snapshot(){this.undo.push(this.mask.getContext('2d').getImageData(0,0,this.mask.width,this.mask.height));if(this.undo.length>10)this.undo.shift();}
 point(e){const r=$('#photoCanvas').getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*this.source.width,y:(e.clientY-r.top)/r.height*this.source.height};}
 stroke(a,b){const ctx=this.mask.getContext('2d');ctx.globalCompositeOperation=this.mode==='erase'?'destination-out':'source-over';ctx.strokeStyle='white';ctx.fillStyle='white';ctx.lineWidth=this.size;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,this.size/2,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';this.invalidate();this.show();}
 composite(){const output=canvas(this.source.width,this.source.height),ctx=output.getContext('2d'),bg=backgrounds[this.background];let fill=bg.colors[0];if(bg.colors.length>1){fill=ctx.createLinearGradient(0,0,output.width,output.height);fill.addColorStop(0,bg.colors[0]);fill.addColorStop(1,bg.colors[1]);}ctx.fillStyle=fill;ctx.fillRect(0,0,output.width,output.height);if(bg.dots){ctx.fillStyle='#d3c4cb';for(let x=0;x<output.width;x+=30)for(let y=0;y<output.height;y+=30){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}}const person=canvas(output.width,output.height),pc=person.getContext('2d');pc.drawImage(this.source,0,0);pc.globalCompositeOperation='destination-in';pc.drawImage(this.mask,0,0);ctx.drawImage(person,0,0);return output;}
 show(){const view=$('#photoCanvas');if(!view)return;$('#savePhoto').disabled=!this.ready||this.busy||!$('#photoConfirm').checked;$('#photoDownload').disabled=!this.ready||this.busy;$('#photoUndo').disabled=!this.ready||!this.undo.length||this.busy;document.querySelectorAll('[data-photo-brush]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.photoBrush===this.mode)));document.querySelectorAll('[data-photo-background]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.photoBackground)===this.background)));if(this.statusText)this.status(this.statusText);view.hidden=!this.ready;if(!this.ready)return;const output=this.composite();view.width=output.width;view.height=output.height;view.getContext('2d').drawImage(output,0,0);view.style.width=this.zoom*100+'%';view.style.maxWidth='none';view.style.height='auto';}
 async export(){if(!this.ready||this.busy&& !this.source)throw Error('写真が未準備です。');const blob=await new Promise(resolve=>this.composite().toBlob(resolve,'image/jpeg',.88));if(!blob||blob.size>3000000)throw Error('加工後の画像が大きすぎます。小さい写真を選んでください。');return blob;}
}
