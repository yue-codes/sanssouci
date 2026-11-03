/**
 * Esquemas del contenido del juego.
 *
 * Cada archivo de src/data es un arreglo de objetos con `id`, que se carga con el
 * loader `file()`. Los esquemas de Zod validan cada objeto al compilar, y
 * `reference()` comprueba que los ids relacionados existan: si una canción pide
 * `logro-xyz` y ese logro no existe, `pnpm build` falla y te dice dónde.
 */
import { defineCollection, reference } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

// --- Enumeraciones compartidas (una sola fuente de verdad para los valores válidos)

/** Categorías de un logro (cada una es una rama del árbol de habilidades). */
export const CATEGORIAS_LOGRO = [
  "lectura", "teoria", "respiracion", "sonido", "tecnica",
  "escalas", "oido", "habito", "grabacion", "repertorio",
] as const;

/** Categorías de una canción (cada una se asigna a una ruta: ver docs/clasificar-cancion.md). */
export const CATEGORIAS_CANCION = [
  "clasica", "ghibli", "videojuegos", "anime", "vocaloid",
  "jpop", "folk", "latino", "cine-tv", "pop",
] as const;

/** Para qué sirve una versión de YouTube de una obra. */
export const USOS_VERSION = [
  "partitura", "referencia", "de-oido", "acompanamiento", "tutorial", "clip",
] as const;

/** Tipos de bloque de una sesión del plan. */
export const TIPOS_BLOQUE = [
  "calentamiento", "respiracion", "lectura", "teoria", "ritmo", "oido", "guitarra",
  "escucha", "sonido", "tecnica", "escalas", "estudios", "repertorio",
  "grabacion", "repaso", "clase", "revision",
] as const;

const dificultad = z.number().int().min(1).max(10);

const rutas = defineCollection({
  loader: file("src/data/rutas.json"),
  schema: z.object({
    nombre: z.string(),
    descripcion: z.string(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
});

const logros = defineCollection({
  loader: file("src/data/logros.json"),
  schema: z.object({
    nombre: z.string(),
    categoria: z.enum(CATEGORIAS_LOGRO),
    descripcion: z.string(),
    criterio: z.string(),
    requiere: z.array(reference("logros")),
    nivelSugerido: reference("niveles"),
  }),
});

const niveles = defineCollection({
  loader: file("src/data/niveles.json"),
  schema: z.object({
    orden: z.number().int().min(0),
    nombre: z.string(),
    zona: z.string(),
    resumen: z.string(),
    estimacion: z.string(),
    temario: z.object({
      lectura: z.string(),
      teoria: z.string(),
      respiracion: z.string(),
      sonido: z.string(),
      escalas: z.string(),
      estudios: z.string(),
      repertorio: z.string(),
    }),
    requisitosParaPasar: z.array(reference("logros")),
    jefe: reference("jefes"),
  }),
});

const jefes = defineCollection({
  loader: file("src/data/jefes.json"),
  schema: z.object({
    nombre: z.string(),
    nivel: reference("niveles"),
    cancion: reference("canciones"),
    version: z.string().optional(), // youtubeId de la versión de referencia
    descripcion: z.string(),
    condicionVictoria: z.object({
      tempo: z.string(),
      criterios: z.array(z.string()).min(1),
      grabacion: z.literal(true), // grabar es parte de la victoria, siempre
    }),
    requiere: z.array(reference("logros")),
    final: z.boolean().optional(),
    notas: z.string().optional(),
  }),
});

const version = z.object({
  youtubeId: z.string().min(5),
  tituloVideo: z.string(),
  canal: z.string(),
  duracionSeg: z.number().int().positive().nullable(),
  usos: z.array(z.enum(USOS_VERSION)).min(1),
  instrumentacion: z.string(),
  dificultadArreglo: dificultad.optional(),
  nota: z.string().optional(),
});

const canciones = defineCollection({
  loader: file("src/data/canciones.json"),
  schema: z.object({
    titulo: z.string(),
    obra: z.string(),
    compositor: z.string().optional(),
    categoria: z.enum(CATEGORIAS_CANCION),
    ruta: reference("rutas"),
    dificultad,
    nivel: reference("niveles"),
    tecnicas: z.array(reference("logros")),
    requiere: z.array(reference("logros")),
    notas: z.string().optional(),
    versiones: z.array(version).min(1),
  }),
});

const extras = defineCollection({
  loader: file("src/data/extras.json"),
  schema: z.object({
    youtubeId: z.string(),
    tituloVideo: z.string(),
    canal: z.string().nullable(),
    duracionSeg: z.number().int().positive().nullable(),
    tipo: z.enum(["flauta-dulce", "meme", "comentario", "recurso", "por-identificar"]),
    nota: z.string(),
    obraRelacionada: reference("canciones").optional(),
  }),
});

/** Un bloque de una sesión (lo comparten los 90 días y la semana 0). */
const bloque = z.object({
  tipo: z.enum(TIPOS_BLOQUE),
  minutos: z.number().int().positive(),
  actividad: z.string(),
  recurso: z.string().optional(),
});

const dias = defineCollection({
  loader: file("src/data/dias.json"),
  schema: z.object({
    numero: z.number().int().min(1).max(90),
    fecha: z.iso.date(),
    diaSemana: z.string(),
    semana: z.number().int().min(1),
    fase: z.enum(["sin-flauta", "con-flauta"]),
    tipo: z.enum(["practica", "descanso", "festivo-opcional"]),
    sesion: z.number().int().min(1).optional(),
    titulo: z.string(),
    objetivo: z.string(),
    bloques: z.array(bloque),
    logrosPosibles: z.array(reference("logros")),
    jefe: reference("jefes").optional(),
    notas: z.string().optional(),
  }),
});

/**
 * Semana 0: sesiones cortas de arranque ANTES del día 1. Van aparte de `dias` a
 * propósito: no cuentan para los 90 días, ni para la racha, ni se guardan en el progreso.
 */
const arranque = defineCollection({
  loader: file("src/data/arranque.json"),
  schema: z.object({
    numero: z.number().int().min(1),
    fecha: z.iso.date(),
    diaSemana: z.string(),
    titulo: z.string(),
    objetivo: z.string(),
    bloques: z.array(bloque).min(1),
    notas: z.string().optional(),
  }),
});

/** Una sesión de práctica genérica (sin fecha): las de la semana tipo. */
const sesion = z.object({
  titulo: z.string(),
  objetivo: z.string(),
  bloques: z.array(bloque).min(1),
});

/**
 * Semana tipo de cada zona: la rutina DESPUÉS del día 90, cuando ya no hay
 * calendario. Cinco sesiones (lunes, martes, miércoles, viernes y sábado) y una
 * revisión que sustituye al sábado cada 4 semanas.
 */
const semanas = defineCollection({
  loader: file("src/data/semanas.json"),
  schema: z.object({
    nivel: reference("niveles"),
    foco: z.string(),
    sesiones: z.array(sesion.extend({ diaSemana: z.enum(["lunes", "martes", "miércoles", "viernes", "sábado"]) })).length(5),
    revision: sesion,
  }),
});

/** Colecciones que Astro registra (los nombres son los de `getCollection("…")`). */
export const collections = { rutas, logros, niveles, jefes, canciones, extras, dias, arranque, semanas };
