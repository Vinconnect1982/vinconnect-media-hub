import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s==='./publishing-errors')return next(new URL('../lib/publishing-errors.ts',import.meta.url).href,c);return next(s,c);}});
const {safePostUrl,publicationReceipt,providerPayload}=await import('../lib/publication.ts');
test('provider links reject credentials and foreign hosts',()=>{for(const u of ['javascript:alert(1)','http://facebook.com/1','https://facebook.com.evil.example/','https://name:pass@facebook.com/1','https://facebook.com/1?access_token=secret'])assert.equal(safePostUrl(u,'facebook_organic'),null)});
test('Instagram ID alone does not fabricate a permalink',()=>{const r=publicationReceipt({id:'123'},'instagram');assert.equal(r.postUrl,null);assert.equal(r.providerId,'123')});
test('structured Facebook receipt retains returned URL',()=>{const r=publicationReceipt({result:{post_id:'123_456',permalink:'https://www.facebook.com/123/posts/456'}},'facebook_organic');assert.equal(r.postUrl,'https://www.facebook.com/123/posts/456')});
test('Instagram permalink is preserved',()=>{assert.equal(publicationReceipt({id:'123',permalink:'https://www.instagram.com/p/abc/'},'instagram').postUrl,'https://www.instagram.com/p/abc/')});
test('failure message cannot be treated as publication',()=>{assert.throws(()=>publicationReceipt({result:'Post creation failed: permission denied'},'instagram'))});
test('text MCP payload unwraps JSON result',()=>{assert.deepEqual(providerPayload({content:[{type:'text',text:'{"result":"published"}'}]}),{result:'published'})});

for(const payload of [{result:'Post could not be published'},{success:false,id:'123'},{result:'Unsuccessful: permission missing; post id: 123'},{result:{success:false,id:'123'}}])test('negative receipt is never success: '+JSON.stringify(payload),()=>assert.throws(()=>publicationReceipt(payload,'facebook_organic')));
test('known permission denial is preserved and typed',()=>assert.throws(()=>publicationReceipt({result:'(#200) pages_manage_posts permission is required'},'facebook_organic'),{name:'PublishingPermissionError'}));
test('sensitive URL query parameters rejected',()=>assert.equal(safePostUrl('https://facebook.com/123?API_KEY=secret','facebook_organic'),null));
