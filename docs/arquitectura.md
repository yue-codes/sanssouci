# Arquitectura del frontend y convenciones de código

> Documento escrito a mano (no generado). Si cambias la estructura o una convención, actualízalo en el mismo commit.

## Estructura de carpetas

```
src/
├── assets/imagenes/ Imágenes que Astro optimiza al compilar (ver «Imágenes»).
├── config/          Configuración del sitio (nombre, navegación, horario) e
│                    imagenes.ts (catálogo de imágenes: alt y a qué zona/jefe/ruta van).
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
│   ├── formato.ts     formato para mostrar: duracion, sumarMinutos (puras)
│   ├── partitura.ts   los 90 días como partitura: componerPartitura (pura, va al navegador)
│   ├── arbol.ts       nodos y disposición del árbol: construirNodosArbol, posicionarArbol
│   ├── ejemplo.ts     PROGRESO_EJEMPLO, inventado (temporal, hasta la fase 4)
│   ├── supabase.ts    crearClienteServidor, usuarioActual, rutaInterna (solo servidor)
│   ├── progreso-usuario.ts  cargarProgresoUsuario: Progreso real desde Supabase (solo servidor)
│   └── tipos-supabase.ts  tipos de las tablas (GENERADO desde la base de datos)
├── components/      Componentes agrupados por DOMINIO (de qué tratan):
│   ├── layout/        Cabecera, PiePagina, Logo
│   ├── ui/            genéricos, sin conocer el juego: AnilloProgreso, Aviso, MigasDePan,
│   │                  EncabezadoSeccion, NavegacionVecinos, ReproductorYoutube, FondoPortada, isla Estallido
│   ├── mapa/          HudMapa (marcador); MundoMapa → FilaCamino + RegionZona + PuertaJefe; MiniMapa;
│   │                  SenderoPortada (el sendero en horizontal, con imágenes)
│   ├── niveles/       TemarioZona
│   ├── jefes/         CabeceraJefe; islas VidaJefe y CombateJefe (comparten estado en combate.ts);
│   │                  AnuncioJefe (el jefe como puerta)
│   ├── canciones/     TarjetaCancion, ChipRuta, Dificultad (.tsx: sirven en páginas e islas), rareza.ts,
│   │                  isla IndiceRutas (rutas con imagen que sigue al cursor),
│   │   │              ListaVersiones, usos.ts
│   │   └── catalogo/    isla CatalogoCanciones → PanelFiltros
│   ├── logros/        TarjetaLogro, ChipLogro, AvanceCategorias, ListaMisiones, BarraMisiones, categorias.ts
│   │   └── arbol/       isla ArbolTalentos y sus piezas (LienzoArbol, ListaRama,
│   │                    PestanasRamas, DetalleTalento, Hexagono, AvisoDesbloqueo, estilos.ts)
│   ├── calendario/    SemanaCalendario → CeldaDia; RecorridoPlan; isla PartituraNoventaDias; hitos.ts
│   ├── cuenta/        lo que se ve en /panel y /entrar: PantallaPanel; TarjetaEntrar + estado-entrar.ts
│   └── sesion/        isla MisionDelDia (cronómetro); ResumenSesion; bloques.ts
├── layouts/         Esqueletos de página (Base.astro)
├── middleware.ts    Sesión de cada petición de servidor y protección de RUTAS_PRIVADAS
├── env.d.ts         Tipos de Astro.locals (supabase, usuario)
├── pages/           Rutas: cada archivo es una URL (ver «Páginas»)
│   └── auth/          endpoints de sesión: confirmar (GET, enlace mágico), salir (POST)
├── scripts/         JavaScript de página entera, sin componente: movimiento.ts (ver «Movimiento»)
└── styles/
    ├── tokens.css     colores y fuentes: el único sitio para cambiar la paleta
    └── global.css     conecta Tailwind con los tokens; estilos base y clases comunes
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

## Colores, tipografía y tema

**Dirección visual «Nocturno», paleta «Cian»** (2 nov 2026): la web es la hora de practicar, de 8 a 10 de la noche. Los colores salen de la imagen principal (`anime-cian.webp`): noche azul índigo, texto rosa pálido, el cian como luz principal, lavanda, cielo y el rosa fuerte de sus cintas. Imágenes grandes y grano de película. Los 90 días se leen como una partitura; el lenguaje de juego (sendero, puertas, niebla) vive en el mapa y el árbol.

**El mapa del mundo (`/mapa`):** se sube de abajo (inicio) arriba (cumbre). En el HTML va en el orden del viaje y `flex-col-reverse` le da la vuelta solo a la vista, para que el lector de pantalla lo lea en orden. Cada fila (`FilaCamino`) tiene dos mitades de camino: andado (luz cian que fluye), pendiente (discontinuo) o en niebla (punteado). Los jefes son puertas con tres estados: cerrada (faltan llaves = logros que pide), abierta (late) y derrotado. La niebla (`.niebla`) espesa con la distancia y se sale por los lados, por eso su sección lleva `overflow-x-clip`. El anillo de cada zona se dibuja al entrar en pantalla (`data-trazar`).

**El árbol de talentos (`/arbol`):** un mapa de estrellas con los mismos colores que el mapa (menta conseguido, lavanda disponible). Cada rama lleva su avance en segmentos; el jugador tiene un rango decorativo (`rangoTalentos`). Al pasar el ratón (o el foco del teclado) por un talento, o al elegirlo, se resalta en cian su ruta de requisitos (`ancestrosDe`) y en lavanda lo que abre. El filtro «¿Qué puedo hacer ya?» deja encendido solo lo disponible y lo que lo abrió. Las llaves de jefe (`llaveDe` en `NodoTalento`) son más grandes y llevan anillo rosa. Al entrar en pantalla las líneas se dibujan de arriba abajo (`clip-path` animado en un div, no en el `<svg>`) y los talentos aparecen por filas; lo conseguido lleva una luz que corre por la línea (`animate-trazo`). Al conseguir uno (demo hasta la fase 4) hay celebración: `Estallido` (chispas con `motion`, nada si se pide menos movimiento), marca «nuevo» en lo que se abre y `AvisoDesbloqueo` (región `aria-live`). El árbol se ve entero y a todo el ancho desde `lg`: el lienzo se escala (`transform: scale`, medido con `ResizeObserver`, entre 0,65 y 1,35) para llenar el ancho, y la ficha del talento es una barra `sticky` abajo que se puede minimizar (el aviso de desbloqueo sale arriba para no taparla). En pantallas más chicas, pestañas y lista con la ficha desplegada bajo el talento.

**Los jefes (`/jefes/[id]`):** pantalla de combate. Arriba, el enemigo con su barra de vida (un segmento por condición de victoria, más la grabación) y su ficha (tempo, dificultad, llaves, ruta, cuándo). Abajo, la arena: el video de referencia y las condiciones como golpes; el último siempre es grabar. La barra (`VidaJefe`) y los golpes (`CombateJefe`) son **dos islas que comparten estado** con un `signal` a nivel de módulo (`jefes/combate.ts`): las islas de Astro se montan por separado, pero un módulo importado por las dos es el mismo. Al vencer, «¡Victoria!» con `Estallido` (en `ui/`, lo usa también el árbol). Demo hasta la fase 4.

**Los días (`/dias/[n]`):** cada día es una «misión». Portada con la imagen de su zona (`zonaDelDia`), la del jefe en su día o una tranquila en los descansos; el objetivo; y `RecorridoPlan`, los 90 días en una línea con este día brillando. La sesión es la isla `MisionDelDia`: etapas sobre un camino y **cronómetro** por etapa (cuenta atrás; al llegar a cero avisa «¡Tiempo!» y tú decides cuándo darla por hecha). Al completar todas, «¡Misión cumplida!». Los descansos son un «campamento» con enlace a la próxima misión.

**El calendario (`/calendario`):** «La campaña» en dos actos (sin flauta / con flauta, separados por la semana en que llega la flauta). Cada semana es una fila (`SemanaCalendario`) de casillas (`CeldaDia`) con tono por estado (`data-tono`: hoy, jefe, flauta, descanso, normal) y una línea cian en los días que ya pasaron. Tras la semana de cada jefe, una puerta dice a qué zona se pasa (`zonaDelDia`). Arriba, `RecorridoPlan` (sin su leyenda, porque la página tiene la suya) y la próxima misión.

**Las zonas (`/niveles/[id]`):** como entrar a una región. Portada con su imagen (con niebla si está lejos), el `MiniMapa` de las 9 zonas (tu posición con «TÚ», la zona vista con anillo, los jefes como rombos) y un marcador con `BarraMisiones`. Debajo: las misiones para pasar (`ListaMisiones`, la misma lista que usa el mapa), el temario, el guardián (`AnuncioJefe`; «???» si la zona está en la niebla), las canciones y las misiones secundarias (logros opcionales).

**Los logros (`/logros`):** la sala de trofeos. Portada con el rango (`rangoTalentos`, el mismo del árbol) y `AvanceCategorias` como estandartes con una casilla por logro. Luego «Al alcance ahora» y las vitrinas por zona: `TarjetaLogro` usa la medalla `Hexagono` del árbol (con anillo de llave si abre un jefe). El filtro por estado no usa JavaScript: radios nativos + CSS `:has()` en un `<style is:global>` de la página (global porque las tarjetas son de otro componente).

**Las canciones (`/canciones`, `/canciones/[id]`):** el repertorio como un mazo de cartas. La rareza sale de la dificultad (`rarezaDe` en `components/canciones/rareza.ts`: común 1–3, rara 4–6, épica 7–8, legendaria 9–10) y colorea el borde de la carta y las barras de `Dificultad`. `resumirCancion(c, s, obtenidos)` añade `faltan` (requisitos que no tienes; la carta sale bloqueada si es > 0) y `jefe`. El catálogo filtra «¿Qué puedo tocar ya?» (`soloListas`, `?listas=1`). La ficha usa `ListaMisiones` para «Para desbloquearla» y «Lo que entrena», y `AnuncioJefe` si es canción de jefe.

**El panel (`/panel`) y la entrada (`/entrar`):** las dos son páginas de servidor, así que **la página solo carga los datos y un componente de `components/cuenta/` pinta** (`PantallaPanel`, `TarjetaEntrar`). Así se pueden probar con datos de ejemplo sin iniciar sesión: una página temporal (no se sube) que les pase `PROGRESO_EJEMPLO`, compilar y mirar. El panel es la pantalla del personaje: día del plan, racha, rango, `MiniMapa` con tu posición, la sesión de hoy, un marcador (sesiones, tiempo, logros, jefes) y debajo la partitura, tus misiones y el próximo jefe. `/entrar` es «Continúa tu partida»: imagen a sangre y la tarjeta con sus tres caras.

- **Solo tema oscuro**, a propósito: no hay `light-dark()`, ni selector de tema, ni `data-theme`.
- **Dos capas** en `src/styles/tokens.css`:
  1. **Paleta** con nombre propio (`--noche-*`, `--perla-*`, `--bruma-*`, `--cian-*`, `--lavanda-*`, `--cielo-*`, `--menta-*`, `--rosa-*`, `--cobalto-*`). No se usan en componentes.
  2. **Semánticos** (`--fondo`, `--acento`…): el papel del color.
- En componentes, solo utilidades semánticas de Tailwind: `bg-superficie`, `text-acento`, `border-borde/60`. **Nunca** colores literales (`#…`, `bg-green-500`).
- Los nombres semánticos describen la **función**, no el color:

| Token | Para qué |
|---|---|
| `fondo`, `superficie`, `superficie-2`, `borde`, `borde-fuerte` | Capas de la interfaz |
| `texto`, `tenue` | Texto principal y secundario |
| `acento`, `acento-claro`, `acento-suave` | Marca (cian): botones, hoy, la zona actual |
| `secundario` | Acento discreto (cielo); también las sesiones con flauta en la partitura |
| `resalte` | Lo que ya se puede hacer (lavanda): logros disponibles |
| `exito` | Lo completado (menta) |
| `peligro` | Jefes y errores (rosa) |
| `tinte` | Color del velo que entona las fotos (cobalto; clase `.velo`) |

- La excepción son los colores de **ruta** (`rutas.json`): son datos del contenido, no del diseño.
- **Contraste:** todos los colores de texto cumplen WCAG AA (≥ 4.5:1) sobre `fondo`, `superficie` y `superficie-2`.
- **Fuentes** (Fontsource, instaladas con `pnpm add`): **Instrument Serif** para títulos (solo existe en peso 400: los `h1`–`h3` nunca van en negrita y llevan `font-synthesis: none`), **Bricolage Grotesque** para el texto y **Martian Mono** para cifras, fechas y etiquetas (`font-mono`, clase `.eyebrow`). Pixelify Sans, solo en `/arbol`.
- **Clases comunes** en `global.css`: `.contenedor` (ancho y márgenes de página), `.tarjeta`, `.eyebrow`, `.boton`, `.boton-borde`, `.enlace-flecha` y `.velo` (tiñe una imagen con la paleta; se retira con `group-hover:opacity-0`).
- **Páginas a sangre:** `<Base ancho="completo">` quita el contenedor de `<main>`; la página pone `.contenedor` en cada sección.

## Imágenes

- Viven en `src/assets/imagenes/` (no en `public/`), para que Astro las optimice **al compilar**: AVIF con respaldo WebP, en varios tamaños, con `width`/`height` y nombre con hash. El adaptador de Cloudflare va con `imageService: "compile"` (usa `sharp`); sin eso usaría Cloudflare Images, un servicio aparte.
- **Catálogo único:** `src/config/imagenes.ts` las importa, les da su `alt` y su punto de enfoque, y dice qué imagen va con cada zona (`IMAGEN_ZONA`), jefe (`imagenDeJefe`) y ruta (`IMAGEN_RUTA`). Los componentes las piden ahí; no importan imágenes sueltas.
- En componentes `.astro`: `<Picture src={img.src} widths={[…]} sizes="…" formats={["avif"]} fallbackFormat="webp" />`. El respaldo en WebP es a propósito: con una fuente WebP, Astro usaría PNG como respaldo, de varios MB.
- **Portadas con imagen a sangre:** usa `FondoPortada` (`components/ui/`) dentro de una `<section class="relative isolate overflow-hidden …">`. Pinta la imagen con zoom lento, el velo y los dos degradados; se ajusta con `velo`, `lateral`, `base` y `apagada`, y las capas propias de la página (niebla, brillo de jefe) van en su slot. No copies esas capas a mano en una página nueva.
- **En una isla** no se puede usar `<Picture>`: la página llama a `getImage()` y le pasa la URL ya optimizada (ver `IndiceRutas`).
- En las páginas de servidor (`/panel`, `/entrar`) las imágenes se sirven sin transformar (el worker no tiene `sharp`): úsalas con moderación ahí. Por eso sus portadas usan las dos más ligeras: `silueta-ventana.jpg` (34 KB) y `anime-nubes.jpg` (135 KB).
- Casi todas son imágenes ajenas: sirven mientras la web es personal; antes de compartirla, hay que cambiarlas.

## Movimiento

Instalado: **motion** (animaciones; su versión para el DOM funciona con Preact) y **Lenis** (scroll suave). Todo pasa por `src/scripts/movimiento.ts`, que `Base.astro` carga en cada página y que funciona con atributos:

| Atributo | Efecto |
|---|---|
| `data-revelar` | El elemento sube y aparece al entrar en pantalla |
| `data-revelar="hijos"` | Igual, con cada hijo uno detrás de otro |
| `data-crecer` | Los hijos crecen de izquierda a derecha (barras) |
| `data-paralaje` (+ `data-marco` en su contenedor) | La imagen se mueve más lento que la página |
| `data-cabecera` | Recibe `data-desplazado` al bajar (la cabecera gana fondo) |
| `data-lenis-prevent-wheel` | Zonas con desplazamiento horizontal propio |

- **Nunca queda contenido oculto:** el estado inicial (opacidad 0) solo se aplica si `<html>` tiene la clase `movimiento`, que pone un script en `<head>` cuando el sistema no pide menos movimiento. Si `movimiento.ts` no carga en 2,5 s, la clase se quita.
- Las islas que animan (`PartituraNoventaDias`, `IndiceRutas`) comprueban esa misma clase antes de animar.
- **Cambio de página:** View Transitions nativas entre documentos (`@view-transition` en `global.css`), sin router de JavaScript.

## Documentación del código

- **Cabecera de cada archivo:** `@file` en módulos `.ts` y `@component` / `@layout` en componentes, con qué hace y, si no es obvio, **por qué** está hecho así. En los `.astro` va al principio del frontmatter; en los `.tsx`, justo encima de la función del componente (después de los imports). Las islas lo indican: `@component ArbolTalentos (isla: client:load)`.
- **Páginas:** comentario al principio del frontmatter con la ruta, qué muestra y de dónde salen sus datos.
- **JSDoc en todo lo exportado:** descripción, `@param`, `@returns` y un `@example` cuando ayude.
- **Props documentadas:** un comentario `/** … */` sobre cada prop de la interfaz `Props`. El editor lo muestra al pasar el ratón.
- **Comentarios dentro del código:** solo para el **porqué** (una decisión, una trampa). El **qué** debe leerse en el propio código.
- Idioma: español, como el resto del proyecto.

## Nombres

- Componentes: `PascalCase` (`MiniMapa.astro`, `ArbolTalentos.tsx`).
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
- **Contraste:** mínimo 4.5 : 1 en texto; los pares de `tokens.css` se comprobaron sobre los fondos del tema oscuro.

## Páginas

| Ruta | Archivo | Datos |
|---|---|---|
| `/` | `pages/index.astro` | `sesionDeReferencia`, `diasParaPartitura` → isla `PartituraNoventaDias`, `construirSendero`, `diaDelJefe`, rutas con `getImage` → isla `IndiceRutas` |
| `/mapa` | `pages/mapa.astro` | `construirSendero` (zonas, jefes con llaves, `abierto` y `dia`) → `HudMapa` + `MundoMapa` |
| `/arbol` | `pages/arbol.astro` | `construirNodosArbol` → isla `ArbolTalentos` (usa `ancestrosDe` y `rangoTalentos`) |
| `/niveles/[id]` | `pages/niveles/[id].astro` | `construirSendero` (todas las zonas, para el `MiniMapa`), `logrosConEstado` (misiones secundarias) |
| `/jefes/[id]` | `pages/jefes/[id].astro` | `jefesEnOrden`, `diaDelJefe`, `logrosConEstado` → `CabeceraJefe` (isla `VidaJefe`) + isla `CombateJefe` |
| `/calendario` | `pages/calendario.astro` | `semanasDelPlan`, `hitosDelDia`, `zonaDelDia` (puertas tras cada jefe) → `RecorridoPlan` + `SemanaCalendario` → `CeldaDia` |
| `/dias/[n]` | `pages/dias/[n].astro` | `hitosDelDia`, `zonaDelDia`, `logrosConEstado` → `RecorridoPlan`, `AnuncioJefe`, isla `MisionDelDia` |
| `/canciones` | `pages/canciones/index.astro` | `resumirCancion` (con el progreso: `faltan`) → isla `CatalogoCanciones` (filtros en la URL: `?ruta=…&zona=…&max=…&oido=1&partitura=1&listas=1&q=…&orden=…`); leyenda con `RAREZAS` |
| `/canciones/[id]` | `pages/canciones/[id].astro` | `logrosConEstado` → `ListaMisiones`, `rarezaDe`, `diaDelJefe` → `AnuncioJefe`; vecinos dentro de la misma ruta, por dificultad |
| `/logros` | `pages/logros.astro` | `logrosConEstado`, `usosDeLogros`, `avancePorCategoria`, `rangoTalentos`; vitrinas por `nivelSugerido`, filtro con `:has()` |

| `/panel` | `pages/panel.astro` (servidor) | `cargarProgresoUsuario` (Supabase) → `PantallaPanel` (`racha`, `rangoTalentos`, `construirSendero` → `MiniMapa` + `ListaMisiones`, `sesionDeReferencia` → `ResumenSesion`, isla `PartituraNoventaDias`, `AnuncioJefe`) |
| `/entrar` | `pages/entrar.astro` (servidor) | `signInWithOtp` (enlace mágico) → `TarjetaEntrar` (formulario, «revisa tu correo» o «ya estás dentro») |

Pendiente: `/perfil` (fase 4).
