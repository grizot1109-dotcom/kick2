'use strict';
/* ===== KICK 2: телефон, только горизонтально ===== */
const MOB={on:false,fs:false};
function mobCheck(){
  const coarse=matchMedia('(pointer:coarse)').matches;const small=Math.min(screen.width,screen.height)<=600||Math.min(innerWidth,innerHeight)<=600;
  MOB.on=coarse&&small;const h=document.documentElement;h.classList.toggle('mob',MOB.on);
  if(MOB.on){const land=innerWidth>innerHeight;const z=land?Math.min(1,Math.max(.62,innerHeight/500)):.8;h.style.setProperty('--mz',z.toFixed(3));}
}
mobCheck();addEventListener('resize',mobCheck);addEventListener('orientationchange',()=>setTimeout(mobCheck,200));

// подсказка «поверните телефон»
(function(){const d=document.createElement('div');d.id='rot';d.innerHTML='<div class="ph"></div><b>Поверните телефон</b><small>KICK 2 играется только горизонтально</small>';document.body.appendChild(d);})();

// iPhone/iPad в Safari: убрать панели браузера сайт не может — только «На экран Домой», тогда игра открывается на весь экран
(function(){
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const app=navigator.standalone||matchMedia('(display-mode: standalone),(display-mode: fullscreen)').matches;
  let seen=false;try{seen=localStorage.getItem('kick2_a2hs')==='1';}catch(e){}
  if(!ios||app||seen||!MOB.on)return;
  const share='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  const d=document.createElement('div');d.id='a2hs';d.setAttribute('role','dialog');d.setAttribute('aria-label','Игра на весь экран');
  d.innerHTML=`<div class="a2-tx"><b>Играть на весь экран, без панели Safari</b><span>Нажмите ${share} «Поделиться» → «На экран „Домой“» и запускайте KICK 2 с иконки — он откроется как приложение.</span></div><button class="btn sm" type="button">Понятно</button>`;
  d.querySelector('button').onclick=()=>{try{localStorage.setItem('kick2_a2hs','1');}catch(e){}d.remove();};
  document.body.appendChild(d);
})();

// на телефоне 3D рисуется в меньшем разрешении — плавнее и меньше греет телефон
if(MOB.on){const real=window.devicePixelRatio||1;try{Object.defineProperty(window,'devicePixelRatio',{get:()=>Math.min(1.5,real),configurable:true});}catch(e){}}

// первое касание: полный экран и фиксация горизонтальной ориентации (Android)
function mobFull(){
  if(!MOB.on||MOB.fs)return;MOB.fs=true;const el=document.documentElement;
  const go=el.requestFullscreen||el.webkitRequestFullscreen;if(!go)return;
  try{const p=go.call(el,{navigationUI:'hide'});const lock=()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{});}catch(e){}};if(p&&p.then)p.then(lock).catch(()=>{});else lock();}catch(e){}
}
addEventListener('pointerup',mobFull,{once:false,passive:true});

// шапка клуба прячется при прокрутке вниз и возвращается при прокрутке вверх
(function(){let last=scrollY,acc=0;const h=document.documentElement;
  addEventListener('scroll',()=>{const y=scrollY,d=y-last;last=y;
    if(!MOB.on||!document.querySelector('.top')||y<60){acc=0;h.classList.remove('hdr-off');return;}
    acc=(acc>0)===(d>0)?acc+d:d;
    if(acc>24)h.classList.add('hdr-off');else if(acc<-24)h.classList.remove('hdr-off');
  },{passive:true});})();

// матч: один раз прокручиваем к полю, чтобы оно было на экране
const _renderMob=render;
render=function(){_renderMob();if(!MOB.on||UI.view!=='match'||typeof M==='undefined'||!M||M.pm||M.done||M._mob)return;
  if(document.querySelector('.m2d-p')){M._mob=1;setTimeout(mobToPitch,350);}};
function mobToPitch(){const el=document.querySelector('.m2d-p');const bar=document.querySelector('.tabsbar');if(!el)return;
  const off=bar?bar.offsetHeight*(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mz'))||.8):60;/* шапка при прокрутке вниз спрячется, над полем останутся только вкладки */window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+scrollY-off-4),behavior:'smooth'});}

// центр составов: повторное касание выбранного игрока открывает профиль (вместо двойного клика)
if(typeof G!=='undefined'&&G.sqSel){const _sqSelM=G.sqSel;G.sqSel=function(id){if(MOB.on&&typeof SQ!=='undefined'&&SQ.sel===id)return G.openP(id);_sqSelM(id);};}
