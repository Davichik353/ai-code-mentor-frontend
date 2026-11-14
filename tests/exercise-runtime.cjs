/* Tests curated backend exercise solutions in the same browser executor learners use. */
const {chromium}=require('playwright');
const {spawnSync}=require('node:child_process');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const backend=process.env.MENTOR_BACKEND||path.resolve(__dirname,'../../ai-code-mentor-backend');
 const python=process.env.MENTOR_PYTHON||'/workspace/.setup/venv/bin/python';
 const fixtures=spawnSync(python,['-c','import json; from learning_content import TEMPLATES; print(json.dumps(list(TEMPLATES.values())))'],{cwd:backend,encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
 assert.equal(fixtures.status,0,fixtures.stderr);
 const exercises=JSON.parse(fixtures.stdout);
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const page=await browser.newPage();await page.goto('http://127.0.0.1:8080/app.html');
  for(const item of exercises) {
   for(const test of item.tests) {
    const result=await page.evaluate(async({item,test})=>BrowserExecutor.run({code:item.solution,language:item.language,stdin:test.stdin}),{item,test});
    assert.equal(result.error,null,`${item.id}: ${result.error}`);
    assert.equal(result.stdout.trim(),test.expected_stdout,`${item.id}: unexpected output`);
   }
   console.log(item.id+': all '+item.tests.length+' cases passed');
  }
  const failed=await page.evaluate(()=>BrowserExecutor.run({code:'throw new Error("test failure")',language:'JavaScript'}));
  assert.match(failed.error,/test failure/);
  const stopped=await page.evaluate(async()=>{
   const controller=new AbortController();
   const result=BrowserExecutor.run({code:'while(true){}',language:'JavaScript',signal:controller.signal});
   setTimeout(()=>controller.abort(),100);return result;
  });
  assert.match(stopped.error,/stopped/);
  const timeout=await page.evaluate(()=>BrowserExecutor.run({code:'while(true){}',language:'JavaScript'}));
  assert.match(timeout.error,/timed out/);
  console.log('Executor: runtime error, abort and infinite-loop timeout passed');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
