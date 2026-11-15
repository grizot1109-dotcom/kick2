'use strict';
/* ===== KICK 2: главный экран в зелёном стеклянном стиле ===== */

/* ---------- больше данных о карьере в списке сохранений ---------- */
const _saveT=save;
save=async function(){
  await _saveT();if(!S||!S.user||!S.cid)return;
  try{const l=await listSaves();const e=l.find(x=>x.id===S.cid);if(!e)return;
    const ut=userTeam();const p=S.legend?S.P[S.legend.pid]:null;const t=ut||(p&&p.club>=0?S.T[p.club]:null);
    const L=t?S.L[t.lg]:null;
    e.lg=L?L.name:'';e.lgLogo=L?(LOGOS['L:'+L.key]||null):null;
    e.gp=p?p.st.ap:S.user.rec.w+S.user.rec.d+S.user.rec.l;
    e.rep=p?Math.round(ca(p)*5):Math.round(t?t.rep*10:S.user.rep*10);
    e.tr=p?(S.legend.tro.length):S.user.troph.length;e.legend=!!p;
    e.news=S.news.slice(0,3).map(n=>{const tt=(n.t||[]).filter(x=>x!=null&&S.T[x]).slice(0,2).map(x=>S.T[x].crest||null);const pl=n.p!=null&&S.P[n.p]?S.P[n.p].photo||null:null;return {t:n.txt,c:tt,ph:pl};});
    await idbSet('list',l);UI.saves=l;UI.saved=l[0];
  }catch(err){}
};

/* ---------- иконки ---------- */
const IC={
  plus:'<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v9M7.5 12h9"/></svg>',
  star:'<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/></svg>',
  cup:'<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3zm0 4H6v1a2 2 0 0 0 1 1.7zm10 0v2.7A2 2 0 0 0 18 8V7zM6 20h12v1.5H6z"/></svg>',
  gear:'<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M10.3 2h3.4l.5 2.6 1.8.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.8 2.6.5v3.4l-2.6.5-.8 1.8 1.5 2.2-2.4 2.4-2.2-1.5-1.8.8-.5 2.6h-3.4l-.5-2.6-1.8-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.8L2 13.7v-3.4l2.6-.5.8-1.8-1.5-2.2 2.4-2.4 2.2 1.5 1.8-.8zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>',
  pad:'<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M7 6h10a5 5 0 0 1 4.9 6l-1 5a2.5 2.5 0 0 1-4.3 1.2L14 15.5h-4l-2.6 2.7A2.5 2.5 0 0 1 3.1 17l-1-5A5 5 0 0 1 7 6zm0 3v1.5H5.5V12H7v1.5h1.5V12H10v-1.5H8.5V9zm9.5.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zm-2 2.4a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"/></svg>',
  exit:'<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"/><path d="M11 12h10M17 8l4 4-4 4"/></svg>',
  user:'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><circle cx="12" cy="8.5" r="4"/><path d="M4 20c.8-4 4-6 8-6s7.2 2 8 6z"/></svg>',
  out:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5v14M9 12h11M16 8l4 4-4 4"/></svg>'};

/* ---------- мяч ---------- */
const BALL=`<svg viewBox="0 0 200 200" aria-hidden="true"><defs>
 <radialGradient id="kb-w" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#dfe5e0"/><stop offset="1" stop-color="#7d8a81"/></radialGradient>
 <radialGradient id="kb-s" cx="36%" cy="30%" r="74%"><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
 <radialGradient id="kb-g" cx="85%" cy="55%" r="40%"><stop offset="0" stop-color="#3fe26b" stop-opacity=".55"/><stop offset="1" stop-color="#3fe26b" stop-opacity="0"/></radialGradient>
 <clipPath id="kb-c"><circle cx="100" cy="100" r="96"/></clipPath></defs>
 <ellipse cx="104" cy="196" rx="80" ry="7" fill="#000" opacity=".55"/>
 <circle cx="100" cy="100" r="96" fill="url(#kb-w)"/>
 <g clip-path="url(#kb-c)" stroke="#2b332e" stroke-width=".8" stroke-opacity=".5">
  <path d="M100 66 L134 84 L176 58 L152 14 L108 22Z" fill="#27c454"/>
  <path d="M134 84 L126 124 L158 150 L198 116 L184 70 L176 58Z" fill="#0d120f"/>
  <path d="M126 124 L80 128 L68 168 L112 200 L158 150Z" fill="#3fe26b"/>
  <path d="M80 128 L64 88 L20 78 L2 128 L36 166 L68 168Z" fill="#0d120f"/>
  <path d="M64 88 L100 66 L108 22 L62 8 L22 40 L20 78Z" fill="#141a16"/>
  <path d="M152 14 L184 70 L200 40 L190 0Z" fill="#0d120f"/>
  <path d="M22 40 L62 8 L30 0 L0 30Z" fill="#3fe26b"/>
  <path d="M100 66 L134 84 L126 124 L80 128 L64 88Z" fill="#f4f7f4"/>
 </g>
 <text x="98" y="104" text-anchor="middle" font-family="Exo 2,Oswald,sans-serif" font-style="italic" font-weight="900" font-size="25" fill="#0c100d" transform="rotate(-10 98 100)">KICK</text>
 <circle cx="100" cy="100" r="96" fill="url(#kb-s)"/><circle cx="100" cy="100" r="96" fill="url(#kb-g)"/>
 <ellipse cx="66" cy="50" rx="30" ry="16" fill="#fff" opacity=".22" transform="rotate(-28 66 50)"/></svg>`;

/* ---------- верхняя панель и фон для экранов меню ---------- */
const HNAV=[['title','Главное меню'],['load','Карьера'],['settings','Настройки'],['about','Дополнительно']];
function hsTop(){
  const s=UI.saved;const lv=s?1+Math.floor((s.rep||0)/100):1;
  return `<header class="hs-top"><div class="hs-logo">KI<span>CK</span><sup>2</sup></div><div class="hs-sub">Football manager</div>
   <nav class="hs-nav" aria-label="Меню">${HNAV.map(([k,l])=>`<button class="${(UI.screen===k||(k==='load'&&['newcareer','pickclub','legendnew'].includes(UI.screen)))?'on':''}" onclick="G.scr('${k}')">${l}</button>`).join('')}</nav>
   <div class="hs-user"><span class="ua">${IC.user}</span><div><b>${esc(s?s.name:'Пользователь')}</b><small>Уровень ${lv}</small></div>${/Electron/.test(navigator.userAgent)?`<button class="hs-exit" onclick="G.quit()" title="Выход из игры" aria-label="Выход из игры">${IC.out}</button>`:''}</div></header>`;
}
const hsFoot=()=>`<footer class="hs-foot"><div class="hs-logo">KI<span>CK</span></div><div class="tagl">DREAM · MANAGE · WIN</div><span class="ver">v2.0.0</span></footer>`;
const hsBg=(ball)=>`<div class="hs-bg" aria-hidden="true"></div><i class="hs-stripe" aria-hidden="true"></i><i class="hs-stripe s2" aria-hidden="true"></i>${ball?`<div class="hs-ball">${BALL}</div>`:''}`;

/* ---------- главный экран ---------- */
const crestImg=(src,size)=>`<img class="crest" src="${esc(src||CREST_FB)}" width="${size}" height="${size}" alt="" onerror="this.onerror=null;this.src='${CREST_FB}'">`;
vTitle=function(){
  const s=UI.saved;const el=/Electron/.test(navigator.userAgent);
  const mi=(ic,t,sub,fn)=>`<button class="hm" onclick="${fn}"><span class="ic">${ic}</span><span class="tx"><b>${t}</b><small>${sub}</small></span><span class="ch" aria-hidden="true">›</span></button>`;
  const news=s&&s.news&&s.news.length?s.news:null;const ni=Math.min(UI.hsn||0,news?news.length-1:0);const n=news?news[ni]:null;
  return `<div class="hs hs-photo"><div class="stage" id="stage">${hsTop()}
  <div class="hs-main"><div class="hs-menu ${s?'':'nos'} ${el?'':'noexit'}">
   ${s?`<button class="hm big" onclick="G.load('${esc(s.id)}')"><span class="tx"><b>Продолжить карьеру</b><small>${esc(s.name)} · ${esc(s.club)} · сезон ${esc(s.season)}</small></span>${s.crest?crestImg(s.crest,84):''}<span class="ch" aria-hidden="true">›</span></button>`:''}
   ${mi(IC.plus,'Новая карьера','Выберите страну, дивизион и клуб',"G.scr('newcareer')")}
   ${mi(IC.star,'Стань легендой','Карьера за игрока: от дебюта до «Золотого мяча»',"G.scr('legendnew')")}
   ${mi(IC.cup,'Загрузить карьеру',UI.saves&&UI.saves.length?`${UI.saves.length} ${plural(UI.saves.length,'сохранённая карьера','сохранённые карьеры','сохранённых карьер')}`:'Продолжите сохранённую игру',"G.scr('load')")}
   ${mi(IC.gear,'Настройки','Настройте игру под себя',"G.scr('settings')")}
   ${mi(IC.pad,'Об игре','Информация об игре',"G.scr('about')")}
  </div><div></div>
  <aside class="hs-side">
   ${s?`<section class="gcard"><h4>${s.legend?'Карьера игрока':'Ваша карьера'}</h4><div class="cc2">${crestImg(s.crest,72)}<div><b>${esc(s.club.replace(/^Легенда · /,''))}</b><small>${esc(s.lg||'')}</small></div>${s.lgLogo?`<img class="lgl" src="${esc(s.lgLogo)}" alt="" onerror="this.remove()">`:''}</div>
    <div class="cst"><div><b>${s.gp!=null?s.gp:'—'}</b><small>Игр<br>в сезоне</small></div><div><b>${s.rep!=null?s.rep:'—'}</b><small>${s.legend?'Рейтинг<br>игрока':'Клубный<br>рейтинг'}</small></div><div><b>${s.tr!=null?s.tr:'—'}</b><small>Трофеев</small></div></div></section>`
   :`<section class="gcard"><h4>Добро пожаловать</h4><p style="color:#c9d6cd">${W.leagues.length} лиг, ${W.clubs.length} клубов и ${Math.round(W.clubs.reduce((a,c)=>a+c.players.length,0)/1000)} тыс. реальных игроков. Начните новую карьеру тренера или станьте легендой на поле.</p></section>`}
   <section class="gcard news2"><h4>Новости <span class="dot"></span>${news&&news.length>1?`<button class="nx" onclick="UI.hsn=(${ni}+1)%${news.length};render()" aria-label="Следующая новость">›</button>`:''}</h4>
    <div class="nimg2">${n&&n.c&&n.c.length?n.c.map(c=>crestImg(c,64)).join(''):`<span class="hs-logo" style="font-size:42px">KI<span>CK</span></span>`}</div>
    <p>${n?esc(n.t):'Сезон 2026/27 стартует 1 июля. Трансферное окно уже открыто!'}</p>
    ${news&&news.length>1?`<div class="dots">${news.map((_,i)=>`<button class="${i===ni?'on':''}" onclick="UI.hsn=${i};render()" aria-label="Новость ${i+1}"></button>`).join('')}</div>`:''}</section>
  </aside></div>${hsFoot()}</div></div>`;
};
/* сцена 1672×941 масштабируется под экран — кнопки ложатся ровно на фон */
function fitStage(){const st=document.getElementById('stage');if(!st)return;const k=Math.min(innerWidth/1672,innerHeight/941);st.style.setProperty('--k',k);}
window.addEventListener('resize',fitStage);

/* ---------- стеклянный индикатор, плавно переезжающий между кнопками ---------- */
const IND={},INDEL={};
// одна и та же плашка переносится в новую разметку — не мигает и не дрожит при перерисовке
function slideInd(sel,key){
  document.querySelectorAll(sel).forEach((box,bi)=>{
    const k=key+bi;const on=box.querySelector(':scope > button.on');
    if(!on){delete IND[k];return;}
    let ind=INDEL[k];if(!ind){ind=document.createElement('i');ind.className='gind';ind.setAttribute('aria-hidden','true');INDEL[k]=ind;}
    const to={x:on.offsetLeft,y:on.offsetTop,w:on.offsetWidth,h:on.offsetHeight};const from=IND[k];
    const same=from&&from.x===to.x&&from.y===to.y&&from.w===to.w&&from.h===to.h;
    if(ind.parentNode!==box)box.prepend(ind);
    if(same){IND[k]=to;return;}
    const put=r=>{ind.style.transform=`translate(${r.x}px,${r.y}px)`;ind.style.width=r.w+'px';ind.style.height=r.h+'px';};
    if(from&&from.y===to.y){ind.style.transition='none';put(from);void ind.offsetWidth;ind.style.transition='';ind.classList.add('moving');put(to);clearTimeout(ind._t);ind._t=setTimeout(()=>ind.classList.remove('moving'),420);}
    else{ind.style.transition='none';put(to);void ind.offsetWidth;ind.style.transition='';}
    IND[k]=to;
  });
}
let lastView=null;
function postRender(){
  fitStage();
  slideInd('.hs-nav','nav');slideInd('.tabsbar','tabs');slideInd('.subtabs','sub');
  const v=(UI.screen||'')+':'+(UI.view||'');const m=document.getElementById('main')||document.querySelector('.hs-inner');
  if(v!==lastView&&m){m.classList.remove('fadein');void m.offsetWidth;m.classList.add('fadein');}lastView=v;
};

/* ---------- остальные экраны меню — в той же рамке ---------- */
const _renderT=render;
render=function(){
  _renderT();
  if(!(S&&S.user&&UI.screen==='game')&&['newcareer','load','settings','about','legendnew'].includes(UI.screen)){
    const app=document.getElementById('app');const inner=app.innerHTML;
    app.innerHTML=`<div class="hs hs-sub-screen">${hsTop()}<div class="hs-inner">${inner}</div>${hsFoot()}</div>`;
  }
  postRender();
};
postRender();
