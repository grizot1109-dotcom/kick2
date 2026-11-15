'use strict';
/* ===== KICK: несколько карьер, строгость совета, переговоры (клуб → игрок), свободные агенты, скауты и карта мира ===== */

/* ---------- строгость руководства ---------- */
const BOARD=[
  {n:'Без увольнений',d:'Совет никогда вас не уволит, можно спокойно строить команду.',thr:-1,mult:.5,end:null},
  {n:'Терпеливое',d:'Увольнение только после очень долгого провала.',thr:4,mult:.75,end:[6,20]},
  {n:'Обычное',d:'Стандартные требования: результаты должны соответствовать задачам.',thr:10,mult:1,end:[3,35]},
  {n:'Строгое',d:'Совет требует результата здесь и сейчас и быстро теряет терпение.',thr:20,mult:1.35,end:[1,50]}];
const boardOf=()=>BOARD[S.user&&S.user.strict!=null?S.user.strict:2];

/* ---------- несколько карьер ---------- */
async function listSaves(){
  let l=null;try{l=await idbGet('list');}catch(e){}
  if(!l){l=[];try{const s=await idbGet('main'),m=await idbGet('meta');if(s&&m){const id='c'+Date.now().toString(36);await idbSet('c:'+id,s);l=[{...m,id,ts:Date.now()}];await idbDel('main');await idbDel('meta');}await idbSet('list',l);}catch(e){}}
  return l.sort((a,b)=>b.ts-a.ts);
}
async function save(){
  if(!S||!S.user||saving)return;saving=true;
  try{if(!S.cid)S.cid='c'+Date.now().toString(36)+ri(100,999);
    await idbSet('c:'+S.cid,pack());const ut=userTeam();
    const l=(await listSaves()).filter(x=>x.id!==S.cid);
    l.unshift({id:S.cid,name:S.user.name,club:ut?ut.n:'без клуба',crest:ut&&ut.crest||null,season:season(),date:fmtDate(S.d),strict:S.user.strict,ts:Date.now()});
    await idbSet('list',l);UI.saves=l;
  }catch(e){toast('Не удалось сохранить в браузере — сохраните карьеру в файл');}
  saving=false;
}
async function getMeta(){const l=await listSaves();UI.saves=l;return l[0]||null;}
function vLoad(){
  const l=UI.saves||[];
  return `<div class="title"><div class="title-in narrow"><button class="btn back" onclick="G.scr('title')">‹ Главное меню</button><h1>Загрузить карьеру</h1>
   ${l.length?`<div class="saves">${l.map(s=>`<div class="panel sv"><div class="sv-c">${s.crest?`<img class="crest" src="${esc(s.crest)}" width="48" height="48" alt="" onerror="this.onerror=null;this.src='${CREST_FB}'">`:`<span class="trophy" style="width:48px;height:48px"></span>`}</div>
     <div class="sv-t"><b>${esc(s.club)}</b><small>${esc(s.name)} · сезон ${esc(s.season)} · ${esc(s.date||'')}</small><small class="mute">Совет: ${BOARD[s.strict!=null?s.strict:2].n.toLowerCase()} · сохранено ${new Date(s.ts).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small></div>
     <div class="row">${UI.confirm==='del:'+s.id?`<button class="btn bad" onclick="G.delSave('${s.id}')">Удалить</button><button class="btn" onclick="UI.confirm=null;render()">Отмена</button>`:`<button class="btn pri" onclick="G.load('${s.id}')">Играть</button><button class="btn" onclick="UI.confirm='del:${s.id}';render()" aria-label="Удалить карьеру">Удалить</button>`}</div></div>`).join('')}</div>`
   :`<div class="panel"><p>Сохранённых карьер пока нет.</p><div class="row" style="margin-top:10px"><button class="btn pri" onclick="G.scr('newcareer')">Новая карьера</button></div></div>`}
   <p class="mute" style="font-size:13px">Есть файл сохранения? <label class="lnk" for="ldf2">Импортировать из файла</label><input type="file" id="ldf2" accept=".json,application/json" onchange="G.importSave(this)" hidden></p>
  </div></div>`;
}

/* ---------- знание об игроке: точные цифры только у своих и проверенных скаутами ---------- */
function knowAcc(p){
  const ut=userTeam();if(ut&&p.club===ut.id)return 1;const r=S.known&&S.known[p.id];if(r)return r;
  if(ut&&p.club>=0&&S.T[p.club]&&S.T[p.club].lg===ut.lg)return .6;
  if(ut&&p.club>=0&&S.T[p.club]&&S.T[p.club].nat===ut.nat)return .45;
  if(p.club>=0&&S.T[p.club]&&S.T[p.club].rep>=85)return .45;return .25;
}
function aRange(p,i){const v=p.a[i];const acc=knowAcc(p);if(acc>=.95)return [v,v];const w=Math.round((1-acc)*7);if(w<=0)return [v,v];
  const h=hash(p.id*53+i)%(w+1);const lo=clamp(v-h,1,20);return [lo,clamp(lo+w,1,20)];}
const aTxt=(p,i)=>{const [lo,hi]=aRange(p,i);return lo===hi?String(lo):lo+'–'+hi;};
const aMid=(p,i)=>{const [lo,hi]=aRange(p,i);return Math.round((lo+hi)/2);};
const potStars=v=>{const s=clamp(Math.round((v-6)/2.6*2)/2,.5,5);return `<span class="stars" style="--v:${s/5*100}%" title="${s} из 5">★★★★★</span>`;};

/* ---------- переговоры: сначала клуб, затем игрок ---------- */
const ROLES=['Ключевой игрок','Игрок основы','Игрок ротации','Запасной','Перспективный игрок'];
const ROLEV=[0,1,2,3,2.5];
function expRole(p,t){const others=t.pl.filter(id=>id!==p.id).map(id=>ca(S.P[id]));const c=ca(p);const r=others.filter(x=>x>c).length;
  if(r<3)return 0;if(r<11)return 1;if(r<17)return 2;return p.age<=21?4:3;}
function dealOf(pid){S.deals=S.deals||{};return S.deals[pid];}
function newDeal(p,kind){
  const ut=userTeam();S.deals=S.deals||{};
  const d={p:p.id,kind,st:kind==='buy'?'club':'player',fee:0,sell:0,inst:0,pat:4,ppat:4,log:[],role:expRole(p,ut),yrs:p.age>31?2:p.age>28?3:4,bonus:0,wage:0,ask:0,at:S.abs};
  if(kind==='buy'){d.req=askPrice(p);d.ask=Math.round(d.req*1.12/1e5)*1e5;d.fee=Math.round(value(p)*.9/1e5)*1e5;}
  d.pask=playerNeed(p,ut,d);d.wage=Math.round(d.pask.w*.9/100)*100;d.bonus=d.pask.b;
  S.deals[p.id]=d;return d;
}
function clubReq(d,p){return d.req*(1-d.sell/100*.6)*(d.inst?1.06:1);}
function clubRespond(d,p){
  const ut=userTeam();const sel=S.T[p.club];const say=(t,k)=>d.log.push({w:sel.n,t,k:k||''});
  if(!windowOpen(S.d)){say('Трансферное окно закрыто. Вернёмся к разговору, когда оно откроется.','warn');return;}
  const up=d.inst?d.fee*.4:d.fee;if(up>ut.tb){say(`Сумма превышает ваш трансферный бюджет (${money(ut.tb)}).`,'warn');return;}
  const unh=unhappy(p),riv=isRival(sel.id,ut.id),rk=squadRank(p,sel);
  let req=clubReq(d,p);if(riv&&unh)req*=1.5;
  if(riv&&!unh){d.st='fail';d.until=S.abs+180;say(`${sel.n} не продаёт игроков ${ut.n}. Об этом не может быть и речи.`,'bad');return;}
  const free=unh||p.listed;const key=!free&&rk<5,core=!free&&rk<11&&sel.rep>ut.rep-8;
  // большой клуб из другой страны: иногда клуб готов обсуждать даже звезду, но за огромные деньги
  const abroad=key&&sel.rep>ut.rep-10&&ut.nat!==sel.nat&&ut.rep>=sel.rep-3;if(abroad&&d.wl==null)d.wl=rnd()<.3;
  if(key&&(sel.rep<=ut.rep-10||(abroad&&d.wl)))req*=abroad?1.6:1.45;else if(core||key)req*=1.3; // за ключевых и основу — большая наценка
  if(key&&sel.rep>ut.rep-10&&!(abroad&&d.wl)){d.pat-=2;say(`${p.n} — один из ключевых игроков ${sel.n}. Он не продаётся.`,'bad');}
  else if((key||core)&&d.fee<req*.99){d.pat--;d.ask=Math.max(d.ask,Math.round(req/1e5)*1e5);say(`${p.n} — ${key?'лидер':'игрок основного состава'} ${sel.n}, и мы не ищем ему замену. Говорить будем только от ${money(d.ask)}.`,'warn');}
  else if(d.fee>=Math.min(d.ask,req*1.25)*.99&&d.fee>=req*.99||d.fee>=req&&rnd()<.55){d.st='player';d.ppat=4;
    say(`Мы принимаем предложение: ${money(d.fee)}${d.sell?`, ${d.sell}% от будущей продажи`:''}${d.inst?', оплата частями':''}. Можете начинать переговоры с игроком.`,'good');return;}
  else if(d.fee<req*.6){d.pat-=2;say(`Это предложение даже нельзя назвать серьёзным. Игрок стоит гораздо дороже.`,'bad');}
  else{d.pat--;d.ask=Math.max(Math.round(req/1e5)*1e5,Math.round((d.ask-(d.ask-d.fee)*.3)/1e5)*1e5);say(`Нас это не устраивает. Готовы отпустить игрока за ${money(d.ask)}.`,'warn');}
  if(d.pat<=0){d.st='fail';d.until=S.abs+30;say(`${sel.n} прекращает переговоры. Вернуться к ним можно не раньше чем через месяц.`,'bad');}
}
function playerNeed(p,t,d){
  let w=askWage(p,t,d.kind==='renew');const er=expRole(p,t);const diff=ROLEV[d.role]-ROLEV[er];
  w*=1+.08*diff;if(d.kind==='free')w*=1.05;
  const b=d.kind==='free'?Math.round(w*12/1e3)*1e3:d.kind==='renew'?0:Math.round(w*4/1e3)*1e3;
  return {w:Math.round(w/100)*100,b,er,diff};
}
function playerRespond(d,p){
  const ut=userTeam();const say=(t,k)=>d.log.push({w:p.n,t,k:k||''});const need=playerNeed(p,ut,d);d.pask=need;
  if(d.kind==='buy'&&(!windowOpen(S.d)||p.club<0||p.club===ut.id)){d.st='fail';say('Сделка невозможна: трансферное окно закрыто или ситуация с игроком изменилась.','bad');return;}
  if(d.kind!=='renew'&&p.club>=0&&ut.rep<S.T[p.club].rep-25&&!(d.role===0&&d.wage>=need.w*1.5)){d.st='fail';d.until=S.abs+60;say(`Мой клиент не видит себя в ${ut.n}: уровень клуба ниже, чем у его нынешней команды.`,'bad');return;}
  if(need.diff>=1.5){d.ppat--;say(`Игрок рассчитывает на статус не ниже «${ROLES[need.er].toLowerCase()}».`,'warn');}
  else{
    const credit=d.bonus>need.b?(d.bonus-need.b)/(52*d.yrs)*.8:-(need.b-d.bonus)/(52*d.yrs);
    const yrsPen=p.age>=30&&d.yrs<2?1.06:p.age<=23&&d.yrs>=5?1.03:1;
    const req=need.w*yrsPen-credit;
    if(wageBill(ut)-(d.kind==='renew'?p.wage:0)+d.wage>ut.wb){say(`Совет директоров не одобрит: фонд зарплат превысит бюджет (${money(ut.wb)} в неделю).`,'warn');return;}
    if(d.kind!=='renew'&&d.bonus>Math.max(0,ut.tb-(d.inst?d.fee*.4:d.fee))){say('Подъёмные не помещаются в трансферный бюджет.','warn');return;}
    if(d.wage>=req*.97||(d.cw&&d.wage>=d.cw*.99&&d.bonus>=(d.cb||0)&&d.yrs>=(d.cy||0))){finishDeal(d,p);return;}
    d.ppat--;const cw=Math.round(Math.max(req,d.wage*1.05)/100)*100;const cb=d.kind==='renew'?0:Math.max(need.b,d.bonus);
    d.cw=cw;d.cb=cb;d.cy=d.yrs;d.wage=cw;d.bonus=cb;
    say(`Агент: «Нас устроит ${money(cw)} в неделю${cb?` и подъёмные ${money(cb)}`:''}»${yrsPen>1?(p.age>=30?'. Игрок хотел бы контракт хотя бы на 2 года — тогда будет дешевле.':'. На 5 лет игрок соглашается только за большие деньги.'):''}`,'warn');
  }
  if(d.ppat<=0){d.st='fail';d.until=S.abs+30;say('Агент игрока прекращает переговоры.','bad');}
}
function finishDeal(d,p){
  const ut=userTeam();const say=(t,k)=>d.log.push({w:p.n,t,k:k||''});d.st='done';
  if(d.kind==='renew'){p.wage=d.wage;p.ce=S.year+d.yrs;p.prom=d.role;p.mor=clamp(p.mor+8,10,100);say(`${p.n} подписал новый контракт до лета ${p.ce}.`,'good');save();return;}
  const sel=p.club>=0?S.T[p.club]:null;
  doTransfer(p,ut,d.fee,d.yrs,d.wage);p.ce=S.year+d.yrs;p.prom=d.role;
  if(d.inst&&d.fee){const later=Math.round(d.fee*.6);ut.bal+=later;ut.tb+=later;ut.debt=(ut.debt||0)+later;}
  if(d.sell&&sel)p.sellon={club:sel.id,pct:d.sell};
  if(d.bonus){ut.bal-=d.bonus;ut.tb=Math.max(0,ut.tb-d.bonus);}
  say(`Сделка завершена! ${p.n} — игрок ${ut.n}.`,'good');
  msg('Трансферный отдел',`${p.n} подписал контракт`,`${p.n} стал игроком ${ut.n}${d.fee?' за '+money(d.fee):' на правах свободного агента'}.\nЗарплата: ${money(d.wage)} в неделю, контракт до лета ${p.ce}.\nСтатус: ${ROLES[d.role].toLowerCase()}.${d.bonus?`\nПодъёмные: ${money(d.bonus)}.`:''}${d.inst?`\nОстаток ${money(Math.round(d.fee*.6))} будет списан в конце сезона.`:''}`);
  save();
}
// ответы приходят через 1–3 дня: обрабатывается каждый день, результат — письмом во «Входящие»
function dealsDaily(){
  if(!S.deals||!userTeam())return;
  for(const k in S.deals){const d=S.deals[k];if(!d.pend||S.abs<d.wait)continue;const p=S.P[d.p];if(!p){delete S.deals[k];continue;}
    const stage=d.pend;d.pend=null;const n0=d.log.length;
    if(stage==='club'){if(p.club<0||p.club===userTeam().id){d.st='fail';continue;}clubRespond(d,p);}else playerRespond(d,p);
    const last=d.log.slice(n0).map(x=>x.t).join('\n');const who=stage==='club'?(p.club>=0?S.T[p.club].n:'Клуб'):`Агент игрока ${p.n}`;
    const title=d.st==='done'?`Сделка завершена: ${p.n}`:d.st==='fail'?`Переговоры по ${p.n} сорваны`:stage==='club'&&d.st==='player'?`${who} принял предложение по ${p.n}`:`Ответ: ${p.n}`;
    if(d.st!=='done')msg(who,title,`${last}\n\nОткройте профиль игрока, чтобы продолжить переговоры.`,'deal',{p:p.id});
  }
}
function negHTML(p){
  const d=dealOf(p.id);if(!d)return '';
  if(d.pend){const left=Math.max(1,d.wait-S.abs);const log=d.log.slice(-6).map(x=>`<div class="nlog ${x.k}"><b>${esc(x.w)}:</b> ${esc(x.t)}</div>`).join('');
    return `<div class="neg"><h3>${d.pend==='club'?'Клуб рассматривает предложение':'Игрок и агент изучают контракт'}</h3><div class="nlogs">${log}</div><p class="mute">Ответ придёт во «Входящие» примерно через ${left} ${plural(left,'день','дня','дней')}. Нажмите «Продолжить», чтобы пошли дни.</p><div class="row"><button class="btn" onclick="G.dealDrop()">Отозвать предложение</button></div></div>`;}const ut=userTeam();const sel=p.club>=0?S.T[p.club]:null;
  const log=d.log.slice(-6).map(x=>`<div class="nlog ${x.k}"><b>${esc(x.w)}:</b> ${esc(x.t)}</div>`).join('');
  const steps=d.kind==='buy'?`<div class="nsteps"><span class="${d.st==='club'?'on':'ok'}">1. Клуб${sel?' · '+esc(sel.n):''}</span><span class="${d.st==='player'?'on':d.st==='done'?'ok':''}">2. Игрок и агент</span></div>`:'';
  let form='';
  if(d.st==='club'){
    form=`<div class="grid g3" style="gap:10px"><label class="field">Сумма трансфера, млн €<input id="nf" type="number" step="0.1" min="0" value="${(d.fee/1e6).toFixed(1)}"></label>
     <label class="field">% от следующей продажи<select id="ns">${[0,5,10,15,20,25,30].map(v=>`<option value="${v}" ${d.sell===v?'selected':''}>${v?v+'%':'нет'}</option>`).join('')}</select></label>
     <label class="field">Оплата<select id="ni"><option value="0" ${!d.inst?'selected':''}>Сразу</option><option value="1" ${d.inst?'selected':''}>Частями: 40% сейчас, 60% в конце сезона</option></select></label></div>
     <p class="mute" style="font-size:12px">Оценочная стоимость: ${money(value(p))}. Процент от перепродажи снижает запрос клуба, оплата частями — немного повышает. Терпение клуба: ${'●'.repeat(Math.max(0,d.pat))}${'○'.repeat(Math.max(0,4-d.pat))}</p>
     <div class="row"><button class="btn pri" onclick="G.dealClub()">Отправить предложение клубу</button><button class="btn" onclick="G.dealDrop()">Выйти из переговоров</button></div>`;
  }else if(d.st==='player'){
    form=`<div class="grid g3" style="gap:10px"><label class="field">Зарплата, тыс. € в неделю<input id="nw" type="number" step="0.1" min="0" value="${(d.wage/1e3).toFixed(1)}"></label>
     <label class="field">Срок контракта<select id="ny">${[1,2,3,4,5].map(y=>`<option value="${y}" ${d.yrs===y?'selected':''}>${y} ${plural(y,'год','года','лет')}</option>`).join('')}</select></label>
     <label class="field">Статус в команде<select id="nr">${ROLES.map((r,i)=>`<option value="${i}" ${d.role===i?'selected':''}>${r}</option>`).join('')}</select></label>
     ${d.kind!=='renew'?`<label class="field">Подъёмные, тыс. €<input id="nb" type="number" step="1" min="0" value="${Math.round(d.bonus/1e3)}"></label>`:''}</div>
     <p class="mute" style="font-size:12px">Игрок ждёт статус «${ROLES[d.pask.er].toLowerCase()}». Обещанный статус надо выполнять: без игрового времени мораль падает. Подъёмные снижают запросы по зарплате. Терпение агента: ${'●'.repeat(Math.max(0,d.ppat))}${'○'.repeat(Math.max(0,4-d.ppat))}</p>
     <div class="row"><button class="btn pri" onclick="G.dealPlayer()">Предложить контракт</button><button class="btn" onclick="G.dealDrop()">Выйти из переговоров</button></div>`;
  }else if(d.st==='fail')form=`<p class="bad">Переговоры сорваны.${d.until>S.abs?` Повторить можно через ${d.until-S.abs} дн.`:''}</p>`;
  return `<div class="neg"><h3>${d.kind==='renew'?'Новый контракт':d.kind==='free'?'Контракт со свободным агентом':'Трансфер'}</h3>${steps}${log?`<div class="nlogs">${log}</div>`:''}${form}</div>`;
}

/* ---------- скауты ---------- */
const SC_FIRST=['Алан','Мигель','Томас','Жоао','Ханс','Пьер','Луис','Джеймс','Сергей','Марко','Ахмед','Кенджи','Диего','Ян','Фабио','Олег'];
const SC_LAST=['Брукс','Перейра','Мюллер','Дюваль','Санчес','Росси','Коваль','Тейлор','Ямада','Беккер','Сильва','Новак','Ибрагимов','Вуд','Гарсия','Фернандес'];
function genScout(lv){const jud=clamp(Math.round(lv+gauss()*2),3,20),pot=clamp(Math.round(lv+gauss()*2),3,20),exp=clamp(Math.round(lv+gauss()*2.5),2,20);
  const q=(jud+pot+exp)/3;return {id:S.nid++,n:pick(SC_FIRST)+' '+pick(SC_LAST),age:ri(32,64),jud,pot,exp,wage:Math.round(300*Math.exp(.18*q)/100)*100,fee:Math.round(4000*Math.exp(.22*q)/1e3)*1e3,task:null};}
function scoutMarket(){if(!S.scm||S.scm.at+30<=S.abs){S.scm={at:S.abs,list:Array.from({length:6},(_,i)=>genScout(6+i*2.2+rnd()*2))};}return S.scm.list;}
const scStars=s=>{const v=clamp(Math.round(((s.jud+s.pot+s.exp)/3-3)/17*10)/2,.5,5);return `<span class="stars" style="--v:${v/5*100}%" title="${v} из 5">★★★★★</span>`;};
const SC_POS={any:'Любые позиции',GK:'Вратари',DF:'Защитники',MF:'Полузащитники',FW:'Нападающие'};
const SC_AGE={any:'Любой возраст',u21:'До 21 года',prime:'22–29 лет',exp:'30 лет и старше'};
const SC_FOCUS={talent:'Таланты с потенциалом',ready:'Готовые игроки',cheap:'Недорогие и свободные'};
const POSG={GK:['GK'],DF:['DL','DC','DR'],MF:['DM','ML','MC','MR','AMC'],FW:['AML','AMR','ST']};
function scoutsWeek(){
  const ut=userTeam();if(!S.scouts||!S.scouts.length)return;
  if(ut){const w=S.scouts.reduce((s,x)=>s+x.wage,0);ut.bal-=w;}
  if(!PIDS)PIDS=Object.keys(S.P);
  S.scouts.forEach(sc=>{const tk=sc.task;if(!tk)return;
    const found=[];const n=poisson(.55+sc.exp*.045);
    const okP=p=>p&&(!ut||p.club!==ut.id)&&!(S.known&&S.known[p.id]>=.9)&&(tk.pos==='any'||POSG[tk.pos].includes(p.pos))&&(tk.age==='any'||(tk.age==='u21'?p.age<=21:tk.age==='prime'?p.age>=22&&p.age<=29:p.age>=30))&&(p.club<0?p.nat===tk.c:(S.T[p.club].nat===tk.c||p.nat===tk.c));
    for(let k=0;k<n;k++){
      if(tk.focus==='talent'&&tk.age!=='exp'&&rnd()<.12+sc.exp*.008){ // находка в академиях и низших лигах
        const pos=tk.pos==='any'?pick(SQUAD):pick(POSG[tk.pos]);const p=genPlayer(5+rnd()*3,pos,ri(16,18),tk.c);p.pa=clamp(10+sc.pot*.25+gauss()*2+rnd()*2,ca(p)+2,20);p.wage=600;p.yt=1;S.P[p.id]=p;PIDS.push(String(p.id));found.push(p);continue;}
      let best=null,bv=-1e9;
      for(let j=0;j<500;j++){const p=S.P[PIDS[Math.floor(rnd()*PIDS.length)]];if(!okP(p)||found.includes(p))continue;
        const est=(tk.focus==='talent'?(p.pa-(p.age-17)*.15):tk.focus==='cheap'?ca(p)-value(p)/2e6-(p.club<0?-2:0):ca(p))+gauss()*(21-sc.jud)*.08;if(est>bv){bv=est;best=p;}}
      if(best)found.push(best);
    }
    found.forEach(p=>{S.known=S.known||{};S.known[p.id]=Math.max(S.known[p.id]||0,clamp(.55+sc.jud*.022,.6,.98));
      const pe=p.pa+gauss()*(21-sc.pot)*.12,ce=ca(p)+gauss()*(21-sc.jud)*.08;
      S.reps=S.reps||[];S.reps.unshift({p:p.id,s:sc.id,sn:sc.n,c:tk.c,d:fmtDate(S.d),ca:ce,pa:Math.max(pe,ce),rec:pe>=15.5?'A':pe>=13?'B':'C'});});
    if(S.reps&&S.reps.length>120)S.reps.length=120;
    tk.found+=found.length;
    if(found.length)msg(`Скаут ${sc.n}`,`${natName(tk.c)}: ${found.length} ${plural(found.length,'новый игрок','новых игрока','новых игроков')}`,`Отчёты по найденным игрокам:\n${found.map(p=>`• ${p.n} (${PR[p.pos]}, ${p.age} лет, ${p.club>=0?S.T[p.club].n:'без клуба'})`).join('\n')}\n\nВсе отчёты — в разделе «Трансферы» → «Отчёты скаутов».`);
    if(S.abs>=tk.until){msg(`Скаут ${sc.n}`,`Командировка завершена: ${natName(tk.c)}`,`Поездка окончена, найдено игроков: ${tk.found}. Скаут ждёт нового задания.`);sc.task=null;}
  });
}
function promisesWeek(){const ut=userTeam();if(!ut)return;ut.pl.forEach(id=>{const p=S.P[id];if(!p||p.prom==null||p.prom>1||p.inj>0)return;
  if(p.lastAp==null||S.abs-p.lastAp>21){p.mor=clamp(p.mor-4,10,100);if(!p.promWarn&&p.mor<45){p.promWarn=true;msg(p.n,'Обещание не выполнено',`${p.n} напоминает, что подписывал контракт как «${ROLES[p.prom].toLowerCase()}», но почти не играет. Игрок недоволен.`);}}else p.promWarn=false;});}

/* ---------- карта мира ---------- */
const GEO={ENG:[52.5,-1.5],ESP:[40,-3.7],ITA:[42.8,12.5],GER:[51,10.4],FRA:[46.6,2.4],NED:[52.2,5.5],POR:[39.6,-8],RUS:[56,38],TUR:[39,35],BEL:[50.6,4.6],SCO:[56.6,-4],WAL:[52.3,-3.7],NIR:[54.6,-6.7],IRL:[53.2,-8],
  AUT:[47.6,14.1],SUI:[46.8,8.2],GRE:[39.3,22],UKR:[49,31.5],CZE:[49.8,15.5],DEN:[56,9.5],CRO:[45.3,16],SRB:[44,20.8],POL:[52,19.4],SWE:[60.5,15],NOR:[61,9],FIN:[62.5,26],ISL:[64.9,-18.5],HUN:[47.1,19.4],ROU:[45.9,24.9],
  BUL:[42.7,25.4],SVK:[48.7,19.6],SVN:[46.1,14.9],BIH:[44.2,17.8],MNE:[42.7,19.3],MKD:[41.6,21.7],ALB:[41.1,20.1],KOS:[42.6,20.9],GEO:[42.2,43.5],ARM:[40.2,45],AZE:[40.3,47.7],KAZ:[48,67],BLR:[53.7,28],MDA:[47.2,28.5],
  ISR:[31.4,35],CYP:[35,33.2],LUX:[49.8,6.1],EST:[58.7,25.5],LVA:[56.9,24.6],LTU:[55.3,23.9],BRA:[-10,-52],ARG:[-34.5,-64],URU:[-32.8,-56],COL:[4,-73],CHI:[-33,-71],ECU:[-1.5,-78.3],PAR:[-23.4,-58.4],PER:[-9.2,-75],
  BOL:[-16.7,-64.7],VEN:[7,-66],USA:[39,-98],MEX:[23.6,-102.5],CAN:[52,-100],CRC:[9.9,-84],PAN:[8.5,-80],JAM:[18.1,-77.3],HON:[14.8,-86.6],HAI:[19,-72.5],CUW:[12.2,-69],SLV:[13.7,-88.9],GUA:[15.6,-90.3],SUR:[4,-56],
  TRI:[10.5,-61.3],JPN:[36.5,138.5],KOR:[36.4,127.9],KSA:[24,45],QAT:[25.3,51.2],UAE:[24,54],IRN:[32.5,54],IRQ:[33,43.7],AUS:[-25,134],CHN:[35,104],UZB:[41.4,64.6],JOR:[31.2,36.5],SYR:[35,38.5],OMA:[21,57],BHR:[26,50.5],
  KUW:[29.3,47.6],IDN:[-2.5,118],THA:[15.5,101],VIE:[16,107],PLE:[31.9,35.2],LBN:[33.9,35.8],TJK:[38.8,71],KGZ:[41.4,74.7],IND:[22,79],MAR:[31.8,-7],SEN:[14.5,-14.5],NGA:[9.1,8.7],EGY:[26.8,30.8],CIV:[7.5,-5.5],
  CMR:[5.7,12.4],GHA:[7.9,-1],ALG:[28,2.6],TUN:[34,9.5],MLI:[17.6,-3.9],RSA:[-29,25],COD:[-2.9,23.6],BFA:[12.2,-1.6],GUI:[10.4,-10.9],CPV:[15.1,-23.6],GAB:[-.8,11.6],ANG:[-12.3,17.5],ZAM:[-13.1,27.8],BEN:[9.3,2.3],
  GAM:[13.4,-15.4],GNB:[12,-15],EQG:[1.6,10.4],TOG:[8.6,.8],MTN:[20,-10.5],MOZ:[-18.6,35.5],UGA:[1.4,32.3],KEN:[.2,37.9],TAN:[-6.4,34.9],ZIM:[-19,29.2],LBY:[26.3,17.2],SDN:[15.5,30],MAD:[-19,46.9],COM:[-11.9,43.9],
  CGO:[-.7,15.2],SLE:[8.5,-11.8],NZL:[-41.5,172.5]};
const MAPV={world:[0,0,1000,389],eu:[440,40,150,95],sa:[260,180,170,190],af:[400,120,250,210],as:[560,40,380,230],na:[60,30,330,200]};
const MAPN={world:'Весь мир',eu:'Европа',sa:'Южная Америка',na:'Северная Америка',af:'Африка',as:'Азия и Океания'};
function mapXY(c){const g=GEO[c];if(!g||!window.KICK_MAP)return null;const M_=window.KICK_MAP;return [(g[1]+180)*M_.k,(M_.lat0-g[0])*M_.k];}
let CSTAT=null;
function countryStats(){if(CSTAT&&CSTAT.at===S.abs)return CSTAT.m;const m={};S.T.forEach(t=>{const x=m[t.nat]=m[t.nat]||{clubs:0,pl:0,nat:0};x.clubs++;x.pl+=t.pl.length;});
  for(const id in S.P){const p=S.P[id];const x=m[p.nat]=m[p.nat]||{clubs:0,pl:0,nat:0};x.nat++;}CSTAT={at:S.abs,m};return m;}
function worldMap(sel){
  if(!window.KICK_MAP)return '<p class="mute">Нет данных карты (data/map.js).</p>';
  const v=MAPV[UI.mapv||'world'];const st=countryStats();const busy=new Set((S.scouts||[]).filter(s=>s.task).map(s=>s.task.c));
  const r=(UI.mapv||'world')==='world'?4:Math.max(1.2,v[2]/120);
  const dots=Object.keys(S.N).filter(c=>GEO[c]).map(c=>{const [x,y]=mapXY(c);const s=st[c]||{clubs:0,nat:0};const big=s.clubs>0;
    return `<g class="mdot ${c===sel?'sel':''} ${busy.has(c)?'busy':''} ${big?'lg':''}" onclick="G.mapPick('${c}')" tabindex="0" role="button" aria-label="${esc(natName(c))}" onkeydown="if(event.key==='Enter')G.mapPick('${c}')"><circle class="hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r*2.4).toFixed(2)}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(big?r*1.25:r*.85).toFixed(2)}"/><title>${esc(natName(c))}${big?` · клубов в игре: ${s.clubs}`:''} · игроков этой страны: ${s.nat}</title></g>`;}).join('');
  const lbl=sel&&mapXY(sel)?(()=>{const [x,y]=mapXY(sel);return `<text class="mlbl" x="${x.toFixed(1)}" y="${(y-r*2.2).toFixed(1)}" font-size="${(r*3).toFixed(1)}">${esc(natName(sel))}</text>`;})():'';
  return `<div class="maptabs">${Object.entries(MAPN).map(([k,n])=>`<button class="${(UI.mapv||'world')===k?'on':''}" onclick="UI.mapv='${k}';render()">${n}</button>`).join('')}</div>
   <div class="wmap"><svg viewBox="${v.join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Карта мира: выберите страну"><path class="land" d="${window.KICK_MAP.land}"/>${dots}${lbl}</svg></div>
   <p class="mute" style="font-size:12px">Крупные точки — страны с лигами в игре, мелкие — страны, где скаут ищет игроков своей национальности. Оранжевым отмечены страны, где уже работают ваши скауты.</p>`;
}
function vScouts(){
  const ut=userTeam();S.scouts=S.scouts||[];const mk=scoutMarket();const sc=S.scouts.find(x=>x.id===UI.scSel)||null;
  const card=s=>`<div class="scard ${sc&&sc.id===s.id?'on':''}"><div class="row" style="justify-content:space-between"><b>${esc(s.n)}</b>${scStars(s)}</div>
    <dl class="kv"><dt>Оценка способностей</dt><dd>${s.jud}</dd><dt>Оценка потенциала</dt><dd>${s.pot}</dd><dt>Опыт и связи</dt><dd>${s.exp}</dd><dt>Зарплата</dt><dd>${money(s.wage)} / нед.</dd></dl>`;
  let assign='';
  if(sc){const tk=UI.sct=UI.sct||{c:null,pos:'any',age:'any',focus:'talent',m:2};
    assign=sc.task?`<div class="panel"><h3>${esc(sc.n)}: в командировке</h3><p style="margin-top:6px">${esc(natName(sc.task.c))} · ${SC_POS[sc.task.pos].toLowerCase()} · ${SC_AGE[sc.task.age].toLowerCase()} · ${SC_FOCUS[sc.task.focus].toLowerCase()}</p><p class="mute" style="margin-top:4px">Найдено игроков: ${sc.task.found}. Вернётся ${fmtDate(S.d+(sc.task.until-S.abs))}.</p><div class="row" style="margin-top:10px"><button class="btn" onclick="G.scRecall()">Отозвать</button></div></div>`
    :`<div class="panel grid" style="gap:12px"><h3>Задание для ${esc(sc.n)}</h3>${worldMap(tk.c)}
      <div class="grid g2" style="gap:10px"><div class="field">Страна<b style="font-size:16px">${tk.c?esc(natName(tk.c)):'Выберите точку на карте'}</b></div>
       <label class="field">Позиции<select onchange="UI.sct.pos=this.value">${Object.entries(SC_POS).map(([k,v])=>`<option value="${k}" ${tk.pos===k?'selected':''}>${v}</option>`).join('')}</select></label>
       <label class="field">Возраст<select onchange="UI.sct.age=this.value">${Object.entries(SC_AGE).map(([k,v])=>`<option value="${k}" ${tk.age===k?'selected':''}>${v}</option>`).join('')}</select></label>
       <label class="field">Кого искать<select onchange="UI.sct.focus=this.value">${Object.entries(SC_FOCUS).map(([k,v])=>`<option value="${k}" ${tk.focus===k?'selected':''}>${v}</option>`).join('')}</select></label>
       <label class="field">Срок<select onchange="UI.sct.m=+this.value">${[1,2,3,6].map(m=>`<option value="${m}" ${tk.m===m?'selected':''}>${m} ${plural(m,'месяц','месяца','месяцев')}</option>`).join('')}</select></label></div>
      <div class="row"><button class="btn pri" ${tk.c?'':'disabled'} onclick="G.scSend()">Отправить скаута</button></div></div>`;}
  return `<div class="grid g2" style="align-items:start">
   <div class="panel"><h3 style="margin-bottom:8px">Ваши скауты · ${S.scouts.length} из 4</h3>${S.scouts.length?S.scouts.map(s=>`<button class="sbtn ${sc&&sc.id===s.id?'on':''}" onclick="UI.scSel=${s.id};render()">${card(s)}<small class="${s.task?'acc':'mute'}">${s.task?'Работает: '+esc(natName(s.task.c)):'Свободен — нажмите, чтобы дать задание'}</small></div></button>`).join(''):'<p class="mute">Скаутов пока нет. Наймите их на рынке справа.</p>'}
    ${sc?`<div class="row" style="margin-top:8px">${UI.confirm==='fire'?`<button class="btn bad" onclick="G.scFire()">Уволить ${esc(sc.n)}</button><button class="btn" onclick="UI.confirm=null;render()">Отмена</button>`:`<button class="btn sm" onclick="UI.confirm='fire';render()">Уволить выбранного</button>`}</div>`:''}</div>
   <div class="panel"><h3 style="margin-bottom:8px">Рынок скаутов</h3><p class="mute" style="font-size:12px;margin-bottom:8px">Оценка способностей — точность текущих характеристик в отчётах, оценка потенциала — точность прогноза, опыт — сколько игроков скаут находит. Список обновляется раз в месяц.</p>
    ${mk.map(s=>`<div class="scard">${card(s).slice(card(s).indexOf('>')+1)}<div class="row" style="justify-content:space-between;margin-top:6px"><span class="mute" style="font-size:12px">Подписание: ${money(s.fee)}</span><button class="btn sm pri" ${S.scouts.length>=4||!ut?'disabled':''} onclick="G.scHire(${s.id})">Нанять</button></div></div>`).join('')}</div>
  </div>${assign}`;
}
function vReports(){
  const reps=(S.reps||[]).filter(r=>S.P[r.p]);
  if(!reps.length)return '<div class="panel mute">Отчётов пока нет. Наймите скаута и отправьте его в командировку во вкладке «Скауты».</div>';
  return `<div class="panel tw" style="padding:6px"><table class="t"><thead><tr><th>Игрок</th><th>Поз.</th><th class="r">Возр.</th><th>Клуб</th><th>Сейчас</th><th>Потенциал</th><th>Оценка</th><th class="r">Стоимость</th><th>Скаут</th></tr></thead><tbody>${reps.map(r=>{const p=S.P[r.p];return `<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,26)}<span>${esc(p.n)}</span></div></td><td><span class="pos">${PR[p.pos]}</span></td><td class="r num">${p.age}</td><td><div class="cell">${p.club>=0?crest(S.T[p.club],18)+'<span>'+esc(S.T[p.club].n)+'</span>':'<span class="acc">Свободный агент</span>'}</div></td><td>${potStars(r.ca)}</td><td>${potStars(r.pa)}</td><td><span class="grade g${r.rec}">${r.rec}</span></td><td class="r num">${money(value(p))}</td><td class="mute" style="font-size:12px">${esc(r.sn)} · ${esc(natName(r.c))}<br>${esc(r.d)}</td></tr>`;}).join('')}</tbody></table></div>`;
}
function vDeals(){
  const ds=Object.values(S.deals||{}).filter(d=>S.P[d.p]&&(d.st==='club'||d.st==='player'||(d.st!=='done'&&S.abs-d.at<40)));
  if(!ds.length)return '<div class="panel mute">Активных переговоров нет. Откройте профиль игрока и нажмите «Сделать предложение».</div>';
  return `<div class="panel tw" style="padding:6px"><table class="t"><tbody>${ds.map(d=>{const p=S.P[d.p];return `<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,26)}<span>${esc(p.n)}</span></div></td><td class="mute">${p.club>=0?esc(S.T[p.club].n):'Свободный агент'}</td><td>${d.st==='club'?'Переговоры с клубом':d.st==='player'?'Переговоры с игроком':d.st==='fail'?'<span class="bad">Сорваны</span>':'<span class="good">Завершены</span>'}</td><td class="mute" style="font-size:12px">${d.log.length?esc(d.log[d.log.length-1].t):''}</td></tr>`;}).join('')}</tbody></table></div>`;
}

/* ---------- раздел «Трансферы» с вкладками ---------- */
const vTransfersSearch=vTransfers;
const TTABS=[['search','Поиск игроков'],['fa','Свободные агенты'],['deals','Переговоры'],['scouts','Скауты'],['reps','Отчёты скаутов']];
vTransfers=function(){
  const tab=UI.trt||'search';const ut=userTeam();const nd=Object.values(S.deals||{}).filter(d=>d.st==='club'||d.st==='player').length;
  if(tab==='fa'){UI.f.nat='fa';}else if(tab==='search'&&UI.f.nat==='fa')UI.f.nat='';
  const head=`<div class="subtabs">${TTABS.map(([k,l])=>`<button class="${tab===k?'on':''}" onclick="UI.trt='${k}';render()">${l}${k==='deals'&&nd?` <span class="badge">${nd}</span>`:''}${k==='reps'&&S.reps&&S.reps.length?` <span class="mute">${S.reps.length}</span>`:''}</button>`).join('')}</div>`;
  if(tab==='scouts')return head+`<div class="head"><div><h1>Скауты</h1><p class="mute">${ut?`Баланс клуба ${money(ut.bal)}`:''}</p></div></div>`+vScouts();
  if(tab==='reps')return head+`<div class="head"><h1>Отчёты скаутов</h1></div>`+vReports();
  if(tab==='deals')return head+`<div class="head"><h1>Переговоры</h1></div>`+vDeals();
  return head+vTransfersSearch();
};
// в списке поиска — характеристики с учётом знаний (диапазоны)
function keyColsK(p){return ROLE[POS_ROLE[p.pos]].slice().sort((a,b)=>b[1]-a[1]).slice(0,3).map(([i])=>`<span title="${AL[i]}" class="num ${acls(aMid(p,i))}">${AL[i].slice(0,4)} ${aTxt(p,i)}</span>`).join(' · ');}

/* ---------- действия ---------- */
Object.assign(G,{
  async load(id){try{const l=await listSaves();const e=id?l.find(x=>x.id===id):l[0];if(!e)return toast('Сохранение не найдено');const s=await idbGet('c:'+e.id);S=unpack(s);S.cid=e.id;afterLoad();M=null;UI.view='home';UI.screen='game';UI.confirm=null;render();}catch(err){toast('Не удалось загрузить сохранение');}},
  async delSave(id){try{await idbDel('c:'+id);const l=(await listSaves()).filter(x=>x.id!==id);await idbSet('list',l);UI.saves=l;UI.saved=l[0]||null;}catch(e){}UI.confirm=null;render();},
  async newGame(){await save();S=null;M=null;UI.confirm=null;UI.saved=await getMeta();UI.screen='title';render();},
  async scr(s){UI.screen=s;UI.confirm=null;if(s==='pickclub'){const nn=document.getElementById('nsn');if(nn)UI.ns.name=nn.value;}if(s==='load'||s==='title'){UI.saved=await getMeta();}render();window.scrollTo(0,0);},
  importSave(inp){const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const o=unpack(r.result);if(!o.user||!o.T||o.v!==2)throw 0;S=o;S.cid='c'+Date.now().toString(36)+ri(100,999);afterLoad();M=null;await save();UI.view='home';UI.screen='game';UI.msg=null;render();toast('Карьера загружена');}catch(e){toast('Файл не похож на сохранение KICK');}};r.readAsText(f);},
  neg(type){const p=S.P[UI.modalP];const ut=userTeam();if(!ut)return;const old=dealOf(p.id);
    if(old&&old.st==='fail'&&old.until>S.abs){toast('Переговоры сорваны, попробуйте позже');renderModal();return;}
    if(!old||old.st==='done'||old.st==='fail'||old.kind!==type)newDeal(p,type);renderModal();},
  dealClub(){const p=S.P[UI.modalP];const d=dealOf(p.id);d.fee=Math.round((+document.getElementById('nf').value||0)*1e6);d.sell=+document.getElementById('ns').value;d.inst=+document.getElementById('ni').value;
    const ut=userTeam();if((d.inst?d.fee*.4:d.fee)>ut.tb){toast(`Сумма превышает трансферный бюджет (${money(ut.tb)})`);return;}
    d.pend='club';d.wait=S.abs+ri(1,3);d.log.push({w:'Вы',t:`Предложение: ${money(d.fee)}${d.sell?`, ${d.sell}% от перепродажи`:''}${d.inst?', оплата частями':''}.`,k:''});renderModal();render();},
  dealPlayer(){const p=S.P[UI.modalP];const d=dealOf(p.id);d.wage=Math.round((+document.getElementById('nw').value||0)*1e3);d.yrs=+document.getElementById('ny').value;d.role=+document.getElementById('nr').value;const nb=document.getElementById('nb');d.bonus=nb?Math.round((+nb.value||0)*1e3):0;
    d.pend='player';d.wait=S.abs+ri(1,d.kind==='renew'?2:3);d.log.push({w:'Вы',t:`Контракт: ${money(d.wage)} в неделю, ${d.yrs} ${plural(d.yrs,'год','года','лет')}, ${ROLES[d.role].toLowerCase()}${d.bonus?`, подъёмные ${money(d.bonus)}`:''}.`,k:''});renderModal();render();},
  dealDrop(){const p=S.P[UI.modalP];if(S.deals)delete S.deals[p.id];renderModal();},
  bidCounter(id){const m=S.inbox.find(x=>x.id===id);if(!m||m.done)return;const p=S.P[m.data.p];const b=S.T[m.data.b];if(!p||!b)return;
    const want=Math.round(m.data.fee*1.25/1e5)*1e5;m.data.cnt=(m.data.cnt||0)+1;
    if(want<=value(p)*1.6&&want<=b.tb&&rnd()<.6-.2*(m.data.cnt-1)){m.data.fee=want;m.body+=`\n\n${b.n} соглашается поднять сумму до ${money(want)}.`;toast(`${b.n} готов заплатить ${money(want)}`);}
    else{m.done=true;m.res=`${b.n} отказался повышать сумму и вышел из переговоров.`;}render();},
  mapPick(c){UI.sct=UI.sct||{pos:'any',age:'any',focus:'talent',m:2};UI.sct.c=c;render();},
  scHire(id){const ut=userTeam();const mk=scoutMarket();const s=mk.find(x=>x.id===id);if(!s||!ut)return;if((S.scouts||[]).length>=4)return toast('Максимум 4 скаута');
    ut.bal-=s.fee;S.scouts.push(s);S.scm.list=mk.filter(x=>x!==s);UI.scSel=s.id;toast(`${s.n} нанят`);render();},
  scFire(){S.scouts=S.scouts.filter(x=>x.id!==UI.scSel);UI.scSel=null;UI.confirm=null;render();},
  scSend(){const sc=S.scouts.find(x=>x.id===UI.scSel);const tk=UI.sct;if(!sc||!tk||!tk.c)return;sc.task={c:tk.c,pos:tk.pos,age:tk.age,focus:tk.focus,until:S.abs+tk.m*30,found:0};toast(`${sc.n} отправился: ${natName(tk.c)}`);render();},
  scRecall(){const sc=S.scouts.find(x=>x.id===UI.scSel);if(sc)sc.task=null;render();},
});
