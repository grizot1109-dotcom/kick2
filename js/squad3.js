'use strict';
/* ===== KICK 2: центр состава — таблица игроков и 3D-модель выбранного игрока ===== */
const SQ={sel:null,tab:'stats',sort:'ap',dir:-1};

/* ---------- номера игроков в клубе ---------- */
const NUM_PREF={GK:[1,13,31,12],DR:[2,22,24,12],DL:[3,15,33,26],DC:[4,5,6,15,24,26,32,44],DM:[6,8,16,18,21],MC:[8,10,14,16,17,18,20],MR:[7,17,11,27],ML:[11,17,7,27],AMC:[10,8,19,20],AMR:[7,11,19,47],AML:[11,7,19,47],ST:[9,19,18,21,29,99]};
function assignNumbers(t){
  if(!t)return;const ps=t.pl.map(id=>S.P[id]).filter(Boolean);const used=new Set();
  ps.forEach(p=>{if(p.num&&!used.has(p.num))used.add(p.num);else p.num=null;});
  ps.filter(p=>!p.num).sort((a,b)=>ca(b)-ca(a)).forEach(p=>{let n=(NUM_PREF[p.pos]||[]).find(x=>!used.has(x));if(!n){n=2;while(used.has(n)&&n<99)n++;}p.num=n;used.add(n);});
}

/* ---------- статистика по турнирам (ведётся для вашего клуба) ---------- */
const _applyResSQ=applyRes;
applyRes=function(f,res,live){
  _applyResSQ(f,res,live);
  const t=sqTeam();if(!t||f.nt||(f.h!==t.id&&f.a!==t.id))return;const home=f.h===t.id;const sd=home?res.h:res.a;if(!sd)return;
  const ga=home?f.ag:f.hg;const cn=compOfFx(f).name;
  sd.played.forEach(id=>{const p=S.P[id];if(!p)return;p.cst=p.cst||{};const e=p.cst[cn]=p.cst[cn]||{ap:0,g:0,as:0,cs:0,yc:0,rc:0,r:0};
    e.ap++;e.r+=sd.rat[id]||6.5;if(ga===0&&['GK','DC','DL','DR'].includes(p.pos))e.cs++;});
  sd.g.forEach(id=>{const p=S.P[id];if(p&&p.cst&&p.cst[cn])p.cst[cn].g++;});sd.as.forEach(id=>{const p=S.P[id];if(p&&p.cst&&p.cst[cn])p.cst[cn].as++;});
  sd.yc.forEach(id=>{const p=S.P[id];if(p&&p.cst&&p.cst[cn])p.cst[cn].yc++;});sd.rc.forEach(id=>{const p=S.P[id];if(p&&p.cst&&p.cst[cn])p.cst[cn].rc++;});
};
const _seasonEndSQ=seasonEnd;seasonEnd=function(){const t=sqTeam();if(t)t.pl.forEach(id=>{const p=S.P[id];if(p)delete p.cst;});_seasonEndSQ();};
const csOf=p=>Object.values(p.cst||{}).reduce((s,e)=>s+e.cs,0);

/* ---------- экран ---------- */
const SQTABS=[['status','Статус'],['stats','Статистика'],['attrs','Атрибуты'],['fin','Финансы']];
function sqCols(){
  if(SQ.tab==='status')return [['form','Форма',p=>formAvg(p),p=>p.form.length?p.form.reduce((a,b)=>a+b,0)/p.form.length:0],['cond','Состояние',p=>condBar(p.cond),p=>p.cond],['mor','Мораль',p=>{const [t,c]=morTxt(p.mor);return `<span class="${c}">${t}</span>`;},p=>p.mor],['age','Возраст',p=>p.age,p=>p.age]];
  if(SQ.tab==='attrs')return [['key','Ключевые характеристики',p=>`<span style="font-size:12px">${keyColsK(p)}</span>`,p=>p.st.ap],['h','Рост',p=>p.h+' см',p=>p.h],['ft','Нога',p=>p.ft,p=>p.ft==='Левая'?1:p.ft==='Обе'?2:0]];
  if(SQ.tab==='fin')return [['val','Стоимость',p=>money(value(p)),value],['wage','Зарплата',p=>money(p.wage),p=>p.wage],['ce','Контракт до',p=>p.ce,p=>p.ce]];
  return [['ap','М',p=>p.st.ap,p=>p.st.ap],['g','Голы',p=>p.st.g,p=>p.st.g],['as','Пасы',p=>p.st.as,p=>p.st.as],['cs','Сухие',p=>csOf(p),csOf],['r','Оценка',p=>avgR(p),p=>p.st.ap?p.st.r/p.st.ap:0]];
}
function sqTeam(){const t=userTeam();if(t)return t;if(S.legend){const p=S.P[S.legend.pid];if(p&&p.club>=0)return S.T[p.club];}return null;}
vSquad=function(){
  const t=sqTeam();if(!t)return '<div class="panel mute">У вас сейчас нет клуба.</div>';assignNumbers(t);const LGM=!!S.legend;const pl=t.pl.map(id=>S.P[id]).filter(Boolean);
  const cols=sqCols();const sc=cols.find(c=>c[0]===SQ.sort)||cols[0];if(!cols.some(c=>c[0]===SQ.sort))SQ.sort=cols[0][0];
  pl.sort((a,b)=>(sc[3](b)-sc[3](a))*(SQ.dir<0?1:-1)||POSL.indexOf(a.pos)-POSL.indexOf(b.pos));
  if(!SQ.sel||!pl.some(p=>p.id===SQ.sel))SQ.sel=pl[0]&&pl[0].id;const p=S.P[SQ.sel];
  const rows=pl.map(q=>`<tr class="click ${q.id===SQ.sel?'sq-on':''}" onclick="G.sqSel(${q.id})" ondblclick="G.openP(${q.id})"><td class="num sq-n">${q.num||'–'}</td><td><span class="pos">${PR[q.pos]}</span></td><td class="sq-ph">${avatar(q,40)}</td><td><b>${esc(q.n)}</b> ${statusPills(q)}</td>${cols.map(c=>`<td class="r num">${c[2](q)}</td>`).join('')}</tr>`).join('');
  const comps=Object.entries(p.cst||{});const tot=comps.reduce((s,[,e])=>({ap:s.ap+e.ap,g:s.g+e.g,as:s.as+e.as,cs:s.cs+e.cs,yc:s.yc+e.yc,rc:s.rc+e.rc,r:s.r+e.r}),{ap:0,g:0,as:0,cs:0,yc:0,rc:0,r:0});
  const crow=(n,e)=>`<tr><td>${esc(n)}</td><td class="r num">${e.ap}</td><td class="r num">${e.g}</td><td class="r num">${e.as}</td><td class="r num">${e.cs}</td><td class="r num"><i class="sq-yc"></i>${e.yc}</td><td class="r num"><i class="sq-rc"></i>${e.rc}</td><td class="r num">${e.ap?(e.r/e.ap).toFixed(2):'—'}</td></tr>`;
  const [mt,mc]=morTxt(p.mor);const n=S.N[p.nat];
  return `<div class="sq">
   <div class="sq-left"><div class="row" style="justify-content:space-between"><div><h1>Состав${LGM?' · '+esc(t.n):''}</h1><p class="mute">${pl.length} игроков${LGM?'':' · зарплаты '+money(wageBill(t))+' в неделю'}</p></div>${LGM?'':`<button class="btn" onclick="G.go('tactics')">Стартовый состав</button>`}</div>
    <div class="subtabs" style="margin:10px 0 8px">${SQTABS.map(([k,l])=>`<button class="${SQ.tab===k?'on':''}" onclick="SQ.tab='${k}';SQ.sort=null;render()">${l}</button>`).join('')}</div>
    <div class="panel sq-tbl"><table class="t"><thead><tr><th>Нр</th><th>Поз</th><th></th><th>Имя</th>${cols.map(c=>`<th class="r click" onclick="G.sqSort('${c[0]}')">${c[1]}${SQ.sort===c[0]?(SQ.dir<0?' ▾':' ▴'):''}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="mute" style="font-size:12px;margin-top:6px">Нажмите на игрока, чтобы посмотреть его справа. Двойной щелчок — полный профиль.</p></div>
   <div class="sq-right"><div id="sq3d" class="sq3d">${H3.model||H3.modelFail?'':`<div class="sq3d-load">${avatar(p,160)}<small>Загрузка 3D-модели…</small></div>`}</div>
    <div class="sq-card"><div class="sq-ovr" title="Номер"><b>${p.num||'–'}</b><small>${p.age} лет</small></div>
     <div class="sq-id"><span class="sq-pos">${[PR[p.pos],...p.alt.map(x=>PR[x])].join(' · ')}</span><h2>${n&&n.crest?ntCrest(p.nat,26):''}${esc(p.n)}</h2>
      <div class="sq-chips"><span class="${mc}" title="Мораль">☺ ${mt}</span><span title="Состояние">⚡ ${Math.round(p.cond)}%</span><span title="Форма: средняя оценка за последние матчи">◆ ${formAvg(p)}</span><span title="Стоимость">€ ${money(value(p)).replace('€','')}</span></div></div>
     <table class="t sq-comp"><thead><tr><th>Турнир</th><th class="r">М</th><th class="r">Г</th><th class="r">П</th><th class="r">Сух</th><th class="r"><i class="sq-yc"></i></th><th class="r"><i class="sq-rc"></i></th><th class="r">Ср.</th></tr></thead>
      <tbody>${comps.length?comps.map(([k,e])=>crow(k,e)).join('')+(comps.length>1?crow('Всего',tot):''):`<tr><td colspan="8" class="mute">По турнирам ещё нет матчей. Всего за сезон: ${p.st.ap} м., ${p.st.g} г., ${p.st.as} п.</td></tr>`}</tbody></table>
     <div class="row" style="margin-top:10px"><button class="btn sm" onclick="G.openP(${p.id})">Полный профиль ›</button></div></div></div>
  </div>`;
};
G.sqSel=function(id){SQ.sel=id;render();};
G.sqSort=function(k){if(SQ.sort===k)SQ.dir*=-1;else{SQ.sort=k;SQ.dir=-1;}render();};

/* ---------- 3D-модель игрока ---------- */
const SQV={r:null,scene:null,cam:null,grp:null,o:null,pid:null,run:false,rot:-.35,drag:null};
function sqvInit(){
  if(SQV.r)return true;if(typeof THREE==='undefined')return false;
  try{SQV.r=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(e){return false;}
  const r=SQV.r;r.setPixelRatio(Math.min(2,devicePixelRatio||1));r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.05;r.setClearColor(0x000000,0);
  const sc=SQV.scene=new THREE.Scene();SQV.cam=new THREE.PerspectiveCamera(24,1,.05,50);
  sc.add(new THREE.HemisphereLight(0xffffff,0x332244,.7));const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(1.2,2.2,2.4);sc.add(key);
  SQV.rim=new THREE.DirectionalLight(0xb48cff,2.4);SQV.rim.position.set(-2,1.8,-1.5);sc.add(SQV.rim);const fill=new THREE.DirectionalLight(0x9fc4ff,.5);fill.position.set(-1.5,.5,2);sc.add(fill);
  SQV.grp=new THREE.Group();sc.add(SQV.grp);
  const el=r.domElement;el.className='sq3d-cv';
  el.addEventListener('pointerdown',e=>{SQV.drag=e.clientX;el.setPointerCapture(e.pointerId);});
  el.addEventListener('pointermove',e=>{if(SQV.drag!=null){SQV.rot+=(e.clientX-SQV.drag)*.01;SQV.drag=e.clientX;}});
  el.addEventListener('pointerup',()=>{SQV.drag=null;});
  return true;
}
function sqvShow(){
  const box=document.getElementById('sq3d');if(!box)return;const p=S.P[SQ.sel];if(!p)return;
  if(!H3.model){loadPlayerModel();if(!H3.modelFail)setTimeout(()=>{if(UI.view==='squad'&&document.getElementById('sq3d'))render();},700);return;}
  if(!sqvInit())return;
  if(SQV.pid!==p.id){
    while(SQV.grp.children.length){const g=SQV.grp.children.pop();g.traverse(x=>{if(x.material)[].concat(x.material).forEach(m=>m.dispose());});}
    const t=p.club>=0?S.T[p.club]:null;const kit=t?kitOf(t,'h'):{b:'#dddddd',la:'#dddddd',ra:'#dddddd',sh:'#222',so:'#ddd',pb:'plain'};
    const prev=H3.players;H3.players=SQV.grp;const o=mkPlayer(kit,p.num||7,p,p.pos==='GK',t?kitImg(t,'h'):null);H3.players=prev;
    if(o&&o.real){if(o.acts.stand){o.acts.stand.play();}else{const a=o.acts.standUp;a.play();a.time=a.getClip().duration-.01;a.timeScale=0;}o.mixer.update(0);o.hfix=!!o.acts.stand;}
    SQV.o=o;SQV.pid=p.id;SQV.rot=-.3;SQV.tgt=null;
    const acc=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#3fe26b';SQV.rim.color.set(acc);
  }
  const cv=SQV.r.domElement;if(cv.parentNode!==box){box.innerHTML='';box.appendChild(cv);}
  if(!SQV.run){SQV.run=true;SQV.t0=performance.now();requestAnimationFrame(sqvFrame);}
}
function sqvFrame(now){
  const cv=SQV.r.domElement;if(!cv.isConnected||UI.view!=='squad'){SQV.run=false;return;}
  const box=cv.parentNode;const w=box.clientWidth||400,h=box.clientHeight||480;
  if(cv.width!==Math.round(w*SQV.r.getPixelRatio())||cv.height!==Math.round(h*SQV.r.getPixelRatio())){SQV.r.setSize(w,h,false);cv.style.width=w+'px';cv.style.height=h+'px';SQV.cam.aspect=w/h;SQV.cam.updateProjectionMatrix();}
  const o=SQV.o;if(o){const t=(now-SQV.t0)/1000;if(SQV.drag==null)SQV.rot+=Math.sin(t*.5)*.0009;o.g.rotation.y=SQV.rot;o.g.position.y=Math.sin(t*1.6)*.004;
    // голова чуть приподнята, камера наводится на голову и плечи
    if(o.real){if(!o.hb){o.root.traverse(x=>{if(x.isBone&&!o.hb&&/Head$/.test(x.name))o.hb=x;if(x.isBone&&!o.nb&&/Neck$/.test(x.name))o.nb=x;});}
      if(o.hb&&!o.hfix){o.hfix=1;o.mixer.update(0);if(o.nb)o.nb.rotation.x-=.28;o.hb.rotation.x-=.22;}
      o.g.updateMatrixWorld(true);const hp=new THREE.Vector3();if(o.hb)o.hb.getWorldPosition(hp);else hp.set(0,1.62,0);
      SQV.tgt=SQV.tgt||hp.clone();SQV.tgt.lerp(hp,.2);SQV.cam.position.set(SQV.tgt.x,SQV.tgt.y+.02,SQV.tgt.z+1.95);SQV.cam.lookAt(SQV.tgt.x,SQV.tgt.y-.1,SQV.tgt.z);}}
  SQV.r.render(SQV.scene,SQV.cam);requestAnimationFrame(sqvFrame);
}
const _renderSQ=render;render=function(){
  // сохраняем прокрутку списка и страницы при перерисовке
  const tb=document.querySelector('.sq-tbl'),st=tb?tb.scrollTop:null,sc=document.scrollingElement,ws=sc?sc.scrollTop:0;
  const mn=document.querySelector('#app main, #app .main'),ms=mn?mn.scrollTop:0;
  _renderSQ();
  if(st!=null&&UI.view==='squad'){const t2=document.querySelector('.sq-tbl');if(t2)t2.scrollTop=st;if(sc)sc.scrollTop=ws;const m2=document.querySelector('#app main, #app .main');if(m2)m2.scrollTop=ms;}if(UI.view==='squad'&&S&&S.user&&UI.screen==='game')sqvShow();};

// номер на футболке в 3D-моментах — настоящий номер игрока
const _mkPlayerSQ=mkPlayer;mkPlayer=function(kit,num,p,gk,img){if(p&&p.club>=0&&!p.num)assignNumbers(S.T[p.club]);return _mkPlayerSQ(kit,p&&p.num?p.num:num,p,gk,img);};
