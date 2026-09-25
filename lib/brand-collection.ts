import {collectionById,collectionPalettes} from './template-collection';
import {templateText,type BrandTemplate} from './brand-templates';
import type {JobDetails} from './install-content';
import type {SupportingPhoto} from './brand-premium';
export function drawCollection(c:CanvasRenderingContext2D,p:HTMLImageElement,logo:HTMLImageElement,t:BrandTemplate,j:JobDetails,h:number,brightness:number,contrast:number,support:SupportingPhoto[]=[]){
 const entry=collectionById.get(t.layout);if(!entry)throw Error('Unknown collection design');const d=entry;
 const pal=collectionPalettes[d.palette],{bg,fg,accent,soft}=pal,W=1080,footerH=84,bottom=h-footerH,short=h===720;
 const headline=templateText(t.headline,j)||j.headline||j.service,sub=templateText(t.subline,j),label=templateText(t.label,j);
 const facts=(j.graphicFeatures||[j.service,j.mount].filter(Boolean).join('\n')).split('\n').map(s=>s.trim()).filter(Boolean).slice(0,3);
 const tag=j.graphicBadge?.trim()||'',body=j.challenge?.trim()||j.result?.trim()||sub;
 function rect(x:number,y:number,w:number,hh:number,col:string){c.fillStyle=col;c.fillRect(x,y,w,hh);}
 function stroke(x:number,y:number,x2:number,y2:number,col:string=accent,lw=2){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
 function poly(pts:number[][],col:string){c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 function text(s:string,x:number,y:number,w:number,hh:number,size:number,col:string=fg,font='VinBody',align:'left'|'center'='left'){
  let lines:string[]=[];c.textAlign=align;c.textBaseline='top';
  do{c.font=`${font==='VinHeadline'?'700 ':''}${size}px ${font}`;lines=[];let row='';for(const word of s.split(/\s+/)){const z=row?row+' '+word:word;if(c.measureText(z).width>w&&row){lines.push(row);row=word;}else row=z;}if(row)lines.push(row);if(lines.length*size*1.12<=hh)break;size-=2;}while(size>16);
  const limit=Math.max(1,Math.floor(hh/(size*1.12)));if(lines.length>limit){lines=lines.slice(0,limit);let last=lines[limit-1];while(c.measureText(last+'…').width>w&&last.length)last=last.slice(0,-1);lines[limit-1]=last+'…';}
  c.fillStyle=col;lines.forEach((row,i)=>c.fillText(row,align==='center'?x+w/2:x,y+i*size*1.12,w));c.textAlign='left';return lines.length*size*1.12;
 }
 function title(x:number,y:number,w:number,hh:number,size=88,align:'left'|'center'='left'){return text(headline.toUpperCase(),x,y,w,hh,size,fg,d.font,align);}
 function brand(x=40,y=26,w=330){c.drawImage(logo,x,y,w,w*logo.naturalHeight/logo.naturalWidth);}
 function photo(img:HTMLImageElement,x:number,y:number,w:number,hh:number,b=100,k=100){rect(x,y,w,hh,soft);c.filter=`brightness(${b}%) contrast(${k}%)`;if(t.photoFit==='contain'){const z=Math.min(w/img.naturalWidth,hh/img.naturalHeight),dw=img.naturalWidth*z,dh=img.naturalHeight*z;c.drawImage(img,x+(w-dw)/2,y+(hh-dh)/2,dw,dh);}else{const z=Math.max(w/img.naturalWidth,hh/img.naturalHeight),sw=w/z,sh=hh/z;c.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,x,y,w,hh);}c.filter='none';}
 function main(x:number,y:number,w:number,hh:number){photo(p,x,y,w,hh,brightness,contrast);}
 function tint(x:number,y:number,w:number,hh:number,vertical=false,reverse=false){const g=c.createLinearGradient(x,y,x+(vertical?0:w),y+(vertical?hh:0));g.addColorStop(0,reverse?bg+'00':bg);g.addColorStop(.38,bg+'ef');g.addColorStop(1,reverse?bg:bg+'00');c.fillStyle=g;c.fillRect(x,y,w,hh);}
 function chip(value:string,x:number,y:number,w:number,light=false){rect(x,y,w,42,light?bg:accent);text(value.toUpperCase(),x+14,y+10,w-28,26,19,light?accent:pal.light?'#ffffff':'#102b33','VinBody');}
 function location(x:number,y:number,w:number,size=60){if(j.suburb)text(j.suburb,x,y,w,size*1.3,size,accent,'VinScript');}
 function badge(x:number,y:number,r=95){if(!tag)return;c.strokeStyle=accent;c.lineWidth=3;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=bg;c.fill();c.stroke();c.beginPath();c.arc(x,y,r-9,0,Math.PI*2);c.lineWidth=1;c.stroke();text(tag.toUpperCase(),x-r*.75,y-r*.45,r*1.5,r*.95,31,accent,'VinDisplay','center');}
 function factsRow(x:number,y:number,w:number,hh:number){if(!facts.length)return;const cw=w/facts.length;facts.forEach((s,i)=>{text(String(i+1).padStart(2,'0'),x+i*cw,y,cw-18,35,26,accent,'VinDisplay');text(s,x+i*cw,y+42,cw-24,hh-42,22);if(i)stroke(x+i*cw-15,y,x+i*cw-15,y+hh-8,soft,1);});}
 function factsList(x:number,y:number,w:number,hh:number){const step=hh/Math.max(facts.length,1);facts.forEach((s,i)=>{c.beginPath();c.arc(x+17,y+i*step+19,16,0,Math.PI*2);c.strokeStyle=accent;c.lineWidth=2;c.stroke();text(String(i+1),x+10,y+i*step+6,20,28,21,accent);text(s,x+50,y+i*step+3,w-55,step-18,24);if(i<facts.length-1)stroke(x,y+(i+1)*step-12,x+w,y+(i+1)*step-12,soft,1);});}
 function secondaries(x:number,y:number,w:number,hh:number){const photos=support.slice(0,2);if(!photos.length){factsList(x+20,y+15,w-40,hh-30);return;}photos.forEach((s,i)=>{const cw=(w-10*(photos.length-1))/photos.length;photo(s.image,x+i*(cw+10),y,cw,hh,s.brightness,s.contrast);});}
 function foot(){rect(0,bottom,W,footerH,bg);stroke(36,bottom,1044,bottom,accent,2);text('0408 559 555',40,bottom+26,355,36,28,fg,'VinDisplay');text('vinconnect.com.au',657,bottom+28,385,35,25,fg,'VinBody');}
 rect(0,0,W,h,bg);
 switch(d.scene){
 case 'cinema':{
  main(0,0,W,bottom);tint(0,0,W,210,true);tint(0,bottom*.28,W,bottom*.72,true,true);
  rect(0,0,W,116,bg+'dc');brand(42,23,310);text(label.toUpperCase(),600,41,432,53,22,accent);
  const y=short?250:bottom*.41;stroke(46,y-23,128,y-23,accent,7);const used=title(42,y,930,short?170:bottom*.25,short?77:106);
  if(j.suburb)location(46,y+used+15,920,short?43:65);
  if(!short){rect(30,bottom-170,1020,145,bg+'db');factsRow(48,bottom-153,975,110);}else text(sub,46,bottom-69,915,44,27,accent,'VinBody');break;
 }
 case 'folio':{
  brand(38,24,320);text(label.toUpperCase(),605,43,430,50,22,accent);
  const py=125,ph=short?210:bottom*.50;main(28,py,1024,ph);rect(28,py+ph-7,1024,7,accent);
  const ty=py+ph+24;const used=title(42,ty,985,short?131:bottom-ty-165,short?56:88);
  const sy=ty+used+14;text(sub,44,sy,985,55,short?24:29,accent);
  if(!short){rect(28,bottom-98,1024,76,accent);facts.forEach((s,i)=>text(s,48+i*332,bottom-76,305,47,26,'#ffffff','VinBody'));}break;
 }
 case 'gallery':{
  brand(38,24,308);text(label.toUpperCase(),590,42,450,53,22,accent);
  const top=126,left=short?585:570,photoH=short?300:(bottom-top)*.57;
  main(28,top,left-42,photoH);secondaries(28,top+photoH+12,left-42,bottom-top-photoH-30);
  rect(left,top,1080-left-28,bottom-top-18,soft);text('THE STORY',left+25,top+26,1080-left-85,37,20,accent);
  title(left+25,top+88,1080-left-85,short?206:h*.24,short?57:76);
  text(sub,left+25,short?top+322:h*.49,1080-left-85,short?108:110,25,accent);
  if(!short)factsList(left+25,bottom-254,1080-left-85,220);break;
 }
 case 'index':{
  brand(38,24,310);text(label.toUpperCase(),535,42,504,56,22,accent);
  title(42,142,995,short?123:h*.18,short?59:83);
  const top=short?300:h*.32;main(28,top,535,bottom-top-20);
  const x=603,w=430,step=(bottom-top-24)/Math.max(facts.length,1);
  facts.forEach((s,i)=>{const y=top+i*step;rect(x,y,48,41,accent);text(String(i+1).padStart(2,'0'),x+7,y+6,35,30,24,'#ffffff','VinDisplay');text(s,x+66,y+1,w-69,step-25,short?24:31,fg,'VinBody');if(i<facts.length-1)stroke(x,y+step-13,x+w,y+step-13,soft);});break;
 }
 case 'broadcast':{
  const split=short?560:540;main(0,0,split,bottom);rect(split,0,W-split,bottom,bg);
  rect(split,0,8,bottom,accent);brand(split+37,30,W-split-74);
  text(label.toUpperCase(),split+35,143,W-split-73,70,22,accent);
  title(split+35,244,W-split-73,short?205:h*.29,short?57:78);
  const sy=short?bottom-136:h*.58;text(sub,split+35,sy,W-split-73,short?95:100,27,accent);
  if(!short){stroke(split+35,bottom-222,1040,bottom-222,soft);factsList(split+35,bottom-199,W-split-73,174);}break;
 }
 case 'headline':{
  brand(40,24,312);text(label.toUpperCase(),545,42,495,56,22,accent);
  const py=short?322:h*.43;title(42,145,991,py-172,short?65:96);
  main(28,py,1024,bottom-py-20);rect(50,bottom-101,980,62,bg+'ed');text(sub||tag,69,bottom-86,942,43,27,accent,'VinBody');break;
 }
 case 'panorama':{
  main(0,0,W,bottom);tint(0,0,1080,bottom);tint(0,bottom-240,1080,240,true,true);brand();chip(label,42,134,Math.min(630,Math.max(330,label.length*12+30)));
  title(42,211,660,short?225:h*.29,short?83:105);location(45,short?440:h*.46,660,short?48:67);
  rect(32,bottom-139,1016,114,bg+'eb');factsRow(52,bottom-126,725,99);badge(929,bottom-125,short?82:107);break;
 }
 case 'dossier':{
  brand();text(label.toUpperCase(),580,44,465,65,23,accent);const start=short?136:150;stroke(40,start-16,1040,start-16);
  title(40,start+15,460,short?185:h*.24,short?61:82);location(40,start+(short?196:h*.27),450,short?45:61);
  main(540,start,500,bottom-start-20);if(!short){rect(575,bottom-200,430,162,bg+'ed');text(body,595,bottom-181,390,122,23);}
  factsList(40,short?420:h*.54,450,short?160:Math.min(340,bottom-h*.54-20));break;
 }
 case 'mosaic':{
  brand();text(label.toUpperCase(),515,42,525,55,23,accent);const top=139,left=short?390:370;
  title(40,top+10,left-65,short?215:h*.26,short?64:85);location(40,top+(short?225:h*.28),left-55,short?44:57);
  main(left,top,W-left-32,short?bottom-top-160:(bottom-top)*.61);const sy=short?bottom-150:top+(bottom-top)*.61+12;secondaries(left,sy,W-left-32,bottom-sy-20);
  if(!short)factsList(40,h*.52,left-65,bottom-h*.52-30);else text(sub,40,bottom-138,left-65,110,23);break;
 }
 case 'diagonal':{
  main(360,0,720,bottom);poly([[0,0],[565,0],[430,bottom],[0,bottom]],bg);brand();text(label.toUpperCase(),40,133,440,47,20,accent);
  title(40,211,430,short?210:h*.31,short?70:89);location(40,short?434:h*.5,400,short?46:60);
  if(short)text(sub,40,515,370,65,22);else factsList(40,h*.63,365,bottom-h*.63-20);
  poly([[680,bottom-145],[1080,bottom-195],[1080,bottom],[655,bottom]],accent);text(tag||sub,717,bottom-116,320,104,short?27:33,pal.light?'#ffffff':'#102b33','VinDisplay');break;
 }
 case 'postcard':{
  brand();text(label.toUpperCase(),545,46,495,49,22,accent);const top=138,ph=short?230:h*.42;
  main(36,top,1008,ph);rect(55,top+ph-73,Math.min(650,Math.max(320,j.suburb.length*24)),62,bg+'ed');location(76,top+ph-78,630,52);
  title(42,top+ph+24,710,bottom-top-ph-54,short?53:78);if(!short)text(body,785,top+ph+30,250,bottom-top-ph-58,24);else text(sub,795,top+ph+29,240,150,23);break;
 }
 case 'question':{
  main(460,0,620,bottom);tint(0,0,1070,bottom);brand();text(label,43,134,650,49,26,accent,'VinScript');
  title(43,205,620,short?248:h*.39,short?74:96);
  const y=short?483:h*.61;poly([[42,y],[590,y-15],[576,y+56],[30,y+68]],accent);text(sub,60,y+8,500,45,27,pal.light?'#ffffff':'#102b33','VinDisplay');
  if(!short)factsRow(44,bottom-145,660,117);badge(883,bottom-144,short?100:135);break;
 }
 case 'guide':{
  brand();chip(label,570,40,469);title(42,155,996,short?136:h*.2,short?60:87);
  const top=short?310:h*.34;main(580,top,460,bottom-top-23);factsList(45,top+10,475,bottom-top-38);
  if(tag){rect(617,bottom-120,385,73,bg+'f5');text(tag.toUpperCase(),635,bottom-100,350,45,27,accent,'VinDisplay');}break;
 }
 case 'cards':{
  main(550,0,530,bottom*.64);tint(0,0,1050,bottom*.68);brand();text(label.toUpperCase(),42,137,525,47,22,accent);title(42,209,570,short?175:h*.24,short?66:85);
  const y=short?425:h*.58,hh=bottom-y-25;facts.forEach((s,i)=>{const x=36+i*342;rect(x,y,326,hh,soft);rect(x,y,326,7,accent);text(String(i+1).padStart(2,'0'),x+21,y+22,280,57,46,accent,'VinDisplay');text(s,x+21,y+90,284,hh-106,30);});break;
 }
 case 'editorial':{
  const split=d.id==='clean-line'?510:560;rect(0,0,split,h,soft);main(24,24,split-48,bottom-47);rect(split,0,1080-split,bottom,bg);brand(split+27,30,1080-split-66);
  text(label.toUpperCase(),split+30,137,1080-split-64,55,20,accent);title(split+30,218,1080-split-64,short?202:h*.30,short?57:76);
  const ty=short?438:h*.55;text(body,split+30,ty,1080-split-65,short?131:165,24);if(!short)factsList(split+30,bottom-242,1080-split-65,220);break;
 }
 case 'ribbon':{
  main(0,0,1080,bottom);tint(0,0,1080,220,true);tint(0,bottom*.40,1080,bottom*.6,true,true);brand();
  const y=short?200:bottom*.32;poly([[0,y],[990,y-42],[1080,y+111],[0,y+157]],bg+'ed');title(43,y-2,975,145,short?67:79);
  chip(label,44,y+165,Math.min(960,label.length*12+70));location(45,y+220,700,short?45:68);
  if(!short){rect(0,bottom-137,1080,137,bg+'ed');factsRow(45,bottom-117,980,100);}else text(sub,45,bottom-90,950,50,24);break;
 }
 case 'poster':{
  main(0,0,1080,bottom);tint(0,0,1080,bottom*.63,true);tint(0,bottom*.53,1080,bottom*.47,true,true);brand(361,27,358);
  text(label.toUpperCase(),45,139,990,42,22,accent,'VinBody','center');title(62,206,956,short?170:h*.27,short?80:112,'center');
  if(j.suburb)text(j.suburb,80,short?380:h*.43,920,short?75:110,short?64:91,accent,'VinScript','center');
  rect(60,bottom-137,960,111,bg+'ed');text(tag||sub,85,bottom-120,910,55,short?28:35,fg,'VinDisplay','center');text(sub,85,bottom-65,910,32,22,accent,'VinBody','center');break;
 }
 }
 foot();c.filter='none';c.textAlign='left';c.textBaseline='alphabetic';
}
