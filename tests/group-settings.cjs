const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const p=await b.newPage({viewport:{width:390,height:844}});let owner=true,saved;const group={id:'g',title:'Моя группа',description:'Python',member_count:3,student_limit:null,archived:false};
await p.addInitScript(()=>localStorage.setItem('mentor_token','test'));
await p.route('http://localhost:8000/**',r=>{const path=new URL(r.request().url()).pathname;let data=[];
if(path==='/auth/me')data={email:'test@example.com'};
if(path==='/learning/profile')data={role:owner?'teacher':'learner'};
if(path==='/learning/groups')data=[{...group,can_manage:owner,is_owner:owner}];
if(path.endsWith('/settings')){saved=r.request().postDataJSON();Object.assign(group,saved);data=group;}
if(path.endsWith('/archive')){group.archived=true;data=group;}if(path.endsWith('/restore')){group.archived=false;data=group;}
return r.fulfill({json:data});});
await p.goto('http://127.0.0.1:8080/app.html');await p.click('#learningNav');await p.click('.group-menu summary');assert(await p.locator('.group-menu-items').isVisible());await p.click('[data-action="edit-group-title"]');await p.fill('.group-settings-dialog [name=title]','Python — новая группа');await p.fill('.group-settings-dialog [name=limit]','12');await p.click('.group-settings-dialog [type=submit]');await p.waitForSelector('.group-settings-dialog',{state:'detached'});await p.waitForFunction(()=>document.querySelector('.group-summary')?.textContent.includes('3 / 12'));assert.deepEqual(saved,{title:'Python — новая группа',student_limit:12});
await p.click('.group-menu summary');await p.screenshot({path:'/tmp/group-menu-mobile.png'});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.click('[data-action="edit-group-limit"]');assert.equal(await p.locator('.group-settings-dialog [name=limit]').getAttribute('min'),'3');await p.fill('.group-settings-dialog [name=limit]','');await p.click('.group-settings-dialog [type=submit]');await p.waitForSelector('.group-settings-dialog',{state:'detached'});assert.equal(saved.student_limit,null);
p.once('dialog',d=>d.dismiss());await p.click('.group-menu summary');await p.click('[data-action="archive-group"]');assert.equal(group.archived,false);
p.once('dialog',d=>d.accept());await p.click('[data-action="archive-group"]');await p.waitForSelector('#archivedGroups');await p.locator('#archivedGroups summary').first().click();await p.click('.group-menu summary');assert.equal(await p.locator('[data-action="edit-group-title"]').count(),0);p.once('dialog',d=>d.accept());await p.click('[data-action="restore-group"]');await p.waitForSelector('#activeGroups .group-summary');assert.equal(group.archived,false);
owner=false;await p.click('#learningNav');await p.waitForSelector('.group-summary');assert.equal(await p.locator('.group-menu').count(),0);console.log('PASS group menu, rename, capacity, unlimited, cancelled archive, archive/restore and learner restrictions');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
