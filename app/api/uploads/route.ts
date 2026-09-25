import {getChatGPTUser} from '../../chatgpt-auth';
import {isOwnerEmail,isSameOrigin} from '../../../lib/article-workflow';
import {articleDb} from '../../../lib/article-store';
import {mediaBucket} from '../../../lib/media-store';
import {jpegDimensions} from '../../../lib/install-content';
export const dynamic='force-dynamic';
const reply=(d:unknown,s=200)=>Response.json(d,{status:s,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user||!isOwnerEmail(user.email))return reply({error:'Owner sign-in required.'},403);
 if(!isSameOrigin(request.url,request.headers.get('origin')))return reply({error:'Invalid request origin.'},403);
 if(request.headers.get('content-type')!=='image/jpeg')return reply({error:'Upload a JPEG export.'},415);
 const kind=new URL(request.url).searchParams.get('kind');if(!['source','render'].includes(kind||''))return reply({error:'Invalid photo type.'},400);
 const limit=8*1024*1024;if(Number(request.headers.get('content-length'))>limit)return reply({error:'Photo must be under 8 MB.'},413);
 try{
  const reader=request.body?.getReader();if(!reader)return reply({error:'Photo missing.'},400);const chunks:Uint8Array[]=[];let size=0;
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>limit){await reader.cancel();return reply({error:'Photo must be under 8 MB.'},413);}chunks.push(part.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const dim=jpegDimensions(bytes);if(!dim||dim.width<1||dim.height<1||dim.width>5000||dim.height>5000)return reply({error:'This photo could not be validated.'},400);
  if(kind==='render'&&(dim.width!==1080||![720,1080,1350].includes(dim.height)))return reply({error:'Branded exports must be 1080 × 720, 1080 × 1080 or 1080 × 1350.'},400);
  const id=crypto.randomUUID(),path='/media/'+id+'.jpg',bucket=mediaBucket();await bucket.put(id,bytes,{httpMetadata:{contentType:'image/jpeg'}});
  try{await articleDb().prepare('INSERT INTO media_assets(id,kind,path,size,is_public,created_at) VALUES (?,?,?,?,0,?)').bind(id,kind,path,size,new Date().toISOString()).run();}catch(e){await bucket.delete(id);throw e;}
  return reply({path});
 }catch{return reply({error:'Photo upload failed. Your editor is still open; please retry.'},503);}
}
