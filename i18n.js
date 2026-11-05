'use strict';
window.MentorLocale = localStorage.getItem('mentor_locale') === 'uz' ? 'uz' : 'ru';
const uiTranslations = {
'Dashboard':['Обзор','Bosh sahifa'], 'New Analysis':['Новый анализ','Yangi tahlil'],
'History':['История','Tarix'], 'Progress':['Прогресс','Rivojlanish'], 'Statistics':['Статистика','Statistika'],
'Saved Snippets':['Сохранённый код','Saqlangan kod'], 'Settings':['Настройки','Sozlamalar'], 'Investor Demo':['Презентация','Taqdimot'],
'Sign out':['Выйти','Chiqish'], 'New Code Analysis':['Анализ кода','Kod tahlili'],
'Paste your code below and get AI-powered feedback':['Вставьте код и получите объяснение ошибок','Kodni kiriting va xatolar izohini oling'],
'Paste code or upload any file:':['Введите код или загрузите файл:','Kodni kiriting yoki fayl yuklang:'],
'Auto-detect language':['Определить язык автоматически','Tilni avtomatik aniqlash'],
'Upload File':['Загрузить файл','Fayl yuklash'], 'No file selected':['Файл не выбран','Fayl tanlanmagan'],
'Analyze Code':['Анализировать','Tahlil qilish'], 'Clear':['Очистить','Tozalash'], 'Find errors':['Найти ошибки','Xatolarni topish'],
'Create your account':['Создайте аккаунт','Hisob yarating'], 'Welcome back':['С возвращением','Xush kelibsiz'],
'Register':['Регистрация','Ro‘yxatdan o‘tish'], 'Sign in':['Войти','Kirish'], 'Registering...':['Регистрация…','Ro‘yxatdan o‘tilmoqda…'],
'Signing in...':['Вход…','Kirilmoqda…'], 'Already have an account? Sign in':['Уже есть аккаунт? Войти','Hisobingiz bormi? Kirish'],
'No account yet? Register':['Нет аккаунта? Зарегистрируйтесь','Hisobingiz yo‘qmi? Ro‘yxatdan o‘ting'],
'Display name (optional)':['Имя (необязательно)','Ism (ixtiyoriy)'], 'Email':['Электронная почта','Elektron pochta'],
'Password (10+ chars, upper/lower/number/symbol)':['Пароль: 10+ символов, буквы, цифра и спецсимвол','Parol: 10+ belgi, katta-kichik harf, raqam va maxsus belgi'],
'Overall Score':['Оценка кода','Kod bahosi'], 'Mentor Mode':['Режим наставника','Ustoz rejimi'],
'Recent Analyses':['Последние анализы','Oxirgi tahlillar'], 'View all':['Все','Barchasi'],
'Average Score':['Средняя оценка','O‘rtacha baho'], 'Analyses':['Анализы','Tahlillar'],
'View Progress →':['Посмотреть прогресс →','Rivojlanishni ko‘rish →'],
'Loading your analyses...':['Загрузка истории…','Tarix yuklanmoqda…'],
'Analyzing your code...':['Анализируем код…','Kod tahlil qilinmoqda…'], 'Not signed in':['Вход не выполнен','Hisobga kirilmagan'],
'Проверить признаки AI':['Проверить признаки AI','AI belgilarini tekshirish'],
'Запуск кода':['Запуск кода','Kodni ishga tushirish'], 'Язык запуска':['Язык запуска','Ishga tushirish tili'],
'▶ Запустить · Ctrl+Enter':['▶ Запустить · Ctrl+Enter','▶ Ishga tushirish · Ctrl+Enter'],
'■ Остановить':['■ Остановить','■ To‘xtatish'],
'Ввод для input() / prompt() — по одной строке':['Ввод для input() / prompt() — по одной строке','input() / prompt() uchun qiymatlar — har qatorda bittadan'],
};
const originalText = new WeakMap();
function localizeShell() {
    document.documentElement.lang = window.MentorLocale;
    const index = window.MentorLocale === 'uz' ? 1 : 0;
    const visit = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes=[]; while(visit.nextNode()) nodes.push(visit.currentNode);
    for(const node of nodes) {
        if(node.parentElement?.closest('script,style,textarea,pre,code,#learningRoot,#learningFeedback,#executionOutput,#executionStatus,#resultsContainer,#userName,#userEmail')) continue;
        const value=node.textContent.trim();
        let key=originalText.get(node);
        if(!key || ![key,...(uiTranslations[key]||[])].includes(value)) key=value;
        if(!uiTranslations[key]) continue;
        originalText.set(node,key);
        const replacement=uiTranslations[key][index];
        if(value!==replacement) node.textContent=node.textContent.replace(value,replacement);
    }
    for(const [id,key] of [['authName','Display name (optional)'],['authEmail','Email'],['authPassword','Password (10+ chars, upper/lower/number/symbol)']]) {
        const el=document.getElementById(id); if(el) el.placeholder=uiTranslations[key][index];
    }
    const select=document.getElementById('localeSelect'); if(select) select.value=window.MentorLocale;
}
window.setMentorLocale=locale=>{
    window.MentorLocale=locale==='uz'?'uz':'ru';
    localStorage.setItem('mentor_locale',window.MentorLocale);
    localizeShell();
    window.dispatchEvent(new CustomEvent('mentor-locale'));
};
localizeShell();
new MutationObserver(localizeShell).observe(document.body,{subtree:true,childList:true,characterData:true});
