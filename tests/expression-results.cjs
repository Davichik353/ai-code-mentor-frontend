const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try {
 const page=await browser.newPage();await page.goto('http://127.0.0.1:8080/app.html');await page.evaluate(()=>hideAuthOverlay());
 assert.equal(await page.locator('#codeInput').inputValue(),'');
 async function run(code){await page.fill('#codeInput',code);await page.click('#runCodeButton');await page.waitForFunction(()=>!document.getElementById('runCodeButton').disabled,{},{timeout:75000});return page.locator('#executionOutput').innerText();}
 assert.equal((await run('def get_vowels(text):\n    return [c for c in text if c in "aeiou"]\nget_vowels("animal")\nget_vowels("sky")\nget_vowels("football")')).trim(),"['a', 'i', 'a']\n[]\n['o', 'o', 'a']");
 assert.equal((await run('print("once")\nvalues = []\nvalues.append(1)\nvalues')).trim(),"once\n[1]");
 assert.equal((await run('"module docstring"\nfrom __future__ import annotations\n2 + 3')).trim(),'5');
 await page.locator('.run-settings').evaluate(e=>e.open=true);await page.uncheck('#showExpressionResults');assert.match(await run('2 + 3'),/Программа завершилась без вывода/);
 console.log('PASS empty editor, exact user example, no None/duplicate print, future imports and script mode');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
