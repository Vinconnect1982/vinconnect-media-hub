import {drawCollection} from './brand-collection';
import {collectionById,collectionPalettes} from './template-collection';
import {drawPremium,lightLayouts} from './brand-premium';
import {designLayouts} from './brand-templates';
import {drawFeatureLayout} from './brand-layouts';
import {brandTemplate,templateText} from './brand-templates';
import type {JobDetails} from './install-content';
export async function loadPhoto(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Photo could not be loaded. Please retry.'));img.src=src;});}
export function canvasBlob(canvas:HTMLCanvasElement,quality=.92):Promise<Blob>{return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not export this photo.')),'image/jpeg',quality));}
export async function sourcePhoto(file:File):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Use JPEG, PNG or WebP photos. Export HEIC photos as JPEG first.');
 if(file.size>25*1024*1024)throw Error('Choose photos below 25 MB.');
 const url=URL.createObjectURL(file);try{const img=await loadPhoto(url);const scale=Math.min(1,2400/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);return canvasBlob(canvas);}finally{URL.revokeObjectURL(url);}
}
function wrap(ctx:CanvasRenderingContext2D,text:string,max:number){const lines:string[]=[];let line='';for(const word of text.split(/\s+/)){const test=line?line+' '+word:word;if(ctx.measureText(test).width>max&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);return lines;}
let headlineFont:Promise<void>|undefined;
function loadHeadlineFont(){return headlineFont??=(async()=>{for(const [family,file,weight] of [['VinHeadline','DejaVuSans-Bold.ttf','700'],['VinDisplay','Anton-Regular.ttf','400'],['VinScript','Allura-Regular.ttf','400'],['VinBody','Barlow-Regular.ttf','400']]){const font=new FontFace(family,`url(/assets/fonts/${file})`,{weight});await font.load();document.fonts.add(font);}})().catch(()=>{headlineFont=undefined;throw Error('The brand fonts could not load. Check your connection and retry.');});}
export async function brandCanvas(source:string,job:JobDetails,brightness:number,contrast:number,index:number,total:number,supporting:{source:string;brightness:number;contrast:number}[]=[]){
 await loadHeadlineFont();
 const template=brandTemplate(job.brand);
 const premium=designLayouts.some(d=>d[0]===template.layout);
 const collection=collectionById.get(template.layout);
 const isLight=collection?collectionPalettes[collection.palette].light:lightLayouts.includes(template.layout);
 const [photo,logo]=await Promise.all([loadPhoto(source),loadPhoto(premium&&!isLight?'/assets/vinconnect-reversed-transparent.png':'/assets/vinconnect-transparent.png')]);
 const extras=premium?await Promise.all(supporting.filter(s=>s.source!==source).slice(0,2).map(async s=>({...s,image:await loadPhoto(s.source)}))):[];
 const height=template.format==='landscape'?720:template.format==='square'?1080:1350;
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=height;const c=canvas.getContext('2d')!;
 if(collection){drawCollection(c,photo,logo,template,job,height,brightness,contrast,extras);return canvas;}
 if(designLayouts.some(d=>d[0]===template.layout)){drawPremium(c,photo,logo,template,job,height,brightness,contrast,extras);return canvas;}
 if(['spotlight','editorial','campaign'].includes(template.layout)){drawFeatureLayout(c,photo,logo,template,job,height,brightness,contrast,index,total);return canvas;}
 const compact=template.format==='landscape',header=compact?105:155,footer=height-(compact?230:320),light=template.layout==='white';
 c.fillStyle=light?'#eff5f5':'#142d33';c.fillRect(0,0,1080,height);c.fillStyle='#fff';c.fillRect(0,0,1080,header);
 const lw=330,lh=lw*logo.naturalHeight/logo.naturalWidth;c.drawImage(logo,38,(header-lh)/2,lw,lh);
 c.fillStyle='#087f88';c.font='bold 24px Arial';c.textAlign='right';c.fillText(template.label,1038,compact?44:67,600);c.font='22px Arial';c.fillText(total>1?`${index+1} / ${total}`:'VINCONNECT',1038,compact?78:104);c.textAlign='left';
 const area={x:0,y:header,w:1080,h:footer-header};const scale=Math.min(area.w/photo.naturalWidth,area.h/photo.naturalHeight);const w=photo.naturalWidth*scale,h=photo.naturalHeight*scale;
 c.filter=`brightness(${brightness}%) contrast(${contrast}%)`;c.drawImage(photo,(1080-w)/2,area.y+(area.h-h)/2,w,h);c.filter='none';
 c.fillStyle=template.layout==='teal'?'#087f88':light?'#fff':'#142d33';c.fillRect(0,footer,1080,320);
 c.fillStyle='#079ba3';c.fillRect(0,footer,1080,8);c.fillStyle=light?'#087f88':template.layout==='teal'?'#fff':'#60d5da';c.font='bold 26px Arial';c.fillText(templateText(template.subline,job).toUpperCase(),44,footer+(compact?42:58),992);
 c.fillStyle=light?'#142d33':'#fff';const headline=templateText(template.headline,job)||job.service||'Installation complete';let size=compact?38:50;let lines:string[]=[];do{c.font=`bold ${size}px Arial`;lines=wrap(c,headline,992);if(lines.length<=2)break;size-=2;}while(size>28);
 if(lines.length>2){lines=[lines[0],lines.slice(1).join(' ')];while(c.measureText(lines[1]+'…').width>992&&lines[1].length)lines[1]=lines[1].slice(0,-1);lines[1]+='…';}
 lines.forEach((line,i)=>c.fillText(line,44,footer+(compact?94:120)+i*(size+10),992));
 c.fillStyle=light?'#142d33':'#d9e8e9';c.font='26px Arial';c.fillText('0408 559 555',44,height-(compact?25:42));c.textAlign='right';c.fillText('vinconnect.com.au',1036,height-(compact?25:42));
 return canvas;
}
