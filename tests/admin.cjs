const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const p=await browser.newPage({viewport:{width:390,height:844}});let isAdmin=true,blocked=false,saved;const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>localStorage.setItem('mentor_token','a.'+btoa(JSON.stringify({sub:'admin'}))+'.c'));
await p.route('http://localhost:8000/**',r=>{const path=new URL(r.request().url()).pathname;let data=[];
if(path==='/auth/me')data={id:'admin',email:'admin@example.com'};
if(path==='/admin/access')data={is_admin:isAdmin};
if(path==='/admin/users')data={total:1,users:[{id:'u',email:'student@example.com',display_name:'Ученик',email_verified:1,blocked}]};
if(path.endsWith('/block')){blocked=r.request().postDataJSON().blocked;data={blocked};}
if(path==='/admin/classrooms')data={schools:[],groups:[{id:'g',title:'Python',teacher_email:'teacher@example.com',member_count:3,archived:false}],totals:{schools:0,groups:1}};
if(path==='/admin/ai'){if(r.request().method()==='POST')saved=r.request().postDataJSON();data={settings:saved||{enabled:true,per_user:20,total:200},usage:[],analyses_used:0,today:'2026-11-14'};}
if(path==='/admin/system')data={health:{status:'healthy',checks:{database:{status:'ok'}}},backup:null,errors:[],audit:[],judge_configured:false};
return r.fulfill({json:data});});
await p.goto('http://127.0.0.1:8080/app.html');await p.click('#adminNav');await p.waitForSelector('#adminBody article');await p.click('#adminBody summary');await p.fill('[name=reason]','Проверка блокировки');p.once('dialog',d=>d.accept());await p.click('[data-form=block] button');await p.waitForFunction(()=>document.querySelector('#adminBody').textContent.includes('Доступ заблокирован'));assert(blocked);
await p.click('[data-tab=classrooms]');await p.click('#adminBody summary');await p.waitForSelector('[data-form=teacher]');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await p.click('[data-tab=ai]');await p.fill('[name=per_user]','5');await p.fill('[name=total]','50');await p.click('[data-form=ai] button');await p.waitForFunction(()=>document.querySelector('#adminMessage').textContent.includes('сохранены'));assert.deepEqual(saved,{enabled:true,per_user:5,total:50});
await p.click('[data-tab=system]');await p.waitForFunction(()=>document.querySelector('#adminBody').textContent.includes('Нет подтверждённого'));await p.waitForFunction(()=>getComputedStyle(document.querySelector('[data-tab=system]')).backgroundColor==='rgb(41, 37, 31)');await p.screenshot({path:'/tmp/admin-mobile.png'});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await p.click('#adminDialog [data-close]');isAdmin=false;await p.reload();await p.waitForTimeout(300);assert(await p.locator('#adminNav').isHidden());assert.deepEqual(errors,[]);console.log('PASS admin permissions UI, blocking, classroom transfer controls, AI settings, system unknown-backup and mobile');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
