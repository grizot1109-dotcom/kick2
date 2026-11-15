'use strict';
/* ===== KICK 2: выпадающие списки в стиле игры (вместо стандартных серых) ===== */
const CS={pop:null,sel:null,btn:null,act:-1,items:[]};
function csText(sel){const o=sel.options[sel.selectedIndex];return o?o.textContent:'';}
function enhanceSelects(root){
  (root||document).querySelectorAll('select:not([data-cs])').forEach(sel=>{
    sel.dataset.cs='1';const w=sel.offsetWidth;const inField=!!sel.closest('.field');
    const btn=document.createElement('button');btn.type='button';btn.className='csel'+(inField?' full':'');
    if(!inField&&w)btn.style.minWidth=w+'px';
    btn.setAttribute('aria-haspopup','listbox');btn.setAttribute('aria-expanded','false');
    const lab=sel.getAttribute('aria-label')||(sel.closest('label')&&sel.closest('label').firstChild&&sel.closest('label').firstChild.textContent)||'';
    if(lab)btn.setAttribute('aria-label',lab.trim()+': '+csText(sel));
    btn.innerHTML=`<span class="cs-v">${esc(csText(sel))}</span><i class="cs-a" aria-hidden="true"></i>`;
    btn.disabled=sel.disabled;
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();CS.sel===sel?csClose():csOpen(sel,btn);});
    btn.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)&&!CS.pop){e.preventDefault();csOpen(sel,btn);}});
    sel.classList.add('cs-hidden');sel.tabIndex=-1;sel.after(btn);
  });
}
function csOpen(sel,btn){
  csClose();CS.sel=sel;CS.btn=btn;btn.classList.add('open');btn.setAttribute('aria-expanded','true');
  const pop=document.createElement('div');pop.className='csel-pop';pop.setAttribute('role','listbox');
  const many=sel.options.length>12;
  let h=many?`<div class="cs-search"><input type="text" placeholder="Поиск…" aria-label="Поиск по списку"></div>`:'';
  h+='<div class="cs-list">';
  [...sel.children].forEach(ch=>{
    if(ch.tagName==='OPTGROUP'){h+=`<div class="cg">${esc(ch.label)}</div>`;[...ch.children].forEach(o=>h+=csItem(o,sel));}
    else h+=csItem(ch,sel);});
  h+='</div>';pop.innerHTML=h;document.body.appendChild(pop);CS.pop=pop;
  CS.items=[...pop.querySelectorAll('.co')];
  csPlace();
  const cur=pop.querySelector('.co.sel');if(cur){CS.act=CS.items.indexOf(cur);cur.scrollIntoView({block:'center'});}else CS.act=-1;
  csMark();
  pop.addEventListener('mousedown',e=>e.stopPropagation());
  pop.addEventListener('click',e=>{const it=e.target.closest('.co');if(it)csPick(it.dataset.v);});
  pop.addEventListener('mousemove',e=>{const it=e.target.closest('.co');if(it){const i=CS.items.indexOf(it);if(i!==CS.act){CS.act=i;csMark(true);}}});
  const inp=pop.querySelector('.cs-search input');
  if(inp){inp.addEventListener('input',()=>{const q=inp.value.trim().toLowerCase();CS.items.forEach(it=>it.hidden=!!q&&!it.textContent.toLowerCase().includes(q));pop.querySelectorAll('.cg').forEach(g=>{let n=g.nextElementSibling,any=false;while(n&&!n.classList.contains('cg')){if(!n.hidden)any=true;n=n.nextElementSibling;}g.hidden=!any;});CS.act=CS.items.findIndex(it=>!it.hidden);csMark();});
    setTimeout(()=>inp.focus(),0);inp.addEventListener('keydown',csKey);}
  else{pop.tabIndex=-1;setTimeout(()=>pop.focus(),0);pop.addEventListener('keydown',csKey);}
}
const csItem=(o,sel)=>`<div class="co ${o.value===sel.value?'sel':''} ${o.disabled?'dis':''}" role="option" aria-selected="${o.value===sel.value}" data-v="${esc(o.value)}">${esc(o.textContent)}</div>`;
function csPlace(){
  const pop=CS.pop,r=CS.btn.getBoundingClientRect();const w=Math.max(r.width,200);
  pop.style.width=Math.min(w,innerWidth-16)+'px';pop.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';
  const below=innerHeight-r.bottom-12,above=r.top-12;const want=Math.min(360,pop.scrollHeight);
  if(below>=Math.min(want,240)||below>=above){pop.style.top=(r.bottom+6)+'px';pop.style.maxHeight=Math.max(140,below)+'px';pop.classList.remove('up');}
  else{pop.style.maxHeight=Math.max(140,above)+'px';pop.style.top=Math.max(8,r.top-6-Math.min(want,above))+'px';pop.classList.add('up');}
}
function csMark(noScroll){CS.items.forEach((it,i)=>it.classList.toggle('act',i===CS.act));const a=CS.items[CS.act];if(a&&!noScroll)a.scrollIntoView({block:'nearest'});}
function csKey(e){
  const vis=CS.items.map((it,i)=>[it,i]).filter(([it])=>!it.hidden&&!it.classList.contains('dis')).map(x=>x[1]);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const p=vis.indexOf(CS.act);const n=e.key==='ArrowDown'?Math.min(vis.length-1,p+1):Math.max(0,p-1);CS.act=vis[n<0?0:n];csMark();}
  else if(e.key==='Enter'){e.preventDefault();const it=CS.items[CS.act];if(it&&!it.hidden)csPick(it.dataset.v);}
  else if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();const b=CS.btn;csClose();if(b)b.focus();}
}
function csPick(v){
  const sel=CS.sel,btn=CS.btn;csClose();if(!sel)return;
  const o=[...sel.options].find(x=>x.value===v);if(!o||o.disabled)return;
  if(sel.value!==v){sel.value=v;btn.querySelector('.cs-v').textContent=o.textContent;sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));}
  if(document.body.contains(btn))btn.focus();
}
function csClose(){if(CS.pop)CS.pop.remove();if(CS.btn){CS.btn.classList.remove('open');CS.btn.setAttribute('aria-expanded','false');}CS.pop=CS.sel=CS.btn=null;CS.items=[];}
document.addEventListener('mousedown',e=>{if(CS.pop&&!e.target.closest('.csel'))csClose();});
window.addEventListener('resize',csClose);
document.addEventListener('scroll',e=>{if(CS.pop&&!CS.pop.contains(e.target))csClose();},true);

/* ===== окно подтверждения «Да / Нет» ===== */
function askConfirm(title,text,yesLbl,onYes,danger){
  const old=document.getElementById('cfm');if(old)old.remove();
  const box=document.createElement('div');box.id='cfm';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','cfm-t');
  box.innerHTML=`<div class="cfm-box"><h3 id="cfm-t">${esc(title)}</h3>${text?`<p>${esc(text)}</p>`:''}<div class="cfm-row"><button class="btn" data-k="no">Нет</button><button class="btn pri ${danger?'cfm-danger':''}" data-k="yes">${esc(yesLbl||'Да')}</button></div></div>`;
  const close=()=>{document.removeEventListener('keydown',key,true);box.remove();};
  const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='Enter'&&document.activeElement&&document.activeElement.dataset.k!=='no'){e.preventDefault();e.stopPropagation();close();onYes();}};
  box.addEventListener('click',e=>{const b=e.target.closest('button');if(b){close();if(b.dataset.k==='yes')onYes();}else if(e.target===box)close();});
  document.addEventListener('keydown',key,true);document.body.appendChild(box);setTimeout(()=>box.querySelector('[data-k="yes"]').focus(),0);
}
window.askConfirm=askConfirm;
const _menuC=G.menu;G.menu=function(){if(M&&M.run)return;askConfirm('Выйти в главное меню?','Карьера сохранится автоматически.','Да, выйти',()=>_menuC());};
const _quitC=G.quit;G.quit=function(){askConfirm('Выйти из игры?',S&&S.user?'Карьера сохранится автоматически.':'','Да, выйти',()=>_quitC(),true);};

const _renderS=render;render=function(){csClose();_renderS();enhanceSelects(document.getElementById('app'));};
const _modalS=renderModal;renderModal=function(){_modalS();enhanceSelects(document.getElementById('mbox'));};
enhanceSelects(document);
