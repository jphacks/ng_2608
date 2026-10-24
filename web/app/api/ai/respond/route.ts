import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../../chatgpt-auth';
import { handleAI } from '../../../../lib/ai/gateway.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){const user=await getChatGPTUser();const e=env as unknown as Record<string,string>;return handleAI(request,{userId:user?.userId,apiKey:e.OPENAI_API_KEY,model:e.OPENAI_MODEL,db:env.DB})}
