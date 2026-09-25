import {isPagePermissionRejection,PublishingPermissionError} from './publishing-errors';
import { hubEnv } from './hub-env';
import { articleDb } from './article-store';

export const destinations = {
  facebook_organic: { name: 'Facebook', account: '1053341001203753', action: 'create_photo_post' },
  instagram: { name: 'Instagram', account: '17841427011293034', action: 'create_image_post' },
} as const;
export type Channel = keyof typeof destinations;
const encode=(b:Uint8Array)=>btoa(String.fromCharCode(...b));
const decode=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function encryptionKey() {
  const secret=hubEnv('HUB_ENCRYPTION_KEY');
  if(!secret)throw Error('Secure storage is not configured. Contact the Hub administrator.');
  return crypto.subtle.importKey('raw',decode(secret),{name:'AES-GCM'},false,['encrypt','decrypt']);
}
export async function saveKey(value:string) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('vinconnect-windsor')},await encryptionKey(),new TextEncoder().encode(value));
  await articleDb().prepare('INSERT INTO hub_secrets (id,ciphertext,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET ciphertext=excluded.ciphertext,updated_at=excluded.updated_at').bind('windsor',encode(iv)+'.'+encode(new Uint8Array(data)),new Date().toISOString()).run();
}
export async function loadKey() {
  const row=await articleDb().prepare('SELECT ciphertext FROM hub_secrets WHERE id=?').bind('windsor').first<{ciphertext:string}>();
  if(!row)return null;
  const [iv,data]=row.ciphertext.split('.');
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(iv),additionalData:new TextEncoder().encode('vinconnect-windsor')},await encryptionKey(),decode(data)));
}
// Discover through Windsor's documented MCP interface, using the same tool
// contract as the connected ChatGPT app. Never infer accounts from ds-accounts.
export async function windsorTool(key:string,name:string,args:Record<string,unknown>) {
  const signal=AbortSignal.timeout(name==='execute_action'?60000:20000);
  let session:string|null=null;
  let protocol='2025-03-26';
  async function rpc(method:string,params:unknown,id?:number) {
    const r=await fetch('https://mcp.windsor.ai/',{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+key,Accept:'application/json, text/event-stream','Content-Type':'application/json','MCP-Protocol-Version':protocol,...(session?{'Mcp-Session-Id':session}:{})},body:JSON.stringify({jsonrpc:'2.0',...(id!==undefined?{id}:{}),method,params}),signal});
    if(!r.ok){const detail=redactProvider((await r.text()).slice(0,3000),key);throw Error(`Windsor request failed (${r.status}). ${detail||'Check the saved key and account permissions.'}`);}
    session=r.headers.get('Mcp-Session-Id')||session;
    if(id===undefined){await r.body?.cancel();return null;}
    let message:any;
    if(r.headers.get('content-type')?.includes('text/event-stream')){
      const reader=r.body?.getReader();if(!reader)throw Error('Empty Windsor discovery response.');
      const decoder=new TextDecoder();let buffer='';
      try{while(!message){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');if(buffer.length>2000000)throw Error('Windsor discovery response too large.');let end;while((end=buffer.indexOf('\n\n'))>=0){const event=buffer.slice(0,end);buffer=buffer.slice(end+2);const data=event.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(data){const candidate=JSON.parse(data);if(candidate.id===id)message=candidate;}}}}finally{await reader.cancel();}
    }else{message=await r.json();}
    if(!message||message.id!==id)throw Error('Windsor returned an invalid response.');
    if(message.error)throw Error(redactProvider(JSON.stringify(message.error),key));
    return message.result;
  }
  const init=await rpc('initialize',{protocolVersion:protocol,capabilities:{},clientInfo:{name:'VINCONNECT Media Hub',version:'1.0.0'}},1);
  if(init?.protocolVersion)protocol=init.protocolVersion;
  await rpc('notifications/initialized',{});
  const result=await rpc('tools/call',{name,arguments:args},2);
  if(result?.isError){const detail=redactProvider(result.content?.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join(' ')||'Windsor rejected the request.',key);if(name==='execute_action'&&isPagePermissionRejection(detail))throw new PublishingPermissionError(detail);throw Error(detail);}
  return result;
}
export function redactProvider(text:string,key:string){return (key?text.split(key).join('[redacted]').split(encodeURIComponent(key)).join('[redacted]'):text).replace(/Bearer\s+[^\s"']+/gi,'Bearer [redacted]').slice(0,8000);}
export async function discoverConnectors(key:string){
  const result=await windsorTool(key,'get_connectors',{include_actions:true,include_options:false,include_not_yet_connected:false});
  let data=result?.structuredContent?.result;
  if(!data){const block=result?.content?.find((c:any)=>c.type==='text');if(block){try{data=JSON.parse(block.text);}catch{throw Error('Unreadable Windsor account list.');}}}
  if(!Array.isArray(data))throw Error('Unexpected Windsor connector list.');
  return data;
}
export async function liveConnections(key:string) {
  let data:any[];
  try{data=await discoverConnectors(key);}catch(e){
    const detail=(e instanceof Error?e.message:'Request failed').split(key).join('[redacted]').replace(/https?:\/\/[^\s]+/g,'[URL]').slice(0,300);
    console.error('Windsor discovery failure',{detail});
    throw Error(detail);
  }
  return Object.entries(destinations).map(([channel,d])=>{
    const connector=data.find(c=>c.id===channel);
    const account=connector?.accounts?.find((a:any)=>String(a.id)===d.account);
    return {channel,name:d.name,account:d.account,accountName:account?.name||d.name,connected:!!account,actionAvailable:!!account&&Array.isArray(connector.actions)&&connector.actions.some((a:any)=>(typeof a==='string'?a:a.id)===d.action)};
  });
}
