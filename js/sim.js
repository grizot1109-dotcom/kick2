'use strict';
/* ===== KICK: матчи, дни, сезоны, карьера ===== */
const userTeam=()=>S&&S.user&&S.user.club>=0?S.T[S.user.club]:null;
const SHW={GK:0,DC:.45,DL:.5,DR:.5,DM:.6,MC:1.2,ML:1.6,MR:1.6,AMC:3,AML:3,AMR:3,ST:5};
const drain=(p,tac)=>clamp(30-p.a[A.sta]*.8-p.a[A.nat]*.4,6,28)*(1+.12*(tac.pr-1)+.06*(tac.te-1));
const avail=p=>p&&p.inj<=0&&!(p.sus>0);
// позиции слотов команды: своя расстановка (перетаскиванием) или стандартная схема
const slotsOf=t=>(t.tac.cs&&t.tac.cs.length===11)?t.tac.cs:FORM[t.tac.f];

/* ----- составы и сила ----- */
function bestXI(t,slots,pre){
  const xi=pre?pre.slice():new Array(slots.length).fill(null);const used=new Set(xi.filter(x=>x!=null));
  const av=t.pl.map(id=>S.P[id]).filter(avail);
  const order=slots.map((s,i)=>i).sort((a,b)=>(slots[a]==='GK'?0:1)-(slots[b]==='GK'?0:1));
  for(const pass of [.94,0]){for(const i of order){if(xi[i]!=null)continue;let best=null,bv=-1;
    for(const p of av){if(used.has(p.id)||fam(p,slots[i])<pass)continue;const v=slotVal(p,slots[i]);if(v>bv){bv=v;best=p;}}
    if(best){xi[i]=best.id;used.add(best.id);}}}
  return xi;
}
function benchOf(t,xi){
  const s=new Set(xi);const av=t.pl.map(id=>S.P[id]).filter(p=>p&&!s.has(p.id)&&avail(p)).sort((a,b)=>ca(b)-ca(a));
  const gk=av.find(p=>p.pos==='GK');const rest=av.filter(p=>p!==gk);return (gk?[gk,...rest]:rest).slice(0,9).map(p=>p.id);
}
function validateXI(t){
  const slots=slotsOf(t);
  if(!t.xi||t.xi.length!==slots.length){t.xi=bestXI(t,slots);return true;}
  let ch=false;const seen=new Set();
  t.xi=t.xi.map(id=>{const p=S.P[id];if(id==null||!p||p.club!==t.id||!avail(p)||seen.has(id)){if(id!=null)ch=true;return null;}seen.add(id);return id;});
  if(t.xi.some(x=>x==null)){t.xi=bestXI(t,slots,t.xi);ch=true;}
  return ch;
}
function lineupOf(t){if(S.user&&t.id===S.user.club){validateXI(t);return t.xi;}return bestXI(t,slotsOf(t));}
// вклад позиции в оборону / центр / атаку
const PW={GK:[0,0,0],DC:[1,0,0],DL:[.85,.1,.05],DR:[.85,.1,.05],DM:[.5,.5,0],MC:[.1,.8,.1],ML:[.1,.6,.3],MR:[.1,.6,.3],AMC:[0,.4,.6],AML:[0,.3,.7],AMR:[0,.3,.7],ST:[0,.05,.95]};
const avgA=(ps,keys)=>{if(!ps.length)return 10;let s=0;for(const p of ps)for(const k of keys)s+=p.a[A[k]];return s/ps.length/keys.length;};
function strength(xi,slots,tac,reds){
  tac=tac||TAC0;let g=4,d=0,m=0,a=0,dw=0,mw=0,aw=0,ldr=0;const atk=[],dfn=[];
  xi.forEach((id,i)=>{const p=S.P[id];if(!p)return;const pos=slots[i];const v=slotVal(p,pos);
    if(pos==='GK'){g=v;return;}
    let [wd,wm,wa]=PW[pos];const du=tac.du?tac.du[i]:1; // обязанность: 0 оборона, 1 поддержка, 2 атака
    if(du===2){const k=.2*(wd+wm);wa+=k;wd*=.8;wm*=.8;}else if(du===0){const k=.2*(wa+wm);wd+=k;wa*=.8;wm*=.8;}
    d+=v*wd;m+=v*wm;a+=v*wa;dw+=wd;mw+=wm;aw+=wa;ldr=Math.max(ldr,p.a[A.ldr]);
    if(wa>=.6)atk.push(p);if(wd>=.85)dfn.push(p);});
  const f=(1-.09*(reds||0))*(1+.004*(ldr-12));
  return {gk:g,def:(dw?d/dw:5)*(1+.05*(dw-4.5))*f,mid:(mw?m/mw:5)*(1+.05*(mw-3.5))*f,att:(aw?a/aw:5)*(1+.05*(aw-2.5))*f,
    apace:avgA(atk,['pac','acc']),dpace:avgA(dfn,['pac','acc']),aaer:avgA(atk,['hea','jum']),daer:avgA(dfn,['hea','jum'])};
}
// m менталитет 0-4; pr прессинг, te темп, wi ширина, dl линия обороны, ps пасы (0 короткий…2 прямой), tk отбор — 0-2; ct контратаки
const TAC0={m:2,pr:1,te:1,wi:1,dl:1,ps:1,tk:1,ct:0};
const tv=(t,k)=>t&&t[k]!=null?t[k]:TAC0[k];
function lam(s,o,ta,tb,home){
  ta=ta||TAC0;tb=tb||TAC0;
  let att=s.att*(1+.035*(tv(ta,'m')-2))*(1+.02*(tv(ta,'te')-1))*(1+.01*(tv(ta,'wi')-1));
  let mid=s.mid*(1+.02*(tv(ta,'pr')-1))*(1+.015*(tv(ta,'dl')-1));
  let def=o.def*(1-.025*(tv(tb,'m')-2))*(1+.02*(tv(tb,'tk')-1));const omid=o.mid*(1+.02*(tv(tb,'pr')-1))*(1+.025*(tv(tb,'dl')-1));
  // высокая линия соперника — опасна против быстрых нападающих; низкая — гасит атаки, но отдаёт центр
  const dl=tv(tb,'dl');if(dl===2)att*=1+.035*clamp((s.apace||10)-(o.dpace||10),-4,4)/2;else if(dl===0){att*=.97;mid*=1.03;}
  // прямые передачи выгодны быстрым или сильным в воздухе форвардам, короткие — техничным полузащитникам
  const ps=tv(ta,'ps');if(ps===2)att*=1+.025*clamp(((s.apace||10)+(s.aaer||10))/2-((o.dpace||10)+(o.daer||10))/2,-4,4)/2;else if(ps===0)mid*=1.03;
  if(tv(ta,'ct')&&tv(tb,'m')>=3)att*=1.05;
  const A_=att*.6+mid*.4,D=def*.6+o.gk*.2+omid*.2;
  return clamp(1.42*Math.exp(.11*(A_-D))*(home>0?1.1:home<0?.9:1)*(1+.03*(tv(tb,'pr')-1)),.15,4.5);
}

/* ----- момент у ворот: шанс гола зависит от характеристик ----- */
// типы моментов: through — пас в разрез, cross — навес, long — удар издали, solo — дриблинг, corner, fk — штрафной, pen
const CH_XG={through:.21,cross:.10,long:.035,solo:.15,corner:.075,fk:.055,pen:.76};
const ofA=(p,keys)=>{let s=0;for(const k of keys)s+=p.a[A[k]];return s/keys.length;};
function takerOf(op,tac,key,attr){const want=tac&&tac[key];const f=op.find(x=>x[0]===want);if(f)return f[0];let b=null,bv=-1;for(const [id,ps] of op){if(ps==='GK')continue;const v=S.P[id].a[A[attr]];if(v>bv){bv=v;b=id;}}return b;}
function chance(sd,od){
  const op=sd.xi.map((id,i)=>[id,sd.slots[i],i]).filter(x=>x[0]!=null&&S.P[x[0]]);const oo=od.xi.map((id,i)=>[id,od.slots[i],i]).filter(x=>x[0]!=null&&S.P[x[0]]);
  if(op.length<2)return null;const tac=sd.tac||TAC0;const P=id=>S.P[id];
  const duty=i=>tac.du?tac.du[i]:1;const wide=op.filter(x=>/L$|R$/.test(x[1])&&x[1]!=='GK');const mids=op.filter(x=>['DM','MC','AMC','ML','MR'].includes(x[1]));
  const wi=tv(tac,'wi'),ps=tv(tac,'ps');
  const W_={through:1*(wi===0?1.3:1)*(ps===0?1.15:1)*(mids.length?ofA(P(pickW(mids,()=>1)[0]),['pas','vis'])/11:.7),
    cross:.9*(wi===2?1.35:wi===0?.7:1)*(wide.length?ofA(P(pick(wide)[0]),['cro'])/11:.5),long:.55*(ps===2?1.2:1),
    solo:.45*(wide.length||mids.length?ofA(P(pick(wide.length?wide:mids)[0]),['dri','fla'])/11:.7),corner:.3,fk:.14,pen:.035};
  const type=pickW(Object.keys(W_),k=>W_[k]);
  const shw=([id,ps,i])=>SHW[ps]*(duty(i)===2?1.35:duty(i)===0?.6:1)*(1+(P(id).hf||0)*.1);
  let sid,aid=null,sk,xg=CH_XG[type],gks;const gk=oo.find(x=>x[1]==='GK');const G_=gk?P(gk[0]):null;
  const dcs=oo.filter(x=>['DC','DL','DR','DM'].includes(x[1])).map(x=>P(x[0]));const dav=keys=>dcs.length?dcs.reduce((s,p)=>s+ofA(p,keys),0)/dcs.length:6;
  const g=keys=>G_?ofA(G_,keys):5;
  const hf=p=>(p.hf||0)*.8;
  if(type==='pen'||type==='fk'||type==='corner'){
    const tk=takerOf(op,tac,type==='pen'?'pk':type==='fk'?'fk':'ck',type==='pen'?'pen':type==='fk'?'fre':'cor');
    if(type==='corner'){aid=tk;sid=pickW(op.filter(x=>x[0]!==tk&&x[1]!=='GK'),([id])=>P(id).a[A.hea]+P(id).a[A.jum]-8)[0];const s=P(sid);sk=ofA(s,['hea','jum','str','bra'])+hf(s);
      xg*=Math.exp(.07*(ofA(P(aid),['cor'])-10))*Math.exp(.06*(ofA(s,['hea','jum'])-dav(['hea','jum','mar'])));gks=g(['aer','cmd','ref']);}
    else{sid=tk;const s=P(sid);sk=type==='pen'?ofA(s,['pen','cmp'])+hf(s):ofA(s,['fre','tec'])+hf(s);gks=type==='pen'?g(['ref','agi']):g(['ref','pos','agi']);}
  }else{
    let pool=op.filter(x=>x[1]!=='GK');
    if(type==='cross'){const c=pool.filter(x=>!/L$|R$/.test(x[1]));if(c.length)pool=c;}
    const sw={through:id=>ofA(P(id),['otb','fin','ant']),cross:id=>ofA(P(id),['hea','jum','otb']),long:id=>ofA(P(id),['lon','tec'])+3,solo:id=>ofA(P(id),['dri','agi','fla'])}[type];
    const sx=pickW(pool,x=>shw(x)*Math.pow(sw(x[0])/10,1.3));sid=sx[0];const s=P(sid);
    const cr=op.filter(x=>x[0]!==sid&&x[1]!=='GK');
    if(type!=='long'||rnd()<.5){if(cr.length&&type!=='solo'){const ak=type==='cross'?['cro','tec']:['pas','vis'];aid=pickW(cr,x=>(SHW[x[1]]+.8)*Math.pow(ofA(P(x[0]),ak)/10,2))[0];}}
    const A1=aid?P(aid):null;
    if(type==='through'){xg*=Math.exp(.06*((A1?ofA(A1,['pas','vis']):10)-10))*Math.exp(.045*(ofA(s,['otb','pac','acc','ant'])-dav(['pos','pac','mar','ant'])));sk=ofA(s,['fin','fin','cmp','fir'])+hf(s);gks=g(['one','one','ref','rus']);}
    else if(type==='cross'){xg*=Math.exp(.06*((A1?ofA(A1,['cro']):10)-10))*Math.exp(.045*(ofA(s,['hea','jum','str','otb'])-dav(['hea','jum','mar','str'])));sk=ofA(s,['hea','hea','cmp','bra'])+hf(s);gks=g(['aer','cmd','ref']);}
    else if(type==='long'){xg*=Math.exp(.05*(s.a[A.lon]-10));sk=ofA(s,['lon','lon','tec'])+hf(s);gks=g(['ref','han','pos']);}
    else{xg*=Math.exp(.045*(ofA(s,['dri','agi','acc','fla'])-dav(['tck','pos','agi','acc'])));sk=ofA(s,['fin','cmp','tec'])+hf(s);gks=g(['one','ref','agi']);}
  }
  if(type!=='pen')xg=clamp(xg*.7,.01,.75);
  const s=P(sid);const conv=Math.exp(.045*(sk-10)-.04*(gks-10));
  const pg=clamp(xg*conv,.005,.92);const goal=rnd()<pg;
  const pot=clamp(.30+.018*(ofA(s,['tec','cmp','fin'])-10)+(type==='pen'?.5:0),.15,.95);
  const sot=goal||rnd()<Math.max(0,(pot-pg)/(1-pg));
  // кто из защитников проиграл / выиграл эпизод
  const df=oo.filter(x=>['DC','DL','DR','DM'].includes(x[1]));const dfid=df.length?pick(df)[0]:null;
  return {type,sid,aid,xg:Math.round(xg*100)/100,goal,sot,gk:gk?gk[0]:null,df:dfid};
}
function penalties(kh,ka){ // kh,ka: массивы бьющих (игроки) — вероятность забить
  let h=0,a=0;const p=(x)=>.72+.1*((x&&x.a?x.a[A.pen]:12)-12)/8;
  for(let i=0;i<5;i++){if(rnd()<p(kh[i%kh.length]))h++;if(rnd()<p(ka[i%ka.length]))a++;if(h>a+(4-i)||a>h+(4-i))break;}
  let i=5;while(h===a&&i<30){const x=rnd()<p(kh[i%kh.length]),y=rnd()<p(ka[i%ka.length]);if(x)h++;if(y)a++;i++;}
  return [h,a];
}

/* ----- быстрая симуляция ----- */
// средний уровень игроков на поле (для оценок «выше/ниже соперника»)
function xiLevel(sd){let s=0,n=0;sd.xi.forEach((id,i)=>{const p=S.P[id];if(p){s+=eff(p,sd.slots[i]);n++;}});return n?s/n:8;}
// базовая оценка за матч: уровень относительно соперника + скрытая форма игрока
function baseRating(p,pos,oppLv){return 6.5+clamp((eff(p,pos)*fam(p,pos)-oppLv)*.07,-.45,.45)+(p.hf||0)*.3;}
function hotForm(p){p.hf=clamp((p.hf||0)*.8+gauss()*.42,-1.6,1.6);}
function quickSide(t,sd,mine,theirs,gf,ga,oppLv){
  const pos={};sd.xi.forEach((id,i)=>{if(id!=null)pos[id]=sd.slots[i];});
  const out={t:t.id,played:sd.xi.filter(x=>x!=null),rat:{},g:[],as:[],yc:[],rc:[],inj:[]};
  benchOf(t,sd.xi).filter(id=>S.P[id].pos!=='GK').slice(0,4).forEach(id=>{if(rnd()<.8){out.played.push(id);pos[id]=S.P[id].pos;}});
  out.played.forEach(id=>{hotForm(S.P[id]);out.rat[id]=baseRating(S.P[id],pos[id],oppLv)+gauss()*.3;});
  const R=(id,v)=>{if(id!=null&&out.rat[id]!=null)out.rat[id]+=v;};
  mine.forEach(e=>{if(e.goal){out.g.push(e.sid);R(e.sid,1);if(e.aid!=null){out.as.push(e.aid);R(e.aid,.55);}}else{R(e.sid,e.sot?.05:-.06);}});
  theirs.forEach(e=>{if(e.goal){R(e.gk,-.3);R(e.df,-.2);}else if(e.sot){R(e.gk,.2);}else R(e.df,.05);});
  const res=gf>ga?.3:gf<ga?-.3:0;
  out.played.forEach(id=>{const ps=pos[id];let r=out.rat[id]+res;
    if(ga===0&&(ps==='GK'||['DC','DL','DR'].includes(ps)))r+=.45;
    out.rat[id]=Math.round(clamp(r,4.5,9.9)*10)/10;const p=S.P[id];
    const ycp=.07*(1+(p.a[A.agg]-10)*.04)*(1+.25*(tv(t.tac,'tk')-1));
    if(rnd()<ycp)out.yc.push(id);if(rnd()<.004)out.rc.push(id);if(rnd()<.012*(1.25-p.a[A.nat]*.02))out.inj.push([id,rnd()<.1?ri(50,110):ri(5,40)]);});
  return out;
}
function simFx(f){
  if(f.nt)return simNT(f);
  const th=S.T[f.h],ta=S.T[f.a];if(!th||!ta){f.hg=0;f.ag=0;return;}
  const H={slots:slotsOf(th),xi:lineupOf(th),tac:th.tac},Aw={slots:slotsOf(ta),xi:lineupOf(ta),tac:ta.tac};
  const s1=strength(H.xi,H.slots,th.tac),s2=strength(Aw.xi,Aw.slots,ta.tac);
  const lh=lam(s1,s2,th.tac,ta.tac,f.neu?0:1),la=lam(s2,s1,ta.tac,th.tac,f.neu?0:-1);
  const eh=[],ea=[];const run=(sd,od,l,arr,mins)=>{const n=poisson(l*mins/10);for(let i=0;i<n;i++){const c=chance(sd,od);if(c)arr.push(c);}};
  run(H,Aw,lh,eh,90);run(Aw,H,la,ea,90);
  const goals=a=>a.filter(e=>e.goal).length;let hg=goals(eh),ag=goals(ea);let x=0,pen=null;
  if(f.dec){const [ah,aa]=aggregate(f);if(hg+ah===ag+aa){x=1;run(H,Aw,lh,eh,30);run(Aw,H,la,ea,30);hg=goals(eh);ag=goals(ea);
    if(hg+ah===ag+aa)pen=penalties(H.xi.map(id=>S.P[id]).filter(Boolean).reverse(),Aw.xi.map(id=>S.P[id]).filter(Boolean).reverse());}}
  const lvH=xiLevel(H),lvA=xiLevel(Aw);
  applyRes(f,{hg,ag,x,pen,h:quickSide(th,H,eh,ea,hg,ag,lvA),a:quickSide(ta,Aw,ea,eh,ag,hg,lvH)},false);
}
function simNT(f){
  const s1=S.NS[f.h]||ntStrength(f.h),s2=S.NS[f.a]||ntStrength(f.a);
  const lh=lam(s1,s2,null,null,f.neu?0:1),la=lam(s2,s1,null,null,f.neu?0:-1);
  let hg=poisson(lh),ag=poisson(la),x=0,pen=null;
  if(f.dec&&hg===ag){x=1;hg+=poisson(lh/3);ag+=poisson(la/3);if(hg===ag)pen=penalties([],[]);}
  f.hg=hg;f.ag=ag;f.x=x;f.pen=pen;
  const c=S.C[f.c];if(c){[[f.h,hg,s1],[f.a,ag,s2]].forEach(([code,g,s])=>{const xi=(s.xi||[]).filter(x=>x!=null&&S.P[x]);for(let i=0;i<g;i++){if(!xi.length)break;const sid=pickW(xi,id=>{const p=S.P[id];return (SHW[p.pos]+.1)*(p.a[A.fin]+p.a[A.otb])/20;});c.sc[sid]=(c.sc[sid]||0)+1;}});}
}
function applyRes(f,res,live){
  f.hg=res.hg;f.ag=res.ag;f.x=res.x||0;f.pen=res.pen||null;
  const isL=f.c[0]==='L';const L=isL?S.L[+f.c.slice(1)]:null;const c=isL?null:S.C[f.c];
  if(L){const h=L.tbl[f.h],a=L.tbl[f.a];if(h&&a){h.p++;a.p++;h.gf+=f.hg;h.ga+=f.ag;a.gf+=f.ag;a.ga+=f.hg;
    if(f.hg>f.ag){h.w++;a.l++;h.pts+=3;h.fm+='В';a.fm+='П';}else if(f.hg<f.ag){a.w++;h.l++;a.pts+=3;h.fm+='П';a.fm+='В';}else{h.d++;a.d++;h.pts++;a.pts++;h.fm+='Н';a.fm+='Н';}
    h.fm=h.fm.slice(-5);a.fm=a.fm.slice(-5);}}
  const tally=L?L.sc:c?c.sc:null;
  for(const k of ['h','a']){
    const sd=res[k];if(!sd)continue;const t=S.T[sd.t];const gf=k==='h'?f.hg:f.ag,ga=k==='h'?f.ag:f.hg;
    let out=gf>ga?1:gf<ga?-1:0;if(f.pen)out=(k==='h'?f.pen[0]>f.pen[1]:f.pen[1]>f.pen[0])?1:-1;
    const playedSet=new Set(sd.played);
    t.pl.forEach(id=>{const p=S.P[id];if(p&&p.sus>0&&!playedSet.has(id))p.sus--;});
    for(const id of sd.played){const p=S.P[id];if(!p)continue;const r=sd.rat[id]||6.5;p.st.ap++;p.car.ap++;p.st.r+=r;p.lastAp=S.abs;p.form.push(r);if(p.form.length>5)p.form.shift();
      p.mor=clamp(p.mor+out*4+(r-6.8)*3,10,100);if(!live)p.cond=clamp(p.cond-drain(p,t.tac),20,100);}
    sd.g.forEach(id=>{const p=S.P[id];if(p){p.st.g++;p.car.g++;if(tally)tally[id]=(tally[id]||0)+1;}});
    sd.as.forEach(id=>{if(S.P[id])S.P[id].st.as++;});
    sd.yc.forEach(id=>{if(S.P[id])S.P[id].st.yc++;});
    sd.rc.forEach(id=>{const p=S.P[id];if(p){p.st.rc++;p.sus=1;}});
    sd.inj.forEach(([id,dd])=>{const p=S.P[id];if(p){p.inj=Math.max(p.inj,dd);if(S.user&&p.club===S.user.club)msg('Медицинский штаб',`Травма: ${p.n}`,`${p.n} получил травму и пропустит примерно ${injTxt(dd)}.`);}});
    if(S.user&&t.id===S.user.club){S.user.last=(S.user.last||0)+out;const r=S.user.rec;r[out===1?'w':out===0?'d':'l']++;const tt=S.user.tot;tt[out===1?'w':out===0?'d':'l']++;}
  }
  matchNews(f,res);
}
function matchNews(f,res){
  if(f.nt)return;const th=S.T[f.h],ta=S.T[f.a];if(!th||!ta)return;
  const isU=S.user&&(f.h===S.user.club||f.a===S.user.club);const fin=/Финал/.test(f.r)&&f.c[0]!=='L';
  if(!isU&&!fin&&!(th.rep>=85&&ta.rep>=85))return;
  const L=f.c[0]==='L'?S.L[+f.c.slice(1)]:null;const cname=L?L.name:(S.C[f.c]||{}).name||'';const cid=L?'L:'+L.key+(L.ng>1?':'+L.grp:''):(S.C[f.c]||{}).id;
  const sc=`${f.hg}:${f.ag}`;let head;
  if(f.pen)head=`${f.pen[0]>f.pen[1]?th.n:ta.n} проходит дальше по пенальти (${sc}, пен. ${f.pen[0]}:${f.pen[1]})`;
  else if(f.hg>f.ag)head=f.hg-f.ag>=3?`${th.n} разгромил ${ta.n} — ${sc}`:`${th.n} обыграл ${ta.n} — ${sc}`;
  else if(f.hg<f.ag)head=f.ag-f.hg>=3?`${ta.n} разгромил ${th.n} в гостях — ${f.ag}:${f.hg}`:`${ta.n} победил в гостях ${th.n} — ${f.ag}:${f.hg}`;
  else head=`${th.n} и ${ta.n} сыграли вничью — ${sc}`;
  const goals=[...(res.h?res.h.g:[]),...(res.a?res.a.g:[])];const cnt={};goals.forEach(id=>cnt[id]=(cnt[id]||0)+1);
  const star=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
  const scorers=Object.entries(cnt).map(([id,n])=>S.P[id]?S.P[id].n+(n>1?` (${n})`:''):'').filter(Boolean).join(', ');
  news(head,{t:[f.h,f.a],p:star?+star[0]:null,c:cid,k:'match',b:`${cname}${f.r?', '+f.r.toLowerCase():''}. ${scorers?'Голы: '+scorers+'.':'Голов не было.'}${star&&cnt[star[0]]>=3?` ${S.P[star[0]].n} оформил хет-трик!`:''}`});
}
const injTxt=d=>d<14?`${d} ${plural(d,'день','дня','дней')}`:`${Math.round(d/7)} ${plural(Math.round(d/7),'неделю','недели','недель')}`;

/* ----- живой матч ----- */
let M=null,timer=null;
function mkSide(t,isUser){
  if(isUser)validateXI(t);const slots=slotsOf(t).slice();const xi=isUser?t.xi.slice():bestXI(t,slots);
  const xy=isUser&&t.tac.xy&&t.tac.xy.length===11?t.tac.xy.map(v=>v.slice()):null;
  const sd={t:t.id,slots,xy,xi,bench:benchOf(t,xi),tac:{...t.tac,du:t.tac.du?t.tac.du.slice():null},subs:0,red:0,rat:{},played:xi.filter(x=>x!=null),g:[],as:[],yc:[],rc:[],inj:[],st:{sh:0,sot:0,xg:0,yc:0},user:isUser};
  return sd;
}
function prepMatch(f){const uc=S.user.club;M={f,min:0,st:ri(2,5),et:false,end:90,hg:0,ag:0,h:mkSide(S.T[f.h],f.h===uc),a:mkSide(S.T[f.a],f.a===uc),ev:[],speed:(window.SET&&SET.speed)||1,run:false,done:false,pm:true,poss:0,pen:null};
  const lh=xiLevel(M.h),la=xiLevel(M.a);
  for(const [sd,ol] of [[M.h,la],[M.a,lh]])sd.played.forEach(id=>{const p=S.P[id];hotForm(p);sd.rat[id]=baseRating(p,sd.slots[sd.xi.indexOf(id)],ol);});}
const sideStr=sd=>strength(sd.xi,sd.slots,sd.tac,sd.red);
function addEv(txt,k){const m=M.min;M.ev.unshift({m:m>120?'120+'+(m-120):m>90&&!M.et?'90+'+(m-90):m,txt,k:k||''});}
const pn=id=>S.P[id]?S.P[id].n:'—';
const onPitch=sd=>sd.xi.map((id,i)=>[id,sd.slots[i]]).filter(x=>x[0]!=null);
const CH_TXT={
  through:(s,a)=>a?`${a} отдаёт пас в разрез на ${s}, тот выходит к воротам`:`${s} убегает за спины защитников`,
  cross:(s,a)=>a?`${a} навешивает с фланга, ${s} бьёт головой`:`Подача в штрафную, ${s} бьёт головой`,
  long:(s,a)=>`${s} решается на удар издали`,solo:(s,a,d)=>`${s} обыгрывает ${d||'защитника'} и пробивает`,
  corner:(s,a)=>`Угловой подаёт ${a||'полузащитник'}, ${s} выигрывает верховую борьбу`,fk:s=>`Штрафной в опасной зоне. Бьёт ${s}`,pen:s=>`Пенальти! К мячу подходит ${s}`};
function attempt(sd,od,l){
  if(rnd()>=l/10)return;
  const c=chance(sd,od);if(!c)return;const sp=S.P[c.sid];const tn=S.T[sd.t].n;const gk=c.gk!=null?S.P[c.gk]:null;const gkn=gk?lastName(gk.n):'вратарь';
  sd.st.sh++;sd.st.xg+=c.xg;const lead=CH_TXT[c.type](sp.n,c.aid!=null?pn(c.aid):null,c.df!=null?lastName(pn(c.df)):null);
  const R=(s,id,v)=>{if(id!=null&&s.rat[id]!=null)s.rat[id]+=v;};
  if(c.goal){
    sd.st.sot++;if(sd===M.h)M.hg++;else M.ag++;sd.g.push(c.sid);R(sd,c.sid,1);if(c.aid!=null&&c.type!=='pen'&&c.type!=='fk'){sd.as.push(c.aid);R(sd,c.aid,.55);}
    R(od,c.gk,-.3);R(od,c.df,-.2);
    addEv(`ГОЛ! ${lead} — и забивает за ${tn}! ${M.hg}:${M.ag}`,'goal');
  }else if(c.sot){sd.st.sot++;R(od,c.gk,.2);R(sd,c.sid,.05);addEv(`${lead} — ${pick([`${gkn} спасает!`,`${gkn} на месте.`,`${gkn} в прыжке отражает удар.`,`отличный сейв, ${gkn}!`])}`);}
  else{R(sd,c.sid,-.06);R(od,c.df,.05);addEv(`${lead} — ${pick(c.type==='cross'||c.type==='corner'?['мимо ворот.','выше перекладины.']:['мимо ворот.','выше перекладины.','удар блокирует защитник.','неточно.'])}`);}
}
function discipline(sd){
  if(rnd()<.021*(1+.25*(tv(sd.tac,'tk')-1))){const op=onPitch(sd).filter(x=>x[1]!=='GK');if(!op.length)return;const [id]=pickW(op,([i])=>S.P[i].a[A.agg]);
    if(sd.yc.includes(id))sendOff(sd,id,'Вторая жёлтая — '+pn(id)+' удалён с поля.');else{sd.yc.push(id);sd.st.yc++;sd.rat[id]-=.2;addEv('Жёлтая карточка: '+pn(id)+'.','card');}}
  else if(rnd()<.0008){const op=onPitch(sd).filter(x=>x[1]!=='GK');if(op.length){const id=pick(op)[0];sendOff(sd,id,'Прямая красная карточка! '+pn(id)+' удалён.');}}
}
function sendOff(sd,id,txt){const i=sd.xi.indexOf(id);if(i<0)return;sd.xi[i]=null;sd.red++;sd.rc.push(id);sd.rat[id]-=1.5;addEv(txt,'red');}
function bestBenchFor(sd,pos){let b=null,bv=-1;sd.bench.forEach(id=>{const v=slotVal(S.P[id],pos);if(v>bv){bv=v;b=id;}});return b;}
function makeSub(sd,i,inId,forced){
  const out=sd.xi[i];if(out==null||sd.subs>=5||!sd.bench.includes(inId))return false;
  sd.xi[i]=inId;sd.bench=sd.bench.filter(x=>x!==inId);sd.subs++;sd.played.push(inId);sd.rat[inId]=6.5;
  addEv(`${S.T[sd.t].n}: ${pn(inId)} выходит вместо ${pn(out)}${forced?' (вынужденная замена)':''}.`,'info');return true;
}
function injuries(sd){
  if(rnd()<.0016){const op=onPitch(sd);if(!op.length)return;const [id,ps]=pick(op);const dd=rnd()<.15?ri(40,100):ri(5,35);sd.inj.push([id,dd]);S.P[id].cond=Math.min(S.P[id].cond,30);addEv(`${pn(id)} получает травму.`);
    const b=bestBenchFor(sd,ps);if(b!=null&&sd.subs<5)makeSub(sd,sd.xi.indexOf(id),b,true);}
}
function aiManage(sd,myG,opG){
  if(sd.user)return;
  if(M.min>=58&&M.min<=86&&sd.subs<5&&rnd()<.11){const op=onPitch(sd).filter(x=>x[1]!=='GK').sort((a,b)=>S.P[a[0]].cond-S.P[b[0]].cond);
    if(op.length){const [id,ps]=op[0];if(S.P[id].cond<78||rnd()<.3){const b=bestBenchFor(sd,ps);if(b!=null)makeSub(sd,sd.xi.indexOf(id),b);}}}
  if(M.min===70){if(myG<opG&&sd.tac.m<4){sd.tac.m++;addEv(`${S.T[sd.t].n} переходит к более атакующей игре.`,'info');}else if(myG>opG&&sd.tac.m>1&&rnd()<.5){sd.tac.m--;addEv(`${S.T[sd.t].n} отходит назад, защищая счёт.`,'info');}}
}
function aggLive(){const [ah,aa]=aggregate(M.f);return [M.hg+ah,M.ag+aa];}
function tick(silent){
  if(!M||M.done)return;M.min++;
  const sh=sideStr(M.h),sa=sideStr(M.a);const hm=M.f.neu?0:1;
  const lh=lam(sh,sa,M.h.tac,M.a.tac,hm),la=lam(sa,sh,M.a.tac,M.h.tac,-hm);
  const mh=sh.mid*(1+.03*(M.h.tac.m-2)),ma=sa.mid*(1+.03*(M.a.tac.m-2));M.poss+=mh/(mh+ma);
  attempt(M.h,M.a,lh);attempt(M.a,M.h,la);discipline(M.h);discipline(M.a);injuries(M.h);injuries(M.a);
  for(const sd of [M.h,M.a])onPitch(sd).forEach(([id])=>{const p=S.P[id];p.cond=Math.max(15,p.cond-drain(p,sd.tac)/90);});
  if(rnd()<.05){const sd=rnd()<.5?M.h:M.a;const op=onPitch(sd);if(op.length){const [id]=pick(op);addEv(pick([`${S.T[sd.t].n} контролирует мяч и ищет свободного игрока.`,`${pn(id)} обыгрывает соперника и продвигается вперёд.`,`Игра идёт в середине поля.`,`${S.T[sd.t].n} разыгрывает угловой.`,`${pn(id)} теряет мяч под прессингом.`]),'info');}}
  aiManage(M.h,M.hg,M.ag);aiManage(M.a,M.ag,M.hg);
  if(M.min===45){addEv(`Перерыв. Счёт ${M.hg}:${M.ag}.`,'info');if(!silent){pause();toast('Перерыв — можно сделать замены и поменять тактику');}}
  if(M.min===90&&!M.et)addEv(`Добавлено ${M.st} мин.`,'info');
  if(!M.et&&M.min>=90+M.st){
    const [x,y]=aggLive();
    if(M.f.dec&&x===y){M.et=true;M.min=90;M.end=120;addEv(M.f.leg===2?`По сумме двух матчей ничья (${x}:${y}). Назначено дополнительное время.`:'Ничья — назначено дополнительное время.','info');if(!silent){pause();toast('Дополнительное время — можно сделать замены');}}
    else return finishMatch(silent);
  }
  if(M.et&&M.min>=120){const [x,y]=aggLive();if(x===y){const kh=onPitch(M.h).map(([id])=>S.P[id]).reverse(),ka=onPitch(M.a).map(([id])=>S.P[id]).reverse();M.pen=penalties(kh,ka);addEv(`Серия пенальти: ${M.pen[0]}:${M.pen[1]}.`,'goal');}return finishMatch(silent);}
  if(!silent)render();
}
function play(){if(!M||M.done)return;M.pm=false;M.run=true;clearInterval(timer);timer=setInterval(()=>tick(false),{1:420,2:190,4:70}[M.speed]);render();}
function pause(){if(M)M.run=false;clearInterval(timer);timer=null;}
function finishMatch(silent){
  pause();M.done=true;
  const w=M.pen?(M.pen[0]>M.pen[1]?M.h:M.a):null;
  addEv(`Финальный свисток. ${S.T[M.h.t].n} ${M.hg}:${M.ag} ${S.T[M.a.t].n}${M.et?' (доп. время)':''}${M.pen?`, пенальти ${M.pen[0]}:${M.pen[1]} — проходит ${S.T[w.t].n}`:''}.`,'info');
  for(const [sd,gf,ga] of [[M.h,M.hg,M.ag],[M.a,M.ag,M.hg]]){
    const res=gf>ga?.3:gf<ga?-.3:0;sd.played.forEach(id=>{let r=sd.rat[id]+res+gauss()*.3;const i=sd.xi.indexOf(id);const ps=i>=0?sd.slots[i]:S.P[id].pos;if(ga===0&&(ps==='GK'||['DC','DL','DR'].includes(ps)))r+=.45;sd.rat[id]=Math.round(clamp(r,4.5,10)*10)/10;});
  }
  applyRes(M.f,{hg:M.hg,ag:M.ag,x:M.et?1:0,pen:M.pen,h:M.h,a:M.a},true);
  if(!silent)render();
}

/* ----- ход времени ----- */
const seasonLen=()=>Math.round((new Date(S.year+1,6,1)-new Date(S.year,6,1))/864e5);
function userFxToday(){const t=userTeam();if(!t)return null;for(const i of (BYDAY[S.d]||[])){const f=S.F[i];if(f.hg==null&&!f.nt&&(f.h===t.id||f.a===t.id))return f;}return null;}
function processDay(){
  const touched=new Set();
  for(const i of (BYDAY[S.d]||[])){const f=S.F[i];if(f.hg==null)simFx(f);touched.add(f.c);}
  touched.forEach(k=>{if(k[0]!=='L'&&S.C[k])advanceComp(S.C[k]);});
  for(const k in S.C){const c=S.C[k];if(c.done)continue;const st=c.stages[c.st];if(!st)continue;const ids=st.t==='ko'?st.ties.flatMap(t=>t.f):st.fx;
    let late=false;for(const i of ids){const f=S.F[i];if(f.hg==null&&f.d<S.d){simFx(f);late=true;}}if(late)advanceComp(c);}
  daily();
  if(dateOf(S.d).getDay()===1)weekly();
  S.d++;S.abs++;
  if(S.d>=seasonLen())seasonEnd();
}
function daily(){
  const ut=S.user?S.user.club:-1;
  for(const id in S.P){const p=S.P[id];if(p.cond<100)p.cond=Math.min(100,p.cond+1.6+p.a[A.nat]*.13);if(p.inj>0)p.inj--;}
  if(windowOpen(S.d)){aiTransfers(9);if(dateOf(S.d).getDay()===3)bidsForUser();}
  dealsDaily();
  const nd=S.d+1;if(windowOpen(S.d)&&!windowOpen(nd)){S.inbox.forEach(m=>{if(m.type==='bid'&&!m.done){m.done=true;m.res='Трансферное окно закрылось.';}});msg('Трансферный отдел','Трансферное окно закрылось','Трансферное окно закрыто. Свободных агентов можно подписывать в любое время.');}
  if(!windowOpen(S.d-1)&&windowOpen(S.d)&&S.d>0)msg('Трансферный отдел','Открылось трансферное окно','Зимнее трансферное окно открыто до начала февраля.');
}
function weekly(){
  const uc=S.user?S.user.club:-1;const focus=S.user?S.user.train:'bal';
  S.T.forEach(t=>{t.bal+=t.inc-wageBill(t);});
  for(const id in S.P){const p=S.P[id];develop(p,p.club===uc&&uc>=0?focus:null);p.mor+=(70-p.mor)*.05;}
  if(uc>=0){boardWeek();if(dateOf(S.d).getDate()<=7)devReport();scoutsWeek();promisesWeek();}
  aiSackings();vacancies();applications();conflictsWeek();
  S.inbox.forEach(m=>{if(m.type==='job'&&!m.done&&S.abs>=m.data.exp){m.done=true;m.res='Предложение истекло.';}});
  const ut=userTeam();
  if(ut&&dateOf(S.d).getMonth()===2&&dateOf(S.d).getDate()<=7){const ex=ut.pl.map(id=>S.P[id]).filter(p=>p.ce<=S.year+1);if(ex.length)msg('Помощник тренера','Истекающие контракты',`Летом истекают контракты у игроков:\n${ex.map(p=>`• ${p.n} (${PR[p.pos]}, ${p.age})`).join('\n')}\n\nПродлите их в профиле игрока, иначе они уйдут свободными агентами.`);}
}
/* Развитие (раз в неделю): возраст задаёт общий тренд, игра — ускоряет или ломает его.
   perf: последние матчи (оценки 5 игр) и средняя за сезон; плохой сезон тянет характеристики вниз даже у молодых. */
const PHYS=['pac','acc','agi','sta','jum','bal','str','nat'],MENTAL_UP=['dec','cmp','ant','pos','tea','ldr','vis','cnt'];
const TECH=['fin','fir','pas','tec','dri','cro','lon','tck','mar','hea'];
function perfOf(p){
  const n=p.form.length;if(n<3)return null;const rec=p.form.reduce((a,b)=>a+b,0)/n;const sea=p.st.ap>=5?p.st.r/p.st.ap:rec;
  return clamp(((rec*.55+sea*.45)-6.8)/.45,-2.5,2.5);
}
function develop(p,focus){
  const c=ca(p);const age=p.age;const perf=perfOf(p);const pf=perf==null?0:perf;
  const benched=p.club>=0&&(p.lastAp==null||S.abs-p.lastAp>35); // давно не играет
  // рост
  if(age<=30){
    const base=age<=18?.17:age<=20?.15:age<=22?.12:age<=24?.085:age<=27?.05:.025;
    const gap=Math.max(0,p.pa-c+.25);
    let ch=base*gap*(.6+p.a[A.det]/25)*(1+.32*pf)*(benched&&age<=23?.55:1)*(focus?1.1:1);
    if(rnd()<ch)bump(p,1,focus);
    if(age<=24&&pf>=1.4&&rnd()<.04){p.pa=Math.min(20,p.pa+.25);} // выстрелил — потолок растёт
  }
  // опыт: ментальные качества растут с возрастом
  if(age>=22&&age<=33&&rnd()<.012*(1+.3*Math.max(0,pf))){const k=A[pick(MENTAL_UP)];setA(p,k,1);}
  // спад: возраст (сначала физика) + плохая игра
  let dch=age>=35?.11:age>=33?.075:age>=31?.045:age>=29?.018:0;
  if(perf!=null&&pf<=-.8&&p.st.ap>=4)dch+=.08*(-pf);
  if(rnd()<dch){
    let pool;if(age>=29&&rnd()<.65)pool=PHYS;else if(pf<=-1)pool=rnd()<.5?['cmp','dec','fir','cnt']:TECH.filter(k=>ROLE[POS_ROLE[p.pos]].some(([i])=>i===A[k]));else pool=TECH;
    if(p.pos==='GK'&&rnd()<.5)pool=['ref','one','han','aer','agi'];
    setA(p,A[pick(pool.length?pool:TECH)],-1);
  }
  if(perf!=null&&pf<=-1.3&&age<=25&&rnd()<.05)p.pa=Math.max(ca(p),p.pa-.2);
}
function setA(p,i,d){const v=clamp(p.a[i]+d,1,20);if(v===p.a[i])return;p.a[i]=v;
  if(!p.chg)p.chg=[];p.chg.unshift([i,d,S.abs]);if(p.chg.length>8)p.chg.length=8;}
function bump(p,d,focus){
  let i;if(focus&&focus!=='bal'&&rnd()<.5)i=A[pick(TRAIN_ATTR[focus])];else if(rnd()<.7)i=pickW(ROLE[POS_ROLE[p.pos]],x=>x[1])[0];else i=p.pos==='GK'?ri(14,46):ri(0,35);
  if(p.pos!=='GK'&&i>=36)i=A.dec;setA(p,i,d);
}
// ежемесячный отчёт тренерского штаба о прогрессе игроков
function devReport(){
  const t=userTeam();if(!t)return;const since=S.abs-30;const up=[],down=[];
  t.pl.map(id=>S.P[id]).forEach(p=>{if(!p||!p.chg)return;let s=0;const ks=[];p.chg.forEach(([i,d,at])=>{if(at>=since){s+=d;ks.push((d>0?'+':'−')+AL[i].toLowerCase());}});
    if(s>=1)up.push(`• ${p.n}: ${ks.join(', ')}`);else if(s<=-1)down.push(`• ${p.n}: ${ks.join(', ')}${perfOf(p)!=null&&perfOf(p)<=-1?' (слабая игра)':''}`);});
  if(up.length||down.length)msg('Тренерский штаб','Отчёт о развитии игроков',`${up.length?'Прогрессируют:\n'+up.join('\n'):''}${up.length&&down.length?'\n\n':''}${down.length?'Сдают:\n'+down.join('\n'):''}\n\nНа развитие влияют возраст, игровая практика, оценки за матчи и тренировки.`);
}

/* ----- карьера тренера ----- */
const repLabel=r=>r<20?'Местная':r<38?'Региональная':r<56?'Национальная':r<75?'Континентальная':'Мировая';
const clubStatus=r=>r>=88?'Гранд':r>=78?'Топ-клуб':r>=68?'Сильный клуб':r>=56?'Крепкий клуб':r>=44?'Середняк':'Скромный клуб';
function objective(t){
  const L=S.L[t.lg];const n=L.teams.length;const r=t.exp;const up=L.tier>1?((UPDOWN[L.nat]||[])[L.tier-2]||3):0;const upG=Math.max(1,Math.ceil(up/(L.ng||1)));
  if(L.tier>1){if(r<=upG)return [upG,'Выйти в дивизион выше'];if(r<=Math.ceil(n/3))return [Math.ceil(n/3),'Бороться за повышение'];if(r<=n/2)return [Math.floor(n/2),'Финишировать в верхней половине таблицы'];return [n-3,'Избежать вылета'];}
  if(r===1)return [1,'Выиграть чемпионат'];if(r<=2)return [2,'Бороться за чемпионство'];if(r<=4)return [4,'Финишировать в первой четвёрке'];
  if(r<=7)return [7,'Попасть в первую семёрку'];if(r<=n/2)return [Math.floor(n/2),'Финишировать в верхней половине таблицы'];
  if(r<=n-4)return [n-4,'Занять место в середине таблицы'];return [n-3,'Избежать зоны вылета'];
}
function takeJob(tid){
  if(S.user.club>=0)leaveClub('Перешёл в другой клуб');
  const t=S.T[tid];S.user.club=tid;t.mgr=S.user.name;S.vac=S.vac.filter(v=>v.t!==tid);
  const [tg,ob]=objective(t);S.user.target=tg;S.user.obj=ob;S.user.conf=60;S.user.rec={w:0,d:0,l:0};S.user.warned=false;
  t.xi=null;validateXI(t);
  msg('Совет директоров',`Добро пожаловать в ${t.n}`,`Совет директоров рад приветствовать вас на посту главного тренера.\n\nЗадача на сезон в чемпионате (${S.L[t.lg].name}): ${ob.toLowerCase()}.\nТрансферный бюджет: ${money(t.tb)}.\nБюджет зарплат: ${money(t.wb)} в неделю (сейчас: ${money(wageBill(t))}).\n\nМы будем следить за результатами. Удачи.`);
}
function histEntry(note,Lx,posx){
  const t=userTeam();if(!t)return;const L=Lx||S.L[t.lg];const pos=posx||standings(L).findIndex(r=>r.id===t.id)+1;const r=S.user.rec;
  if(r.w+r.d+r.l===0&&!note)return;S.user.hist.unshift({s:season(),club:t.n,tid:t.id,lg:L.name,pos,w:r.w,d:r.d,l:r.l,note:note||''});
}
function leaveClub(note){const t=userTeam();if(!t)return;histEntry(note);t.mgr='—';S.vac.push({t:t.id,until:S.abs+ri(14,28)});S.user.club=-1;S.user.rec={w:0,d:0,l:0};}
function sack(){const t=userTeam();msg('Совет директоров','Контракт расторгнут',`Совет директоров ${t.n} принял решение расторгнуть с вами контракт из-за неудовлетворительных результатов.\n\nВы можете искать новую работу в разделе «Карьера».`);news(`${t.n} уволил главного тренера ${S.user.name}`,{t:[t.id],k:'staff'});S.user.rep=clamp(S.user.rep-3,1,100);leaveClub('Уволен');S.stop=true;}
function boardWeek(){
  const t=userTeam();const L=S.L[t.lg];const st=standings(L);const pos=st.findIndex(r=>r.id===t.id)+1;const played=st[pos-1].p;
  let d=(S.user.last||0)*1.6;S.user.last=0;if(played>=6)d+=(S.user.target-pos)*.2;if(t.bal<0)d-=.5;
  const B=boardOf();if(d<0)d*=B.mult;
  S.user.conf=clamp(S.user.conf+d,B.thr<0?15:0,100);
  if(B.thr<0)return;
  if(S.user.conf<28&&!S.user.warned){S.user.warned=true;msg('Совет директоров','Совет обеспокоен результатами',`Совет директоров недоволен положением команды (${pos}-е место). Задача — ${S.user.obj.toLowerCase()}. Если ситуация не изменится, совет будет вынужден принять меры.`);}
  if(S.user.conf>40)S.user.warned=false;
  if(played>=(B.thr>=20?5:B.thr<=4?12:8)&&S.user.conf<B.thr)sack();
}
function aiSackings(){
  if(S.d<90||S.d>300)return;
  S.L.forEach(L=>{if(L.tier>2)return;const st=standings(L);st.forEach((r,i)=>{const t=S.T[r.id];if(S.user&&t.id===S.user.club)return;if(t.mgr==='—')return;
    if(i+1-t.exp>=5&&rnd()<.02){news(`${t.n} отправил в отставку главного тренера ${t.mgr}`,{t:[t.id],k:'staff',b:`Руководство ${t.n} недовольно результатами: команда занимает ${i+1}-е место. Клуб ищет нового тренера.`});t.mgr='—';S.vac.push({t:t.id,until:S.abs+ri(14,28)});}});});
}
function vacancies(){
  S.vac=S.vac.filter(v=>{const t=S.T[v.t];if(S.user&&S.user.club===v.t)return false;
    if(S.abs>=v.until){t.mgr=genName(t.nat);news(`${t.n} назначил нового главного тренера — ${t.mgr}`,{t:[t.id],k:'staff'});return false;}
    if(S.user&&S.user.club<0&&!v.off&&t.rep<=S.user.rep+12&&rnd()<.3){v.off=true;msg(t.n,`Предложение работы от ${t.n}`,`Руководство клуба ${t.n} (${S.L[t.lg].name}) предлагает вам пост главного тренера.\n\nСтатус клуба: ${clubStatus(t.rep).toLowerCase()}.`,'job',{t:t.id,exp:S.abs+21});}
    return true;});
}
function applications(){
  S.apps=S.apps.filter(a=>{if(S.abs<a.at+7)return true;const t=S.T[a.t];const v=S.vac.find(x=>x.t===a.t);
    if(!v){msg(t.n,'Ответ на заявку',`${t.n} уже назначил другого тренера.`);return false;}
    const ch=clamp(.5+(S.user.rep-t.rep)*.04,.05,.95);
    if(rnd()<ch)msg(t.n,`${t.n} готов вас назначить`,`Руководство ${t.n} рассмотрело вашу заявку и предлагает вам должность главного тренера.`,'job',{t:t.id,exp:S.abs+21});
    else msg(t.n,'Заявка отклонена',`Руководство ${t.n} поблагодарило за интерес, но выбрало другого кандидата.`);
    return false;});
}

/* ----- реализм рынка: соперники, ключевые игроки, конфликты ----- */
const RIVALS=[['Реал Мадрид','Барселона'],['Реал Мадрид','Атлетико'],['Барселона','Эспаньол'],['Севилья','Бетис'],['Манчестер Юнайтед','Ливерпуль'],['Манчестер Юнайтед','Манчестер Сити'],
  ['Ливерпуль','Эвертон'],['Арсенал','Тоттенхэм'],['Челси','Тоттенхэм'],['Арсенал','Челси'],['Интер','Милан'],['Интер','Ювентус'],['Ювентус','Торино'],['Рома','Лацио'],['Наполи','Ювентус'],['Милан','Ювентус'],
  ['Бавария','Боруссия Дортмунд'],['Боруссия Дортмунд','Шальке'],['ПСЖ','Олимпик Марсель'],['Олимпик Лион','Сент-Этьен'],['Аякс','Фейеноорд'],['Аякс','ПСВ'],['Порту','Бенфика'],['Бенфика','Спортинг'],['Порту','Спортинг'],
  ['Селтик','Рейнджерс'],['Фенербахче','Галатасарай'],['Галатасарай','Бешикташ'],['Фенербахче','Бешикташ'],['Спартак','ЦСКА'],['Зенит','Спартак'],['Спартак','Динамо'],['Олимпиакос','Панатинаикос'],
  ['Црвена звезда','Партизан'],['Динамо Загреб','Хайдук'],['Бока Хуниорс','Ривер Плейт'],['Фламенго','Флуминенсе'],['Коринтианс','Палмейрас'],['Аль-Хиляль','Аль-Наср'],['Шахтёр','Динамо Киев']];
let RIV=null;
function isRival(a,b){
  if(!RIV){RIV=new Set();const find=pre=>S.T.filter(t=>t.n.startsWith(pre)&&S.L[t.lg]&&S.L[t.lg].tier===1).sort((x,y)=>y.rep-x.rep)[0];
    RIVALS.forEach(([x,y])=>{const A_=find(x),B_=find(y);if(A_&&B_&&A_!==B_&&A_.nat===B_.nat){RIV.add(A_.id+':'+B_.id);RIV.add(B_.id+':'+A_.id);}});}
  return RIV.has(a+':'+b);
}
let RANKC={};
function squadRank(p,t){ // место игрока в иерархии клуба по уровню (0 — лучший)
  const k=t.id+':'+S.abs;let r=RANKC[k];if(!r){if(Object.keys(RANKC).length>400)RANKC={};r=RANKC[k]=new Map(t.pl.map(id=>S.P[id]).filter(Boolean).sort((a,b)=>ca(b)-ca(a)).map((x,i)=>[x.id,i]));}
  return r.has(p.id)?r.get(p.id):99;
}
const unhappy=p=>p.unh!=null&&p.unh>S.abs;
// продаст ли клуб игрока: ключевых — нет, основу — только в заметно более сильный клуб, сопернику — почти никогда
function aiWillSell(p,sel,buyer){
  const riv=isRival(sel.id,buyer.id);if(unhappy(p))return !riv||rnd()<.1;if(riv)return rnd()<.02;
  if(p.listed)return true;const r=squadRank(p,sel);
  // звёзды изредка уходят в другой топ-клуб из другой страны (не к конкуренту по своей лиге)
  if(r<11&&sel.rep>=78&&buyer.nat!==sel.nat&&buyer.rep>=sel.rep-3)return rnd()<(r<5?.05:.15);
  if(r<5)return (sel.rep<80&&buyer.rep>=sel.rep+15&&rnd()<.3)||rnd()<.004;if(r<11)return buyer.rep>=sel.rep+8&&rnd()<.35;return true;
}
// редкие конфликты с тренером: ключевой игрок хочет уйти, клуб готов его продать
function conflictsWeek(){
  if(!windowOpen(S.d)&&!windowOpen(S.d+21))return; // всплывают ближе к трансферным окнам
  const uc=S.user?S.user.club:-1;
  S.T.forEach(t=>{t.pl.forEach(id=>{const p=S.P[id];if(!p||unhappy(p))return;const r=squadRank(p,t);if(r>=8||p.age>33)return;
    const ch=t.id===uc?(p.mor<25?.03:0):.0004+(p.mor<30?.015:0);if(rnd()>=ch)return;
    p.unh=S.abs+ri(45,120);p.mor=clamp(p.mor-15,10,100);
    if(t.id===uc)msg(p.n,'Игрок хочет уйти',`${p.n} недоволен своим положением в команде и попросил агента искать варианты. Другие клубы узнают об этом и могут прислать предложения.`);
    else if(t.rep>=72)news(`${p.n} в конфликте с тренером ${t.n}`,{t:[t.id],p:p.id,k:'transfer',b:`По данным СМИ, отношения ${p.n} с главным тренером ${t.mgr} испорчены. ${t.n} готов рассмотреть предложения по игроку.`});});});
}

/* ----- трансферы ИИ ----- */
let PIDS=null;
function doTransfer(p,buyer,fee,yrs,wage){
  const sel=p.club>=0?S.T[p.club]:null;
  if(sel){sel.bal+=fee;sel.tb+=Math.round(fee*(S.user&&sel.id===S.user.club?.7:.6));
    if(p.sellon&&fee>0&&S.T[p.sellon.club]){const cut=Math.round(fee*p.sellon.pct/100);sel.bal-=cut;sel.tb=Math.max(0,sel.tb-cut);S.T[p.sellon.club].bal+=cut;}}
  delete p.sellon;delete p.prom;delete p.unh;
  buyer.bal-=fee;buyer.tb=Math.max(0,buyer.tb-fee);sign(p,buyer,yrs||ri(2,5),wage);p.mor=clamp(p.mor+10,10,100);
  if(fee>=5e6||S.user&&(buyer.id===S.user.club||sel&&sel.id===S.user.club))news(`${p.n} переходит в ${buyer.n}${fee?' за '+money(fee):''}`,{p:p.id,t:[buyer.id,sel&&sel.id],k:'transfer',b:`${p.n} (${PR[p.pos]}, ${p.age} лет) ${sel?'покидает '+sel.n:'подписывает контракт как свободный агент'} и становится игроком ${buyer.n}.${fee?` Сумма сделки — ${money(fee)}.`:''}`});
  if(sel&&sel.pl.length<20)refill(sel);
}
function refill(t){
  let guard=0;while(t.pl.length<20&&guard++<30){
    const need=SQUAD.find(pos=>t.pl.filter(id=>S.P[id].pos===pos).length<SQUAD.filter(x=>x===pos).length-1)||pick(SQUAD);
    let fa=null;for(const id in S.P){const p=S.P[id];if(p.club<0&&p.pos===need&&(!fa||ca(p)>ca(fa)))fa=p;}
    if(fa&&ca(fa)>5+t.rep*.12-4)sign(fa,t,ri(1,3));else youth(t,1);
  }
}
function aiTransfers(n){
  if(!PIDS||rnd()<.05)PIDS=Object.keys(S.P);const uc=S.user?S.user.club:-1;
  for(let k=0;k<n;k++){
    const b=pick(S.T);if(b.id===uc||b.pl.length>=28)continue;
    const slots=slotsOf(b);const xi=bestXI(b,slots);let worst=0,wv=99;
    xi.forEach((id,i)=>{const v=id==null?0:slotVal(S.P[id],slots[i]);if(v<wv){wv=v;worst=i;}});
    const pos=slots[worst];const tgt=wv+.7;let best=null,bs=-1;
    for(let j=0;j<400;j++){const p=S.P[PIDS[Math.floor(rnd()*PIDS.length)]];if(!p||p.club===b.id||p.age>31)continue;
      if(p.pos!==pos&&!p.alt.includes(pos))continue;const c=ca(p);if(c<tgt||c>tgt+3)continue;
      const sel=p.club>=0?S.T[p.club]:null;if(sel&&((sel.rep>b.rep+6&&!(unhappy(p)&&b.rep>=sel.rep-15)&&!(squadRank(p,sel)>=14&&b.rep>=sel.rep-25))||sel.pl.length<=19))continue;
      if(sel&&!aiWillSell(p,sel,b))continue;
      const fee=sel?value(p)*1.15:0;if(fee>b.tb)continue;const sc=c-fee/1e8;if(sc>bs){best=p;bs=sc;}}
    if(!best)continue;
    if(best.club===uc&&uc>=0){makeBid(b,best);continue;}
    doTransfer(best,b,best.club>=0?Math.round(value(best)*(1+rnd()*.35)/1e5)*1e5:0);
  }
}
function makeBid(b,p,fee){
  if(S.inbox.some(m=>m.type==='bid'&&!m.done&&m.data.p===p.id))return;
  fee=fee||Math.round(value(p)*(.85+rnd()*.5)/1e5)*1e5;
  msg(b.n,`Предложение по игроку: ${p.n}`,`${b.n} предлагает ${money(fee)} за ${p.n} (${PR[p.pos]}, ${p.age} лет).\n\nОценочная стоимость игрока: ${money(value(p))}.\nПредложение действительно до закрытия трансферного окна.`,'bid',{b:b.id,p:p.id,fee});
}
function bidsForUser(){
  const t=userTeam();if(!t)return;
  t.pl.map(id=>S.P[id]).forEach(p=>{if(rnd()<(p.listed||unhappy(p)?.35:.015)){const c=ca(p);const buyers=S.T.filter(b=>b.id!==t.id&&Math.abs((4.3+b.rep*.11)-c)<1.6&&b.tb>value(p));if(buyers.length)makeBid(pick(buyers),p,p.listed?Math.round(value(p)*(.7+rnd()*.4)/1e5)*1e5:0);}});
}

/* ----- конец сезона ----- */
function seasonEnd(){
  const label=season();const ut=userTeam();const nextQ={};let upos=0,uLeague=null;
  S.champ={};S.runner={};const sumLines=[];
  S.L.forEach(L=>{
    const st=standings(L);const key=L.key+(L.ng>1?':'+L.grp:'');
    const sc=Object.entries(L.sc||{}).sort((a,b)=>b[1]-a[1])[0];
    (S.hist['L:'+key]=S.hist['L:'+key]||[]).unshift({s:label,w:st[0].id,ru:st[1]&&st[1].id,sc:sc&&S.P[sc[0]]?[S.P[sc[0]].n,sc[1]]:null});
    const champ=S.T[st[0].id];champ.tr.push({id:'L:'+key,s:label,name:L.name});
    if(L.tier===1&&L.grp===0){S.champ[L.nat]=st[0].id;S.runner[L.nat]=st[1]&&st[1].id;nextQ[L.nat]=st.map(r=>r.id);sumLines.push(`${L.name}: ${champ.n}`);}
    st.forEach((r,i)=>{const t=S.T[r.id];t.bal+=Math.round(L.rep*L.rep*110*(L.teams.length-i)*(i===0?1.6:1)/(L.tier));t.rep=clamp(t.rep+(t.exp-(i+1))*.25+(i===0?1:0),20,99);if(ut&&t.id===ut.id){upos=i+1;uLeague=L;}});
    if(ut&&champ.id===ut.id)S.user.troph.unshift({id:'L:'+key,name:L.name,s:label,club:ut.n,tid:ut.id});
  });
  S.cupw=S.cupwNext||{};S.cupwNext={};S.prev=S.next||{};S.next={};
  // переходы между дивизионами
  const moves=[];
  countries().forEach(nat=>{
    const tiers=[...new Set(S.L.filter(L=>L.nat===nat).map(L=>L.tier))].sort((a,b)=>a-b);
    for(let k=0;k+1<tiers.length;k++){
      const up=S.L.filter(L=>L.nat===nat&&L.tier===tiers[k]),lo=S.L.filter(L=>L.nat===nat&&L.tier===tiers[k+1]);
      const n=(UPDOWN[nat]||[])[k]||3;const per=Math.ceil(n/lo.length);
      let prom=[];lo.forEach(L=>standings(L).slice(0,per).forEach((r,i)=>prom.push({id:r.id,i,pts:r.pts,L})));prom.sort((a,b)=>a.i-b.i||b.pts-a.pts);prom=prom.slice(0,n);
      const rel=[];up.forEach(L=>standings(L).slice(-Math.ceil(n/up.length)).forEach(r=>rel.push({id:r.id,L})));
      const cnt=Math.min(prom.length,rel.length);
      for(let j=0;j<cnt;j++)moves.push({t:prom[j].id,from:prom[j].L,to:up[0],dir:1},{t:rel[rel.length-1-j].id,from:rel[rel.length-1-j].L,to:prom[j].L,dir:-1});
    }
  });
  moves.forEach(m=>{m.from.teams=m.from.teams.filter(x=>x!==m.t);m.to.teams.push(m.t);S.T[m.t].lg=m.to.i;S.T[m.t].rep=clamp(S.T[m.t].rep+(m.dir>0?3:-3),20,99);
    if(ut&&m.t===ut.id)msg('Совет директоров',m.dir>0?'Повышение в классе!':'Вылет',m.dir>0?`${ut.n} выходит в ${m.to.name}. Поздравляем!`:`${ut.n} покидает ${m.from.name} и в следующем сезоне сыграет в ${m.to.name}.`);});
  if(moves.length)news(`Итоги сезона ${label}: кто поднялся в классе`,{t:moves.filter(m=>m.dir>0).map(m=>m.t).slice(0,2),k:'season',b:`Повышение получили: ${moves.filter(m=>m.dir>0).map(m=>S.T[m.t].n).join(', ')}.\nВылетели: ${moves.filter(m=>m.dir<0).map(m=>S.T[m.t].n).join(', ')}.`});
  // оценка тренера
  if(ut&&uLeague){
    const promoted=moves.some(m=>m.t===ut.id&&m.dir>0),relegated=moves.some(m=>m.t===ut.id&&m.dir<0);
    const champ=upos===1;const delta=(S.user.target-upos)*1.2+(champ?6:0)+(uLeague.rep-60)*.03+1+(promoted?4:0)-(relegated?5:0);S.user.rep=clamp(S.user.rep+delta,1,100);
    histEntry(champ?'Чемпион':promoted?'Повышение':relegated?'Вылет':'',uLeague,upos);S.user.rec={w:0,d:0,l:0};
    let verdict;const ok=upos<=S.user.target||promoted;
    if(ok){verdict=`Совет директоров доволен: задача «${S.user.obj.toLowerCase()}» выполнена (${upos}-е место).`;S.user.conf=clamp(S.user.conf+15,50,100);}
    else if(upos<=S.user.target+3){verdict=`Задача выполнена не полностью (${upos}-е место при цели — ${S.user.target}). Совет ждёт прогресса.`;S.user.conf=clamp(S.user.conf-5,30,80);}
    else{verdict=`Сезон провален: ${upos}-е место при цели — ${S.user.target}.`;S.user.conf-=25;}
    msg('Совет директоров',`Итоги сезона ${label}`,`${verdict}\n\nРепутация тренера: ${repLabel(S.user.rep).toLowerCase()}.\n\nЧемпионы сезона:\n${sumLines.join('\n')}`);
    const BE=boardOf().end;
    if(BE&&!ok&&upos>S.user.target+BE[0]&&S.user.conf<BE[1]){S.user.hist[0].note='Уволен';msg('Совет директоров','Контракт расторгнут',`По итогам сезона совет директоров ${ut.n} решил сменить главного тренера.`);ut.mgr='—';S.vac.push({t:ut.id,until:S.abs+21});S.user.club=-1;S.user.rep=clamp(S.user.rep-3,1,100);}
    else if(ok&&upos<S.user.target-1){const cand=S.T.filter(x=>x.id!==ut.id&&x.rep>ut.rep+2&&x.rep<=S.user.rep+12);if(cand.length){const o=pick(cand);msg(o.n,`${o.n} интересуется вами`,`Руководство ${o.n} (${S.L[o.lg].name}) впечатлено вашей работой и предлагает пост главного тренера. Нынешний тренер ${o.mgr} будет отправлен в отставку, если вы согласитесь.`,'job',{t:o.id,exp:S.abs+30,force:true});}}
  }else msg('Новости',`Итоги сезона ${label}`,`Чемпионы сезона:\n${sumLines.join('\n')}`);
  S.q=qualify(nextQ,S.cupw);
  // игроки
  const leaving=[];const uT=userTeam();
  for(const id of Object.keys(S.P)){
    const p=S.P[id];const t=p.club>=0?S.T[p.club]:null;
    if(p.age>=34&&rnd()<.25+(p.age-34)*.22||(!t&&p.age>=31&&rnd()<.35)||p.age>=39){if(t){t.pl=t.pl.filter(x=>x!==p.id);if(t.xi)t.xi=t.xi.map(x=>x===p.id?null:x);if(uT&&t.id===uT.id)leaving.push(`${p.n} — завершает карьеру`);}delete S.P[id];continue;}
    if(t&&p.ce<=S.year+1){
      if(uT&&t.id===uT.id){leaving.push(`${p.n} — контракт истёк`);sign(p,null);}
      else{const avg=4.3+t.rep*.11;if(p.age<=32&&ca(p)>=avg-1.6&&rnd()<.8){p.ce=S.year+1+ri(1,3);p.wage=wageFor(p,t.rep);}else sign(p,null);}
    }
    p.st=newStats();p.age++;p.form=[];p.sus=0;
    if(p.age>23&&p.pa>ca(p)+.5&&rnd()<.4)p.pa=Math.max(ca(p),p.pa-.5);
  }
  const fa=Object.values(S.P).filter(p=>p.club<0).sort((a,b)=>ca(b)-ca(a));fa.slice(900).forEach(p=>delete S.P[p.id]);
  S.T.forEach(t=>{t.pl=t.pl.filter(id=>S.P[id]);const y=youth(t,ri(2,4));
    if(uT&&t.id===uT.id)msg('Молодёжная академия','Новый набор в академию',`В основную команду переведены воспитанники академии:\n${y.map(p=>`• ${p.n} (${PR[p.pos]}, ${p.age} лет)`).join('\n')}`);
    if(t.pl.length<20)refill(t);
    if(t.pl.length>32&&!(uT&&t.id===uT.id))t.pl.map(id=>S.P[id]).sort((a,b)=>ca(a)-ca(b)).slice(0,t.pl.length-30).forEach(p=>sign(p,null));
    if(t.debt){t.bal-=t.debt;t.debt=0;}
    const bill=wageBill(t);t.tb=Math.max(0,Math.round(t.bal*.3));t.inc=Math.round(bill*1.04+t.rep*t.rep*60);t.wb=Math.round(bill*1.12);
    if(rnd()<.04&&!(uT&&t.id===uT.id)&&t.mgr!=='—'){t.mgr='—';S.vac.push({t:t.id,until:S.abs+ri(14,35)});}
  });
  if(leaving.length&&uT)msg('Помощник тренера','Игроки покинули клуб',leaving.join('\n'));
  PIDS=null;
  S.year++;S.d=0;startSeason(false);setExpectations();
  const nt=userTeam();if(nt){const [tg,ob]=objective(nt);S.user.target=tg;S.user.obj=ob;S.user.conf=Math.max(50,S.user.conf);nt.xi=null;validateXI(nt);
    const cups=Object.values(S.C).filter(c=>c.teams.includes(nt.id)).map(c=>c.name);
    msg('Совет директоров',`Задачи на сезон ${season()}`,`Чемпионат (${S.L[nt.lg].name}): ${ob.toLowerCase()}.\nТрансферный бюджет: ${money(nt.tb)}.\nБюджет зарплат: ${money(nt.wb)} в неделю.${cups.length?`\n\nТурниры сезона: ${cups.join(', ')}.`:''}`);}
  msg('Трансферный отдел','Открылось летнее трансферное окно','Летнее трансферное окно открыто до 1 сентября.');
  S.stop=true;
}
