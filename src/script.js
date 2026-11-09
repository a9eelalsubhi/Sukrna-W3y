(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => 1 - Math.pow(1 - x, 3);
const easeIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- fit stage ---------- */
const stage = $('#stage');
function fit() {
  const vw = window.visualViewport ? visualViewport.width : innerWidth, vh = window.visualViewport ? visualViewport.height : innerHeight;
  const port = vw / vh < .85; document.body.classList.toggle('portrait', port);
  const W = port ? 900 : 1600, H = port ? 1600 : 900;
  stage.style.transform = `translate(-50%,-50%) scale(${Math.min(vw / W, vh / H)})`;
}
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 250));
window.visualViewport && visualViewport.addEventListener('resize', fit); fit();

/* ---------- toast ---------- */
let tt; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2200); }

/* ---------- slides & steps ---------- */
const slides = $$('.slide');
let cur = 0, step = 0;
const prog = $('#progress');
slides.forEach(() => { prog.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 14 18"><path d="M7 0s7 7.6 7 11a7 7 0 0 1-14 0C0 7.6 7 0 7 0z"/></svg>'); });
const hooks = {};
const stepsOf = i => +(slides[i].dataset.steps || 0);
function applySteps() {
  $$('.reveal[data-step]', slides[cur]).forEach(el => el.classList.toggle('shown', +el.dataset.step <= step));
  hooks[cur]?.step?.(step);
}
function show(i, atEnd = false) {
  slides[cur].classList.remove('active'); hooks[cur]?.leave?.();
  cur = clamp(i, 0, slides.length - 1); step = atEnd ? stepsOf(cur) : 0;
  slides[cur].classList.add('active'); hooks[cur]?.enter?.();
  applySteps(); ui();
  history.replaceState(null, '', '#' + (cur + 1));
}
const atLast = () => cur === slides.length - 1 && step >= stepsOf(cur);
function next() {
  if (step < stepsOf(cur)) { step++; applySteps(); ui(); }
  else if (cur < slides.length - 1) show(cur + 1);
  else { show(0); toast('بدأنا من جديد'); }
}
function prev() { if (step > 0) { step--; applySteps(); ui(); } else if (cur > 0) show(cur - 1, true); }
function ui() {
  $$('#progress svg').forEach((el, i) => el.setAttribute('class', i < cur ? 'on' : i === cur ? 'cur' : ''));
  $('#bPrev').disabled = cur === 0 && step === 0;
  const n = stepsOf(cur);
  $('#ringArc').setAttribute('stroke-dasharray', n ? `${step / n} 1` : '0 1');
  const last = atLast();
  $('#bNext').classList.toggle('restart', last);
  $('#nextIco').innerHTML = `<use href="#${last ? 'i-restart' : 'i-next'}"/>`;
  $('#bNext').title = last ? 'إعادة العرض' : 'التالي';
  const left = n - step;
  $('#hint').textContent = last ? 'إعادة العرض من البداية' : left > 0 ? `باقي ${ar(left)} ${left > 2 && left < 11 ? 'خطوات' : left === 2 ? 'خطوتين' : 'خطوة'} في هذي الشريحة` : '';
  $('#ttl').innerHTML = `<b>${ar(cur + 1)}</b>/ ${ar(slides.length)} · ${slides[cur].dataset.title}`;
  $('#bignum').textContent = ar(String(cur + 1).padStart(2, '0'));
  updateNotes();
}
$('#bNext').onclick = next; $('#bPrev').onclick = prev;
/* swipe on touch screens: swipe left = next (RTL reading), swipe right = back */
let tx = 0, ty = 0;
addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) { dx < 0 ? next() : prev(); } }, { passive: true });

/* ---------- keyboard: presentation clickers send PageDown/PageUp or arrows ---------- */
addEventListener('keydown', e => {
  const k = e.key;
  if (['PageDown', 'ArrowLeft', 'ArrowDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
  else if (['PageUp', 'ArrowRight', 'ArrowUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
  else if (k === 'f' || k === 'F' || k === 'F5') { e.preventDefault(); toggleFull(); }
  else if (k === 'n' || k === 'N') toggleNotes();
  else if (k === 'Escape') $('#notes').classList.remove('open');
  else if (k === 'Home') show(0); else if (k === 'End') show(slides.length - 1);
});
function toggleFull() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => toast('ملء الشاشة غير متاح هنا')); else document.exitFullscreen(); }
function toggleNotes() { $('#notes').classList.toggle('open'); updateNotes(); }
function updateNotes() { const n = $('template.note', slides[cur]); $('#notesT').textContent = `نص المتحدث · ${slides[cur].dataset.title}`; $('#notesB').textContent = n ? n.content.textContent.trim() : ''; }
$('#bFull').onclick = toggleFull; $('#bNotes').onclick = toggleNotes;

/* ---------- 0 cover: logo intro + balanced loop (GSAP timeline) ---------- */
(function cover() {
  const svg = $('#coverLogo'); if (!svg || !window.gsap) return;
  const q = id => $('#' + id, svg);
  const out = q('cvOut'), duo = q('cvDuo'), wr = q('cvWipe'), wm = q('cvWm'), dr = q('cvDrop'), dm = q('cvDropMask'), tag = q('cvTag'), shine = q('cvShine'), rip = q('cvRipple');
  let intro, loop, placed = false;
  function place() { if (placed) return; const bb = dr.getBBox(); if (!bb.width) return; rip.setAttribute('cx', bb.x + bb.width / 2); rip.setAttribute('cy', bb.y + bb.height * .72); placed = true; }
  function build() {
    intro && intro.kill(); loop && loop.kill(); place();
    gsap.set(dr, { transformOrigin: '50% 100%' });
    gsap.set(out, { strokeDashoffset: 1 }); gsap.set(duo, { strokeDashoffset: 1 }); gsap.set(wr, { attr: { x: 560, width: 0 } });
    gsap.set(wm, { opacity: .2 }); gsap.set(dr, { y: -180, opacity: 0, scaleY: 1 }); gsap.set(dm, { strokeWidth: 0 }); gsap.set(tag, { opacity: 0, y: 14 });
    gsap.set(shine, { attr: { 'stroke-dasharray': '0.07 1', 'stroke-dashoffset': 0.07 }, opacity: 0 }); gsap.set(rip, { attr: { r: 14 }, opacity: 0 });
    loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.6, defaults: { ease: 'sine.inOut' } })
      .to(shine, { opacity: .9, duration: .3 }, 0)
      .to(shine, { attr: { 'stroke-dashoffset': -1 }, duration: 2.8, ease: 'power1.inOut' }, 0)
      .to(shine, { opacity: 0, duration: .3 }, 2.5)
      .addLabel('drip', 2.9)
      .to(dr, { y: -26, scaleY: 1.08, duration: .45, ease: 'power2.out' }, 'drip')
      .to(dr, { y: 0, scaleY: 1, duration: .7, ease: 'bounce.out' }, 'drip+=.45')
      .fromTo(rip, { attr: { r: 12 }, opacity: .8 }, { attr: { r: 46 }, opacity: 0, duration: 1.1, ease: 'power2.out' }, 'drip+=.8')
      .to(svg, { y: -6, duration: 1.4 }, 0).to(svg, { y: 0, duration: 1.4 }, 1.4);
    intro = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => { if (!reduce) loop.play(0); } })
      .to(duo, { strokeDashoffset: 0, duration: 1.5 }, 0)
      .to(out, { strokeDashoffset: 0, duration: 1.75 }, .15)
      .addLabel('word', 1.5)
      .to(wr, { attr: { x: 0, width: 560 }, duration: 1.2, ease: 'power3.out' }, 'word')
      .to(wm, { opacity: 1, duration: 1.2, ease: 'power3.out' }, 'word')
      .addLabel('drop', 2.6)
      .to(dr, { opacity: 1, duration: .2, ease: 'none' }, 'drop')
      .to(dr, { y: 0, duration: .9, ease: 'bounce.out' }, 'drop')
      .to(dm, { strokeWidth: 18, duration: .3, ease: 'power2.out' }, 'drop+=.5')
      .to(tag, { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, 'drop+=.9');
  }
  hooks[0] = {
    enter() { build(); if (reduce) intro.progress(1); },
    leave() { intro && intro.kill(); loop && loop.kill(); gsap.set(svg, { y: 0 }); }
  };
})();

/* ---------- 1 counters ---------- */
(function stats() {
  const cards = $$('.stat');
  cards.forEach(c => { const l = $('.lbl', c); l.dataset.q = l.textContent; });
  function countUp(card) {
    const target = +card.dataset.count, suf = card.dataset.suffix, num = $('.num', card), dec = String(target).includes('.') ? 1 : 0, lbl = $('.lbl', card);
    card.classList.remove('hidden'); lbl.textContent = lbl.dataset.text; const t0 = performance.now();
    (function loop(n) { const p = clamp((n - t0) / 1400); num.innerHTML = `${(target * ease(p)).toFixed(dec)}<small>${suf}</small>`; if (p < 1) requestAnimationFrame(loop); })(t0);
  }
  hooks[1] = { step(s) { cards.forEach(c => { const k = +c.dataset.revealStep;
    if (k <= s && c.classList.contains('hidden')) countUp(c);
    if (k > s) { c.classList.add('hidden'); $('.num', c).textContent = '؟'; $('.lbl', c).textContent = $('.lbl', c).dataset.q; } }); } };
})();

/* ---------- 2 insulin key scene ---------- */
(function keyScene() {
  const svg = $('#keyScene'), NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p = svg) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  const g0 = el('g', {});
  el('rect', { x: 0, y: 40, width: 800, height: 150, fill: '#7A1E3E', opacity: .55 }, g0);
  el('rect', { x: 0, y: 40, width: 800, height: 10, fill: '#B03060', opacity: .6 }, g0);
  el('rect', { x: 0, y: 180, width: 800, height: 10, fill: '#B03060', opacity: .6 }, g0);
  const lab = (x, y, t, fs = 18, c = '#fff', p = svg) => { const e = el('text', { x, y, 'text-anchor': 'middle', 'font-size': fs, fill: c, 'font-weight': 700, 'font-family': 'Thmanyah Sans, Tahoma' }, p); e.textContent = t; return e; };
  lab(720, 30, 'الدم', 18, '#FFB3C8');
  const pg = el('g', { transform: 'translate(40 250)' });
  const pin = el('g', { transform: 'translate(-6 -40) scale(.5)' }, pg);
  el('path', { d: PANC_OUT, fill: 'none', stroke: '#4FB3FF', 'stroke-width': 11, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, pin);
  el('path', { d: PANC_DUO, fill: 'none', stroke: '#4FB3FF', 'stroke-width': 11, 'stroke-linecap': 'round' }, pin);
  lab(110, 150, 'البنكرياس', 18, '#AEB7DA', pg);
  const cross = el('g', { opacity: 0 }, pg); el('path', { d: 'M40 20l120 100M160 20L40 120', stroke: '#FF5A6E', 'stroke-width': 8, 'stroke-linecap': 'round' }, cross);
  const immune = el('g', { opacity: 0 }, pg);
  [[30, 10], [170, 30], [100, 120]].forEach(([x, y]) => { const c = el('g', { transform: `translate(${x} ${y})` }, immune); el('circle', { r: 14, fill: '#FFD54F' }, c); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; el('line', { x1: 14 * Math.cos(a), y1: 14 * Math.sin(a), x2: 22 * Math.cos(a), y2: 22 * Math.sin(a), stroke: '#FFD54F', 'stroke-width': 4, 'stroke-linecap': 'round' }, c); } });
  const cg = el('g', { transform: 'translate(560 380)' });
  const cellC = el('circle', { r: 130, fill: 'rgba(79,179,255,.10)', stroke: '#4FB3FF', 'stroke-width': 5 }, cg);
  el('circle', { r: 40, cx: 30, cy: 30, fill: 'rgba(204,51,139,.35)' }, cg);
  const energy = lab(0, 100, 'طاقة: ٠', 20, '#fff', cg);
  lab(0, 156, 'خلية الجسم', 18, '#AEB7DA', cg);
  const door = el('g', { transform: 'translate(560 252)' });
  const lockBody = el('rect', { x: -26, y: -22, width: 52, height: 44, rx: 10, fill: '#FFD54F' }, door);
  const shackle = el('path', { d: 'M-14 -22v-12a14 14 0 0 1 28 0v12', fill: 'none', stroke: '#FFD54F', 'stroke-width': 8 }, door);
  el('circle', { r: 6, fill: '#1B1F5E' }, door);
  const rust = el('g', { opacity: 0 }, door); [[-14, 10], [10, -8], [16, 12], [-8, -12]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 6, fill: '#B36B2E' }, rust));
  const glu = [], keys = []; const gLayer = el('g', {}), kLayer = el('g', {});
  function sugar() { const g = el('g', {}, gLayer); el('rect', { x: -9, y: -9, width: 18, height: 18, rx: 4, fill: '#fff' }, g); el('rect', { x: -9, y: -9, width: 18, height: 6, rx: 3, fill: '#FFC2E3' }, g); return { g, x: -20 - Math.random() * 200, y: 70 + Math.random() * 90, vx: 3 + Math.random() * 2, state: 'flow' }; }
  function key() { const g = el('g', {}, kLayer); el('circle', { r: 9, fill: 'none', stroke: '#4FB3FF', 'stroke-width': 5 }, g); el('path', { d: 'M9 0h22M24 0v7M31 0v6', stroke: '#4FB3FF', 'stroke-width': 5, 'stroke-linecap': 'round' }, g); return { g, x: 230, y: 300, t: 0 }; }
  const texts = {
    normal: '<b>الجسم السليم:</b> يرتفع السكر بعد الأكل، فيفرز البنكرياس الإنسولين (المفتاح)، فيفتح باب الخلية ويدخل الجلوكوز ويصير طاقة. والزائد يخزّنه الكبد.',
    t1: '<b>النوع الأول:</b> الجهاز المناعي يهاجم خلايا بيتا، فلا يوجد إنسولين. الأبواب مقفلة، والسكر يتكدّس في الدم، والخلية جائعة.',
    t2: '<b>النوع الثاني:</b> الإنسولين موجود لكن «القفل» لا يستجيب جيدًا (مقاومة الإنسولين)، فيدخل جزء بسيط ويبقى أغلب السكر في الدم.'
  };
  let mode = 'normal', raf, last = 0, spawn = 0, kspawn = 0, en = 0, open = 0;
  function setMode(m) {
    mode = m; $$('.mode').forEach(b => b.classList.toggle('on', b.dataset.mode === m)); $('#keyExplain').innerHTML = texts[m];
    cross.setAttribute('opacity', m === 't1' ? 1 : 0); immune.setAttribute('opacity', m === 't1' ? 1 : 0); rust.setAttribute('opacity', m === 't2' ? 1 : 0);
    glu.splice(0).forEach(s => s.g.remove()); keys.splice(0).forEach(k => k.g.remove()); en = 0;
  }
  function tick(n) {
    const dt = Math.min(50, n - (last || n)); last = n; spawn += dt; kspawn += dt;
    if (spawn > 260 && glu.length < (mode === 'normal' ? 26 : 60)) { glu.push(sugar()); spawn = 0; }
    if (mode !== 't1' && kspawn > (mode === 'normal' ? 700 : 1600) && keys.length < 3) { keys.push(key()); kspawn = 0; }
    keys.forEach(k => { k.t += dt / 1400; const p = ease(clamp(k.t)); k.x = 230 + 300 * p; k.y = 300 - 50 * Math.sin(p * Math.PI) - 48 * p; k.g.setAttribute('transform', `translate(${k.x} ${k.y})`); if (k.t >= 1) { open = mode === 't2' ? 500 : 1800; k.g.remove(); k.dead = 1; } });
    for (let i = keys.length - 1; i >= 0; i--) if (keys[i].dead) keys.splice(i, 1);
    open = Math.max(0, open - dt);
    shackle.setAttribute('transform', open > 0 && mode !== 't1' ? 'translate(0 -10) rotate(-20 14 -22)' : '');
    lockBody.setAttribute('fill', open > 0 ? '#2FD39A' : '#FFD54F');
    glu.forEach(s => {
      if (s.state === 'flow') { s.x += s.vx * dt / 16;
        if (s.x > 520 && s.x < 620 && open > 0 && !s.tried) { s.tried = 1; if (mode === 'normal' || Math.random() < .3) s.state = 'in'; }
        if (s.x > 820) { s.x = -20; s.tried = 0; } }
      else { s.y += 3.2 * dt / 16; s.x += (560 - s.x) * .08; if (s.y > 360) { s.g.remove(); s.dead = 1; en++; } }
      s.g.setAttribute('transform', `translate(${s.x} ${s.y})`);
    });
    for (let i = glu.length - 1; i >= 0; i--) if (glu[i].dead) glu.splice(i, 1);
    energy.textContent = 'طاقة: ' + ar(en); cellC.setAttribute('fill', `rgba(79,179,255,${.08 + Math.min(.3, en * .01)})`);
    raf = requestAnimationFrame(tick);
  }
  hooks[2] = {
    enter() { setMode('normal'); cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(tick); },
    leave() { cancelAnimationFrame(raf); },
    step(s) { const m = ['normal', 't1', 't2'][s]; if (m !== mode) setMode(m); }
  };
})();

/* ---------- 4 risk ---------- */
hooks[4] = { step(s) { $('#riskHand').style.display = s >= 5 ? 'none' : ''; } };

/* ---------- 3 who am I ---------- */
hooks[3] = { step(s) { $$('.who').forEach(w => w.classList.toggle('open', +w.dataset.revealStep <= s)); } };

/* ---------- 5 the room: spotlight one sign per Next ---------- */
(function room() {
  const sc = $('#scene3d'); if (!sc) return;
  const holes = JSON.parse('[' + sc.dataset.holes + ']');
  const hole = $('#spotHole'), ring = $('#spotRing'), dim = $('#spotDim');
  const names = $$('.pin', sc).map(p => $('.pl b', p).textContent);
  let cur = { x: 768, y: 512, r: 0 }, raf;
  function moveTo(t, show) {
    cancelAnimationFrame(raf); const from = { ...cur }, t0 = performance.now(), D = reduce ? 1 : 650;
    (function loop(n) { const p = ease(clamp((n - t0) / D));
      cur = { x: from.x + (t.x - from.x) * p, y: from.y + (t.y - from.y) * p, r: from.r + (t.r - from.r) * p };
      for (const el of [hole, ring]) { el.setAttribute('cx', cur.x); el.setAttribute('cy', cur.y); el.setAttribute('r', cur.r); }
      if (p < 1) raf = requestAnimationFrame(loop); })(t0);
    dim.style.transition = 'opacity .5s'; dim.setAttribute('opacity', show ? 1 : 0); ring.setAttribute('opacity', show ? 1 : 0);
  }
  hooks[5] = {
    step(s) {
      $$('.pin', sc).forEach(p => { const i = +p.dataset.i; p.classList.toggle('found', i < s); p.classList.toggle('cur', i === s - 1); });
      $('#huntN').textContent = ar(s);
      $('#roomFound').innerHTML = names.slice(0, s).map((n, i) => `<li class="${i === s - 1 ? 'now' : ''}"><b>${ar(i + 1)}</b>${n}</li>`).join('');
      $('#roomAsk').textContent = s === 0 ? 'كم علامة تشوفون؟ قولوها بصوت عالي' : s < 7 ? 'وش العلامة اللي بعدها؟' : 'لقيتوها كلها!';
      if (s === 0) moveTo({ x: 768, y: 512, r: 0 }, false);
      else { const [x, y, r] = holes[s - 1]; moveTo({ x, y, r: r * 1.15 }, s < 7 || true); }
      if (s === 7) { celebrate(); setTimeout(() => moveTo({ x: 768, y: 512, r: 1100 }, false), 900); }
    },
    leave() { cancelAnimationFrame(raf); }
  };
})();

/* ---------- 6 glucose meter: show reading, then reveal ---------- */
(function meter() {
  const cfg = {
    fast: { min: 40, max: 250, unit: 'mg/dL', tag: 'صائم ٨ ساعات', bands: [[40, 70, 'هبوط', 'var(--sky)', 'هبوط سكر! أقل من ٧٠: طبّق قاعدة ١٥×١٥'], [70, 100, 'طبيعي', 'var(--good)', 'طبيعي: من ٧٠ إلى ٩٩'], [100, 126, 'ما قبل السكري', 'var(--warn)', 'ما قبل السكري: ١٠٠–١٢٥'], [126, 251, 'سكري', 'var(--bad)', 'سكري: ١٢٦ فأكثر']] },
    post: { min: 60, max: 320, unit: 'mg/dL', tag: 'بعد الأكل بساعتين', bands: [[60, 140, 'طبيعي', 'var(--good)', 'طبيعي: أقل من ١٤٠'], [140, 200, 'ما قبل السكري', 'var(--warn)', 'ما قبل السكري: ١٤٠–١٩٩'], [200, 321, 'سكري', 'var(--bad)', 'سكري: ٢٠٠ فأكثر']] },
    a1c: { min: 4, max: 10, unit: '% HbA1c', tag: 'متوسط ٢–٣ أشهر', bands: [[4, 5.7, 'طبيعي', 'var(--good)', 'طبيعي: أقل من ٥٫٧٪'], [5.7, 6.5, 'ما قبل السكري', 'var(--warn)', 'ما قبل السكري: ٥٫٧–٦٫٤٪'], [6.5, 10.01, 'سكري', 'var(--bad)', 'سكري: ٦٫٥٪ فأكثر']] }
  };
  const rounds = [['fast', 92], ['post', 168], ['a1c', 6.9], ['fast', 62]];
  function draw(t) {
    const c = cfg[t];
    $$('#gTabs .tab').forEach(x => x.classList.toggle('on', x.dataset.t === t));
    $('#gBar').innerHTML = c.bands.map(b => `<span style="flex:${Math.min(b[1], c.max) - b[0]};background:${b[3]}"></span>`).join('');
    $('#gTicks').innerHTML = [c.min, ...c.bands.slice(0, -1).map(b => b[1]), c.max].map(x => `<span>${x}</span>`).join('');
    $('#gLegend').innerHTML = c.bands.filter(b => b[2] !== 'هبوط').map(b => `<div style="border-color:${b[3]}"><b style="color:${b[3]}">${b[2]}</b>${b[4].split(': ')[1]}</div>`).join('');
    $('#gUnit').textContent = c.unit; $('#gTag').textContent = c.tag;
  }
  function setRound(i, reveal) {
    const [t, v] = rounds[i], c = cfg[t]; draw(t);
    $('#gVal').textContent = t === 'a1c' ? v.toFixed(1) : v;
    const vd = $('#gVerdict'), mk = $('#gMark');
    $('#gRound').innerHTML = `<div class="rd">${rounds.map((_, k) => `<i class="${k <= i ? 'on' : ''}">${ar(k + 1)}</i>`).join('')}<span style="margin-inline-start:8px">${reveal ? 'هل كان تصويتكم صحيح؟' : 'صوّتوا: طبيعي؟ ما قبل السكري؟ سكري؟'}</span></div>`;
    if (!reveal) { vd.innerHTML = '؟ ارفعوا أيديكم وصوّتوا'; vd.style.background = 'rgba(255,255,255,.08)'; vd.style.border = '1px dashed rgba(255,255,255,.3)'; mk.style.display = 'none'; return; }
    const b = c.bands.find(b => v >= b[0] && v < b[1]);
    vd.innerHTML = `<svg class="icon"><use href="#i-drop"/></svg>${b[4]}`; vd.style.background = `color-mix(in srgb, ${b[3]} 22%, transparent)`; vd.style.border = `1px solid ${b[3]}`;
    mk.style.display = 'block'; mk.style.left = `${(v - c.min) / (c.max - c.min) * 100}%`;
  }
  function reset() { draw('fast'); $('#gVal').textContent = '--'; $('#gTag').textContent = 'جاهز'; $('#gVerdict').innerHTML = 'نبدأ بأول قراءة…'; $('#gVerdict').style.cssText = 'background:rgba(255,255,255,.06)'; $('#gMark').style.display = 'none'; $('#gRound').innerHTML = ''; }
  hooks[6] = { enter: reset, step(s) { if (s === 0) return reset(); setRound(Math.floor((s - 1) / 2), (s - 1) % 2 === 1); } };
})();

/* ---------- 7 hypo ---------- */
(function hypo() {
  let raf, ran = 0;
  function runClock() { cancelAnimationFrame(raf); if (reduce) { $('#clockArc').setAttribute('stroke-dasharray', '1 1'); $('#clockT').textContent = '٠'; return; }
    const t0 = performance.now(); (function loop(n) { const p = clamp((n - t0) / 5000); $('#clockArc').setAttribute('stroke-dasharray', `${p} 1`); $('#clockT').textContent = ar(Math.max(0, Math.ceil(15 - 15 * p))); if (p < 1) raf = requestAnimationFrame(loop); })(t0); }
  hooks[7] = {
    step(s) {
      $$('#hypoChips .chip').forEach(c => { c.classList.toggle('ok', s >= 1 && c.dataset.ok === '1'); c.classList.toggle('dim', s >= 1 && c.dataset.ok === '0'); });
      $('#hypoImg').style.opacity = s >= 1 ? 0 : 1; $('#juiceImg').style.opacity = s >= 1 ? 1 : 0;
      if (s >= 2) { if (!ran) { runClock(); ran = 1; } } else { cancelAnimationFrame(raf); ran = 0; $('#clockArc').setAttribute('stroke-dasharray', '0 1'); $('#clockT').textContent = '١٥'; }
    },
    leave() { cancelAnimationFrame(raf); ran = 0; }
  };
})();

/* ---------- 8 body ---------- */
(function body() {
  const order = ['eye', 'tooth', 'heart', 'kidney', 'nerve', 'foot'];
  hooks[8] = { step(s) { const o = s ? order[s - 1] : null;
    $$('.ocard').forEach(c => c.classList.toggle('hl', c.dataset.o === o));
    $$('.organ').forEach(g => g.style.opacity = !o || g.dataset.o === o ? 1 : .3); } };
})();

/* ---------- 9 myths: highlight, then flip one per step ---------- */
(function myths() {
  const data = [
    ['السكري سببه أكل السكر فقط', 0, 'السكر وحده لا يسبب المرض مباشرة. الإفراط في السعرات وزيادة الوزن يرفعان خطر النوع الثاني.'],
    ['مريض السكري ممنوع من أي حلويات', 0, 'يقدر يتناول كميات محدودة ضمن نظام متوازن وبإشراف الطبيب أو أخصائي التغذية.'],
    ['النوع الثاني قد يبدأ بدون أي أعراض', 1, 'قد يتطور ببطء لسنوات بلا أعراض واضحة، ولهذا الفحص الدوري مهم.'],
    ['الأنسولين يسبب الإدمان', 0, 'الأنسولين هرمون طبيعي يحتاجه الجسم ليعيش، ولا يسبب أي إدمان.'],
    ['استخدام الأنسولين يعني أن الحالة خطيرة', 0, 'الأنسولين علاج أساسي في بعض الحالات، وليس دليلًا على تدهور المرض.'],
    ['الأعشاب والخلطات علاج للسكري', 0, 'لا يوجد دليل على ذلك، وقد تضر. لا تترك دواءك واستشر طبيبك.'],
    ['الرياضة تساعد في ضبط السكر', 1, 'الرياضة المنتظمة تحسّن ضبط السكر وصحة القلب، مع قياس السكر قبل النشاط وبعده.'],
    ['السكري مرض بسيط بلا مضاعفات', 0, 'إذا لم يُضبط قد يسبب مشاكل في القلب والكلى والعينين والأعصاب.']
  ];
  $('#myths').innerHTML = data.map((d, i) => `<div class="myth"><div class="in"><div class="face front"><span class="num">${ar(i + 1)}</span><p>«${d[0]}»</p><div class="vote"><span>✓ صح</span><span>✗ خطأ</span></div></div><div class="face back"><span class="badge" style="background:${d[1] ? 'var(--good)' : 'var(--bad)'};color:${d[1] ? '#06301F' : '#fff'}">${d[1] ? 'حقيقة ✓' : 'خرافة ✗'}</span><p>${d[2]}</p></div></div></div>`).join('');
  hooks[9] = { step(s) { $$('.myth').forEach((m, i) => { m.classList.toggle('flip', i < s); m.classList.toggle('cur', i === s); }); } };
})();

/* ---------- 10 living: 3 seasons, then 6 bag items ---------- */
(function living() {
  const tips = {
    ramadan: [['i-hand', 'راجع الطبيب قبل رمضان لمعرفة إمكانية الصيام وضبط الجرعات'], ['i-meter', 'افحص السكر قبل الإفطار وبعده بساعتين، وقبل السحور'], ['i-syringe', 'تناول الدواء بانتظام وحسب تعليمات الطبيب'], ['i-burger', 'قلّل السكريات والدهون، وقسّم الإفطار لعدة وجبات']],
    hajj: [['i-walk', 'تجنب المشي الطويل والازدحام قدر الإمكان'], ['i-glass', 'اشرب الماء باستمرار'], ['i-syringe', 'خذ الدواء بانتظام في وقته'], ['i-juice', 'احمل وجبة خفيفة وسكرًا للطوارئ']],
    travel: [['i-id', 'احمل بطاقة تعريف بالمرض'], ['i-snow', 'احفظ الإنسولين في مكان بارد'], ['i-meter', 'افحص السكر بانتظام أثناء السفر'], ['i-juice', 'احمل وجبات خفيفة وسكرًا للطوارئ']]
  };
  const imgs = { ramadan: 'assets/img/ramadan.webp', hajj: 'assets/img/hajj.webp', travel: 'assets/img/travel.webp' };
  const items = [['i-snow', 'إنسولين في حافظة باردة', 1, 'يُحفظ باردًا بعيدًا عن الشمس.'], ['i-candy', 'علبة حلويات كبيرة', 0, 'الحلويات بكميات كبيرة ترفع السكر. يكفي سكر بسيط للطوارئ.'], ['i-meter', 'جهاز القياس والشرائح', 1, 'لقياس السكر بانتظام.'], ['i-foot', 'حذاء جديد ضيّق', 0, 'الحذاء الضيق يجرح القدم. اختر حذاءً مريحًا ومجرّبًا.'], ['i-id', 'بطاقة تعريف بالمرض', 1, 'تساعد المسعفين وقت الطوارئ.'], ['i-juice', 'عصير أو تمر للطوارئ', 1, 'لعلاج هبوط السكر بسرعة.']];
  $('#items').innerHTML = items.map(it => `<div class="item"><svg class="icon"><use href="#${it[0]}"/></svg>${it[1]}</div>`).join('');
  let shownTab = '';
  function setTab(l) { if (l === shownTab) return; shownTab = l; $$('#ltabs .tab').forEach(b => b.classList.toggle('on', b.dataset.l === l)); $('#liveImg').src = imgs[l]; $('#tips').innerHTML = tips[l].map((t, i) => `<div class="tip" style="animation-delay:${i * 70}ms"><span class="ibox"><svg class="icon"><use href="#${t[0]}"/></svg></span>${t[1]}</div>`).join(''); }
  hooks[10] = {
    enter() { shownTab = ''; },
    step(s) {
      setTab(['ramadan', 'hajj', 'travel'][Math.min(s, 2)]);
      const done = Math.max(0, s - 2);
      let packed = '';
      $$('#items .item').forEach((e, i) => { const it = items[i]; e.classList.toggle('cur', i === done && s >= 2); e.classList.toggle('ok', i < done && it[2] === 1); e.classList.toggle('no', i < done && it[2] === 0); if (i < done && it[2]) packed += `<span><svg class="icon"><use href="#${it[0]}"/></svg></span>`; });
      $('#packed').innerHTML = packed; $('#bagN').textContent = ar(items.slice(0, done).filter(i => i[2]).length);
      const fb = $('#bagFb');
      if (s < 2) fb.textContent = '';
      else if (done === 0) fb.innerHTML = '<b style="color:var(--warn)">الأداة المضيئة:</b> تدخل الشنطة أو لا؟';
      else { const it = items[done - 1]; fb.innerHTML = it[2] ? `<b style="color:var(--good)">تدخل ✓</b> ${it[3]}` : `<b style="color:var(--bad)">لا تدخل ✗</b> ${it[3]}`; if (done === items.length) celebrate(); }
    }
  };
})();

/* ---------- 11 prevention ---------- */
hooks[11] = { step(s) { $('#roadDone').setAttribute('stroke-dasharray', `${s / 5} 1`); } };

/* ---------- confetti (drops) ---------- */
const cv = $('#confetti'), cx = cv.getContext('2d'); let parts = [], craf;
function celebrate() {
  if (reduce) return;
  cv.width = innerWidth; cv.height = innerHeight;
  const c = ['#FF5DB1', '#4FB3FF', '#FFD54F', '#2FD39A', '#fff'];
  for (let i = 0; i < 140; i++) parts.push({ x: innerWidth / 2, y: innerHeight * .45, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 4, s: 6 + Math.random() * 8, c: c[i % c.length], r: Math.random() * 6, life: 0, drop: Math.random() < .5 });
  cancelAnimationFrame(craf);
  (function loop() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => { p.vy += .45; p.x += p.vx; p.y += p.vy; p.r += .1; p.life++;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
      if (p.drop) { cx.beginPath(); cx.moveTo(0, -p.s); cx.quadraticCurveTo(p.s * .8, 0, 0, p.s * .6); cx.quadraticCurveTo(-p.s * .8, 0, 0, -p.s); cx.fill(); } else cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      cx.restore(); });
    parts = parts.filter(p => p.y < cv.height + 40 && p.life < 220);
    if (parts.length) craf = requestAnimationFrame(loop); else cx.clearRect(0, 0, cv.width, cv.height);
  })();
}

/* ---------- start ---------- */
const h = parseInt(location.hash.slice(1)); slides[0].classList.add('active');
show(isNaN(h) ? 0 : h - 1);
})();
