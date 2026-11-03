// Mueve el plan de 90 días a otra fecha de inicio (un lunes) y reescribe src/data/dias.json.
// Uso: node scripts/reprogramar-dias.mjs 2026-11-09   (o: pnpm reprogramar 2026-11-09)
//
// Qué hace y por qué:
// - Cada día conserva su «casilla»: id, número, semana y fase (los ids son estables:
//   la base de datos de progreso los guarda). Solo cambian la fecha y el día de la semana.
// - Como el día 1 es siempre lunes, los descansos (jueves y domingo) caen en los mismos
//   números de día y las 65 sesiones no cambian.
// - Lo único que depende del calendario real son los festivos (25 dic y 1 ene): sus
//   sesiones cortas tienen que caer en esas fechas. Por eso el contenido de las sesiones
//   se reparte en orden sobre los días de práctica: las de festivo en las fechas
//   festivas y el resto, sin cambiar su orden, en los demás días. Así un jefe sigue
//   llegando después de las mismas sesiones de preparación.
// - Es idempotente: ejecutarlo dos veces con la misma fecha da el mismo archivo.
import { readFileSync, writeFileSync } from "node:fs";

const RUTA = new URL("../src/data/dias.json", import.meta.url);
const FESTIVOS = ["12-25", "01-01"]; // mes-día
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const inicio = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio ?? "")) {
  console.error("Uso: node scripts/reprogramar-dias.mjs AAAA-MM-DD (un lunes)");
  process.exit(1);
}
// En UTC para que ningún cambio de horario mueva un día.
const base = new Date(`${inicio}T00:00:00Z`);
if (base.getUTCDay() !== 1) {
  console.error(`${inicio} no es lunes: el plan empieza siempre en lunes (los descansos son jueves y domingo).`);
  process.exit(1);
}
const fechaDe = (numero) => new Date(base.getTime() + (numero - 1) * 86_400_000);
const iso = (f) => f.toISOString().slice(0, 10);

const dias = JSON.parse(readFileSync(RUTA, "utf8")).sort((a, b) => a.numero - b.numero);

// Campos de la casilla (se quedan) y del contenido (se reparten).
const CONTENIDO = ["tipo", "titulo", "objetivo", "bloques", "logrosPosibles", "jefe", "notas"];
const contenidoDe = (d) => Object.fromEntries(CONTENIDO.filter((k) => k in d).map((k) => [k, d[k]]));

const practica = dias.filter((d) => d.tipo !== "descanso");
const festivos = practica.filter((d) => d.tipo === "festivo-opcional").map(contenidoDe);
const normales = practica.filter((d) => d.tipo !== "festivo-opcional").map(contenidoDe);
const esFestivo = (d) => FESTIVOS.includes(iso(fechaDe(d.numero)).slice(5));

const huecosFestivos = practica.filter(esFestivo).length;
if (huecosFestivos !== festivos.length) {
  console.error(`Con esa fecha caen ${huecosFestivos} festivos en días de práctica, pero hay ${festivos.length} sesiones de festivo. Revisa los datos a mano.`);
  process.exit(1);
}

let f = 0;
let n = 0;
const resultado = dias.map((d) => {
  const fecha = fechaDe(d.numero);
  const casilla = { id: d.id, numero: d.numero, fecha: iso(fecha), diaSemana: DIAS_SEMANA[fecha.getUTCDay()], semana: d.semana, fase: d.fase };
  if (d.tipo === "descanso") return { ...casilla, ...contenidoDe(d) };
  const contenido = esFestivo(d) ? festivos[f++] : normales[n++];
  // `sesion` es de la casilla (misión N de 65), y va antes del contenido como en el original.
  const { tipo, ...resto } = contenido;
  return { ...casilla, tipo, sesion: d.sesion, ...resto };
});

writeFileSync(RUTA, JSON.stringify(resultado, null, 2) + "\n");
console.log(`✓ Plan reprogramado: día 1 = ${iso(fechaDe(1))}, día 90 = ${iso(fechaDe(90))}.`);
