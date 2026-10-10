export interface UsuarioAutenticado {
    id: number;
    nombre: string;
    email: string;
    rol: string;
}

export type ResultadoInicioSesion =
    | { correcto: true; usuario: UsuarioAutenticado }
    | { correcto: false; mensaje: string };

// Aísla la solicitud de login para poder probarla con una respuesta simulada.
export async function solicitarInicioSesion(
    email: string,
    password: string,
    solicitar: typeof fetch = fetch
): Promise<ResultadoInicioSesion> {
    try {
        const respuesta = await solicitar("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (respuesta.status === 401) {
            return { correcto: false, mensaje: "Email o contraseña incorrectos." };
        }

        if (!respuesta.ok) {
            return { correcto: false, mensaje: "Ocurrió un error en el servidor." };
        }

        const datos = await respuesta.json() as { usuario: UsuarioAutenticado };
        return { correcto: true, usuario: datos.usuario };
    } catch {
        return { correcto: false, mensaje: "No se pudo conectar con el servidor." };
    }
}
