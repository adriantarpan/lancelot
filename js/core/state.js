/* ==========================================================================
   ESTADO — una única fuente de verdad, persistida en localStorage.
   Todas las pantallas leen `state` y lo modifican con `update()`.
   ========================================================================== */

import { initialState, CLUB, BOOK, ACHIEVEMENTS } from './data.js';

const KEY = 'lancelot.prototype.v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    // Si los datos de ejemplo han cambiado de versión, se empieza de cero
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.version === initialState().version) return saved;
    }
  } catch (e) { /* modo privado o storage bloqueado: seguimos en memoria */ }
  return initialState();
}

export let state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

/** Modifica el estado con una función y lo guarda. */
export function update(fn) {
  fn(state);
  save();
}

/** Botón oculto: vuelve a los datos de ejemplo. */
export function reset() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  state = initialState();
  save();
}

/* ---------- Consultas (derivadas del estado) ---------- */

export const memberName = (id) => CLUB.members[id] ?? id;

export const commentsOf = (ch) => state.comments.filter((c) => c.chapter === ch);

/** Profecías que se abren en el capítulo `ch` (las que se ven en su pestaña). */
export const propheciesRevealedIn = (ch) =>
  state.prophecies.filter((p) => p.reveal === ch && (p.author !== 'me' || p.verdict));

/** "1 comentario" / "4 comentarios" */
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** "N comentarios y M profecías te esperan": lo que han dejado los demás. */
export function waitingCounts(ch) {
  return {
    comments: commentsOf(ch).filter((c) => c.author !== 'me').length,
    prophecies: state.prophecies.filter((p) => p.reveal === ch && p.author !== 'me').length,
  };
}

/** Logro que toca enseñar ahora: el más alto alcanzado y aún no visto.
    (Si saltas varias fases de golpe, solo sale el último y los anteriores se dan por vistos.) */
export function pendingAchievement() {
  const reached = ACHIEVEMENTS.filter((a) => state.currentChapter >= a.from && !state.seenAchievements.includes(a.id));
  return reached[reached.length - 1] ?? null;
}

/** Logro de la fase de un capítulo ("Ya he llegado"): solo si aún no se ha mostrado.
    Los mostrados se guardan en state.seenAchievements (localStorage; el reset los borra). */
export function achievementForChapter(ch) {
  const a = ACHIEVEMENTS.find((x) => ch >= x.from && ch <= x.to);
  if (!a || state.seenAchievements.includes(a.id)) return null;
  return a;
}

/** Marca un logro como mostrado (no vuelve a salir). */
export function markAchievementShown(id) {
  update((s) => { if (!s.seenAchievements.includes(id)) s.seenAchievements.push(id); });
}

/** Marca como vistos todos los logros hasta el capítulo actual (incluido). */
export function markAchievementsSeen() {
  update((s) => {
    ACHIEVEMENTS.filter((a) => s.currentChapter >= a.from).forEach((a) => {
      if (!s.seenAchievements.includes(a.id)) s.seenAchievements.push(a.id);
    });
  });
}

export const phaseOf = (ch) => BOOK.phases.find((p) => ch >= p.from && ch <= p.to) ?? BOOK.phases[0];

/** Tu profecía sellada que ya toca abrir (se revela en `ch` o antes) y aún no has calificado. */
export const pendingRevealFor = (ch) =>
  state.prophecies.find((p) => p.author === 'me' && p.reveal <= ch && !p.verdict);

/** Cartas del mazo: profecías compartidas + preguntas (comentarios con "?"),
    solo hasta tu capítulo (sin spoilers). */
export function deckCards(filter = 'todas') {
  const upTo = state.currentChapter;
  const prophecies = state.prophecies
    .filter((p) => p.shared && p.reveal <= upTo && (p.author !== 'me' || p.verdict))
    .map((p) => ({ type: 'profecía', chapter: p.reveal, kicker: '¿quién lo vio venir?', text: p.text, author: p.author, id: p.id }));
  const questions = state.comments
    .filter((c) => c.text.includes('?') && c.chapter <= upTo)
    .map((c) => ({ type: 'pregunta', chapter: c.chapter, kicker: '', text: c.text, author: c.author, id: c.id }));
  const all = [...prophecies, ...questions].sort((a, b) => a.chapter - b.chapter);
  if (filter === 'preguntas') return questions;
  if (filter === 'profecías') return prophecies;
  return all;
}

export function shieldsLeft() {
  const s = state.shields;
  return s.perMonth - s.used - (s.raised ? 1 : 0);
}

export function meetingArrived() {
  const me = state.currentChapter > CLUB.meeting.untilChapter ? 1 : 0;
  return CLUB.meeting.othersArrived + me;
}
