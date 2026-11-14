'use strict';
(()=>{
 const tr=(ru,uz)=>window.MentorLocale==='uz'?uz:ru,esc=x=>escapeHtml(String(x??''));
 const identity=()=>{try{return JSON.parse(atob(localStorage.getItem('mentor_token').split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub||'';}catch{return '';}};
 const diagnostics={js_errors:0,network_errors:0};
 addEventListener('error',()=>diagnostics.js_errors=Math.min(1000,diagnostics.js_errors+1));
 addEventListener('unhandledrejection',()=>diagnostics.js_errors=Math.min(1000,diagnostics.js_errors+1));
 addEventListener('offline',()=>diagnostics.network_errors=Math.min(1000,diagnostics.network_errors+1));
 const editor=document.getElementById('codeInput'),bar=document.createElement('div');bar.className='draft-recovery';editor.before(bar);
 let timer,owner=identity(),lastSaved='';
 const storageKey=()=>`mentor-editor-drafts:${owner}`;
 function versions(){try{const data=JSON.parse(localStorage.getItem(storageKey())||'[]');return Array.isArray(data)?data:[];}catch{return [];}}
 function renderDraft(){
  const saved=versions();bar.innerHTML=`<span id="editorDraftState" role="status">${owner?tr('Черновик сохраняется в этом браузере.','Qoralama shu brauzerda saqlanadi.'):tr('Войдите для сохранения черновиков.','Qoralamalarni saqlash uchun kiring.')}</span>${saved.length?`<button type="button" class="btn-secondary" id="restoreEditorDraft">${tr('Восстановить черновик','Qoralamani tiklash')}</button>`:''}`;
  bar.querySelector('button')?.addEventListener('click',()=>{
   const items=versions(),dialog=document.createElement('dialog');dialog.className='support-dialog';
   dialog.innerHTML=`<h2>${tr('Восстановление кода','Kodni tiklash')}</h2><label>${tr('Сохранённая версия','Saqlangan nusxa')}<select>${items.map((v,i)=>`<option value="${i}">${esc(v.filename)} · ${esc(new Date(v.time).toLocaleString())}</option>`).join('')}</select></label><p>${tr('Восстановление заменит код в редакторе. Текущий непустой код будет сохранён отдельной версией.','Tiklash muharrirdagi kodni almashtiradi. Joriy bo‘sh bo‘lmagan kod alohida nusxa sifatida saqlanadi.')}</p><div class="actions"><button type="button" data-restore>${tr('Восстановить','Tiklash')}</button><button type="button" data-close>${tr('Отмена','Bekor qilish')}</button></div>`;
   dialog.querySelector('[data-close]').onclick=()=>dialog.close();
   dialog.querySelector('[data-restore]').onclick=()=>{const v=items[Number(dialog.querySelector('select').value)];save(true);editor.value=v.code;selectedFilename=v.filename;document.getElementById('languageSelect').value=v.language;syncEditorFile();lastSaved='';save(true);dialog.close();};
   dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
  });
 }
 function save(force=false){
  if(!owner||identity()!==owner||!editor.value.trim())return;
  const value={code:editor.value,filename:selectedFilename,language:document.getElementById('languageSelect').value};
  const fingerprint=JSON.stringify(value);if(fingerprint===lastSaved)return;
  try{
   const history=versions(),at=Date.now();
   if(!force&&history.length&&at-history[0].time<30000)history.shift();
   history.unshift({...value,time:at});localStorage.setItem(storageKey(),JSON.stringify(history.slice(0,5)));lastSaved=fingerprint;renderDraft();
   document.getElementById('editorDraftState').textContent=tr('Черновик сохранён в браузере.','Qoralama brauzerda saqlandi.');
  }catch{document.getElementById('editorDraftState').textContent=tr('Не удалось сохранить. Скопируйте код перед закрытием.','Saqlab bo‘lmadi. Yopishdan oldin kodni nusxalang.');}
 }
 document.addEventListener('input',e=>{if(['codeInput','editorFileLabel','languageSelect'].includes(e.target.id)){clearTimeout(timer);timer=setTimeout(save,500);}});
 addEventListener('pagehide',()=>save());document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
 addEventListener('mentor-authenticated',()=>{clearTimeout(timer);owner=identity();lastSaved='';renderDraft();});
 addEventListener('mentor-locale',renderDraft);renderDraft();

 async function request(path,body){
  let r;try{r=await fetch(API_URL+'/support'+path,{method:body?'POST':'GET',headers:{...authHeaders(),'Content-Type':'application/json'},signal:AbortSignal.timeout(30000),...(body?{body:JSON.stringify(body)}:{})});}
  catch{diagnostics.network_errors=Math.min(1000,diagnostics.network_errors+1);throw Error(tr('Нет связи с сервером. Текст остался в форме.','Server bilan aloqa yo‘q. Matn shaklda qoldi.'));}
  if(!r.ok)throw Error(r.status===401?tr('Войдите в аккаунт.','Hisobga kiring.'):r.status===429?tr('Слишком много обращений. Повторите позже.','Murojaatlar ko‘p. Keyinroq urinib ko‘ring.'):tr('Не удалось выполнить действие. Повторите позже.','Amal bajarilmadi. Keyinroq urinib ko‘ring.'));
  return r.json();
 }
 async function support(){
  if(!localStorage.getItem('mentor_token')){showAuthOverlay();return;}
  document.querySelector('#supportDialog')?.remove();
  const dialog=document.createElement('dialog');dialog.id='supportDialog';dialog.className='support-dialog';dialog.setAttribute('aria-labelledby','supportTitle');
  dialog.innerHTML=`<div class="support-heading"><h2 id="supportTitle">${tr('Поддержка','Yordam')}</h2><button type="button" data-close aria-label="${tr('Закрыть','Yopish')}">×</button></div><p>${tr('Не указывайте пароли, ключи API и чужие персональные данные. Ответ появится здесь, в списке обращений.','Parollar, API kalitlari va boshqalarning shaxsiy ma’lumotlarini yozmang. Javob shu yerda, murojaatlar ro‘yxatida paydo bo‘ladi.')}</p><form id="supportForm"><label>${tr('Тема','Mavzu')}<select name="category"><option value="access">${tr('Вход и аккаунт','Kirish va hisob')}</option><option value="code">${tr('Редактор и запуск кода','Muharrir va kod bajarilishi')}</option><option value="classroom">${tr('Группы и задания','Guruhlar va topshiriqlar')}</option><option value="other">${tr('Другое','Boshqa')}</option></select></label><label>${tr('Что произошло и как повторить?','Nima bo‘ldi va qanday takrorlash mumkin?')}<textarea name="message" required minlength="10" maxlength="4000" rows="5"></textarea></label><label class="check-label"><input name="diagnostics" type="checkbox">${tr('Приложить счётчики ошибок, язык и состояние подключения. Код и история не отправляются.','Xatolar soni, til va ulanish holatini qo‘shish. Kod va tarix yuborilmaydi.')}</label><button type="submit" class="btn-primary">${tr('Отправить обращение','Murojaat yuborish')}</button></form><p id="supportStatus" role="status"></p><button type="button" data-refresh>${tr('Обновить ответы','Javoblarni yangilash')}</button><div id="supportTickets"></div>`;
  let requestKey=crypto.randomUUID();const status=dialog.querySelector('#supportStatus');
  async function refresh(){
   try{const data=await request('/tickets');dialog.querySelector('#supportTickets').innerHTML=`<h3>${data.is_staff?tr('Входящие обращения','Kelgan murojaatlar'):tr('Мои обращения','Mening murojaatlarim')}</h3>`+data.tickets.map(t=>`<article class="support-ticket"><h4>#${esc(t.id.slice(0,8))} · ${t.status==='resolved'?tr('Отвечено','Javob berilgan'):tr('Открыто','Ochiq')}</h4><p class="support-text">${esc(t.message)}</p>${t.reply?`<p class="support-reply">${esc(t.reply)}</p>`:''}${data.is_staff?`<details><summary>${tr('Ответить','Javob berish')}</summary><form data-ticket="${esc(t.id)}"><label>${tr('Ответ пользователю','Foydalanuvchiga javob')}<textarea name="reply" minlength="10" maxlength="4000" required>${esc(t.reply)}</textarea></label><label class="check-label"><input type="checkbox" name="resolved" ${t.status==='resolved'?'checked':''}>${tr('Вопрос решён','Masala hal qilindi')}</label><button type="submit">${tr('Сохранить ответ','Javobni saqlash')}</button></form></details>`:''}</article>`).join('');}
   catch(e){status.textContent=e.message;}
  }
  dialog.addEventListener('submit',async e=>{
   e.preventDefault();const form=e.target,button=form.querySelector('[type=submit]');button.disabled=true;status.textContent=tr('Сохраняем…','Saqlanmoqda…');
   try{
    if(form.dataset.ticket){await request(`/tickets/${form.dataset.ticket}/reply`,{reply:form.elements.reply.value,status:form.elements.resolved.checked?'resolved':'open'});status.textContent=tr('Ответ сохранён.','Javob saqlandi.');}
    else{const result=await request('/tickets',{request_key:requestKey,category:form.elements.category.value,message:form.elements.message.value,diagnostics:form.elements.diagnostics.checked?{...diagnostics,locale:window.MentorLocale||'ru',online:navigator.onLine}:null});requestKey=crypto.randomUUID();form.reset();status.textContent=tr('Обращение сохранено. Номер: ','Murojaat saqlandi. Raqami: ')+result.id.slice(0,8);}
    await refresh();
   }catch(e){status.textContent=e.message;}finally{button.disabled=false;}
  });
  dialog.querySelector('[data-refresh]').onclick=refresh;dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();await refresh();
 }
 window.SupportUI={open:support};
 const nav=document.createElement('button');nav.className='nav-item';nav.id='supportNav';nav.type='button';nav.textContent=tr('Поддержка','Yordam');nav.onclick=support;document.getElementById('settingsNav').after(nav);
 addEventListener('mentor-locale',()=>nav.textContent=tr('Поддержка','Yordam'));
})();
