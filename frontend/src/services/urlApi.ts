const baseApi = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

/** Conserva las rutas relativas en desarrollo y permite apuntar a Express en producción. */
export function urlApi(ruta: string): string {
    const rutaNormalizada = ruta.startsWith("/") ? ruta : `/${ruta}`;
    return `${baseApi}${rutaNormalizada}`;
}
