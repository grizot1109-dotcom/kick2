'use strict';
/* ===== KICK 2: тренер сборной параллельно с клубом ===== */
const ntNeed=code=>{const n=S.N[code];return n?Math.round((n.base-8)*10):99;};
const ntOf=()=>S.user&&S.user.nt&&S.N[S.user.nt]?S.user.nt:null;
const NTM=['Глухая оборона','Оборона','Баланс','Атака','Всё в атаку'];

// своя заявка вместо автоматической
const _ntSquad=ntSquad;
ntSquad=function(code){
  if(code===ntOf()&&S.user.ntSq&&S.user.ntSq.length){const ids=new Set();const sq=S.user.ntSq.map(id=>S.P[id]).filter(p=>p&&p.nat===code&&!ids.has(p.id)&&ids.add(p.id));
    if(sq.length<18){(NTP[code]||[]).forEach(p=>{if(sq.length<23&&!ids.has(p.id)){ids.add(p.id);sq.push(p);}});}return sq.slice(0,23);}
  return _ntSquad(code);
};
function ntRefresh(){const c=ntOf();if(!c)return;rebuildNTP();const s=ntStrength(c);const m=(S.user.ntM==null?2:S.user.ntM)-2;s.att*=1+.04*m;s.mid*=1+.01*m;s.def*=1-.03*m;S.NS=S.NS||{};S.NS[c]=s;}
const _simNT=simNT;
simNT=function(f){
  const c=ntOf();const mine=c&&(f.h===c||f.a===c);if(mine)ntRefresh();
  _simNT(f);
  if(!mine)return;const home=f.h===c;const gf=home?f.hg:f.ag,ga=home?f.ag:f.hg;let out=gf>ga?1:gf<ga?-1:0;if(f.pen)out=(home?f.pen[0]>f.pen[1]:f.pen[1]>f.pen[0])?1:-1;
  const r=S.user.ntRec=S.user.ntRec||{w:0,d:0,l:0,streak:0};r[out>0?'w':out<0?'l':'d']++;r.streak=out<0?r.streak+1:0;
  const o=S.N[home?f.a:f.h];const comp=S.C[f.c];
  msg(`Сборная: ${natName(c)}`,`${natName(c)} ${gf}:${ga} ${o?o.name:''}`,`${comp?comp.name+(f.r?', '+f.r.toLowerCase():''):f.r||'Матч сборных'}.\n${out>0?'Победа!':out<0?'Поражение.':'Ничья.'}${f.pen?` Пенальти ${f.pen[0]}:${f.pen[1]}.`:''}\n\nБаланс сборной под вашим руководством: ${r.w}-${r.d}-${r.l}.`);
  if(r.streak>=5){msg('Федерация футбола','Вы уволены из сборной',`После пяти поражений подряд федерация ${natName(c)} решила сменить главного тренера.`);news(`Федерация ${natName(c)} уволила ${S.user.name}`,{n:c,k:'staff'});S.user.rep=clamp(S.user.rep-2,1,100);S.user.nt=null;S.user.ntSq=null;}
};
function ntWeek(){
  if(!S.user||S.legend)return;const c=ntOf();
  if(c){Object.values(S.C).forEach(cp=>{if(!cp.nt||!cp.done||cp.k3)return;cp.k3=1;if(!cp.teams.includes(c))return;
    if(cp.w===c){S.user.troph.unshift({id:cp.id,name:cp.name,s:season(),club:natName(c),tid:null});S.user.rep=clamp(S.user.rep+8,1,100);msg('Федерация футбола',`${natName(c)} — победитель: ${cp.name}!`,`Историческая победа! Сборная ${natName(c)} под вашим руководством выиграла турнир «${cp.name}».`);news(`${natName(c)} выигрывает ${cp.name}! Тренер — ${S.user.name}`,{n:c,k:'trophy'});}
    else if(ntPower(c)>=15&&cp.id!=='unl'){S.user.rep=clamp(S.user.rep-2,1,100);msg('Федерация футбола',`${cp.name}: итоги`,`Федерация недовольна выступлением сборной ${natName(c)} на турнире «${cp.name}». От команды такого уровня ждали большего.`);}});return;}
  if(dateOf(S.d).getDate()>7||rnd()>.35)return;
  if(!Object.keys(NTP).length)rebuildNTP();
  const cand=Object.values(S.N).filter(n=>ntNeed(n.code)<=S.user.rep+6&&ntNeed(n.code)>=S.user.rep-35&&NTP&&(NTP[n.code]||[]).length>=14);
  if(!cand.length)return;const n=cand.find(x=>x.code===S.user.nat&&rnd()<.6)||pick(cand);
  if(S.inbox.some(m=>m.type==='ntjob'&&!m.done))return;
  msg(`Федерация: ${n.name}`,`Предложение возглавить сборную: ${n.name}`,`Федерация футбола (${n.name}) предлагает вам пост главного тренера сборной.\n\nРаботу в клубе можно совмещать: сборная играет в окна сборных и на больших турнирах. Вы сами вызываете игроков и выбираете стиль игры.`,'ntjob',{c:n.code,exp:S.abs+21});
}
G.ntJob=function(id,ok){const m=S.inbox.find(x=>x.id===id);if(!m||m.done)return;m.done=true;if(!ok){m.res='Вы отказались.';render();return;}
  if(S.abs>m.data.exp){m.res='Предложение истекло.';render();return;}
  S.user.nt=m.data.c;S.user.ntSq=null;S.user.ntM=2;S.user.ntRec={w:0,d:0,l:0,streak:0};m.res=`Вы — главный тренер сборной: ${natName(m.data.c)}.`;news(`${S.user.name} возглавил сборную: ${natName(m.data.c)}`,{n:m.data.c,k:'staff'});toast(m.res);save();render();};
G.ntApply=function(code){const need=ntNeed(code);if(S.user.ntApp&&S.abs-S.user.ntApp<30)return toast('Федерации уже рассматривают вашу кандидатуру');S.user.ntApp=S.abs;
  if(S.user.rep>=need-8&&rnd()<clamp(.4+(S.user.rep-need)*.03,.1,.9)){msg(`Федерация: ${natName(code)}`,`Предложение возглавить сборную: ${natName(code)}`,`Федерация футбола рассмотрела вашу кандидатуру и готова назначить вас главным тренером сборной.`,'ntjob',{c:code,exp:S.abs+21});toast('Федерация готова вас назначить — смотрите «Входящие»');}
  else toast('Федерация выбрала другого кандидата');render();};
G.ntQuit=function(){askConfirm('Уйти из сборной?','Работа в клубе останется.','Да, уйти',()=>G.ntQuitDo(),true);};
G.ntQuitDo=function(){news(`${S.user.name} покинул пост тренера сборной: ${natName(S.user.nt)}`,{n:S.user.nt,k:'staff'});S.user.nt=null;S.user.ntSq=null;render();};
G.ntPick=function(id){const c=ntOf();if(!c)return;let sq=S.user.ntSq||ntSquad(c).map(p=>p.id);const i=sq.indexOf(id);if(i>=0)sq.splice(i,1);else{if(sq.length>=23)return toast('В заявке уже 23 игрока');sq.push(id);}S.user.ntSq=sq.slice();ntRefresh();render();};
G.ntAuto=function(){S.user.ntSq=null;ntRefresh();render();};
G.ntMent=function(v){S.user.ntM=v;ntRefresh();render();};
// товарищеские матчи в окна сборных, если официальной игры нет
function ntFriendly(){
  const c=ntOf();if(!c||!S.cal||!S.cal.nt||!S.cal.nt.includes(S.d))return;
  if((BYDAY[S.d]||[]).some(i=>{const f=S.F[i];return f.nt&&(f.h===c||f.a===c);}))return;
  const pw=ntPower(c);const opp=pick(Object.values(S.N).filter(n=>n.code!==c&&Math.abs(ntPower(n.code)-pw)<2.2))||pick(Object.values(S.N));if(!opp)return;
  const home=rnd()<.5;const f={h:home?c:opp.code,a:home?opp.code:c,nt:true,c:'friendly',d:S.d,r:'Товарищеский матч'};
  S.NS[opp.code]=S.NS[opp.code]||ntStrength(opp.code);simNT(f);
}
const _dailyN=daily;daily=function(){_dailyN();try{ntFriendly();}catch(e){console.error(e);}};
const _weeklyN=weekly;weekly=function(){_weeklyN();try{ntWeek();}catch(e){console.error(e);}};
const _vInboxN=vInbox;vInbox=function(){let html=_vInboxN();const m=S.inbox.find(x=>x.id===UI.msg);if(m&&m.type==='ntjob'&&!m.done)html+=`<div class="panel row"><b>Возглавить сборную ${esc(natName(m.data.c))}?</b><button class="btn pri" onclick="G.ntJob(${m.id},true)">Принять</button><button class="btn" onclick="G.ntJob(${m.id},false)">Отказаться</button></div>`;return html;};

VIEWS.splice(VIEWS.findIndex(v=>v[0]==='career')+1,0,['nt','Сборная']);
function vNT(){
  const c=ntOf();
  if(!c){rebuildNTP();const opts=Object.values(S.N).filter(n=>(NTP[n.code]||[]).length>=14).sort((a,b)=>ntNeed(a.code)-ntNeed(b.code));const ok=opts.filter(n=>ntNeed(n.code)<=S.user.rep+8);
    return `<div class="head"><div><h1>Сборная</h1><p class="mute">Вы пока не тренируете сборную. Работу в клубе можно совмещать.</p></div></div>
    <div class="panel"><p>Федерации предлагают работу тренерам с подходящей репутацией. Ваша репутация: <b>${repLabel(S.user.rep).toLowerCase()}</b>. Можно и самому предложить кандидатуру — ответ придёт сразу.</p></div>
    <div class="panel tw"><h3 style="margin-bottom:6px">Сборные, которые могут вас рассмотреть · ${ok.length}</h3><table class="t"><tbody>${ok.slice(-20).reverse().map(n=>`<tr><td><div class="cell">${ntCrest(n.code,22)}<span>${esc(n.name)}</span></div></td><td>${stars(25+n.base*4.5)}</td><td class="r"><button class="btn sm" onclick="G.ntApply('${n.code}')">Предложить кандидатуру</button></td></tr>`).join('')||'<tr><td class="mute">Пока ни одна — поднимите репутацию в клубе.</td></tr>'}</tbody></table></div>`;}
  rebuildNTP();const n=S.N[c];const sq=ntSquad(c);const ids=new Set(sq.map(p=>p.id));const pool=(NTP[c]||[]).slice(0,45);const r=S.user.ntRec||{w:0,d:0,l:0};
  const fx=S.F.filter(f=>f.nt&&(f.h===c||f.a===c)).sort((a,b)=>a.d-b.d);const next=fx.filter(f=>f.hg==null).slice(0,4),past=fx.filter(f=>f.hg!=null).slice(-6).reverse();
  const comps=Object.values(S.C).filter(x=>x.nt&&x.teams.includes(c));const s=S.NS&&S.NS[c];
  const row=f=>`<tr><td class="num mute">${fmtShort(f.d)}</td><td class="mute" style="font-size:12px">${esc((S.C[f.c]||{}).name||'')}</td><td><div class="cell">${ntCrest(f.h,18)}<span>${esc(sideName(f.h,true))}</span></div></td><td class="num" style="font-weight:600;text-align:center">${resTxt(f)}</td><td><div class="cell">${ntCrest(f.a,18)}<span>${esc(sideName(f.a,true))}</span></div></td></tr>`;
  return `<div class="head"><div class="row" style="gap:14px">${ntCrest(c,56)}<div><h1>${esc(n.name)}</h1><p class="mute">Главный тренер сборной · баланс ${r.w}-${r.d}-${r.l}</p></div></div><button class="btn bad" onclick="G.ntQuit()">Уйти из сборной</button></div>
  <div class="kpi"><div class="panel"><h3>Сила сборной</h3><span class="big">${ntPower(c).toFixed(1)}</span></div><div class="panel"><h3>В заявке</h3><span class="big">${sq.length}</span><small class="mute"> из 23</small></div><div class="panel"><h3>Турниры сезона</h3><span class="big" style="font-size:16px">${comps.map(x=>esc(x.name)).join(', ')||'Только товарищеские окна'}</span></div></div>
  <div class="panel"><h3 style="margin-bottom:8px">Стиль игры</h3><div class="seg">${NTM.map((x,i)=>`<button class="${(S.user.ntM==null?2:S.user.ntM)===i?'on':''}" onclick="G.ntMent(${i})">${x}</button>`).join('')}</div></div>
  <div class="grid g2" style="align-items:start"><div class="panel tw"><h3 style="margin-bottom:6px">Ближайшие матчи</h3>${next.length?`<table class="t"><tbody>${next.map(row).join('')}</tbody></table>`:'<p class="mute">Матчей пока нет — пары появляются после жеребьёвки.</p>'}<h3 style="margin:14px 0 6px">Последние результаты</h3>${past.length?`<table class="t"><tbody>${past.map(row).join('')}</tbody></table>`:'<p class="mute">—</p>'}</div>
   <div class="panel tw"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3 style="margin:0">Вызов в сборную</h3><button class="btn sm" onclick="G.ntAuto()">Автовызов</button></div>
    <table class="t"><thead><tr><th></th><th>Игрок</th><th>Поз.</th><th class="r">Возр.</th><th>Клуб</th><th>Сост.</th></tr></thead><tbody>${pool.map(p=>`<tr class="${ids.has(p.id)?'me':''}"><td><input type="checkbox" ${ids.has(p.id)?'checked':''} onchange="G.ntPick(${p.id})" aria-label="Вызвать ${esc(p.n)}"></td><td><div class="cell click" onclick="G.openP(${p.id})">${avatar(p,22)}<span>${esc(p.n)}</span></div></td><td><span class="pos">${PR[p.pos]}</span></td><td class="r num">${p.age}</td><td class="mute" style="font-size:12px">${p.club>=0?esc(S.T[p.club].n):'без клуба'}</td><td>${p.inj>0?'<span class="pill inj">Травма</span>':condBar(p.cond)}</td></tr>`).join('')}</tbody></table>
    <p class="mute" style="font-size:12px;margin-top:8px">Отметьте до 23 игроков. Если вызвано меньше 18, остальные места заполнятся автоматически. От заявки и стиля зависит сила сборной в матчах.</p></div></div>`;
}
const _rvN=renderView;renderView=function(){if(UI.view==='nt'&&S.user&&!S.legend)return vNT();return _rvN();};
