/**
 * @file Los 90 días dibujados como una página de partitura: dónde va cada nota.
 *
 * Cada día de práctica es una nota; cada descanso, un silencio; cada jefe, una nota
 * con calderón (𝄐, «sostén aquí») seguida de doble barra. Cada semana es un compás.
 * Como en una partitura impresa, los compases se reparten en varios sistemas
 * (renglones de pentagrama) que ocupan todo el ancho, y cada sistema, salvo el
 * primero, lleva el número de su primer compás. La melodía sube poco a poco a lo
 * largo del plan, como un ejercicio de escala: subir es avanzar.
 *
 * Es geometría pura (sin interfaz ni `astro:content`): la isla `PartituraNoventaDias`
 * la importa. Recibe datos planos (`DiaPartitura`).
 */

/** Lo mínimo de un día que necesita la partitura (datos planos, aptos para una isla). */
export interface DiaPartitura {
  numero: number;
  /** Fecha ISO «AAAA-MM-DD». */
  fecha: string;
  titulo: string;
  semana: number;
  descanso: boolean;
  conFlauta: boolean;
  /** Nombre del jefe, si ese día hay uno. */
  jefe?: string;
}

/** Estado de una nota para quien la mira. */
export type EstadoNota = "hecha" | "hoy" | "pendiente" | "pasada";

/** Una nota (o silencio) ya colocada en la partitura. */
export interface NotaColocada extends DiaPartitura {
  /** Centro horizontal, en unidades del `viewBox`. */
  x: number;
  /** Centro vertical de la cabeza de la nota. */
  y: number;
  /** Ancho de la columna de la nota (zona sensible al ratón). */
  anchoColumna: number;
  /** Sistema (renglón) en el que está, desde 0. */
  sistema: number;
  /** Posición en el pentagrama: 0 = primera línea (Mi4), 8 = quinta línea (Fa5). */
  paso: number;
  /** La plica va hacia arriba (notas graves) o hacia abajo (agudas), como en la escritura real. */
  plicaArriba: boolean;
  /** Líneas adicionales que necesita la nota (sus coordenadas `y`). */
  adicionales: number[];
  /** Cómo alinear su etiqueta (nombre del jefe) para que no se salga por los bordes. */
  anclaEtiqueta: "start" | "middle" | "end";
  estado: EstadoNota;
}

/** Un renglón de pentagrama. */
export interface Sistema {
  /** Coordenada `y` de las cinco líneas, de arriba abajo. */
  lineas: number[];
  x0: number;
  x1: number;
  /** Número del primer compás (semana) del sistema. */
  compas: number;
}

/** Una línea vertical dentro de un sistema (barra de compás, doble barra o marca). */
export interface Vertical {
  x: number;
  sistema: number;
}

/** Todo lo que hace falta para dibujar la partitura. */
export interface Partitura {
  ancho: number;
  alto: number;
  sistemas: Sistema[];
  notas: NotaColocada[];
  /** Barras de compás (entre semanas). */
  barras: Vertical[];
  /** Doble barra tras cada jefe. */
  barrasJefe: Vertical[];
  /** Línea que marca la llegada de la flauta (si cae dentro). */
  flauta?: Vertical;
  /** Separación entre dos líneas del pentagrama. */
  interlinea: number;
}

/** Medidas del dibujo, en unidades del `viewBox` (el SVG escala solo). */
const MEDIDAS = {
  ancho: 1000,
  margenIzquierdo: 22,
  margenDerecho: 8,
  /** Espacio sobre el pentagrama (calderones y nombres de jefe). */
  aire: 54,
  interlinea: 13,
  /** Alto de cada sistema, de su borde superior al siguiente. */
  altoSistema: 156,
};

/**
 * Altura de la nota de un día: una base que sube semana a semana y un pequeño
 * dibujo dentro de cada semana (lunes a domingo), como una escala que se repite
 * un poco más arriba cada vez. El sábado es la nota más alta (los jefes caen en sábado).
 */
function pasoDelDia(numero: number, semana: number): number {
  const DIBUJO_SEMANA = [0, 1, 2, 2, 1, 3, 2];
  const base = Math.round((semana - 1) * 0.62) - 2;
  return base + DIBUJO_SEMANA[(numero - 1) % 7];
}

/**
 * Reparte `n` compases en `sistemas` renglones lo más parecidos posible
 * (los primeros se llevan el sobrante): 13 en 3 → [5, 4, 4].
 */
function repartir(n: number, sistemas: number): number[] {
  return Array.from({ length: sistemas }, (_, i) => Math.floor(n / sistemas) + (i < n % sistemas ? 1 : 0));
}

/**
 * Coloca los días en una página de partitura.
 *
 * @param dias Días del plan (en cualquier orden).
 * @param hoy Número de día de hoy (puede quedar fuera del plan).
 * @param hechos Números de los días completados. Si no se pasa (portada pública),
 *   los días anteriores a hoy se marcan como «pasada», sin decir si se hicieron.
 * @param numSistemas Renglones de pentagrama (por defecto, 3).
 * @returns La geometría lista para pintar.
 * @example componerPartitura(dias, 1).sistemas.length // → 3
 */
export function componerPartitura(
  dias: readonly DiaPartitura[],
  hoy: number,
  hechos?: ReadonlySet<number>,
  numSistemas = 3,
): Partitura {
  const { ancho, margenIzquierdo, margenDerecho, aire, interlinea, altoSistema } = MEDIDAS;
  const ordenados = [...dias].sort((a, b) => a.numero - b.numero);
  const semanas = [...new Set(ordenados.map((d) => d.semana))];
  const reparto = repartir(semanas.length, Math.min(numSistemas, semanas.length));

  const sistemas: Sistema[] = [];
  const notas: NotaColocada[] = [];
  const barras: Vertical[] = [];
  const barrasJefe: Vertical[] = [];
  let flauta: Vertical | undefined;

  let semanaInicial = 0;
  reparto.forEach((cuantas, s) => {
    const semanasDelSistema = new Set(semanas.slice(semanaInicial, semanaInicial + cuantas));
    semanaInicial += cuantas;
    const delSistema = ordenados.filter((d) => semanasDelSistema.has(d.semana));
    const arriba = s * altoSistema + aire;
    const abajo = arriba + 4 * interlinea; // primera línea (Mi4)
    const x0 = margenIzquierdo;
    const x1 = ancho - margenDerecho;
    // Cada sistema se justifica a todo el ancho, como en una partitura impresa.
    const columna = (x1 - x0) / delSistema.length;
    sistemas.push({ lineas: [0, 1, 2, 3, 4].map((k) => arriba + k * interlinea), x0, x1, compas: delSistema[0].semana });
    const yDe = (paso: number) => abajo - paso * (interlinea / 2);

    delSistema.forEach((d, i) => {
      const x = x0 + (i + 0.5) * columna;
      const paso = pasoDelDia(d.numero, d.semana);
      const adicionales: number[] = [];
      for (let p = -2; p >= paso; p -= 2) adicionales.push(yDe(p)); // por debajo: Do4, La3…
      for (let p = 10; p <= paso; p += 2) adicionales.push(yDe(p)); // por encima: La5, Do6…
      const estado: EstadoNota =
        d.numero === hoy ? "hoy"
        : hechos?.has(d.numero) ? "hecha"
        : d.numero < hoy && !hechos ? "pasada"
        : "pendiente";
      const anclaEtiqueta = x > x1 - 70 ? "end" : x < x0 + 70 ? "start" : "middle";
      notas.push({ ...d, x, y: yDe(paso), anchoColumna: columna, sistema: s, paso, plicaArriba: paso < 4, adicionales, anclaEtiqueta, estado });

      const borde = x0 + (i + 1) * columna;
      const siguiente = delSistema[i + 1];
      if (d.jefe) barrasJefe.push({ x: borde, sistema: s });
      else if (siguiente && siguiente.semana !== d.semana) barras.push({ x: borde, sistema: s });
      if (d.conFlauta && !flauta && d.numero !== ordenados[0].numero) flauta = { x: x0 + i * columna, sistema: s };
    });
  });

  return { ancho, alto: reparto.length * altoSistema, sistemas, notas, barras, barrasJefe, flauta, interlinea };
}
