/*
  film-scrub (v2) - the client's own product film as a short scroll tour of a few scenes (a project scene for the
  Ñanñis VP29 page, built on the kit's held stage, ../lib.js). The stage holds while the visitor scrolls through
  `hold` screens. Each scene plays a stretch of the film on a canvas inside its own framing (a source rectangle
  that drifts from `rect` to `rectEnd`, so a detail is framed close), and the last part of each scene cross-fades
  into the next one's first frame. The scene in hand shows its words at the left, its word large and faint
  behind the watch, and a number that can count with the film (`count`). Tabs jump to a scene. Native scroll.

  At rest (reduced motion, no script, a failed module) the scenes stand as a list beside the film itself, a
  <video> with its poster and controls.

  opts: hold, holdPhone (screens), frames, fps, src / srcPhone ({i} = the frame number, three digits),
        scenes: [{ from, to, rect: [x, y, w, h] (0..1 of the frame), rectEnd, count }]
*/
export default function mount(root, opts = {}, lib) {
  const chapters = [...root.querySelectorAll('.film__ch')];
  const canvas = root.querySelector('.film__canvas');
  const wordsHost = root.querySelector('.film__words');
  const bar = root.querySelector('.film__bar > i');
  const tabs = [...root.querySelectorAll('[data-film-go]')];
  const scenes = Array.isArray(opts.scenes) && opts.scenes.length ? opts.scenes : null;
  if (!canvas || !chapters.length || !opts.src || !scenes) { root.classList.add('sc', 'is-rest'); return { destroy() {} }; }

  const n = scenes.length;
  const N = Math.max(2, opts.frames || 396);
  const g = canvas.getContext('2d', { alpha: false });
  const counts = chapters.map((li) => li.querySelector('[data-film-count]'));
  const words = chapters.map((li) => {
    const s = document.createElement('span');
    s.textContent = li.dataset.word || '';
    wordsHost && wordsHost.append(s);
    return s;
  });
  const smooth = lib.ease.inOut;

  /* ------------------------------------------------------------ frames */
  const need = new Uint8Array(N);
  scenes.forEach((s) => { for (let i = s.from; i <= s.to; i++) need[i] = 1; });
  function order() {               // each scene's first frame, then every 8th, 4th, 2nd frame, then all
    const seen = new Uint8Array(N), out = [];
    scenes.forEach((s) => { if (!seen[s.from]) { seen[s.from] = 1; out.push(s.from); } });
    for (const step of [8, 4, 2, 1]) {
      for (const s of scenes) for (let i = s.from; i <= s.to; i += step) if (!seen[i]) { seen[i] = 1; out.push(i); }
    }
    return out;
  }
  let firstPass = 0;
  { const seen = new Uint8Array(N); scenes.forEach((s) => { seen[s.from] = 1; for (let i = s.from; i <= s.to; i += 8) seen[i] = 1; }); firstPass = seen.reduce((a, b) => a + b, 0); }
  const sets = {};
  let setKey = null, set = null, live = false, full = false, drawnOnce = false;
  const setFor = () => (lib.phone() && opts.srcPhone ? 'm' : 'd');
  const url = (key, i) => (key === 'm' ? opts.srcPhone : opts.src).replace('{i}', String(i).padStart(3, '0'));
  function ensure(key) {
    if (!sets[key]) sets[key] = { imgs: new Array(N), ok: new Uint8Array(N), queue: order(), active: 0, sent: 0, urgent: new Set() };
    return sets[key];
  }
  function pump(s, key) {
    while (s.active < 6 && s.queue.length && (full || s.sent < firstPass || s.urgent.has(s.queue[0]))) {
      const i = s.queue.shift();
      s.sent++; s.urgent.delete(i);
      const img = new Image();
      img.decoding = 'async';
      s.active++;
      img.onload = () => { s.active--; s.ok[i] = 1; s.imgs[i] = img; if (key === setKey && live) paint(); pump(s, key); };
      img.onerror = () => { s.active--; pump(s, key); };
      img.src = url(key, i);
    }
  }
  function hurry(i) {              // the frame the scroll asks for jumps the queue
    if (!set || set.ok[i]) return;
    const qi = set.queue.indexOf(i);
    if (qi < 0) return;
    if (qi > 0) { set.queue.splice(qi, 1); set.queue.unshift(i); }
    set.urgent.add(i); pump(set, setKey);
  }
  const goFull = () => {
    if (full) return;
    full = true;
    window.removeEventListener('scroll', goFull);
    for (const k of Object.keys(sets)) pump(sets[k], k);
  };
  window.addEventListener('scroll', goFull, { passive: true });
  function nearestIn(i, s) {
    if (!set) return null;
    for (let d = 0; d <= s.to - s.from; d++) {
      if (i - d >= s.from && set.ok[i - d]) return set.imgs[i - d];
      if (i + d <= s.to && set.ok[i + d]) return set.imgs[i + d];
    }
    return null;
  }

  /* ------------------------------------------------------------ one scene at a point of its own progress t */
  const HOLD_IN = 0.1, XF = 0.15;
  function at(k, t) {
    const s = scenes[k];
    const u = lib.clamp((t - HOLD_IN) / (1 - HOLD_IN - XF));
    const r0 = s.rect || [0, 0, 1, 1], r1 = s.rectEnd || r0, e = smooth(u);
    return { k, s, u, f: Math.round(s.from + (s.to - s.from) * u), rect: r0.map((v, i) => v + (r1[i] - v) * e) };
  }
  let cur = null;
  function blit(img, r) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    g.drawImage(img, r[0] * iw, r[1] * ih, r[2] * iw, r[3] * ih, 0, 0, canvas.width, canvas.height);
  }
  function paint() {
    if (!cur) return;
    const a = nearestIn(cur.A.f, cur.A.s);
    if (!a) return;
    if (canvas.width !== a.naturalWidth) { canvas.width = a.naturalWidth; canvas.height = a.naturalHeight; }
    g.globalAlpha = 1;
    blit(a, cur.A.rect);
    if (cur.B && cur.mix > 0) {
      const b = nearestIn(cur.B.f, cur.B.s);
      if (b) { g.globalAlpha = cur.mix; blit(b, cur.B.rect); g.globalAlpha = 1; }
    }
    if (!drawnOnce) { drawnOnce = true; root.classList.add('film--drawn'); }
  }

  /* ------------------------------------------------------------ words, numbers, tabs */
  let active = -1;
  function show(k) {
    if (k === active) return;
    active = k;
    chapters.forEach((li, i) => li.classList.toggle('is-on', i === k));
    words.forEach((w, i) => w.classList.toggle('is-on', i === k));
    tabs.forEach((b, i) => { if (i === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  }
  function setCount(k, u) {
    const el = counts[k], to = scenes[k].count;
    if (el && typeof to === 'number') el.textContent = String(Math.round(to * u));
  }

  /* ------------------------------------------------------------ the held stage */
  const ctrl = lib.scene(root, {
    hold: opts.hold ?? 3,
    phone: { hold: opts.holdPhone ?? opts.hold ?? 3 },
    tau: 0,
    enter() { live = true; setKey = setFor(); set = ensure(setKey); pump(set, setKey); drawnOnce = false; root.classList.remove('film--drawn'); },
    near(_, isNear) { if (isNear) { setKey = setFor(); set = ensure(setKey); pump(set, setKey); } },
    update(p) {
      const x = Math.min(n - 1e-6, Math.max(0, p) * n);
      const k = Math.floor(x), t = x - k;
      const A = at(k, t);
      let B = null, mix = 0;
      if (k < n - 1 && t > 1 - XF) { mix = smooth((t - (1 - XF)) / XF); B = at(k + 1, 0); }
      cur = { A, B, mix };
      hurry(A.f); if (B) hurry(B.f);
      paint();
      const on = mix > 0.5 ? k + 1 : k;
      show(on);
      setCount(k, A.u);
      if (B) setCount(k + 1, 0);
      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    },
    rest() {
      live = false; active = -1; cur = null;
      chapters.forEach((li) => li.classList.remove('is-on'));
      words.forEach((w) => w.classList.remove('is-on'));
      counts.forEach((el, i) => { if (el && typeof scenes[i]?.count === 'number') el.textContent = String(scenes[i].count); });
      if (bar) bar.style.transform = '';
      root.classList.remove('film--drawn');
    },
  });
  if (ctrl && ctrl.live) { setKey = setFor(); set = ensure(setKey); pump(set, setKey); }

  // a tab jumps to its scene, just after the scene's words come in
  const onTab = (e) => {
    const b = e.target.closest('[data-film-go]');
    if (!b || !ctrl) return;
    const k = Math.max(0, Math.min(n - 1, parseInt(b.dataset.filmGo, 10) || 0));
    goFull();
    hurry(scenes[k].from);
    window.scrollTo({ top: ctrl.at((k + 0.12) / n), behavior: lib.reduced() ? 'auto' : 'smooth' });
  };
  root.addEventListener('click', onTab);

  return {
    destroy() {
      window.removeEventListener('scroll', goFull);
      root.removeEventListener('click', onTab);
      ctrl && ctrl.destroy();
      words.forEach((w) => w.remove());
    },
  };
}
