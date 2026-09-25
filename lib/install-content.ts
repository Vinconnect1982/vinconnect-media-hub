import {brandTemplate,type BrandTemplate} from './brand-templates';
export type JobDetails={suburb:string;service:string;mount:string;challenge:string;result:string;headline:string;style:string;brand?:BrandTemplate;graphicFeatures?:string;graphicBadge?:string};
export type JobPhoto={source:string;rendered:string;brightness:number;contrast:number};
export const emptyJob:JobDetails={suburb:'',service:'Starlink installation',mount:'',challenge:'',result:'',headline:'Another installation, done right.',style:'local'};
export function jobDetails(input:any):JobDetails {
 const result={...emptyJob};
 for(const key of Object.keys(result) as (keyof typeof emptyJob)[]){if(typeof input?.[key]!=='string'||input[key].length>(['challenge','result'].includes(key)?800:100))throw Error('Check the length of your job details.');(result as any)[key]=input[key].trim();}
 for(const [key,max] of [['graphicFeatures',240],['graphicBadge',60]] as const){if(input?.[key]!==undefined){if(typeof input[key]!=='string'||input[key].length>max)throw Error('Check graphic text lengths.');result[key]=input[key].trim();}}
 if(input?.brand!==undefined)result.brand=brandTemplate(input.brand);
 return result;
}
export const mediaPath=(path:unknown)=>typeof path==='string'&&/^\/media\/[0-9a-f-]{36}\.jpg$/.test(path);
export function photoList(raw:unknown):JobPhoto[]{
 let list=raw;if(typeof raw==='string'){try{list=JSON.parse(raw);}catch{throw Error('Invalid photo list.');}}
 if(!Array.isArray(list)||list.length<1||list.length>10)throw Error('Choose between 1 and 10 photos.');
 return list.map(p=>{if(!p||!(mediaPath(p.source)||/^\/assets\/articles\/article-\d+\.png$/.test(p.source))||!mediaPath(p.rendered)||!Number.isFinite(p.brightness)||p.brightness<80||p.brightness>120||!Number.isFinite(p.contrast)||p.contrast<80||p.contrast>120)throw Error('Invalid photo or adjustment.');return {source:p.source,rendered:p.rendered,brightness:p.brightness,contrast:p.contrast};});
}
export function buildJobCaption(job:JobDetails){
 if(job.brand?.type&&job.brand.type!=='Installations'){return {title:job.headline||job.service,body:[job.challenge,job.result,job.mount?'• '+job.mount:'','Questions? Message VINCONNECT or call 0408 559 555.','vinconnect.com.au','#VINCONNECT'].filter(Boolean).join('\n\n')};}
 const title=job.suburb?`${job.service} in ${job.suburb}`:job.service;
 const lines=[job.style==='brief'?'A look at this installation.':`On the tools${job.suburb?' in '+job.suburb:''} with VINCONNECT.`,job.mount?'• Mount: '+job.mount:'',job.challenge?'The job\n'+job.challenge:'',job.result?'The result\n'+job.result:'','Planning your own installation? Message VINCONNECT or call 0408 559 555.','vinconnect.com.au','#VINCONNECT #'+(job.service.toLowerCase().includes('starlink')?'StarlinkInstallation':'Connectivity')+(job.suburb?' #'+job.suburb.replace(/[^a-zA-Z]/g,''):'')].filter(Boolean);
 return {title,body:lines.join('\n\n')};
}
export function jpegDimensions(bytes:Uint8Array):{width:number;height:number}|null {
 if(bytes[0]!==255||bytes[1]!==216)return null;
 for(let i=2;i+8<bytes.length;){if(bytes[i]!==255)return null;const marker=bytes[i+1];i+=2;if(marker===0xda||marker===0xd9)return null;if(marker===0xff){i--;continue;}const len=(bytes[i]<<8)|bytes[i+1];if(len<2||i+len>bytes.length)return null;if([0xc0,0xc1,0xc2].includes(marker))return {height:(bytes[i+3]<<8)|bytes[i+4],width:(bytes[i+5]<<8)|bytes[i+6]};i+=len;}
 return null;
}
