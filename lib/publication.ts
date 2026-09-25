import {isPagePermissionRejection,PublishingPermissionError} from './publishing-errors';
export function providerPayload(result:any):any {
  if(result?.structuredContent)return result.structuredContent;
  const text=result?.content?.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('\n');
  if(!text)return result;
  try{return JSON.parse(text);}catch{return {result:text};}
}
export function safePostUrl(value:unknown,channel:string):string|null {
  if(typeof value!=='string')return null;
  try{const u=new URL(value);const host=u.hostname.toLowerCase();const allowed=channel==='instagram'?['instagram.com','www.instagram.com']:['facebook.com','www.facebook.com','m.facebook.com','fb.com'];
    if(u.protocol!=='https:'||!allowed.includes(host)||u.username||u.password||[...u.searchParams.keys()].some(k=>/^(access_token|token|api_key|key|authorization|code)$/i.test(k)))return null;
    return u.href;
  }catch{return null;}
}
export function publicationReceipt(payload:any,channel:string){
  let data=payload;
  if(typeof data?.result==='object')data=data.result;
  const text=typeof payload?.result==='string'?payload.result:JSON.stringify(payload);
  if(text&&isPagePermissionRejection(text))throw new PublishingPermissionError(text);
  if(payload?.success===false||data?.success===false||payload?.error||data?.error)throw Error(text||'Provider rejected publication.');
  if(!text||/\b(error|failed|denied|not published|unsuccessful|could not|cannot|unable to|permission missing)\b/i.test(text))throw Error(text||'Empty publishing response.');
  const candidateId=String(data?.post_id||data?.media_id||data?.id||text.match(/(?:post|media)\s*(?:id)?[\s:'"=]+(\d+(?:_\d+)?)/i)?.[1]||'');
  const id=/^[A-Za-z0-9_-]{1,100}$/.test(candidateId)?candidateId:'';
  if(!id&&!/\b(published|created|successfully|success)\b/i.test(text))throw Error('Publication outcome unknown. Check the platform before trying again.');
  const urls=[data?.permalink,data?.post_url,data?.url,...(text.match(/https:\/\/[^\s"<>]+/g)||[])];
  const url=urls.map(u=>safePostUrl(u,channel)).find(Boolean)||(channel==='facebook_organic'&&/^\d+(?:_\d+)?$/.test(id)?`https://www.facebook.com/${id}`:null);
  return {receipt:text,providerId:id||null,postUrl:url};
}
