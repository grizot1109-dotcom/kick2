'use strict';
/* ===== KICK 2: настоящие игроки в 3D-моментах — модель и 27 анимаций Mixamo (models/player.glb) ===== */
// формы клубов на футболке (узор, рукава, номер), свой цвет кожи и волос, рост; анимации по ситуации

function loadPlayerModel(){
  if(H3.model||H3.modelLoading||typeof THREE==='undefined'||!THREE.GLTFLoader)return;H3.modelLoading=true;
  new THREE.GLTFLoader().load('models/player.glb',g=>{
    const meshes={};g.scene.traverse(o=>{if(o.isMesh){o.userData.shared=true;o.frustumCulled=false;meshes[o.name]=o;}});
    H3.model={scene:g.scene,anims:Object.fromEntries(g.animations.map(a=>[a.name,a]))};H3.modelLoading=false;
    // стойка (конец анимации «встать») — бёдра остаются на месте, без смещения в сторону
    const su=H3.model.anims.standUp;if(su)su.tracks.forEach(t=>{if(/Hips\.position$/.test(t.name)){const v=t.values,n=v.length;const x=v[0],z=v[2];for(let i=0;i<n;i+=3){v[i]=x;v[i+2]=z;}}});
    try{H3.model.anims.stand=buildStandClip(g.scene);}catch(e){console.error(e);}
  },undefined,()=>{H3.modelLoading=false;H3.modelFail=true;});
}
// обычная стойка: из позы привязки скелета — руки опущены вдоль тела, локти чуть согнуты, ноги немного расставлены
function buildStandClip(scene){
  const W=new Map();scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.bones.forEach((b,i)=>{if(!W.has(b))W.set(b,new THREE.Matrix4().copy(o.skeleton.boneInverses[i]).invert());});});
  // у модели кости продублированы цепочкой (Arm → Arm_1 для футболки): поворачиваем только основную, копии наследуют
  const base=b=>/_\d+$/.test(b.name)?'':b.name.replace(/^mixamorig\d*/,'');
  const ax=(x,y,z,deg)=>new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(x,y,z),deg*Math.PI/180);
  const OWN={LeftShoulder:ax(0,0,1,-10),RightShoulder:ax(0,0,1,10),LeftArm:ax(0,0,1,-64).multiply(ax(1,0,0,-6)),RightArm:ax(0,0,1,64).multiply(ax(1,0,0,-6)),LeftForeArm:ax(1,0,0,-14),RightForeArm:ax(1,0,0,-14),
    LeftHand:ax(0,1,0,8),RightHand:ax(0,1,0,-8),LeftUpLeg:ax(0,0,1,3),RightUpLeg:ax(0,0,1,-3),LeftFoot:ax(0,1,0,-8),RightFoot:ax(0,1,0,8)};
  const bw=new Map(),nw=new Map(),pos=new Map();
  W.forEach((m,b)=>{const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();m.decompose(p,q,s);bw.set(b,q);pos.set(b,p);});
  const D=new Map();const delta=b=>{if(D.has(b))return D.get(b);const par=b.parent&&W.has(b.parent)?delta(b.parent):new THREE.Quaternion();const own=OWN[base(b)];const d=own?own.clone().multiply(par):par.clone();D.set(b,d);return d;};
  W.forEach((m,b)=>nw.set(b,delta(b).clone().multiply(bw.get(b))));
  const tracks=[],seen=new Set();
  W.forEach((m,b)=>{if(seen.has(b.name))return;seen.add(b.name);const pq=b.parent&&W.has(b.parent)?nw.get(b.parent).clone().invert():new THREE.Quaternion();const lq=pq.multiply(nw.get(b));
    tracks.push(new THREE.QuaternionKeyframeTrack(b.name+'.quaternion',[0,1],[lq.x,lq.y,lq.z,lq.w,lq.x,lq.y,lq.z,lq.w]));
    if(!(b.parent&&W.has(b.parent))){const p=pos.get(b);tracks.push(new THREE.VectorKeyframeTrack(b.name+'.position',[0,1],[p.x,p.y,p.z,p.x,p.y,p.z]));}});
  return new THREE.AnimationClip('stand',1,tracks);
}
const _prepP=prepMatch;prepMatch=function(f){_prepP(f);loadPlayerModel();};

/* ---------- материалы ---------- */
const PATI={plain:0,stripes:1,thinstripes:2,hoops:3,sash:4,halves:5,chevron:6,cross:7,detail:8};
const NUMC={};
function numTex(num,col){const k=num+col;if(NUMC[k])return NUMC[k];const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  g.font='bold 96px Oswald,Arial';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.35)';g.strokeText(num,64,70);g.fillStyle=col;g.fillText(num,64,70);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;NUMC[k]=t;return t;}
function shirtMat(orig,kit,num,gk){
  const m=orig.clone();m.userData.sharedMap=true;m.color.set(0xffffff);m.side=THREE.DoubleSide;
  const sec=kit.sec||contrast(kit.b);const ncol=cdist(sec,kit.b)>180?sec:contrast(kit.b);
  const U={kB:{value:LC(kit.b)},kS:{value:LC(sec)},kL:{value:LC(gk?kit.b:kit.la)},kP:{value:gk?0:(PATI[kit.pb]||0)},numT:{value:numTex(String(num),ncol)}};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vKP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvKP=position;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vKP;uniform vec3 kB;uniform vec3 kS;uniform vec3 kL;uniform float kP;uniform sampler2D numT;')
     .replace('#include <map_fragment>',`#include <map_fragment>
      {float x=vKP.x,y=vKP.y,m=0.;
       if(kP==1.)m=step(.5,fract(x/14.+.25));else if(kP==2.)m=step(.66,fract(x/6.));else if(kP==3.)m=step(.55,fract(y/12.));
       else if(kP==4.)m=1.-step(6.,abs(x-(y-122.)));else if(kP==5.)m=step(0.,x);else if(kP==6.)m=1.-step(4.,abs(abs(x)*.8-(142.-y)));
       else if(kP==7.)m=max(1.-step(4.,abs(x)),1.-step(4.,abs(y-122.)));else if(kP==8.)m=1.-step(1.6,abs(abs(x)-17.));
       vec3 kc=mix(kB,kS,m);if(abs(x)>21.)kc=kL;diffuseColor.rgb*=kc;
       if(vKP.z<-5.&&abs(x)<16.&&y>106.&&y<140.){vec4 n=texture2D(numT,vec2((16.-x)/32.,(y-106.)/34.));diffuseColor.rgb=mix(diffuseColor.rgb,n.rgb,n.a);}}`);};
  m.customProgramCacheKey=()=>'kickShirt';return m;
}
// кожа и голова: щетина, борода и короткая стрижка рисуются прямо на модели (координаты позы привязки, см)
function skinMat(orig,skinMul,hairCol,beard,scalp){
  const m=orig.clone();m.userData.sharedMap=true;m.color.setRGB(skinMul[0],skinMul[1],skinMul[2]);
  const U={hC:{value:LC(hairCol)},bA:{value:beard===2?.82:beard===1?.38:0},sA:{value:scalp}};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vKP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvKP=position;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vKP;uniform vec3 hC;uniform float bA;uniform float sA;')
     .replace('#include <map_fragment>',`#include <map_fragment>
      {float x=vKP.x,y=vKP.y,z=vKP.z;
       float n=fract(sin(dot(floor(vKP*6.),vec3(12.9,78.2,37.7)))*43758.5);
       // стрижка ёжиком / лысина: линия роста волос ниже сзади, выше спереди
       float hl=mix(160.5,168.5,smoothstep(-2.,8.,z));float sc=smoothstep(hl,hl+1.2,y)*(1.-step(abs(x),0.)*0.);
       if(abs(x)>8.6&&y<167.&&z>-1.)sc*=.0;
       float s=sA*sc*(.75+.25*n);
       // борода и щетина: нижняя часть лица и скулы, губы открыты
       float bz=smoothstep(3.,6.,z);float by=smoothstep(147.5,149.5,y)*(1.-smoothstep(158.,159.5,y));
       float side=smoothstep(4.5,6.5,abs(x))*(1.-smoothstep(160.5,162.,y))*smoothstep(150.,151.,y)*smoothstep(-1.,1.,z);
       float lips=(1.-step(2.4,abs(x)))*step(155.2,y)*(1.-step(157.6,y))*step(9.,z);
       float b=bA*max(bz*by,side)*(1.-lips)*(.7+.3*n);
       diffuseColor.rgb=mix(diffuseColor.rgb,hC,clamp(max(s,b),0.,1.));}`);};
  m.customProgramCacheKey=()=>'kickSkin';return m;
}
// объёмная причёска: волосы, раздутые вдоль нормалей (кудри, высокие стрижки)
function volHair(geo){if(H3.volHair)return H3.volHair;const g=geo.clone();const P=g.attributes.position,N=g.attributes.normal;
  for(let i=0;i<P.count;i++){const y=P.getY(i);const k=1.8*Math.min(1,Math.max(0,(y-158)/10));P.setXYZ(i,P.getX(i)+N.getX(i)*k,y+N.getY(i)*k*1.4+k*.4,P.getZ(i)+N.getZ(i)*k);}
  P.needsUpdate=true;g.computeBoundingSphere();H3.volHair=g;return g;}
const BASE_SKIN='#d9b29b',BASE_HAIR='#2a2421';
function mulTo(target,base,lo,hi){const a=LC(target),b=LC(base);return [clamp(a.r/b.r,lo,hi),clamp(a.g/b.g,lo,hi),clamp(a.b/b.b,lo,hi)];}
// цвет волос с фото иногда захватывает лоб или фон — светлым оставляем только явно блондинистый/рыжий, остальное делаем тёмным
function cleanHair(hex,skinHex){const c=new THREE.Color(hex),s=new THREE.Color(skinHex);const hsl={},ss={};c.getHSL(hsl);s.getHSL(ss);
  const nearSkin=Math.abs(hsl.l-ss.l)<.12&&Math.abs(hsl.h-ss.h)<.05;
  if(hsl.l>.42&&!(hsl.s>.35&&hsl.h>.06&&hsl.h<.15)||nearSkin){c.setHSL(hsl.h,Math.min(hsl.s,.35),Math.min(hsl.l*.45,.16));}
  return '#'+c.getHexString();}
function looksOf(p){const L=window.KICK_LOOKS;if(!L||!p||!p.photo)return null;const m=/Q\d+/.exec(p.photo);return m&&L[m[0]]?L[m[0]]:null;}
function tintMat(orig,col,extra){const m=orig.clone();m.userData.sharedMap=true;if(Array.isArray(col))m.color.setRGB(col[0],col[1],col[2]);else m.color.copy(LC(col));if(extra)Object.assign(m,extra);return m;}
const SKIN_T=[[1,1,1],[.95,.86,.78],[.8,.64,.5],[.6,.44,.32],[.42,.3,.22],[.3,.21,.16]];
const HAIR_T=[[.7,.7,.7],[.55,.5,.48],[1.7,1.25,.9],[3.2,2.6,1.6],[2.6,1.5,.85],[2.2,2.2,2.2]];

/* ---------- игрок ---------- */
const _mkPlayerR=mkPlayer;
mkPlayer=function(kit,num,p,gk,imgSrc){
  if(!H3.model||!THREE.SkeletonUtils)return _mkPlayerR(kit,num,p,gk,imgSrc);
  const root=THREE.SkeletonUtils.clone(H3.model.scene);const g=new THREE.Group();g.add(root);
  const hs=hash(p?p.n+p.id:'x'+num);const pool=p?poolOf(p.nat):'ENG';
  const sk=pool==='SEN'?3+hs%3:pool==='BRA'?hs%5:pool==='ARA'?1+hs%3:hs%3;
  // внешность с фото игрока: кожа, волосы, лысина, борода, объём причёски; без фото — по стране
  const lk=looksOf(p);
  const skinHex=lk?'#'+lk[0]:['#e8c4a8','#dcae8c','#c08e6a','#8f5f3f','#5f3b26','#432817'][sk];
  const hairHex=cleanHair(lk?'#'+lk[1]:['#1c1714','#2a2019','#5a3f2a','#b58b52','#8a4a26','#9a9a9a'][(hs>>3)%6],skinHex);
  const bald=lk?!!lk[2]:hs%11===0;const beard=lk?lk[3]:(hs>>5)%4===0?1:0;const vol=lk?!!lk[4]:(sk>=3&&hs%3===0);
  const style=bald?'bald':vol?'vol':(hs>>2)%7===0?'buzz':'short';
  const h=p&&p.h?p.h:178+(hs%11)-5;const sc=.01*h/178;root.scale.setScalar(sc);
  root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=false;const n=o.name;
    if(/Shirt/.test(n))o.material=shirtMat(o.material,kit,num,gk);
    else if(/Shorts/.test(n))o.material=tintMat(o.material,kit.sh);
    else if(/Socks/.test(n))o.material=tintMat(o.material,kit.so);
    else if(/Body/.test(n)){const hd=new THREE.Color(hairHex).multiplyScalar(.7);o.material=skinMat(o.material,mulTo(skinHex,BASE_SKIN,.18,1.3),'#'+hd.getHexString(),beard,style==='buzz'?.9:0);if(style==='buzz'||style==='bald')o.material.roughness=Math.max(o.material.roughness||0,.75);}
    else if(/Hair/.test(n)){o.material=tintMat(o.material,mulTo(hairHex,BASE_HAIR,.3,9));if(style==='bald'||style==='buzz')o.visible=false;else if(style==='vol')o.geometry=volHair(o.geometry);}
    else if(/Shoes/.test(n))o.material=tintMat(o.material,['#ffffff','#ff6b5f','#5fe08a','#6aa8ff','#ffd95f'][hs%5]);});
  const mixer=new THREE.AnimationMixer(root);const acts={};for(const k in H3.model.anims)acts[k]=mixer.clipAction(H3.model.anims[k]);
  const o={g,root,real:true,mixer,acts,gk,cur:null,one:false,ph:0,path:[],x:0,z:0,rot:0};
  mixer.addEventListener('finished',e=>{if(e.action===o.acts[o.cur]&&!o.stay)o.one=false;});
  H3.players.add(g);return o;
};

/* ---------- анимации по ситуации ---------- */
function setLoco(o,key,ts){
  if(o.one)return;const a=o.acts[key];if(!a)return;
  if(o.cur!==key){a.reset();a.setLoop(THREE.LoopRepeat,Infinity);a.clampWhenFinished=false;a.play();if(o.cur&&o.acts[o.cur])o.acts[o.cur].crossFadeTo(a,.25,false);o.cur=key;}
  if(key==='standUp'){a.time=a.getClip().duration-.01;a.timeScale=0;}else a.timeScale=ts;
}
function playOnce(o,key,fade,stay,from){
  const a=o.acts[key];if(!a)return;a.reset();a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.timeScale=1;if(from)a.time=from;a.play();
  if(o.cur&&o.acts[o.cur]&&o.cur!==key)o.acts[o.cur].crossFadeTo(a,fade==null?.15:fade,false);o.cur=key;o.one=true;o.stay=!!stay;
}
/* ---------- мяч до удара: настоящие пасы и дриблинг ---------- */
// пас по газону катится с замедлением, навес летит по физике с сопротивлением воздуха, при дриблинге мяч уходит вперёд от касаний
function preBall(path,tShot){
  const out=[];const add=(t,x,y,z)=>out.push([t,x,y,z]);
  for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];const t0=a[0],t1=Math.min(b[0],tShot);if(t1<=t0+1e-4)continue;
    const d=Math.hypot(b[1]-a[1],b[3]-a[3]),T=t1-t0,sp=d/T;
    if(b[4]==='arc'||b[2]>.5){const p0=[a[1],a[2],a[3]];const v=[(b[1]-a[1])/T,(b[2]-a[2])/T+.5*GRAV*T,(b[3]-a[3])/T];
      for(let k=0;k<8;k++){const p=p0.slice(),vv=v.slice(),w=[0,0,0];for(let tt=0;tt<T;tt+=HSTEP)stepBall(p,vv,w);v[0]+=(b[1]-p[0])/T;v[1]+=(b[2]-p[1])/T;v[2]+=(b[3]-p[2])/T;}
      const p=p0.slice(),vv=v.slice(),w=[0,0,0];add(t0,...p);let n=0;for(let tt=0;tt<T;tt+=HSTEP){stepBall(p,vv,w);if(++n%4===0)add(t0+tt,...p);}add(t1,b[1],b[2],b[3]);}
    else if(sp>8){const dec=1.4,v0=d/T+.5*dec*T,dx=(b[1]-a[1])/d,dz=(b[3]-a[3])/d;
      for(let tt=0;tt<=T+1e-6;tt+=1/60){const s=v0*tt-.5*dec*tt*tt;add(t0+tt,a[1]+dx*s,.12,a[3]+dz*s);}}
    else{const dx=d?(b[1]-a[1])/d:0,dz=d?(b[3]-a[3])/d:0;
      for(let tt=0;tt<=T+1e-6;tt+=1/60){const k=tt/T;const ph=(tt*2.3)%1;const off=(sp>1.5?.95:.3)*(1-ph)*(1-ph)*(1-Math.pow(k,5));add(t0+tt,lerp(a[1],b[1],k)+dx*off,.12,lerp(a[3],b[3],k)+dz*off);}}
  }
  if(!out.length)add(0,path[0][1],path[0][2],path[0][3]);return {s:out};
}
const _bmP=buildMoment;buildMoment=function(ev){const pl=_bmP(ev);try{pl.pre=preBall(pl.ball,pl.tShot);}catch(e){console.error(e);}try{realism(pl);}catch(e){console.error(e);}return pl;};

/* ---------- реализм момента: игрок за мячом в момент удара, расстановка команд по их схеме ---------- */
function ballAtPl(pl,t){return t>=pl.tShot&&pl.sim?simAt(pl.sim,t-pl.tShot):simAt(pl.pre,t);}
function behindBall(o,pl,tc,dirX,dirZ,back,side,follow){
  const b=ballAtPl(pl,tc);const L=Math.hypot(dirX,dirZ)||1,dx=dirX/L,dz=dirZ/L;
  const x=b[0]-dx*back-dz*side,z=b[2]-dz*back+dx*side;
  o.path=o.path.filter(k=>!(k[0]>tc-.45&&k[0]<tc+.5));o.path.push([tc,x,0,z],[tc+.45,x+dx*follow,0,z+dz*follow]);o.path.sort((a,b)=>a[0]-b[0]);
}
function realism(pl){
  if(!H3.model||!M)return;const ev=pl.ev,T=ev.c.type;
  // 1. ударяющий и пасующий стоят за мячом, ударная нога — у мяча
  const S0=pl.S0;
  if(S0&&S0.role==='shoot'){const b=ballAtPl(pl,pl.tShot);behindBall(S0,pl,pl.tShot,52.5-b[0],(pl.tz||0)-b[2],.6,.17,1.1);}
  else if(S0&&S0.role==='head'){const b=ballAtPl(pl,pl.tShot);behindBall(S0,pl,pl.tShot,52.5-b[0],(pl.tz||0)-b[2],.28,0,.6);}
  const P=pl.ps.find(o=>o.role==='pass');const pt=PASS_AT[T];
  if(P&&pt!=null){const a=ballAtPl(pl,pt),c=ballAtPl(pl,pt+.15);behindBall(P,pl,pt,c[0]-a[0],c[2]-a[2],.58,.15,.7);}
  if(T==='corner'||T==='fk')return;
  // 2. остальные — настоящие игроки обеих команд по схеме, сдвинутые к мячу
  const atk=M.h.t===ev.atkT?M.h:M.a,dfn=atk===M.h?M.a:M.h;
  const firstDef=T==='solo'?pl.ps.find(o=>o.role==='def'):null;
  pl.ps=pl.ps.filter(o=>{const extra=o.role==='run'||(o.role==='def'&&o!==firstDef);if(extra){H3.players.remove(o.g);o.g.traverse(x=>{if(x.material)[].concat(x.material).forEach(m=>m.dispose());});}return !extra;});
  const used=new Set([ev.c.sid,ev.c.aid,ev.c.gk].filter(x=>x!=null));const bz=ballAtPl(pl,pl.tShot)[2];const sh=ballAtPl(pl,pl.tShot);
  const K=ev.kits;const add=(sd,side,kit,img)=>{const xy=sd.xy||slotXY(sd.slots);
    sd.xi.forEach((id,i)=>{if(id==null||used.has(id)||sd.slots[i]==='GK')return;const p=S.P[id];if(!p)return;const d=(100-xy[i][1])/100;let z=(xy[i][0]-50)/50*24;z+=(bz-z)*.3;
      let x;if(T==='pen')x=side==='def'?34+(i%3):32+(i%4);else if(side==='def')x=52.5-(5.5+Math.max(0,d-.1)/.8*27);else x=52.5-(53-d*45);
      if(T==='pen'){z=-16+((i*37)%32);}if(x<6)return;
      if(Math.hypot(x-sh[0],z-sh[2])<3.2)z+=z>sh[2]?3.5:-3.5;
      const o=mkPlayer(kit,p.num||7,p,false,img);o.role=side==='def'?'def':'run';o.side=side==='def'?'def':'atk';
      const fw=side==='def'?1.2:2.5;o.path=[[0,x-(side==='def'?1.5:3),0,z],[pl.tShot,x,0,z+(bz-z)*.12],[pl.end,x+fw,0,z+(bz-z)*.18]];pl.ps.push(o);used.add(id);});};
  add(dfn,'def',K.D,K.imgD);add(atk,'atk',K.A,K.imgA);
}

const PASS_AT={through:.8,cross:1,corner:.55};
const PASS_ANIM={through:['pass',.43],cross:['chip',.5],corner:['chip',.5]};
function animReal(o,v,t,dt,pl){
  const T=pl.ev.c.type;const vr=hash(String(o.g.id));const b=H3.ball.position;
  // защитники и остальные — плавное движение с разгоном и торможением вместо рывков по прямым
  if(/^(def|box|wall|run)$/.test(o.role)&&!o.frozen){
    if(o.sx==null){o.sx=o.x;o.sz=o.z;o.svx=0;o.svz=0;}
    let dvx=(o.x-o.sx)*5,dvz=(o.z-o.sz)*5;const ds=Math.hypot(dvx,dvz);if(ds>8.5){dvx*=8.5/ds;dvz*=8.5/ds;}
    let ax=dvx-o.svx,az=dvz-o.svz;const am=Math.hypot(ax,az),lim=9*dt;if(am>lim){ax*=lim/am;az*=lim/am;}
    o.svx+=ax;o.svz+=az;o.sx+=o.svx*dt;o.sz+=o.svz*dt;o.g.position.set(o.sx,0,o.sz);v=Math.hypot(o.svx,o.svz);
    if(v>.6&&!o.one){const f=Math.atan2(o.svx,o.svz);o.rot+=(((f-o.rot+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*5);o.g.rotation.y=o.rot;}}
  // защитники и вратарь смотрят на мяч — пятятся спиной или боком
  // смотрят на мяч, когда стоят или подстраиваются рядом с ним
  const watch=(o.role==='def'||o.role==='box'||o.role==='wall'||o.role==='gk')&&(v<2.5||Math.hypot(b.x-o.g.position.x,b.z-o.g.position.z)<9);
  if(watch&&!o.one){const f=Math.atan2(b.x-o.x,b.z-o.z);o.rot+=(((f-o.rot+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*6);o.g.rotation.y=o.rot;}
  const gp=o.g.position;const mv=o.lastXZ?[gp.x-o.lastXZ[0],gp.z-o.lastXZ[1]]:[0,0];o.lastXZ=[gp.x,gp.z];
  const fwd=v>.3?(mv[0]*Math.sin(o.rot)+mv[1]*Math.cos(o.rot))/Math.max(1e-6,Math.hypot(mv[0],mv[1])):1;
  // одноразовые действия в нужный момент: касание мяча совпадает с ударом в физике
  if(!o.done1){
    if(o.role==='shoot'){const k=T==='pen'?'pen':'strike',c=T==='pen'?.77:.47;if(t>=pl.tShot-c){playOnce(o,k,.12);o.done1=1;}}
    else if(o.role==='head'){const sc=vr%5===0;if(t>=pl.tShot-(sc?.77:.92)){playOnce(o,sc?'scissor':(vr%2?'header':'header2'),.2);o.done1=1;}}
    else if(o.role==='pass'&&PASS_AT[T]!=null){const [k,c]=PASS_ANIM[T];if(t>=PASS_AT[T]-c){playOnce(o,k,.12);o.done1=1;}}
    else if(o.role==='def'&&T==='solo'&&t>1.55&&t<2.3&&pl.S0&&Math.hypot(pl.S0.x-o.x,pl.S0.z-o.z)<2.6){playOnce(o,'trip',.15,true);o.frozen=[o.x,o.z];o.done1=1;}
    else if(o.role==='gk'&&pl.res!=='miss'){
      const side=o.diveZ-o.z;const far=Math.abs(side)>1.1;const start=far?pl.t1-.8:pl.t1-1.05;
      if(t>=Math.max(pl.tShot-.15,start)){
        if(far)playOnce(o,side<0?'gkDive':'gkDive2',.1,true,.35);
        else playOnce(o,pl.res==='save'?(vr%2?'gkCatch':'gkBlock'):(vr%2?'gkMiss':'gkBlock2'),.15,true);
        o.frozen=[o.x,o.z];o.done1=1;o.gkAct=o.cur;}}}
  // вратарь, поймавший мяч, потом кладёт его на газон
  if(o.role==='gk'&&o.gkAct==='gkCatch'&&!o.done2&&t>pl.t1+1.6){o.stay=false;playOnce(o,'gkPlace',.3,true);o.done2=1;}
  // нападающий после гола у углового — празднует, отбивая мяч коленом
  if(o.role==='shoot'&&pl.res==='goal'&&!o.done2&&t>pl.t1+2.6&&v<1){o.one=false;playOnce(o,'knee',.3,false);o.done2=1;}
  if(o.frozen)o.g.position.set(o.frozen[0],0,o.frozen[1]);
  // бег, трусца, дриблинг, бег спиной и боком, стойка
  if(o.role==='gk')setLoco(o,v<.6?(vr%2?'gkIdle':'gkIdle2'):'gkSide',v<.6?1:clamp(v/2,.7,1.4));
  else if(v<.5)setLoco(o,o.acts.stand?'stand':'standUp',1);
  else if(o.role==='shoot'&&T==='solo'&&t<pl.tShot-.5)setLoco(o,'dribble',clamp(v/5,.8,1.3));
  else if(fwd<-.5)setLoco(o,'jogB',clamp(v/3,.7,1.4));
  else if(fwd<.35)setLoco(o,'jogBD',clamp(v/3,.7,1.4));
  else if(v<4.2)setLoco(o,vr%3?'jog':'jogF',clamp(v/3,.55,1.4));
  else setLoco(o,'run',clamp(v/6,.75,1.45));
  o.mixer.update(dt*(M&&M.speed===4?1.6:M&&M.speed===2?1.25:1));
}
