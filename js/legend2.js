'use strict';
/* ===== KICK 2: карьера игрока — выбор возраста и клуба, агент, трансферы и аренды по запросу ===== */
UI.ls.age=UI.ls.age||17;UI.ls.club=UI.ls.club||'';UI.ls.lg=UI.ls.lg||'';
const AGENT_N=['Марко Ферри','Хорхе Мендоса','Пини Захави','Мино Райола-мл.','Рафаэла Пименто','Вольф Беккер','Самир Хадад','Олег Нестеров','Люк Дюпон','Карлос Сантана'];

/* ---------- создание: возраст и клуб ---------- */
vLegendNew=function(){
  const s=UI.ls;const cs=pickerCountries();if(!cs.includes(s.country))s.country=cs[0];
  const lgs=W.leagues.filter(l=>l.nat===s.country).sort((a,b)=>a.tier-b.tier);if(!lgs.some(l=>l.id===s.lg))s.lg='';
  const lg=lgs.find(l=>l.id===s.lg);const clubs=lg?W.clubs.filter(c=>c.lg===lg.id).sort((a,b)=>repW(b)-repW(a)):[];
  if(s.club&&!clubs.some(c=>c.name===s.club))s.club='';
  const club=clubs.find(c=>c.name===s.club);
  const POSN={GK:'вратарь',DL:'левый защитник',DC:'центральный защитник',DR:'правый защитник',DM:'опорный полузащитник',ML:'левый полузащитник',MC:'центральный полузащитник',MR:'правый полузащитник',AML:'левый вингер',AMC:'атакующий полузащитник',AMR:'правый вингер',ST:'нападающий'};
  let hint='Карьера начнётся в скромном клубе выбранной страны. Дорогу в топ-клубы придётся заслужить игрой.';
  if(club){const r=repW(club),lvl=4.3+r*.11,me=lvl-1.6+(s.age-17)*.55;hint=me<lvl-1.2?`В «${club.name}» сильная конкуренция: на старте вы будете в запасе, шанс придётся выгрызать. Можно попросить аренду у тренера.`:me<lvl-.4?`В «${club.name}» вы начнёте игроком ротации.`:`В «${club.name}» у вас хорошие шансы сразу играть в основе.`;}
  return `<div class="title"><div class="title-in narrow"><h1>Стань легендой</h1>
   <p class="mute" style="margin:-6px 0 14px">Вы — молодой футболист. Тренер решает, играть ли вам, а вы тренируетесь, с агентом выбираете клубы и идёте к «Золотому мячу».</p>
   <div class="panel grid" style="gap:14px">
    <label class="field">Имя и фамилия<input id="lsn" value="${esc(s.name)}" placeholder="Например, Артём Волков" oninput="UI.ls.name=this.value"></label>
    <div class="grid g2" style="gap:12px">
     <label class="field">Гражданство<select onchange="UI.ls.nat=this.value">${Object.keys(NATS).sort((a,b)=>natName(a).localeCompare(natName(b),'ru')).map(k=>`<option value="${k}" ${k===s.nat?'selected':''}>${natName(k)}</option>`).join('')}</select></label>
     <label class="field">Возраст<select onchange="UI.ls.age=+this.value;render()">${[16,17,18,19,20,21,22,23,24].map(a=>`<option value="${a}" ${a===s.age?'selected':''}>${a} ${plural(a,'год','года','лет')}</option>`).join('')}</select></label>
     <label class="field">Позиция<select onchange="UI.ls.pos=this.value">${POSL.map(p=>`<option value="${p}" ${p===s.pos?'selected':''}>${PR[p]} — ${POSN[p]}</option>`).join('')}</select></label>
     <label class="field">Рабочая нога<select onchange="UI.ls.ft=this.value">${['Правая','Левая','Обе'].map(f=>`<option ${f===s.ft?'selected':''}>${f}</option>`).join('')}</select></label>
    </div>
    <p class="mute" style="font-size:13px">Чем старше вы начинаете, тем выше стартовый уровень, но меньше времени на рост.</p>
   </div>
   <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" onclick="UI.ls.club='';UI.ls.lg='';if(pickerCountries().includes(UI.ls.nat))UI.ls.country=UI.ls.nat;G.lStart()">Начать в скромном клубе</button><button class="btn pri" onclick="G.scr('legendpick')">Выбрать клуб ›</button></div></div></div>`;
};
/* ---------- выбор первого клуба — тот же экран, что в карьере тренера ---------- */
function legendRole(club){const r=repW(club),lvl=4.3+r*.11,me=lvl-1.6+((UI.ls.age||17)-17)*.55;return me<lvl-1.2?'Запасной — шанс придётся заслужить':me<lvl-.4?'Игрок ротации':'Игрок основы';}
function vLegendPick(){
  const {club}=pickerState();
  return vPicker()
    .replace(`onclick="G.scr('newcareer')"`,`onclick="G.scr('legendnew')"`)
    .replace(/<dt>Трансферный бюджет<\/dt><dd>[^<]*<\/dd><dt>Ожидания совета<\/dt><dd>[^<]*<\/dd>/,`<dt>Ваша роль в команде</dt><dd>${esc(legendRole(club))}</dd><dt>Ваш возраст</dt><dd>${UI.ls.age||17} ${plural(UI.ls.age||17,'год','года','лет')}</dd>`)
    .replace(/<button class="btn pri" onclick="G\.start\(false\)">Начать карьеру в «[^<]*»<\/button>/,`<button class="btn pri" onclick="G.lPick()">Начать карьеру игрока в «${esc(club.name)}»</button>`);
}
G.lPick=function(){const {club}=pickerState();UI.ls.club=club.name;UI.ls.country=UI.ns.country;UI.ls.lg='';G.lStart();};
const _renderLP=render;
render=function(){
  if(UI.screen==='legendpick'&&!(S&&S.user&&UI.screen==='game')){document.getElementById('app').innerHTML=vLegendPick();postRender();return;}
  _renderLP();
};
document.addEventListener('keydown',e=>{
  if(UI.screen!=='legendpick'||e.target.tagName==='INPUT'||e.target.closest('.csel,.csel-pop'))return;
  if(e.key==='ArrowLeft'){G.pkClub(-1);e.preventDefault();}else if(e.key==='ArrowRight'){G.pkClub(1);e.preventDefault();}
  else if(e.key==='ArrowUp'){G.pkCountry(-1);e.preventDefault();}else if(e.key==='ArrowDown'){G.pkCountry(1);e.preventDefault();}
  else if(e.key==='Enter'){G.lPick();}
});
G.lStart=function(){
  const s=UI.ls;const name=(s.name||'').trim()||'Новый игрок';const age=s.age||17;
  document.getElementById('app').innerHTML='<div class="start"><div class="logo">KI<span>CK</span> 2</div><div class="panel"><h2>Создаю мир…</h2><p class="mute" style="margin-top:6px">Это займёт немного времени.</p></div></div>';
  setTimeout(()=>{
    newWorld({rusEuro:!!SET.rus});
    S.user={name,nat:s.nat,exp:0,rep:1,club:-1,conf:60,target:0,obj:'',hist:[],troph:[],tot:{w:0,d:0,l:0},rec:{w:0,d:0,l:0},train:'bal',last:0,strict:0,k2:{ach:{},streak:0,big:0,acDeb:0,sold:0}};
    let club=s.club?S.T.find(t=>t.n===s.club):null;
    if(!club){let pool;if(s.lg){pool=S.L.filter(L=>L.key===s.lg).flatMap(L=>L.teams);}else{const lgs=S.L.filter(L=>L.nat===s.country).sort((a,b)=>b.tier-a.tier);const L=lgs.find(x=>x.tier===2)||lgs[0];pool=L.teams.slice().sort((a,b)=>S.T[a].rep-S.T[b].rep).slice(0,Math.max(3,Math.ceil(L.teams.length/2)));}club=S.T[pick(pool)];}
    const lvl=4.3+club.rep*.11;
    const p=genPlayer(lvl-1.6+(age-17)*.55,s.pos,age,s.nat);p.n=name;p.ft=s.ft;
    p.pa=clamp(17.2+rnd()*1.6-Math.max(0,age-20)*.25,ca(p)+3,20);p.a[A.det]=Math.max(p.a[A.det],15);p.a[A.nat]=Math.max(p.a[A.nat],14);
    S.P[p.id]=p;sign(p,club,age>=21?2:3,Math.max(600,wageFor(p,club.rep)));p.mor=75;
    S.legend={pid:p.id,train:'bal',hist:[],tro:[],aw:[],done:false,start:club.id,ag:{n:pick(AGENT_N),tasks:[]}};
    msg(club.n,'Профессиональный контракт',`${name}, добро пожаловать в ${club.n}!\n\nВы подписали контракт до лета ${p.ce}. Тренер ${club.mgr} будет давать шанс тем, кто лучше тренируется и играет.\n\nВыбирайте фокус тренировок на странице «Моя карьера». Если хотите сменить клуб или уйти в аренду — поручите это агенту в разделе «Агент».`);
    msg(S.legend.ag.n,'Ваш агент',`Здравствуйте! Я ${S.legend.ag.n}, ваш агент.\n\nСкажите, в каком клубе вы хотите играть, — я поговорю с ними о трансфере или аренде. Переговоры идут в трансферные окна: летом до 1 сентября и зимой в январе.`);
    UI.view='lhome';UI.screen='game';UI.msg=null;save();render();
  },30);
};

/* ---------- агент ---------- */
const agentOf=()=>{const L=LG();if(!L.ag)L.ag={n:pick(AGENT_N),tasks:[]};return L.ag;};
const clubLvl=t=>4.3+t.rep*.11;
function chanceFor(p,b,kind){const g=ca(p)-clubLvl(b);const pf=perfOf(p)||0;
  return kind==='loan'?(clubLvl(b)>ca(p)+1.8?0:clamp(.62+(g+.5)*.3+pf*.05,.05,.95)):clamp(.48+g*.36+pf*.08,.03,.95);}
const chTxt=v=>v>=.66?['Высокие','good']:v>=.36?['Средние','warn']:v>.04?['Низкие','bad']:['Нет','bad'];
function interested(p){
  const L=LG();if(L.int&&L.int.at===S.abs)return L.int.list;const cur=p.club>=0?S.T[p.club]:null;const c=ca(p);
  const list=shuffle(S.T.filter(t=>(!cur||t.id!==cur.id)&&Math.abs(clubLvl(t)-c-.3)<1.1&&(!cur||t.rep>=cur.rep-5))).slice(0,6).map(t=>({t:t.id,v:clamp(.35+(c-clubLvl(t))*.3+(perfOf(p)||0)*.1+rnd()*.25,.1,.98)})).sort((a,b)=>b.v-a.v);
  L.int={at:S.abs,list};return list;
}
G.agTask=function(tid,kind){
  const p=lgP();const ag=agentOf();const b=S.T[tid];if(!b)return;
  if(p.loan&&kind!=='free')return toast('Вы в аренде до конца сезона — переговоры после её окончания');
  if(p.club===tid)return toast('Вы уже играете в этом клубе');
  if(ag.tasks.some(x=>x.t===tid&&!x.done))return toast('Агент уже ведёт переговоры с этим клубом');
  if(ag.tasks.filter(x=>!x.done).length>=3)return toast('Агент ведёт сразу не больше трёх переговоров');
  ag.tasks.unshift({t:tid,kind,at:S.abs+ri(3,7),st:windowOpen(S.d)||p.club<0?'Идут переговоры':'Ждёт трансферного окна',done:false});
  toast(`${ag.n}: «Поговорю с ${b.n}»`);render();
};
G.agCancel=function(i){const ag=agentOf();ag.tasks.splice(i,1);render();};
function agentDaily(){
  const L=LG();const p=lgP();if(!L||!p||L.done)return;const ag=agentOf();
  ag.tasks.forEach(tk=>{
    if(tk.done)return;const b=S.T[tk.t];if(!b){tk.done=true;tk.st='Клуб не найден';return;}
    if(p.club>=0&&!windowOpen(S.d)){tk.st='Ждёт трансферного окна';if(tk.at<=S.abs)tk.at=S.abs+1;return;}
    tk.st='Идут переговоры';if(S.abs<tk.at)return;tk.done=true;
    const cur=p.club>=0?S.T[p.club]:null;const kind=tk.kind;
    if(rnd()>=chanceFor(p,b,kind)){tk.st='Отказ клуба';tk.res=0;
      msg(ag.n,`${b.n}: отказ`,kind==='loan'?`${b.n} не готов брать вас в аренду: ${clubLvl(b)>ca(p)+1.5?'считают, что вы пока не дотягиваете до их уровня.':'у них уже хватает игроков на вашей позиции.'}`:`Я поговорил с ${b.n}. ${clubLvl(b)>ca(p)+.6?'Там считают, что вам пока рано в такой клуб — нужно прибавить и проявить себя.':'Сейчас они не ищут игроков на вашу позицию.'}`);return;}
    if(cur){const rk=squadRank(p,cur);
      if(kind==='loan'){if(!(rk>=11||p.age<=21||L.loanOk)){tk.st='Клуб не отпускает';tk.res=0;msg(ag.n,`${cur.n} против аренды`,`${b.n} готов взять вас в аренду, но ${cur.n} не отпускает: вы нужны команде. Попросите тренера об аренде — если он согласится, я закрою сделку.`);return;}}
      else if(!(p.listed||rk>=11||b.rep>=cur.rep+5&&rnd()<.65||rnd()<.25)){tk.st='Клуб не продаёт';tk.res=0;msg(ag.n,`${cur.n} не продаёт`,`${b.n} хочет вас подписать, но ${cur.n} отказался продавать. Попросите у тренера трансфер — тогда клуб станет сговорчивее.`);return;}}
    tk.st='Есть предложение';tk.res=1;
    if(kind==='loan')msg(b.n,`${b.n} предлагает аренду`,`${b.n} (${S.L[b.lg].name}) готов взять вас в аренду до конца сезона. Зарплату полностью платит ${b.n}.\n\nИгровая практика ускорит ваше развитие.`,'plof',{b:b.id});
    else{const fee=cur?Math.round(value(p)*(1.05+rnd()*.3)/1e5)*1e5:0;const wage=Math.round(Math.max(p.wage*1.15,wageFor(p,b.rep)*1.1)/100)*100;const yrs=p.age>30?2:ri(3,5);
      msg(b.n,`${b.n} хочет вас подписать`,`${ag.n} договорился с ${b.n} (${S.L[b.lg].name}).\n\nЗарплата: ${money(wage)} в неделю, контракт на ${yrs} ${plural(yrs,'год','года','лет')}.${fee?`\n${cur.n} получит ${money(fee)}.`:''}`,'pofr',{b:b.id,fee,wage,yrs});}
  });
  if(ag.tasks.length>12)ag.tasks.length=12;
}
const _dailyA=daily;daily=function(){_dailyA();try{agentDaily();}catch(e){console.error(e);}};
G.lLoan=function(id,ok){const m=S.inbox.find(x=>x.id===id);if(!m||m.done)return;const p=lgP();m.done=true;
  if(!ok){m.res='Вы отказались.';render();return;}const b=S.T[m.data.b];const cur=p.club>=0?S.T[p.club]:null;
  if(!cur||p.loan||!windowOpen(S.d)){m.res='Аренда сейчас невозможна.';render();return;}
  p.loan={from:cur.id,to:b.id,wp:1,w0:p.wage,ce0:p.ce,opt:0,at:S.abs};sign(p,b,Math.max(1,p.ce-S.year),p.wage);p.ce=p.loan.ce0;p.listed=false;LG().loanOk=false;
  news(`${p.n} отправляется в аренду в ${b.n}`,{p:p.id,t:[cur.id,b.id],k:'transfer'});m.res=`Вы в аренде в ${b.n} до конца сезона.`;
  S.inbox.forEach(x=>{if((x.type==='plof'||x.type==='pofr')&&!x.done){x.done=true;x.res='Вы выбрали другой вариант.';}});toast(m.res);save();render();};
const _vInboxA=vInbox;
vInbox=function(){let html=_vInboxA();const m=S.inbox.find(x=>x.id===UI.msg);
  if(m&&m.type==='plof'&&!m.done)html+=`<div class="panel row"><b>Уйти в аренду в ${esc(S.T[m.data.b].n)}?</b><button class="btn pri" onclick="G.lLoan(${m.id},true)">Согласиться</button><button class="btn" onclick="G.lLoan(${m.id},false)">Отказаться</button></div>`;return html;};
G.lAskLoan=function(){const p=lgP();const L=LG();const t=p.club>=0?S.T[p.club]:null;if(!t)return;
  if(p.loan){L.say='Вы уже в аренде.';return render();}const rk=squadRank(p,t);
  if(rk>=11||p.age<=21){L.loanOk=true;L.say=`${t.mgr}: «Хорошо, тебе нужна игровая практика. Пусть агент найдёт клуб — мы отпустим тебя в аренду».`;}
  else{L.loanOk=false;L.say=`${t.mgr}: «Нет, ты нужен мне здесь. Об аренде не может быть и речи».`;}render();};

function vAgent(){
  const p=lgP();const L=LG();const ag=agentOf();const cur=p.club>=0?S.T[p.club]:null;
  const af=UI.af=UI.af||{nat:cur?cur.nat:p.nat,lg:''};
  const nats=countries().sort((a,b)=>natName(a).localeCompare(natName(b),'ru'));
  const lgs=S.L.filter(x=>x.nat===af.nat).sort((a,b)=>a.tier-b.tier||a.grp-b.grp);if(!lgs.some(x=>String(x.i)===String(af.lg)))af.lg=lgs[0]?String(lgs[0].i):'';
  const Lg=S.L[+af.lg];const clubs=Lg?Lg.teams.map(id=>S.T[id]).sort((a,b)=>b.rep-a.rep):[];
  const ints=interested(p);const win=windowOpen(S.d);
  const bar=v=>`<span class="moodbar" style="display:inline-block;width:90px;vertical-align:middle"><i style="width:${Math.round(v*100)}%;background:${v>=.66?'var(--good)':v>=.36?'var(--warn)':'var(--bad)'}"></i></span>`;
  return `<div class="head"><div class="row" style="gap:14px"><span class="hs-user"><span class="ua">${IC.user}</span></span><div><h1>${esc(ag.n)}</h1><p class="mute">Ваш агент · ${win?'<span class="good">трансферное окно открыто</span>':'окно закрыто — переговоры начнутся, когда оно откроется'}</p></div></div></div>
  <div class="kpi"><div class="panel"><h3>Стоимость</h3><span class="big">${money(value(p))}</span></div><div class="panel"><h3>Клуб</h3><span class="big" style="font-size:18px">${cur?esc(cur.n):'Свободный агент'}</span>${p.loan?`<small class="mute"> · в аренде из ${esc(S.T[p.loan.from].n)}</small>`:''}</div><div class="panel"><h3>Контракт</h3><span class="big" style="font-size:18px">${cur?'до лета '+p.ce:'—'}</span></div><div class="panel"><h3>Статус</h3><span class="big" style="font-size:18px">${p.listed?'Хочу уйти':L.loanOk?'Готов к аренде':'Доволен'}</span></div></div>
  <div class="grid g2" style="align-items:start">
   <div class="panel"><h3 style="margin-bottom:8px">Разговор с тренером</h3><div class="row">${cur?`<button class="btn" onclick="G.lList()">${p.listed?'Остаться в клубе':'Попросить трансфер'}</button><button class="btn" onclick="G.lAskLoan()">Попросить аренду</button><button class="btn" onclick="G.lTalk()">Спросить о месте в составе</button>`:'<span class="mute">У вас нет клуба — агент может договориться с любым клубом в любое время.</span>'}</div>${L.say?`<p class="mute" style="font-size:13px;margin-top:8px">${esc(L.say)}</p>`:''}
    <h3 style="margin:16px 0 8px">Кто интересуется вами</h3>${ints.length?`<table class="t"><tbody>${ints.map(x=>{const t=S.T[x.t];return `<tr><td><div class="cell">${crest(t,20)}<span>${esc(t.n)}</span></div></td><td class="mute" style="font-size:12px">${esc(S.L[t.lg].name)}</td><td>${bar(x.v)}</td><td class="r"><button class="btn sm" onclick="G.agTask(${t.id},'buy')">Переговоры</button></td></tr>`;}).join('')}</tbody></table>`:'<p class="mute">Пока никто. Играйте лучше — скауты заметят.</p>'}</div>
   <div class="panel"><h3 style="margin-bottom:8px">Переговоры агента</h3>${ag.tasks.length?`<table class="t"><tbody>${ag.tasks.map((tk,i)=>{const t=S.T[tk.t];return `<tr><td><div class="cell">${crest(t,20)}<span>${esc(t.n)}</span></div></td><td class="mute" style="font-size:12px">${tk.kind==='loan'?'Аренда':'Трансфер'}</td><td class="${tk.res===1?'good':tk.res===0?'bad':'warn'}" style="font-size:13px">${esc(tk.st)}</td><td class="r">${tk.done?'':`<button class="btn sm" onclick="G.agCancel(${i})">Отменить</button>`}</td></tr>`;}).join('')}</tbody></table>`:'<p class="mute">Выберите клуб ниже — агент начнёт переговоры. Ответ придёт во «Входящие» через несколько дней.</p>'}</div>
  </div>
  <div class="panel"><h3 style="margin-bottom:8px">Где вы хотите играть?</h3>
   <div class="grid g2" style="gap:12px;max-width:640px"><label class="field">Страна<select onchange="UI.af.nat=this.value;UI.af.lg='';render()">${nats.map(n=>`<option value="${n}" ${n===af.nat?'selected':''}>${natName(n)}</option>`).join('')}</select></label>
    <label class="field">Лига<select onchange="UI.af.lg=this.value;render()">${lgs.map(x=>`<option value="${x.i}" ${String(x.i)===String(af.lg)?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label></div>
   <div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>Клуб</th><th>Уровень</th><th>Шансы на трансфер</th><th>Шансы на аренду</th><th></th></tr></thead><tbody>${clubs.map(t=>{const cb=chTxt(chanceFor(p,t,'buy')),cl=chTxt(chanceFor(p,t,'loan'));return `<tr class="${cur&&t.id===cur.id?'me':''}"><td><div class="cell">${crest(t,22)}<span>${esc(t.n)}</span></div></td><td>${stars(t.rep)}</td><td class="${cb[1]}">${cb[0]}</td><td class="${cl[1]}">${cur?cl[0]:'—'}</td><td class="r">${cur&&t.id===cur.id?'<span class="mute">ваш клуб</span>':`<button class="btn sm pri" onclick="G.agTask(${t.id},'buy')">Трансфер</button> ${cur?`<button class="btn sm" onclick="G.agTask(${t.id},'loan')">Аренда</button>`:''}`}</td></tr>`;}).join('')}</tbody></table></div>
   <p class="mute" style="font-size:12px;margin-top:8px">Шансы зависят от вашего уровня, формы и уровня клуба. Ваш клуб охотнее отпускает, если вы попросили трансфер или аренду у тренера.</p></div>`;
}
// переход из аренды: сначала игрок возвращается в свой клуб, и деньги за трансфер получает он
const _lOffA=G.lOffer;G.lOffer=function(id,ok){const p=lgP();const m=S.inbox.find(x=>x.id===id);if(ok&&p&&p.loan&&m&&!m.done&&windowOpen(S.d)){loanReturn(p);}_lOffA(id,ok);};
LVIEWS.splice(1,0,['lagent','Агент']);
const _rvA=renderView;renderView=function(){if(UI.view==='lagent'&&LG())return vAgent();return _rvA();};
// в «Моей карьере» — ссылка на агента и запрос аренды
const _vLegA=vLegend;
vLegend=function(){return _vLegA().replace('<button class="btn" onclick="G.lTalk()">Поговорить с тренером</button>','<button class="btn pri" onclick="G.go(\'lagent\')">Агент</button><button class="btn" onclick="G.lTalk()">Поговорить с тренером</button><button class="btn" onclick="G.lAskLoan()">Попросить аренду</button>');};
