/* Runs only in the visitor's browser. Results must not be treated as trusted grades. */
'use strict';
window.BrowserExecutor = {
    run({code, language, stdin='', signal, onStatus=()=>{}}) {
        return new Promise(resolve=>{
            let worker, timer, started=false, settled=false, stdout='';
            const finish=(error=null,truncated=false)=>{
                if(settled) return;
                settled=true; clearTimeout(timer); worker?.terminate();
                signal?.removeEventListener('abort',abort);
                resolve({stdout,error,truncated});
            };
            const abort=()=>finish('Execution stopped');
            if(signal?.aborted) { finish('Execution stopped'); return; }
            try {
                worker=new Worker('runner-worker.js');
                timer=setTimeout(()=>finish('Runtime loading timed out (60s)'),60000);
                signal?.addEventListener('abort',abort,{once:true});
                worker.onmessage=({data})=>{
                    if(settled || !data) return;
                    if(data.type==='output') stdout=(stdout+String(data.text)).slice(0,50000);
                    else if(data.type==='status') onStatus('loading');
                    else if(data.type==='running' && !started) {
                        started=true; clearTimeout(timer); onStatus('running');
                        timer=setTimeout(()=>finish('Execution timed out (10s)'),10000);
                    } else if(data.type==='done') finish(null,!!data.truncated);
                    else if(data.type==='error') finish(String(data.text).slice(0,2000));
                };
                worker.onerror=()=>finish('Worker failed to start. Check browser and CDN connection.');
                worker.postMessage({code,language,stdin});
            } catch { finish('Browser execution unavailable'); }
        });
    }
};
