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
  const s = Math.min(innerWidth / 1600, innerHeight / 900);
  stage.style.transform = `scale(${s})`;
}
addEventListener('resize', fit); fit();

/* ---------- toast ---------- */
let tt; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2200); }

/* ---------- slides & steps ---------- */
const slides = $$('.slide');
let cur = 0, step = 0;
const prog = $('#progress');
slides.forEach(() => prog.appendChild(document.createElement('i')));
const hooks = {};
function stepsOf(i) { return +(slides[i].dataset.steps || 0); }
function applySteps() {
  const s = slides[cur];
  $$('.reveal[data-step]', s).forEach(el => el.classList.toggle('shown', +el.dataset.step <= step));
  hooks[cur]?.step?.(step);
}
function show(i, atEnd = false) {
  slides[cur].classList.remove('active');
  hooks[cur]?.leave?.();
  cur = clamp(i, 0, slides.length - 1);
  step = atEnd ? stepsOf(cur) : 0;
  slides[cur].classList.add('active');
  hooks[cur]?.enter?.();
  applySteps(); ui();
  history.replaceState(null, '', '#' + (cur + 1));
}
function next() { if (step < stepsOf(cur)) { step++; applySteps(); ui(); } else if (cur < slides.length - 1) show(cur + 1); }
function prev() { if (step > 0) { step--; applySteps(); ui(); } else if (cur > 0) show(cur - 1, true); }
function ui() {
  $$('#progress i').forEach((el, i) => { el.className = i < cur ? 'on' : i === cur ? 'cur' : ''; });
  $('#bPrev').disabled = cur === 0 && step === 0;
  $('#bNext').disabled = cur === slides.length - 1 && step >= stepsOf(cur);
  const left = stepsOf(cur) - step;
  $('#hint').textContent = left > 0 ? `«التالي» يكشف ${ar(left)} ${left > 2 ? 'خطوات' : left === 2 ? 'خطوتين' : 'خطوة'} في هذي الشريحة` : `${ar(cur + 1)} / ${ar(slides.length)} · ${slides[cur].dataset.title}`;
  updateNotes();
}
$('#bNext').onclick = next; $('#bPrev').onclick = prev;

/* ---------- keyboard / tools ---------- */
addEventListener('keydown', e => {
  if (e.target.matches?.('input')) return;
  const k = e.key;
  if ($('#wheelModal').classList.contains('open')) {
    if (k === 'Escape') closeWheel();
    if (k === ' ' || k === 'Enter') { e.preventDefault(); spin(); }
    return;
  }
  if (['ArrowLeft', 'PageDown', ' ', 'ArrowDown'].includes(k)) { e.preventDefault(); next(); }
  else if (['ArrowRight', 'PageUp', 'ArrowUp'].includes(k)) { e.preventDefault(); prev(); }
  else if (k === 'f' || k === 'F') toggleFull();
  else if (k === 'n' || k === 'N') toggleNotes();
  else if (k === 'w' || k === 'W') openWheel();
  else if (k === 'Escape') { $('#notes').classList.remove('open'); $('#help').classList.remove('open'); }
  else if (k === 'Home') show(0); else if (k === 'End') show(slides.length - 1);
});
function toggleFull() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => toast('ملء الشاشة غير متاح هنا')); else document.exitFullscreen(); }
function toggleNotes() { $('#notes').classList.toggle('open'); updateNotes(); }
function updateNotes() { const n = $('template.note', slides[cur]); $('#notesT').textContent = `نص المتحدث · ${slides[cur].dataset.title}`; $('#notesB').textContent = n ? n.content.textContent.trim() : ''; }
$('#bFull').onclick = toggleFull; $('#bNotes').onclick = toggleNotes; $('#bHelp').onclick = () => $('#help').classList.add('open');

/* ---------- 0 cover: draw logo ---------- */
(function cover() {
  const svg = $('#coverLogo'); if (!svg) return;
  const out = $('#cvOut', svg), duo = $('#cvDuo', svg), wr = $('#cvWipe', svg), wm = $('#cvWm', svg), dr = $('#cvDrop', svg), dm = $('#cvDropMask', svg), tag = $('#cvTag', svg);
  let raf;
  function render(t) {
    const a = easeIO(clamp((t - .15) / 1.75)), b = easeIO(clamp(t / 1.5));
    out.style.strokeDashoffset = 1 - a; duo.style.strokeDashoffset = 1 - b;
    const w = ease(clamp((t - 1.5) / 1.2)); wr.setAttribute('x', 560 - 560 * w); wr.setAttribute('width', 560 * w);
    wm.style.opacity = .2 + .8 * w;
    const f = clamp((t - 2.6) / .9); const bo = x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; };
    dr.setAttribute('transform', `translate(0 ${-180 * (1 - bo(f))})`); dr.style.opacity = f > 0 ? Math.min(1, f * 4) : 0;
    dm.style.strokeWidth = 18 * clamp((t - 3.1) / .3);
    const q = ease(clamp((t - 3.5) / .8)); tag.style.opacity = q; tag.setAttribute('transform', `translate(0 ${14 * (1 - q)})`);
  }
  hooks[0] = {
    enter() { cancelAnimationFrame(raf); if (reduce) { render(9); return; } const t0 = performance.now(); (function loop(n) { const t = (n - t0) / 1000; render(t); if (t < 4.5) raf = requestAnimationFrame(loop); })(t0); },
    leave() { cancelAnimationFrame(raf); }
  };
})();

/* ---------- 1 counters ---------- */
(function stats() {
  const cards = $$('.stat');
  function countUp(card) {
    const target = +card.dataset.count, suf = card.dataset.suffix, num = $('.num', card), dec = String(target).includes('.') ? 1 : 0;
    card.classList.remove('hidden'); const t0 = performance.now();
    (function loop(n) { const p = clamp((n - t0) / 1400); const v = (target * ease(p)).toFixed(dec);
      num.innerHTML = `${v}<small>${suf}</small>`; if (p < 1) requestAnimationFrame(loop); })(t0);
  }
  hooks[1] = { step(s) { cards.forEach(c => { const k = +c.dataset.revealStep; if (k <= s && c.classList.contains('hidden')) countUp(c); if (k > s) { c.classList.add('hidden'); $('.num', c).textContent = '???'; } }); } };
})();

/* ---------- 2 insulin key scene ---------- */
(function keyScene() {
  const svg = $('#keyScene'), NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p = svg) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  // vessel
  const g0 = el('g', {});
  el('rect', { x: 0, y: 40, width: 800, height: 150, fill: '#7A1E3E', opacity: .55 }, g0);
  el('rect', { x: 0, y: 40, width: 800, height: 10, fill: '#B03060', opacity: .6 }, g0);
  el('rect', { x: 0, y: 180, width: 800, height: 10, fill: '#B03060', opacity: .6 }, g0);
  const lab = (x, y, t, fs = 18, c = '#fff', w = 700) => { const e = el('text', { x, y, 'text-anchor': 'middle', 'font-size': fs, fill: c, 'font-weight': w, 'font-family': 'Thmanyah Sans, Tahoma' }); e.textContent = t; return e; };
  lab(700, 30, 'الدم', 18, '#FFB3C8');
  // pancreas (left)
  const pg = el('g', { transform: 'translate(40 250)' });
  const pin = el('g', { transform: 'translate(-6 -40) scale(.5)' }, pg); el('path', { d: PANC_OUT, fill: 'none', stroke: '#4FB3FF', 'stroke-width': 11, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, pin); el('path', { d: PANC_DUO, fill: 'none', stroke: '#4FB3FF', 'stroke-width': 11, 'stroke-linecap': 'round' }, pin);
  const pl = lab(110, 150, 'البنكرياس', 18, '#AEB7DA'); pg.appendChild(pl);
  const cross = el('g', { opacity: 0 }, pg); el('path', { d: 'M40 20l120 100M160 20L40 120', stroke: '#FF5A6E', 'stroke-width': 8, 'stroke-linecap': 'round' }, cross);
  const immune = el('g', { opacity: 0 }, pg);
  [[30, 10], [170, 30], [100, 120]].forEach(([x, y]) => { const c = el('g', { transform: `translate(${x} ${y})` }, immune); el('circle', { r: 14, fill: '#FFD54F' }, c); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; el('line', { x1: 14 * Math.cos(a), y1: 14 * Math.sin(a), x2: 22 * Math.cos(a), y2: 22 * Math.sin(a), stroke: '#FFD54F', 'stroke-width': 4, 'stroke-linecap': 'round' }, c); } });
  // cell (right)
  const cg = el('g', { transform: 'translate(560 380)' });
  const cellC = el('circle', { r: 130, fill: 'rgba(79,179,255,.10)', stroke: '#4FB3FF', 'stroke-width': 5 }, cg);
  el('circle', { r: 40, cx: 30, cy: 30, fill: 'rgba(204,51,139,.35)' }, cg);
  const energy = lab(0, 100, 'طاقة: 0', 20, '#fff'); cg.appendChild(energy);
  lab(0, 156, 'خلية الجسم', 18, '#AEB7DA').setAttribute('transform', '');
  cg.appendChild(svg.lastChild);
  // door/lock at top of cell (x 560,y 250)
  const door = el('g', { transform: 'translate(560 252)' });
  const lockBody = el('rect', { x: -26, y: -22, width: 52, height: 44, rx: 10, fill: '#FFD54F' }, door);
  const shackle = el('path', { d: 'M-14 -22v-12a14 14 0 0 1 28 0v12', fill: 'none', stroke: '#FFD54F', 'stroke-width': 8 }, door);
  el('circle', { cy: 0, r: 6, fill: '#1B1F5E' }, door);
  const rust = el('g', { opacity: 0 }, door); [[-14, 10], [10, -8], [16, 12], [-8, -12]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 6, fill: '#B36B2E' }, rust));
  const glu = [], keys = [];
  const gLayer = el('g', {}), kLayer = el('g', {});
  function sugar() { const g = el('g', {}, gLayer); el('rect', { x: -9, y: -9, width: 18, height: 18, rx: 4, fill: '#fff' }, g); el('rect', { x: -9, y: -9, width: 18, height: 6, rx: 3, fill: '#FFC2E3' }, g); return { g, x: -20 - Math.random() * 200, y: 70 + Math.random() * 90, vx: 3 + Math.random() * 2, state: 'flow' }; }
  function key() { const g = el('g', {}, kLayer); el('circle', { r: 9, fill: 'none', stroke: '#4FB3FF', 'stroke-width': 5 }, g); el('path', { d: 'M9 0h22M24 0v7M31 0v6', stroke: '#4FB3FF', 'stroke-width': 5, 'stroke-linecap': 'round' }, g); return { g, x: 230, y: 300, t: 0 }; }
  const texts = {
    normal: '<b>الجسم السليم:</b> يرتفع السكر بعد الأكل، فيفرز البنكرياس الإنسولين (المفتاح)، فيفتح باب الخلية ويدخل الجلوكوز ويصير طاقة. والزائد يخزّنه الكبد جليكوجين.',
    t1: '<b>النوع الأول:</b> الجهاز المناعي يهاجم خلايا بيتا، فلا يوجد إنسولين. الأبواب مقفلة، والسكر يتكدّس في الدم، والخلية جائعة رغم كثرة السكر.',
    t2: '<b>النوع الثاني:</b> الإنسولين موجود لكن «القفل» لا يستجيب جيدًا (مقاومة الإنسولين)، فيدخل جزء بسيط من السكر ويبقى أغلبه في الدم.'
  };
  let mode = 'normal', raf, last = 0, spawn = 0, kspawn = 0, en = 0, open = 0;
  function setMode(m) {
    mode = m; $$('.mode').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
    $('#keyExplain').innerHTML = texts[m];
    cross.setAttribute('opacity', m === 't1' ? 1 : 0); immune.setAttribute('opacity', m === 't1' ? 1 : 0);
    rust.setAttribute('opacity', m === 't2' ? 1 : 0);
    glu.splice(0).forEach(s => s.g.remove()); keys.splice(0).forEach(k => k.g.remove()); en = 0;
  }
  $$('.mode').forEach(b => b.onclick = () => { setMode(b.dataset.mode); const map = { normal: 0, t1: 1, t2: 2 }; step = map[b.dataset.mode]; ui(); });
  function tick(n) {
    const dt = Math.min(50, n - (last || n)); last = n;
    spawn += dt; kspawn += dt;
    if (spawn > 260 && glu.length < (mode === 'normal' ? 26 : 60)) { glu.push(sugar()); spawn = 0; }
    if (mode !== 't1' && kspawn > (mode === 'normal' ? 700 : 1600) && keys.length < 3) { keys.push(key()); kspawn = 0; }
    keys.forEach(k => { k.t += dt / 1400; const p = ease(clamp(k.t)); k.x = 230 + (530 - 230) * p; k.y = 300 - 50 * Math.sin(p * Math.PI) - (300 - 252) * p; k.g.setAttribute('transform', `translate(${k.x} ${k.y})`); if (k.t >= 1) { open = mode === 't2' ? 500 : 1800; k.g.remove(); k.dead = 1; } });
    for (let i = keys.length - 1; i >= 0; i--) if (keys[i].dead) keys.splice(i, 1);
    open = Math.max(0, open - dt);
    shackle.setAttribute('transform', open > 0 && mode !== 't1' ? 'translate(0 -10) rotate(-20 14 -22)' : '');
    lockBody.setAttribute('fill', open > 0 ? '#2FD39A' : '#FFD54F');
    glu.forEach(s => {
      if (s.state === 'flow') {
        s.x += s.vx * dt / 16; if (s.x > 520 && s.x < 620 && open > 0 && !s.tried) { s.tried = 1; if (mode === 'normal' || Math.random() < .3) s.state = 'in'; }
        if (s.x > 820) { s.x = -20; s.tried = 0; }
      } else { s.y += 3.2 * dt / 16; s.x += (560 - s.x) * .08; if (s.y > 360) { s.g.remove(); s.dead = 1; en++; } }
      s.g.setAttribute('transform', `translate(${s.x} ${s.y})`);
    });
    for (let i = glu.length - 1; i >= 0; i--) if (glu[i].dead) glu.splice(i, 1);
    energy.textContent = 'طاقة: ' + ar(en);
    cellC.setAttribute('fill', `rgba(79,179,255,${.08 + Math.min(.3, en * .01)})`);
    raf = requestAnimationFrame(tick);
  }
  hooks[2] = {
    enter() { setMode('normal'); cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(tick); },
    leave() { cancelAnimationFrame(raf); },
    step(s) { const m = ['normal', 't1', 't2'][s]; if (m !== mode) setMode(m); }
  };
})();

/* ---------- 3 who am I ---------- */
$$('.who').forEach(w => $('.rv', w).onclick = () => w.classList.add('open'));
hooks[3] = { step(s) { $$('.who').forEach(w => w.classList.toggle('open', +w.dataset.revealStep <= s)); } };

/* ---------- 4 risk ---------- */
(function risk() {
  const fs = $$('.factor');
  function upd() {
    const n = fs.filter(f => f.classList.contains('on')).length;
    $('#riskN').textContent = ar(n); $('#riskArc').setAttribute('stroke-dasharray', `${Math.min(1, n / 5)} 1`);
    $('#riskV').textContent = n === 0 ? 'ما عندك عوامل خطر ظاهرة. حافظ على نمطك الصحي، وافحص عند عمر ٣٥.' : n < 3 ? 'عندك عامل خطر أو أكثر: افحص سكرك الآن حتى لو ما عندك أعراض.' : 'عدة عوامل خطر! راجع الطبيب لفحص السكر الصائم أو التراكمي قريبًا.';
    $('#riskV').style.color = n === 0 ? 'var(--good)' : n < 3 ? 'var(--warn)' : 'var(--bad)';
  }
  fs.forEach(f => f.onclick = () => { f.classList.toggle('on'); upd(); });
  hooks[4] = { enter() { fs.forEach(f => f.classList.remove('on')); $('#riskN').textContent = '٠'; $('#riskArc').setAttribute('stroke-dasharray', '0 1'); $('#riskV').textContent = 'اضغط على العوامل لتشوف النتيجة'; $('#riskV').style.color = ''; } };
})();

/* ---------- 5 symptom hunt ---------- */
(function hunt() {
  const hot = $$('.room .hot');
  function count() { const n = hot.filter(h => h.classList.contains('found')).length; $('#huntN').textContent = ar(n); if (n === hot.length) { toast('ممتاز! لقيتوا كل العلامات'); celebrate(); } }
  hot.forEach(h => h.addEventListener('click', () => { if (h.classList.contains('found')) return; h.classList.add('found'); $(`.fl[data-k="${h.dataset.k}"]`).classList.add('found'); count(); }));
  hooks[5] = { enter() { hot.forEach(h => h.classList.remove('found')); $$('.fl').forEach(f => f.classList.remove('found')); $('#huntN').textContent = '٠'; } };
})();

/* ---------- 6 glucose meter ---------- */
(function meter() {
  const cfg = {
    fast: { min: 40, max: 250, step: 1, unit: 'mg/dL', tag: 'صائم ٨ ساعات', bands: [[40, 70, 'منخفض', 'var(--sky)', 'هبوط سكر! أقل من ٧٠: طبّق قاعدة ١٥×١٥'], [70, 100, 'طبيعي', 'var(--good)', 'طبيعي: من ٧٠ إلى ٩٩'], [100, 126, 'ما قبل السكري', 'var(--warn)', 'ما قبل السكري: ١٠٠–١٢٥'], [126, 251, 'سكري', 'var(--bad)', 'سكري: ١٢٦ فأكثر']] },
    post: { min: 60, max: 320, step: 1, unit: 'mg/dL', tag: 'بعد الأكل بساعتين', bands: [[60, 140, 'طبيعي', 'var(--good)', 'طبيعي: أقل من ١٤٠'], [140, 200, 'ما قبل السكري', 'var(--warn)', 'ما قبل السكري: ١٤٠–١٩٩'], [200, 321, 'سكري', 'var(--bad)', 'سكري: ٢٠٠ فأكثر']] },
    a1c: { min: 4, max: 10, step: .1, unit: '% HbA1c', tag: 'متوسط ٢–٣ أشهر', bands: [[4, 5.7, 'طبيعي', 'var(--good)', 'طبيعي: أقل من ٥٫٧٪'], [5.7, 6.5, 'ما قبل السكري', 'var(--warn)', 'ما قبل السكري: ٥٫٧–٦٫٤٪'], [6.5, 10.01, 'سكري', 'var(--bad)', 'سكري: ٦٫٥٪ فأكثر']] }
  };
  let t = 'fast', hidden = false; const r = $('#gRange');
  function band(v) { return cfg[t].bands.find(b => v >= b[0] && v < b[1]) || cfg[t].bands.at(-1); }
  function draw() {
    const c = cfg[t]; r.min = c.min; r.max = c.max; r.step = c.step;
    $('#gBar').innerHTML = c.bands.map(b => `<span style="flex:${Math.min(b[1], c.max) - b[0]};background:${b[3]}"></span>`).join('');
    const ticks = [c.min, ...c.bands.slice(0, -1).map(b => b[1]), c.max]; $('#gTicks').innerHTML = ticks.map(x => `<span>${x}</span>`).join('');
    $('#gLegend').innerHTML = c.bands.filter(b => b[2] !== 'منخفض').map(b => `<div style="border-color:${b[3]}"><b style="color:${b[3]}">${b[2]}</b>${b[4].split(': ')[1]}</div>`).join('');
    $('#gUnit').textContent = c.unit; $('#gTag').textContent = c.tag;
  }
  function val() {
    const v = +r.value, b = band(v);
    $('#gVal').textContent = t === 'a1c' ? v.toFixed(1) : v;
    const vd = $('#gVerdict');
    if (hidden) { vd.innerHTML = '؟ صوّتوا: طبيعي، ما قبل السكري، أو سكري'; vd.style.background = 'rgba(255,255,255,.08)'; return; }
    vd.innerHTML = `<svg class="icon"><use href="#i-drop"/></svg>${b[4]}`; vd.style.background = `color-mix(in srgb, ${b[3]} 22%, transparent)`; vd.style.border = `1px solid ${b[3]}`;
  }
  $$('#gTabs .tab').forEach(b => b.onclick = () => { $$('#gTabs .tab').forEach(x => x.classList.remove('on')); b.classList.add('on'); t = b.dataset.t; hidden = false; draw(); r.value = { fast: 95, post: 130, a1c: 5.4 }[t]; val(); });
  r.oninput = () => { hidden = false; val(); };
  $('#gChallenge').onclick = () => { const c = cfg[t]; const b = c.bands[Math.floor(Math.random() * c.bands.length)]; let v = b[0] + Math.random() * (Math.min(b[1], c.max) - b[0]); r.value = t === 'a1c' ? v.toFixed(1) : Math.round(v); hidden = true; val(); };
  $('#gShow').onclick = () => { hidden = false; val(); };
  hooks[6] = { enter() { t = 'fast'; $$('#gTabs .tab').forEach(x => x.classList.toggle('on', x.dataset.t === 'fast')); hidden = false; draw(); r.value = 95; val(); } };
})();

/* ---------- 7 hypo ---------- */
(function hypo() {
  const chips = $$('#hypoChips .chip'), fb = $('#hypoFb');
  chips.forEach(c => c.onclick = () => {
    if (c.dataset.ok === '1') { c.classList.add('ok'); fb.innerHTML = '<b style="color:var(--good)">صح!</b> ١٥ غرام سكريات سريعة: كوب عصير، أو ٣ تمرات، أو ملعقة عسل. ثم قاعدة ١٥×١٥.'; celebrate(); }
    else { c.classList.remove('no'); void c.offsetWidth; c.classList.add('no'); fb.innerHTML = `<b style="color:var(--bad)">لا.</b> ${c.dataset.why}`; }
  });
  let raf;
  $('#clockGo').onclick = () => { cancelAnimationFrame(raf); const t0 = performance.now(); (function loop(n) { const p = clamp((n - t0) / 6000); $('#clockArc').setAttribute('stroke-dasharray', `${p} 1`); $('#clockT').textContent = ar(Math.max(0, Math.ceil(15 - 15 * p))); if (p < 1) raf = requestAnimationFrame(loop); else toast('انتهت ١٥ دقيقة: أعد قياس السكر'); })(t0); };
  hooks[7] = { enter() { chips.forEach(c => c.classList.remove('ok', 'no')); fb.textContent = 'اختر إجابة…'; $('#clockArc').setAttribute('stroke-dasharray', '0 1'); $('#clockT').textContent = '١٥'; }, leave() { cancelAnimationFrame(raf); } };
})();

/* ---------- 8 body ---------- */
(function body() {
  const order = ['eye', 'tooth', 'heart', 'kidney', 'nerve', 'foot'];
  function hl(o) { $$('.ocard').forEach(c => c.classList.toggle('hl', c.dataset.o === o)); $$('.organ').forEach(g => g.style.opacity = !o || g.dataset.o === o ? 1 : .35); }
  $$('.organ').forEach(g => g.addEventListener('click', () => hl(g.dataset.o)));
  $$('.ocard').forEach(c => c.addEventListener('mouseenter', () => hl(c.dataset.o)));
  hooks[8] = { step(s) { hl(s ? order[s - 1] : null); } };
})();

/* ---------- 9 myths ---------- */
(function myths() {
  const data = [
    ['السكري سببه أكل السكر فقط', 0, 'السكر وحده لا يسبب المرض مباشرة. الإفراط في السعرات وزيادة الوزن يرفعان خطر النوع الثاني.'],
    ['مريض السكري ممنوع من أي حلويات', 0, 'يقدر يتناول كميات محدودة ضمن نظام متوازن وبإشراف الطبيب أو أخصائي التغذية.'],
    ['النوع الثاني قد يبدأ بدون أي أعراض', 1, 'صحيح. قد يتطور ببطء لسنوات بلا أعراض واضحة، ولهذا الفحص الدوري مهم.'],
    ['الأنسولين يسبب الإدمان', 0, 'الأنسولين هرمون طبيعي يحتاجه الجسم ليعيش، ولا يسبب أي إدمان.'],
    ['استخدام الأنسولين يعني أن الحالة خطيرة', 0, 'الأنسولين علاج أساسي وضروري في بعض الحالات، وليس دليلًا على تدهور المرض.'],
    ['الأعشاب والخلطات علاج للسكري', 0, 'لا يوجد دليل على ذلك، وقد تضر. لا تترك دواءك واستشر طبيبك.'],
    ['الرياضة تساعد في ضبط السكر', 1, 'صحيح. الرياضة المنتظمة تحسّن ضبط السكر وصحة القلب، مع قياس السكر قبل النشاط وبعده.'],
    ['السكري مرض بسيط بلا مضاعفات', 0, 'إذا لم يُضبط قد يسبب مشاكل في القلب والكلى والعينين والأعصاب.']
  ];
  $('#myths').innerHTML = data.map((d, i) => `<div class="myth"><div class="in"><div class="face front"><span class="num">${ar(i + 1)}</span><p>«${d[0]}»</p><div class="vote"><span>✓ صح</span><span>✗ خطأ</span></div></div><div class="face back"><span class="badge" style="background:${d[1] ? 'var(--good)' : 'var(--bad)'};color:${d[1] ? '#06301F' : '#fff'}">${d[1] ? 'حقيقة ✓' : 'خرافة ✗'}</span><p>${d[2]}</p></div></div></div>`).join('');
  $$('.myth').forEach(m => m.onclick = () => m.classList.toggle('flip'));
  hooks[9] = { enter() { $$('.myth').forEach(m => m.classList.remove('flip')); } };
})();

/* ---------- 10 living ---------- */
(function living() {
  const tips = {
    ramadan: [['i-hand', 'راجع الطبيب قبل رمضان لمعرفة إمكانية الصيام وضبط الجرعات'], ['i-meter', 'افحص السكر قبل الإفطار وبعده بساعتين، وقبل السحور ومنتصف النهار'], ['i-syringe', 'تناول الدواء بانتظام وحسب تعليمات الطبيب'], ['i-burger', 'قلّل السكريات والدهون، وقسّم الإفطار إلى عدة وجبات'], ['i-walk', 'نشاط بدني خفيف إلى متوسط، والأفضل في المساء']],
    hajj: [['i-walk', 'تجنب المشي الطويل والازدحام قدر الإمكان'], ['i-glass', 'اشرب الماء باستمرار'], ['i-syringe', 'خذ الدواء بانتظام في وقته'], ['i-juice', 'احمل وجبة خفيفة وسكرًا للطوارئ'], ['i-foot', 'حذاء مريح وافحص قدميك كل يوم']],
    travel: [['i-id', 'احمل بطاقة تعريف بالمرض'], ['i-snow', 'احفظ الإنسولين في مكان بارد'], ['i-meter', 'افحص السكر بانتظام أثناء السفر'], ['i-juice', 'احمل وجبات خفيفة وسكرًا للطوارئ']]
  };
  function setTab(l) { $$('#ltabs .tab').forEach(b => b.classList.toggle('on', b.dataset.l === l)); $('#tips').innerHTML = tips[l].map((t, i) => `<div class="tip" style="animation-delay:${i * 70}ms"><span class="ibox"><svg class="icon"><use href="#${t[0]}"/></svg></span>${t[1]}</div>`).join(''); }
  $$('#ltabs .tab').forEach(b => b.onclick = () => setTab(b.dataset.l));
  const items = [['i-snow', 'إنسولين في حافظة باردة', 1], ['i-candy', 'علبة حلويات كبيرة', 0, 'الحلويات بكميات كبيرة ترفع السكر. يكفي سكر بسيط للطوارئ.'], ['i-meter', 'جهاز القياس والشرائح', 1], ['i-id', 'بطاقة تعريف بالمرض', 1], ['i-foot', 'حذاء جديد ضيّق', 0, 'الحذاء الضيق يسبب جروحًا في القدم. اختر حذاءً مريحًا ومجرّبًا.'], ['i-juice', 'عصير أو تمر للطوارئ', 1], ['i-syringe', 'إبر وأقلام إضافية', 1], ['i-dna', 'أعشاب بدل الدواء', 0, 'لا تستبدل دواءك بالأعشاب أبدًا.'], ['i-dates', 'وجبة خفيفة', 1]];
  function reset() {
    $('#packed').innerHTML = ''; $('#bagN').textContent = '٠'; $('#bagFb').textContent = '';
    $('#items').innerHTML = items.map((it, i) => `<button class="item" data-i="${i}"><svg class="icon"><use href="#${it[0]}"/></svg>${it[1]}</button>`).join('');
    $$('#items .item').forEach(b => b.onclick = () => { const it = items[b.dataset.i];
      if (it[2]) { b.classList.add('used'); const s = document.createElement('span'); s.innerHTML = `<svg class="icon"><use href="#${it[0]}"/></svg>`; $('#packed').appendChild(s); const n = $$('#packed span').length; $('#bagN').textContent = ar(n); $('#bagFb').innerHTML = '<b style="color:var(--good)">أحسنت!</b> ' + it[1]; if (n === 6) { toast('الشنطة جاهزة!'); celebrate(); } }
      else { b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); $('#bagFb').innerHTML = `<b style="color:var(--bad)">لا تدخله:</b> ${it[3]}`; } });
  }
  hooks[10] = { enter() { setTab('ramadan'); reset(); } };
})();

/* ---------- 11 prevention ---------- */
hooks[11] = { step(s) { $('#roadDone').setAttribute('stroke-dasharray', `${s / 5} 1`); } };

/* ---------- wheel ---------- */
const QS = [
  ['ما الهرمون الذي يسمح للسكر بدخول الخلايا؟', 'الإنسولين، يفرزه البنكرياس ويعمل مثل المفتاح.'],
  ['كم المعدل الطبيعي للسكر الصائم؟', 'من ٧٠ إلى ٩٩ ملغ/دل (أقل من ١٠٠).'],
  ['ما هي قاعدة ١٥ × ١٥؟', '١٥ غرام سكريات سريعة، ثم إعادة القياس بعد ١٥ دقيقة، وتكرارها إذا بقي منخفضًا.'],
  ['اذكر ثلاثة أعراض للسكري', 'عطش شديد، كثرة التبول، تعب، نزول الوزن، تشوّش الرؤية، بطء التئام الجروح.'],
  ['صح أم خطأ: الأنسولين يسبب الإدمان', 'خطأ. الأنسولين هرمون طبيعي يحتاجه الجسم.'],
  ['من أي عمر يُنصح بفحص السكر حتى بدون أعراض؟', 'من عمر ٣٥ سنة، وقبلها إذا وُجدت عوامل خطر.'],
  ['ماذا تفعل إذا فقد مريض السكري وعيه؟', 'لا شيء بالفم، اتصل بـ٩٩٧، ضعه على جانبه، وراقب التنفس. ويُحقن بالجلوكاجون إن توفر.'],
  ['ما الفحص الذي يقيس متوسط السكر لـ٢–٣ أشهر؟', 'السكر التراكمي HbA1c.'],
  ['أين يكون امتصاص الإنسولين أسرع؟', 'في البطن. ويجب تغيير مكان الحقن كل مرة.'],
  ['كيف يُحفظ الإنسولين غير المفتوح؟', 'في الثلاجة باردًا وجافًا. والقلم المفتوح يُحفظ في حرارة الغرفة أقل من ٢٥° لمدة شهر.']
];
const wheel = $('#wheel'); const cols = ['#0073CF', '#1B1F5E', '#CC338B', '#2A3BA8', '#0F5FB0', '#7A1E5A'];
(function drawWheel() {
  const n = QS.length, R = 190, NS = 'http://www.w3.org/2000/svg'; let h = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const p = (a, r = R) => `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
    h += `<path d="M0 0L${p(a0)}A${R} ${R} 0 0 1 ${p(a1)}Z" fill="${cols[i % cols.length]}" stroke="#fff" stroke-width="3"/>`;
    const am = (a0 + a1) / 2;
    const tx = (R * .7 * Math.cos(am)).toFixed(1), ty = (R * .7 * Math.sin(am)).toFixed(1); h += `<text x="${tx}" y="${ty}" transform="rotate(${(am * 180 / Math.PI + 90).toFixed(1)} ${tx} ${ty})" fill="#fff" font-size="36" font-weight="900" text-anchor="middle" dominant-baseline="middle" font-family="Thmanyah Serif, Tahoma">${ar(i + 1)}</text>`;
  }
  h += `<circle r="${R}" fill="none" stroke="#FFD54F" stroke-width="8"/>`;
  for (let i = 0; i < 20; i++) { const a = i / 20 * 2 * Math.PI; h += `<circle cx="${(R * Math.cos(a)).toFixed(1)}" cy="${(R * Math.sin(a)).toFixed(1)}" r="5" fill="#fff"/>`; }
  wheel.innerHTML = h;
})();
let rot = 0, used = new Set(), curQ = -1, spinning = false;
function openWheel() { $('#wheelModal').classList.add('open'); }
function closeWheel() { $('#wheelModal').classList.remove('open'); }
function spin() {
  if (spinning) return; const n = QS.length;
  let pool = [...Array(n).keys()].filter(i => !used.has(i)); if (!pool.length) { used.clear(); pool = [...Array(n).keys()]; toast('انتهت الأسئلة… نبدأ من جديد'); }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const seg = 360 / n, target = 360 - (pick * seg + seg / 2);
  rot = rot - (rot % 360) + 360 * 6 + target; spinning = true;
  $('#qa').classList.remove('show'); $('#qk').textContent = 'جاري اللف…'; $('#qt').textContent = '…';
  wheel.style.transform = `rotate(${rot}deg)`;
  setTimeout(() => { spinning = false; used.add(pick); curQ = pick; $('#qk').textContent = `سؤال رقم ${ar(pick + 1)}`; $('#qt').textContent = QS[pick][0]; $('#qa').textContent = QS[pick][1]; }, reduce ? 50 : 4600);
}
$('#wSpin').onclick = spin; $('#wClose').onclick = closeWheel; $('#bWheel').onclick = openWheel; $('#bWheel2').onclick = openWheel;
$('#wReveal').onclick = () => { if (curQ >= 0) $('#qa').classList.add('show'); };
$('#wRight').onclick = () => { if (curQ >= 0) { $('#qa').classList.add('show'); celebrate(); } };
if (reduce) wheel.style.transition = 'none';

/* ---------- confetti ---------- */
const cv = $('#confetti'), cx = cv.getContext('2d'); let parts = [], craf;
function celebrate() {
  if (reduce) { toast('أحسنتم!'); return; }
  cv.width = innerWidth; cv.height = innerHeight;
  const c = ['#FF5DB1', '#4FB3FF', '#FFD54F', '#2FD39A', '#fff'];
  for (let i = 0; i < 160; i++) parts.push({ x: innerWidth / 2, y: innerHeight * .45, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 4, s: 6 + Math.random() * 8, c: c[i % c.length], r: Math.random() * 6, life: 0, drop: Math.random() < .35 });
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
