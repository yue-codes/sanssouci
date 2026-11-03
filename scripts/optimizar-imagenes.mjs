/**
 * @file Optimiza las imágenes del sitio a mano, una vez, antes de compilar.
 *
 * Uso: `pnpm optimizar-imagenes`
 *
 * Lee cada imagen de `imagenes-originales/` (fuera de `src`: ahí se guardan tal cual
 * llegaron, para no perder calidad al repetir el proceso) y escribe dos versiones en
 * `src/assets/imagenes/`:
 *   - `<nombre>.webp`: hasta 1920 px de ancho, para portadas y fondos.
 *   - `<nombre>-mini.webp`: 640 px de ancho, para miniaturas (puertas del mapa, regiones).
 *
 * Por qué hace falta: las páginas estáticas ya optimizan al compilar, pero lo que se
 * genera en el worker (las Server Islands del mapa, las zonas y la portada) no puede
 * transformar imágenes (no hay sharp) y sirve el archivo tal cual. Si el archivo ya es
 * ligero, lo que se sirve también. Ver `docs/arquitectura.md`, «Imágenes».
 *
 * Para añadir una imagen: déjala en `imagenes-originales/`, pasa este script y
 * regístrala en `src/config/imagenes.ts` (con su `mini`).
 */
import { mkdir, readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const ORIGEN = "imagenes-originales";
const DESTINO = "src/assets/imagenes";
/** Las dos versiones: ancho máximo y calidad WebP (0–100). */
const VERSIONES = [
  { sufijo: "", ancho: 1920, calidad: 82 },
  { sufijo: "-mini", ancho: 640, calidad: 78 },
];
const FORMATOS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

await mkdir(DESTINO, { recursive: true });
const archivos = (await readdir(ORIGEN)).filter((f) => FORMATOS.has(extname(f).toLowerCase())).sort();
let antes = 0;
let despues = 0;

for (const archivo of archivos) {
  const origen = join(ORIGEN, archivo);
  const nombre = basename(archivo, extname(archivo));
  const pesoOrigen = (await stat(origen)).size;
  antes += pesoOrigen;
  const salidas = [];
  for (const { sufijo, ancho, calidad } of VERSIONES) {
    const destino = join(DESTINO, `${nombre}${sufijo}.webp`);
    // `withoutEnlargement`: una imagen pequeña no se agranda (solo perdería nitidez).
    // `effort: 6`: comprime más despacio pero mejor; se hace una vez, no en cada visita.
    const info = await sharp(origen).resize({ width: ancho, withoutEnlargement: true }).webp({ quality: calidad, effort: 6 }).toFile(destino);
    if (!sufijo) despues += info.size;
    salidas.push(`${info.width}px ${kb(info.size)}`);
  }
  console.log(`${archivo.padEnd(26)} ${kb(pesoOrigen).padStart(7)} → ${salidas.join(" · mini ")}`);
}
console.log(`\n${archivos.length} imágenes: ${kb(antes)} → ${kb(despues)} (sin contar las mini).`);
