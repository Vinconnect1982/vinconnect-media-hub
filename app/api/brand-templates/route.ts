import {getChatGPTUser} from '../../chatgpt-auth';
import {isOwnerEmail,isSameOrigin} from '../../../lib/article-workflow';
import {articleDb} from '../../../lib/article-store';
import {brandTemplate} from '../../../lib/brand-templates';
export const dynamic='force-dynamic';
const reply=(d:unknown,s=200)=>Response.json(d,{status:s,headers:{'Cache-Control':'private, no-store'}});
async function owner(){const user=await getChatGPTUser();return user&&isOwnerEmail(user.email);}
export async function GET(){if(!await owner())return reply({error:'Owner sign-in required.'},403);try{const rows=await articleDb().prepare('SELECT * FROM brand_templates ORDER BY updated_at DESC').all<{id:string;name:string;settings_json:string;updated_at:string}>();return reply({templates:rows.results.map(r=>({id:r.id,name:r.name,updatedAt:r.updated_at,settings:brandTemplate(JSON.parse(r.settings_json))}))});}catch{return reply({error:'Saved templates could not be loaded. Please retry.'},503);}}
export async function POST(request:Request){
 if(!await owner()||!isSameOrigin(request.url,request.headers.get('origin')))return reply({error:'Owner sign-in required.'},403);
 try{const raw=await request.text();if(raw.length>4000)return reply({error:'Template too large.'},413);let name,settings;try{const data=JSON.parse(raw);name=typeof data.name==='string'?data.name.trim():'';if(!name||name.length>60)throw Error('Name your template using up to 60 characters.');settings=brandTemplate(data.settings);}catch(e){return reply({error:(e as Error).message},400);}
 const id=crypto.randomUUID(),updatedAt=new Date().toISOString();await articleDb().prepare('INSERT INTO brand_templates(id,name,settings_json,updated_at) VALUES (?,?,?,?)').bind(id,name,JSON.stringify(settings),updatedAt).run();return reply({template:{id,name,settings,updatedAt}});
 }catch{return reply({error:'Template was not saved. Your settings remain in the editor.'},503);}
}
export async function PATCH(request:Request){return change(request,false);}
export async function DELETE(request:Request){return change(request,true);}
async function change(request:Request,remove:boolean){
 if(!await owner()||!isSameOrigin(request.url,request.headers.get('origin')))return reply({error:'Owner sign-in required.'},403);
 try{const raw=await request.text();if(raw.length>6000)return reply({error:'Template too large.'},413);let d;try{d=JSON.parse(raw);if(typeof d.id!=='string'||!/^[0-9a-f-]{36}$/.test(d.id)||typeof d.updatedAt!=='string')throw Error('Reload the template before changing it.');if(!remove){d.settings=brandTemplate(d.settings);if(typeof d.name!=='string'||!d.name.trim()||d.name.length>60)throw Error('Enter a template name.');}}catch(e){return reply({error:(e as Error).message},400);}
 const db=articleDb(),now=new Date(Math.max(Date.now(),(Date.parse(d.updatedAt)||0)+1)).toISOString();const result=remove?await db.prepare('DELETE FROM brand_templates WHERE id=? AND updated_at=?').bind(d.id,d.updatedAt).run():await db.prepare('UPDATE brand_templates SET name=?,settings_json=?,updated_at=? WHERE id=? AND updated_at=?').bind(d.name.trim(),JSON.stringify(d.settings),now,d.id,d.updatedAt).run();
 if(result.meta.changes!==1)return reply({error:'This template changed or was deleted. Refresh the gallery.'},409);
 return reply(remove?{deleted:true}:{template:{id:d.id,name:d.name.trim(),settings:d.settings,updatedAt:now}});
 }catch{return reply({error:'Could not change the template. Your edits are still here.'},503);}
}
