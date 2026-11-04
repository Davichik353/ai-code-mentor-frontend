const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:8080');
 await page.evaluate(()=>{document.getElementById('authOverlay').style.display='none'});
 async function run(language,code,input=''){
  await page.selectOption('#executionLanguage',language);
  await page.fill('#codeInput',code);
  await page.fill('#executionInput',input);
  await page.click('#runCodeButton');
  await page.waitForFunction(()=>!document.getElementById('runCodeButton').disabled,{},{timeout:75000});
  return {status:await page.locator('#executionStatus').textContent(),output:await page.locator('#executionOutput').textContent()};
 }
 let r=await run('JavaScript','console.log("hello", 2+3); console.log(prompt());','input-value');
 assert.match(r.output,/hello 5\ninput-value/); assert.equal(r.status,'Завершено.'); console.log('JS stdout and input passed');
 r=await run('JavaScript','throw new Error("expected failure")');assert.match(r.output,/expected failure/);assert.equal(r.status,'Ошибка выполнения.');console.log('JS error passed');
 r=await run('JavaScript','while(true){}');assert.match(r.status,/10 секунд/);console.log('Infinite loop timeout passed');
 await page.fill('#codeInput','while(true){}');await page.click('#runCodeButton');await page.click('#stopCodeButton');assert.equal(await page.locator('#executionStatus').textContent(),'Выполнение остановлено.');console.log('Manual stop passed');
 r=await run('JavaScript','console.log("<img src=x onerror=alert(1)>")');assert.equal(await page.locator('#executionOutput img').count(),0);console.log('Output escaped passed');
 r=await run('Python','name = input()\nprint("Hello", name)\nprint(6*7)','World');
 console.log('PYTHON_RESULT',JSON.stringify(r));assert.match(r.output,/Hello World\n42/);assert.equal(r.status,'Завершено.');
 r=await run('Python','raise ValueError("python error")');assert.match(r.output,/python error/);assert.equal(r.status,'Ошибка выполнения.');console.log('Python error passed');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
