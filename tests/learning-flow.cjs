/* Requires the real local API on 8000 and frontend on 8080, plus Playwright/Chromium. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const contexts=[]; const errors=[];
 const suffix=crypto.randomBytes(6).toString('hex');
 const password=crypto.randomBytes(16).toString('hex')+'aA1!';
 async function actor(name){
  const context=await browser.newContext();contexts.push(context);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8080/app.html');
  await page.fill('#authName',name);
  await page.fill('#authEmail',`${name.toLowerCase()}-${suffix}@example.com`);
  await page.fill('#authPassword',password);
  await page.click('#authSubmit');
  await page.waitForFunction(()=>document.getElementById('authOverlay').style.display==='none');
  await page.click('#learningNav');await page.waitForSelector('#learningRole');
  return page;
 }
 try {
  const teacher=await actor('Teacher');
  await teacher.selectOption('#learningRole','teacher');
  await teacher.click('[data-action="profile"]');await teacher.waitForSelector('#groupTitle');
  await teacher.fill('#groupTitle','Browser pilot');
  await teacher.fill('#groupDescription','Full learning workflow');
  await teacher.click('[data-action="create-group"]');await teacher.click('[data-action="group-tab"][data-id="manage"]');await teacher.waitForSelector('#groupJoinCode');
  const code=await teacher.locator('#groupJoinCode').textContent();
  await teacher.selectOption('#templateChoice','sum-js');
  await teacher.click('[data-action="assign"]');
  await teacher.waitForSelector('[data-action="assignment"]');
  const student=await actor('Student');
  await student.fill('#joinCode',code);await student.click('[data-action="join"]');
  await student.waitForSelector('[data-action="assignment"]');await student.click('[data-action="assignment"]');
  await student.waitForSelector('#assignmentCode');
  assert.equal(await student.locator('#solutionButton').isDisabled(),true);
  for(let n=1;n<=3;n++) {
   await student.click('#hintButton');
   await student.waitForFunction(n=>document.querySelectorAll('#learningHints p').length===n,n);
  }
  assert.equal(await student.locator('#hintButton').isDisabled(),true);
  await student.locator('details').filter({has:student.locator('#solutionReflection')}).locator('summary').click();
  await student.fill('#solutionReflection','I tried adding strings and need to convert them to numbers.');
  await student.click('#solutionButton');await student.waitForSelector('#learningSolution:visible');
  assert.match(await student.locator('#learningSolution').textContent(),/Number/);
  const solution='console.log(Number(prompt()) + Number(prompt()));';
  await student.fill('#assignmentCode',solution);
  await student.click('#assignmentTestButton');
  await student.waitForFunction(()=>document.querySelectorAll('#assignmentTestResults .test-pass').length===3,{},{timeout:30000});
  assert.equal(await student.locator('#assignmentSubmitButton').isDisabled(),false);
  await student.fill('#assignmentCode','console.log(0);');
  assert.equal(await student.locator('#assignmentSubmitButton').isDisabled(),true);
  await student.fill('#assignmentCode',solution);
  await student.fill('#defenseExplanation','I convert each input to a number before addition; I also tested negative integers.');
  await student.fill('#changedCode','console.log(Number(prompt()) + Number(prompt()) + Number(prompt()));');
  await student.fill('#changedInput','2\n3\n4');
  await student.click('#changeRunButton');
  await student.waitForFunction(()=>document.getElementById('changedOutput').textContent.trim()==='9');
  await student.fill('#changeExplanation','The changed program reads a third input and adds all three numbers.');
  await student.selectOption('#localeSelect','uz');
  await student.waitForFunction(()=>document.documentElement.lang==='uz');
  assert.match(await student.locator('#learningRoot').textContent(),/Kichik himoya/);
  assert.equal(await student.locator('#assignmentCode').inputValue(),solution);
  assert.match(await student.locator('#defenseExplanation').inputValue(),/negative/);
  await student.click('#assignmentSubmitButton');
  await student.waitForFunction(()=>document.querySelector('#learningRoot h2') && !document.getElementById('assignmentCode'));
  assert.match(await student.locator('#learningRoot').textContent(),/Tekshiruv kutilmoqda/);
  console.log('Learner: progressive hints, tests, defense and Uzbek UI passed');
  await teacher.click('#learningNav');await teacher.waitForSelector('[data-action="group"]');
  await teacher.click('[data-action="group"]');await teacher.waitForSelector('[data-action="submission"]');
  await teacher.click('[data-action="submission"]');await teacher.waitForSelector('#reviewFeedback');
  await teacher.fill('#reviewFeedback','I reviewed the original solution, explanation and extra input implementation.');
  await teacher.click('[data-action="approve"]');
  await teacher.waitForFunction(()=>document.getElementById('learningRoot').textContent.includes('Принято преподавателем'));
  console.log('Teacher: group, assignment and manual review passed');
  await student.click('#learningNav');await student.waitForSelector('[data-action="portfolio"]');
  await student.click('[data-action="portfolio"]');await student.waitForSelector('#portfolioPublic');
  assert.equal(await student.locator('#portfolioPublic').isChecked(),false);
  assert.match(await student.locator('#learningRoot').textContent(),/Ikki son yig‘indisi/);
  await student.fill('#portfolioBio','My reviewed JavaScript work');await student.check('#portfolioPublic');
  await student.click('[data-action="publish-portfolio"]');await student.waitForSelector('#portfolioLink a');
  const url=await student.locator('#portfolioLink a').getAttribute('href');
  const publicPage=await browser.newPage();await publicPage.goto(url);
  await publicPage.waitForSelector('#learningRoot .learning-card');
  await publicPage.waitForFunction(()=>document.getElementById('authOverlay').style.display==='none');
  const publicText=await publicPage.locator('#learningRoot').textContent();
  assert.match(publicText,/JavaScript/);assert.doesNotMatch(publicText,/@example.com|console\.log|Browser pilot/);
  await student.uncheck('#portfolioPublic');await student.click('[data-action="publish-portfolio"]');
  await student.waitForFunction(()=>!document.querySelector('#portfolioLink a'));
  await publicPage.reload();await publicPage.waitForFunction(()=>document.getElementById('learningFeedback').textContent.length>0);
  assert.match(await publicPage.locator('#learningRoot').textContent(),/недоступно|mavjud emas/);
  await student.click('#learningNav');await student.waitForSelector('[data-action="glossary"]');
  await student.click('[data-action="glossary"]');await student.waitForSelector('#learningRoot .learning-grid');
  assert.match(await student.locator('#learningRoot').textContent(),/O‘zgaruvchi/);
  console.log('Portfolio: opt-in, privacy, revocation and bilingual glossary passed');
  await student.setViewportSize({width:390,height:844});
  assert.equal(await student.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  console.log('Mobile learning layout passed');
  assert.deepEqual(errors,[]);
 } finally {
  for(const context of contexts) {
   const page=context.pages()[0];
   if(page && !page.isClosed()) await page.evaluate(async()=>{
    const token=localStorage.getItem('mentor_token');
    if(token) await fetch('http://localhost:8000/auth/account',{method:'DELETE',headers:{Authorization:'Bearer '+token}});
   }).catch(()=>{});
  }
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
