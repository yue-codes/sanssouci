/**
 * @file Tipos globales del proyecto.
 *
 * `App.Locals` es lo que el middleware deja en `Astro.locals` para cada petición.
 * Solo existe en páginas de servidor (`prerender = false`) y endpoints: en las
 * páginas prerenderizadas no hay petición real, así que no hay sesión.
 */
declare namespace App {
  interface Locals {
    /** Cliente de Supabase de esta petición (con la sesión de quien visita). */
    supabase: import("@/lib/supabase").ClienteSupabase;
    /** Quien ha iniciado sesión, o `null`. */
    usuario: import("@/lib/supabase").Usuario | null;
  }
}
