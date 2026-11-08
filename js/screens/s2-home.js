/* ==========================================================================
   2 · HOME — Mi lectura  (+ 2.1 y 2.2)
   · Rueda de capítulos (arrastrar con snap; tocar uno lo centra; tocar el
     centrado lo abre: ≤ tu capítulo → 4 Profecías · > tu capítulo → 9 Bloqueado).
   · 2.1: si la rueda no está en tu capítulo aparece "Volver a tu capítulo".
   · "Añadir capítulo" → hoja 2.2 con la misma rueda (pendiente) →
     "Guardar progreso" aplica: 7 (si se abre una profecía tuya) · logro
     (fase II, fase III o libro terminado) · o Home animada.
   · Píldora Mi lectura / Reunión y botón del caballo (minijuego).
   Para revisar: #/2.1 (rueda movida) y #/2.2 (hoja abierta).
   ========================================================================== */

import { IMG, esc, navPill, mountNavPill } from '../components/ui.js';
import { startCoachmarks } from '../components/coachmarks.js';
import { resetPrototype } from '../core/resetPrototype.js';
import { createWheel } from '../components/wheel.js';
import { openProgressSheet } from '../components/progressSheet.js';
import { BOOK, CLUB } from '../core/data.js';
import { state, update, waitingCounts, phaseOf, pendingRevealFor, pendingAchievement, plural } from '../core/state.js';
import { go } from '../core/router.js';

let selected = null;   // capítulo centrado en la rueda
let justSaved = null;  // { from } → para animar la Home tras guardar

function subtitleFor(ch) {
  const { comments, prophecies } = waitingCounts(ch);
  const counts = `${plural(comments, 'comentario', 'comentarios')} y ${plural(prophecies, 'profecía', 'profecías')} te esperan`;
  return ch === state.currentChapter ? `estás aquí · ${counts}` : counts;
}

const backLinkHTML = () =>
  selected !== state.currentChapter
    ? `<button class="back-to-mine" id="back-to-mine" style="left:205px;top:614px">Volver a tu capítulo</button>`
    : '';

/** Guarda el progreso y decide a dónde ir. */
function saveProgress(newChapter) {
  const before = state.currentChapter;
  if (newChapter <= before) return go('2', {}, { replace: true });
  update((s) => { s.currentChapter = newChapter; });
  selected = newChapter;

  const reveal = pendingRevealFor(newChapter);
  if (reveal) return go('7', { id: reveal.id });
  const achievement = pendingAchievement(); // fase II (11), fase III (21) o libro terminado (30)
  if (achievement) return go('logro', { id: achievement.id });

  justSaved = { from: before };
  go('2', {}, { replace: true });
}

function render(params, variant) {
  if (variant === '2.1') selected = state.currentChapter + 2;
  if (selected == null || selected > BOOK.chapters || selected < 1) selected = state.currentChapter;
  return `
    <section class="screen" data-screen="2" data-variant="${variant}">
      <img src="${IMG('home-header-pink-scallop.svg')}" alt="" style="left:0;top:0;width:402px;height:311.23px">

      <!-- Avatar (cabeza del caballo) + nombre -->
      <!-- Avatar: reinicia el prototipo (con confirmación) -->
      <button class="avatar" id="avatar" aria-label="Reiniciar el prototipo"><img src="${IMG('avatar-horse.svg')}" alt=""></button>
      <!-- Nombre: se edita aquí mismo con el teclado simulado y se guarda -->
      <input class="user-name f-text s25 c-dark" id="user-name" data-kb="text" data-kb-enter="done" inputmode="none"
        maxlength="16" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Tu nombre"
        placeholder="tu nombre" value="${esc(state.userName)}" style="left:78px;top:91.25px;width:260px;height:27.5px">
      <img src="${IMG('icon-bookmark.svg')}" alt="" style="left:358px;top:91px;width:24px;height:32.156px">

      <p class="f-text s20 c-dark" style="left:20px;top:140px">${CLUB.name}</p>
      <p class="f-text s20 c-dark" style="left:20px;top:167px">${phaseOf(state.currentChapter).label}</p>
      <h1 class="f-display s45 c-cream" style="left:20px;top:199px">${BOOK.titleLines.join('<br>')}</h1>

      <div class="wheel" style="inset:0"></div>
      <div class="layer" id="back-link" style="inset:0;pointer-events:none"></div>

      <button id="add" class="btn btn--outline" style="left:20px;top:662px;width:362px;border-radius:7px">añadir capítulo</button>

      ${navPill('reading')}
    </section>`;
}

function mount(el, params, variant) {
  mountNavPill(el); // la burbuja viaja si venimos de Reunión

  // Llegar a la Home (también con "Saltar") da el onboarding por terminado
  if (!state.onboarded) update((s) => { s.onboarded = true; });

  // Nombre editable (se guarda al escribir) y avatar que reinicia el prototipo
  el.querySelector('#user-name').addEventListener('input', (e) => {
    update((s) => { s.userName = e.target.value.trim(); });
  });
  el.querySelector('#avatar').addEventListener('click', resetPrototype);

  // Indicaciones de la primera visita (2.0.1 → 2.0.3)
  if (!state.coachSeen && variant === '2') startCoachmarks(el, () => update((s) => { s.coachSeen = true; }));
  const wheelEl = el.querySelector('.wheel');
  const linkLayer = el.querySelector('#back-link');

  const paintLink = () => {
    linkLayer.innerHTML = backLinkHTML();
    linkLayer.querySelector('button')?.style.setProperty('pointer-events', 'auto');
  };

  // Rueda: el mismo componente que 1.3 y la hoja 2.2
  const wheel = createWheel(wheelEl, {
    variant: 'home',
    total: BOOK.chapters,
    value: justSaved ? justSaved.from : selected,
    subtitle: subtitleFor,
    onChange: (ch) => {
      selected = ch;
      paintLink();
      // 2.1: si el capítulo centrado aún no está leído, el recuadro pasa a gris con borde discontinuo
      wheelEl.querySelector('.wheel-box').classList.toggle('is-unread', ch > state.currentChapter);
    },
    onTapCenter: (ch) => (ch <= state.currentChapter ? go('4', { ch }) : go('9', { ch })),
  });
  paintLink();

  linkLayer.addEventListener('click', (e) => {
    if (e.target.closest('#back-to-mine')) wheel.set(state.currentChapter);
  });

  const openSheet = (pre) => {
    openProgressSheet(el, {
      min: Math.min(state.currentChapter + 1, BOOK.chapters),
      total: BOOK.chapters,
      selected: pre,
      onSave: saveProgress,
      onClose: () => { if (location.hash !== '#/2') go('2', {}, { replace: true }); },
    });
  };
  el.querySelector('#add').addEventListener('click', () => openSheet(state.currentChapter + 1));

  // Abierta desde 9 ("Ya he llegado") o desde #/2.2
  if (params.add || variant === '2.2') openSheet(Number(params.add) || state.currentChapter + 2);

  // Transición sutil tras guardar: la rueda gira desde el capítulo anterior
  // hasta el nuevo y el recuadro hace un destello rosa que se apaga.
  if (justSaved) {
    justSaved = null;
    gsap.delayedCall(0.1, () => wheel.set(state.currentChapter));
    gsap.fromTo(wheelEl.querySelector('.wheel-box'),
      { backgroundColor: 'rgba(255,129,230,0.65)' },
      { backgroundColor: 'rgba(255,129,230,0.3)', duration: 0.9, delay: 0.25, ease: 'power1.out' });
  }
}

const Home = { id: '2', render: (p) => render(p, '2'), mount: (el, p) => mount(el, p, '2') };
export const HomeMoved = { id: '2.1', render: (p) => render(p, '2.1'), mount: (el, p) => mount(el, p, '2.1') };
export const HomeSheet = { id: '2.2', render: (p) => render(p, '2.2'), mount: (el, p) => mount(el, p, '2.2') };
export default Home;
