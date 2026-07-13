/* ===== colors.js — игра «жёлтый и зелёный» (самостоятельная) ===== */

/* ===== Экран загрузки: собака-сёрфер (адаптивный) ===== */
(function(){
  var REPO="https://cdn.jsdelivr.net/gh/pandora28546-lab/Web@main/";
  var DOG = REPO+"89-1.png";
  var BG  = { landscape: REPO+"IMG_1907.jpeg", portrait: REPO+"IMG_1908.jpeg" };

  var CFG = {
    landscape:{ barL:16, barR:84, barY:47, barH:3,   dogH:36, startX:26, endX:78, textY:66, dogRide:0.21, dur:4500, textK:0.025 },
    portrait: { barL:14, barR:86, barY:45, barH:1.9, dogH:23, startX:28, endX:72, textY:57, dogRide:0.21, dur:4500, textK:0.025 }
  };
  var HOLD_END=900, HOLD_START=450, LOOP=true;

  var scene=document.querySelector('#uzor-loader .ul-scene');
  if(!scene) return;
  var root=document.getElementById('uzor-loader');
  var bar=document.createElement('div'); bar.className='ul-bar';
  var fill=document.createElement('div'); fill.className='ul-fill'; bar.appendChild(fill);
  var dog=document.createElement('img'); dog.className='ul-dog'; dog.alt='собака-сёрфер'; try{dog.fetchPriority='high';}catch(e){} dog.src=DOG;
  var cap=document.createElement('div'); cap.className='ul-cap'; cap.textContent='Секунду, игра загружается';
  scene.appendChild(bar); scene.appendChild(dog); scene.appendChild(cap);

  // картинки экрана загрузки — в первую очередь; собаку показываем только когда она
  // полностью декодирована, чтобы не появлялась «кусками»
  var dogReady=false;
  (function(){ function ok(){ dogReady=true; }
    if(dog.decode){ dog.decode().then(ok).catch(ok); }
    else { dog.onload=ok; if(dog.complete) ok(); } })();
  [BG.landscape, BG.portrait].forEach(function(u){ try{ var p=new Image(); p.fetchPriority='high'; p.src=u; }catch(e){ var q=new Image(); q.src=u; } });
  function setSceneBg(url){ var im=new Image(); function done(){ scene.style.backgroundImage='url("'+url+'")'; } im.onload=done; im.onerror=done; im.src=url; }

  var c, mode=null, curX=null;
  function pickMode(){ return scene.clientWidth>=scene.clientHeight ? 'landscape' : 'portrait'; }

  function drawAt(x,rot,bob){
    var y=c.barY - c.dogRide*c.dogH + bob;
    dog.style.cssText='position:absolute;width:auto;height:'+c.dogH+'%;left:'+x+'%;top:'+y+'%;'+
      'transform:translate(-50%,-50%) rotate('+rot.toFixed(2)+'deg);'+
      'filter:drop-shadow(0 6px 6px rgba(44,58,94,.18));'+
      'opacity:'+(dogReady?'1':'0')+';transition:opacity .3s ease;';
    var f=(x-c.barL)/(c.barR-c.barL); f=Math.max(0,Math.min(1,f)); fill.style.width=(f*100).toFixed(1)+'%';
  }

  /* ── подписи «загрузки» и «старта» совпадают по размеру и уровню ──
     считаем от размера карточки (а не сцены), чтобы работало и после скрытия загрузки */
  var GAME=document.getElementById('sofia-game');
  function syncScreens(){
    if(!GAME) return;
    var W=GAME.clientWidth, H=GAME.clientHeight;
    if(!W) return;
    var land = W>=H;                                    // 3:2 = landscape, 3:5 = portrait
    var ty=(land?CFG.landscape:CFG.portrait).textY;
    var by=(land?CFG.landscape:CFG.portrait).barY;
    var capPx=Math.max(16, W*0.025);
    cap.style.top=ty+'%'; cap.style.fontSize=capPx+'px';
    var scap=document.getElementById('sg-start-cap');
    if(scap){ scap.style.top=ty+'%'; scap.style.fontSize=capPx+'px'; }
    var bs=Math.min(132, Math.max(92, W*0.15));   // размер оранжевой кнопки: старт == финал
    var sbtn=document.getElementById('sg-start-btn');
    if(sbtn){
      sbtn.style.width=bs+'px'; sbtn.style.height=bs+'px';
      var ic=sbtn.querySelector('.sg-blob-icon');
      if(ic){ var is=Math.round(bs*0.42); ic.style.width=is+'px'; ic.style.height=is+'px'; }
      sbtn.style.top=(by-2)+'%';                         // кнопка на уровне бара, чуть выше подписи
    }
    var nbtn=document.getElementById('sg-nextbtn');   // финальная оранжевая — того же размера
    if(nbtn){
      nbtn.style.width=bs+'px'; nbtn.style.height=bs+'px';
      var nic=nbtn.querySelector('.sg-blob-icon');
      if(nic){ var nis=Math.round(bs*0.45); nic.style.width=nis+'px'; nic.style.height=nis+'px'; }
    }
    var ebtn=document.getElementById('sg-endbtn');    // стеклянная — соразмерно (≈0.8 от оранжевой)
    if(ebtn){
      var es=Math.round(bs*0.795);
      ebtn.style.width=es+'px'; ebtn.style.height=es+'px';
      var eic=ebtn.querySelector('.sg-blob-icon');
      if(eic){ var eis=Math.round(es*0.44); eic.style.width=eis+'px'; eic.style.height=eis+'px'; }
    }
  }

  function applyLayout(){
    var m=pickMode();
    if(m!==mode){ mode=m; c=CFG[m]; setSceneBg(BG[m]); }
    bar.style.cssText='position:absolute;left:'+c.barL+'%;right:'+(100-c.barR)+'%;top:'+c.barY+'%;'+
      'height:'+c.barH+'%;transform:translateY(-50%);background:#D2E2FE;border-radius:999px;overflow:hidden;';
    drawAt(curX==null?c.startX:curX,0,0);
    syncScreens();
  }

  /* ── прогресс собачки привязан к реальной загрузке игры ── */
  var realProg=0, shownProg=0, finishing=false, finishCb=null, doneCalled=false;
  window.__uzorProgress=function(f){ if(f>realProg) realProg=Math.min(1,f); };
  window.__uzorFinish  =function(cb){ finishing=true; finishCb=cb||null; realProg=1; };
  function fire(){ if(!doneCalled){ doneCalled=true; if(finishCb) finishCb(); } }

  var t0=null;
  function loop(ts){
    if(root.offsetParent===null){ if(finishing) fire(); return; }   // загрузка скрыта — стоп
    if(t0===null)t0=ts;
    var t=(ts-t0)/1000;
    var step=(realProg-shownProg)*0.14;
    if(realProg>shownProg && step<0.006) step=0.006;   // чтобы не «ползла» слишком медленно
    shownProg+=step; if(shownProg>realProg) shownProg=realProg; if(shownProg>1) shownProg=1;
    curX=c.startX+(c.endX-c.startX)*shownProg;
    var s=Math.sin(t*Math.PI*2*1.6);                   // лёгкое покачивание на волне
    drawAt(curX, s*2.0, s*0.7);
    if(finishing && shownProg>=0.999){ fire(); return; }   // доплыла до конца → показываем старт
    requestAnimationFrame(loop);
  }

  applyLayout(); curX=c.startX; drawAt(curX,0,0);
  requestAnimationFrame(loop);
  window.addEventListener('resize', applyLayout);
})();


/* ===== основная логика игры ===== */
(function(){

/* ─── РЕПОЗИТОРИИ ─── */
const BASE  = 'https://cdn.jsdelivr.net/gh/pandora28546-lab/Colors@main/';           // всё для этой игры
const BASE2 = 'https://cdn.jsdelivr.net/gh/pandora28546-lab/sofia-game-image@main/'; // похвала Rock3–9
const DBASE = 'https://cdn.jsdelivr.net/gh/pandora28546-lab/Otvlekashki@main/';       // отвлекашки + эффекты
const G2    = 'https://cdn.jsdelivr.net/gh/pandora28546-lab/sofia-game2@main/';       // звезда + музыка

const STAR_URL  = G2 + 'Starsystems.png';
const MUSIC_URL = G2 + 'Music.m4a';
const MUSIC_BASE = G2;
const MUSIC_FILES = ['Music.m4a','Music2.m4a'];
const NEXT_GAME_URL = window.SG_NEXT_URL || 'https://sofiatmn.ru/';   /* ◀ адрес задаётся на странице Tilda через window.SG_NEXT_URL */

const PRAISE_FILES = ['Rock3.m4a','Rock4.m4a','Rock5.m4a','Rock6.m4a','Rock7.m4a','Rock8.m4a','Rock9.m4a'];

/* ─── ЦВЕТА: 6 объектов на цвет (IMG_….png) ─── */
const COLORS = {
  yellow:    ['1414','1415','1416','1419','1420','1421'],
  green:     ['1425','1428','1431','1433','1436','1437'],
  red:       ['1438','1439','1442','1444','1445','1448'],
  blue:      ['1451','1455','1457','1460','1462','1463'],
  orange:    ['1465','1466','1468','1471','1472','1474'],
  purple:    ['1481','1485','1486','1487','1489','1492'],
  pink:      ['1495','1496','1498','1499','1502','1503'],
  lightblue: ['1508','1510','1512','1514','1516','1517'],
  gray:      ['1535','1536','1537','1538','1541','1542'],
  black:     ['1544','1545','1546','1547','1548','1549'],
  brown:     ['1560','1562','1563','1564','1566','1567'],
  white:     ['1569','1571','1573','1574','1575','1577']
};
const LEARN = ['yellow','green'];  // этап 1 → жёлтый, этап 2 → зелёный
/* запрещённые (визуально похожие) соседние пары */
const FORBIDDEN = [['lightblue','blue'],['white','gray'],['gray','black'],['brown','orange']];

const KLYAKSA = { yellow: BASE+'Yellow.JPG', green: BASE+'Green.JPG' };

/* раскраски (этап 3, в.3–4): половинки IMG_16xx.png, полные 16xx.png */
const PAINT = { yellow: ['1621','1622'], green: ['1623','1624'] };

/* банки + жуки (этап 3, в.5) */
const JAR = { yellow: BASE+'IMG_1585.png', green: BASE+'IMG_1586.png' };
const BUG = { yellow: BASE+'1585.png',     green: BASE+'1586.png' };

/* зона внутри банки для жуков (% от рамки картинки банки) — по красной разметке, стекло без крышки */
const BUG_ZONE = { x0:0.06, x1:0.94, y0:0.24, y1:0.95 };

const ABA_STEPS = 4;   // вопросов на этапах 1 и 2

/* ─── URL-хелперы ─── */
function objImg(num){ return BASE + 'IMG_' + num + '.png'; }
function paintHalf(num){ return BASE + 'IMG_' + num + '.png'; }
function paintFull(num){ return BASE + num + '.png'; }
function colorAudio(n, color){ return BASE + n + (color==='yellow'?'yel':'green') + '.m4a'; }
const CONNECT_URL = BASE + 'Connect.m4a';

/* ─── ОТВЛЕКАШКИ (репозиторий Otvlekashki) ─── */
const DISTRACTORS = [
  { type:'tap_wiggle', name:'Apple' },{ type:'tap_wiggle', name:'Banana' },{ type:'tap_wiggle', name:'Carrot' },
  { type:'tap_wiggle', name:'Cucumber' },{ type:'tap_wiggle', name:'Onion' },{ type:'tap_wiggle', name:'Orange' },
  { type:'tap_wiggle', name:'Pear' },{ type:'tap_wiggle', name:'Tomato' },{ type:'tap_wiggle', name:'Ant' },
  { type:'tap_wiggle', name:'Boar' },{ type:'tap_wiggle', name:'Boots' },{ type:'tap_wiggle', name:'Cap' },
  { type:'tap_wiggle', name:'Caterpillar' },{ type:'tap_wiggle', name:'Dress' },{ type:'tap_wiggle', name:'Elk' },
  { type:'tap_wiggle', name:'Fox' },{ type:'tap_wiggle', name:'Gloves' },{ type:'tap_wiggle', name:'Jacket' },
  { type:'tap_wiggle', name:'Rabbit' },{ type:'tap_wiggle', name:'Snail' },{ type:'tap_wiggle', name:'Socks' },
  { type:'tap_wiggle', name:'Spider' },{ type:'tap_wiggle', name:'Squirrel' },{ type:'tap_wiggle', name:'Tshirt' },
  { type:'tap_wiggle', name:'Trousers' },{ type:'tap_wiggle', name:'Worm' },{ type:'tap_wiggle', name:'Rose' },
  { type:'tap_wiggle', name:'Wolf' },{ type:'tap_wiggle', name:'Butterfly' },{ type:'tap_wiggle', name:'Bee' },
  { type:'tap_wiggle', name:'Rocket' },{ type:'tap_wiggle', name:'Key' },{ type:'tap_wiggle', name:'Hedgehog' },
  { type:'tap_wiggle', name:'Threads' },{ type:'tap_wiggle', name:'Star' },{ type:'tap_wiggle', name:'Light' },
  { type:'sound_auto', name:'Car',     imgName:'Car' },{ type:'sound_auto', name:'Chicken', imgName:'Chicken' },
  { type:'sound_auto', name:'Cow',     imgName:'Cow' },{ type:'sound_auto', name:'Horse',   imgName:'Hors' },
  { type:'sound_auto', name:'Train',   imgName:'Train' },{ type:'sound_auto', name:'Goose',   imgName:'Goose' },
  { type:'sound_auto', name:'Pig',     imgName:'Pig' },{ type:'sound_auto', name:'Ship',    imgName:'Ship' },
  { type:'sound_auto', name:'Frog',    imgName:'Frog' },{ type:'sound_auto', name:'Duck',    imgName:'Duck' },
  { type:'sound_auto', name:'Goat',    imgName:'Goat' },{ type:'sound_auto', name:'Bike',    imgName:'Bike' },
  { type:'sound_auto', name:'Rooster', imgName:'Rooster' },{ type:'sound_auto', name:'Snake',   imgName:'Snake' },
  { type:'sound_auto', name:'Turkey',  imgName:'Turkey' },{ type:'sound_auto', name:'Bear',    imgName:'Bear' },
  { type:'puzzle', name:'1', leftExt:'jpeg', rightExt:'jpeg' },{ type:'puzzle', name:'2', leftExt:'png', rightExt:'jpeg' },
  { type:'puzzle', name:'3', leftExt:'png', rightExt:'jpeg' },{ type:'puzzle', name:'4', leftExt:'png', rightExt:'jpeg' },
  { type:'puzzle', name:'5', leftExt:'png', rightExt:'jpeg' },{ type:'puzzle', name:'6', leftExt:'png', rightExt:'jpeg' },
  { type:'puzzle', name:'7', leftExt:'png', rightExt:'jpeg' },{ type:'puzzle', name:'8', leftExt:'png', rightExt:'jpeg' },
  { type:'puzzle', name:'9',  leftExt:'JPG', rightExt:'JPG' },{ type:'puzzle', name:'10', leftExt:'JPG', rightExt:'JPG' },
  { type:'puzzle', name:'11', leftExt:'png', rightExt:'png' },{ type:'puzzle', name:'12', leftExt:'png', rightExt:'JPG' },
  { type:'puzzle', name:'13', leftExt:'png', rightExt:'JPG' },{ type:'puzzle', name:'14', leftExt:'png', rightExt:'JPG' }
];

/* ═══════════ AUDIO (HTML5 <audio>, blob в память) ═══════════ */
let soundOn = true;
const objUrls = {};
function srcFor(url){ return objUrls[url] || url; }

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
let speechEl = null;
function getSpeechEl(){ if(!speechEl){ speechEl = new Audio(); speechEl.preload='auto'; } return speechEl; }

const EFFECT_POOL_SIZE = 4;
let effectPool = [], effectIdx = 0;
function getEffectPool(){ if(effectPool.length===0){ for(let i=0;i<EFFECT_POOL_SIZE;i++){ const a=new Audio(); a.preload='auto'; effectPool.push(a); } } return effectPool; }

function unlockAll(){
  const els = [getSpeechEl()].concat(getEffectPool());
  els.forEach(a=>{ try { a.src=SILENT_WAV; const p=a.play(); if(p&&p.then) p.then(()=>{ try{a.pause();a.currentTime=0;}catch(e){} }).catch(()=>{}); } catch(e){} });
}

let speechTimer=null, speechSeq=0;
function stopCurrentAudio(){ speechSeq++; if(speechTimer){ clearTimeout(speechTimer); speechTimer=null; } if(speechEl){ speechEl.onended=null; speechEl.onerror=null; try{ speechEl.pause(); }catch(e){} } }

function playVoice(url, onDone){
  stopCurrentAudio();
  if(!soundOn){ if(onDone) setTimeout(onDone,0); return; }
  const myId = speechSeq;
  function finish(){ if(myId!==speechSeq) return; speechSeq++; if(speechTimer){ clearTimeout(speechTimer); speechTimer=null; } if(onDone) onDone(); }
  const a = getSpeechEl();
  a.onended = ()=>{ a.onended=null; a.onerror=null; finish(); };
  a.onerror = ()=>{ a.onended=null; a.onerror=null; finish(); };
  speechTimer = setTimeout(finish, 8000);
  try { a.src = srcFor(url); a.currentTime = 0; } catch(e){}
  const p = a.play();
  if(p && p.catch) p.catch(()=>finish());
}
function playColor(n, color, onDone){ playVoice(colorAudio(n,color), onDone); }
function playPraise(onDone){ playVoice(BASE2 + PRAISE_FILES[Math.floor(Math.random()*PRAISE_FILES.length)], onDone); }
function playItemAudio(name, onDone){ playVoice(DBASE + name + '.m4a', onDone); }

function playEffect(file){
  if(!soundOn) return;
  const url = DBASE + encodeURIComponent(file);
  const pool = getEffectPool();
  const a = pool[effectIdx]; effectIdx = (effectIdx+1) % pool.length;
  a.onended = ()=>{ a.onended=null; };
  try { a.src = srcFor(url); a.currentTime = 0; } catch(e){}
  const p = a.play();
  if(p && p.catch) p.catch(()=>{});
}
function playCorrect()           { playEffect('correct.wav'); }
function playWrong()             { playEffect('wrong.wav'); }
function playDistractorCorrect() { playEffect('distractor correct.wav'); }
function playStageComplete()     { playEffect('stage complete.wav'); }
function playFanfare()           { playEffect('fanfare.wav'); }

/* ─── PRELOAD: essential блокирует старт, остальное грузится фоном ─── */
const keepImgs = [];

const ESS_IMGS = [KLYAKSA.yellow, KLYAKSA.green, STAR_URL, JAR.yellow, JAR.green, BUG.yellow, BUG.green];
COLORS.yellow.forEach(n => ESS_IMGS.push(objImg(n)));
COLORS.green.forEach(n => ESS_IMGS.push(objImg(n)));
['yellow','green'].forEach(c => PAINT[c].forEach(n => ESS_IMGS.push(paintHalf(n), paintFull(n))));
const essImgs = [...new Set(ESS_IMGS)];

function essAudioUrls(){
  const s = new Set();
  ['yellow','green'].forEach(c => { [1,2,3,4,5].forEach(n => s.add(colorAudio(n,c))); });
  s.add(CONNECT_URL);
  PRAISE_FILES.forEach(f => s.add(BASE2 + f));
  ['correct.wav','wrong.wav','distractor correct.wav','stage complete.wav','fanfare.wav'].forEach(f => s.add(DBASE + encodeURIComponent(f)));
  return [...s];
}
const essAudio = essAudioUrls();

let loaded = 0, total = essImgs.length + essAudio.length;
const bar = document.getElementById('sg-loadBar');
let loadRevealed = false;
function revealStart(){
  if(loadRevealed) return; loadRevealed = true;
  document.getElementById('sg-loading').style.display='none';
  document.getElementById('sg-start-overlay').style.display='flex';
}
function tick(){
  loaded++;
  const f = loaded/total;
  if(bar) bar.style.width = Math.round(f*100) + '%';
  if(window.__uzorProgress) window.__uzorProgress(f);
  if(loaded >= total){
    if(window.__uzorFinish) window.__uzorFinish(revealStart);
    else setTimeout(revealStart, 300);
  }
}

essAudio.forEach(url => { fetch(url).then(r=>r.blob()).then(b=>{ try{ objUrls[url]=URL.createObjectURL(b); }catch(e){} tick(); }).catch(()=>{ tick(); }); });
essImgs.forEach(u => { const im=new Image(); im.onload=im.onerror=tick; im.src=u; keepImgs.push(im); });

/* фоновая догрузка (не блокирует старт): остальные цвета, отвлекашки, музыка */
function backgroundLoad(){
  Object.keys(COLORS).forEach(c => { if(c!=='yellow' && c!=='green') COLORS[c].forEach(n => { const im=new Image(); im.src=objImg(n); keepImgs.push(im); }); });
  DISTRACTORS.forEach(d => {
    if(d.type==='tap_wiggle' || d.type==='sound_auto'){
      const im=new Image(); im.src=DBASE+(d.imgName||d.name)+'.png'; keepImgs.push(im);
      const au=DBASE+d.name+'.m4a'; fetch(au).then(r=>r.blob()).then(b=>{ try{ objUrls[au]=URL.createObjectURL(b); }catch(e){} }).catch(()=>{});
    } else if(d.type==='puzzle'){
      const iL=new Image(); iL.src=DBASE+d.name+'l.'+d.leftExt; const iR=new Image(); iR.src=DBASE+d.name+'r.'+d.rightExt; keepImgs.push(iL,iR);
    }
  });
  MUSIC_FILES.forEach(f=>{ const u=MUSIC_BASE+f; fetch(u).then(r=>r.blob()).then(b=>{ try{ objUrls[u]=URL.createObjectURL(b); }catch(e){} }).catch(()=>{}); });
  fetch(BASE2+'Rock12.m4a').then(r=>r.blob()).then(b=>{ try{ objUrls[BASE2+'Rock12.m4a']=URL.createObjectURL(b); }catch(e){} }).catch(()=>{});   /* «попробуй ещё раз» */
}
backgroundLoad();

/* ─── DOM ─── */
const $ = id => document.getElementById(id);
function shuffle(a){ return [...a].sort(()=>Math.random()-.5); }

/* ─── СОСТОЯНИЕ ─── */
let currentStage = 0;      // 0 жёлтый, 1 зелёный, 2 — этап 3
let curColor     = 'yellow';
let abaStep      = 0;
let scoreCorrect = 0, scoreWrong = 0;
let answered     = false;
let phase        = 'q';    // 'hint' | 'q' | 'paint' | 'banks' | 'distr'
let correctPos   = 0;
let isRelearn    = false;
let relearnQueue = [];
let starsEarned  = [false,false,false];
let usedObj      = new Set();
let currentDistractorAudio = null;

/* этап 3 */
let stage3Plan = [], stage3Idx = 0, curPaint = null;

/* ─── КАРТОЧКИ ─── */
function setCardImg(pos, url){ $('sg-img'+pos).src = url; }

function cardReset(i){
  const c=$('sg-card'+i);
  c.style.border='2.5px solid #D3E2FF'; c.style.animation=''; c.classList.remove('sg-disabled');
  $('sg-ov'+i).style.cssText='';
  const ic=$('sg-icon'+i); ic.style.display='none'; ic.textContent='';
}
function resetCards(){ cardReset(0); cardReset(1); }
function lockCards()  { $('sg-card0').classList.add('sg-disabled'); $('sg-card1').classList.add('sg-disabled'); }
function unlockCards(){ $('sg-card0').classList.remove('sg-disabled'); $('sg-card1').classList.remove('sg-disabled'); }

function cardCorrect(i){
  $('sg-card'+i).style.border='2.5px solid #5BAD7A';
  $('sg-ov'+i).style.cssText='position:absolute;inset:0;background:rgba(91,173,122,0.22);z-index:2;pointer-events:none;';
  const ic=$('sg-icon'+i); ic.style.cssText='display:flex;background:#5BAD7A;z-index:3;'; ic.textContent='✓';
}
function cardWrong(i){
  $('sg-card'+i).style.cssText='border:2.5px solid #D95B5B;background:white;animation:sg-shake .4s ease;';
  $('sg-ov'+i).style.cssText='position:absolute;inset:0;background:rgba(217,91,91,0.22);z-index:2;pointer-events:none;';
  const ic=$('sg-icon'+i); ic.style.cssText='display:flex;background:#D95B5B;z-index:3;'; ic.textContent='✗';
}

/* ─── ПАНЕЛИ ─── */
function showPane(which){
  $('sg-cards').style.display     = which==='cards' ? 'flex' : 'none';
  $('sg-distrWrap').style.display = which==='distr' ? 'flex' : 'none';
  $('sg-banksWrap').style.display = which==='banks' ? 'block' : 'none';
}

/* ─── ПРОГРЕСС / СЧЁТ ─── */
function updateProgressLearn(){ $('sg-progressBar').style.width = Math.round(abaStep/ABA_STEPS*100)+'%'; }
function updateProgressStage3(){ $('sg-progressBar').style.width = Math.round(stage3Idx/5*100)+'%'; }
function updateScore(){ $('sg-scoreCorrect').textContent=scoreCorrect; $('sg-scoreWrong').textContent=scoreWrong; }

/* ─── ВЫБОР ОБЪЕКТОВ / ЦВЕТОВ ─── */
function pickFrom(color){
  const pool = COLORS[color].filter(n=>!usedObj.has(n));
  const arr = pool.length ? pool : COLORS[color];
  const n = arr[Math.floor(Math.random()*arr.length)];
  usedObj.add(n); return n;
}
function isForbidden(a,b){ return FORBIDDEN.some(p => (p[0]===a&&p[1]===b)||(p[0]===b&&p[1]===a)); }
function pickDistractorColor(target){
  const otherLearn = target==='yellow' ? 'green' : 'yellow';
  const cand = Object.keys(COLORS).filter(c => c!==target && c!==otherLearn && !isForbidden(c,target));
  return cand[Math.floor(Math.random()*cand.length)];
}

/* ═══════════ ЭТАПЫ 1–2 (учим цвет) ═══════════ */
function beginLearnStage(stageIdx, relearn){
  currentStage = stageIdx; curColor = LEARN[stageIdx];
  isRelearn = relearn; abaStep = 0;
  usedObj.clear();
  updateProgressLearn();
  showColorHint(()=> showLearnQuestion());
}

/* подсказка: одиночная клякса в окне отвлекашки, только аудио, тап по карточке — дальше */
function showColorHint(onDone){
  phase='hint'; answered=false;
  showPane('distr');
  const card=$('sg-distrCard');
  card.classList.remove('sg-puzzle'); card.classList.remove('sg-disabled');
  card.style.cssText='';
  $('sg-distrOv').style.cssText='';
  $('sg-distrIcon').style.cssText='display:none;'; $('sg-distrIcon').textContent='';
  const img=$('sg-distrImg');
  img.onload=null; img.removeAttribute('style');
  img.src = KLYAKSA[curColor];
  playColor(1, curColor, null);   // «это жёлтый/зелёный»
  function handler(){
    card.removeEventListener('click', handler);
    card.classList.add('sg-disabled');
    img.style.animation=''; stopCurrentAudio(); playDistractorCorrect();
    setTimeout(()=>{ img.src=''; if(onDone) onDone(); }, 350);
  }
  card.addEventListener('click', handler);
}

function showLearnQuestion(){
  phase='q'; answered=false;
  showPane('cards'); resetCards();
  const targetColor = curColor;
  const targetNum = pickFrom(targetColor);
  const distrColor = pickDistractorColor(targetColor);
  const distrNum   = pickFrom(distrColor);
  correctPos = Math.random()<.5 ? 0 : 1;
  setCardImg(correctPos, objImg(targetNum));
  setCardImg(1-correctPos, objImg(distrNum));
  unlockCards();
  updateProgressLearn();
  playColor(2, targetColor);   // «покажи жёлтый/зелёный»
}

function onLearnAnswer(pos){
  if(answered || phase!=='q') return;
  answered=true; lockCards();
  if(pos===correctPos){
    cardCorrect(pos); playCorrect(); scoreCorrect++; updateScore();
    playColor(4, curColor, ()=>{           // «это жёлтая» — подтверждение к основному вопросу
      playPraise(()=>{
        resetCards(); abaStep++; updateProgressLearn();
        if(abaStep>=ABA_STEPS) setTimeout(learnStageComplete, 400);
        else runDistractors(abaStep, ()=> showLearnQuestion());
      });
    });
  } else {
    cardWrong(pos); playWrong(); scoreWrong++; updateScore();
    setTimeout(()=>{ resetCards(); abaStep=0; updateProgressLearn(); showColorHint(()=> showLearnQuestion()); }, 900);
  }
}

function learnStageComplete(){
  if(isRelearn){
    relearnQueue.shift();
    if(relearnQueue.length) beginLearnStage(relearnQueue[0], true);
    else { isRelearn=false; beginStage3(); }
    return;
  }
  playStageComplete(); launchFireworks();
  flyBigStar(currentStage, ()=>{
    starsEarned[currentStage]=true;
    if(currentStage===0) beginLearnStage(1, false);
    else setTimeout(beginStage3, 200);
  });
}

/* ═══════════ ЭТАП 3 ═══════════ */
function buildStage3Plan(){
  const showOrder  = shuffle(['yellow','green']);
  const paintOrder = shuffle(['yellow','green']);
  const ys = shuffle(PAINT.yellow);
  const gs = shuffle(PAINT.green);
  return [
    { type:'show',  color:showOrder[0] },
    { type:'show',  color:showOrder[1] },
    { type:'paint', color:paintOrder[0], y:ys[0], g:gs[0] },
    { type:'paint', color:paintOrder[1], y:ys[1], g:gs[1] },
    { type:'banks' }
  ];
}
function beginStage3(){
  currentStage=2; curColor='yellow'; isRelearn=false;
  stage3Plan = buildStage3Plan(); stage3Idx=0;
  updateProgressStage3();
  runStage3Step();
}
function runStage3Step(){
  const step = stage3Plan[stage3Idx];
  if(step.type==='show')  showColorShowQuestion(step);
  else if(step.type==='paint') showPaintQuestion(step);
  else showBanksQuestion();
}
function stage3Advance(){
  stage3Idx++; updateProgressStage3();
  if(stage3Idx>=stage3Plan.length) stage3Complete();
  else runStage3Step();
}
function stage3Complete(){
  playFanfare(); launchFireworks();
  flyBigStar(2, ()=>{ starsEarned[2]=true; pulseAllStars(); setTimeout(()=>$('sg-end-overlay').classList.add('sg-show'), 1100); });
}
function stage3Error(which){
  if(phase==='banks') clearBanks();
  abaStep=0;
  if(which==='yellow') relearnQueue=[0];
  else if(which==='green') relearnQueue=[1];
  else relearnQueue=[0,1];
  isRelearn=true;
  playVoice(BASE2 + 'Rock12.m4a', ()=> beginLearnStage(relearnQueue[0], true));   // «попробуй ещё раз», затем доучиваем неверный цвет
}

/* этап 3, в.1–2: две кляксы, «покажи жёлтый/зелёный» */
function showColorShowQuestion(step){
  phase='q'; answered=false; curColor=step.color;
  showPane('cards'); resetCards();
  correctPos = Math.random()<.5 ? 0 : 1;
  setCardImg(correctPos, KLYAKSA[step.color]);
  setCardImg(1-correctPos, KLYAKSA[step.color==='yellow'?'green':'yellow']);
  unlockCards();
  updateProgressStage3();
  playColor(5, step.color);   // «покажи жёлтый цвет» (клякса)
}
function onStage3ShowAnswer(pos){
  if(answered || phase!=='q') return;
  answered=true; lockCards();
  if(pos===correctPos){
    cardCorrect(pos); playCorrect(); scoreCorrect++; updateScore();
    playColor(1, curColor, ()=> playPraise(()=>{ resetCards(); stage3Advance(); }));
  } else {
    cardWrong(pos); playWrong(); scoreWrong++; updateScore();
    setTimeout(()=>{ resetCards(); stage3Error(curColor); }, 900);
  }
}

/* этап 3, в.3–4: «раскрась» — две наполовину закрашенные, тап меняет на полную */
function showPaintQuestion(step){
  phase='paint'; answered=false; curColor=step.color; curPaint=step;
  showPane('cards'); resetCards();
  correctPos = Math.random()<.5 ? 0 : 1;
  const askNum   = step.color==='yellow' ? step.y : step.g;
  const otherNum = step.color==='yellow' ? step.g : step.y;
  setCardImg(correctPos, paintHalf(askNum));
  setCardImg(1-correctPos, paintHalf(otherNum));
  unlockCards();
  updateProgressStage3();
  playColor(3, step.color);   // «раскрась жёлтый/зелёный»
}
function onPaintAnswer(pos){
  if(answered || phase!=='paint') return;
  answered=true; lockCards();
  if(pos===correctPos){
    const askNum = curColor==='yellow' ? curPaint.y : curPaint.g;
    setCardImg(pos, paintFull(askNum));   // закрашиваем полностью, без зелёной рамки
    playCorrect(); scoreCorrect++; updateScore();
    playPraise(()=>{ resetCards(); stage3Advance(); });
  } else {
    cardWrong(pos); playWrong(); scoreWrong++; updateScore();
    setTimeout(()=>{ resetCards(); stage3Error(curColor); }, 900);
  }
}

/* ═══════════ ЭТАП 3, в.5: БАНКИ + ЖУКИ (перетаскивание) ═══════════ */
let bugs=[], jars=[], bugDrag=null, banksBusy=false, wanderRAF=null, parkedCount=0;
/* три уровня по высоте — жуки не стоят стопкой; вбок качаются живо */
const ANCHOR_Y = [-0.55, 0, 0.55];
const HAMP = 0.9;    // размах вбок (широкий, живой)
const VAMP = 0.32;   // размах вверх/вниз внутри своего уровня

function scaleK(){ return currentFsScale || 1; }
function bScene(){ return $('sg-banksScene'); }
function bRect(){ return bScene().getBoundingClientRect(); }
function bW(){ return bRect().width/scaleK(); }
function bH(){ return bRect().height/scaleK(); }
function bPointer(e){ const r=bRect(), p=(e.touches&&e.touches[0])?e.touches[0]:e; return { x:(p.clientX-r.left)/scaleK(), y:(p.clientY-r.top)/scaleK() }; }
function jarFieldRect(j){
  const sr=bRect(), jr=j.el.getBoundingClientRect(), k=scaleK();
  return { x0:(jr.left-sr.left)/k, y0:(jr.top-sr.top)/k, x1:(jr.right-sr.left)/k, y1:(jr.bottom-sr.top)/k, w:jr.width/k, h:jr.height/k };
}
function bugZone(jar, bug){
  const r=jarFieldRect(jar), k=scaleK();
  const bw=bug.el.getBoundingClientRect().width/k, bh=bug.el.getBoundingClientRect().height/k;
  const x0=r.x0+BUG_ZONE.x0*r.w, x1=r.x0+BUG_ZONE.x1*r.w;
  const y0=r.y0+BUG_ZONE.y0*r.h, y1=r.y0+BUG_ZONE.y1*r.h;
  let ax=(x1-x0)/2-bw/2; if(ax<0) ax=0;
  let ay=(y1-y0)/2-bh/2; if(ay<0) ay=0;
  return { cx:(x0+x1)/2, cy:(y0+y1)/2, ax, ay };
}

function isMobile(){ return window.innerWidth <= 540; }

function showBanksQuestion(){
  phase='banks'; showPane('banks');
  buildBanks();
  updateProgressStage3();
  playVoice(CONNECT_URL);   // «соедини подходящее»
}

function buildBanks(){
  const scene=bScene();
  scene.querySelectorAll('.sg-jar,.sg-bug').forEach(n=>n.remove());
  bugs=[]; jars=[]; parkedCount=0; banksBusy=false; bugDrag=null;
  const mob=isMobile();
  const jarW = mob?34:17, jarY = mob?76:74, leftX = mob?27:31, rightX = mob?73:69;
  const order = Math.random()<.5 ? ['yellow','green'] : ['green','yellow'];
  const jarX = [leftX, rightX];
  order.forEach((color,i)=>{
    const el=document.createElement('img'); el.className='sg-jar'; el.src=JAR[color];
    el.style.left=jarX[i]+'%'; el.style.top=jarY+'%'; el.style.width=jarW+'%'; el.setAttribute('draggable','false');
    scene.appendChild(el); jars.push({ color, el, filled:0 });
  });
  const bugColors = shuffle(['yellow','yellow','yellow','green','green','green']);
  const bugW = mob?22:9;
  const cols = mob?[24,50,76]:[26,50,74];
  const rows = mob?[11,29]:[9,26];
  const slots=[]; rows.forEach(ry=> cols.forEach(cx=> slots.push({x:cx,y:ry})));
  const sslots = shuffle(slots);
  bugColors.forEach((color,i)=>{
    const s=sslots[i];
    const el=document.createElement('img'); el.className='sg-bug sg-draggable'; el.src=BUG[color];
    el.style.left=s.x+'%'; el.style.top=s.y+'%'; el.style.width=bugW+'%'; el.setAttribute('draggable','false');
    scene.appendChild(el);
    const bug={ color, el, homePct:{x:s.x,y:s.y}, parked:false };
    bankAttachDrag(bug); bugs.push(bug);
  });
  startWander();
}

function bugHomeField(bug){ return { x:bug.homePct.x*bW()/100, y:bug.homePct.y*bH()/100 }; }

function bankAttachDrag(bug){
  function down(e){
    if(bug.parked || banksBusy) return;
    if(e.cancelable) e.preventDefault();
    const pf=bPointer(e), home=bugHomeField(bug);
    bug.grip={ x:pf.x-home.x, y:pf.y-home.y }; bug.home=home;
    bug.el.classList.add('sg-dragging'); bug.el.style.transition='';
    bugDrag=bug;
    document.addEventListener('touchmove', bMove, {passive:false});
    document.addEventListener('touchend',  bUp);
    document.addEventListener('mousemove', bMove);
    document.addEventListener('mouseup',   bUp);
  }
  bug.el.addEventListener('touchstart', down, {passive:false});
  bug.el.addEventListener('mousedown',  down);
}
function bMove(e){
  if(!bugDrag) return;
  if(e.cancelable) e.preventDefault();
  const pf=bPointer(e), bug=bugDrag;
  let cx=pf.x-bug.grip.x, cy=pf.y-bug.grip.y;
  cx=Math.max(0,Math.min(bW(),cx)); cy=Math.max(0,Math.min(bH(),cy));
  bug.dragCenter={x:cx,y:cy};
  bug.el.style.transform='translate(-50%,-50%) translate3d('+(cx-bug.home.x)+'px,'+(cy-bug.home.y)+'px,0)';
}
function bUp(){
  if(!bugDrag) return;
  const bug=bugDrag; bugDrag=null;
  document.removeEventListener('touchmove', bMove);
  document.removeEventListener('touchend',  bUp);
  document.removeEventListener('mousemove', bMove);
  document.removeEventListener('mouseup',   bUp);
  bug.el.classList.remove('sg-dragging');
  bankRelease(bug);
}
function bankRelease(bug){
  const c = bug.dragCenter || bugHomeField(bug);
  let hit=null;
  jars.forEach(j=>{ const r=jarFieldRect(j); if(c.x>=r.x0 && c.x<=r.x1 && c.y>=r.y0 && c.y<=r.y1) hit=j; });
  if(hit){
    if(hit.color===bug.color){ parkBug(bug, hit); return; }
    bankError(bug); return;
  }
  bug.el.style.transition='transform .3s ease';
  bug.el.style.transform='translate(-50%,-50%)';
  setTimeout(()=>{ bug.el.style.transition=''; }, 320);
}
function parkBug(bug, jar){
  bug.parked=true; bug.jar=jar;
  const idx=jar.filled % ANCHOR_Y.length; jar.filled++; parkedCount++;
  bug.anchorY=ANCHOR_Y[idx];
  bug.el.classList.remove('sg-draggable'); bug.el.classList.add('sg-parked');
  bug.el.style.transition='';
  bug.fx=0.55+Math.random()*0.55; bug.fy=0.48+Math.random()*0.50;
  bug.px=Math.random()*Math.PI*2;  bug.py=Math.random()*Math.PI*2;
  playDistractorCorrect();
  if(parkedCount>=bugs.length){ banksBusy=true; playPraise(()=> setTimeout(stage3Advance, 300)); }
}
function bankError(bug){
  if(banksBusy) return;
  banksBusy=true; scoreWrong++; updateScore(); playWrong();
  bug.el.style.transition='transform .3s ease';
  bug.el.style.transform='translate(-50%,-50%)';
  setTimeout(()=>{ stopWander(); stage3Error('banks'); }, 900);
}
function startWander(){
  if(wanderRAF) cancelAnimationFrame(wanderRAF);
  function frame(ts){
    const t=ts/1000, W=bW(), H=bH();
    for(let i=0;i<bugs.length;i++){
      const bug=bugs[i];
      if(!bug.parked) continue;
      const z=bugZone(bug.jar, bug);
      const baseY = z.cy + bug.anchorY*z.ay;
      const x = z.cx + z.ax*HAMP*Math.sin(t*bug.fx + bug.px);
      const y = baseY + z.ay*VAMP*Math.sin(t*bug.fy + bug.py);
      bug.el.style.left=(x/W*100)+'%';
      bug.el.style.top =(y/H*100)+'%';
      bug.el.style.transform='translate(-50%,-50%)';
    }
    wanderRAF=requestAnimationFrame(frame);
  }
  wanderRAF=requestAnimationFrame(frame);
}
function stopWander(){ if(wanderRAF){ cancelAnimationFrame(wanderRAF); wanderRAF=null; } }
function clearBanks(){
  stopWander();
  const scene=bScene(); scene.querySelectorAll('.sg-jar,.sg-bug').forEach(n=>n.remove());
  bugs=[]; jars=[]; parkedCount=0; banksBusy=false; bugDrag=null;
}

/* ═══════════ ОТВЛЕКАШКИ (между вопросами, этапы 1–2) ═══════════ */
let distractorDeck = [], lastDistractorType = null;
function getNextDistractors(count){
  const result=[];
  for(let i=0;i<count;i++){
    if(distractorDeck.length===0) distractorDeck = shuffle(DISTRACTORS.map((_,i)=>i));
    let idx=distractorDeck[0];
    if(DISTRACTORS[idx].type===lastDistractorType && distractorDeck.length>1){ distractorDeck.push(distractorDeck.shift()); idx=distractorDeck[0]; }
    distractorDeck.shift(); lastDistractorType=DISTRACTORS[idx].type; result.push(idx);
  }
  return result;
}
function runDistractors(count, onDone){
  if(count===0){ onDone(); return; }
  const pool=getNextDistractors(count); let i=0;
  function next(){ i>=pool.length ? onDone() : showDistractor(pool[i++], next); }
  next();
}
function showDistractor(dIdx, onDone){
  phase='distr'; currentDistractorAudio=null;
  $('sg-banksWrap').style.display='none';
  $('sg-cards').style.display='none';
  $('sg-distrWrap').style.display='flex';
  const d=DISTRACTORS[dIdx];
  $('sg-streakHint').textContent='';
  $('sg-distrOv').style.cssText='';
  $('sg-distrIcon').style.cssText='display:none;'; $('sg-distrIcon').textContent='';
  $('sg-distrCard').style.cssText=''; $('sg-distrCard').classList.remove('sg-disabled');
  $('sg-distrImg').style.animation='';

  function closeDistr(){
    $('sg-distrWrap').style.display='none';
    $('sg-cards').style.display='flex';
    $('sg-streakHint').textContent='';
    $('sg-distrImg').onload=null; $('sg-distrImg').removeAttribute('style'); $('sg-distrImg').src='';
    onDone();
  }

  if(d.type==='tap_wiggle'){
    $('sg-distrImg').src=DBASE+d.name+'.png';
    $('sg-distrImg').style.animation='sg-wiggle 0.6s ease-in-out infinite';
    currentDistractorAudio=d.name; playItemAudio(d.name, null);
    function handler(){ $('sg-distrCard').removeEventListener('click',handler); $('sg-distrCard').classList.add('sg-disabled'); $('sg-distrImg').style.animation=''; stopCurrentAudio(); playDistractorCorrect(); setTimeout(closeDistr,400); }
    $('sg-distrCard').addEventListener('click',handler);
  }

  if(d.type==='sound_auto'){
    $('sg-distrImg').src=DBASE+(d.imgName||d.name)+'.png';
    currentDistractorAudio=d.name; playItemAudio(d.name, null);
    function handler(){ $('sg-distrCard').removeEventListener('click',handler); $('sg-distrCard').classList.add('sg-disabled'); stopCurrentAudio(); playDistractorCorrect(); setTimeout(closeDistr,400); }
    $('sg-distrCard').addEventListener('click',handler);
  }

  if(d.type==='puzzle'){
    $('sg-distrCard').classList.add('sg-puzzle');
    const imgL=DBASE+d.name+'l.'+d.leftExt, imgR=DBASE+d.name+'r.'+d.rightExt;
    const card=$('sg-distrCard');
    const PH=(window.innerWidth<=540)?190:240;
    const EM=(window.innerWidth<=540)?4:28;
    let imgRight=document.getElementById('sg-puzzleRight');
    if(!imgRight){ imgRight=document.createElement('img'); imgRight.id='sg-puzzleRight'; card.appendChild(imgRight); }
    imgRight.src=imgR;
    imgRight.style.cssText='height:'+PH+'px;width:auto;position:absolute;left:0;top:50%;transform:translateY(-50%);pointer-events:none;display:block;visibility:hidden;';
    const iL=$('sg-distrImg'); iL.src=imgL;
    iL.style.cssText='height:'+PH+'px;width:auto;position:absolute;left:0;top:50%;transform:translateY(-50%);cursor:grab;display:block;pointer-events:auto;touch-action:none;visibility:hidden;';
    let snapLeft=0, seamX=0, isDrag=false, dragX=0, startL=0, puzzleDone=false, animId=null;
    function layout(){
      const MARGIN=EM, SEAM=0.5, k=getScale(); let h=PH;
      iL.style.height=h+'px'; imgRight.style.height=h+'px';
      let leftW=iL.getBoundingClientRect().width/k, rightW=imgRight.getBoundingClientRect().width/k;
      const cardW=card.offsetWidth, maxW=cardW-MARGIN*2;
      if(leftW+rightW>maxW && (leftW+rightW)>0){ h=Math.floor(h*maxW/(leftW+rightW)); iL.style.height=h+'px'; imgRight.style.height=h+'px'; leftW=iL.getBoundingClientRect().width/k; rightW=imgRight.getBoundingClientRect().width/k; }
      const total=leftW+rightW;
      snapLeft=cardW-total-MARGIN; if(snapLeft<EM) snapLeft=EM;
      seamX=snapLeft+leftW;
      imgRight.style.left=(seamX-SEAM)+'px'; iL.style.left=EM+'px';
      imgRight.style.visibility='visible'; iL.style.visibility='visible';
      startAnim();
    }
    function eio(t){ return t<0.5?2*t*t:-1+(4-2*t)*t; }
    function eiq(t){ return t*t; }
    function startAnim(){
      if(animId) cancelAnimationFrame(animId);
      const hintMax=Math.max(0,Math.min((snapLeft-EM)*0.4,95));
      const FWD=1400, RET=300, PAUSE=450;
      let ph='fwd', p=0, pauseUntil=0, last=0;
      function step(ts){
        if(isDrag||puzzleDone){ animId=null; return; }
        if(!last) last=ts; let dt=ts-last; last=ts; if(dt>100) dt=100;
        if(ph==='pause'){ if(ts>=pauseUntil) ph='ret'; }
        else if(ph==='fwd'){ p+=dt/FWD; if(p>=1){ p=1; ph='pause'; pauseUntil=ts+PAUSE; } }
        else { p-=dt/RET; if(p<=0){ p=0; ph='fwd'; } }
        const e=(ph==='ret')?eiq(p):eio(p);
        iL.style.left=(EM+e*hintMax)+'px';
        animId=requestAnimationFrame(step);
      }
      animId=requestAnimationFrame(step);
    }
    function stopAnim(){ if(animId){ cancelAnimationFrame(animId); animId=null; } }
    let tmv, tup, mmv, mup, onTS, onMD;
    function snapAndClose(){
      if(puzzleDone) return;
      iL.style.left=snapLeft+'px'; puzzleDone=true; stopAnim();
      document.removeEventListener('touchmove',tmv); document.removeEventListener('touchend',tup);
      document.removeEventListener('mousemove',mmv); document.removeEventListener('mouseup',mup);
      iL.removeEventListener('touchstart',onTS); iL.removeEventListener('mousedown',onMD);
      stopCurrentAudio(); playDistractorCorrect();
      setTimeout(()=>{ const pz=document.getElementById('sg-puzzleRight'); if(pz) pz.remove(); iL.removeAttribute('style'); $('sg-distrCard').classList.remove('sg-puzzle'); closeDistr(); }, 500);
    }
    function doMove(x){ if(!isDrag) return; const nl=Math.max(EM,Math.min(snapLeft,startL+(x-dragX)/getScale())); iL.style.left=nl+'px'; }
    function doUp(){ if(!isDrag) return; isDrag=false; iL.style.cursor='grab'; const cur=parseFloat(iL.style.left); if(snapLeft>0 && cur>=snapLeft-5){ snapAndClose(); } else { iL.style.transition='left 0.3s'; iL.style.left=EM+'px'; setTimeout(()=>{ iL.style.transition=''; if(!puzzleDone) startAnim(); },320); } }
    onTS=e=>{ e.stopPropagation(); e.preventDefault(); if(puzzleDone) return; stopAnim(); isDrag=true; dragX=e.touches[0].clientX; startL=parseFloat(iL.style.left)||0; iL.style.cursor='grabbing'; };
    iL.addEventListener('touchstart',onTS,{passive:false});
    tmv=e=>{ if(!isDrag) return; e.preventDefault(); doMove(e.touches[0].clientX); };
    tup=()=>doUp();
    document.addEventListener('touchmove',tmv,{passive:false}); document.addEventListener('touchend',tup);
    onMD=e=>{ if(puzzleDone) return; stopAnim(); isDrag=true; dragX=e.clientX; startL=parseFloat(iL.style.left)||0; iL.style.cursor='grabbing'; };
    iL.addEventListener('mousedown',onMD);
    mmv=e=>{ if(!isDrag) return; doMove(e.clientX); };
    mup=()=>doUp();
    document.addEventListener('mousemove',mmv); document.addEventListener('mouseup',mup);
    let laidOut=false;
    function tryLayout(){ if(laidOut) return; if(iL.complete && iL.naturalWidth && imgRight.complete && imgRight.naturalWidth){ laidOut=true; requestAnimationFrame(()=>requestAnimationFrame(layout)); } }
    iL.onload=tryLayout; imgRight.onload=tryLayout; tryLayout();
  }
}

/* ─── ЗВЁЗДЫ ─── */
const starBacks=[...document.querySelectorAll('#sofia-game .sg-starback')];
document.querySelectorAll('#sofia-game .sg-starsym').forEach(im => { im.src=STAR_URL; });
document.getElementById('sofia-game').style.setProperty('--sg-star-mask', 'url("' + STAR_URL + '")');
$('sg-bigstar-img').src=STAR_URL;
function resetStars(){ starBacks.forEach(b=>{ b.classList.remove('sg-earned'); b.classList.remove('sg-pulse'); }); }
function pulseAllStars(){ starBacks.forEach((b,i)=>{ setTimeout(()=>{ b.classList.remove('sg-pulse'); void b.offsetWidth; b.classList.add('sg-pulse'); }, i*180); }); }
function flyBigStar(slot, cb){
  const back=starBacks[slot]; if(!back){ if(cb) cb(); return; }
  const k=getScale();
  const gr=$('sofia-game').getBoundingClientRect(), br=back.getBoundingClientRect();
  const cx=gr.left+gr.width/2, cy=gr.top+gr.height/2;
  const dx=((br.left+br.width/2)-cx)/k, dy=((br.top+br.height/2)-cy)/k;
  const big=$('sg-bigstar');
  big.style.transition='none'; big.style.opacity='1'; big.style.display='block';
  big.style.transform='translate(-50%,-50%) scale(0)';
  requestAnimationFrame(()=>{
    big.style.transition='transform .45s cubic-bezier(.34,1.56,.64,1)';
    big.style.transform='translate(-50%,-50%) scale(1)';
    setTimeout(()=>{
      const bigW=big.offsetWidth||160, sEnd=Math.max(0.05,(br.width/k)/bigW);
      big.style.transition='transform .7s ease';
      big.style.transform='translate(calc(-50% + '+dx+'px), calc(-50% + '+dy+'px)) scale('+sEnd+')';
      setTimeout(()=>{ back.classList.add('sg-earned'); big.style.display='none'; if(cb) cb(); }, 720);
    }, 600);
  });
}

/* ─── ПЕРЕЗАПУСК ─── */
function restartAll(){
  $('sg-end-overlay').classList.remove('sg-show'); stopFireworks(); clearBanks();
  currentStage=0; abaStep=0; scoreCorrect=0; scoreWrong=0;
  isRelearn=false; relearnQueue=[]; starsEarned=[false,false,false];
  usedObj.clear(); resetStars(); updateScore();
  beginLearnStage(0, false);
}

/* ─── FIREWORKS ─── */
const canvas=$('sg-fireworks'), c2d=canvas.getContext('2d');
let fwP=[], fwRun=false, fwRaf=null;
function launchFireworks(){ const box=$('sofia-game'); canvas.width=box.offsetWidth; canvas.height=box.offsetHeight; if(fwRaf) cancelAnimationFrame(fwRaf); fwP=[]; fwRun=true; spawnBurst(); spawnBurst(); fwLoop(); setTimeout(()=>fwRun=false,1500); }
function stopFireworks(){ fwRun=false; cancelAnimationFrame(fwRaf); c2d.clearRect(0,0,canvas.width,canvas.height); }
function spawnBurst(){ const x=.2+Math.random()*.6, y=.1+Math.random()*.5; const cols=['#6DCC0B','#F97A4F','#FED224','#E4615C','#6B91D6','#FC88A7']; const col=cols[Math.floor(Math.random()*cols.length)]; for(let i=0;i<60;i++){ const a=Math.random()*Math.PI*2, s=2+Math.random()*5; fwP.push({x:canvas.width*x,y:canvas.height*y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,alpha:1,color:col,r:2+Math.random()*3}); } }
function fwLoop(){ c2d.clearRect(0,0,canvas.width,canvas.height); fwP.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.alpha-=.018;c2d.globalAlpha=Math.max(0,p.alpha);c2d.beginPath();c2d.arc(p.x,p.y,p.r,0,Math.PI*2);c2d.fillStyle=p.color;c2d.fill();}); c2d.globalAlpha=1; fwP=fwP.filter(p=>p.alpha>0); if(fwRun&&fwP.length<100) spawnBurst(); if(fwP.length>0||fwRun) fwRaf=requestAnimationFrame(fwLoop); else c2d.clearRect(0,0,canvas.width,canvas.height); }

/* ─── ФОНОВАЯ МУЗЫКА ─── */
let musicPlaylist = [];
let musicIdx      = 0;
let musicEl=null;
function getMusicEl(){
  if(!musicEl){
    musicEl=new Audio(); musicEl.preload='auto'; musicEl.loop=false; musicEl.volume=0.2;
    musicEl.addEventListener('ended', ()=>{ if(!musicPlaylist.length) return; musicIdx=(musicIdx+1)%musicPlaylist.length; playCurrentTrack(); });
  }
  return musicEl;
}
let musicShouldPlay=false;
function playCurrentTrack(){
  const m=getMusicEl();
  try{ m.src=srcFor(MUSIC_BASE+musicPlaylist[musicIdx]); m.currentTime=0; }catch(e){}
  const p=m.play(); if(p&&p.catch) p.catch(()=>{});
}
function startMusic(){
  musicShouldPlay=true;
  musicPlaylist=shuffle(MUSIC_FILES);
  musicIdx=0;
  playCurrentTrack();
}
$('sg-music').addEventListener('click', ()=>{ const m=getMusicEl(); m.muted=!m.muted; $('sg-music').classList.toggle('sg-off', m.muted); if(!m.muted && musicShouldPlay && m.paused && !document.hidden){ const p=m.play(); if(p&&p.catch) p.catch(()=>{}); } });
function pauseMusicBg(){ if(musicEl){ try{ musicEl.pause(); }catch(e){} } }
function resumeMusicBg(){ const m=getMusicEl(); if(musicShouldPlay && !m.muted && m.paused){ const p=m.play(); if(p&&p.catch) p.catch(()=>{}); } }
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) pauseMusicBg(); else resumeMusicBg(); });
window.addEventListener('pagehide', pauseMusicBg);
window.addEventListener('blur', pauseMusicBg);
window.addEventListener('focus', ()=>{ if(!document.hidden) resumeMusicBg(); });

/* ─── ПОЛНОЭКРАННЫЙ РЕЖИМ ─── */
const fsWrap=$('sg-fs-wrap'), rotEl=$('sg-rotate');
const canRealFS=!!(fsWrap.requestFullscreen || fsWrap.webkitRequestFullscreen);
let pseudoFS=false, currentFsScale=1;
function getScale(){ return currentFsScale||1; }
function applyFsScale(){
  const g=$('sofia-game');
  if(!isFS()){ g.style.transform=''; currentFsScale=1; return; }
  const baseW=820, baseH=820*2/3, vw=window.innerWidth, vh=window.innerHeight;
  const k=Math.max(0.1, Math.min(vw*0.97/baseW, vh*0.97/baseH));
  currentFsScale=k; g.style.transform='scale('+k+')';
}
function isLandscape(){ return window.matchMedia('(orientation: landscape)').matches || window.innerWidth>window.innerHeight; }
function isPhone(){ return Math.min(window.screen.width, window.screen.height) < 480; }
function inRealFS(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function isFS(){ return pseudoFS || inRealFS(); }
const FS_ICON_EXPAND='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2B3A5C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14,4 20,4 20,10"/><line x1="20" y1="4" x2="13.5" y2="10.5"/><polyline points="10,20 4,20 4,14"/><line x1="4" y1="20" x2="10.5" y2="13.5"/></svg>';
const FS_ICON_COLLAPSE='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2B3A5C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="20" y1="4" x2="14" y2="10"/><polyline points="14,4 14,10 20,10"/><line x1="4" y1="20" x2="10" y2="14"/><polyline points="10,20 10,14 4,14"/></svg>';
function setFsIcon(){ $('sg-fs').innerHTML = isFS() ? FS_ICON_COLLAPSE : FS_ICON_EXPAND; }
function lockLandscape(){ try{ if(screen.orientation && screen.orientation.lock){ const p=screen.orientation.lock('landscape'); if(p&&p.catch) p.catch(()=>{}); } }catch(e){} }
function unlockOrientation(){ try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){} }
function showRotate(){ rotEl.classList.add('sg-show'); }
function hideRotate(){ rotEl.classList.remove('sg-show'); }
function updateRotate(){ if(pseudoFS && isPhone() && !isLandscape()) showRotate(); else hideRotate(); }
function enterPseudo(){ if(pseudoFS) return; pseudoFS=true; fsWrap.classList.add('sg-pseudo-fs'); document.documentElement.style.overflow='hidden'; document.body.style.overflow='hidden'; updateRotate(); setFsIcon(); applyFsScale(); }
function enterFS(){ if(canRealFS){ const req=fsWrap.requestFullscreen||fsWrap.webkitRequestFullscreen; try{ const p=req.call(fsWrap); if(p&&p.then) p.then(lockLandscape).catch(()=>enterPseudo()); else lockLandscape(); }catch(e){ enterPseudo(); } } else { enterPseudo(); } }
function exitFS(){ if(inRealFS()){ const ex=document.exitFullscreen||document.webkitExitFullscreen; try{ ex.call(document); }catch(e){} unlockOrientation(); } if(pseudoFS){ pseudoFS=false; fsWrap.classList.remove('sg-pseudo-fs'); document.documentElement.style.overflow=''; document.body.style.overflow=''; hideRotate(); } setFsIcon(); applyFsScale(); }
function toggleFS(){ if(isFS()) exitFS(); else enterFS(); }
$('sg-fs').addEventListener('click', toggleFS);
$('sg-rot-x').addEventListener('click', exitFS);
document.addEventListener('fullscreenchange', ()=>{ if(!inRealFS()) unlockOrientation(); setFsIcon(); applyFsScale(); });
document.addEventListener('webkitfullscreenchange', ()=>{ if(!inRealFS()) unlockOrientation(); setFsIcon(); applyFsScale(); });
window.addEventListener('orientationchange', ()=>{ setTimeout(()=>{ updateRotate(); applyFsScale(); }, 250); });
window.addEventListener('resize', ()=>{ if(isFS()) applyFsScale(); });

/* ─── СОБЫТИЯ ─── */
$('sg-nextbtn').addEventListener('click', ()=>{ try{ window.top.location.href=NEXT_GAME_URL; }catch(e){ window.location.href=NEXT_GAME_URL; } });
$('sg-endbtn').addEventListener('click', restartAll);

function onCardTap(pos){
  if(phase==='q'){ if(currentStage===2) onStage3ShowAnswer(pos); else onLearnAnswer(pos); }
  else if(phase==='paint'){ onPaintAnswer(pos); }
}
$('sg-card0').addEventListener('click', ()=> onCardTap(0));
$('sg-card1').addEventListener('click', ()=> onCardTap(1));

$('sg-repeatBtn').addEventListener('click', ()=>{
  if(phase==='hint')      playColor(1, curColor);
  else if(phase==='q')    playColor(currentStage===2?5:2, curColor);
  else if(phase==='paint')playColor(3, curColor);
  else if(phase==='banks')playVoice(CONNECT_URL);
  else if(phase==='distr' && currentDistractorAudio) playItemAudio(currentDistractorAudio);
});

$('sg-start-btn').addEventListener('click', ()=>{
  $('sg-start-overlay').style.display='none';
  unlockAll(); startMusic();
  currentStage=0; abaStep=0; scoreCorrect=0; scoreWrong=0;
  isRelearn=false; relearnQueue=[]; starsEarned=[false,false,false];
  usedObj.clear(); resetStars(); updateScore();
  beginLearnStage(0, false);
});

})();
