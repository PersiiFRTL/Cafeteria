import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback
} from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import type { RolEmpleado } from "../config/permisos";
import { supabase } from "../services/supabase";

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

const rolesValidos: RolEmpleado[] = ["ADMINISTRADOR", "EMPLEADO", "COCINA"];

async function consultarPerfil(session: Session): Promise<{
    usuario?: UsuarioAutenticado;
    mensajeError?: string;
}> {
    const { data: perfil, error } = await supabase
        .from("perfiles")
        .select("id, nombre, email, rol, activo")
        .eq("id", session.user.id)
        .maybeSingle();

    if (error || !perfil) {
        return { mensajeError: "No se encontró el perfil de este usuario en la cafetería." };
    }

    if (!perfil.activo || !rolesValidos.includes(perfil.rol as RolEmpleado)) {
        return { mensajeError: "Tu cuenta está desactivada o no tiene un rol válido." };
    }

    return {
        usuario: {
            id: perfil.id,
            nombre: perfil.nombre,
            email: perfil.email ?? session.user.email ?? "",
            rol: perfil.rol as RolEmpleado
        }
    };
}


export function AuthProvider({
    children
}: AuthProviderProps) {

    const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
    const [estadoSesion, setEstadoSesion] = useState<"cargando" | "lista">("cargando");
    const [errorSesion, setErrorSesion] = useState<string | null>(null);

    const sincronizarPerfil = useCallback(async (session: Session | null) => {
        if (!session) {
            setUsuario(null);
            setErrorSesion(null);
            setEstadoSesion("lista");
            return;
        }

        const resultado = await consultarPerfil(session);
        if (!resultado.usuario) {
            setUsuario(null);
            setErrorSesion(resultado.mensajeError ?? "No se pudo cargar el perfil.");
            setEstadoSesion("lista");
            await supabase.auth.signOut();
            return;
        }

        setUsuario(resultado.usuario);
        setErrorSesion(null);
        setEstadoSesion("lista");
    }, []);

    useEffect(() => {
        let activo = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Diferir la consulta evita ejecutar otra operación de Auth dentro de su callback.
            window.setTimeout(() => {
                if (activo) void sincronizarPerfil(session);
            }, 0);
        });

        return () => {
            activo = false;
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
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
        });

        if (error || !data.session) {
            return {
                correcto: false,
                mensaje: error?.status === 400
                    ? "Email o contraseña incorrectos."
                    : "No se pudo iniciar sesión con Supabase."
            };
        }

        const resultadoPerfil = await consultarPerfil(data.session);
        if (!resultadoPerfil.usuario) {
            await supabase.auth.signOut();
            return {
                correcto: false,
                mensaje: resultadoPerfil.mensajeError ?? "No se pudo cargar el perfil."
            };
        }

        setUsuario(resultadoPerfil.usuario);
        setErrorSesion(null);
        setEstadoSesion("lista");
        return { correcto: true };
    };


    const cerrarSesion = async () => {
        await supabase.auth.signOut();
        setUsuario(null);
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
