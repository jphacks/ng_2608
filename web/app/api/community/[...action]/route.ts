import {env} from 'cloudflare:workers';import {getChatGPTUser} from '../../../chatgpt-auth';import {handleCommunity} from '../../../../lib/community.mjs';
export const dynamic='force-dynamic';
async function handle(request:Request,{params}:{params:Promise<{action:string[]}>}){const user=await getChatGPTUser();const p=await params;return handleCommunity(request,env,user?.userId,p.action.join('/'))}
export const GET=handle;export const POST=handle;export const PUT=handle;export const DELETE=handle;
