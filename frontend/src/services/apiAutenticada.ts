import { supabase } from "./supabase";

/** Envía operaciones al backend usando la sesión del usuario autenticado. */
export async function solicitarApiAutenticada<T>(
    ruta: string,
    opciones: RequestInit = {}
): Promise<T> {
    const { data: { session }, error: errorSesion } = await supabase.auth.getSession();
    if (errorSesion || !session) throw new Error("La sesión venció. Iniciá sesión nuevamente.");

    const headers = new Headers(opciones.headers);
    headers.set("Authorization", `Bearer ${session.access_token}`);
    if (opciones.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const respuesta = await fetch(ruta, { ...opciones, headers });
    if (respuesta.status === 204) return undefined as T;

    const datos = await respuesta.json().catch(() => ({})) as { mensaje?: string };
    if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo completar la operación en el servidor.");
    }
    return datos as T;
}
