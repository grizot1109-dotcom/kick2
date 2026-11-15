'use strict';
/* ===== KICK 2: режим «Стань легендой» (карьера за игрока) и редактор базы ===== */
const LG=()=>S&&S.legend?S.legend:null;
const lgP=()=>LG()?S.P[LG().pid]:null;
const LTRAIN={bal:'Всё понемногу',att:'Завершение и игра без мяча',tec:'Техника и пас',def:'Отбор и позиция',phy:'Скорость и сила',men:'Голова: решения и хладнокровие'};
UI.ls=UI.ls||{name:'',nat:'RUS',pos:'ST',country:'RUS',ft:'Правая'};

/* ---------- создание ---------- */
function vLegendNew(){
  const s=UI.ls;const cs=pickerCountries();if(!cs.includes(s.country))s.country=cs[0];
  return `<div class="title"><div class="title-in narrow"><button class="btn back" onclick="G.scr('title')">‹ Главное меню</button><h1>Стань легендой</h1>
   <p class="mute" style="margin:-6px 0 14px">Вы — 17-летний футболист. Тренер решает, играть ли вам, а вы тренируетесь, выбираете клубы и идёте к «Золотому мячу».</p>
   <div class="panel grid" style="gap:14px">
    <label class="field">Имя и фамилия<input id="lsn" value="${esc(s.name)}" placeholder="Например, Артём Волков" oninput="UI.ls.name=this.value"></label>
    <div class="grid g2" style="gap:12px"><label class="field">Гражданство<select onchange="UI.ls.nat=this.value">${Object.keys(NATS).sort((a,b)=>natName(a).localeCompare(natName(b),'ru')).map(k=>`<option value="${k}" ${k===s.nat?'selected':''}>${natName(k)}</option>`).join('')}</select></label>
     <label class="field">Позиция<select onchange="UI.ls.pos=this.value">${POSL.map(p=>`<option value="${p}" ${p===s.pos?'selected':''}>${PR[p]} — ${({GK:'вратарь',DL:'левый защитник',DC:'центральный защитник',DR:'правый защитник',DM:'опорный полузащитник',ML:'левый полузащитник',MC:'центральный полузащитник',MR:'правый полузащитник',AML:'левый вингер',AMC:'атакующий полузащитник',AMR:'правый вингер',ST:'нападающий'})[p]}</option>`).join('')}</select></label>
     <label class="field">Рабочая нога<select onchange="UI.ls.ft=this.value">${['Правая','Левая','Обе'].map(f=>`<option ${f===s.ft?'selected':''}>${f}</option>`).join('')}</select></label>
     <label class="field">Страна первого клуба<select onchange="UI.ls.country=this.value">${cs.map(c=>`<option value="${c}" ${c===s.country?'selected':''}>${natName(c)}</option>`).join('')}</select></label></div>
    <p class="mute" style="font-size:12px">Карьера начнётся в скромном клубе этой страны. Дорогу в топ-клубы придётся заслужить игрой.</p>
   </div>
   <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn pri" onclick="G.lStart()">Начать карьеру игрока ›</button></div></div></div>`;
}
G.lStart=function(){
  const s=UI.ls;const name=(s.name||'').trim()||'Новый игрок';
  document.getElementById('app').innerHTML='<div class="start"><div class="logo">KI<span>CK</span> 2</div><div class="panel"><h2>Создаю мир…</h2><p class="mute" style="margin-top:6px">Это займёт немного времени.</p></div></div>';
  setTimeout(()=>{
    newWorld({rusEuro:!!SET.rus});
    S.user={name,nat:s.nat,exp:0,rep:1,club:-1,conf:60,target:0,obj:'',hist:[],troph:[],tot:{w:0,d:0,l:0},rec:{w:0,d:0,l:0},train:'bal',last:0,strict:0,k2:{ach:{},streak:0,big:0,acDeb:0,sold:0}};
    const lgs=S.L.filter(L=>L.nat===s.country).sort((a,b)=>b.tier-a.tier);const L=lgs.find(x=>x.tier===2)||lgs[0];
    const club=S.T[pick(L.teams.slice().sort((a,b)=>S.T[a].rep-S.T[b].rep).slice(0,Math.max(3,Math.ceil(L.teams.length/2))))];
    const p=genPlayer(4.3+club.rep*.11-1.6,s.pos,17,s.nat);p.n=name;p.ft=s.ft;p.pa=clamp(17+rnd()*1.8,ca(p)+5,20);p.a[A.det]=Math.max(p.a[A.det],15);p.a[A.nat]=Math.max(p.a[A.nat],14);
    S.P[p.id]=p;sign(p,club,3,Math.max(600,wageFor(p,club.rep)));p.mor=75;
    S.legend={pid:p.id,train:'bal',hist:[],tro:[],aw:[],done:false,start:club.id};
    msg(club.n,'Первый профессиональный контракт',`${name}, добро пожаловать в ${club.n}!\n\nВы подписали первый профессиональный контракт на 3 года. Тренер ${club.mgr} будет давать шанс тем, кто лучше тренируется и играет.\n\nВыбирайте фокус тренировок на странице «Моя карьера» и нажимайте «Продолжить». Предложения от других клубов придут во «Входящие».`);
    UI.view='lhome';UI.screen='game';UI.msg=null;save();render();
  },30);
};

/* ---------- ход времени ---------- */
const _devL=develop;
develop=function(p,focus){if(LG()&&p.id===LG().pid){if(p.age<=25&&rnd()<.3)return;_devL(p,LG().train);return;}_devL(p,focus);};
const _awsL=aiWillSell;aiWillSell=function(p,sel,buyer){if(LG()&&p.id===LG().pid)return false;return _awsL(p,sel,buyer);};
const _weeklyL=weekly;
weekly=function(){_weeklyL();const L=LG();const p=lgP();if(!L||!p||L.done)return;
  const t=p.club>=0?S.T[p.club]:null;const c=ca(p);
  const ch=p.club<0?.5:windowOpen(S.d)?.1+(p.listed?.15:0)+(perfOf(p)>1?.08:0):0;
  if(rnd()<ch){const lv=b=>4.3+b.rep*.11;const buyers=S.T.filter(b=>(!t||b.id!==t.id)&&(!t||b.rep>=t.rep+2)&&lv(b)<=c+1.4&&lv(b)>=c-1.2&&b.pl.length<30);
    if(buyers.length){const b=pick(buyers);const fee=t?Math.round(value(p)*(1+rnd()*.3)/1e5)*1e5:0;const wage=Math.round(wageFor(p,b.rep)*1.15/100)*100;const yrs=p.age>30?2:ri(3,5);
      if(!S.inbox.some(m=>m.type==='pofr'&&!m.done&&m.data.b===b.id))msg(b.n,`${b.n} хочет вас подписать`,`${b.n} (${S.L[b.lg].name}, ${clubStatus(b.rep).toLowerCase()}) предлагает контракт.\n\nЗарплата: ${money(wage)} в неделю, срок — ${yrs} ${plural(yrs,'год','года','лет')}.${fee?`\n${t.n} получит ${money(fee)} — клубы договорились.`:''}`,'pofr',{b:b.id,fee,wage,yrs});}}
};
G.lOffer=function(id,ok){const m=S.inbox.find(x=>x.id===id);if(!m||m.done)return;const p=lgP();m.done=true;
  if(!ok){m.res='Вы отказались.';render();return;}const b=S.T[m.data.b];if(p.club>=0&&!windowOpen(S.d)){m.res='Трансферное окно уже закрыто.';render();return;}
  doTransfer(p,b,m.data.fee,m.data.yrs,m.data.wage);p.listed=false;m.res=`Вы — игрок ${b.n}!`;S.inbox.forEach(x=>{if(x.type==='pofr'&&!x.done){x.done=true;x.res='Вы выбрали другой клуб.';}});toast(m.res);save();render();};
const _vInboxL=vInbox;
vInbox=function(){let html=_vInboxL();const m=S.inbox.find(x=>x.id===UI.msg);
  if(m&&m.type==='pofr'&&!m.done)html+=`<div class="panel row"><b>Перейти в ${esc(S.T[m.data.b].n)}?</b><button class="btn pri" onclick="G.lOffer(${m.id},true)">Принять</button><button class="btn" onclick="G.lOffer(${m.id},false)">Отказаться</button></div>`;return html;};
const _seL=seasonEnd;
seasonEnd=function(){
  const L=LG();const p=lgP();if(!L||!p||L.done)return _seL();
  const label=season();const t=p.club>=0?S.T[p.club]:null;
  if(t){Object.values(S.C).forEach(c=>{if(!c.nt&&c.done&&c.w===t.id)L.tro.unshift({n:c.name,s:label,c:t.n,id:c.id});});const lgT=S.L[t.lg];if(standings(lgT)[0].id===t.id)L.tro.unshift({n:lgT.name,s:label,c:t.n,id:'L:'+lgT.key});}
  L.hist.unshift({s:label,c:t?t.n:'Без клуба',tid:t?t.id:null,ap:p.st.ap,g:p.st.g,as:p.st.as,r:avgR(p)});
  const realAge=p.age;const keep=p;if(p.age>=33)p.age=30;
  _seL();
  if(!S.P[keep.id])S.P[keep.id]=keep;p.age=realAge+1;
  const aw=S.aw&&S.aw[0];if(aw){const i=aw.ballon.findIndex(x=>x.id===p.id);if(i>=0){L.aw.unshift({n:['«Золотой мяч»','2-е место в «Золотом мяче»','3-е место в «Золотом мяче»'][i],s:label});msg('Пресс-служба',i===0?'Вы выиграли «Золотой мяч»!':'Вы в тройке лучших игроков мира',`По итогам сезона ${label} вы заняли ${i+1}-е место в голосовании за «Золотой мяч».`);}
    aw.lg.forEach(x=>{if(x.mvp&&x.mvp.id===p.id)L.aw.unshift({n:'Игрок сезона: '+x.name,s:label});if(x.sc&&x.sc.id===p.id)L.aw.unshift({n:'Лучший бомбардир: '+x.name,s:label});if(x.xi.some(y=>y.id===p.id))L.aw.unshift({n:'Символическая сборная: '+x.name,s:label});});}
  if(p.age>=38){L.done=true;msg('Агент','Завершение карьеры',`В ${p.age} лет пора повесить бутсы на гвоздь. Спасибо за великую карьеру!`);}
};
const _saveL=save;
save=async function(){await _saveL();const p=lgP();if(!p||!S.cid)return;try{const l=await listSaves();const e=l.find(x=>x.id===S.cid);if(e){e.club='Легенда · '+(p.club>=0?S.T[p.club].n:'без клуба');e.crest=p.club>=0?S.T[p.club].crest:null;await idbSet('list',l);UI.saves=l;}}catch(e){}};

/* ---------- экран «Моя карьера» ---------- */
function vLegend(){
  const L=LG();const p=lgP();if(!p)return '<div class="panel">Игрок не найден.</div>';const t=p.club>=0?S.T[p.club]:null;
  const rk=t?squadRank(p,t):99;const role=!t?'Свободный агент':rk<3?'Ключевой игрок':rk<11?'Игрок основы':rk<17?'Игрок ротации':'Запасной';
  const nf=t?S.F.filter(f=>f.hg==null&&!f.nt&&(f.h===t.id||f.a===t.id)&&f.d>=S.d).sort((a,b)=>a.d-b.d)[0]:null;
  const nt=S.NS&&S.NS[p.nat]&&(S.NS[p.nat].xi||[]).includes(p.id);
  const car=L.hist.reduce((s,h)=>({ap:s.ap+h.ap,g:s.g+h.g}),{ap:p.st.ap,g:p.st.g});
  const keys=ROLE[POS_ROLE[p.pos]].slice().sort((a,b)=>b[1]-a[1]).slice(0,6);
  return `<div class="head"><div class="row" style="gap:14px">${avatar(p,72)}<div><h1>${esc(p.n)}</h1><p class="mute">${PR[p.pos]} · ${p.age} ${plural(p.age,'год','года','лет')} · ${esc(natName(p.nat))}${nt?' · <span class="acc">игрок сборной</span>':''}</p><div class="row" style="margin-top:6px">${t?crest(t,22)+`<b>${esc(t.n)}</b> <span class="mute">${esc(S.L[t.lg].name)}</span>`:'<span class="acc">Свободный агент</span>'}</div></div></div><button class="btn" onclick="G.openP(${p.id})">Все характеристики</button></div>
  ${L.done?`<div class="panel"><h2>Карьера завершена</h2><p class="mute" style="margin-top:6px">${car.ap} матчей, ${car.g} голов, ${L.tro.length} трофеев, ${L.aw.length} личных наград.</p></div>`:''}
  <div class="kpi"><div class="panel"><h3>Статус в команде</h3><span class="big" style="font-size:20px">${role}</span></div><div class="panel"><h3>Сезон</h3><span class="big">${p.st.ap} · ${p.st.g}</span><small class="mute"> матчей · голов</small></div><div class="panel"><h3>Средняя оценка</h3><span class="big">${avgR(p)}</span></div><div class="panel"><h3>Стоимость</h3><span class="big">${money(value(p))}</span></div><div class="panel"><h3>Контракт</h3><span class="big" style="font-size:20px">${t?money(p.wage)+'/нед.':'—'}</span><small class="mute">${t?' до лета '+p.ce:''}</small></div></div>
  <div class="grid g2" style="align-items:start">
   <div class="panel"><h3 style="margin-bottom:8px">Тренировки</h3><div class="talks">${Object.entries(LTRAIN).map(([k,n])=>`<button class="tbtn ${L.train===k?'on':''}" style="${L.train===k?'border-color:var(--accent)':''}" onclick="LG().train='${k}';render()"><b>${n}</b></button>`).join('')}</div>
    <h3 style="margin:14px 0 6px">Ключевые характеристики</h3>${keys.map(([i])=>`<div class="ar"><span>${AL[i]}</span><b class="${acls(p.a[i])}">${p.a[i]}</b></div>`).join('')}
    <p class="mute" style="font-size:12px;margin-top:8px">Потенциал: ${potStars(p.pa)} · последние оценки: ${p.form.length?p.form.map(r=>r.toFixed(1)).join(', '):'—'}</p></div>
   <div class="grid" style="gap:14px;align-content:start">
    ${nf?`<div class="panel"><h3>Следующий матч</h3><p style="margin-top:6px">${esc(S.T[nf.h].n)} — ${esc(S.T[nf.a].n)} <span class="mute">· ${fmtShort(nf.d)} · ${esc(compOfFx(nf).name)}</span></p></div>`:''}
    <div class="panel"><h3 style="margin-bottom:8px">Решения</h3><div class="row">${L.done?'':`<button class="btn" onclick="G.lTalk()">Поговорить с тренером</button>${t?`<button class="btn" onclick="G.lList()">${p.listed?'Остаться в клубе':'Попросить трансфер'}</button>`:''}${p.age>=33?`<button class="btn bad" onclick="G.lRetire()">Завершить карьеру</button>`:''}`}</div>${L.say?`<p class="mute" style="font-size:13px;margin-top:8px">${esc(L.say)}</p>`:''}</div>
    <div class="panel"><h3 style="margin-bottom:6px">Трофеи и награды</h3>${L.tro.length||L.aw.length?[...L.aw.map(a=>`<p style="font-size:13px">🏅 ${esc(a.n)} <span class="mute">${a.s}</span></p>`),...L.tro.map(x=>`<p style="font-size:13px">🏆 ${esc(x.n)} <span class="mute">${x.s} · ${esc(x.c)}</span></p>`)].join(''):'<p class="mute">Пока нет — всё впереди.</p>'}</div>
   </div></div>
  <div class="panel tw"><h3 style="margin-bottom:6px">История карьеры · ${car.ap} матчей, ${car.g} голов</h3>${L.hist.length?`<table class="t"><thead><tr><th>Сезон</th><th>Клуб</th><th class="r">Матчи</th><th class="r">Голы</th><th class="r">Передачи</th><th class="r">Оценка</th></tr></thead><tbody>${L.hist.map(h=>`<tr><td class="num">${h.s}</td><td><div class="cell">${h.tid!=null?crest(S.T[h.tid],18):''}<span>${esc(h.c)}</span></div></td><td class="r num">${h.ap}</td><td class="r num">${h.g}</td><td class="r num">${h.as}</td><td class="r num">${h.r}</td></tr>`).join('')}</tbody></table>`:'<p class="mute">Первый сезон ещё идёт.</p>'}</div>`;
}
G.lTalk=function(){const p=lgP();const t=p.club>=0?S.T[p.club]:null;const L=LG();if(!t){L.say='У вас нет клуба — ждите предложений во «Входящих».';return render();}
  const rk=squadRank(p,t);const w=ROLE[POS_ROLE[p.pos]].slice().sort((a,b)=>p.a[a[0]]-p.a[b[0]]||b[1]-a[1])[0];
  L.say=rk<11?`${t.mgr}: «Ты важен для команды. Продолжай в том же духе».`:`${t.mgr}: «Пока ты уступаешь конкурентам. Подтяни ${AL[w[0]].toLowerCase()} — и получишь шанс».`;render();};
G.lList=function(){const p=lgP();p.listed=!p.listed;LG().say=p.listed?'Агент сообщил клубам, что вы хотите сменить команду. Ждите предложений в трансферные окна.':'Вы сообщили, что остаётесь в клубе.';render();};
G.lRetire=function(){askConfirm('Завершить карьеру игрока?','Продолжить играть этим игроком уже не получится.','Да, завершить',()=>{const L=LG();L.done=true;const p=lgP();news(`${p.n} завершил карьеру`,{p:p.id,t:[p.club],k:'info'});save();render();},true);};

/* ---------- редактор базы ---------- */
UI.ed=UI.ed||{q:'',sel:null};
function vEditor(){
  const e=UI.ed;const q=(e.q||'').toLowerCase();let res=[];
  if(q.length>=2){S.T.forEach(t=>{if(t.n.toLowerCase().includes(q))res.push(['t',t.id]);});for(const id in S.P){if(res.length>40)break;if(S.P[id].n.toLowerCase().includes(q))res.push(['p',+id]);}}
  let form='<p class="mute">Найдите игрока или клуб и выберите его в списке.</p>';
  if(e.sel&&e.sel[0]==='p'&&S.P[e.sel[1]]){const p=S.P[e.sel[1]];
    form=`<h3>${esc(p.n)}</h3><div class="grid g3" style="gap:10px;margin:10px 0"><label class="field">Имя<input id="ed-n" value="${esc(p.n)}"></label><label class="field">Возраст<input id="ed-age" type="number" min="15" max="45" value="${p.age}"></label><label class="field">Позиция<select id="ed-pos">${POSL.map(x=>`<option value="${x}" ${x===p.pos?'selected':''}>${PR[x]}</option>`).join('')}</select></label><label class="field">Потенциал (1–20)<input id="ed-pa" type="number" min="1" max="20" step="0.5" value="${(+p.pa).toFixed(1)}"></label><label class="field">Зарплата, € в неделю<input id="ed-w" type="number" min="0" value="${p.wage}"></label><label class="field">Контракт до лета<input id="ed-ce" type="number" min="${S.year}" max="${S.year+8}" value="${p.ce}"></label></div>
     <div class="ed-grid">${AL.map((l,i)=>p.pos==='GK'||i<36?`<label>${l}<input type="number" min="1" max="20" data-ai="${i}" value="${p.a[i]}"></label>`:'').join('')}</div>
     <div class="row" style="margin-top:12px"><button class="btn pri" onclick="G.edSaveP(${p.id})">Сохранить игрока</button><button class="btn" onclick="G.openP(${p.id})">Открыть профиль</button></div>`;}
  else if(e.sel&&e.sel[0]==='t'&&S.T[e.sel[1]]){const t=S.T[e.sel[1]];
    form=`<h3>${esc(t.n)}</h3><div class="grid g3" style="gap:10px;margin:10px 0"><label class="field">Название<input id="ed-tn" value="${esc(t.n)}"></label><label class="field">Сокращение<input id="ed-ts" maxlength="4" value="${esc(t.s)}"></label><label class="field">Репутация (20–99)<input id="ed-tr" type="number" min="20" max="99" value="${Math.round(t.rep)}"></label><label class="field">Баланс, млн €<input id="ed-tb" type="number" step="0.1" value="${(t.bal/1e6).toFixed(1)}"></label><label class="field">Трансферный бюджет, млн €<input id="ed-ttb" type="number" step="0.1" value="${(t.tb/1e6).toFixed(1)}"></label><label class="field">Главный тренер<input id="ed-tm" value="${esc(t.mgr)}"></label><label class="field">Цвет 1<input id="ed-c1" type="color" value="${t.c1}"></label><label class="field">Цвет 2<input id="ed-c2" type="color" value="${t.c2}"></label></div>
     <div class="row"><button class="btn pri" onclick="G.edSaveT(${t.id})">Сохранить клуб</button></div><p class="mute" style="font-size:12px;margin-top:8px">Игроки клуба: ${t.pl.length}. Чтобы изменить игрока, найдите его по имени.</p>`;}
  return `<div class="head"><div><h1>Редактор базы</h1><p class="mute">Изменения действуют только в этой карьере</p></div></div>
  <div class="grid g2" style="align-items:start;grid-template-columns:minmax(0,1fr) minmax(0,2fr)"><div class="panel"><label class="field">Поиск<input id="ed-q" value="${esc(e.q)}" placeholder="Имя игрока или клуб" onchange="UI.ed.q=this.value;render()"></label>
   <div class="tw" style="margin-top:8px"><table class="t"><tbody>${res.map(([k,id])=>k==='t'?`<tr class="click ${e.sel&&e.sel[0]==='t'&&e.sel[1]===id?'me':''}" onclick="UI.ed.sel=['t',${id}];render()"><td><div class="cell">${crest(S.T[id],20)}<span>${esc(S.T[id].n)}</span></div></td><td class="mute">клуб</td></tr>`:`<tr class="click ${e.sel&&e.sel[0]==='p'&&e.sel[1]===id?'me':''}" onclick="UI.ed.sel=['p',${id}];render()"><td><div class="cell">${avatar(S.P[id],20)}<span>${esc(S.P[id].n)}</span></div></td><td class="mute">${S.P[id].club>=0?esc(S.T[S.P[id].club].n):'свободный'}</td></tr>`).join('')||(q.length>=2?'<tr><td class="mute">Ничего не найдено</td></tr>':'<tr><td class="mute">Введите хотя бы 2 буквы</td></tr>')}</tbody></table></div></div>
   <div class="panel">${form}</div></div>`;
}
const val=id=>document.getElementById(id).value;
G.edSaveP=function(id){const p=S.P[id];p.n=val('ed-n').trim()||p.n;p.age=clamp(+val('ed-age')||p.age,15,45);const np=val('ed-pos');if(np!==p.pos){p.alt=p.alt.filter(x=>x!==np);p.pos=np;}
  p.wage=Math.max(0,Math.round(+val('ed-w')||0));p.ce=clamp(Math.round(+val('ed-ce')||p.ce),S.year,S.year+8);
  document.querySelectorAll('[data-ai]').forEach(inp=>{p.a[+inp.dataset.ai]=clamp(Math.round(+inp.value||1),1,20);});p.pa=clamp(Math.max(+val('ed-pa')||p.pa,ca(p)),1,20);
  RANKC={};toast('Игрок сохранён');save();render();};
G.edSaveT=function(id){const t=S.T[id];t.n=val('ed-tn').trim()||t.n;t.s=(val('ed-ts').trim()||t.s).slice(0,4);t.rep=clamp(+val('ed-tr')||t.rep,20,99);t.bal=Math.round((+val('ed-tb')||0)*1e6);t.tb=Math.max(0,Math.round((+val('ed-ttb')||0)*1e6));t.mgr=val('ed-tm').trim()||t.mgr;t.c1=val('ed-c1');t.c2=val('ed-c2');
  if(t.fin&&S.user&&t.id===S.user.club){}RIV=null;toast('Клуб сохранён');save();render();};
VIEWS.splice(VIEWS.findIndex(v=>v[0]==='save'),0,['editor','Редактор']);

/* ---------- каркас: меню, вкладки, экраны ---------- */
const LVIEWS=[['lhome','Моя карьера'],['home','Новости'],['inbox','Входящие'],['comps','Турниры'],['awards','Награды'],['editor','Редактор'],['save','Сохранение']];
const _renderL=render;
render=function(){
  if(UI.screen==='legendnew'){document.getElementById('app').innerHTML=vLegendNew();return;}
  if(!(S&&S.legend&&UI.screen==='game'))return _renderL();
  if(!LVIEWS.some(v=>v[0]===UI.view))UI.view='lhome';
  const p=lgP();const t=p&&p.club>=0?S.T[p.club]:null;const unread=S.inbox.filter(m=>!m.read).length;
  const cbtn=UI.busy?`<button class="btn pri cont" onclick="G.cont()">Стоп</button>`:LG().done?'':`<button class="btn pri cont" onclick="G.cont()">Продолжить</button>`;
  document.getElementById('app').innerHTML=`<header class="top"><button class="menu-btn" onclick="G.menu()" title="Главное меню" aria-label="Главное меню">☰</button><div class="club">${t?crest(t,38):''}<div style="min-width:0"><b>${esc(p?p.n:'')}</b><small>${t?esc(t.n)+' · ':''}Стань легендой</small></div></div>
  <div class="date"><b>${fmtDate(S.d)}</b><span class="hide">сезон ${season()}${windowOpen(S.d)?' · трансферное окно открыто':''}</span></div>${cbtn}</header>
  <nav class="tabsbar" aria-label="Разделы">${LVIEWS.map(([k,l])=>`<button class="${UI.view===k?'on':''}" onclick="G.go('${k}')">${l}${k==='inbox'&&unread?`<span class="badge">${unread}</span>`:''}</button>`).join('')}</nav>
  ${procBar()}<main id="main">${UI.view==='lhome'?vLegend():renderView()}</main>`;
};
const _rvL=renderView;
renderView=function(){if(UI.view==='editor')return vEditor();if(UI.view==='lhome'&&LG())return vLegend();return _rvL();};
const _vTitleL=vTitle;
vTitle=function(){return _vTitleL().replace(`<button class="mi" onclick="G.scr('load')">`,`<button class="mi" onclick="G.scr('legendnew')"><b>Стань легендой</b><small>Карьера за одного игрока: от дебюта до «Золотого мяча»</small></button><button class="mi" onclick="G.scr('load')">`);};
const _loadL=G.load;G.load=async function(id){await _loadL(id);if(S&&S.legend){UI.view='lhome';render();}};
