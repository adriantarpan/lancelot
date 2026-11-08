/* ==========================================================================
   UI — trocitos de HTML que se repiten (botón volver, píldora de navegación,
   cabeceras con festón, etc.). Devuelven strings para las plantillas.
   ========================================================================== */

export const IMG = (name) => `assets/img/${name}`;

/** Escapa texto de usuario antes de meterlo en el HTML. */
export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Botón redondo de volver. variant: 'dark' | 'light' | 'pink' */
export const backButton = (variant = 'dark') =>
  `<button class="back" data-action="back" aria-label="Volver"><img src="${IMG(`btn-back-${variant}.svg`)}" alt=""></button>`;

/** Cabecera oscura con festón inferior (1.2, 1.3, 1.4 y 10). */
export const darkHeader = () =>
  `<img src="${IMG('header-dark-scallop.svg')}" alt="" style="left:0;top:0;width:402px;height:311.23px">`;

/** Barra de progreso del onboarding: el segmento activo mide 100px, el resto 40px.
    Se pinta en su estado final; si venimos de otro paso, mountStepBar() la anima. */
const SEG_ON = { w: 100, bg: 'rgba(253,243,234,1)' };
const SEG_OFF = { w: 40, bg: 'rgba(253,243,234,0.5)' };
let lastStep = null;
/** Al volver a la bienvenida (1.1) la barra empieza de cero, sin animar. */
export const resetStepBar = () => { lastStep = null; };

export const stepBar = (step) => {
  const from = lastStep && lastStep !== step ? lastStep : '';
  lastStep = step;
  const seg = (i) => {
    const s = i === step ? SEG_ON : SEG_OFF;
    return `<span data-seg="${i}" style="display:block;height:5px;border-radius:10px;width:${s.w}px;background:${s.bg}"></span>`;
  };
  return `<div class="stepbar" data-step="${step}" data-from="${from}" style="left:106px;top:93px;display:flex;gap:5px">${seg(1)}${seg(2)}${seg(3)}</div>`;
};

/** Animación fluida de la barra al cambiar de paso (mismo carácter que la burbuja
    de la píldora Mi lectura / Reunión): el segmento que se activa crece y se
    ilumina y el anterior se encoge, solo en horizontal (sin rebote). */
export function mountStepBar(screen) {
  const bar = screen.querySelector('.stepbar');
  const from = Number(bar?.dataset.from);
  if (!bar || !from || !window.gsap) return;
  const segFrom = bar.querySelector(`[data-seg="${from}"]`);
  const segTo = bar.querySelector(`[data-seg="${bar.dataset.step}"]`);
  gsap.timeline()
    .fromTo(segFrom, { width: SEG_ON.w, backgroundColor: SEG_ON.bg }, { width: SEG_OFF.w, backgroundColor: SEG_OFF.bg, duration: 0.5, ease: 'power3.inOut' }, 0)
    .fromTo(segTo, { width: SEG_OFF.w, backgroundColor: SEG_OFF.bg }, { width: SEG_ON.w, backgroundColor: SEG_ON.bg, duration: 0.5, ease: 'power3.inOut' }, 0.05); // solo en horizontal, sin rebote
}

/** Píldora "Mi lectura / Reunión" + botón del caballo (Home y Reunión).
    La burbuja crema se coloca en su sitio final; si venimos de la otra
    pestaña, mountNavPill() la hace viajar desde allí. */
const THUMB_LEFT = { reading: 5, meeting: 151 };
let lastPill = null; // última pestaña pintada ('reading' | 'meeting')

export const navPill = (active) => {
  const reading = active === 'reading';
  const from = lastPill && lastPill !== active ? lastPill : '';
  lastPill = active;
  return `
    <nav class="navpill" aria-label="Secciones" data-active="${active}" data-from="${from}">
      <span class="navpill__thumb" style="left:${THUMB_LEFT[active]}px"></span>
      <button class="navpill__label" data-nav="2"  data-tab="reading" style="left:21px;color:${reading ? 'var(--c-dark)' : 'var(--c-pink)'}">Mi lectura</button>
      <button class="navpill__label" data-nav="10" data-tab="meeting" style="left:177px;color:${reading ? 'var(--c-pink)' : 'var(--c-dark)'}">Reunión</button>
    </nav>
    <button class="horse-btn" data-nav="3" aria-label="Minijuego Al Galope">
      <img src="${IMG('horse-btn.svg')}" alt="">
    </button>`;
};

/** Animación orgánica de la burbuja al cambiar de pestaña (GSAP):
    viaja de un lado a otro estirándose en el movimiento y se asienta con un
    pequeño rebote "gelatina"; los textos cambian de color a la vez. */
export function mountNavPill(screen) {
  const nav = screen.querySelector('.navpill');
  const from = nav?.dataset.from;
  if (!nav || !from || !window.gsap) return;
  const to = nav.dataset.active;
  const thumb = nav.querySelector('.navpill__thumb');
  const labelFrom = nav.querySelector(`[data-tab="${from}"]`);
  const labelTo = nav.querySelector(`[data-tab="${to}"]`);

  // Sin rebote vertical: solo se estira en horizontal. El borde que va delante
  // sale primero y el de detrás lo alcanza (efecto "gota"), y se asienta.
  const w = thumb.offsetWidth;                       // 136
  const l0 = THUMB_LEFT[from], l1 = THUMB_LEFT[to];
  const edge = { l: l0, r: l0 + w };
  const toRight = l1 > l0;
  const paint = () => gsap.set(thumb, { left: edge.l, width: edge.r - edge.l });
  paint(); // arranca ya en la pestaña de origen
  gsap.timeline({ onUpdate: paint, onComplete: () => gsap.set(thumb, { left: l1, width: w }) })
    .to(edge, { [toRight ? 'r' : 'l']: (toRight ? l1 + w : l1), duration: 0.38, ease: 'power3.inOut' }, 0)   // borde delantero
    .to(edge, { [toRight ? 'l' : 'r']: (toRight ? l1 : l1 + w), duration: 0.5, ease: 'power3.inOut' }, 0.1)   // borde trasero
    .fromTo(labelTo, { color: 'var(--c-pink)' }, { color: 'var(--c-dark)', duration: 0.3, ease: 'power1.inOut' }, 0.2)
    .fromTo(labelFrom, { color: 'var(--c-dark)' }, { color: 'var(--c-pink)', duration: 0.3, ease: 'power1.inOut' }, 0.05);
}

/** Delegación de clics: [data-nav="id"] navega, [data-action="back"] vuelve. */
export function bindNav(root, go, back) {
  const onClick = (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      const params = nav.dataset.params ? JSON.parse(nav.dataset.params) : {};
      go(nav.dataset.nav, params);
      return;
    }
    if (e.target.closest('[data-action="back"]')) back();
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
