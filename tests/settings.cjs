/* UI checks use a controlled API so they never modify a production account. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let name='Demo';let fail=false;let exported=0;let deletes=0;
  await page.route('https://**/*',r=>r.abort());
  await page.route('http://localhost:8000/**',async route=>{
   const request=route.request(),path=new URL(request.url()).pathname;
   if(path==='/auth/me'&&fail)return route.abort();
   if(path==='/auth/profile'){assert.equal(request.method(),'PATCH');name=request.postDataJSON().display_name;}
   if(path==='/auth/account')deletes++;
   if(path==='/history')exported++;
   let data={};
   if(['/auth/me','/auth/profile'].includes(path))data={id:'demo',email:'demo@example.com',display_name:name,created_at:'2026-11-01T00:00:00'};
   else if(path==='/learning/profile')data={role:'learner',can_teach:false};
   else if(path.startsWith('/learning/'))data=[];
   else if(path==='/history')data={analyses:[{id:'one',filename:'example.py'}]};
   await route.fulfill({json:data});
  });
  await page.addInitScript(()=>localStorage.setItem('mentor_token','settings-test-token'));
  await page.goto('http://127.0.0.1:8080/app.html');await page.waitForFunction(()=>document.getElementById('authOverlay').style.display==='none');
  await page.click('#settingsNav');await page.waitForSelector('#settingsName');
  assert.equal(await page.locator('.main > .content').isVisible(),false);
  assert.match(await page.locator('.header h1').textContent(),/Настройки/);
  assert.equal(await page.locator('#settingsEmail').getAttribute('readonly'),'');
  await page.fill('#settingsName','Новое имя');await page.selectOption('#settingsLocale','uz');
  await page.selectOption('#settingsTheme','light');await page.selectOption('#settingsLanguage','JavaScript');
  await page.selectOption('#settingsFontSize','18');await page.check('#settingsAutoSave');await page.click('#settingsSaveButton');
  await page.waitForFunction(()=>document.querySelector('#settingsMessage').textContent.includes('saqlandi'));
  assert.equal(name,'Новое имя');assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('light-mode')),true);
  assert.equal(await page.locator('#languageSelect').inputValue(),'JavaScript');
  assert.match(await page.locator('#codeInput').evaluate(el=>getComputedStyle(el).fontSize),/18px/);
  await page.reload();await page.click('#settingsNav');await page.waitForSelector('#settingsName');
  assert.equal(await page.locator('#settingsName').inputValue(),'Новое имя');assert.equal(await page.locator('#settingsLocale').inputValue(),'uz');
  assert.equal(await page.locator('#settingsAutoSave').isChecked(),true);
  const downloadPromise=page.waitForEvent('download');await page.click('[data-settings-action="export"]');
  assert.equal((await downloadPromise).suggestedFilename(),'ai-code-mentor-history.json');assert.ok(exported>0);
  await page.click('[data-settings-action="recover"]');assert.equal(await page.locator('#recoveryEmail').inputValue(),'demo@example.com');
  await page.click('#recoveryBack');await page.evaluate(()=>hideAuthOverlay());
  page.once('dialog',dialog=>dialog.dismiss());await page.click('[data-settings-action="delete"]');assert.equal(deletes,0);
  await page.click('#learningNav');await page.waitForSelector('#joinCode');
  assert.equal(await page.locator('#settingsRoot').isVisible(),false);
  await page.click('#settingsNav');await page.waitForSelector('#settingsName');
  await page.click('.new-analysis-button');assert.equal(await page.locator('#settingsRoot').isVisible(),false);assert.equal(await page.locator('.main > .content').isVisible(),true);
  fail=true;await page.click('#settingsNav');await page.waitForSelector('[data-settings-action="retry"]');
  fail=false;await page.click('[data-settings-action="retry"]');await page.waitForSelector('#settingsName');
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: dedicated settings, profile save, RU/UZ, preference persistence, export, recovery, cancelled deletion, navigation, retry and mobile width.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
