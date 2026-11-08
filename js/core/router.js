/* ==========================================================================
   ROUTER — navegación entre pantallas con el hash de la URL.
   go('4', { ch: 10 })  →  #/4?ch=10
   Cualquier pantalla se puede abrir directamente escribiendo su número en la
   URL (útil para revisar la fidelidad): index.html#/6.3
   ========================================================================== */

import { imagesReady } from './preload.js';

const screens = new Map();
let app;
let cleanup = null;
let onChange = null;

export function register(list) {
  list.forEach((s) => screens.set(s.id, s));
}

export function start(root, { fallback, beforeRender } = {}) {
  app = root;
  onChange = beforeRender;
  window.addEventListener('hashchange', () => renderFromHash(fallback));
  renderFromHash(fallback);
}

export function go(id, params = {}, { replace = false } = {}) {
  const qs = new URLSearchParams(params).toString();
  const hash = `#/${id}${qs ? `?${qs}` : ''}`;
  if (replace) history.replaceState(null, '', hash);
  else if (location.hash !== hash) { location.hash = hash; return; }
  renderFromHash();
}

export const back = () => history.back();

export function current() {
  return parseHash();
}

function parseHash() {
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  return { id: decodeURIComponent(path || ''), params };
}

function renderFromHash(fallback) {
  let { id, params } = parseHash();
  if (onChange) {
    const redirect = onChange(id, params);
    if (redirect) ({ id, params } = redirect);
  }
  const screen = screens.get(id) ?? screens.get(fallback);
  if (!screen) return;

  if (typeof cleanup === 'function') cleanup();

  const prev = app.querySelector('[data-screen]');
  const tmp = document.createElement('div');
  tmp.innerHTML = screen.render(params);
  const el = tmp.firstElementChild;

  // Misma pantalla (p. ej. tras guardar un cambio): se sustituye sin transición
  const sameScreen = prev && prev.dataset.screen === el.dataset.screen;
  app.querySelectorAll('[data-leaving]').forEach((n) => n.remove());
  if (!prev || sameScreen) {
    app.replaceChildren(el);
    lastId = el.dataset.screen;
  } else {
    // la nueva va primero en el DOM (así [data-screen] siempre es la activa);
    // la anterior queda encima mientras se desvanece
    prev.removeAttribute('data-screen');
    prev.dataset.leaving = '1';
    prev.style.pointerEvents = 'none';
    app.prepend(el);
    transition(prev, el, params);
  }
  cleanup = screen.mount ? screen.mount(el, params) : null;
}

/* ---------- Transición entre pantallas ----------
   Sutil y coherente: la nueva entra por debajo con un pequeño desplazamiento
   y la anterior se va hacia el lado contrario desvaneciéndose por encima.
   Hacia "atrás" (pantallas de número menor) el movimiento se invierte. Las
   pantallas con entrada propia (sellado, carta robada, logro) y Mi lectura ↔
   Reunión solo hacen el fundido de la anterior.
   PARA REVISAR: duración 0.38s / 0.28s, 24px, power3.out / power2.in. */
const ORDER = ['1.1', '1.2', '1.3', '1.4', '2', '2.1', '2.2', '10', '3', '9', '4', '5', '6.1', '6.2', '6.3', '6.4', '7', '8', '11.1', '11.2', 'logro'];
let lastId = null;
const lastIdBefore = (index) => ORDER[index];

function transition(prev, next, params) {
  const id = next.dataset.screen;
  const from = ORDER.indexOf(lastId);
  const to = ORDER.indexOf(id);
  lastId = id;
  const skip = skipNext;
  skipNext = false;
  // Sin destello en blanco: la anterior sigue encima hasta que las imágenes de
  // la nueva (p. ej. la cabecera oscura del onboarding) ya se pueden pintar.
  imagesReady(next).then(() => animate(prev, next, params, { id, from, to, skip }));
}

function animate(prev, next, params, { id, from, to, skip }) {
  if (!prev.isConnected) return; // otra navegación ya la quitó
  if (skip) { prev.remove(); return; }
  const ownEntrance = params.anim || params.enter || id === 'logro';
  const STEPS = ['1.2', '1.3', '1.4'];
  const tabSwitch =
    (from === ORDER.indexOf('2') && id === '10') || (from === ORDER.indexOf('10') && id === '2');

  // Mi lectura ↔ Reunión: la píldora de la pantalla que se va desaparece al
  // momento para que se vea moverse la de la nueva (ver mountNavPill en ui.js)
  // Profecías ↔ Comentarios: botones independientes, sin desplazamiento. La
  // cabecera y las pestañas cambian al instante y solo funde la lista.
  const chapterTabs = ['4', '5'].includes(lastIdBefore(from)) && ['4', '5'].includes(id);
  if (chapterTabs && window.gsap) {
    prev.remove();
    gsap.from(next.querySelectorAll('.feed, .composer, .send'), { opacity: 0, duration: 0.22, ease: 'power1.out', clearProps: 'opacity' });
    return;
  }

  // Pasos del onboarding (1.2 ↔ 1.3 ↔ 1.4): lo mismo. La cabecera oscura, volver,
  // "saltar" y la barra de pasos no se mueven (la barra anima su segmento, ver
  // mountStepBar); solo funde el contenido propio de cada paso.
  const onboardingSteps = STEPS.includes(lastIdBefore(from)) && STEPS.includes(id);
  if (onboardingSteps && window.gsap) {
    prev.remove();
    const header = next.querySelector(':scope > img'); // festón oscuro (darkHeader)
    const own = [...next.children].filter((n) => n !== header && !n.matches('.back, .stepbar, [data-nav="2"]'));
    gsap.from(own, { opacity: 0, duration: 0.22, ease: 'power1.out', clearProps: 'opacity' });
    return;
  }

  if (tabSwitch) prev.querySelectorAll('.navpill, .horse-btn').forEach((n) => { n.style.visibility = 'hidden'; });

  if (!window.gsap) { prev.remove(); return; }

  // Sin glitches: la nueva queda DEBAJO y siempre opaca; solo la anterior se
  // desvanece por encima. Así nunca hay un instante con las dos semitransparentes
  // (eso dejaba ver el fondo crema del lienzo y oscurecía todo a mitad de camino).
  if (ownEntrance || tabSwitch) {
    gsap.to(prev, { opacity: 0, duration: 0.22, ease: 'power1.inOut', onComplete: () => prev.remove() });
    return;
  }

  // Desplazamiento sutil: la nueva entra 24px desde un lado (por debajo) y la
  // anterior se va hacia el otro mientras se desvanece. Mientras dura, el lienzo
  // toma el color de fondo de la nueva, así la franja que deja el desplazamiento
  // no se ve de otro color.
  const dir = to >= from ? 1 : -1;
  const stage = app.parentElement;
  stage.style.backgroundColor = getComputedStyle(next).backgroundColor;
  gsap.fromTo(next, { x: 24 * dir }, { x: 0, duration: 0.38, ease: 'power3.out', clearProps: 'transform' });
  gsap.to(prev, {
    x: -24 * dir, opacity: 0, duration: 0.28, ease: 'power2.in',
    onComplete: () => { prev.remove(); stage.style.removeProperty('background-color'); },
  });
}

/** La próxima navegación se hace sin transición (la pantalla que se va ya ha
    hecho su propia salida, p. ej. 11.2 → 11.1). */
let skipNext = false;
export function skipNextTransition() { skipNext = true; }

/** Vuelve a pintar la pantalla actual (tras cambiar el estado). */
export function refresh() {
  renderFromHash();
}
