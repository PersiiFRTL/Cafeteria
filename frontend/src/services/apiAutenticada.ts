import { supabase } from "./supabase";
import { urlApi } from "./urlApi";

let lecturaSesionEnCurso: Promise<string | null> | null = null;

export class ErrorApiAutenticada extends Error {
    readonly status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = "ErrorApiAutenticada";
    }
}

async function obtenerTokenSesion(): Promise<string | null> {
    if (!lecturaSesionEnCurso) {
        lecturaSesionEnCurso = supabase.auth.getSession()
            .then(({ data, error }) => error || !data.session ? null : data.session.access_token)
            .finally(() => {
                lecturaSesionEnCurso = null;
            });
    }
    return lecturaSesionEnCurso;
}

/** Envía operaciones al backend usando la sesión del usuario autenticado. */
export async function solicitarApiAutenticada<T>(
    ruta: string,
    opciones: RequestInit = {}
): Promise<T> {
    const accessToken = await obtenerTokenSesion();
    if (!accessToken) throw new Error("La sesión venció. Iniciá sesión nuevamente.");

    const headers = new Headers(opciones.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (opciones.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const respuesta = await fetch(urlApi(ruta), { ...opciones, headers });
    if (respuesta.status === 204) return undefined as T;

    const datos = await respuesta.json().catch(() => ({})) as { error?: { message?: string } };
    if (!respuesta.ok) {
        throw new ErrorApiAutenticada(datos.error?.message || "No se pudo completar la operación en el servidor.", respuesta.status);
    }
    return datos as T;
}
