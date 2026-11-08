/* ==========================================================================
   10 · REUNIÓN
   · Fecha, hora, sitio y capítulo acordado.
   · Tarjeta de escudo (2 al mes): "Alzar" ↔ "Bajar" (estados de Figma).
   · Progreso anónimo del club: "X de 7 han llegado".
   · "Añadir al calendario" (10) ↔ "En tu calendario" + "quitar" (10.1), animado.
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

/* ---------- Añadir al calendario (10 → 10.1) ----------
   10:   botón con borde "añadir al calendario".
   10.1: botón azul "en tu calendario · 12 nov 19:30" con un check, y debajo
         "te avisaremos el día antes" + "quitar" (subrayado), que vuelve a 10.
   Coordenadas de Figma relativas al bloque, que empieza en (20, 515). */
const CHECK_SVG = `<svg width="22" height="16.441" viewBox="0 0 22 16.441" fill="none" style="position:absolute;left:321px;top:17px;overflow:visible"><path class="cal-check" d="M1 8.25L7.50603 15L21 1" stroke-width="2" stroke-linecap="round" stroke="#FDF3EA"/></svg>`;

function calendarBlock() {
  const m = CLUB.meeting;
  if (state.calendarAdded) {
    return `
    <div class="cal is-added" style="left:20px;top:515px;width:362px;height:82px">
      <div class="cal__on" style="position:absolute;left:0;top:0;width:362px;height:50px;border-radius:var(--r-btn);background:var(--c-blue)">
        <p class="f-text s25 c-cream cal__label" style="position:absolute;left:20px;top:11px">en tu calendario · ${m.shortDate} ${m.time}</p>
        ${CHECK_SVG}
      </div>
      <p class="f-text s20 c-dark-50 cal__hint" style="position:absolute;left:52px;top:60px">te avisaremos el día antes</p>
      <button class="f-text s20 c-dark-50 cal__hint" data-cal="remove" style="position:absolute;left:261px;top:60px;text-decoration:underline;text-underline-offset:2px">quitar</button>
    </div>`;
  }
  return `
    <div class="cal" style="left:20px;top:515px;width:362px;height:50px">
      <button class="btn btn--outline" data-cal="add" style="left:0;top:0;width:362px;justify-content:flex-start;padding-left:${139.5 - 20 - 2}px"><span class="cx" style="display:block">añadir al calendario</span></button>
    </div>`;
}

/* Misma mecánica que el escudo: al añadir, el azul se expande en círculo desde
   donde has tocado hasta cubrir el botón, entra el texto, el check se dibuja y
   aparece la línea de abajo. Al quitar, lo mismo al revés: se van la línea y el
   texto y el azul se recoge hacia el centro dejando ver el botón con borde.
   PARA REVISAR: duraciones y curvas en estas constantes. */
const CAL_RADIUS = 380;   // cubre el botón (362×50) desde cualquier punto
const CAL_FILL = 0.55;    // s, expansión / recogida del azul
const CAL_CONTENT = 0.3;  // s, entrada / salida del texto y la línea de abajo
const CAL_CHECK = 0.35;   // s, dibujo del check
const CHECK_LEN = 30;     // largo del trazo del check (algo más que el real)

function animateCalendar(screen, add, event, done) {
  const oldBlock = screen.querySelector('.cal');
  const tmp = document.createElement('div');
  tmp.innerHTML = calendarBlock().trim();
  const newBlock = tmp.firstElementChild;
  const addedBlock = add ? newBlock : oldBlock;
  const blue = addedBlock.querySelector('.cal__on');
  const label = addedBlock.querySelector('.cal__label');
  const check = addedBlock.querySelector('.cal-check');
  const hints = addedBlock.querySelectorAll('.cal__hint');

  // origen del círculo: el punto tocado (coordenadas del botón) o el centro
  let origin = '181px 25px';
  if (add && event?.clientX) {
    const r = oldBlock.getBoundingClientRect();
    const k = r.width / 362; // escala del lienzo
    origin = `${(event.clientX - r.left) / k}px ${(event.clientY - r.top) / k}px`;
  }
  const circle = (rad) => `circle(${rad}px at ${origin})`;
  const tl = gsap.timeline({
    onComplete: () => {
      oldBlock.remove();
      gsap.set([blue, label, ...hints], { clearProps: 'clipPath,opacity,transform' });
      gsap.set(check, { attr: { 'stroke-dasharray': null, 'stroke-dashoffset': null } });
      done();
    },
  });

  if (add) {
    oldBlock.after(newBlock); // encima del botón con borde
    gsap.set(check, { attr: { 'stroke-dasharray': `${CHECK_LEN} ${CHECK_LEN}`, 'stroke-dashoffset': CHECK_LEN } });
    tl.fromTo(blue, { clipPath: circle(0) }, { clipPath: circle(CAL_RADIUS), duration: CAL_FILL, ease: 'power3.inOut' })
      .from(label, { opacity: 0, y: 6, duration: CAL_CONTENT, ease: 'power2.out' }, CAL_FILL * 0.55)
      .to(check, { attr: { 'stroke-dashoffset': 0 }, duration: CAL_CHECK, ease: 'power2.out' }, CAL_FILL * 0.7)
      .from(hints, { opacity: 0, y: -6, duration: CAL_CONTENT, stagger: 0.05, ease: 'power2.out' }, CAL_FILL * 0.75);
    // pequeño "toque" del botón al pulsar
    tl.fromTo([oldBlock, blue], { scale: 1 }, { keyframes: [{ scale: 0.98, duration: 0.1, ease: 'power1.out' }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }] }, 0);
  } else {
    oldBlock.before(newBlock); // el botón con borde, debajo del azul
    tl.to([...hints].reverse(), { opacity: 0, y: -6, duration: CAL_CONTENT * 0.7, stagger: 0.03, ease: 'power2.in' })
      .to([label, check.parentNode], { opacity: 0, y: 6, duration: CAL_CONTENT * 0.7, ease: 'power2.in' }, 0)
      .fromTo(blue, { clipPath: circle(CAL_RADIUS) }, { clipPath: circle(0), duration: CAL_FILL, ease: 'power3.inOut' }, CAL_CONTENT * 0.4);
  }
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

      ${calendarBlock()}

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

    // Añadir al calendario (10 → 10.1) y "quitar" (10.1 → 10)
    let calBusy = false;
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cal]');
      if (!btn || calBusy) return;
      const add = btn.dataset.cal === 'add';
      update((s) => { s.calendarAdded = add; });
      if (!window.gsap) return refresh();
      calBusy = true;
      animateCalendar(el, add, e, () => { calBusy = false; });
    });
  },
};
