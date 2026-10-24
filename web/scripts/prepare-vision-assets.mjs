import {mkdir,copyFile,readdir,writeFile,stat} from 'node:fs/promises';
const root='public/demo/vision';await mkdir(root+'/ocr/core',{recursive:true});await mkdir(root+'/ocr/lang',{recursive:true});await mkdir(root+'/face/wasm',{recursive:true});
for(const n of ['tesseract.min.js','worker.min.js','tesseract.min.js.LICENSE.txt','worker.min.js.LICENSE.txt'])await copyFile('node_modules/tesseract.js/dist/'+n,root+'/ocr/'+n);
for(const n of await readdir('node_modules/tesseract.js-core'))if(n.endsWith('.wasm.js')||n==='LICENSE')await copyFile('node_modules/tesseract.js-core/'+n,root+'/ocr/core/'+n);
await copyFile('node_modules/@mediapipe/tasks-vision/vision_bundle.mjs',root+'/face/vision_bundle.mjs');for(const n of await readdir('node_modules/@mediapipe/tasks-vision/wasm'))await copyFile('node_modules/@mediapipe/tasks-vision/wasm/'+n,root+'/face/wasm/'+n);
for(const [url,file] of [
['https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz',root+'/ocr/lang/eng.traineddata.gz'],
['https://cdn.jsdelivr.net/npm/@tesseract.js-data/jpn@1.0.0/4.0.0_best_int/jpn.traineddata.gz',root+'/ocr/lang/jpn.traineddata.gz'],
['https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',root+'/face/face.tflite']]){try{await stat(file);continue}catch{}const r=await fetch(url);if(!r.ok)throw Error('Asset download failed '+r.status);await writeFile(file,new Uint8Array(await r.arrayBuffer()))}
console.log('Vision assets prepared for same-origin, device-local processing');
