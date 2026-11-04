/* Browser-only execution. No server credentials or application tokens are passed here. */
'use strict';
const LIMIT = 50000;
let printed = 0;
function output(value) {
    const text = String(value);
    if (printed >= LIMIT) return;
    const chunk = text.slice(0, LIMIT - printed);
    printed += chunk.length;
    self.postMessage({type: 'output', text: chunk});
}
self.onmessage = async ({data}) => {
    try {
        const input = String(data.stdin || '').split('\n');
        let cursor = 0;
        if (data.language === 'Python') {
            self.postMessage({type: 'status', text: 'Загрузка Python… Первый запуск может занять до минуты.'});
            importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
            const runtime = await loadPyodide({indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
            runtime.setStdout({batched: text => output(text + '\n')});
            runtime.setStderr({batched: text => output(text + '\n')});
            runtime.setStdin({stdin: () => cursor < input.length ? input[cursor++] : null});
            self.postMessage({type: 'running'});
            await runtime.runPythonAsync(data.code);
        } else if (data.language === 'JavaScript') {
            self.postMessage({type: 'running'});
            const format = value => {
                if (typeof value === 'string') return value;
                try { return JSON.stringify(value) ?? String(value); } catch { return String(value); }
            };
            const write = (...args) => output(args.map(format).join(' ') + '\n');
            const consoleProxy = {log: write, info: write, warn: write, error: write, debug: write};
            const read = () => cursor < input.length ? input[cursor++] : null;
            const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
            await new AsyncFunction('console', 'prompt', data.code)(consoleProxy, read);
        } else {
            throw new Error('Запуск поддерживает Python и JavaScript.');
        }
        self.postMessage({type: 'done', truncated: printed >= LIMIT});
    } catch (error) {
        self.postMessage({type: 'error', text: String(error.message || error).slice(0, LIMIT)});
    }
};
