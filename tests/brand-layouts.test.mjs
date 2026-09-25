import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
registerHooks({resolve(s,c,next){if(s.startsWith('.')&&c.parentURL){const u=new URL(s+'.ts',c.parentURL);if(existsSync(fileURLToPath(u)))return next(u.href,c);}return next(s,c);}});
const {drawFeatureLayout}=await import('../lib/brand-layouts.ts');
const {brandTemplate,defaultTemplate}=await import('../lib/brand-templates.ts');
for(const layout of ['spotlight','editorial','campaign'])for(const [format,height] of [['portrait',1350],['square',1080],['landscape',720]])test(`${layout} ${format} preserves photos and exports contact details`,()=>{
 const images=[],texts=[];const c={font:'',filter:'none',fillRect(){},drawImage(...args){images.push(args)},fillText(...args){texts.push(args)},measureText(s){return {width:s.length*(parseFloat(this.font.match(/(\d+)px/)?.[1]||'24'))*.55}}};
 const photo={naturalWidth:800,naturalHeight:1400},logo={naturalWidth:1167,naturalHeight:296};
 const t=brandTemplate({...defaultTemplate,layout,format});
 drawFeatureLayout(c,photo,logo,t,{headline:'An installation with a longer headline to check wrapping',service:'Starlink installation',suburb:'Nyora',mount:'Customer supplied mount'},height,100,100,0,2);
 for(const [img,x,y,w,h] of images){assert.ok(x>=0&&y>=0&&x+w<=1080.01&&y+h<=height+.01);assert.ok(Math.abs(w/h-img.naturalWidth/img.naturalHeight)<.0001,'image must not stretch or crop');}
 assert.equal(images.filter(a=>a[0]===photo).length,1);
 assert.ok(texts.some(a=>a[0]==='0408 559 555'));assert.ok(texts.some(a=>a[0]==='vinconnect.com.au'));assert.ok(texts.some(a=>a[0]==='1 / 2'));
 for(const [,x,y,w] of texts)assert.ok(x>=0&&y>=0&&x+w<=1080&&y<height);
 assert.equal(c.filter,'none');
});
const {builtInTemplates,postTypes}=await import('../lib/brand-templates.ts');
const {drawPremium}=await import('../lib/brand-premium.ts');
const {drawCollection}=await import('../lib/brand-collection.ts');
const {collectionById,collectionDesigns}=await import('../lib/template-collection.ts');
test('55 distinct presets, eleven in each category, all valid for saving',()=>{
 assert.equal(builtInTemplates.length,55);assert.equal(new Set(builtInTemplates.map(t=>t.settings.layout)).size,55);
 for(const type of postTypes)assert.equal(builtInTemplates.filter(t=>t.settings.type===type).length,11);
 for(const t of builtInTemplates)assert.deepEqual(brandTemplate(t.settings),t.settings);
});
for(const preset of builtInTemplates)for(const height of [720,1080,1350])test(`${preset.id}: ${height}px export preserves image proportions and contact details`,()=>{
 const images=[],texts=[];const c={font:'',filter:'none',createLinearGradient(){return {addColorStop(){}}},quadraticCurveTo(){},save(){},restore(){},translate(){},scale(){},beginPath(){},lineTo(){},moveTo(){},closePath(){},fill(){},arc(){},stroke(){},fillRect(){},drawImage(...a){images.push(a)},fillText(...a){texts.push(a)},measureText(s){return {width:s.length*Number(this.font.match(/(\d+)px/)?.[1]||24)*.55}}};
 const photo={naturalWidth:800,naturalHeight:1400},logo={naturalWidth:1167,naturalHeight:296};
 (collectionById.has(preset.settings.layout)?drawCollection:drawPremium)(c,photo,logo,preset.settings,{headline:'A detailed installation story with long text to verify wrapping safely',service:'Starlink & Wi-Fi',suburb:'Nyora',mount:'Property connection planning',graphicBadge:'Actual verified result',graphicFeatures:'Fascia mount\nShed link'},height,90,110,[{image:{naturalWidth:1600,naturalHeight:900},brightness:100,contrast:100},{image:{naturalWidth:900,naturalHeight:1600},brightness:100,contrast:100}]);
 assert.equal(images.filter(a=>a[0]===photo).length,1);
 for(const args of images){const [img]=args;const [x,y,w,h]=args.slice(-4);assert.ok(x>=0&&y>=0&&x+w<=1080.01&&y+h<=height+.01);if(args.length===9){const [,sx,sy,sw,sh]=args;assert.ok(sx>=-.001&&sy>=-.001&&sx+sw<=img.naturalWidth+.001&&sy+sh<=img.naturalHeight+.001);assert.ok(Math.abs(w/h-sw/sh)<.0001);}else assert.ok(Math.abs(w/h-img.naturalWidth/img.naturalHeight)<.0001);}
 assert.ok(texts.some(a=>a[0]==='0408 559 555'));assert.ok(texts.some(a=>a[0]==='vinconnect.com.au'));assert.equal(c.filter,'none');
});

const {jobDetails,emptyJob}=await import('../lib/install-content.ts');
test('graphic feature lines and badge text survive validation without invented defaults',()=>{const j=jobDetails({...emptyJob,graphicFeatures:'Fascia mount\nShed link',graphicBadge:'Shed Wi-Fi'});assert.equal(j.graphicFeatures,'Fascia mount\nShed link');assert.equal(j.graphicBadge,'Shed Wi-Fi');assert.equal(jobDetails(emptyJob).graphicBadge,undefined);assert.throws(()=>jobDetails({...emptyJob,graphicBadge:'x'.repeat(61)}));});
test('photo framing settings round-trip and reject invalid values',()=>{for(const photoFit of ['fill','contain'])assert.equal(brandTemplate({...defaultTemplate,photoFit}).photoFit,photoFit);assert.throws(()=>brandTemplate({...defaultTemplate,photoFit:'stretch'}));});

test('combined collections have eight named designs per category',()=>{assert.equal(collectionDesigns.length,40);assert.equal(new Set(collectionDesigns.map(d=>d.name)).size,40);for(const type of postTypes)assert.equal(collectionDesigns.filter(d=>d.category===type).length,8);});
