const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();let submitted;
const assignment={id:'a',group_id:'g',title:'Сумма',prompt:'Сложите числа',language:'Python',tests:[{stdin:'2\n3',expected_stdout:'5'}],change:'Добавьте число',defense_questions:[],hints:[],hint_count:0,starter_code:'',can_submit:true,is_owner:false,submissions:[]};
await page.addInitScript(()=>localStorage.setItem('mentor_token','test.'+btoa(JSON.stringify({sub:'paste-test'}))+'.test'));
await page.route('http://localhost:8000/**',r=>{const path=new URL(r.request().url()).pathname;let data=[];
if(path==='/auth/me')data={email:'test@example.com'};
if(path==='/learning/profile')data={role:'learner'};
if(path==='/learning/groups')data=[{id:'g',title:'Группа',member_count:1}];
if(path==='/learning/assignments/a')data=assignment;
if(path==='/learning/assignments/a/submissions'){submitted=r.request().postDataJSON();data={id:'s'}}
if(path==='/learning/submissions/s')data={...assignment,...submitted,id:'s',tests_passed:true,status:'pending_review',results:[{passed:true,stdout:'5'}]};
return r.fulfill({json:data});});
async function openAssignment(){await page.evaluate(()=>{const b=document.createElement('button');b.dataset.action='assignment';b.dataset.id='a';document.getElementById('learningRoot').append(b);b.click()});await page.waitForSelector('#assignmentCode');}
await page.goto('http://127.0.0.1:8080');await page.click('#learningNav');await openAssignment();
await page.fill('#assignmentCode','print(5)');assert.equal(await page.inputValue('#codePasteDetected'),'false');
await page.click('[data-action="copy-change"]');assert.equal(await page.inputValue('#codePasteDetected'),'false');
await page.evaluate(()=>navigator.clipboard.writeText('2\n3'));await page.focus('#changedInput');await page.keyboard.press('Control+V');assert.equal(await page.inputValue('#codePasteDetected'),'false');
await page.evaluate(()=>navigator.clipboard.writeText('print(6)'));await page.focus('#changedCode');await page.keyboard.press('Control+A');await page.keyboard.press('Control+V');assert.equal(await page.inputValue('#changedCode'),'print(6)');assert.equal(await page.inputValue('#codePasteDetected'),'true');assert(await page.locator('#codePasteNotice').isVisible());
await page.reload();await page.click('#learningNav');await openAssignment();assert.equal(await page.inputValue('#codePasteDetected'),'true');assert.equal(await page.inputValue('#changedCode'),'print(6)');
await page.evaluate(()=>{BrowserExecutor.run=async()=>({stdout:'5',error:null,truncated:false})});await page.click('[data-action="test"]');await page.fill('#defenseExplanation','Я сложил два целых числа и проверил результат.');await page.fill('#changeExplanation','В изменённом решении выводится новое число.');await page.click('[data-action="submit"]');await page.waitForSelector('[role="note"]');assert.equal(submitted.code_paste_detected,true);assert((await page.textContent('[role="note"]')).includes('Источник неизвестен'));
console.log('PASS real clipboard allowed, own-code copy and stdin ignored, paste flag survives reload and submission, teacher report shown');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
