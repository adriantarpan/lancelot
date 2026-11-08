/* ==========================================================================
   DATOS DE EJEMPLO — club, libro, miembros, comentarios y profecías.
   Es el estado inicial; lo que el usuario cambie se guarda en localStorage
   (ver state.js). Para volver aquí: reset oculto.

   El usuario empieza en el cap. 10, así que del 1 al 10 están leídos y tienen
   conversación. Nada de lo escrito en un capítulo habla de lo que pasa después.
   ========================================================================== */

export const CLUB = {
  name: 'Pink pony club',
  code: 'pony13',                      // "Probar con un código de ejemplo" (1.2)
  members: {
    me:    'tú',
    pablo: 'pablo',
    mar:   'Mar',
    laia:  'Laia',
    lucia: 'Lucía',
    dani:  'Dani',
    irene: 'Irene',
  },
  meeting: {
    title: 'Jueves 12 nov.',
    time: '19:30',
    place: 'casa de mar',
    untilChapter: 13,
    shortDate: '12 nov',               // para "en tu calendario · 12 nov 19:30" (10.1)
    othersArrived: 4,                  // de los otros 6 miembros, cuántos han llegado al cap. 13
  },
};

/* ---------- Libro ----------
   Total de capítulos y rangos de cada fase: todo lo demás sale de aquí
   (ruedas, hoja de "Añadir capítulo", etiqueta de fase de la Home y logros). */
const TOTAL_CHAPTERS = 30;

export const BOOK = {
  titleLines: ['La vida invisible', 'de Addie LaRue'],
  chapters: TOTAL_CHAPTERS,
  // Etiqueta de fase que se ve en la Home
  phases: [
    { from: 1,  to: 10, label: 'fase I · los comienzos' },
    { from: 11, to: 20, label: 'fase II · la travesía' },
    { from: 21, to: 30, label: 'fase III · la conquista' },
  ],
};

/* ---------- Logros (frames "SCREEN LOGRO …") ----------
   Rango de capítulos de cada pantalla de logro. Al marcar un capítulo, sale
   el logro cuyo rango lo contiene, SOLO la primera vez:
     11–20 → Fase II · 21–29 → Fase III · 30 → Libro terminado.
   Los ya mostrados se guardan en seenAchievements (localStorage). */
export const ACHIEVEMENTS = [
  { id: 'fase-2', from: 11, to: 20, kicker: 'entras en la fase II',   title: ['Media historia', 'conquistada'] },
  { id: 'fase-3', from: 21, to: 29, kicker: 'entras en la fase III',  title: ['El castillo', 'ya se ve'] },
  { id: 'libro',  from: TOTAL_CHAPTERS, to: TOTAL_CHAPTERS, kicker: 'has terminado el libro', title: ['Historia', 'conquistada'], finished: true },
];

/* Mapa de la historia por capítulos (solo para escribir los datos con coherencia):
    1  Nueva York, 2014. Addie se despierta junto a alguien que ya no la recuerda.
    2  Villon-sur-Sarthe, 1714. Adeline de niña, Estelle y las tallas de su padre.
    3  La boda que no quiere. Huye al bosque al anochecer y hace el trato.
    4  Vuelve al pueblo: nadie la reconoce, ni sus padres. No puede decir su nombre.
    5  No puede dejar huella: lo que escribe se borra, lo que rompe se recompone.
    6  París. Hambre, frío y aprender a sobrevivir sin que nadie la recuerde.
    7  Primer aniversario del trato: él vuelve a buscarla.
    8  Nueva York otra vez: sus trucos para vivir; su rostro escondido en cuadros.
    9  Pasan los años y los aniversarios; descubre que las ideas sí se quedan.
   10  Una librería de Nueva York y un chico que… la recuerda.                     */

/* Atajos para escribir los datos sin repetir claves */
let n = 0;
const C = (chapter, author, when, text) => ({ id: `c${++n}`, chapter, author, when, text });
let m = 0;
const P = (author, madeAt, verdict, text, shared = true) =>
  ({ id: `p${++m}`, author, madeAt, reveal: madeAt + 1, shared, verdict, text });

/* ---------- Comentarios ----------
   Los que llevan "?" entran solos al mazo del club como preguntas. */
export const COMMENTS = [
  // cap. 10 — 4 de otros + 1 tuyo ("4 comentarios ... te esperan")
  C(10, 'pablo', 'hace 2h', 'No esperaba que Addie volviera a esa librería. Me ha dejado rara todo el día.'),
  C(10, 'me',    'ayer',    'Trescientos años sin que nadie diga su nombre y de repente… se me ha puesto la piel de gallina.'),
  C(10, 'mar',   'ayer',    'El chico de la librería me cae bien desde la primera línea. Demasiado bien, sospecho.'),
  C(10, 'laia',  'hace 2 días', '¿Por qué creéis que él sí puede recordarla?'),
  C(10, 'dani',  'hace 3 días', 'Lo de devolver el libro robado al día siguiente es tan Addie.'),

  // cap. 9
  C(9, 'lucia', 'hace 4 días', 'Me encanta la idea de que no pueda dejar marca pero sí inspirar a otros. Es casi peor.'),
  C(9, 'pablo', 'hace 4 días', '¿Alguien ha contado cuántos aniversarios lleva ya?'),
  C(9, 'me',    'hace 5 días', 'He tenido que parar después de este capítulo. Necesitaba aire.'),
  C(9, 'irene', 'hace 5 días', 'Las ideas que se quedan aunque ella no. Me lo apunto.'),

  // cap. 8
  C(8, 'mar',   'hace 1 semana', 'Su cara escondida en cuadros de museos es lo más bonito del libro hasta ahora.'),
  C(8, 'dani',  'hace 1 semana', '¿Os imagináis vivir así en Nueva York, sin poder pagar ni alquilar nada a tu nombre?'),
  C(8, 'laia',  'hace 1 semana', 'Los saltos entre 2014 y el pasado me tienen enganchadísima.'),

  // cap. 7
  C(7, 'irene', 'hace 8 días', 'Él vuelve justo el día del aniversario. Qué escalofrío.'),
  C(7, 'me',    'hace 8 días', '¿Es el mismo que respondió en el bosque o solo se le parece?'),
  C(7, 'pablo', 'hace 9 días', 'Me fascina que Addie no le tenga miedo. Está furiosa, que es distinto.'),
  C(7, 'lucia', 'hace 9 días', 'Cómo describe la oscuridad, con los ojos verdes… ya entiendo el nombre de la portada.'),

  // cap. 6
  C(6, 'laia',  'hace 10 días', 'París en 1714 está tan bien contado que casi huele.'),
  C(6, 'dani',  'hace 10 días', 'La parte del hambre se me ha hecho dura de leer.'),
  C(6, 'mar',   'hace 11 días', '¿Por qué nadie la ayuda más de una vez? Ah, claro. Ya.'),

  // cap. 5
  C(5, 'irene', 'hace 2 semanas', 'Intenta escribir su nombre y se borra. Qué crueldad tan bien pensada.'),
  C(5, 'me',    'hace 2 semanas', 'El trato tenía letra pequeña y ella no la leyó. Como todos.'),
  C(5, 'pablo', 'hace 2 semanas', '¿Creéis que hay alguna forma de saltarse la maldición?'),

  // cap. 4
  C(4, 'lucia', 'hace 2 semanas', 'Su madre mirándola como a una extraña. No he podido seguir leyendo esa noche.'),
  C(4, 'mar',   'hace 2 semanas', 'Lo de no poder decir su nombre me parece lo peor de todo.'),
  C(4, 'dani',  'hace 15 días',   '¿Estelle se acuerda un poco o me lo estoy inventando?'),

  // cap. 3
  C(3, 'pablo', 'hace 3 semanas', '¿El que responde en el bosque es el diablo o algo más antiguo?'),
  C(3, 'laia',  'hace 3 semanas', '"No reces nunca a los dioses que responden después del anochecer." Apuntado para siempre.'),
  C(3, 'me',    'hace 3 semanas', 'Huir de esa boda me parece lo más sensato que ha hecho nadie en este libro.'),

  // cap. 2
  C(2, 'irene', 'hace 3 semanas', 'Estelle es el mejor personaje y no acepto discusión.'),
  C(2, 'dani',  'hace 3 semanas', 'Las tallas de madera de su padre son preciosas. ¿Volverán a salir?'),
  C(2, 'lucia', 'hace 3 semanas', 'Me gusta mucho cómo la pinta de niña: curiosa y sin ganas de quedarse quieta.'),

  // cap. 1
  C(1, 'mar',   'hace 1 mes', 'Qué manera de empezar: despertarse y que el otro ya no sepa quién eres.'),
  C(1, 'pablo', 'hace 1 mes', '¿Alguien había leído algo de la autora antes?'),
  C(1, 'laia',  'hace 1 mes', 'Me he enamorado del ritmo en dos páginas.'),

  // cap. 11 y 12 — bloqueados hasta que llegues (sin detalles)
  C(11, 'laia', 'hace 1h',     'No pienso decir nada. Solo: guau.'),
  C(11, 'dani', 'hace 2h',     '¿De verdad nadie lo vio venir?'),
  C(12, 'laia', 'hace 20 min', 'Voy a necesitar que alguien llegue aquí para hablarlo.'),
];

/* ---------- Profecías ----------
   P(autor, selladaEn, veredicto, texto, compartida)
   · Se sellan en un capítulo y se revelan en el siguiente (reveal = madeAt + 1).
   · Las que se revelan en capítulos ya leídos (≤ 10) llevan veredicto:
     el estado "revelada" de Figma (frame 4: etiqueta acerté / casi / ni de lejos).
   · Las de capítulos posteriores no tienen veredicto todavía. */
export const PROPHECIES = [
  // Se revelan en el cap. 10 — como en el frame 4 (2 de otros + la tuya)
  P('me',    9, 'acerte', 'Cuando Adeline atraviese la puerta va a encontrarse con él.'),
  P('pablo', 9, 'lejos',  'El chico de la librería va a ser él disfrazado.'),
  P('mar',   9, 'casi',   'Alguien va a decir su nombre en voz alta.'),

  // Reveladas en capítulos anteriores
  P('laia',  8, 'acerte', 'Va a volver a ver uno de esos cuadros con su cara.'),
  P('me',    7, 'casi',   'Él va a volver el día del aniversario del trato.', false),
  P('irene', 6, 'acerte', 'Va a aparecer alguien de su pasado en París.'),
  P('dani',  6, 'lejos',  'Alguien la va a recordar por accidente.'),
  P('lucia', 5, 'casi',   'Se va a ir a la ciudad antes de que acabe el invierno.'),
  P('me',    4, 'lejos',  'Estelle sí va a reconocerla.'),
  P('pablo', 4, 'acerte', 'Va a intentar escribir su nombre y no va a poder.'),
  P('mar',   3, 'acerte', 'Cuando vuelva al pueblo, nadie va a saber quién es.'),
  P('laia',  2, 'casi',   'La boda va a salir mal, pero no por culpa del novio.'),
  P('irene', 1, 'acerte', 'Lo que pasó en 2014 empezó hace siglos.'),

  // Aún sin revelar para ti (cap. 11 en adelante)
  P('laia', 10, null, 'Él tampoco es exactamente quien dice ser.'),
  P('mar',  11, null, 'Él va a aparecer en la librería.'),
];

/* Estado inicial completo (lo que state.js guarda en localStorage) */
export function initialState() {
  return {
    version: 4,
    onboarded: false,
    userName: '',                               // nombre del usuario (se edita en la cabecera de la Home)
    coachSeen: false,                           // indicaciones de la Home (2.0.1–2.0.3) ya vistas
    clubCode: '',
    notifications: false,
    currentChapter: 10,                         // capítulo en el que estás ("estás aquí")
    comments: structuredClone(COMMENTS),
    prophecies: structuredClone(PROPHECIES),
    shields: { month: '2026-11', perMonth: 2, used: 0, raised: false },
    calendarAdded: false,                       // reunión añadida al calendario (10 → 10.1)
    game: { record: 0 },                        // récord del minijuego: empieza en 0
    seenAchievements: [],                       // p.ej. ['fase-2']
  };
}
