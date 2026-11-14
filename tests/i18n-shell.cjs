/* Application labels switch RU/UZ while model responses, user content and code remain intact. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());
  await page.addInitScript(()=>localStorage.setItem('mentor_token','i18n-test-token'));
  await page.route('http://localhost:8000/**',r=>{
   const path=new URL(r.request().url()).pathname;
   const data=path==='/auth/me'?{id:'demo',email:'demo@example.com',display_name:'Alice',level:3,xp_current:5,xp_needed:1000}:
    path==='/history'?{analyses:[],total:0}:
    path==='/progress'?{average_score:0,total_analyses:0,score_trend:[]}:
    path==='/stats'?{average_score:0,total_analyses:0,best_score:0}:{};
   return r.fulfill({json:data});
  });
  await page.goto('http://127.0.0.1:8080/app.html');
  await page.waitForFunction(()=>document.getElementById('authOverlay').style.display==='none');
  await page.waitForFunction(()=>document.querySelector('.step-pill').textContent.includes('Шаг'));
  assert.match(await page.locator('.hint-footer').first().textContent(),/Подсказки/);
  assert.match(await page.locator('#userLevel').textContent(),/Уровень 3/);
  await page.click('[onclick="changeHint(1)"]');
  await page.waitForFunction(()=>document.getElementById('railHint').textContent.includes('Сначала проанализируйте'));
  await page.evaluate(()=>{
   document.getElementById('codeInput').value='console.log("Critical");';
   document.getElementById('executionOutput').textContent='Critical';
   document.querySelector('.step-pill').textContent='Step 2 of 5';
   window.SettingsUI?.close?.();
   displayResults({score:80,summary:'Good',mentor_hints:[{hint:'MODEL_HINT_1',guide:'MODEL_GUIDE'},{hint:'MODEL_HINT_2',guide:'MODEL_GUIDE'}],feedback:{critical:[{issue:'Open',explanation:'Critical'}],improvements:[],learning:[],good:[]}});
  });
  await page.waitForFunction(()=>document.querySelector('#resultsContainer .result-badge')?.textContent==='ОШИБКИ');
  assert.equal(await page.locator('#railFeedback').textContent(),'Good');
  assert.equal(await page.locator('#resultsContainer .result-title').textContent(),'Open');
  assert.equal(await page.locator('#resultsContainer .result-text').textContent(),'Critical');
  for(const locale of ['uz','ru','uz','ru']) {
   await page.selectOption('#localeSelect',locale);
   await page.waitForFunction(locale=>document.documentElement.lang===locale,locale);
   await page.waitForFunction(locale=>document.querySelector('.step-pill').textContent.includes(locale==='ru'?'Шаг 1 из 2':'2 bosqichdan 1-si'),locale);
   assert.equal(await page.locator('#railFeedback').textContent(),'Good');
   assert.equal(await page.locator('#resultsContainer .result-text').textContent(),'Critical');
   assert.equal(await page.locator('#executionOutput').textContent(),'Critical');
   assert.equal(await page.locator('#codeInput').inputValue(),'console.log("Critical");');
  }
  await page.evaluate(()=>showSavedSnippets());
  await page.waitForFunction(()=>document.getElementById('resultsContainer').textContent.includes('Сохранённых фрагментов пока нет.'));
  await page.selectOption('#localeSelect','uz');
  await page.waitForFunction(()=>document.getElementById('resultsContainer').textContent.includes('Hali saqlangan kod yo‘q.'));
  assert.match(await page.locator('[onclick="saveCurrentSnippet()"]').textContent(),/Joriy kodni saqlash/);
  await page.evaluate(()=>saveCurrentSnippet());
  await page.waitForFunction(()=>document.getElementById('resultsContainer').textContent.includes('Saqlangan kodingiz'));
  await page.selectOption('#localeSelect','ru');
  await page.waitForFunction(()=>document.getElementById('resultsContainer').textContent.includes('Ваш сохранённый код'));
  assert.match(await page.locator('.snippet-actions').last().textContent(),/Открыть/);
  await page.evaluate(()=>showProgress());
  await page.waitForFunction(()=>document.getElementById('resultsContainer').textContent.includes('Всего анализов:'));
  await page.selectOption('#localeSelect','uz');
  await page.waitForFunction(()=>document.getElementById('resultsContainer').textContent.includes('Jami tahlillar:'));
  await page.evaluate(()=>showStatistics());
  await page.waitForFunction(()=>document.getElementById('resultsContainer').textContent.includes('Eng yaxshi baho:'));
  await page.evaluate(()=>showError('Incorrect email or password'));
  await page.waitForFunction(()=>document.querySelector('#resultsContainer .error-message').textContent.includes('Pochta yoki parol noto‘g‘ri'));
  await page.selectOption('#localeSelect','ru');
  await page.waitForFunction(()=>document.querySelector('#resultsContainer .error-message').textContent.includes('Неверная почта или пароль'));
  assert.deepEqual(errors,[]);
  const guest=await browser.newPage();
  await guest.route('https://**/*',r=>r.abort());
  await guest.goto('http://127.0.0.1:8080/app.html');
  assert.equal(await guest.locator('.profile-card').isVisible(),false);
  assert.equal(await guest.locator('#authTitle').textContent(),'Создайте аккаунт');
  for(const locale of ['uz','ru']) {
   await guest.evaluate(locale=>setMentorLocale(locale),locale);
   await guest.waitForFunction(locale=>document.documentElement.lang===locale,locale);
   assert.equal(await guest.locator('#authTitle').textContent(),locale==='ru'?'Создайте аккаунт':'Hisob yarating');
   const pitch=await guest.locator('#investorPanel').textContent();
   assert.doesNotMatch(pitch,/Freemium|24\/7|Любой язык|YouTube/);
   assert.match(pitch,locale==='ru'?/школах и учебных центрах/:/Maktab va o‘quv markazlarida/);
   if(locale==='uz') assert.doesNotMatch(pitch,/[А-Яа-яЁё]/);
  }
  await guest.close();
  console.log('PASS: RU/UZ shell, score labels, dynamic step/level, hints, snippets, progress/statistics and auth errors; model content/code preserved.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
