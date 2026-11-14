const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const p=await b.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('http://localhost:8000/**',r=>r.fulfill({json:[]}));
await p.goto('http://127.0.0.1:8080');assert.equal(await p.locator('.welcome-intro,#authOverlay').count(),0);assert.equal(await p.locator('main').count(),1);await p.screenshot({path:'/tmp/convex-landing-desktop.png',fullPage:true});
await p.click('#tab-feedback');assert(await p.locator('#feature-feedback').isVisible());assert(!(await p.locator('#feature-code').isVisible()));await p.keyboard.press('ArrowRight');assert(await p.locator('#feature-defense').isVisible());
await p.click('#landingLocale');assert.equal(await p.locator('html').getAttribute('lang'),'uz');assert((await p.locator('h1').innerText()).includes('YOZ'));await p.reload();assert.equal(await p.locator('html').getAttribute('lang'),'uz');await p.click('#landingLocale');
await p.locator('.faq summary').first().click();assert(await p.locator('.faq details').first().evaluate(e=>e.open));
for(const w of [320,390,768,1024]){await p.setViewportSize({width:w,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${w}`);}
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'/tmp/convex-landing-mobile.png',fullPage:true});await p.locator('.hero-actions a[href="app.html"]').click();await p.waitForSelector('#authOverlay');assert(p.url().endsWith('/app.html'));
await p.goto('http://127.0.0.1:8080/#reset=test-token');await p.waitForURL('**/app.html*');await p.waitForSelector('#recoveryPanel');assert(await p.locator('#recoveryPanel').isVisible());
await p.goto('http://127.0.0.1:8080/?portfolio=sample');await p.waitForURL('**/app.html?portfolio=sample');
assert.deepEqual(errors,[]);console.log('PASS landing desktop/mobile, tabs and keyboard, locale persistence, FAQ, app CTA, recovery and portfolio links');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
