import {isPagePermissionRejection,permissionHelp} from '../../../lib/publishing-errors';
import {getChatGPTUser} from '../../chatgpt-auth';
import {isOwnerEmail,isSameOrigin} from '../../../lib/article-workflow';
import {articleDb} from '../../../lib/article-store';
import {loadKey,saveKey,liveConnections} from '../../../lib/windsor';
export const dynamic='force-dynamic';
const reply=(d:unknown,s=200)=>Response.json(d,{status:s,headers:{'Cache-Control':'private, no-store'}});
async function checkedConnections(key:string){
 const connections=await liveConnections(key);
 return Promise.all(connections.map(async c=>{
  const last=await articleDb().prepare("SELECT status,receipt,updated_at FROM social_publications WHERE channel=? AND receipt IS NOT NULL ORDER BY updated_at DESC LIMIT 1").bind(c.channel).first<{status:string;receipt:string;updated_at:string}>();
  return {...c,...(last&&last.status!=='published'&&isPagePermissionRejection(last.receipt)?{publishingIssue:permissionHelp,publishingIssueAt:last.updated_at}:{})};
 }));
}
async function owner(){const u=await getChatGPTUser();return u&&isOwnerEmail(u.email);}
export async function GET(){
  if(!await owner())return reply({error:'Owner sign-in required.'},403);
  try {const key=await loadKey();if(!key)return reply({configured:false,connections:[],checkedAt:null});
    try{return reply({configured:true,connections:await checkedConnections(key),checkedAt:new Date().toISOString()});}catch(e){return reply({configured:true,connections:[],checkedAt:null,error:(e as Error).message});}
  }catch(e){return reply({error:(e as Error).message},503);}
}
export async function POST(request:Request){
  if(!await owner())return reply({error:'Owner sign-in required.'},403);
  if(!isSameOrigin(request.url,request.headers.get('origin')))return reply({error:'Invalid request origin.'},403);
  try {
    if(Number(request.headers.get('content-length')||0)>4096)return reply({error:'Request too large.'},413);
    const raw=await request.text();if(raw.length>4096)return reply({error:'Request too large.'},413);
    let data;try{data=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
    if(data.action==='disconnect'){await articleDb().prepare('DELETE FROM hub_secrets WHERE id=?').bind('windsor').run();return reply({configured:false,connections:[],checkedAt:null});}
    const key=typeof data.apiKey==='string'?data.apiKey.trim():'';
    if(key.length<8||key.length>1024||/\s/.test(key))return reply({error:'Enter a valid Windsor API key.'},400);
    await saveKey(key);
    try {
      const connections=await checkedConnections(key);
      return reply({configured:true,connections,checkedAt:new Date().toISOString(),saved:true,...(!connections.some(c=>c.connected)?{error:'Key saved, but the VINCONNECT accounts were not found. Check this key belongs to your Windsor team.'}:{})});
    }catch(e){return reply({configured:true,connections:[],checkedAt:null,saved:true,error:(e as Error).message});}
  }catch(e){return reply({error:(e as Error).message},503);}
}
