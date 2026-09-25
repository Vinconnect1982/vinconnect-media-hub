import {templateText,type BrandTemplate} from './brand-templates';
import type {JobDetails} from './install-content';
// Shared by gallery previews and uploaded exports. Source photos are contained,
// never stretched or cropped, so installation hardware remains visible.
export function drawFeatureLayout(c:CanvasRenderingContext2D,photo:HTMLImageElement,logo:HTMLImageElement,t:BrandTemplate,job:JobDetails,height:number,brightness:number,contrast:number,index:number,total:number){
 const teal='#087f88',ink='#142d33',white='#ffffff',accent='#66d9db';
 const compact=height===720;
 function rect(x:number,y:number,w:number,h:number,color:string){c.fillStyle=color;c.fillRect(x,y,w,h);}
 function text(value:string,x:number,y:number,width:number,height:number,size:number,color:string,bold=true){
  c.fillStyle=color;c.textAlign='left';c.textBaseline='top';
  let lines:string[]=[];
  do{
   c.font=`${bold?'900':'400'} ${size}px Arial, sans-serif`;lines=[];let line='';
   for(const word of value.split(/\s+/)){const test=line?line+' '+word:word;if(c.measureText(test).width>width&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);
   if(lines.length*size*1.12<=height)break;
   size-=2;
  }while(size>18);
  const max=Math.max(1,Math.floor(height/(size*1.12)));
  if(lines.length>max){lines=lines.slice(0,max);let last=lines[max-1];while(c.measureText(last+'…').width>width&&last.length)last=last.slice(0,-1);lines[max-1]=last+'…';}
  lines.forEach((line,i)=>c.fillText(line,x,y+i*size*1.12,width));
 }
 function image(x:number,y:number,w:number,h:number){
  rect(x,y,w,h,'#dbe7e8');const scale=Math.min(w/photo.naturalWidth,h/photo.naturalHeight),pw=photo.naturalWidth*scale,ph=photo.naturalHeight*scale;
  c.filter=`brightness(${brightness}%) contrast(${contrast}%)`;c.drawImage(photo,x+(w-pw)/2,y+(h-ph)/2,pw,ph);c.filter='none';
 }
 function brand(x:number,y:number,width:number){c.drawImage(logo,x,y,width,width*logo.naturalHeight/logo.naturalWidth);}
 const headline=(templateText(t.headline,job)||job.service||'A better connection').toUpperCase();
 const subline=templateText(t.subline,job);
 rect(0,0,1080,height,white);
 if(t.layout==='editorial'){
  const top=130,bottom=height-88,left=compact?480:470;
  brand(34,28,310);text(t.label.toUpperCase(),590,48,450,55,24,teal);
  image(left,top,1080-left,bottom-top);
  rect(0,top,left,bottom-top,white);rect(38,top+24,72,8,teal);
  text(headline,38,top+58,left-76,(bottom-top)*.49,compact?43:62,ink);
  const sy=top+(bottom-top)*.64;
  text(subline,38,sy,left-76,80,compact?23:28,teal);
  if(job.mount)text(job.mount,38,sy+94,left-76,Math.max(35,bottom-sy-114),23,ink,false);
 }else if(t.layout==='spotlight'){
  const photoBottom=Math.round(height*.59);
  image(0,0,1080,photoBottom);
  rect(28,26,350,104,white);brand(42,36,322);
  rect(0,photoBottom,1080,height-photoBottom,ink);
  rect(38,photoBottom-24,Math.min(1004,Math.max(320,t.label.length*17+40)),54,teal);
  text(t.label.toUpperCase(),58,photoBottom-12,960,35,23,white);
  text(headline,38,photoBottom+55,1004,height-photoBottom-178,compact?45:68,white);
  text(subline,38,height-136,1004,43,26,accent);
 }else{
  const headingBottom=compact?225:Math.round(height*.31),foot=height-160;
  rect(0,0,1080,headingBottom,ink);
  text(t.label.toUpperCase(),38,28,1004,35,23,accent);
  text(headline,38,78,1004,headingBottom-96,compact?55:76,white);
  image(0,headingBottom,1080,foot-headingBottom);
  rect(0,foot,1080,72,teal);text(subline||'Let’s talk about your connection',38,foot+20,1004,43,26,white);
  // Original logo on an opaque white plate; never recoloured or redrawn.
  rect(730,headingBottom+18,324,96,white);brand(743,headingBottom+29,298);
 }
 rect(0,height-88,1080,88,t.layout==='spotlight'?ink:white);
 rect(38,height-87,1004,2,t.layout==='spotlight'?teal:'#c5dada');
 const color=t.layout==='spotlight'?white:ink;
 text('0408 559 555',38,height-57,360,36,27,color);
 text('vinconnect.com.au',665,height-57,380,36,27,color);
 if(total>1){rect(950,12,112,40,ink);text(`${index+1} / ${total}`,964,20,85,26,19,white);}
 c.textBaseline='alphabetic';c.textAlign='left';
}
