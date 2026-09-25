import { env } from 'cloudflare:workers';
import { articleDb } from '@/lib/article-store';
export async function GET(request:Request) {
 const headers={'Cache-Control':'private, no-store'};
 if(!env.MEDIA_BRIDGE_KEY||request.headers.get('x-vinconnect-bridge')!==env.MEDIA_BRIDGE_KEY)return Response.json({error:'Access denied'},{status:403,headers});
 try {
  const data=await articleDb().prepare("SELECT id,title,body,category,image,status,job_json FROM articles WHERE status IN ('approved','published') ORDER BY updated_at DESC LIMIT 100").all();
  return Response.json({articles:data.results},{headers});
 }catch{return Response.json({error:'Media unavailable'},{status:503,headers});}
}
