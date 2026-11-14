const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
let owner=true,settings,cloud={revision:0,payload:{}},score;
const assignment={id:'a',group_id:'g',title:'Сумма',prompt:'Сложите два числа',language:'Python',starter_code:'',hints:[],hint_count:0,tests:[{stdin:'2\n3',expected_stdout:'5'}],submissions:[],defense_questions:[],change:'Добавьте третье число',hints_allowed:true,solution_allowed:true};
await page.addInitScript(()=>{localStorage.setItem('mentor_token','a.'+btoa(JSON.stringify({sub:'t'}))+'.c')});
await page.route('http://localhost:8000/**',route=>{const req=route.request(),path=new URL(req.url()).pathname;let data=[];
if(path==='/auth/me')data={id:'t',email:'t@example.com'};
if(path==='/learning/profile')data={role:'teacher'};
if(path==='/learning/groups')data=[{id:'g',title:'Python',can_manage:true,member_count:1}];
if(path==='/learning/groups/g')data={id:'g',title:'Python',can_manage:true,members:[{id:'s',display_name:'Student'}],assignments:[assignment],submissions:[],summary:{}};
if(path==='/learning/assignments/a')data={...assignment,is_owner:owner,can_manage:owner,can_submit:!owner,...settings};
if(path.endsWith('/settings')){settings=req.postDataJSON();data=settings;}
if(path.endsWith('/draft')){if(req.method()==='POST')cloud={...req.postDataJSON(),revision:cloud.revision+1};data=cloud;}
if(path.endsWith('/mentor'))data={observation:'Нужно прочитать два числа.',next_step:'Проверьте input().',question:'Что возвращает input()?'};
if(path==='/learning/schools')data=[{id:'school',title:'Школа'}];
if(path==='/learning/schools/school')data={id:'school',title:'Школа',is_admin:true,admin_id:'t',staff:[{id:'t',display_name:'Учитель'}],groups:[{id:'g',title:'Python',owner_id:'t'}],library:[]};
return route.fulfill({json:data});});
await page.goto('http://127.0.0.1:8080/app.html');await page.click('#learningNav');await page.click('[data-action=schools]');await page.click('[data-action=school]');await page.waitForSelector('#attachGroup');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/school-product-mobile.png'});
await page.click('[data-action=group]');await page.click('[data-action=assignment]');await page.locator('summary').filter({hasText:'Настройки задания'}).click();await page.fill('#assignmentDue','2027-02-01T12:30');await page.uncheck('#allowHints');await page.click('[data-action=assignment-settings]');await page.waitForFunction(()=>document.querySelector('#learningRoot').textContent.includes('01.02.2027'));assert.equal(settings.hints_allowed,false);assert(settings.due_at.endsWith('Z'));
owner=false;settings.hints_allowed=true;await page.click('#learningNav');await page.click('[data-action=group]');await page.click('[data-action=assignment]');await page.fill('#assignmentCode','print(5)');await page.click('[data-action=save-cloud]');await page.waitForFunction(()=>document.querySelector('#draftStatus').textContent.includes('облаке'));assert.equal(cloud.payload.assignmentCode,'print(5)');await page.fill('#assignmentCode','print(8)');page.once('dialog',d=>d.accept());await page.click('[data-action=load-cloud]');await page.waitForFunction(()=>document.querySelector('#assignmentCode').value==='print(5)');await page.click('[data-action=mentor]');await page.waitForFunction(()=>document.querySelector('#mentorAnswer').textContent.includes('Проверьте input()'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS school mobile, assignment policy, cloud save/restore and grounded mentor UI');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
