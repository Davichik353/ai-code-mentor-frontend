'use strict';
let executionWorker = null;
let executionTimer = null;
const outputLimit = 50000;
function appendExecutionOutput(text) {
    const output = document.getElementById('executionOutput');
    const available = outputLimit - output.textContent.length;
    if (available > 0) output.textContent += String(text).slice(0, available);
}
function finishExecution(message) {
    clearTimeout(executionTimer);
    if (executionWorker) executionWorker.terminate();
    executionWorker = null;
    document.getElementById('runCodeButton').disabled = false;
    document.getElementById('stopCodeButton').disabled = true;
    document.getElementById('executionStatus').textContent = message;
}
function stopCode() { finishExecution('Выполнение остановлено.'); }
function runCode() {
    if (executionWorker) return;
    const language = document.getElementById('executionLanguage').value;
    const code = document.getElementById('codeInput').value;
    if (!code.trim()) {
        document.getElementById('executionStatus').textContent = 'Введите код в редакторе.';
        return;
    }
    document.getElementById('executionOutput').textContent = '';
    document.getElementById('runCodeButton').disabled = true;
    document.getElementById('stopCodeButton').disabled = false;
    document.getElementById('executionStatus').textContent = 'Подготовка…';
    try {
        const worker = new Worker('runner-worker.js');
        executionWorker = worker;
        executionTimer = setTimeout(() => finishExecution('Не удалось загрузить runtime за 60 секунд. Проверьте соединение и повторите.'), 60000);
        worker.onmessage = ({data}) => {
            if (worker !== executionWorker || !data || typeof data.type !== 'string') return;
            if (data.type === 'output') appendExecutionOutput(data.text);
            else if (data.type === 'status') document.getElementById('executionStatus').textContent = String(data.text);
            else if (data.type === 'running') {
                clearTimeout(executionTimer);
                document.getElementById('executionStatus').textContent = 'Выполняется…';
                executionTimer = setTimeout(() => finishExecution('Превышен лимит 10 секунд. Выполнение остановлено.'), 10000);
            } else if (data.type === 'done') {
                if (!document.getElementById('executionOutput').textContent) appendExecutionOutput(window.MentorLocale === 'uz' ? 'Dastur tugadi, lekin hech narsa chiqarmadi.' : 'Программа завершилась без вывода.');
                finishExecution(data.truncated ? 'Завершено. Вывод ограничен 50 000 символов.' : 'Завершено.');
            }
            else if (data.type === 'error') {
                appendExecutionOutput(data.text);
                finishExecution('Ошибка выполнения.');
            }
        };
        worker.onerror = () => finishExecution('Не удалось запустить код. Проверьте соединение и поддержку Web Worker.');
        worker.postMessage({code, language, stdin: document.getElementById('executionInput').value, showExpressions: document.getElementById('showExpressionResults').checked});
    } catch (error) {
        finishExecution('Запуск недоступен в этом браузере. Откройте приложение через HTTP/HTTPS.');
    }
}
// Plain editor shortcuts keep typed indentation while retaining a keyboard escape.
document.getElementById('codeInput').addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault(); runCode();
    }
});
window.addEventListener('pagehide', () => { if (executionWorker) executionWorker.terminate(); });
