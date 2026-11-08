'use strict';
(() => {
    const root=document.getElementById('settingsRoot');
    const state={account:null,draft:null,request:0};
    const tr=(ru,uz)=>window.MentorLocale==='uz'?uz:ru;
    const esc=value=>escapeHtml(String(value??''));
    const select=(id,label,options,value)=>`<label class="settings-control">${esc(label)}<select id="${id}" name="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(value)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;
    function header(){
        document.querySelector('.header h1').textContent=tr('Настройки','Sozlamalar');
        document.querySelector('.header p').textContent=tr('Профиль, интерфейс и управление аккаунтом','Profil, interfeys va hisobni boshqarish');
        document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.id==='settingsNav'));
    }
    function message(text,error=false){
        const el=document.getElementById('settingsMessage');if(!el)return;
        el.textContent=text;el.classList.toggle('settings-error',error);
    }
    function render(){
        const d=state.draft,a=state.account;
        if(!d||!a)return;
        const date=new Date(a.created_at);
        const registered=Number.isNaN(date.getTime())?'—':date.toLocaleDateString(window.MentorLocale==='uz'?'uz-UZ':'ru-RU');
        root.innerHTML=`<form id="accountSettingsForm"><div class="settings-page-intro"><h2>${tr('Настройте кабинет под себя','Kabinetni o‘zingizga moslang')}</h2><p>${tr('Имя сохраняется в аккаунте. Параметры интерфейса и редактора — в этом браузере.','Ism hisobda saqlanadi. Interfeys va muharrir sozlamalari shu brauzerda saqlanadi.')}</p></div>
        <div class="settings-grid"><section class="settings-card"><h3>${tr('Профиль','Profil')}</h3>
        <label class="settings-control">${tr('Ваше имя','Ismingiz')}<input id="settingsName" name="settingsName" maxlength="120" autocomplete="name" value="${esc(d.name)}" placeholder="${tr('Как к вам обращаться','Sizga qanday murojaat qilaylik')}"></label>
        <label class="settings-control">${tr('Электронная почта','Elektron pochta')}<input id="settingsEmail" type="email" value="${esc(a.email)}" readonly></label>
        <p class="settings-help">${tr('Дата регистрации','Ro‘yxatdan o‘tgan sana')}: ${esc(registered)}</p>
        <p class="settings-help">${tr('В своей группе вы преподаватель, в группе по коду — ученик.','O‘z guruhingizda o‘qituvchisiz, kod orqali kirgan guruhda esa o‘quvchisiz.')}</p></section>
        <section class="settings-card"><h3>${tr('Интерфейс','Interfeys')}</h3>
        ${select('settingsLocale',tr('Язык интерфейса','Interfeys tili'),[['ru','Русский'],['uz','O‘zbekcha']],d.locale)}
        ${select('settingsTheme',tr('Оформление','Ko‘rinish'),[['light',tr('Светлое','Yorug‘')],['dark',tr('Тёмное','Qorong‘i')]],d.theme)}
        <p class="settings-help">${tr('Язык объяснений AI соответствует языку интерфейса.','AI izohlari interfeys tilida beriladi.')}</p></section>
        <section class="settings-card"><h3>${tr('Редактор и анализ','Muharrir va tahlil')}</h3>
        ${select('settingsLanguage',tr('Язык кода по умолчанию','Standart kod tili'),[['',tr('Определять автоматически','Avtomatik aniqlash')],...['Python','JavaScript','TypeScript','Java','C++','C#','Go','Rust','PHP','Ruby','SQL','HTML','CSS','Other'].map(x=>[x,x])],d.defaultLanguage)}
        ${select('settingsFontSize',tr('Размер текста кода','Kod matni o‘lchami'),[['14','14 px'],['16','16 px'],['18','18 px'],['20','20 px']],d.fontSize)}
        <label class="settings-check"><input id="settingsAutoSave" type="checkbox" ${d.autoSave?'checked':''}>${tr('Сохранять проанализированный код в «Сохранённый код»','Tahlil qilingan kodni «Saqlangan kod»ga saqlash')}</label>
        <p class="settings-help">${tr('Сохранённые фрагменты доступны только в этом браузере.','Saqlangan parchalar faqat shu brauzerda mavjud.')}</p></section>
        <section class="settings-card"><h3>${tr('Доступ и данные','Kirish va ma’lumotlar')}</h3>
        <p>${tr('Запросите ссылку для смены пароля или сохраните копию истории.','Parolni yangilash havolasini so‘rang yoki tarix nusxasini saqlang.')}</p>
        <div class="settings-button-list"><button type="button" class="btn-secondary" data-settings-action="recover">${tr('Восстановить / сменить пароль','Parolni tiklash / yangilash')}</button><button type="button" class="btn-secondary" data-settings-action="export">${tr('Экспорт истории','Tarixni eksport qilish')}</button><a href="data-policy.html" target="_blank" rel="noopener">${tr('Политика данных','Ma’lumotlar siyosati')}</a></div>
        <p class="settings-help">${tr('Экспорт содержит до 50 последних записей истории. Отправка ссылки требует доступной почты сервиса.','Eksport oxirgi 50 tagacha tarix yozuvini oladi. Havola yuborish uchun xizmat pochtasi ishlashi kerak.')}</p></section></div>
        <div class="settings-save-row"><button class="btn-primary" id="settingsSaveButton" type="submit">${tr('Сохранить настройки','Sozlamalarni saqlash')}</button><p id="settingsMessage" role="status" aria-live="polite"></p></div>
        </form><section class="settings-card settings-account-actions"><div><h3>${tr('Управление аккаунтом','Hisobni boshqarish')}</h3><p>${tr('Удаление аккаунта и его работ необратимо.','Hisob va uning ishlarini o‘chirishni qaytarib bo‘lmaydi.')}</p></div><div class="settings-button-list"><button type="button" class="btn-secondary" data-settings-action="logout">${tr('Выйти из аккаунта','Hisobdan chiqish')}</button><button type="button" class="btn-secondary danger-button" data-settings-action="delete">${tr('Удалить аккаунт','Hisobni o‘chirish')}</button></div></section>`;
    }
    async function request(path,options={}){
        let response;
        try{response=await fetch(`${API_URL}${path}`,{signal:AbortSignal.timeout(30000),...options,headers:{...authHeaders(),...(options.headers||{})}});}
        catch{throw Error(tr('Сервер не ответил. Проверьте соединение и повторите.','Server javob bermadi. Aloqani tekshirib, qayta urinib ko‘ring.'));}
        if(response.status===401){showAuthOverlay();throw Error(tr('Войдите в аккаунт.','Hisobga kiring.'));}
        if(!response.ok)throw Error(response.status===429?tr('Слишком много запросов. Повторите позже.','So‘rovlar ko‘p. Keyinroq urinib ko‘ring.'):tr('Не удалось выполнить действие. Повторите позже.','Amal bajarilmadi. Keyinroq urinib ko‘ring.'));
        return response.json();
    }
    async function open(){
        window.LearningUI?.close();
        const serial=++state.request;
        state.account=null;state.draft=null;
        root.hidden=false;document.querySelector('.main > .content').style.display='none';header();root.scrollTop=0;
        root.innerHTML=`<section class="settings-card settings-loading" role="status"><h2>${tr('Загружаем настройки…','Sozlamalar yuklanmoqda…')}</h2><p>${tr('Получаем данные аккаунта. После простоя сервер может отвечать дольше.','Hisob ma’lumotlari olinmoqda. Tanaffusdan so‘ng server sekinroq javob berishi mumkin.')}</p></section>`;
        try{
            const account=await request('/auth/me');if(serial!==state.request)return;
            state.account=account;const saved=getSettings();
            state.draft={name:account.display_name||'',locale:window.MentorLocale,theme:saved.theme,defaultLanguage:saved.defaultLanguage||'',autoSave:!!saved.autoSave,fontSize:saved.fontSize||14};
            render();
        }catch(error){if(serial===state.request)root.innerHTML=`<section class="settings-card settings-loading"><h2>${tr('Настройки недоступны','Sozlamalar mavjud emas')}</h2><p>${esc(error.message)}</p><button type="button" class="btn-primary" data-settings-action="retry">${tr('Повторить загрузку','Qayta yuklash')}</button></section>`;}
    }
    function close(){
        if(root.hidden)return;
        ++state.request;root.hidden=true;document.querySelector('.main > .content').style.display='';
        document.getElementById('settingsNav').classList.remove('active');
        document.querySelector('.header h1').textContent=tr('Анализ кода','Kod tahlili');
        document.querySelector('.header p').textContent=tr('Вставьте код и получите объяснение ошибок','Kodni kiriting va xatolar izohini oling');
    }
    async function save(){
        const serial=state.request;
        const button=document.getElementById('settingsSaveButton');button.disabled=true;message(tr('Сохраняем…','Saqlanmoqda…'));
        try{
            const d=state.draft;
            if(d.name.trim()!==(state.account.display_name||'')){
                state.account=await request('/auth/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({display_name:d.name.trim()||null})});
                document.getElementById('userName').textContent=state.account.display_name||state.account.email.split('@')[0];
                document.getElementById('userEmail').textContent=state.account.email;
            }
            localStorage.setItem('mentor_settings',JSON.stringify({...getSettings(),theme:d.theme,defaultLanguage:d.defaultLanguage,autoSave:d.autoSave,fontSize:Number(d.fontSize)}));
            applySettings();setMentorLocale(d.locale);
            if(serial===state.request&&!root.hidden){header();message(tr('Настройки сохранены.','Sozlamalar saqlandi.'));}
        }catch(error){message(error.message,true);}
        finally{const el=document.getElementById('settingsSaveButton');if(el)el.disabled=false;}
    }
    async function exportHistory(){
        message(tr('Готовим файл…','Fayl tayyorlanmoqda…'));
        try{
            const data=await request('/history?limit=50');
            const blob=new Blob([JSON.stringify({exported_at:new Date().toISOString(),analyses:data.analyses||[]},null,2)],{type:'application/json'});
            const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='ai-code-mentor-history.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
            message(tr('История выгружена в JSON.','Tarix JSON fayliga yuklandi.'));
        }catch(error){message(error.message,true);}
    }
    async function deleteAccount(){
        if(!confirm(tr('Удалить аккаунт, анализы и учебные работы? Отменить это действие нельзя.','Hisob, tahlillar va o‘quv ishlarini o‘chirasizmi? Bu amalni qaytarib bo‘lmaydi.')))return;
        try{await request('/auth/account',{method:'DELETE'});for(const key of ['mentor_token','mentor_saved_snippets','mentor_saved_snippet'])localStorage.removeItem(key);location.reload();}
        catch(error){message(error.message,true);}
    }
    root.addEventListener('input',event=>{
        const map={settingsName:'name',settingsLocale:'locale',settingsTheme:'theme',settingsLanguage:'defaultLanguage',settingsFontSize:'fontSize',settingsAutoSave:'autoSave'};
        if(state.draft&&map[event.target.id])state.draft[map[event.target.id]]=event.target.type==='checkbox'?event.target.checked:event.target.value;
    });
    root.addEventListener('submit',event=>{event.preventDefault();save();});
    root.addEventListener('click',async event=>{
        const el=event.target.closest('[data-settings-action]');if(!el||el.disabled)return;
        const action=el.dataset.settingsAction;el.disabled=true;
        try{
            if(action==='retry')await open();
            else if(action==='export')await exportHistory();
            else if(action==='recover'){window.AccountRecovery?.open(state.account?.email);}
            else if(action==='logout')logout();
            else if(action==='delete')await deleteAccount();
        }finally{if(el.isConnected)el.disabled=false;}
    });
    window.addEventListener('mentor-locale',()=>{if(!root.hidden&&state.account){state.draft.locale=window.MentorLocale;render();header();}});
    window.SettingsUI={open,close,save,exportHistory,deleteAccount};
    for(const name of ['clearCode','loadHistory','showProgress','showStatistics','showSavedSnippets']){
        const original=window[name];if(original)window[name]=function(...args){close();return original.apply(this,args);};
    }
})();
