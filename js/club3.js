'use strict';
/* ===== KICK 2: раздевалка, медцентр, цели игроков, соперничество тренеров, статистика и история ===== */
const K3=()=>{S.k3=S.k3||{conf:[],chem:60,h2h:{},mh:{},rec:{},res:[],cs:{},spat:{}};return S.k3;};

/* ---------- раздевалка ---------- */
const LANG={ENG:'en',SCO:'en',WAL:'en',IRL:'en',NIR:'en',USA:'en',CAN:'en',AUS:'en',JAM:'en',ESP:'es',ARG:'es',URU:'es',COL:'es',MEX:'es',CHI:'es',PER:'es',ECU:'es',PAR:'es',VEN:'es',BOL:'es',POR:'pt',BRA:'pt',ANG:'pt',CPV:'pt',MOZ:'pt',FRA:'fr',SEN:'fr',CIV:'fr',CMR:'fr',MLI:'fr',GUI:'fr',ALG:'fr',MAR:'fr',TUN:'fr',BEL:'fr',SUI:'fr',COD:'fr',GAB:'fr',BFA:'fr',RUS:'ru',BLR:'ru',KAZ:'ru',UKR:'ru',GER:'de',AUT:'de',ITA:'it',NED:'nl',TUR:'tr',SRB:'sr',CRO:'sr',BIH:'sr',MNE:'sr'};
const LANGN={en:'Англоязычные',es:'Испаноязычные',pt:'Португалоязычные',fr:'Франкоязычные',ru:'Русскоязычные',de:'Немецкоязычные',it:'Итальянцы',nl:'Голландцы',tr:'Турки',sr:'Балканская группа'};
function dressing(t){
  const ps=t.pl.map(id=>S.P[id]).filter(Boolean);const groups={};
  ps.forEach(p=>{const g=LANG[p.nat]||p.nat;(groups[g]=groups[g]||[]).push(p);});
  const gs=Object.entries(groups).filter(([,a])=>a.length>=3).sort((a,b)=>b[1].length-a[1].length).map(([k,a])=>({k,n:LANGN[k]||('Игроки: '+natName(k)),ps:a.sort((x,y)=>ca(y)-ca(x)),mor:a.reduce((s,p)=>s+p.mor,0)/a.length}));
  const leaders=ps.filter(p=>p.a[A.ldr]>=14&&p.age>=24).sort((a,b)=>b.a[A.ldr]-a.a[A.ldr]).slice(0,4);
  const cap=S.P[t.tac.cap]||leaders[0]||null;
  return {groups:gs,leaders,cap,avg:ps.reduce((s,p)=>s+p.mor,0)/Math.max(1,ps.length)};
}
function chemWeek(t){
  const k=K3();const d=dressing(t);
  // капитан и лидеры тянут настроение команды за собой
  if(d.cap){const pull=(d.cap.a[A.ldr]-10)*.06+(d.cap.mor-60)*.02;t.pl.forEach(id=>{const p=S.P[id];if(p&&p!==d.cap)p.mor=clamp(p.mor+pull*.5,10,100);});}
  // новые конфликты
  if(k.conf.filter(c=>!c.done).length<2&&rnd()<.07){
    const ps=t.pl.map(id=>S.P[id]).filter(p=>p&&!p.loan);const hot=ps.filter(p=>p.a[A.agg]>=13||p.mor<45);
    if(hot.length){const a=pick(hot);const b=pickW(ps.filter(p=>p!==a),p=>(p.pos===a.pos||NEAR[a.pos].includes(p.pos)?3:1)+(p.a[A.agg]>=13?1:0));
      if(b){const why=pick([`спорят за место в составе на позиции ${PR[a.pos]}`,'поругались на тренировке','не поделили штрафной в последнем матче','обменялись колкостями в соцсетях','сцепились после жёсткого подката на тренировке']);
        const c={id:S.nid++,a:a.id,b:b.id,why,at:S.abs,done:false};k.conf.unshift(c);if(k.conf.length>20)k.conf.length=20;
        msg('Капитан команды',`Конфликт в раздевалке: ${lastName(a.n)} и ${lastName(b.n)}`,`${a.n} и ${b.n} ${why}. Атмосфера в команде портится.\n\nРешить конфликт можно в разделе «Клуб» → «Раздевалка».`,'conf',{c:c.id});}}}
  k.conf.forEach(c=>{if(c.done)return;const a=S.P[c.a],b=S.P[c.b];if(!a||!b||a.club!==t.id||b.club!==t.id){c.done=true;c.res='Игроки больше не в команде';return;}a.mor=clamp(a.mor-1.5,10,100);b.mor=clamp(b.mor-1.5,10,100);if(S.abs-c.at>70&&rnd()<.3){c.done=true;c.res='Со временем всё улеглось само';}});
  // атмосфера: средняя мораль, конфликты, лидеры, разобщённость групп
  const open=k.conf.filter(c=>!c.done).length;const spread=d.groups.length>1?Math.max(...d.groups.map(g=>g.mor))-Math.min(...d.groups.map(g=>g.mor)):0;
  const target=clamp(d.avg*.8+10-open*9+d.leaders.length*2-spread*.25+(d.cap?(d.cap.a[A.ldr]-12)*1.2:-4),5,100);
  k.chem=Math.round(k.chem+(target-k.chem)*.35);
  t.tac.ch=1+(k.chem-55)/900; // атмосфера немного влияет на игру
}
G.confAct=function(id,how){
  const k=K3();const c=k.conf.find(x=>x.id===id);if(!c||c.done)return;const a=S.P[c.a],b=S.P[c.b];if(!a||!b)return;
  if(how==='talk'){if(rnd()<.55+(S.user.rep-50)*.004){c.done=true;c.res='Вы помирили игроков';a.mor=clamp(a.mor+6,10,100);b.mor=clamp(b.mor+6,10,100);}else{c.res='Разговор не помог — обида осталась';c.tries=(c.tries||0)+1;}}
  else if(how==='a'||how==='b'){const w=how==='a'?a:b,l=how==='a'?b:a;w.mor=clamp(w.mor+10,10,100);l.mor=clamp(l.mor-14,10,100);c.done=true;c.res=`Вы встали на сторону ${lastName(w.n)}. ${lastName(l.n)} затаил обиду`;if(l.mor<35&&rnd()<.4){l.unh=S.abs+ri(40,90);c.res+=' и хочет уйти';}}
  else if(how==='fine'){a.mor=clamp(a.mor-5,10,100);b.mor=clamp(b.mor-5,10,100);c.done=true;c.res='Оба оштрафованы. Дисциплина восстановлена';K3().chem=Math.min(100,K3().chem+3);}
  toast(c.res);save();render();
};
// атмосфера в силе команды
const _lamC=lam;lam=function(s,o,ta,tb,home){return _lamC(s,o,ta,tb,home)*((ta&&ta.ch)||1)/Math.sqrt((tb&&tb.ch)||1);};

/* ---------- медцентр ---------- */
const INJT=[[6,'Ушиб'],[14,'Растяжение мышцы'],[28,'Надрыв мышцы'],[45,'Травма голеностопа'],[70,'Повреждение мениска'],[999,'Разрыв связок']];
const injName=d=>INJT.find(x=>d<=x[0])[1];
function injRisk(p){
  const fresh=p.cond<70?(70-p.cond)*.04:0;const age=p.age>=30?(p.age-29)*.12:0;const nat=(12-p.a[A.nat])*.06;const hist=Math.min(.8,(p.injN||0)*.12);const rec=p.injRec?.6:0;
  return clamp(1+fresh+age+nat+hist+rec,.6,3.2);
}
const riskTxt=r=>r<1.15?['Низкий','good']:r<1.6?['Средний','warn']:['Высокий','bad'];
function trackInjuries(t,before){
  t.pl.forEach(id=>{const p=S.P[id];if(!p)return;const was=before[id]||0;
    if(p.inj>was&&p.inj>0){p.injN=(p.injN||0)+1;p.injT=injName(p.inj);p.injD=p.inj;p.injTr='std';p.injRec=false;}});
}
G.treat=function(pid,kind){const p=S.P[pid];if(!p||p.inj<=0)return;if(p.injTr!=='std')return toast('Курс лечения уже выбран');
  if(kind==='fast'){p.inj=Math.max(1,Math.round(p.inj*.6));p.injTr='fast';p.injRec=true;toast(`${lastName(p.n)} вернётся быстрее, но риск рецидива высокий`);}
  else{p.inj=Math.round(p.inj*1.15)+2;p.injTr='full';p.injRec=false;toast(`${lastName(p.n)} восстановится полностью`);}
  render();};
const _dailyM=daily;
daily=function(){
  const t=userTeam();const was={};if(t)t.pl.forEach(id=>{const p=S.P[id];if(p)was[id]=p.inj;});
  _dailyM();
  if(!t)return;
  try{preMatch(t);}catch(e){}
  t.pl.forEach(id=>{const p=S.P[id];if(!p)return;
    if(was[id]>0&&p.inj<=0&&p.injRec){p.injRec=false;if(rnd()<.32){const d=Math.max(5,Math.round((p.injD||20)*.6));p.inj=d;p.injN=(p.injN||0)+1;p.injT='Рецидив: '+(p.injT||'травма').toLowerCase();p.injTr='std';msg('Медицинский штаб',`Рецидив: ${p.n}`,`${p.n} слишком рано вернулся после травмы, и она повторилась. Ещё примерно ${injTxt(d)} без футбола.`);}}});
};

/* ---------- цели игроков на сезон ---------- */
function setGoals(t){
  const ps=t.pl.map(id=>S.P[id]).filter(p=>p&&!p.loan).sort((a,b)=>ca(b)-ca(a)).slice(0,9);
  ps.forEach(p=>{const c=ca(p);const att=['ST','AMC','AML','AMR'].includes(p.pos);const mid=['MC','ML','MR','DM'].includes(p.pos);
    let g;const r=rnd();
    if(att&&r<.6)g={k:'g',v:Math.max(5,Math.round(c*1.2-4+ri(-2,3))),t:'Забить голов'};
    else if((att||mid)&&r<.8)g={k:'as',v:Math.max(4,Math.round(c*.7-3+ri(-1,2))),t:'Сделать голевых передач'};
    else if(!p.nt&&S.NS&&S.NS[p.nat]&&rnd()<.35&&c>=12)g={k:'nt',v:1,t:'Попасть в сборную'};
    else if(p.age<=22)g={k:'ap',v:ri(18,26),t:'Сыграть матчей'};
    else g={k:'r',v:p.age>=30?6.9:7.0,t:'Средняя оценка не ниже'};
    p.sg={...g,s:season()};});
}
function goalProg(p){const g=p.sg;if(!g)return null;
  if(g.k==='g')return [p.st.g,g.v];if(g.k==='as')return [p.st.as,g.v];if(g.k==='ap')return [p.st.ap,g.v];
  if(g.k==='nt'){const x=S.NS&&S.NS[p.nat]&&(S.NS[p.nat].xi||[]).includes(p.id);return [x?1:0,1];}
  return [p.st.ap?+(p.st.r/p.st.ap).toFixed(2):0,g.v];}
function goalsEnd(t){
  const ok=[],bad=[];t.pl.forEach(id=>{const p=S.P[id];if(!p||!p.sg||p.sg.s!==season())return;const [x,v]=goalProg(p);const done=p.sg.k==='r'?x>=v&&p.st.ap>=12:x>=v;
    if(done){p.mor=clamp(p.mor+15,10,100);ok.push(`• ${p.n}: ${p.sg.t.toLowerCase()} ${v} — выполнено`);}else{p.mor=clamp(p.mor-10,10,100);if(p.sg.k==='ap'&&x<v*.5&&rnd()<.35)p.unh=S.abs+ri(30,90);bad.push(`• ${p.n}: ${p.sg.t.toLowerCase()} ${v} — не вышло (${x})`);}
    delete p.sg;});
  if(ok.length||bad.length)msg('Помощник тренера','Личные цели игроков: итоги сезона',`${ok.length?'Довольны:\n'+ok.join('\n'):''}${ok.length&&bad.length?'\n\n':''}${bad.length?'Разочарованы:\n'+bad.join('\n'):''}`);
}

/* ---------- соперничество тренеров и личные встречи ---------- */
const SPATS=['Говорят, у них сильный состав. Посмотрим, как они запоют после субботы.','Я уважаю {u}, но мне кажется, его команде пока не хватает характера.','У {u} хорошая пресс-служба. Результатов пока меньше.','Мы знаем, как обыграть {c}. Делали это раньше — сделаем снова.','Для меня это обычный матч. Не понимаю, почему {u} так нервничает.'];
const REPLY={hard:'Ответить жёстко',calm:'Промолчать',praise:'Похвалить соперника'};
function mgrOf(t){return t&&t.mgr&&t.mgr!=='—'?t.mgr:null;}
function heatOf(name){const k=K3();return (k.mh[name]||{heat:0}).heat;}
function preMatch(t){
  const k=K3();const day=S.d+1;
  S.F.forEach(f=>{if(f.d!==day||f.nt||f.hg!=null||(f.h!==t.id&&f.a!==t.id))return;const o=S.T[f.h===t.id?f.a:f.h];const m=mgrOf(o);if(!m)return;
    const derby=isRival(t.id,o.id);const h=heatOf(m);if(!(derby||h>=2||(o.rep>=t.rep-3&&rnd()<.12)))return;if(k.spat[f.d+':'+o.id])return;k.spat[f.d+':'+o.id]=1;
    const q=pick(SPATS).replace('{u}',S.user.name).replace('{c}',t.n);
    msg(`${m} (${o.n})`,`${m} высказался перед матчем`,`Главный тренер ${o.n} ${m} на пресс-конференции:\n«${q}»\n\nЖурналисты ждут вашего ответа.`,'spat',{o:o.id,m});});
}
G.spat=function(id,how){const m=S.inbox.find(x=>x.id===id);if(!m||m.done)return;m.done=true;const k=K3();const e=k.mh[m.data.m]=k.mh[m.data.m]||{w:0,d:0,l:0,gf:0,ga:0,heat:0,c:m.data.o};const t=userTeam();
  if(how==='hard'){e.heat=Math.min(5,e.heat+1);t.pl.forEach(id=>{const p=S.P[id];if(p)p.mor=clamp(p.mor+3,10,100);});m.res='Вы ответили жёстко. Команда заряжена, пресса в восторге, а вражда разгорается.';news(`${S.user.name} ответил ${m.data.m}: «Поговорим на поле»`,{t:[t.id,m.data.o],k:'staff'});}
  else if(how==='praise'){e.heat=Math.max(0,e.heat-1);m.res='Вы похвалили соперника — градус противостояния снизился.';}
  else m.res='Вы не стали отвечать.';render();};
function trackMatch(f,res){
  const t=userTeam();if(!t||f.nt||(f.h!==t.id&&f.a!==t.id))return;const k=K3();const home=f.h===t.id;const o=S.T[home?f.a:f.h];
  const gf=home?f.hg:f.ag,ga=home?f.ag:f.hg;let out=gf>ga?1:gf<ga?-1:0;if(f.pen)out=(home?f.pen[0]>f.pen[1]:f.pen[1]>f.pen[0])?1:-1;const key=out>0?'w':out<0?'l':'d';
  const H=k.h2h[o.id]=k.h2h[o.id]||{w:0,d:0,l:0,gf:0,ga:0,last:[]};H[key]++;H.gf+=gf;H.ga+=ga;H.last.unshift({s:season(),d:fmtShort(f.d),sc:`${f.hg}:${f.ag}`,h:home,o:out,c:compOfFx(f).name});if(H.last.length>10)H.last.length=10;
  const m=mgrOf(o);if(m){const e=k.mh[m]=k.mh[m]||{w:0,d:0,l:0,gf:0,ga:0,heat:0,c:o.id};e[key]++;e.gf+=gf;e.ga+=ga;e.c=o.id;
    if(isRival(t.id,o.id)&&e.heat<2)e.heat=2;if(out<0&&ga-gf>=3)e.heat=Math.min(5,e.heat+1);
    if(e.heat>=3&&rnd()<.5)news(out>0?`${S.user.name} взял верх над ${m}`:out<0?`${m} снова обыграл ${S.user.name}`:`${S.user.name} и ${m} не выявили сильнейшего`,{t:[t.id,o.id],k:'match',b:`Личные встречи тренеров: ${e.w} побед ${S.user.name}, ${e.d} ничьих, ${e.l} побед ${m}.`});}
  // рекорды клуба
  const R=k.rec[t.id]=k.rec[t.id]||{bw:null,bl:null,run:0,best:0,att:0};
  if(out>=0)R.run++;else R.run=0;R.best=Math.max(R.best,R.run);
  const dd=gf-ga;const rec={sc:`${gf}:${ga}`,o:o.n,s:season(),d:dd};
  if(dd>0&&(!R.bw||dd>R.bw.d||dd===R.bw.d&&gf>+R.bw.sc.split(':')[0]))R.bw=rec;if(dd<0&&(!R.bl||dd<R.bl.d))R.bl=rec;
  if(f.att&&f.att>R.att)R.att=f.att;
  // голы и матчи игроков за клуб
  const sd=home?res.h:res.a;if(sd){const C=k.cs[t.id]=k.cs[t.id]||{};sd.played.forEach(id=>{const p=S.P[id];if(!p)return;const e=C[id]=C[id]||{n:p.n,ap:0,g:0};e.ap++;e.n=p.n;});sd.g.forEach(id=>{const e=(k.cs[t.id]||{})[id];if(e)e.g++;});}
}

/* ---------- обвязка ---------- */
const _applyResC=applyRes;
applyRes=function(f,res,live){
  const t=userTeam();const before={};if(t)t.pl.forEach(id=>{const p=S.P[id];if(p)before[id]=p.inj;});
  _applyResC(f,res,live);
  if(!t||f.nt)return;
  trackInjuries(t,before);trackMatch(f,res);
  // скрытый риск травм: уставшие, возрастные и часто травмируемые ломаются чаще
  if(f.h===t.id||f.a===t.id){const sd=f.h===t.id?res.h:res.a;if(sd)sd.played.forEach(id=>{const p=S.P[id];if(!p||p.inj>0)return;const r=injRisk(p);if(rnd()<(r-1)*.012){const d=rnd()<.15?ri(30,80):ri(5,25);p.inj=d;p.injN=(p.injN||0)+1;p.injT=injName(d);p.injD=d;p.injTr='std';msg('Медицинский штаб',`Травма: ${p.n}`,`${p.n} (${p.injT.toLowerCase()}) пропустит примерно ${injTxt(d)}. Риск травм у игрока был высоким.`);}});}
};
const _weeklyC=weekly;
weekly=function(){_weeklyC();const t=userTeam();if(!t)return;chemWeek(t);if(!t.pl.some(id=>S.P[id]&&S.P[id].sg&&S.P[id].sg.s===season()))setGoals(t);};
const _seasonEndC=seasonEnd;seasonEnd=function(){const t=userTeam();if(t)goalsEnd(t);_seasonEndC();};
const _vInboxC=vInbox;
vInbox=function(){let html=_vInboxC();const m=S.inbox.find(x=>x.id===UI.msg);if(!m||m.done)return html;
  if(m.type==='spat')html+=`<div class="panel row"><b>Ваш ответ:</b>${Object.entries(REPLY).map(([k,l])=>`<button class="btn ${k==='hard'?'pri':''}" onclick="G.spat(${m.id},'${k}')">${l}</button>`).join('')}</div>`;
  if(m.type==='conf')html+=`<div class="panel row"><button class="btn pri" onclick="UI.ct='room';G.go('club')">Открыть раздевалку</button></div>`;return html;};

/* ---------- вкладки клуба: раздевалка и медцентр ---------- */
CTABS.splice(CTABS.findIndex(x=>x[0]==='fans'),0,['room','Раздевалка'],['med','Медцентр']);
const _vClubC=vClub;
vClub=function(){
  const tab=UI.ct||'main';if(tab!=='room'&&tab!=='med')return _vClubC();
  const t=userTeam();const head=`<div class="subtabs">${CTABS.map(([k,l])=>`<button class="${tab===k?'on':''}" onclick="UI.ct='${k}';render()">${l}</button>`).join('')}</div>`;const k=K3();
  if(tab==='room'){const d=dressing(t);const col=k.chem>=65?'var(--good)':k.chem>=40?'var(--warn)':'var(--bad)';const open=k.conf.filter(c=>!c.done);
    const goals=t.pl.map(id=>S.P[id]).filter(p=>p&&p.sg&&p.sg.s===season());
    return head+`<div class="head"><h1>Раздевалка</h1></div><div class="grid g2" style="align-items:start">
     <div class="panel"><h3>Атмосфера в команде</h3><p style="margin:8px 0"><b style="font-size:22px" class="${k.chem>=65?'good':k.chem>=40?'warn':'bad'}">${k.chem>=80?'Отличная':k.chem>=65?'Хорошая':k.chem>=40?'Напряжённая':'Токсичная'}</b> <span class="mute num">${k.chem} из 100</span></p><div class="moodbar"><i style="width:${k.chem}%;background:${col}"></i></div>
      <p class="mute" style="font-size:12px;margin-top:8px">Атмосфера зависит от морали, капитана, лидеров и конфликтов и немного влияет на игру команды.</p>
      <h3 style="margin:14px 0 6px">Капитан и лидеры</h3>${d.cap?`<p>${avatar(d.cap,22)} <b>${esc(d.cap.n)}</b> <span class="mute">— капитан, лидерство ${d.cap.a[A.ldr]}</span></p>`:'<p class="mute">Капитан не назначен — выберите его в «Тактике».</p>'}
      ${d.leaders.filter(p=>p!==d.cap).map(p=>`<p style="font-size:13px;margin-top:4px">${esc(p.n)} <span class="mute">· лидерство ${p.a[A.ldr]}</span></p>`).join('')}</div>
     <div class="panel"><h3 style="margin-bottom:6px">Конфликты</h3>${open.length?open.map(c=>{const a=S.P[c.a],b=S.P[c.b];return `<div class="upg" style="flex-wrap:wrap"><span><b>${esc(a.n)} и ${esc(b.n)}</b><small>${esc(c.why)}${c.tries?' · '+esc(c.res):''}</small></span><div class="row"><button class="btn sm pri" onclick="G.confAct(${c.id},'talk')">Помирить</button><button class="btn sm" onclick="G.confAct(${c.id},'a')">За ${esc(lastName(a.n))}</button><button class="btn sm" onclick="G.confAct(${c.id},'b')">За ${esc(lastName(b.n))}</button><button class="btn sm" onclick="G.confAct(${c.id},'fine')">Оштрафовать обоих</button></div></div>`;}).join(''):'<p class="mute">Конфликтов нет.</p>'}
      ${k.conf.filter(c=>c.done).slice(0,4).map(c=>`<p class="mute" style="font-size:12px;margin-top:6px">${esc((S.P[c.a]||{n:'?'}).n)} и ${esc((S.P[c.b]||{n:'?'}).n)}: ${esc(c.res||'')}</p>`).join('')}</div></div>
     <div class="grid g2" style="align-items:start"><div class="panel"><h3 style="margin-bottom:6px">Группы в команде</h3>${d.groups.length?d.groups.map(g=>`<div class="upg"><span><b>${esc(g.n)}</b> · ${g.ps.length}<small>${g.ps.slice(0,6).map(p=>esc(lastName(p.n))).join(', ')}${g.ps.length>6?'…':''}</small></span><span class="${morTxt(g.mor)[1]}">${morTxt(g.mor)[0]}</span></div>`).join(''):'<p class="mute">Команда не делится на группы.</p>'}<p class="mute" style="font-size:12px;margin-top:8px">Если одна группа довольна, а другая нет, атмосфера страдает.</p></div>
     <div class="panel tw"><h3 style="margin-bottom:6px">Личные цели на сезон</h3>${goals.length?`<table class="t"><tbody>${goals.map(p=>{const [x,v]=goalProg(p);const pct=Math.min(100,x/v*100);return `<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,22)}<span>${esc(p.n)}</span></div></td><td style="font-size:12px">${p.sg.t} ${v}</td><td style="min-width:110px"><div class="moodbar"><i style="width:${pct}%;background:${pct>=100?'var(--good)':'var(--accent)'}"></i></div></td><td class="r num">${x}</td></tr>`;}).join('')}</tbody></table>`:'<p class="mute">Цели появятся в начале недели.</p>'}<p class="mute" style="font-size:12px;margin-top:8px">Помогите игрокам: давайте время, ставьте на пенальти. Выполненная цель сильно поднимает мораль, проваленная — опускает.</p></div></div>`;}
  const ps=t.pl.map(id=>S.P[id]).filter(Boolean);const inj=ps.filter(p=>p.inj>0).sort((a,b)=>b.inj-a.inj);const risky=ps.filter(p=>p.inj<=0).map(p=>[p,injRisk(p)]).sort((a,b)=>b[1]-a[1]);
  return head+`<div class="head"><div><h1>Медицинский центр</h1><p class="mute">Главный врач: ${esc(S.staff.m.doc.n)} (${S.staff.m.doc.q}/20) · физиотерапевт: ${esc(S.staff.m.fit.n)} (${S.staff.m.fit.q}/20)</p></div></div>
   <div class="panel tw"><h3 style="margin-bottom:6px">Травмированные · ${inj.length}</h3>${inj.length?`<table class="t"><thead><tr><th>Игрок</th><th>Травма</th><th class="r">Осталось</th><th>Лечение</th></tr></thead><tbody>${inj.map(p=>`<tr><td><div class="cell">${avatar(p,22)}<span class="click" onclick="G.openP(${p.id})">${esc(p.n)}</span></div></td><td>${esc(p.injT||injName(p.inj))}</td><td class="r num">${injTxt(p.inj)}</td><td>${p.injTr==='std'?`<div class="row"><button class="btn sm" onclick="G.treat(${p.id},'fast')" title="Срок −40%, но риск рецидива около 30%">Ускоренное</button><button class="btn sm" onclick="G.treat(${p.id},'full')" title="Срок +15%, рецидива не будет">Полное</button></div>`:`<span class="${p.injTr==='fast'?'warn':'good'}">${p.injTr==='fast'?'Ускоренное — риск рецидива':'Полное восстановление'}</span>`}</td></tr>`).join('')}</tbody></table>`:'<p class="mute">Травмированных нет.</p>'}
    <p class="mute" style="font-size:12px;margin-top:8px">Ускоренное лечение возвращает игрока на 40% быстрее, но примерно в трети случаев травма повторяется. Полное — дольше, зато без рецидивов.</p></div>
   <div class="panel tw"><h3 style="margin-bottom:6px">Риск травм</h3><table class="t"><thead><tr><th>Игрок</th><th>Сост.</th><th class="r">Возр.</th><th class="r">Травм</th><th>Риск</th></tr></thead><tbody>${risky.map(([p,r])=>{const [tx,cl]=riskTxt(r);return `<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,22)}<span>${esc(p.n)}</span></div></td><td>${condBar(p.cond)}</td><td class="r num">${p.age}</td><td class="r num">${p.injN||0}</td><td class="${cl}">${tx}${p.injRec?' · после травмы':''}</td></tr>`;}).join('')}</tbody></table>
    <p class="mute" style="font-size:12px;margin-top:8px">Риск растёт у уставших, возрастных и часто травмирующихся игроков. Давайте им отдых в ротации.</p></div>`;
};

/* ---------- раздел «История» ---------- */
VIEWS.splice(VIEWS.findIndex(v=>v[0]==='awards')+1,0,['history','История']);
function vHistory(){
  const t=userTeam();const k=K3();const u=S.user;
  const R=t?k.rec[t.id]:null;const C=t?Object.entries(k.cs[t.id]||{}).map(([id,e])=>({id:+id,...e})):[];
  const topG=C.slice().sort((a,b)=>b.g-a.g).slice(0,10).filter(x=>x.g>0),topA=C.slice().sort((a,b)=>b.ap-a.ap).slice(0,10);
  const opp=Object.entries(k.h2h).map(([id,h])=>({id:+id,...h})).filter(x=>S.T[x.id]).sort((a,b)=>(b.w+b.d+b.l)-(a.w+a.d+a.l));
  const sel=UI.h2h!=null&&k.h2h[UI.h2h]?UI.h2h:(opp[0]&&opp[0].id);const H=sel!=null?k.h2h[sel]:null;
  const mg=Object.entries(k.mh).map(([n,e])=>({n,...e})).sort((a,b)=>b.heat-a.heat||(b.w+b.d+b.l)-(a.w+a.d+a.l)).slice(0,8);
  const pl=(list,f)=>list.length?`<table class="t"><tbody>${list.map((x,i)=>`<tr${S.P[x.id]?` class="click" onclick="G.openP(${x.id})"`:''}><td class="num mute">${i+1}</td><td>${esc(x.n)}</td><td class="r num" style="font-weight:600">${f(x)}</td></tr>`).join('')}</tbody></table>`:'<p class="mute">Пока нет данных.</p>';
  const heat=h=>h>=4?['Заклятые враги','bad']:h>=2?['Соперники','warn']:['Нейтрально','mute'];
  return `<div class="head"><div><h1>Статистика и история</h1><p class="mute">${t?esc(t.n)+' · ':''}данные ведутся с начала вашей карьеры в KICK 2</p></div></div>
  ${t?`<div class="kpi"><div class="panel"><h3>Крупнейшая победа</h3><span class="big">${R&&R.bw?R.bw.sc:'—'}</span><small class="mute">${R&&R.bw?' '+esc(R.bw.o)+' · '+R.bw.s:''}</small></div><div class="panel"><h3>Крупнейшее поражение</h3><span class="big">${R&&R.bl?R.bl.sc:'—'}</span><small class="mute">${R&&R.bl?' '+esc(R.bl.o)+' · '+R.bl.s:''}</small></div><div class="panel"><h3>Серия без поражений</h3><span class="big">${R?R.best:0}</span><small class="mute"> рекорд · сейчас ${R?R.run:0}</small></div><div class="panel"><h3>Рекорд посещаемости</h3><span class="big">${R&&R.att?R.att.toLocaleString('ru-RU'):'—'}</span></div></div>
  <div class="grid g2" style="align-items:start"><div class="panel"><h3 style="margin-bottom:6px">Лучшие бомбардиры клуба</h3>${pl(topG,x=>x.g)}</div><div class="panel"><h3 style="margin-bottom:6px">Больше всего матчей</h3>${pl(topA,x=>x.ap)}</div></div>`:''}
  <div class="grid g2" style="align-items:start">
   <div class="panel tw"><h3 style="margin-bottom:6px">Личные встречи с клубами</h3>${opp.length?`<label class="field" style="max-width:320px">Соперник<select onchange="UI.h2h=+this.value;render()">${opp.map(x=>`<option value="${x.id}" ${x.id===sel?'selected':''}>${esc(S.T[x.id].n)} (${x.w+x.d+x.l})</option>`).join('')}</select></label>
    ${H?`<div class="cst" style="margin:12px 0"><div><b class="good">${H.w}</b><small>побед</small></div><div><b>${H.d}</b><small>ничьих</small></div><div><b class="bad">${H.l}</b><small>поражений</small></div></div><p class="mute" style="font-size:13px">Мячи: ${H.gf}:${H.ga}</p><table class="t" style="margin-top:8px"><tbody>${H.last.map(m=>`<tr><td class="num mute">${m.s} · ${m.d}</td><td class="mute" style="font-size:12px">${esc(m.c)}</td><td>${m.h?'Дома':'В гостях'}</td><td class="r num ${m.o>0?'good':m.o<0?'bad':'warn'}" style="font-weight:600">${m.sc}</td></tr>`).join('')}</tbody></table>`:''}`:'<p class="mute">Сыграйте первые матчи.</p>'}</div>
   <div class="panel tw"><h3 style="margin-bottom:6px">Соперничество тренеров</h3>${mg.length?`<table class="t"><thead><tr><th>Тренер</th><th>Клуб</th><th class="r">В-Н-П</th><th>Отношения</th></tr></thead><tbody>${mg.map(e=>{const [ht,hc]=heat(e.heat);return `<tr><td><b>${esc(e.n)}</b></td><td class="mute">${S.T[e.c]?esc(S.T[e.c].n):''}</td><td class="r num">${e.w}-${e.d}-${e.l}</td><td class="${hc}">${ht}</td></tr>`;}).join('')}</tbody></table>`:'<p class="mute">Пока ни с кем не враждуете.</p>'}
    <p class="mute" style="font-size:12px;margin-top:8px">Перед дерби и важными матчами тренеры соперников делают заявления — отвечайте во «Входящих».</p></div></div>
  ${u.hist.length?`<div class="panel tw"><h3 style="margin-bottom:6px">История сезонов</h3><table class="t"><thead><tr><th>Сезон</th><th>Клуб</th><th>Лига</th><th class="r">Место</th><th class="r">В</th><th class="r">Н</th><th class="r">П</th><th></th></tr></thead><tbody>${u.hist.map(h=>`<tr><td class="num">${h.s}</td><td><div class="cell">${crest(S.T[h.tid],18)}<span>${esc(h.club)}</span></div></td><td class="mute">${esc(h.lg)}</td><td class="r num">${h.pos}</td><td class="r num">${h.w}</td><td class="r num">${h.d}</td><td class="r num">${h.l}</td><td>${h.note?`<span class="pill">${esc(h.note)}</span>`:''}</td></tr>`).join('')}</tbody></table></div>`:''}`;
}
const _rvC=renderView;renderView=function(){if(UI.view==='history')return vHistory();return _rvC();};
