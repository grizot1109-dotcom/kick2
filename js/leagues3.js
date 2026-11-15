'use strict';
/* ===== KICK 2: своё оформление карьеры для АПЛ, Бундеслиги, Серии А, Ла Лиги, РПЛ и Лиги 1 ===== */
const LTHEME={ENG:'eng',GER:'ger',ITA:'ita',ESP:'esp',FRA:'fra',RUS:'rus'};
SET.ltheme=SET.ltheme!==false;
function ltTeam(){if(!S||!S.user||UI.screen!=='game')return null;let t=userTeam();if(!t&&S.legend){const p=S.P[S.legend.pid];t=p&&p.club>=0?S.T[p.club]:null;}return t;}
function ltInfo(){const t=ltTeam();if(!t||!SET.ltheme)return null;const L=S.L[t.lg];const k=L&&LTHEME[L.nat];if(!k)return null;
  const top=S.L.find(x=>x.nat===L.nat&&x.tier===1);const src=LOGOS['L:'+L.key]||(top&&LOGOS['L:'+top.key])||null;return {k,L,src,id:'L:'+L.key};}
function ltApply(){const i=ltInfo();const de=document.documentElement;
  if(i){de.dataset.lt=i.k;if(i.src)de.style.setProperty('--lt-logo',`url("${i.src}")`);else de.style.removeProperty('--lt-logo');}
  else{delete de.dataset.lt;de.style.removeProperty('--lt-logo');}}
// логотипы лиг во вкладках главной
function ltTabIcons(){document.querySelectorAll('.subtabs button[onclick*="UI.hs=\'L"]').forEach(b=>{if(b.querySelector('.lt-ico'))return;const m=/UI\.hs='L(\d+)'/.exec(b.getAttribute('onclick'));const L=m&&S.L[+m[1]];const src=L&&LOGOS['L:'+L.key];if(src)b.insertAdjacentHTML('afterbegin',`<img class="lt-ico" src="${esc(src)}" alt="" onerror="this.remove()">`);});}
const _renderLT=render;render=function(){_renderLT();ltApply();};
// после загрузки шрифтов ширина кнопок меняется — капсулу перемеряем
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(typeof postRender==='function')postRender();});
// значок клуба на фото в главной новости
const _featLT=featured;
featured=function(n){const h=_featLT(n);if(!ltInfo())return h;const p=n.p!=null?S.P[n.p]:null;const t=p&&p.club>=0?S.T[p.club]:(n.t&&n.t[0]!=null?S.T[n.t[0]]:null);
  if(!t||!(p&&p.photo))return h;const i=h.lastIndexOf('</div></article>');return i<0?h:h.slice(0,i)+`<div class="feat-badge">${crest(t,56)}</div>`+h.slice(i);};
// логотип лиги над правой колонкой главной страницы
const _vHomeLT=vHome;
vHome=function(){let html=_vHomeLT();const i=ltInfo();if(!i)return html;
  // значки лиг во вкладках — сразу в разметке, чтобы капсула мерила уже готовые кнопки
  html=html.replace(/(<button class="[^"]*" onclick="UI\.hs='L(\d+)';render\(\)">)/g,(m,a,n)=>{const L=S.L[+n];const src=L&&LOGOS['L:'+L.key];return src?a+`<img class="lt-ico" src="${esc(src)}" alt="" width="20" height="20">`:a;});
  // «К матчу ›» в карточке следующего матча — всегда, как на макетах
  if(!/class="btn pri" style="width:100%" onclick="G\.cont\(\)">К матчу/.test(html))html=html.replace(/(<section class="panel nextm">[\s\S]*?)(<\/section>)/,`$1<button class="btn pri nm-go" onclick="G.cont()">К матчу ›</button>$2`);
  else html=html.replace('style="width:100%" onclick="G.cont()">К матчу</button>','style="width:100%" onclick="G.cont()">К матчу ›</button>');
  if(!i.src)return html;
  return html.replace('<aside class="home-side">',`<aside class="home-side"><div class="lt-mark"><img src="${esc(i.src)}" alt="${esc(i.L.name)}" onerror="this.parentNode.remove()"></div>`);};
// переключатель в настройках
const _vSettingsLT=vSettings;
vSettings=function(){return _vSettingsLT().replace('</div></div></div>',`<label class="setrow"><span><b>Оформление лиги</b><small>АПЛ, Бундеслига, Серия А, Ла Лига, РПЛ и Лига 1 — интерфейс карьеры в цветах лиги</small></span><input type="checkbox" ${SET.ltheme?'checked':''} onchange="SET.ltheme=this.checked;saveSet()"></label></div></div></div>`);};
