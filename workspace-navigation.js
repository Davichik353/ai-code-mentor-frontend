/* Screen-level navigation: saved work and history do not render underneath the editor. */
(()=>{
 const titles={history:['История','Tarix'],progress:['Прогресс','Rivojlanish'],statistics:['Статистика','Statistika'],saved:['Сохранённый код','Saqlangan kod'],editor:['Редактор кода','Kod muharriri']};
 let screen='editor';
 function heading(){
  const title=titles[screen][window.MentorLocale==='uz'?1:0];
  document.querySelector('.header h1').textContent=title;
  document.querySelector('.results-card .card-title').textContent=screen==='editor'?(window.MentorLocale==='uz'?'Tahlil natijalari':'Результаты анализа'):title;
  document.querySelector('.header p').textContent=screen==='editor'?(window.MentorLocale==='uz'?'Yozing, ishga tushiring va maslahat oling':'Пишите код, запускайте и получайте подсказки'):'';
 }
 function show(name){
  screen=name;document.body.dataset.workspaceScreen=name;heading();
  document.querySelector('.content').scrollTop=0;
 }
 for(const [fn,name] of Object.entries({loadHistory:'history',showProgress:'progress',showStatistics:'statistics',showSavedSnippets:'saved',clearCode:'editor',restoreSnippet:'editor',openHistoryItem:'editor'})){
  const original=window[fn];if(!original)continue;
  window[fn]=function(...args){const result=original.apply(this,args);show(name);return result;};
 }
 window.showDashboard=()=>{window.LearningUI?.close();window.SettingsUI?.close();show('editor');};
 document.querySelectorAll('.nav-item').forEach(el=>{
  if(el.tagName!=='BUTTON'){el.setAttribute('role','button');el.tabIndex=0;el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();el.click();}});}
  el.addEventListener('click',()=>queueMicrotask(()=>document.querySelectorAll('.nav-item').forEach(item=>item.classList.toggle('active',item===el))));
 });
 window.addEventListener('mentor-locale',()=>{if(document.getElementById('learningRoot').hidden&&document.getElementById('settingsRoot').hidden)heading();});
})();
