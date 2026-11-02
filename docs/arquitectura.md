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
│   ├── fechas.ts      utilidades de fechas (puras)
│   ├── progreso.ts    reglas del progreso: estaDesbloqueado, estadoLogro (puras)
│   ├── arbol.ts       disposición del árbol de habilidades (pura)
│   └── ejemplo.ts     progreso inventado para las muestras (temporal, hasta la fase 4)
├── components/      Componentes agrupados por DOMINIO (de qué tratan):
│   ├── layout/        Cabecera, PiePagina
│   ├── ui/            genéricos, sin conocer el juego (AnilloProgreso)
│   ├── mapa/          zonas y sendero
│   ├── jefes/
│   ├── canciones/     TarjetaCancion, ChipRuta, Dificultad
│   ├── logros/        InsigniaLogro, ChipLogro, ArbolTalentos, categorias.ts
│   ├── sesion/        SesionDeHoy
│   ├── tema/          SelectorTema
│   └── muestra/       solo para las páginas de muestra (temporal)
├── layouts/         Esqueletos de página (Base.astro)
├── pages/           Rutas: cada archivo es una URL
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

- **Cabecera de cada archivo:** `@file` en módulos `.ts` y `@component` / `@layout` en componentes, con qué hace y, si no es obvio, **por qué** está hecho así.
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
- Para reutilizar trozos de JSX dentro de un componente, usa **funciones auxiliares** llamadas como función (`{lista(...)}`), no componentes definidos dentro de otro componente: Preact los volvería a montar en cada render.
