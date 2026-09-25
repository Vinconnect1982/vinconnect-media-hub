import {templateText,type BrandTemplate} from './brand-templates';
import type {JobDetails} from './install-content';
export type SupportingPhoto={image:HTMLImageElement;brightness:number;contrast:number};
export const lightLayouts=['install-editorial','info-guide','company-people','ad-local','ad-clean'];
export function drawPremium(c:CanvasRenderingContext2D,p:HTMLImageElement,logo:HTMLImageElement,t:BrandTemplate,j:JobDetails,h:number,brightness:number,contrast:number,support:SupportingPhoto[]=[]){
 const ink='#142126',teal='#00a7af',white='#ffffff',pale='#eaf3f2',light=lightLayouts.includes(t.layout),fg=light?ink:white;
 const short=h===720,foot=short?92:110,bottom=h-foot,margin=44;
 const title=templateText(t.headline,j)||j.service||'Your next connection';
 const label=t.label.toUpperCase(),sub=templateText(t.subline,j);
 const features=(j.graphicFeatures||[j.service,j.mount,j.suburb?`Servicing ${j.suburb}`:''].filter(Boolean).join('\n')).split('\n').map(s=>s.trim()).filter(Boolean).slice(0,3);
 const badge=j.graphicBadge?.trim()||'';
 const collage=support.length>0&&!short,stripTop=collage?bottom-Math.round(h*.26):bottom;
 function box(x:number,y:number,w:number,hh:number,color:string){c.fillStyle=color;c.fillRect(x,y,w,hh);}
 function line(x:number,y:number,x2:number,y2:number,color=teal,width=3){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
 function polygon(points:number[][],color:string){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 function text(value:string,x:number,y:number,w:number,hh:number,size:number,color=fg,font='VinBody',upper=false){
  value=upper?value.toUpperCase():value;c.textAlign='left';c.textBaseline='top';let lines:string[]=[];
  do{c.font=`${size}px ${font}`;lines=[];let row='';for(const word of value.split(/\s+/)){const next=row?row+' '+word:word;if(c.measureText(next).width>w&&row){lines.push(row);row=word;}else row=next;}if(row)lines.push(row);if(lines.length*size*1.12<=hh)break;size-=2;}while(size>16);
  const limit=Math.max(1,Math.floor(hh/(size*1.12)));if(lines.length>limit){lines=lines.slice(0,limit);let end=lines[limit-1];while(c.measureText(end+'…').width>w&&end.length)end=end.slice(0,-1);lines[limit-1]=end+'…';}
  lines.forEach((row,i)=>{c.fillStyle=color;c.fillText(row,x,y+i*size*1.12,w);});return lines.length*size*1.12;
 }
 function headline(x:number,y:number,w:number,hh:number,size=96){
  // Natural condensed type, with a deliberate teal second phrase.
  const words=title.toUpperCase().split(/\s+/);let split=words.length>3?Math.ceil(words.length*.45):Math.max(1,words.length-1);
  if(title.includes('\n'))split=title.split('\n')[0].split(/\s+/).length;
  const a=words.slice(0,split).join(' '),b=words.slice(split).join(' ');
  const first=text(a,x,y,w,hh*.48,size,fg,'VinDisplay');
  text(b,x,y+first+7,w,Math.max(25,hh-first-7),size,teal,'VinDisplay');
 }
 function photo(img:HTMLImageElement,x:number,y:number,w:number,hh:number,b=100,k=100){
  box(x,y,w,hh,light?pale:ink);c.filter=`brightness(${b}%) contrast(${k}%)`;
  if(t.photoFit==='contain'){const scale=Math.min(w/img.naturalWidth,hh/img.naturalHeight),pw=img.naturalWidth*scale,ph=img.naturalHeight*scale;c.drawImage(img,x+(w-pw)/2,y+(hh-ph)/2,pw,ph);}
  else{const scale=Math.max(w/img.naturalWidth,hh/img.naturalHeight),sw=w/scale,sh=hh/scale;c.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,x,y,w,hh);}
  c.filter='none';
 }
 function fade(x:number,y:number,w:number,hh:number,right=false,whiteFade=false){const g=c.createLinearGradient(x,y,x+w,y);const rgb=whiteFade?'255,255,255':'20,33,38';g.addColorStop(0,`rgba(${rgb},${right?0:1})`);g.addColorStop(.48,`rgba(${rgb},.88)`);g.addColorStop(1,`rgba(${rgb},${right?1:0})`);c.fillStyle=g;c.fillRect(x,y,w,hh);}
 function brand(x=44,y=32,w=355){c.drawImage(logo,x,y,w,w*logo.naturalHeight/logo.naturalWidth);}
 function script(value:string,x:number,y:number,w:number,size=64){text(value,x,y,w,size*1.45,size,fg,'VinScript');}
 function icon(kind:number,x:number,y:number,size=45,color=teal){
  c.save();c.translate(x,y);c.scale(size/48,size/48);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2.6;c.lineCap='round';c.lineJoin='round';
  if(kind%3===0){for(const r of [11,20,29]){c.beginPath();c.arc(24,35,r,Math.PI*1.23,Math.PI*1.77);c.stroke();}c.beginPath();c.arc(24,36,2.8,0,Math.PI*2);c.fill();}
  else if(kind%3===1){c.beginPath();c.moveTo(3,22);c.lineTo(24,6);c.lineTo(45,22);c.moveTo(9,21);c.lineTo(9,43);c.lineTo(39,43);c.lineTo(39,21);c.moveTo(19,43);c.lineTo(19,29);c.lineTo(29,29);c.lineTo(29,43);c.stroke();}
  else{c.beginPath();c.moveTo(24,4);c.lineTo(42,12);c.lineTo(39,31);c.quadraticCurveTo(34,41,24,46);c.quadraticCurveTo(14,41,9,31);c.lineTo(6,12);c.closePath();c.stroke();c.beginPath();c.moveTo(16,24);c.lineTo(22,30);c.lineTo(33,18);c.stroke();}
  c.restore();
 }
 function featureRow(x:number,y:number,w:number,color=fg){const n=features.length;if(!n)return;const cell=w/n;features.forEach((f,i)=>{icon(i,x+i*cell+8,y,40);text(f,x+i*cell+5,y+49,cell-20,62,21,color,'VinBody',true);if(i<n-1)line(x+(i+1)*cell-10,y+8,x+(i+1)*cell-10,y+94,light?'#bdd4d5':'#456267',1);});}
 function featureList(x:number,y:number,w:number,hh:number){const gap=Math.min(100,hh/Math.max(features.length,1));features.forEach((f,i)=>{icon(i,x,y+i*gap,39);text(f,x+58,y+i*gap+1,w-65,gap-12,25,fg,'VinBody');if(i<features.length-1)line(x,y+(i+1)*gap-10,x+w,y+(i+1)*gap-10,light?'#c4d7d8':'#365258',1);});}
 function callout(x:number,y:number,r:number,value=badge){if(!value)return;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=ink;c.fill();c.strokeStyle=teal;c.lineWidth=4;c.stroke();c.beginPath();c.arc(x,y,r-9,0,Math.PI*2);c.strokeStyle='#344d54';c.lineWidth=1;c.stroke();icon(0,x-24,y-r+27,48);text(value,x-r*.76,y-r*.22,r*1.52,r*.92,short?29:38,white,'VinDisplay',true);}
 function strip(x=0,w=1080,y=stripTop,hh=bottom-stripTop){if(!collage)return;const list=support.slice(0,2),each=w/list.length;list.forEach((s,i)=>{photo(s.image,x+i*each,y,each,hh,s.brightness,s.contrast);if(i)line(x+i*each,y,x+i*each,bottom,white,4);});line(x,y,x+w,y-14,white,4);}
 function footer(){box(0,bottom,1080,foot,ink);line(0,bottom,1080,bottom,'#466269',1);icon(0,37,bottom+24,40);text('STARLINK • WI-FI',96,bottom+25,235,30,22,white,'VinDisplay');text('vinconnect.com.au',96,bottom+57,290,30,20,white);polygon([[590,bottom],[1080,bottom],[1080,h],[625,h]],teal);text('LET’S GET CONNECTED',661,bottom+16,380,35,27,ink,'VinDisplay');text('0408 559 555',661,bottom+52,380,43,34,ink,'VinDisplay');}
 box(0,0,1080,h,light?white:ink);
 const kind=t.layout;
 if(['install-hero','marketing-rural','company-story'].includes(kind)){
  photo(p,360,0,720,stripTop,brightness,contrast);fade(0,0,890,stripTop);brand();
  text(label,44,128,520,35,20,teal,'VinBody',true);headline(44,177,535,short?230:stripTop*.38,short?75:99);
  const locY=short?420:stripTop*.63;script(j.suburb||'Connected living',48,locY,540,short?50:68);
  if(!short)featureRow(44,stripTop-122,545);else text(sub,44,505,540,57,24);
  strip();callout(885,stripTop-(collage?3:150),short?92:127);footer();
 }else if(['install-editorial','info-guide','ad-local'].includes(kind)){
  const edge=kind==='info-guide'?550:515;photo(p,edge-25,0,1105-edge,bottom,brightness,contrast);
  polygon([[0,0],[edge+25,0],[edge-65,bottom],[0,bottom]],white);brand(40,32,350);
  text(label,44,135,425,40,20,teal);headline(44,192,430,short?200:h*.27,short?66:88);
  script(j.suburb||'A closer look',44,short?410:h*.39,430,short?48:64);
  if(short)text(sub,44,500,410,60,24);else featureList(44,h*.51,390,Math.min(300,bottom-h*.51-25));
  if(collage)strip(edge,1080-edge,bottom-h*.24,h*.24);
  callout(865,bottom-(collage?h*.24:140),short?85:118);footer();
 }else if(['info-cover','marketing-service','ad-clean'].includes(kind)){
  const reverse=kind==='ad-clean';const px=reverse?0:435,tx=reverse?595:44;
  photo(p,px,0,645,bottom,brightness,contrast);
  if(reverse){fade(370,0,710,bottom,true,true);box(775,0,305,bottom,white);}else fade(0,0,950,bottom);
  brand(tx,30,350);text(label,tx,134,440,40,20,teal);headline(tx,191,440,short?218:h*.33,short?78:105);
  script(j.suburb||'Stay connected',tx,short?421:h*.54,430,short?46:62);
  if(!short)featureRow(tx,bottom-125,440);else text(sub,tx,510,430,62,24);footer();
 }else if(['info-question','company-update','ad-bold'].includes(kind)){
  photo(p,390,0,690,bottom,brightness,contrast);fade(0,0,945,bottom);
  polygon([[0,0],[405,0],[575,bottom],[0,bottom]],kind==='company-update'?'#063e46':ink);
  brand();text(label,44,133,505,40,20,teal);headline(44,188,520,short?240:h*.36,short?83:114);
  script(j.suburb||'Let’s talk',44,short?430:h*.56,505,short?48:66);
  if(!short)featureRow(44,bottom-140,530);else text(sub,44,516,530,56,24);
  callout(857,bottom-(short?142:185),short?98:142);footer();
 }else if(['company-people','marketing-lifestyle'].includes(kind)){
  const cut=short?bottom*.43:bottom*.56;photo(p,0,0,1080,cut,brightness,contrast);
  const g=c.createLinearGradient(0,0,0,155);g.addColorStop(0,light?'rgba(255,255,255,.97)':'rgba(20,33,38,.97)');g.addColorStop(1,'rgba(20,33,38,0)');c.fillStyle=g;c.fillRect(0,0,1080,155);brand();
  polygon([[0,cut-18],[1080,cut-65],[1080,bottom],[0,bottom]],light?white:ink);
  text(label,44,cut+6,600,32,20,teal);headline(44,cut+50,720,bottom-cut-95,short?65:91);
  script(j.suburb||'Life, connected',768,cut+38,267,short?35:47);
  if(!short)text(sub,775,cut+140,250,140,27);footer();
 }else{
  // Local photo montage: installation-location and the local advertising variant.
  photo(p,0,0,1080,stripTop,brightness,contrast);fade(0,0,940,stripTop);brand();
  text(label,44,133,565,40,20,teal);headline(44,188,590,short?220:stripTop*.35,short?80:110);
  script(j.suburb||'Your place',44,short?425:stripTop*.63,600,short?56:78);
  if(!short)featureRow(44,stripTop-119,620);else text(sub,44,520,565,54,25);
  strip();callout(881,stripTop-(collage?0:150),short?94:126);footer();
 }
 c.filter='none';c.textBaseline='alphabetic';c.textAlign='left';
}
