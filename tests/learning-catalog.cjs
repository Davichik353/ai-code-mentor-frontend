/* End-to-end regression for group roles, owner editor, exercise filters and glossary. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const actors=[];const errors=[];
 async function actor(label){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
  const response=await context.request.post('http://localhost:8000/auth/register',{data:{email:'catalog-'+crypto.randomBytes(8).toString('hex')+'@example.com',password:crypto.randomBytes(16).toString('hex')+'Aa1!',display_name:label}});
  assert.equal(response.status(),201);const token=(await response.json()).access_token;actors.push({context,token});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8080');await page.evaluate(t=>{localStorage.setItem('mentor_token',t);hideAuthOverlay();},token);
  await page.click('#learningNav');await page.waitForSelector('#learningRole');
  return {page,token,context};
 }
 try {
  const teacher=await actor('Преподаватель');const t=teacher.page;
  await t.selectOption('#learningRole','teacher');await t.click('[data-action="profile"]');await t.waitForSelector('#groupTitle');
  await t.fill('#groupTitle','Категории и роли');await t.click('[data-action="create-group"]');await t.waitForSelector('#groupJoinCode');
  const joinCode=await t.locator('#groupJoinCode').textContent();
  const groups=await (await t.request.get('http://localhost:8000/learning/groups',{headers:{Authorization:'Bearer '+teacher.token}})).json();
  await t.selectOption('#catalog-category','logic');await t.selectOption('#catalog-language','JavaScript');
  assert.equal(await t.locator('#catalogCount').textContent(),'3');
  await t.selectOption('#catalog-difficulty','beginner');
  const filtered=await t.locator('#templateChoice option').count();assert.ok(filtered>=1);
  await t.selectOption('#catalog-difficulty','all');
  const chosen=await t.locator('#templateChoice').inputValue();
  await t.click('[data-action="assign"]');await t.waitForSelector('[data-action="assignment"]');
  await t.click('[data-action="assign"]');await t.waitForFunction(()=>document.querySelector('#learningFeedback').textContent.includes('уже выдано'));
  assert.equal(await t.locator('[data-action="assignment"]').count(),1);
  await t.click('[data-action="assignment"]');await t.waitForSelector('#assignmentCode');
  assert.equal(await t.locator('#assignmentSubmitButton').count(),0);
  assert.equal(await t.locator('#assignmentCode').isEditable(),true);
  // Owner can test code in the formerly empty assignment screen.
  await t.fill('#assignmentCode','console.log(0);');await t.click('#assignmentTestButton');
  await t.waitForFunction(()=>document.querySelectorAll('#assignmentTestResults .learning-card').length>0);
  await t.screenshot({path:'/tmp/mentor-assignment-editor.png'});
  const student=await actor('Ученик');const s=student.page;
  await s.fill('#joinCode',joinCode);await s.click('[data-action="join"]');await s.waitForSelector('[data-action="assignment"]');
  assert.equal(await s.locator('#templateChoice').count(),0);
  assert.equal(await s.locator('[data-action="assign"]').count(),0);
  assert.match(await s.locator('#userRole').textContent(),/Ученик/);
  // Becoming a teacher in one's own workspace never grants another group's controls.
  await s.click('[data-action="home"]');await s.waitForSelector('#learningRole');await s.selectOption('#learningRole','teacher');
  await s.click('[data-action="profile"]');await s.waitForSelector('#groupTitle');await s.click('[data-action="group"]');
  await s.waitForSelector('[data-action="assignment"]');assert.equal(await s.locator('[data-action="assign"]').count(),0);
  const denied=await student.context.request.post('http://localhost:8000/learning/groups/'+groups[0].id+'/assignments',{headers:{Authorization:'Bearer '+student.token},data:{template_id:chosen}});
  assert.equal(denied.status(),404);
  await s.click('[data-action="assignment"]');await s.waitForSelector('#assignmentCode');
  assert.equal(await s.locator('#assignmentSubmitButton').count(),1);
  await s.fill('#assignmentCode','console.log(42);');
  assert.match(await s.locator('#draftStatus').textContent(),/сохранён/);
  await s.reload();await s.click('#learningNav');await s.waitForSelector('#activeGroups [data-action="group"]');
  await s.click('#activeGroups [data-action="group"]');await s.waitForSelector('[data-action="assignment"]');
  await s.click('[data-action="assignment"]');await s.waitForSelector('#assignmentCode');
  assert.equal(await s.locator('#assignmentCode').inputValue(),'console.log(42);');
  await t.click('#learningNav');await t.waitForSelector('#activeGroups [data-action="group"]');
  await t.click('#activeGroups [data-action="group"]');await t.waitForSelector('.classroom-journal');
  assert.match(await t.locator('.classroom-journal').textContent(),/Ученик/);
  assert.match(await t.locator('.classroom-journal').textContent(),/Не отправлено/);
  const gd=await (await student.context.request.get('http://localhost:8000/learning/groups/'+groups[0].id,{headers:{Authorization:'Bearer '+student.token}})).json();
  const ad=await (await student.context.request.get('http://localhost:8000/learning/assignments/'+gd.assignments[0].id,{headers:{Authorization:'Bearer '+student.token}})).json();
  const submitted=await student.context.request.post('http://localhost:8000/learning/assignments/'+ad.id+'/submissions',{headers:{Authorization:'Bearer '+student.token},data:{code:'console.log(42);',results:ad.tests.map(()=>({stdout:'wrong',error:null})),explanation:'Проверяем отображение отправленной работы в журнале.',changed_code:'console.log(43);',change_explanation:'Проверяем изменённый код и передачу объяснения учителю.'}});
  assert.equal(submitted.status(),201);
  await t.click('.classroom-journal [data-action="group"]');
  await t.waitForSelector('.classroom-journal [data-action="submission"]');
  assert.match(await t.locator('.classroom-journal').textContent(),/Есть ошибки в тестах/);
  await t.click('.classroom-journal [data-action="submission"]');
  await t.waitForFunction(()=>document.querySelector('#learningRoot').textContent.includes('Исходное решение'));


  await s.click('#glossaryNav');await s.waitForSelector('#glossarySearch');
  assert.equal(await s.locator('.glossary-card').count(),43);
  await s.fill('#glossarySearch','несуществующийтерминxyz');assert.equal(await s.locator('#glossaryCount').textContent(),'0');
  await s.fill('#glossarySearch','');await s.selectOption('#glossary-category','functions');await s.selectOption('#glossary-language','JavaScript');
  assert.ok(await s.locator('.glossary-card').count()>0);
  assert.match(await s.locator('.glossary-card pre').first().textContent(),/function/);
  await s.selectOption('#localeSelect','uz');assert.match(await s.locator('#learningRoot h2').textContent(),/Lug‘at/);
  await s.setViewportSize({width:390,height:844});assert.equal(await s.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await s.selectOption('#localeSelect','ru');
  await s.click('#learningNav');await s.waitForSelector('[data-action="group"]');await s.click('[data-action="group"]');
  await s.waitForSelector('[data-action="leave-group"]');
  s.once('dialog',d=>d.dismiss());await s.click('[data-action="leave-group"]');
  assert.equal(await s.locator('[data-action="leave-group"]').count(),1);
  s.once('dialog',d=>d.accept());await s.click('[data-action="leave-group"]');
  await s.waitForSelector('#joinCode');
  assert.equal(await s.locator('[data-action="group"]').count(),0);
  await s.fill('#joinCode',joinCode);await s.click('[data-action="join"]');
  await s.waitForSelector('[data-action="leave-group"]');
  assert.equal(await s.locator('[data-action="archive-group"]').count(),0);
  await t.click('#learningNav');await t.waitForSelector('#activeGroups [data-action="group"]');
  await t.click('#activeGroups [data-action="group"]');await t.waitForSelector('[data-action="archive-group"]');
  t.once('dialog',d=>d.dismiss());await t.click('[data-action="archive-group"]');
  assert.equal(await t.locator('[data-action="archive-group"]').count(),1);
  t.once('dialog',d=>d.accept());await t.click('[data-action="archive-group"]');
  await t.waitForSelector('#archivedGroups');
  assert.equal(await t.locator('#activeGroups [data-action="group"]').count(),0);
  await t.click('#archivedGroups summary');await t.click('#archivedGroups [data-action="group"]');
  await t.waitForSelector('[data-action="restore-group"]');
  assert.equal(await t.locator('[data-action="assign"]').count(),0);
  await s.click('#learningNav');await s.waitForSelector('#archivedGroups');
  await s.click('#archivedGroups summary');await s.click('#archivedGroups [data-action="group"]');
  await s.waitForSelector('[data-action="assignment"]');
  assert.equal(await s.locator('[data-action="restore-group"]').count(),0);
  await s.click('[data-action="assignment"]');await s.waitForSelector('#assignmentCode');
  assert.equal(await s.locator('#assignmentSubmitButton').count(),0);
  assert.match(await s.locator('#learningRoot').textContent(),/Группа в архиве/);
  t.once('dialog',d=>d.accept());await t.click('[data-action="restore-group"]');
  await t.waitForSelector('#activeGroups [data-action="group"]');
  assert.deepEqual(errors,[]);
  console.log('PASS: owner editor, categorized catalog, duplicate prevention, joined learner authorization, glossary search/examples/RU-UZ/mobile');
 } finally {
  for(const a of actors){await a.context.request.delete('http://localhost:8000/auth/account',{headers:{Authorization:'Bearer '+a.token}}).catch(()=>{});await a.context.close();}
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
