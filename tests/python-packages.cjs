const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const p=await b.newPage();await p.goto('http://127.0.0.1:8080/app.html');await p.evaluate(()=>hideAuthOverlay());
const code=`# pip install sympy
from sympy import symbols, diff, integrate, sin
x = symbols('x')
f = x**2 * sin(x)
print(diff(f, x))
print(integrate(f, x))`;
await p.fill('#codeInput',code);await p.click('#runCodeButton');await p.waitForFunction(()=>!document.getElementById('runCodeButton').disabled,null,{timeout:75000});const output=await p.textContent('#executionOutput');console.log('SymPy output:',output);
assert.equal(await p.textContent('#executionStatus'),'Завершено.');assert.equal(output.trim(),'x**2*cos(x) + 2*x*sin(x)\n-x**2*cos(x) + 2*x*sin(x) + 2*cos(x)');
const numpy=await p.evaluate(()=>BrowserExecutor.run({language:'Python',code:'import numpy as np\nprint(int(np.array([1, 2, 3]).sum()))'}));assert.equal(numpy.error,null);assert.equal(numpy.stdout.trim(),'6');
const missing=await p.evaluate(()=>BrowserExecutor.run({language:'Python',code:'import mentor_package_that_does_not_exist'}));assert.match(missing.error,/ModuleNotFoundError/);
const syntax=await p.evaluate(()=>BrowserExecutor.run({language:'Python',code:'print("SHOULD NOT RUN")\nif :'}));assert.match(syntax.error,/SyntaxError/);assert(!syntax.stdout.includes('SHOULD NOT RUN'));
console.log('PASS SymPy user example, NumPy in shared assignment runner, unknown package and syntax errors');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
