'use strict';
/* ===== KICK 2 «Стань легендой»: ключевые моменты матчей, жизнь вне поля, отношения с тренером и командой ===== */
function L3(){const L=LG();if(!L)return null;if(!L.rel)L.rel={coach:55,team:55};if(L.cash==null){const p=lgP();L.cash=Math.round((p?p.wage:1000)*8);L.fol=Math.round(1500+(p?value(p)/1000:0));L.own=[];L.spons=[];L.play=true;}return L;}

/* ---------- отношения: тренер может убрать из состава ---------- */
const _bestXI3=bestXI;
bestXI=function(t,slots,pre){
  const L=LG();const p=lgP();if(!L||!p||!L.rel||p.club!==t.id||L.rel.coach>=35)return _bestXI3(t,slots,pre);
  const thr=(35-L.rel.coach)/35*.8;const roll=(hash(S.d+':'+p.id)%100)/100;if(roll>=thr)return _bestXI3(t,slots,pre);
  const sus=p.sus;p.sus=1;try{return _bestXI3(t,slots,pre);}finally{p.sus=sus;}
};
function relWeek(){
  const L=L3();const p=lgP();if(!L||!p||L.done)return;const R=L.rel;
  const recent=p.lastAp!=null&&S.abs-p.lastAp<10;
  if(recent&&p.form.length){const r=p.form[p.form.length-1];R.coach=clamp(R.coach+(r-6.7)*3,0,100);}
  if(p.listed)R.coach=clamp(R.coach-.6,0,100);
  R.coach+=(55-R.coach)*.03;R.team+=(55-R.team)*.04;p.mor=clamp(p.mor+(R.team-50)*.04,10,100);
  if(R.coach<25&&!L.coachWarn){L.coachWarn=true;msg('Помощник тренера','Тренер вами недоволен',`Главный тренер всё чаще оставляет вас вне состава. Тренируйтесь больше и не провоцируйте его — иначе придётся искать новый клуб.`);}
  if(R.coach>40)L.coachWarn=false;
}
G.lRel=function(k){const L=L3();const p=lgP();const R=L.rel;L.cd=L.cd||{};if(L.cd[k]&&S.abs<L.cd[k])return toast(`Можно снова через ${L.cd[k]-S.abs} дн.`);
  if(k==='train'){R.coach=clamp(R.coach+4,0,100);p.cond=Math.max(40,p.cond-15);L.cd[k]=S.abs+7;L.say='Вы остались после тренировки. Тренер это заметил.';}
  else if(k==='dinner'){if(L.cash<5000)return toast('Не хватает денег');L.cash-=5000;R.team=clamp(R.team+7,0,100);L.cd[k]=S.abs+14;L.say='Ужин с командой прошёл отлично — партнёры стали ближе.';}
  else if(k==='support'){R.team=clamp(R.team+3,0,100);L.cd[k]=S.abs+7;L.say='Вы поддержали партнёра в соцсетях. Команда это оценила.';}
  else if(k==='complain'){R.coach=clamp(R.coach-10,0,100);L.cd[k]=S.abs+21;if(rnd()<.3){L.say='Тренер вызвал вас на разговор и пообещал больше шансов.';R.coach=clamp(R.coach+6,0,100);}else L.say='Тренер не оценил жалобы в прессе. Отношения испорчены.';}
  render();};

/* ---------- ключевые моменты матча ---------- */
const avgOf=(p,keys)=>keys.reduce((s,k)=>s+p.a[A[k]],0)/keys.length;
function chanceP(p,keys,opp,bonus){return clamp(.16+(avgOf(p,keys)-8)*.045+(ca(p)-clubLvl(opp))*.03+(bonus||0),.05,.9);}
const MOMS={
  box:{t:['Мяч отскакивает к вам в штрафной.','Вы получаете пас на линии штрафной, защитник не успевает.','Навес с фланга — мяч опускается прямо к вам.'],o:[['shot','Удар',['fin','cmp','tec'],0],['pass','Отдать партнёру',['pas','vis','dec'],.06],['drib','Обвести защитника',['dri','agi','tec'],-.04]]},
  far:{t:['Вы с мячом в 25 метрах от ворот, перед вами пространство.','Подбор у штрафной — мяч у вас.'],o:[['long','Удар издали',['lon','tec'],-.1],['pass','Пас в разрез',['pas','vis'],0],['keep','Сохранить мяч',['fir','cmp'],.25]]},
  run:{t:['Контратака! Вы убегаете по флангу.','Партнёр выводит вас на скорость.'],o:[['sprint','Рывок к воротам',['pac','acc','dri'],-.02],['pass','Пас в центр',['cro','pas'],.04],['keep','Притормозить',['fir','dec'],.25]]},
  def:{t:['Нападающий соперника идёт на вас один на один.','Соперник пытается пройти по вашему флангу.','Опасный пас в штрафную — вы ближе всех.'],o:[['tack','Отбор',['tck','bra'],0],['int','Перехват',['ant','pos','cnt'],0],['foul','Тактический фол',['agg'],.35]]},
  gk:{t:['Удар в упор!','Соперник бьёт с пенальти-отметки!','Выход один на один!'],o:[['gl','Прыгнуть влево',['ref','agi'],0],['gr','Прыгнуть вправо',['ref','agi'],0],['gc','Остаться в центре',['ref','pos'],0]]}};
function genMoments(p,f){
  const t=S.T[p.club];const opp=S.T[f.h===p.club?f.a:f.h];const pos=p.pos;
  const pool=pos==='GK'?['gk']:['DC','DL','DR'].includes(pos)?['def','def','far','run']:pos==='DM'?['def','far','box']:['MC','ML','MR'].includes(pos)?['far','box','run','def']:['box','box','run','far'];
  const n=pos==='GK'?3:['ST','AMC','AML','AMR'].includes(pos)?ri(4,5):ri(3,4);
  const mins=Array.from({length:n},()=>ri(3,88)).sort((a,b)=>a-b);
  return {f:S.F.indexOf(f),opp:opp.id,i:0,list:mins.map(m=>{const k=pick(pool);return {m,k,txt:pick(MOMS[k].t)};}),log:[],g:0,a:0,ga:0,d:0,yc:0,rc:0,end:false,day:S.d};
}
function momOpts(p,mo,opp){const L=L3();const tb=(L.rel.team-50)*.003;return MOMS[mo.k].o.map(([k,l,keys,b])=>({k,l,p:mo.k==='gk'?clamp(.18+(avgOf(p,keys)-8)*.035,.08,.6):chanceP(p,keys,opp,b+(k==='pass'?tb:0)+(mo.boost||0))}));}
G.lMom=function(k){
  const L=L3();const p=lgP();const mm=L.mm;if(!mm||mm.end)return;const mo=mm.list[mm.i];const opp=S.T[mm.opp];const opt=momOpts(p,mo,opp).find(o=>o.k===k);if(!opt)return;
  const ok=rnd()<opt.p;let r='',cls='';
  const goal=()=>{mm.g++;mm.d+=1;r='ГОЛ! Вы забиваете!';cls='good';};
  if(mo.k==='gk'){const right=pick(['gl','gr','gc']);if(k===right||ok&&rnd()<.5){mm.d+=.5;r='Сейв! Вы спасаете команду.';cls='good';}else{mm.ga++;mm.d-=.4;r='Гол в ваши ворота.';cls='bad';}}
  else if(k==='shot'||k==='long'||k==='sprint'){if(ok)goal();else{mm.d-=.1;r=pick(['Вратарь отбивает.','Мимо ворот!','Удар блокирует защитник.']);cls='mute';}}
  else if(k==='pass'){if(ok){if(rnd()<.5){mm.a++;mm.d+=.6;r='Отличный пас — партнёр забивает! Голевая передача.';cls='good';}else{mm.d+=.15;r='Отличный пас, но партнёр не реализовал момент.';}}else{mm.d-=.15;r='Пас перехвачен.';cls='bad';}}
  else if(k==='drib'){if(ok){mm.d+=.2;r='Вы обыграли защитника!';cls='good';mm.list.splice(mm.i+1,0,{m:mo.m,k:'box',txt:'Защитник позади — вы один перед вратарём!',boost:.15});}else{mm.d-=.2;r='Защитник отбирает мяч.';cls='bad';}}
  else if(k==='keep'){if(ok){mm.d+=.12;r='Вы сохранили мяч, команда перевела дух.';}else{mm.d-=.15;r='Потеря мяча.';cls='bad';}}
  else if(k==='tack'||k==='int'){if(ok){mm.d+=.3;r=k==='tack'?'Чистый отбор!':'Перехват! Атака соперника сорвана.';cls='good';}else if(rnd()<.5){mm.ga++;mm.d-=.6;r='Соперник прошёл и забил.';cls='bad';}else{mm.d-=.2;r='Соперник прошёл, но не забил.';}}
  else if(k==='foul'){if(mm.yc&&rnd()<.5){mm.rc=1;mm.d-=1.5;r='Вторая жёлтая — вы удалены!';cls='bad';mm.end=true;}else if(rnd()<.55){mm.yc=1;mm.d+=.05;r='Фол остановил атаку, но вы получили жёлтую.';cls='warn';}else{mm.d+=.1;r='Фол остановил атаку, судья ограничился предупреждением.';}}
  mm.log.push({m:mo.m,txt:mo.txt,ch:opt.l,r,cls});mm.i++;if(mm.i>=mm.list.length)mm.end=true;render();
};
G.lMomAuto=function(){const L=L3();const p=lgP();const mm=L.mm;if(!mm)return;let g=0;while(!mm.end&&g++<20){const mo=mm.list[mm.i];const o=momOpts(p,mo,S.T[mm.opp]).sort((a,b)=>b.p-a.p)[0];G.lMom(o.k);}};
G.lMomEnd=function(){const L=L3();const mm=L.mm;if(!mm||!mm.end)return;L.mres=mm;L.md=S.d;L.mm=null;UI.view='lhome';G.cont();};
G.lMomToggle=function(){const L=L3();L.play=!L.play;render();};
function legendFx(p){for(const i of (BYDAY[S.d]||[])){const f=S.F[i];if(f.hg==null&&!f.nt&&(f.h===p.club||f.a===p.club))return f;}return null;}
const _processDayL=processDay;
processDay=function(){
  const L=L3();const p=lgP();
  if(L&&p&&!L.done&&L.play!==false&&p.club>=0&&L.md!==S.d){
    if(L.mm&&L.mm.day===S.d){UI.view='lmatch';S.stop=true;return;}
    const f=legendFx(p);if(f&&lineupOf(S.T[p.club]).includes(p.id)){L.mm=genMoments(p,f);UI.view='lmatch';S.stop=true;return;}
  }
  _processDayL();
};
const _applyResL=applyRes;
applyRes=function(f,res,live){
  const L=LG();const p=lgP();const mm=L&&L.mres;
  if(mm&&p&&f.d===mm.day&&S.F[mm.f]===f&&(f.h===p.club||f.a===p.club)){
    const side=f.h===p.club?'h':'a',os=side==='h'?'a':'h';const sd=res[side],od=res[os];
    if(sd&&od){if(!sd.played.includes(p.id))sd.played.push(p.id);
      for(let i=0;i<mm.g;i++)sd.g.push(p.id);
      for(let i=0;i<mm.a;i++){const mates=sd.played.filter(id=>id!==p.id&&S.P[id]&&S.P[id].pos!=='GK');if(mates.length){sd.g.push(pick(mates));sd.as.push(p.id);}}
      for(let i=0;i<mm.ga;i++){const op=od.played.filter(id=>S.P[id]&&S.P[id].pos!=='GK');if(op.length)od.g.push(pick(op));}
      const add=mm.g+mm.a;if(side==='h'){res.hg+=add;res.ag+=mm.ga;}else{res.ag+=add;res.hg+=mm.ga;}
      if(res.pen&&res.hg!==res.ag&&!f.leg)res.pen=null;
      if(mm.yc)sd.yc.push(p.id);if(mm.rc)sd.rc.push(p.id);
      const gf=side==='h'?res.hg:res.ag,ga=side==='h'?res.ag:res.hg;
      sd.rat[p.id]=Math.round(clamp(6.4+mm.d+(gf>ga?.3:gf<ga?-.2:0),4.5,10)*10)/10;
      const o=S.T[side==='h'?f.a:f.h];
      L.lastRes={h:f.h,a:f.a,hg:res.hg,ag:res.ag,c:compOfFx(f).name,g:mm.g,as:mm.a,r:sd.rat[p.id],d:fmtShort(f.d)};
      L.fol=Math.round((L.fol||0)+growBy(L,p,mm.g*900+mm.a*400+(sd.rat[p.id]>=8?1500:0)));}
    L.mres=null;
  }
  _applyResL(f,res,live);
};
function vLMatch(){
  const L=L3();const p=lgP();const mm=L.mm;if(!mm)return vLegend();const f=S.F[mm.f];const opp=S.T[mm.opp];const H=S.T[f.h],Aw=S.T[f.a];
  const mo=mm.end?null:mm.list[mm.i];const opts=mo?momOpts(p,mo,opp):[];
  return `<div class="row" style="gap:10px">${logo(compOfFx(f).id,28)}<b>${esc(compOfFx(f).name)}</b><span class="mute">${esc(f.r||'')}</span></div>
  <div class="panel score"><div class="side">${crest(H,48)}<b>${esc(H.n)}</b></div><div class="res">${mm.g+mm.a}<small style="font-size:13px">ваши голы и передачи</small><small>${mm.ga?`пропущено по вашей вине: ${mm.ga}`:'ключевые моменты'}</small></div><div class="side r"><b>${esc(Aw.n)}</b>${crest(Aw,48)}</div></div>
  ${mo?`<div class="panel htalk"><div class="row" style="justify-content:space-between"><h3>${mo.m}′ · момент ${mm.i+1} из ${mm.list.length}</h3><span class="mute" style="font-size:12px">${avatar(p,22)} ${esc(p.n)}</span></div><h2 style="margin:10px 0 14px;text-transform:none;letter-spacing:0">${esc(mo.txt)}</h2>
    <div class="talks">${opts.map(o=>`<button class="tbtn" onclick="G.lMom('${o.k}')"><b>${o.l}</b><small>Шанс успеха: ${Math.round(o.p*100)}%</small><span class="moodbar" style="margin-top:4px"><i style="width:${Math.round(o.p*100)}%;background:${o.p>=.55?'var(--good)':o.p>=.3?'var(--warn)':'var(--bad)'}"></i></span></button>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn sm" onclick="G.lMomAuto()">Сыграть остальное автоматически</button></div></div>`
  :`<div class="panel"><h3>Ваши моменты сыграны</h3><p style="margin:8px 0">Голы: <b>${mm.g}</b> · передачи: <b>${mm.a}</b>${mm.rc?' · <span class="bad">удаление</span>':''}</p><button class="btn pri" onclick="G.lMomEnd()">Доиграть матч и узнать счёт</button></div>`}
  ${mm.log.length?`<div class="panel feed">${mm.log.slice().reverse().map(e=>`<div class="ev"><span class="m">${e.m}′</span><span class="t">${esc(e.txt)} <b>${esc(e.ch)}</b> — <span class="${e.cls}">${esc(e.r)}</span></span></div>`).join('')}</div>`:''}`;
}

/* ---------- жизнь вне поля ---------- */
const ITEMS=[
  ['car1','Машины','Хэтчбек',2e4,0,1.02,''],['car2','Машины','Спорткар',2.5e5,500,1.08,''],['car3','Машины','Гиперкар',2.5e6,3000,1.18,''],
  ['h1','Дом','Квартира в центре',3e5,800,1.03,''],['h2','Дом','Дом с бассейном',1.5e6,3000,1.08,''],['h3','Дом','Вилла на побережье',8e6,12000,1.2,''],
  ['gym','Для формы','Домашний спортзал',6e4,200,1,'Силы восстанавливаются быстрее'],['chef','Для формы','Личный повар',2e4,4000,1,'Травмы проходят быстрее'],['coach','Для формы','Личный тренер',3e4,3000,1,'Быстрее прогрессируете'],
  ['watch','Стиль','Коллекционные часы',4e4,0,1.04,''],['yacht','Стиль','Яхта',5e6,15000,1.25,''],['jet','Стиль','Частный самолёт',2e7,40000,1.35,'']];
const owns=k=>{const L=LG();return L&&L.own&&L.own.includes(k);};
const SPB=['Velo Sport','Nimbus Boots','Aqua Fizz','Strata Watches','Pulse Energy','Orion Mobile','Kite Fashion','Zephyr Cars','Lumen Bank','Ember Games'];
const brandLv=f=>clamp(Math.floor(Math.log10(Math.max(10,f))*2-5),1,10);
function lifeWeek(){
  const L=L3();const p=lgP();if(!L||!p||L.done)return;
  const up=ITEMS.filter(i=>owns(i[0])).reduce((s,i)=>s+i[4],0);const sp=(L.spons||[]).filter(s=>s.until>=S.year).reduce((s,x)=>s+x.amt,0);
  L.cash+=Math.round(p.wage*.55)+sp-up;L.wInc=Math.round(p.wage*.55)+sp-up;
  const mult=ITEMS.filter(i=>owns(i[0])).reduce((m,i)=>m*i[5],1);
  L.fol=Math.round(L.fol+growBy(L,p,(value(p)/1e6*30+p.st.g*12+(p.nt?400:0)+L.fol*.004)*mult));
  // старые сохранения: подписчики и рекламные контракты возвращаются в разумные рамки
  const cap=fameCap(p,L);if(L.fol>cap*1.05)L.fol=Math.round(cap);
  (L.spons||[]).forEach(s=>{const fair=Math.round(L.fol*.012*1.3/100)*100;if(s.amt>fair)s.amt=Math.max(500,fair);});
  if(owns('coach')&&p.age<=30&&rnd()<.25)bump(p,1,L.train==='bal'?null:L.train);
  if(L.cash<0&&!L.debtWarn){L.debtWarn=true;msg('Финансовый советник','Вы в минусе',`Расходы на содержание имущества больше доходов. Продайте что-нибудь или найдите спонсоров.`);}if(L.cash>=0)L.debtWarn=false;
  const d=dateOf(S.d);const act=(L.spons||[]).filter(s=>s.until>=S.year);
  if(d.getDate()<=7&&act.length<4&&L.fol>=8000&&rnd()<.6&&!S.inbox.some(m=>m.type==='lspon'&&!m.done)){
    const amt=Math.round(L.fol*.012*(.8+rnd()*.5)/100)*100;const n=pick(SPB.filter(x=>!act.some(s=>s.n===x)));
    msg(n,`Рекламный контракт: ${n}`,`Компания ${n} предлагает вам стать лицом бренда.\n\n${money(amt)} в неделю до лета ${S.year+2}.`,'lspon',{n,amt,until:S.year+1});}
}
G.lSpon=function(id,ok){const m=S.inbox.find(x=>x.id===id);if(!m||m.done)return;m.done=true;const L=L3();if(!ok){m.res='Вы отказались.';render();return;}L.spons.push({n:m.data.n,amt:m.data.amt,until:m.data.until});m.res=`Контракт с ${m.data.n} подписан.`;toast(m.res);render();};
G.lBuy=function(k){const L=L3();const it=ITEMS.find(i=>i[0]===k);if(!it||owns(k))return;if(L.cash<it[3])return toast('Не хватает денег');L.cash-=it[3];L.own.push(k);L.fol=Math.round(L.fol*(1+(it[5]-1)*.5));toast(`Куплено: ${it[2]}`);render();};
G.lSell=function(k){const L=L3();const it=ITEMS.find(i=>i[0]===k);if(!it||!owns(k))return;L.own=L.own.filter(x=>x!==k);L.cash+=Math.round(it[3]*.6);toast(`Продано за ${money(Math.round(it[3]*.6))}`);render();};
const POSTS={train:['Видео с тренировки','Подписчики +, тренер доволен'],life:['Лайфстайл','Много подписчиков; если играете плохо — тренер злится'],team:['Фото с командой','Партнёры ценят'],charity:['Благотворительность','−20 тыс. €, растёт репутация'],provoke:['Провокационный пост','Хайп, но тренер и команда недовольны']};
const postCd=L=>L.postAt!=null&&S.abs-L.postAt<7;
// известность ограничивает число подписчиков: звездой соцсетей становятся через игру
function fameCap(p,L){return Math.round(2e4+value(p)/1e6*1.5e5+(L.aw||[]).length*2e6+(L.tro||[]).length*3e5+(p.car?p.car.g:0)*2e3);}
const growBy=(L,p,add)=>{const cap=fameCap(p,L);return Math.max(0,add*Math.max(.02,1-L.fol/cap));};
G.lPost=function(k){const L=L3();const p=lgP();if(postCd(L))return toast(`Следующий пост через ${7-(S.abs-L.postAt)} дн.`);const R=L.rel;const f=L.fol;let add=0;
  if(k==='charity'&&L.cash<2e4)return toast('Не хватает денег');
  L.postAt=S.abs;
  if(k==='train'){add=f*.02+300;R.coach=clamp(R.coach+2,0,100);}else if(k==='life'){add=f*.05+600;if((perfOf(p)||0)<0)R.coach=clamp(R.coach-4,0,100);}
  else if(k==='team'){add=f*.015+200;R.team=clamp(R.team+4,0,100);}else if(k==='charity'){L.cash-=2e4;add=f*.04+500;p.mor=clamp(p.mor+5,10,100);}
  else{add=f*.12+1500;R.coach=clamp(R.coach-7,0,100);R.team=clamp(R.team-4,0,100);}
  add=growBy(L,p,add);L.fol=Math.round(f+add);L.say=`Пост «${POSTS[k][0]}»: +${Math.round(add).toLocaleString('ru-RU')} подписчиков.`;render();};
const fmtK=n=>n>=1e6?(n/1e6).toFixed(1).replace('.',',')+' млн':n>=1e3?Math.round(n/1e3)+' тыс.':String(n);
function lifeFix(L,p){const cap=fameCap(p,L);if(L.fol>cap*1.05)L.fol=Math.round(cap);(L.spons||[]).forEach(s=>{const fair=Math.round(L.fol*.012*1.3/100)*100;if(s.amt>fair)s.amt=Math.max(500,fair);});}
function vLife(){
  const L=L3();const p=lgP();lifeFix(L,p);const act=(L.spons||[]).filter(s=>s.until>=S.year);const cd=postCd(L);
  const cats=[...new Set(ITEMS.map(i=>i[1]))];
  return `<div class="head"><div><h1>Жизнь вне поля</h1><p class="mute">Деньги, имущество, спонсоры и соцсети</p></div></div>
  <div class="kpi"><div class="panel"><h3>Личный счёт</h3><span class="big ${L.cash<0?'bad':''}">${money(L.cash)}</span></div><div class="panel"><h3>Доход в неделю</h3><span class="big">${money(L.wInc!=null?L.wInc:Math.round(p.wage*.55))}</span><small class="mute"> после налогов и расходов</small></div><div class="panel"><h3>Подписчики</h3><span class="big">${fmtK(L.fol)}</span></div><div class="panel"><h3>Личный бренд</h3><span class="lvl" style="margin-top:8px">${[1,2,3,4,5,6,7,8,9,10].map(i=>`<i class="${i<=brandLv(L.fol)?'on':''}"></i>`).join('')}</span></div></div>
  <div class="grid g2" style="align-items:start"><div class="panel"><h3 style="margin-bottom:8px">Соцсети</h3><div class="talks">${Object.entries(POSTS).map(([k,[n,d]])=>`<button class="tbtn" ${cd?'disabled':''} onclick="G.lPost('${k}')"><b>${n}</b><small>${d}</small></button>`).join('')}</div><p class="mute" style="font-size:12px;margin-top:8px">${cd?`Следующий пост через ${7-(S.abs-L.postAt)} дн.`:'Один пост в неделю.'} ${L.say?esc(L.say):''}</p></div>
   <div class="panel"><h3 style="margin-bottom:6px">Спонсоры · ${act.length} из 4</h3>${act.length?act.map(s=>`<div class="fin-row"><span><b>${esc(s.n)}</b><br><small class="mute">до лета ${s.until+1}</small></span><span class="num">${money(s.amt)} / нед.</span></div>`).join(''):'<p class="mute">Спонсоры появятся, когда наберётся 8 тыс. подписчиков. Больше подписчиков — дороже контракты.</p>'}</div></div>
  <div class="panel"><h3 style="margin-bottom:8px">Покупки</h3>${cats.map(c=>`<h3 style="margin:10px 0 6px;font-size:12px">${c}</h3>${ITEMS.filter(i=>i[1]===c).map(i=>{const o=owns(i[0]);return `<div class="upg"><span><b>${i[2]}</b>${o?' <span class="pill ok">Ваше</span>':''}<small>${money(i[3])}${i[4]?` · содержание ${money(i[4])} в неделю`:''}${i[6]?' · '+i[6]:i[5]>1?' · растёт популярность':''}</small></span>${o?`<button class="btn sm" onclick="G.lSell('${i[0]}')">Продать за ${money(Math.round(i[3]*.6))}</button>`:`<button class="btn sm ${L.cash>=i[3]?'pri':''}" ${L.cash<i[3]?'disabled':''} onclick="G.lBuy('${i[0]}')">Купить</button>`}</div>`;}).join('')}`).join('')}</div>`;
}
const _dailyL3=daily;daily=function(){_dailyL3();const L=LG();const p=lgP();if(!L||!p||!L.own)return;if(owns('gym')&&p.cond<100)p.cond=Math.min(100,p.cond+1);if(owns('chef')&&p.inj>1&&rnd()<.2)p.inj--;};
const _weeklyL3=weekly;weekly=function(){_weeklyL3();try{relWeek();lifeWeek();}catch(e){console.error(e);}};
const _vInboxL3=vInbox;vInbox=function(){let html=_vInboxL3();const m=S.inbox.find(x=>x.id===UI.msg);if(m&&m.type==='lspon'&&!m.done)html+=`<div class="panel row"><b>Подписать контракт с ${esc(m.data.n)}?</b><button class="btn pri" onclick="G.lSpon(${m.id},true)">Подписать</button><button class="btn" onclick="G.lSpon(${m.id},false)">Отказаться</button></div>`;return html;};

/* ---------- экраны ---------- */
LVIEWS.splice(LVIEWS.findIndex(v=>v[0]==='lagent')+1,0,['llife','Жизнь']);
const _rvL3=renderView;renderView=function(){if(LG()){if(UI.view==='llife')return vLife();if(UI.view==='lmatch')return vLMatch();}return _rvL3();};
const _renderL3=render;
render=function(){
  const L=LG();if(L&&UI.screen==='game'){const has=LVIEWS.findIndex(v=>v[0]==='lmatch');if(L.mm&&has<0)LVIEWS.unshift(['lmatch','Матч дня']);if(!L.mm&&has>=0)LVIEWS.splice(has,1);if(L.mm&&UI.view!=='lmatch'&&!['inbox','llife','lagent','lhome'].includes(UI.view))UI.view='lmatch';}
  _renderL3();
};
const _vLegL3=vLegend;
vLegend=function(){
  const L=L3();let h=_vLegL3();if(!L)return h;const R=L.rel;const bar=v=>`<div class="moodbar" style="margin:6px 0 10px"><i style="width:${v}%;background:${v>=60?'var(--good)':v>=35?'var(--warn)':'var(--bad)'}"></i></div>`;
  const pnl=`<div class="grid g2" style="align-items:start"><div class="panel"><h3>Отношения</h3><p style="margin-top:8px">С тренером <span class="mute num">${Math.round(R.coach)}</span></p>${bar(R.coach)}<p>С партнёрами <span class="mute num">${Math.round(R.team)}</span></p>${bar(R.team)}
    <div class="row"><button class="btn sm" onclick="G.lRel('train')">Доп. тренировка</button><button class="btn sm" onclick="G.lRel('dinner')">Ужин с командой (5 тыс. €)</button><button class="btn sm" onclick="G.lRel('support')">Поддержать партнёра</button><button class="btn sm bad" onclick="G.lRel('complain')">Пожаловаться в прессе</button></div>
    <p class="mute" style="font-size:12px;margin-top:8px">${R.coach<35?'<span class="bad">Тренер недоволен — вас могут не ставить в состав.</span>':'Хорошие отношения с тренером — место в составе, с партнёрами — точные передачи и настроение.'}</p></div>
   <div class="panel"><h3>Ключевые моменты матчей</h3><p class="mute" style="font-size:13px;margin:8px 0">Когда вы в составе, игра останавливается в ваших ключевых моментах: бить, отдать пас или обвести решаете вы.</p><label class="row" style="font-size:13px"><input type="checkbox" ${L.play!==false?'checked':''} onchange="G.lMomToggle()"> Играть ключевые моменты самому</label></div></div>`;
  return h.replace('<div class="panel tw"><h3 style="margin-bottom:6px">История карьеры',pnl+'<div class="panel tw"><h3 style="margin-bottom:6px">История карьеры');
};
