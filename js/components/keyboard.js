/* ==========================================================================
   TECLADO SIMULADO (estilo iOS, modo claro) — componente reutilizable.

   Uso: marca cualquier <input>/<textarea> con data-kb y listo.
     data-kb="text"            QWERTY español (ñ, mayúsculas, 123, #+=) — el mismo
                               teclado en todos los campos (código, comentario, profecía)
     autocapitalize="off"      sin mayúscula automática (p. ej. el código del club)
     data-kb-enter="submit"    "intro" envía el formulario del campo
     data-kb-enter="done"      "intro" confirma y cierra (por defecto)
     data-kb-return="enviar"   texto de la tecla de intro
     maxlength="140"           se respeta al escribir
     data-kb-anchor="bottom"   (en el contenedor del campo) esa barra sube con el
                               teclado y queda 10px por encima. El resto de la
                               pantalla NO se mueve.

   · Aparece al enfocar el campo; sale al tocar fuera o al confirmar.
   · Los campos llevan inputmode="none" para que el teclado nativo del
     móvil no salga encima de este.
   · Cada cambio dispara un evento "input" normal, así los contadores y
     botones de cada pantalla se actualizan solos.
   Animaciones (GSAP): entra 0.32s power3.out · sale 0.25s power2.in
   (las mismas para el teclado y la barra anclada; ver IN / OUT).
   ========================================================================== */

/* Misma animación para el teclado y para la barra anclada */
const IN = { duration: 0.32, ease: 'power3.out' };
const OUT = { duration: 0.25, ease: 'power2.in' };

const W = 402;            // ancho del lienzo
const PAD = 3;            // margen lateral
const INNER = W - PAD * 2;
const GAP = 6;            // separación entre teclas
const KEY_H = 42;        // alto de tecla (filas separadas 11px, ver keyboard.css)
const LETTER_W = (INNER - GAP * 9) / 10; // 34.2

/* ---------- Iconos (dibujados como los de iOS) ---------- */
const ICON = {
  shift: (fill) => `<svg width="20" height="19" viewBox="0 0 20 19"><path d="M10 1.6 1.6 10.2h4.8v6.6h7.2v-6.6h4.8z" fill="${fill ? '#000' : 'none'}" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  caps: `<svg width="20" height="21" viewBox="0 0 20 21"><path d="M10 1.6 1.6 10.2h4.8v5.1h7.2v-5.1h4.8z" fill="#000" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/><rect x="6.4" y="17.6" width="7.2" height="2" rx=".6" fill="#000"/></svg>`,
  del: `<svg width="25" height="19" viewBox="0 0 25 19"><path d="M8.3 1.6h14a1.6 1.6 0 0 1 1.6 1.6v12.6a1.6 1.6 0 0 1-1.6 1.6h-14L1.4 9.5z" fill="none" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/><path d="m12 6 7 7m0-7-7 7" stroke="#000" stroke-width="1.6" stroke-linecap="round"/></svg>`,
};

/* ---------- Distribuciones ---------- */
const evenRow = (chars, w = LETTER_W, start = null) => {
  const total = chars.length * w + (chars.length - 1) * GAP;
  const x0 = start ?? (INNER - total) / 2;
  return chars.map((c, i) => ({ k: c, x: x0 + i * (w + GAP), w, type: 'char' }));
};

const FN_W = 42;
const BOTTOM_FN_W = 88;
const bottomRow = (switchKey, switchLabel) => [
  { k: switchKey, label: switchLabel, x: 0, w: BOTTOM_FN_W, type: 'fn' },
  { k: ' ', label: 'espacio', x: BOTTOM_FN_W + GAP, w: INNER - 2 * (BOTTOM_FN_W + GAP), type: 'space' },
  { k: 'return', x: INNER - BOTTOM_FN_W, w: BOTTOM_FN_W, type: 'return' },
];
const punctRow = (switchKey, switchLabel) => {
  const fnW = 48;
  const inner = INNER - 2 * (fnW + GAP);
  const w = (inner - 4 * GAP) / 5;
  return [
    { k: switchKey, label: switchLabel, x: 0, w: fnW, type: 'fn' },
    ...evenRow(['.', ',', '¿', '?', '!'], w, fnW + GAP),
    { k: 'del', x: INNER - fnW, w: fnW, type: 'fn' },
  ];
};

const LAYOUTS = {
  letters: () => [
    evenRow([...'qwertyuiop']),
    evenRow([...'asdfghjklñ']),
    [{ k: 'shift', x: 0, w: FN_W, type: 'fn' }, ...evenRow([...'zxcvbnm']), { k: 'del', x: INNER - FN_W, w: FN_W, type: 'fn' }],
    bottomRow('to:numbers', '123'),
  ],
  numbers: () => [
    evenRow([...'1234567890']),
    evenRow(['-', '/', ':', ';', '(', ')', '€', '&', '@', '"']),
    punctRow('to:symbols', '#+='),
    bottomRow('to:letters', 'ABC'),
  ],
  symbols: () => [
    evenRow(['[', ']', '{', '}', '#', '%', '^', '*', '+', '=']),
    evenRow(['_', '\\', '|', '~', '<', '>', '$', '£', '¥', '•']),
    punctRow('to:numbers', '123'),
    bottomRow('to:letters', 'ABC'),
  ],
};

/* ---------- Estado del teclado ---------- */
let kb, rowsEl, pop;
let field = null;         // campo activo
let movedEl = null;       // barra anclada abajo que sube con el teclado (p. ej. comentarios)
let layout = 'letters';
let shift = false;        // mayúscula de un solo uso
let caps = false;         // bloqueo de mayúsculas
let lastShiftTap = 0;
let activeKey = null;     // tecla bajo el dedo
let repeatTimer = null;
let isOpen = false;

const autoCapOff = () => field?.getAttribute('autocapitalize') === 'off';
const height = () => kb.offsetHeight;

/* ---------- Pintado ---------- */
function keyLabel(key) {
  if (key.k === 'shift') return caps ? ICON.caps : ICON.shift(shift);
  if (key.k === 'del') return ICON.del;
  if (key.k === 'return') return field?.dataset.kbReturn || 'intro';
  if (key.label) return key.label;
  return shift || caps ? key.k.toUpperCase() : key.k;
}

function render() {
  const rows = LAYOUTS[layout]();
  rowsEl.innerHTML = rows.map((row) => `
    <div class="kb__row">
      ${row.map((key) => {
        const cls = ['kb__key'];
        if (key.type === 'char') cls.push('kb__key--letter');
        if (key.type === 'fn') cls.push('kb__key--fn');
        if (key.type === 'space') cls.push('kb__key--space');
        if (key.type === 'return') cls.push('kb__key--fn', 'kb__key--return');
        if (key.k === 'shift' && (shift || caps)) cls.push('is-on');
        return `<div class="${cls.join(' ')}" data-k="${encodeURIComponent(key.k)}" data-type="${key.type}" style="left:${key.x}px;width:${key.w}px">${keyLabel(key)}</div>`;
      }).join('')}
    </div>`).join('');
  updateReturnKey();
}

/** "Enviar" se pone azul cuando hay algo que enviar (como en iOS). */
function updateReturnKey() {
  const ret = rowsEl.querySelector('.kb__key--return');
  if (!ret || !field) return;
  const primary = field.dataset.kbEnter === 'submit' && field.value.trim().length > 0;
  ret.classList.toggle('is-primary', primary);
}

/* ---------- Escritura ---------- */
function emit() {
  field.dispatchEvent(new Event('input', { bubbles: true }));
  updateReturnKey();
}

function insert(text) {
  if (!field) return;
  const max = field.maxLength > 0 ? field.maxLength : Infinity;
  const { selectionStart: s, selectionEnd: e, value: v } = field;
  const room = max - (v.length - (e - s));
  if (room <= 0) return;
  field.setRangeText(text.slice(0, room), s, e, 'end');
  emit();
}

function backspace() {
  if (!field) return;
  const { selectionStart: s, selectionEnd: e } = field;
  if (s !== e) field.setRangeText('', s, e, 'end');
  else if (s > 0) field.setRangeText('', s - 1, s, 'end');
  else return;
  emit();
}

/** Mayúscula automática al empezar o tras ". ", "? ", "! " (salvo autocapitalize="off"). */
function autoShift() {
  if (!field || caps) return;
  if (autoCapOff()) { if (shift) { shift = false; render(); } return; }
  const before = field.value.slice(0, field.selectionStart);
  const next = before.trim() === '' || /[.!?¡¿]\s$/.test(before) || /\n$/.test(before);
  if (next !== shift) { shift = next; render(); }
}

function press(key) {
  const k = decodeURIComponent(key.dataset.k);
  const type = key.dataset.type;

  if (type === 'char') {
    insert(shift || caps ? k.toUpperCase() : k);
    if (shift && !caps) { shift = false; render(); }
    autoShift();
    return;
  }
  if (type === 'space') {
    insert(' ');
    autoShift();
    return;
  }
  if (k.startsWith('to:')) { layout = k.slice(3); shift = false; render(); return; }
  if (k === 'return') { confirm(); return; }
}

function onShiftDown() {
  const now = Date.now();
  if (caps) { caps = false; shift = false; }
  else if (now - lastShiftTap < 300) { caps = true; shift = false; } // doble toque = bloqueo
  else shift = !shift;
  lastShiftTap = now;
  render();
}

function confirm() {
  const mode = field?.dataset.kbEnter || 'done';
  const f = field;
  hide();
  if (mode === 'submit' && f?.form) f.form.requestSubmit();
}

/* ---------- Globo ampliado ---------- */
function showPop(key) {
  if (key.dataset.type !== 'char') { pop.classList.remove('is-on'); return; }
  // Coordenadas relativas a .kb__rows (la fila ya incluye el margen superior)
  const x = PAD + parseFloat(key.style.left);
  const w = key.offsetWidth;
  const top = key.parentElement.offsetTop;
  const bw = w + 24;
  const bx = Math.min(Math.max(x - 12, 2), W - bw - 2);
  const bubble = pop.firstElementChild;
  const stem = pop.lastElementChild;
  bubble.style.cssText = `left:${bx}px;top:${top - 50}px;width:${bw}px;height:54px`;
  stem.style.cssText = `left:${x}px;top:${top}px;width:${w}px;height:${KEY_H}px`;
  bubble.textContent = key.textContent;
  pop.classList.add('is-on');
}
function hidePop() { pop.classList.remove('is-on'); }

/* ---------- Gestos sobre las teclas ---------- */
function keyAt(x, y) {
  const el = document.elementFromPoint(x, y);
  return el?.closest?.('.kb__key') ?? null;
}

function setActive(key) {
  if (activeKey === key) return;
  activeKey?.classList.remove('is-down');
  activeKey = key;
  if (key) { key.classList.add('is-down'); showPop(key); }
  else hidePop();
}

function onPointerDown(e) {
  e.preventDefault(); // el campo no pierde el foco
  const key = e.target.closest('.kb__key');
  if (!key) return;
  try { kb.setPointerCapture(e.pointerId); } catch (err) { /* puntero sintético */ }
  const k = decodeURIComponent(key.dataset.k);
  if (k === 'shift') { onShiftDown(); return; }
  if (k === 'del') {
    key.classList.add('is-down');
    activeKey = key;
    backspace();
    autoShift();
    repeatTimer = setTimeout(function repeat() {
      backspace();
      repeatTimer = setTimeout(repeat, 70);
    }, 420);
    return;
  }
  setActive(key);
}

function onPointerMove(e) {
  if (!activeKey || activeKey.dataset.k === 'del') return;
  const key = keyAt(e.clientX, e.clientY);
  if (key && key.dataset.type === 'char') setActive(key);
}

function onPointerUp() {
  clearTimeout(repeatTimer);
  const key = activeKey;
  setActive(null);
  key?.classList.remove('is-down');
  if (key && key.dataset.k !== 'del') press(key);
}

/* ---------- Abrir / cerrar ---------- */
/**
 * La pantalla NO se mueve. Solo sube la barra anclada abajo (data-kb-anchor="bottom"),
 * para quedar 10px por encima del teclado. Devuelve el desplazamiento (negativo) o 0.
 */
const ANCHOR_GAP = 10;
function anchorOffset(f) {
  movedEl = f.closest('[data-kb-anchor="bottom"]');
  if (!movedEl) return 0;
  const screen = f.closest('.screen');
  const scale = screen.getBoundingClientRect().height / 874 || 1;
  // bottom del campo relativo a la pantalla, sin contar el desplazamiento actual de la barra
  const current = gsap.getProperty(movedEl, 'y') || 0;
  const bottom = (f.getBoundingClientRect().bottom - screen.getBoundingClientRect().top) / scale - current;
  return (874 - height() - ANCHOR_GAP) - bottom;
}

function show(f) {
  const switching = isOpen && field !== f;
  if (switching && movedEl) gsap.to(movedEl, { y: 0, ...OUT, overwrite: true }); // la barra anterior vuelve a su sitio
  field = f;
  layout = 'letters';
  shift = false;
  caps = false;
  render();
  autoShift();
  if (isOpen && !switching) return;

  kb.classList.add('is-open');
  isOpen = true;
  gsap.to(kb, { yPercent: 0, ...IN, overwrite: true });
  const offset = anchorOffset(f);
  if (movedEl) gsap.to(movedEl, { y: offset, ...IN, overwrite: true });
}

export function hide({ instant = false } = {}) {
  if (!isOpen) return;
  isOpen = false;
  clearTimeout(repeatTimer);
  hidePop();
  const moved = movedEl;
  movedEl = null;
  field?.blur();
  field = null;
  if (instant) {
    gsap.set(kb, { yPercent: 100 });
    kb.classList.remove('is-open');
    if (moved) gsap.set(moved, { y: 0 });
    return;
  }
  // El teclado y la barra anclada bajan con la misma duración y curva
  gsap.to(kb, { yPercent: 100, ...OUT, overwrite: true, onComplete: () => !isOpen && kb.classList.remove('is-open') });
  if (moved) gsap.to(moved, { y: 0, ...OUT, overwrite: true });
}

/* ---------- Montaje ---------- */
export function initKeyboard(stage) {
  kb = document.createElement('div');
  kb.className = 'kb';
  kb.setAttribute('aria-hidden', 'true');
  kb.innerHTML = `
    <div class="kb__wrap" style="position:relative">
      <div class="kb__rows"></div>
      <div class="kb__pop"><div class="kb__pop-bubble"></div><div class="kb__pop-stem"></div></div>
    </div>
    <div class="kb__strip"></div>`;
  stage.append(kb);
  rowsEl = kb.querySelector('.kb__rows');
  pop = kb.querySelector('.kb__pop'); // hermano de .kb__rows: sus coordenadas coinciden
  render();                         // pinta las letras para que el teclado tenga ya su altura real
  gsap.set(kb, { y: 0, yPercent: 100 });

  kb.addEventListener('pointerdown', onPointerDown);
  kb.addEventListener('pointermove', onPointerMove);
  kb.addEventListener('pointerup', onPointerUp);
  kb.addEventListener('pointercancel', onPointerUp);
  kb.addEventListener('mousedown', (e) => e.preventDefault());

  // Enfocar un campo marcado → abrir (y evitar el teclado nativo del móvil)
  document.addEventListener('focusin', (e) => {
    const f = e.target.closest?.('[data-kb]');
    if (!f) return;
    f.setAttribute('inputmode', 'none');
    show(f);
  });

  // Tocar fuera del teclado y del campo → cerrar (después del clic, para no "mover" el botón pulsado)
  document.addEventListener('click', (e) => {
    const f = e.target.closest?.('[data-kb]');
    // Tocar un campo que ya tenía el foco (teclado cerrado) → volver a abrir
    if (f && !isOpen) { show(f); return; }
    if (!isOpen) return;
    if (kb.contains(e.target) || f) return;
    hide();
  });

  // Cambio de pantalla → cerrar al momento
  addEventListener('hashchange', () => hide({ instant: true }));

  // Si el campo cambia por teclado físico (escritorio), mantener intro y mayúsculas al día
  document.addEventListener('input', (e) => { if (e.target === field) updateReturnKey(); });
}
