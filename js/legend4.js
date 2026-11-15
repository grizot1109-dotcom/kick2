'use strict';
/* ===== KICK 2: счёт во время своих моментов, история карьеры, профили, состав и трансферы в «Стань легендой»,
   порядок турниров, сборная, травмы, реалистичный «Золотой мяч» с новостями и церемонией ===== */
const curTeam=()=>{const t=userTeam();if(t)return t;const p=lgP&&lgP();return p&&p.club>=0?S.T[p.club]:null;};

/* ---------- 1. счёт во время ключевых моментов ---------- */
// матч считается заранее (без ваших моментов), по ходу моментов виден текущий счёт, итог — с вашими голами
function preSimFx(f){
  const th=S.T[f.h],ta=S.T[f.a];const H={slots:slotsOf(th),xi:lineupOf(th),tac:th.tac},Aw={slots:slotsOf(ta),xi:lineupOf(ta),tac:ta.tac};
  const s1=strength(H.xi,H.slots,th.tac),s2=strength(Aw.xi,Aw.slots,ta.tac);const lh=lam(s1,s2,th.tac,ta.tac,f.neu?0:1),la=lam(s2,s1,ta.tac,th.tac,f.neu?0:-1);
  const eh=[],ea=[];const run=(sd,od,l,arr,mins)=>{const n=poisson(l*mins/10);for(let i=0;i<n;i++){const c=chance(sd,od);if(c)arr.push(c);}};
  run(H,Aw,lh,eh,90);run(Aw,H,la,ea,90);const goals=a=>a.filter(e=>e.goal).length;let hg=goals(eh),ag=goals(ea),x=0,pen=null;
  if(f.dec){const [ah,aa]=aggregate(f);if(hg+ah===ag+aa){x=1;run(H,Aw,lh,eh,30);run(Aw,H,la,ea,30);hg=goals(eh);ag=goals(ea);if(hg+ah===ag+aa)pen=penalties(H.xi.map(id=>S.P[id]).filter(Boolean).reverse(),Aw.xi.map(id=>S.P[id]).filter(Boolean).reverse());}}
  const res={hg,ag,x,pen,h:quickSide(th,H,eh,ea,hg,ag,xiLevel(Aw)),a:quickSide(ta,Aw,ea,eh,ag,hg,xiLevel(H))};
  // голы и передачи вашего игрока — только из ваших моментов
  const me=lgP();if(me)['h','a'].forEach(k=>{const sd=res[k];const mates=sd.played.filter(id=>id!==me.id&&S.P[id]&&S.P[id].pos!=='GK');if(!mates.length)return;
    sd.g=sd.g.map(id=>id===me.id?pick(mates):id);sd.as=sd.as.map(id=>id===me.id?pick(mates):id);});
  const tl=[...res.h.g.map(id=>({side:'h',id})),...res.a.g.map(id=>({side:'a',id}))].map(e=>({...e,m:ri(2,90)})).sort((a,b)=>a.m-b.m);
  return {res,tl};
}
const _pdL4=processDay;
processDay=function(){
  _pdL4();const L=LG();if(!L||!L.mm||L.mm.day!==S.d)return;
  if(!L.pre||L.pre.fi!==L.mm.f||L.pre.day!==S.d){const f=S.F[L.mm.f];const r=preSimFx(f);L.pre={fi:L.mm.f,day:S.d,res:r.res,tl:r.tl};}
};
const _simFxL4=simFx;
simFx=function(f){const L=LG();if(L&&L.pre&&S.F[L.pre.fi]===f&&L.pre.day===f.d){const r=L.pre.res;L.pre=null;applyRes(f,r,false);return;}_simFxL4(f);};
vLMatch=function(){
  const L=L3();const p=lgP();const mm=L.mm;if(!mm)return vLegend();const f=S.F[mm.f];const H=S.T[f.h],Aw=S.T[f.a];const mySide=f.h===p.club?'h':'a';
  const mo=mm.end?null:mm.list[mm.i];const min=mo?mo.m:999;const tl=(L.pre&&L.pre.tl)||[];
  const base=s=>tl.filter(e=>e.side===s&&e.m<min).length;
  const my=mm.log.filter(e=>/ГОЛ|партнёр забивает/.test(e.r)).length,their=mm.log.filter(e=>/Гол в ваши ворота|прошёл и забил/.test(e.r)).length;
  const hg=base('h')+(mySide==='h'?my:their),ag=base('a')+(mySide==='a'?my:their);
  const ev=[...tl.filter(e=>e.m<min).map(e=>({m:e.m,t:`⚽ ${S.P[e.id]?S.P[e.id].n:''}`,side:e.side})),...mm.log.filter(e=>e.cls==='good'&&/ГОЛ|забивает/.test(e.r)).map(e=>({m:e.m,t:`⚽ ${/партнёр/.test(e.r)?'Голевая передача: '+p.n:p.n}`,side:mySide}))].sort((a,b)=>a.m-b.m);
  const opts=mo?momOpts(p,mo,S.T[mm.opp]):[];
  return `<div class="row" style="gap:10px">${logo(compOfFx(f).id,28)}<b>${esc(compOfFx(f).name)}</b><span class="mute">${esc(f.r||'')}</span></div>
  <div class="panel score"><div class="side">${crest(H,52)}<b>${esc(H.n)}</b></div><div class="res">${hg} : ${ag}<small>${mo?min+'′':'Матч доигрывается'}</small></div><div class="side r"><b>${esc(Aw.n)}</b>${crest(Aw,52)}</div></div>
  ${ev.length?`<div class="panel lm-ev">${ev.map(e=>`<div class="lm-e ${e.side}"><span class="num">${e.m}′</span> ${esc(e.t)}</div>`).join('')}</div>`:''}
  ${mo?`<div class="panel htalk"><div class="row" style="justify-content:space-between"><h3>${mo.m}′ · ваш момент ${mm.i+1} из ${mm.list.length}</h3><span class="mute" style="font-size:12px">${avatar(p,22)} ${esc(p.n)}</span></div><h2 style="margin:10px 0 14px;text-transform:none;letter-spacing:0">${esc(mo.txt)}</h2>
    <div class="talks">${opts.map(o=>`<button class="tbtn" onclick="G.lMom('${o.k}')"><b>${o.l}</b><small>Шанс успеха: ${Math.round(o.p*100)}%</small><span class="moodbar" style="margin-top:4px"><i style="width:${Math.round(o.p*100)}%;background:${o.p>=.55?'var(--good)':o.p>=.3?'var(--warn)':'var(--bad)'}"></i></span></button>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn sm" onclick="G.lMomAuto()">Сыграть остальное автоматически</button></div></div>`
  :`<div class="panel"><h3>Ваши моменты сыграны</h3><p style="margin:8px 0">Голы: <b>${mm.g}</b> · передачи: <b>${mm.a}</b>${mm.rc?' · <span class="bad">удаление</span>':''}</p><button class="btn pri" onclick="G.lMomEnd()">Финальный свисток ›</button></div>`}
  ${mm.log.length?`<div class="panel feed">${mm.log.slice().reverse().map(e=>`<div class="ev"><span class="m">${e.m}′</span><span class="t">${esc(e.txt)} <b>${esc(e.ch)}</b> — <span class="${e.cls}">${esc(e.r)}</span></span></div>`).join('')}</div>`:''}`;
};
// последний матч — на странице «Моя карьера»
const _vLegL4=vLegend;
vLegend=function(){let h=_vLegL4();const L=LG();const r=L&&L.lastRes;if(!r)return h;const p=lgP();
  const blk=`<div class="panel"><h3>Последний матч</h3><div class="row" style="margin-top:8px;gap:10px">${crest(S.T[r.h],28)}<b>${esc(S.T[r.h].n)} ${r.hg}:${r.ag} ${esc(S.T[r.a].n)}</b>${crest(S.T[r.a],28)}</div><p class="mute" style="font-size:13px;margin-top:6px">${esc(r.c)} · ${r.d} · ваши голы: ${r.g}, передачи: ${r.as} · оценка <b class="${r.r>=7?'good':r.r<6.3?'bad':''}">${r.r.toFixed(1).replace('.',',')}</b></p></div>`;
  return h.replace('<div class="kpi">',blk+'<div class="kpi">');};

/* ---------- 2. история карьеры (сезоны и клубы) — для всех игроков ---------- */
const _seL4=seasonEnd;
seasonEnd=function(){
  const label=season();
  for(const id in S.P){const p=S.P[id];if(!p.st)continue;if(p.club<0&&!p.st.ap)continue;const t=p.club>=0?S.T[p.club]:null;
    p.ch=p.ch||[];p.ch.unshift({s:label,t:t?t.id:null,n:t?t.n:'Без клуба',ap:p.st.ap,g:p.st.g,as:p.st.as,r:p.st.ap?+(p.st.r/p.st.ap).toFixed(2):null});if(p.ch.length>22)p.ch.length=22;}
  _seL4();
};
function careerRows(p){
  const rows=[];const t=p.club>=0?S.T[p.club]:null;rows.push({s:season(),t:t?t.id:null,n:t?t.n:'Без клуба',ap:p.st.ap,g:p.st.g,as:p.st.as,r:p.st.ap?+(p.st.r/p.st.ap).toFixed(2):null,cur:1});
  (p.ch||[]).forEach(x=>rows.push(x));
  const L=S.legend&&S.legend.pid===p.id?S.legend:null;if(L&&(!p.ch||!p.ch.length))L.hist.forEach(h=>rows.push({s:h.s,t:h.tid,n:h.c,ap:h.ap,g:h.g,as:h.as,r:+h.r||null}));
  return rows;
}
const rBadge=r=>r==null?'<span class="rb mute">—</span>':`<span class="rb ${r>=7?'g':r>=6.6?'y':'o'}">${r.toFixed(1).replace('.',',')}</span>`;
function careerHTML(p){
  const rows=careerRows(p);const mode=UI.pcm||'s';
  const head=`<div class="pc-h"><span>${mode==='s'?'Основная команда':'Клубы'}</span><span title="Матчи">▦</span><span title="Голы">⚽</span><span title="Передачи">👟</span><span title="Средняя оценка">★</span></div>`;
  let body;
  if(mode==='s')body=rows.map(x=>`<div class="pc-r">${x.t!=null&&S.T[x.t]?crest(S.T[x.t],34):'<span style="width:34px"></span>'}<div class="pc-n"><b>${esc(x.n)}</b><small>${x.s}${x.cur?' · идёт':''}</small></div><span class="num">${x.ap}</span><span class="num">${x.g}</span><span class="num">${x.as}</span>${rBadge(x.r)}</div>`).join('');
  else{const by=new Map();rows.forEach(x=>{const k=x.t!=null?x.t:x.n;const e=by.get(k)||{t:x.t,n:x.n,ap:0,g:0,as:0,rs:0,rn:0,from:x.s,to:x.s};e.ap+=x.ap;e.g+=x.g;e.as+=x.as;if(x.r!=null&&x.ap){e.rs+=x.r*x.ap;e.rn+=x.ap;}e.from=x.s;by.set(k,e);});
    body=[...by.values()].map(e=>`<div class="pc-r">${e.t!=null&&S.T[e.t]?crest(S.T[e.t],34):'<span style="width:34px"></span>'}<div class="pc-n"><b>${esc(e.n)}</b><small>${e.from===e.to?e.to:e.from.split('/')[0]+' — '+(+e.to.split('/')[0]+1)}</small></div><span class="num">${e.ap}</span><span class="num">${e.g}</span><span class="num">${e.as}</span>${rBadge(e.rn?e.rs/e.rn:null)}</div>`).join('');}
  const L=S.legend&&S.legend.pid===p.id?S.legend:null;const nt=L&&L.nt?`<p class="mute" style="font-size:13px;margin-top:10px">Сборная (${esc(natName(p.nat))}): ${L.nt.caps} ${plural(L.nt.caps,'матч','матча','матчей')}, ${L.nt.goals} ${plural(L.nt.goals,'гол','гола','голов')}</p>`:'';
  return `<div class="pcar"><div class="seg pc-seg"><button class="${mode==='s'?'on':''}" onclick="UI.pcm='s';renderModal()">Сезоны</button><button class="${mode==='c'?'on':''}" onclick="UI.pcm='c';renderModal()">Клубы</button></div>
   <div class="panel pc-list">${head}${body}</div>${nt}<p class="mute" style="font-size:12px;margin-top:8px">История ведётся с начала вашей карьеры в KICK 2.</p></div>`;
}
const _rmL4=renderModal;
renderModal=function(){
  _rmL4();const box=document.getElementById('mbox');const p=UI.modalP!=null?S.P[UI.modalP]:null;if(!p||!box||!box.querySelector('.phead'))return;
  const tab=UI.ptab||'prof';const tabs=document.createElement('div');tabs.className='subtabs ptabs';
  tabs.innerHTML=[['prof','Профиль'],['car','Карьера']].map(([k,l])=>`<button class="${tab===k?'on':''}" onclick="UI.ptab='${k}';renderModal()">${l}</button>`).join('');
  box.querySelector('.phead').after(tabs);box.classList.toggle('pt-career',tab==='car');
  if(tab==='car'){const d=document.createElement('div');d.innerHTML=careerHTML(p);box.appendChild(d.firstElementChild);}
  if(typeof postRender==='function'){try{slideInd('.ptabs','ptab');}catch(e){}}
};
// в «Стань легендой» — только свой профиль; в карьере тренера — любой
const _openPL4=G.openP;
G.openP=function(id){const L=LG();if(L&&id!==L.pid){toast('В карьере игрока можно открыть только свой профиль');return;}UI.ptab=UI.ptab||'prof';_openPL4(id);};
const _closePL4=G.closeP;G.closeP=function(){UI.ptab='prof';UI.pcm='s';_closePL4();};

/* ---------- 3. состав и трансферы в карьере игрока ---------- */
const _dtL4=doTransfer;
doTransfer=function(p,buyer,fee,yrs,wage){const from=p.club;_dtL4(p,buyer,fee,yrs,wage);S.tlog=S.tlog||[];S.tlog.unshift({d:S.d,s:season(),p:p.id,n:p.n,pos:p.pos,age:p.age,from,to:buyer.id,fee:fee||0});if(S.tlog.length>500)S.tlog.length=500;};
LVIEWS.splice(LVIEWS.findIndex(v=>v[0]==='llife')+1,0,['squad','Состав'],['ltrans','Трансферы']);
function vLTrans(){
  const t=curTeam();const f=UI.ltf||'all';let list=(S.tlog||[]).filter(x=>S.T[x.to]);
  if(f==='lg'&&t)list=list.filter(x=>S.T[x.to].lg===t.lg||(x.from>=0&&S.T[x.from]&&S.T[x.from].lg===t.lg));if(f==='top')list=list.filter(x=>x.fee>=2e7);
  return `<div class="head"><div><h1>Трансферы</h1><p class="mute">${windowOpen(S.d)?'<span class="good">Трансферное окно открыто</span>':'Окно закрыто'} · клубы покупают и продают игроков так же, как в карьере тренера</p></div></div>
  <div class="subtabs">${[['all','Все'],['lg','Моя лига'],['top','Дороже 20 млн']].map(([k,l])=>`<button class="${f===k?'on':''}" onclick="UI.ltf='${k}';render()">${l}</button>`).join('')}</div>
  <div class="panel tw" style="padding:6px">${list.length?`<table class="t"><thead><tr><th>Дата</th><th>Игрок</th><th>Поз.</th><th class="r">Возр.</th><th>Откуда</th><th>Куда</th><th class="r">Сумма</th></tr></thead><tbody>${list.slice(0,150).map(x=>{const p=S.P[x.p];const fr=x.from>=0?S.T[x.from]:null;return `<tr><td class="num mute">${fmtShort(x.d)}</td><td><div class="cell">${p?avatar(p,24):''}<span>${esc(x.n)}</span></div></td><td><span class="pos">${PR[x.pos]}</span></td><td class="r num">${x.age}</td><td><div class="cell">${fr?crest(fr,18)+'<span>'+esc(fr.n)+'</span>':'<span class="acc">Свободный агент</span>'}</div></td><td><div class="cell">${crest(S.T[x.to],18)}<span>${esc(S.T[x.to].n)}</span></div></td><td class="r num">${x.fee?money(x.fee):'бесплатно'}</td></tr>`;}).join('')}</tbody></table>`:'<p class="mute" style="padding:10px">Трансферов пока нет — они появятся, когда откроется окно и клубы начнут сделки.</p>'}</div>`;
}
const _rvL4=renderView;
renderView=function(){if(LG()){if(UI.view==='squad')return vSquad();if(UI.view==='ltrans')return vLTrans();}return _rvL4();};

/* ---------- 4. турниры: сначала свой, страны — по силе лиг ---------- */
const natStrength=n=>Math.max(...S.L.filter(L=>L.nat===n).map(L=>L.rep-(L.tier-1)*25));
vComps=function(){
  const cl=compList();const ct=curTeam();if(!UI.tc)UI.tc=ct?ct.nat:'ENG';
  const tab=UI.tt;let items=tab==='country'?(cl.country[UI.tc]||[]):tab==='intl'?cl.intl:cl.nt;
  if(!UI.tk||!items.find(x=>x.k===UI.tk))UI.tk=items[0]&&items[0].k;
  const nats=Object.keys(cl.country).sort((a,b)=>natStrength(b)-natStrength(a));
  return `<div class="head"><h1>Турниры</h1></div>
  <div class="tabs"><button class="btn sm ${tab==='country'?'on':''}" onclick="UI.tt='country';UI.tk=null;render()">Страны</button><button class="btn sm ${tab==='intl'?'on':''}" onclick="UI.tt='intl';UI.tk=null;render()">Международные клубные</button><button class="btn sm ${tab==='nt'?'on':''}" onclick="UI.tt='nt';UI.tk=null;render()">Сборные</button><button class="btn sm ${tab==='hist'?'on':''}" onclick="UI.tt='hist';render()">Зал славы</button></div>
  ${tab==='country'?`<label class="field" style="max-width:280px">Страна<select onchange="UI.tc=this.value;UI.tk=null;render()">${nats.map(n=>`<option value="${n}" ${n===UI.tc?'selected':''}>${natName(n)}</option>`).join('')}</select></label>`:''}
  ${tab==='hist'?vHall():`<div class="tabs">${items.map(x=>`<button class="btn sm ${x.k===UI.tk?'on':''}" onclick="UI.tk='${x.k}';UI.tr=null;render()"><span class="cell" style="gap:6px">${logo(x.id,16)}${esc(x.name)}</span></button>`).join('')||'<p class="mute">В этом сезоне турниров нет.</p>'}</div>${UI.tk?vComp(UI.tk):''}`}`;
};
const _goL4=G.go;G.go=function(v){if(v==='comps'){const ct=curTeam();if(ct){UI.tt='country';UI.tc=ct.nat;UI.tk='L'+ct.lg;UI.tr=null;}}_goL4(v);};

/* ---------- 5. сборная в карьере игрока ---------- */
function legendInNT(p){if(!p||!S.N[p.nat])return false;if(!Object.keys(NTP).length)rebuildNTP();return ntSquad(p.nat).some(x=>x.id===p.id);}
const _simNTL4=simNT;
simNT=function(f){
  const L=LG();const p=lgP();const mine=L&&p&&!L.done&&(f.h===p.nat||f.a===p.nat)&&legendInNT(p);
  const c=S.C[f.c];const g0=c&&c.sc?(c.sc[p&&p.id]||0):0;
  _simNTL4(f);
  if(!mine)return;L.nt=L.nt||{caps:0,goals:0};const xi=S.NS&&S.NS[p.nat]&&S.NS[p.nat].xi||[];const played=xi.includes(p.id)||rnd()<.35;if(!played)return;
  L.nt.caps++;let g=c&&c.sc?(c.sc[p.id]||0)-g0:0;if(!c){const home=f.h===p.nat;const gf=home?f.hg:f.ag;for(let i=0;i<gf;i++)if(rnd()<(['ST','AMC','AML','AMR'].includes(p.pos)?.3:.08))g++;}
  L.nt.goals+=g;if(c){L.ntComps=L.ntComps||{};L.ntComps[c.id]=1;}
  const home=f.h===p.nat;const o=S.N[home?f.a:f.h];
  msg(`Сборная: ${natName(p.nat)}`,`${natName(p.nat)} ${home?f.hg:f.ag}:${home?f.ag:f.hg} ${o?o.name:''}`,`${c?c.name+(f.r?', '+f.r.toLowerCase():''):'Товарищеский матч'}.\nВы ${xi.includes(p.id)?'вышли в стартовом составе':'вышли на замену'}${g?` и забили ${g} ${plural(g,'гол','гола','голов')}`:''}.\n\nЗа сборную: ${L.nt.caps} ${plural(L.nt.caps,'матч','матча','матчей')}, ${L.nt.goals} ${plural(L.nt.goals,'гол','гола','голов')}.`);
};
function legendNTDaily(){
  const L=LG();const p=lgP();if(!L||!p||L.done||!S.cal||!S.cal.nt)return;
  const winDay=S.cal.nt.find(d=>d>=S.d&&d-S.d<=3);
  if(winDay!=null&&L.ntCall!==winDay&&legendInNT(p)){L.ntCall=winDay;const first=!L.nt||!L.nt.caps;msg(`Федерация: ${natName(p.nat)}`,first?'Первый вызов в сборную!':'Вызов в сборную',first?`Главный тренер сборной ${natName(p.nat)} включил вас в заявку. Это ваш первый вызов в национальную команду!`:`Вы снова в заявке сборной ${natName(p.nat)} на матчи этого окна.`);if(first)news(`${p.n} впервые вызван в сборную: ${natName(p.nat)}`,{p:p.id,n:p.nat,k:'info'});}
  if(S.cal.nt.includes(S.d)&&legendInNT(p)&&!(S.user&&S.user.nt===p.nat)&&!(BYDAY[S.d]||[]).some(i=>{const f=S.F[i];return f.nt&&(f.h===p.nat||f.a===p.nat);})){
    const pw=ntPower(p.nat);const opp=pick(Object.values(S.N).filter(n=>n.code!==p.nat&&Math.abs(ntPower(n.code)-pw)<2.2));if(opp){S.NS=S.NS||{};S.NS[opp.code]=S.NS[opp.code]||ntStrength(opp.code);const hm=rnd()<.5;simNT({h:hm?p.nat:opp.code,a:hm?opp.code:p.nat,nt:true,c:'friendly',d:S.d,r:'Товарищеский матч'});}}
  // трофей сборной, если вы играли на турнире
  Object.values(S.C).forEach(c=>{if(!c.nt||!c.done||c.lgk||c.w!==p.nat)return;c.lgk=1;if(L.ntComps&&L.ntComps[c.id]){L.tro.unshift({n:c.name,s:season(),c:natName(p.nat),id:c.id});msg(`Сборная: ${natName(p.nat)}`,`Вы выиграли: ${c.name}!`,`Сборная ${natName(p.nat)} — победитель турнира «${c.name}»! Вы были в составе команды.`);news(`${natName(p.nat)} выигрывает ${c.name}! В составе — ${p.n}`,{p:p.id,n:p.nat,k:'trophy'});}});
}

/* ---------- 6. травмы в карьере игрока ---------- */
const INJ_L=[['Ушиб',3,8,.32],['Растяжение мышц бедра',7,16,.25],['Надрыв задней поверхности бедра',18,40,.17],['Растяжение связок голеностопа',14,35,.12],['Повреждение мениска',45,90,.07],['Перелом плюсневой кости',60,100,.04],['Разрыв крестообразной связки',190,280,.03]];
function injByDays(d){return d<=8?'Ушиб':d<=16?'Растяжение мышц бедра':d<=40?'Надрыв задней поверхности бедра':d<=90?'Повреждение мениска':d<=120?'Перелом плюсневой кости':'Разрыв крестообразной связки';}
const _arL4=applyRes;
applyRes=function(f,res,live){
  const L=LG();const p=lgP();const before=p?p.inj:0;_arL4(f,res,live);
  if(!L||!p||L.done||f.nt||(f.h!==p.club&&f.a!==p.club))return;const sd=f.h===p.club?res.h:res.a;if(!sd||!sd.played.includes(p.id))return;
  let name=null,days=0;
  if(p.inj>before){days=p.inj;name=injByDays(days);}
  else if(rnd()<.011*(1+(100-p.cond)/60)*(p.age>=31?1.3:1)){const ty=pickW(INJ_L,x=>x[3]);days=ri(ty[1],ty[2]);name=ty[0];p.inj=Math.max(p.inj,days);}
  if(!name)return;L.injN=(L.injN||0)+1;L.injLast={n:name,d:days,s:season()};
  msg('Медицинский штаб',`Травма: ${name.toLowerCase()}`,`Вы получили травму в матче ${S.T[f.h].n} — ${S.T[f.a].n}.\n\nДиагноз: ${name.toLowerCase()}. Восстановление займёт примерно ${injTxt(days)}.${days>=150?'\n\nЭто тяжёлая травма: после возвращения понадобится время, чтобы набрать форму.':''}`);
  if(days>=40)news(`${p.n} выбыл на ${injTxt(days)}: ${name.toLowerCase()}`,{p:p.id,t:[p.club],k:'info'});
  if(days>=150){p.cond=Math.min(p.cond,40);if(rnd()<.5)setA(p,A.pac,-1);}
};

/* ---------- 7. «Золотой мяч»: оценка за весь сезон, новости, сливы, церемония 30 октября ---------- */
const BD_GW={ucl:2.4,uel:1.15,uecl:.7,lib:1.3,sud:.7,cwc:1.4,acl:.6,cafcl:.6,ccc:.5,wc:3.3,euro:2.8,copa:2.4,afcon:1.3,asian:1.1,gold:.8,unl:.7};
const BD_TW={ucl:32,uel:10,uecl:5,lib:12,sud:4,cwc:8,acl:5,cafcl:5,ccc:4};
const BD_NW={wc:50,euro:36,copa:28,afcon:15,asian:11,gold:7,unl:6};
const BD_INTL=['ucl','uel','uecl','lib','sud','cwc'];
function bdAnomaly(p,t,L,intlG,label){
  if(p.st.ap<14)return false;const k=clamp(p.st.ap/50,.4,1);const lg=(L.sc&&L.sc[p.id])||0;const r=p.st.ap?p.st.r/p.st.ap:0;
  const wonIntl=t.tr.some(x=>x.s===label&&['ucl','lib'].includes(x.id))||Object.values(S.C).some(c=>['ucl','lib'].includes(c.id)&&c.done&&c.w===t.id);
  const wonLg=t.tr.some(x=>x.s===label&&x.id.startsWith('L:'))||(standings(L)[0]||{}).id===t.id;
  const att=['ST','AMC','AML','AMR'].includes(p.pos);
  if(att)return lg>=30*k&&r>=7.4&&(intlG>=10*k||wonIntl&&intlG>=6*k);
  return r>=7.7&&wonLg&&wonIntl; // защитники, полузащитники, вратари: выдающиеся оценки, чемпионство и главный международный трофей
}
function bdRank(minAp){
  minAp=minAp==null?14:minAp;
  const top10=new Set(S.L.filter(L=>L.tier===1).sort((a,b)=>b.rep-a.rep).slice(0,10).map(L=>L.i));
  const ig={};Object.values(S.C).forEach(c=>{if(!BD_INTL.includes(c.id)||!c.sc)return;for(const id in c.sc)ig[id]=(ig[id]||0)+c.sc[id];});
  const label=season();const cw={};Object.values(S.C).forEach(c=>{if(!c.sc)return;const w=BD_GW[c.id]||(c.nat?.35:.6);for(const id in c.sc)cw[id]=(cw[id]||0)+c.sc[id]*w;});
  const ntWin={};Object.values(S.C).forEach(c=>{if(c.nt&&c.done&&c.w)ntWin[c.w]=(ntWin[c.w]||0)+(BD_NW[c.id]||4);});
  const out=[];
  for(const id in S.P){const p=S.P[id];if(p.club<0||!p.st||p.st.ap<minAp)continue;const t=S.T[p.club];const L=S.L[t.lg];if(!L||L.tier>1||!top10.has(L.i))continue;
    // топ-5 лиг — всегда; лиги 6–10 — только при аномальном сезоне и в своей лиге, и в международных турнирах
    if(L.rep<80&&!bdAnomaly(p,t,L,ig[id]||0,label))continue;
    const lw=Math.pow(L.rep/85,2);const pm=['ST','AMC','AML','AMR'].includes(p.pos)?1:['MC','DM','ML','MR'].includes(p.pos)?1.45:p.pos==='GK'?2.6:2.1;
    let s=(p.st.r/p.st.ap-6.6)*32+((L.sc&&L.sc[id])||0)*1.15*lw*pm+p.st.as*.5*lw*pm+(cw[id]||0)*pm;
    t.tr.forEach(x=>{if(x.s!==label)return;s+=x.id.startsWith('L:')?14*lw:(BD_TW[x.id]!=null?BD_TW[x.id]:/super/i.test(x.id+x.name)?1:4);});
    if(ntWin[p.nat]&&S.NS&&S.NS[p.nat]&&(S.NS[p.nat].xi||[]).includes(p.id))s+=ntWin[p.nat];
    s+=t.rep*.08+ca(p)*1.2;out.push({id:p.id,n:p.n,c:t.n,t:t.id,pos:p.pos,s:Math.round(s*10)/10});}
  return out.sort((a,b)=>b.s-a.s);
}
const _saL4=seasonAwards;
seasonAwards=function(){
  const k2b=S.user&&S.user.k2?S.user.k2.ballon:0;_saL4();
  S.news=S.news.filter(n=>!/^«Золотой мяч» сезона/.test(n.txt));S.inbox=S.inbox.filter(m=>m.title!=='«Золотой мяч» у нашего игрока!');if(S.user&&S.user.k2)S.user.k2.ballon=k2b;
  const rec=S.aw&&S.aw[0];if(rec)rec.ballon=[];
  S.bd={label:season(),list:bdRank().slice(0,30),done:false,step:{}};
};
const BD_RUM=[w=>`Слив: «Золотой мяч» достанется ${w.n} — утверждает инсайдер`,w=>`Букмекеры: главный фаворит «Золотого мяча» — ${w.n}`,w=>`В сети появилась фотография ${w.n} с трофеем. Подделка или утечка?`,w=>`Журналист: ${w.n} уже знает о своей победе`,w=>`Опрос болельщиков: ${w.n} — лучший игрок сезона`,w=>`СМИ: ${w.n} приедет на церемонию со всей семьёй`,w=>`Инсайдер: в голосовании журналистов лидирует ${w.n}`];
function bdDaily(){
  const B=S.bd;if(!B||B.done||!B.list.length)return;const d=dateOf(S.d);if(d.getMonth()!==9)return;const day=d.getDate();const top=B.list;const pn=x=>S.P[x.id]?S.P[x.id].n:x.n;
  if(day>=20&&!B.step.short){B.step.short=1;news(`Объявлены 30 номинантов на «Золотой мяч» сезона ${B.label}`,{p:top[0].id,t:[top[0].t],k:'trophy',b:`Главные кандидаты: ${top.slice(0,5).map(x=>`${pn(x)} (${x.c})`).join(', ')}. Церемония — 30 октября.`});
    const L=LG();if(L&&top.some(x=>x.id===L.pid))msg('Пресс-служба','Вы в списке номинантов на «Золотой мяч»!',`Вы вошли в тридцатку претендентов на «Золотой мяч» сезона ${B.label}. Церемония пройдёт 30 октября.`);
    const ut=userTeam();const mine=ut?top.filter(x=>S.P[x.id]&&S.P[x.id].club===ut.id):[];if(mine.length)msg('Пресс-служба',`Номинанты на «Золотой мяч» из ${ut.n}`,`В тридцатку претендентов на «Золотой мяч» сезона ${B.label} вошли наши игроки: ${mine.map(x=>`${pn(x)} (${top.indexOf(x)+1}-е место в прогнозах)`).join(', ')}.\n\nЦеремония пройдёт 30 октября.`);}
  if(day>=23&&day<=29&&!B.step['r'+day]){B.step['r'+day]=1;const w=rnd()<.6?top[0]:pick(top.slice(1,4));news(pick(BD_RUM)(w),{p:w.id,t:[w.t],k:'info',b:'Официальные итоги объявят на церемонии 30 октября. До этого — только слухи.'});}
  if(day>=30&&!B.done){B.done=true;const rec=(S.aw||[]).find(a=>a.s===B.label);const pn_=x=>({id:x.id,n:pn(x),c:x.c,pos:x.pos});const t3=top.slice(0,3).map(pn_);if(rec)rec.ballon=t3;
    news(`${pn(top[0])} — обладатель «Золотого мяча» сезона ${B.label}!`,{p:top[0].id,t:[top[0].t],k:'trophy',gb:1,b:`Церемония в Париже: 1. ${pn(top[0])} (${top[0].c}), 2. ${pn(top[1]||{})} (${(top[1]||{}).c||''}), 3. ${pn(top[2]||{})} (${(top[2]||{}).c||''}). Далее: ${top.slice(3,10).map(pn).join(', ')}.`});S.news[0].gb=1;
    const L=LG();if(L){const i=top.findIndex(x=>x.id===L.pid);if(i>=0&&i<10){const pl=i+1;L.aw.unshift({n:pl===1?'«Золотой мяч»':`${pl}-е место в голосовании за «Золотой мяч»`,s:B.label});msg('Пресс-служба',pl===1?'Вы выиграли «Золотой мяч»!':`«Золотой мяч»: ${pl}-е место`,pl===1?`Вы — лучший футболист мира по итогам сезона ${B.label}! Трофей вручили на церемонии в Париже.`:`По итогам голосования вы заняли ${pl}-е место в борьбе за «Золотой мяч» сезона ${B.label}.`);}}
    const ut=userTeam();if(ut&&S.P[top[0].id]&&S.P[top[0].id].club===ut.id&&S.user.k2){S.user.k2.ballon=1;msg('Пресс-служба','«Золотой мяч» у нашего игрока!',`${pn(top[0])} получил «Золотой мяч» по итогам сезона ${B.label}.`);}
    else if(ut){const m=top.slice(0,10).filter(x=>S.P[x.id]&&S.P[x.id].club===ut.id);if(m.length)msg('Пресс-служба','Итоги «Золотого мяча»',`Победитель — ${pn(top[0])} (${top[0].c}). Наши игроки в десятке: ${m.map(x=>`${pn(x)} — ${top.indexOf(x)+1}-е место`).join(', ')}.`);}}
}
// карточка церемонии на главной
const _featL4=featured;
featured=function(n){if(!n.gb)return _featL4(n);const p=n.p!=null?S.P[n.p]:null;
  return `<article class="feat gb-feat"><div class="feat-txt"><span class="kind">«Золотой мяч»</span><h2>${esc(n.txt)}</h2>${n.b?`<p>${esc(n.b)}</p>`:''}<small class="mute">${esc(n.d)}</small></div>
   <div class="feat-art gb-art"><div class="gb-ball" aria-hidden="true"></div>${p&&p.photo&&SET.photos!==false?`<img class="feat-ph${faceOf(p)?' face':''}" src="${esc(faceOf(p)||p.photo)}" alt="" onerror="this.remove()">`:''}${p?`<div class="feat-cap">${esc(p.n)}</div>`:''}</div></article>`;};

// гонка за «Золотой мяч» во вкладке «Награды» (обе карьеры)
function bdPanel(){
  const B=S.bd;const ut=userTeam();const me=LG()?LG().pid:null;
  const row=(x,i,hl)=>{const p=S.P[x.id];const own=p&&(p.id===me||ut&&p.club===ut.id);return `<tr class="${own?'me':''}"><td class="num mute">${i+1}</td><td><div class="cell">${p?avatar(p,26):''}<b>${esc(p?p.n:x.n)}</b></div></td><td><span class="pos">${PR[x.pos]}</span></td><td><div class="cell">${S.T[x.t]?crest(S.T[x.t],18):''}<span class="mute">${esc(x.c)}</span></div></td>${hl?`<td class="r">${i<3?['🥇','🥈','🥉'][i]:''}</td>`:''}</tr>`;};
  let title,sub,list,hl=false;
  if(B&&B.done&&dateOf(S.d).getMonth()>=9&&dateOf(S.d).getMonth()<=11){title=`«Золотой мяч» ${B.label}: итоги`;sub='Церемония прошла 30 октября';list=B.list.slice(0,10);hl=true;}
  else if(B&&!B.done&&B.step&&B.step.short){title=`Номинанты на «Золотой мяч» ${B.label}`;sub='Церемония — 30 октября. Порядок — прогноз журналистов';list=B.list.slice(0,10);}
  else{title=`Гонка за «Золотой мяч» ${season()}`;sub='Прогноз по ходу сезона: сила лиги, голы, оценки, трофеи, Лига чемпионов и турниры сборных';list=bdRank(5).slice(0,10);}
  return `<div class="panel bd-race"><div class="row" style="justify-content:space-between"><h3>${title}</h3><span class="mute" style="font-size:12px">${sub}</span></div>${list.length?`<div class="tw"><table class="t"><tbody>${list.map((x,i)=>row(x,i,hl)).join('')}</tbody></table></div>`:'<p class="mute" style="margin-top:8px">Сезон только начался — прогноз появится после первых матчей.</p>'}</div>`;
}
const _vAwL4=vAwards;
vAwards=function(){let h=_vAwL4();const i=h.indexOf('<div class="panel">');const pnl=bdPanel();h=i>=0?h.slice(0,i)+pnl+h.slice(i):h+pnl;
  const B=S.bd;if(B&&!B.done)h=h.replace(new RegExp(`(«Золотой мяч» ${B.label}</h3>)<p class="mute">—</p>`),'$1<p class="mute" style="margin-top:8px">Вручение — 30 октября.</p>');return h;};

/* ---------- ежедневные события ---------- */
const _dailyL4=daily;daily=function(){_dailyL4();try{legendNTDaily();}catch(e){console.error(e);}try{bdDaily();}catch(e){console.error(e);}};
