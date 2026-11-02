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
│   ├── fechas.ts      utilidades de fechas: diaDelPlan, fechaLarga, fechaCorta… (puras)
│   ├── progreso.ts    reglas del progreso: Progreso, estadoLogro, ordenZonaActual… (puras)
│   ├── mapa.ts        datos del sendero: construirSendero, siguientePaso
│   ├── logros.ts      logrosConEstado (logros + su estado para el jugador)
│   ├── jefes.ts       jefesEnOrden, diaDelJefe
│   ├── calendario.ts  semanasDelPlan, minutosDelDia, hitosDelDia, primerDiaConFlauta (puras)
│   ├── formato.ts     formato para mostrar: duracion (pura)
│   ├── arbol.ts       nodos y disposición del árbol: construirNodosArbol, posicionarArbol
│   └── ejemplo.ts     PROGRESO_EJEMPLO, inventado (temporal, hasta la fase 4)
├── components/      Componentes agrupados por DOMINIO (de qué tratan):
│   ├── layout/        Cabecera, PiePagina
│   ├── ui/            genéricos, sin conocer el juego: AnilloProgreso, Aviso, MigasDePan,
│   │                  EncabezadoSeccion, NavegacionVecinos, ReproductorYoutube
│   ├── mapa/          Sendero → TramoSendero + ParadaZona + PuertaJefe; ResumenZona; TarjetaZona
│   ├── niveles/       TemarioZona
│   ├── jefes/         TarjetaJefe, CondicionesVictoria
│   ├── canciones/     TarjetaCancion, ChipRuta, Dificultad, ListaVersiones, usos.ts
│   ├── logros/        InsigniaLogro, ChipLogro, categorias.ts
│   │   └── arbol/       isla ArbolTalentos y sus piezas (LienzoArbol, ListaRama,
│   │                    PestanasRamas, DetalleTalento, Hexagono, estilos.ts)
│   ├── calendario/    SemanaCalendario → CeldaDia; hitos.ts
│   ├── sesion/        isla SesionDelDia; bloques.ts
│   └── tema/          SelectorTema
├── layouts/         Esqueletos de página (Base.astro)
├── pages/           Rutas: cada archivo es una URL (ver «Páginas»)
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

## Páginas

| Ruta | Archivo | Datos |
|---|---|---|
| `/mapa` | `pages/mapa.astro` | `construirSendero` |
| `/arbol` | `pages/arbol.astro` | `construirNodosArbol` → isla `ArbolTalentos` |
| `/niveles/[id]` | `pages/niveles/[id].astro` | `construirSendero` (su zona), `logrosConEstado` |
| `/jefes/[id]` | `pages/jefes/[id].astro` | `jefesEnOrden`, `diaDelJefe`, `logrosConEstado` |
| `/calendario` | `pages/calendario.astro` | `semanasDelPlan`, `hitosDelDia` |
| `/dias/[n]` | `pages/dias/[n].astro` | `hitosDelDia`, `logrosConEstado` → isla `SesionDelDia` |
| `/muestra` | `pages/muestra.astro` | Muestra de diseño; **temporal**, se borra al cerrar la fase 3 |

Pendientes: `/canciones`, `/canciones/[id]`, `/logros` y `/` (fase 3); `/entrar`, `/panel` y `/perfil` (fase 4).
