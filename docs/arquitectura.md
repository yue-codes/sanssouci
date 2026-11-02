# Arquitectura del frontend y convenciones de código

> Documento escrito a mano (no generado). Si cambias la estructura o una convención, actualízalo en el mismo commit.

## Estructura de carpetas

```
src/
├── config/          Configuración del sitio (nombre, navegación). Sin lógica.
├── data/            Contenido del juego en JSON: la fuente de verdad.
├── content.config.ts  Esquemas (Zod) de las colecciones de src/data.
├── lib/             Lógica en TypeScript, sin interfaz:
│   ├── contenido.ts   acceso a las colecciones (solo servidor)
│   ├── youtube.ts     URLs de YouTube: urlYoutube, urlEmbedYoutube, miniaturaYoutube (puras)
│   ├── canciones.ts   resumirCancion → CancionResumen (datos planos para las islas)
│   ├── catalogo.ts    filtros del catálogo: filtrarCanciones, filtrosDesdeURL… (puras, van al navegador)
│   ├── fechas.ts      utilidades de fechas: diaDelPlan, hoyIso (hoy en una zona horaria), fechaLarga… (puras)
│   ├── progreso.ts    reglas del progreso: Progreso, estadoLogro, ordenZonaActual, racha… (puras)
│   ├── mapa.ts        datos del sendero: construirSendero, siguientePaso
│   ├── logros.ts      logrosConEstado, usosDeLogros (qué abre cada logro), avancePorCategoria
│   ├── jefes.ts       jefesEnOrden, diaDelJefe
│   ├── calendario.ts  semanasDelPlan, minutosDelDia, hitosDelDia, primerDiaConFlauta,
│   │                  sesionDeReferencia (qué sesión enseñar «hoy») (puras)
│   ├── formato.ts     formato para mostrar: duracion (pura)
│   ├── arbol.ts       nodos y disposición del árbol: construirNodosArbol, posicionarArbol
│   ├── ejemplo.ts     PROGRESO_EJEMPLO, inventado (temporal, hasta la fase 4)
│   ├── supabase.ts    crearClienteServidor, usuarioActual, rutaInterna (solo servidor)
│   ├── progreso-usuario.ts  cargarProgresoUsuario: Progreso real desde Supabase (solo servidor)
│   └── tipos-supabase.ts  tipos de las tablas (GENERADO desde la base de datos)
├── components/      Componentes agrupados por DOMINIO (de qué tratan):
│   ├── layout/        Cabecera, PiePagina
│   ├── ui/            genéricos, sin conocer el juego: AnilloProgreso, Aviso, MigasDePan,
│   │                  EncabezadoSeccion, NavegacionVecinos, ReproductorYoutube
│   ├── mapa/          Sendero → TramoSendero + ParadaZona + PuertaJefe; ResumenZona; TarjetaZona; EstasAqui
│   ├── niveles/       TemarioZona
│   ├── jefes/         TarjetaJefe, CondicionesVictoria
│   ├── canciones/     TarjetaCancion, ChipRuta, Dificultad (.tsx: sirven en páginas e islas),
│   │   │              ListaVersiones, usos.ts
│   │   └── catalogo/    isla CatalogoCanciones → PanelFiltros
│   ├── logros/        TarjetaLogro, ChipLogro, AvanceCategorias, categorias.ts
│   │   └── arbol/       isla ArbolTalentos y sus piezas (LienzoArbol, ListaRama,
│   │                    PestanasRamas, DetalleTalento, Hexagono, estilos.ts)
│   ├── calendario/    SemanaCalendario → CeldaDia; LineaNoventaDias; hitos.ts
│   ├── sesion/        isla SesionDelDia; ResumenSesion; bloques.ts
│   └── tema/          SelectorTema
├── layouts/         Esqueletos de página (Base.astro)
├── middleware.ts    Sesión de cada petición de servidor y protección de RUTAS_PRIVADAS
├── env.d.ts         Tipos de Astro.locals (supabase, usuario)
├── pages/           Rutas: cada archivo es una URL (ver «Páginas»)
│   └── auth/          endpoints de sesión: confirmar (GET, enlace mágico), salir (POST)
└── styles/
    ├── tokens.css     colores y fuentes: el único sitio para cambiar la paleta
    └── global.css     conecta Tailwind con los tokens; estilos base
```

**Por qué por dominio y no por tipo:** cuando trabajas en los logros, todo lo de logros está en una carpeta. Separar por tipo (`islas/` frente a `ui/`) obliga a saltar entre carpetas para una misma función. Que un componente sea isla se decide **al usarlo** (`client:load`, `client:visible`), no por su carpeta. Por eso cada isla lo dice en su cabecera: `@component ArbolTalentos (isla: client:load)`.

**Dónde va cada cosa nueva:**
- ¿Es una regla del juego o un cálculo? → función pura en `src/lib/`.
- ¿Muestra algo de un dominio (canciones, jefes…)? → `src/components/<dominio>/`.
- ¿Es una pieza visual que serviría en cualquier web (botón, barra, anillo)? → `src/components/ui/`.
- ¿Es un texto o enlace que se repite en la interfaz? → `src/config/`.

## Imports

- Entre carpetas: alias **`@/`** → `src/` (configurado en `tsconfig.json`; Astro lo lee de ahí).
  `import { cargarContenido } from "@/lib/contenido";`
- Dentro de la misma carpeta: **`./`**. `import Dificultad from "./Dificultad.astro";`
- Nunca `../`: si lo necesitas, usa `@/`.

### Qué puede importar una isla

Una isla se ejecuta **también en el navegador**, así que todo lo que importe (y lo que eso importe) viaja al navegador. `@/lib/contenido` depende de `astro:content`, que **solo existe en el servidor**: si una isla lo importa, aunque sea indirectamente, el build falla con `ServerOnlyModule`.

- Una isla recibe **datos planos** por props (p. ej. `CancionResumen`), calculados en la página.
- Solo puede importar módulos «seguros»: `@/lib/catalogo`, `@/lib/youtube`, `@/lib/progreso`… Si un módulo seguro necesita tipos de `contenido`, usa **`import type`**, que TypeScript borra al compilar.
- Si una función pura vive junto a código de servidor y la necesita una isla, se saca a su propio archivo (así nacieron `youtube.ts` y `catalogo.ts`).
- `@/lib/supabase` también es solo de servidor (usa las cookies de Astro). Una isla que necesite Supabase usará un cliente de navegador aparte (`createBrowserClient`), aún no creado.

## Sesión y páginas de servidor (fase 4)

- **Por defecto, todo se prerenderiza.** Una página que dependa de quién visita declara `export const prerender = false`; solo esas pasan por `src/middleware.ts` en cada visita.
- **El middleware** crea un cliente de Supabase por petición y deja `Astro.locals.supabase` y `Astro.locals.usuario`. Si la ruta está en `RUTAS_PRIVADAS` (`src/config/sitio.ts`) y no hay sesión, redirige a `/entrar?siguiente=…`.
- **Quién visita se sabe con `getClaims()`**, que verifica la firma del token. Nunca con `getSession()` en el servidor: lee la cookie sin verificarla.
- **Cabeceras anti-caché:** cuando Supabase escribe cookies de sesión, el middleware añade `Cache-Control: private, no-store…` para que ningún CDN sirva la sesión de alguien a otra persona.
- **Redirecciones tras entrar:** siempre pasan por `rutaInterna()`, que solo acepta rutas del propio sitio (evita la «redirección abierta»).
- **Formularios:** HTML normal con `method="post"`, sin JavaScript. Astro rechaza los POST que vienen de otro dominio (`security.checkOrigin`, activo por defecto), lo que protege contra CSRF. Cerrar sesión es un POST, nunca un enlace.
- **«Hoy» en el servidor:** Cloudflare funciona en UTC. Usa siempre `hoyIso(SITIO.zonaHoraria)`, nunca `new Date()` a secas, y el día del plan sale de `perfil.fecha_inicio`.
- **Progreso real:** `cargarProgresoUsuario(Astro.locals.supabase)` devuelve el mismo `Progreso` que `PROGRESO_EJEMPLO`, así que las funciones de `src/lib/` sirven igual. No filtres por `user_id`: lo hace RLS.
- **Variables de entorno:** se declaran y validan en `env.schema` (`astro.config.mjs`) y se importan de `astro:env/client`. Si falta una, el build falla.

## Colores y tema

- **Tres capas** en `src/styles/tokens.css`:
  1. **Paleta** «Bosque» (verde jade + ámbar): da valores a los primitivos. Para tener varias, se añaden bloques `:root[data-paleta="…"]` que solo redefinen lo que cambia.
  2. **Primitivos por papel** (`--neutro-*`, `--marca-*`, `--apoyo-*`, `--calido-*`, `--exito-*`, `--peligro-*`). No se usan en componentes.
  3. **Semánticos** (`--fondo`, `--acento`…): el papel del color. Cada uno elige un primitivo para cada tema con `light-dark(claro, oscuro)`. No cambian con la paleta.
- En componentes, solo utilidades semánticas de Tailwind: `bg-superficie`, `text-acento`, `border-borde/60`. **Nunca** colores literales (`#…`, `bg-green-500`) ni clases `dark:`.
- Los nombres semánticos describen la **función**, no el color, para que cambiar la paleta no obligue a renombrar nada:

| Token | Para qué |
|---|---|
| `fondo`, `superficie`, `superficie-2`, `borde` | Capas de la interfaz |
| `texto`, `tenue` | Texto principal y secundario |
| `acento`, `acento-suave` | Marca: botones, zona actual, logros conseguidos |
| `secundario` | Acento discreto |
| `resalte` | Lo que pide atención: logros disponibles, retos |
| `exito` | Lo completado |
| `peligro` | Errores y jefes |

- La excepción son los colores de **ruta** (`rutas.json`): son datos del contenido, no del diseño.
- **Tema:** por defecto sigue al sistema (`color-scheme: light dark`). El selector fija `data-theme="light|dark"` en `<html>` y lo guarda en `localStorage` (clave `tema`).
- **Contraste:** todos los colores de texto cumplen WCAG AA (≥ 4.5:1) en ambos temas. Compruébalo si cambias un valor.

## Documentación del código

- **Cabecera de cada archivo:** `@file` en módulos `.ts` y `@component` / `@layout` en componentes, con qué hace y, si no es obvio, **por qué** está hecho así. En los `.astro` va al principio del frontmatter; en los `.tsx`, justo encima de la función del componente (después de los imports). Las islas lo indican: `@component ArbolTalentos (isla: client:load)`.
- **Páginas:** comentario al principio del frontmatter con la ruta, qué muestra y de dónde salen sus datos.
- **JSDoc en todo lo exportado:** descripción, `@param`, `@returns` y un `@example` cuando ayude.
- **Props documentadas:** un comentario `/** … */` sobre cada prop de la interfaz `Props`. El editor lo muestra al pasar el ratón.
- **Comentarios dentro del código:** solo para el **porqué** (una decisión, una trampa). El **qué** debe leerse en el propio código.
- Idioma: español, como el resto del proyecto.

## Nombres

- Componentes: `PascalCase` (`TarjetaZona.astro`, `ArbolTalentos.tsx`).
- Módulos de `lib/` y `config/`: minúsculas (`progreso.ts`).
- Funciones y variables: `camelCase` en español (`estaDesbloqueado`, `diasRestantes`).
- Constantes de módulo: `MAYUSCULAS` (`NAVEGACION`, `ORDEN_RAMAS`).
- Ids del contenido: `kebab-case`, **estables** (la base de datos los guardará).

## Islas de Preact

- Solo son islas los componentes que necesitan interactividad; el resto se renderiza como HTML fijo.
- A una isla se le pasan **datos planos** (solo lo que necesita), porque todo lo que recibe se escribe en el HTML.
- Estado: `useSignal` / `useComputed` dentro de componentes (no `signal` / `computed`, que crearían uno nuevo en cada render).
- Para reutilizar trozos de JSX, usa un **componente definido al nivel del módulo** (como `Relacionados` en `DetalleTalento.tsx`) o una función auxiliar llamada como función (`{lista(...)}`). Nunca un componente definido *dentro* de otro: Preact lo consideraría nuevo en cada render y lo volvería a montar.

**Una isla grande, en piezas:** cuando una isla crece (como el árbol), solo el componente raíz guarda estado (signals); las piezas hijas reciben datos y avisan con callbacks (`onElegir`, `onAlternar`). Así cada pieza se entiende sola y el estado vive en un único sitio.

## Separar datos y presentación

Una página no calcula: pide los datos ya preparados a `src/lib/` y se los pasa a los componentes. Por ejemplo, `/mapa` llama a `construirSendero(contenido, progreso)` y solo pinta el resultado. Ventajas: la lógica se puede probar sin interfaz, y en la fase 4 solo cambia de dónde sale `progreso`, no las páginas ni los componentes.

## Páginas de detalle (`[id].astro`)

Las rutas con corchetes son dinámicas: `src/pages/niveles/[id].astro` genera `/niveles/nivel-0`, `/niveles/nivel-1`… Como el sitio es estático, Astro necesita saber al compilar qué ids existen, y eso es lo que devuelve `getStaticPaths()`. Se genera desde la colección, así que una zona o un jefe nuevo en los JSON tiene su página sin tocar código. Todas las páginas de detalle siguen el mismo esqueleto: `MigasDePan` → cabecera → secciones con `EncabezadoSeccion` → `NavegacionVecinos`.

## Mapas de etiquetas (`Record<Tipo, …>`)

Cuando un valor del esquema (una categoría de logro, un uso de versión, un tipo de bloque, un hito) necesita nombre e icono en la interfaz, se define **una vez** en un archivo `.ts` junto a los componentes de su dominio:

| Archivo | Qué traduce |
|---|---|
| `logros/categorias.ts` | Categoría de logro → icono, nombre y orden de las ramas |
| `canciones/usos.ts` | Uso de una versión (partitura, referencia…) → nombre e icono |
| `sesion/bloques.ts` | Tipo de bloque de una sesión → nombre e icono |
| `calendario/hitos.ts` | Hito de un día (jefe, clase…) → nombre, icono y color |

Se escriben como `Record<Tipo, …>`, con el tipo sacado del esquema (por ejemplo, `Dia["data"]["bloques"][number]["tipo"]`). Así, si el esquema gana un valor nuevo y falta aquí, `astro check` da error en vez de mostrar un hueco en la página.

## Accesibilidad

Reglas que cumple cada página. **`pnpm auditar`** comprueba sobre el HTML generado las que se pueden ver leyendo el código; lo demás (teclado, lector de pantalla) se prueba a mano.

- **Un solo `<h1>` por página y sin saltos de nivel** (h1 → h2 → h3). Quien usa lector de pantalla navega por encabezados; si una sección no necesita título visible, lleva un `<h2 class="sr-only">`.
- **Imágenes:** `alt=""` si son decorativas (la miniatura de un video junto a su título); texto en `alt` si aportan información.
- **Controles con nombre:** cada `<input>`/`<select>` tiene su `<label>` (visible o `sr-only`), y cada botón o enlace solo con icono, `aria-label`. Los iconos llevan `aria-hidden="true"`.
- **`aria-label` solo en elementos con papel:** en un `<div>` o `<span>` sin `role` se ignora. Una zona desplazable con `tabindex="0"` lleva `role="region"` + `aria-label`.
- **Gráficos** (anillos, barras, tiras de días): el dato también está en texto (visible o `sr-only`); el dibujo va con `aria-hidden`.
- **Plegables:** `<details>` nativo antes que JavaScript. Controles propios: `aria-expanded`, `aria-pressed`, `aria-controls` o el patrón de pestañas de WAI-ARIA.
- **Movimiento:** la regla global de `global.css` anula animaciones y transiciones con `prefers-reduced-motion`; no hace falta `motion-reduce:` en cada clase. El desplazamiento suave por JavaScript sí debe comprobarlo (ver `ListaRama`).
- **Foco visible** global (`:focus-visible` en `global.css`) y enlace «Saltar al contenido» en `Base`.
- **Contraste:** mínimo 4.5 : 1 en texto; los pares de `tokens.css` se comprobaron en claro y oscuro.

## Páginas

| Ruta | Archivo | Datos |
|---|---|---|
| `/` | `pages/index.astro` | `sesionDeReferencia`, `construirSendero` + `siguientePaso`, `diaDelJefe` |
| `/mapa` | `pages/mapa.astro` | `construirSendero` |
| `/arbol` | `pages/arbol.astro` | `construirNodosArbol` → isla `ArbolTalentos` |
| `/niveles/[id]` | `pages/niveles/[id].astro` | `construirSendero` (su zona), `logrosConEstado` |
| `/jefes/[id]` | `pages/jefes/[id].astro` | `jefesEnOrden`, `diaDelJefe`, `logrosConEstado` |
| `/calendario` | `pages/calendario.astro` | `semanasDelPlan`, `hitosDelDia` |
| `/dias/[n]` | `pages/dias/[n].astro` | `hitosDelDia`, `logrosConEstado` → isla `SesionDelDia` |
| `/canciones` | `pages/canciones/index.astro` | `resumirCancion` → isla `CatalogoCanciones` (filtros en la URL: `?ruta=…&zona=…&max=…&oido=1&partitura=1&q=…&orden=…`) |
| `/canciones/[id]` | `pages/canciones/[id].astro` | `logrosConEstado`; vecinos dentro de la misma ruta, por dificultad |
| `/logros` | `pages/logros.astro` | `logrosConEstado`, `usosDeLogros`, `avancePorCategoria`; agrupados por `nivelSugerido` |

Pendientes: `/entrar`, `/panel` y `/perfil` (fase 4).
