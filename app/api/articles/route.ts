import {isArticleId} from '../../../lib/article-workflow';
import { getChatGPTUser } from "../../chatgpt-auth";
import { articleDb, seedArticles } from "../../../lib/article-store";
import { isOwnerEmail, isSameOrigin, validateAction, validateDraft } from "../../../lib/article-workflow";
export const dynamic="force-dynamic";
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET() {
  const user=await getChatGPTUser();
  if(!user) return response({error:"Sign in to view the Hub."},401);
  if(!isOwnerEmail(user.email)) return response({error:"This workspace is restricted to its owner."},403);
  try { await seedArticles(); const data=await articleDb().prepare("SELECT * FROM articles ORDER BY updated_at DESC,id").all(); return response({articles:data.results}); }
  catch(e) { console.error("Article load failed",e);return response({error:"Article storage is unavailable. Your drafts have not been lost. Retry shortly."},503); }
}
export async function POST(request:Request) {
  const user=await getChatGPTUser();
  if(!user) return response({error:"Sign in to continue."},401);
  if(!isOwnerEmail(user.email)) return response({error:"Only the workspace owner can change articles."},403);
  if(!isSameOrigin(request.url,request.headers.get("origin"))) return response({error:"Invalid request origin."},403);
  if(Number(request.headers.get("content-length")||0)>100000) return response({error:"Request too large."},413);
  let input;
  try {const raw=await request.text(); if(raw.length>100000)return response({error:"Request too large."},413); input=JSON.parse(raw);}
  catch {return response({error:"Invalid request."},400);}
  if(!input||typeof input.id!=="string"||!isArticleId(input.id))return response({error:"Invalid article."},400);
  try {
    const db=articleDb(); const article=await db.prepare("SELECT * FROM articles WHERE id=?").bind(input.id).first<{status:string;revision:number;title:string;body:string}>();
    if(!article)return response({error:"Article not found."},404);
    try {validateAction(article,input.action,input.revision);}catch(e){return response({error:(e as Error).message},409);}
    const now=new Date().toISOString(); let title=article.title,body=article.body;
    if(input.action==="save") {try {({title,body}=validateDraft(input));}catch(e){return response({error:(e as Error).message},400);}}
    const status=input.action==="approve"?"approved":input.action==="publish"?"published":"pending";
    if(input.action==="publish"&&input.channel!=="hub")return response({error:"This channel is not connected to the Hub. Open Connections to complete setup. Nothing was published."},422);
    const path=status==="published"?"/articles/"+input.id:null;
    const update=db.prepare("UPDATE articles SET title=?,body=?,status=?,revision=revision+1,updated_at=?,approved_by=?,published_url=?,published_at=? WHERE id=? AND revision=?").bind(title,body,status,now,status==="approved"||status==="published"?user.email:null,path,status==="published"?now:null,input.id,input.revision);
    const publicImages=db.prepare("UPDATE media_assets SET is_public=1 WHERE kind='render' AND EXISTS (SELECT 1 FROM articles a,json_each(COALESCE(a.media_json,'[]')) m WHERE a.id=? AND a.revision=? AND a.status='approved' AND json_extract(m.value,'$.rendered')=media_assets.path)").bind(input.id,input.revision+1);
    const result=input.action==="approve"?(await db.batch([update,publicImages]))[0]:await update.run();
    if(result.meta.changes!==1)return response({error:"Article changed in another window. Reload before continuing."},409);
    const updated=await db.prepare("SELECT * FROM articles WHERE id=?").bind(input.id).first(); return response({article:updated});
  } catch(e) {console.error("Article action failed",e);return response({error:"Could not save this change. Reload to check the latest status before retrying."},503);}
}
