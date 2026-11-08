/* ==========================================================================
   4 y 5 · CAPÍTULO — pestañas Profecías (4) y Comentarios (5)
   · 4: profecías que se abren en este capítulo, con su veredicto.
        "Profetizar el cap. X+1" → 6.1 (solo en tu capítulo actual).
   · 5: comentarios del capítulo. Al enviar uno con "?", entra solo al mazo
        como pregunta (ver deckCards() en state.js).
   ========================================================================== */

import { IMG, backButton, esc } from '../components/ui.js';
import { state, update, commentsOf, propheciesRevealedIn, memberName } from '../core/state.js';
import { go, refresh } from '../core/router.js';
import { BOOK } from '../core/data.js';

const VERDICT_LABEL = { acerte: 'acerté', casi: 'casi', lejos: 'ni de lejos' };

/* Pestañas: dos botones independientes. La activa es oscura con texto rosa;
   al cambiar no hay animación de desplazamiento (solo funde la lista). */
const tabs = (ch, active) => `
  <button class="tab${active === 'p' ? ' is-active' : ''}" data-tab="p" data-nav="4" data-params='{"ch":${ch}}' style="left:20px">Profecías</button>
  <button class="tab${active === 'c' ? ' is-active' : ''}" data-tab="c" data-nav="5" data-params='{"ch":${ch}}' style="left:211px">Comentarios</button>`;

const header = (ch) => `
  ${backButton('dark')}
  <h1 class="f-display s35 c-dark center cx" style="left:201.5px;top:80px">Capítulo ${ch}</h1>`;

const prophecyCard = (p) => `
  <article class="post ${p.author === 'me' ? 'post--mine' : ''}">
    <div class="post__head">
      <span class="f-text s20">${memberName(p.author)} · desde cap. ${p.madeAt}</span>
      ${p.verdict ? `<span class="chip chip--${p.verdict}">${VERDICT_LABEL[p.verdict]}</span>` : ''}
    </div>
    <p class="post__body post__body--quote">“${esc(p.text)}”</p>
  </article>`;

const commentCard = (c) => `
  <article class="post ${c.author === 'me' ? 'post--mine' : ''}">
    <div class="post__head"><span class="f-text s20">${memberName(c.author)} · ${c.when}</span></div>
    <p class="post__body post__body--text">${esc(c.text)}</p>
  </article>`;

const chapterOf = (params) => Number(params.ch) || state.currentChapter;

export const ChapterProphecies = {
  id: '4',
  render(params) {
    const ch = chapterOf(params);
    const isCurrent = ch === state.currentChapter && ch < BOOK.chapters; // en el último capítulo no hay siguiente que profetizar
    return `
    <section class="screen" data-screen="4">
      ${header(ch)}
      ${tabs(ch, 'p')}
      <div class="feed">${propheciesRevealedIn(ch).map(prophecyCard).join('')}</div>
      ${isCurrent ? `<button class="btn btn--dark" data-nav="6.1" style="left:20px;top:774px;width:362px">profetizar el cap. ${ch + 1}</button>` : ''}
    </section>`;
  },
  mount(el) {
  },
};

export const ChapterComments = {
  id: '5',
  render(params) {
    const ch = chapterOf(params);
    return `
    <section class="screen" data-screen="5">
      ${header(ch)}
      ${tabs(ch, 'c')}
      <div class="feed">${commentsOf(ch).map(commentCard).join('')}</div>
      <!-- Barra de comentario anclada abajo: sube con el teclado (data-kb-anchor) -->
      <form id="compose" data-kb-anchor="bottom" style="inset:auto;left:0;top:0;width:0;height:0">
        <input class="composer" name="text" maxlength="280" autocomplete="off" autocorrect="off" spellcheck="false"
          inputmode="none" data-kb="text" data-kb-enter="submit" data-kb-return="enviar"
          placeholder="escribe sobre el cap. ${ch}">
        <button class="send" aria-label="Enviar">
          <span class="send__icon"><span><img src="${IMG('icon-send.svg')}" alt=""></span></span>
        </button>
      </form>
    </section>`;
  },
  mount(el, params) {
    const ch = chapterOf(params);
    el.querySelector('#compose').addEventListener('submit', (e) => {
      e.preventDefault();
      const text = e.target.text.value.trim();
      if (!text) return;
      update((s) => {
        // Se añade arriba del todo. Si lleva "?", deckCards() lo recoge como pregunta.
        s.comments.unshift({ id: `c${Date.now()}`, chapter: ch, author: 'me', when: 'ahora', text });
      });
      refresh();
    });
  },
};
