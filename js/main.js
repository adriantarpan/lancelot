/* ==========================================================================
   MAIN — arranque del prototipo.
   · Registra todas las pantallas (una por archivo en js/screens/).
   · Decide la pantalla inicial (onboarding o Home).
   · Navegación por delegación: [data-nav] y [data-action="back"].
   · Reset oculto: triple toque en la esquina superior izquierda o Shift+R.
   ========================================================================== */

import { initFit } from './core/fit.js';
import { preloadImages } from './core/preload.js';
import { register, start, go } from './core/router.js';
import { state, reset } from './core/state.js';
import { bindNav } from './components/ui.js';
import { initKeyboard } from './components/keyboard.js';
import { resetPrototype } from './core/resetPrototype.js';

import Welcome from './screens/s1-1-welcome.js';
import Join from './screens/s1-2-join.js';
import Pace from './screens/s1-3-pace.js';
import Notifications from './screens/s1-4-notifications.js';
import Home, { HomeMoved, HomeSheet } from './screens/s2-home.js';
import Game from './screens/s3-game.js';
import { ChapterProphecies, ChapterComments } from './screens/s4-5-chapter.js';
import { ProphecyWrite, ProphecyEnvelopeFull, ProphecyEnvelopeOpen, ProphecySealed } from './screens/s6-prophecy.js';
import { ArrivalSealed, ArrivalReveal } from './screens/s7-8-arrival.js';
import Locked from './screens/s9-locked.js';
import Meeting from './screens/s10-meeting.js';
import { Deck, DeckCard } from './screens/s11-deck.js';
import Achievement from './screens/s-logro.js';

register([
  Welcome, Join, Pace, Notifications,
  Home, HomeMoved, HomeSheet, Game, ChapterProphecies, ChapterComments,
  ProphecyWrite, ProphecyEnvelopeFull, ProphecyEnvelopeOpen, ProphecySealed,
  ArrivalSealed, ArrivalReveal, Locked, Meeting, Deck, DeckCard, Achievement,
]);

/* A dónde lleva la flecha de volver en cada pantalla (más fiable que el historial) */
const BACK = {
  '1.2': () => go('1.1'),
  '1.3': () => go('1.2'),
  '1.4': () => go('1.3'),
  '3':   () => go('2'),
  '4':   () => go('2'),
  '5':   () => go('2'),
  '6.1': () => go('4', { ch: state.currentChapter }),
  '6.2': () => go('4', { ch: state.currentChapter }),
  '6.3': () => go('4', { ch: state.currentChapter }),
  '6.4': () => go('4', { ch: state.currentChapter }),
  '9':   () => go('2'),
  '11.2': () => go('11.1'),
};
const back = () => {
  const id = document.querySelector('[data-screen]')?.dataset.screen;
  (BACK[id] ?? (() => go('2')))();
};

const app = document.getElementById('app');
preloadImages(); // todas las imágenes listas desde el principio (sin destellos)
initFit();
bindNav(app, go, back);
initKeyboard(document.getElementById('stage')); // teclado simulado para todos los [data-kb]

start(app, {
  fallback: state.onboarded ? '2' : '1.1',
  // Sin hash → pantalla de inicio según si ya hiciste el onboarding
  beforeRender: (id) => (id ? null : { id: state.onboarded ? '2' : '1.1', params: {} }),
});

/* ---------- Reset oculto ---------- */
const doReset = resetPrototype; // mismo reinicio que el avatar de la Home (js/core/resetPrototype.js)
let taps = [];
document.getElementById('reset-hotspot').addEventListener('click', () => {
  const now = Date.now();
  taps = [...taps.filter((t) => now - t < 600), now];
  if (taps.length >= 3) { taps = []; doReset(); }
});
addEventListener('keydown', (e) => {
  if (e.shiftKey && e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) doReset();
});

/* App instalable: registra el service worker (solo en la versión publicada;
   en el servidor local no hace falta y así no interfiere al desarrollar) */
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
