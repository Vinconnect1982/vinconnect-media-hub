import {photoList,mediaPath} from '../../../lib/install-content';
import {isArticleId} from '../../../lib/article-workflow';
import {isPagePermissionRejection,PublishingPermissionError,permissionHelp} from '../../../lib/publishing-errors';
import {getChatGPTUser} from '../../chatgpt-auth';
import {isOwnerEmail,isSameOrigin} from '../../../lib/article-workflow';
import {articleDb} from '../../../lib/article-store';
import {destinations,loadKey,liveConnections,windsorTool,redactProvider,type Channel} from '../../../lib/windsor';
import {providerPayload,publicationReceipt,safePostUrl} from '../../../lib/publication';
export const dynamic='force-dynamic';
const reply=(d:unknown,s=200)=>Response.json(d,{status:s,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){
  const user=await getChatGPTUser();if(!user||!isOwnerEmail(user.email))return reply({error:'Owner sign-in required.'},403);
  try{return reply({publications:(await articleDb().prepare('SELECT p.*,a.title FROM social_publications p LEFT JOIN articles a ON a.id=p.article_id ORDER BY p.updated_at DESC').all()).results});}
  catch{return reply({error:'Publishing history unavailable.'},503);}
}
export async function POST(request:Request){
  const user=await getChatGPTUser();if(!user||!isOwnerEmail(user.email))return reply({error:'Owner sign-in required.'},403);
  if(!isSameOrigin(request.url,request.headers.get('origin')))return reply({error:'Invalid request origin.'},403);
  let locked:string|undefined;let usedKey="";
  try {
    if(Number(request.headers.get('content-length')||0)>4096)return reply({error:'Request too large.'},413);
    const raw=await request.text();if(raw.length>4096)return reply({error:'Request too large.'},413);
    let input;try{input=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
    if(!input||!Object.hasOwn(destinations,input.channel)||!isArticleId(input.id)||!Number.isInteger(input.revision))return reply({error:'Invalid destination or article.'},400);
    const channel=input.channel as Channel,destination=destinations[channel],db=articleDb();
    const a=await db.prepare('SELECT * FROM articles WHERE id=?').bind(input.id).first<{title:string;body:string;image:string;status:string;revision:number;media_json:string|null}>();
    if(!a||!['approved','published'].includes(a.status)||a.revision!==input.revision)return reply({error:'Reload and approve the latest article before publishing.'},409);
    const caption=a.title+'\n\n'+a.body;
    if(channel==='instagram'&&caption.length>2200)return reply({error:'Instagram allows 2,200 characters. Shorten this article and approve it again first.'},400);
    if(!mediaPath(a.image)&&!/^\/assets\/articles\/article-\d+\.png$/.test(a.image))return reply({error:'This image needs a social publishing export.'},400);
    const photos=a.media_json?photoList(a.media_json):null;
    const imagePaths=photos?photos.map(p=>p.rendered):[a.image.replace(/\.png$/,'.jpg')];
    for(const path of imagePaths){if(mediaPath(path)&&!await db.prepare("SELECT id FROM media_assets WHERE path=? AND kind='render' AND is_public=1").bind(path).first())return reply({error:'Approve the branded photos before publishing.'},409);}
    const targetAction=channel==='instagram'&&imagePaths.length>1?'create_carousel_post':destination.action;
    const key=await loadKey();usedKey=key||"";if(!key)return reply({error:'Connect Windsor in Connections first.'},409);
    const connections=await liveConnections(key),connection=connections.find(c=>c.channel===channel);
    if(!connection?.connected||!connection.actionAvailable)return reply({error:'The destination or photo publishing action is unavailable in Windsor.'},409);
    if(input.attemptId!==undefined&&(typeof input.attemptId!=='string'||!/^[-a-z0-9]{16,64}$/.test(input.attemptId)))return reply({error:'Invalid publishing request identifier.'},400);
    // Repair only historical explicit permission denials, never uncertain timeouts.
    const rejected=await db.prepare("SELECT id,receipt FROM social_publications WHERE article_id=? AND channel=? AND status='needs_review' AND provider_id IS NULL").bind(input.id,channel).all<{id:string;receipt:string}>();
    for(const row of rejected.results){if(isPagePermissionRejection(row.receipt||''))await db.prepare("UPDATE social_publications SET status='failed' WHERE id=? AND status='needs_review' AND receipt=? AND provider_id IS NULL").bind(row.id,row.receipt).run();}
    const prior=await db.prepare("SELECT id,status FROM social_publications WHERE article_id=? AND channel=? AND status IN ('sending','needs_review') LIMIT 1").bind(input.id,channel).first();
    if(prior)return reply({code:'OUTCOME_UNKNOWN',attempt:prior,error:'A previous attempt needs review. Check the platform, then resolve it in publishing history before sending again.'},409);
    const published=await db.prepare("SELECT id FROM social_publications WHERE article_id=? AND channel=? AND status='published' LIMIT 1").bind(input.id,channel).first();
    if(published&&input.repost!==true)return reply({error:'Already published here. Select the explicit repost option to send a new copy.'},409);
    const schemas=providerPayload(await windsorTool(key,'list_actions',{connector:channel}));
    const actions=Array.isArray(schemas)?schemas:schemas?.result;
    const schema=actions?.find((x:any)=>x.id===targetAction)?.schema;
    if(!(targetAction==='create_carousel_post'?schema?.properties?.image_urls:schema?.properties?.image_url)||!schema.properties.caption)return reply({error:'Windsor photo action format changed. Nothing was sent.'},409);
    const id=input.id+':'+channel+(input.attemptId?':'+input.attemptId:''),now=new Date().toISOString();
    const image_urls=imagePaths.map(path=>'https://vinconnect-media.fgymjki.chatgpt.site'+path);
    const image_url=image_urls[0];
    const lock=await db.prepare("INSERT OR IGNORE INTO social_publications (id,article_id,channel,status,updated_at,caption,image_url,revision) SELECT ?,?,?, 'sending',?,?,?,? FROM articles WHERE id=? AND revision=? AND status IN ('approved','published') AND NOT EXISTS (SELECT 1 FROM social_publications WHERE article_id=? AND channel=? AND status IN ('sending','needs_review')) AND (?=1 OR NOT EXISTS (SELECT 1 FROM social_publications WHERE article_id=? AND channel=? AND status='published'))").bind(id,input.id,channel,now,caption,image_url,input.revision,input.id,input.revision,input.id,channel,input.repost===true?1:0,input.id,channel).run();
    if(lock.meta.changes!==1)return reply({error:'This request is already recorded, or the article changed. Refresh publishing history.'},409);
    locked=id;
    const result=await windsorTool(key,'execute_action',{connector:channel,account:destination.account,action:targetAction,params:targetAction==='create_carousel_post'?{image_urls,caption}:{image_url,caption}});
    const receipt=publicationReceipt(providerPayload(result),channel);
    const safeReceipt=redactProvider(receipt.receipt,key);
    const saved=await db.prepare("UPDATE social_publications SET status='published',receipt=?,post_url=?,provider_id=?,updated_at=? WHERE id=? AND status='sending'").bind(safeReceipt,receipt.postUrl,receipt.providerId,new Date().toISOString(),id).run();
    if(saved.meta.changes!==1)return reply({error:'The provider reported publication, but history changed before confirmation. Check the platform and refresh history.',code:'OUTCOME_UNKNOWN'},409);
    return reply({status:'published',receipt:safeReceipt,postUrl:receipt.postUrl,providerId:receipt.providerId});
  }catch(e){
    const permission=e instanceof PublishingPermissionError;
    const detail=redactProvider((e as Error).message||'Publication unavailable.',usedKey);
    if(locked){try{await articleDb().prepare("UPDATE social_publications SET status=?,receipt=?,updated_at=? WHERE id=? AND status='sending'").bind(permission?'failed':'needs_review',detail,new Date().toISOString(),locked).run();}catch{}}
    return reply({code:permission?'FACEBOOK_PERMISSION_DENIED':'PUBLICATION_ERROR',error:permission?permissionHelp:detail,details:permission?detail:undefined},permission?422:503);
  }
}

export async function PATCH(request:Request){
  const user=await getChatGPTUser();if(!user||!isOwnerEmail(user.email)||!isSameOrigin(request.url,request.headers.get('origin')))return reply({error:'Owner sign-in and same-origin request required.'},403);
  try{const raw=await request.text();if(raw.length>4096)return reply({error:'Request too large.'},413);let data;try{data=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
    if(typeof data?.id!=='string')return reply({error:'Invalid publication.'},400);
    const db=articleDb(),row=await db.prepare('SELECT * FROM social_publications WHERE id=?').bind(data.id).first<{channel:string;status:string;updated_at:string}>();
    if(!row)return reply({error:'Publication not found.'},404);
    const url=safePostUrl(data.postUrl,row.channel);
    if(data.action==='link'){
      if(!url)return reply({error:'Enter a valid HTTPS link to the post on its platform.'},400);
      await db.prepare('UPDATE social_publications SET post_url=?,updated_at=? WHERE id=?').bind(url,new Date().toISOString(),data.id).run();return reply({saved:true});
    }
    if(data.action==='removed'&&row.status==='published'&&data.confirmed===true){await db.prepare("UPDATE social_publications SET status='removed',updated_at=? WHERE id=? AND status='published'").bind(new Date().toISOString(),data.id).run();return reply({saved:true});}
    if(data.action==='resolve'&&['sending','needs_review'].includes(row.status)){
      if(row.status==='sending'&&Date.now()-Date.parse(row.updated_at)<120000)return reply({error:'The publishing request may still be running. Wait two minutes before reconciling.'},409);
      if(data.confirmed!==true||!['published','not_published'].includes(data.outcome))return reply({error:'Check the platform and confirm the outcome first.'},400);
      if(data.outcome==='published'&&!url)return reply({error:'Paste the real post link to confirm publication.'},400);
      const changed=await db.prepare("UPDATE social_publications SET status=?,post_url=?,receipt=?,updated_at=? WHERE id=? AND status=? AND updated_at=?").bind(data.outcome==='published'?'published':'failed',url,'Outcome checked manually by owner.',new Date().toISOString(),data.id,row.status,row.updated_at).run();
      if(changed.meta.changes!==1)return reply({error:'History changed. Refresh before continuing.'},409);return reply({saved:true});
    }
    return reply({error:'Unsupported history action.'},400);
  }catch{return reply({error:'Could not update publishing history.'},503);}
}
