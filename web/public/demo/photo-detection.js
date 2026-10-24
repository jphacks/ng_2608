(function(root){
let ocrPromise,facePromise;
const base='/demo/vision/';
function script(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
function ocr(){if(!ocrPromise)ocrPromise=(async()=>{await script(base+'ocr/tesseract.min.js');const w=await Tesseract.createWorker(['jpn','eng'],1,{workerPath:base+'ocr/worker.min.js',workerBlobURL:false,corePath:base+'ocr/core',langPath:base+'ocr/lang',cacheMethod:'none',logger:()=>{}});await w.setParameters({tessedit_pageseg_mode:11});return w})().catch(e=>{ocrPromise=null;throw e});return ocrPromise}
function faces(){if(!facePromise)facePromise=(async()=>{const v=await import(base+'face/vision_bundle.mjs');const files=await v.FilesetResolver.forVisionTasks(base+'face/wasm');return v.FaceDetector.createFromOptions(files,{baseOptions:{modelAssetPath:base+'face/face.tflite',delegate:'CPU'},runningMode:'IMAGE',minDetectionConfidence:.5})})().catch(e=>{facePromise=null;throw e});return facePromise}
async function detect(canvas){const boxes=[],failures=[];let faceBoxes=[];try{const result=await(await faces()).detect(canvas);faceBoxes=(result.detections||[]).map((d,i)=>({id:'face-'+i,kind:'face',label:'顔の候補 '+(i+1),x:d.boundingBox.originX,y:d.boundingBox.originY,w:d.boundingBox.width,h:d.boundingBox.height,enabled:true}));faceBoxes.sort((a,b)=>b.w*b.h-a.w*a.h);if(faceBoxes[0])faceBoxes[0].enabled=false;boxes.push(...faceBoxes)}catch{failures.push('顔の検出')}
try{const result=await(await ocr()).recognize(canvas,{}, {text:false,blocks:true});let i=0;for(const block of result.data.blocks||[])for(const para of block.paragraphs||[])for(const line of para.lines||[]){if((line.confidence??0)<25||!line.text?.trim())continue;const b=line.bbox;boxes.push({id:'text-'+i++,kind:'text',label:'文字の候補 '+i,x:b.x0-6,y:b.y0-5,w:b.x1-b.x0+12,h:b.y1-b.y0+10,enabled:true})}}catch{failures.push('文字の検出')}
return{boxes,failures,faces:faceBoxes.length}}
root.KotonohaPhotoDetection={detect};
})(globalThis);
