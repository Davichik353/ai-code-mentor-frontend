const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const p=await b.newPage();await p.route('http://localhost:8000/**',r=>r.fulfill({json:{email:'test@example.com'}}));
await p.goto('http://127.0.0.1:8080');await p.waitForSelector('.welcome-intro');await p.screenshot({path:'/tmp/welcome-desktop.png'});assert(!(await p.locator('#authOverlay').isVisible()));await p.click('.welcome-skip');assert(await p.locator('#authOverlay').isVisible());assert.equal(await p.locator('.welcome-intro').count(),0);
await p.reload();assert.equal(await p.locator('.welcome-intro').count(),0);
await p.evaluate(()=>sessionStorage.clear());await p.reload();await p.waitForSelector('.welcome-intro');await p.setViewportSize({width:390,height:844});await p.screenshot({path:'/tmp/welcome-mobile.png'});await p.keyboard.press('Escape');assert(await p.locator('#authOverlay').isVisible());
await p.evaluate(()=>sessionStorage.clear());await p.emulateMedia({reducedMotion:'reduce'});await p.reload();assert.equal(await p.locator('.welcome-intro').count(),0);
await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>sessionStorage.clear());await p.route('**/assets/welcome-awe.mp4',r=>r.abort());await p.reload();await p.waitForFunction(()=>!document.documentElement.classList.contains('welcome-pending'));assert(await p.locator('#authOverlay').isVisible());
await p.unroute('**/assets/welcome-awe.mp4');await p.evaluate(()=>sessionStorage.clear());await p.reload();await p.waitForSelector('.welcome-intro');await p.waitForSelector('.welcome-intro',{state:'detached',timeout:10000});assert(await p.locator('#authOverlay').isVisible());
await p.evaluate(()=>{sessionStorage.clear();localStorage.setItem('mentor_token','test')});await p.reload();assert.equal(await p.locator('.welcome-intro').count(),0);
console.log('PASS skip, Escape, once per session, reduced motion, failed media, automatic completion, signed-in bypass');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
