// Auditoría básica de accesibilidad sobre el HTML ya compilado.
// Uso: pnpm auditar  (compila y luego revisa dist/client/, donde quedan las páginas prerenderizadas). También: node scripts/auditar.mjs <carpeta>
//
// Revisa lo que se puede comprobar leyendo el HTML: lang, <title>, un solo <h1>,
// saltos de encabezado, alt, title de iframes, ids duplicados, aria-* que apuntan
// a ids inexistentes, botones/enlaces/campos sin nombre, aria-label sin role y el
// enlace «saltar al contenido». No sustituye a probar con teclado y lector de
// pantalla, ni mide contraste (eso se comprobó en src/styles/tokens.css).
// Las reglas que vigila están en docs/arquitectura.md («Accesibilidad»).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const raiz = process.argv[2] ?? "dist/client";

// --- utilidades -------------------------------------------------------------
const paginas = [];
(function recorrer(dir) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) recorrer(ruta);
    else if (ruta.endsWith(".html")) paginas.push(ruta);
  }
})(raiz);

/** Problemas agrupados por tipo: tipo → ["página detalle", …]. */
const problemas = new Map();
const anotar = (tipo, pagina, detalle = "") => {
  if (!problemas.has(tipo)) problemas.set(tipo, []);
  problemas.get(tipo).push(`${relative(raiz, pagina)} ${detalle}`.trim());
};
/** Texto visible de un fragmento de HTML (sin etiquetas ni iconos SVG). */
const textoVisible = (html) =>
  html.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, "x").trim();

// --- comprobaciones ---------------------------------------------------------
for (const pagina of paginas) {
  // Scripts y estilos no son contenido: fuera, para no confundir a las expresiones.
  const h = readFileSync(pagina, "utf8").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");

  if (!/<html[^>]*lang="es/.test(h)) anotar("sin lang=\"es\"", pagina);
  if (!/<title>[^<]+<\/title>/.test(h)) anotar("sin <title>", pagina);
  if (!/href="#contenido"/.test(h)) anotar("sin enlace «saltar al contenido»", pagina);

  const h1 = (h.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) anotar("no tiene exactamente un <h1>", pagina, `(${h1})`);
  let anterior = 0;
  for (const m of h.matchAll(/<h([1-6])[\s>]/g)) {
    const nivel = Number(m[1]);
    if (anterior && nivel > anterior + 1) anotar("salto de encabezado", pagina, `h${anterior}→h${nivel}`);
    anterior = nivel;
  }

  // `alt` vacío (o sin valor) es correcto: marca la imagen como decorativa.
  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\balt[=\s/>]/.test(m[0])) anotar("<img> sin alt", pagina);
  for (const m of h.matchAll(/<iframe\b[^>]*>/g)) if (!/\btitle=/.test(m[0])) anotar("<iframe> sin title", pagina);

  const ids = [...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const existentes = new Set(ids);
  for (const id of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) anotar("id duplicado", pagina, id);
  for (const m of h.matchAll(/aria-(?:labelledby|controls|describedby)="([^"]+)"/g))
    for (const id of m[1].split(/\s+/)) if (!existentes.has(id)) anotar("aria-* apunta a un id inexistente", pagina, id);

  for (const m of h.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g))
    if (!/aria-label=/.test(m[2]) && !textoVisible(m[3])) anotar(`<${m[1]}> sin nombre accesible`, pagina, m[2].slice(0, 60));

  for (const m of h.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    if (/type="(hidden|submit|button)"/.test(m[2])) continue;
    const id = m[2].match(/\bid="([^"]+)"/)?.[1];
    // Dentro de un <label> también cuenta: el último <label> abierto antes del control sigue sin cerrar.
    const antes = h.slice(0, m.index);
    const envuelto = antes.lastIndexOf("<label") > antes.lastIndexOf("</label>");
    const conFor = id && h.includes(`for="${id}"`);
    if (!envuelto && !conFor && !/aria-label/.test(m[2])) anotar("campo sin etiqueta", pagina, m[2].slice(0, 60));
  }

  // En un <div>/<span> sin role, los lectores de pantalla ignoran aria-label.
  for (const m of h.matchAll(/<(div|span)\b([^>]*)>/g))
    if (/aria-label=/.test(m[2]) && !/\brole=/.test(m[2])) anotar("aria-label en <div>/<span> sin role", pagina, m[2].slice(0, 60));
}

// --- resultado --------------------------------------------------------------
console.log(`${paginas.length} páginas revisadas.`);
if (problemas.size === 0) {
  console.log("✔ Sin problemas de accesibilidad detectables en el HTML.");
} else {
  for (const [tipo, lista] of problemas) {
    console.log(`\n✘ ${tipo} (${lista.length})`);
    for (const linea of [...new Set(lista)].slice(0, 8)) console.log(`  ${linea}`);
  }
  process.exitCode = 1; // así un script o la integración continua sabe que falló
}
