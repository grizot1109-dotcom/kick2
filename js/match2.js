'use strict';
/* ===== KICK 2: матч в 2D, указания по ходу матча, разговор в перерыве, погода и газон ===== */

/* ---------- погода ---------- */
const COLD=new Set('RUS NOR SWE FIN ISL UKR BLR KAZ EST LVA LTU POL CZE SVK AUT SUI DEN CAN SCO KGZ GEO ARM AZE MDA ROU BUL SRB HUN SVN CRO BIH MNE MKD KOS ALB CHN KOR JPN USA'.split(' '));
const HOT=new Set('KSA QAT UAE EGY MEX IND THA IDN VIE NGA GHA CIV SEN MAR ALG TUN IRQ IRN KUW OMA BHR JOR COL ECU PAR MLI BFA CMR GUI TOG BEN SDN LBY'.split(' '));
const SOUTH=new Set('BRA ARG URU CHI PAR BOL PER RSA AUS NZL ANG ZAM ZIM MOZ MAD'.split(' '));
const WX={
  sun:{n:'Ясно',i:'☀',g:1,dr:1,inj:1},
  cloud:{n:'Облачно',i:'☁',g:1,dr:1,inj:1},
  rain:{n:'Дождь',i:'☂',g:1.06,dr:1.05,inj:1.2,d:'Мокрый мяч скользит: больше ошибок вратарей и защитников.'},
  snow:{n:'Снег',i:'❄',g:.9,dr:1.15,inj:1.45,d:'Тяжёлое поле: меньше голов, игроки быстрее устают, выше риск травм.'},
  heat:{n:'Жара',i:'♨',g:.96,dr:1.35,inj:1.1,d:'Игроки устают заметно быстрее — следите за состоянием и делайте замены.'},
  wind:{n:'Сильный ветер',i:'≋',g:.94,dr:1.05,inj:1,d:'Навесы и дальние удары становятся неточными.'}};
function wxOf(f){
  if(f.wx)return f.wx;
  const t=S.T[f.h];const nat=t?t.nat:'ENG';const m=dateOf(f.d).getMonth();const south=SOUTH.has(nat);
  const winter=south?[5,6,7].includes(m):[11,0,1].includes(m);const summer=south?[11,0,1].includes(m):[6,7].includes(m);
  const r=(hash(S.year+':'+f.d+':'+f.h+':'+f.a)%10000)/10000;
  let k='sun';const P=(arr)=>{let acc=0;for(const [kk,pp] of arr){acc+=pp;if(r<acc)return kk;}return rnd()<.5?'sun':'cloud';};
  if(HOT.has(nat))k=winter?P([['rain',.12],['wind',.06]]):P([['heat',.5],['rain',.1]]);
  else if(COLD.has(nat)&&winter)k=P([['snow',.35],['rain',.15],['wind',.1],['cloud',.25]]);
  else if(winter)k=P([['rain',.32],['wind',.12],['snow',.05],['cloud',.3]]);
  else if(summer)k=P([['heat',.18],['rain',.12],['cloud',.2]]);
  else k=P([['rain',.25],['wind',.1],['cloud',.3]]);
  const base=winter?(COLD.has(nat)?-4:5):summer?(HOT.has(nat)?33:24):HOT.has(nat)?26:13;
  const temp=Math.round(base+(k==='snow'?-4:k==='heat'?7:k==='rain'?-2:0)+((r*1000)%7)-3);
  // газон: уровень ухода за полем в клубе + погода + зима
  const care=t&&t.fin?t.fin.pitch:Math.round(55+(t?t.rep:50)*.3);
  const pitch=Math.round(clamp(care+(winter?-14:0)+(k==='rain'?-8:k==='snow'?-18:k==='heat'?-4:0)+((r*977)%13)-6,20,100));
  f.wx={k,temp,pitch};return f.wx;
}
const pitchTxt=v=>v>=85?'Идеальный':v>=70?'Хороший':v>=55?'Неровный':v>=40?'Плохой':'Ужасный';
function wxMul(w){const e=WX[w.k];const pb=w.pitch<55?(55-w.pitch)/55:0;return {g:e.g*(1-.08*pb),dr:e.dr,inj:e.inj*(1+.6*pb)};}
function wxLine(w){const e=WX[w.k];return `${e.i} ${e.n}, ${w.temp>0?'+':''}${w.temp}° · газон: ${pitchTxt(w.pitch).toLowerCase()} (${w.pitch}%)`;}

/* ---------- множители силы: погода, указания, перерыв ---------- */
let WXG=1;
const _lam=lam;
lam=function(s,o,ta,tb,home){
  let l=_lam(s,o,ta,tb,home);
  const a=ta||{},b=tb||{};
  l*=(a.shA||1)*(a.htA||1)/((b.shD||1)*(b.htD||1))*WXG;
  return clamp(l,.1,5);
};
const _simFx=simFx;
simFx=function(f){if(f.nt)return _simFx(f);WXG=wxMul(wxOf(f)).g;try{_simFx(f);}finally{WXG=1;}};

/* ---------- указания с бровки ---------- */
const SHOUTS={
  press:{n:'Прессинг!',d:'Давить на соперника по всему полю',a:1.07,df:.97,dr:1.6},
  allout:{n:'Всё в атаку!',d:'Больше моментов у обоих ворот',a:1.18,df:.86,dr:1.25},
  hold:{n:'Держать счёт',d:'Отойти назад и закрыть зоны',a:.84,df:1.14,dr:.9},
  calm:{n:'Успокоиться',d:'Меньше нервов и карточек',a:1,df:1.05,dr:.95,card:.6},
  push:{n:'Вперёд, вы можете!',d:'Поднять дух — лучше работает, когда проигрываем',a:1.04,df:1,dr:1.05,mor:4}};
const usSide=()=>M?(M.h.user?M.h:M.a):null;
function applyShout(sd){const s=sd.sh;const on=s&&M.min<s.until;const d=on?SHOUTS[s.k]:null;sd.tac.shA=d?d.a:1;sd.tac.shD=d?d.df:1;if(!on&&s)sd.sh=null;}

/* ---------- разговор в перерыве ---------- */
const TALKS={
  calm:{n:'Спокойно, продолжаем',d:'Ровный тон без давления'},
  demand:{n:'Требую большего!',d:'Хорошо работает, если мы не выигрываем'},
  praise:{n:'Отличная работа, так держать',d:'Хорошо работает, если ведём в счёте'},
  angry:{n:'Вы позорите клуб!',d:'Рискованно: может встряхнуть или сломать команду'},
  defend:{n:'Главное — не пропустить',d:'Больше думать об обороне во втором тайме'}};
function halfTalk(k){
  const us=usSide();if(!us||!M.ht||M.ht.done)return;const diff=(us===M.h?M.hg-M.ag:M.ag-M.hg);
  let mor=0,a=1,df=1,txt='';
  if(k==='calm'){mor=3;a=1.02;txt='Игроки спокойно восприняли ваши слова.';}
  else if(k==='demand'){if(diff<=0){mor=7;a=1.08;txt='Команда завелась и рвётся на поле!';}else{mor=-4;a=.98;txt='Игроки не поняли претензий — они ведь выигрывают.';}}
  else if(k==='praise'){if(diff>0){mor=8;a=1.05;df=1.03;txt='Игроки воодушевлены похвалой.';}else if(diff===0){mor=3;a=1.01;txt='Игроки довольны, но немного расслабились.';}else{mor=-3;a=.97;txt='Похвала при проигрыше прозвучала странно — команда расслабилась.';}}
  else if(k==='angry'){if(diff<=-1&&rnd()<.6){mor=5;a=1.13;txt='Разнос подействовал: команда злая и голодная!';}else{mor=-10;a=.92;df=.96;txt='Команда подавлена — некоторые опустили головы.';}}
  else if(k==='defend'){mor=diff>0?4:-2;a=.92;df=1.12;txt=diff>0?'Игроки поняли задачу: удержать результат.':'Игроки удивлены — команде нужен гол, а не оборона.';}
  us.tac.htA=a;us.tac.htD=df;us.xi.forEach(id=>{const p=S.P[id];if(p)p.mor=clamp(p.mor+mor,10,100);});
  M.ht={done:true,k,txt,mor};addEv(`Перерыв, раздевалка ${S.T[us.t].n}: «${TALKS[k].n}». ${txt}`,'info');render();
}

/* ---------- ход матча ---------- */
const _prep=prepMatch;
prepMatch=function(f){_prep(f);M.wx=wxOf(f);M.ht={done:false};M.anim=[];M.h.sh=null;M.a.sh=null;M.cool=-99;};
const _attempt=attempt;
attempt=function(sd,od,l){
  const sh=sd.st.sh,sot=sd.st.sot,g=M.hg+M.ag;_attempt(sd,od,l);
  if(sd.st.sh>sh&&M.anim){const res=M.hg+M.ag>g?'goal':sd.st.sot>sot?'save':'miss';if(M.anim.length<4)M.anim.push({side:sd===M.h?'h':'a',res});}
};
const _disc=discipline;
discipline=function(sd){if(sd.sh&&SHOUTS[sd.sh.k].card&&rnd()>SHOUTS[sd.sh.k].card)return;_disc(sd);};
const _tick=tick;
tick=function(silent){
  if(!M||M.done)return;
  if(M.min===45&&M.ht&&!M.ht.done&&!M.et)M.ht={done:true,k:null}; // перерыв пропущен
  applyShout(M.h);applyShout(M.a);
  const w=M.wx||{k:'sun',pitch:80};const mul=wxMul(w);WXG=mul.g;
  try{_tick(silent);}finally{WXG=1;}
  if(!M||M.done)return;
  for(const sd of [M.h,M.a]){const extra=(mul.dr-1)+(sd.sh&&M.min<sd.sh.until?SHOUTS[sd.sh.k].dr-1:0);
    if(extra>0)onPitch(sd).forEach(([id])=>{const p=S.P[id];p.cond=Math.max(15,p.cond-drain(p,sd.tac)/90*extra);});
    if(mul.inj>1&&rnd()<mul.inj-1)injuries(sd);}
  if(M.min===1&&w.k!=='sun'&&w.k!=='cloud'&&WX[w.k].d)addEv(`${WX[w.k].n}. ${WX[w.k].d}`,'info');
};
const _kick=G.kick;
G.kick=function(){addEv(`Погода: ${wxLine(M.wx||wxOf(M.f))}.`,'info');_kick();};
const _play=G.play;
G.play=function(){if(M&&M.ht&&!M.ht.done&&M.min>=45)M.ht={done:true,k:null};_play();};
G.shout=function(k){const us=usSide();if(!us||M.done||M.pm)return;if(M.min-M.cool<8){toast(`Команда ещё выполняет прошлое указание (${8-(M.min-M.cool)} мин.)`);return;}
  const d=SHOUTS[k];us.sh={k,until:M.min+10};M.cool=M.min;
  if(d.mor){const diff=us===M.h?M.hg-M.ag:M.ag-M.hg;const m=diff<0?d.mor:1;us.xi.forEach(id=>{const p=S.P[id];if(p)p.mor=clamp(p.mor+m,10,100);});}
  addEv(`${S.T[us.t].n}: тренер кричит с бровки — «${d.n}»`,'info');applyShout(us);render();};
G.halfTalk=halfTalk;

/* ---------- 2D-поле ---------- */
const CV=document.createElement('canvas');CV.className='m2d-cv';CV.setAttribute('aria-label','Матч в 2D');
const V={run:false,last:0,t:0,pl:{h:[],a:[]},ball:{x:50,y:50},hold:null,next:0,seq:null,flash:0,flashTxt:'',parts:[],mf:null};
function attach2d(){const ph=document.getElementById('m2d');if(!ph)return;if(CV.parentNode!==ph){ph.appendChild(CV);}if(!V.run){V.run=true;V.last=performance.now();requestAnimationFrame(frame2d);}}
const _render=render;
render=function(){_render();attach2d();};
function teamCols(){const h=S.T[M.h.t],a=S.T[M.a.t];let hc=[h.c1,h.c2],ac=[a.c1,a.c2];
  const dist=(x,y)=>{const p=s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];const [r1,g1,b1]=p(x),[r2,g2,b2]=p(y);return Math.abs(r1-r2)+Math.abs(g1-g2)+Math.abs(b1-b2);};
  if(dist(hc[0],ac[0])<120)ac=[ac[1],ac[0]];if(dist(hc[0],ac[0])<120)ac=['#f4f4f4','#222'];return {h:hc,a:ac};}
function baseXY(sd,side,i){
  const xy=(sd.xy||slotXY(sd.slots))[i];if(!xy)return null;const gk=sd.slots[i]==='GK';
  const d=(100-xy[1])/100;const bx=V.ball.x;const poss=V.hold?V.hold.side:null;
  let depth=gk?3.5:6+(d-.09)/.82*54;
  if(!gk){depth+=(side==='h'?bx-50:50-bx)*.38;if(poss===side)depth+=6;else if(poss)depth-=3;depth=clamp(depth,7,93);}
  else depth+=clamp((side==='h'?bx:100-bx)-50,-30,10)*.04;
  const x=side==='h'?depth:100-depth;
  let y=8+xy[0]*.84;if(!gk)y+=(V.ball.y-y)*.16;
  return [x,y];
}
function onField(side){const sd=M[side];return sd.xi.map((id,i)=>id!=null?i:-1).filter(i=>i>=0);}
function pickHolder(side,fwd){
  const sd=M[side];const ids=onField(side).filter(i=>sd.slots[i]!=='GK'||rnd()<.06);if(!ids.length)return null;
  const P=V.pl[side];const cur=V.hold&&V.hold.side===side?V.hold.i:null;
  return pickW(ids.filter(i=>i!==cur),i=>{const p=P[i];if(!p)return 1;const adv=side==='h'?p.x:100-p.x;return 1+(fwd?adv/25:0)+Math.max(0,20-Math.hypot(p.x-V.ball.x,p.y-V.ball.y))/8;});
}
function startSeq(ev){
  const side=ev.side;const sd=M[side];const ids=onField(side);
  const st=pickW(ids.filter(i=>sd.slots[i]!=='GK'),i=>SHW[sd.slots[i]]+.3);
  V.seq={side,res:ev.res,st,ph:0,t:0};V.hold={side,i:st};
}
function frame2d(now){
  if(!document.body.contains(CV)||!M){V.run=false;return;}
  const dt=Math.min(.05,(now-V.last)/1000);V.last=now;V.t+=dt;
  const sp=M.run?(M.speed===4?2.2:M.speed===2?1.5:1):.35;
  // события матча → короткие атаки
  if(!V.seq&&M.anim&&M.anim.length&&M.run)startSeq(M.anim.shift());
  if(V.seq){const q=V.seq;q.t+=dt*sp;
    const gx=q.side==='h'?100:0,ownBox=q.side==='h'?84:16;
    if(q.ph===0){V.hold={side:q.side,i:q.st};const p=V.pl[q.side][q.st];if(p){p.tx=ownBox;p.ty=clamp(p.y,30,70);}if(q.t>.7){q.ph=1;q.t=0;V.hold=null;
        const gy=50+(q.res==='miss'?(rnd()<.5?-1:1)*(8+rnd()*8):(rnd()-.5)*8);V.shot={x:gx+(q.res==='goal'?(q.side==='h'?1.8:-1.8):q.res==='miss'?(q.side==='h'?3:-3):0),y:gy};}}
    else if(q.ph===1){V.ball.x+=(V.shot.x-V.ball.x)*Math.min(1,dt*sp*7);V.ball.y+=(V.shot.y-V.ball.y)*Math.min(1,dt*sp*7);
      if(q.t>.45){q.ph=2;q.t=0;if(q.res==='goal'){V.flash=1.6;V.flashTxt='ГОЛ!';}else if(q.res==='save'){V.flashTxt='Сейв';V.flash=.8;}else{V.flashTxt='Мимо';V.flash=.6;}}}
    else if(q.t>(q.res==='goal'?1:.4)){const other=q.side==='h'?'a':'h';const gk=M[other].slots.indexOf('GK');V.hold=q.res==='goal'?{side:other,i:pickHolder(other)}:{side:other,i:gk>=0&&M[other].xi[gk]!=null?gk:pickHolder(other)};
      if(q.res==='goal'){V.ball.x=50;V.ball.y=50;}V.seq=null;V.next=V.t+.6;}
  }else if(V.t>V.next){ // обычный розыгрыш
    const share=M.min?M.poss/M.min:.5;let side=V.hold?V.hold.side:(rnd()<share?'h':'a');
    if(V.hold&&rnd()<(M.run?.2:.08))side=side==='h'?'a':'h';
    else if(!V.hold)side=rnd()<share?'h':'a';
    const i=pickHolder(side,true);V.hold=i==null?null:{side,i};V.next=V.t+(.5+rnd()*.9)/sp;
  }
  for(const side of ['h','a']){const sd=M[side];const P=V.pl[side];
    sd.xi.forEach((id,i)=>{if(id==null){P[i]=null;return;}const b=baseXY(sd,side,i);if(!b)return;let p=P[i];if(!p)p=P[i]={x:b[0],y:b[1],tx:b[0],ty:b[1]};
      const isH=V.hold&&V.hold.side===side&&V.hold.i===i;
      if(!(V.seq&&V.seq.side===side&&V.seq.st===i&&V.seq.ph===0)){p.tx=b[0]+Math.sin(V.t*1.3+i*1.7)*1.4;p.ty=b[1]+Math.cos(V.t*1.1+i*2.3)*1.6;}
      if(isH&&!V.seq){p.tx+=(side==='h'?3:-3);}
      const k=Math.min(1,dt*sp*(isH?3:2.2));p.x+=(p.tx-p.x)*k;p.y+=(p.ty-p.y)*k;});}
  if(!(V.seq&&V.seq.ph>=1)&&V.hold&&V.pl[V.hold.side][V.hold.i]){const p=V.pl[V.hold.side][V.hold.i];const k=Math.min(1,dt*sp*6);V.ball.x+=(p.x+(V.hold.side==='h'?1:-1)-V.ball.x)*k;V.ball.y+=(p.y+.6-V.ball.y)*k;}
  if(V.flash>0)V.flash-=dt;
  draw2d();requestAnimationFrame(frame2d);
}
function draw2d(){
  const w=CV.clientWidth||600,h=Math.round(w*68/105),dpr=window.devicePixelRatio||1;
  if(CV.width!==Math.round(w*dpr)){CV.width=Math.round(w*dpr);CV.height=Math.round(h*dpr);CV.style.height=h+'px';}
  const c=CV.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const X=x=>x/100*w,Y=y=>y/100*h;
  const wx=M.wx||{k:'sun',pitch:80};const pq=wx.pitch/100;
  for(let i=0;i<12;i++){c.fillStyle=i%2?`rgb(${30+(1-pq)*40},${78-(1-pq)*18},${48-(1-pq)*10})`:`rgb(${34+(1-pq)*42},${86-(1-pq)*20},${52-(1-pq)*10})`;c.fillRect(i*w/12,0,w/12+1,h);}
  if(wx.k==='snow'){c.fillStyle='rgba(240,245,250,.18)';c.fillRect(0,0,w,h);}
  c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1.2;c.strokeRect(X(1),Y(2),X(98),Y(96));
  c.beginPath();c.moveTo(X(50),Y(2));c.lineTo(X(50),Y(98));c.stroke();c.beginPath();c.arc(X(50),Y(50),h*.135,0,7);c.stroke();
  [[1,1],[99,-1]].forEach(([gx,s])=>{c.strokeRect(Math.min(X(gx),X(gx+s*15.7)),Y(20.4),Math.abs(X(15.7)-X(0)),Y(59.2)-Y(0));c.strokeRect(Math.min(X(gx),X(gx+s*5.2)),Y(36.5),Math.abs(X(5.2)-X(0)),Y(27)-Y(0));
    c.fillStyle='rgba(255,255,255,.75)';c.fillRect(s>0?X(gx)-5:X(gx),Y(44.6),5,Y(10.8)-Y(0));});
  const cols=teamCols();const r=Math.max(5,w*.011);
  for(const side of ['a','h']){const sd=M[side];V.pl[side].forEach((p,i)=>{if(!p||sd.xi[i]==null)return;const gk=sd.slots[i]==='GK';
    c.beginPath();c.arc(X(p.x),Y(p.y),r,0,7);c.fillStyle=gk?'#d9d36a':cols[side][0];c.fill();c.lineWidth=2;c.strokeStyle=gk?'#222':cols[side][1];c.stroke();
    if(w>420){c.fillStyle=gk?'#222':(lum(cols[side][0])>.6?'#111':'#fff');c.font=`600 ${Math.round(r*1.05)}px Oswald,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),X(p.x),Y(p.y)+.5);}});}
  c.beginPath();c.arc(X(V.ball.x),Y(V.ball.y),r*.5,0,7);c.fillStyle='#fff';c.fill();c.strokeStyle='#111';c.lineWidth=1;c.stroke();
  // осадки
  if(wx.k==='rain'||wx.k==='snow'){while(V.parts.length<(wx.k==='rain'?90:60))V.parts.push({x:rnd()*w,y:rnd()*h,v:.5+rnd()});
    c.strokeStyle='rgba(200,220,255,.35)';c.fillStyle='rgba(255,255,255,.8)';V.parts.forEach(q=>{if(wx.k==='rain'){q.y+=9*q.v;q.x-=2;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x-3,q.y+9);c.stroke();}else{q.y+=1.1*q.v;q.x+=Math.sin(V.t+q.v*9)*.5;c.fillRect(q.x,q.y,2,2);}if(q.y>h){q.y=-10;q.x=rnd()*w;}});}
  else V.parts.length=0;
  if(wx.k==='heat'){c.fillStyle='rgba(255,170,60,.06)';c.fillRect(0,0,w,h);}
  if(V.flash>0&&V.flashTxt){c.globalAlpha=Math.min(1,V.flash*1.5);c.font=`600 ${Math.round(h*(V.flashTxt==='ГОЛ!'?.2:.1))}px Oswald,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=V.flashTxt==='ГОЛ!'?'#3fe26b':'#fff';c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=4;c.strokeText(V.flashTxt,w/2,h/2);c.fillText(V.flashTxt,w/2,h/2);c.globalAlpha=1;}
}

/* ---------- экран матча ---------- */
const _vMatch=vMatch;
vMatch=function(){
  let html=_vMatch();if(!M)return html;
  const w=M.wx||wxOf(M.f);const e=WX[w.k];
  const wxPanel=`<div class="panel wxp"><span class="wxi" aria-hidden="true">${e.i}</span><div><b>${e.n}, ${w.temp>0?'+':''}${w.temp}°</b><small>Газон: ${pitchTxt(w.pitch).toLowerCase()} (${w.pitch}%)${e.d?' · '+e.d:''}${w.pitch<55?' Плохой газон повышает риск травм и мешает техничной игре.':''}</small></div></div>`;
  if(M.pm)return html.replace('<div class="row"><button class="btn pri" onclick="G.kick()">',wxPanel+'<div class="row"><button class="btn pri" onclick="G.kick()">');
  if(M.done)return html;
  const us=usSide();const cols=teamCols();const H=S.T[M.h.t],A_=S.T[M.a.t];
  const legend=`<div class="m2d-leg"><span><i style="background:${cols.h[0]};border-color:${cols.h[1]}"></i>${esc(H.n)} →</span><span class="mute">${e.i} ${e.n} · газон ${w.pitch}%</span><span>← ${esc(A_.n)}<i style="background:${cols.a[0]};border-color:${cols.a[1]}"></i></span></div>`;
  const left=us.sh&&M.min<us.sh.until?us.sh.until-M.min:0;const cd=Math.max(0,8-(M.min-M.cool));
  const shouts=`<div class="shouts"><span class="lab">С бровки:</span>${Object.entries(SHOUTS).map(([k,s])=>`<button class="btn sm ${us.sh&&us.sh.k===k&&left?'on':''}" ${cd&&!(us.sh&&us.sh.k===k)?'disabled':''} title="${esc(s.d)}" onclick="G.shout('${k}')">${s.n}</button>`).join('')}<span class="mute" style="font-size:12px">${left?`Действует ещё ${left} мин.`:cd?`Следующее указание через ${cd} мин.`:'Указание действует 10 минут'}</span></div>`;
  let ht='';
  if(M.min===45&&!M.run&&M.ht&&!M.ht.done&&!M.et){const diff=us===M.h?M.hg-M.ag:M.ag-M.hg;
    ht=`<div class="panel htalk"><h3>Перерыв: разговор в раздевалке</h3><p class="mute" style="margin:4px 0 10px">Счёт ${M.hg}:${M.ag} — ${diff>0?'мы ведём':diff<0?'мы проигрываем':'ничья'}. От ваших слов зависит настрой команды во втором тайме.</p><div class="talks">${Object.entries(TALKS).map(([k,t])=>`<button class="tbtn" onclick="G.halfTalk('${k}')"><b>${t.n}</b><small>${t.d}</small></button>`).join('')}</div></div>`;}
  else if(M.ht&&M.ht.done&&M.ht.k&&M.min<60)ht=`<div class="panel htres"><b>В перерыве: «${TALKS[M.ht.k].n}»</b> <span class="${M.ht.mor>0?'good':M.ht.mor<0?'bad':''}">${esc(M.ht.txt)}</span></div>`;
  const block=`${ht}<div class="panel m2d-p">${legend}<div id="m2d" class="m2d"></div>${shouts}</div>`;
  const i=html.indexOf('<div class="tac">');
  return i>=0?html.slice(0,i)+block+html.slice(i):html+block;
};
