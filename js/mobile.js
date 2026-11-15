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

// на телефоне 3D рисуется в меньшем разрешении — плавнее и меньше греет телефон
if(MOB.on){const real=window.devicePixelRatio||1;try{Object.defineProperty(window,'devicePixelRatio',{get:()=>Math.min(1.5,real),configurable:true});}catch(e){}}

// первое касание: полный экран и фиксация горизонтальной ориентации (Android)
function mobFull(){
  if(!MOB.on||MOB.fs)return;MOB.fs=true;const el=document.documentElement;
  const go=el.requestFullscreen||el.webkitRequestFullscreen;if(!go)return;
  try{const p=go.call(el,{navigationUI:'hide'});const lock=()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{});}catch(e){}};if(p&&p.then)p.then(lock).catch(()=>{});else lock();}catch(e){}
}
addEventListener('pointerup',mobFull,{once:false,passive:true});

// матч: один раз прокручиваем к полю, чтобы оно было на экране
const _renderMob=render;
render=function(){_renderMob();if(!MOB.on||UI.view!=='match'||typeof M==='undefined'||!M||M.pm||M.done||M._mob)return;
  if(document.querySelector('.m2d-p')){M._mob=1;setTimeout(mobToPitch,350);}};
function mobToPitch(){const el=document.querySelector('.m2d-p');const bar=document.querySelector('.tabsbar');if(!el)return;
  const off=bar?bar.getBoundingClientRect().bottom:60;window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+scrollY-off-4),behavior:'smooth'});}

// центр составов: повторное касание выбранного игрока открывает профиль (вместо двойного клика)
if(typeof G!=='undefined'&&G.sqSel){const _sqSelM=G.sqSel;G.sqSel=function(id){if(MOB.on&&typeof SQ!=='undefined'&&SQ.sel===id)return G.openP(id);_sqSelM(id);};}
