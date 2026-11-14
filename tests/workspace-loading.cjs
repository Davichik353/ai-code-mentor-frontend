const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const page=await browser.newPage();let release;const gate=new Promise(r=>release=r);await page.addInitScript(()=>localStorage.setItem('mentor_token','test'));
await page.route('http://localhost:8000/**',async r=>{const p=new URL(r.request().url()).pathname;if(p.startsWith('/learning/'))await gate;await r.fulfill({json:p==='/learning/profile'?{role:'learner'}:p==='/auth/me'?{email:'demo@example.com'}:[]});});
await page.goto('http://127.0.0.1:8080/app.html');await page.click('#learningNav');await page.waitForSelector('.workspace-loading');
assert.equal(await page.locator('#learningRoot').getAttribute('aria-busy'),'true');await page.screenshot({path:'/tmp/workspace-loader-desktop.png'});
await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/workspace-loader-mobile.png'});
await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.loading-code-mark i').evaluate(e=>getComputedStyle(e).animationName),'none');
release();await page.waitForSelector('#learningRole');assert.equal(await page.locator('.workspace-loading').count(),0);console.log('PASS responsive loading, reduced motion, removal on completion');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
