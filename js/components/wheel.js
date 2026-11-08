/* ==========================================================================
   RUEDA DE CAPÍTULOS — un único componente para:
     · 1.3  onboarding ("¿Qué capítulo estás leyendo?")
     · 2    Home (con subtítulo bajo el capítulo centrado)
     · 2.2  hoja "¿Hasta dónde has llegado?"
   Mismo aspecto, mismo snap y misma atenuación; solo cambian las medidas,
   que salen de cada frame de Figma (tabla LAYOUT).

   Interacción:
     · Arrastrar en vertical mueve la rueda; al soltar se queda en el
       capítulo más cercano (snap) con un poco de inercia.
     · Tocar un capítulo que no está en el centro lo lleva al centro.
     · Tocar el capítulo centrado llama a onTapCenter (si existe).
   El capítulo centrado se ve más grande y oscuro; los demás se atenúan
   según su distancia al centro (tamaño y opacidad interpolados).
   Animaciones (GSAP): snap 0.45s power3.out.
   ========================================================================== */

/* Por variante: para cada distancia al centro (d), `top` del texto en Figma,
   tamaño de letra y opacidad. Entre valores se interpola. */
const LAYOUT = {
  // Frame 1.3
  onboarding: {
    rows: { '-3': [370, 25, 0], '-2': [413, 25, 0.2], '-1': [456, 30, 0.5], 0: [510, 35, 1], 1: [569, 30, 0.5], 2: [617, 25, 0.2], 3: [660, 25, 0] },
    box: { top: 504, h: 50, radius: 10, fill: true },
    hit: { top: 400, h: 260 },
    step: 51,
  },
  // Frames 2 / 2.1
  home: {
    rows: { '-3': [287, 25, 0], '-2': [330, 25, 0.2], '-1': [373, 30, 0.5], 0: [432, 35, 1], 1: [518, 30, 0.5], 2: [566, 25, 0.2], 3: [609, 25, 0] },
    box: { top: 421, h: 82, radius: 10, fill: true },
    hit: { top: 320, h: 290 },
    step: 59,
    subtitle: true,
  },
  // Frame 2.2 (coordenadas relativas a la hoja, que empieza en y=383)
  sheet: {
    rows: { '-2': [98, 20, 0], '-1': [146, 20, 0.5], 0: [194, 25, 1], 1: [248, 20, 0.5], 2: [300, 20, 0] },
    box: { top: 183, h: 50, radius: 7, fill: false },
    hit: { top: 120, h: 190 },
    step: 51,
  },
};

const CX = 201.5; // eje central de los textos en Figma
const DARK = '36, 7, 15';

/** Interpola [top, size, alpha] para una distancia d (puede ser decimal). */
function sample(rows, d) {
  const keys = Object.keys(rows).map(Number).sort((a, b) => a - b);
  const min = keys[0];
  const max = keys[keys.length - 1];
  if (d <= min) return rows[min].map((v, i) => (i === 0 ? v + (d - min) * (rows[min + 1][0] - rows[min][0]) : v));
  if (d >= max) return rows[max].map((v, i) => (i === 0 ? v + (d - max) * (rows[max][0] - rows[max - 1][0]) : v));
  const a = Math.floor(d);
  const t = d - a;
  return rows[a].map((v, i) => v + (rows[a + 1][i] - v) * t);
}

/**
 * Crea una rueda dentro de `container` (un div con inset:0 en coordenadas de Figma).
 * @param {HTMLElement} container
 * @param {object} o
 * @param {'onboarding'|'home'|'sheet'} o.variant
 * @param {number} o.total               nº de capítulos (BOOK.chapters)
 * @param {number} o.value               capítulo inicial
 * @param {number} [o.min=1]             primer capítulo seleccionable
 * @param {(ch:number)=>string} [o.subtitle]  texto bajo el centrado (Home)
 * @param {(ch:number)=>void} [o.onChange]    al asentarse en un capítulo
 * @param {(ch:number)=>void} [o.onTapCenter] al tocar el centrado
 * @returns {{ value:()=>number, set:(ch:number, animate?:boolean)=>void, refresh:()=>void, destroy:()=>void }}
 */
export function createWheel(container, o) {
  const L = LAYOUT[o.variant];
  const min = o.min ?? 1;
  const max = o.total;
  const pos = { v: o.value }; // posición continua (capítulo con decimales)

  container.innerHTML = `
    <div class="wheel-box" data-center style="top:${L.box.top}px;height:${L.box.h}px;border-radius:${L.box.radius}px;${L.box.fill ? '' : 'background:none'}"></div>
    ${Array.from({ length: max }, (_, i) => `<span class="wheel-item" data-ch="${i + 1}" style="left:${CX}px">Capítulo ${i + 1}</span>`).join('')}
    ${L.subtitle ? `<span class="wheel-sub f-text s15 c-dark center cx" style="left:${CX}px;top:${L.rows[0][0] + L.rows[0][1] * 1.1 + 5}px"></span>` : ''}
    <div class="wheel-hit" style="left:20px;top:${L.hit.top}px;width:362px;height:${L.hit.h}px"></div>`;

  const items = [...container.querySelectorAll('.wheel-item')];
  const sub = container.querySelector('.wheel-sub');
  const hit = container.querySelector('.wheel-hit');

  /* --- Pintar según la posición continua --- */
  function paint() {
    for (const el of items) {
      const d = Number(el.dataset.ch) - pos.v;
      if (Math.abs(d) > 3.5) { el.style.visibility = 'hidden'; continue; }
      const [top, size, alpha] = sample(L.rows, d);
      el.style.visibility = alpha < 0.01 ? 'hidden' : 'visible';
      el.style.top = `${top}px`;
      el.style.fontSize = `${size}px`;
      el.style.color = `rgba(${DARK}, ${alpha})`;
    }
    if (sub) {
      const off = Math.abs(pos.v - Math.round(pos.v));
      sub.style.opacity = String(Math.max(0, 1 - off * 4)); // solo se ve con la rueda asentada
    }
  }

  function settle(ch) {
    if (sub) sub.textContent = o.subtitle ? o.subtitle(ch) : '';
    o.onChange?.(ch);
  }

  /** Lleva la rueda a un capítulo (con snap animado por defecto). */
  function set(ch, animate = true) {
    const target = Math.min(max, Math.max(min, Math.round(ch)));
    gsap.killTweensOf(pos);
    if (!animate) { pos.v = target; paint(); settle(target); return; }
    gsap.to(pos, { v: target, duration: 0.45, ease: 'power3.out', onUpdate: paint, onComplete: () => settle(target) });
    if (sub) sub.textContent = o.subtitle ? o.subtitle(target) : '';
  }

  /* --- Gestos: arrastrar con snap, tocar para centrar --- */
  let drag = null; // { y0, v0, moved, samples[] }
  const scale = () => container.getBoundingClientRect().height / container.offsetHeight || 1;

  function onDown(e) {
    gsap.killTweensOf(pos);
    try { hit.setPointerCapture(e.pointerId); } catch (err) { /* puntero sintético */ }
    drag = { y0: e.clientY, v0: pos.v, moved: false, samples: [{ y: e.clientY, t: performance.now() }] };
  }
  function onMove(e) {
    if (!drag) return;
    const dy = (e.clientY - drag.y0) / scale();
    if (Math.abs(dy) > 4) drag.moved = true;
    let v = drag.v0 - dy / L.step;
    // resistencia en los extremos
    if (v < min) v = min - (min - v) * 0.3;
    if (v > max) v = max + (v - max) * 0.3;
    pos.v = v;
    paint();
    drag.samples.push({ y: e.clientY, t: performance.now() });
    if (drag.samples.length > 5) drag.samples.shift();
  }
  function onUp(e) {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) {
      // toque: ¿qué fila? (la más cercana a la posición del dedo)
      const rect = container.getBoundingClientRect();
      const y = (e.clientY - rect.top) / scale();
      let best = 0;
      let bestDist = Infinity;
      for (let k = -2; k <= 2; k++) {
        const [top, size] = sample(L.rows, k);
        const dist = Math.abs(top + size * 0.55 - y);
        if (dist < bestDist) { bestDist = dist; best = k; }
      }
      const ch = Math.round(pos.v) + best;
      if (best === 0 && o.onTapCenter) o.onTapCenter(Math.round(pos.v));
      else set(ch);
      return;
    }
    // inercia: velocidad de los últimos movimientos → algo más de recorrido
    const a = d.samples[0];
    const b = d.samples[d.samples.length - 1];
    const vel = (b.y - a.y) / scale() / Math.max(16, b.t - a.t); // px/ms
    set(pos.v - (vel * 120) / L.step);
  }

  hit.addEventListener('pointerdown', onDown);
  hit.addEventListener('pointermove', onMove);
  hit.addEventListener('pointerup', onUp);
  hit.addEventListener('pointercancel', onUp);

  set(o.value, false);

  return {
    value: () => Math.round(pos.v),
    set,
    refresh: () => settle(Math.round(pos.v)),
    destroy: () => gsap.killTweensOf(pos),
  };
}
