// Genera documentos Markdown legibles a partir de src/data (la única fuente de verdad).
// Uso: pnpm generar-docs  →  docs/mapa.md, docs/catalogo.md, docs/plan-90-dias.md
// No edites esos tres archivos a mano: se sobrescriben cada vez que ejecutas el script.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const raiz = new URL("../", import.meta.url);
const leer = (n) => JSON.parse(readFileSync(new URL(`src/data/${n}.json`, raiz), "utf8"));
const [rutas, niveles, jefes, logros, canciones, extras, dias] =
  ["rutas", "niveles", "jefes", "logros", "canciones", "extras", "dias"].map(leer);

// --- utilidades -------------------------------------------------------------
const porId = (lista) => new Map(lista.map((x) => [x.id, x]));
const N = porId(niveles), J = porId(jefes), L = porId(logros), C = porId(canciones);
const AVISO = "<!-- Archivo generado por scripts/generar-docs.mjs. No lo edites a mano: cambia src/data y ejecuta `pnpm generar-docs`. -->\n\n";
const USO = { "de-oido": "de oído", acompanamiento: "acompañamiento" };
const yt = (id) => `https://www.youtube.com/watch?v=${id}`;
const nombreLogros = (ids) => ids.map((id) => L.get(id)?.nombre ?? id).join(", ") || "—";
const esc = (s) => String(s ?? "").replaceAll("|", "\\|");
const tabla = (cabecera, filas) =>
  [`| ${cabecera.join(" | ")} |`, `|${cabecera.map(() => "---").join("|")}|`, ...filas.map((f) => `| ${f.map(esc).join(" | ")} |`)].join("\n");
const duracion = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "?");
const fechaLarga = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
// Reto de oído = ninguna versión trae partitura y al menos una es "de oído". Se calcula, no se guarda.
const esRetoDeOido = (c) => !c.versiones.some((v) => v.usos.includes("partitura")) && c.versiones.some((v) => v.usos.includes("de-oido"));

const escribir = (nombre, contenido) => {
  mkdirSync(new URL("docs/", raiz), { recursive: true });
  writeFileSync(new URL(`docs/${nombre}`, raiz), AVISO + contenido.trim() + "\n");
  console.log(`✓ docs/${nombre}`);
};

// --- mapa.md ------------------------------------------------------------------
{
  const ordenados = [...niveles].sort((a, b) => a.orden - b.orden);
  let md = `# Mapa del Camino del Flautista\n\n`;
  md += `Rutas (ramas que se cruzan): ${rutas.map((r) => `**${r.nombre}**`).join(" · ")}.\n\n`;
  md += `> Del día 91 en adelante, las estimaciones de tiempo son **orientativas**. Se pasa de zona al cumplir los criterios, no por fecha. Lo que diga tu maestro manda.\n\n`;
  md += tabla(["#", "Zona", "Jefe", "Estimación"], ordenados.map((n) => {
    const jefesNivel = jefes.filter((j) => j.nivel === n.id).map((j) => `${j.nombre} (${C.get(j.cancion).titulo})`);
    return [n.orden, `${n.nombre} — ${n.zona}`, jefesNivel.join(" + "), n.estimacion];
  }));
  for (const n of ordenados) {
    md += `\n\n## ${n.orden}. ${n.nombre}\n\n${n.resumen}\n\n*${n.estimacion}*\n\n### Temario\n\n`;
    md += Object.entries(n.temario).map(([k, v]) => `- **${k[0].toUpperCase() + k.slice(1)}:** ${v}`).join("\n");
    md += `\n\n### Para pasar de zona\n\n`;
    md += n.requisitosParaPasar.length
      ? n.requisitosParaPasar.map((id) => `- [ ] **${L.get(id).nombre}**: ${L.get(id).criterio}`).join("\n")
      : "- Esta es la cumbre: no hay zona siguiente.";
    for (const j of jefes.filter((x) => x.nivel === n.id)) {
      const c = C.get(j.cancion);
      md += `\n\n### Jefe: ${j.nombre}${j.final ? " (JEFE FINAL)" : ""}\n\n${j.descripcion}\n\n`;
      md += `- **Canción:** ${c.titulo} — ${c.obra}${j.version ? ` ([versión de referencia](${yt(j.version)}))` : ""}\n`;
      md += `- **Tempo:** ${j.condicionVictoria.tempo}\n`;
      md += j.condicionVictoria.criterios.map((x) => `- [ ] ${x}`).join("\n");
      md += `\n- [ ] **Grabar el video** (grabar es parte de la victoria)\n`;
      md += `- **Requiere:** ${nombreLogros(j.requiere)}\n`;
      if (j.notas) md += `- *Nota:* ${j.notas}\n`;
    }
  }
  md += `\n\n## Logros\n\n`;
  const categorias = [...new Set(logros.map((l) => l.categoria))];
  for (const cat of categorias) {
    md += `\n### ${cat[0].toUpperCase() + cat.slice(1)}\n\n`;
    md += tabla(["Logro", "Criterio", "Zona sugerida", "Requiere"],
      logros.filter((l) => l.categoria === cat).map((l) => [l.nombre, l.criterio, N.get(l.nivelSugerido).nombre, nombreLogros(l.requiere)]));
    md += "\n";
  }
  escribir("mapa.md", md);
}

// --- catalogo.md --------------------------------------------------------------
{
  const total = canciones.reduce((s, c) => s + c.versiones.length, 0);
  let md = `# Catálogo de canciones\n\n`;
  md += `**${canciones.length} obras** a partir de **${total + extras.length} videos** (${extras.length} no son pieza para flauta traversa; ver al final).\n\n`;
  md += `- **Dificultad 1–10** y criterio: ver [clasificar-cancion.md](clasificar-cancion.md).\n`;
  md += `- 🎧 = **reto de oído**: no hay partitura en tu lista, así que es para transcribir con la guitarra.\n\n`;
  md += `## Retos de oído\n\n` + canciones.filter(esRetoDeOido).map((c) => `- 🎧 **${c.titulo}** (${c.obra}), dificultad ${c.dificultad}`).join("\n") + "\n";
  for (const r of rutas) {
    const lista = canciones.filter((c) => c.ruta === r.id).sort((a, b) => a.dificultad - b.dificultad || a.titulo.localeCompare(b.titulo));
    md += `\n## ${r.nombre} (${lista.length})\n\n${r.descripcion}\n\n`;
    md += tabla(["Obra", "Dif.", "Zona", "Requiere", "Versiones"], lista.map((c) => [
      `${esRetoDeOido(c) ? "🎧 " : ""}**${c.titulo}** — ${c.obra}${c.notas ? `<br>*${c.notas}*` : ""}`,
      c.dificultad,
      N.get(c.nivel).nombre,
      nombreLogros(c.requiere),
      c.versiones.map((v) => `[${v.canal}](${yt(v.youtubeId)}) (${v.usos.map((u) => USO[u] ?? u).join(", ")}; ${v.instrumentacion}; ${duracion(v.duracionSeg)})${v.nota ? ` — ${v.nota}` : ""}`).join("<br>"),
    ]));
    md += "\n";
  }
  md += `\n## No son pieza para flauta traversa\n\n`;
  md += tabla(["Video", "Tipo", "Nota"], extras.map((e) => [`[${e.tituloVideo}](${yt(e.youtubeId)})`, e.tipo, e.nota]));
  escribir("catalogo.md", md);
}

// --- plan-90-dias.md ----------------------------------------------------------
{
  let md = `# Plan de 90 días\n\n`;
  md += `Del **${fechaLarga(dias[0].fecha)}** al **${fechaLarga(dias.at(-1).fecha)}**. Práctica de lunes, martes, miércoles, viernes y sábado (20:00–22:00, de 45 a 60 min). Descanso jueves y domingo.\n\n`;
  md += `> Si la flauta llega más tarde de lo previsto (≈ 30 nov), recorre la fase con flauta **por número de sesión**, no por fecha. Lo que diga tu maestro manda sobre este plan.\n`;
  const semanas = [...new Set(dias.map((d) => d.semana))];
  for (const s of semanas) {
    const ds = dias.filter((d) => d.semana === s);
    md += `\n## Semana ${s} · ${fechaLarga(ds[0].fecha)} – ${fechaLarga(ds.at(-1).fecha)} · ${ds[0].fase === "sin-flauta" ? "sin flauta" : "con flauta"}\n`;
    for (const d of ds) {
      if (d.tipo === "descanso") { md += `\n**Día ${d.numero} · ${d.diaSemana} ${fechaLarga(d.fecha)}**: descanso.\n`; continue; }
      const min = d.bloques.reduce((t, b) => t + b.minutos, 0);
      md += `\n### Día ${d.numero} · ${d.diaSemana} ${fechaLarga(d.fecha)} · ${d.jefe ? "⚔️ " : ""}${d.titulo}\n\n`;
      md += `*Sesión ${d.sesion} · ${min} min${d.tipo === "festivo-opcional" ? " · festivo, opcional" : ""}* — ${d.objetivo}\n\n`;
      md += d.bloques.map((b) => `- [ ] **${b.tipo}** (${b.minutos} min): ${b.actividad}${b.recurso ? ` *(${b.recurso})*` : ""}`).join("\n") + "\n";
      if (d.logrosPosibles.length) md += `\n🏅 Logros posibles: ${nombreLogros(d.logrosPosibles)}\n`;
      if (d.jefe) md += `\n⚔️ **${J.get(d.jefe).nombre}**: condiciones de victoria en [mapa.md](mapa.md).\n`;
      if (d.notas) md += `\n> ${d.notas}\n`;
    }
  }
  escribir("plan-90-dias.md", md);
}
