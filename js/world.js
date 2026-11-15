'use strict';
/* ===== KICK: мир, календарь, турниры, сезоны ===== */
let S=null;

/* ----- правила стран ----- */
const CUPS={ENG:[['fa_cup',[1,2,3,4]],['efl_cup',[1,2,3,4]],['efl_trophy',[3,4]]],ESP:[['esp_cup',[1,2,3]]],ITA:[['ita_cup',[1,2]],['ita_c_cup',[3]]],GER:[['ger_cup',[1,2,3]]],FRA:[['fra_cup',[1,2,3]]],
 RUS:[['rus_cup',[1,2,3]]],NED:[['ned_cup',[1,2]]],POR:[['por_cup',[1,2]],['por_lc',[1,2]]],TUR:[['tur_cup',[1,2]]],KSA:[['ksa_cup',[1,2]]],BRA:[['bra_cup',[1,2]]],ARG:[['arg_cup',[1]]],
 BEL:[['bel_cup',[1]]],SCO:[['sco_cup',[1]],['sco_lc',[1]]],AUT:[['aut_cup',[1]]],SUI:[['sui_cup',[1]]],GRE:[['gre_cup',[1]]],UKR:[['ukr_cup',[1]]],CZE:[['cze_cup',[1]]],DEN:[['den_cup',[1]]],
 CRO:[['cro_cup',[1]]],SRB:[['srb_cup',[1]]],POL:[['pol_cup',[1]]],JPN:[['jpn_cup',[1]]],KOR:[['kor_cup',[1]]],QAT:[['qat_cup',[1]]],UAE:[['uae_cup',[1]]],CHN:[['chn_cup',[1]]],AUS:[['aus_cup',[1]]],
 COL:[['col_cup',[1]]],CHI:[['chi_cup',[1]]],ECU:[['ecu_cup',[1]]],PAR:[['par_cup',[1]]],URU:[['uru_cup',[1]]],MEX:[['mex_cup',[1]]],USA:[['usa_cup',[1]]],EGY:[['egy_cup',[1]]],MAR:[['mar_cup',[1]]],TUN:[['tun_cup',[1]]],RSA:[['rsa_cup',[1]]]};
const SUPER={ENG:'eng_sc',ESP:'esp_sc',ITA:'ita_sc',GER:'ger_sc',FRA:'fra_sc',RUS:'rus_sc',NED:'ned_sc',POR:'por_sc',TUR:'tur_sc',KSA:'ksa_sc',BRA:'bra_sc'};
const UPDOWN={ENG:[3,3,3],ESP:[3,4],ITA:[3,3],GER:[3,3],FRA:[3,3],RUS:[2,2],NED:[2],POR:[2],TUR:[3],KSA:[3],BRA:[4]};
const UEFA_SLOTS={ENG:[5,2,1],ESP:[4,2,1],ITA:[4,2,1],GER:[4,2,1],FRA:[3,2,1],POR:[2,1,1],NED:[2,1,1],BEL:[1,1,1],TUR:[1,1,1],SCO:[1,1,1],AUT:[1,1,1],SUI:[1,1,1],GRE:[1,1,1],UKR:[1,1,1],CZE:[1,1,1],DEN:[1,1,1],CRO:[1,1,1],SRB:[1,1,1],POL:[1,1,1],RUS:[2,1,1]};
const CONT_SLOTS={
 acl:{KSA:5,QAT:4,UAE:3,JPN:4,KOR:3,CHN:3,AUS:2}, acl2:{KSA:3,QAT:2,UAE:2,JPN:2,KOR:3,CHN:2,AUS:2},
 lib:{BRA:7,ARG:6,URU:4,COL:4,CHI:4,ECU:4,PAR:3}, sud:{BRA:6,ARG:6,URU:4,COL:4,CHI:4,ECU:4,PAR:4},
 ccc:{MEX:8,USA:8}, cafcl:{EGY:4,MAR:4,TUN:4,RSA:4}, cafcc:{EGY:4,MAR:4,TUN:4,RSA:4}};
const ACL_WEST=new Set(['KSA','QAT','UAE','IRN','IRQ','JOR','UZB']);
const CONF_OF={}; // страна -> конфедерация (из world.nations)
const NT_TOP=new Set('FRA ESP ENG ARG BRA POR GER NED BEL ITA CRO URU COL'.split(' '));
const NT_MID=new Set('MAR SUI DEN USA MEX JPN SEN KOR AUT TUR UKR SRB POL ECU NOR SWE IRN AUS NGA EGY CIV ALG SCO CZE HUN PAR CHI RUS GRE WAL TUN CMR'.split(' '));
const PRIZE={ucl:[18e6,2.1e6,20e6],uel:[4.3e6,.45e6,6e6],uecl:[3.2e6,.4e6,4e6],usc:[3e6,0,1e6],acl:[1e6,.2e6,10e6],acl2:[.3e6,.1e6,2e6],lib:[1.5e6,.4e6,20e6],sud:[.9e6,.2e6,8e6],
 ccc:[.5e6,.2e6,5e6],cafcl:[.6e6,.1e6,4e6],cafcc:[.3e6,.05e6,2e6],icc:[2e6,1e6,5e6],cwc:[20e6,2e6,40e6],rec:[.5e6,0,1e6]};

const W=window.BROVKA_WORLD||null;
const COMP_INFO={};(W?W.comps:[]).forEach(c=>COMP_INFO[c.id]=c);
const compName=id=>(COMP_INFO[id]&&COMP_INFO[id].name)||id;
const compLogo=id=>COMP_INFO[id]&&COMP_INFO[id].logo;
if(W)W.nations.forEach(n=>{CONF_OF[n.code]=n.conf;if(!NATS[n.code])NATS[n.code]=n.name;});

/* ----- даты ----- */
const dateOf=d=>new Date(S.year,6,1+d);
const fmtDate=d=>dateOf(d).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
const fmtShort=d=>dateOf(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
const season=()=>S.year+'/'+String((S.year+1)%100).padStart(2,'0');
function dayOf(m,dd){const y=m>=6?S.year:S.year+1;return Math.round((new Date(y,m,dd)-new Date(S.year,6,1))/864e5);}
function nearDow(d,dow){const w=dateOf(d).getDay();let diff=(dow-w+7)%7;if(diff>3)diff-=7;return d+diff;}
const windowOpen=d=>(d>=0&&d<=62)||(d>=dayOf(0,1)&&d<=dayOf(1,2));
function buildCalendar(){
  const C={};
  C.nt=[[8,4],[8,7],[9,9],[9,12],[10,13],[10,16],[2,19],[2,22]].map(([m,dd])=>dayOf(m,dd));
  const ntWeeks=new Set();C.nt.forEach(d=>{for(let k=-3;k<=3;k++)ntWeeks.add(d+k);});
  C.cont=[[8,16],[8,30],[9,21],[10,4],[10,25],[11,9],[0,20],[0,27]].map(([m,dd])=>nearDow(dayOf(m,dd),3));
  C.contKO=[[1,17],[1,24],[2,10],[2,17],[3,7],[3,14],[3,28],[4,5]].map(([m,dd])=>nearDow(dayOf(m,dd),3));
  C.finals={ucl:nearDow(dayOf(4,29),6),uel:nearDow(dayOf(4,19),3),uecl:nearDow(dayOf(4,26),3),other:nearDow(dayOf(4,23),6)};
  const busyWed=new Set([...C.cont,...C.contKO,C.finals.uel,C.finals.uecl]);
  C.usc=nearDow(dayOf(7,12),3);C.sc=nearDow(dayOf(7,1),6);C.rec=nearDow(dayOf(1,11),3);
  C.icc=[nearDow(dayOf(11,2),3),nearDow(dayOf(11,13),6),nearDow(dayOf(11,17),3)];
  [...C.icc,C.usc,C.rec].forEach(d=>busyWed.add(d));
  const start=nearDow(dayOf(7,8),6),end=nearDow(dayOf(4,16),6);
  C.sat=[];for(let d=start;d<=end;d+=7)if(!ntWeeks.has(d))C.sat.push(d);
  C.tue=[];for(let d=start+3;d<=end;d+=7){if(ntWeeks.has(d)||busyWed.has(d+1))continue;C.tue.push(d);}
  C.cupWed=[];for(let d=nearDow(dayOf(7,26),3);d<=dayOf(3,22);d+=7){if(ntWeeks.has(d)||busyWed.has(d))continue;C.cupWed.push(d);}
  C.summer=[dayOf(5,5),dayOf(5,9),dayOf(5,13),dayOf(5,17),dayOf(5,20),dayOf(5,23),dayOf(5,26),dayOf(5,29)];
  C.asian=[dayOf(0,10),dayOf(0,14),dayOf(0,18),dayOf(0,22),dayOf(0,26),dayOf(0,30),dayOf(1,3)];
  C.nlf=[dayOf(5,4),dayOf(5,8)];
  return C;
}
function spread(pool,n){if(n<=0)return [];if(n>=pool.length)return pool.slice(0,n);const out=[];for(let i=0;i<n;i++)out.push(pool[Math.round(i*(pool.length-1)/Math.max(1,n-1))]);return out;}

/* ----- построение мира ----- */
function teamColors(name){const h=hash(name);const pal=['#c8102e','#0057b8','#111111','#ffffff','#00843d','#fdb913','#6cabdd','#7a263a','#f37021','#6b2c8f','#e30613','#003da5'];const a=pal[h%pal.length],b=pal[(h>>>5)%pal.length];return [a,b===a?(a==='#ffffff'?'#111111':'#ffffff'):b];}
function shortName(n){const w=n.replace(/[«»"']/g,'').split(/[\s-]+/).filter(Boolean);if(w.length>=2)return (w[0][0]+w[1][0]+(w[2]?w[2][0]:w[1][1]||'')).toUpperCase();return n.slice(0,3).toUpperCase();}
function newTeam(c,divIdx,nat,rep){
  const [c1,c2]=teamColors(c.name);
  return {id:S.T.length,n:c.name,s:shortName(c.name),c1,c2,rep,lg:divIdx,nat,pl:[],tac:{f:pick(FKEYS),m:2,pr:1,te:1,wi:1},mgr:genName(nat),crest:c.crest||null,xi:null,exp:0,tr:[]};
}
function buildSquad(t){
  const base=4.3+t.rep*.11;const seen={};const L=S.L[t.lg];const tier=L?L.tier:1;
  for(const pos of SQUAD){
    seen[pos]=(seen[pos]||0)+1;const k=seen[pos];
    const age=clamp(Math.round(25+gauss()*4),17,35);
    let lv=base+gauss()*1.1+(k===1?.6:k===2?-.2:-1.6);if(age<22)lv-=(22-age)*.35;
    const nat=rnd()<(tier>1?.88:.62)?t.nat:pick(FOREIGN);
    const p=genPlayer(lv,pos,age,nat);S.P[p.id]=p;sign(p,t,ri(1,5));
  }
}
const GRP={GK:['GK'],DF:['DC','DL','DR','DC'],MF:['MC','DM','AMC','MC'],FW:['ST','AML','AMR','ST']};
// «известность» игрока с поправкой на возраст (у ветеранов статей больше, чем текущего уровня)
const fameOf=x=>Math.log(1+(+x.fame||0))-(x.born?.06*Math.max(0,S.year-x.born-26)+.03*Math.min(0,S.year-x.born-26):0);
let GFAME=null;
function globalFame(){const v=[];W.clubs.forEach(c=>(c.players||[]).forEach(x=>{if(x&&x.name)v.push(fameOf(x));}));const m=v.reduce((a,b)=>a+b,0)/v.length;const sd=Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/v.length)||1;return {m,sd};}
// уровень по месту в иерархии клуба: лидеры, основа, ротация, запас; вратари отдельно
function rankOffset(r,gk){if(gk)return r===0?.7:r===1?-1.4:-2.6;if(r<3)return 1.3-r*.15;if(r<11)return .95-(r-3)*.09;if(r<17)return -.1-(r-11)*.14;return -1.1-Math.min(1.5,(r-17)*.2);}
function realSquad(t,list){
  const base=4.3+t.rep*.11;if(!GFAME)GFAME=globalFame();
  const pos=list.map(x=>POSL.includes(x.pos)?x.pos:pick(GRP[x.grp]||['MC','DC','ST']));
  const fm=list.map(fameOf);const rank=new Array(list.length);
  for(const gk of [true,false]){list.map((x,k)=>k).filter(k=>(pos[k]==='GK')===gk).sort((a,b)=>fm[b]-fm[a]).forEach((k,r)=>rank[k]=r);}
  list.forEach((x,k)=>{
    const ps=pos[k];const age=x.born?clamp(S.year-x.born,15,42):clamp(Math.round(25+gauss()*4),17,35);
    const gz=(fm[k]-GFAME.m)/GFAME.sd;const star=clamp(gz-1.2,0,1.8)*.6; // мировые звёзды сверх уровня клуба
    const z=clamp(gz,-2,2.5);
    let lv=base+rankOffset(rank[k],ps==='GK')+star+gauss()*.4;if(age<21)lv-=(21-age)*.35;if(age>33)lv-=(age-33)*.35;
    const nat=x.nat&&String(x.nat).length===3?String(x.nat):t.nat;
    const hh=x.h&&+x.h>150&&+x.h<215?+x.h:0;const p=genPlayer(lv,ps,age,nat,hh);p.n=cleanName(x.name,nat);if(x.photo)p.photo=x.photo;
    if(Array.isArray(x.alt))p.alt=x.alt.filter(a=>POSL.includes(a)&&a!==ps).slice(0,2);
    const c=ca(p);p.pa=age<=23?Math.min(20,c+(24-age)*.45+Math.max(0,z)*1.2+Math.abs(gauss())*.6):c;
    S.P[p.id]=p;sign(p,t,ri(1,4));
  });
  while(t.pl.filter(id=>S.P[id].pos==='GK').length<2){const p=genPlayer(base-1.5,'GK',ri(19,33),t.nat);S.P[p.id]=p;sign(p,t,ri(1,3));}
  if(t.pl.length<20)youth(t,20-t.pl.length);
}
function newWorld(opts){
  S={v:2,year:2026,d:0,abs:0,nid:1,mid:1,T:[],P:{},L:[],C:{},F:[],N:{},inbox:[],vac:[],apps:[],short:[],news:[],hist:{},user:null,opts:opts||{},q:null,champ:{},cupw:{},sc:{}};
  const byKey={};const nameCnt={};W.leagues.forEach(lg=>nameCnt[lg.name]=(nameCnt[lg.name]||0)+1);
  W.leagues.forEach(lg=>{if(nameCnt[lg.name]>1&&!lg.name.includes('('))lg.name=lg.name+' ('+natName(lg.nat)+')';});
  W.leagues.forEach(lg=>{
    const ng=lg.groups||1;byKey[lg.id]=[];
    for(let g=0;g<ng;g++){
      const gname=ng>1?(lg.gnames&&lg.gnames[g]?groupRu(lg.gnames[g],g):'группа '+(g+1)):'';
      const L={i:S.L.length,key:lg.id,nat:lg.nat,tier:lg.tier,name:lg.name+(gname?', '+gname:''),short:lg.name,rep:lg.rep,teams:[],grp:g,ng};
      S.L.push(L);byKey[lg.id].push(L);
    }
  });
  const clubsByKey={};W.clubs.forEach(c=>{(clubsByKey[c.lg]=clubsByKey[c.lg]||[]).push(c);});
  const REPS=clubReps();
  W.leagues.forEach(lg=>{
    const cl=clubsByKey[lg.id]||[];if(!cl.length)return;
    cl.forEach(c=>{
      const rep=REPS.get(c);
      const L=byKey[lg.id][Math.min(c.grp||0,byKey[lg.id].length-1)];
      const t=newTeam(c,L.i,lg.nat,rep);S.T.push(t);L.teams.push(t.id);
      const list=(c.players||[]).filter(x=>x&&x.name);
      if(list.length>=14)realSquad(t,list);else buildSquad(t);
    });
  });
  S.L=S.L.filter(L=>L.teams.length>=4);S.L.forEach((L,i)=>{L.i=i;L.teams.forEach(id=>S.T[id].lg=i);});
  W.nations.forEach(n=>{S.N[n.code]={code:n.code,name:n.name,crest:n.crest||null,conf:n.conf,base:NT_TOP.has(n.code)?16:NT_MID.has(n.code)?13.5:11};});
  for(let i=0;i<300;i++){const p=genPlayer(8+rnd()*6,pick(SQUAD),ri(20,34),pick(FOREIGN));p.wage=wageFor(p,50);S.P[p.id]=p;}
  S.T.forEach(t=>{const bill=wageBill(t);t.bal=Math.round(Math.pow(t.rep,3)*300);t.tb=Math.round(t.bal*.3);t.inc=Math.round(bill*1.04+t.rep*t.rep*60);t.wb=Math.round(bill*1.12);});
  setExpectations();
  S.q=initialQualification();
  startSeason(true);
}
function clubReps(){
  const m=new Map();const by={};W.clubs.forEach(c=>{(by[c.lg]=by[c.lg]||[]).push(c);});
  W.leagues.forEach(lg=>{const cl=by[lg.id]||[];const fames=cl.map(c=>c.fame||0).sort((a,b)=>a-b);const span=lg.tier===1?34:22;
    cl.forEach(c=>{const pct=fames.indexOf(c.fame||0)/Math.max(1,fames.length-1);m.set(c,Math.round(clamp(lg.rep*.62+span*Math.pow(pct,1.3),20,97)));});});
  return m;
}
function groupRu(g,i){g=String(g);const m=g.match(/Group\s+([A-Z0-9]+)/i);if(m)return 'группа '+m[1];return g.replace(/^Группа/,'группа');}
const wageBill=t=>t.pl.reduce((s,id)=>s+(S.P[id]?S.P[id].wage:0),0);
function sign(p,t,yrs,wage){
  if(p.club>=0){const o=S.T[p.club];o.pl=o.pl.filter(x=>x!==p.id);if(o.xi)o.xi=o.xi.map(x=>x===p.id?null:x);}
  p.club=t?t.id:-1;if(t){t.pl.push(p.id);p.ce=S.year+yrs;p.wage=wage||wageFor(p,t.rep);}p.listed=false;
}
function youth(t,n){
  const base=4.3+t.rep*.11;const out=[];
  for(let i=0;i<n;i++){
    const pos=pick(SQUAD);const age=ri(15,17);
    const p=genPlayer(base-4.8+gauss()*1.2,pos,age,rnd()<.85?t.nat:pick(FOREIGN));
    p.pa=clamp(base-1+gauss()*2.2+(rnd()<.04?3:0),ca(p)+1,20);
    S.P[p.id]=p;sign(p,t,3,Math.max(400,Math.round(wageFor(p,t.rep)*.6)));out.push(p);
  }
  return out;
}
function teamPower(t){const sl=slotsOf(t);const xi=bestXI(t,sl);let s=0;xi.forEach((id,i)=>{if(S.P[id])s+=eff(S.P[id],sl[i])*fam(S.P[id],sl[i]);});return s/11;}
function setExpectations(){S.L.forEach(L=>{L.teams.map(id=>[id,teamPower(S.T[id])]).sort((a,b)=>b[1]-a[1]).forEach(([id],i)=>S.T[id].exp=i+1);});}
const topDiv=nat=>S.L.filter(L=>L.nat===nat&&L.tier===1);
const countries=()=>[...new Set(S.L.map(L=>L.nat))];

/* ----- фикстуры ----- */
function addFx(o){const f={i:S.F.length,d:o.d,c:o.c,h:o.h,a:o.a,hg:null,ag:null,x:0,pen:null,k:o.k==null?-1:o.k,leg:o.leg||0,dec:!!o.dec,neu:!!o.neu,nt:!!o.nt,g:o.g==null?-1:o.g,r:o.r||''};S.F.push(f);(BYDAY[f.d]=BYDAY[f.d]||[]).push(f.i);return f;}
let BYDAY={};
function rebuildDays(){BYDAY={};S.F.forEach(f=>(BYDAY[f.d]=BYDAY[f.d]||[]).push(f.i));}
function rrRounds(ids,double){
  const arr=shuffle(ids.slice());if(arr.length%2)arr.push(null);const n=arr.length;const rounds=[];
  for(let r=0;r<n-1;r++){const rd=[];for(let i=0;i<n/2;i++){const a=arr[i],b=arr[n-1-i];if(a==null||b==null)continue;const flip=i===0?r%2===1:i%2===1;rd.push(flip?[b,a]:[a,b]);}rounds.push(rd);arr.splice(1,0,arr.pop());}
  return double?[...rounds,...rounds.map(rd=>rd.map(([a,b])=>[b,a]))]:rounds;
}
function makeLeagueFixtures(L){
  const double=L.teams.length<=24;const rounds=rrRounds(L.teams,double);
  const R=rounds.length;const C=S.cal;
  let dates=R<=C.sat.length?spread(C.sat,R):[...C.sat,...spread(C.tue,R-C.sat.length)].sort((a,b)=>a-b);
  L.rounds=R;L.tbl={};L.sc={};L.teams.forEach(id=>L.tbl[id]={p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,fm:''});
  rounds.forEach((rd,r)=>rd.forEach(([h,a])=>addFx({d:dates[r],c:'L'+L.i,h,a,r:(r+1)+'-й тур'})));
}
function standings(L){return L.teams.map(id=>({id,...L.tbl[id]})).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf);}

/* ----- турниры: общее ----- */
function newComp(key,id,kind,o){const c={k:key,id,kind,name:compName(id),stages:[],st:0,done:false,w:null,ru:null,sc:{},teams:[],...o};S.C[key]=c;return c;}
const roundName=n=>n===2?'Финал':n===4?'1/2 финала':n===8?'1/4 финала':n===16?'1/8 финала':n===32?'1/16 финала':n===64?'1/32 финала':n===128?'1/64 финала':'Раунд';
function koStage(c,pairs,legs,dates,name,neutral){
  const st={t:'ko',name,ties:[],legs};
  pairs.forEach(([a,b],k)=>{
    const tie={a,b,f:[],w:null};
    if(legs===2){tie.f.push(addFx({d:dates[0],c:c.k,h:a,a:b,k,leg:1,r:name,nt:c.nt}).i);tie.f.push(addFx({d:dates[1],c:c.k,h:b,a,k,leg:2,dec:true,r:name,nt:c.nt}).i);}
    else tie.f.push(addFx({d:dates[0],c:c.k,h:a,a:b,k,dec:true,neu:!!neutral,r:name,nt:c.nt}).i);
    st.ties.push(tie);
  });
  c.stages.push(st);c.st=c.stages.length-1;return st;
}
function tieWinner(t){
  const f=t.f.map(i=>S.F[i]);if(f.some(x=>x.hg==null))return null;
  const last=f[f.length-1];
  if(last.pen)return last.pen[0]>last.pen[1]?last.h:last.a;
  let ga=0,gb=0;f.forEach(x=>{if(x.h===t.a){ga+=x.hg;gb+=x.ag;}else{ga+=x.ag;gb+=x.hg;}});
  return ga>=gb?t.a:t.b;
}
function aggregate(f){ // для решающего матча: счёт по сумме до этого матча (с точки зрения хозяев f)
  if(f.k<0||f.leg!==2)return [0,0];const c=S.C[f.c];const st=c.stages.find(s=>s.t==='ko'&&s.ties[f.k]&&s.ties[f.k].f.includes(f.i));if(!st)return [0,0];
  const first=S.F[st.ties[f.k].f[0]];return [first.ag,first.hg];
}
function groupTable(c,st,g){
  const tb={};st.groups[g].forEach(id=>tb[id]={id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
  st.fx.forEach(i=>{const f=S.F[i];if(f.g!==g||f.hg==null)return;const h=tb[f.h],a=tb[f.a];if(!h||!a)return;h.p++;a.p++;h.gf+=f.hg;h.ga+=f.ag;a.gf+=f.ag;a.ga+=f.hg;if(f.hg>f.ag){h.w++;a.l++;h.pts+=3;}else if(f.hg<f.ag){a.w++;h.l++;a.pts+=3;}else{h.d++;a.d++;h.pts++;a.pts++;}});
  return Object.values(tb).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf||rnd()-.5);
}
const repOf=(c,x)=>c.nt?ntPower(x):S.T[x].rep;
function potsGroups(c,teams,G){
  const sorted=teams.slice().sort((a,b)=>repOf(c,b)-repOf(c,a));const per=teams.length/G;const groups=Array.from({length:G},()=>[]);
  for(let p=0;p<per;p++){const pot=shuffle(sorted.slice(p*G,(p+1)*G));
    pot.forEach(t=>{const cand=groups.map((g,i)=>i).filter(i=>groups[i].length===p);const nat=c.nt?null:S.T[t].nat;
      const ok=cand.filter(i=>!nat||!groups[i].some(x=>S.T[x].nat===nat));groups[(ok.length?pick(ok):pick(cand))].push(t);});}
  return groups;
}
function groupStage(c,teams,G,double,dates,name){
  const groups=potsGroups(c,teams,G);const st={t:'grp',name:name||'Групповой этап',groups,fx:[],double};
  const sched=[[0,1,2,3],[0,2,1,3],[0,3,1,2]];
  groups.forEach((g,gi)=>{const s=g.length===4?sched:rrRounds(g.map((x,i)=>i),false).map(rd=>rd.flat());
    const rounds=double?[...s,...s.map(r=>[r[1],r[0],r[3],r[2]])]:s;
    rounds.forEach((r,ri_)=>{for(let k=0;k+1<r.length;k+=2){if(g[r[k]]==null||g[r[k+1]]==null)continue;st.fx.push(addFx({d:dates[ri_],c:c.k,h:g[r[k]],a:g[r[k+1]],g:gi,neu:!!c.ntDates,r:name||'Групповой этап',nt:c.nt}).i);}});});
  c.stages.push(st);c.st=c.stages.length-1;return st;
}
function swissStage(c,teams,dates,regions){
  const st={t:'swiss',name:'Общий этап',teams:teams.slice(),fx:[],regions:regions||null};
  const sets=regions?regions:[teams];
  sets.forEach((set,ri_)=>{
    const opp={};const home={};set.forEach(t=>{opp[t]=new Set();home[t]=0;});
    for(let r=0;r<8;r++){
      let pairs=null;
      for(let attempt=0;attempt<400&&!pairs;attempt++){
        const pool=shuffle(set.slice());const used=new Set();const res=[];let fail=false;
        for(const t of pool){if(used.has(t))continue;used.add(t);
          const cands=pool.filter(x=>!used.has(x)&&!opp[t].has(x)&&(attempt>200||S.T[x].nat!==S.T[t].nat));
          if(!cands.length){if(set.length%2===1&&res.length*2+1===set.length)continue;fail=true;break;}
          const o=cands[0];used.add(o);res.push([t,o]);}
        if(!fail)pairs=res;
      }
      (pairs||[]).forEach(([a,b])=>{opp[a].add(b);opp[b].add(a);const [h,aw]=home[a]<=home[b]?[a,b]:[b,a];home[h]++;st.fx.push(addFx({d:dates[r],c:c.k,h,a:aw,g:ri_,r:(r+1)+'-й тур общего этапа'}).i);});
    }
  });
  c.stages.push(st);c.st=0;return st;
}
function swissTable(st,ri_){
  const set=st.regions?st.regions[ri_]:st.teams;const tb={};set.forEach(id=>tb[id]={id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
  st.fx.forEach(i=>{const f=S.F[i];if(f.hg==null)return;const h=tb[f.h],a=tb[f.a];if(!h||!a)return;h.p++;a.p++;h.gf+=f.hg;h.ga+=f.ag;a.gf+=f.ag;a.ga+=f.hg;if(f.hg>f.ag){h.w++;a.l++;h.pts+=3;}else if(f.hg<f.ag){a.w++;h.l++;a.pts+=3;}else{h.d++;a.d++;h.pts++;a.pts++;}});
  return Object.values(tb).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf);
}
const stageDone=st=>(st.t==='ko'?st.ties.flatMap(t=>t.f):st.fx).every(i=>S.F[i].hg!=null);
const seeded=list=>{const n=list.length;const out=[];for(let i=0;i<n/2;i++)out.push([list[n-1-i],list[i]]);return out;};
const drawPairs=list=>{const l=shuffle(list.slice());const out=[];for(let i=0;i+1<l.length;i+=2)out.push([l[i],l[i+1]]);return out;};

/* ----- создание турниров сезона ----- */
function startSeason(first){
  S.F=[];BYDAY={};S.C={};S.cal=buildCalendar();
  S.L.forEach(makeLeagueFixtures);
  const C=S.cal;
  // национальные кубки
  countries().forEach(nat=>{
    const ncups=(CUPS[nat]||[]).length;
    (CUPS[nat]||[]).forEach(([id,tiers],ci)=>{
      const teams=S.L.filter(L=>L.nat===nat&&tiers.includes(L.tier)).flatMap(L=>L.teams);if(teams.length<4)return;
      const c=newComp(id,id,'cup',{nat,final:ci===0?C.finals.other:null,pool:null});
      c.teams=teams.slice();const n=teams.length;let P=1;while(P*2<=n)P*=2;
      const R=Math.log2(P)+(n>P?1:0);
      const wed=C.cupWed.filter((d,i)=>i%ncups===ci);
      c.dates=ci===0?[...spread(wed,R-1),C.finals.other]:spread(wed,R);
      const sorted=teams.slice().sort((a,b)=>S.T[a].rep-S.T[b].rep);
      if(n>P){const pre=sorted.slice(0,2*(n-P));c.wait=sorted.slice(2*(n-P));koStage(c,drawPairs(pre),1,[c.dates[0]],'Предварительный раунд');}
      else{c.wait=[];koStage(c,drawPairs(teams),1,[c.dates[0]],roundName(n),c.dates.length===1);}
    });
    const sid=SUPER[nat];
    if(sid&&!first&&S.champ[nat]!=null){let a=S.champ[nat],b=S.cupw[nat];if(b==null||b===a)b=S.runner&&S.runner[nat];if(b!=null&&a!==b){const c=newComp(sid,sid,'super',{nat});c.teams=[a,b];koStage(c,[[a,b]],1,[C.sc],'Финал',true);}}
  });
  // континентальные
  const q=S.q;
  ['ucl','uel','uecl'].forEach(id=>{if(q[id]&&q[id].length>=12){const c=newComp(id,id,'swiss');c.teams=q[id].slice();swissStage(c,c.teams,id==='ucl'?C.cont:C.cont.map(d=>d+1));}});
  if(q.acl&&q.acl.length>=12){const c=newComp('acl','acl','swiss');c.teams=q.acl.slice();const west=c.teams.filter(t=>ACL_WEST.has(S.T[t].nat)),east=c.teams.filter(t=>!ACL_WEST.has(S.T[t].nat));c.regionsMode=true;swissStage(c,c.teams,C.cont.map(d=>d-1),[west,east].filter(x=>x.length>=9));}
  [['acl2',C.cont.map(d=>d-1)],['lib',C.cont],['sud',C.cont.map(d=>d+1)],['cafcl',C.cont.map(d=>d-1)],['cafcc',C.cont.map(d=>d-1)]].forEach(([id,ds])=>{
    if(!q[id]||q[id].length<8)return;const teams=q[id].slice(0,Math.floor(q[id].length/4)*4);const c=newComp(id,id,'grp');c.teams=teams;c.kod=ds===C.cont?C.contKO:C.contKO.map(d=>d+(ds[0]-C.cont[0]));groupStage(c,teams,teams.length/4,true,ds.slice(0,6));});
  if(q.ccc&&q.ccc.length>=8){const c=newComp('ccc','ccc','ko2');c.teams=q.ccc.slice(0,16);const pairs=seeded(c.teams.slice().sort((a,b)=>S.T[b].rep-S.T[a].rep));koStage(c,pairs,2,[C.contKO[0]-1,C.contKO[1]-1],roundName(c.teams.length));c.kod=C.contKO.map(d=>d-1);c.kn=2;}
  if(S.prev&&S.prev.ucl!=null&&S.prev.uel!=null&&S.prev.ucl!==S.prev.uel){const c=newComp('usc','usc','super');c.teams=[S.prev.ucl,S.prev.uel];koStage(c,[[S.prev.ucl,S.prev.uel]],1,[C.usc],'Финал',true);}
  if(S.prev&&S.prev.lib!=null&&S.prev.sud!=null&&S.prev.lib!==S.prev.sud){const c=newComp('rec','rec','super');c.teams=[S.prev.lib,S.prev.sud];koStage(c,[[S.prev.lib,S.prev.sud]],1,[C.rec],'Финал',true);}
  if(S.prev&&S.prev.ucl!=null){const p=S.prev;const c=newComp('icc','icc','icc');c.seq=[];c.teams=[p.ucl,p.lib,p.ccc,p.cafcl,p.acl].filter(x=>x!=null);
    const s1=[p.ccc,p.lib].filter(x=>x!=null),s2=[p.cafcl,p.acl].filter(x=>x!=null);const pairs=[];if(s1.length===2)pairs.push(s1);if(s2.length===2)pairs.push(s2);
    if(pairs.length)koStage(c,pairs,1,[C.icc[0]],'Полуфиналы',true);else if(p.lib!=null)koStage(c,[[p.lib,p.ucl]],1,[C.icc[2]],'Финал',true);}
  // клубный чемпионат мира (раз в 4 года, июнь 2029, 2033…)
  if((S.year+1)%4===1&&S.year+1>=2029)makeCWC();
  // сборные
  makeNationalComps();
  S.L.forEach(L=>{L.teams.forEach(id=>{const t=S.T[id];t.lg=L.i;});});
}
function initialQualification(){
  const st={};S.L.forEach(L=>{if(L.tier===1&&L.grp===0)st[L.nat]=L.teams.slice().sort((a,b)=>S.T[a].exp-S.T[b].exp);});
  return qualify(st,{});
}
function qualify(tables,cupw){
  const q={ucl:[],uel:[],uecl:[],acl:[],acl2:[],lib:[],sud:[],ccc:[],cafcl:[],cafcc:[]};const used=new Set();
  const allowRus=S.opts.rusEuro;
  for(const nat in UEFA_SLOTS){if(nat==='RUS'&&!allowRus)continue;const t=tables[nat];if(!t)continue;const [a,b,c]=UEFA_SLOTS[nat];let i=0;
    const take=(arr,n)=>{let k=0;while(k<n&&i<t.length){if(!used.has(t[i])){arr.push(t[i]);used.add(t[i]);k++;}i++;}};
    take(q.ucl,a);const cw=cupw[nat];if(cw!=null&&!used.has(cw)){q.uel.push(cw);used.add(cw);take(q.uel,b-1);}else take(q.uel,b);take(q.uecl,c);}
  const uefaPool=Object.keys(UEFA_SLOTS).filter(n=>n!=='RUS'||allowRus).flatMap(n=>tables[n]||[]).filter(x=>!used.has(x)).sort((a,b)=>S.T[b].rep-S.T[a].rep);
  const fit=(arr,n)=>{arr.sort((a,b)=>S.T[b].rep-S.T[a].rep);while(arr.length>n){const x=arr.pop();used.delete(x);uefaPool.push(x);}uefaPool.sort((a,b)=>S.T[b].rep-S.T[a].rep);while(arr.length<n&&uefaPool.length){const x=uefaPool.shift();if(!used.has(x)){arr.push(x);used.add(x);}}};
  fit(q.ucl,36);fit(q.uel,36);fit(q.uecl,36);
  for(const id in CONT_SLOTS){for(const nat in CONT_SLOTS[id]){const t=tables[nat];if(!t)continue;let k=0;for(const x of t){if(k>=CONT_SLOTS[id][nat])break;if(used.has(x))continue;q[id].push(x);used.add(x);k++;}}}
  return q;
}

/* ----- продвижение турниров ----- */
function advanceComp(c){
  if(c.done)return;const st=c.stages[c.st];if(!st||!stageDone(st))return;
  const C=S.cal;
  if(st.t==='ko'){
    const ws=st.ties.map(t=>{t.w=tieWinner(t);return t.w;});
    st.ties.forEach(t=>{const lo=t.w===t.a?t.b:t.a;prize(c,t.w,'win');});
    if(c.kind==='cup'){
      let next=ws.concat(c.wait||[]);c.wait=[];
      if(next.length===1)return finishComp(c,next[0],st.ties[0].w===st.ties[0].a?st.ties[0].b:st.ties[0].a);
      const idx=c.stages.length;const d=c.dates[Math.min(idx,c.dates.length-1)];
      koStage(c,drawPairs(next),1,[d],roundName(next.length),next.length===2);return;
    }
    if(c.kind==='super'||st.ties.length===1&&st.name==='Финал')return finishComp(c,ws[0],st.ties[0].w===st.ties[0].a?st.ties[0].b:st.ties[0].a);
    if(c.kind==='icc'){
      if(st.name==='Полуфиналы'&&ws.length===2)return void koStage(c,[[ws[0],ws[1]]],1,[C.icc[1]],'Кубок вызова',true);
      const ucl=S.prev&&S.prev.ucl;if(st.name!=='Финал'&&ucl!=null)return void koStage(c,[[ws[0],ucl]],1,[C.icc[2]],'Финал',true);
      return finishComp(c,ws[0],null);
    }
    // континентальные/сборные плей-офф
    if(ws.length===1)return finishComp(c,ws[0],st.ties[0].w===st.ties[0].a?st.ties[0].b:st.ties[0].a);
    const n=ws.length;
    if(c.top8&&st.name==='Плей-офф'){const kd=c.id==='ucl'?C.contKO:C.contKO.map(d=>d+1);c.kn=4;const pairs=c.top8.map((t,i)=>[ws[ws.length-1-i]!=null?ws[ws.length-1-i]:ws[0],t]);return void koStage(c,pairs,2,[kd[2],kd[3]],'1/8 финала');}
    const legsNext=(c.ntDates||n===2||c.singleFrom&&n<=c.singleFrom)?1:2;
    const final=n===2;const k=c.kn=(c.kn||0)+2;
    let dates;
    if(c.ntDates)dates=[c.ntDates[c.ntStep++]];
    else if(final)dates=[c.id==='ucl'?C.finals.ucl:c.id==='uel'?C.finals.uel:c.id==='uecl'?C.finals.uecl:(c.kod?c.kod[7]+10:C.finals.other)];
    else{const kd=c.kod||C.contKO.map(d=>d+(c.id==='uel'||c.id==='uecl'?1:0));dates=legsNext===2?[kd[k-2]||kd[kd.length-2],kd[k-1]||kd[kd.length-1]]:[kd[k-2]||kd[kd.length-1]];}
    koStage(c,c.ntDates?seededBracket(ws):drawPairs(ws),final?1:legsNext,dates,roundName(n),final||!!c.ntDates||legsNext===1);
    return;
  }
  if(st.t==='swiss'){
    const kd=c.id==='ucl'?C.contKO:c.id==='acl'?C.contKO.map(d=>d-1):C.contKO.map(d=>d+1);
    if(c.regionsMode){
      const r16=[];st.regions.forEach((set,ri_)=>{const tb=swissTable(st,ri_);const top=tb.slice(0,8).map(x=>x.id);seeded(top).forEach(p=>r16.push(p));});
      c.kn=4;c.singleFrom=8;koStage(c,r16,2,[kd[2],kd[3]],'1/8 финала');return;
    }
    const tb=swissTable(st);const top8=tb.slice(0,8).map(x=>x.id),po=tb.slice(8,24).map(x=>x.id);
    c.top8=top8;c.kn=2;koStage(c,seeded(po),2,[kd[0],kd[1]],'Плей-офф');return;
  }
  if(st.t==='grp'){
    const G=st.groups.length;const tabs=st.groups.map((g,gi)=>groupTable(c,st,gi));
    let q=[];tabs.forEach(tb=>q.push(tb[0].id));tabs.forEach(tb=>q.push(tb[1]&&tb[1].id));q=q.filter(x=>x!=null);
    let need=1;while(need<q.length)need*=2;
    if(need>q.length){const thirds=tabs.map(tb=>tb[2]).filter(Boolean).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf);q=q.concat(thirds.slice(0,need-q.length).map(x=>x.id));}
    q=q.slice(0,need);
    const winners=q.slice(0,G),rest=q.slice(G);const pairs=[];const r2=shuffle(rest.slice());
    winners.forEach((w,i)=>{let j=r2.findIndex(x=>!st.groups.find(g=>g.includes(w)).includes(x));if(j<0)j=0;pairs.push([r2.splice(j,1)[0],w]);});
    if(c.ntDates){koStage(c,pairs,1,[c.ntDates[c.ntStep++]],roundName(q.length),true);}
    else{c.kn=4;const kd=c.kod;koStage(c,pairs,2,[kd[2],kd[3]],roundName(q.length));}
    return;
  }
}
function seededBracket(ws){const out=[];for(let i=0;i+1<ws.length;i+=2)out.push([ws[i],ws[i+1]]);return out;}
function finishComp(c,w,ru){
  c.done=true;c.w=w;c.ru=ru;prize(c,w,'title');
  (S.hist[c.id]=S.hist[c.id]||[]).unshift({s:season(),w,ru,nt:!!c.nt});
  if(!c.nt&&w!=null&&S.T[w]){S.T[w].tr.push({id:c.id,s:season()});
    if(S.user&&S.user.club===w){S.user.troph.unshift({id:c.id,s:season(),club:S.T[w].n,tid:w});msg('Совет директоров',`Трофей: ${c.name}!`,`${S.T[w].n} выигрывает турнир «${c.name}». Поздравляем — трофей отправляется в клубный музей.`);S.user.rep=clamp(S.user.rep+(c.kind==='super'?1:c.id==='ucl'?10:c.kind==='cup'?3:5),1,100);}
    news(`${S.T[w].n} — обладатель трофея «${c.name}»`,{t:[w,ru],c:c.id,k:'trophy',b:`${S.T[w].n} выигрывает турнир «${c.name}» сезона ${season()}${ru!=null&&S.T[ru]?`, в решающем матче обыграв ${S.T[ru].n}`:''}.`});
  }else if(c.nt&&w!=null)news(`${(S.N[w]||{}).name||w} — победитель турнира «${c.name}»`,{n:w,c:c.id,k:'trophy',b:`Сборная ${(S.N[w]||{}).name||w} выигрывает турнир «${c.name}» (${season()}).`});
  S.prev=S.prev||{};S.next=S.next||{};S.next[c.id]=w;
  if(c.kind==='cup'&&(CUPS[c.nat]||[])[0]&&CUPS[c.nat][0][0]===c.id)S.cupwNext=Object.assign(S.cupwNext||{},{[c.nat]:w});
}
function prize(c,t,kind){if(c.nt||t==null||!S.T[t])return;const p=PRIZE[c.id];const team=S.T[t];
  if(p){team.bal+=kind==='win'?p[1]:kind==='title'?p[2]:0;}
  else if(c.kind==='cup'){const L=S.L[team.lg];const r=L?L.rep:50;team.bal+=kind==='title'?r*r*90:r*r*12;}
}

/* ----- клубный чемпионат мира ----- */
function makeCWC(){
  const all=S.T.slice();const take=(pred,n)=>all.filter(pred).sort((a,b)=>b.rep-a.rep).slice(0,n).map(t=>t.id);
  const conf=t=>CONF_OF[t.nat]||'UEFA';const byNat={};
  const uefa=[];all.filter(t=>conf(t)==='UEFA'&&S.L[t.lg]&&S.L[t.lg].tier===1).sort((a,b)=>b.rep-a.rep).forEach(t=>{byNat[t.nat]=(byNat[t.nat]||0);if(uefa.length<12&&byNat[t.nat]<2){uefa.push(t.id);byNat[t.nat]++;}});
  let teams=[...uefa,...take(t=>conf(t)==='CONMEBOL',6),...take(t=>conf(t)==='AFC',4),...take(t=>conf(t)==='CAF',4),...take(t=>conf(t)==='CONCACAF',4)];
  const rest=all.filter(t=>!teams.includes(t.id)&&S.L[t.lg]&&S.L[t.lg].tier===1).sort((a,b)=>b.rep-a.rep);while(teams.length<32&&rest.length)teams.push(rest.shift().id);
  const c=newComp('cwc','cwc','grp');c.teams=teams;c.ntDates=S.cal.summer.slice(3);c.ntStep=0;
  groupStage(c,teams,8,false,S.cal.summer.slice(0,3));
}

/* ----- сборные ----- */
function ntSquad(code){const ps=(NTP[code]||[]);return ps.slice(0,23);}
let NTP={};
function rebuildNTP(){NTP={};Object.values(S.P).forEach(p=>{(NTP[p.nat]=NTP[p.nat]||[]).push(p);});for(const k in NTP)NTP[k].sort((a,b)=>ca(b)-ca(a));}
const NT_SLOTS=FORM['4-3-3'];
function ntStrength(code){
  const n=S.N[code];const sq=ntSquad(code);const used=new Set();const xi=[];
  NT_SLOTS.forEach(pos=>{let b=null,bv=-1;sq.forEach(p=>{if(used.has(p.id)||p.inj>0)return;const v=eff(p,pos)*fam(p,pos);if(v>bv){bv=v;b=p;}});if(b&&bv>=(n?n.base-4:8)){used.add(b.id);xi.push(b.id);}else xi.push(null);});
  const base=n?n.base:10;const virt={gk:base,def:base,mid:base,att:base};
  const s=strength(xi,NT_SLOTS,{m:2,pr:1,te:1,wi:1},0);const filled=xi.filter(x=>x!=null).length/11;
  return {gk:xi[0]!=null?s.gk:base,def:s.def*filled+virt.def*(1-filled),mid:s.mid*filled+virt.mid*(1-filled),att:s.att*filled+virt.att*(1-filled),xi};
}
function ntPower(code){const s=(S.NS&&S.NS[code])||ntStrength(code);return (s.att+s.mid+s.def+s.gk)/4;}
function ntPick(conf,n,hosts){
  const pool=Object.values(S.N).filter(x=>x.conf===conf||(Array.isArray(conf)&&conf.includes(x.conf))).map(x=>[x.code,ntPower(x.code)+gauss()*.6]);
  const out=(hosts||[]).filter(h=>S.N[h]);pool.sort((a,b)=>b[1]-a[1]).forEach(([c])=>{if(out.length<n&&!out.includes(c))out.push(c);});return out;
}
function makeNationalComps(){
  rebuildNTP();S.NS={};Object.keys(S.N).forEach(c=>S.NS[c]=ntStrength(c));
  const Y=S.year+1;const C=S.cal;
  const tour=(id,teams,G,dates)=>{if(teams.length<G*4)return;const c=newComp(id,id,'grp',{nt:true});c.teams=teams;c.ntDates=dates.slice(3);c.ntStep=0;groupStage(c,teams,G,false,dates.slice(0,3));};
  if(Y%4===2)tour('wc',[...ntPick('UEFA',16,['ESP','POR']),...ntPick('CONMEBOL',6,['ARG','URU','PAR']),...ntPick('AFC',8),...ntPick('CAF',9,['MAR']),...ntPick('CONCACAF',6),...ntPick('OFC',1),...ntPick(['UEFA','CONMEBOL'],2)].filter((x,i,a)=>a.indexOf(x)===i).slice(0,48),12,C.summer);
  if(Y%4===0)tour('euro',ntPick('UEFA',24,['ENG','SCO','WAL','IRL']),6,C.summer);
  if(Y%4===0)tour('copa',[...ntPick('CONMEBOL',10),...ntPick('CONCACAF',6)],4,C.summer.filter((d,i)=>i!==3));
  if(Y%4===3){const t=ntPick('AFC',24,['KSA']);tour('asian',t.slice(0,Math.floor(t.length/4)*4),Math.floor(t.length/4),C.asian);}
  if(Y%4===3)tour('afcon',ntPick('CAF',24,['KEN','UGA','TAN']),6,C.summer);
  if(Y%2===1){const t=ntPick('CONCACAF',12,['USA']);tour('gold',t.slice(0,Math.floor(t.length/4)*4),Math.floor(t.length/4),C.summer.filter((d,i)=>i!==3));}
  if(S.year%2===0){const t=ntPick('UEFA',16);if(t.length===16){const c=newComp('unl','unl','grp',{nt:true});c.teams=t;c.ntDates=[C.nt[6],C.nlf[0],C.nlf[1]];c.ntStep=0;c.nlQF=true;groupStage(c,t,4,true,C.nt.slice(0,6),'Лига A, групповой этап');}}
}

/* ----- инбокс и новости ----- */
function msg(from,title,body,type,data){S.inbox.unshift({id:S.mid++,abs:S.abs,date:fmtDate(S.d),from,title,body,type:type||'info',data:data||null,read:false,done:false});if(S.inbox.length>200)S.inbox.length=200;if(type==='bid'||type==='job')S.stop=true;}
function news(txt,o){o=o||{};S.news.unshift({d:fmtDate(S.d),day:S.d,txt,t:(o.t||[]).filter(x=>x!=null),p:o.p==null?null:o.p,n:o.n||null,c:o.c||null,k:o.k||'info',b:o.b||''});if(S.news.length>150)S.news.length=150;}
