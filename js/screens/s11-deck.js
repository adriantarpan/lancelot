/* ==========================================================================
   11.1 · MAZO DEL CLUB  y  11.2 · CARTA

   11.1  Filtros Todas / Preguntas / Profecías.
         "Robar carta": la carta de arriba se levanta del mazo, crece hasta el
         tamaño de 11.2 mientras el fondo pasa a azul, y en 11.2 se gira para
         enseñar su cara.
   11.2  La carta activa está sobre la pila.
         · Deslizar hacia arriba (Draggable): si pasa el umbral sale despedida
           por arriba, la siguiente sube desde la pila y el contador cambia.
           Si no lo pasa, vuelve a su sitio con un muelle.
         · Tocar: gira en 3D y enseña el reverso (patrón de rayas de Figma);
           otro toque, vuelve al anverso.
   Animaciones: animations/deck.js
   ========================================================================== */

import { IMG, backButton, esc } from '../components/ui.js';
import { deckCards, memberName } from '../core/state.js';
import { go, back, skipNextTransition } from '../core/router.js';
import { drawCard, enterCardScreen, bindCardGestures, leaveCardScreen, returnCardToDeck } from '../animations/deck.js';

const FILTERS = [
  { key: 'todas', left: 20 },
  { key: 'preguntas', left: 144 },
  { key: 'profecías', left: 268 },
];

/* Pila de cartas de 11.1: centro (x, y) y rotación de cada una, de abajo arriba (Figma) */
const PILE = [
  { x: 200.91, y: 526.79, r: 0 },
  { x: 200.91, y: 526.79, r: 0 },
  { x: 200.91, y: 519.79, r: 2.99 },
  { x: 200.91, y: 516.79, r: -0.72 },
  { x: 204.91, y: 506.79, r: -0.72 },
  { x: 200.91, y: 501.79, r: -0.72 },
  { x: 198.91, y: 493.79, r: 1.37 },
];

/* Parpadeo de "Desliza hacia arriba…" (PARA REVISAR: igual que en el minijuego y el sello) */
const BLINK_MIN_OPACITY = 0.25; // opacidad más tenue
const BLINK_HALF_CYCLE = 0.9;   // s de encendido a apagado

let filter = 'todas';
let returning = false; // 11.2 → 11.1 con la animación de robar carta al revés

export const Deck = {
  id: '11.1',
  render() {
    return `
    <section class="screen" data-screen="11.1">
      <button class="back" data-nav="10" aria-label="Cerrar" style="border:2px solid var(--c-dark);border-radius:30px">
        <img src="${IMG('icon-close.svg')}" alt="" style="position:absolute;left:13px;top:13px;width:20px;height:20px">
      </button>
      <h1 class="f-display s35 c-dark center cx" style="left:201px;top:80px">Mazo del club</h1>
      <p class="f-text s20 c-dark-50 center cx" style="left:201.5px;top:141px">solo hasta tu capítulo · sin spoilers</p>

      ${FILTERS.map((f) => `<button class="filter" data-filter="${f.key}" aria-pressed="${filter === f.key}" style="left:${f.left}px">${f.key}</button>`).join('')}

      ${PILE.map((c) => `<span class="deck-card" style="left:${c.x - 115}px;top:${c.y - 174.09}px;transform:rotate(${c.r}deg)"></span>`).join('')}

      <button class="btn btn--dark" id="draw" style="left:20px;top:774px;width:362px">robar carta</button>
    </section>`;
  },
  mount(el) {
    let busy = false;
    // Volviendo de 11.2: la carta grande regresa al mazo (robar carta al revés)
    if (returning) {
      returning = false;
      busy = true;
      const cards = el.querySelectorAll('.deck-card');
      returnCardToDeck(el, cards[cards.length - 1], PILE[PILE.length - 1].r, () => { busy = false; });
    }
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (btn) {
        filter = btn.dataset.filter;
        el.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        // PENDIENTE: ¿cambia algo visual en la pila según el filtro? (vacío sin diseñar)
        return;
      }
      if (e.target.closest('#draw') && !busy) {
        busy = true;
        const cards = el.querySelectorAll('.deck-card');
        drawCard(el, cards[cards.length - 1], () => go('11.2', { f: filter, i: 0, enter: 1 }, { replace: false }));
      }
    });
  },
};

/* Contenido de la cara de una carta (coordenadas relativas a la carta) */
export function cardFaceHTML(c) {
  if (!c) return ''; // PENDIENTE: mazo vacío sin diseñar
  return `
    <span class="chip" style="left:19px;top:19px;height:auto;font-size:20px;background:var(--c-pink);color:var(--c-dark)">${c.type}</span>
    <p class="f-text s20 c-dark" style="left:295px;top:23px">cap. ${c.chapter}</p>
    ${c.kicker ? `<p class="f-text s20 c-dark" style="left:19px;top:88px">${c.kicker}</p>` : ''}
    <p class="f-display s35 c-dark wrap" style="left:19px;top:130px;width:322px">${esc(c.text)}</p>
    <p class="f-text s20 c-blue" style="left:19px;top:505px">de ${memberName(c.author)}</p>
    <img src="${IMG('logo-mark-blue.svg')}" alt="" style="left:311px;top:488px;width:30px;height:39.02px">`;
}

export const DeckCard = {
  id: '11.2',
  render(params) {
    const cards = deckCards(params.f || 'todas');
    const i = Math.min(Number(params.i) || 0, Math.max(cards.length - 1, 0));
    return `
    <section class="screen" data-bg="blue" data-screen="11.2">
      ${backButton('light')}
      <h1 class="f-display s35 c-cream center cx" id="counter" style="left:201.5px;top:80px">Carta ${cards.length ? i + 1 : 0} de ${cards.length}</h1>

      <!-- Pila bajo la carta activa -->
      ${[199, 189, 179, 169].map((t) => `<span class="big-card pile" style="top:${t}px"></span>`).join('')}

      <!-- Siguiente carta, ya con su contenido: se ve en cuanto se levanta la activa -->
      <div class="dcard dcard--under" id="card-under" aria-hidden="true">
        <div class="dcard__face dcard__front">${cards.length ? cardFaceHTML(cards[(i + 1) % cards.length]) : ''}</div>
      </div>

      <!-- Carta activa: anverso (contenido) y reverso (rayas), gira en 3D -->
      <div class="dcard" id="card" role="button" aria-label="Carta, toca para girarla">
        <div class="dcard__inner">
          <div class="dcard__face dcard__front">${cardFaceHTML(cards[i])}</div>
          <div class="dcard__face dcard__back"></div>
        </div>
      </div>

      <p class="f-text s20 c-cream center cx hint" style="left:201px;top:767px"><span class="deck-blink">Desliza hacia arriba para pasar carta</span></p>
      <p class="f-text s15 c-cream center cx hint" style="left:201px;top:803px">toca la carta para ver su reverso</p>
    </section>`;
  },
  mount(el, params) {
    const f = params.f || 'todas';
    const cards = deckCards(f);
    let index = Math.min(Number(params.i) || 0, Math.max(cards.length - 1, 0));

    if (params.enter) enterCardScreen(el);

    // "Desliza hacia arriba para pasar carta" parpadea despacio (indica acción).
    // Va en un <span> propio: la entrada y la salida de la pantalla animan el <p>.
    const blink = window.gsap && gsap.to(el.querySelector('.deck-blink'), {
      opacity: BLINK_MIN_OPACITY, duration: BLINK_HALF_CYCLE, ease: 'sine.inOut', repeat: -1, yoyo: true,
    });

    // Volver a 11.1: la carta se gira y en 11.1 vuelve al mazo (robar carta al revés)
    const backBtn = el.querySelector('.back');
    let leaving = false;
    const onBack = (e) => {
      e.stopPropagation();
      if (leaving) return;
      leaving = true;
      leaveCardScreen(el, () => { returning = true; skipNextTransition(); back(); });
    };
    backBtn.addEventListener('click', onBack, true);

    const kill = bindCardGestures(el, {
      count: cards.length,
      // al pasar carta: pinta la siguiente y actualiza el contador y la URL
      next: () => {
        index = (index + 1) % cards.length;
        el.querySelector('#card .dcard__front').innerHTML = cardFaceHTML(cards[index]);
        el.querySelector('#card-under .dcard__front').innerHTML = cardFaceHTML(cards[(index + 1) % cards.length]);
        el.querySelector('#counter').textContent = `Carta ${index + 1} de ${cards.length}`;
        history.replaceState(null, '', `#/11.2?f=${encodeURIComponent(f)}&i=${index}`);
      },
    });
    return () => { kill(); blink?.kill(); backBtn.removeEventListener('click', onBack, true); };
  },
};
