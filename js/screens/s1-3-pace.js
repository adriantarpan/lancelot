/* ==========================================================================
   1.3 · PASO 2 · TU RITMO
   Rueda de capítulos (mismo componente que la Home y la hoja 2.2):
   se arrastra en vertical con snap; tocar un capítulo lo centra.
   "Escoger capítulo" guarda el capítulo centrado y lleva a 1.4.
   ========================================================================== */

import { backButton, darkHeader, stepBar, mountStepBar } from '../components/ui.js';
import { createWheel } from '../components/wheel.js';
import { BOOK } from '../core/data.js';
import { state, update, markAchievementsSeen } from '../core/state.js';
import { go } from '../core/router.js';

let selected = null; // capítulo marcado en la rueda mientras estás en la pantalla

export default {
  id: '1.3',

  render() {
    if (selected == null) selected = state.onboarded ? state.currentChapter : 4; // Figma muestra el 4
    return `
    <section class="screen" data-screen="1.3">
      ${darkHeader()}
      ${backButton('light')}
      ${stepBar(2)}
      <button class="link c-cream cx" data-nav="2" style="left:357.5px;top:85px">saltar</button>

      <p class="f-text s20 c-cream" style="left:20px;top:140px">paso 2 · tu ritmo</p>
      <h1 class="f-display s45 c-pink" style="left:20px;top:182px">¿Que capítulo<br>estas leyendo?</h1>

      <p class="f-text s20 c-dark center cx" style="left:201px;top:349px">desliza hasta el capítulo<br>en el que te encuentres</p>

      <div class="wheel" style="inset:0"></div>

      <p class="f-text s15 c-dark-50 center cx wrap" style="left:201.5px;top:695px;width:281px">Nadie verá tu capítulo exacto. La mesa solo sabe cuántos habéis llegado, nunca quién falta.</p>

      <button id="pick" class="btn btn--dark" style="left:20px;top:774px;width:362px">escoger capítulo</button>
    </section>`;
  },

  mount(el) {
    mountStepBar(el); // la barra de pasos se anima desde el paso anterior
    const wheel = createWheel(el.querySelector('.wheel'), {
      variant: 'onboarding',
      total: BOOK.chapters,
      value: selected,
      onChange: (ch) => { selected = ch; },
    });
    el.querySelector('#pick').addEventListener('click', () => {
      update((s) => { s.currentChapter = wheel.value(); });
      markAchievementsSeen(); // si ya ibas más avanzado, no te enseña logros de fases que no has vivido aquí
      go('1.4');
    });
    return () => wheel.destroy();
  },
};
