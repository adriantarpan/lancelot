/* ==========================================================================
   3 · AL GALOPE — minijuego jugable (motor en js/game/galope.js).
   Estado inicial = frame 3 de Figma. Al chocar sale "¡Plof!" con las piezas
   sueltas de Figma (tarjeta crema + textos) dentro del escenario.
   Coordenadas del escenario: relativas a su esquina (20, 151) de Figma.
   ========================================================================== */

import { IMG, backButton } from '../components/ui.js';
import { state, update } from '../core/state.js';
import { createGalope } from '../game/galope.js';

/* Pila de libros del frame 3 (rectángulos de Figma: lomo de color + páginas crema) */
const book = (left, top, h, color, pagesLeft, flip = false) => `
  <span style="position:absolute;left:${left}px;top:${top}px;width:36.184px;height:${h}px;background:${color};border-radius:${flip ? '0 1.837px 1.837px 0' : '1.837px 0 0 1.837px'}"></span>
  <span style="position:absolute;left:${pagesLeft}px;top:${top + (h - h * 0.7222) / 2}px;width:29.939px;height:${h * 0.7222}px;background:var(--c-cream);border-radius:${flip ? '0 1.837px 1.837px 0' : '1.837px 0 0 1.837px'}"></span>`;

export default {
  id: '3',
  render() {
    const ticks = Array.from({ length: 26 }, (_, i) => 15 + i * 15)
      .map((x) => `<span style="position:absolute;left:${x - 1}px;top:0;width:2px;height:5px;background:var(--c-pink)"></span>`)
      .join('');
    return `
    <section class="screen" data-bg="dark" data-screen="3">
      ${backButton('pink')}
      <h1 class="f-display s35 c-pink center cx" style="left:201px;top:80px">Al Galope</h1>

      <!-- Escenario (recorta todo lo que sale por los lados) -->
      <div class="galope-arena layer" style="left:20px;top:151px;width:362px;height:400px;border-radius:10px;background:var(--c-pink-15);overflow:hidden;touch-action:manipulation;cursor:pointer">
        <p class="f-text s15 c-cream galope-meters" style="left:20px;top:20px">0000 m</p>
        <p class="f-display s35 c-cream center cx galope-intro" style="left:181.5px;top:90px"><span class="galope-blink">Toca para galopar</span></p>
        <p class="f-text s20 c-pink galope-intro" style="left:55px;top:141px">salta la pila de libros pendientes</p>

        <img src="${IMG('game-ground-line.svg')}" alt="" style="left:0;top:338px;width:362px;height:2px">
        <div class="galope-ticks" style="left:0;top:340px;width:400px;height:5px">${ticks}</div>

        <div class="galope-start-pile" style="left:0;top:0;width:0;height:0">
          ${book(248, 277, 14, 'var(--c-blue)', 254.24)}
          ${book(251, 291, 14, 'var(--c-pink)', 257.24)}
          ${book(247, 305, 14, 'var(--c-blue)', 247, true)}
          ${book(251, 319, 19, 'var(--c-pink)', 257.24)}
        </div>

        <div class="galope-horse" style="left:40px;top:277px;width:82.1px;height:60.923px">
          <img src="${IMG('game/horse-a.svg')}" alt="" style="position:absolute;left:0;bottom:0">
        </div>

        <!-- ¡Plof! (fin de partida) -->
        <div class="galope-over" style="left:0;top:0;width:362px;height:400px;visibility:hidden;pointer-events:none">
          <span style="position:absolute;left:30px;top:70px;width:302px;height:120px;border-radius:10px;background:var(--c-cream)"></span>
          <p class="f-display c-dark center" style="position:absolute;left:181.5px;top:90px;transform:translateX(-50%);font-size:35px;line-height:0.95;letter-spacing:-0.05em">¡Plof!</p>
          <p class="f-text s15 c-dark" style="position:absolute;left:67px;top:134px">la pila de libros pendientes te ha tirado</p>
          <p class="f-text s15 c-dark" style="position:absolute;left:102px;top:162px"><span class="galope-blink">toca para volver a galopar</span></p>
        </div>
      </div>
      <span style="left:20px;top:151px;width:362px;height:400px;border:2px solid var(--c-pink);border-radius:10px;pointer-events:none"></span>

      <!-- Récord -->
      <span style="left:20px;top:561px;width:362px;height:40px;border:2px solid var(--c-pink);border-radius:10px"></span>
      <p class="f-text s25 c-cream" style="left:91px;top:567px">récord</p>
      <p class="f-text s25 c-cream galope-record" style="left:259px;top:567px;transform-origin:0 50%">${state.game.record} m</p>

      <!-- Botón saltar -->
      <button class="galope-jump" style="left:151px;top:687px;width:100px;height:100px;border-radius:50px;border:2px solid var(--c-pink);background:var(--c-pink-15);touch-action:manipulation" aria-label="Saltar">
        <span class="f-text s25 c-cream">salta</span>
      </button>
    </section>`;
  },
  mount(el) {
    return createGalope(el, {
      record: state.game.record,
      onRecord: (m) => update((s) => { s.game.record = m; }),
    });
  },
};
