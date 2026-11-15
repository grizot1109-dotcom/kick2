'use strict';
/* ===== KICK: интерфейс ===== */
const UI={view:'inbox',msg:null,slot:null,f:{q:'',pos:'',nat:'',age:'',val:'',sort:'val'},modalP:null,neg:null,confirm:null,
  ns:{name:'',nat:'RUS',exp:1,country:'ENG',div:0,club:null,rus:false},subOut:null,subIn:null,tt:'country',tc:null,tk:null,tr:null};
const LOGOS={};if(W)W.leagues.forEach(l=>{if(l.logo)LOGOS['L:'+l.id]=l.logo;});
const CREST_FB='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 3 L59 10 L57 36 C55 50 44 57 32 62 C20 57 9 50 7 36 L5 10 Z" fill="#2a3745" stroke="#8a99ab" stroke-width="2"/></svg>');
const AV_FB='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#223040"/><circle cx="32" cy="26" r="12" fill="#8a99ab"/><path d="M8 64 C10 46 22 42 32 42 C42 42 54 46 56 64Z" fill="#8a99ab"/></svg>');

/* ----- картинки ----- */
function lum(hex){const n=parseInt(hex.slice(1),16);return ((n>>16&255)*.299+(n>>8&255)*.587+(n&255)*.114)/255;}
const SHAPES=['M32 3 L59 10 L57 36 C55 50 44 57 32 62 C20 57 9 50 7 36 L5 10 Z','M32 3 A29 29 0 1 1 31.9 3 Z','M9 4 H55 V33 C55 49 44 57 32 62 C20 57 9 49 9 33 Z'];
let uid=0;
function crest(t,size){
  if(!t)return `<span style="width:${size}px;height:${size}px;display:block;flex:none"></span>`;
  if(t.crest)return `<img class="crest" src="${esc(t.crest)}" width="${size}" height="${size}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${CREST_FB}'">`;
  const h=hash(t.n);const sh=SHAPES[h%3];const pat=(h>>>4)%5;const id='cr'+(++uid);const c1=t.c1,c2=t.c2;let pt='';
  if(pat===1)pt=[10,26,42].map(x=>`<rect x="${x}" width="8" height="64" fill="${c2}"/>`).join('');else if(pat===2)pt=`<rect x="32" width="32" height="64" fill="${c2}"/>`;else if(pat===3)pt=`<rect y="40" width="64" height="24" fill="${c2}"/>`;else if(pat===4)pt=`<polygon points="0,14 14,0 64,50 50,64" fill="${c2}"/>`;
  const plate=pat===0?c1:(lum(c1)<lum(c2)?c1:c2);const tc=lum(plate)>.6?'#141414':'#fff';const fs=t.s.length>3?13:t.s.length===3?16:19;
  return `<svg class="crest" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><defs><clipPath id="${id}"><path d="${sh}"/></clipPath></defs><g clip-path="url(#${id})"><rect width="64" height="64" fill="${c1}"/>${pt}<rect x="11" y="23" width="42" height="19" rx="3" fill="${plate}" opacity=".92"/></g><path d="${sh}" fill="none" stroke="${c2}" stroke-width="3"/><text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Oswald,Arial Narrow,sans-serif" font-weight="600" font-size="${fs}" fill="${tc}">${esc(t.s)}</text></svg>`;
}
const ntCrest=(code,size)=>{const n=S.N[code];return n&&n.crest?`<img class="crest" src="${esc(n.crest)}" width="${size}" height="${size}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${CREST_FB}'">`:`<span class="flagbox" style="width:${size}px;height:${Math.round(size*.7)}px">${esc(code)}</span>`;};
const sideCrest=(x,nt,size)=>nt?ntCrest(x,size):crest(S.T[x],size);
const sideName=(x,nt)=>nt?((S.N[x]||{}).name||x):(S.T[x]?S.T[x].n:'—');
function logo(id,size){const src=compLogo(id)||LOGOS[id]||LOGOS[(id||'').split(':').slice(0,2).join(':')];return src?`<img class="crest" src="${esc(src)}" width="${size}" height="${size}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${CREST_FB}'">`:`<span class="trophy" style="width:${size}px;height:${size}px"></span>`;}
const SKIN=['#f2cfb1','#e3b28f','#c99169','#a06a45','#74482b','#4c2e1c'];const HAIR=['#17110d','#3a2a1e','#6b4a2e','#a77a45','#d8b56c','#2b2b2b'];
// единообразные фото (обрезка по лицу, tools/fix_photos.py); если нет — исходное фото
function faceOf(p){const F=window.KICK_FACES;if(!F||!p.photo)return null;const m=/Q\d+/.exec(p.photo);return m&&F[m[0]]?'img/faces/'+m[0]+'.jpg':null;}
function avatar(p,size){
  if(p.photo&&(!window.SET||SET.photos!==false))return `<img class="av${faceOf(p)?' face':''}" src="${esc(faceOf(p)||p.photo)}" width="${size}" height="${size}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${AV_FB}'">`;
  const h=hash(p.n+p.id);const t=p.club>=0?S.T[p.club]:null;const c1=t?t.c1:'#55606c',c2=t?t.c2:'#2a3440';const pool=poolOf(p.nat);
  let sk;if(pool==='SEN')sk=3+h%3;else if(pool==='BRA')sk=h%5;else if(pool==='ARA')sk=1+h%3;else if(['FRA','ENG','NED','POR'].includes(pool)&&h%5===0)sk=3+h%3;else sk=h%3;
  const hc=sk>=3?HAIR[h%2===0?0:5]:HAIR[(h>>>3)%6];const st=(h>>>6)%4;
  const hair=st===0?`<path d="M20 26 C20 13 44 13 44 26 C42 19 22 19 20 26 Z" fill="${hc}"/>`:st===1?`<path d="M20 25 C19 11 45 11 44 25 L44 21 C40 15 24 15 20 21 Z" fill="${hc}"/>`:st===2?`<path d="M21 23 C23 15 41 15 43 23 C38 19 26 19 21 23 Z" fill="${hc}" opacity=".7"/>`:`<path d="M19 32 C16 12 48 12 45 32 L43 24 C40 17 24 17 21 24 Z" fill="${hc}"/>`;
  const beard=(h>>>9)%4===0?`<path d="M23 31 C24 41 40 41 41 31 C38 37 26 37 23 31 Z" fill="${hc}" opacity=".85"/>`:'';
  return `<svg class="av" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><rect width="64" height="64" fill="#223040"/><path d="M6 64 C8 48 20 44 32 44 C44 44 56 48 58 64 Z" fill="${c1}"/><path d="M26 44 L32 52 L38 44 Z" fill="${c2}"/><rect x="28" y="36" width="8" height="9" fill="${SKIN[sk]}"/><ellipse cx="32" cy="28" rx="11.5" ry="13.5" fill="${SKIN[sk]}"/>${hair}${beard}<circle cx="27.5" cy="28" r="1.3" fill="#1a1a1a"/><circle cx="36.5" cy="28" r="1.3" fill="#1a1a1a"/></svg>`;
}

/* ----- мелочи ----- */
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>el.hidden=true,3400);}
const acls=v=>v<=5?'a1':v<=10?'a2':v<=15?'a3':'a4';
function condBar(c){const col=c>=85?'var(--good)':c>=70?'var(--warn)':'var(--bad)';return `<span class="bar" title="Состояние ${Math.round(c)}%"><i style="width:${Math.round(c)}%;background:${col}"></i></span>`;}
const morTxt=m=>m>80?['Отличная','good']:m>62?['Хорошая','good']:m>42?['Нормальная','']:m>25?['Плохая','warn']:['Очень плохая','bad'];
const formAvg=p=>p.form.length?(p.form.reduce((a,b)=>a+b,0)/p.form.length).toFixed(2):'—';
const avgR=p=>p.st.ap?(p.st.r/p.st.ap).toFixed(2):'—';
function teamAvgCa(t){const xi=lineupOf(t);let s=0,n=0;xi.forEach(id=>{if(S.P[id]){s+=ca(S.P[id]);n++;}});return n?s/n:10;}
function staffView(p){
  const ut=userTeam();const c=ca(p);
  if(ut&&p.club===ut.id){const sorted=ut.pl.map(id=>S.P[id]).sort((a,b)=>ca(b)-ca(a));const r=sorted.indexOf(p);let s=r<3?'Ключевой игрок команды':r<11?'Игрок основного состава':r<17?'Игрок ротации':'Игрок запаса';if(p.age<=21&&p.pa-c>2)s+='. Большой потенциал роста';return s;}
  if(!ut)return c>=16?'Игрок мирового уровня':c>=14?'Сильный игрок топ-лиги':c>=12?'Крепкий профессионал':c>=10?'Средний уровень':'Скромный уровень';
  const d=c-teamAvgCa(ut);let s=d>1.2?'Значительно усилит команду':d>.3?'Усилит основной состав':d>-.8?'Уровень основного состава':d>-2?'Уровень ротации':'Не усилит состав';if(p.age<=21&&p.pa-c>2.5)s+='. Высокий потенциал';return s;
}
function statusPills(p){let s='';if(p.inj>0)s+=`<span class="pill inj">Травма: ${injTxt(p.inj)}</span> `;if(p.sus>0)s+=`<span class="pill inj">Дисквал.</span> `;if(p.listed)s+=`<span class="pill acc">На трансфере</span> `;if(unhappy(p))s+=`<span class="pill inj">Конфликт, хочет уйти</span> `;return s;}
const compOfFx=f=>f.c[0]==='L'?{name:S.L[+f.c.slice(1)].name,id:'L:'+S.L[+f.c.slice(1)].key}:{name:(S.C[f.c]||{}).name||f.c,id:(S.C[f.c]||{}).id};
const resTxt=f=>f.hg==null?'—':`${f.hg}:${f.ag}${f.x&&!f.pen?' д.в.':''}${f.pen?` (пен. ${f.pen[0]}:${f.pen[1]})`:''}`;

/* ----- каркас ----- */
function render(){
  const app=document.getElementById('app');
  if(!W){app.innerHTML=`<div class="start"><div class="logo">KI<span>CK</span></div><div class="panel"><h2>Нет базы мира</h2><p style="margin-top:8px">Файл <code>data/world.js</code> не найден. Запустите в папке игры команду <code>python tools/fetch_world.py</code> и дождитесь строки «data/world.js записан».</p></div></div>`;return;}
  if(!S||!S.user){app.innerHTML=renderStart();return;}
  const ut=userTeam();const uf=userFxToday();
  const unread=S.inbox.filter(m=>!m.read).length;
  let cbtn;
  if(M&&M.run)cbtn=`<button class="btn pri" disabled>Идёт матч</button>`;
  else if(M&&M.done)cbtn=`<button class="btn pri" onclick="G.afterMatch()">Продолжить</button>`;
  else if(uf)cbtn=`<button class="btn pri" onclick="G.cont()">К матчу</button>`;
  else cbtn=`<button class="btn pri" onclick="G.cont()">Продолжить</button>`;
  const nav=[['inbox','Входящие',unread],['squad','Состав'],['tactics','Тактика'],['fixtures','Календарь'],['comps','Турниры'],['transfers','Трансферы'],['club','Клуб'],['career','Карьера'],['save','Сохранение']];
  const needClub={squad:1,tactics:1,fixtures:1,club:1};
  if(M&&!M.done&&!M.pm)UI.view='match';
  app.innerHTML=`<header class="top"><div class="club">${ut?crest(ut,38):''}<div style="min-width:0"><b>${ut?esc(ut.n):'Без клуба'}</b><small>${ut?esc(S.L[ut.lg].name)+' · ':''}${esc(S.user.name)}</small></div></div>
  <div class="date"><b>${fmtDate(S.d)}</b><span class="hide">сезон ${season()}${windowOpen(S.d)?' · трансферное окно открыто':''}</span></div>${cbtn}</header>
  <div class="shell"><nav class="rail">${(uf||M)?`<button class="${UI.view==='match'?'on':''}" onclick="G.go('match')">Матч дня</button>`:''}${nav.map(([k,l,b])=>`<button class="${UI.view===k?'on':''}" ${needClub[k]&&!ut?'disabled':''} ${M&&M.run?'disabled':''} onclick="G.go('${k}')">${l}${b?`<span class="badge">${b}</span>`:''}</button>`).join('')}</nav>
  <main id="main">${renderView()}</main></div>`;
}
function renderView(){
  const ut=userTeam();if(['squad','tactics','fixtures','club'].includes(UI.view)&&!ut)UI.view='career';
  switch(UI.view){case 'inbox':return vInbox();case 'squad':return vSquad();case 'tactics':return vTactics();case 'fixtures':return vFixtures();case 'comps':return vComps();case 'transfers':return vTransfers();case 'club':return vClub();case 'career':return vCareer();case 'save':return vSave();case 'match':return vMatch();}
  return vInbox();
}

/* ----- старт ----- */
function renderStart(){
  const ns=UI.ns;const lgs=W.leagues.filter(l=>l.nat===ns.country);const cs=[...new Set(W.leagues.map(l=>l.nat))];
  const lg=lgs[Math.min(ns.div,lgs.length-1)];const clubs=W.clubs.filter(c=>c.lg===lg.id);
  return `<div class="start">
  <div><div class="logo">KI<span>CK</span></div><p class="mute" style="margin-top:8px;max-width:70ch">Карьера главного тренера: ${W.leagues.length} лиг и дивизионов в ${cs.length} странах, ${W.clubs.length} клубов. Национальные кубки и суперкубки, еврокубки, азиатские, южноамериканские и африканские турниры, клубный чемпионат мира, турниры сборных. Составы, фото и эмблемы — из Википедии (база от ${esc(W.built)}).</p></div>
  <div id="savedslot"></div>
  <div class="panel grid" style="gap:14px"><h2>Новая карьера</h2>
   <div class="grid g3">
    <label class="field">Имя тренера<input id="nsn" value="${esc(ns.name)}" placeholder="Например, Андрей Соколов" onchange="UI.ns.name=this.value"></label>
    <label class="field">Гражданство<select id="nsnat" onchange="UI.ns.nat=this.value">${Object.keys(NATS).sort((a,b)=>natName(a).localeCompare(natName(b),'ru')).map(k=>`<option value="${k}" ${k===ns.nat?'selected':''}>${natName(k)}</option>`).join('')}</select></label>
    <label class="field">Игровой опыт<select id="nsexp" onchange="UI.ns.exp=+this.value">${EXPS.map((e,i)=>`<option value="${i}" ${i===ns.exp?'selected':''}>${e[0]}</option>`).join('')}</select></label>
   </div>
   <label class="row" style="font-size:13px"><input type="checkbox" id="nsrus" ${ns.rus?'checked':''} onchange="UI.ns.rus=this.checked"> Допустить российские клубы к еврокубкам (в реальности они отстранены УЕФА)</label>
   <div class="tabs">${cs.map(c=>`<button class="btn sm ${c===ns.country?'on':''}" onclick="UI.ns.country='${c}';UI.ns.div=0;UI.ns.club=null;render()">${natName(c)}</button>`).join('')}</div>
   <div class="tabs">${lgs.map((l,i)=>`<button class="btn sm ${l===lg?'on':''}" onclick="UI.ns.div=${i};UI.ns.club=null;render()">${esc(l.name)}</button>`).join('')}</div>
   <div class="clubs">${clubs.map((c,i)=>`<button class="cc ${ns.club===c.name?'on':''}" onclick="UI.ns.club=${JSON.stringify(c.name).replace(/"/g,'&quot;')};render()">${c.crest?`<img class="crest" src="${esc(c.crest)}" width="40" height="40" alt="" loading="lazy" onerror="this.onerror=null;this.src='${CREST_FB}'">`:`<img class="crest" src="${CREST_FB}" width="40" height="40" alt="">`}<div><b>${esc(c.name)}</b><small>${c.players.length?c.players.length+' игроков из Википедии':'состав сгенерирован'}</small></div></button>`).join('')}</div>
   <div class="row"><button class="btn pri" ${ns.club==null?'disabled':''} onclick="G.start(false)">Начать карьеру${ns.club!=null?' в '+esc(ns.club):''}</button><button class="btn" onclick="G.start(true)">Начать без клуба</button><span class="mute" style="font-size:12px">Создание мира занимает 10–30 секунд.</span></div>
  </div>
  <div class="panel"><h3>Загрузить карьеру из файла</h3><input type="file" accept=".json,application/json" onchange="G.importSave(this)"></div></div>`;
}

/* ----- входящие ----- */
function vInbox(){
  const list=S.inbox;if(!list.length)return `<div class="head"><h1>Входящие</h1></div><div class="panel mute">Сообщений нет.</div>`;
  if(UI.msg==null||!list.find(m=>m.id===UI.msg))UI.msg=list[0].id;const m=list.find(x=>x.id===UI.msg);m.read=true;
  let act='';
  if(m.type==='bid'&&!m.done){const p=S.P[m.data.p];act=`<div class="row" style="margin-top:14px"><button class="btn pri" onclick="G.bid(${m.id},true)">Принять ${money(m.data.fee)}</button><button class="btn" onclick="G.bid(${m.id},false)">Отклонить</button>${(m.data.cnt||0)<2?`<button class="btn" onclick="G.bidCounter(${m.id})">Запросить больше</button>`:''}${p?`<button class="btn" onclick="G.openP(${p.id})">Профиль игрока</button>`:''}</div>`;}
  if(m.type==='job'&&!m.done)act=`<div class="row" style="margin-top:14px"><button class="btn pri" onclick="G.job(${m.id},true)">Принять предложение</button><button class="btn" onclick="G.job(${m.id},false)">Отказаться</button></div>`;
  if(m.type==='deal'&&m.data&&S.P[m.data.p])act=`<div class="row" style="margin-top:14px"><button class="btn pri" onclick="G.openP(${m.data.p})">Открыть переговоры</button></div>`;
  if(m.done&&m.res)act=`<p class="mute" style="margin-top:14px">${esc(m.res)}</p>`;
  return `<div class="head"><h1>Входящие</h1><button class="btn sm" onclick="G.readAll()">Отметить всё прочитанным</button></div>
  <div class="msg"><div class="panel mlist" style="padding:0">${list.map(x=>`<button class="${x.id===UI.msg?'on':''} ${x.read?'':'unr'}" onclick="UI.msg=${x.id};render()"><b>${esc(x.title)}</b><small>${esc(x.from)} · ${esc(x.date)}</small></button>`).join('')}</div>
  <div class="panel"><small class="mute">${esc(m.from)} · ${esc(m.date)}</small><h2 style="margin:6px 0 12px">${esc(m.title)}</h2><div class="body">${esc(m.body)}</div>${act}</div></div>`;
}

/* ----- состав и тактика ----- */
function vSquad(){
  const t=userTeam();const pl=t.pl.map(id=>S.P[id]).sort((a,b)=>POSL.indexOf(a.pos)-POSL.indexOf(b.pos)||ca(b)-ca(a));
  return `<div class="head"><div><h1>Состав</h1><p class="mute">${pl.length} игроков · зарплаты ${money(wageBill(t))} в неделю</p></div><button class="btn" onclick="G.go('tactics')">Выбрать стартовый состав</button></div>
  <div class="panel tw" style="padding:6px"><table class="t"><thead><tr><th>Игрок</th><th>Поз.</th><th class="r">Возр.</th><th>Гр.</th><th>Сост.</th><th>Мораль</th><th class="r">Форма</th><th class="r">Игры</th><th class="r">Голы</th><th class="r">Стоимость</th><th class="r">Зарплата</th><th class="r">Контракт</th><th></th></tr></thead><tbody>${pl.map(p=>{const [mt,mc]=morTxt(p.mor);return `<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,28)}<span>${esc(p.n)}</span></div></td><td><span class="pos">${PR[p.pos]}</span>${p.alt.length?' <span class="mute" style="font-size:11px">'+p.alt.map(x=>PR[x]).join(' ')+'</span>':''}</td><td class="r num">${p.age}</td><td class="mute" title="${esc(natName(p.nat))}">${natCode(p.nat)}</td><td>${condBar(p.cond)}</td><td class="${mc}">${mt}</td><td class="r num">${formAvg(p)}</td><td class="r num">${p.st.ap}</td><td class="r num">${p.st.g}</td><td class="r num">${money(value(p))}</td><td class="r num">${money(p.wage)}</td><td class="r num">${p.ce}</td><td>${statusPills(p)}${t.xi&&t.xi.includes(p.id)?'<span class="pill ok">Основа</span>':''}</td></tr>`;}).join('')}</tbody></table></div>`;
}
const ROWG={GK:['G',91],DL:['D',73],DC:['D',75],DR:['D',73],DM:['DM',59],ML:['M',43],MC:['M',45],MR:['M',43],AML:['AM',25],AMC:['AM',27],AMR:['AM',25],ST:['S',9]};
function slotXY(slots){
  const groups={};slots.forEach((p,i)=>{(groups[ROWG[p][0]]=groups[ROWG[p][0]]||[]).push(i);});const xy=[];
  for(const g in groups){const ids=groups[g];const cen=ids.filter(i=>!/L$|R$/.test(slots[i]));const wide=ids.length>cen.length;
    ids.forEach(i=>{const p=slots[i];if(p.endsWith('L'))xy[i]=[12,ROWG[p][1]];if(p.endsWith('R'))xy[i]=[88,ROWG[p][1]];});
    const k=cen.length;const span=wide?(k>=3?36:k===2?28:0):(k>=3?52:k===2?36:0);cen.forEach((i,j)=>{xy[i]=[k===1?50:50-span/2+span*j/(k-1),ROWG[slots[i]][1]];});}
  return xy;
}
const PITCH_SVG=`<svg class="lines" viewBox="0 0 68 96" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="rgba(230,240,235,.22)" stroke-width=".4"><rect x="2" y="2" width="64" height="92"/><line x1="2" y1="48" x2="66" y2="48"/><circle cx="34" cy="48" r="8"/><rect x="16" y="2" width="36" height="14"/><rect x="16" y="80" width="36" height="14"/><rect x="26" y="2" width="16" height="5"/><rect x="26" y="89" width="16" height="5"/></g></svg>`;
function pitchHTML(xi,slots,selIdx,fn){const xy=slotXY(slots);return `<div class="pitch">${PITCH_SVG}${slots.map((s,i)=>{const p=S.P[xi[i]];const [x,y]=xy[i];return `<button class="slot ${selIdx===i?'sel':''} ${p?'':'empty'}" style="left:${x}%;top:${y}%" ${fn?`onclick="${fn}(${i})"`:''}>${p?avatar(p,30):''}<span class="chip">${p?esc(lastName(p.n)):'Пусто'}</span><span class="pos">${PR[s]}</span></button>`;}).join('')}</div>`;}
function vTactics(){
  const t=userTeam();validateXI(t);const slots=FORM[t.tac.f];const sel=UI.slot;const pl=t.pl.map(id=>S.P[id]);let list;
  if(sel!=null){const pos=slots[sel];const keys=ROLE[POS_ROLE[pos]].slice().sort((a,b)=>b[1]-a[1]).slice(0,4);const sorted=pl.slice().sort((a,b)=>slotVal(b,pos)-slotVal(a,pos));
    list=`<h3>Кандидаты на позицию ${PR[pos]}</h3><div class="tw"><table class="t"><thead><tr><th>Игрок</th><th>Знание позиции</th>${keys.map(k=>`<th class="r" title="${AL[k[0]]}">${AL[k[0]].slice(0,6)}.</th>`).join('')}<th>Сост.</th><th></th></tr></thead><tbody>${sorted.map(p=>{const [fl,fc]=famLabel(fam(p,pos));const inXI=t.xi.indexOf(p.id);const bl=!avail(p);return `<tr class="${bl?'':'click'}" ${bl?'':`onclick="G.assign(${p.id})"`}><td><div class="cell">${avatar(p,24)}<span>${esc(p.n)}</span> <span class="pos">${PR[p.pos]}</span></div></td><td class="${fc}">${fl}</td>${keys.map(k=>`<td class="r num ${acls(p.a[k[0]])}">${p.a[k[0]]}</td>`).join('')}<td>${condBar(p.cond)}</td><td>${statusPills(p)}${inXI>=0?`<span class="pill ok">${PR[slots[inXI]]}</span>`:''}</td></tr>`;}).join('')}</tbody></table></div>`;}
  else{const bench=benchOf(t,t.xi);list=`<h3>Скамейка запасных</h3><p class="mute" style="margin-bottom:8px">Нажмите на позицию на поле, чтобы выбрать игрока.</p><div class="tw"><table class="t"><tbody>${bench.map(id=>{const p=S.P[id];return `<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,24)}<span>${esc(p.n)}</span></div></td><td><span class="pos">${PR[p.pos]}</span></td><td>${condBar(p.cond)}</td></tr>`;}).join('')}</tbody></table></div>`;}
  const sel3=(k,lab)=>`<label class="field">${lab}<select id="tc-${k}" onchange="G.tac('${k}',+this.value)">${LVL3[k].map((x,i)=>`<option value="${i}" ${t.tac[k]===i?'selected':''}>${x}</option>`).join('')}</select></label>`;
  return `<div class="head"><div><h1>Тактика</h1><p class="mute">Расстановка ${t.tac.f}</p></div><div class="row"><button class="btn" onclick="G.auto()">Автосостав</button>${sel!=null?`<button class="btn" onclick="UI.slot=null;render()">Снять выбор</button>`:''}</div></div>
  <div class="grid g2" style="align-items:start"><div class="panel grid" style="gap:12px"><div class="tabs">${FKEYS.map(f=>`<button class="btn sm ${t.tac.f===f?'on':''}" onclick="G.form('${f}')">${f}</button>`).join('')}</div>${pitchHTML(t.xi,slots,sel,'G.pickSlot')}
   <div class="grid g3" style="gap:10px"><label class="field">Менталитет<select id="tc-m" onchange="G.tac('m',+this.value)">${MENT.map((x,i)=>`<option value="${i}" ${t.tac.m===i?'selected':''}>${x}</option>`).join('')}</select></label>${sel3('pr','Прессинг')}${sel3('te','Темп')}${sel3('wi','Ширина атаки')}
   <label class="field">Тренировки<select id="tc-tr" onchange="S.user.train=this.value;toast('Фокус тренировок изменён')">${Object.entries(TRAIN).map(([k,v])=>`<option value="${k}" ${S.user.train===k?'selected':''}>${v}</option>`).join('')}</select></label></div>
   <p class="mute" style="font-size:12px">Высокий прессинг и темп сильнее утомляют игроков. В плотном календаре с кубками и еврокубками меняйте состав, следя за состоянием игроков.</p></div><div class="panel">${list}</div></div>`;
}

/* ----- календарь ----- */
function vFixtures(){
  const t=userTeam();const list=S.F.filter(f=>!f.nt&&(f.h===t.id||f.a===t.id)).sort((a,b)=>a.d-b.d);
  const rows=list.map(f=>{const home=f.h===t.id;const o=S.T[home?f.a:f.h];const cm=compOfFx(f);
    let cls='';if(f.hg!=null){const gf=home?f.hg:f.ag,ga=home?f.ag:f.hg;let out=gf>ga?1:gf<ga?-1:0;if(f.pen)out=(home?f.pen[0]>f.pen[1]:f.pen[1]>f.pen[0])?1:-1;cls=out>0?'good':out<0?'bad':'warn';}
    return `<tr class="${f.d===S.d?'me':''}"><td class="num mute">${fmtShort(f.d)}</td><td><div class="cell">${logo(cm.id,20)}<span>${esc(cm.name)}</span></div></td><td class="mute">${esc(f.r)}</td><td class="mute">${f.neu?'Нейтр.':home?'Дома':'В гостях'}</td><td><div class="cell">${crest(o,22)}<span>${esc(o.n)}</span></div></td><td class="r num ${cls}" style="font-weight:600">${resTxt(f)}</td></tr>`;}).join('');
  return `<div class="head"><div><h1>Календарь</h1><p class="mute">Сезон ${season()} · все турниры. Пары следующих раундов кубков появляются после жеребьёвки.</p></div></div><div class="panel tw" style="padding:6px"><table class="t"><thead><tr><th>Дата</th><th>Турнир</th><th>Стадия</th><th></th><th>Соперник</th><th class="r">Счёт</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ----- турниры ----- */
function compList(){
  const ut=userTeam();const out={country:{},intl:[],nt:[]};
  S.L.forEach(L=>{(out.country[L.nat]=out.country[L.nat]||[]).push({k:'L'+L.i,name:L.name,id:'L:'+L.key+(L.ng>1?':'+L.grp:''),tier:L.tier});});
  Object.values(S.C).forEach(c=>{if(c.nt)out.nt.push({k:c.k,name:c.name,id:c.id});else if(c.nat)(out.country[c.nat]=out.country[c.nat]||[]).push({k:c.k,name:c.name,id:c.id,tier:9});else out.intl.push({k:c.k,name:c.name,id:c.id});});
  return out;
}
function vComps(){
  const cl=compList();const ut=userTeam();
  if(!UI.tc)UI.tc=ut?ut.nat:Object.keys(cl.country)[0];
  const tab=UI.tt;let items=tab==='country'?(cl.country[UI.tc]||[]):tab==='intl'?cl.intl:cl.nt;
  if(!UI.tk||!items.find(x=>x.k===UI.tk))UI.tk=items[0]&&items[0].k;
  const nats=Object.keys(cl.country).sort((a,b)=>natName(a).localeCompare(natName(b),'ru'));
  return `<div class="head"><h1>Турниры</h1></div>
  <div class="tabs"><button class="btn sm ${tab==='country'?'on':''}" onclick="UI.tt='country';UI.tk=null;render()">Страны</button><button class="btn sm ${tab==='intl'?'on':''}" onclick="UI.tt='intl';UI.tk=null;render()">Международные клубные</button><button class="btn sm ${tab==='nt'?'on':''}" onclick="UI.tt='nt';UI.tk=null;render()">Сборные</button><button class="btn sm ${tab==='hist'?'on':''}" onclick="UI.tt='hist';render()">Зал славы</button></div>
  ${tab==='country'?`<label class="field" style="max-width:280px">Страна<select id="cs-nat" onchange="UI.tc=this.value;UI.tk=null;render()">${nats.map(n=>`<option value="${n}" ${n===UI.tc?'selected':''}>${natName(n)}</option>`).join('')}</select></label>`:''}
  ${tab==='hist'?vHall():`<div class="tabs">${items.map(x=>`<button class="btn sm ${x.k===UI.tk?'on':''}" onclick="UI.tk='${x.k}';UI.tr=null;render()"><span class="cell" style="gap:6px">${logo(x.id,16)}${esc(x.name)}</span></button>`).join('')||'<p class="mute">В этом сезоне турниров нет.</p>'}</div>
  ${UI.tk?vComp(UI.tk):''}`}`;
}
function scorersHTML(sc,n){const list=Object.entries(sc||{}).filter(([id])=>S.P[id]).sort((a,b)=>b[1]-a[1]).slice(0,n||10);
  return list.length?`<table class="t"><tbody>${list.map(([id,g],i)=>{const p=S.P[id];return `<tr class="click" onclick="G.openP(${p.id})"><td class="num mute">${i+1}</td><td><div class="cell">${avatar(p,22)}<span>${esc(p.n)}</span></div></td><td class="mute">${p.club>=0?esc(S.T[p.club].n):''}</td><td class="r num" style="font-weight:600">${g}</td></tr>`;}).join('')}</tbody></table>`:'<p class="mute">Голов пока нет.</p>';}
function tableHTML(rows,nt,zones,n){
  const ut=userTeam();
  return `<div class="tw"><table class="t"><thead><tr><th>#</th><th>Команда</th><th class="r">И</th><th class="r">В</th><th class="r">Н</th><th class="r">П</th><th class="r">М</th><th class="r">О</th>${rows[0]&&rows[0].fm!=null?'<th>Форма</th>':''}</tr></thead><tbody>${rows.map((x,i)=>`<tr class="${!nt&&ut&&x.id===ut.id?'me':''} ${zones?zones(i,n):''}"><td class="num">${i+1}</td><td><div class="cell">${sideCrest(x.id,nt,20)}<span>${esc(sideName(x.id,nt))}</span></div></td><td class="r num">${x.p}</td><td class="r num">${x.w}</td><td class="r num">${x.d}</td><td class="r num">${x.l}</td><td class="r num">${x.gf}:${x.ga}</td><td class="r num" style="font-weight:600">${x.pts}</td>${x.fm!=null?`<td class="num" style="font-size:11px;letter-spacing:.1em">${[...x.fm].map(c=>`<span class="${c==='В'?'good':c==='П'?'bad':'warn'}">${c}</span>`).join('')}</td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function fxRow(f){const nt=f.nt;return `<tr><td class="num mute">${fmtShort(f.d)}</td><td><div class="cell" style="justify-content:flex-end"><span>${esc(sideName(f.h,nt))}</span>${sideCrest(f.h,nt,18)}</div></td><td class="num" style="text-align:center;font-weight:600;white-space:nowrap">${resTxt(f)}</td><td><div class="cell">${sideCrest(f.a,nt,18)}<span>${esc(sideName(f.a,nt))}</span></div></td></tr>`;}
function histHTML(id,nt){const h=S.hist[id];if(!h||!h.length)return '';return `<div class="panel"><h3>Победители</h3><table class="t"><tbody>${h.map(x=>`<tr><td class="num">${x.s}</td><td><div class="cell">${sideCrest(x.w,x.nt||nt,20)}<span>${esc(sideName(x.w,x.nt||nt))}</span></div></td><td class="mute">${x.ru!=null?'финалист/2-е: '+esc(sideName(x.ru,x.nt||nt)):''}${x.sc?' · бомбардир: '+esc(x.sc[0])+' ('+x.sc[1]+')':''}</td></tr>`).join('')}</tbody></table></div>`;}
function vComp(k){
  if(k[0]==='L'){
    const L=S.L[+k.slice(1)];const st=standings(L);const n=st.length;const up=L.tier>1?Math.ceil(((UPDOWN[L.nat]||[])[L.tier-2]||3)/L.ng):0;const hasLower=S.L.some(x=>x.nat===L.nat&&x.tier===L.tier+1);const down=hasLower?Math.ceil(((UPDOWN[L.nat]||[])[L.tier-1]||3)):0;
    const zones=(i)=>i<up?'z1':(L.tier===1&&i<4)?'z1':i>=n-down?'z3':'';
    const lastR=(()=>{let r=null;S.F.forEach(f=>{if(f.c===k&&f.hg!=null&&(!r||f.d>r))r=f.d;});return r;})();
    const nextR=(()=>{let r=null;S.F.forEach(f=>{if(f.c===k&&f.hg==null&&(r==null||f.d<r))r=f.d;});return r;})();
    const showD=UI.tr!=null?UI.tr:(lastR!=null?lastR:nextR);const fx=S.F.filter(f=>f.c===k&&f.d===showD);
    const days=[...new Set(S.F.filter(f=>f.c===k).map(f=>f.d))].sort((a,b)=>a-b);
    const hid='L:'+L.key+(L.ng>1?':'+L.grp:'');
    return `<div class="row" style="gap:12px">${logo(hid,44)}<div><h2>${esc(L.name)}</h2><p class="mute">${natName(L.nat)} · ${L.tier}-й уровень · ${n} команд${L.tier>1?` · повышение: ${up}`:''}${down?` · вылет: ${down}`:''}</p></div></div>
    <div class="grid g2" style="align-items:start;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))"><div class="panel" style="padding:6px">${tableHTML(st,false,zones,n)}<p class="mute" style="font-size:12px;padding:8px">Синяя метка — повышение${L.tier===1?' и еврокубковая зона':''}, красная — вылет.</p></div>
    <div class="grid"><div class="panel"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3 style="margin:0">Матчи</h3><select id="lr-day" onchange="UI.tr=+this.value;render()">${days.map((d,i)=>`<option value="${d}" ${d===showD?'selected':''}>${i+1}-й тур · ${fmtShort(d)}</option>`).join('')}</select></div><table class="t"><tbody>${fx.map(fxRow).join('')}</tbody></table></div>
    <div class="panel"><h3>Бомбардиры</h3>${scorersHTML(L.sc)}</div>${histHTML(hid)}</div></div>`;
  }
  const c=S.C[k];if(!c)return '';const nt=!!c.nt;
  let body='';
  c.stages.forEach((st,si)=>{
    if(st.t==='ko'){body=`<div class="panel"><h3>${esc(st.name)}</h3><table class="t"><tbody>${st.ties.map(t=>{const fs=t.f.map(i=>S.F[i]);return fs.map((f,j)=>`<tr class="${t.w!=null&&j===fs.length-1?'':''}">${fxRow(f).slice(4,-5)}<td class="mute" style="font-size:12px">${j===fs.length-1&&t.w!=null?'проходит: '+esc(sideName(t.w,nt)):fs.length>1?(j+1)+'-й матч':''}</td></tr>`).join('');}).join('')}</tbody></table></div>`+body;}
    else if(st.t==='grp'){body=`<div class="panel"><h3>${esc(st.name)}</h3><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))">${st.groups.map((g,gi)=>`<div><p class="mute" style="font-size:12px;margin-bottom:4px">Группа ${String.fromCharCode(65+gi)}</p>${tableHTML(groupTable(c,st,gi),nt)}</div>`).join('')}</div></div>`+body;}
    else if(st.t==='swiss'){body=`<div class="panel" style="padding:6px"><h3 style="padding:8px">${esc(st.name)}</h3>${(st.regions||[null]).map((r,ri_)=>`${st.regions?`<p class="mute" style="padding:0 8px">${ri_===0?'Запад':'Восток'}</p>`:''}${tableHTML(swissTable(st,ri_),false,(i)=>i<8?'z1':i<24&&!st.regions?'':'z3')}`).join('')}<p class="mute" style="font-size:12px;padding:8px">${st.regions?'Первая восьмёрка выходит в 1/8 финала.':'1–8 — сразу в 1/8 финала, 9–24 — в плей-офф, 25–36 выбывают.'}</p></div>`+body;}
  });
  return `<div class="row" style="gap:12px">${logo(c.id,48)}<div><h2>${esc(c.name)}</h2><p class="mute">${c.done?`Победитель: ${esc(sideName(c.w,nt))}`:`${c.teams.length} участников · сезон ${season()}`}</p></div></div>
  ${c.done?`<div class="panel row" style="gap:12px">${sideCrest(c.w,nt,48)}<div><h3>Обладатель трофея</h3><b style="font-size:18px">${esc(sideName(c.w,nt))}</b></div></div>`:''}
  ${body}<div class="grid g2" style="align-items:start"><div class="panel"><h3>Бомбардиры</h3>${scorersHTML(c.sc)}</div>${histHTML(c.id,nt)}</div>`;
}
function vHall(){
  const ids=Object.keys(S.hist);if(!ids.length)return '<div class="panel mute">Турниры этого сезона ещё не завершены. Здесь появятся все победители.</div>';
  return `<div class="grid g3">${ids.map(id=>{const h=S.hist[id][0];const name=id.startsWith('L:')?(S.L.find(L=>'L:'+L.key+(L.ng>1?':'+L.grp:'')===id)||{}).name||id:compName(id);return `<div class="panel row" style="gap:10px;align-items:flex-start">${logo(id,40)}<div style="min-width:0"><b>${esc(name)}</b><p class="mute" style="font-size:12px">${h.s}: ${esc(sideName(h.w,h.nt))}</p><p class="mute" style="font-size:12px">Всего розыгрышей: ${S.hist[id].length}</p></div></div>`;}).join('')}</div>`;
}

/* ----- трансферы ----- */
function vTransfers(){
  const ut=userTeam();const f=UI.f;const avg=ut?teamAvgCa(ut):0;
  let res=Object.values(S.P).filter(p=>!ut||p.club!==ut.id);
  if(f.q){const q=f.q.toLowerCase();res=res.filter(p=>p.n.toLowerCase().includes(q)||(p.club>=0&&S.T[p.club].n.toLowerCase().includes(q)));}
  if(f.pos)res=res.filter(p=>p.pos===f.pos||p.alt.includes(f.pos));
  if(f.nat==='fa')res=res.filter(p=>p.club<0);else if(f.nat)res=res.filter(p=>p.club>=0&&S.T[p.club].nat===f.nat);
  if(f.age)res=res.filter(p=>p.age<=+f.age);if(f.val)res=res.filter(p=>value(p)<=+f.val*1e6);
  const sk=f.sort;
  if(sk==='val')res.sort((a,b)=>value(b)-value(a));else if(sk==='age')res.sort((a,b)=>a.age-b.age);else if(sk==='name')res.sort((a,b)=>a.n.localeCompare(b.n,'ru'));else if(sk==='fit'&&ut)res.sort((a,b)=>Math.abs(ca(a)-avg-.6)-Math.abs(ca(b)-avg-.6));else if(A[sk]!=null)res.sort((a,b)=>b.a[A[sk]]-a.a[A[sk]]);
  const total=res.length;res=res.slice(0,60);const short=S.short.map(id=>S.P[id]).filter(Boolean);
  const keyCols=keyColsK;
  const row=p=>`<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,28)}<span>${esc(p.n)}</span></div></td><td><span class="pos">${PR[p.pos]}</span></td><td class="r num">${p.age}</td><td class="mute">${natCode(p.nat)}</td><td><div class="cell">${p.club>=0?crest(S.T[p.club],18)+'<span>'+esc(S.T[p.club].n)+'</span>':'<span class="acc">Свободный агент</span>'}</div></td><td style="font-size:12px">${keyCols(p)}</td><td class="r num">${money(value(p))}</td><td class="mute" style="font-size:12px">${esc(staffView(p))}</td></tr>`;
  const head=`<thead><tr><th>Игрок</th><th>Поз.</th><th class="r">Возр.</th><th>Гр.</th><th>Клуб</th><th>Ключевые характеристики</th><th class="r">Стоимость</th><th>Мнение штаба</th></tr></thead>`;
  const nats=countries().sort((a,b)=>natName(a).localeCompare(natName(b),'ru'));
  return `<div class="head"><div><h1>Трансферы</h1><p class="mute">${windowOpen(S.d)?'<span class="good">Трансферное окно открыто</span>':'Окно закрыто — доступны только свободные агенты'}${ut?` · бюджет ${money(ut.tb)} · зарплаты ${money(wageBill(ut))} из ${money(ut.wb)} в неделю`:''}</p></div></div>
  <div class="panel grid" style="gap:10px"><div class="grid g3" style="gap:10px;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))">
   <label class="field">Имя или клуб<input id="f-q" value="${esc(f.q)}" onchange="G.sf('q',this.value)" placeholder="Поиск"></label>
   <label class="field">Позиция<select id="f-pos" onchange="G.sf('pos',this.value)"><option value="">Любая</option>${POSL.map(p=>`<option value="${p}" ${f.pos===p?'selected':''}>${PR[p]}</option>`).join('')}</select></label>
   <label class="field">Страна клуба<select id="f-nat" onchange="G.sf('nat',this.value)"><option value="">Все</option><option value="fa" ${f.nat==='fa'?'selected':''}>Свободные агенты</option>${nats.map(n=>`<option value="${n}" ${f.nat===n?'selected':''}>${natName(n)}</option>`).join('')}</select></label>
   <label class="field">Возраст до<input id="f-age" type="number" min="15" max="40" value="${esc(f.age)}" onchange="G.sf('age',this.value)"></label>
   <label class="field">Стоимость до, млн €<input id="f-val" type="number" min="0" value="${esc(f.val)}" onchange="G.sf('val',this.value)"></label>
   <label class="field">Сортировка<select id="f-sort" onchange="G.sf('sort',this.value)"><option value="val" ${sk==='val'?'selected':''}>По стоимости</option>${ut?`<option value="fit" ${sk==='fit'?'selected':''}>Подходят уровню команды</option>`:''}<option value="age" ${sk==='age'?'selected':''}>По возрасту</option><option value="name" ${sk==='name'?'selected':''}>По имени</option><optgroup label="По характеристике">${AK.map((k,i)=>`<option value="${k}" ${sk===k?'selected':''}>${AL[i]}</option>`).join('')}</optgroup></select></label>
  </div><p class="mute" style="font-size:12px">Найдено ${total}${total>60?', показаны первые 60':''}.</p></div>
  ${short.length?`<div class="panel tw" style="padding:6px"><h3 style="padding:8px">Список наблюдения</h3><table class="t">${head}<tbody>${short.map(row).join('')}</tbody></table></div>`:''}
  <div class="panel tw" style="padding:6px"><table class="t">${head}<tbody>${res.map(row).join('')}</tbody></table></div>
  <div class="panel"><h3>Новости</h3>${S.news.length?S.news.slice(0,25).map(n=>`<p style="padding:5px 0;border-bottom:1px solid #1f2a36;font-size:13px"><span class="mute num">${esc(n.d)}</span> · ${esc(n.txt)}</p>`).join(''):'<p class="mute">Пока тихо.</p>'}</div>`;
}

/* ----- клуб и карьера ----- */
function trophyCabinet(tr){
  if(!tr.length)return '<p class="mute">Трофеев пока нет.</p>';const g={};tr.forEach(x=>{(g[x.id]=g[x.id]||{id:x.id,name:x.name,s:[]}).s.push(x.s);});
  return `<div class="grid g3">${Object.values(g).map(x=>`<div class="row" style="gap:10px;align-items:flex-start">${logo(x.id,44)}<div style="min-width:0"><b>${esc(x.name||compName(x.id))}</b> <span class="acc num">×${x.s.length}</span><p class="mute" style="font-size:12px">${x.s.join(', ')}</p></div></div>`).join('')}</div>`;
}
function vClub(){
  const t=userTeam();const L=S.L[t.lg];const st=standings(L);const pos=st.findIndex(r=>r.id===t.id)+1;const c=S.user.conf;const cc=c>=60?'var(--good)':c>=35?'var(--warn)':'var(--bad)';const bill=wageBill(t);
  const comps=Object.values(S.C).filter(x=>!x.nt&&x.teams.includes(t.id));
  return `<div class="head"><div class="row" style="gap:14px">${crest(t,64)}<div><h1>${esc(t.n)}</h1><p class="mute">${esc(L.name)} · ${clubStatus(t.rep)}</p></div></div></div>
  <div class="grid g2" style="align-items:start">
   <div class="panel"><h3>Совет директоров</h3><p style="margin-bottom:8px">Задача в чемпионате: <b>${esc(S.user.obj)}</b></p><p class="mute" style="margin-bottom:10px">Сейчас: ${st[pos-1].p?pos+'-е место':'сезон не начался'}</p>
    <div class="row" style="justify-content:space-between;margin-bottom:4px"><span>Доверие совета</span><span class="num">${Math.round(c)}%</span></div><div class="confbar"><i style="width:${c}%;background:${cc}"></i></div></div>
   <div class="panel"><h3>Финансы</h3><dl class="kv"><dt>Баланс</dt><dd class="${t.bal<0?'bad':''}">${money(t.bal)}</dd><dt>Трансферный бюджет</dt><dd>${money(t.tb)}</dd><dt>Бюджет зарплат</dt><dd>${money(t.wb)} / нед.</dd><dt>Фонд зарплат сейчас</dt><dd class="${bill>t.wb?'bad':''}">${money(bill)} / нед.</dd><dt>Доход клуба</dt><dd>${money(t.inc)} / нед.</dd></dl><p class="mute" style="font-size:12px;margin-top:10px">Призовые за кубки и еврокубки зачисляются на баланс; 70% выручки от продаж идёт в трансферный бюджет.</p></div>
   <div class="panel"><h3>Турниры сезона</h3>${[{id:'L:'+L.key+(L.ng>1?':'+L.grp:''),name:L.name,k:'L'+L.i},...comps.map(x=>({id:x.id,name:x.name,k:x.k}))].map(x=>`<button class="cc" style="margin-bottom:6px;width:100%" onclick="UI.tt='${x.k[0]==='L'||S.C[x.k]&&S.C[x.k].nat?'country':'intl'}';UI.tc='${t.nat}';UI.tk='${x.k}';G.go('comps')">${logo(x.id,32)}<div><b>${esc(x.name)}</b><small>${x.k[0]==='L'?pos+'-е место':S.C[x.k].done?(S.C[x.k].w===t.id?'Победа!':'Выбыли'):(S.C[x.k].wait||[]).includes(t.id)?'Вступает в турнир позже':S.C[x.k].stages[S.C[x.k].st].name}</small></div></button>`).join('')}</div>
   <div class="panel"><h3>Музей трофеев</h3>${trophyCabinet(t.tr)}</div>
  </div>`;
}
function vCareer(){
  const u=S.user;const ut=userTeam();const r=u.tot;const vac=S.vac.map(v=>S.T[v.t]).filter(t=>!ut||t.id!==ut.id);const applied=new Set(S.apps.map(a=>a.t));
  return `<div class="head"><div><h1>${esc(u.name)}</h1><p class="mute">${natName(u.nat)} · ${ut?'главный тренер '+esc(ut.n):'без клуба'}</p></div></div>
  <div class="grid g2" style="align-items:start">
   <div class="panel"><h3>Профиль тренера</h3><dl class="kv"><dt>Репутация</dt><dd>${repLabel(u.rep)}</dd><dt>Игровой опыт</dt><dd>${EXPS[u.exp][0]}</dd><dt>Матчей в карьере</dt><dd>${r.w+r.d+r.l}</dd><dt>Победы / ничьи / поражения</dt><dd class="num">${r.w} / ${r.d} / ${r.l}</dd><dt>Процент побед</dt><dd>${r.w+r.d+r.l?Math.round(r.w*100/(r.w+r.d+r.l))+'%':'—'}</dd><dt>Трофеи</dt><dd>${u.troph.length}</dd></dl>
    <div class="confbar" style="margin-top:12px" title="Репутация"><i style="width:${u.rep}%;background:var(--accent)"></i></div>
    ${ut?`<div class="row" style="margin-top:14px">${UI.confirm==='resign'?`<span>Уйти из ${esc(ut.n)}?</span><button class="btn bad" onclick="G.resign()">Да, уйти в отставку</button><button class="btn" onclick="UI.confirm=null;render()">Отмена</button>`:`<button class="btn bad" onclick="UI.confirm='resign';render()">Уйти в отставку</button>`}</div>`:''}</div>
   <div class="panel"><h3>Вакансии</h3>${vac.length?`<div class="tw"><table class="t"><tbody>${vac.map(t=>`<tr><td><div class="cell">${crest(t,22)}<span>${esc(t.n)}</span></div></td><td class="mute">${esc(S.L[t.lg].name)}</td><td class="mute">${clubStatus(t.rep)}</td><td class="r">${applied.has(t.id)?'<span class="pill">Заявка подана</span>':`<button class="btn sm" onclick="G.apply(${t.id})">Подать заявку</button>`}</td></tr>`).join('')}</tbody></table></div>`:'<p class="mute">Сейчас открытых вакансий нет.</p>'}<p class="mute" style="font-size:12px;margin-top:8px">Ответ на заявку приходит через неделю.</p></div>
  </div>
  <div class="panel"><h3>Трофеи тренера</h3>${trophyCabinet(u.troph.map(x=>({id:x.id,name:x.name,s:x.s+' · '+x.club})))}</div>
  <div class="panel tw"><h3>История карьеры</h3>${u.hist.length?`<table class="t"><thead><tr><th>Сезон</th><th>Клуб</th><th>Лига</th><th class="r">Место</th><th class="r">В</th><th class="r">Н</th><th class="r">П</th><th></th></tr></thead><tbody>${u.hist.map(h=>`<tr><td class="num">${h.s}</td><td><div class="cell">${crest(S.T[h.tid],20)}<span>${esc(h.club)}</span></div></td><td class="mute">${esc(h.lg)}</td><td class="r num">${h.pos}</td><td class="r num">${h.w}</td><td class="r num">${h.d}</td><td class="r num">${h.l}</td><td>${h.note?`<span class="pill ${['Чемпион','Повышение'].includes(h.note)?'acc':''}">${esc(h.note)}</span>`:''}</td></tr>`).join('')}</tbody></table>`:'<p class="mute">Завершённых сезонов пока нет.</p>'}</div>`;
}
function vSave(){
  return `<div class="head"><h1>Сохранение</h1></div><div class="grid g2" style="align-items:start"><div class="panel grid" style="gap:10px"><h3>Карьера</h3><p class="mute">Игра сохраняется в браузере автоматически. Для надёжности сохраняйте карьеру в файл.</p>
   <div class="row"><button class="btn pri" onclick="G.exportSave()">Скачать файл сохранения</button></div>
   <label class="field">Загрузить карьеру из файла<input type="file" accept=".json,application/json" onchange="G.importSave(this)"></label>
   <div class="row"><button class="btn" onclick="G.newGame()">Сохранить и выйти в главное меню</button></div><p class="mute" style="font-size:12px">Карьер может быть несколько: все они — в главном меню, раздел «Загрузить карьеру».</p></div>
  <div class="panel"><h3>База мира</h3><p class="mute" style="font-size:13px">База собрана ${esc(W.built)}: ${W.leagues.length} лиг, ${W.clubs.length} клубов. Обновить составы, фото и эмблемы: <code>python tools/fetch_world.py</code> в папке игры, затем начать новую карьеру.</p></div></div>`;
}

/* ----- матч ----- */
function vMatch(){
  if(!M){const f=userFxToday();if(f)prepMatch(f);else{UI.view='inbox';return vInbox();}}
  const h=S.T[M.h.t],a=S.T[M.a.t];const cm=compOfFx(M.f);const us=M.h.user?M.h:M.a;const them=M.h.user?M.a:M.h;
  const [ah,aa]=aggregate(M.f);
  const sub=M.pm?`${esc(cm.name)} · ${esc(M.f.r)}`:M.done?'Матч окончен':M.min>120?'120+':M.min>90&&!M.et?'90+'+(M.min-90)+'′':M.min+'′';
  const score=`<div class="panel score"><div class="side">${crest(h,48)}<b>${esc(h.n)}</b></div><div class="res">${M.pm?'—':M.hg+' : '+M.ag}<small>${sub}</small>${M.f.leg===2?`<small class="mute">по сумме ${(M.pm?0:M.hg)+ah}:${(M.pm?0:M.ag)+aa}</small>`:''}${M.pen?`<small>пенальти ${M.pen[0]}:${M.pen[1]}</small>`:''}</div><div class="side r"><b>${esc(a.n)}</b>${crest(a,48)}</div></div>`;
  if(M.pm){
    const lu=sd=>`<table class="t"><tbody>${sd.xi.map((id,i)=>{const p=S.P[id];return p?`<tr class="click" onclick="G.openP(${p.id})"><td><span class="pos">${PR[sd.slots[i]]}</span></td><td><div class="cell">${avatar(p,24)}<span>${esc(p.n)}</span></div></td><td>${condBar(p.cond)}</td></tr>`:'';}).join('')}</tbody></table>`;
    const ts=sideStr(them),os=sideStr(us);
    return `<div class="row" style="gap:10px">${logo(cm.id,32)}<b>${esc(cm.name)}</b><span class="mute">${esc(M.f.r)}${M.f.neu?' · нейтральное поле':''}</span></div>${score}
    <div class="row"><button class="btn pri" onclick="G.kick()">Начать матч</button><button class="btn" onclick="M=null;G.go('tactics')">Тактика</button></div>
    ${matchMgmt(us)}<div class="panel"><h3>${esc(S.T[them.t].n)} · ${S.T[them.t].tac.f}</h3>${lu(them)}<p class="mute" style="margin-top:10px;font-size:13px">Отчёт скаутов: ${ts.att>os.def+.6?'атака соперника опаснее нашей обороны.':ts.att<os.def-.6?'наша оборона должна справиться с их атакой.':'силы в атаке и обороне примерно равны.'} ${ts.mid>os.mid+.5?'Соперник сильнее в центре поля.':ts.mid<os.mid-.5?'В центре поля преимущество у нас.':''} ${ts.apace>os.dpace+2?'У соперника быстрые нападающие — высокая линия обороны рискованна.':''}</p></div>`;
  }
  const st=(lab,x,y,fmt)=>{const tot=(x+y)||1;return `<div class="statrow"><span class="num">${fmt?fmt(x):x}</span><span class="lab">${lab}</span><span class="num">${fmt?fmt(y):y}</span><div class="sbar"><i style="width:${x/tot*100}%;background:var(--accent)"></i><i style="width:${y/tot*100}%;background:var(--mute)"></i></div></div>`;};
  const poss=M.min?Math.round(M.poss/M.min*100):50;
  const stats=`<div class="panel"><h3>Статистика</h3>${st('Владение, %',poss,100-poss)}${st('Удары',M.h.st.sh,M.a.st.sh)}${st('В створ',M.h.st.sot,M.a.st.sot)}${st('xG',M.h.st.xg,M.a.st.xg,v=>v.toFixed(2))}${st('Жёлтые',M.h.st.yc,M.a.st.yc)}</div>`;
  const prog=`<div class="prog"><i style="width:${Math.min(100,M.min/(M.et?120:90)*100)}%"></i></div>`;
  const feed=`<div class="panel feed">${M.ev.length?M.ev.map(e=>`<div class="ev ${e.k}"><span class="m">${e.m}′</span><span class="t">${esc(e.txt)}</span></div>`).join(''):'<p class="mute">Команды выходят на поле.</p>'}</div>`;
  if(M.done){
    const rt=sd=>`<table class="t"><tbody>${sd.played.map(id=>S.P[id]).filter(Boolean).sort((x,y)=>sd.rat[y.id]-sd.rat[x.id]).map(p=>`<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,22)}<span>${esc(p.n)}</span></div></td><td class="mute" style="font-size:12px">${sd.g.filter(x=>x===p.id).length?'Голы: '+sd.g.filter(x=>x===p.id).length:''}${sd.as.includes(p.id)?' Пас: '+sd.as.filter(x=>x===p.id).length:''}${sd.rc.includes(p.id)?' Удалён':''}</td><td class="r num ${sd.rat[p.id]>=7.5?'good':sd.rat[p.id]<6.2?'bad':''}" style="font-weight:600">${sd.rat[p.id].toFixed(1)}</td></tr>`).join('')}</tbody></table>`;
    const all=[...M.h.played.map(id=>[id,M.h.rat[id]]),...M.a.played.map(id=>[id,M.a.rat[id]])].sort((x,y)=>y[1]-x[1]);const mvp=S.P[all[0][0]];
    return `${score}${prog}<div class="panel row" style="gap:12px">${avatar(mvp,44)}<div><h3>Игрок матча</h3><b>${esc(mvp.n)}</b> <span class="mute">· ${esc(S.T[mvp.club]?S.T[mvp.club].n:'')} · оценка ${all[0][1].toFixed(1)}</span></div></div>
    <div class="grid g2" style="align-items:start"><div class="panel"><h3>Оценки: ${esc(h.n)}</h3>${rt(M.h)}</div><div class="panel"><h3>Оценки: ${esc(a.n)}</h3>${rt(M.a)}</div></div>
    <div class="grid g2" style="align-items:start">${stats}${feed}</div><div class="row"><button class="btn pri" onclick="G.afterMatch()">Продолжить</button></div>`;
  }
  const controls=`<div class="panel row" style="justify-content:space-between">${M.run?`<button class="btn pri" onclick="G.pause()">Пауза</button>`:`<button class="btn pri" onclick="G.play()">${M.min===0?'Начать':'Продолжить матч'}</button>`}<div class="row">${[1,2,4].map(s=>`<button class="btn sm ${M.speed===s?'on':''}" onclick="G.speed(${s})">×${s}</button>`).join('')}<button class="btn sm" onclick="G.instant()">До конца матча</button></div></div>`;
  let mgmt=matchMgmt(us);
  return `${score}${prog}${controls}${mgmt}<div class="grid g2" style="align-items:start">${feed}${stats}</div>`;
}

/* ----- профиль игрока ----- */
function renderModal(){
  const box=document.getElementById('mbox');const md=document.getElementById('modal');
  if(UI.modalP==null){md.hidden=true;return;}const p=S.P[UI.modalP];if(!p){UI.modalP=null;md.hidden=true;return;}
  md.hidden=false;const t=p.club>=0?S.T[p.club]:null;const ut=userTeam();const mine=ut&&p.club===ut.id;
  const cols=p.pos==='GK'?[['Вратарские',36,47],['Ментальные',14,28],['Физические',28,36]]:[['Технические',0,14],['Ментальные',14,28],['Физические',28,36]];
  const acc=knowAcc(p);const mineOrKnown=acc>=.6;const rep=(S.reps||[]).find(r=>r.p===p.id);
  const know=acc>=.95?'':`<p class="mute" style="font-size:12px">${rep?`Отчёт скаута ${esc(rep.sn)} (${esc(rep.d)}): сейчас ${potStars(rep.ca)}, потенциал ${potStars(rep.pa)}, оценка <span class="grade g${rep.rec}">${rep.rec}</span>`:'Характеристики известны примерно — показан диапазон. Отправьте скаута в страну игрока, чтобы узнать точнее.'}</p>`;
  const trend={};(p.chg||[]).forEach(([i,d,at])=>{if(S.abs-at<=60)trend[i]=(trend[i]||0)+d;});
  const arrow=i=>trend[i]>0?'<i class="tr up" title="Растёт">▲</i>':trend[i]<0?'<i class="tr dn" title="Падает">▼</i>':'';
  const attrs=cols.map(([n,a,b])=>`<div><h3>${n}</h3>${AL.slice(a,b).map((l,j)=>{const i=a+j;return `<div class="ar"><span>${l}</span><b class="${acls(aMid(p,i))}">${mineOrKnown?arrow(i):''}${aTxt(p,i)}</b></div>`;}).join('')}</div>`).join('');
  const pf=perfOf(p);const dyn=pf==null?'Мало игровой практики для оценки формы.':pf>=1?'Отличная форма — прогрессирует быстрее.':pf>=.3?'Хорошая форма.':pf>-.5?'Стабильная игра.':pf>-1?'Играет ниже своего уровня.':'Затяжной спад: характеристики могут снижаться.';
  const mini=[['ST'],['AML','AMC','AMR'],['ML','MC','MR'],['DM'],['DL','DC','DR'],['GK']].map(r=>`<div class="r">${r.map(ps=>{const f=fam(p,ps);return `<i class="${f>=1?'f1':f>=.94?'f2':f>=.82?'f3':''}">${PR[ps]}</i>`;}).join('')}</div>`).join('');
  const [mt,mc]=morTxt(p.mor);const sh=S.short.includes(p.id);let actions='';
  if(mine)actions=`<button class="btn" onclick="G.neg('renew')">Продлить контракт</button><button class="btn" onclick="G.list(${p.id})">${p.listed?'Снять с трансфера':'Выставить на трансфер'}</button>`+(UI.confirm==='rel'?`<span>Расторгнуть контракт за ${money(relCost(p))}?</span><button class="btn bad" onclick="G.release(${p.id})">Да, расторгнуть</button><button class="btn" onclick="UI.confirm=null;renderModal()">Отмена</button>`:`<button class="btn bad" onclick="UI.confirm='rel';renderModal()">Расторгнуть контракт</button>`);
  else if(ut)actions=`<button class="btn pri" onclick="G.neg('${p.club<0?'free':'buy'}')">${p.club<0?'Предложить контракт':'Сделать предложение'}</button><button class="btn" onclick="G.short(${p.id})">${sh?'Убрать из списка наблюдения':'В список наблюдения'}</button>`;
  const neg=negHTML(p);
  box.innerHTML=`<button class="btn sm x" onclick="G.closeP()" aria-label="Закрыть">✕</button>
  <div class="phead">${avatar(p,96)}<div style="min-width:0"><h1>${esc(p.n)}</h1><p class="mute" style="margin-top:4px">${[PR[p.pos],...p.alt.map(x=>PR[x])].join(', ')} · ${p.age} ${plural(p.age,'год','года','лет')} · ${esc(natName(p.nat))} · рост ${p.h} см · ${p.ft} нога</p><div class="row" style="margin-top:8px">${t?crest(t,24)+`<span>${esc(t.n)}</span> <span class="mute">· ${esc(S.L[t.lg].name)}</span>`:'<span class="acc">Свободный агент</span>'} ${statusPills(p)}</div></div></div>
  <p style="font-size:13px"><span class="mute">Мнение штаба:</span> ${esc(staffView(p))}${p.arch?` <span class="mute">· Тип:</span> ${esc(p.arch)}`:''}<br><span class="mute">Динамика:</span> ${dyn}</p>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:10px"><div class="panel"><h3>Стоимость</h3><span class="big">${money(value(p))}</span></div><div class="panel"><h3>Зарплата</h3><span class="big">${money(p.wage)}</span><small class="mute"> / нед.</small></div><div class="panel"><h3>Контракт до</h3><span class="big">${t?'лета '+p.ce:'—'}</span></div><div class="panel"><h3>Состояние</h3><span class="big">${Math.round(p.cond)}%</span></div><div class="panel"><h3>Мораль</h3><span class="big ${mc}" style="font-size:20px">${mt}</span></div></div>
  ${know}<div class="attrs">${attrs}</div>
  <div class="row" style="align-items:flex-start;gap:20px"><div><h3 style="margin-bottom:6px">Позиции</h3><div class="mini">${mini}</div></div><div style="flex:1;min-width:200px"><h3 style="margin-bottom:6px">Сезон ${season()}</h3><dl class="kv"><dt>Матчи</dt><dd>${p.st.ap}</dd><dt>Голы</dt><dd>${p.st.g}</dd><dt>Передачи</dt><dd>${p.st.as}</dd><dt>Средняя оценка</dt><dd>${avgR(p)}</dd><dt>Карточки</dt><dd>${p.st.yc} / ${p.st.rc}</dd><dt>В карьере: матчи / голы</dt><dd>${p.car.ap} / ${p.car.g}</dd></dl></div></div>
  ${actions?`<div class="row">${actions}</div>`:''}${neg}`;
}
const relCost=p=>Math.round(Math.max(0,p.ce-S.year)*52*p.wage*.5);
function askPrice(p){const t=S.T[p.club];const ut=userTeam();const sorted=t.pl.map(id=>S.P[id]).sort((a,b)=>ca(b)-ca(a));const r=sorted.indexOf(p);const imp=r<3?1:r<11?.55:.2;let v=value(p)*(1.05+imp*.35);if(p.listed)v*=.8;if(unhappy(p))v*=.85;if(ut&&t.rep>ut.rep+10)v*=1.25;return Math.round(v/1e5)*1e5;}
function askWage(p,t,renew){let w=wageFor(p,t.rep)*(p.age>30?1.1:1);w=Math.max(w,p.wage*(renew?1.1:1.05));return Math.round(w/100)*100;}

/* ----- сохранение (IndexedDB) ----- */
const DBN='brovka',STORE='saves';
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open(DBN,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function idbSet(k,v){const db=await idb();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(v,k);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}
async function idbGet(k){const db=await idb();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly');const q=tx.objectStore(STORE).get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
async function idbDel(k){const db=await idb();return new Promise(res=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(k);tx.oncomplete=res;});}
function pack(){return JSON.stringify({...S,P:Object.values(S.P).map(p=>({...p,a:p.a.map(v=>String.fromCharCode(64+v)).join('')}))});}
function unpack(str){const o=JSON.parse(str);const Pm={};o.P.forEach(p=>{p.a=[...p.a].map(c=>c.charCodeAt(0)-64);Pm[p.id]=p;});o.P=Pm;return o;}
let saving=false;
async function save(){if(!S||!S.user||saving)return;saving=true;try{await idbSet('main',pack());await idbSet('meta',{name:S.user.name,club:userTeam()?userTeam().n:'без клуба',season:season()});}catch(e){toast('Не удалось сохранить в браузере — сохраните карьеру в файл');}saving=false;}
async function showSaved(){try{const m=await idbGet('meta');const el=document.getElementById('savedslot');if(m&&el)el.innerHTML=`<div class="panel row" style="justify-content:space-between"><div><h3>Сохранённая карьера</h3><p style="margin-top:4px"><b>${esc(m.name)}</b> · ${esc(m.club)} · сезон ${esc(m.season)}</p></div><button class="btn pri" onclick="G.load()">Продолжить карьеру</button></div>`;}catch(e){}}
function afterLoad(){rebuildDays();PIDS=null;}

/* ----- действия ----- */
const G={
  go(v){if(M&&M.run)return;UI.view=v;UI.slot=null;render();window.scrollTo(0,0);},
  start(noClub){
    const ns=UI.ns;const name=(ns.name||'').trim()||'Новый тренер';
    document.getElementById('app').innerHTML='<div class="start"><div class="logo">KI<span>CK</span></div><div class="panel"><h2>Создаю мир…</h2><p class="mute" style="margin-top:6px">Клубы, составы и календарь всех турниров. Это займёт немного времени.</p></div></div>';
    setTimeout(()=>{
      newWorld({rusEuro:!!ns.rus});
      S.user={name,nat:ns.nat,exp:ns.exp,rep:EXPS[ns.exp][1],club:-1,conf:60,target:0,obj:'',hist:[],troph:[],tot:{w:0,d:0,l:0},rec:{w:0,d:0,l:0},train:'bal',last:0,strict:ns.strict==null?2:ns.strict};
      if(!noClub){const t=S.T.find(x=>x.n===ns.club);if(t)takeJob(t.id);}
      else{msg('Агент','Начало карьеры','Вы начинаете карьеру без клуба. Следите за вакансиями в разделе «Карьера» и подавайте заявки — клубы ответят через неделю.');S.T.filter(t=>t.rep<=S.user.rep+30).sort(()=>rnd()-.5).slice(0,5).forEach(t=>{t.mgr='—';S.vac.push({t:t.id,until:S.abs+ri(30,50)});});}
      msg('Трансферный отдел','Открылось летнее трансферное окно','Летнее трансферное окно открыто до 1 сентября.');
      UI.view='home';UI.screen='game';UI.msg=null;save();render();
    },30);
  },
  async load(){try{const s=await idbGet('main');S=unpack(s);afterLoad();UI.view='home';UI.screen='game';render();}catch(e){toast('Не удалось загрузить сохранение');}},
  cont(){
    if(M&&M.run)return;if(M&&M.done){G.afterMatch();return;}
    for(let k=0;k<7;k++){
      const uf=userFxToday();if(uf){if(!M||M.f!==uf)prepMatch(uf);UI.view='match';render();return;}
      processDay();if(S.stop){S.stop=false;break;}
      if(userFxToday())continue;
    }
    const ut=userTeam();if(ut&&validateXI(ut))toast('Стартовый состав скорректирован: травмы или дисквалификации');
    save();render();
  },
  kick(){M.pm=false;UI.subOut=UI.subIn=null;addEv(`Стартовый свисток! ${S.T[M.h.t].n} — ${S.T[M.a.t].n}.`,'info');play();},
  play(){play();},pause(){pause();render();},
  speed(s){M.speed=s;if(M.run)play();else render();},
  instant(){pause();M.pm=false;while(!M.done)tick(true);render();},
  sub(){const us=M.h.user?M.h:M.a;const i=us.xi.indexOf(UI.subOut);if(i<0)return;if(makeSub(us,i,UI.subIn)){UI.subOut=UI.subIn=null;render();}},
  mtac(k,v){const us=M.h.user?M.h:M.a;us.tac[k]=v;addEv(`${S.T[us.t].n} меняет установку: ${k==='m'?MENT[v].toLowerCase()+' менталитет':(k==='pr'?'прессинг':k==='te'?'темп':'ширина')+' — '+LVL3[k][v].toLowerCase()}.`,'info');render();},
  afterMatch(){M=null;UI.view='home';
    if(!userFxToday())processDay();
    save();render();},
  readAll(){S.inbox.forEach(m=>m.read=true);render();},
  bid(id,ok){const m=S.inbox.find(x=>x.id===id);if(!m||m.done)return;const p=S.P[m.data.p];const b=S.T[m.data.b];const ut=userTeam();
    if(!ok){m.done=true;m.res='Предложение отклонено.';render();return;}
    if(!p||!ut||p.club!==ut.id||!windowOpen(S.d)){m.done=true;m.res='Сделка больше невозможна.';render();return;}
    doTransfer(p,b,m.data.fee);m.done=true;m.res=`${p.n} продан в ${b.n} за ${money(m.data.fee)}.`;validateXI(ut);save();render();toast(m.res);},
  job(id,ok){const m=S.inbox.find(x=>x.id===id);if(!m||m.done)return;m.done=true;
    if(!ok){m.res='Вы отказались от предложения.';render();return;}
    const t=S.T[m.data.t];if(!m.data.force&&!S.vac.find(v=>v.t===t.id)){m.res='Вакансия уже закрыта.';render();return;}
    if(m.data.force&&t.mgr!=='—')news(`${t.n} отправил в отставку ${t.mgr}`,{t:[t.id],k:'staff'});
    takeJob(t.id);m.res=`Вы возглавили ${t.n}.`;news(`${S.user.name} — новый главный тренер ${t.n}`,{t:[t.id],k:'staff'});save();render();toast(m.res);},
  apply(tid){S.apps.push({t:tid,at:S.abs});toast('Заявка отправлена. Ответ придёт через неделю');render();},
  resign(){const t=userTeam();UI.confirm=null;S.user.rep=clamp(S.user.rep-1,1,100);news(`${S.user.name} покинул пост главного тренера ${t.n}`,{t:[t.id],k:'staff'});leaveClub('Ушёл в отставку');save();render();},
  pickSlot(i){UI.slot=UI.slot===i?null:i;render();},
  assign(pid){const t=userTeam();const i=UI.slot;if(i==null)return;const j=t.xi.indexOf(pid);if(j>=0)t.xi[j]=t.xi[i];t.xi[i]=pid;UI.slot=null;render();},
  auto(){const t=userTeam();t.xi=bestXI(t,FORM[t.tac.f]);UI.slot=null;render();toast('Состав подобран автоматически');},
  form(f){const t=userTeam();const old=t.xi.slice();t.tac.f=f;const slots=FORM[f];const pre=new Array(11).fill(null);const used=new Set();
    slots.forEach((s,i)=>{let b=null,bv=-1;old.forEach(id=>{const p=S.P[id];if(!p||used.has(id)||fam(p,s)<.82)return;const v=slotVal(p,s);if(v>bv){bv=v;b=id;}});if(b!=null){pre[i]=b;used.add(b);}});
    t.xi=bestXI(t,slots,pre);UI.slot=null;render();},
  tac(k,v){userTeam().tac[k]=v;},
  sf(k,v){UI.f[k]=v;render();},
  openP(id){UI.modalP=id;UI.neg=null;UI.confirm=null;renderModal();},
  closeP(){UI.modalP=null;UI.neg=null;UI.confirm=null;renderModal();render();},
  short(id){const i=S.short.indexOf(id);if(i>=0)S.short.splice(i,1);else S.short.push(id);renderModal();},
  list(id){const p=S.P[id];p.listed=!p.listed;renderModal();toast(p.listed?'Игрок выставлен на трансфер':'Игрок снят с трансфера');},
  release(id){const p=S.P[id];const t=userTeam();const c=relCost(p);t.bal-=c;sign(p,null);p.wage=Math.round(p.wage*.8);UI.confirm=null;validateXI(t);news(`${t.n} расторг контракт с ${p.n}`,{t:[t.id],p:p.id,k:'transfer'});renderModal();render();toast(`Контракт расторгнут, выплачено ${money(c)}`);},
  neg(type){const p=S.P[UI.modalP];const ut=userTeam();UI.neg={type,fee:type==='buy'?askPrice(p):0,wage:askWage(p,ut,type==='renew'),yrs:p.age>31?1:p.age>28?2:3};renderModal();},
  negSend(){
    const p=S.P[UI.modalP];const ut=userTeam();const n=UI.neg;
    const fee=n.type==='buy'?Math.round((+document.getElementById('nf').value||0)*1e6):0;const wage=Math.round((+document.getElementById('nw').value||0)*1e3);const yrs=+document.getElementById('ny').value;
    n.fee=fee||n.fee;n.wage=wage;n.yrs=yrs;n.ok=false;const done=(t,ok)=>{n.res=t;n.ok=!!ok;renderModal();};
    if(n.type==='buy'&&!windowOpen(S.d))return done('Трансферное окно закрыто. Клубы могут продавать игроков только во время окна.');
    if(fee>ut.tb)return done(`Сумма превышает трансферный бюджет (${money(ut.tb)}).`);
    if(wageBill(ut)-(n.type==='renew'?p.wage:0)+wage>ut.wb)return done(`Совет директоров не одобряет: фонд зарплат превысит бюджет (${money(ut.wb)} в неделю).`);
    if(n.type==='buy'){const sel=S.T[p.club];const ask=askPrice(p);if(fee<ask*.8)return done(`${sel.n} отклоняет предложение: сумма слишком мала.`);if(fee<ask*.97)return done(`${sel.n} готов обсуждать сделку от ${money(ask)}.`);
      const sorted=sel.pl.map(id=>S.P[id]).sort((a,b)=>ca(b)-ca(a));if(sel.rep>ut.rep+18&&sorted.indexOf(p)<11)return done(`${p.n} не хочет переходить в менее престижный клуб.`);}
    if(n.type!=='renew'&&p.club>=0&&ut.rep<S.T[p.club].rep-25)return done(`${p.n} не рассматривает переход в ${ut.n}.`);
    const aw=askWage(p,ut,n.type==='renew');
    if(n.type==='renew'&&p.age<30&&ca(p)>teamAvgCa(ut)+.8&&ut.rep<70&&rnd()<.25)return done(`${p.n} хочет попробовать себя в более сильном клубе и пока не готов продлевать контракт.`);
    if(wage<aw*.95)return done(`Агент игрока просит зарплату не меньше ${money(aw)} в неделю.`);
    if(n.type==='renew'){p.wage=wage;p.ce=S.year+yrs;p.mor=clamp(p.mor+8,10,100);render();return done(`${p.n} подписал новый контракт до лета ${p.ce}.`,true);}
    doTransfer(p,ut,fee,yrs,wage);p.ce=S.year+yrs;render();msg('Трансферный отдел',`${p.n} подписал контракт`,`${p.n} стал игроком ${ut.n}${fee?' за '+money(fee):''}. Зарплата — ${money(wage)} в неделю, контракт до лета ${p.ce}.`);
    done(`Сделка завершена: ${p.n} — игрок ${ut.n}.`,true);
  },
  exportSave(){try{const b=new Blob([pack()],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`kick-${S.user.name.replace(/\s+/g,'_')}-${S.year}.json`;document.body.appendChild(a);a.click();a.remove();toast('Файл сохранения создан');}catch(e){toast('Не удалось создать файл');}},
  importSave(inp){const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const o=unpack(r.result);if(!o.user||!o.T||o.v!==2)throw 0;S=o;afterLoad();M=null;save();UI.view='home';UI.screen='game';UI.msg=null;render();toast('Карьера загружена');}catch(e){toast('Файл не похож на сохранение этой версии KICK');}};r.readAsText(f);},
  async newGame(){try{await idbDel('main');await idbDel('meta');}catch(e){}S=null;M=null;UI.confirm=null;UI.saved=null;UI.screen='title';render();},
};
window.G=G;window.UI=UI;window.render=render;
document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')G.closeP();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&UI.modalP!=null)G.closeP();});
