import {DatabaseSync} from 'node:sqlite';import {mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
await mkdir('.sites-runtime/local-photos',{recursive:true});
const sqlite=new DatabaseSync('.sites-runtime/community.sqlite');
const exists=sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='profiles'").get();
if(!exists)sqlite.exec(await readFile('drizzle/0000_pale_jetstream.sql','utf8'));
if(!sqlite.prepare('PRAGMA table_info(profiles)').all().some(c=>c.name==='preferences'))sqlite.exec(await readFile('drizzle/0001_open_patch.sql','utf8'));
function stmt(sql,args=[]){return{bind(...values){return stmt(sql,values)},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return{results:sqlite.prepare(sql).all(...args)}},async run(){return sqlite.prepare(sql).run(...args)}}}
const DB={prepare:sql=>stmt(sql),async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const photoPath=key=>'.sites-runtime/local-photos/'+Buffer.from(key).toString('hex');
const BUCKET={async put(key,data){await writeFile(photoPath(key),data)},async get(key){try{return{body:new Uint8Array(await readFile(photoPath(key)))}}catch{return null}},async delete(key){try{await unlink(photoPath(key))}catch{}}};
export {DB,BUCKET};
