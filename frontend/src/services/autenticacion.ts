export interface UsuarioAutenticado {
    id: string;
    nombre: string;
    email: string;
    rol: string;
}

export interface SesionAutenticacion {
    access_token: string;
    refresh_token: string;
}

export type ResultadoInicioSesion =
    | { correcto: true; usuario: UsuarioAutenticado; session: SesionAutenticacion }
    | { correcto: false; mensaje: string };

export type ResultadoConsultaSesion =
    | { correcto: true; usuario: UsuarioAutenticado }
    | { correcto: false; mensaje: string };

// Aísla la solicitud de login para poder probarla con una respuesta simulada.
export async function solicitarInicioSesion(
    email: string,
    password: string,
    solicitar: typeof fetch = fetch
): Promise<ResultadoInicioSesion> {
    try {
        const respuesta = await solicitar("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (respuesta.status === 401) {
            return { correcto: false, mensaje: "Email o contraseña incorrectos." };
        }

        if (!respuesta.ok) {
            const datosError = await respuesta.json().catch(() => ({})) as { mensaje?: string };
            return { correcto: false, mensaje: datosError.mensaje || "Ocurrió un error en el servidor." };
        }

        const datos = await respuesta.json() as { usuario: UsuarioAutenticado; session: SesionAutenticacion };
        if (!datos.usuario || !datos.session?.access_token || !datos.session?.refresh_token) {
            return { correcto: false, mensaje: "El servidor devolvió una sesión incompleta." };
        }
        return { correcto: true, usuario: datos.usuario, session: datos.session };
    } catch {
        return { correcto: false, mensaje: "No se pudo conectar con el servidor." };
    }
}

export async function consultarSesion(
    accessToken: string,
    solicitar: typeof fetch = fetch
): Promise<ResultadoConsultaSesion> {
    try {
        const respuesta = await solicitar("/api/auth/session", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!respuesta.ok) {
            const datosError = await respuesta.json().catch(() => ({})) as { mensaje?: string };
            return { correcto: false, mensaje: datosError.mensaje || "No se pudo validar la sesión." };
        }
        const datos = await respuesta.json() as { usuario: UsuarioAutenticado };
        return datos.usuario
            ? { correcto: true, usuario: datos.usuario }
            : { correcto: false, mensaje: "El servidor no devolvió el perfil del usuario." };
    } catch {
        return { correcto: false, mensaje: "No se pudo conectar con el servidor." };
    }
}

export async function solicitarCierreSesion(
    accessToken: string,
    solicitar: typeof fetch = fetch
): Promise<void> {
    const respuesta = await solicitar("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!respuesta.ok) throw new Error("No se pudo revocar la sesión en el servidor.");
}
