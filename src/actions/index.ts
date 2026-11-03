/**
 * @file Astro Actions: las funciones del servidor que escriben el progreso.
 *
 * Una isla las llama como funciones normales (`await actions.marcarDia({ dia: 3 })`)
 * y Astro hace por debajo la petición POST a `/_actions/marcarDia`. Cada acción:
 *
 * 1. Valida la entrada con Zod ANTES de tocar la base de datos (aunque el formulario
 *    ya valide: lo que llega del navegador se puede manipular).
 * 2. Exige sesión: usa `context.locals.supabase`, que el middleware creó con la cookie
 *    de quien llama, así que RLS solo le deja tocar sus propias filas.
 * 3. Devuelve datos planos que la isla usa para repintarse sin recargar la página.
 *
 * Errores: se lanzan como `ActionError` con un código (`UNAUTHORIZED`, `NOT_FOUND`…);
 * la isla los recibe en `error` sin que nada explote.
 */
import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { getCollection, getEntry } from "astro:content";
import { z } from "astro/zod";
import { idDeDia } from "@/lib/calendario";
import { ESTADOS_CANCION, type EstadoCancion } from "@/lib/estado-cancion";
import type { RegistroDia, Victoria } from "@/lib/progreso-usuario";
import type { ClienteSupabase } from "@/lib/supabase";

/**
 * Devuelve el usuario con sesión o lanza `UNAUTHORIZED`.
 *
 * @param context Contexto de la acción (trae `locals` del middleware).
 * @returns El cliente de Supabase de la petición.
 */
function exigirSesion(context: ActionAPIContext) {
  if (!context.locals.usuario) {
    throw new ActionError({ code: "UNAUTHORIZED", message: "Entra para guardar tu progreso." });
  }
  return context.locals.supabase;
}

/**
 * Comprueba que el día exista y sea de práctica (los descansos no se marcan).
 *
 * @param numero Número del día (1 a 90).
 * @returns Su id (`dia-07`).
 */
async function diaDePractica(numero: number): Promise<string> {
  const id = idDeDia(numero);
  const dia = await getEntry("dias", id);
  if (!dia) throw new ActionError({ code: "NOT_FOUND", message: `No existe el día ${numero}.` });
  if (dia.data.tipo === "descanso") {
    throw new ActionError({ code: "BAD_REQUEST", message: "Los días de descanso no se marcan: se descansan." });
  }
  return id;
}

/** Convierte un error de Supabase en un `ActionError` con un mensaje para la persona. */
function errorDeGuardado(mensaje: string): never {
  console.error("[actions] Supabase:", mensaje);
  throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo guardar. Inténtalo de nuevo en un momento." });
}

/** Id de un logro, con el mismo formato que exige la tabla (`logro-…`). */
const idLogro = z.string().regex(/^logro-[a-z0-9-]+$/);

/**
 * Ids de los logros que tiene quien llama (RLS filtra por usuario).
 *
 * @param supabase Cliente de la petición.
 */
async function logrosObtenidos(supabase: ClienteSupabase): Promise<Set<string>> {
  const { data, error } = await supabase.from("logros_obtenidos").select("logro_id");
  if (error) errorDeGuardado(error.message);
  return new Set(data.map((l) => l.logro_id));
}

/**
 * Nombres de varios logros, para los mensajes: «Clave de sol», «Pulso».
 *
 * @param ids Ids de los logros.
 */
async function nombresDeLogros(ids: string[]): Promise<string> {
  const entradas = await Promise.all(ids.map((id) => getEntry("logros", id)));
  return entradas.map((e, i) => `«${e?.data.nombre ?? ids[i]}»`).join(", ");
}

export const server = {
  /**
   * Marca un día del plan como hecho (o actualiza sus minutos y notas si ya lo estaba).
   * Es un *upsert*: la clave `(user_id, dia_id)` de la tabla hace que repetirlo no duplique.
   *
   * @returns El registro guardado.
   */
  marcarDia: defineAction({
    input: z.object({
      dia: z.number().int().min(1).max(90),
      minutos: z.number().int().min(1).max(300).optional(),
      // Una nota vacía se guarda como `null`, no como "".
      notas: z.string().trim().max(2000).optional().transform((t) => t || undefined),
    }),
    handler: async ({ dia, minutos, notas }, context): Promise<RegistroDia> => {
      const supabase = exigirSesion(context);
      const diaId = await diaDePractica(dia);
      const { data, error } = await supabase
        .from("dias_completados")
        .upsert({ dia_id: diaId, minutos: minutos ?? null, notas: notas ?? null }, { onConflict: "user_id,dia_id" })
        .select("completado_en, minutos, notas")
        .single();
      if (error) errorDeGuardado(error.message);
      return data;
    },
  }),

  /**
   * Quita la marca de un día (por si fue un error). Si no estaba marcado, no pasa nada.
   *
   * @returns `null`: el día ya no tiene registro.
   */
  desmarcarDia: defineAction({
    input: z.object({ dia: z.number().int().min(1).max(90) }),
    handler: async ({ dia }, context): Promise<null> => {
      const supabase = exigirSesion(context);
      const { error } = await supabase.from("dias_completados").delete().eq("dia_id", idDeDia(dia));
      if (error) errorDeGuardado(error.message);
      return null;
    },
  }),

  /**
   * Consigue un logro. El servidor comprueba que tengas todo lo que `requiere`:
   * la isla ya no deja pulsar un talento bloqueado, pero quien manda es el servidor.
   *
   * @returns `null` (la isla ya sabe qué logro consiguió).
   */
  conseguirLogro: defineAction({
    input: z.object({ logro: idLogro }),
    handler: async ({ logro }, context): Promise<null> => {
      const supabase = exigirSesion(context);
      const entrada = await getEntry("logros", logro);
      if (!entrada) throw new ActionError({ code: "NOT_FOUND", message: "Ese talento no existe." });

      const obtenidos = await logrosObtenidos(supabase);
      const faltan = entrada.data.requiere.filter((r) => !obtenidos.has(r.id));
      if (faltan.length > 0) {
        const nombres = await nombresDeLogros(faltan.map((r) => r.id));
        throw new ActionError({ code: "BAD_REQUEST", message: `Aún te falta: ${nombres}.` });
      }

      // `ignoreDuplicates`: si ya lo tenías, no se toca la fecha en que lo conseguiste.
      const { error } = await supabase.from("logros_obtenidos").upsert({ logro_id: logro }, { onConflict: "user_id,logro_id", ignoreDuplicates: true });
      if (error) errorDeGuardado(error.message);
      return null;
    },
  }),

  /**
   * Quita un logro (por si fue un error). No deja quitarlo si otro logro que tienes
   * lo requiere: el árbol quedaría con un talento conseguido sin su requisito.
   *
   * @returns `null`.
   */
  quitarLogro: defineAction({
    input: z.object({ logro: idLogro }),
    handler: async ({ logro }, context): Promise<null> => {
      const supabase = exigirSesion(context);
      const obtenidos = await logrosObtenidos(supabase);
      const todos = await getCollection("logros");
      const dependen = todos.filter((l) => obtenidos.has(l.id) && l.data.requiere.some((r) => r.id === logro));
      if (dependen.length > 0) {
        const nombres = dependen.map((l) => `«${l.data.nombre}»`).join(", ");
        throw new ActionError({ code: "BAD_REQUEST", message: `Primero quita lo que depende de él: ${nombres}.` });
      }

      const { error } = await supabase.from("logros_obtenidos").delete().eq("logro_id", logro);
      if (error) errorDeGuardado(error.message);
      return null;
    },
  }),

  /**
   * Registra la victoria contra un jefe. Grabar es parte de la victoria, así que el
   * enlace al video es obligatorio (y `https`, como exige la tabla). Solo cuenta si
   * la puerta está abierta: tienes todas sus llaves. Si ya estaba vencido, actualiza
   * el video y el tempo (por si quieres poner una grabación mejor).
   *
   * @returns La victoria guardada.
   */
  registrarVictoria: defineAction({
    input: z.object({
      jefe: z.string().regex(/^jefe-[a-z0-9-]+$/),
      video: z.url({ protocol: /^https$/, error: "Pega el enlace a tu video (empieza por https://)." }).max(500),
      tempo: z.number().int().min(20).max(300).optional(),
    }),
    handler: async ({ jefe, video, tempo }, context): Promise<Victoria> => {
      const supabase = exigirSesion(context);
      const entrada = await getEntry("jefes", jefe);
      if (!entrada) throw new ActionError({ code: "NOT_FOUND", message: "Ese jefe no existe." });

      const obtenidos = await logrosObtenidos(supabase);
      const faltan = entrada.data.requiere.filter((r) => !obtenidos.has(r.id));
      if (faltan.length > 0) {
        const nombres = await nombresDeLogros(faltan.map((r) => r.id));
        throw new ActionError({ code: "BAD_REQUEST", message: `La puerta sigue cerrada: te falta ${nombres}.` });
      }

      const { data, error } = await supabase
        .from("victorias_jefe")
        .upsert({ jefe_id: jefe, video_url: video, tempo_logrado: tempo ?? null }, { onConflict: "user_id,jefe_id" })
        .select("video_url, tempo_logrado, vencido_en")
        .single();
      if (error) errorDeGuardado(error.message);
      return data;
    },
  }),

  /**
   * Anula una victoria (por si fue un error). El jefe vuelve a estar en pie.
   *
   * @returns `null`.
   */
  anularVictoria: defineAction({
    input: z.object({ jefe: z.string().regex(/^jefe-[a-z0-9-]+$/) }),
    handler: async ({ jefe }, context): Promise<null> => {
      const supabase = exigirSesion(context);
      const { error } = await supabase.from("victorias_jefe").delete().eq("jefe_id", jefe);
      if (error) errorDeGuardado(error.message);
      return null;
    },
  }),

  /**
   * Cambia dónde vas con una canción. «pendiente» es el valor por defecto, así que
   * en vez de guardarlo se borra la fila (lo que no aporta no se guarda).
   * No exige tener sus requisitos: puedes empezar a aprenderla antes (tu maestro manda).
   *
   * @returns El estado guardado.
   */
  cambiarEstadoCancion: defineAction({
    input: z.object({
      cancion: z.string().regex(/^[a-z0-9-]+$/),
      estado: z.enum(ESTADOS_CANCION),
    }),
    handler: async ({ cancion, estado }, context): Promise<EstadoCancion> => {
      const supabase = exigirSesion(context);
      if (!(await getEntry("canciones", cancion))) throw new ActionError({ code: "NOT_FOUND", message: "Esa canción no existe." });

      const { error } =
        estado === "pendiente"
          ? await supabase.from("estado_canciones").delete().eq("cancion_id", cancion)
          : await supabase
              .from("estado_canciones")
              // `actualizado_en` solo tiene valor por defecto al crear la fila: al cambiarla, se pone a mano.
              .upsert({ cancion_id: cancion, estado, actualizado_en: new Date().toISOString() }, { onConflict: "user_id,cancion_id" });
      if (error) errorDeGuardado(error.message);
      return estado;
    },
  }),
};
