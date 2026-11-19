// Ñanñis · VP29 — page behaviour: reveals on scroll, counters, and the strap colour shared by the
// strap section and the order form. Everything is visible and correct without this file; under
// prefers-reduced-motion nothing moves and every number shows its final value.

const html = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canObserve = 'IntersectionObserver' in window;

/* ---------------------------------------------------------------- counters */
const fmt = (v, d) => (d ? v.toFixed(d).replace('.', ',') : String(Math.round(v)));
function countUp(el, delay = 0) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  const to = parseFloat(el.dataset.count);
  const d = parseInt(el.dataset.decimals || '0', 10);
  if (!isFinite(to) || reduce) { el.textContent = fmt(to, d); return; }
  const dur = 1300 + Math.min(700, to > 100 ? 400 : 0);
  let t0 = 0;
  el.textContent = fmt(0, d);
  const tick = (now) => {
    if (!t0) t0 = now + delay;
    const t = Math.min(1, Math.max(0, (now - t0) / dur));
    const e = 1 - Math.pow(1 - t, 4);
    el.textContent = fmt(to * e, d);
    if (t < 1) requestAnimationFrame(tick); else el.textContent = fmt(to, d);
  };
  requestAnimationFrame(tick);
}

/* ---------------------------------------------------------------- reveals */
const counters = [...document.querySelectorAll('[data-count]')];
if (!reduce && canObserve) {
  html.classList.add('rv');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  // anything already on screen at load (the hero's facts) comes in after the hero's entrance
  requestAnimationFrame(() => document.querySelectorAll('[data-reveal]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.95 && r.bottom > 0) setTimeout(() => el.classList.add('is-in'), 450);
  }));
  // a safety net: nothing stays hidden if the observer never fires (printing, odd browsers)
  window.addEventListener('beforeprint', () => document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in')));
}
if (canObserve && !reduce) {
  // numbers start at zero and count up the first time they come into view
  counters.forEach((el) => { el.textContent = fmt(0, parseInt(el.dataset.decimals || '0', 10)); });
  const cio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const inHero = e.target.closest('.hx');
      countUp(e.target, inHero ? 600 : 120);
      cio.unobserve(e.target);
    }
  }, { threshold: 0.6 });
  counters.forEach((el) => cio.observe(el));
}

/* ---------------------------------------------------------------- strap colour, shared */
const radios = [...document.querySelectorAll('input[type="radio"][name="correa"], input[type="radio"][name="color"]')];
const cards = [...document.querySelectorAll('[data-strap-card]')];
const words = [...document.querySelectorAll('[data-strap-text]')];
function setStrap(value) {
  radios.forEach((r) => { r.checked = r.value === value; });
  cards.forEach((c) => {
    c.dataset.strap = value;
    c.querySelectorAll('img[data-for]').forEach((img) => {
      const on = img.dataset.for === value;
      if (on) img.removeAttribute('aria-hidden'); else img.setAttribute('aria-hidden', 'true');
    });
  });
  words.forEach((w) => { w.textContent = value === 'Negro' ? 'negra' : 'blanca'; });
}
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t instanceof HTMLInputElement && t.type === 'radio' && (t.name === 'correa' || t.name === 'color')) setStrap(t.value);
});
// the lazy second picture of each card is fetched as soon as the card is near, so the first switch is instant
if (canObserve) {
  const warm = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
      warm.unobserve(e.target);
    }
  }, { rootMargin: '400px 0px' });
  cards.forEach((c) => warm.observe(c));
}
const start = radios.find((r) => r.checked);
if (start) setStrap(start.value);

/* ---------------------------------------------------------------- the order goes to WhatsApp */
// The kit (system.js) checks the fields and shows each error under its field; this only steps in once every
// field is valid: it writes the order as one message and opens the store's chat (wa.me) with it.
const orderForm = document.querySelector('form.order-form');
if (orderForm) {
  orderForm.addEventListener('submit', (e) => {
    const fields = [...orderForm.elements].filter((el) => el.matches('input, select, textarea') && !/^(hidden|submit|button|reset|image)$/.test(el.type));
    if (!fields.every((el) => el.checkValidity())) return;          // the kit marks the fields and stops the send
    const number = (orderForm.dataset.whatsapp || '').replace(/\D/g, '');
    if (!number) return;
    e.preventDefault();
    const data = new FormData(orderForm);
    const strap = data.get('color') === 'Negro' ? 'negra' : 'blanca';
    const text = [
      'Hola Ñanñis, quiero pedir el smartwatch VP29 (modelo 2026).',
      `Correa: ${strap}`,
      `Cantidad: ${String(data.get('cantidad') || '1').trim()}`,
      `Ciudad o distrito: ${String(data.get('ciudad') || '').trim()}`,
      `Nombre: ${String(data.get('nombre') || '').trim()}`,
      '¿Me confirman el precio y el envío?',
    ].join('\n');
    const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    const status = orderForm.querySelector('[data-form-status]');
    if (status) status.textContent = 'Abriendo WhatsApp con tu pedido. Si no se abre, revisa que tengas WhatsApp instalado.';
    const win = window.open(url, '_blank');
    if (win) win.opener = null; else window.location.href = url;
  });
}

// "Escribir por WhatsApp" links take the store's number from the order form
const waNumber = (orderForm?.dataset.whatsapp || '').replace(/\D/g, '');
document.querySelectorAll('[data-wa-link]').forEach((a) => {
  if (!waNumber) { a.hidden = true; return; }
  a.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(a.dataset.waLink || 'Hola Ñanñis, tengo una consulta sobre el VP29.')}`;
  a.target = '_blank'; a.rel = 'noopener';
});
