import {getChatGPTUser} from '../../chatgpt-auth';
import {isOwnerEmail} from '../../../lib/article-workflow';
import {articleDb} from '../../../lib/article-store';
import {mediaBucket} from '../../../lib/media-store';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id:file}=await params;if(!/^[0-9a-f-]{36}\.jpg$/.test(file))return new Response('Not found',{status:404});
 try{const row=await articleDb().prepare('SELECT id,kind,is_public FROM media_assets WHERE id=?').bind(file.slice(0,-4)).first<{id:string;kind:string;is_public:number}>();
 if(!row)return new Response('Not found',{status:404});const publicExport=row.kind==='render'&&row.is_public===1;
 if(!publicExport){const user=await getChatGPTUser();if(!user||!isOwnerEmail(user.email))return new Response('Not found',{status:404});}
 const object=await mediaBucket().get(row.id);if(!object)return new Response('Not found',{status:404});
 const body=object.body.buffer.slice(object.body.byteOffset, object.body.byteOffset+object.body.byteLength) as ArrayBuffer;
 return new Response(body,{headers:{'Content-Type':'image/jpeg','X-Content-Type-Options':'nosniff','Cache-Control':publicExport?'public, max-age=31536000, immutable':'private, no-store'}});
 }catch{return new Response('Photo unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
