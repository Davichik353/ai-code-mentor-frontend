'use strict';
(() => {
    const root=document.getElementById('learningRoot');
    const feedback=document.getElementById('learningFeedback');
    const state={view:'home',data:null,profile:null,templates:[],drafts:{},report:null,controller:null,publicSlug:null};
    let navigationId=0;
    let pendingAuth=false;
    const tr=(ru,uz)=>window.MentorLocale==='uz'?uz:ru;
    const local=value=>typeof value==='object' && value!==null ? value[window.MentorLocale]||value.ru||'' : String(value??'');
    const esc=value=>escapeHtml(String(value??''));
    const button=(label,action,id='',extra='')=>`<button type="button" class="btn-primary" data-action="${action}" data-id="${esc(id)}" ${extra}>${esc(label)}</button>`;
    const status=value=>({pending_review:tr('Ожидает проверки','Tekshiruv kutilmoqda'),approved:tr('Принято преподавателем','O‘qituvchi qabul qildi'),needs_revision:tr('Нужна доработка','Qayta ishlash kerak')})[value]||value;
    const notice=()=>`<p class="notice">${tr('Тесты выполняются в браузере. Это непроверенный отчёт ученика: преподаватель проверяет код и мини-защиту перед принятием работы.','Testlar brauzerda bajariladi. Bu o‘quvchining tasdiqlanmagan hisoboti: ishni qabul qilishdan oldin o‘qituvchi kod va kichik himoyani tekshiradi.')}</p>`;
    const key=()=>`${state.view}:${state.data?.id||''}`;
    const field=id=>document.getElementById(id)?.value||'';
    function saveDraft() {
        if(root.hidden) return;
        const values={}; root.querySelectorAll('input[id],textarea[id],select[id]').forEach(el=>values[el.id]=el.type==='checkbox'?el.checked:el.value);
        state.drafts[key()]=values;
    }
    function restoreDraft() {
        const values=state.drafts[key()]||{};
        for(const [id,value] of Object.entries(values)) {
            const el=document.getElementById(id); if(!el) continue;
            if(el.type==='checkbox') el.checked=value; else el.value=value;
        }
    }
    function show(html) { root.innerHTML=html; restoreDraft(); }
    function message(text) { feedback.textContent=text; }
    function updateNavigation() {
        document.getElementById('learningNavLabel').textContent=tr('Учебный кабинет','O‘quv xonasi');
        document.getElementById('learningNavDescription').textContent=tr('Группы и задания','Guruhlar va topshiriqlar');
    }
    function showSignIn() {
        pendingAuth=true;
        show(`<section class="learning-card learning-state"><h2>${tr('Войдите в учебный кабинет','O‘quv xonasiga kiring')}</h2><p>${tr('После входа можно создать группу, выдать задание или присоединиться по коду преподавателя.','Kirgandan so‘ng guruh yarating, topshiriq bering yoki o‘qituvchi kodi orqali qo‘shiling.')}</p>${button(tr('Войти или зарегистрироваться','Kirish yoki ro‘yxatdan o‘tish'),'sign-in')}</section>`);
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
            if(response.status===422) throw new Error(tr('Проверьте поля: объяснения — от 20 символов, код — от 5.','Maydonlarni tekshiring: izohlar kamida 20 belgi, kod kamida 5 belgi.'));
            const errors={
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
        document.querySelector('.main > .content').style.display='none';
        root.hidden=false; feedback.hidden=false;
        document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.id==='learningNav'));
        document.querySelector('.header h1').textContent=tr('Учебный кабинет','O‘quv xonasi');
        document.querySelector('.header p').textContent=tr('Группы, задания и проверка работ','Guruhlar, topshiriqlar va ishlarni tekshirish');
        updateNavigation();
    }
    function close() {
        navigationId++; pendingAuth=false;
        saveDraft(); state.controller?.abort(); state.report=null;
        root.removeAttribute('aria-busy');
        root.hidden=true; feedback.hidden=true; document.querySelector('.main > .content').style.display='';
        document.getElementById('learningNav').classList.remove('active');
        document.querySelector('.header h1').textContent=tr('Анализ кода','Kod tahlili');
        document.querySelector('.header p').textContent=tr('Вставьте код и получите объяснение ошибок','Kodni kiriting va xatolar izohini oling');
    }
    async function open(view='home',id='') {
        saveDraft(); state.controller?.abort(); state.controller=null;
        const navigation=++navigationId;
        message(''); activate();
        if(!localStorage.getItem('mentor_token') && view!=='public') { root.removeAttribute('aria-busy'); showSignIn(); showAuthOverlay(); return; }
        pendingAuth=false;
        root.setAttribute('aria-busy','true');
        show(`<section class="learning-card learning-state" role="status"><h2>${tr('Загружаем учебный кабинет…','O‘quv xonasi yuklanmoqda…')}</h2><p>${tr('Здесь будут ваши группы и задания. Бесплатный сервер после простоя может запускаться до минуты.','Bu yerda guruhlaringiz va topshiriqlaringiz bo‘ladi. Bepul server tanaffusdan so‘ng bir daqiqagacha ishga tushishi mumkin.')}</p></section>`);
        try {
        const previous=key();
        let data;
        if(view==='home') {
            const [profile,groups,templates]=await Promise.all([api('/profile'),api('/groups'),api('/templates')]);
            state.profile=profile; state.templates=templates; data={groups};
        } else if(view==='group') data=await api(`/groups/${encodeURIComponent(id)}`);
        else if(view==='assignment') data=await api(`/assignments/${encodeURIComponent(id)}`);
        else if(view==='submission') data=await api(`/submissions/${encodeURIComponent(id)}`);
        else if(view==='portfolio') { state.profile=await api('/profile'); data=await api('/portfolio'); }
        else if(view==='glossary') data=await api('/glossary');
        else if(view==='public') {state.publicSlug=id; data=await api(`/portfolios/${encodeURIComponent(id)}`,undefined,true); hideAuthOverlay();}
        if(navigation!==navigationId) return;
        state.view=view; state.data=data;
        if(previous!==key()) state.report=null;
        render();
        root.scrollTop=0;
        } catch(error) {
            if(navigation!==navigationId) return;
            if(!pendingAuth) show(`<section class="learning-card learning-state"><h2>${view==='public'?tr('Портфолио недоступно','Portfolio mavjud emas'):tr('Не удалось загрузить кабинет','O‘quv xonasini yuklab bo‘lmadi')}</h2><p>${esc(error.message)}</p><div class="actions">${button(tr('Повторить загрузку','Qayta yuklash'),'home')}${button(tr('Вернуться к редактору','Muharrirga qaytish'),'editor')}</div></section>`);
            message(error.message);
        } finally {
            if(navigation===navigationId) root.removeAttribute('aria-busy');
        }
    }
    const back=(action,id='')=>button(tr('← Назад','← Orqaga'),action,id);
    function renderHome() {
        const p=state.profile;
        return `<h2>${tr('Учебный кабинет','O‘quv xonasi')}</h2><p>${tr('Решайте задания, объясняйте решения и собирайте проверенные работы.','Topshiriqlarni yeching, yechimlarni tushuntiring va tekshirilgan ishlarni to‘plang.')}</p>
        <div class="actions">${button(tr('Моё портфолио','Mening portfoliom'),'portfolio')}${button(tr('Словарь терминов','Atamalar lug‘ati'),'glossary')}${button(tr('Открыть редактор','Muharrirni ochish'),'editor')}</div>
        <div class="learning-grid"><section class="learning-card"><h3>${tr('Мой режим','Mening rejimim')}</h3>
            <p>${tr('Режим преподавателя позволяет управлять только своими группами. Это не подтверждение квалификации.','O‘qituvchi rejimi faqat o‘z guruhlaringizni boshqaradi. Bu malaka tasdig‘i emas.')}</p>
            <label>${tr('Роль','Rol')}<select id="learningRole"><option value="learner" ${p.role==='learner'?'selected':''}>${tr('Ученик','O‘quvchi')}</option><option value="teacher" ${p.role==='teacher'?'selected':''}>${tr('Преподаватель','O‘qituvchi')}</option></select></label>
            ${button(tr('Сохранить режим','Rejimni saqlash'),'profile')}</section>
        <section class="learning-card"><h3>${tr('Вступить в группу','Guruhga qo‘shilish')}</h3><label>${tr('Код от преподавателя','O‘qituvchi bergan kod')}<input id="joinCode" maxlength="64" autocomplete="off"></label>${button(tr('Присоединиться','Qo‘shilish'),'join')}</section>
        ${p.role==='teacher'?`<section class="learning-card"><h3>${tr('Создать группу','Guruh yaratish')}</h3><label>${tr('Название','Nomi')}<input id="groupTitle" maxlength="120"></label><label>${tr('Описание','Tavsif')}<textarea id="groupDescription" maxlength="1000"></textarea></label>${button(tr('Создать','Yaratish'),'create-group')}</section>`:''}</div>
        <h3>${tr('Мои группы','Mening guruhlarim')}</h3><div class="learning-grid">${state.data.groups.length?state.data.groups.map(g=>`<section class="learning-card"><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p><span class="badge">${g.is_owner?tr('Вы преподаватель','Siz o‘qituvchisiz'):tr('Вы участник','Siz ishtirokchisiz')}</span><p>${tr('Учеников','O‘quvchilar')}: ${g.member_count}</p>${button(tr('Открыть группу','Guruhni ochish'),'group',g.id)}</section>`).join(''):`<p>${tr('Групп пока нет. Создайте группу или введите код преподавателя.','Hali guruhlar yo‘q. Guruh yarating yoki o‘qituvchi kodini kiriting.')}</p>`}</div>`;
    }
    function renderGroup() {
        const g=state.data;
        const assignmentName=id=>local(g.assignments.find(a=>a.id===id)?.title)||id;
        return `${back('home')}<h2>${esc(g.title)}</h2><p>${esc(g.description)}</p>
        ${g.is_owner?`<section class="learning-card"><h3>${tr('Приглашение','Taklif')}</h3><p>${tr('Передайте ученикам этот код. Не публикуйте его в открытом доступе.','Bu kodni o‘quvchilarga bering. Uni ochiq joyda e’lon qilmang.')}</p><pre id="groupJoinCode">${esc(g.join_code)}</pre>
        <h3>${tr('Выдать задание','Topshiriq berish')}</h3><label>${tr('Задание','Topshiriq')}<select id="templateChoice">${state.templates.map(t=>`<option value="${esc(t.id)}">${esc(local(t.title))} · ${esc(t.language)}</option>`).join('')}</select></label>${button(tr('Добавить в группу','Guruhga qo‘shish'),'assign',g.id)}</section>`:''}
        <h3 style="margin-top:18px">${tr('Задания','Topshiriqlar')}</h3><div class="learning-grid">${g.assignments.map(a=>`<section class="learning-card"><h3>${esc(local(a.title))}</h3><p>${esc(a.language)}</p>${button(tr('Открыть задание','Topshiriqni ochish'),'assignment',a.id)}</section>`).join('')||`<p>${tr('Преподаватель ещё не выдал задания.','O‘qituvchi hali topshiriq bermagan.')}</p>`}</div>
        ${g.is_owner?`<section class="learning-card"><h3>${tr('Обзор группы','Guruh holati')}</h3><p>${tr('Участников / сдали работу / принято последних работ / всего попыток','Ishtirokchilar / ish yuborganlar / qabul qilingan oxirgi ishlar / jami urinishlar')}: <strong>${g.members.length} / ${g.summary.learners_submitted} / ${g.summary.approved} / ${g.summary.attempts}</strong></p>
        <p>${g.members.map(m=>esc(m.display_name||tr('Ученик','O‘quvchi'))).join(', ')||tr('Пока нет учеников','Hali o‘quvchilar yo‘q')}</p>
        <h3>${tr('Частые затруднения — по последним отчётам','Ko‘p uchragan qiyinchiliklar — oxirgi hisobotlar bo‘yicha')}</h3>
        ${g.summary.common_failures.map(f=>`<p>${esc(assignmentName(f.assignment_id))} · ${tr('тест','test')} ${f.case}: ${f.learners} ${tr('учеников не прошли','o‘quvchi o‘ta olmadi')}</p>`).join('')||`<p>${tr('Нет проваленных тестов в последних отчётах.','Oxirgi hisobotlarda muvaffaqiyatsiz testlar yo‘q.')}</p>`}
        ${notice()}<h3>${tr('Работы на проверку','Tekshirish uchun ishlar')}</h3>${g.submissions.map(s=>`<div class="test-row"><p>${esc(s.display_name||tr('Ученик','O‘quvchi'))} · ${esc(assignmentName(s.assignment_id))} · ${esc(status(s.status))}</p>${button(tr('Проверить работу','Ishni tekshirish'),'submission',s.id)}</div>`).join('')||`<p>${tr('Работ пока нет.','Hali ishlar yo‘q.')}</p>`}</section>`:''}`;
    }
    function renderAssignment() {
        const a=state.data;
        return `${back('group',a.group_id)}<h2>${esc(local(a.title))}</h2><span class="badge">${esc(a.language)}</span><p>${esc(local(a.prompt))}</p>
        ${notice()}<div class="learning-grid"><section class="learning-card"><h3>${tr('Исправь сам','O‘zingiz yeching')}</h3><p>${tr('Сначала попробуйте сами. Подсказки открываются по очереди; пример решения — после вашего объяснения.','Avval o‘zingiz urinib ko‘ring. Maslahatlar ketma-ket ochiladi; namuna yechim esa izohingizdan keyin.')}</p>
        <div id="learningHints">${a.hints.map((h,i)=>`<p>${i+1}. ${esc(local(h))}</p>`).join('')}</div>
        ${a.is_owner?'':button(tr('Следующая подсказка','Keyingi maslahat'),'hint',a.id,`id="hintButton" ${a.hints.length>=a.hint_count?'disabled':''}`)}
        <details><summary>${tr('Нужен пример решения?','Namuna yechim kerakmi?')}</summary><label>${tr('Что вы уже пробовали? Не менее 20 символов.','Nimani sinab ko‘rdingiz? Kamida 20 belgi.')}<textarea id="solutionReflection" maxlength="3000"></textarea></label>${button(tr('Показать пример','Namunani ko‘rsatish'),'solution',a.id,`id="solutionButton" ${!a.is_owner&&a.hints.length<a.hint_count?'disabled':''}`)}<pre id="learningSolution" hidden></pre></details></section>
        <section class="learning-card"><h3>${tr('Проверочные примеры','Tekshiruv misollari')}</h3>${a.tests.map((t,i)=>`<details><summary>${tr('Тест','Test')} ${i+1}</summary><p>${tr('Ввод','Kiritish')}</p><pre>${esc(t.stdin)}</pre><p>${tr('Ожидаемый вывод','Kutilgan natija')}</p><pre>${esc(t.expected_stdout)}</pre></details>`).join('')}</section></div>
        ${!a.is_owner?`<section class="learning-card"><label>${tr('Ваш код','Sizning kodingiz')}<textarea class="code" id="assignmentCode" spellcheck="false" maxlength="10000">${esc(a.starter_code)}</textarea></label>
        <div class="actions">${button(tr('Запустить тесты','Testlarni ishga tushirish'),'test',a.id,'id="assignmentTestButton"')}${button(tr('Остановить','To‘xtatish'),'stop','', 'id="assignmentStopButton" disabled')}</div>
        <p id="assignmentRunStatus" role="status" aria-live="polite"></p><div id="assignmentTestResults"></div>
        <h3>${tr('Мини-защита','Kichik himoya')}</h3><ul>${a.defense_questions.map(q=>`<li>${esc(local(q))}</li>`).join('')}</ul>
        <label>${tr('Объяснение решения и граничного случая (от 20 символов)','Yechim va chegaraviy holat izohi (kamida 20 belgi)')}<textarea id="defenseExplanation" maxlength="3000"></textarea></label>
        <p>${esc(local(a.change))}</p><label>${tr('Изменённый код для защиты','Himoya uchun o‘zgartirilgan kod')}<textarea class="code" id="changedCode" spellcheck="false" maxlength="10000"></textarea></label>
        <label>${tr('Проверочный ввод для изменённого кода','O‘zgartirilgan kod uchun kiritish')}<textarea id="changedInput" maxlength="5000"></textarea></label>
        ${button(tr('Проверить изменённый код','O‘zgartirilgan kodni sinash'),'run-change',a.id,'id="changeRunButton"')}<pre id="changedOutput" hidden></pre>
        <label>${tr('Что и почему изменили (от 20 символов)','Nima va nima uchun o‘zgardi (kamida 20 belgi)')}<textarea id="changeExplanation" maxlength="3000"></textarea></label>
        ${button(tr('Отправить преподавателю','O‘qituvchiga yuborish'),'submit',a.id,'id="assignmentSubmitButton" disabled')}</section>
        <h3 style="margin-top:18px">${tr('Мои попытки','Mening urinishlarim')}</h3>${a.submissions.map(s=>`<section class="learning-card"><p>${esc(status(s.status))}</p><p>${esc(s.feedback)}</p>${button(tr('Открыть попытку','Urinishni ochish'),'submission',s.id)}</section>`).join('')||`<p>${tr('Попыток пока нет.','Hali urinishlar yo‘q.')}</p>`}`:''}`;
    }
    function renderSubmission() {
        const s=state.data;
        return `${back('group',s.group_id)}<h2>${esc(local(s.title))}</h2><p>${esc(status(s.status))}</p>${notice()}
        <section class="learning-card"><h3>${tr('Исходное решение','Asosiy yechim')}</h3><pre>${esc(s.code)}</pre><p>${esc(s.explanation)}</p>
        <h3>${tr('Мини-защита','Kichik himoya')}</h3><p>${esc(local(s.change))}</p><pre>${esc(s.changed_code)}</pre><p>${esc(s.change_explanation)}</p>
        <h3>${tr('Отчёт тестов','Test hisoboti')}</h3>${s.results.map((r,i)=>`<details><summary>${tr('Тест','Test')} ${i+1}: ${r.passed?tr('пройден','o‘tdi'):tr('не пройден','o‘tmadi')}</summary><p>${tr('Ожидалось','Kutilgan')}</p><pre>${esc(s.tests[i].expected_stdout)}</pre><p>${tr('Получено / ошибка','Olingan natija / xato')}</p><pre>${esc(r.error||r.stdout)}</pre></details>`).join('')}
        <p>${esc(s.feedback)}</p>${s.is_owner?`<p>${tr('Проверьте объяснение, изменённый код и понимание ученика перед принятием.','Qabul qilishdan oldin izoh, o‘zgartirilgan kod va o‘quvchining tushunganini tekshiring.')}</p><label>${tr('Комментарий преподавателя (от 20 символов)','O‘qituvchi izohi (kamida 20 belgi)')}<textarea id="reviewFeedback" maxlength="3000"></textarea></label><div class="actions">${button(tr('Принять работу','Ishni qabul qilish'),'approve',s.id,s.tests_passed?'':'disabled')}${button(tr('Отправить на доработку','Qayta ishlashga yuborish'),'revise',s.id)}</div>`:''}</section>`;
    }
    function renderPortfolio() {
        const p=state.data, pub=state.view==='public';
        const url=new URL(location.pathname,location.origin); url.searchParams.set('portfolio',p.slug);
        return `${pub?'':back('home')}<h2>${tr('Портфолио','Portfolio')}: ${esc(p.display_name)}</h2><p>${esc(p.bio)}</p><p>${tr('Принятых заданий','Qabul qilingan topshiriqlar')}: ${p.completed}</p><p>${p.skills.map(s=>`<span class="badge">${esc(s)}</span>`).join('')}</p>
        ${!pub?`<section class="learning-card"><label>${tr('О себе — будет видно по публичной ссылке','O‘zingiz haqingizda — ochiq havolada ko‘rinadi')}<textarea id="portfolioBio" maxlength="500">${esc(p.bio)}</textarea></label><label><input type="checkbox" id="portfolioPublic" ${p.public?'checked':''}> ${tr('Разрешить просмотр по ссылке','Havola orqali ko‘rishga ruxsat berish')}</label><p>${tr('Публикуются имя, описание и названия принятых заданий. Код, почта и ответы защиты остаются закрытыми. Ссылку можно отключить.','Ism, tavsif va qabul qilingan topshiriq nomlari ko‘rinadi. Kod, pochta va himoya javoblari yopiq qoladi. Havolani o‘chirish mumkin.')}</p>${button(tr('Сохранить настройки','Sozlamalarni saqlash'),'publish-portfolio')}<p id="portfolioLink">${p.public?`<a href="${esc(url.href)}" target="_blank" rel="noopener">${esc(url.href)}</a>`:tr('Публичная ссылка выключена.','Ochiq havola o‘chirilgan.')}</p></section>`:''}
        <div class="learning-grid">${p.projects.map(project=>`<section class="learning-card"><h3>${esc(local(project.title))}</h3><span class="badge">${esc(project.language)}</span><p>${tr('Проверено преподавателем','O‘qituvchi tekshirgan')}</p><p>${esc(new Date(project.reviewed_at).toLocaleDateString(window.MentorLocale==='uz'?'uz-UZ':'ru-RU'))}</p></section>`).join('')||`<p>${tr('После принятия преподавателем здесь появятся ваши работы.','O‘qituvchi qabul qilgach, ishlar shu yerda paydo bo‘ladi.')}</p>`}</div>`;
    }
    function render() {
        if(state.view==='home') show(renderHome());
        else if(state.view==='group') show(renderGroup());
        else if(state.view==='assignment') {show(renderAssignment()); renderReport();}
        else if(state.view==='submission') show(renderSubmission());
        else if(state.view==='portfolio'||state.view==='public') show(renderPortfolio());
        else if(state.view==='glossary') show(`${back('home')}<h2>${tr('Словарь терминов','Atamalar lug‘ati')}</h2><div class="learning-grid">${state.data.map(item=>`<section class="learning-card"><h3>${esc(item.term)}</h3><p>${esc(item[window.MentorLocale])}</p></section>`).join('')}</div>`);
    }
    function renderReport() {
        const el=document.getElementById('assignmentTestResults'); if(!el) return;
        const report=state.report;
        const valid=report && report.assignment===state.data.id && report.code===field('assignmentCode');
        document.getElementById('assignmentSubmitButton').disabled=!valid;
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
            for(let i=0;i<a.tests.length;i++) {
                const el=document.getElementById('assignmentRunStatus'); if(!el) return;
                el.textContent=tr(`Тест ${i+1}/${a.tests.length}: загрузка или выполнение…`,`Test ${i+1}/${a.tests.length}: yuklash yoki bajarish…`);
                const result=await BrowserExecutor.run({code,language:a.language,stdin:a.tests[i].stdin,signal:controller.signal});
                if(controller.signal.aborted) return;
                results.push({...result,passed:!result.error&&!result.truncated&&result.stdout.trim()===a.tests[i].expected_stdout.trim()});
            }
            state.report={assignment:a.id,code,results};
            document.getElementById('assignmentRunStatus').textContent=tr(`Пройдено ${results.filter(r=>r.passed).length} из ${results.length}. Можно отправить отчёт и защиту преподавателю.`,`Jami ${results.length} testdan ${results.filter(r=>r.passed).length} tasi o‘tdi. Hisobot va himoyani o‘qituvchiga yuborish mumkin.`);
            renderReport();
        } finally {
            if(state.controller===controller) state.controller=null;
            const stop=document.getElementById('assignmentStopButton'); if(stop) stop.disabled=true;
            const run=document.getElementById('assignmentTestButton'); if(run) run.disabled=false;
            const editor=document.getElementById('assignmentCode'); if(editor) editor.readOnly=false;
        }
    }
    async function action(name,id) {
        if(name==='sign-in') { showAuthOverlay(); return; }
        if(['home','group','assignment','submission','portfolio','glossary'].includes(name)) return open(name,id);
        if(name==='editor') return close();
        if(name==='profile') { state.profile=await api('/profile',{role:field('learningRole'),locale:window.MentorLocale,bio:state.profile.bio,portfolio_public:!!state.profile.public}); delete state.drafts[key()]; return open('home'); }
        if(name==='create-group') { const group=await api('/groups',{title:field('groupTitle'),description:field('groupDescription')}); return open('group',group.id); }
        if(name==='join') { const group=await api('/groups/join',{code:field('joinCode').trim()}); return open('group',group.id); }
        if(name==='assign') { await api(`/groups/${id}/assignments`,{template_id:field('templateChoice')}); return open('group',id); }
        if(name==='hint') { const data=await api(`/assignments/${id}/hints`,{}); state.data.hints=data.hints; saveDraft(); render(); return; }
        if(name==='solution') { const data=await api(`/assignments/${id}/solution`,{reflection:field('solutionReflection')}); const el=document.getElementById('learningSolution'); el.hidden=false; el.textContent=data.solution; return; }
        if(name==='test') return runTests();
        if(name==='stop') {state.controller?.abort(); const el=document.getElementById('assignmentRunStatus'); if(el) el.textContent=tr('Выполнение остановлено.','Bajarish to‘xtatildi.'); return;}
        if(name==='run-change') {
            const controller=new AbortController(); state.controller=controller;
            const el=document.getElementById('changedOutput'); el.hidden=false; el.textContent=tr('Выполнение…','Bajarilmoqda…');
            document.getElementById('assignmentStopButton').disabled=false;
            try {
                const result=await BrowserExecutor.run({code:field('changedCode'),language:state.data.language,stdin:field('changedInput'),signal:controller.signal});
                if(el.isConnected) el.textContent=result.error||result.stdout||tr('(пустой вывод)','(bo‘sh natija)');
            } finally { if(state.controller===controller) state.controller=null; const stop=document.getElementById('assignmentStopButton'); if(stop) stop.disabled=true; }
            return;
        }
        if(name==='submit') {
            if(!state.report||state.report.code!==field('assignmentCode')) throw new Error(tr('Сначала запустите тесты для текущего кода.','Avval joriy kod uchun testlarni bajaring.'));
            const data=await api(`/assignments/${id}/submissions`,{code:state.report.code,results:state.report.results.map(r=>({stdout:r.stdout,error:r.truncated?'Output limit reached':r.error})),explanation:field('defenseExplanation'),changed_code:field('changedCode'),change_explanation:field('changeExplanation')});
            return open('submission',data.id);
        }
        if(name==='approve'||name==='revise') { await api(`/submissions/${id}/review`,{decision:name==='approve'?'approved':'needs_revision',feedback:field('reviewFeedback')}); return open('submission',id); }
        if(name==='publish-portfolio') { await api('/profile',{role:state.profile.role,locale:window.MentorLocale,bio:field('portfolioBio'),portfolio_public:document.getElementById('portfolioPublic').checked}); delete state.drafts[key()]; return open('portfolio'); }
    }
    root.addEventListener('click',async event=>{
        const el=event.target.closest('button[data-action]'); if(!el||el.disabled) return;
        const name=el.dataset.action;
        if(state.controller && !['stop','home','group','editor'].includes(name)) return;
        el.disabled=true; message('');
        try {await action(name,el.dataset.id);} catch(error) {message(error.message||tr('Ошибка соединения.','Ulanish xatosi.'));}
        finally {if(el.isConnected && !['stop'].includes(name)) el.disabled=false;}
    });
    root.addEventListener('input',event=>{if(event.target.id==='assignmentCode') renderReport();});
    window.addEventListener('mentor-authenticated',()=>{
        if(pendingAuth && !root.hidden && localStorage.getItem('mentor_token')) window.LearningUI.open();
    });
    updateNavigation();
    window.LearningUI={open:()=>open().catch(error=>message(error.message)),close};
    document.getElementById('learningNav').addEventListener('click',()=>window.LearningUI.open());
    for(const name of ['clearCode','loadHistory','showProgress','showStatistics','showSavedSnippets','showSettings']) {
        const original=window[name]; if(original) window[name]=function(...args){close(); return original.apply(this,args);};
    }
    window.addEventListener('mentor-locale',()=>{
        updateNavigation();
        if(!root.hidden) document.querySelector('.header h1').textContent=tr('Учебный кабинет','O‘quv xonasi');
        if(!root.hidden && root.getAttribute('aria-busy')!=='true' && state.data && !state.controller) {saveDraft(); render();}
    });
    window.addEventListener('pagehide',()=>state.controller?.abort());
    window.addEventListener('load',()=>{
        const slug=new URLSearchParams(location.search).get('portfolio');
        if(slug) open('public',slug).catch(error=>{hideAuthOverlay();activate();show(`<h2>${tr('Портфолио недоступно','Portfolio mavjud emas')}</h2>`);message(error.message);});
    });
})();
