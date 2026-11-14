const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:390,height:844}});let published;let run;
const task={title:'Сумма',prompt:'Введите два целых числа на разных строках. Выведите сумму.',language:'Python',tests:[{stdin:'2\n3',expected_stdout:'5'}],defense_question:'Как работает сложение?',change:'Добавьте третье число.'};
await page.addInitScript(()=>localStorage.setItem('mentor_token','test'));
await page.route('http://localhost:8000/**',r=>{const path=new URL(r.request().url()).pathname;let data=[];
if(path==='/auth/me')data={email:'test@example.com'};
if(path==='/learning/profile')data={role:'teacher'};
if(path==='/learning/groups')data=[{id:'g',title:'Группа',member_count:1}];
if(path==='/learning/groups/g')data={id:'g',title:'Группа',is_owner:true,can_manage:true,members:[],assignments:[],submissions:[],join_code:'demo'};
if(path.endsWith('/assignment-drafts'))data={tasks:[task]};
if(path.endsWith('/custom-assignments')){published=r.request().postDataJSON();data={id:'a'}}
if(path==='/learning/assignments/a')data={...task,id:'a',group_id:'g',is_owner:false,can_submit:true,custom:true,starter_code:'',hints:[],hint_count:0,defense_questions:[task.defense_question],submissions:[]};
return r.fulfill({json:data});});
await page.goto('http://127.0.0.1:8080/app.html');await page.click('#learningNav');await page.click('[data-action="group"]');await page.click('[data-action="group-tab"][data-id="manage"]');
await page.fill('#importText',task.prompt);await page.click('[data-action="import-tasks"]');await page.waitForSelector('.import-draft');await page.click('[data-action="publish-custom"]');assert.equal(published,undefined);
await page.locator('[data-draft="reviewed"]').check();await page.click('[data-action="publish-custom"]');await page.waitForFunction(()=>document.querySelector('.import-draft').textContent.includes('выдано'));
assert.equal(published.title,'Сумма');assert.deepEqual(published.tests,task.tests);
// Open learner assignment through the same delegated navigation.
await page.evaluate(()=>{const b=document.createElement('button');b.dataset.action='assignment';b.dataset.id='a';document.getElementById('learningRoot').append(b);b.click()});
await page.waitForSelector('#changedCode');await page.fill('#assignmentCode','print(2 + 3)');await page.click('[data-action="copy-change"]');assert.equal(await page.inputValue('#changedCode'),'print(2 + 3)');
assert.equal(await page.locator('#solutionButton').count(),0);
await page.exposeFunction('recordRun',value=>{run=value});await page.evaluate(()=>{BrowserExecutor.run=async options=>{await recordRun({code:options.code,stdin:options.stdin});return {error:"Traceback...\nNameError: name 'bad' is not defined",stdout:''}}});
await page.fill('#changedCode','bad');await page.fill('#changedInput','2\n3');await page.click('[data-action="run-change"]');await page.waitForFunction(()=>document.getElementById('changedOutput').textContent.includes('NameError'));
assert.deepEqual(run,{code:'bad',stdin:'2\n3'});assert(!(await page.textContent('#changedOutput')).includes('Traceback'));
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:'/tmp/assignment-defense-mobile.png',fullPage:true});console.log('PASS teacher draft review/publication, empty learner editor, copy code, stdin separation, concise errors, mobile width');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
