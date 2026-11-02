/**
 * @file Catálogo de imágenes del sitio y a qué zona, jefe o ruta acompaña cada una.
 *
 * Las imágenes viven en `src/assets/imagenes/` (no en `public/`) para que Astro
 * las procese al compilar: genera AVIF/WebP en varios tamaños, añade `width` y
 * `height` (la página no «salta» al cargar) y un nombre con hash (caché larga).
 * Se pintan con `<Picture>` o `<Image>` de `astro:assets`.
 *
 * Aquí se importan una sola vez y se les da su texto alternativo, para no repetir
 * el `alt` en cada página. Para cambiar la imagen de una zona, cambia este archivo.
 *
 * Nota: casi todas son ilustraciones y fotos ajenas (de Pinterest). Sirven mientras
 * la web es personal; antes de compartirla, conviene cambiarlas por imágenes con
 * licencia o por fotogramas de tus propios videos.
 */
import type { ImageMetadata } from "astro";
import animeAula from "@/assets/imagenes/anime-aula.jpg";
import animeAzul from "@/assets/imagenes/anime-azul.jpg";
import animeBlanca from "@/assets/imagenes/anime-blanca.jpg";
import animeCian from "@/assets/imagenes/anime-cian.webp";
import animeDorada from "@/assets/imagenes/anime-dorada.webp";
import animeLago from "@/assets/imagenes/anime-lago.jpg";
import animeNubes from "@/assets/imagenes/anime-nubes.jpg";
import animeTurquesa from "@/assets/imagenes/anime-turquesa.jpg";
import bosqueAtardecer from "@/assets/imagenes/bosque-atardecer.jpg";
import cuartoAcogedor from "@/assets/imagenes/cuarto-acogedor.jpg";
import cuartoGhibli from "@/assets/imagenes/cuarto-ghibli.jpg";
import diziLago from "@/assets/imagenes/dizi-lago.jpg";
import flautaCerezos from "@/assets/imagenes/flauta-cerezos.jpg";
import manosFlauta from "@/assets/imagenes/manos-flauta.jpg";
import partituraPrisma from "@/assets/imagenes/partitura-prisma.jpg";
import siluetaAtardecer from "@/assets/imagenes/silueta-atardecer.jpg";
import siluetaVentana from "@/assets/imagenes/silueta-ventana.jpg";
import sombraPuerta from "@/assets/imagenes/sombra-puerta.jpg";

/** Una imagen del sitio con lo necesario para pintarla bien. */
export interface ImagenSitio {
  /** La imagen importada (Astro conoce su tamaño y formato). */
  src: ImageMetadata;
  /** Texto alternativo: qué se ve. Vacío solo si es puramente decorativa. */
  alt: string;
  /** Punto de la imagen que debe quedar a la vista al recortarla (`object-position`). */
  enfoque?: string;
}

/** Todas las imágenes en uso, por nombre. */
export const IMAGENES = {
  animeDorada: { src: animeDorada, alt: "Ilustración: una chica de pelo claro abraza una bolsa de pan entre flores amarillas, con luz dorada de tarde.", enfoque: "55% 35%" },
  animeCian: { src: animeCian, alt: "Ilustración en cian y rosa: una chica con lentes redondos se sujeta el sombrero.", enfoque: "50% 30%" },
  animeAula: { src: animeAula, alt: "Ilustración: una estudiante toca la flauta traversa junto a la ventana de un aula.", enfoque: "50% 30%" },
  animeAzul: { src: animeAzul, alt: "Ilustración en tonos azules: una chica toca la flauta traversa.", enfoque: "50% 40%" },
  animeBlanca: { src: animeBlanca, alt: "Ilustración: una chica de pelo blanco con vestido azul sostiene una flauta traversa.", enfoque: "50% 25%" },
  animeLago: { src: animeLago, alt: "Ilustración: una chica arrodillada toca la flauta sobre el agua, rodeada de luces.", enfoque: "50% 30%" },
  animeNubes: { src: animeNubes, alt: "Ilustración: el perfil de una chica que mira al cielo, con nubes y montañas dentro de su silueta.", enfoque: "50% 35%" },
  animeTurquesa: { src: animeTurquesa, alt: "Ilustración en turquesa: una figura entre trazos de agua y luz.", enfoque: "50% 40%" },
  bosqueAtardecer: { src: bosqueAtardecer, alt: "Foto: una mujer toca la flauta sentada en la hierba de un bosque al atardecer.", enfoque: "60% 60%" },
  cuartoAcogedor: { src: cuartoAcogedor, alt: "Foto: una persona toca la flauta en un cuarto con atril y luz de lámpara.", enfoque: "40% 50%" },
  cuartoGhibli: { src: cuartoGhibli, alt: "Ilustración: alguien estudia en un escritorio frente a una ventana llena de árboles.", enfoque: "50% 55%" },
  diziLago: { src: diziLago, alt: "Foto: una chica toca un dizi, la flauta china de bambú, junto a un lago.", enfoque: "50% 30%" },
  flautaCerezos: { src: flautaCerezos, alt: "Foto: el cuerpo plateado de una flauta traversa entre flores de cerezo.", enfoque: "50% 50%" },
  manosFlauta: { src: manosFlauta, alt: "Foto: manos sobre las llaves de una flauta traversa.", enfoque: "50% 50%" },
  partituraPrisma: { src: partituraPrisma, alt: "Foto: una partitura con un prisma de cristal que proyecta un arcoíris.", enfoque: "40% 60%" },
  siluetaAtardecer: { src: siluetaAtardecer, alt: "Foto: la silueta de alguien que toca la flauta frente al atardecer.", enfoque: "50% 70%" },
  siluetaVentana: { src: siluetaVentana, alt: "Foto: una silueta toca la flauta frente a una ventana al anochecer.", enfoque: "50% 60%" },
  sombraPuerta: { src: sombraPuerta, alt: "Foto: la sombra de una persona que toca la flauta, proyectada en una puerta por la luz de la tarde.", enfoque: "45% 50%" },
} as const satisfies Record<string, ImagenSitio>;

/** Imagen de cada zona del mapa, por id de nivel. */
export const IMAGEN_ZONA: Record<string, ImagenSitio> = {
  "nivel-0": IMAGENES.cuartoGhibli, // antes de la flauta: leer y estudiar en el escritorio
  "nivel-1": IMAGENES.siluetaVentana, // el primer aliento
  "nivel-2": IMAGENES.animeAula, // las primeras canciones
  "nivel-3": IMAGENES.bosqueAtardecer, // el bosque de las escalas
  "nivel-4": IMAGENES.cuartoAcogedor, // la ciudad del ritmo
  "nivel-5": IMAGENES.animeBlanca, // la torre del canto
  "nivel-6": IMAGENES.flautaCerezos, // la lengua: el mecanismo de cerca
  "nivel-7": IMAGENES.animeLago, // el virtuoso
  "nivel-8": IMAGENES.animeNubes, // la cumbre
};

/** Imagen de los jefes que tienen una propia; el resto usa `IMAGEN_JEFE_POR_DEFECTO`. */
const IMAGEN_JEFE: Record<string, ImagenSitio> = {
  "jefe-1": IMAGENES.siluetaAtardecer,
  "jefe-2": IMAGENES.animeAzul,
};

/** Un jefe es una puerta en el sendero: la sombra en la puerta es su imagen por defecto. */
export const IMAGEN_JEFE_POR_DEFECTO = IMAGENES.sombraPuerta;

/**
 * Imagen de un jefe.
 * @param jefeId Id del jefe, p. ej. "jefe-0".
 */
export function imagenDeJefe(jefeId: string): ImagenSitio {
  return IMAGEN_JEFE[jefeId] ?? IMAGEN_JEFE_POR_DEFECTO;
}

/** Imagen de cada ruta del repertorio, por id de ruta. */
export const IMAGEN_RUTA: Record<string, ImagenSitio> = {
  clasica: IMAGENES.partituraPrisma,
  ghibli: IMAGENES.cuartoGhibli,
  videojuegos: IMAGENES.animeTurquesa,
  anime: IMAGENES.animeAzul, // la cian ya es la portada
  "folk-mundo": IMAGENES.diziLago,
};
