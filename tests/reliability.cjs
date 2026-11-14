const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:390,height:844}});let tickets=[],staff=false,sent;const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('mentor_token','a.'+btoa(JSON.stringify({sub:'user1'}))+'.c'));
await page.route('http://localhost:8000/**',r=>{const path=new URL(r.request().url()).pathname;let data=[];
if(path==='/auth/me')data={id:'user1',email:'user@example.com'};
if(path==='/support/tickets'&&r.request().method()==='GET')data={is_staff:staff,tickets};
if(path==='/support/tickets'&&r.request().method()==='POST'){sent=r.request().postDataJSON();tickets=[{...sent,id:'ticket123456',status:'open'}];data={id:'ticket123456'};}
if(path.endsWith('/reply')){Object.assign(tickets[0],r.request().postDataJSON());data={};}
return r.fulfill({json:data});});
await page.goto('http://127.0.0.1:8080/app.html');await page.fill('#codeInput','print("recover me")');await page.waitForFunction(()=>document.querySelector('#editorDraftState').textContent.includes('сохранён'));await page.reload();assert.equal(await page.inputValue('#codeInput'),'');await page.click('#restoreEditorDraft');await page.click('[data-restore]');assert.equal(await page.inputValue('#codeInput'),'print("recover me")');
await page.click('#supportNav');await page.fill('#supportForm textarea','Не могу открыть своё задание в группе');await page.click('#supportForm [type=submit]');await page.waitForSelector('.support-ticket');assert.equal(sent.diagnostics,null);assert(!JSON.stringify(sent).includes('recover me'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.click('#supportDialog [data-close]');staff=true;await page.click('#supportNav');await page.click('.support-ticket summary');await page.fill('[data-ticket] textarea','Откройте группу и нажмите кнопку обновления.');await page.click('[data-ticket] button');await page.waitForSelector('.support-reply');assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/support-mobile.png'});console.log('PASS editor recovery, mobile support, private payload and staff reply');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
