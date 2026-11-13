import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef
} from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import type { RolEmpleado } from "../config/permisos";
import { supabase } from "../services/supabase";
import { consultarSesion, solicitarCierreSesion, solicitarInicioSesion } from "../services/autenticacion";

interface UsuarioAutenticado {
    id: string;
    nombre: string;
    email: string;
    rol: RolEmpleado;
}


interface AuthContextType {

    usuario: UsuarioAutenticado | null;

    iniciarSesion: (
        email: string,
        password: string
    ) => Promise<{
        correcto: boolean;
        mensaje?: string;
    }>;

    cerrarSesion: () => Promise<void>;

    estaAutenticado: boolean;
    estadoSesion: "cargando" | "lista";
    errorSesion: string | null;
}


const AuthContext =
    createContext<AuthContextType | undefined>(
        undefined
    );


interface AuthProviderProps {
    children: ReactNode;
}

async function consultarPerfil(session: Session): Promise<{
    usuario?: UsuarioAutenticado;
    mensajeError?: string;
    transitorio?: boolean;
}> {
    const resultado = await consultarSesion(session.access_token);
    if (!resultado.correcto) {
        return { mensajeError: resultado.mensaje, transitorio: resultado.transitorio };
    }
    return { usuario: { ...resultado.usuario, rol: resultado.usuario.rol as RolEmpleado } };
}


export function AuthProvider({
    children
}: AuthProviderProps) {

    const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
    const [estadoSesion, setEstadoSesion] = useState<"cargando" | "lista">("cargando");
    const [errorSesion, setErrorSesion] = useState<string | null>(null);
    const usuarioActualRef = useRef<UsuarioAutenticado | null>(null);
    const validacionRef = useRef(0);
    const reintentoRef = useRef<number | null>(null);

    const sincronizarPerfil = useCallback(async (session: Session | null) => {
        const validacionActual = ++validacionRef.current;
        if (reintentoRef.current !== null) {
            window.clearTimeout(reintentoRef.current);
            reintentoRef.current = null;
        }

        if (!session) {
            usuarioActualRef.current = null;
            setUsuario(null);
            setErrorSesion(null);
            setEstadoSesion("lista");
            return;
        }

        const resultado = await consultarPerfil(session);
        if (validacionActual !== validacionRef.current) return;
        if (!resultado.usuario) {
            setErrorSesion(resultado.mensajeError ?? "No se pudo cargar el perfil.");
            if (resultado.transitorio) {
                // Un fallo de red/servidor no invalida la sesión local.
                setEstadoSesion(usuarioActualRef.current ? "lista" : "cargando");
                reintentoRef.current = window.setTimeout(() => {
                    void sincronizarPerfil(session);
                }, 3000);
                return;
            }

            usuarioActualRef.current = null;
            setUsuario(null);
            setEstadoSesion("lista");
            await supabase.auth.signOut({ scope: "local" });
            return;
        }

        usuarioActualRef.current = resultado.usuario;
        setUsuario(resultado.usuario);
        setErrorSesion(null);
        setEstadoSesion("lista");
    }, []);

    useEffect(() => {
        let activo = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Diferir la consulta evita ejecutar otra operación de Auth dentro de su callback.
            const validacionProgramada = ++validacionRef.current;
            if (reintentoRef.current !== null) {
                window.clearTimeout(reintentoRef.current);
                reintentoRef.current = null;
            }
            window.setTimeout(() => {
                if (activo && validacionProgramada === validacionRef.current) {
                    void sincronizarPerfil(session);
                }
            }, 0);
        });

        return () => {
            activo = false;
            validacionRef.current += 1;
            if (reintentoRef.current !== null) window.clearTimeout(reintentoRef.current);
            subscription.unsubscribe();
        };
    }, [sincronizarPerfil]);


    const iniciarSesion = async (
    email: string,
    password: string
    ): Promise<{
        correcto: boolean;
        mensaje?: string;
    }> => {

        setErrorSesion(null);
        const resultado = await solicitarInicioSesion(email.trim(), password);
        if (!resultado.correcto) return resultado;

        const { error } = await supabase.auth.setSession(resultado.session);
        if (error) {
            await solicitarCierreSesion(resultado.session.access_token).catch(() => undefined);
            return { correcto: false, mensaje: "No se pudo guardar la sesión en este dispositivo." };
        }

        const usuarioAutenticado = { ...resultado.usuario, rol: resultado.usuario.rol as RolEmpleado };
        usuarioActualRef.current = usuarioAutenticado;
        setUsuario(usuarioAutenticado);
        setErrorSesion(null);
        setEstadoSesion("lista");
        return { correcto: true };
    };


    const cerrarSesion = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        try {
            if (session) await solicitarCierreSesion(session.access_token);
        } catch {
            // El SDK intenta revocar la sesión actual directamente si el backend no respondió.
        }
        try {
            await supabase.auth.signOut({ scope: "local" });
        } finally {
            usuarioActualRef.current = null;
            setUsuario(null);
        }
    };


    const estaAutenticado =
        usuario !== null;


    return (

        <AuthContext.Provider
            value={{
                usuario,
                iniciarSesion,
                cerrarSesion,
                estaAutenticado,
                estadoSesion,
                errorSesion
            }}
        >

            {children}

        </AuthContext.Provider>

    );
}


// El provider y su hook se mantienen juntos porque comparten el contexto privado.
// oxlint-disable-next-line react/only-export-components
export function useAuth() {

    const context =
        useContext(AuthContext);


    if (!context) {

        throw new Error(
            "useAuth debe utilizarse dentro de AuthProvider"
        );

    }


    return context;
}
