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
// El día 1 es un lunes y los días van seguidos (la fecha de inicio la pone scripts/reprogramar-dias.mjs).
const ordenados = [...dias].sort((a, b) => a.numero - b.numero);
const dia1 = new Date(`${ordenados[0]?.fecha}T00:00:00Z`);
check(dia1.getUTCDay() === 1, `El día 1 (${ordenados[0]?.fecha}) debe ser lunes.`);
for (const d of ordenados) {
  const esperada = new Date(dia1.getTime() + (d.numero - 1) * 86_400_000).toISOString().slice(0, 10);
  check(d.fecha === esperada, `${d.id} tiene fecha ${d.fecha}; le toca ${esperada}.`);
}

// 2b. La semana 0 (arranque) va antes del día 1 y nunca en día de descanso.
for (const a of leer("arranque")) {
  check(a.fecha < ordenados[0].fecha, `${a.id} (${a.fecha}) debe ir antes del día 1 (${ordenados[0].fecha}).`);
  const dia = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date(`${a.fecha}T00:00:00Z`).getUTCDay()];
  check(dia === a.diaSemana, `${a.id}: ${a.fecha} es ${dia}, no ${a.diaSemana}.`);
  check(dia !== "jueves" && dia !== "domingo", `${a.id} cae en ${dia}, que es de descanso.`);
}

// 2c. Semanas tipo (después del día 90): una por zona de la 1 a la 8, sesiones en el
//     orden del horario y cada una (y la revisión) de 45 a 60 min.
const semanas = leer("semanas");
const minutos = (s) => s.bloques.reduce((t, b) => t + b.minutos, 0);
for (const n of niveles.filter((x) => x.orden >= 1)) {
  check(semanas.filter((s) => s.nivel === n.id).length === 1, `${n.id} debe tener exactamente una semana tipo.`);
}
for (const s of semanas) {
  check(s.sesiones.map((x) => x.diaSemana).join() === "lunes,martes,miércoles,viernes,sábado", `${s.id}: las sesiones deben ir de lunes a sábado sin jueves.`);
  for (const x of [...s.sesiones, s.revision]) {
    check(minutos(x) >= 45 && minutos(x) <= 60, `${s.id} «${x.titulo}» dura ${minutos(x)} min (debe ser entre 45 y 60).`);
  }
}

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
