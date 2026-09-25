import {collectionDesigns} from './template-collection';
export const postTypes=['Installations','Information & blogs','Company & community','Marketing','Advertising'];
export type BrandTemplate={layout:'classic'|'white'|'teal'|'spotlight'|'editorial'|'campaign'|typeof designLayouts[number][0];format:'portrait'|'square'|'landscape';type?:string;photoFit?:'fill'|'contain';headline:string;subline:string;label:string};
export const defaultTemplate:BrandTemplate={layout:'install-hero',format:'portrait',headline:'{headline}',subline:'{suburb} · {service}',label:'ON THE TOOLS'};
export const originalLayouts=[
 ['install-hero','Installation hero','Installations','RECENT INSTALL','portrait'],
 ['install-editorial','Installation journal','Installations','ON SITE','portrait'],
 ['install-location','Local installation','Installations','LOCAL INSTALLATIONS','square'],
 ['info-guide','The practical guide','Information & blogs','GOOD TO KNOW','portrait'],
 ['info-question','Question & answer','Information & blogs','CONNECTION QUESTIONS','square'],
 ['info-cover','Article cover','Information & blogs','VINCONNECT EXPLAINS','landscape'],
 ['company-story','Our local story','Company & community','BEHIND THE CONNECTION','portrait'],
 ['company-update','Company announcement','Company & community','VINCONNECT NEWS','square'],
 ['company-people','People & community','Company & community','IN OUR COMMUNITY','portrait'],
 ['marketing-rural','Rural connections','Marketing','YOUR PLACE. CONNECTED.','square'],
 ['marketing-lifestyle','Connected lifestyles','Marketing','MAKE ROOM FOR CONNECTION','portrait'],
 ['marketing-service','Service spotlight','Marketing','EXPLORE THE POSSIBILITIES','landscape'],
 ['ad-bold','Bold service advert','Advertising','LET’S GET CONNECTED','portrait'],
 ['ad-local','Local service advert','Advertising','YOUR LOCAL VINCONNECT','square'],
 ['ad-clean','Clean campaign','Advertising','TALK TO VINCONNECT','landscape'],
] as const;
export const designLayouts=[...collectionDesigns.map(d=>[d.id,d.name,d.category,d.label,d.format] as const),...originalLayouts] as const;
export const builtInTemplates=designLayouts.map(([id,name,type,label,format])=>({id,name,settings:{...defaultTemplate,layout:id,type,label,format,subline:type==='Installations'?'{suburb} · {service}':'{service}'}}));
export function brandTemplate(raw:unknown):BrandTemplate{
 if(raw===undefined)return {...defaultTemplate};
 if(!raw||typeof raw!=='object')throw Error('Invalid brand template.');
 const p=raw as Record<string,unknown>;
 if(!(['classic','white','teal','spotlight','editorial','campaign',...designLayouts.map(d=>d[0])] as string[]).includes(String(p.layout))||!['portrait','square','landscape'].includes(String(p.format)))throw Error('Choose a valid layout and format.');
 for(const [key,max] of [['headline',140],['subline',140],['label',40]] as const){if(typeof p[key]!=='string'||p[key].length>max)throw Error('Check template text lengths.');for(const token of p[key].match(/\{[^}]*\}/g)||[])if(!['{headline}','{suburb}','{service}'].includes(token))throw Error('Use only {headline}, {suburb} or {service} in templates.');}
 if(p.photoFit!==undefined&&!['fill','contain'].includes(String(p.photoFit)))throw Error('Choose a valid photo framing.');
 if(p.type!==undefined&&(typeof p.type!=='string'||!p.type.trim()||p.type.length>60))throw Error('Post type must be between 1 and 60 characters.');
 return {...(p.photoFit?{photoFit:p.photoFit as 'fill'|'contain'}:{}),...(p.type!==undefined?{type:(p.type as string).trim()}:{}),layout:p.layout as BrandTemplate['layout'],format:p.format as BrandTemplate['format'],headline:(p.headline as string).trim(),subline:(p.subline as string).trim(),label:(p.label as string).trim()};
}
export function templateText(pattern:string,job:{headline:string;suburb:string;service:string}){return pattern.replace(/\{(headline|suburb|service)\}/g,(_,key:keyof typeof job)=>job[key]).replace(/^\s*·\s*|\s*·\s*$/g,'').trim();}
