# Cómo clasificar una canción nueva

Para pedirlo, basta con decirle a Claude **«clasifícame esta nueva: <título o URL de YouTube>»**. Este documento es el criterio que se sigue, para que el resultado sea siempre consistente (y para que puedas hacerlo tú mismo).

## Pasos

1. **Datos del video.** Con la URL, sacar los metadatos sin descargar:
   `yt-dlp --skip-download -j "<URL>"` → `id`, `title`, `channel`, `duration` y `description`.
2. **¿Es pieza para flauta traversa?**
   - Si es flauta dulce, un meme, un comentario o solo una pista sin flauta → va a `src/data/extras.json`.
   - Si la obra ya existe en `canciones.json` → **se añade como versión nueva** de esa obra, no como obra nueva.
3. **Clasificar la obra** con las tablas de abajo.
4. **Añadir el título** a `canciones.txt`.
5. **Comprobar:** `pnpm verificar` y `pnpm astro check`.
6. **Regenerar los documentos:** `pnpm generar-docs`.

## Plantilla (`src/data/canciones.json`)

```json
{
  "id": "titulo-en-kebab-case",
  "titulo": "Título de la obra",
  "obra": "Franquicia, álbum u obra mayor",
  "compositor": "Opcional",
  "categoria": "clasica | ghibli | videojuegos | anime | vocaloid | jpop | folk | latino | cine-tv | pop",
  "ruta": "clasica | ghibli | videojuegos | anime | folk-mundo",
  "dificultad": 1,
  "nivel": "nivel-N",
  "tecnicas": ["logro-…"],
  "requiere": ["logro-…"],
  "notas": "Opcional",
  "versiones": [
    {
      "youtubeId": "abc123",
      "tituloVideo": "Título tal cual en YouTube",
      "canal": "Canal",
      "duracionSeg": 180,
      "usos": ["partitura", "referencia"],
      "instrumentacion": "flauta y pista",
      "dificultadArreglo": 3,
      "nota": "Opcional"
    }
  ]
}
```

- **`id`**: estable y en kebab-case. **No lo cambies después**: la base de datos de progreso guarda ese id.
- **`dificultadArreglo`**: solo si el arreglo concreto es claramente más fácil o más difícil que la obra (por ejemplo, una versión «Easy»).

## Categoría → ruta

| Categoría | Ruta |
|---|---|
| clasica | clasica |
| ghibli | ghibli |
| videojuegos | videojuegos |
| anime, vocaloid, jpop (incluye a Ado) | anime |
| folk, latino, cine-tv, pop | folk-mundo |

## Dificultad (1–10)

| Dif. | Qué implica | Ejemplos de tu lista |
|---|---|---|
| 1–2 | Una octava en el registro grave o medio; negras y corcheas; tempo lento | Always With Me, Wellerman, La Llorona |
| 3 | Usa la segunda octava; puntillos; alteraciones sueltas | Enter Hallownest, One Summer's Day, Tetris |
| 4 | Dos octavas; semicorcheas a tempo moderado; síncopa | Merry-Go-Round, He's a Pirate, Lemon |
| 5 | Toca la tercera octava; pasajes rápidos; saltos amplios | Kiki, Lumière, Gira Gira |
| 6 | Tercera octava habitual; vibrato y expresión; J-pop rápido con modulaciones | Senbonzakura, Por una Cabeza, Liebesleid |
| 7 | Requiere doble picado o mucha velocidad | Cry Baby, Usseewa, Der Hölle Rache |
| 8 | Repertorio avanzado | Badinerie, Danse Macabre, Romberg |
| 9 | Virtuoso | Czardas, Verano de Vivaldi, Introducción y Rondó |
| 10 | Extremo | La Campanella, Capricho 24, Estudio op. 25 nº 2 |

> Se estima por la obra y el arreglo habitual. Si dudas entre dos valores, elige el mayor y anótalo en `notas`. El mismo tema puede variar mucho según el arreglo.

## Zona (`nivel`): dónde ya tienes lo que exige

La regla: **una canción va en la zona en la que ya tienes lo que exige**. Con la dificultad sale directa:

| Dificultad | Zona | `requiere` por defecto | `tecnicas` por defecto |
|---|---|---|---|
| 1–2 | nivel-2 (nivel-1 si es casi todo registro grave) | logro-registro-grave | logro-legato, logro-picado-simple |
| 3 | nivel-3 | logro-segunda-octava, logro-escala-sol-mayor, logro-ritmo-puntillo | logro-dos-octavas, logro-legato |
| 4 | nivel-4 | logro-dos-octavas, logro-escalas-3-alteraciones | logro-staccato, logro-sincopa |
| 5 | nivel-5 | logro-tercera-octava-sol, logro-escala-cromatica, logro-sincopa | logro-tercera-octava-sol, logro-dinamicas |
| 6 | nivel-6 | logro-tercera-octava-si, logro-vibrato | logro-vibrato, logro-tercera-octava-si |
| 7–9 | nivel-7 | logro-doble-picado, logro-tercera-octava-completa | logro-doble-picado, logro-tercera-octava-completa |
| 10 | nivel-8 | logro-doble-picado-rapido, logro-triple-picado | logro-doble-picado-rapido, logro-triple-picado |

- **Excepciones:** las canciones de jefe van en la zona de su jefe (por ejemplo, Badinerie, dificultad 8, va en nivel-6).
- **Técnicas especiales:** se añaden a `tecnicas` si la obra lo exige de forma notable: `logro-vibrato`, `logro-trinos`, `logro-armonicos`, `logro-respiracion-circular`, etc.

## Usos de una versión

| Uso | Cuándo |
|---|---|
| `partitura` | El video muestra la partitura o la descripción enlaza una (Piascore, MuseScore, Musicnotes…) |
| `referencia` | Interpretación para escuchar e imitar |
| `de-oido` | Cover sin partitura («flute cover by ear»): **reto de transcripción con la guitarra** |
| `acompanamiento` | Trae pista o karaoke para tocar encima |
| `tutorial` | Explica digitaciones o va nota a nota |
| `clip` | Fragmento corto (un Short) |

Una obra es **reto de oído** si ninguna versión tiene `partitura` y alguna tiene `de-oido`. Esto se calcula, no se escribe.
