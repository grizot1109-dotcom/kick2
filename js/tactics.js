'use strict';
/* ===== KICK: тактика с перетаскиванием, замены на поле, обработка дней как в менеджерах ===== */

/* ----- позиции по точке на поле (наши ворота снизу) ----- */
function posFromXY(x,y){
  if(y>=84)return 'GK';
  if(y>=64)return x<28?'DL':x>72?'DR':'DC';
  if(y>=52)return x<24?'DL':x>76?'DR':'DM';
  if(y>=34)return x<26?'ML':x>74?'MR':'MC';
  if(y>=18)return x<28?'AML':x>72?'AMR':'AMC';
  return x<24?'AML':x>76?'AMR':'ST';
}
const ZONES=[[0,84,100,100,'GK'],[0,64,28,84,'DL'],[28,64,72,84,'DC'],[72,64,100,84,'DR'],[0,52,24,64,'DL'],[24,52,76,64,'DM'],[76,52,100,64,'DR'],
  [0,34,26,52,'ML'],[26,34,74,52,'MC'],[74,34,100,52,'MR'],[0,18,28,34,'AML'],[28,18,72,34,'AMC'],[72,18,100,34,'AMR'],[0,0,24,18,'AML'],[24,0,76,18,'ST'],[76,0,100,18,'AMR']];
const zonesHTML=()=>`<div class="zones" aria-hidden="true">${ZONES.map(([x1,y1,x2,y2,p])=>`<i style="left:${x1}%;top:${y1}%;width:${x2-x1}%;height:${y2-y1}%"><span>${PR[p]}</span></i>`).join('')}</div>`;
const DUTY=['Оборона','Поддержка','Атака'],DUTY1=['О','П','А'];
function tacXY(t){const sl=slotsOf(t);return t.tac.xy&&t.tac.xy.length===11?t.tac.xy:slotXY(sl);}
function ensureCustom(t){const sl=slotsOf(t);if(!t.tac.xy||t.tac.xy.length!==11)t.tac.xy=slotXY(sl).map(v=>v.slice());if(!t.tac.cs)t.tac.cs=sl.slice();if(!t.tac.du)t.tac.du=new Array(11).fill(1);}

/* ----- перетаскивание (мышь и палец) ----- */
const DND={src:null,ghost:null,sx:0,sy:0,moved:false,eat:false,over:null};
document.addEventListener('pointerdown',e=>{
  const el=e.target.closest('[data-drag]');if(!el||e.button>0)return;
  if(e.pointerType==='touch'&&!e.target.closest('.dh,.slot'))return; // на телефоне строку тянем за ручку, чтобы список прокручивался
  DND.src={kind:el.dataset.drag,id:el.dataset.id,html:el.dataset.ghost||el.innerHTML};DND.sx=e.clientX;DND.sy=e.clientY;DND.moved=false;
});
document.addEventListener('pointermove',e=>{
  if(!DND.src)return;
  if(!DND.moved){if(Math.hypot(e.clientX-DND.sx,e.clientY-DND.sy)<7)return;DND.moved=true;
    const g=document.createElement('div');g.className='ghost';g.innerHTML=DND.src.html;document.body.appendChild(g);DND.ghost=g;
    document.body.classList.add('dragging',DND.src.kind==='slot'?'drag-slot':'drag-pl');}
  e.preventDefault();DND.ghost.style.left=e.clientX+'px';DND.ghost.style.top=e.clientY+'px';
  const t=document.elementFromPoint(e.clientX,e.clientY);const d=t&&t.closest('[data-drop]');
  if(DND.over!==d){if(DND.over)DND.over.classList.remove('over');if(d)d.classList.add('over');DND.over=d;}
},{passive:false});
function endDrag(e,cancel){
  if(!DND.src)return;const src=DND.src;DND.src=null;
  if(DND.over)DND.over.classList.remove('over');DND.over=null;
  if(DND.ghost){DND.ghost.remove();DND.ghost=null;}document.body.classList.remove('dragging','drag-slot','drag-pl');
  if(!DND.moved||cancel)return;DND.eat=true;setTimeout(()=>DND.eat=false,60);
  const t=document.elementFromPoint(e.clientX,e.clientY);const d=t&&t.closest('[data-drop]');if(!d)return;
  const pitch=d.closest('.pitch');let xy=null;if(pitch){const r=pitch.getBoundingClientRect();xy=[clamp((e.clientX-r.left)/r.width*100,4,96),clamp((e.clientY-r.top)/r.height*100,4,96)];}
  onDrop(src,{kind:d.dataset.drop,i:d.dataset.i!=null?+d.dataset.i:null,ctx:pitch?pitch.dataset.ctx:d.dataset.ctx,xy});
}
document.addEventListener('pointerup',e=>endDrag(e,false));
document.addEventListener('pointercancel',e=>endDrag(e,true));
document.addEventListener('click',e=>{if(DND.eat){e.stopPropagation();e.preventDefault();DND.eat=false;}},true);

function nearestSlot(xyArr,xy){let b=-1,bd=1e9;xyArr.forEach(([x,y],i)=>{const d=(x-xy[0])**2+(y-xy[1])**2;if(d<bd){bd=d;b=i;}});return bd<180?b:-1;}
function onDrop(src,tg){
  if(tg.ctx==='match')return dropMatch(src,tg);
  const t=userTeam();if(!t)return;validateXI(t);const xi=t.xi;
  if(tg.kind==='pitch'&&src.kind==='pl'){const j=nearestSlot(tacXY(t),tg.xy);if(j<0)return;tg={kind:'slot',i:j};}
  if(src.kind==='slot'){const i=+src.id;
    if(tg.kind==='slot'&&tg.i!==i){[xi[i],xi[tg.i]]=[xi[tg.i],xi[i]];toast('Игроки поменялись позициями');}
    else if(tg.kind==='pitch'||(tg.kind==='slot'&&tg.i===i&&tg.xy)){
      const sl=slotsOf(t);if(sl[i]==='GK'){toast('Вратарь остаётся в воротах');return;}
      ensureCustom(t);let [x,y]=tg.xy;y=Math.min(y,80);const pos=posFromXY(x,y);
      t.tac.xy[i]=[Math.round(x),Math.round(y)];t.tac.cs[i]=pos;toast(`Новая позиция: ${PR[pos]}`);}
    else if(tg.kind==='list'){}
  }else if(src.kind==='pl'&&tg.kind==='slot'){const pid=+src.id;const p=S.P[pid];if(!p||p.club!==t.id)return;
    if(!avail(p)){toast(`${p.n} сейчас не может играть`);return;}
    const j=xi.indexOf(pid);if(j>=0)xi[j]=xi[tg.i];xi[tg.i]=pid;toast(`${lastName(p.n)} — ${PR[slotsOf(t)[tg.i]]}`);}
  UI.slot=null;render();
}
function dropMatch(src,tg){
  if(!M||M.done)return;const us=M.h.user?M.h:M.a;const xyA=us.xy||slotXY(us.slots);
  if(tg.kind==='pitch'&&src.kind==='pl'){const j=nearestSlot(xyA,tg.xy);if(j<0)return;tg={kind:'slot',i:j};}
  if(src.kind==='pl'&&tg.kind==='slot'){const inId=+src.id;
    if(!us.bench.includes(inId))return;if(us.subs>=5){toast('Лимит замен исчерпан');return;}
    if(us.xi[tg.i]==null){toast('Игрок удалён — на это место замену не выпустить');return;}
    if(M.pm){const out=us.xi[tg.i];us.xi[tg.i]=inId;us.bench=us.bench.map(x=>x===inId?out:x);us.played=us.xi.filter(x=>x!=null);us.rat={};us.played.forEach(id=>us.rat[id]=6.6);
      const t=userTeam();t.xi=us.xi.slice();render();return;}
    makeSub(us,tg.i,inId);UI.subOut=UI.subIn=null;render();return;}
  if(src.kind==='slot'){const i=+src.id;
    if(tg.kind==='slot'&&tg.i!==i){[us.xi[i],us.xi[tg.i]]=[us.xi[tg.i],us.xi[i]];addEv(`${S.T[us.t].n}: перестановка — ${pn(us.xi[tg.i])} и ${pn(us.xi[i])} меняются местами.`,'info');render();return;}
    if(tg.kind==='pitch'||(tg.kind==='slot'&&tg.i===i&&tg.xy)){if(us.slots[i]==='GK')return;if(!us.xy)us.xy=slotXY(us.slots).map(v=>v.slice());let [x,y]=tg.xy;y=Math.min(y,80);const pos=posFromXY(x,y);
      us.xy[i]=[Math.round(x),Math.round(y)];if(us.slots[i]!==pos){us.slots[i]=pos;if(us.xi[i]!=null)addEv(`${S.T[us.t].n}: ${pn(us.xi[i])} смещается на позицию ${PR[pos]}.`,'info');}render();}
  }
}

/* ----- поле ----- */
function tokenHTML(p,i,pos,x,y,o){
  o=o||{};const du=o.du!=null?o.du:1;
  const ghost=p?`${avatar(p,30)}<span class="chip">${esc(lastName(p.n))}</span>`:'';
  return `<div class="slot tk ${o.sel?'sel':''} ${p?'':'empty'} ${o.warn?'warn':''}" ${p?'data-drag="slot"':''} data-drop="slot" data-i="${i}" data-id="${i}" data-ghost="${esc(ghost)}" style="left:${x}%;top:${y}%" ${o.click?`onclick="${o.click}(${i})"`:''} title="${p?esc(p.n)+' · '+PR[pos]+' · '+famLabel(fam(p,pos))[0].toLowerCase()+' позиция':'Пустая позиция'}">
   ${p?avatar(p,34):'<span class="noav">—</span>'}<span class="chip">${p?esc(lastName(p.n)):(o.emptyTxt||'Пусто')}</span>
   <span class="tkm"><span class="pos ${p&&fam(p,pos)<.82?'bad':p&&fam(p,pos)<.94?'warn':''}">${PR[pos]}</span>${pos!=='GK'&&o.showDuty!==false?`<span class="du d${du}" title="${DUTY[du]}">${DUTY1[du]}</span>`:''}${o.extra||''}</span>
   ${p&&o.cond!==false?`<span class="tcond"><i style="width:${Math.round(p.cond)}%;background:${p.cond>=85?'var(--good)':p.cond>=70?'var(--warn)':'var(--bad)'}"></i></span>`:''}</div>`;
}
function bigPitch(ctx,xi,slots,xy,o){
  o=o||{};
  return `<div class="pitch big" data-drop="pitch" data-ctx="${ctx}">${PITCH_SVG}${zonesHTML()}${slots.map((s,i)=>{const p=S.P[xi[i]];const [x,y]=xy[i];
    return tokenHTML(p,i,s,x,y,{sel:o.sel===i,du:o.du?o.du[i]:1,click:o.click,extra:o.extra?o.extra(i,p):'',emptyTxt:o.emptyTxt,showDuty:o.showDuty});}).join('')}</div>`;
}
function plRow(p,o){
  o=o||{};const bl=!avail(p);
  return `<tr class="${bl?'dim':'click'} drow" ${bl?'':`data-drag="pl" data-id="${p.id}"`} data-ghost="${esc(avatar(p,30)+`<span class="chip">${esc(lastName(p.n))}</span>`)}" onclick="${o.click||`G.openP(${p.id})`}">
   <td class="dh" aria-hidden="true">${bl?'':'⠿'}</td><td><div class="cell">${avatar(p,24)}<span>${esc(p.n)}</span></div></td><td><span class="pos">${PR[p.pos]}</span></td>${o.cols||''}<td>${condBar(p.cond)}</td><td class="r num">${formAvg(p)}</td><td>${statusPills(p)}${o.tag||''}</td></tr>`;
}

// полоса запасных прямо под полем — тянуть недалеко, удобно и на телефоне
function benchStrip(ids,title){
  const ps=ids.map(id=>S.P[id]).filter(Boolean);if(!ps.length)return '';
  return `<div class="bstrip-w"><h3>${title}</h3><div class="bstrip">${ps.map(p=>{const gh=esc(avatar(p,30)+`<span class="chip">${esc(lastName(p.n))}</span>`);return `<div class="bchip" data-drag="pl" data-id="${p.id}" data-ghost="${gh}" onclick="G.openP(${p.id})" title="${esc(p.n)}">${avatar(p,30)}<span class="bn">${esc(lastName(p.n))}</span><span class="pos">${PR[p.pos]}</span><span class="tcond"><i style="width:${Math.round(p.cond)}%;background:${p.cond>=85?'var(--good)':p.cond>=70?'var(--warn)':'var(--bad)'}"></i></span></div>`;}).join('')}</div></div>`;
}

/* ----- экран тактики ----- */
const TI=[['m','Менталитет',['Глух. оборона','Оборона','Баланс','Атака','Всё в атаку']],['pr','Прессинг',LVL3.pr],['te','Темп',LVL3.te],['wi','Ширина атаки',LVL3.wi],['dl','Линия обороны',['Низкая','Обычная','Высокая']],['ps','Передачи',['Короткие','Смешанные','Прямые']],['tk','Отбор',['Аккуратный','Обычный','Жёсткий']]];
const TI_HINT={m:'Насколько команда рискует ради гола.',pr:'Высокий прессинг отбирает мяч выше, но сильнее утомляет.',te:'Быстрый темп — больше моментов у обоих ворот.',wi:'Широкая атака — больше навесов, узкая — пасов в разрез.',dl:'Высокая линия опасна против быстрых нападающих соперника.',ps:'Прямые передачи хороши с быстрыми или высокими форвардами.',tk:'Жёсткий отбор крепче в обороне, но больше карточек.'};
function vTactics(){
  const t=userTeam();validateXI(t);const slots=slotsOf(t);const xy=tacXY(t);const sel=UI.slot;const pl=t.pl.map(id=>S.P[id]);const du=t.tac.du||new Array(11).fill(1);
  const custom=!!t.tac.cs;const inXI=new Set(t.xi);
  let side;
  if(sel!=null){const pos=slots[sel];const p=S.P[t.xi[sel]];const keys=ROLE[POS_ROLE[pos]].slice().sort((a,b)=>b[1]-a[1]).slice(0,4);const sorted=pl.slice().sort((a,b)=>slotVal(b,pos)-slotVal(a,pos));
    side=`<div class="row" style="justify-content:space-between"><h3>Позиция ${PR[pos]}${p?' · '+esc(p.n):''}</h3><button class="btn sm" onclick="UI.slot=null;render()">✕</button></div>
     ${pos!=='GK'?`<div class="field">Обязанность<div class="exp">${DUTY.map((d,k)=>`<button class="btn sm ${du[sel]===k?'on':''}" onclick="G.duty(${sel},${k})">${d}</button>`).join('')}</div></div>`:''}
     <p class="mute" style="font-size:12px;margin:8px 0">Нажмите на игрока или перетащите его на поле.</p>
     <div class="tw"><table class="t"><thead><tr><th></th><th>Игрок</th><th>Поз.</th><th>Знание</th>${keys.map(k=>`<th class="r" title="${AL[k[0]]}">${AL[k[0]].slice(0,5)}.</th>`).join('')}<th>Сост.</th><th class="r">Форма</th><th></th></tr></thead><tbody>
     ${sorted.map(q=>{const [fl,fc]=famLabel(fam(q,pos));return plRow(q,{click:`G.assign(${q.id})`,cols:`<td class="${fc}" style="font-size:12px">${fl}</td>${keys.map(k=>`<td class="r num ${acls(q.a[k[0]])}">${q.a[k[0]]}</td>`).join('')}`,tag:inXI.has(q.id)?`<span class="pill ok">${PR[slots[t.xi.indexOf(q.id)]]}</span>`:''});}).join('')}</tbody></table></div>`;}
  else{const bench=benchOf(t,t.xi);const bset=new Set(bench);const rest=pl.filter(p=>!inXI.has(p.id)&&!bset.has(p.id)).sort((a,b)=>POSL.indexOf(a.pos)-POSL.indexOf(b.pos)||ca(b)-ca(a));
    side=`<h3>Запасные</h3><p class="mute" style="font-size:12px;margin:4px 0 8px">Перетащите игрока на позицию на поле, чтобы поставить его в состав.</p><div class="tw"><table class="t"><tbody>${bench.map(id=>plRow(S.P[id])).join('')}</tbody></table></div>
     <h3 style="margin-top:14px">Резерв</h3><div class="tw"><table class="t"><tbody>${rest.map(p=>plRow(p)).join('')}</tbody></table></div>`;}
  const xiP=t.xi.map(id=>S.P[id]).filter(Boolean);
  const spSel=(k,lab)=>`<label class="field">${lab}<select onchange="G.tac('${k}',this.value===''?null:+this.value)"><option value="">Авто</option>${xiP.map(p=>`<option value="${p.id}" ${t.tac[k]===p.id?'selected':''}>${esc(p.n)}</option>`).join('')}</select></label>`;
  const instr=TI.map(([k,lab,opts])=>`<div class="ti"><span><b>${lab}</b><small>${TI_HINT[k]}</small></span><div class="seg">${opts.map((x,i)=>`<button class="${tv(t.tac,k)===i?'on':''}" onclick="G.tac('${k}',${i})">${x}</button>`).join('')}</div></div>`).join('');
  return `<div class="head"><div><h1>Тактика</h1><p class="mute">${custom?'Своя расстановка на базе '+t.tac.f:'Схема '+t.tac.f} · перетаскивайте игроков по полю</p></div><div class="row"><button class="btn" onclick="G.auto()">Автосостав</button>${custom?`<button class="btn" onclick="G.form('${t.tac.f}')">Сбросить расстановку</button>`:''}</div></div>
  <div class="tac">
   <div class="panel grid" style="gap:12px;align-content:start"><div class="tabs">${FKEYS.map(f=>`<button class="btn sm ${t.tac.f===f&&!custom?'on':''}" onclick="G.form('${f}')">${f}</button>`).join('')}</div>
    ${bigPitch('tac',t.xi,slots,xy,{sel,du,click:'G.pickSlot'})}${benchStrip(benchOf(t,t.xi),'Запасные — тяните на поле')}
    <p class="mute" style="font-size:12px">Тяните игрока на другого — поменяются местами. Тяните на свободное место — сместится и получит новую позицию (подсвечиваются зоны). Нажмите на игрока, чтобы выбрать ему обязанность и замену.</p></div>
   <div class="grid" style="gap:14px;align-content:start">
    <div class="panel">${side}</div>
    <div class="panel"><h3 style="margin-bottom:8px">Командные установки</h3>${instr}
     <label class="ti"><span><b>Контратаки</b><small>Быстрые выпады, когда соперник идёт вперёд.</small></span><input type="checkbox" ${t.tac.ct?'checked':''} onchange="G.tac('ct',this.checked?1:0)"></label></div>
    <div class="panel"><h3 style="margin-bottom:8px">Стандарты и капитан</h3><div class="grid g2" style="gap:10px">${spSel('cap','Капитан')}${spSel('pk','Пенальти')}${spSel('fk','Штрафные')}${spSel('ck','Угловые')}</div>
     <label class="field" style="margin-top:10px">Фокус тренировок<select onchange="S.user.train=this.value;toast('Фокус тренировок изменён')">${Object.entries(TRAIN).map(([k,v])=>`<option value="${k}" ${S.user.train===k?'selected':''}>${v}</option>`).join('')}</select></label></div>
   </div></div>`;
}

/* ----- управление в матче ----- */
function matchMgmt(us){
  const xy=us.xy||slotXY(us.slots);
  const pitch=bigPitch('match',us.xi,us.slots,xy,{du:us.tac.du,emptyTxt:'Удалён',extra:(i,p)=>p&&us.rat[p.id]!=null&&!M.pm?`<span class="rt ${us.rat[p.id]>=7.3?'good':us.rat[p.id]<6.2?'bad':''}">${us.rat[p.id].toFixed(1)}</span>`:''});
  const bench=us.bench.map(id=>S.P[id]).filter(Boolean);
  return `<div class="tac">
   <div class="panel grid" style="gap:10px;align-content:start"><div class="row" style="justify-content:space-between"><h3>Ваш состав</h3><span class="mute" style="font-size:12px">Замены: ${us.subs} из 5</span></div>${pitch}${us.subs<5?benchStrip(us.bench,'Скамейка — тяните на игрока'):''}
    <p class="mute" style="font-size:12px">Перетащите запасного на игрока на поле — будет замена. Игрока на игрока — поменяются местами, на свободное место — сменит позицию.</p></div>
   <div class="grid" style="gap:14px;align-content:start">
    <div class="panel"><h3 style="margin-bottom:6px">Скамейка</h3><div class="tw"><table class="t"><tbody>${bench.map(p=>plRow(p,{click:`G.openP(${p.id})`})).join('')||'<tr><td class="mute">Никого не осталось</td></tr>'}</tbody></table></div></div>
    <div class="panel"><h3 style="margin-bottom:8px">Указания по ходу матча</h3>${TI.map(([k,lab,opts])=>`<div class="ti"><span><b>${lab}</b></span><div class="seg">${opts.map((x,i)=>`<button class="${tv(us.tac,k)===i?'on':''}" onclick="G.mtac('${k}',${i})">${x}</button>`).join('')}</div></div>`).join('')}
     <label class="ti"><span><b>Контратаки</b></span><input type="checkbox" ${us.tac.ct?'checked':''} onchange="G.mtac('ct',this.checked?1:0)"></label></div>
   </div></div>`;
}

/* ----- обработка дней ----- */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function dayHighlights(d){
  return (BYDAY[d]||[]).map(i=>S.F[i]).filter(f=>f.hg!=null&&!f.nt&&S.T[f.h]&&S.T[f.a]).sort((a,b)=>(S.T[b.h].rep+S.T[b.a].rep)-(S.T[a.h].rep+S.T[a.a].rep)).slice(0,3);
}
function procBar(){
  if(!UI.busy||!UI.proc)return '';const pr=UI.proc;
  return `<div class="proc" role="status"><span class="spin" aria-hidden="true"></span><div class="proc-t"><b>Обработка: ${esc(fmtDate(pr.d))}</b><small>${pr.n?`${pr.n} ${plural(pr.n,'матч','матча','матчей')} в мире`:'Матчей нет'} · день ${pr.k} из ${pr.max}</small></div>
   <div class="proc-r">${pr.hl.map(fxMini).join('')}</div><button class="btn sm" onclick="G.cont()">Стоп</button></div>`;
}
Object.assign(G,{
  async cont(){
    if(UI.busy){UI.stopReq=true;return;}
    if(M&&M.run)return;if(M&&M.done){G.afterMatch();return;}
    const uf=userFxToday();if(uf){if(!M||M.f!==uf)prepMatch(uf);UI.view='match';render();return;}
    UI.busy=true;UI.stopReq=false;const unread0=S.inbox.filter(m=>!m.read).length;const max=14;
    try{
      for(let k=1;k<=max;k++){
        const d=S.d;const n=(BYDAY[d]||[]).filter(i=>!S.F[i].nt).length;
        processDay();
        UI.proc={d,n,k,max,hl:dayHighlights(d)};render();
        const ms=SET.dayMs==null?450:SET.dayMs;await sleep(ms*(n?1:.6));
        if(S.stop){S.stop=false;break;}
        if(UI.stopReq||!S.user)break;
        if(userFxToday())break;
        if(S.inbox.filter(m=>!m.read).length>unread0)break;
      }
    }finally{UI.busy=false;UI.proc=null;}
    const ut=userTeam();if(ut&&validateXI(ut))toast('Стартовый состав скорректирован: травмы или дисквалификации');
    save();render();
  },
  duty(i,k){const t=userTeam();ensureCustom(t);t.tac.du[i]=k;render();},
  tac(k,v){const t=userTeam();t.tac[k]=v;render();},
  mtac(k,v){const us=M.h.user?M.h:M.a;us.tac[k]=v;const lab=(TI.find(x=>x[0]===k)||[k,'Контратаки',['выкл','вкл']]);addEv(`${S.T[us.t].n} меняет установку: ${lab[1].toLowerCase()} — ${String(lab[2][v]).toLowerCase()}.`,'info');render();},
  form(f){const t=userTeam();const old=t.xi.slice();t.tac.f=f;delete t.tac.cs;delete t.tac.xy;delete t.tac.du;const slots=FORM[f];const pre=new Array(11).fill(null);const used=new Set();
    slots.forEach((s,i)=>{let b=null,bv=-1;old.forEach(id=>{const p=S.P[id];if(!p||used.has(id)||fam(p,s)<.82)return;const v=slotVal(p,s);if(v>bv){bv=v;b=id;}});if(b!=null){pre[i]=b;used.add(b);}});
    t.xi=bestXI(t,slots,pre);UI.slot=null;render();},
  auto(){const t=userTeam();t.xi=bestXI(t,slotsOf(t));UI.slot=null;render();toast('Состав подобран автоматически');},
});
