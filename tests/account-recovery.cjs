const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());
  let calls=[];let status=200;
  await page.route('http://localhost:8000/**',route=>{
   const path=new URL(route.request().url()).pathname;
   if(path.includes('password')) {
    calls.push({path,data:route.request().postDataJSON()});
    return route.fulfill({status,json:{message:'Accepted'}});
   }
   return route.fulfill({json:{}});
  });
  await page.goto('http://127.0.0.1:8080');
  await page.click('#forgotPassword');await page.fill('#recoveryEmail','student@example.com');
  await page.click('#recoverySubmit');await page.waitForFunction(()=>document.querySelector('#recoveryMessage').textContent.includes('Если аккаунт'));
  assert.equal(calls[0].path,'/auth/forgot-password');
  status=503;await page.click('#recoverySubmit');await page.waitForFunction(()=>document.querySelector('#recoveryMessage').textContent.includes('недоступна'));
  await page.click('#recoveryBack');assert.equal(await page.locator('#authSubmit').isVisible(),true);
  status=200;const token='temporary-test-token-for-browser-check-only';
  await page.goto('http://127.0.0.1:8080/#reset='+token);
  await page.waitForFunction(()=>location.hash==='');
  assert.equal(new URL(page.url()).hash,'');
  assert.equal(await page.locator('#recoveryPassword').isVisible(),true);
  assert.equal(await page.locator('#recoveryEmail').isVisible(),false);
  await page.fill('#recoveryPassword','New-Test-Password1!');await page.click('#recoverySubmit');
  await page.waitForFunction(()=>document.querySelector('#recoveryMessage').textContent.includes('Пароль изменён'));
  assert.equal(calls.at(-1).data.token,token);
  await page.click('#recoveryBack');await page.click('#forgotPassword');
  assert.equal(await page.locator('#recoveryForm').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: recovery request, unavailable mail, reset fragment removal, password submission and return to sign-in');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
