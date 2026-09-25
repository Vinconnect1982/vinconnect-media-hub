import {getChatGPTUser} from '../../chatgpt-auth';
import {isOwnerEmail,isSameOrigin,isArticleId,validateDraft} from '../../../lib/article-workflow';
import {articleDb} from '../../../lib/article-store';
import {jobDetails,photoList,mediaPath} from '../../../lib/install-content';
export const dynamic='force-dynamic';
const reply=(d:unknown,s=200)=>Response.json(d,{status:s,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user||!isOwnerEmail(user.email))return reply({error:'Owner sign-in required.'},403);
 if(!isSameOrigin(request.url,request.headers.get('origin')))return reply({error:'Invalid request origin.'},403);
 try{if(Number(request.headers.get('content-length'))>50000)return reply({error:'Draft too large.'},413);const raw=await request.text();if(raw.length>50000)return reply({error:'Draft too large.'},413);
 let data,job,photos,draft;try{data=JSON.parse(raw);if(!isArticleId(data.id))throw Error('Invalid draft.');draft=validateDraft(data);job=jobDetails(data.job);photos=photoList(data.photos);}catch(e){return reply({error:(e as Error).message},400);}
 const db=articleDb();for(const photo of photos){for(const [path,kind] of [[photo.source,'source'],[photo.rendered,'render']]){if(!mediaPath(path))continue;const asset=await db.prepare('SELECT id FROM media_assets WHERE path=? AND kind=?').bind(path,kind).first();if(!asset)return reply({error:'Upload all photos before saving.'},400);}}
 const old=await db.prepare('SELECT status,revision FROM articles WHERE id=?').bind(data.id).first<{status:string;revision:number}>();
 const values=[draft.title,draft.body,photos[0].rendered,JSON.stringify(photos),JSON.stringify(job),new Date().toISOString(),job.brand?.type||'Installations'];
 if(old){if(old.status==='published')return reply({error:'Unpublish the Hub article before changing it.'},409);if(old.revision!==data.revision)return reply({error:'This draft changed in another window. Reopen the latest version.'},409);
 const changed=await db.prepare("UPDATE articles SET title=?,body=?,image=?,media_json=?,job_json=?,updated_at=?,category=?,status='pending',approved_by=NULL,revision=revision+1 WHERE id=? AND revision=? AND status!='published'").bind(...values,data.id,data.revision).run();if(changed.meta.changes!==1)return reply({error:'Draft changed. Reopen it before saving.'},409);
 }else{if(!data.id.startsWith('vinconnect-install-')||data.revision!==null)return reply({error:'Draft not found or changed. Reload the Hub.'},409);
 const created=await db.prepare("INSERT OR IGNORE INTO articles(title,body,image,media_json,job_json,updated_at,category,id,status,revision) VALUES (?,?,?,?,?,?,?,?,'pending',0)").bind(...values,data.id).run();if(created.meta.changes!==1)return reply({error:'Draft already saved. Reload the Hub.'},409);}
 return reply({article:await db.prepare('SELECT * FROM articles WHERE id=?').bind(data.id).first()});
 }catch{return reply({error:'Could not save. Your text and photos remain in the editor.'},503);}
}
