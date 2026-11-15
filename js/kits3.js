'use strict';
/* ===== KICK 2: формы клубов — домашняя и гостевая (цвета и узоры из Википедии), выбор без совпадений, свои картинки ===== */
const KK=()=>window.KICK_KITS||{};
const PATN={plain:'Однотонная',stripes:'Вертикальные полосы',thinstripes:'Тонкие полосы',hoops:'Горизонтальные полосы',sash:'Диагональная лента',halves:'Две половины',chevron:'Галочка',cross:'Крест',detail:'Вставки по бокам'};
function hexRgb(h){h=(h||'#888888').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return [n>>16&255,n>>8&255,n&255];}
function cdist(a,b){const [r1,g1,b1]=hexRgb(a),[r2,g2,b2]=hexRgb(b);return Math.abs(r1-r2)+Math.abs(g1-g2)+Math.abs(b1-b2);}
const contrast=c=>lum(c)>.55?'#141414':'#f4f4f4';
function genKit(t,w){
  const c1=t.c1||'#cc0000',c2=t.c2||'#ffffff';const pats=['plain','plain','plain','stripes','hoops','detail','sash','halves'];const pb=pats[hash(t.n)%pats.length];
  if(w==='h')return {b:c1,la:c1,ra:c1,sh:hash(t.n+'s')%2?c2:c1,so:c1,pb,sec:c2};
  const alt=cdist(c2,c1)<120?(lum(c1)>.5?'#1b1f2a':'#f2f2f2'):c2;return {b:alt,la:alt,ra:alt,sh:alt,so:alt,pb:'plain',sec:c1};
}
function kitOf(t,w){
  if(!t)return genKit({n:'?',c1:'#888',c2:'#fff'},'h');
  const own=t.kits&&t.kits[w];if(own)return own;
  const k=KK()[t.n];const src=k&&k[w];
  if(src)return {...src,sec:src.la!==src.b?src.la:src.sh!==src.b?src.sh:contrast(src.b)};
  return genKit(t,w);
}
// какую форму надевает команда: гости меняют форму, если цвета похожи
function matchKits(th,ta){
  const h=kitOf(th,'h');let a=kitOf(ta,'h');let aw='h';
  if(cdist(h.b,a.b)<150||cdist(h.sh,a.sh)<60&&cdist(h.b,a.b)<220){const a2=kitOf(ta,'a');if(cdist(h.b,a2.b)>=150){a=a2;aw='a';}else{a={b:contrast(h.b),la:contrast(h.b),ra:contrast(h.b),sh:contrast(h.b),so:contrast(h.b),pb:'plain',sec:h.b};aw='t';}}
  const gks=['#e4d23a','#2fbf71','#8a3fd1','#ff7a1a','#1fa9d6','#ff4f9a'];const gk=x=>gks.find(c=>cdist(c,h.b)>200&&cdist(c,a.b)>200&&cdist(c,x||'#000')>120)||'#e4d23a';
  const g1=gk(),g2=gk(g1);
  return {h,a,aw,gh:{b:g1,la:g1,ra:g1,sh:'#151515',so:g1,pb:'plain',sec:'#151515'},ga:{b:g2,la:g2,ra:g2,sh:'#151515',so:g2,pb:'plain',sec:'#151515'}};
}
const kitImg=(t,w)=>t&&t.kitImg&&t.kitImg[w]?t.kitImg[w]:null;

/* ---------- картинка формы (SVG) ---------- */
let kuid=0;
function kitSVG(k,size,img){
  if(img)return `<img src="${esc(img)}" width="${size}" height="${size}" alt="" style="object-fit:contain" onerror="this.replaceWith(document.createTextNode('нет файла'))">`;
  const id='kt'+(++kuid);const s=k.sec||contrast(k.b);let pat='';
  if(k.pb==='stripes')pat=[16,32,48].map(x=>`<rect x="${x}" y="0" width="8" height="64" fill="${s}"/>`).join('');
  else if(k.pb==='thinstripes')pat=[12,20,28,36,44,52].map(x=>`<rect x="${x}" y="0" width="3" height="64" fill="${s}"/>`).join('');
  else if(k.pb==='hoops')pat=[18,30,42].map(y=>`<rect x="0" y="${y}" width="64" height="6" fill="${s}"/>`).join('');
  else if(k.pb==='sash')pat=`<polygon points="12,8 22,8 54,52 44,52" fill="${s}"/>`;
  else if(k.pb==='halves')pat=`<rect x="32" y="0" width="32" height="64" fill="${s}"/>`;
  else if(k.pb==='chevron')pat=`<polygon points="14,14 32,30 50,14 50,22 32,38 14,22" fill="${s}"/>`;
  else if(k.pb==='cross')pat=`<rect x="28" y="0" width="8" height="64" fill="${s}"/><rect x="0" y="24" width="64" height="8" fill="${s}"/>`;
  else if(k.pb==='detail')pat=`<rect x="14" y="0" width="4" height="64" fill="${s}"/><rect x="46" y="0" width="4" height="64" fill="${s}"/>`;
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><defs><clipPath id="${id}"><path d="M20 6 L27 4 Q32 9 37 4 L44 6 L44 52 L20 52 Z"/></clipPath></defs>
   <path d="M20 6 L8 14 L11 26 L20 22 Z" fill="${k.la}" stroke="rgba(0,0,0,.35)" stroke-width=".8"/><path d="M44 6 L56 14 L53 26 L44 22 Z" fill="${k.ra}" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>
   <g clip-path="url(#${id})"><rect x="0" y="0" width="64" height="64" fill="${k.b}"/>${pat}</g>
   <path d="M20 6 L27 4 Q32 9 37 4 L44 6 L44 52 L20 52 Z" fill="none" stroke="rgba(0,0,0,.35)" stroke-width=".8"/><path d="M27 4 Q32 9 37 4" fill="none" stroke="${s}" stroke-width="1.6"/></svg>`;
}
function kitBlock(t){
  return `<div class="row" style="gap:18px">${['h','a'].map(w=>{const k=kitOf(t,w);return `<div style="text-align:center">${kitSVG(k,72,kitImg(t,w))}<small class="mute" style="display:block">${w==='h'?'Домашняя':'Гостевая'}</small></div>`;}).join('')}</div>`;
}

/* ---------- 2D-матч: цвета по формам ---------- */
teamCols=function(){const th=S.T[M.h.t],ta=S.T[M.a.t];const K=M.kits||(M.kits=matchKits(th,ta));return {h:[K.h.b,K.h.sec||K.h.sh],a:[K.a.b,K.a.sec||K.a.sh],gh:K.gh.b,ga:K.ga.b};};
const _prepK=prepMatch;prepMatch=function(f){_prepK(f);M.kits=matchKits(S.T[f.h],S.T[f.a]);};

/* ---------- клуб: показать формы ---------- */
const _vClubK=vClub;
vClub=function(){const html=_vClubK();if((UI.ct||'main')!=='main')return html;const t=userTeam();
  const blk=`<div class="panel"><h3 style="margin-bottom:10px">Формы сезона ${season()}</h3>${kitBlock(t)}<p class="mute" style="font-size:12px;margin-top:8px">${KK()[t.n]?'Цвета и узоры — по данным Википедии.':'Формы нарисованы по цветам клуба.'} Изменить форму или поставить свою картинку можно в «Редакторе».</p></div>`;
  const i=html.indexOf('<div class="panel"><h3>Музей трофеев</h3>');return i>=0?html.slice(0,i)+blk+html.slice(i):html+blk;};

/* ---------- редактор: формы клуба ---------- */
const _vEditorK=vEditor;
vEditor=function(){
  const html=_vEditorK();const e=UI.ed;if(!e.sel||e.sel[0]!=='t'||!S.T[e.sel[1]])return html;const t=S.T[e.sel[1]];
  const col=(w,k,lab)=>`<label class="field">${lab}<input type="color" id="kt-${w}-${k}" value="${kitOf(t,w)[k]}"></label>`;
  const box=w=>`<div class="panel"><div class="row" style="justify-content:space-between"><h3>${w==='h'?'Домашняя форма':'Гостевая форма'}</h3>${kitSVG(kitOf(t,w),56,kitImg(t,w))}</div>
    <div class="grid g3" style="gap:8px;margin-top:8px">${col(w,'b','Футболка')}${col(w,'la','Рукава')}${col(w,'sec','Цвет узора')}${col(w,'sh','Трусы')}${col(w,'so','Гетры')}
    <label class="field">Узор<select id="kt-${w}-pb">${Object.entries(PATN).map(([k,n])=>`<option value="${k}" ${kitOf(t,w).pb===k?'selected':''}>${n}</option>`).join('')}</select></label></div>
    <label class="field" style="margin-top:8px">Своя картинка формы (путь к файлу в папке игры)<input id="kt-${w}-img" placeholder="img/kits/${esc(t.s||'club')}_${w==='h'?'home':'away'}.png" value="${esc(kitImg(t,w)||'')}"></label></div>`;
  const blk=`<div class="grid g2" style="align-items:start">${box('h')}${box('a')}</div><div class="row"><button class="btn pri" onclick="G.edKits(${t.id})">Сохранить формы</button><button class="btn" onclick="G.edKitsReset(${t.id})">Вернуть формы из Википедии</button></div>
   <p class="mute" style="font-size:12px">Свою картинку положите в папку игры <code>img/kits</code> и впишите путь — она будет показываться вместо нарисованной формы и на футболках в 3D-моментах.</p>`;
  return html+blk;
};
G.edKits=function(id){const t=S.T[id];t.kits=t.kits||{};t.kitImg=t.kitImg||{};
  ['h','a'].forEach(w=>{const v=k=>document.getElementById(`kt-${w}-${k}`).value;const ra=v('la');t.kits[w]={b:v('b'),la:ra,ra,sh:v('sh'),so:v('so'),sec:v('sec'),pb:v('pb')};const img=v('img').trim();if(img)t.kitImg[w]=img;else delete t.kitImg[w];});
  toast('Формы сохранены');save();render();};
G.edKitsReset=function(id){const t=S.T[id];delete t.kits;delete t.kitImg;toast('Формы сброшены');save();render();};
