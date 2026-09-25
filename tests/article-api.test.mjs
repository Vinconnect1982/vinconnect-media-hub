import {test,beforeEach} from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {registerHooks} from "node:module";
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
let sqlite;
globalThis.__hubTest={user:null,db:null};
const hooks=registerHooks({
 resolve(s,c,next){
  if(s==="cloudflare:workers")return {url:"test:cloudflare",shortCircuit:true};
  if(s.endsWith("chatgpt-auth"))return {url:"test:auth",shortCircuit:true};
  if((s.startsWith(".")||s.startsWith("/"))&&c.parentURL){const u=new URL(s+".ts",c.parentURL);if(u.protocol==="file:"&&existsSync(fileURLToPath(u)))return next(u.href,c);}
  return next(s,c);
 },
 load(u,c,next){
  if(u==="test:cloudflare")return {format:"module",source:"export const env={get DB(){return globalThis.__hubTest.db}}",shortCircuit:true};
  if(u==="test:auth")return {format:"module",source:"export async function getChatGPTUser(){return globalThis.__hubTest.user}",shortCircuit:true};
  return next(u,c);
 }
});
const {GET,POST}=await import("../app/api/articles/route.ts");
beforeEach(()=>{
 sqlite?.close();sqlite=new DatabaseSync(":memory:");
 sqlite.exec(readFileSync(new URL("../drizzle/0000_superb_hawkeye.sql",import.meta.url),"utf8"));
 sqlite.exec(readFileSync(new URL("../drizzle/0003_outgoing_yellowjacket.sql",import.meta.url),"utf8"));
 sqlite.exec(readFileSync(new URL("../drizzle/0004_common_young_avengers.sql",import.meta.url),"utf8"));
 const db={prepare(sql){let args=[];return {bind(...values){args=values;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}},async batch(statements){sqlite.exec("BEGIN");try{const r=await Promise.all(statements.map(s=>s.run()));sqlite.exec("COMMIT");return r}catch(e){sqlite.exec("ROLLBACK");throw e}}};
 globalThis.__hubTest={user:{email:"destefano.vince1@gmail.com",userId:"test-owner"},db};
});
async function seed(){return (await (await GET()).json()).articles}
const id="vinconnect-article-01";
async function send(input,origin="https://hub.example"){return POST(new Request("https://hub.example/api/articles",{method:"POST",headers:origin?{"Origin":origin,"Content-Type":"application/json"}:{"Content-Type":"application/json"},body:JSON.stringify(input)}));}
test("anonymous drafts API rejects access",async()=>{globalThis.__hubTest.user=null;assert.equal((await GET()).status,401)});
test("non-owner drafts API rejects access",async()=>{globalThis.__hubTest.user={email:"stranger@example.com"};assert.equal((await GET()).status,403)});
test("anonymous mutation rejected",async()=>{globalThis.__hubTest.user=null;assert.equal((await send({id,action:"approve",revision:0})).status,401)});
test("nonowner mutation rejected",async()=>{globalThis.__hubTest.user={email:"stranger@example.com"};assert.equal((await send({id,action:"approve",revision:0})).status,403)});
test("cross-origin mutation rejected",async()=>{assert.equal((await send({id},"https://evil.example")).status,403)});
test("missing origin rejected",async()=>{assert.equal((await send({id},null)).status,403)});
test("first load creates exactly 15 pending articles",async()=>{const a=await seed();assert.equal(a.length,15);assert.ok(a.every(x=>x.status==="pending"&&x.revision===0))});
test("reloading does not duplicate or reset records",async()=>{await seed();await send({id,action:"approve",revision:0});const a=await seed();assert.equal(a.length,15);assert.equal(a[0].status,"approved")});
test("edit saves body and survives reload",async()=>{await seed();const body="This is a saved edited article for a real reload check.";assert.equal((await send({id,action:"save",revision:0,title:"Edited article",body})).status,200);assert.equal((await seed())[0].body,body)});
test("approval records authenticated approver and version",async()=>{await seed();await send({id,action:"approve",revision:0});const a=(await seed())[0];assert.equal(a.approved_by,"destefano.vince1@gmail.com");assert.equal(a.revision,1)});
test("approved edit revokes approval",async()=>{await seed();await send({id,action:"approve",revision:0});await send({id,action:"save",revision:1,title:"Changed approved title",body:"This changed body needs fresh approval before publication."});const a=(await seed())[0];assert.equal(a.status,"pending");assert.equal(a.approved_by,null)});
test("pending cannot publish",async()=>{await seed();assert.equal((await send({id,action:"publish",channel:"hub",revision:0})).status,409);assert.equal((await seed())[0].status,"pending")});
test("unsupported channel does not fake publication",async()=>{await seed();await send({id,action:"approve",revision:0});assert.equal((await send({id,action:"publish",channel:"facebook",revision:1})).status,422);assert.equal((await seed())[0].status,"approved")});
test("Hub publication stores URL and timestamp",async()=>{await seed();await send({id,action:"approve",revision:0});assert.equal((await send({id,action:"publish",channel:"hub",revision:1})).status,200);const a=(await seed())[0];assert.equal(a.status,"published");assert.equal(a.published_url,"/articles/"+id);assert.ok(Date.parse(a.published_at))});
test("duplicate publication is rejected",async()=>{await seed();await send({id,action:"approve",revision:0});await send({id,action:"publish",channel:"hub",revision:1});assert.equal((await send({id,action:"publish",channel:"hub",revision:2})).status,409)});
test("stale browser cannot overwrite newer edit",async()=>{await seed();await send({id,action:"approve",revision:0});assert.equal((await send({id,action:"save",revision:0,title:"Stale title",body:"Stale body should not overwrite new content."})).status,409)});
test("SQL-looking id rejected",async()=>{assert.equal((await send({id:"' OR 1=1 --",action:"approve",revision:0})).status,400)});
test("unknown article returns 404",async()=>{await seed();assert.equal((await send({id:"vinconnect-article-99",action:"approve",revision:0})).status,404)});
test("bad JSON rejected",async()=>{const r=await POST(new Request("https://hub.example/api/articles",{method:"POST",headers:{Origin:"https://hub.example"},body:"{"}));assert.equal(r.status,400)});
test("oversize body rejected",async()=>{assert.equal((await send({id,payload:"x".repeat(100001)})).status,413)});
test("HTML-looking draft remains text in persistence",async()=>{await seed();const body="<script>alert('no execution')</script> Plain article copy.";await send({id,revision:0,action:"save",title:"Plain text test",body});assert.equal((await seed())[0].body,body)});
test("drafts responses are not cacheable",async()=>{assert.match((await GET()).headers.get("cache-control"),/no-store/)});

const templatesApi=await import('../app/api/brand-templates/route.ts');
const {defaultTemplate,brandTemplate,templateText}=await import('../lib/brand-templates.ts');
const {jobDetails,emptyJob}=await import('../lib/install-content.ts');
function templateRequest(data,origin='https://hub.example'){return new Request('https://hub.example/api/brand-templates',{method:'POST',headers:{Origin:origin},body:JSON.stringify(data)});}
test('saved masks persist and return their complete settings',async()=>{const settings={...defaultTemplate,layout:'teal',format:'square'};const saved=await templatesApi.POST(templateRequest({name:'Local installs',settings}));assert.equal(saved.status,200);const rows=(await (await templatesApi.GET()).json()).templates;assert.equal(rows.length,1);assert.deepEqual(rows[0].settings,settings);});
test('template API rejects anonymous reads and writes',async()=>{globalThis.__hubTest.user=null;assert.equal((await templatesApi.GET()).status,403);assert.equal((await templatesApi.POST(templateRequest({}))).status,403);});
test('template API rejects another signed-in user',async()=>{globalThis.__hubTest.user={email:'other@example.com'};assert.equal((await templatesApi.GET()).status,403);});
test('template API rejects cross-origin writes',async()=>{assert.equal((await templatesApi.POST(templateRequest({name:'Bad',settings:defaultTemplate},'https://other.example'))).status,403);});
test('invalid template does not create a saved mask',async()=>{assert.equal((await templatesApi.POST(templateRequest({name:'Bad',settings:{...defaultTemplate,headline:'{secret}'}}))).status,400);assert.equal((await (await templatesApi.GET()).json()).templates.length,0);});
test('old installation details remain valid without mask settings',()=>assert.deepEqual(jobDetails(emptyJob),emptyJob));
test('saved job keeps a snapshot of the selected mask',()=>{const mask={...defaultTemplate,layout:'white'};const job=jobDetails({...emptyJob,brand:mask});mask.layout='teal';assert.equal(job.brand.layout,'white');});
test('template fields substitute text without recursion',()=>assert.equal(templateText('{suburb} · {service}',{headline:'',suburb:'Nyora',service:'Starlink'}),'Nyora · Starlink'));
test('empty suburb does not leave a leading separator',()=>assert.equal(templateText('{suburb} · {service}',{headline:'',suburb:'',service:'Starlink'}),'Starlink'));
test('arbitrary layouts and long labels rejected',()=>{assert.throws(()=>brandTemplate({...defaultTemplate,layout:'external'}));assert.throws(()=>brandTemplate({...defaultTemplate,label:'x'.repeat(41)}));});

test('saved template can be edited without changing its id',async()=>{const original=(await (await templatesApi.POST(templateRequest({name:'Original',settings:defaultTemplate}))).json()).template;const r=await templatesApi.PATCH(templateRequest({...original,name:'Updated'}));assert.equal(r.status,200);const rows=(await (await templatesApi.GET()).json()).templates;assert.equal(rows[0].name,'Updated');assert.equal(rows[0].id,original.id);});
test('stale template edit is rejected',async()=>{const original=(await (await templatesApi.POST(templateRequest({name:'Original',settings:defaultTemplate}))).json()).template;assert.equal((await templatesApi.PATCH(templateRequest({...original,updatedAt:'old',name:'Stale'}))).status,409);});
test('delete removes saved template and cannot repeat',async()=>{const original=(await (await templatesApi.POST(templateRequest({name:'Original',settings:defaultTemplate}))).json()).template;assert.equal((await templatesApi.DELETE(templateRequest(original))).status,200);assert.equal((await templatesApi.GET()).status,200);assert.equal((await templatesApi.DELETE(templateRequest(original))).status,409);});
test('template deletion rejects cross origin and anonymous',async()=>{assert.equal((await templatesApi.DELETE(templateRequest({},'https://bad.example'))).status,403);globalThis.__hubTest.user=null;assert.equal((await templatesApi.DELETE(templateRequest({}))).status,403);});

test('business email can read and manage shared templates',async()=>{globalThis.__hubTest.user={email:'vince@vinconnect.com.au'};assert.equal((await templatesApi.GET()).status,200);assert.equal((await templatesApi.POST(templateRequest({name:'Business template',settings:{...defaultTemplate,type:'Company & community',format:'landscape'}}))).status,200);});
test('custom template types and landscape survive reload',async()=>{const settings={...defaultTemplate,type:'Customer stories',format:'landscape'};await templatesApi.POST(templateRequest({name:'Stories',settings}));assert.deepEqual((await (await templatesApi.GET()).json()).templates[0].settings,settings);});
test('blank and overlong custom types are rejected',()=>{assert.throws(()=>brandTemplate({...defaultTemplate,type:' '}));assert.throws(()=>brandTemplate({...defaultTemplate,type:'a'.repeat(61)}));});
test('immediate repeated edit cannot reuse a previous timestamp',async()=>{const original=(await (await templatesApi.POST(templateRequest({name:'Original',settings:defaultTemplate}))).json()).template;const next=await templatesApi.PATCH(templateRequest({...original,name:'Next'}));assert.equal(next.status,200);assert.equal((await templatesApi.PATCH(templateRequest({...original,name:'Stale'}))).status,409);});
