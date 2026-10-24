import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../../chatgpt-auth';
export const dynamic='force-dynamic';
export async function GET(){const user=await getChatGPTUser();const e=env as unknown as Record<string,string>;return Response.json({available:!!user&&!!e.OPENAI_API_KEY&&!!e.OPENAI_MODEL,provider:'OpenAI',reason:!user?'AUTH_REQUIRED':!e.OPENAI_API_KEY||!e.OPENAI_MODEL?'AI_NOT_CONFIGURED':null},{headers:{'Cache-Control':'no-store'}})}
