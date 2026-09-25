import {isArticleId} from '../../../../lib/article-workflow';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {isOwnerEmail,isSameOrigin} from '../../../../lib/article-workflow';
import {articleDb} from '../../../../lib/article-store';
export const dynamic='force-dynamic';
const reply=(d:unknown,s=200)=>Response.json(d,{status:s,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request){
 const u=await getChatGPTUser();if(!u||!isOwnerEmail(u.email)||!isSameOrigin(request.url,request.headers.get('origin')))return reply({error:'Owner sign-in required.'},403);
 try{const raw=await request.text();if(raw.length>4096)return reply({error:'Request too large.'},413);let input;try{input=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if(!isArticleId(input?.id))return reply({error:'Invalid article.'},400);
 const db=articleDb(),a=await db.prepare('SELECT * FROM articles WHERE id=?').bind(input.id).first<{title:string;body:string;image:string;category:string;revision:number;status:string;media_json:string|null;job_json:string|null}>();
 if(!a)return reply({error:'Article not found.'},404);
 if(input.revision!==a.revision)return reply({error:'Article changed. Refresh first.'},409);
 if(input.action==='duplicate'){
  const ids=await db.prepare('SELECT id FROM articles').all<{id:string}>();const used=new Set(ids.results.map(x=>x.id));
  for(let n=1;n<=99;n++){const id='vinconnect-article-'+String(n).padStart(2,'0');if(used.has(id))continue;
   const r=await db.prepare("INSERT OR IGNORE INTO articles (id,title,body,category,image,status,revision,updated_at,media_json,job_json) VALUES (?,?,?,?,?,'pending',0,?,?,?)").bind(id,a.title,a.body,a.category,a.image,new Date().toISOString(),a.media_json||null,a.job_json||null).run();
   if(r.meta.changes===1)return reply({article:await db.prepare('SELECT * FROM articles WHERE id=?').bind(id).first()});
  }return reply({error:'The current workspace limit of 99 articles has been reached.'},409);
 }
 if(input.action==='unpublish'&&a.status==='published'){
  const r=await db.prepare("UPDATE articles SET status='pending',revision=revision+1,approved_by=NULL,published_url=NULL,published_at=NULL,updated_at=? WHERE id=? AND revision=?").bind(new Date().toISOString(),input.id,input.revision).run();
  if(r.meta.changes!==1)return reply({error:'Article changed. Refresh first.'},409);return reply({saved:true});
 }return reply({error:'Unsupported article action.'},400);
 }catch{return reply({error:'Could not update the article.'},503);}
}
