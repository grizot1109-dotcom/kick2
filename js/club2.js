'use strict';
/* ===== KICK 2: аренды, предконтракты, финансы и стадион, академия, штаб, болельщики, разговоры с игроками, награды ===== */
const K2={};
const uTeam=()=>userTeam();
const isU=t=>!!(t&&S.user&&t.id===S.user.club);

/* ---------- инициализация и миграция ---------- */
const SPN=['NovaBank','Volta Energy','Aurum Air','Kestrel Motors','Polar Telecom','Vertex Pay','Orbis Logistics','Silvana Foods','Helix Mobile','Borea Insurance','Lumio Tech','Castor Beer','Meridian Hotels','Atlas Tyres','Quanta Games','Rivo Water'];
const SPT=['Титульный спонсор','Спонсор формы','Партнёры клуба'];
const SPK=[.18,.08,.04];
const baseInc=t=>wageBill(t)*1.04+t.rep*t.rep*60;
function newSpons(t,i,mult){return {n:pick(SPN),t:SPT[i],amt:Math.round(baseInc(t)*SPK[i]*(mult||1)*(.9+rnd()*.2)/100)*100,y:S.year+ri(1,3)};}
function finInit(t){
  if(t.fin)return t.fin;const I0=baseInc(t);
  const cap=Math.round(clamp(4000+Math.pow(t.rep-20,2)*13,3000,85000)/500)*500;
  const p0=Math.max(5,Math.round(.5*I0/(.9*cap)));
  t.fin={cap,p0,price:p0,pitch:Math.round(clamp(55+t.rep*.3,40,90)),tvw:Math.round(.4*I0/100)*100,spons:[0,1,2].map(i=>newSpons(t,i)),led:newLed(),prev:null,build:null,att:0};
  t.fans=t.fans==null?60:t.fans;
  t.acad=t.acad||(t.rep>=85?4:t.rep>=70?3:t.rep>=50?2:1);t.ynet=t.ynet||Math.max(1,t.acad-1);
  return t.fin;
}
const newLed=()=>({tick:0,spons:0,tv:0,prize:0,sales:0,wages:0,staff:0,buys:0,build:0,loans:0});
const SROLES={ass:'Ассистент главного тренера',att:'Тренер по атаке',def:'Тренер по обороне',phy:'Тренер по физподготовке',gk:'Тренер вратарей',yth:'Тренер молодёжи',doc:'Главный врач',fit:'Физиотерапевт'};
const SR_D={ass:'Советы на матч и в перерыве, настроение в команде',att:'Ускоряет рост атакующих навыков',def:'Ускоряет рост оборонительных навыков',phy:'Ускоряет рост физических качеств',gk:'Развивает вратарей',yth:'Развивает игроков до 21 года и улучшает выпускников академии',doc:'Сокращает сроки травм',fit:'Ускоряет восстановление сил между матчами'};
function genStaff(role,lv){const q=clamp(Math.round(lv+gauss()*2.2),3,20);return {id:S.nid++,role,n:pick(SC_FIRST)+' '+pick(SC_LAST),age:ri(31,66),q,wage:Math.round(250*Math.exp(.17*q)/100)*100,fee:Math.round(3000*Math.exp(.2*q)/1e3)*1e3};}
function staffInit(t){if(S.staff&&S.staff.club===t.id)return;S.staff={club:t.id,m:{}};for(const r in SROLES)S.staff.m[r]=genStaff(r,4+t.rep*.1);}
const sq=r=>S.staff&&S.staff.m&&S.staff.m[r]?S.staff.m[r].q:8;
function ensureUser(){const t=uTeam();if(!t)return null;finInit(t);staffInit(t);S.user.k2=S.user.k2||{ach:{},streak:0,big:0,acDeb:0,sold:0};S.aw=S.aw||[];return t;}
const _afterLoad=afterLoad;afterLoad=function(){_afterLoad();ensureUser();};
const _takeJob=takeJob;takeJob=function(tid){_takeJob(tid);S.staff=null;ensureUser();const t=uTeam();t.fin.led=newLed();
  msg('Финансовый директор','Финансы клуба',`Стадион: ${t.fin.cap.toLocaleString('ru-RU')} мест, билет — ${money(t.fin.price)}.\nТелеправа: ${money(t.fin.tvw)} в неделю.\nСпонсоры: ${t.fin.spons.map(s=>`${s.n} (${s.t.toLowerCase()}) — ${money(s.amt)} в неделю`).join(', ')}.\n\nЦены на билеты, стадион и академию можно менять в разделе «Клуб».`);};

/* ---------- деньги: еженедельно ---------- */
const sponsW=t=>t.fin.spons.reduce((s,x)=>s+x.amt,0);
const staffW=()=>S.staff?Object.values(S.staff.m).reduce((s,x)=>s+x.wage,0):0;
const _weekly=weekly;
weekly=function(){
  const t=ensureUser();
  if(t){t.inc=t.fin.tvw+sponsW(t);const L=t.fin.led;L.tv+=t.fin.tvw;L.spons+=sponsW(t);L.wages+=wageBill(t);
    const sw=staffW();t.bal-=sw;L.staff+=sw;
    // доплата за игроков, отданных в аренду
    Object.values(S.P).forEach(p=>{if(p.loan&&p.loan.from===t.id){const c=Math.round(p.loan.w0*(1-p.loan.wp));t.bal-=c;L.loans+=c;}});
    // ассистент держит настроение
    t.pl.forEach(id=>{const p=S.P[id];if(p)p.mor=clamp(p.mor+(sq('ass')-10)*.08,10,100);});
    fansWeek(t);buildWeek(t);}
  _weekly();
  if(t&&uTeam()===t){preContractsWeek(t);loanWeek(t);checkAch();}
};
/* ---------- билеты на домашних матчах ---------- */
function gate(f,t){
  const F=finInit(t);const o=S.T[f.a];const big=f.c[0]!=='L'?1.12:1;const riv=isRival(t.id,o.id)?1.15:1;
  const dem=F.cap*1.05*(.5+t.fans*.007)*(.85+o.rep/400)*Math.pow(F.p0/F.price,1.4)*big*riv;
  const att=Math.round(Math.min(F.cap,dem)*(.97+rnd()*.06));return {att,rev:att*F.price,full:dem>=F.cap};
}
const _applyRes=applyRes;
applyRes=function(f,res,live){
  const ut=uTeam();let g=null;
  if(ut&&!f.nt&&f.h===ut.id&&!f.neu){g=gate(f,ut);ut.bal+=g.rev;ut.fin.led.tick+=g.rev;ut.fin.att=g.att;f.att=g.att;}
  // свежие травмы — для врача
  const before={};if(ut)ut.pl.forEach(id=>{const p=S.P[id];if(p)before[id]=p.inj;});
  _applyRes(f,res,live);
  if(!ut||f.nt||(f.h!==ut.id&&f.a!==ut.id))return;
  const doc=sq('doc');ut.pl.forEach(id=>{const p=S.P[id];if(p&&p.inj>(before[id]||0)){p.inj=Math.max(1,Math.round(p.inj*(1-(doc-8)*.025)));}});
  const home=f.h===ut.id;const gf=home?f.hg:f.ag,ga=home?f.ag:f.hg;let out=gf>ga?1:gf<ga?-1:0;if(f.pen)out=(home?f.pen[0]>f.pen[1]:f.pen[1]>f.pen[0])?1:-1;
  const opp=S.T[home?f.a:f.h];const riv=isRival(ut.id,opp.id)?2:1;
  ut.fans=clamp(ut.fans+(out>0?1.5:out<0?-2.4:-.3)*riv+(gf-ga>=3?2:ga-gf>=3?-3:0),0,100);
  const k=S.user.k2;k.streak=out>=0?k.streak+1:0;if(gf-ga>=5)k.big=1;
  const sd=home?res.h:res.a;if(sd)sd.played.forEach(id=>{const p=S.P[id];if(p&&p.acad&&p.car.ap===1){k.acDeb++;news(`Дебют воспитанника: ${p.n}`,{t:[ut.id],p:p.id,k:'info',b:`${p.n} (${p.age} лет) впервые сыграл за основной состав ${ut.n}.`});}});
  if(g&&f===(M&&M.f))M.att=g;
};
/* ---------- болельщики ---------- */
function fansWeek(t){
  const F=t.fin;t.fans=clamp(t.fans+(F.p0-F.price)/F.p0*1.2+(50-t.fans)*.01,0,100);
  if(t.fans<22&&!t.fanWarn){t.fanWarn=true;msg('Пресс-служба','Болельщики недовольны',`Фанаты ${t.n} вывесили на трибунах баннеры с требованием отставки тренера. Совет директоров следит за настроением трибун.`);news(`Болельщики ${t.n} требуют отставки ${S.user.name}`,{t:[t.id],k:'staff'});}
  if(t.fans>35)t.fanWarn=false;
}
const _boardWeek=boardWeek;
boardWeek=function(){const t=uTeam();if(t&&t.fans!=null)S.user.conf=clamp(S.user.conf+(t.fans-50)/60,0,100);_boardWeek();};
const fansTxt=v=>v>=80?['В восторге','good']:v>=62?['Довольны','good']:v>=42?['Спокойны','']:v>=25?['Недовольны','warn']:['В ярости','bad'];
const _doTransfer=doTransfer;
doTransfer=function(p,buyer,fee,yrs,wage){
  const ut=uTeam();const sel=p.club>=0?S.T[p.club]:null;const rk=sel&&ut&&sel.id===ut.id?squadRank(p,sel):99;
  _doTransfer(p,buyer,fee,yrs,wage);
  if(!ut)return;
  if(sel&&sel.id===ut.id){finInit(ut).led.sales+=fee||0;if(rk<3){ut.fans=clamp(ut.fans-7,0,100);news(`Болельщики ${ut.n} возмущены продажей ${p.n}`,{t:[ut.id],p:p.id,k:'transfer'});}if((fee||0)>=5e7)S.user.k2.sold=Math.max(S.user.k2.sold||0,fee);}
  if(buyer.id===ut.id){finInit(ut).led.buys+=fee||0;if(value(p)>=2e7||(fee||0)>=2e7){ut.fans=clamp(ut.fans+5,0,100);}}
};
const _prize=prize;prize=function(c,t,kind){const ut=uTeam();const b=ut?ut.bal:0;_prize(c,t,kind);if(ut&&t===ut.id){finInit(ut).led.prize+=ut.bal-b;if(kind==='title')ut.fans=clamp(ut.fans+12,0,100);}};
/* ---------- стройка ---------- */
function buildWeek(t){const B=t.fin.build;if(B&&S.abs>=B.at){if(B.k==='seats'){t.fin.cap+=B.v;msg('Финансовый директор','Стадион расширен',`Новые трибуны открыты: теперь стадион вмещает ${t.fin.cap.toLocaleString('ru-RU')} зрителей.`);}
  else if(B.k==='acad'){t.acad=B.v;msg('Молодёжная академия','Академия улучшена',`Новые поля и корпуса академии готовы. Уровень академии: ${t.acad} из 5.`);}
  else if(B.k==='ynet'){t.ynet=B.v;msg('Молодёжная академия','Сеть поиска расширена',`Скауты академии теперь просматривают больше школ. Уровень сети: ${t.ynet} из 5.`);}
  t.fin.build=null;}}

/* ---------- аренды ---------- */
function loanReturn(p){const L=p.loan;const to=S.T[L.from];delete p.loan;if(!to)return sign(p,null);sign(p,to,Math.max(1,L.ce0-S.year),L.w0);p.ce=L.ce0;}
function loanOutOffers(p){
  if(K2.lo&&K2.lo.p===p.id&&K2.lo.at===S.abs)return K2.lo.list;
  const ut=uTeam();const c=ca(p);const cand=S.T.filter(t=>t.id!==ut.id&&t.rep<=ut.rep+3&&t.pl.length<30&&Math.abs(4.3+t.rep*.11-(c+.4))<1.3);
  const home=shuffle(cand.filter(t=>t.nat===ut.nat)),away=shuffle(cand.filter(t=>t.nat!==ut.nat));
  const list=[...home.slice(0,3),...away].slice(0,4).map(t=>({t:t.id,wp:pick(t.rep>=60?[.75,1,1]:[.5,.75,1]),opt:rnd()<.35?Math.round(value(p)*1.25/1e5)*1e5:0}));
  K2.lo={p:p.id,at:S.abs,list};return list;
}
function loanOut(pid,i){
  const p=S.P[pid];const ut=uTeam();const o=(K2.lo&&K2.lo.p===pid?K2.lo.list:[])[i];if(!o||!p||p.club!==ut.id)return;
  if(!windowOpen(S.d))return toast('Аренды оформляются только в трансферное окно');
  const t=S.T[o.t];p.loan={from:ut.id,to:t.id,wp:o.wp,w0:p.wage,ce0:p.ce,opt:o.opt,at:S.abs};sign(p,t,Math.max(1,p.ce-S.year),p.wage);p.ce=p.loan.ce0;
  validateXI(ut);news(`${p.n} отправляется в аренду в ${t.n}`,{t:[ut.id,t.id],p:p.id,k:'transfer',b:`${t.n} берёт ${p.n} в аренду из ${ut.n} до конца сезона${o.opt?` с правом выкупа за ${money(o.opt)}`:''}.`});
  K2.lo=null;toast(`${p.n} ушёл в аренду в ${t.n}`);save();renderModal();render();
}
function loanIn(pid){
  const p=S.P[pid];const ut=uTeam();const sel=p.club>=0?S.T[p.club]:null;if(!sel||!ut)return;
  const wp=+document.getElementById('lwp').value;const wantOpt=document.getElementById('lopt').checked;
  if(!windowOpen(S.d))return toast('Аренды оформляются только в трансферное окно');
  if(p.lreq&&S.abs-p.lreq<30)return toast(`${sel.n} уже отказал. Повторить можно через ${30-(S.abs-p.lreq)} дн.`);
  if(wageBill(ut)+p.wage*wp>ut.wb)return toast(`Фонд зарплат превысит бюджет (${money(ut.wb)} в неделю)`);
  const rk=squadRank(p,sel);const role=expRole(p,ut);
  let ch=.3+.3*(wp-.5)/.5+(role<=1?.25:role<=2?.1:-.25)-(wantOpt?.12:0)+(p.age<=21?.1:0);
  if(isRival(sel.id,ut.id))ch=0;if(rk<5&&p.age>21)ch=0;else if(rk<11&&p.age>23)ch*=.35;if(ut.rep<sel.rep-30)ch*=.5;
  if(rnd()>=ch){p.lreq=S.abs;const why=ch===0?`${p.n} — ключевой игрок, ${sel.n} его не отдаёт.`:role>2?`${p.n} не хочет сидеть в запасе ${ut.n}.`:`${sel.n} отказал: условия аренды не устроили клуб.`;toast(why);K2.lt=why;renderModal();return;}
  const opt=wantOpt?Math.round(value(p)*1.15/1e5)*1e5:0;
  p.loan={from:sel.id,to:ut.id,wp,w0:p.wage,ce0:p.ce,opt,at:S.abs};sign(p,ut,Math.max(1,p.ce-S.year),Math.round(p.wage*wp));p.ce=p.loan.ce0;
  news(`${p.n} переходит в ${ut.n} на правах аренды`,{t:[ut.id,sel.id],p:p.id,k:'transfer',b:`${ut.n} арендовал ${p.n} у ${sel.n} до конца сезона${opt?` с правом выкупа за ${money(opt)}`:''}. ${ut.n} платит ${Math.round(wp*100)}% зарплаты.`});
  msg('Трансферный отдел',`${p.n} взят в аренду`,`${p.n} будет играть за ${ut.n} до конца сезона.\nЗарплату платим на ${Math.round(wp*100)}%: ${money(p.wage)} в неделю.${opt?`\nПраво выкупа: ${money(opt)} — предложение придёт в мае.`:''}`);
  K2.lt=null;toast(`${p.n} — в аренде у вас`);save();renderModal();render();
}
function loanWeek(t){
  const d=dateOf(S.d);
  if(d.getDate()<=7){const out=Object.values(S.P).filter(p=>p.loan&&p.loan.from===t.id);
    if(out.length&&d.getMonth()!==6)msg('Помощник тренера','Отчёт об арендованных игроках',out.map(p=>`• ${p.n} — ${S.T[p.club].n}: ${p.st.ap} ${plural(p.st.ap,'матч','матча','матчей')}, ${p.st.g} ${plural(p.st.g,'гол','гола','голов')}, средняя оценка ${avgR(p)}`).join('\n'));
    if(d.getMonth()===4)t.pl.forEach(id=>{const p=S.P[id];if(p&&p.loan&&p.loan.opt&&!p.loan.asked){p.loan.asked=true;msg(S.T[p.loan.from].n,`Право выкупа: ${p.n}`,`Аренда ${p.n} заканчивается летом. По договору вы можете выкупить игрока за ${money(p.loan.opt)}. Иначе он вернётся в ${S.T[p.loan.from].n}.`,'loanbuy',{p:p.id});}});}
}
G.loanBuy=function(mid,ok){const m=S.inbox.find(x=>x.id===mid);if(!m||m.done)return;const p=S.P[m.data.p];const ut=uTeam();m.done=true;
  if(!ok||!p||!p.loan||p.club!==ut.id){m.res=ok?'Сделка больше невозможна.':'Вы отказались от выкупа. Игрок вернётся летом.';render();return;}
  const fee=p.loan.opt;if(fee>ut.tb){m.done=false;toast(`Не хватает трансферного бюджета (${money(ut.tb)})`);return;}
  const w0=p.loan.w0;loanReturn(p);doTransfer(p,ut,fee,3,w0);m.res=`${p.n} выкуплен за ${money(fee)}.`;toast(m.res);save();render();};
const _aiWillSell=aiWillSell;aiWillSell=function(p,sel,buyer){if(p.loan||p.pre||p.preU)return false;return _aiWillSell(p,sel,buyer);};
const _makeBid=makeBid;makeBid=function(b,p,fee){if(p.loan||p.pre)return;_makeBid(b,p,fee);};

/* ---------- предконтракты ---------- */
function preContractsWeek(t){
  const m=dateOf(S.d).getMonth();if(m>4||m<0||m>=6)return;
  t.pl.forEach(id=>{const p=S.P[id];if(!p||p.loan||p.pre||p.ce>S.year+1||p.age>33)return;const rk=squadRank(p,t);
    if(rnd()>=(rk<16?.035:.012))return;const c=ca(p);const buyers=S.T.filter(b=>b.id!==t.id&&b.rep>=t.rep-12&&4.3+b.rep*.11>=c-.6&&b.pl.length<30);if(!buyers.length)return;
    const b=pick(buyers);p.pre={c:b.id};p.mor=clamp(p.mor-5,10,100);
    msg(b.n,`${p.n} подписал предварительный контракт`,`Контракт ${p.n} истекает летом, и он договорился с ${b.n}. После окончания сезона игрок уйдёт бесплатно.\n\nПродавать его теперь поздно — в следующий раз продлевайте контракты заранее.`);
    news(`${p.n} летом перейдёт в ${b.n} на правах свободного агента`,{t:[t.id,b.id],p:p.id,k:'transfer'});});
}
const _finishDeal=finishDeal;
finishDeal=function(d,p){
  if(!d.pre)return _finishDeal(d,p);const ut=uTeam();d.st='done';p.preU={c:ut.id,wage:d.wage,yrs:d.yrs,role:d.role,bonus:d.bonus};
  d.log.push({w:p.n,t:`Предварительный контракт подписан: ${p.n} перейдёт в ${ut.n} летом.`,k:'good'});
  msg('Трансферный отдел',`Предконтракт: ${p.n}`,`${p.n} подписал предварительный контракт и станет игроком ${ut.n} после окончания сезона.\nЗарплата: ${money(d.wage)} в неделю, ${d.yrs} ${plural(d.yrs,'год','года','лет')}.`);
  news(`${p.n} летом перейдёт в ${ut.n}`,{t:[ut.id,p.club],p:p.id,k:'transfer'});save();
};
const _neg=G.neg;
G.neg=function(type){const p=S.P[UI.modalP];
  if(p.loan)return toast('Игрок в аренде — контракт обсуждается с его клубом');
  if(type==='renew'&&p.pre)return toast(`${p.n} уже договорился с ${S.T[p.pre.c].n}`);
  if(type==='pre'){if(p.preU)return toast('Предконтракт уже подписан');const old=dealOf(p.id);if(!old||old.st==='done'||old.st==='fail'||!old.pre){const d=newDeal(p,'free');d.pre=true;}renderModal();return;}
  _neg(type);};
['list','release'].forEach(k=>{const f=G[k];G[k]=function(id){const p=S.P[id];if(p&&p.loan)return toast('Игрок в аренде');if(p&&p.pre&&k==='list')return toast('Игрок уже договорился с другим клубом');f(id);};});

/* ---------- академия ---------- */
const _youth=youth;
youth=function(t,n){
  const u=isU(t);if(u){finInit(t);n+=t.acad>=4?1:0;n+=t.ynet>=4?1:0;}
  const out=_youth(t,n);
  if(u)out.forEach(p=>{p.acad=1;const up=(t.acad-2)*.9+(t.ynet-2)*.5+(sq('yth')-10)*.08+gauss()*.4;p.pa=clamp(p.pa+up,ca(p)+1,20);
    const k=Math.round((t.acad-1)*.8+rnd());for(let i=0;i<k;i++)bump(p,1,null);if(rnd()<.015*t.acad){p.pa=Math.min(20,p.pa+2.5);p.gold=1;}});
  return out;
};
/* ---------- штаб: развитие, травмы, восстановление ---------- */
const _develop=develop;
develop=function(p,focus){
  _develop(p,focus);
  if(!focus||!S.staff||!S.user||p.club!==S.user.club)return;
  if(p.age<=30){const area=p.pos==='GK'?'gk':focus==='att'||focus==='tec'?'att':focus==='def'?'def':focus==='phy'?'phy':pick(['att','def','phy']);
    let ch=(sq(area)-9)*.0035;if(p.age<=21)ch+=(sq('yth')-9)*.004;
    if(ch>0&&rnd()<ch*Math.max(0,p.pa-ca(p)+.5))bump(p,1,area==='gk'?null:area==='att'?'att':area==='def'?'def':'phy');}
};
const _daily=daily;
daily=function(){_daily();const t=S.staff&&uTeam();if(!t)return;const fit=sq('fit'),doc=sq('doc');
  t.pl.forEach(id=>{const p=S.P[id];if(!p)return;if(p.cond<100)p.cond=Math.min(100,p.cond+(fit-8)*.07);if(p.inj>0&&rnd()<(doc-8)*.03)p.inj--;});};
function staffMarket(role){S.stm=S.stm||{};const m=S.stm[role];if(!m||m.at+30<=S.abs){const t=uTeam();S.stm[role]={at:S.abs,list:Array.from({length:4},(_,i)=>genStaff(role,5+i*3+rnd()*2+(t?t.rep*.03:0)))};}return S.stm[role].list;}
G.staffHire=function(role,id){const t=uTeam();const c=staffMarket(role).find(x=>x.id===id);if(!c||!t)return;const old=S.staff.m[role];const comp=old?old.wage*4:0;
  if(t.bal<c.fee+comp)return toast('Не хватает денег на балансе');t.bal-=c.fee+comp;t.fin.led.staff+=c.fee+comp;S.staff.m[role]=c;S.stm[role].list=S.stm[role].list.filter(x=>x!==c);
  toast(`${c.n} — новый сотрудник: ${SROLES[role].toLowerCase()}`);render();};

/* ---------- разговоры с игроками ---------- */
const TALKP={praise:'Похвалить',crit:'Покритиковать',prom:'Пообещать место в составе',stay:'Уговорить остаться'};
G.ptalk=function(pid,k){
  const p=S.P[pid];const ut=uTeam();if(!p||!ut||p.club!==ut.id)return;
  if(p.talkAt!=null&&S.abs-p.talkAt<14)return toast(`С ${lastName(p.n)} уже говорили — подождите ${14-(S.abs-p.talkAt)} дн.`);
  p.talkAt=S.abs;const fa=p.form.length?p.form.reduce((a,b)=>a+b,0)/p.form.length:6.7;const det=p.a[A.det],cmp=p.a[A.cmp];let r,d=0;
  if(k==='praise'){if(fa>=7){d=10;r=`${p.n}: «Спасибо, тренер! Буду работать ещё больше».`;}else if(fa>=6.6){d=4;r=`${p.n} доволен, что его заметили.`;}else{d=-1;r=`${p.n} удивлён похвале — он и сам понимает, что играет слабо.`;}}
  else if(k==='crit'){if(fa>=7.1){d=-14;r=`${p.n} возмущён: «Я один из лучших в команде!»`;}else if(det>=13||cmp>=14){d=3;p.hf=clamp((p.hf||0)+.5,-1.6,1.6);r=`${p.n} принял критику: «Вы правы, я исправлюсь».`;}else{d=-11;r=`${p.n} обиделся и замкнулся в себе.`;}}
  else if(k==='prom'){const r0=squadRank(p,ut);if(p.prom!=null&&p.prom<=1){d=0;r=`${p.n}: «Вы мне это уже обещали».`;}else{p.prom=1;p.promWarn=false;d=r0<11?4:12;r=r0<11?`${p.n} и так играет в основе, но рад слышать.`:`${p.n} воодушевлён обещанием. Теперь его нужно выпускать в основе, иначе мораль упадёт.`;}}
  else if(k==='stay'){if(!unhappy(p)){d=2;r=`${p.n}: «Я и не собирался уходить».`;}else{const ch=clamp(.25+(S.user.rep-ut.rep)*.01+(p.mor-40)*.006+(p.prom!=null?-.1:.1),.05,.8);if(rnd()<ch){delete p.unh;d=10;r=`${p.n} остаётся и снимает запрос на трансфер.`;}else{d=-6;r=`${p.n} непреклонен: он хочет уйти.`;}}}
  p.mor=clamp(p.mor+d,10,100);K2.talk={p:pid,r,d};toast(r);renderModal();
};

/* ---------- карточка игрока ---------- */
const _renderModal=renderModal;
renderModal=function(){
  _renderModal();const p=UI.modalP!=null?S.P[UI.modalP]:null;const box=document.getElementById('mbox');if(!p||!box)return;
  const ut=uTeam();if(!ut)return;const mine=p.club===ut.id;let h='';
  if(p.loan){const L=p.loan;h+=`<p class="mute" style="font-size:13px">${mine?`В аренде из ${esc(S.T[L.from].n)} до конца сезона. Платим ${Math.round(L.wp*100)}% зарплаты.${L.opt?` Право выкупа: ${money(L.opt)}.`:''}`:`В аренде в ${esc(S.T[p.club].n)} до конца сезона${L.from===ut.id?` · вы доплачиваете ${money(Math.round(L.w0*(1-L.wp)))} в неделю`:''}.`}</p>`;}
  if(p.pre)h+=`<p class="warn" style="font-size:13px">Подписал предконтракт с ${esc(S.T[p.pre.c].n)} — уйдёт летом бесплатно.</p>`;
  if(p.preU)h+=`<p class="good" style="font-size:13px">Предконтракт подписан: летом переходит в ${esc(ut.n)}.</p>`;
  if(mine&&!p.loan){
    const cd=p.talkAt!=null&&S.abs-p.talkAt<14;
    h+=`<div class="panel"><h3 style="margin-bottom:8px">Разговор с игроком</h3><div class="row">${Object.entries(TALKP).filter(([k])=>k!=='stay'||unhappy(p)).map(([k,l])=>`<button class="btn sm" ${cd?'disabled':''} onclick="G.ptalk(${p.id},'${k}')">${l}</button>`).join('')}</div>${K2.talk&&K2.talk.p===p.id?`<p class="${K2.talk.d>0?'good':K2.talk.d<0?'bad':'mute'}" style="font-size:13px;margin-top:8px">${esc(K2.talk.r)}</p>`:cd?`<p class="mute" style="font-size:12px;margin-top:6px">Следующий разговор — через ${14-(S.abs-p.talkAt)} дн.</p>`:'<p class="mute" style="font-size:12px;margin-top:6px">Похвала работает, когда игрок в форме, критика — на целеустремлённых. Обещания нужно выполнять.</p>'}</div>`;
    if(p.age<=23||squadRank(p,ut)>=14){const offs=windowOpen(S.d)?loanOutOffers(p):[];
      h+=`<div class="panel"><h3 style="margin-bottom:8px">Отдать в аренду</h3>${!windowOpen(S.d)?'<p class="mute">Аренды оформляются в трансферные окна.</p>':offs.length?`<table class="t"><tbody>${offs.map((o,i)=>{const t=S.T[o.t];return `<tr><td><div class="cell">${crest(t,20)}<span>${esc(t.n)}</span></div></td><td class="mute" style="font-size:12px">${esc(S.L[t.lg].name)}</td><td style="font-size:12px">платят ${Math.round(o.wp*100)}% зарплаты${o.opt?` · выкуп ${money(o.opt)}`:''}</td><td class="r"><button class="btn sm" onclick="G.loanOut(${p.id},${i})">Отдать</button></td></tr>`;}).join('')}</tbody></table><p class="mute" style="font-size:12px;margin-top:6px">Игровая практика ускоряет развитие молодых.</p>`:'<p class="mute">Сейчас клубов, готовых взять игрока, нет.</p>'}</div>`;}
  }
  if(!mine&&p.club>=0&&!p.loan){
    h+=`<div class="panel"><h3 style="margin-bottom:8px">Взять в аренду до конца сезона</h3>${windowOpen(S.d)?`<div class="row"><label class="field">Платим зарплаты<select id="lwp"><option value="0.5">50%</option><option value="0.75" selected>75%</option><option value="1">100%</option></select></label><label class="row" style="font-size:13px"><input type="checkbox" id="lopt"> с правом выкупа (≈ ${money(Math.round(value(p)*1.15/1e5)*1e5)})</label><button class="btn" onclick="G.loanIn(${p.id})">Запросить аренду</button></div>${K2.lt?`<p class="bad" style="font-size:13px;margin-top:6px">${esc(K2.lt)}</p>`:''}<p class="mute" style="font-size:12px;margin-top:6px">Клубы охотнее отдают запасных и молодых. Игрок согласится, только если будет играть.</p>`:'<p class="mute">Аренды оформляются в трансферные окна.</p>'}</div>`;
    if(p.ce<=S.year+1&&dateOf(S.d).getMonth()<=4&&dateOf(S.d).getMonth()>=0&&!windowOpen(S.d)&&!p.preU&&!p.pre)h+=`<div class="panel"><h3>Предварительный контракт</h3><p class="mute" style="font-size:13px;margin:4px 0 8px">Контракт игрока истекает летом — с ним можно договориться напрямую, без компенсации клубу.</p><button class="btn pri" onclick="G.neg('pre')">Начать переговоры</button></div>`;
  }
  if(h){const div=document.createElement('div');div.className='grid k2m';div.style.gap='10px';div.innerHTML=h;const neg=box.querySelector('.neg');if(neg)box.insertBefore(div,neg);else box.appendChild(div);}
};
G.loanOut=loanOut;G.loanIn=loanIn;
const _closeP=G.closeP;G.closeP=function(){K2.talk=null;K2.lt=null;_closeP();};
const _statusPills=statusPills;
statusPills=function(p){let s=_statusPills(p);if(p.loan)s+=`<span class="pill loan">${S.user&&p.loan.from===S.user.club?'В аренде':'Аренда'}</span> `;if(p.pre)s+='<span class="pill exp">Уходит летом</span> ';else if(S.user&&p.club===S.user.club&&p.ce<=S.year+1&&!p.loan)s+='<span class="pill exp">Контракт истекает</span> ';if(p.preU)s+='<span class="pill acc">Предконтракт</span> ';return s;};

/* ---------- награды и достижения ---------- */
function seasonAwards(){
  const label=season();const ut=uTeam();const rec={s:label,lg:[],ballon:[]};
  const rated=p=>p.st.ap>=12?p.st.r/p.st.ap+p.st.g*.025+p.st.as*.012:0;const pn_=p=>({id:p.id,n:p.n,c:p.club>=0?S.T[p.club].n:'',pos:p.pos});
  const all=Object.values(S.P).filter(p=>p.club>=0&&S.L[S.T[p.club].lg]);
  const top=S.L.filter(L=>L.tier===1&&L.grp===0&&(L.rep>=70||ut&&L.nat===ut.nat));
  top.forEach(L=>{const ids=new Set(L.teams);const ps=all.filter(p=>ids.has(p.club));if(!ps.length)return;
    const mvp=ps.slice().sort((a,b)=>rated(b)-rated(a))[0];const sc=ps.slice().sort((a,b)=>b.st.g-a.st.g)[0];
    const xi=[];const used=new Set();['GK','DL','DC','DC','DR','DM','MC','MC','AML','ST','AMR'].forEach(pos=>{const c=ps.filter(p=>!used.has(p.id)&&(p.pos===pos||p.alt.includes(pos))&&p.st.ap>=10).sort((a,b)=>b.st.r/b.st.ap-a.st.r/a.st.ap)[0];if(c){used.add(c.id);xi.push({...pn_(c),slot:pos,r:(c.st.r/c.st.ap).toFixed(2)});}});
    const st=standings(L);const champ=S.T[st[0].id];let mgr={n:champ.mgr,c:champ.n};
    if(ut&&L.teams.includes(ut.id)){const pos=st.findIndex(r=>r.id===ut.id)+1;if(pos===1||pos<=S.user.target-3){mgr={n:S.user.name,c:ut.n,me:1};}}
    rec.lg.push({k:L.key,name:L.name,mvp:mvp?{...pn_(mvp),r:(mvp.st.r/Math.max(1,mvp.st.ap)).toFixed(2)}:null,sc:sc?{...pn_(sc),g:sc.st.g}:null,xi,mgr});
    if(mgr.me){S.user.k2.coy=(S.user.k2.coy||0)+1;msg('Лига',`Тренер года: ${L.name}`,`Поздравляем! Вы признаны лучшим тренером сезона ${label} в турнире ${L.name}.`);news(`${S.user.name} — тренер года в турнире ${L.name}`,{t:[ut.id],k:'trophy'});}
  });
  const cand=all.filter(p=>S.L[S.T[p.club].lg].tier===1&&S.L[S.T[p.club].lg].rep>=68&&p.st.ap>=15).map(p=>{const t=S.T[p.club];const tr=t.tr.filter(x=>x.s===label).length;return [p,rated(p)+tr*.35+t.rep*.006+ca(p)*.05];}).sort((a,b)=>b[1]-a[1]).slice(0,3);
  rec.ballon=cand.map(([p])=>pn_(p));
  if(rec.ballon[0]){const b=S.P[rec.ballon[0].id];news(`«Золотой мяч» сезона ${label} — ${b.n}`,{p:b.id,t:[b.club],k:'trophy',b:`Лучшим игроком мира признан ${b.n} (${S.T[b.club].n}). Второе место — ${rec.ballon[1]?rec.ballon[1].n:'—'}, третье — ${rec.ballon[2]?rec.ballon[2].n:'—'}.`});
    if(ut&&b.club===ut.id){S.user.k2.ballon=1;msg('Пресс-служба','«Золотой мяч» у нашего игрока!',`${b.n} получил «Золотой мяч» по итогам сезона ${label}.`);}}
  S.aw=S.aw||[];S.aw.unshift(rec);if(S.aw.length>30)S.aw.length=30;
}
const ACH=[
  ['w1','⚽','Первая победа','Выиграйте первый матч',u=>u.tot.w>=1],
  ['w50','🏅','Полсотни побед','50 побед в карьере',u=>u.tot.w>=50],
  ['w200','🎖','Двести побед','200 побед в карьере',u=>u.tot.w>=200],
  ['m100','📋','Сотня матчей','Проведите 100 матчей',u=>u.tot.w+u.tot.d+u.tot.l>=100],
  ['t1','🏆','Первый трофей','Выиграйте любой трофей',u=>u.troph.length>=1],
  ['t5','👑','Коллекционер','5 трофеев в карьере',u=>u.troph.length>=5],
  ['lg','🥇','Чемпион','Выиграйте национальный чемпионат',u=>u.troph.some(x=>x.id.startsWith('L:'))],
  ['eu','🌍','Король континента','Выиграйте международный клубный турнир',u=>u.troph.some(x=>!x.id.startsWith('L:')&&/UCL|UEL|UECL|CL|Лига чемпионов|Лига Европы|Либертадорес|Конференц/i.test(x.id+' '+x.name))],
  ['up','📈','Повышение','Выведите команду в дивизион выше',u=>u.hist.some(h=>h.note==='Повышение')],
  ['big','💥','Разгром','Победите с разницей в 5 голов',u=>u.k2.big],
  ['str','🛡','Без поражений','15 матчей подряд без поражений',u=>u.k2.streak>=15],
  ['sell','💰','Сделка века','Продайте игрока за 50 млн € и дороже',u=>(u.k2.sold||0)>=5e7],
  ['ac1','🌱','Своя школа','Дебют воспитанника академии',u=>u.k2.acDeb>=1],
  ['ac5','🌳','Династия','5 дебютов воспитанников',u=>u.k2.acDeb>=5],
  ['coy','🎙','Тренер года','Получите награду тренера года',u=>(u.k2.coy||0)>=1],
  ['bal','✨','«Золотой мяч»','Ваш игрок получил «Золотой мяч»',u=>u.k2.ballon],
  ['fans','📣','Любимец трибун','Доведите настроение болельщиков до 90',u=>{const t=uTeam();return t&&t.fans>=90;}],
  ['full','🏟','Аншлаг','Расширьте стадион',u=>u.k2.built]];
function checkAch(){const u=S.user;if(!u||!u.k2)return;ACH.forEach(([id,ic,n,d,f])=>{if(u.k2.ach[id])return;let ok=false;try{ok=!!f(u);}catch(e){}if(ok){u.k2.ach[id]=fmtDate(S.d);msg('Достижения',`Достижение: ${n}`,`${ic} ${n} — ${d.toLowerCase()}.`);toast(`Достижение: ${n}`);}});}

/* ---------- конец сезона ---------- */
const _seasonEnd=seasonEnd;
seasonEnd=function(){
  const ut=ensureUser();
  try{seasonAwards();}catch(e){console.error(e);}
  // аренды: возврат, выкуп ИИ-клубами
  Object.values(S.P).forEach(p=>{if(!p.loan)return;const L=p.loan;const t=S.T[p.club];
    if(L.opt&&ut&&L.from===ut.id&&p.st.ap>=10&&p.st.r/p.st.ap>=6.85&&t&&t.tb>=L.opt&&rnd()<.6){const fee=L.opt,w0=L.w0;loanReturn(p);doTransfer(p,t,fee,ri(2,4),w0);msg(t.n,`${p.n} выкуплен из аренды`,`${t.n} воспользовался правом выкупа: ${p.n} переходит за ${money(fee)}.`);return;}
    const back=L.from===(ut&&ut.id);loanReturn(p);if(back)msg('Помощник тренера',`${p.n} вернулся из аренды`,`${p.n} вернулся в команду после аренды.`);});
  // предконтракты
  Object.values(S.P).forEach(p=>{
    if(p.pre){const b=S.T[p.pre.c];delete p.pre;if(b&&p.club!==b.id)doTransfer(p,b,0);}
    if(p.preU&&ut&&p.preU.c===ut.id){const x=p.preU;delete p.preU;if(p.club!==ut.id){doTransfer(p,ut,0,x.yrs,x.wage);p.prom=x.role;if(x.bonus){ut.bal-=x.bonus;}}}
  });
  if(ut){const F=ut.fin;F.prev={s:season(),...F.led,att:F.att};F.led=newLed();}
  _seasonEnd();
  const t=ensureUser();
  if(t){const F=t.fin;F.tvw=Math.round(.4*baseInc(t)/100)*100;
    const won=S.user.hist[0]&&['Чемпион','Повышение'].includes(S.user.hist[0].note);
    F.spons.forEach((s,i)=>{if(s.y<=S.year){const n=newSpons(t,i,won?1.25:1+(t.fans-50)/250);F.spons[i]=n;msg('Коммерческий отдел',`Новый спонсор: ${n.n}`,`Истёк контракт со спонсором «${s.n}». Новый партнёр — ${n.n} (${n.t.toLowerCase()}): ${money(n.amt)} в неделю до лета ${n.y}.`);}});
    t.inc=F.tvw+sponsW(t);checkAch();}
};

/* ---------- экран клуба с вкладками ---------- */
const _vClub=vClub;
const CTABS=[['main','Обзор'],['fin','Финансы'],['stad','Стадион'],['acad','Академия'],['staff','Штаб'],['fans','Болельщики'],['contr','Контракты и аренды']];
vClub=function(){
  const t=ensureUser();const tab=UI.ct||'main';
  const head=`<div class="subtabs">${CTABS.map(([k,l])=>`<button class="${tab===k?'on':''}" onclick="UI.ct='${k}';render()">${l}</button>`).join('')}</div>`;
  if(tab==='main')return head+_vClub();
  const F=t.fin;const H=x=>`<div class="head"><div><h1>${x}</h1><p class="mute">${esc(t.n)} · баланс <span class="${t.bal<0?'bad':''}">${money(t.bal)}</span></p></div></div>`;
  if(tab==='fin'){const L=F.led,P=F.prev;const row=(n,a,b,neg)=>`<div class="fin-row fin3"><span>${n}</span><span class="num ${a?neg?'bad':'good':'mute'}">${neg&&a?'−':''}${money(a)}</span><span class="num mute">${P&&b!=null?(neg&&b?'−':'')+money(b):''}</span></div>`;
    const inc=L.tick+L.spons+L.tv+L.prize+L.sales,exp=L.wages+L.staff+L.buys+L.build+L.loans;
    return head+H('Финансы')+`<div class="kpi"><div class="panel"><h3>Баланс</h3><span class="big ${t.bal<0?'bad':''}">${money(t.bal)}</span></div><div class="panel"><h3>Трансферный бюджет</h3><span class="big">${money(t.tb)}</span></div><div class="panel"><h3>Зарплаты в неделю</h3><span class="big">${money(wageBill(t))}</span><small class="mute"> из ${money(t.wb)}</small></div><div class="panel"><h3>Доход в неделю</h3><span class="big">${money(t.inc)}</span><small class="mute"> + билеты</small></div></div>
     <div class="grid g2" style="align-items:start"><div class="panel"><h3 style="margin-bottom:6px">Сезон ${season()}${P?` <span class="mute" style="font-weight:400">· справа — прошлый сезон</span>`:''}</h3>
      ${row('Билеты',L.tick,P&&P.tick)}${row('Спонсоры',L.spons,P&&P.spons)}${row('Телеправа',L.tv,P&&P.tv)}${row('Призовые',L.prize,P&&P.prize)}${row('Продажи игроков',L.sales,P&&P.sales)}
      ${row('Зарплаты игроков',L.wages,P&&P.wages,1)}${row('Штаб и скауты',L.staff,P&&P.staff,1)}${row('Покупки игроков',L.buys,P&&P.buys,1)}${row('Стройка',L.build,P&&P.build,1)}${row('Доплаты за аренды',L.loans,P&&P.loans,1)}
      <div class="fin-row fin3"><b>Итого</b><b class="num ${inc-exp<0?'bad':'good'}">${inc-exp<0?'−':''}${money(Math.abs(inc-exp))}</b><span></span></div></div>
      <div class="panel"><h3 style="margin-bottom:6px">Спонсоры</h3>${F.spons.map(s=>`<div class="fin-row"><span><b>${esc(s.n)}</b><br><small class="mute">${esc(s.t)} · до лета ${s.y}</small></span><span class="num">${money(s.amt)} / нед.</span></div>`).join('')}
       <h3 style="margin:14px 0 6px">Телеправа</h3><div class="fin-row"><span>${esc(S.L[t.lg].name)}</span><span class="num">${money(F.tvw)} / нед.</span></div><p class="mute" style="font-size:12px;margin-top:8px">Спонсорские контракты продлеваются летом. Сумма зависит от уровня клуба, результатов и настроения болельщиков.</p></div></div>`;}
  if(tab==='stad'){const B=F.build;const exps=[[2000,60],[5000,100],[10000,180]];const cost=n=>n*F.p0*60;const pc=Math.round(t.rep*t.rep*350/1e4)*1e4;
    const dem=gate({a:t.id,c:'L0',h:t.id},t);
    return head+H('Стадион')+`<div class="kpi"><div class="panel"><h3>Вместимость</h3><span class="big">${F.cap.toLocaleString('ru-RU')}</span></div><div class="panel"><h3>Последний домашний матч</h3><span class="big">${F.att?F.att.toLocaleString('ru-RU'):'—'}</span><small class="mute"> зрителей</small></div><div class="panel"><h3>Газон</h3><span class="big">${F.pitch}%</span><small class="mute"> ${pitchTxt(F.pitch).toLowerCase()}</small></div></div>
     <div class="grid g2" style="align-items:start"><div class="panel"><h3>Цена билета</h3><div class="row" style="margin:10px 0"><input type="range" min="${Math.max(2,Math.round(F.p0*.4))}" max="${Math.round(F.p0*2.5)}" value="${F.price}" oninput="document.getElementById('prv').textContent='€'+this.value" onchange="G.price(+this.value)" style="flex:1" aria-label="Цена билета"><b id="prv" class="num">€${F.price}</b></div>
      <p class="mute" style="font-size:13px">Обычная цена для клуба вашего уровня — ${money(F.p0)}. Дорогие билеты приносят больше денег на аншлагах, но меньше людей приходит на рядовые матчи, а болельщики злятся.</p>
      <p style="font-size:13px;margin-top:8px">Прогноз на средний матч: ${Math.min(F.cap,dem.att).toLocaleString('ru-RU')} зрителей, выручка ${money(dem.rev)}.</p></div>
      <div class="panel"><h3 style="margin-bottom:6px">Стройка</h3>${B?`<p>Идёт стройка: ${B.k==='seats'?'новые трибуны на '+B.v.toLocaleString('ru-RU')+' мест':B.k==='acad'?'академия, уровень '+B.v:'сеть поиска, уровень '+B.v}. Готово ${fmtDate(S.d+(B.at-S.abs))}.</p>`:
       exps.map(([n,d])=>`<div class="upg"><span>Новая трибуна: +${n.toLocaleString('ru-RU')} мест<small>${d} дней · ${money(cost(n))}</small></span><button class="btn sm" ${F.cap+n>99000||t.bal<cost(n)?'disabled':''} onclick="G.build('seats',${n},${d},${cost(n)})">Строить</button></div>`).join('')}
       <div class="upg"><span>Уход за газоном: +10%<small>Сразу · ${money(pc)} · меньше травм и плохих полей зимой</small></span><button class="btn sm" ${F.pitch>=98||t.bal<pc?'disabled':''} onclick="G.pitch(${pc})">Улучшить</button></div></div></div>`;}
  if(tab==='acad'){const B=F.build;const ac=Math.round(15e5*t.acad*t.acad*Math.max(.4,t.rep/60)/1e5)*1e5,yn=Math.round(6e5*t.ynet*t.ynet*Math.max(.4,t.rep/60)/1e5)*1e5;
    const lv=v=>`<span class="lvl">${[1,2,3,4,5].map(i=>`<i class="${i<=v?'on':''}"></i>`).join('')}</span>`;
    const kids=t.pl.map(id=>S.P[id]).filter(p=>p&&p.acad).sort((a,b)=>a.age-b.age);
    return head+H('Молодёжная академия')+`<div class="grid g2" style="align-items:start"><div class="panel"><h3 style="margin-bottom:6px">Инфраструктура</h3>
      <div class="upg"><span>Тренировочная база академии ${lv(t.acad)}<small>Выше уровень — выше потенциал выпускников</small></span>${t.acad<5&&!B?`<button class="btn sm" ${t.bal<ac?'disabled':''} onclick="G.build('acad',${t.acad+1},120,${ac})">Улучшить · ${money(ac)}</button>`:''}</div>
      <div class="upg"><span>Сеть поиска талантов ${lv(t.ynet)}<small>Больше выпускников и шанс найти самородка</small></span>${t.ynet<5&&!B?`<button class="btn sm" ${t.bal<yn?'disabled':''} onclick="G.build('ynet',${t.ynet+1},60,${yn})">Улучшить · ${money(yn)}</button>`:''}</div>
      <div class="upg"><span>Тренер молодёжи: ${esc(S.staff.m.yth.n)}<small>Квалификация ${S.staff.m.yth.q} из 20 — сменить можно во вкладке «Штаб»</small></span></div>
      ${B?`<p class="mute" style="font-size:12px;margin-top:8px">Пока идёт другая стройка, новые улучшения недоступны.</p>`:''}<p class="mute" style="font-size:12px;margin-top:8px">Выпускники приходят каждое лето. Дебют воспитанника в основе — повод для гордости болельщиков.</p></div>
      <div class="panel tw"><h3 style="margin-bottom:6px">Воспитанники в команде · ${kids.length}</h3>${kids.length?`<table class="t"><tbody>${kids.map(p=>`<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,24)}<span>${esc(p.n)}</span>${p.gold?' <span class="pill acc">Самородок</span>':''}</div></td><td><span class="pos">${PR[p.pos]}</span></td><td class="r num">${p.age}</td><td>${potStars(p.pa)}</td><td class="r num">${p.car.ap} ${plural(p.car.ap,'матч','матча','матчей')}</td></tr>`).join('')}</tbody></table>`:'<p class="mute">Первый выпуск академии придёт летом.</p>'}</div></div>`;}
  if(tab==='staff'){const sel=UI.str||'ass';const cur=S.staff.m[sel];const mk=staffMarket(sel);
    return head+H('Тренерский штаб')+`<div class="grid g2" style="align-items:start"><div class="panel tw"><h3 style="margin-bottom:6px">Ваш штаб · ${money(staffW())} в неделю</h3><table class="t"><tbody>${Object.entries(SROLES).map(([r,l])=>{const s=S.staff.m[r];return `<tr class="click ${r===sel?'me':''}" onclick="UI.str='${r}';render()"><td><b>${esc(l)}</b><br><small class="mute">${esc(SR_D[r])}</small></td><td>${esc(s.n)}</td><td>${scStars({jud:s.q,pot:s.q,exp:s.q})}</td><td class="r num">${money(s.wage)}</td></tr>`;}).join('')}</tbody></table>
      <p class="mute" style="font-size:12px;margin-top:8px">Скауты — в разделе «Трансферы» → «Скауты».</p></div>
      <div class="panel"><h3>${esc(SROLES[sel])}: кандидаты</h3><p class="mute" style="font-size:12px;margin:4px 0 8px">Сейчас: ${esc(cur.n)}, квалификация ${cur.q}. При замене прежнему сотруднику выплачивается компенсация — 4 недельные зарплаты. Список обновляется раз в месяц.</p>
      ${mk.map(c=>`<div class="upg"><span><b>${esc(c.n)}</b>, ${c.age} лет · квалификация ${c.q} ${scStars({jud:c.q,pot:c.q,exp:c.q})}<small>${money(c.wage)} в неделю · подписание ${money(c.fee)}</small></span><button class="btn sm ${c.q>cur.q?'pri':''}" onclick="G.staffHire('${sel}',${c.id})">Нанять</button></div>`).join('')}</div></div>`;}
  if(tab==='fans'){const [ft,fc]=fansTxt(t.fans);const col=t.fans>=60?'var(--good)':t.fans>=35?'var(--warn)':'var(--bad)';
    return head+H('Болельщики')+`<div class="grid g2" style="align-items:start"><div class="panel"><h3>Настроение трибун</h3><p style="margin:8px 0"><b class="${fc}" style="font-size:22px">${ft}</b> <span class="mute num">${Math.round(t.fans)} из 100</span></p><div class="moodbar"><i style="width:${t.fans}%;background:${col}"></i></div>
      <p class="mute" style="font-size:13px;margin-top:10px">${t.fans>=62?'Трибуны поддерживают команду, совет директоров это ценит.':t.fans>=35?'Болельщики ждут результатов.':'Трибуны давят на тренера — совет директоров теряет терпение.'}</p></div>
      <div class="panel"><h3 style="margin-bottom:6px">Что влияет</h3><div class="fin-row"><span>Победы и поражения, особенно в дерби</span><span class="mute">±</span></div><div class="fin-row"><span>Разгромы</span><span class="mute">±</span></div><div class="fin-row"><span>Цена билетов (обычная — ${money(F.p0)})</span><span class="num ${F.price>F.p0?'bad':'good'}">${money(F.price)}</span></div><div class="fin-row"><span>Продажа лидеров команды</span><span class="bad">−</span></div><div class="fin-row"><span>Громкие покупки и трофеи</span><span class="good">+</span></div><div class="fin-row"><span>Дебюты воспитанников</span><span class="good">+</span></div>
      <p class="mute" style="font-size:12px;margin-top:8px">Настроение болельщиков влияет на посещаемость, спонсоров и доверие совета директоров.</p></div></div>`;}
  if(tab==='contr'){const pl=t.pl.map(id=>S.P[id]).filter(Boolean).sort((a,b)=>a.ce-b.ce||ca(b)-ca(a));const out=Object.values(S.P).filter(p=>p.loan&&p.loan.from===t.id);const pre=Object.values(S.P).filter(p=>p.preU&&p.preU.c===t.id);
    return head+H('Контракты и аренды')+`<div class="panel tw" style="padding:6px"><h3 style="padding:8px">Контракты игроков</h3><table class="t"><thead><tr><th>Игрок</th><th>Поз.</th><th class="r">Возр.</th><th class="r">Зарплата</th><th class="r">До лета</th><th>Статус</th></tr></thead><tbody>${pl.map(p=>`<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,24)}<span>${esc(p.n)}</span></div></td><td><span class="pos">${PR[p.pos]}</span></td><td class="r num">${p.age}</td><td class="r num">${money(p.wage)}</td><td class="r num ${p.ce<=S.year+1?'warn':''}">${p.ce}</td><td>${statusPills(p)}</td></tr>`).join('')}</tbody></table>
     <p class="mute" style="font-size:12px;padding:8px">С января игроки в последнем году контракта могут договориться с другими клубами и уйти летом бесплатно. Продлевайте ключевых заранее.</p></div>
     <div class="grid g2" style="align-items:start"><div class="panel tw"><h3 style="margin-bottom:6px">Отданы в аренду</h3>${out.length?`<table class="t"><tbody>${out.map(p=>`<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,22)}<span>${esc(p.n)}</span></div></td><td><div class="cell">${crest(S.T[p.club],18)}<span>${esc(S.T[p.club].n)}</span></div></td><td class="r num">${p.st.ap} И · ${avgR(p)}</td></tr>`).join('')}</tbody></table>`:'<p class="mute">Никого. Отдать игрока можно из его профиля в трансферное окно.</p>'}</div>
     <div class="panel tw"><h3 style="margin-bottom:6px">Придут летом по предконтракту</h3>${pre.length?`<table class="t"><tbody>${pre.map(p=>`<tr class="click" onclick="G.openP(${p.id})"><td><div class="cell">${avatar(p,22)}<span>${esc(p.n)}</span></div></td><td class="mute">${p.club>=0?esc(S.T[p.club].n):''}</td><td class="r num">${money(p.preU.wage)}</td></tr>`).join('')}</tbody></table>`:'<p class="mute">Пока никого. С января до лета можно договариваться с игроками, у которых истекает контракт.</p>'}</div></div>`;}
  return head+_vClub();
};
G.price=function(v){const t=uTeam();t.fin.price=v;render();};
G.build=function(k,v,days,cost){const t=uTeam();if(t.fin.build)return toast('Уже идёт стройка');if(t.bal<cost)return toast('Не хватает денег');t.bal-=cost;t.fin.led.build+=cost;t.fin.build={k,v,at:S.abs+days};if(k==='seats')S.user.k2.built=1;toast('Стройка началась');render();};
G.pitch=function(c){const t=uTeam();if(t.bal<c)return;t.bal-=c;t.fin.led.build+=c;t.fin.pitch=Math.min(100,t.fin.pitch+10);toast('Газон улучшен');render();};

/* ---------- входящие: выкуп из аренды ---------- */
const _vInbox=vInbox;
vInbox=function(){let html=_vInbox();const m=S.inbox.find(x=>x.id===UI.msg);
  if(m&&m.type==='loanbuy'&&!m.done){const p=S.P[m.data.p];html+=`<div class="panel row"><b>Выкупить ${p?esc(p.n):''}?</b><button class="btn pri" onclick="G.loanBuy(${m.id},true)">Выкупить</button><button class="btn" onclick="G.loanBuy(${m.id},false)">Отказаться</button></div>`;}return html;};

/* ---------- раздел «Награды» ---------- */
VIEWS.splice(VIEWS.findIndex(v=>v[0]==='career')+1,0,['awards','Награды']);
function vAwards(){
  ensureUser();const u=S.user;u.k2=u.k2||{ach:{},streak:0,big:0,acDeb:0,sold:0};const got=Object.keys(u.k2.ach).length;const aw=S.aw||[];const sel=aw[UI.aws||0];
  const pl=x=>x?`<span class="cell" style="display:inline-flex">${S.P[x.id]?avatar(S.P[x.id],22):''}<b>${esc(x.n)}</b> <span class="mute">${esc(x.c)}</span></span>`:'—';
  return `<div class="head"><div><h1>Награды и достижения</h1><p class="mute">Достижений открыто: ${got} из ${ACH.length}</p></div></div>
  <div class="panel"><h3 style="margin-bottom:8px">Личные достижения тренера</h3><div class="aw-grid">${ACH.map(([id,ic,n,d])=>{const at=u.k2&&u.k2.ach[id];return `<div class="ach ${at?'':'off'}"><span class="ai" aria-hidden="true">${ic}</span><div><b>${n}</b><small>${d}${at?' · '+esc(at):''}</small></div></div>`;}).join('')}</div></div>
  ${aw.length?`<div class="tabs">${aw.map((a,i)=>`<button class="btn sm ${i===(UI.aws||0)?'on':''}" onclick="UI.aws=${i};render()">Сезон ${a.s}</button>`).join('')}</div>
   <div class="panel"><h3>«Золотой мяч» ${sel.s}</h3>${sel.ballon.map((b,i)=>`<p style="margin-top:8px">${['🥇','🥈','🥉'][i]} ${pl(b)}</p>`).join('')||'<p class="mute">—</p>'}</div>
   ${sel.lg.map(L=>`<div class="panel"><h3>${esc(L.name)}</h3><div class="grid g3" style="margin:8px 0;gap:10px"><div><small class="mute">Игрок сезона</small><p>${pl(L.mvp)}${L.mvp?` <span class="num">${L.mvp.r}</span>`:''}</p></div><div><small class="mute">Лучший бомбардир</small><p>${pl(L.sc)}${L.sc?` <span class="num">${L.sc.g}</span>`:''}</p></div><div><small class="mute">Тренер года</small><p><b class="${L.mgr.me?'acc':''}">${esc(L.mgr.n)}</b> <span class="mute">${esc(L.mgr.c)}</span></p></div></div>
     <small class="mute">Символическая сборная сезона</small><div class="tw"><table class="t"><tbody>${L.xi.map(x=>`<tr${S.P[x.id]?` class="click" onclick="G.openP(${x.id})"`:''}><td><span class="pos">${PR[x.slot]}</span></td><td>${esc(x.n)}</td><td class="mute">${esc(x.c)}</td><td class="r num">${x.r}</td></tr>`).join('')}</tbody></table></div></div>`).join('')}`
  :'<div class="panel mute">Награды вручаются в конце сезона: «Золотой мяч», игрок и тренер сезона, лучший бомбардир и символическая сборная.</div>'}`;
}
const _renderView=renderView;
renderView=function(){if(UI.view==='awards')return vAwards();return _renderView();};

/* ---------- титульный экран ---------- */
const _vTitle=vTitle;
vTitle=function(){return _vTitle().replace('<div class="logo">KI<span>CK</span></div>','<div class="logo">KI<span>CK</span> 2</div>');};
