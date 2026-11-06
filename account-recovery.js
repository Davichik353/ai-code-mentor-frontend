'use strict';
(() => {
    const box=document.querySelector('.auth-box');
    const tr=(ru,uz)=>window.MentorLocale==='uz'?uz:ru;
    let token=new URLSearchParams(location.hash.slice(1)).get('reset');
    if(token) history.replaceState(null,'',location.pathname+location.search);
    const panel=document.createElement('section');
    panel.id='recoveryPanel';panel.hidden=true;
    panel.innerHTML='<h2 id="recoveryTitle"></h2><p id="recoveryHelp"></p><form id="recoveryForm"><input id="recoveryEmail" type="email" maxlength="254" autocomplete="email"><input id="recoveryPassword" type="password" minlength="10" maxlength="256" autocomplete="new-password"><button class="btn-primary" id="recoverySubmit" type="submit"></button></form><p id="recoveryMessage" role="status"></p><button type="button" class="btn-secondary" id="recoveryBack"></button>';
    window.AccountRecovery={get active(){return !panel.hidden;}};
    const forgot=document.createElement('button');forgot.type='button';forgot.className='auth-switch';forgot.id='forgotPassword';
    forgot.style.cssText='background:none;border:0;color:#dcb1ff;width:100%;margin-top:12px;cursor:pointer';
    box.append(forgot,panel);
    function labels(){
        forgot.textContent=tr('Забыли пароль?','Parolni unutdingizmi?');
        document.getElementById('recoveryTitle').textContent=token?tr('Новый пароль','Yangi parol'):tr('Восстановить доступ','Kirishni tiklash');
        document.getElementById('recoveryHelp').textContent=token?tr('Минимум 10 символов: заглавная и строчная буква, цифра и спецсимвол.','Kamida 10 belgi: katta-kichik harf, raqam va maxsus belgi.'):tr('Укажите email аккаунта. Если он зарегистрирован, мы отправим ссылку на 15 минут.','Hisob emailingizni kiriting. Ro‘yxatda bo‘lsa, 15 daqiqalik havola yuboramiz.');
        document.getElementById('recoverySubmit').textContent=token?tr('Сохранить пароль','Parolni saqlash'):tr('Отправить ссылку','Havolani yuborish');
        document.getElementById('recoveryBack').textContent=tr('Вернуться ко входу','Kirishga qaytish');
        document.getElementById('recoveryEmail').placeholder='Email';
        document.getElementById('recoveryPassword').placeholder=tr('Новый пароль','Yangi parol');
    }
    function open(){
        for(const child of box.children) if(child!==panel) {child.dataset.recoveryDisplay=child.style.display;child.style.display='none';}
        panel.hidden=false;document.getElementById("recoveryForm").hidden=false;labels();
        document.getElementById('recoveryEmail').hidden=!!token;
        document.getElementById('recoveryEmail').required=!token;
        document.getElementById('recoveryPassword').hidden=!token;
        document.getElementById('recoveryPassword').required=!!token;
        showAuthOverlay();
    }
    document.getElementById('recoveryBack').onclick=()=>{
        token=null;panel.hidden=true;
        for(const child of box.children) if(child!==panel) child.style.display=child.dataset.recoveryDisplay||'';
    };
    forgot.onclick=open;
    document.getElementById('recoveryForm').onsubmit=async event=>{
        event.preventDefault();const submit=document.getElementById('recoverySubmit');submit.disabled=true;
        const message=document.getElementById('recoveryMessage');message.textContent=tr('Отправляем…','Yuborilmoqda…');
        try {
            const response=await fetch(`${API_URL}/auth/${token?'reset-password':'forgot-password'}`,{
                method:'POST',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json'},
                body:JSON.stringify(token?{token,password:document.getElementById('recoveryPassword').value}:{email:document.getElementById('recoveryEmail').value.trim()})
            });
            if(!response.ok) {
                message.textContent=response.status===429?tr('Слишком много попыток. Повторите позже.','Urinishlar ko‘p. Keyinroq qayta urinib ko‘ring.'):
                    response.status===503?tr('Отправка почты пока недоступна. Повторите позже.','Pochta yuborish hozircha mavjud emas. Keyinroq urinib ko‘ring.'):
                    tr('Проверьте пароль или запросите новую ссылку.','Parolni tekshiring yoki yangi havola so‘rang.');
            } else if(token) {
                localStorage.removeItem('mentor_token');token=null;
                document.getElementById('recoveryPassword').value='';
                message.textContent=tr('Пароль изменён. Вернитесь ко входу и войдите с новым паролем.','Parol yangilandi. Yangi parol bilan qayta kiring.');
                document.getElementById('recoveryForm').hidden=true;
            } else message.textContent=tr('Если аккаунт существует, письмо будет отправлено. Проверьте также папку «Спам».','Hisob mavjud bo‘lsa, xat yuboriladi. Spam jildini ham tekshiring.');
        } catch(error){message.textContent=tr('Нет ответа от сервера. Повторите позже.','Server javob bermadi. Keyinroq urinib ko‘ring.');}
        finally{submit.disabled=false;}
    };
    window.addEventListener('hashchange',()=>{
        const next=new URLSearchParams(location.hash.slice(1)).get('reset');
        if(next){token=next;history.replaceState(null,'',location.pathname+location.search);open();}
    });
    window.addEventListener('mentor-locale',labels);labels();
    if(token) open();
})();
