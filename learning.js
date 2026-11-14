'use strict';
(() => {
    const root=document.getElementById('learningRoot');
    const feedback=document.getElementById('learningFeedback');
    const state={groupTab:'board',boardColumn:'todo',groupId:null,view:'home',data:null,profile:null,templates:[],filters:{catalog:{category:'all',difficulty:'all',language:'all'},assigned:{category:'all',difficulty:'all',language:'all'},glossary:{category:'all',language:'Python',query:''}},drafts:{},report:null,controller:null,publicSlug:null};
    let loadedAccount='';
    let navigationId=0;
    let pendingAuth=false;
    const tr=(ru,uz)=>window.MentorLocale==='uz'?uz:ru;
    const local=value=>typeof value==='object' && value!==null ? value[window.MentorLocale]||value.ru||'' : String(value??'');
    const esc=value=>escapeHtml(String(value??''));
    const button=(label,action,id='',extra='')=>`<button type="button" class="btn-primary" data-action="${action}" data-id="${esc(id)}" ${extra}>${esc(label)}</button>`;
    const status=value=>({pending_review:tr('Ожидает проверки','Tekshiruv kutilmoqda'),approved:tr('Принято преподавателем','O‘qituvchi qabul qildi'),needs_revision:tr('Нужна доработка','Qayta ishlash kerak')})[value]||value;
    const notice=()=>state.data?.server_check||state.data?.verification==='server_verified'?`<p class="notice">${tr('Код проверяется на сервере. Скрытые тесты не передаются в браузер. Итоговую оценку выставляет преподаватель.','Kod serverda tekshiriladi. Yashirin testlar brauzerga yuborilmaydi. Yakuniy bahoni o‘qituvchi qo‘yadi.')}</p>`:`<p class="notice">${tr('Тесты выполняются в браузере. Это непроверенный отчёт ученика: преподаватель проверяет код и мини-защиту перед принятием работы.','Testlar brauzerda bajariladi. Bu o‘quvchining tasdiqlanmagan hisoboti: ishni qabul qilishdan oldin o‘qituvchi kod va kichik himoyani tekshiradi.')}</p>`;
    function accountId() {
        try { const part=localStorage.getItem('mentor_token').split('.')[1]; return JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/'))).sub||''; } catch { return ''; }
    }
    const key=()=>`${loadedAccount}:${state.view}:${state.data?.id||''}`;
    function persistAssignment() {
        if(state.view!=='assignment'||root.hidden||loadedAccount!==accountId()||!accountId()||!document.getElementById('assignmentCode')) return;
        saveDraft();
        const el=document.getElementById('draftStatus');
        try {
            localStorage.setItem('mentor-assignment:'+key(),JSON.stringify(state.drafts[key()]));
            if(el) el.textContent=tr('Черновик сохранён в этом браузере. Преподавателю он ещё не отправлен.','Qoralama shu brauzerda saqlandi. O‘qituvchiga hali yuborilmadi.');
        } catch { if(el) el.textContent=tr('Не удалось сохранить черновик. Скопируйте код перед закрытием.','Qoralama saqlanmadi. Yopishdan oldin kodni nusxalang.'); }
    }
    const field=id=>document.getElementById(id)?.value||'';
    function saveDraft() {
        if(root.hidden||loadedAccount!==accountId()) return;
        const values={}; root.querySelectorAll('input[id],textarea[id],select[id]').forEach(el=>values[el.id]=el.type==='checkbox'?el.checked:el.value);
        state.drafts[key()]=values;
    }
    function restoreDraft() {
        let stored={};
        if(state.view==='assignment'&&accountId()) {
            try { stored=JSON.parse(localStorage.getItem('mentor-assignment:'+key())||'{}'); } catch {}
        }
        const values=state.drafts[key()]||stored||{};
        for(const [id,value] of Object.entries(values)) {
            const el=document.getElementById(id); if(!el) continue;
            if(el.type==='checkbox') el.checked=value; else if(el.tagName!=='SELECT'||[...el.options].some(o=>o.value===value)) el.value=value;
        }
    }
    function show(html) { root.innerHTML=html; restoreDraft(); updatePasteNotice();const join=document.getElementById('joinCode');if(join&&!join.value)join.value=sessionStorage.getItem('mentor_join')||''; }
    function updatePasteNotice() {
        const notice=document.getElementById('codePasteNotice');
        if(notice) notice.hidden=field('codePasteDetected')!=='true';
    }
    function recordCodePaste(event) {
        if(state.view!=='assignment'||!canSubmit(state.data)||!['assignmentCode','changedCode'].includes(event.target.id)) return;
        if(event.type==='beforeinput'&&!['insertFromPaste','insertFromDrop'].includes(event.inputType)) return;
        if(event.target.readOnly||event.target.disabled||event.defaultPrevented) return;
        if(event.type==='paste'&&!event.clipboardData?.getData('text/plain')) return;
        if(event.type==='drop'&&!event.dataTransfer?.getData('text/plain')) return;
        const flag=document.getElementById('codePasteDetected');
        if(flag) {flag.value='true';updatePasteNotice();persistAssignment();}
    }
    root.addEventListener('paste',recordCodePaste);
    root.addEventListener('beforeinput',recordCodePaste);
    root.addEventListener('drop',recordCodePaste);
    function message(text) { feedback.textContent=text; }
    function updateNavigation() {
        document.getElementById('learningNavLabel').textContent=tr('Учебный кабинет','O‘quv xonasi');
        document.getElementById('learningNavDescription').textContent=tr('Группы и задания','Guruhlar va topshiriqlar');
        const glossary=document.getElementById('glossaryNavLabel'); if(glossary) glossary.textContent=tr('Словарь и команды','Lug‘at va buyruqlar');
    }
    function showSignIn() {
        pendingAuth=true;
        show(`<section class="learning-card learning-state"><h2>${tr('Войдите в учебный кабинет','O‘quv xonasiga kiring')}</h2><p>${tr('Войдите, чтобы выполнять задания преподавателя или создать свою учебную группу.','Kiring va o‘qituvchi topshiriqlarini bajaring yoki o‘z guruhingizni yarating.')}</p>${button(tr('Войти или зарегистрироваться','Kirish yoki ro‘yxatdan o‘tish'),'sign-in')}</section>`);
    }
    async function api(path,body,publicRequest=false) {
        let response;
        try { response=await fetch(`${API_URL}/learning${path}`,{
            signal:AbortSignal.timeout(60000),
            method:body===undefined?'GET':'POST',
            headers:{'Content-Type':'application/json',...(publicRequest?{}:authHeaders())},
            ...(body===undefined?{}:{body:JSON.stringify(body)})
        }); } catch(error) {
            throw new Error(error.name==='TimeoutError'
                ? tr('Сервер не ответил за минуту. Повторите загрузку.','Server bir daqiqada javob bermadi. Qayta yuklang.')
                : tr('Нет соединения с сервером. Проверьте интернет и повторите.','Server bilan aloqa yo‘q. Internetni tekshirib, qayta urinib ko‘ring.'));
        }
        const data=await response.json();
        if(!response.ok) {
            if(response.status===401) {localStorage.removeItem('mentor_token'); showSignIn(); showAuthOverlay(); throw new Error(tr('Войдите в аккаунт.','Hisobingizga kiring.'));}
            if(/\/(assignment-drafts|custom-assignments)$/.test(path)) {
                throw new Error(typeof data.detail==='string'?data.detail:tr('Проверьте название, условие и тесты. Нужен хотя бы один тест с полями stdin и expected_stdout.','Nom, shart va testlarni tekshiring. stdin va expected_stdout maydonlari bilan kamida bitta test kerak.'));
            }
            if(response.status===422 && /\/groups\/[^/]+\/settings$/.test(path)) throw new Error(tr('Введите название (до 120 символов) и целое число мест от 1 до 500 либо оставьте лимит пустым.','Nomni (120 belgigacha) va 1–500 oralig‘idagi butun o‘rinlar sonini kiriting yoki chegarani bo‘sh qoldiring.'));
            if(response.status===422) throw new Error(tr('Проверьте поля: объяснения — от 20 символов, код — от 5.','Maydonlarni tekshiring: izohlar kamida 20 belgi, kod kamida 5 belgi.'));
            const errors={
                'Exercise already assigned to this group':['Это задание уже выдано группе. Выберите другое.','Bu topshiriq guruhga berilgan. Boshqasini tanlang.'],
                'Draft conflict':['Черновик изменён на другом устройстве. Восстановите облачную версию перед сохранением.','Qoralama boshqa qurilmada o‘zgargan. Avval bulutdagi nusxani tiklang.'],
                'Deadline passed':['Срок сдачи истёк. Обратитесь к преподавателю.','Topshirish muddati tugadi. O‘qituvchiga murojaat qiling.'],
                'Hints disabled':['Преподаватель отключил подсказки.','O‘qituvchi maslahatlarni o‘chirgan.'],
                'Solution disabled':['Преподаватель отключил показ решения.','O‘qituvchi yechimni ko‘rsatishni o‘chirgan.'],
                'Judge unavailable':['Сервер проверки пока недоступен. Попробуйте позже.','Tekshiruv serveri hozircha ishlamayapti. Keyinroq urinib ko‘ring.'],
                'Judge timeout':['Сервер проверки не успел ответить. Повторите позже.','Tekshiruv serveri vaqtida javob bermadi. Keyinroq urinib ko‘ring.'],
                'Mentor unavailable':['Наставник временно недоступен. Ваш код сохранён в редакторе.','Ustoz hozircha ishlamayapti. Kod muharrirda saqlangan.'],
                'Membership removed':['Преподаватель закрыл доступ к группе.','O‘qituvchi guruhga kirishni yopgan.'],
                'Transfer groups first':['Сначала передайте группы другому преподавателю.','Avval guruhlarni boshqa o‘qituvchiga bering.'],
                'Invite expired':['Приглашение использовано или истекло.','Taklif ishlatilgan yoki muddati tugagan.'],
                'Group is full':['В группе нет свободных мест. Обратитесь к преподавателю.','Guruhda bo‘sh joy yo‘q. O‘qituvchiga murojaat qiling.'],
                'Student limit below current membership':['Лимит не может быть меньше текущего числа учеников.','Chegara hozirgi o‘quvchilar sonidan kam bo‘lishi mumkin emas.'],
                'Group is archived':['Группа в архиве. Преподаватель может её восстановить.','Guruh arxivda. O‘qituvchi uni tiklashi mumkin.'],
                'Join code not found':['Код группы не найден.','Guruh kodi topilmadi.'],
                'Cannot approve failing tests':['Нельзя принять работу с проваленными тестами.','Testlardan o‘tmagan ishni qabul qilib bo‘lmaydi.'],
                'Mini-defense requires a changed version of the code':['Для защиты измените исходный код по условию.','Himoya uchun kodni topshiriqqa muvofiq o‘zgartiring.'],
                'Portfolio not found':['Портфолио скрыто или не найдено.','Portfolio yashirilgan yoki topilmadi.'],
                'Group not found':['Группа не найдена или недоступна.','Guruh topilmadi yoki ruxsat yo‘q.'],
            };
            throw new Error(errors[data.detail]?tr(...errors[data.detail]):tr(`Не удалось выполнить действие (${response.status}).`,`Amal bajarilmadi (${response.status}).`));
        }
        return data;
    }
    function activate() {
        window.SettingsUI?.close();
        document.querySelector('.main > .content').style.display='none';
        root.hidden=false; feedback.hidden=false;
        document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.id==='learningNav'));
        document.querySelector('.header h1').textContent=tr('Учебный кабинет','O‘quv xonasi');
        document.querySelector('.header p').textContent=tr('Группы, задания и проверка работ','Guruhlar, topshiriqlar va ishlarni tekshirish');
        updateNavigation();
    }
    function close() {
        navigationId++; pendingAuth=false;
        persistAssignment(); saveDraft(); state.controller?.abort(); state.report=null;
        root.removeAttribute('aria-busy');
        root.hidden=true; feedback.hidden=true; document.querySelector('.main > .content').style.display='';
        document.getElementById('learningNav').classList.remove('active');
        document.getElementById('glossaryNav')?.classList.remove('active');
        document.querySelector('.header h1').textContent=tr('Анализ кода','Kod tahlili');
        document.querySelector('.header p').textContent=tr('Вставьте код и получите объяснение ошибок','Kodni kiriting va xatolar izohini oling');
    }
    async function open(view='home',id='') {
        persistAssignment(); saveDraft(); state.controller?.abort(); state.controller=null;
        const navigation=++navigationId;
        message(''); activate();
        if(!localStorage.getItem('mentor_token') && view!=='public') { root.removeAttribute('aria-busy'); showSignIn(); showAuthOverlay(); return; }
        pendingAuth=false;
        root.setAttribute('aria-busy','true');
        show(`<section class="learning-loading workspace-loading" role="status" aria-live="polite">
            <div class="workspace-loading-heading"><div class="loading-code-mark" aria-hidden="true"><span>&lt;</span><i></i><span>&gt;</span></div><div><h2>${tr('Загружаем кабинет','Xona yuklanmoqda')}</h2><p>${tr('Получаем ваши данные…','Ma’lumotlaringiz olinmoqda…')}</p></div></div>
            <div class="loading-card-grid" aria-hidden="true">${[1,2,3].map(()=>`<div class="loading-card-placeholder"><span class="loading-line short"></span><span class="loading-line"></span><span class="loading-line medium"></span><span class="loading-line foot"></span></div>`).join('')}</div>
        </section>`);
        const slowTimer=setTimeout(()=>{
            if(navigation===navigationId && root.getAttribute('aria-busy')==='true') {
                const text=root.querySelector('.learning-loading p');
                if(text) text.textContent=tr('Сервер отвечает дольше обычного. Подождите немного…','Server odatdagidan sekinroq javob bermoqda. Biroz kuting…');
            }
        },10000);
        try {
        const previous=key();
        let data;
        if(view==='home') {
            const [profile,groups]=await Promise.all([api('/profile'),api('/groups')]);
            state.profile=profile; data={groups};
        } else if(view==='group') {
            data=await api(`/groups/${encodeURIComponent(id)}`);
            if(state.groupId!==id){state.groupId=id;state.groupTab='board';state.boardColumn='todo';}
            if(canManage(data)&&!state.templates.length) state.templates=await api('/templates');
        }
        else if(view==='assignment') data=await api(`/assignments/${encodeURIComponent(id)}`);
        else if(view==='schools') data={schools:await api('/schools')};
        else if(view==='school') {data=await api(`/schools/${id}`);data.my_groups=(await api('/groups')).filter(canManage);}
        else if(view==='submission') data=await api(`/submissions/${encodeURIComponent(id)}`);
        else if(view==='portfolio') { state.profile=await api('/profile'); data=await api('/portfolio'); }
        else if(view==='glossary') data=await api('/glossary');
        else if(view==='public') {state.publicSlug=id; data=await api(`/portfolios/${encodeURIComponent(id)}`,undefined,true); hideAuthOverlay();}
        if(navigation!==navigationId) return;
        loadedAccount=accountId();
        state.view=view; state.data=data;
        if(previous!==key()) state.report=null;
        render();
        root.scrollTop=0;
        } catch(error) {
            if(navigation!==navigationId) return;
            if(!pendingAuth) show(`<section class="learning-card learning-state"><h2>${view==='public'?tr('Портфолио недоступно','Portfolio mavjud emas'):tr('Не удалось загрузить кабинет','O‘quv xonasini yuklab bo‘lmadi')}</h2><p>${esc(error.message)}</p><div class="actions">${button(tr('Повторить загрузку','Qayta yuklash'),'home')}${button(tr('Вернуться к редактору','Muharrirga qaytish'),'editor')}</div></section>`);
            message(error.message);
        } finally {
            clearTimeout(slowTimer);
            if(navigation===navigationId) root.removeAttribute('aria-busy');
        }
    }
    const canManage=data=>data.can_manage ?? data.is_owner;
    const canSubmit=data=>data.can_submit ?? !data.is_owner;
    function roleLabel() {
        const teacher=['group','assignment','submission'].includes(state.view)?canManage(state.data):state.profile?.role==='teacher';
        const role=document.getElementById('userRole');
        if(role) role.textContent=teacher?tr('Преподаватель','O‘qituvchi'):tr('Ученик','O‘quvchi');
    }
    function categoryOptions(items, key, titleKey) {
        const unique=new Map();
        for(const item of items) unique.set(item[key]||(key==='difficulty'?'beginner':'basics'),local(item[titleKey])||(key==='difficulty'?tr('Новичок','Boshlovchi'):tr('Основы','Asoslar')));
        return [...unique].map(([id,label])=>({id,label}));
    }
    function filterSelect(scope,key,label,options) {
        return `<label>${esc(label)}<select id="${scope}-${key}" data-filter-scope="${scope}" data-filter-key="${key}">${[{id:'all',label:tr('Все','Barchasi')},...options].map(o=>`<option value="${esc(o.id)}" ${state.filters[scope][key]===o.id?'selected':''}>${esc(o.label)}</option>`).join('')}</select></label>`;
    }
    function exerciseFilters(scope,items) {
        return `<div class="exercise-filters">${filterSelect(scope,'category',tr('Тема','Mavzu'),categoryOptions(items,'category','category_title'))}${filterSelect(scope,'difficulty',tr('Уровень','Daraja'),categoryOptions(items,'difficulty','difficulty_title'))}${filterSelect(scope,'language',tr('Язык кода','Kod tili'),[...new Set(items.map(t=>t.language))].map(id=>({id,label:id})))}</div>`;
    }
    function filteredExercises(items,scope) {
        const filters=state.filters[scope];
        return items.filter(item=>Object.entries(filters).every(([k,v])=>v==='all'||(item[k]||(k==='difficulty'?'beginner':'basics'))===v));
    }
    function exerciseBadges(item) {
        return `<span class="badge">${esc(item.language)}</span><span class="badge">${esc(local(item.category_title)||tr('Основы','Asoslar'))}</span><span class="badge">${esc(local(item.difficulty_title)||tr('Новичок','Boshlovchi'))}</span>`;
    }
    const back=(action,id='')=>button(tr('← Назад','← Orqaga'),action,id);
    function groupCard(g) { return `<section class="learning-card group-summary"><div class="group-card-heading"><h3>${esc(g.title)}</h3>${canManage(g)?`<details class="group-menu" name="group-actions"><summary aria-label="${esc(tr('Действия с группой','Guruh amallari')+': '+g.title)}"><span aria-hidden="true">⋮</span></summary><div class="group-menu-items">${g.archived?'':`${button(tr('Изменить название','Nomini o‘zgartirish'),'edit-group-title',g.id)}${button(tr('Количество мест','O‘rinlar soni'),'edit-group-limit',g.id)}`}${button(g.archived?tr('Восстановить группу','Guruhni tiklash'):tr('Архивировать группу','Guruhni arxivlash'),g.archived?'restore-group':'archive-group',g.id)}</div></details>`:''}</div><p>${esc(g.description)}</p><span class="badge">${canManage(g)?tr('Вы преподаватель этой группы','Siz bu guruh o‘qituvchisisiz'):tr('Вы ученик этой группы','Siz bu guruh o‘quvchisisiz')}</span><p>${tr('Учеников','O‘quvchilar')}: ${g.member_count}${g.student_limit?` / ${g.student_limit}`:''}</p>${button(tr('Открыть группу','Guruhni ochish'),'group',g.id)}</section>`; }
    function editGroupSettings(group,focusLimit) {
        const dialog=document.createElement('dialog');
        dialog.className='group-settings-dialog';dialog.setAttribute('aria-labelledby','groupSettingsTitle');
        dialog.innerHTML=`<form><h2 id="groupSettingsTitle">${tr('Настройки группы','Guruh sozlamalari')}</h2><label>${tr('Название группы','Guruh nomi')}<input name="title" required maxlength="120" value="${esc(group.title)}"></label><label>${tr('Максимум учеников','O‘quvchilar chegarasi')}<input name="limit" type="number" min="${Math.max(1,group.member_count||0)}" max="500" step="1" value="${group.student_limit||''}" placeholder="${tr('Без ограничения','Cheklanmagan')}"></label><p>${tr('Сейчас в группе','Hozir guruhda')}: ${group.member_count}. ${tr('Оставьте поле пустым, чтобы не ограничивать количество мест. Фактическое число учеников меняется при вступлении и выходе из группы.','O‘rinlarni cheklamaslik uchun maydonni bo‘sh qoldiring. Haqiqiy o‘quvchilar soni guruhga qo‘shilish va chiqishda o‘zgaradi.')}</p><p class="group-settings-error" role="alert"></p><div class="actions"><button type="button" class="btn-secondary" data-cancel>${tr('Отмена','Bekor qilish')}</button><button type="submit" class="btn-primary">${tr('Сохранить','Saqlash')}</button></div></form>`;
        document.body.append(dialog);
        dialog.addEventListener('close',()=>dialog.remove(),{once:true});
        dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
        dialog.querySelector('form').onsubmit=async event=>{
            event.preventDefault();const form=event.target, submit=form.querySelector('[type=submit]');
            const title=form.elements.title.value.trim(), raw=form.elements.limit.value;
            if(!title){form.elements.title.setCustomValidity(tr('Введите название группы.','Guruh nomini kiriting.'));form.elements.title.reportValidity();return;}
            submit.disabled=true;
            try {await api(`/groups/${group.id}/settings`,{title,student_limit:raw===''?null:Number(raw)});dialog.close();await open('home');}
            catch(error){dialog.querySelector('[role=alert]').textContent=error.message;}
            finally{submit.disabled=false;}
        };
        dialog.querySelector('[name=title]').addEventListener('input',event=>event.target.setCustomValidity(''));
        dialog.showModal();dialog.querySelector(focusLimit?'[name=limit]':'[name=title]').focus();
    }
    document.addEventListener('click',event=>{root.querySelectorAll('.group-menu[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});});
    root.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=event.target.closest('.group-menu[open]');if(menu){menu.open=false;menu.querySelector('summary').focus();event.preventDefault();}}});
    function renderHome() {
        const p=state.profile;
        return `<h2>${tr('Учебный кабинет','O‘quv xonasi')}</h2><p>${tr('Получайте задания в группе преподавателя или создайте свою группу для обучения.','O‘qituvchi guruhida topshiriq oling yoki o‘qitish uchun o‘z guruhingizni yarating.')}</p>
        <div class="actions">${button(tr('Моё портфолио','Mening portfoliom'),'portfolio')}${button(tr('Кабинет школы','Maktab xonasi'),'schools')}${button(tr('Словарь и команды','Lug‘at va buyruqlar'),'glossary')}${button(tr('Открыть редактор','Muharrirni ochish'),'editor')}</div>
                <h3>${tr('Мои группы','Mening guruhlarim')}</h3><div class="learning-grid" id="activeGroups">${state.data.groups.filter(g=>!g.archived).map(groupCard).join('')||tr('Активных групп пока нет.','Hozircha faol guruhlar yo‘q.')}</div>
        <div class="learning-grid"><section class="learning-card"><h3>${tr('Режим кабинета','Xona rejimi')}</h3>
            <p>${tr('Преподаватель управляет только созданными им группами. В чужой группе участник остаётся учеником независимо от выбранного режима.','O‘qituvchi faqat o‘zi yaratgan guruhlarni boshqaradi. Boshqa guruhda tanlangan rejimdan qat’i nazar ishtirokchi o‘quvchi bo‘lib qoladi.')}</p>
            <label>${tr('Режим','Rejim')}<select id="learningRole"><option value="learner" ${p.role==='learner'?'selected':''}>${tr('Ученик','O‘quvchi')}</option><option value="teacher" ${p.role==='teacher'?'selected':''}>${tr('Преподаватель — моя группа','O‘qituvchi — o‘z guruhim')}</option></select></label>
            ${button(tr('Сохранить режим','Rejimni saqlash'),'profile')}</section>
        <section class="learning-card"><h3>${tr('Вступить как ученик','O‘quvchi sifatida qo‘shilish')}</h3><p>${tr('Введите код преподавателя. Задания в этой группе выдаёт только её создатель.','O‘qituvchi kodini kiriting. Bu guruhda topshiriqlarni faqat guruh yaratuvchisi beradi.')}</p><label>${tr('Код от преподавателя','O‘qituvchi bergan kod')}<input id="joinCode" maxlength="64" autocomplete="off"></label>${button(tr('Присоединиться','Qo‘shilish'),'join')}</section>
        ${p.role==='teacher'?`<section class="learning-card"><h3>${tr('Создать свою группу','O‘z guruhini yaratish')}</h3><label>${tr('Название группы','Guruh nomi')}<input id="groupTitle" maxlength="120"></label><label>${tr('Описание','Tavsif')}<textarea id="groupDescription" maxlength="1000"></textarea></label>${button(tr('Создать группу','Guruh yaratish'),'create-group')}</section>`:''}</div>

        <details id="archivedGroups"><summary>${tr('Архив групп','Guruhlar arxivi')} (${state.data.groups.filter(g=>g.archived).length})</summary><div class="learning-grid">${state.data.groups.filter(g=>g.archived).map(groupCard).join('')||tr('Архив пуст.','Arxiv bo‘sh.')}</div></details>`;

    }
    function renderJournal(g) {
        const latest=new Map();
        for(const work of g.submissions) { const k=work.user_id+':'+work.assignment_id; if(!latest.has(k)) latest.set(k,work); }
        const pending=[...latest.values()].filter(w=>w.status==='pending_review').length;
        return `<section class="learning-card classroom-journal"><h3>${tr('Журнал преподавателя','O‘qituvchi jurnali')}</h3>
        <p>${tr('Учеников','O‘quvchilar')}: <strong>${g.members.length}</strong> · ${tr('Заданий','Topshiriqlar')}: <strong>${g.assignments.length}</strong> · ${tr('На проверке','Tekshiruvda')}: <strong>${pending}</strong></p>
        <div class="actions">${button(tr('Обновить журнал','Jurnalni yangilash'),'group',g.id)}${button(tr('Скачать для Excel','Excel uchun yuklash'),'export-journal',g.id)}</div>
        <p>${tr('Показана последняя отправленная попытка. «Не отправлено» не означает, что ученик не начал решать.','Oxirgi yuborilgan urinish ko‘rsatilgan. «Yuborilmagan» o‘quvchi hali boshlamaganini anglatmaydi.')}</p>
        ${!g.members.length?`<p>${tr('Пока нет учеников. Передайте им код приглашения ниже.','Hali o‘quvchilar yo‘q. Quyidagi taklif kodini ularga bering.')}</p>`:!g.assignments.length?`<p>${tr('Выдайте первое задание группе ниже.','Quyida guruhga birinchi topshiriqni bering.')}</p>`:
        `<div class="journal-scroll" tabindex="0" aria-label="${tr('Журнал группы','Guruh jurnali')}"><table><thead><tr><th scope="col">${tr('Ученик','O‘quvchi')}</th>${g.assignments.map(a=>`<th scope="col">${esc(local(a.title))}<br><small>${esc(a.language)}${a.due_at?' · '+esc(dateLabel(a.due_at)):''}</small></th>`).join('')}</tr></thead><tbody>${g.members.map(m=>`<tr><th scope="row">${esc(m.display_name||tr('Ученик','O‘quvchi'))}</th>${g.assignments.map(a=>{const w=latest.get(m.id+':'+a.id);return `<td>${w?`${button(status(w.status),'submission',w.id)}<p>${w.tests_passed?tr('Все тесты пройдены','Barcha testlar o‘tdi'):tr('Есть ошибки в тестах','Testlarda xatolar bor')}</p><p>${w.score==null?'':`${w.score}/100`}${w.late?' · '+tr('Сдано позже срока','Kech topshirilgan'):''}</p>`:tr('Не отправлено','Yuborilmagan')}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`}</section>`;
    }
    function boardColumns() {return [['todo',tr('К выполнению','Bajarish kerak')],['pending_review',tr('На проверке','Tekshiruvda')],['needs_revision',tr('Доработать','Tuzatish kerak')],['approved',tr('Принято','Qabul qilingan')]];}
    function renderBoard(g) {
        const teacher=canManage(g), columns=Object.fromEntries(boardColumns().map(([k])=>[k,[]]));
        if(!teacher&&!Array.isArray(g.my_submissions)) return `<p class="notice">${tr('Статусы работ пока недоступны. Обновите группу немного позже.','Ish holatlari hozircha mavjud emas. Guruhni birozdan keyin yangilang.')}</p>`;
        const assignments=filteredExercises(g.assignments,'assigned');
        const latest=new Map();
        for(const work of (teacher?g.submissions:g.my_submissions)||[]) {
            const k=teacher?work.user_id+':'+work.assignment_id:work.assignment_id;
            if(!latest.has(k)) latest.set(k,work);
        }
        for(const a of assignments) {
            const works=[...latest.values()].filter(w=>w.assignment_id===a.id);
            const card=(work)=>`<article class="board-card"><h4>${esc(local(a.title))}</h4>${a.due_at?`<p>${tr('Срок','Muddat')}: ${esc(dateLabel(a.due_at))}</p>`:''}<div>${exerciseBadges(a)}</div>${work?`<p>${teacher?esc(work.display_name||tr('Ученик','O‘quvchi')):esc(status(work.status))}</p><p>${work.tests_passed?tr('Тесты пройдены','Testlar o‘tildi'):tr('Есть ошибки в тестах','Testlarda xatolar bor')}</p>${button(teacher?tr('Проверить работу','Ishni tekshirish'):tr('Открыть попытку','Urinishni ochish'),'submission',work.id)}`:`${teacher?`<p>${tr('Сдали','Yuborganlar')}: ${works.length} · ${tr('Учеников в группе','Guruhdagi o‘quvchilar')}: ${g.member_count??g.members.length}</p>`:''}${button(tr('Открыть задание','Topshiriqni ochish'),'assignment',a.id)}`}${work&&!teacher?button(tr('Открыть задание','Topshiriqni ochish'),'assignment',a.id):''}</article>`;
            if(teacher) {
                columns.todo.push(card(null));
                for(const work of works) (columns[work.status]||columns.pending_review).push(card(work));
            } else {
                const work=works[0];(columns[work?.status]||columns.todo).push(card(work));
            }
        }
        return `<p class="board-caption">${teacher?tr('Слева — все задания. В остальных колонках — последние отправленные работы каждого ученика.','Chapda barcha topshiriqlar. Qolgan ustunlarda har bir o‘quvchining oxirgi yuborgan ishlari.'):tr('Статус меняется после отправки работы и проверки преподавателем.','Holat ish yuborilgandan va o‘qituvchi tekshirgandan so‘ng o‘zgaradi.')}</p>
        <div class="board-mobile-tabs" aria-label="${tr('Статус заданий','Topshiriq holati')}">${boardColumns().map(([k,label])=>button(`${label} (${columns[k].length})`,'board-column',k,`aria-pressed="${state.boardColumn===k}"`)).join('')}</div>
        <div class="assignment-board" id="assignedExercises">${boardColumns().map(([k,label])=>`<section class="board-column ${state.boardColumn===k?'mobile-selected':''}" data-column="${k}"><header><h3>${teacher&&k==='todo'?tr('Все задания','Barcha topshiriqlar'):label}</h3><span>${columns[k].length}</span></header>${columns[k].join('')||`<p class="board-empty">${tr('Здесь пока пусто','Hozircha bo‘sh')}</p>`}</section>`).join('')}</div>`;
    }
    function renderGroup() {
        const g=state.data,teacher=canManage(g);
        const templates=filteredExercises(state.templates,'catalog');
        const tabs=[['board',tr('Задания','Topshiriqlar')],...(teacher?[['members',tr('Ученики','O‘quvchilar')],['journal',tr('Журнал','Jurnal')],['manage',tr('Управление','Boshqarish')]]:[])];
        let content='';
        if(state.groupTab==='journal'&&teacher) content=renderJournal(g);
        else if(state.groupTab==='members'&&teacher) content=`<section class="learning-card"><h3>${tr('Ученики группы','Guruh o‘quvchilari')}</h3>${g.members.map(m=>`<div class="member-row"><span>${esc(m.display_name||tr('Ученик','O‘quvchi'))}</span>${g.archived?'':button(tr('Удалить из группы','Guruhdan chiqarish'),'remove-member',m.id)}</div>`).join('')||`<p>${tr('Пока нет учеников','Hali o‘quvchilar yo‘q')}</p>`}${(g.removed_members||[]).map(m=>`<p>${esc(m.display_name)} · ${tr('Доступ закрыт','Kirish yopilgan')} ${button(tr('Разрешить вступление','Qo‘shilishga ruxsat'),'restore-member',m.id)}</p>`).join('')}</section>`;
        else if(state.groupTab==='manage'&&teacher) content=`        ${canManage(g)&&!g.archived?`<section class="learning-card"><h3>${tr('Пригласить учеников','O‘quvchilarni taklif qilish')}</h3><p>${tr('Передайте ученикам код. Вступившие по нему участники не могут выдавать или менять задания.','Kodni o‘quvchilarga bering. Kod orqali kirganlar topshiriq bera olmaydi va o‘zgartira olmaydi.')}</p><pre id="groupJoinCode">${esc(g.join_code)}</pre><div class="actions">${button(tr('Скопировать ссылку','Havolani nusxalash'),'copy-invite',g.id)}${button(tr('Обновить код приглашения','Taklif kodini yangilash'),'rotate-invite',g.id)}</div>
        <h3>${tr('Выдать задание','Topshiriq berish')}</h3>${exerciseFilters('catalog',state.templates)}<p>${tr('Подходящих заданий','Mos topshiriqlar')}: <strong id="catalogCount">${templates.length}</strong> / ${state.templates.length}</p>
        <label>${tr('Задание','Topshiriq')}<select id="templateChoice" ${templates.length?'':'disabled'}>${templates.length?templates.map(t=>`<option value="${esc(t.id)}">${esc(local(t.title))} · ${esc(t.language)}</option>`).join(''):`<option>${tr('Измените фильтры','Filtrlarni o‘zgartiring')}</option>`}</select></label>${button(tr('Выдать группе','Guruhga berish'),'assign',g.id,templates.length?'':'disabled')}</section>`:`<p class="notice">${tr('Задания выдаёт преподаватель этой группы. Ниже — ваши задания и редактор решения.','Topshiriqlarni bu guruh o‘qituvchisi beradi. Quyida topshiriqlaringiz va yechim muharriri.')}</p>`}
        ${g.archived?'':renderImport(g.id)}<div class="actions">${button(g.archived?tr('Восстановить группу','Guruhni tiklash'):tr('Архивировать группу','Guruhni arxivlash'),g.archived?'restore-group':'archive-group',g.id)}</div>`;
        else content=`${g.assignments.length?exerciseFilters('assigned',g.assignments):`<p>${tr('Преподаватель ещё не выдал задания.','O‘qituvchi hali topshiriq bermagan.')}</p>`}${renderBoard(g)}`;
        return `${back('home')}<div class="group-heading"><div><h2>${esc(g.title)}</h2><p>${esc(g.description)}</p><p>${tr('Преподаватель','O‘qituvchi')}: ${esc(g.teacher_name||tr('Создатель группы','Guruh yaratuvchisi'))} · ${tr('Учеников','O‘quvchilar')}: ${g.member_count??g.members?.length??'—'} · ${tr('Заданий','Topshiriqlar')}: ${g.assignments.length}</p></div>${button(tr('Обновить','Yangilash'),'group',g.id)}</div>
        ${g.archived?`<p class="notice">${tr('Группа в архиве. Новые работы не принимаются.','Guruh arxivda. Yangi ishlar qabul qilinmaydi.')}</p>`:''}
        <nav class="group-tabs" aria-label="${tr('Разделы группы','Guruh bo‘limlari')}">${tabs.map(([k,label])=>button(label,'group-tab',k,`aria-pressed="${state.groupTab===k}"`)).join('')}</nav>${content}
        ${teacher?'':`<div class="group-footer">${button(tr('Выйти из группы','Guruhdan chiqish'),'leave-group',g.id)}</div>`}`;
    }
    function renderImport(id) {
        return `<section class="learning-card"><h3>${tr('Своё задание из текста или файла','Matn yoki fayldan o‘z topshirig‘i')}</h3>
        <p>${tr('AI подготовит до 5 черновиков. Проверьте условия и ответы тестов перед публикацией. Текст документа отправляется AI-сервису.','AI 5 tagacha qoralama tayyorlaydi. Nashrdan oldin shartlar va test javoblarini tekshiring. Hujjat matni AI xizmatiga yuboriladi.')}</p>
        <label>${tr('Условия заданий','Topshiriqlar shartlari')}<textarea id="importText" rows="5" maxlength="30000"></textarea></label>
        <label>${tr('PDF с текстом или Word (.docx), до 4 МБ','Matnli PDF yoki Word (.docx), 4 MB gacha')}<input id="importFile" type="file" accept=".pdf,.docx"></label>
        <label>${tr('Язык решений','Yechimlar tili')}<select id="importLanguage"><option>Python</option><option>JavaScript</option></select></label>
        ${button(tr('Подготовить задания с AI','AI bilan topshiriqlar tayyorlash'),'import-tasks',id)}<p id="importStatus" role="status"></p><div id="importDrafts"></div></section>`;
    }
    function showImportedDrafts(tasks,groupId) {
        document.getElementById('importDrafts').innerHTML=tasks.map((task,i)=>`<section class="learning-card import-draft" data-language="${esc(task.language)}">
        <h4>${tr('Черновик','Qoralama')} ${i+1}</h4>
        <label>${tr('Название','Nomi')}<input data-draft="title" maxlength="120" value="${esc(task.title)}"></label>
        <label>${tr('Условие для ученика','O‘quvchi uchun shart')}<textarea data-draft="prompt" rows="7">${esc(task.prompt)}</textarea></label>
        <label>${tr('Тесты: ввод и ожидаемый вывод (JSON)','Testlar: kiritish va kutilgan natija (JSON)')}<textarea class="code" data-draft="tests" rows="8">${esc(JSON.stringify(task.tests,null,2))}</textarea></label>
        <details><summary>${tr('Проверить тесты на эталонном коде','Testlarni namuna kodda tekshirish')}</summary><p>${tr('Этот код видит только преподаватель. Проверка выполняется в браузере и показывает согласованность кода с тестами, но не доказывает правильность условия.','Bu kod faqat o‘qituvchiga ko‘rinadi. Brauzerdagi tekshiruv kod va testlar mosligini ko‘rsatadi, ammo shart to‘g‘riligini isbotlamaydi.')}</p><textarea class="code" data-draft="reference" rows="8">${esc(task.reference_code||'')}</textarea>${button(tr('Проверить эталон и тесты','Namuna va testlarni tekshirish'),'validate-import')}<p data-validation role="status"></p></details>
        <label>${tr('Вопрос для защиты','Himoya savoli')}<textarea data-draft="defense_question">${esc(task.defense_question)}</textarea></label>
        <label>${tr('Изменение программы для защиты','Himoya uchun dastur o‘zgarishi')}<textarea data-draft="change">${esc(task.change)}</textarea></label>
        <p>${tr('Ученики получат условие и редактор. Эталонное решение ученикам не передаётся. Тесты не показаны в условии, но доступны через браузер. Для экзамена со скрытыми ответами этот режим не подходит.','O‘quvchilar shart va muharrirni oladi. Namuna yechim o‘quvchilarga yuborilmaydi. Testlar shartda ko‘rsatilmaydi, lekin brauzer orqali mavjud. Bu rejim yashirin javobli imtihon uchun mos emas.')}</p>
        <label><input type="checkbox" data-draft="reviewed"> ${tr('Я проверил условие и ожидаемые ответы','Shart va kutilgan javoblarni tekshirdim')}</label>
        ${button(tr('Выдать это задание группе','Bu topshiriqni guruhga berish'),'publish-custom',groupId)}</section>`).join('');
    }
    function renderAssignment() {
        const a=state.data;
        return `${canManage(a)?assignmentSettings(a):''}${a.due_at?`<p class="notice">${tr('Срок сдачи','Topshirish muddati')}: ${esc(dateLabel(a.due_at))} · ${a.allow_late?tr('Поздняя сдача разрешена','Kech topshirish mumkin'):tr('После срока отправка закрывается','Muddatdan so‘ng yuborish yopiladi')}</p>`:''}`+ `${a.archived?`<p class="notice">${tr('Группа в архиве. Отправка новых работ закрыта.','Guruh arxivda. Yangi ish yuborish yopilgan.')}</p>`:''}${back('group',a.group_id)}<h2>${esc(local(a.title))}</h2><p>${exerciseBadges(a)}</p><p>${esc(local(a.prompt))}</p>
        ${canSubmit(a)?`<input type="hidden" id="codePasteDetected" value="false"><p class="notice">${tr('Вставка кода разрешена. Факт вставки из буфера или перетаскивания текста отмечается в отправленной работе для преподавателя.','Kod joylashga ruxsat berilgan. Buferdan joylash yoki matnni sudrash holati o‘qituvchi uchun yuborilgan ishda belgilanadi.')}</p><p class="notice" id="codePasteNotice" role="status" hidden>${tr('Зафиксирована вставка текста в код. При сдаче преподаватель увидит отметку: источник неизвестен.','Kodga matn joylangani qayd etildi. Topshirilganda o‘qituvchi manba noma’lum belgisini ko‘radi.')}</p>`:''}
        ${a.is_owner?`<p class="notice">${tr('Просмотр своего задания. Можно написать код и запустить тесты; отправка работы самому себе недоступна.','O‘z topshirig‘ingizni ko‘rish. Kod yozib testlarni bajaring; ishni o‘zingizga yuborib bo‘lmaydi.')}</p>`:''}
        <p class="notice">${tr('1. Напишите код → 2. Запустите тесты → 3. Объясните решение → 4. Отправьте преподавателю.','1. Kod yozing → 2. Testlarni bajaring → 3. Yechimni tushuntiring → 4. O‘qituvchiga yuboring.')}</p><div class="assignment-workspace"><section class="learning-card assignment-editor"><h3>${tr('Редактор решения','Yechim muharriri')}</h3><label for="assignmentCode">${tr('Ваш код','Sizning kodingiz')}</label><textarea class="code" id="assignmentCode" spellcheck="false" maxlength="10000" rows="12">${esc(a.starter_code)}</textarea>
        <div class="actions">${button(tr('Запустить тесты','Testlarni ishga tushirish'),'test',a.id,'id="assignmentTestButton"')}${button(tr('Остановить','To‘xtatish'),'stop','', 'id="assignmentStopButton" disabled')}</div>
        <div class="actions">${canSubmit(a)?button(tr('Сохранить в облаке','Bulutga saqlash'),'save-cloud',a.id)+button(tr('Восстановить из облака','Bulutdan tiklash'),'load-cloud',a.id):''}</div><p id="draftStatus" role="status">${tr('Черновик сохраняется в этом браузере при вводе.','Qoralama yozish davomida shu brauzerda saqlanadi.')}</p><p id="assignmentRunStatus" role="status" aria-live="polite"></p><div id="assignmentTestResults"></div></section>
        <aside class="learning-card">${a.hints_allowed===false?`<p>${tr('Подсказки отключены преподавателем','Maslahatlar o‘qituvchi tomonidan o‘chirilgan')}</p>`:renderMentor(a)}${a.custom?'':`<h3>${tr('Подсказки к решению','Yechimga maslahatlar')}</h3><p>${tr('Сначала попробуйте сами. Подсказки открываются по очереди; пример решения — после вашего объяснения.','Avval o‘zingiz urinib ko‘ring. Maslahatlar ketma-ket ochiladi; namuna yechim esa izohingizdan keyin.')}</p>
        <div id="learningHints">${a.hints.map((h,i)=>`<p>${i+1}. ${esc(local(h))}</p>`).join('')}</div>
        ${a.is_owner?'':button(tr('Следующая подсказка','Keyingi maslahat'),'hint',a.id,`id="hintButton" ${a.hints_allowed===false||a.hints.length>=a.hint_count?'disabled':''}`)}
        <details><summary>${tr('Нужен пример решения?','Namuna yechim kerakmi?')}</summary><label>${tr('Что вы уже пробовали? Не менее 20 символов.','Nimani sinab ko‘rdingiz? Kamida 20 belgi.')}<textarea id="solutionReflection" maxlength="3000"></textarea></label>${button(tr('Показать пример','Namunani ko‘rsatish'),'solution',a.id,`id="solutionButton" ${!a.is_owner&&(a.solution_allowed===false||a.hints.length<a.hint_count)?'disabled':''}`)}<pre id="learningSolution" hidden></pre></details>
        `}${a.custom&&!a.is_owner?'':`<h3>${tr('Проверочные примеры','Tekshiruv misollari')}</h3>${a.tests.map((t,i)=>`<details><summary>${tr('Тест','Test')} ${i+1}</summary><p>${tr('Ввод','Kiritish')}</p><pre>${esc(t.stdin)}</pre><p>${tr('Ожидаемый вывод','Kutilgan natija')}</p><pre>${esc(t.expected_stdout)}</pre></details>`).join('')}
        `}${button(tr('Открыть словарь','Lug‘atni ochish'),'glossary')}</aside></div>
        ${canSubmit(a)?`<section class="learning-card"><h3>${tr('Мини-защита','Kichik himoya')}</h3><ul>${a.defense_questions.map(q=>`<li>${esc(local(q))}</li>`).join('')}</ul>
        <label>${tr('Объяснение решения и граничного случая (от 20 символов)','Yechim va chegaraviy holat izohi (kamida 20 belgi)')}<textarea id="defenseExplanation" maxlength="3000"></textarea></label>
        <p>${esc(local(a.change))}</p>${button(tr('Скопировать своё решение','O‘z yechimimni nusxalash'),'copy-change')}<label>${tr('Изменённый код для защиты','Himoya uchun o‘zgartirilgan kod')}<textarea class="code" id="changedCode" spellcheck="false" rows="10" placeholder="${tr('Пишите изменённую программу здесь','O‘zgartirilgan dasturni shu yerga yozing')}" maxlength="10000"></textarea></label>
        <label>${tr('Данные для input() / prompt() — не код','input() / prompt() uchun ma’lumotlar — kod emas')}<textarea id="changedInput" rows="3" placeholder="${tr('Например: 2 и 3, каждое число с новой строки. Если ввода нет — оставьте пустым.','Masalan: 2 va 3, har biri yangi qatorda. Kiritish bo‘lmasa, bo‘sh qoldiring.')}" maxlength="5000"></textarea></label>
        ${button(tr('Проверить изменённый код','O‘zgartirilgan kodni sinash'),'run-change',a.id,'id="changeRunButton"')}<pre id="changedOutput" hidden></pre>
        <label>${tr('Что и почему изменили (от 20 символов)','Nima va nima uchun o‘zgardi (kamida 20 belgi)')}<textarea id="changeExplanation" maxlength="3000"></textarea></label>
        ${button(tr('Отправить преподавателю','O‘qituvchiga yuborish'),'submit',a.id,'id="assignmentSubmitButton" disabled')}</section>
        `:''}${!a.is_owner?`<h3 style="margin-top:18px">${tr('Мои попытки','Mening urinishlarim')}</h3>${a.submissions.map(s=>`<section class="learning-card"><p>${esc(status(s.status))}</p><p>${esc(s.feedback)}</p>${button(tr('Открыть попытку','Urinishni ochish'),'submission',s.id)}</section>`).join('')||`<p>${tr('Попыток пока нет.','Hali urinishlar yo‘q.')}</p>`}`:''}${notice()}`;
    }
    function renderSubmission() {
        const s=state.data;
        return `${back('group',s.group_id)}<h2>${esc(local(s.title))}</h2><p>${esc(status(s.status))}</p>${notice()}
        ${s.code_paste_detected?`<p class="notice" role="note">${tr('При работе над решением или мини-защитой зафиксирована вставка текста из буфера обмена или перетаскиванием. Источник неизвестен. Это сообщение браузера, а не доказательство списывания; вставленный текст мог быть изменён или удалён.','Yechim yoki kichik himoya ustida ishlaganda buferdan yoki sudrash orqali matn joylangani qayd etilgan. Manba noma’lum. Bu brauzer xabari, ko‘chirish isboti emas; joylangan matn o‘zgartirilgan yoki o‘chirilgan bo‘lishi mumkin.')}</p>`:''}
        <section class="learning-card"><h3>${tr('Исходное решение','Asosiy yechim')}</h3><pre>${esc(s.code)}</pre><p>${esc(s.explanation)}</p>
        <h3>${tr('Мини-защита','Kichik himoya')}</h3><p>${esc(local(s.change))}</p><pre>${esc(s.changed_code)}</pre><p>${esc(s.change_explanation)}</p>
        <h3>${tr('Отчёт тестов','Test hisoboti')}</h3>${s.results.map((r,i)=>`<details><summary>${tr('Тест','Test')} ${i+1}: ${r.passed?tr('пройден','o‘tdi'):tr('не пройден','o‘tmadi')}</summary><p>${tr('Ожидалось','Kutilgan')}</p><pre>${esc(s.tests[i]?.expected_stdout??tr('Скрытый тест','Yashirin test'))}</pre><p>${tr('Получено / ошибка','Olingan natija / xato')}</p><pre>${esc(r.error||r.stdout)}</pre></details>`).join('')}
        <p>${esc(s.feedback)}</p><p>${s.score==null?'':`${tr('Оценка','Baho')}: ${s.score}/100`}${s.late?' · '+tr('Сдано позже срока','Kech topshirilgan'):''}</p>${canManage(s)?`<p>${tr('Проверьте объяснение, изменённый код и понимание ученика перед принятием.','Qabul qilishdan oldin izoh, o‘zgartirilgan kod va o‘quvchining tushunganini tekshiring.')}</p><label>${tr('Комментарий преподавателя (от 20 символов)','O‘qituvchi izohi (kamida 20 belgi)')}<textarea id="reviewFeedback" maxlength="3000">${esc(s.feedback)}</textarea></label><label>${tr('Оценка от 0 до 100 (необязательно)','0–100 baho (ixtiyoriy)')}<input id="reviewScore" type="number" min="0" max="100" step="1" value="${s.score??''}"></label><div class="actions">${button(tr('Принять работу','Ishni qabul qilish'),'approve',s.id,s.tests_passed?'':'disabled')}${button(tr('Отправить на доработку','Qayta ishlashga yuborish'),'revise',s.id)}</div>`:''}</section>`;
    }
    function renderPortfolio() {
        const p=state.data, pub=state.view==='public';
        const url=new URL(location.pathname,location.origin); url.searchParams.set('portfolio',p.slug);
        return `${pub?'':back('home')}<h2>${tr('Портфолио','Portfolio')}: ${esc(p.display_name)}</h2><p>${esc(p.bio)}</p><p>${tr('Принятых заданий','Qabul qilingan topshiriqlar')}: ${p.completed}</p><p>${p.skills.map(s=>`<span class="badge">${esc(s)}</span>`).join('')}</p>
        ${!pub?`<section class="learning-card"><label>${tr('О себе — будет видно по публичной ссылке','O‘zingiz haqingizda — ochiq havolada ko‘rinadi')}<textarea id="portfolioBio" maxlength="500">${esc(p.bio)}</textarea></label><label><input type="checkbox" id="portfolioPublic" ${p.public?'checked':''}> ${tr('Разрешить просмотр по ссылке','Havola orqali ko‘rishga ruxsat berish')}</label><p>${tr('Публикуются имя, описание и названия принятых заданий. Код, почта и ответы защиты остаются закрытыми. Ссылку можно отключить.','Ism, tavsif va qabul qilingan topshiriq nomlari ko‘rinadi. Kod, pochta va himoya javoblari yopiq qoladi. Havolani o‘chirish mumkin.')}</p>${button(tr('Сохранить настройки','Sozlamalarni saqlash'),'publish-portfolio')}<p id="portfolioLink">${p.public?`<a href="${esc(url.href)}" target="_blank" rel="noopener">${esc(url.href)}</a>`:tr('Публичная ссылка выключена.','Ochiq havola o‘chirilgan.')}</p></section>`:''}
        <div class="learning-grid">${p.projects.map(project=>`<section class="learning-card"><h3>${esc(local(project.title))}</h3><span class="badge">${esc(project.language)}</span><p>${tr('Проверено преподавателем','O‘qituvchi tekshirgan')}</p><p>${esc(parseServerDate(project.reviewed_at).toLocaleDateString(window.MentorLocale==='uz'?'uz-UZ':'ru-RU'))}</p></section>`).join('')||`<p>${tr('После принятия преподавателем здесь появятся ваши работы.','O‘qituvchi qabul qilgach, ishlar shu yerda paydo bo‘ladi.')}</p>`}</div>`;
    }
    const cloudVersions=new Map();
    const dateLabel=value=>new Date(value).toLocaleString(window.MentorLocale==='uz'?'uz-UZ':'ru-RU');
    function assignmentSettings(a){
        const d=a.due_at?new Date(a.due_at):null;
        const localDate=d?new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16):'';
        return `<details class="learning-card"><summary>${tr('Настройки задания','Topshiriq sozlamalari')}</summary><label>${tr('Срок сдачи (ваше местное время)','Muddat (mahalliy vaqt)')}<input id="assignmentDue" type="datetime-local" value="${localDate}"></label>${[['allowLate','allow_late','Разрешить сдавать позже срока','Kech topshirishga ruxsat'],['allowHints','hints_allowed','Разрешить подсказки','Maslahatlarga ruxsat'],['allowSolution','solution_allowed','Разрешить пример решения','Namuna yechimga ruxsat'],['serverCheck','server_check','Проверять на сервере со скрытыми тестами','Serverda yashirin testlar bilan tekshirish']].map(([id,key,ru,uz])=>`<label class="check-label"><input type="checkbox" id="${id}" ${a[key]?'checked':''} ${key==='server_check'&&!a.judge_available?'disabled':''}> ${tr(ru,uz)}</label>`).join('')}<p>${a.judge_available?tr('Серверный режим нельзя отключить после включения. Ранее открытые тесты не станут секретными.','Server rejimini yoqqandan so‘ng o‘chirib bo‘lmaydi. Oldin ochilgan testlar maxfiy bo‘lib qolmaydi.'):tr('Серверная проверка станет доступна после подключения Judge0. Сейчас тесты выполняются в браузере.','Judge0 ulangach server tekshiruvi ochiladi. Hozir testlar brauzerda bajariladi.')}</p>${button(tr('Сохранить настройки','Sozlamalarni saqlash'),'assignment-settings',a.id)}</details>`;
    }
    function renderMentor(a){return `<h3>${tr('Наставник по вашему коду','Kodingiz bo‘yicha ustoz')}</h3><p>${tr('Код и две последние попытки отправляются AI. Подсказка не заменяет запуск тестов.','Kod va oxirgi ikki urinish AI xizmatiga yuboriladi. Maslahat test o‘rnini bosmaydi.')}</p><label>${tr('Что непонятно?','Nima tushunarsiz?')}<textarea id="mentorQuestion" maxlength="1500" rows="2"></textarea></label>${button(tr('Получить подсказку','Maslahat olish'),'mentor',a.id)}<div id="mentorAnswer" role="status"></div>`;}
    function renderSchools(){return `${back('home')}<h2>${tr('Кабинет школы','Maktab xonasi')}</h2><p>${tr('Преподаватели, группы и общая библиотека заданий.','O‘qituvchilar, guruhlar va umumiy topshiriqlar kutubxonasi.')}</p><div class="learning-grid">${state.data.schools.map(s=>`<section class="learning-card"><h3>${esc(s.title)}</h3>${button(tr('Открыть','Ochish'),'school',s.id)}</section>`).join('')}</div><section class="learning-card"><h3>${tr('Создать школу или учебный центр','Maktab yoki o‘quv markazini yaratish')}</h3><label>${tr('Название','Nomi')}<input id="schoolTitle" maxlength="120"></label>${button(tr('Создать','Yaratish'),'create-school')}</section><section class="learning-card"><h3>${tr('Присоединиться как преподаватель','O‘qituvchi sifatida qo‘shilish')}</h3><label>${tr('Код от администратора','Administrator kodi')}<input id="schoolInvite" maxlength="100"></label>${button(tr('Присоединиться','Qo‘shilish'),'join-school')}</section>`;}
    function renderSchool(){
        const s=state.data;
        const staffOptions=s.staff.map(m=>`<option value="${esc(m.id)}">${esc(m.display_name||tr('Преподаватель','O‘qituvchi'))}</option>`).join('');
        const ownGroups=s.my_groups.filter(g=>s.groups.some(x=>x.id===g.id));
        return `${back('schools')}<h2>${esc(s.title)}</h2><section class="learning-card"><h3>${tr('Преподаватели','O‘qituvchilar')}</h3>${s.staff.map(m=>`<div class="member-row"><span>${esc(m.display_name)}${m.id===s.admin_id?' · '+tr('Администратор','Administrator'):''}</span>${s.is_admin&&m.id!==s.admin_id?button(tr('Убрать доступ','Ruxsatni olib tashlash'),'remove-staff',m.id):''}</div>`).join('')}${s.is_admin?`${button(tr('Создать приглашение преподавателю','O‘qituvchiga taklif yaratish'),'school-invite',s.id)}<p id="schoolInviteResult" role="status"></p><details><summary>${tr('Передать управление школой','Maktab boshqaruvini berish')}</summary><select id="nextAdmin">${staffOptions}</select>${button(tr('Передать права администратора','Administrator huquqlarini berish'),'transfer-admin',s.id)}</details>`:''}</section>
        <section class="learning-card"><h3>${tr('Группы школы','Maktab guruhlari')}</h3>${s.groups.map(g=>`<div class="school-group-row"><strong>${esc(g.title)}</strong><span>${esc(s.staff.find(m=>m.id===g.owner_id)?.display_name||'')}</span>${g.owner_id===accountId()?button(tr('Открыть группу','Guruhni ochish'),'group',g.id):''}${s.is_admin?`<label>${tr('Назначить преподавателя','O‘qituvchini tayinlash')}<select data-teacher="${esc(g.id)}">${s.staff.map(m=>`<option value="${esc(m.id)}" ${m.id===g.owner_id?'selected':''}>${esc(m.display_name)}</option>`).join('')}</select></label>${button(tr('Передать группу','Guruhni berish'),'transfer-group',g.id)}`:''}</div>`).join('')||`<p>${tr('Групп пока нет','Hali guruhlar yo‘q')}</p>`}<label>${tr('Добавить свою группу в школу','O‘z guruhini maktabga qo‘shish')}<select id="attachGroup">${s.my_groups.filter(g=>!s.groups.some(x=>x.id===g.id)).map(g=>`<option value="${esc(g.id)}">${esc(g.title)}</option>`).join('')}</select></label><p>${tr('Администратор сможет передать эту группу другому преподавателю.','Administrator bu guruhni boshqa o‘qituvchiga bera oladi.')}</p>${button(tr('Добавить группу','Guruhni qo‘shish'),'attach-group',s.id)}</section>
        <section class="learning-card"><h3>${tr('Общая библиотека','Umumiy kutubxona')}</h3><label>${tr('Группа для выдачи задания','Topshiriq beriladigan guruh')}<select id="libraryGroup">${ownGroups.map(g=>`<option value="${esc(g.id)}">${esc(g.title)}</option>`).join('')}</select></label>${s.library.map(a=>`<details><summary>${esc(local(a.title))} · ${esc(a.language)}</summary><p>${esc(local(a.prompt))}</p>${button(tr('Выдать выбранной группе','Tanlangan guruhga berish'),'assign-library',a.id)}</details>`).join('')||`<p>${tr('Библиотека пока пуста','Kutubxona hozircha bo‘sh')}</p>`}<label>${tr('Взять задания из своей группы','O‘z guruhidan topshiriqlar olish')}<select id="shareGroup">${s.my_groups.map(g=>`<option value="${esc(g.id)}">${esc(g.title)}</option>`).join('')}</select></label>${button(tr('Показать задания','Topshiriqlarni ko‘rsatish'),'library-source')}<div id="librarySource"></div></section>`;
    }
    async function productAction(name,id,source){
        const a=state.data;
        if(name==='assignment-settings'){
            const due=field('assignmentDue');
            await api(`/assignments/${id}/settings`,{due_at:due?new Date(due).toISOString():null,allow_late:document.getElementById('allowLate').checked,hints_allowed:document.getElementById('allowHints').checked,solution_allowed:document.getElementById('allowSolution').checked,server_check:document.getElementById('serverCheck').checked});
            await open('assignment',id);return true;
        }
        if(name==='copy-invite'){const url=new URL('app.html',location.href);url.searchParams.set('join',a.join_code);await navigator.clipboard.writeText(url.href);message(tr('Ссылка скопирована.','Havola nusxalandi.'));return true;}
        if(name==='rotate-invite'){if(confirm(tr('Старые приглашения перестанут работать. Обновить код?','Eski takliflar ishlamaydi. Kod yangilansinmi?'))){await api(`/groups/${id}/invite/rotate`,{});await open('group',id);}return true;}
        if(name==='remove-member'||name==='restore-member'){
            if(name==='restore-member'||confirm(tr('Закрыть доступ ученику? Его работы сохранятся.','O‘quvchi kirishi yopilsinmi? Ishlari saqlanadi.'))){await api(`/groups/${a.id}/members/${id}/${name==='remove-member'?'remove':'restore'}`,{});await open('group',a.id);}return true;
        }
        if(name==='export-journal'){
            const response=await fetch(`${API_URL}/learning/groups/${id}/journal.csv`,{headers:authHeaders(),signal:AbortSignal.timeout(30000)});
            if(!response.ok)throw new Error(tr('Не удалось скачать журнал.','Jurnalni yuklab bo‘lmadi.'));
            const url=URL.createObjectURL(await response.blob()),link=document.createElement('a');link.href=url;link.download='journal.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;
        }
        if(name==='mentor'){
            const el=document.getElementById('mentorAnswer');el.textContent=tr('Наставник изучает код…','Ustoz kodni o‘rganmoqda…');
            try{const result=await api(`/assignments/${id}/mentor`,{code:field('assignmentCode'),question:field('mentorQuestion'),locale:window.MentorLocale||'ru'});el.innerHTML=[result.observation,result.next_step,result.question].map(t=>`<p>${esc(t)}</p>`).join('');}catch(e){el.textContent=e.message;}return true;
        }
        if(name==='save-cloud'||name==='load-cloud'){
            const cloudKey=accountId()+':'+id;
            const draft=await api(`/assignments/${id}/draft`);
            if(name==='load-cloud'){
                if(confirm(tr('Заменить текущий код и объяснения облачным черновиком?','Joriy kod va izohlar bulut qoralamasi bilan almashtirilsinmi?'))){
                    if(!draft.revision)throw new Error(tr('Облачного черновика пока нет.','Bulut qoralamasi hali yo‘q.'));
                    const pasted=field('codePasteDetected')==='true';
                    for(const [key,value] of Object.entries(draft.payload)){const el=document.getElementById(key);if(el)el.value=value;}
                    if(pasted)document.getElementById('codePasteDetected').value='true';
                    cloudVersions.set(cloudKey,draft.revision);persistAssignment();state.report=null;renderReport();updatePasteNotice();
                    document.getElementById('draftStatus').textContent=tr('Облачный черновик восстановлен.','Bulut qoralamasi tiklandi.');
                }
            }else{
                if(draft.revision && cloudVersions.get(cloudKey)!==draft.revision)throw new Error(tr('В облаке есть другая версия. Сначала восстановите её; при необходимости скопируйте свой текущий код.','Bulutda boshqa nusxa bor. Avval uni tiklang; kerak bo‘lsa joriy kodingizni nusxalang.'));
                const payload=Object.fromEntries(['assignmentCode','changedCode','changedInput','defenseExplanation','changeExplanation','codePasteDetected'].map(k=>[k,field(k)]));
                const saved=await api(`/assignments/${id}/draft`,{revision:draft.revision,payload});cloudVersions.set(cloudKey,saved.revision);
                document.getElementById('draftStatus').textContent=tr('Черновик сохранён в облаке.','Qoralama bulutga saqlandi.');
            }return true;
        }
        if(name==='create-school'){const result=await api('/schools',{title:field('schoolTitle').trim()});await open('school',result.id);return true;}
        if(name==='join-school'){const result=await api('/schools/join',{id:field('schoolInvite').trim()});await open('school',result.id);return true;}
        if(name==='school-invite'){const result=await api(`/schools/${id}/invite`,{});document.getElementById('schoolInviteResult').textContent=`${result.code} · ${tr('Одноразовый код до','Bir martalik kod muddati')} ${dateLabel(result.expires_at)}`;return true;}
        if(name==='attach-group'){if(!field('attachGroup'))throw new Error(tr('Выберите свою группу.','O‘z guruhingizni tanlang.'));if(confirm(tr('Передать группу под управление школы?','Guruh maktab boshqaruviga berilsinmi?'))){await api(`/schools/${id}/groups`,{id:field('attachGroup')});await open('school',id);}return true;}
        if(name==='transfer-group'){if(confirm(tr('Передать группу выбранному преподавателю? Все работы сохранятся.','Guruh tanlangan o‘qituvchiga berilsinmi? Ishlar saqlanadi.'))){await api(`/schools/${a.id}/transfer`,{group_id:id,teacher_id:root.querySelector(`[data-teacher="${id}"]`).value});await open('school',a.id);}return true;}
        if(name==='remove-staff'){if(confirm(tr('Убрать доступ преподавателя к школе?','O‘qituvchining maktabga kirishi yopilsinmi?'))){await api(`/schools/${a.id}/staff/${id}/remove`,{});await open('school',a.id);}return true;}
        if(name==='transfer-admin'){if(confirm(tr('Передать права администратора? Вы останетесь преподавателем школы.','Administrator huquqlari berilsinmi? Siz maktab o‘qituvchisi bo‘lib qolasiz.'))){await api(`/schools/${id}/admin`,{id:field('nextAdmin')});await open('school',id);}return true;}
        if(name==='library-source'){if(!field('shareGroup'))return true;const group=await api(`/groups/${field('shareGroup')}`);document.getElementById('librarySource').innerHTML=group.assignments.map(t=>`<p>${esc(local(t.title))} ${button(tr('В библиотеку','Kutubxonaga'),'share-assignment',t.id)}</p>`).join('');return true;}
        if(name==='share-assignment'){await api(`/schools/${a.id}/library`,{id});await open('school',a.id);return true;}
        if(name==='assign-library'){await api(`/schools/${a.id}/library/assign`,{library_id:id,group_id:field('libraryGroup')});message(tr('Задание выдано группе.','Topshiriq guruhga berildi.'));return true;}
        return false;
    }

    function glossaryMatches() {
        const f=state.filters.glossary, query=f.query.trim().toLocaleLowerCase();
        return state.data.filter(item=>(f.category==='all'||item.category===f.category)&&(!query||[item.term,local(item.title),item.ru,item.uz,...Object.values(item.examples||{}).map(e=>e.code)].join(' ').toLocaleLowerCase().includes(query)));
    }
    function glossaryCards() {
        const language=state.filters.glossary.language;
        return glossaryMatches().map(item=>{
            const example=item.examples?.[language];
            return `<article class="learning-card glossary-card"><h3>${esc(local(item.title)||item.term)}</h3><p><code>${esc(item.term)}</code> <span class="badge">${esc(local(item.category_title)||tr('Основы','Asoslar'))}</span></p><p>${esc(item[window.MentorLocale]||item.ru)}</p>${item.purpose?`<p><strong>${tr('Для чего','Nima uchun')}:</strong> ${esc(local(item.purpose))}</p>`:''}${example?`<h4>${esc(language)}</h4><pre><code>${esc(example.code)}</code></pre><p>${esc(local(example.explanation))}</p>`:`<p>${tr('Для этого языка отдельный пример не требуется.','Bu til uchun alohida misol kerak emas.')}</p>`}</article>`;
        }).join('')||`<p>${tr('Ничего не найдено. Попробуйте другой термин или категорию.','Hech narsa topilmadi. Boshqa atama yoki toifani tanlang.')}</p>`;
    }
    function updateGlossaryResults() {
        const grid=document.getElementById('glossaryResults'); if(!grid) return;
        grid.innerHTML=glossaryCards();
        document.getElementById('glossaryCount').textContent=glossaryMatches().length;
    }
    function renderGlossary() {
        const f=state.filters.glossary;
        return `${back('home')}<h2>${tr('Словарь и команды','Lug‘at va buyruqlar')}</h2><p>${tr('Что означает термин, для чего нужна команда и как она работает в коде.','Atama nimani anglatadi, buyruq nima uchun kerak va kodda qanday ishlaydi.')}</p>
        <section class="learning-card"><div class="exercise-filters"><label>${tr('Поиск по слову или команде','So‘z yoki buyruq bo‘yicha qidirish')}<input type="search" id="glossarySearch" value="${esc(f.query)}" placeholder="${tr('input, цикл, список…','input, sikl, ro‘yxat…')}"></label>${filterSelect('glossary','category',tr('Категория','Toifa'),categoryOptions(state.data,'category','category_title'))}<label>${tr('Примеры кода','Kod misollari')}<select id="glossary-language" data-filter-scope="glossary" data-filter-key="language">${['Python','JavaScript'].map(language=>`<option ${f.language===language?'selected':''}>${language}</option>`).join('')}</select></label></div><p>${tr('Найдено терминов','Topilgan atamalar')}: <strong id="glossaryCount">${glossaryMatches().length}</strong> / ${state.data.length}</p></section>
        <div class="learning-grid" id="glossaryResults">${glossaryCards()}</div>`;
    }
    function render() {
        roleLabel();
        document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.id===(state.view==='glossary'?'glossaryNav':'learningNav')));
        document.querySelector('.header h1').textContent=state.view==='glossary'?tr('Словарь и команды','Lug‘at va buyruqlar'):tr('Учебный кабинет','O‘quv xonasi');
        if(state.view==='home') show(renderHome());
        else if(state.view==='group') show(renderGroup());
        else if(state.view==='assignment') {show(renderAssignment()); renderReport();}
        else if(state.view==='submission') show(renderSubmission());
        else if(state.view==='portfolio'||state.view==='public') show(renderPortfolio());
        else if(state.view==='glossary') show(renderGlossary());
        else if(state.view==='schools') show(renderSchools());
        else if(state.view==='school') show(renderSchool());
    }
    function renderReport() {
        const el=document.getElementById('assignmentTestResults'); if(!el) return;
        const report=state.report;
        const valid=report && report.assignment===state.data.id && report.code===field('assignmentCode');
        const submit=document.getElementById('assignmentSubmitButton'); if(submit) submit.disabled=!valid;
        el.innerHTML=valid?report.results.map((r,i)=>`<section class="learning-card ${r.passed?'test-pass':'test-fail'}"><h3>${tr('Тест','Test')} ${i+1}: ${r.passed?'✓':'✗'}</h3><pre>${esc(r.error||r.stdout||tr('(пустой вывод)','(bo‘sh natija)'))}</pre></section>`).join(''):'';
    }
    async function runTests() {
        const a=state.data, code=field('assignmentCode');
        if(code.trim().length<5) throw new Error(tr('Введите код решения.','Yechim kodini kiriting.'));
        state.report=null; renderReport();
        const controller=new AbortController(); state.controller=controller;
        document.getElementById('assignmentStopButton').disabled=false;
        document.getElementById('assignmentTestButton').disabled=true;
        document.getElementById('assignmentCode').readOnly=true;
        const results=[];
        try {
            if(a.server_check){
                document.getElementById('assignmentRunStatus').textContent=tr('Сервер проверяет код…','Server kodni tekshirmoqda…');
                const response=await api(`/assignments/${a.id}/run`,{code});
                if(controller.signal.aborted)return;
                results.push(...response.results);
            } else for(let i=0;i<a.tests.length;i++) {
                const el=document.getElementById('assignmentRunStatus'); if(!el) return;
                el.textContent=tr(`Тест ${i+1}/${a.tests.length}: загрузка или выполнение…`,`Test ${i+1}/${a.tests.length}: yuklash yoki bajarish…`);
                const result=await BrowserExecutor.run({code,language:a.language,stdin:a.tests[i].stdin,signal:controller.signal});
                if(controller.signal.aborted) return;
                results.push({...result,passed:!result.error&&!result.truncated&&result.stdout.trim()===a.tests[i].expected_stdout.trim()});
            }
            state.report={assignment:a.id,code,results};
            document.getElementById('assignmentRunStatus').textContent=tr(`Пройдено ${results.filter(r=>r.passed).length} из ${results.length}.`,`Jami ${results.length} testdan ${results.filter(r=>r.passed).length} tasi o‘tdi.`);
            renderReport();
        } finally {
            if(state.controller===controller) state.controller=null;
            const stop=document.getElementById('assignmentStopButton'); if(stop) stop.disabled=true;
            const run=document.getElementById('assignmentTestButton'); if(run) run.disabled=false;
            const editor=document.getElementById('assignmentCode'); if(editor) editor.readOnly=false;
        }
    }
    async function action(name,id,sourceButton) {
        if(name==='group-tab'){state.groupTab=id;render();return;}
        if(name==='board-column'){state.boardColumn=id;render();return;}
        if(name==='sign-in') { showAuthOverlay(); return; }
        if(['home','group','assignment','submission','portfolio','glossary','schools','school'].includes(name)) return open(name,id);
        if(name==='editor') return close();
        if(await productAction(name,id,sourceButton))return;
        if(name==='profile') { state.profile=await api('/profile',{role:field('learningRole'),locale:window.MentorLocale,bio:state.profile.bio,portfolio_public:!!state.profile.public}); delete state.drafts[key()]; return open('home'); }
        if(name==='edit-group-title'||name==='edit-group-limit') {
            const group=state.data.groups.find(g=>g.id===id);
            if(!group||!canManage(group))return;
            sourceButton.closest('details').open=false;
            return editGroupSettings(group,name==='edit-group-limit');
        }
        if(name==='create-group') { const group=await api('/groups',{title:field('groupTitle'),description:field('groupDescription')}); return open('group',group.id); }
        if(name==='join') { const group=await api('/groups/join',{code:field('joinCode').trim()}); return open('group',group.id); }
        if(name==='archive-group'||name==='restore-group') {
            const archive=name==='archive-group';
            if(!window.confirm(archive
                ?tr('Архивировать группу? Задания и работы сохранятся. Новые участники и отправка работ будут закрыты. Группу можно восстановить из архива.','Guruh arxivlansinmi? Topshiriqlar va ishlar saqlanadi. Yangi a’zolar va ish yuborish yopiladi. Guruhni arxivdan tiklash mumkin.')
                :tr('Восстановить группу? Вступление и отправка работ снова станут доступны.','Guruh tiklansinmi? Qo‘shilish va ish yuborish yana ochiladi.'))) return;
            await api(`/groups/${id}/${archive?'archive':'restore'}`,{});
            return open('home');
        }
        if(name==='leave-group') {
            if(!window.confirm(tr('Выйти из группы? Отправленные работы останутся у преподавателя. Вернуться можно по коду приглашения.','Guruhdan chiqasizmi? Yuborilgan ishlar o‘qituvchida qoladi. Taklif kodi orqali qaytishingiz mumkin.'))) return;
            await api(`/groups/${id}/leave`,{});
            state.report=null;
            return open('home');
        }
        if(name==='import-tasks') {
            const statusEl=document.getElementById('importStatus');
            const file=document.getElementById('importFile').files[0];
            if(file && (file.size>4*1024*1024 || !/\.(pdf|docx)$/i.test(file.name))) throw new Error(tr('Нужен PDF или DOCX до 4 МБ.','4 MB gacha PDF yoki DOCX kerak.'));
            statusEl.textContent=tr('AI готовит черновики…','AI qoralamalar tayyorlamoqda…');
            try {
                const encoded=file?await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);}):'';
                const data=await api(`/groups/${id}/assignment-drafts`,{text:field('importText'),filename:file?.name||'',file_base64:encoded,language:field('importLanguage'),locale:window.MentorLocale||'ru'});
                showImportedDrafts(data.tasks,id); statusEl.textContent=tr('Черновики готовы. Проверьте каждый перед выдачей.','Qoralamalar tayyor. Berishdan oldin har birini tekshiring.');
            } catch(error) {statusEl.textContent=tr('Не удалось подготовить задания. Исходный текст сохранён в форме.','Topshiriqlar tayyorlanmadi. Asl matn shaklda saqlangan.');throw error;}
            return;
        }
        if(name==='validate-import') {
            const card=sourceButton.closest('.import-draft'),statusEl=card.querySelector('[data-validation]');
            const code=card.querySelector('[data-draft=reference]').value;
            let tests;try{tests=JSON.parse(card.querySelector('[data-draft=tests]').value);}catch{throw new Error(tr('Неверный JSON тестов.','Testlar JSON formati xato.'));}
            if(!code.trim()||!Array.isArray(tests)||!tests.length||tests.length>10)throw new Error(tr('Нужны эталонный код и от 1 до 10 тестов.','Namuna kod va 1–10 test kerak.'));
            const controller=new AbortController();state.controller=controller;
            let passed=0;
            try{for(let i=0;i<tests.length;i++){
                statusEl.textContent=tr(`Проверка ${i+1}/${tests.length}…`,`Tekshiruv ${i+1}/${tests.length}…`);
                const result=await BrowserExecutor.run({code,language:card.dataset.language,stdin:tests[i].stdin,signal:controller.signal});
                if(!result.error&&!result.truncated&&result.stdout.trim()===String(tests[i].expected_stdout).trim())passed++;
            }statusEl.textContent=tr(`Пройдено ${passed} из ${tests.length}. Перепроверьте условие перед публикацией.`,`${tests.length} testdan ${passed} tasi o‘tdi. Nashrdan oldin shartni tekshiring.`);}
            finally{if(state.controller===controller)state.controller=null;}return;
        }
        if(name==='publish-custom') {
            const card=sourceButton.closest('.import-draft');
            if(!card.querySelector('[data-draft="reviewed"]').checked) throw new Error(tr('Сначала проверьте условие и ответы тестов.','Avval shart va test javoblarini tekshiring.'));
            const data={language:card.dataset.language};
            for(const key of ['title','prompt','defense_question','change']) data[key]=card.querySelector(`[data-draft="${key}"]`).value;
            try {data.tests=JSON.parse(card.querySelector('[data-draft="tests"]').value);} catch {throw new Error(tr('Проверьте формат JSON тестов.','Testlarning JSON formatini tekshiring.'));}
            await api(`/groups/${id}/custom-assignments`,data);
            card.innerHTML=`<p role="status">${tr('Задание выдано группе. Обновите доску, чтобы увидеть его.','Topshiriq guruhga berildi. Uni ko‘rish uchun doskani yangilang.')}</p>`;
            return;
        }
        if(name==='assign') { await api(`/groups/${id}/assignments`,{template_id:field('templateChoice')}); return open('group',id); }
        if(name==='hint') { const data=await api(`/assignments/${id}/hints`,{}); state.data.hints=data.hints; saveDraft(); render(); return; }
        if(name==='solution') { const data=await api(`/assignments/${id}/solution`,{reflection:field('solutionReflection')}); const el=document.getElementById('learningSolution'); el.hidden=false; el.textContent=data.solution; return; }
        if(name==='test') return runTests();
        if(name==='stop') {state.controller?.abort(); const el=document.getElementById('assignmentRunStatus'); if(el) el.textContent=tr('Выполнение остановлено.','Bajarish to‘xtatildi.'); return;}
        if(name==='copy-change') {
            if(field('changedCode').trim() && !confirm(tr('Заменить изменённый код своим основным решением?','O‘zgartirilgan kod asosiy yechim bilan almashtirilsinmi?'))) return;
            document.getElementById('changedCode').value=field('assignmentCode'); persistAssignment(); return;
        }
        if(name==='run-change') {
            if(!field('changedCode').trim()) throw new Error(tr('Введите программу в поле «Изменённый код для защиты».','Dasturni o‘zgartirilgan kod maydoniga yozing.'));

            const controller=new AbortController(); state.controller=controller;
            const el=document.getElementById('changedOutput'); el.hidden=false; el.textContent=tr('Выполнение…','Bajarilmoqda…');
            document.getElementById('assignmentStopButton').disabled=false;
            try {
                const result=await BrowserExecutor.run({code:field('changedCode'),language:state.data.language,stdin:field('changedInput'),signal:controller.signal});
                if(el.isConnected) {
                    const error=result.error;
                    const last=error?.trim().split('\n').filter(Boolean).pop();
                    el.textContent=error ? `${tr('Ошибка в изменённой программе:','O‘zgartirilgan dasturda xato:')} ${last}\n${tr('Проверьте код выше. В поле данных должны быть только ответы для input(), а не программа.','Yuqoridagi kodni tekshiring. Ma’lumotlar maydonida dastur emas, input() uchun javoblar bo‘lishi kerak.')}` : result.stdout||tr('Программа завершилась без вывода. Для отображения результата используйте print() или console.log().','Dastur natijasiz yakunlandi. Natijani ko‘rsatish uchun print() yoki console.log() ishlating.');
                }
            } finally { if(state.controller===controller) state.controller=null; const stop=document.getElementById('assignmentStopButton'); if(stop) stop.disabled=true; }
            return;
        }
        if(name==='submit') {
            if(!state.report||state.report.code!==field('assignmentCode')) throw new Error(tr('Сначала запустите тесты для текущего кода.','Avval joriy kod uchun testlarni bajaring.'));
            const data=await api(`/assignments/${id}/submissions`,{code:state.report.code,results:state.report.results.map(r=>({stdout:r.stdout,error:r.truncated?'Output limit reached':r.error})),explanation:field('defenseExplanation'),changed_code:field('changedCode'),code_paste_detected:field('codePasteDetected')==='true',change_explanation:field('changeExplanation')});
            return open('submission',data.id);
        }
        if(name==='approve'||name==='revise') { await api(`/submissions/${id}/review`,{decision:name==='approve'?'approved':'needs_revision',feedback:field('reviewFeedback'),score:field('reviewScore')===''?null:Number(field('reviewScore'))}); return open('submission',id); }
        if(name==='publish-portfolio') { await api('/profile',{role:state.profile.role,locale:window.MentorLocale,bio:field('portfolioBio'),portfolio_public:document.getElementById('portfolioPublic').checked}); delete state.drafts[key()]; return open('portfolio'); }
    }
    root.addEventListener('click',async event=>{
        const el=event.target.closest('button[data-action]'); if(!el||el.disabled) return;
        const name=el.dataset.action;
        if(state.controller && !['stop','home','group','editor'].includes(name)) return;
        el.disabled=true; message('');
        try {await action(name,el.dataset.id,el);} catch(error) {message(error.message||tr('Ошибка соединения.','Ulanish xatosi.'));}
        finally {if(el.isConnected && !['stop'].includes(name)) el.disabled=false;}
    });
    root.addEventListener('change',event=>{
        const el=event.target;
        if(!el.dataset.filterScope) return;
        state.filters[el.dataset.filterScope][el.dataset.filterKey]=el.value;
        if(el.dataset.filterScope==='glossary') updateGlossaryResults(); else {saveDraft(); render();}
    });
    root.addEventListener('input',event=>{
        if(state.view==='assignment') persistAssignment();
        if(event.target.id==='assignmentCode') renderReport();
        if(event.target.id==='glossarySearch') {state.filters.glossary.query=event.target.value;updateGlossaryResults();}
    });
    window.addEventListener('mentor-authenticated',()=>{
        if(pendingAuth && !root.hidden && localStorage.getItem('mentor_token')) window.LearningUI.open();
    });
    updateNavigation();
    window.LearningUI={open:()=>open().catch(error=>message(error.message)),close};
    document.getElementById('learningNav').addEventListener('click',()=>window.LearningUI.open());
    document.getElementById('glossaryNav')?.addEventListener('click',()=>open('glossary').catch(error=>message(error.message)));
    for(const name of ['clearCode','loadHistory','showProgress','showStatistics','showSavedSnippets','showSettings']) {
        const original=window[name]; if(original) window[name]=function(...args){close(); return original.apply(this,args);};
    }
    window.addEventListener('mentor-locale',()=>{
        updateNavigation();
        if(!root.hidden) document.querySelector('.header h1').textContent=tr('Учебный кабинет','O‘quv xonasi');
        if(!root.hidden && root.getAttribute('aria-busy')!=='true' && state.data && !state.controller) {saveDraft(); render();}
    });
    window.addEventListener('pagehide',()=>{persistAssignment();state.controller?.abort();});
    window.addEventListener('load',()=>{
        const params=new URLSearchParams(location.search);
        if(params.get('join')){sessionStorage.setItem('mentor_join',params.get('join'));open('home').then(()=>{const input=document.getElementById('joinCode');if(input)input.value=sessionStorage.getItem('mentor_join')||'';});}
        const slug=params.get('portfolio');
        if(slug) open('public',slug).catch(error=>{hideAuthOverlay();activate();show(`<h2>${tr('Портфолио недоступно','Portfolio mavjud emas')}</h2>`);message(error.message);});
    });
})();
