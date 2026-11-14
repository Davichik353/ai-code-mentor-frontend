/* One short introduction for signed-out visitors. Never part of the auth flow. */
'use strict';
(() => {
    const root=document.documentElement;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    try {
        if(localStorage.getItem('mentor_token') || sessionStorage.getItem('mentor-welcome-seen') || reduced.matches ||
            new URLSearchParams(location.search).has('portfolio') || new URLSearchParams(location.hash.slice(1)).has('reset')) return;
    } catch { return; }
    root.classList.add('welcome-pending');
    let dialog, video, finished=false;
    const finish=()=>{
        if(finished)return;
        finished=true;
        clearTimeout(deadline);
        root.classList.remove('welcome-pending');
        video?.pause();
        if(dialog?.open)dialog.close();
        dialog?.remove();
        reduced.removeEventListener('change',finish);
        window.removeEventListener('mentor-authenticated',finish);
        window.removeEventListener('pagehide',finish);
        const target=document.querySelector('#authOverlay input:not([style*="display: none"])');
        if(target?.offsetParent)target.focus({preventScroll:true});
    };
    // Fail open even if decoding, playback or page loading stalls.
    const deadline=setTimeout(finish,8500);
    reduced.addEventListener('change',finish);
    window.addEventListener('mentor-authenticated',finish);
    window.addEventListener('pagehide',finish);
    document.addEventListener('DOMContentLoaded',()=>{
        if(finished)return;
        const uz=window.MentorLocale==='uz';
        dialog=document.createElement('dialog');
        dialog.className='welcome-intro';
        dialog.setAttribute('aria-label',uz?'AI Code Mentor — xush kelibsiz':'AI Code Mentor — добро пожаловать');
        dialog.innerHTML=`<video class="welcome-film" muted playsinline preload="auto" poster="assets/welcome-awe-poster.jpg" aria-hidden="true" tabindex="-1"><source src="assets/welcome-awe.mp4" type="video/mp4"></video>
            <div class="welcome-shade" aria-hidden="true"></div>
            <header class="welcome-top"><span>AI CODE MENTOR</span><button class="welcome-skip" type="button">${uz?'O‘tkazib yuborish':'Пропустить'} <span aria-hidden="true">↗</span></button></header>
            <div class="welcome-caption"><span>${uz?'O‘RGANING · YOZING · YARATING':'УЧИСЬ · ПИШИ КОД · СОЗДАВАЙ'}</span><h1>${uz?'G‘oyadan — kodga.':'От идеи — к коду.'}</h1><p>${uz?'Sizning o‘quv makoningiz':'Твоё пространство для обучения'}</p></div>`;
        document.body.append(dialog);
        dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
        dialog.querySelector('button').addEventListener('click',finish);
        video=dialog.querySelector('video');
        video.addEventListener('ended',finish,{once:true});
        video.addEventListener('error',finish,{once:true});
        video.querySelector('source').addEventListener('error',finish,{once:true});
        try {sessionStorage.setItem('mentor-welcome-seen','1');dialog.showModal();video.muted=true;video.play().catch(finish);} catch {finish();}
    },{once:true});
})();
