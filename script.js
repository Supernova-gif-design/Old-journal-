/* =========================================================
   The Nameless Chronicle: Blue Rune Interactive Journal
   Author: Vaelin Thorne (DM)
   Purpose: Handles ambient sounds, rune unlocking, dynamic seals,
            scare responses, secret events, and final seal activation.
   ========================================================= */

/* === GLOBAL AMBIENT SOUND === */
// Plays faint environmental ambience on the user's first click.
window.addEventListener('click', () => {
  if (window._ambient_audio) return;
  const amb = new Audio('assets/sounds/fire-effect-367659.mp3');
  amb.loop = true;
  amb.volume = 0.25;
  amb.play().catch(()=>{});
  window._ambient_audio = amb;
}, { once: true });

/* === CORE DOM ELEMENTS === */
const sealOverlay = document.createElement('div');
sealOverlay.className = 'seal hidden';
sealOverlay.innerHTML = `<div class="rune"></div>`;
document.body.appendChild(sealOverlay);

const scareOverlay = document.createElement('div');
scareOverlay.className = 'scare hidden';
scareOverlay.innerHTML = `<div class="scare-text">You're not supposed to be here.</div>`;
document.body.appendChild(scareOverlay);

/* === AUDIO EFFECTS === */
const sfx = {
  seal: new Audio('assets/sounds/creepy-whispering-6690.mp3'),
  scare: new Audio('assets/sounds/fire-effect-367659.mp3'),
  pageTurn: new Audio('assets/sounds/page_turn.mp3') // optional custom sound
};
sfx.seal.volume = 0.5;
sfx.scare.volume = 0.6;
if (sfx.pageTurn) sfx.pageTurn.volume = 0.3;

/* === RUNE AND ENTRY SYSTEM === */
// These codes represent unlocks tied to your campaign's planes, gods, and secrets.
const RUNE_CODES = {
  "oceanus": ["plane_water_1.html","plane_water_2.html","plane_water_3.html"],
  "auric": ["plane_fire_1.html","plane_fire_2.html","plane_fire_3.html"],
  "dawnfall": ["plane_air_1.html","plane_air_2.html","plane_air_3.html"],
  "abyssal": ["plane_abyss_1.html","plane_abyss_2.html"],
  "templeveil": ["god_koriel_myth.html","god_koriel_fall.html"],
  "stormcrown": ["field_08.html","secret_stormvault.html"],
  "vaelinthorne": ["true_ending.html"]
};
const ALWAYS_UNLOCKED = new Set(["plane_water_1.html","plane_water_2.html","plane_water_3.html"]);

/* === UTILITY FUNCTIONS === */
function isUnlocked(file){ return ALWAYS_UNLOCKED.has(file) || !!localStorage.getItem("u_"+file); }
function unlockFiles(list){ list.forEach(f=> localStorage.setItem("u_"+f,"1")); }

/* === SEAL ANIMATION === */
function showSeal(){
  sealOverlay.classList.remove('hidden');
  setTimeout(()=> sealOverlay.classList.add('show'), 30);
  sfx.seal.currentTime = 0;
  sfx.seal.play().catch(()=>{});
}
function hideSeal(){
  sealOverlay.classList.remove('show');
  setTimeout(()=> sealOverlay.classList.add('hidden'), 900);
}

/* === SCARE REACTION === */
function playScare(){
  scareOverlay.classList.remove('hidden');
  setTimeout(()=> scareOverlay.classList.add('on'), 50);
  sfx.scare.currentTime = 0;
  sfx.scare.play().catch(()=>{});

  // AudioContext fallback for a quick shock if browsers block audio.
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 190;
    gain.gain.setValueAtTime(1.0, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.45);
  } catch(e) {}

  setTimeout(()=>{
    scareOverlay.classList.remove('on');
    setTimeout(()=> scareOverlay.classList.add('hidden'), 500);
  }, 900);
}

/* === RUNE ENTRY HANDLER === */
function attemptRune(){
  const input = document.getElementById('runeInput');
  const word = (input.value || '').toLowerCase().trim();
  if(!word) return;

  // Secret name override
  if(word === 'vaelinthorne'){
    document.querySelectorAll('.pages a.page-link').forEach(a=>{
      const f = a.href.split('/').slice(-1)[0];
      localStorage.setItem('u_'+f,'1');
    });
    showSeal(); setTimeout(hideSeal, 1000);
    refreshLockBadges();
    input.value = '';
    return;
  }

  if(RUNE_CODES[word]){
    unlockFiles(RUNE_CODES[word]);
    showSeal();
    setTimeout(()=> hideSeal(), 1000);
    refreshLockBadges();
    input.value = '';
  } else {
    playScare();
    input.value = '';
  }
}

/* === DYNAMIC LOCK BADGES === */
function refreshLockBadges(){
  document.querySelectorAll('.pages a.page-link').forEach(a=>{
    const file = a.href.split('/').slice(-1)[0];
    let tag = a.querySelector('.locked-tag-span');
    if(!isUnlocked(file)){
      a.classList.add('locked-link');
      if(!tag){
        tag = document.createElement('span');
        tag.className = 'locked-tag locked-tag-span';
        tag.textContent = ' (locked)';
        a.appendChild(tag);
      }
    } else {
      a.classList.remove('locked-link');
      if(tag) tag.remove();
    }
  });
}

/* === PAGE LOADING SYSTEM === */
function buildPageNavigation(){
  document.querySelectorAll('.pages a.page-link').forEach(a=>{
    a.addEventListener('click', async (evt)=>{
      evt.preventDefault();
      const file = a.href.split('/').slice(-1)[0];
      if(!isUnlocked(file)){ playScare(); return; }
      const res = await fetch(a.href);
      const html = await res.text();
      const article = document.createElement('article');
      article.innerHTML = html;
      document.querySelector('.pages').prepend(article);
      window.scrollTo({ top: article.offsetTop-10, behavior:'smooth' });
      if(sfx.pageTurn) sfx.pageTurn.play().catch(()=>{});
    });
  });
}

/* === FINAL SEAL EVENT === */
function activateFinalSeal(){
  const allUnlocked = Object.values(RUNE_CODES)
    .flat()
    .every(f => localStorage.getItem('u_'+f) === '1');

  if(allUnlocked){
    const seal = document.createElement('div');
    seal.className = 'seal show';
    seal.innerHTML = `<div class="rune" style="filter: drop-shadow(0 0 50px #3ec9ff);"></div>`;
    document.body.appendChild(seal);
    const hum = new Audio('assets/sounds/creepy-whispering-6690.mp3');
    hum.volume = 0.4;
    hum.play();
    setTimeout(()=> window.location.href = 'entries/true_ending.html', 4000);
  }
}

/* === INITIALIZATION === */
document.addEventListener('DOMContentLoaded',()=>{
  const btn = document.getElementById('runeBtn');
  if(btn) btn.addEventListener('click', attemptRune);
  const input = document.getElementById('runeInput');
  if(input) input.addEventListener('keydown', e=>{ if(e.key==='Enter') attemptRune(); });

  // Header Easter egg: click x7 to prompt name entry.
  const title = document.querySelector('header h1');
  let clicks = 0;
  title.addEventListener('click',()=>{
    clicks++;
    if(clicks>=7){
      clicks = 0;
      const name = prompt('The margin whispers: Your True Name?');
      if((name||'').replace(/\s+/g,'').toLowerCase()==='vaelinthorne'){
        document.querySelectorAll('.pages a.page-link').forEach(a=>{
          const f = a.href.split('/').slice(-1)[0];
          localStorage.setItem('u_'+f,'1');
        });
        showSeal();
        setTimeout(hideSeal,1000);
        refreshLockBadges();
      } else { playScare(); }
    }
  });

  refreshLockBadges();
  buildPageNavigation();
  activateFinalSeal();
});
