// Comprobaciones que el esquema de Zod no cubre (reglas entre varios archivos).
// Uso: pnpm verificar
import { readFileSync } from "node:fs";

const leer = (n) => JSON.parse(readFileSync(new URL(`../src/data/${n}.json`, import.meta.url), "utf8"));
const canciones = leer("canciones");
const extras = leer("extras");
const dias = leer("dias");
const niveles = leer("niveles");
const jefes = leer("jefes");

const errores = [];
const check = (ok, msg) => { if (!ok) errores.push(msg); };

// 1. Cada video de la lista aparece exactamente una vez (en una canción o en extras).
const ids = [...canciones.flatMap((c) => c.versiones.map((v) => v.youtubeId)), ...extras.map((e) => e.youtubeId)];
const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
check(repetidos.length === 0, `Videos repetidos: ${repetidos.join(", ")}`);
const lineas = readFileSync(new URL("../canciones.txt", import.meta.url), "utf8").split("\n").filter((l) => l.trim()).length;
check(ids.length === lineas, `canciones.txt tiene ${lineas} videos, pero hay ${ids.length} clasificados.`);

// 2. El calendario respeta el horario pactado.
check(dias.length === 90, `Hay ${dias.length} días (deberían ser 90).`);
const practica = dias.filter((d) => d.tipo !== "descanso");
check(practica.length === 65, `Hay ${practica.length} sesiones (deberían ser 65).`);
for (const d of dias) {
  const descanso = d.diaSemana === "jueves" || d.diaSemana === "domingo";
  check(descanso === (d.tipo === "descanso"), `${d.id} (${d.diaSemana}) tiene tipo "${d.tipo}".`);
  if (d.tipo === "practica") {
    const min = d.bloques.reduce((s, b) => s + b.minutos, 0);
    check(min >= 45 && min <= 60, `${d.id} dura ${min} min (debe ser entre 45 y 60).`);
  }
}
check(dias.at(-1)?.fecha === "2027-01-30", "El día 90 debe ser el 30 de enero de 2027.");

// 3. Cada nivel apunta a un jefe que pertenece a ese mismo nivel.
for (const n of niveles) {
  const j = jefes.find((x) => x.id === n.jefe);
  check(j?.nivel === n.id, `El jefe de ${n.id} (${n.jefe}) no pertenece a ese nivel.`);
}

if (errores.length) {
  console.error(`✗ ${errores.length} problema(s):\n- ${errores.join("\n- ")}`);
  process.exit(1);
}
console.log(`✓ Datos coherentes: ${canciones.length} obras, ${extras.length} extras, ${ids.length} videos, ${practica.length} sesiones.`);
