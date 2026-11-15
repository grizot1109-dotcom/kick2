'use strict';
/* ===== KICK 2: 3D-моменты в матче — матч идёт в 2D, а голевые моменты показываются в 3D с ТВ-камеры ===== */
SET.hl3d=SET.hl3d||'chances'; // goals | chances | off
const H3={ok:typeof THREE!=='undefined',r:null,scene:null,cam:null,wrap:null,play:null,last:-99};
let LASTCH=null;
const _chanceH=chance;chance=function(sd,od){const c=_chanceH(sd,od);LASTCH=c;return c;};
const LC=h=>new THREE.Color(h).convertSRGBToLinear();
const stdM=(c,r)=>new THREE.MeshStandardMaterial({color:LC(c),roughness:r==null?.78:r,metalness:0});

/* ---------- текстуры ---------- */
function cnv(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=8;t.encoding=THREE.sRGBEncoding;return t;}
function pitchTex(){return cnv(4096,2652,(g,w,h)=>{
  for(let i=0;i<20;i++){g.fillStyle=i%2?'#1a4f22':'#215c29';g.fillRect(i*w/20,0,w/20+1,h);}
  const im=g.getImageData(0,0,w,h);const d=im.data;for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*16;d[i]+=n*.6;d[i+1]+=n;d[i+2]+=n*.5;}g.putImageData(im,0,0);
  const X=x=>(x+52.5)/105*w,Z=z=>(z+34)/68*h;g.strokeStyle='rgba(255,255,255,.92)';g.lineWidth=7;g.fillStyle='#fff';
  g.strokeRect(X(-52.5),Z(-34),X(52.5)-X(-52.5),Z(34)-Z(-34));g.beginPath();g.moveTo(X(0),Z(-34));g.lineTo(X(0),Z(34));g.stroke();
  g.beginPath();g.arc(X(0),Z(0),9.15/105*w,0,7);g.stroke();g.beginPath();g.arc(X(0),Z(0),8,0,7);g.fill();
  [-1,1].forEach(s=>{const gx=s*52.5;g.strokeRect(Math.min(X(gx),X(gx-s*16.5)),Z(-20.16),Math.abs(X(16.5)-X(0)),Z(20.16)-Z(-20.16));g.strokeRect(Math.min(X(gx),X(gx-s*5.5)),Z(-9.16),Math.abs(X(5.5)-X(0)),Z(9.16)-Z(-9.16));
    g.beginPath();g.arc(X(gx-s*11),Z(0),8,0,7);g.fill();g.beginPath();g.arc(X(gx-s*11),Z(0),9.15/105*w,s>0?Math.PI*.705:-Math.PI*.295,s>0?Math.PI*1.295:Math.PI*.295);g.stroke();
    [-34,34].forEach(z=>{g.beginPath();g.arc(X(gx),Z(z),1/105*w,0,7);g.stroke();});});
});}
function crowdTex(){return cnv(2048,512,(g,w,h)=>{g.fillStyle='#101418';g.fillRect(0,0,w,h);const cols=['#2d3440','#5a2a2a','#2a4a5a','#c8c8c8','#3fe26b','#8a8a8a','#1d5a2d','#d8c06a','#40464f','#e6e6e6'];
  for(let y=4;y<h;y+=9){g.fillStyle='rgba(255,255,255,.03)';g.fillRect(0,y+7,w,2);for(let x=(y%18?4:0);x<w;x+=8){g.fillStyle=cols[(Math.random()*cols.length)|0];g.globalAlpha=.5+Math.random()*.5;g.beginPath();g.arc(x+3,y+2,2.4,0,7);g.fill();g.fillRect(x+1,y+4,4,4);}}g.globalAlpha=1;});}
function netTex(){return cnv(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1.4;for(let i=0;i<=w;i+=10){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke();}});}
// футболка оборачивается вокруг торса: u=0 — грудь, u=0.5 — спина с номером
function shirtTex(k,num,img){return cnv(512,256,(g,w,h)=>{
  const s=k.sec||contrast(k.b);g.fillStyle=k.b;g.fillRect(0,0,w,h);g.fillStyle=s;
  if(k.pb==='stripes')for(let x=0;x<w;x+=64)g.fillRect(x+16,0,28,h);else if(k.pb==='thinstripes')for(let x=0;x<w;x+=32)g.fillRect(x+10,0,9,h);
  else if(k.pb==='hoops')for(let y=50;y<h;y+=58)g.fillRect(0,y,w,24);else if(k.pb==='halves')g.fillRect(0,0,w*.25,h),g.fillRect(w*.75,0,w*.25,h);
  else if(k.pb==='sash'){g.beginPath();g.moveTo(w*.9,h);g.lineTo(w,h*.75);g.lineTo(w*.12,0);g.lineTo(w*.02,0);g.fill();}
  else if(k.pb==='chevron'){g.beginPath();g.moveTo(w*.85,h*.3);g.lineTo(w,h*.62);g.lineTo(w*.15,h*.3);g.lineTo(0,h*.62);g.closePath();g.fill();}
  else if(k.pb==='cross'){g.fillRect(0,h*.45,w,24);g.fillRect(w*.47,0,28,h);}else if(k.pb==='detail'){g.fillRect(w*.23,0,14,h);g.fillRect(w*.75,0,14,h);}
  if(img&&img.complete&&img.naturalWidth){g.drawImage(img,w*.86,h*.2,w*.28,h*.7);g.drawImage(img,-w*.14,h*.2,w*.28,h*.7);}
  g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,h-14,w,14);g.fillStyle=s;g.fillRect(0,0,w,10);
  const nc=cdist(s,k.b)>180?s:contrast(k.b);g.font='bold 120px Oswald,Arial';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.35)';g.strokeText(num,w/2,h*.52);g.fillStyle=nc;g.fillText(num,w/2,h*.52);
  g.beginPath();g.arc(w*.93,h*.32,9,0,7);g.fillStyle=nc;g.fill();
});}
const IMGC={};function kitImgEl(src){if(!src)return null;if(!IMGC[src]){const i=new Image();i.src=src;IMGC[src]=i;}return IMGC[src];}

/* ---------- сцена ---------- */
function h3Init(){
  if(H3.r||!H3.ok)return !!H3.r;
  try{H3.r=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){H3.ok=false;return false;}
  const r=H3.r;r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=.95;
  r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;r.domElement.className='m3d-cv';
  const sc=H3.scene=new THREE.Scene();sc.background=LC('#0b130e');sc.fog=new THREE.Fog(LC('#0b130e'),110,260);
  H3.cam=new THREE.PerspectiveCamera(26,16/9,.5,600);
  sc.add(new THREE.HemisphereLight(LC('#d9e8ff'),LC('#203020'),.55));
  const key=H3.key=new THREE.DirectionalLight(LC('#fff6e8'),2.2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:160});key.shadow.bias=-.0004;key.shadow.normalBias=.02;sc.add(key);sc.add(key.target);
  const fill=new THREE.DirectionalLight(LC('#9fc4ff'),.5);fill.position.set(40,50,60);sc.add(fill);
  const pitch=new THREE.Mesh(new THREE.PlaneGeometry(105,68),new THREE.MeshStandardMaterial({map:pitchTex(),roughness:.95}));pitch.rotation.x=-Math.PI/2;pitch.receiveShadow=true;sc.add(pitch);
  // настоящая трава (Poly Haven) поверх полос покоса и разметки
  {const gi=new Image();gi.onload=()=>{const tex=pitch.material.map,cv=tex.image,g=cv.getContext('2d');const tile=document.createElement('canvas');tile.width=tile.height=256;const tg=tile.getContext('2d');tg.drawImage(gi,0,0,256,256);
    g.save();g.globalCompositeOperation='soft-light';g.globalAlpha=.75;g.fillStyle=g.createPattern(tile,'repeat');g.fillRect(0,0,cv.width,cv.height);g.restore();tex.needsUpdate=true;};gi.src='img/3d/grass.jpg';}
  const apron=new THREE.Mesh(new THREE.PlaneGeometry(150,110),stdM('#17421d',.95));apron.rotation.x=-Math.PI/2;apron.position.y=-.02;apron.receiveShadow=true;sc.add(apron);
  // ворота
  const post=stdM('#ffffff',.4);const net=new THREE.MeshBasicMaterial({map:netTex(),transparent:true,side:THREE.DoubleSide,depthWrite:false});
  H3.nets=[];[-1,1].forEach(s=>{const gx=s*52.5;const gp=new THREE.Group();
    [-3.66,3.66].forEach(z=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,2.44,10),post);m.position.set(gx,1.22,z);m.castShadow=true;gp.add(m);});
    const bar=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,7.32,10),post);bar.rotation.x=Math.PI/2;bar.position.set(gx,2.44,0);bar.castShadow=true;gp.add(bar);
    const back=new THREE.Mesh(new THREE.PlaneGeometry(7.32,2.44),net);back.rotation.y=Math.PI/2;back.position.set(gx+s*2,1.22,0);gp.add(back);H3.nets.push({m:back,s,base:gx+s*2});
    const top=new THREE.Mesh(new THREE.PlaneGeometry(2,7.32),net);top.rotation.x=Math.PI/2;top.position.set(gx+s,2.44,0);gp.add(top);
    [-3.66,3.66].forEach(z=>{const sd=new THREE.Mesh(new THREE.PlaneGeometry(2,2.44),net);sd.position.set(gx+s,1.22,z);gp.add(sd);});sc.add(gp);});
  buildStadium(sc);
  // небо и отражения (Poly Haven, CC0) и трава
  new THREE.TextureLoader().load('img/3d/sky.jpg',tex=>{tex.mapping=THREE.EquirectangularReflectionMapping;tex.encoding=THREE.sRGBEncoding;sc.background=tex;
    const pm=new THREE.PMREMGenerator(r);sc.environment=pm.fromEquirectangular(tex).texture;pm.dispose();});
  // мяч
  const bt=cnv(256,128,(g,w,h)=>{g.fillStyle='#f6f6f6';g.fillRect(0,0,w,h);g.fillStyle='#161616';for(let i=0;i<14;i++){g.beginPath();g.arc((i*53)%w,(i*29)%h,11,0,7);g.fill();}g.fillStyle='#3fe26b';g.fillRect(0,58,w,8);});
  H3.ball=new THREE.Mesh(new THREE.SphereGeometry(.12,24,18),new THREE.MeshStandardMaterial({map:bt,roughness:.45}));H3.ball.castShadow=true;sc.add(H3.ball);
  // дождь / снег
  const pg=new THREE.BufferGeometry();const N=2200;const pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*120;pos[i*3+1]=Math.random()*40;pos[i*3+2]=(Math.random()-.5)*80;}pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  H3.prec=new THREE.Points(pg,new THREE.PointsMaterial({color:0xcfe3ff,size:.16,transparent:true,opacity:.7}));H3.prec.visible=false;sc.add(H3.prec);
  H3.players=new THREE.Group();sc.add(H3.players);
  return true;
}

/* ---------- стадион: ярусы, болельщики, крыша, свет ---------- */
function glowTex(){return cnv(128,128,(g,w,h)=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.18,'rgba(255,250,235,.85)');r.addColorStop(.45,'rgba(220,235,255,.22)');r.addColorStop(1,'rgba(200,220,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});}
function buildStadium(sc){
  const concrete=stdM('#3a4048',.92),dark=stdM('#14181d',.85),roofM=stdM('#1c2228',.55),steel=stdM('#5a626c',.4);
  const fans=[];const ROWS=22,RD=.85,RH=.5,OFF=7;
  // ступенчатый ярус: профиль-лесенка, вытянутый вдоль трибуны
  const tier=len=>{const sh=new THREE.Shape();sh.moveTo(0,0);let y=1.3,x=0;sh.lineTo(0,y);for(let r=0;r<ROWS;r++){x+=RD;sh.lineTo(x,y);y+=RH;sh.lineTo(x,y);}sh.lineTo(x+1.5,y);sh.lineTo(x+1.5,y+7);sh.lineTo(x+2.5,y+7);sh.lineTo(x+2.5,0);sh.lineTo(0,0);
    const g=new THREE.ExtrudeGeometry(sh,{depth:len,bevelEnabled:false,curveSegments:1});g.translate(0,0,-len/2);return g;};
  const sides=[{len:112,pos:[0,-34-OFF],ry:Math.PI/2,n:[0,-1]},{len:112,pos:[0,34+OFF],ry:-Math.PI/2,n:[0,1]},{len:74,pos:[-52.5-OFF,0],ry:Math.PI,n:[-1,0]},{len:74,pos:[52.5+OFF,0],ry:0,n:[1,0]}];
  const glow=new THREE.SpriteMaterial({map:glowTex(),color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  sides.forEach((sd,si)=>{
    const m=new THREE.Mesh(tier(sd.len),concrete);m.position.set(sd.pos[0],0,sd.pos[1]);m.rotation.y=sd.ry;m.receiveShadow=true;sc.add(m);m.updateMatrixWorld();
    const depth=ROWS*RD+2.5,topY=1.3+ROWS*RH+7;
    // крыша-козырёк со световой полосой и прожекторами
    const roof=new THREE.Mesh(new THREE.BoxGeometry(14,.5,sd.len+6),roofM);roof.position.set(depth-5,topY+3.5,0);roof.rotation.z=-.08;m.add(roof);
    const strip=new THREE.Mesh(new THREE.BoxGeometry(.3,.35,sd.len),new THREE.MeshBasicMaterial({color:0xfff6e0}));strip.position.set(depth-12,topY+3.1,0);m.add(strip);
    for(let z=-sd.len/2+4;z<=sd.len/2-4;z+=sd.len>100?9:8){const s=new THREE.Sprite(glow);s.scale.set(7,7,1);s.position.set(depth-12,topY+3,z);m.add(s);}
    [-.5,.5].forEach(k=>{const col=new THREE.Mesh(new THREE.BoxGeometry(.6,topY+4,.6),steel);col.position.set(depth+1,(topY+4)/2,k*sd.len);m.add(col);});
    // места болельщиков в мировых координатах
    const v=new THREE.Vector3();const face=Math.atan2(-sd.n[0],-sd.n[1]);
    for(let r=0;r<ROWS;r++)for(let z=-sd.len/2+.4;z<sd.len/2-.4;z+=.62){if(rnd()<.1)continue;
      v.set(RD*(r+.5)+(rnd()-.5)*.1,1.3+RH*r+.02,z+(rnd()-.5)*.12).applyMatrix4(m.matrixWorld);fans.push({x:v.x,y:v.y,z:v.z,ry:face+(rnd()-.5)*.5,s:.9+rnd()*.2,side:si,ph:rnd()*6});}
  });
  // углы — тёмные трибуны-заглушки
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const c=new THREE.Mesh(new THREE.BoxGeometry(18,22,18),dark);c.position.set(a*(52.5+OFF+8),11,b*(34+OFF+8));sc.add(c);});
  // болельщики: тела и головы — по одному instanced-мешу
  const N=fans.length;const bodyG=new THREE.BoxGeometry(.42,.52,.28);bodyG.translate(0,.26,0);const headG=new THREE.IcosahedronGeometry(.11,0);headG.translate(0,.64,0);
  const bodies=new THREE.InstancedMesh(bodyG,new THREE.MeshStandardMaterial({roughness:.9}),N),heads=new THREE.InstancedMesh(headG,new THREE.MeshStandardMaterial({roughness:.7}),N);
  const mt=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sv=new THREE.Vector3(),pv=new THREE.Vector3(),col=new THREE.Color();
  fans.forEach((f,i)=>{e.set(0,f.ry,0);q.setFromEuler(e);sv.set(f.s,f.s,f.s);pv.set(f.x,f.y,f.z);mt.compose(pv,q,sv);bodies.setMatrixAt(i,mt);heads.setMatrixAt(i,mt);
    heads.setColorAt(i,col.set(SKIN3[(i*7)%6]).convertSRGBToLinear());bodies.setColorAt(i,col.set('#30343a').convertSRGBToLinear());});
  sc.add(bodies);sc.add(heads);H3.crowd={fans,bodies,heads,mt,q,e,sv,pv};
  // светящиеся рекламные щиты вокруг поля
  const ads=cnv(1024,48,(c,W,Hh)=>{for(let i=0;i<12;i++){c.fillStyle=i%2?'#071a0f':'#1f6b35';c.fillRect(i*W/12,0,W/12,Hh);c.fillStyle=i%2?'#3fe26b':'#ffffff';c.font='bold 30px Oswald';c.textAlign='center';c.fillText('KICK 2',i*W/12+W/24,35);}});
  ads.wrapS=THREE.RepeatWrapping;
  const board=(len,x,z,ry)=>{const t=ads.clone();t.needsUpdate=true;t.repeat.set(len/40,1);const b=new THREE.Mesh(new THREE.BoxGeometry(len,.9,.15),new THREE.MeshBasicMaterial({map:t}));b.position.set(x,.45,z);b.rotation.y=ry;sc.add(b);};
  board(100,0,-38.5,0);board(100,0,38.5,Math.PI);board(60,-57.5,0,Math.PI/2);board(60,57.5,0,-Math.PI/2);
  // мачты с прожекторами и бликами
  [[-64,-48],[64,-48],[-64,48],[64,48]].forEach(([x,z])=>{const tw=new THREE.Mesh(new THREE.BoxGeometry(1,46,1),steel);tw.position.set(x,23,z);sc.add(tw);
    const l=new THREE.Mesh(new THREE.BoxGeometry(7,3.5,.5),new THREE.MeshBasicMaterial({color:0xffffff}));l.position.set(x*.98,46,z*.98);l.lookAt(0,0,0);sc.add(l);
    const s=new THREE.Sprite(glow);s.scale.set(26,26,1);s.position.set(x*.96,46,z*.96);sc.add(s);});
}
// раскраска болельщиков в цвета клубов матча
function crowdColors(ev){const C=H3.crowd;if(!C)return;const col=new THREE.Color();const kh=ev.kits.homeKit,ka=ev.kits.awayKit;
  const hc=[kh.b,kh.sec||kh.b,kh.b,'#e8e8e8'],ac=[ka.b,ka.sec||ka.b];const neutral=['#30343a','#1d2127','#4a4f57','#24364a','#5a2a2a','#2b3d2b'];
  C.fans.forEach((f,i)=>{let c;f.team=0;
    if(f.side===3&&Math.abs(f.z)<16&&rnd()<.85){c=ac[i%2];f.team=2;}else if(rnd()<.62){c=hc[i%4];f.team=1;}else c=neutral[i%6];
    C.bodies.setColorAt(i,col.set(c).convertSRGBToLinear());});
  C.bodies.instanceColor.needsUpdate=true;}
// прыжки болельщиков после гола
function crowdFrame(pl,t){const C=H3.crowd;if(!C)return;const on=pl.res==='goal'&&t>pl.t1&&t<pl.t1+3.4;if(!on&&!C.jumping)return;
  const team=pl.atkHome?1:2;const{fans,bodies,heads,mt,q,e,sv,pv}=C;
  fans.forEach((f,i)=>{if(f.team!==team)return;const y=on?Math.max(0,Math.sin((t-pl.t1)*9+f.ph))*.32:0;e.set(0,f.ry,0);q.setFromEuler(e);sv.set(f.s,f.s,f.s);pv.set(f.x,f.y+y,f.z);mt.compose(pv,q,sv);bodies.setMatrixAt(i,mt);heads.setMatrixAt(i,mt);});
  bodies.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true;C.jumping=on;}

/* ---------- игрок: телосложение, суставы ---------- */
const SKIN3=['#f0c8a6','#e0b48e','#c8956c','#a06e48','#74492b','#4c2e1b'];
const HAIR3=['#16100c','#2e2118','#5c3f27','#94683c','#cfa968','#1b1b1b'];
function lathe(pts,seg){return new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg||22);}
function seg(r1,r2,len,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,12),mat);m.position.y=-len/2;m.castShadow=true;return m;}
function mkPlayer(kit,num,p,gk,imgSrc){
  const g=new THREE.Group();const body=new THREE.Group();g.add(body);
  const pool=p?poolOf(p.nat):'ENG';const hs=hash(p?p.n+p.id:'x'+num);
  const sk=pool==='SEN'?3+hs%3:pool==='BRA'?hs%5:pool==='ARA'?1+hs%3:hs%3;const skin=stdM(SKIN3[sk],.55);
  const shirt=new THREE.MeshStandardMaterial({map:shirtTex(kit,num,kitImgEl(imgSrc)),roughness:.82});
  const sleeveL=stdM(gk?kit.b:kit.la,.82),sleeveR=stdM(gk?kit.b:kit.ra,.82),shorts=stdM(kit.sh,.8),socks=stdM(kit.so,.85),boot=stdM(['#111111','#f2f2f2','#ff3b30','#3fe26b','#1e6bff'][hs%5],.35);
  const add=(parent,m)=>{m.castShadow=true;parent.add(m);return m;};
  // торс и шорты
  const torso=add(body,new THREE.Mesh(lathe([[0,0],[.15,0],[.155,.07],[.16,.2],[.18,.32],[.2,.42],[.205,.48],[.19,.53],[.12,.57],[.06,.585],[0,.585]]),shirt));torso.position.y=.93;torso.scale.z=.66;
  const sh=add(body,new THREE.Mesh(lathe([[0,0],[.17,0],[.175,.06],[.17,.2],[.155,.26],[0,.26]]),shorts));sh.position.y=.7;sh.scale.z=.74;
  add(body,new THREE.Mesh(new THREE.CylinderGeometry(.052,.058,.12,12),skin)).position.y=1.55;
  // голова
  const head=new THREE.Group();head.position.y=1.68;body.add(head);
  const skull=add(head,new THREE.Mesh(new THREE.SphereGeometry(.112,20,16),skin));skull.scale.set(.92,1.1,1.02);
  const nose=add(head,new THREE.Mesh(new THREE.ConeGeometry(.022,.05,8),skin));nose.rotation.x=Math.PI/2;nose.position.set(0,-.005,.11);
  [-1,1].forEach(s=>{const e=add(head,new THREE.Mesh(new THREE.SphereGeometry(.026,8,8),skin));e.position.set(s*.102,0,0);e.scale.set(.5,1,.8);});
  const hl=hs%4;if(hl!==3){const hair=add(head,new THREE.Mesh(new THREE.SphereGeometry(.118,18,12,0,Math.PI*2,0,hl===0?Math.PI*.45:Math.PI*.58),stdM(HAIR3[(hs>>3)%6],.9)));hair.scale.set(.95,1.08,1.06);hair.position.set(0,.01,-.008);}
  // ноги: бедро → колено → голень с гетрой → бутса
  const leg=x=>{const hip=new THREE.Group();hip.position.set(x,.76,0);body.add(hip);hip.add(seg(.078,.06,.42,skin));
    const knee=new THREE.Group();knee.position.y=-.42;hip.add(knee);knee.add(seg(.056,.04,.4,socks));
    const b=add(knee,new THREE.Mesh(new THREE.BoxGeometry(.085,.07,.24),boot));b.position.set(0,-.43,.055);return {hip,knee};};
  const L=leg(-.088),R=leg(.088);
  // руки: плечо (рукав) → локоть → предплечье → кисть
  const arm=(x,sl)=>{const shp=new THREE.Group();shp.position.set(x,1.42,0);body.add(shp);shp.add(seg(.062,.055,.16,sl));const up=seg(.047,.042,.15,gk?sl:skin);up.position.y=-.235;shp.add(up);
    const el=new THREE.Group();el.position.y=-.3;shp.add(el);el.add(seg(.04,.033,.25,gk?sl:skin));const hand=add(el,new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),gk?stdM('#f4f4f4',.6):skin));hand.position.y=-.28;hand.scale.set(.8,1.1,.6);
    shp.rotation.z=x>0?-.08:.08;return {sh:shp,el};};
  const AL=arm(-.215,sleeveL),AR=arm(.215,sleeveR);
  H3.players.add(g);
  return {g,body,hipL:L.hip,hipR:R.hip,kneeL:L.knee,kneeR:R.knee,shL:AL.sh,shR:AR.sh,elL:AL.el,elR:AR.el,ph:Math.random()*6,path:[],x:0,z:0,rot:0};
}

/* ---------- физика мяча ---------- */
const GRAV=9.81,KDRAG=.0125,KMAG=.0045,HSTEP=1/240;
function stepBall(p,v,w){const sp=Math.hypot(v[0],v[1],v[2]);
  v[0]+=(-KDRAG*sp*v[0]+KMAG*(w[1]*v[2]-w[2]*v[1]))*HSTEP;v[1]+=(-GRAV-KDRAG*sp*v[1]+KMAG*(w[2]*v[0]-w[0]*v[2]))*HSTEP;v[2]+=(-KDRAG*sp*v[2]+KMAG*(w[0]*v[1]-w[1]*v[0]))*HSTEP;
  p[0]+=v[0]*HSTEP;p[1]+=v[1]*HSTEP;p[2]+=v[2]*HSTEP;
  if(p[1]<.12){p[1]=.12;if(v[1]<-1.2){v[1]=-v[1]*.55;v[0]*=.88;v[2]*=.88;w[1]*=.5;}else{v[1]=0;v[0]*=.994;v[2]*=.994;}}}
// подбираем начальную скорость, чтобы мяч с учётом сопротивления и закрутки пришёл в цель
function aimShot(p0,tg,speed,w){
  const d=Math.hypot(tg[0]-p0[0],tg[2]-p0[2]);const T=Math.max(.25,d/speed);
  const v=[(tg[0]-p0[0])/T,(tg[1]-p0[1])/T+.5*GRAV*T,(tg[2]-p0[2])/T];
  for(let k=0;k<10;k++){const p=p0.slice(),vv=v.slice(),ww=w.slice();let t=0;
    while(p[0]<tg[0]&&t<4){stepBall(p,vv,ww);t+=HSTEP;}
    const ey=tg[1]-p[1],ez=tg[2]-p[2];if(Math.abs(ey)<.03&&Math.abs(ez)<.03)break;v[1]+=ey/Math.max(.2,t);v[2]+=ez/Math.max(.2,t);if(t>=4)v[0]*=1.2;}
  return v;
}
// полный полёт после удара: штанги, перекладина, сейв, сетка, отскоки
function simBall(p0,v0,w0,res){
  const p=p0.slice(),v=v0.slice(),w=w0.slice();const s=[[0,...p]];const ev={};let t=0;
  for(let i=0;i<240*5;i++){stepBall(p,v,w);t+=HSTEP;
    if(!ev.hit&&p[0]>52.2&&p[0]<52.8){
      for(const zp of [-3.66,3.66]){const dz=p[2]-zp;if(Math.abs(dz)<.17&&p[1]<2.5){v[0]=-Math.abs(v[0])*.55;v[2]+=dz*30;ev.post=ev.hit=t;}}
      if(!ev.hit&&Math.abs(p[2])<3.66&&Math.abs(p[1]-2.44)<.16){v[1]=-Math.abs(v[1])*.5-1;v[0]=-Math.abs(v[0])*.45;ev.post=ev.hit=t;}}
    if(res==='save'&&!ev.hit&&p[0]>=51.4){v[0]=-Math.abs(v[0])*.28;v[1]=Math.abs(v[1])*.35+2.2;v[2]=v[2]*.2+(p[2]>=0?1:-1)*R3(5,8);ev.save=ev.hit=t;}
    if(res==='goal'&&!ev.goal&&p[0]>52.6&&Math.abs(p[2])<3.6&&p[1]<2.4){ev.goal=ev.hit=t;v[0]*=.18;v[1]*=.3;v[2]*=.3;}
    if(ev.goal&&p[0]>54.3){p[0]=54.3;v[0]=-Math.abs(v[0])*.15;}
    if(ev.goal&&Math.abs(p[2])>3.55){p[2]=Math.sign(p[2])*3.55;v[2]*=-.2;}
    if(i%3===0)s.push([t,...p]);}
  const cross=s.find(q=>q[1]>=52.4);ev.t1=ev.hit||(cross?cross[0]:s[s.length-1][0]);
  return {s,ev,t1:ev.t1};
}
const R3=(a,b)=>a+rnd()*(b-a);
function simAt(sim,t){const s=sim.s;if(t<=0)return s[0].slice(1);let lo=0,hi=s.length-1;if(t>=s[hi][0])return s[hi].slice(1);
  while(hi-lo>1){const m=(lo+hi)>>1;if(s[m][0]<t)lo=m;else hi=m;}const a=s[lo],b=s[hi],k=(t-a[0])/(b[0]-a[0]);return [lerp(a[1],b[1],k),lerp(a[2],b[2],k),lerp(a[3],b[3],k)];}

/* ---------- постановка момента ---------- */
const lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function atPath(path,t){if(!path.length)return null;if(t<=path[0][0])return path[0].slice(1);for(let i=1;i<path.length;i++){if(t<=path[i][0]){const a=path[i-1],b=path[i];const k=ease((t-a[0])/Math.max(.001,b[0]-a[0]));return a.slice(1).map((v,j)=>lerp(v,b[j+1],k));}}return path[path.length-1].slice(1);}
function arc(path,t){
  if(t<=path[0][0])return path[0].slice(1,4);for(let i=1;i<path.length;i++){if(t<=path[i][0]){const a=path[i-1],b=path[i];const k=(t-a[0])/Math.max(.001,b[0]-a[0]);const kk=b[4]==='ease'?ease(k):k;const y=lerp(a[2],b[2],kk)+(b[4]==='arc'?Math.sin(k*Math.PI)*(b[5]||3):0);return [lerp(a[1],b[1],kk),y,lerp(a[3],b[3],kk)];}}const l=path[path.length-1];return [l[1],l[2],l[3]];}
function buildMoment(ev){
  const {c,res,kits}=ev;const s=rnd()<.5?1:-1;const R=(a,b)=>a+rnd()*(b-a);
  const ps=[];const add=(side,pl,i,path,role)=>{const gk=role==='gk';const kit=gk?(side==='atk'?kits.gA:kits.gD):(side==='atk'?kits.A:kits.D);
    const num=gk?1:((hash(String(pl?pl.id:i))%22)+2);const o=mkPlayer(kit,num,pl,gk,gk?null:(side==='atk'?kits.imgA:kits.imgD));o.path=path;o.role=role;o.side=side;ps.push(o);return o;};
  const P=id=>id!=null?S.P[id]:null;const shooter=P(c.sid),assist=P(c.aid);const gkP=P(c.gk);
  let tz=R(-2.8,2.8),ty=R(.3,2.1);if(res==='miss'){tz=(rnd()<.5?-1:1)*R(4.2,6);ty=R(.4,3.6);}
  const ball=[];let tShot=2.6,S0;const T=c.type;
  if(T==='through'){add('atk',assist,1,[[0,23,0,s*7],[.8,26,0,s*6.5],[3,30,0,s*5]],'pass');S0=add('atk',shooter,2,[[0,31,0,s*-9],[1.7,40,0,s*-4],[2.6,45.5,0,s*-2.3],[4,47,0,s*-2]],'shoot');ball.push([0,23.6,.12,s*6.8],[.8,26.6,.12,s*6.4],[1.7,40.6,.12,s*-3.9,'ease'],[2.6,45.9,.12,s*-2.2,'ease']);}
  else if(T==='cross'){add('atk',assist,1,[[0,37,0,s*26],[1,42,0,s*29],[3,40,0,s*27]],'pass');S0=add('atk',shooter,2,[[0,39,0,s*-7],[2,47.5,0,s*-1],[3,48,0,s*-1]],'head');ball.push([0,37.5,.12,s*26],[1,42.5,.12,s*28.6,'ease'],[2,47.5,2,s*-1,'arc',3.2]);tShot=2.05;}
  else if(T==='long'){S0=add('atk',shooter,2,[[0,21,0,s*4],[1.3,27,0,s*2],[3,28,0,s*2]],'shoot');ball.push([0,21.6,.12,s*4],[1.3,27.6,.12,s*2,'ease']);tShot=1.35;}
  else if(T==='solo'){S0=add('atk',shooter,2,[[0,29,0,s*15],[1.2,37.5,0,s*9.5],[1.7,40,0,s*5],[2.4,45,0,s*3],[3.6,46,0,s*3]],'shoot');ball.push([0,29.6,.12,s*15],[1.2,38.1,.12,s*9.4,'ease'],[1.7,40.6,.12,s*4.9,'ease'],[2.4,45.5,.12,s*2.9,'ease']);tShot=2.45;
    add('def',null,30,[[0,40,0,s*12],[1.2,38.6,0,s*9],[1.6,38.8,0,s*7.5],[2.4,40,0,s*7]],'def');}
  else if(T==='corner'){add('atk',assist,1,[[0,51.6,0,s*33.4],[.5,52,0,s*33.8],[3,50,0,s*31]],'pass');S0=add('atk',shooter,2,[[0,40,0,s*4],[1.75,46.5,0,s*-1],[3,47,0,s*-1]],'head');ball.push([0,52.3,.12,s*33.9],[.55,52.3,.12,s*33.9],[1.75,46.5,2.2,s*-1,'arc',4]);tShot=1.8;
    for(let i=0;i<4;i++){add('atk',null,40+i,[[0,R(41,47),0,R(-8,8)],[1.8,R(44,49),0,R(-5,5)]],'box');add('def',null,50+i,[[0,R(44,50),0,R(-7,7)],[1.8,R(45,50),0,R(-5,5)]],'box');}}
  else if(T==='fk'){S0=add('atk',shooter,2,[[0,29,0,s*6.8],[.8,30.6,0,s*5.2],[2.5,31.5,0,s*4.8]],'shoot');ball.push([0,31,.12,s*5],[.85,31,.12,s*5]);tShot=.85;
    for(let i=0;i<4;i++)add('def',null,60+i,[[0,40.2,0,s*(3.6-i*.75)],[1.2,40.2,0,s*(3.6-i*.75)]],'wall');}
  else{S0=add('atk',shooter,2,[[0,38.2,0,-.3],[.9,41.2,0,-.1],[2.5,41.5,0,0]],'shoot');ball.push([0,41.5,.12,0],[.92,41.5,.12,0]);tShot=.92;}
  // удар — настоящая физика мяча: гравитация, сопротивление воздуха, закрутка, отскоки, штанги, сетка
  const sp=ball[ball.length-1];const p0=[sp[1],T==='cross'||T==='corner'?2.05:.12,sp[3]];
  if(res==='goal'){tz=clamp(tz,-3.1,3.1);ty=clamp(ty,.3,2.15);}
  let postShot=false;if(res==='miss'&&rnd()<.25){postShot=true;tz=(rnd()<.5?-1:1)*(3.66+.08);ty=R(.4,2.2);}
  const spd={through:27,solo:26,long:31,cross:14,corner:13,fk:25,pen:24}[T]||26;
  const curl=T==='fk'||T==='long'?(p0[2]>tz?1:-1)*R(14,24):R(-6,6);const w=[0,curl,0];
  const v0=aimShot(p0,[52.5,ty,tz],spd,w);
  const sim=simBall(p0,v0,w,res);const t1=tShot+sim.t1;const post=!!sim.ev.post;
  if(res==='save'){const c=sim.s.find(q=>q[1]>=51.4);if(c){ty=c[2];tz=c[3];}}
  const gkx=T==='pen'?52.3:51.4;const gdz=res==='goal'?(tz>0?-1:1)*R(.4,1.5)+tz*.3:tz;
  const G0=add('def',gkP,0,[[0,gkx,0,0],[tShot,gkx,0,sp[3]*.08],[t1-.05,gkx,0,gdz*.7],[t1+.4,gkx,0,gdz]],'gk');G0.diveAt=tShot+.08;G0.diveZ=gdz;G0.diveY=ty;
  for(let i=0;i<(T==='corner'||T==='fk'?1:3);i++){const z0=R(-12,12);add('def',null,70+i,[[0,R(36,46),0,z0],[tShot,R(43,48),0,lerp(z0,sp[3],.6)],[t1+1,R(45,49),0,lerp(z0,sp[3],.7)]],'def');}
  for(let i=0;i<3;i++){const z0=R(-25,25);add('atk',null,80+i,[[0,R(18,32),0,z0],[t1+1,R(28,40),0,z0*.8]],'run');add('def',null,90+i,[[0,R(20,34),0,z0+R(-5,5)],[t1+1,R(30,42),0,z0*.7]],'run');}
  if(res==='goal'){const cx=46,cz=s*30;const last=o=>o.path[o.path.length-1];S0.path.push([t1+.4,last(S0)[1],0,last(S0)[3]],[t1+2.6,cx,0,cz]);ps.filter(o=>o.side==='atk'&&o!==S0&&o.role!=='gk').forEach((o,i)=>o.path.push([t1+.8,last(o)[1],0,last(o)[3]],[t1+3,cx-1.5-i*.8,0,cz-s*(1+i*.6)]));}
  return {ps,ball,tShot,t1,end:t1+(res==='goal'?3.6:2.4),res,s,S0,tz,ev,t:0,sim,post,atkHome:ev.atkHome};
}

/* ---------- проигрывание ---------- */
function h3Show(ev){
  if(!h3Init())return false;const ph=document.getElementById('m2d');if(!ph)return false;
  if(H3.play)h3Stop(true);
  while(H3.players.children.length){const o=H3.players.children.pop();o.traverse(x=>{if(x.geometry&&!x.userData.shared)x.geometry.dispose();if(x.material){(Array.isArray(x.material)?x.material:[x.material]).forEach(m=>{if(m.map&&!m.userData.sharedMap)m.map.dispose();m.dispose();});}});}
  ev.kits.homeKit=ev.kits.homeKit||(M.kits?M.kits.h:ev.kits.A);ev.kits.awayKit=ev.kits.awayKit||(M.kits?M.kits.a:ev.kits.D);if(ev.atkHome==null)ev.atkHome=M&&ev.atkT===M.h.t;
  crowdColors(ev);H3.lastB=null;
  const pl=buildMoment(ev);H3.play=pl;
  const wx=M.wx||{k:'sun'};H3.prec.visible=wx.k==='rain'||wx.k==='snow';H3.prec.material.size=wx.k==='snow'?.3:.12;H3.scene.fog.near=wx.k==='rain'?60:wx.k==='snow'?50:110;
  H3.r.toneMappingExposure=wx.k==='rain'||wx.k==='snow'?.85:.95;
  if(!H3.wrap){H3.wrap=document.createElement('div');H3.wrap.className='m3d';H3.wrap.appendChild(H3.r.domElement);H3.lbl=document.createElement('div');H3.lbl.className='m3d-lbl';H3.wrap.appendChild(H3.lbl);
    const sk=document.createElement('button');sk.className='btn sm m3d-skip';sk.textContent='Пропустить ›';sk.onclick=()=>h3Stop();H3.wrap.appendChild(sk);H3.big=document.createElement('div');H3.big.className='m3d-big';H3.wrap.appendChild(H3.big);}
  const at=S.T[ev.atkT];H3.lbl.innerHTML=`<b>${ev.min}′</b> ${esc(at.n)} · ${esc(ev.sname)}${ev.aname?` <span>пас: ${esc(ev.aname)}</span>`:''}`;H3.big.textContent='';H3.big.className='m3d-big';
  ph.appendChild(H3.wrap);h3Size();H3.lastT=performance.now();requestAnimationFrame(h3Frame);return true;
}
function h3Size(){const ph=document.getElementById('m2d');if(!ph||!H3.r)return;const w=ph.clientWidth||800,h=Math.round(w*68/105);H3.r.setSize(w,h,false);H3.r.domElement.style.width=w+'px';H3.r.domElement.style.height=h+'px';H3.wrap.style.height=h+'px';H3.cam.aspect=w/h;H3.cam.updateProjectionMatrix();}
function h3Stop(silent){const pl=H3.play;H3.play=null;if(H3.wrap&&H3.wrap.parentNode)H3.wrap.remove();if(!silent&&pl&&pl.ev.onEnd)pl.ev.onEnd();}
function h3Frame(now){
  const pl=H3.play;if(!pl)return;const dt=Math.min(.05,(now-H3.lastT)/1000);H3.lastT=now;pl.t+=dt*(M&&M.speed===4?1.6:M&&M.speed===2?1.25:1);const t=pl.t;
  if(H3.wrap&&!H3.wrap.isConnected){const ph=document.getElementById('m2d');if(ph){ph.appendChild(H3.wrap);h3Size();}}
  const b=t>=pl.tShot&&pl.sim?simAt(pl.sim,t-pl.tShot):pl.pre?simAt(pl.pre,t):arc(pl.ball,t);
  // мяч вращается по направлению движения, как настоящий
  if(H3.lastB){const mx=b[0]-H3.lastB[0],mz=b[2]-H3.lastB[2],dd=Math.hypot(mx,mz);if(dd>1e-4){H3.rq=H3.rq||new THREE.Quaternion();H3.rax=H3.rax||new THREE.Vector3();H3.rax.set(mz/dd,0,-mx/dd);H3.rq.setFromAxisAngle(H3.rax,dd/.12);H3.ball.quaternion.premultiply(H3.rq);}}
  H3.lastB=b;H3.ball.position.set(b[0],b[1],b[2]);
  crowdFrame(pl,t);
  pl.ps.forEach(o=>{const p=atPath(o.path,t);if(!p)return;const nx=p[0],nz=p[2];const dx=nx-o.x,dz=nz-o.z;const v=pl.t>.05?Math.hypot(dx,dz)/Math.max(dt,.001):0;
    o.x=nx;o.z=nz;o.g.position.set(nx,0,nz);
    const face=v>.4?Math.atan2(dx,dz):Math.atan2(b[0]-nx,b[2]-nz);o.rot+=(((face-o.rot+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*7);o.g.rotation.y=o.rot;
    if(o.real){animReal(o,v,t,dt,pl);return;}
    // бег: бедро, колено, руки согнуты в локтях, корпус наклонён, шаг пружинит
    const run=clamp(v/7.5,0,1.25);o.ph+=dt*(2.5+v*1.45);const sn=Math.sin(o.ph),cs=Math.cos(o.ph);
    o.hipL.rotation.x=-sn*.75*run;o.hipR.rotation.x=sn*.75*run;
    o.kneeL.rotation.x=.08+Math.max(0,cs)*1.35*run;o.kneeR.rotation.x=.08+Math.max(0,-cs)*1.35*run;
    o.shL.rotation.x=sn*.65*run;o.shR.rotation.x=-sn*.65*run;o.elL.rotation.x=o.elR.rotation.x=-(.25+run*.95);
    o.body.rotation.x=.1*run;o.body.position.y=Math.abs(sn)*.045*run;o.body.rotation.z=0;o.g.rotation.x=0;o.g.position.y=0;
    if(run<.15){const br=Math.sin(t*2+o.ph)*.03;o.shL.rotation.x=br;o.shR.rotation.x=-br;o.elL.rotation.x=o.elR.rotation.x=-.25;}
    if(o.role==='shoot'&&Math.abs(t-pl.tShot)<.22){const k=1-Math.abs(t-pl.tShot)/.22;const pre=t<pl.tShot;o.hipR.rotation.x=pre?.6*k:-1.25*k;o.kneeR.rotation.x=pre?1.2*k:.1;o.shL.rotation.x=-.6*k;o.body.rotation.x=-.12*k;}
    if(o.role==='head'&&Math.abs(t-pl.tShot)<.35){const k=1-Math.abs(t-pl.tShot)/.35;o.body.position.y=.55*k;o.kneeL.rotation.x=o.kneeR.rotation.x=.9*k;o.shL.rotation.x=o.shR.rotation.x=-.8*k;}
    if(o.role==='gk'){if(run<.15){o.hipL.rotation.z=.12;o.hipR.rotation.z=-.12;o.kneeL.rotation.x=o.kneeR.rotation.x=.35;o.shL.rotation.x=o.shR.rotation.x=-.5;o.body.rotation.x=.18;}
      if(o.diveAt!=null&&t>o.diveAt&&pl.res!=='miss'){const k=clamp((t-o.diveAt)/.35,0,1);const side=o.diveZ>o.z?-1:1;o.g.rotation.z=side*k*1.3*(o.diveY<1.4?1:.7);o.g.position.y=k*(o.diveY>1.2?.6:.22);o.shL.rotation.x=o.shR.rotation.x=-2.6*k;}}
    if(pl.res==='goal'&&o.side==='atk'&&o.role!=='gk'&&t>pl.t1+.5){o.shL.rotation.x=o.shR.rotation.x=-2.7;o.elL.rotation.x=o.elR.rotation.x=-.2;}
  });
  H3.nets.forEach(n=>{n.m.position.x=n.base+(pl.res==='goal'&&n.s>0&&t>pl.t1&&t<pl.t1+.7?Math.sin((t-pl.t1)/.7*Math.PI)*.55:0);});
  if(H3.prec.visible){const a=H3.prec.geometry.attributes.position;for(let i=0;i<a.count;i++){let y=a.getY(i)-dt*(M.wx&&M.wx.k==='snow'?3:28);if(y<0)y=40;a.setY(i,y);}a.needsUpdate=true;}
  // одна ТВ-камера с центральной трибуны: ведёт мяч, после гола — автора гола, у ворот чуть приближает
  const S0=pl.S0;const fx=pl.res==='goal'&&t>pl.t1+.4&&S0?S0.x:b[0],fz=pl.res==='goal'&&t>pl.t1+.4&&S0?S0.z:b[2];
  const cam=H3.cam;const tx=clamp(fx,-46,47);const want=new THREE.Vector3(tx*.9,13.5,-47.5);const look=[tx,.8,fz*.5];
  if(!pl.camInit){cam.position.copy(want);pl.ct=look.slice();pl.fov=27;pl.camInit=1;}
  cam.position.lerp(want,Math.min(1,dt*1.6));pl.ct=pl.ct.map((v,i)=>lerp(v,look[i],Math.min(1,dt*2.6)));cam.lookAt(...pl.ct);
  const fov=fx>36?24:fx>24?27:31;pl.fov=lerp(pl.fov,fov,Math.min(1,dt*1.2));if(Math.abs(cam.fov-pl.fov)>.01){cam.fov=pl.fov;cam.updateProjectionMatrix();}
  // тени следуют за эпизодом
  H3.key.target.position.set(pl.ct[0],0,pl.ct[2]);H3.key.position.set(pl.ct[0]-18,60,pl.ct[2]-26);
  if(t>pl.t1&&!H3.big.textContent){H3.big.textContent=pl.res==='goal'?'ГОЛ!':pl.res==='save'?'Сейв!':pl.post?'Штанга!':'Мимо!';H3.big.className='m3d-big on '+pl.res;}
  H3.r.render(H3.scene,cam);
  if(t>=pl.end){h3Stop();return;}
  requestAnimationFrame(h3Frame);
}
window.addEventListener('resize',()=>{if(H3.play)h3Size();});

/* ---------- когда показывать ---------- */
const _attemptH=attempt;
attempt=function(sd,od,l){
  LASTCH=null;const sh=sd.st.sh,g=M.hg+M.ag,sot=sd.st.sot;_attemptH(sd,od,l);
  if(!H3.ok||SET.hl3d==='off'||!M||M.silent||!M.run||sd.st.sh===sh||!LASTCH)return;
  const res=M.hg+M.ag>g?'goal':sd.st.sot>sot?'save':'miss';const c=LASTCH;
  if(SET.hl3d==='goals'&&res!=='goal')return;if(res!=='goal'&&(c.xg<.14||M.min-H3.last<5))return;H3.last=M.min;
  const atkT=S.T[sd.t],defT=S.T[od.t];const K=M.kits||matchKits(S.T[M.h.t],S.T[M.a.t]);const A_=sd===M.h?K.h:K.a,D_=sd===M.h?K.a:K.h;
  const ev={c,res,min:M.min,atkT:sd.t,sname:S.P[c.sid]?S.P[c.sid].n:'',aname:c.aid!=null&&S.P[c.aid]?S.P[c.aid].n:'',
    kits:{A:A_,D:D_,gA:sd===M.h?K.gh:K.ga,gD:sd===M.h?K.ga:K.gh,imgA:kitImg(atkT,sd===M.h?'h':K.aw==='a'?'a':'h'),imgD:kitImg(defT,sd===M.h?(K.aw==='a'?'a':'h'):'h')}};
  pause();M.hlOn=true;
  ev.onEnd=()=>{M.hlOn=false;if(M&&!M.done&&!(M.min===45&&M.ht&&!M.ht.done)&&!(M.et&&M.min===90))play();};
  setTimeout(()=>{if(!h3Show(ev)){M.hlOn=false;play();}},30);
};
const _instH=G.instant;G.instant=function(){if(H3.play)h3Stop(true);if(M){M.silent=true;M.hlOn=false;}_instH();};
const _playH=G.play;G.play=function(){if(H3.play)h3Stop(true);if(M)M.hlOn=false;_playH();};
G.hl3d=function(v){SET.hl3d=v;saveSet();render();};
const _vMatchH=vMatch;
vMatch=function(){let html=_vMatchH();if(!M||M.done||!H3.ok)return html;
  const sw=`<div class="shouts"><span class="lab">3D-моменты:</span>${[['chances','Голы и опасные моменты'],['goals','Только голы'],['off','Выключить']].map(([k,l])=>`<button class="btn sm ${SET.hl3d===k?'on':''}" onclick="G.hl3d('${k}')">${l}</button>`).join('')}</div>`;
  return html.replace('<div class="shouts">',sw+'<div class="shouts">');};
const _renderH=render;render=function(){_renderH();if(H3.play&&H3.wrap&&!H3.wrap.isConnected){const ph=document.getElementById('m2d');if(ph){ph.appendChild(H3.wrap);h3Size();}}};
