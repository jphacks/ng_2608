import {build} from 'esbuild';
import {copyFile} from 'node:fs/promises';
await build({entryPoints:['worker/local-ai-worker.mjs'],outfile:'public/demo/local-ai-worker.js',bundle:true,format:'esm',platform:'browser',minify:true});
await copyFile('node_modules/@mlc-ai/web-llm/LICENSE','public/demo/webllm-LICENSE.txt');
