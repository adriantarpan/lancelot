/* ==========================================================================
   9 · AÚN NO HAS LLEGADO AQUÍ — capítulo por delante del tuyo.
   · "Profetizar el cap. X" → 6.1 con la profecía revelándose en ese capítulo.
   · "Ya he llegado"        → marca el capítulo y guarda el progreso. Después
                              sale el logro de su fase (11–20 Fase II, 21–29
                              Fase III, 30 Libro terminado) si aún no salió;
                              al cerrarlo, sus profecías y comentarios (4).
                              Si ya salió, solo se actualiza el progreso.
                              Si tenías una profecía para ese capítulo, antes
                              se abre su revelación (7 → 8).
   · "Seguir leyendo"       → vuelve a la Home sin cambiar tu progreso.
   ========================================================================== */

import { IMG, backButton } from '../components/ui.js';
import { state, update, waitingCounts, plural, achievementForChapter, pendingRevealFor } from '../core/state.js';
import { go } from '../core/router.js';

const chapterOf = (params) => Number(params.ch) || state.currentChapter + 1;

export default {
  id: '9',
  render(params) {
    const ch = chapterOf(params);
    const { comments, prophecies } = waitingCounts(ch);
    return `
    <section class="screen" data-screen="9">
      ${backButton('dark')}
      <h1 class="f-display s35 c-dark center cx" style="left:201.5px;top:80px">Capítulo ${ch}</h1>
      <img src="${IMG('shield-pink.svg')}" alt="" style="left:166px;top:236px;width:70px;height:87.918px">

      <h2 class="f-display s58 c-dark center cx" style="left:201px;top:343.8px">Aún no has<br>llegado aquí</h2>
      <p class="f-text s25 c-dark center cx" style="left:201px;top:467.8px">${plural(comments, 'comentario', 'comentarios')} y ${plural(prophecies, 'profecía', 'profecías')}<br>te esperan</p>

      <button class="btn btn--dark"    data-nav="6.1" data-params='{"reveal":${ch}}' style="left:20px;top:672px;width:362px">profetizar el cap. ${ch}</button>
      <button class="btn btn--outline" id="arrived" style="left:20px;top:732px;width:362px">ya he llegado</button>
      <button class="link c-pink cx"   data-nav="2"                                  style="left:201.5px;top:802px">seguir leyendo</button>
    </section>`;
  },
  mount(el, params) {
    el.querySelector('#arrived').addEventListener('click', () => {
      const ch = chapterOf(params);
      // Tu progreso pasa a este capítulo y entras directo a su conversación
      // 1. Marca el capítulo y guarda el progreso (Home, barra, contenido desbloqueado…)
      update((s) => { if (ch > s.currentChapter) s.currentChapter = ch; });
      // 2. Si tenías una profecía que se revela al llegar aquí, primero se abre
      //    (7 → romper el sello → 8), igual que al guardar progreso en la Home.
      //    Al salir de ahí ("seguir leyendo") sale el logro que toque.
      const reveal = pendingRevealFor(ch);
      if (reveal) return go('7', { id: reveal.id }, { replace: true });
      // 3. Logro de la fase de ese capítulo (rangos en data.js). Al cerrarlo se
      //    vuelve a este capítulo, ya leído: sus profecías y comentarios (4).
      const achievement = achievementForChapter(ch);
      if (achievement) go('logro', { id: achievement.id, next: '4', ch }, { replace: true });
      else go('4', { ch }, { replace: true });
    });
  },
};
