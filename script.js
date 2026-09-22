/* FOBS FRAGRANCES - scroll-scrubbed hero + whole-site motion. */

/* ---------- constants (wire live URLs when the assets land) ---------- */
const VIDEO_URL = 'assets/hero-scrub.mp4';
const VIDEO_BYTES = 6800018;   // real byte size once encoded; fallback when Content-Length is missing
const MOBILE_VIDEO_URL = 'assets/hero-mobile.mp4';
const MOBILE_VIDEO_BYTES = 1574051;
const POSTER_URL = 'assets/hero-poster.jpg';

const el = id => document.getElementById(id);
const stage = document.querySelector('.stage');
const hero = document.querySelector('.hero');
const video = el('hero-video');
const ring = document.querySelector('.ring');
const bands = [...document.querySelectorAll('.band')].map(b => ({
  el: b,
  a: parseFloat(b.dataset.a),
  b: parseFloat(b.dataset.b),
  ramp: parseFloat(b.dataset.ramp) || 0,
  spread: parseFloat(b.dataset.spread) || 0,
  op: -1, k: -1
}));

/* ---------- seeded rng for stable word offsets ---------- */
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const rand = rng(20260920);

/* ---------- split drift text into word spans once at load ---------- */
function splitWords(el) {
  const words = [];
  const collect = node => {
    const kids = [...node.childNodes];
    for (const kid of kids) {
      if (kid.nodeType === 3) {
        const parts = kid.textContent.split(/(\s+)/);
        words.push(...parts.filter(p => p.trim().length));
      } else if (kid.nodeType === 1) {
        collect(kid);
      }
    }
  };
  collect(el);
  const n = words.length || 1;
  let i = 0;
  const wrap = node => {
    const kids = [...node.childNodes];
    for (const kid of kids) {
      if (kid.nodeType === 3) {
        const parts = kid.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const w = document.createElement('span');
            w.className = 'w';
            const th = (i / n) * 0.18 + rand() * 0.02 + 0.03;
            w.style.setProperty('--th', th.toFixed(3));
            w.textContent = part;
            frag.appendChild(w);
            i++;
          }
        }
        kid.parentNode.replaceChild(frag, kid);
      } else if (kid.nodeType === 1) {
        wrap(kid);
      }
    }
  };
  wrap(el);
}
document.querySelectorAll('.band .drift').forEach(splitWords);

/* ---------- static hero: five gates, decided live ---------- */
const GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)'
];
let scrubOn = false;
let heroInitOnce = false;
let staticAtInit = false;
let posterEl = document.querySelector('.poster');
let loadK = 0, loadRaf = null, loadStart = 0;

/* band one's one-time load ramp: drives --k from 0 to 1 in the first
   moments after the page appears, then hands over to scroll. Once it
   reaches 1 it holds (there is nothing above band one to scroll back to). */
function runLoadK(now) {
  if (!loadStart) loadStart = now;
  loadK = Math.min(1, (now - loadStart) / 1400);
  updateCaptions(heroProgress());
  if (loadK < 1) loadRaf = requestAnimationFrame(runLoadK);
  else loadRaf = null;
}

function initHeroOnce() {
  if (heroInitOnce) return;
  heroInitOnce = true;
  posterEl.style.backgroundImage = "url('" + POSTER_URL + "')";
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; // poster only
  staticAtInit = GATES.some(q => matchMedia(q).matches);
  let started = false;
  const startBlobFetch = () => {
    if (started) return;
    started = true;
    stage.classList.add('streaming');
    loadHeroBlob(staticAtInit ? MOBILE_VIDEO_URL : VIDEO_URL, staticAtInit).catch(failVideo);
  };
  const img = new Image();
  img.onload = startBlobFetch;
  img.onerror = startBlobFetch;
  img.src = POSTER_URL;
  setTimeout(startBlobFetch, 4000);
}

async function loadHeroBlob(url, staticMode) {
  const ctrl = new AbortController();
  let watchdog = setTimeout(() => ctrl.abort(), 20000);
  const res = await fetch(url, { priority: 'low', signal: ctrl.signal });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const total = Number(res.headers.get('Content-Length')) || (staticMode ? MOBILE_VIDEO_BYTES : VIDEO_BYTES);
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0, lastRing = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    clearTimeout(watchdog);
    watchdog = setTimeout(() => ctrl.abort(), 20000);
    chunks.push(value);
    got += value.length;
    const frac = Math.min(1, got / total);
    const now = performance.now();
    if (now - lastRing > 100 || frac === 1) {
      lastRing = now;
      ring.style.setProperty('--ld', Math.round(126 * (1 - frac)));
    }
  }
  clearTimeout(watchdog);
  ring.style.setProperty('--ld', 0);
  stage.classList.remove('streaming');
  video.src = URL.createObjectURL(new Blob(chunks));
  video.load();
  video.addEventListener('canplay', () => {
    if (staticMode) {
      video.loop = true;
      video.muted = true;
      video.play().catch(() => {});
    } else {
      requestSeek(heroProgress() * video.duration);
    }
    stage.classList.add('video-ready');
  }, { once: true });
}
video.addEventListener('error', failVideo);

function failVideo() {
  ring.remove();
  stage.classList.add('video-failed');
}

/* ---------- scroll: target = hero progress, lerped ---------- */
let target = 0, shown = 0, rafId = null, lastTick = 0;
let heroOnScreen = false;
let seekBusy = false, pendingTime = null;

function heroProgress() {
  const range = hero.offsetHeight - window.innerHeight;
  if (range <= 0) return 0;
  return Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / range));
}

function onScroll() {
  if (!scrubOn) return;
  target = heroProgress();
  if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
}

function tick(now) {
  const dt = Math.min(100, now - (lastTick || now));
  lastTick = now;
  const k = 0.16;
  shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
  if (Math.abs(target - shown) < 0.0005) {
    shown = target;
    rafId = null;
    lastTick = 0;
  } else {
    rafId = requestAnimationFrame(tick);
  }
  requestSeek(shown * video.duration);
  updateCaptions(shown);
}

function requestSeek(t) {
  if (!video.duration) return;
  if (seekBusy) { pendingTime = t; return; }
  seekBusy = true;
  video.currentTime = t;
}
video.addEventListener('seeked', () => {
  seekBusy = false;
  if (pendingTime !== null) {
    const t = pendingTime;
    pendingTime = null;
    requestSeek(t);
  }
});
video.addEventListener('error', () => {
  if (video.readyState === 0) {
    seekBusy = false;
    pendingTime = null;
  }
});

/* ---------- caption bands: smoothstep opacity, --k assembly ---------- */
const smoothstep = (p, e0, e1) => {
  const t = Math.min(1, Math.max(0, (p - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const clampB = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function updateCaptions(p) {
  bands.forEach((band, idx) => {
    const { el: b, a, b: bb, ramp, spread } = band;
    const f = Math.min(0.02, (bb - a) / 3);
    let op;
    if (idx === 0) {
      op = 1 - smoothstep(p, bb - f, bb);              // first band: no ease-in
    } else if (idx === bands.length - 1) {
      op = smoothstep(p, a, a + f);                     // last band: no ease-out
    } else {
      op = smoothstep(p, a, a + f) * (1 - smoothstep(p, bb - f, bb));
    }
    const rampLen = ramp || Math.min(0.025, (bb - a) * 0.35);
    let k = clampB((p - a) / rampLen, 0, 1);
    if (idx === 0) k = clampB(Math.max(k, loadK), 0, 1);  // one-time ramp for band one

    if (Math.abs(op - band.op) >= 0.005) {
      band.op = op;
      b.style.opacity = op.toFixed(3);
    }
    if (Math.abs(k - band.k) >= 0.008) {
      band.k = k;
      b.style.setProperty('--k', k.toFixed(3));
    }
  });
}

/* ---------- reduce-motion flip: pin, then restore ---------- */
function pinToFinalStates() {
  bands.forEach(band => {
    band.el.style.opacity = '1';
    band.el.style.setProperty('--k', '1');
  });
  completeHold(true);
}
function unpinFinalStates() {
  bands.forEach(band => {
    band.op = -1; band.k = -1;
    band.el.style.removeProperty('opacity');
    band.el.style.removeProperty('--k');
  });
  updateCaptions(heroProgress());
}

/* ---------- gates, live ---------- */
function enableScrub() {
  if (scrubOn) return;
  scrubOn = true;
  addEventListener('scroll', onScroll, { passive: true });
  if (loadRaf === null) loadRaf = requestAnimationFrame(runLoadK);
  initHeroOnce();
  bands.forEach(b => { b.op = -1; b.k = -1; });
  unpinFinalStates();
  updateCaptions(heroProgress());
  onScroll();
}
function disableScrub() {
  if (!scrubOn) return;
  scrubOn = false;
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  removeEventListener('scroll', onScroll);
  disableHold();
}
function applyHeroMode() {
  const staticMode = GATES.some(q => matchMedia(q).matches);
  document.querySelector('.bands').setAttribute('aria-hidden', String(staticMode));
  document.querySelector('.static-hero').setAttribute('aria-hidden', String(!staticMode));
  if (staticMode) { disableScrub(); initHeroOnce(); }
  else enableScrub();
}
const MQLS = GATES.map(q => matchMedia(q));
MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
applyHeroMode();

/* hero visible check feeds the lerp loop's on/off switch */
const heroIO = new IntersectionObserver(en => {
  heroOnScreen = en[0].isIntersecting;
  if (heroOnScreen) onScroll();
}, { rootMargin: '50%' });
heroIO.observe(hero);

/* ---------- mobile nav drawer ---------- */
const navBar = document.querySelector('.nav');
const navToggle = navBar && navBar.querySelector('.nav-toggle');
const navPanel = document.getElementById('nav-menu');
if (navToggle && navPanel) {
  const navMQ = window.matchMedia('(max-width: 860px)');
  const navLinks = [...navPanel.querySelectorAll('a')];
  const clearMenu = () => {
    navBar.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Menu');
    navLinks.forEach(a => a.removeAttribute('tabindex'));
  };
  const setMenu = open => {
    if (!navMQ.matches) { clearMenu(); return; }
    navBar.classList.toggle('open', !!open);
    navToggle.setAttribute('aria-expanded', String(!!open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    navLinks.forEach(a => { a.tabIndex = open ? 0 : -1; });
  };
  navToggle.addEventListener('click', () => setMenu(!navBar.classList.contains('open')));
  navLinks.forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  navMQ.addEventListener('change', () => setMenu(false));
  setMenu(false);
}

/* ---------- motes (dust drifting through the dusk) ---------- */
document.querySelectorAll('.motes').forEach(box => {
  for (let i = 0; i < 14; i++) {
    const m = document.createElement('span');
    m.className = 'mote';
    const s = (2 + rand() * 3).toFixed(1);
    m.style.left = (rand() * 98).toFixed(1) + '%';
    m.style.width = s + 'px';
    m.style.height = s + 'px';
    m.style.animationDuration = (9 + rand() * 9).toFixed(1) + 's';
    m.style.animationDelay = (-rand() * 12).toFixed(1) + 's';
    box.appendChild(m);
  }
});

/* ---------- whole-site entrances ---------- */
const secIO = new IntersectionObserver(en => {
  en.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    setTimeout(() => e.target.classList.add('landed'), 1400);
    secIO.unobserve(e.target);
  });
}, { threshold: 0.18 });
document.querySelectorAll('.whisper').forEach(s => secIO.observe(s));

/* pause looping animation on hidden tabs */
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('paused', document.hidden);
});

/* reduce-motion flip, both directions */
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
  if (e.matches) pinToFinalStates();
  else { unpinFinalStates(); applyHeroMode(); }
});

/* ---------- the one interactive moment: press and hold to settle ---------- */
const card = document.getElementById('settle');
const notesGrid = document.querySelector('.notes-grid');
let holdHp = 0, holding = false, holdDone = false, holdRaf = null, holdSign = 0, holdLast = 0;

function holdTick(now) {
  const dt = Math.min(100, now - (holdLast || now));
  holdLast = now;
  const regain = dt / 2400;        // ~2.4s to fill
  const bleed = dt / 1600;         // gradual release back
  holdHp = clampB(holdHp + (holding ? regain : -bleed), 0, 1);
  card.style.setProperty('--hp', (holdHp * 100).toFixed(2));
  if (holdHp >= 1) { completeHold(false); return; }
  if (!holding && holdHp <= 0) { holdRaf = null; card.classList.remove('holding'); return; }
  holdRaf = requestAnimationFrame(holdTick);
}

function completeHold(fromPin) {
  if (holdDone) return;
  holdDone = true;
  holding = false;
  if (holdRaf !== null) { cancelAnimationFrame(holdRaf); holdRaf = null; }
  card.classList.add('done');
  notesGrid.classList.add('poured');
}
function disableHold() {
  holding = false;
  holdHp = 0;
  card.style.removeProperty('--hp');
  card.classList.remove('holding');
  if (holdRaf !== null) { cancelAnimationFrame(holdRaf); holdRaf = null; }
}
function startHold() {
  if (holdDone) return;
  holding = true;
  card.classList.add('holding');
  if (holdRaf === null) holdRaf = requestAnimationFrame(holdTick);
}
function stopHold() {
  holding = false;
  if (!holdDone && holdHp > 0 && holdRaf === null) holdRaf = requestAnimationFrame(holdTick);
}
card.addEventListener('pointerdown', startHold);
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => card.addEventListener(ev, stopHold));
card.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startHold(); }
});
card.addEventListener('keyup', e => {
  if (e.key === 'Enter' || e.key === ' ') stopHold();
});
if (matchMedia('(prefers-reduced-motion: reduce)').matches) pinToFinalStates();

/* ---------- form: JS-only success state (static site, no backend) ---------- */
const form = el('sample-form');
const email = el('email');
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    email.focus();
    return;
  }
  form.classList.add('sent');
  email.blur();
});

/* touch targets big enough under coarse pointers */
if (window.matchMedia('(pointer: coarse)').matches) {
  document.querySelectorAll('.nav a, .btn, summary').forEach(a => {
    a.style.minHeight = '44px';
  });
}