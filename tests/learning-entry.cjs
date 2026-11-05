/* Deterministic coverage for entering the classroom while signed out or offline. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:1366,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',route=>route.abort());
  let mode='ok'; const pending=[];
  await page.route('http://localhost:8000/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   if(path.startsWith('/learning/') && mode==='delay') await new Promise(resolve=>pending.push(resolve));
   if(path.startsWith('/learning/') && mode==='offline') return route.abort();
   if(path.startsWith('/learning/') && mode==='expired') return route.fulfill({status:401,json:{detail:'Expired'}});
   const data=path==='/learning/profile'?{role:'learner',bio:'',public:false}:path==='/auth/me'?{email:'entry@example.com',display_name:'Demo'}:[];
   await route.fulfill({json:data});
  });
  await page.goto('http://127.0.0.1:8080');
  // Open from a signed-out editor: the page must explain what to do, then resume after login.
  await page.evaluate(()=>hideAuthOverlay());
  await page.click('#learningNav');
  assert.equal(await page.locator('#authOverlay').isVisible(),true);
  assert.match(await page.locator('#learningRoot').textContent(),/Войдите в учебный кабинет/);
  await page.evaluate(()=>{localStorage.setItem('mentor_token','test-token');hideAuthOverlay();});
  await page.waitForSelector('#learningRole');
  assert.match(await page.locator('#learningRoot').textContent(),/Мои группы/);
  assert.equal(await page.locator('#learningNav i').count(),1);
  assert.match(await page.locator('#learningNavDescription').textContent(),/Группы и задания/);
  await page.selectOption('#localeSelect','uz');
  assert.equal(await page.locator('#learningNav i').count(),1);
  assert.match(await page.locator('#learningNavDescription').textContent(),/Guruhlar/);
  await page.selectOption('#localeSelect','ru');
  // An unavailable API must show a useful recovery screen instead of an empty panel.
  mode='offline';await page.click('#learningNav');
  await page.waitForSelector('.learning-state [data-action="home"]');
  assert.match(await page.locator('#learningRoot').textContent(),/Нет соединения/);
  mode='ok';await page.click('.learning-state [data-action="home"]');
  await page.waitForSelector('#learningRole');
  // An expired session must offer sign-in again.
  mode='expired';await page.click('#learningNav');
  await page.waitForSelector('#authOverlay', {state:'visible'});
  assert.match(await page.locator('#learningRoot').textContent(),/Войдите в учебный кабинет/);
  mode='ok';await page.evaluate(()=>{localStorage.setItem('mentor_token','new-token');hideAuthOverlay();});
  await page.waitForSelector('#learningRole');
  // Slow responses must show loading immediately, and must not reopen a closed classroom.
  mode='delay';await page.click('#learningNav');
  await page.waitForSelector('#learningRoot [role="status"]');
  assert.match(await page.locator('#learningRoot').textContent(),/Загружаем/);
  await page.evaluate(()=>window.LearningUI.close());
  mode='ok';
  pending.forEach(resolve=>resolve());
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#learningRoot').isVisible(),false);
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('PASS: sign-in recovery, navigation icon and RU/UZ labels, offline retry and loading state.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
