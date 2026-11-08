/* ==========================================================================
   10 · REUNIÓN
   · Fecha, hora, sitio y capítulo acordado.
   · Tarjeta de escudo (2 al mes): "Alzar" ↔ "Bajar" (estados de Figma).
   · Progreso anónimo del club: "X de 7 han llegado".
   · "Jugar con el mazo del club" → 11.1.
   ========================================================================== */

import { IMG, navPill, mountNavPill, darkHeader } from '../components/ui.js';
import { CLUB } from '../core/data.js';
import { state, update, shieldsLeft, meetingArrived } from '../core/state.js';
import { refresh } from '../core/router.js';

const TOTAL = Object.keys(CLUB.members).length;

function shieldCard() {
  const raised = state.shields.raised;
  const left = shieldsLeft();
  if (raised) {
    return `
    <div class="shield-card is-raised">
      <img class="shield-card__icon" src="${IMG('shield-card-white.svg')}" alt="">
      <span class="shield-card__count c-blue" style="left:54px">${left}</span>
      <div class="shield-card__text">
        <span class="f-text s25 c-cream">Escudo en alto</span>
        <span class="f-text s15 c-cream">Te queda${left === 1 ? '' : 'n'} ${left} este mes</span>
      </div>
      <button class="shield-card__btn" data-shield="lower">Bajar</button>
    </div>`;
  }
  return `
    <div class="shield-card">
      <img class="shield-card__icon" src="${IMG('shield-card-dark.svg')}" alt="">
      <span class="shield-card__badge"></span>
      <span class="shield-card__count c-dark">${left}</span>
      <p class="shield-card__text f-text s25 c-dark">¿no llegas?<br>ve con escudo</p>
      <button class="shield-card__btn c-dark" data-shield="raise" ${left < 1 ? 'disabled' : ''}>alzar</button>
    </div>`;
}

/* ---------- Animación de la tarjeta de escudo ----------
   Alzar: el azul de la tarjeta "en alto" se expande en círculo desde el botón
   hasta cubrirla, y su contenido entra con un pequeño desplazamiento.
   Bajar: lo mismo al revés; el contenido azul se va y el azul se recoge
   hacia el botón dejando ver la tarjeta normal.
   PARA REVISAR: duraciones y curvas en estas constantes. */
const SHIELD_ORIGIN = '313.5px 39px'; // centro del botón dentro de la tarjeta
const SHIELD_RADIUS = 340;              // cubre la tarjeta desde el botón
const SHIELD_FILL = 0.55;               // s, expansión / recogida del azul
const SHIELD_CONTENT = 0.3;             // s, entrada / salida del contenido

function animateShield(screen, raise, done) {
  const oldCard = screen.querySelector('.shield-card');
  const tmp = document.createElement('div');
  tmp.innerHTML = shieldCard().trim();
  const newCard = tmp.firstElementChild;
  const blue = raise ? newCard : oldCard;
  const content = [...blue.children];
  const circle = (r) => `circle(${r}px at ${SHIELD_ORIGIN})`;
  const tl = gsap.timeline({ onComplete: () => { oldCard.remove(); gsap.set(newCard, { clearProps: 'clipPath,transform' }); gsap.set(content, { clearProps: 'opacity,transform' }); done(); } });

  if (raise) {
    oldCard.after(newCard); // encima de la normal
    tl.fromTo(newCard, { clipPath: circle(0) }, { clipPath: circle(SHIELD_RADIUS), duration: SHIELD_FILL, ease: 'power3.inOut' })
      .from(content, { opacity: 0, y: 6, duration: SHIELD_CONTENT, stagger: 0.03, ease: 'power2.out' }, SHIELD_FILL * 0.55);
  } else {
    oldCard.before(newCard); // la normal, debajo de la azul
    tl.to(content, { opacity: 0, y: 6, duration: SHIELD_CONTENT * 0.7, stagger: 0.02, ease: 'power2.in' })
      .fromTo(oldCard, { clipPath: circle(SHIELD_RADIUS) }, { clipPath: circle(0), duration: SHIELD_FILL, ease: 'power3.inOut' }, SHIELD_CONTENT * 0.4);
  }
  // pequeño "toque" de la tarjeta al pulsar
  tl.fromTo([oldCard, newCard], { scale: 1 }, { keyframes: [{ scale: 0.98, duration: 0.1, ease: 'power1.out' }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }] }, 0);
}

export default {
  id: '10',
  render() {
    const m = CLUB.meeting;
    const arrived = meetingArrived();
    return `
    <section class="screen" data-screen="10">
      ${darkHeader()}
      <h1 class="f-display s58 c-cream" style="left:20px;top:80px">${m.title}</h1>
      <p class="f-text s25 c-cream" style="left:26px;top:142px">${CLUB.name}</p>

      <span style="left:20px;top:190px;width:362px;height:81px;border-radius:10px;background:var(--c-pink)"></span>
      <p class="f-text s25 c-dark" style="left:35px;top:200px">${m.time} · ${m.place}</p>
      <p class="f-text s25 c-dark" style="left:35px;top:233px">hasta el cap. ${m.untilChapter}</p>

      ${shieldCard()}

      <!-- Progreso anónimo del club -->
      <span style="left:20px;top:423px;width:362px;height:82px;border:2px solid var(--c-dark);border-radius:10px"></span>
      <span style="left:40px;top:443px;width:322px;height:15px;border-radius:5px;background:var(--c-pink-30)"></span>
      <span style="left:40px;top:443px;width:${Math.round((322 * arrived) / TOTAL)}px;height:15px;border-radius:5px 0 0 5px;background:var(--c-pink)"></span>
      <p class="f-text s20 c-dark" style="left:41px;top:463px">${arrived} de ${TOTAL} han llegado</p>

      <button class="btn btn--outline" id="calendar" style="left:20px;top:515px;width:362px;justify-content:flex-start;padding-left:${139.5 - 20 - 2}px"><span class="cx" style="display:block">añadir al calendario</span></button>

      <button class="btn btn--outline" data-nav="11.1" style="left:20px;top:694px;width:362px;border-color:#000">jugar con el mazo del club</button>

      ${navPill('meeting')}
    </section>`;
  },
  mount(el) {
    mountNavPill(el); // la burbuja viaja si venimos de Mi lectura
    let busy = false;
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-shield]');
      if (!btn || busy) return;
      const raise = btn.dataset.shield === 'raise';
      update((s) => { s.shields.raised = raise; });
      if (!window.gsap) return refresh();
      busy = true;
      animateShield(el, raise, () => { busy = false; });
    });
    // PENDIENTE: "añadir al calendario" no tiene comportamiento definido en Figma.
  },
};
