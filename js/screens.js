'use strict';
/* ===== KICK: главное меню, создание карьеры, выбор клуба, главная страница карьеры ===== */
const SET=(()=>{const d={speed:1,photos:true,rus:false};try{return Object.assign(d,JSON.parse(localStorage.getItem('brovka-settings')||'{}'));}catch(e){return d;}})();
window.SET=SET;
function saveSet(){try{localStorage.setItem('brovka-settings',JSON.stringify(SET));}catch(e){}}
UI.screen='title';UI.hs='you';UI.saved=null;UI.ns.rus=SET.rus;
const VIEWS=[['home','Главная'],['inbox','Входящие'],['squad','Состав'],['tactics','Тактика'],['fixtures','Календарь'],['comps','Турниры'],['transfers','Трансферы'],['club','Клуб'],['career','Карьера'],['save','Сохранение']];
const stars=rep=>{const v=clamp(Math.round((rep-25)/14*2)/2,.5,5);return `<span class="stars" style="--v:${v/5*100}%" title="${v} из 5" aria-label="${v} из 5">★★★★★</span>`;};
const wCrest=(c,size)=>`<img class="crest" src="${esc(c&&c.crest?c.crest:CREST_FB)}" width="${size}" height="${size}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${CREST_FB}'">`;
const leagueLogoW=(lg,size)=>lg&&lg.logo?`<img class="crest" src="${esc(lg.logo)}" width="${size}" height="${size}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${CREST_FB}'">`:`<span class="trophy" style="width:${size}px;height:${size}px"></span>`;

/* ----- каркас ----- */
function render(){
  const app=document.getElementById('app');
  if(!W){app.innerHTML=`<div class="title"><div class="title-in"><div class="brand"><div class="logo">KI<span>CK</span></div><p class="tag">Футбольный менеджер</p></div><div class="panel" style="max-width:560px"><h2>Нет базы мира</h2><p style="margin-top:8px">Файл <code>data/world.js</code> не найден. Запустите в папке игры <code>python tools/fetch_world.py</code> и дождитесь строки «data/world.js записан».</p></div></div></div>`;return;}
  if(UI.screen!=='game'||!S||!S.user){
    if(UI.screen==='game')UI.screen='title';
    app.innerHTML=UI.screen==='newcareer'?vNewCareer():UI.screen==='pickclub'?vPicker():UI.screen==='settings'?vSettings():UI.screen==='load'?vLoad():UI.screen==='about'?vAbout():vTitle();
    return;
  }
  const ut=userTeam();const uf=userFxToday();const unread=S.inbox.filter(m=>!m.read).length;
  let cbtn;
  if(UI.busy)cbtn=`<button class="btn pri cont" onclick="G.cont()">Стоп</button>`;
  else if(M&&M.run)cbtn=`<button class="btn pri" disabled>Идёт матч</button>`;
  else if(M&&M.done)cbtn=`<button class="btn pri cont" onclick="G.afterMatch()">Продолжить</button>`;
  else if(uf)cbtn=`<button class="btn pri cont" onclick="G.cont()">К матчу</button>`;
  else cbtn=`<button class="btn pri cont" onclick="G.cont()">Продолжить</button>`;
  const needClub={squad:1,tactics:1,fixtures:1,club:1};if(M&&!M.done&&!M.pm)UI.view='match';
  const tabs=[...((uf||M)?[['match','Матч дня']]:[]),...VIEWS];
  app.innerHTML=`<header class="top"><button class="menu-btn" onclick="G.menu()" title="Главное меню" aria-label="Главное меню">☰</button><div class="club">${ut?crest(ut,38):''}<div style="min-width:0"><b>${ut?esc(ut.n):'Без клуба'}</b><small>${ut?esc(S.L[ut.lg].name)+' · ':''}${esc(S.user.name)}</small></div></div>
  <div class="date"><b>${fmtDate(S.d)}</b><span class="hide">сезон ${season()}${windowOpen(S.d)?' · трансферное окно открыто':''}</span></div>${cbtn}</header>
  <nav class="tabsbar" aria-label="Разделы">${tabs.map(([k,l])=>`<button class="${UI.view===k?'on':''}" ${needClub[k]&&!ut?'disabled':''} ${M&&M.run&&k!=='match'?'disabled':''} onclick="G.go('${k}')">${l}${k==='inbox'&&unread?`<span class="badge">${unread}</span>`:''}</button>`).join('')}</nav>
  ${procBar()}<main id="main">${renderView()}</main>`;
}
function renderView(){
  const ut=userTeam();if(['squad','tactics','fixtures','club'].includes(UI.view)&&!ut)UI.view='home';
  switch(UI.view){case 'home':return vHome();case 'inbox':return vInbox();case 'squad':return vSquad();case 'tactics':return vTactics();case 'fixtures':return vFixtures();case 'comps':return vComps();case 'transfers':return vTransfers();case 'club':return vClub();case 'career':return vCareer();case 'save':return vSave();case 'match':return vMatch();}
  return vHome();
}

/* ----- главное меню ----- */
let WALL=null;
function wall(){
  if(!WALL){const top=W.clubs.filter(c=>c.crest&&W.leagues.find(l=>l.id===c.lg&&l.tier===1));const pickd=[];const seed=top.slice().sort((a,b)=>(hash(a.name)%997)-(hash(b.name)%997));for(const c of seed){if(pickd.length>=60)break;pickd.push(c);}WALL=pickd;}
  return WALL.map(c=>`<img src="${esc(c.crest)}" alt="" loading="lazy" onerror="this.remove()">`).join('');
}
function vTitle(){
  const s=UI.saved;const nComps=W.comps.length;
  return `<div class="title"><div class="wall" aria-hidden="true">${wall()}</div>
  <div class="title-in">
   <div class="brand"><div class="logo">KI<span>CK</span></div><p class="tag">Keep Improving Club Knowledge · футбольный менеджер · сезон 2026/27</p></div>
   <div class="title-grid">
    <nav class="menu" aria-label="Главное меню">
     ${s?`<button class="mi mi-pri" onclick="G.load('${esc(s.id)}')"><b>Продолжить карьеру</b><small>${esc(s.name)} · ${esc(s.club)} · сезон ${esc(s.season)}</small></button>`:''}
     <button class="mi ${s?'':'mi-pri'}" onclick="G.scr('newcareer')"><b>Новая карьера</b><small>Выберите страну, дивизион и клуб</small></button>
     <button class="mi" onclick="G.scr('load')"><b>Загрузить карьеру</b><small>${UI.saves&&UI.saves.length?`${UI.saves.length} ${plural(UI.saves.length,'сохранённая карьера','сохранённые карьеры','сохранённых карьер')}`:'Сохранённых карьер пока нет'}</small></button>
     <button class="mi" onclick="G.scr('settings')"><b>Настройки</b><small>Скорость матчей, фото игроков, еврокубки</small></button>
     <button class="mi" onclick="G.scr('about')"><b>Об игре</b><small>Откуда данные и как их обновить</small></button>
     ${/Electron/.test(navigator.userAgent)?`<button class="mi" onclick="G.quit()"><b>Выход из игры</b><small>F11 — оконный режим / весь экран</small></button>`:''}
    </nav>
    <aside class="title-stats">
     <div class="stat"><b>${W.leagues.length}</b><span>лиг и дивизионов</span></div>
     <div class="stat"><b>${W.clubs.length}</b><span>клубов</span></div>
     <div class="stat"><b>${Math.round(W.clubs.reduce((a,c)=>a+c.players.length,0)/1000)} тыс.</b><span>реальных игроков</span></div>
     <div class="stat"><b>${nComps}</b><span>кубков и турниров</span></div>
     <p class="mute" style="font-size:12px;grid-column:1/-1">База от ${esc(W.built)}: составы, фото и эмблемы из Википедии.</p>
    </aside>
   </div>
  </div></div>`;
}
function vSettings(){
  const sw=(k,on,lab,desc)=>`<label class="setrow"><span><b>${lab}</b><small>${desc}</small></span><input type="checkbox" id="set-${k}" ${on?'checked':''} onchange="SET.${k}=this.checked;saveSet()"></label>`;
  return `<div class="title"><div class="title-in narrow"><button class="btn back" onclick="G.scr('title')">‹ Главное меню</button><h1>Настройки</h1>
   <div class="panel grid" style="gap:4px">
    <div class="setrow"><span><b>Скорость матча по умолчанию</b><small>С какой скоростью начинается текстовая трансляция</small></span><div class="row">${[1,2,4].map(s=>`<button class="btn sm ${SET.speed===s?'on':''}" onclick="SET.speed=${s};saveSet();render()">×${s}</button>`).join('')}</div></div>
    <div class="setrow"><span><b>Скорость обработки дней</b><small>Как быстро идёт календарь после «Продолжить»</small></span><div class="row">${[['Медленно',900],['Обычно',450],['Быстро',180],['Мгновенно',0]].map(([l,v])=>`<button class="btn sm ${(SET.dayMs==null?450:SET.dayMs)===v?'on':''}" onclick="SET.dayMs=${v};saveSet();render()">${l}</button>`).join('')}</div></div>
    ${sw('photos',SET.photos,'Фото игроков','Показывать фотографии из Википедии; если выключить — нарисованные портреты')}
    ${sw('rus',SET.rus,'Российские клубы в еврокубках','Значение по умолчанию для новых карьер (в реальности клубы отстранены УЕФА)')}
    <div class="setrow"><span><b>Сохранённые карьеры</b><small>${UI.saves&&UI.saves.length?UI.saves.length+' шт. — загрузить или удалить можно в разделе «Загрузить карьеру»':'Нет сохранений'}</small></span><button class="btn" onclick="G.scr('load')">Открыть</button></div>
   </div></div></div>`;
}
function vAbout(){
  return `<div class="title"><div class="title-in narrow"><button class="btn back" onclick="G.scr('title')">‹ Главное меню</button><h1>Об игре</h1>
   <div class="panel body" style="max-width:none">KICK (Keep Improving Club Knowledge) — футбольный менеджер: вы главный тренер, отвечаете за состав, тактику, трансферы и результат.

У игроков нет общего рейтинга — только 47 характеристик по шкале от 1 до 20. Составы, возраст, позиции, фото и эмблемы взяты из Википедии, Wikidata и Wikimedia Commons; характеристики рассчитываются по уровню клуба, позиции, возрасту и известности игрока.

В мире ${W.leagues.length} лиг и дивизионов, национальные кубки и суперкубки, еврокубки, азиатские, южноамериканские, африканские турниры, клубный чемпионат мира и турниры сборных.

Обновить базу: откройте папку игры и выполните <code>python tools/fetch_world.py</code>, затем начните новую карьеру.</div></div></div>`;
}

/* ----- новая карьера ----- */
function vNewCareer(){
  const ns=UI.ns;const rep=EXPS[ns.exp][1];
  return `<div class="title"><div class="title-in narrow"><button class="btn back" onclick="G.scr('title')">‹ Главное меню</button><h1>Новая карьера</h1>
   <div class="nc">
    <div class="panel grid" style="gap:14px">
     <label class="field">Имя тренера<input id="nsn" value="${esc(ns.name)}" placeholder="Например, Андрей Соколов" oninput="UI.ns.name=this.value"></label>
     <label class="field">Гражданство<select id="nsnat" onchange="UI.ns.nat=this.value;render()">${Object.keys(NATS).sort((a,b)=>natName(a).localeCompare(natName(b),'ru')).map(k=>`<option value="${k}" ${k===ns.nat?'selected':''}>${natName(k)}</option>`).join('')}</select></label>
     <div class="field">Игровой опыт<div class="exp">${EXPS.map((e,i)=>`<button class="btn ${i===ns.exp?'on':''}" onclick="UI.ns.exp=${i};render()">${e[0]}</button>`).join('')}</div></div>
     <div class="field">Строгость руководства<div class="exp">${BOARD.map((b,i)=>`<button class="btn ${(ns.strict==null?2:ns.strict)===i?'on':''}" onclick="UI.ns.strict=${i};render()">${b.n}</button>`).join('')}</div><small class="mute">${BOARD[ns.strict==null?2:ns.strict].d}</small></div>
     <label class="row" style="font-size:13px"><input type="checkbox" id="nsrus" ${ns.rus?'checked':''} onchange="UI.ns.rus=this.checked"> Допустить российские клубы к еврокубкам</label>
    </div>
    <div class="panel mgr">
     <div class="mgr-av">${esc((ns.name||'Тренер').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase())}</div>
     <h2>${esc(ns.name||'Новый тренер')}</h2><p class="mute">${esc(natName(ns.nat))}</p>
     <dl class="kv" style="margin-top:12px"><dt>Репутация</dt><dd>${repLabel(rep)}</dd><dt>Опыт</dt><dd>${EXPS[ns.exp][0]}</dd></dl>
     <p class="mute" style="font-size:12px;margin-top:10px">Чем выше репутация, тем охотнее вас возьмут сильные клубы и тем легче уговорить звёзд перейти к вам.</p>
    </div>
   </div>
   <div class="row" style="justify-content:flex-end"><button class="btn" onclick="G.start(true)">Начать без клуба</button><button class="btn pri" onclick="G.scr('pickclub')">Выбрать клуб ›</button></div>
  </div></div>`;
}
let REPW=null;const repW=c=>{if(!REPW)REPW=clubReps();return REPW.get(c)||40;};
function pickerCountries(){const by={};W.leagues.forEach(l=>{by[l.nat]=Math.max(by[l.nat]||0,l.rep+(l.tier===1?0:-50));});return Object.keys(by).sort((a,b)=>by[b]-by[a]);}
function pickerState(){
  const ns=UI.ns;const cs=pickerCountries();if(!cs.includes(ns.country))ns.country=cs[0];
  const lgs=W.leagues.filter(l=>l.nat===ns.country).sort((a,b)=>a.tier-b.tier);ns.div=Math.min(ns.div,lgs.length-1);const lg=lgs[ns.div];
  const clubs=W.clubs.filter(c=>c.lg===lg.id).sort((a,b)=>repW(b)-repW(a));
  if(!clubs.find(c=>c.name===ns.club))ns.club=clubs[0]&&clubs[0].name;
  return {cs,lgs,lg,clubs,club:clubs.find(c=>c.name===ns.club)};
}
function goalFor(lg,rank,n){if(lg.tier>1)return rank<=3?'Выйти в дивизион выше':rank<=n/3?'Бороться за повышение':rank<=n/2?'Верхняя половина таблицы':'Избежать вылета';
  return rank===1?'Выиграть чемпионат':rank<=2?'Бороться за чемпионство':rank<=4?'Первая четвёрка':rank<=7?'Первая семёрка':rank<=n/2?'Верхняя половина таблицы':rank<=n-4?'Середина таблицы':'Избежать вылета';}
function vPicker(){
  const {cs,lgs,lg,clubs,club}=pickerState();const ns=UI.ns;const ci=cs.indexOf(ns.country);
  const rank=clubs.indexOf(club)+1;const rep=repW(club);const tb=Math.round(Math.pow(rep,3)*300*.3);
  return `<div class="picker">
  <header class="pk-top"><button class="btn back" onclick="G.scr('newcareer')">‹ Назад</button><div class="pk-date"><small>сезон 2026/27</small><b>1 июля 2026 г.</b></div><span></span></header>
  <div class="pk-body">
   <section class="pk-card">
    <div class="pk-country"><button class="arr" onclick="G.pkCountry(-1)" aria-label="Предыдущая страна">‹</button><span>${esc(natName(ns.country))}</span><button class="arr" onclick="G.pkCountry(1)" aria-label="Следующая страна">›</button></div>
    <div class="pk-crest"><button class="arr big" onclick="G.pkClub(-1)" aria-label="Предыдущий клуб">‹</button>${wCrest(club,150)}<button class="arr big" onclick="G.pkClub(1)" aria-label="Следующий клуб">›</button></div>
    <h2 class="pk-name">${esc(club.name)}</h2>
    <div class="pk-stars">${stars(rep)}</div>
    <div class="pk-league">${leagueLogoW(lg,26)}<span>${esc(lg.name)}</span></div>
    <dl class="kv pk-kv"><dt>Статус</dt><dd>${clubStatus(rep)}</dd><dt>Трансферный бюджет</dt><dd>≈ ${money(tb)}</dd><dt>Ожидания совета</dt><dd>${goalFor(lg,rank,clubs.length)}</dd><dt>Игроков из Википедии</dt><dd>${club.players.length||'состав сгенерирован'}</dd></dl>
   </section>
   <section class="pk-table">
    <div class="pk-divs">${lgs.map((l,i)=>`<button class="${i===ns.div?'on':''}" onclick="UI.ns.div=${i};UI.ns.club=null;render()">${leagueLogoW(l,18)}${esc(l.name)}</button>`).join('')}</div>
    <div class="tw"><table class="t pk-t"><thead><tr><th>#</th><th>Клуб</th><th>Уровень</th><th class="r">Бюджет</th><th class="r">Игроков</th></tr></thead><tbody>
     ${clubs.map((c,i)=>{const r=repW(c);return `<tr class="click ${c===club?'me':''}" onclick='UI.ns.club=${JSON.stringify(c.name).replace(/'/g,"&#39;")};render()'><td class="num">${i+1}</td><td><div class="cell">${wCrest(c,24)}<span>${esc(c.name)}</span></div></td><td>${stars(r)}</td><td class="r num">${money(Math.round(Math.pow(r,3)*90))}</td><td class="r num">${c.players.length||'—'}</td></tr>`;}).join('')}
    </tbody></table></div>
   </section>
  </div>
  <footer class="pk-foot"><span class="mute">Стрелки ← → — соседний клуб, ↑ ↓ — страна</span><button class="btn pri" onclick="G.start(false)">Начать карьеру в «${esc(club.name)}»</button></footer>
  </div>`;
}

/* ----- главная страница карьеры ----- */
const KIND={match:'Матч',transfer:'Трансфер',trophy:'Трофей',staff:'Тренеры',season:'Итоги сезона',info:'Новости'};
function newsImg(n,size){
  const p=n.p!=null?S.P[n.p]:null;
  if(p&&p.photo&&SET.photos!==false)return `<img class="nimg" src="${esc(faceOf(p)||p.photo)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${AV_FB}'">`;
  if(n.t&&n.t[0]!=null&&S.T[n.t[0]])return `<div class="ncrest">${crest(S.T[n.t[0]],size)}</div>`;
  if(n.n)return `<div class="ncrest">${ntCrest(n.n,size)}</div>`;
  if(n.c)return `<div class="ncrest">${logo(n.c,size)}</div>`;
  return `<div class="ncrest">${logo('',size)}</div>`;
}
function newsFor(tab){
  const ut=userTeam();
  if(tab==='world')return S.news;
  if(tab[0]==='L'){const L=S.L[+tab.slice(1)];const set=new Set(L.teams);return S.news.filter(n=>n.t.some(x=>set.has(x)));}
  if(!ut)return S.news;const L=S.L[ut.lg];const set=new Set(L.teams);
  const mine=S.news.filter(n=>n.t.includes(ut.id)||n.t.some(x=>set.has(x))||n.k==='trophy');
  return mine.length>=4?mine:S.news;
}
function featured(n){
  const crests=(n.t||[]).filter(x=>x!=null&&S.T[x]).slice(0,2);
  const p=n.p!=null?S.P[n.p]:null;
  return `<article class="feat"><div class="feat-txt"><span class="kind">${KIND[n.k]||'Новости'}</span><h2>${esc(n.txt)}</h2>${n.b?`<p>${esc(n.b)}</p>`:''}<small class="mute">${esc(n.d)}</small></div>
   <div class="feat-art">${p&&p.photo&&SET.photos!==false?`<img class="feat-ph${faceOf(p)?' face':''}" src="${esc(faceOf(p)||p.photo)}" alt="" onerror="this.onerror=null;this.src='${AV_FB}'">`:''}<div class="feat-crests">${crests.map(x=>crest(S.T[x],p&&p.photo?52:84)).join(crests.length===2&&!(p&&p.photo)?'<span class="vs">vs</span>':'')}${!crests.length&&n.n?ntCrest(n.n,84):''}${!crests.length&&!n.n&&n.c?logo(n.c,84):''}</div>${p?`<div class="feat-cap">${esc(p.n)}</div>`:''}</div></article>`;
}
function newsCard(n){return `<article class="ncard">${newsImg(n,44)}<div style="min-width:0"><span class="kind">${KIND[n.k]||'Новости'}</span><h3>${esc(n.txt)}</h3>${n.b?`<p>${esc(n.b.length>140?n.b.slice(0,140)+'…':n.b)}</p>`:''}<small class="mute">${esc(n.d)}</small></div></article>`;}
function nextUserFx(){const t=userTeam();if(!t)return null;let best=null;for(const f of S.F){if(f.hg==null&&!f.nt&&(f.h===t.id||f.a===t.id)&&f.d>=S.d&&(!best||f.d<best.d))best=f;}return best;}
function topFixtures(filter){
  let d=null;for(const f of S.F){if(f.hg==null&&f.d>=S.d&&!f.nt&&(!filter||filter(f))&&(d==null||f.d<d))d=f.d;}
  const last=[];let ld=-1;for(const f of S.F){if(f.hg!=null&&!f.nt&&(!filter||filter(f))&&f.d>ld)ld=f.d;}
  const pick=dd=>S.F.filter(f=>f.d===dd&&!f.nt&&(!filter||filter(f))).sort((a,b)=>(S.T[b.h].rep+S.T[b.a].rep)-(S.T[a.h].rep+S.T[a.a].rep)).slice(0,8);
  return {next:d!=null?{d,list:pick(d)}:null,last:ld>=0?{d:ld,list:pick(ld)}:null};
}
function fxMini(f){const cm=compOfFx(f);return `<div class="fxm"><span class="fxm-c" title="${esc(cm.name)}">${logo(cm.id,16)}</span><span class="fxm-t">${esc(S.T[f.h].n)}</span>${crest(S.T[f.h],18)}<b class="num">${f.hg==null?'–':f.hg+':'+f.ag}</b>${crest(S.T[f.a],18)}<span class="fxm-t">${esc(S.T[f.a].n)}</span></div>`;}
function miniTable(L,around){
  const st=standings(L);const ut=userTeam();let rows=st.map((r,i)=>({...r,pos:i+1}));
  if(around&&ut){const i=rows.findIndex(r=>r.id===ut.id);const from=clamp(i-3,0,Math.max(0,rows.length-8));rows=rows.slice(from,from+8);}
  return `<table class="t mini-t"><tbody>${rows.map(r=>`<tr class="${ut&&r.id===ut.id?'me':''}"><td class="num mute">${r.pos}</td><td><div class="cell">${crest(S.T[r.id],18)}<span>${esc(S.T[r.id].n)}</span></div></td><td class="r num mute">${r.p}</td><td class="r num" style="font-weight:600">${r.pts}</td></tr>`).join('')}</tbody></table>`;
}
function vHome(){
  const ut=userTeam();const tabs=[['you','Для вас'],['world','Мир']];
  const homeNat=ut?ut.nat:'ENG';S.L.filter(L=>L.nat===homeNat).forEach(L=>tabs.push(['L'+L.i,L.name]));
  ['ENG','ESP','ITA','GER','FRA'].filter(n=>n!==homeNat).forEach(n=>{const L=S.L.find(x=>x.nat===n&&x.tier===1);if(L)tabs.push(['L'+L.i,L.name]);});
  if(!tabs.find(t=>t[0]===UI.hs))UI.hs='you';
  const list=newsFor(UI.hs);const fi=list.findIndex((n,i)=>i<6&&n.p!=null&&S.P[n.p]&&S.P[n.p].photo);const feat=list[fi>=0?fi:0];const rest=list.filter(n=>n!==feat).slice(0,10);
  const L=UI.hs[0]==='L'?S.L[+UI.hs.slice(1)]:ut?S.L[ut.lg]:null;
  const filter=UI.hs[0]==='L'?(f=>f.c==='L'+L.i):UI.hs==='you'&&ut?(f=>S.T[f.h].nat===ut.nat||S.T[f.a].nat===ut.nat||!f.c.startsWith('L')):null;
  const tf=topFixtures(filter);const nf=nextUserFx();
  let side='';
  if(UI.hs==='you'&&ut){
    side+=nf?`<section class="panel nextm"><h3>Следующий матч</h3><div class="nm-c">${logo(compOfFx(nf).id,18)}<span>${esc(compOfFx(nf).name)} · ${esc(nf.r)}</span></div><div class="nm-row"><div>${crest(S.T[nf.h],56)}<b>${esc(S.T[nf.h].n)}</b></div><span class="nm-vs">${nf.d===S.d?'Сегодня':fmtShort(nf.d)}</span><div>${crest(S.T[nf.a],56)}<b>${esc(S.T[nf.a].n)}</b></div></div>${nf.d===S.d?`<button class="btn pri" style="width:100%" onclick="G.cont()">К матчу</button>`:''}</section>`:'';
    const c=S.user.conf;side+=`<section class="panel"><h3>Совет директоров</h3><p style="font-size:13px;margin-bottom:8px">${esc(S.user.obj)}</p><div class="confbar"><i style="width:${c}%;background:${c>=60?'var(--good)':c>=35?'var(--warn)':'var(--bad)'}"></i></div><p class="mute" style="font-size:12px;margin-top:6px">Доверие: ${Math.round(c)}%</p></section>`;
  }
  const fxBlock=(x,title)=>x&&x.list.length?`<section class="panel"><h3>${title} · ${fmtShort(x.d)}</h3>${x.list.map(fxMini).join('')}</section>`:'';
  side+=fxBlock(tf.next,'Главные матчи');
  if(tf.last&&(!tf.next||tf.last.d!==tf.next.d))side+=fxBlock(tf.last,'Результаты');
  if(L)side+=`<section class="panel"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3 style="margin:0">${esc(L.name)}</h3><button class="btn sm" onclick="UI.tt='country';UI.tc='${L.nat}';UI.tk='L${L.i}';G.go('comps')">Вся таблица</button></div>${miniTable(L,UI.hs==='you')}</section>`;
  if(UI.hs==='world'){const leaders=S.L.filter(x=>x.tier===1).sort((a,b)=>b.rep-a.rep).slice(0,10).map(x=>{const s=standings(x)[0];return `<div class="fxm"><span class="fxm-c">${logo('L:'+x.key+(x.ng>1?':'+x.grp:''),16)}</span><span class="fxm-t" style="text-align:left">${esc(x.name)}</span>${crest(S.T[s.id],18)}<span class="fxm-t">${esc(S.T[s.id].n)}</span><b class="num">${s.pts}</b></div>`;}).join('');side=`<section class="panel"><h3>Лидеры чемпионатов</h3>${leaders}</section>`+side;}
  return `<div class="subtabs">${tabs.map(([k,l])=>`<button class="${UI.hs===k?'on':''}" onclick="UI.hs='${k}';render()">${esc(l)}</button>`).join('')}</div>
  <div class="home"><div class="home-main">${feat?featured(feat):`<div class="panel empty"><h2>Сезон только начинается</h2><p class="mute">Нажмите «Продолжить», чтобы пойти по календарю. Здесь появятся новости о матчах, трансферах и трофеях.</p></div>`}
   <div class="ngrid">${rest.map(newsCard).join('')}</div></div>
  <aside class="home-side">${side}</aside></div>`;
}

/* ----- действия ----- */
Object.assign(G,{
  async quit(){if(S&&S.user)await save();window.close();},
  async menu(){if(M&&M.run)return;await save();UI.screen='title';UI.saved=await getMeta();render();},
  pkCountry(d){const cs=pickerCountries();const i=cs.indexOf(UI.ns.country);UI.ns.country=cs[(i+d+cs.length)%cs.length];UI.ns.div=0;UI.ns.club=null;render();},
  pkClub(d){const {clubs,club}=pickerState();const i=clubs.indexOf(club);UI.ns.club=clubs[(i+d+clubs.length)%clubs.length].name;render();},
});
document.addEventListener('keydown',e=>{
  if(UI.screen!=='pickclub'||e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
  if(e.key==='ArrowLeft'){G.pkClub(-1);e.preventDefault();}else if(e.key==='ArrowRight'){G.pkClub(1);e.preventDefault();}
  else if(e.key==='ArrowUp'){G.pkCountry(-1);e.preventDefault();}else if(e.key==='ArrowDown'){G.pkCountry(1);e.preventDefault();}
  else if(e.key==='Enter'){G.start(false);}
});
window.saveSet=saveSet;window.SET=SET;
(async()=>{render();UI.saved=await getMeta();if(UI.screen==='title')render();})();
