'use strict';
(() => {
    let locale='ru';
    try {locale=localStorage.getItem('mentor_locale')==='uz'?'uz':'ru';}catch{}
    const nodes=[...document.querySelectorAll('[data-uz]')];
    nodes.forEach(el=>el.dataset.ru=el.hasAttribute('data-html')?el.innerHTML:el.textContent);
    function translate(){
        document.documentElement.lang=locale;
        for(const el of nodes){const value=el.dataset[locale];if(el.hasAttribute('data-html'))el.innerHTML=value;else el.textContent=value;}
        const toggle=document.getElementById('landingLocale');toggle.textContent=locale==='uz'?'Русский':'O‘zbekcha';toggle.setAttribute('aria-label',locale==='uz'?'Tilni o‘zgartirish':'Изменить язык');
        document.title=locale==='uz'?'AI Code Mentor — koddan tushunishga':'AI Code Mentor — от кода к пониманию';
    }
    document.getElementById('landingLocale').addEventListener('click',()=>{locale=locale==='ru'?'uz':'ru';try{localStorage.setItem('mentor_locale',locale)}catch{}translate();});
    translate();
    if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
        const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('landing-reveal');observer.unobserve(entry.target);}}},{threshold:.12});
        document.querySelectorAll('.product-section,.teacher-section,.import-section,.steps-grid,.faq').forEach(el=>observer.observe(el));
    }
    const tabs=[...document.querySelectorAll('[data-feature]')];
    function select(tab){for(const item of tabs){const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;document.getElementById('feature-'+item.dataset.feature).hidden=!active;}}
    tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>select(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();select(tabs[next]);tabs[next].focus();});});
})();
