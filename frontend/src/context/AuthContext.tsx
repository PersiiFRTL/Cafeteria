import {
    createContext,
    useContext,
    useState,
    useEffect
} from "react";
import type { ReactNode } from "react";

import type { RolEmpleado } from "../config/permisos";
import { solicitarInicioSesion } from "../services/autenticacion";

const STORAGE_KEY = "cafeteria_usuario";

const leerUsuarioGuardado = (): UsuarioAutenticado | null => {
    try {
        const usuarioGuardado = localStorage.getItem(STORAGE_KEY);

        if (!usuarioGuardado) {
            return null;
        }

        return JSON.parse(usuarioGuardado) as UsuarioAutenticado;
    } catch {
        return null;
    }
};

const guardarUsuario = (usuario: UsuarioAutenticado | null) => {
    if (!usuario) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
};


interface UsuarioAutenticado {
    id: number;
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

    cerrarSesion: () => void;

    estaAutenticado: boolean;
    estadoSesion: "cargando" | "lista";
}


const AuthContext =
    createContext<AuthContextType | undefined>(
        undefined
    );


interface AuthProviderProps {
    children: ReactNode;
}


export function AuthProvider({
    children
}: AuthProviderProps) {

    const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
    const [estadoSesion, setEstadoSesion] = useState<"cargando" | "lista">("cargando");

    useEffect(() => {
        const temporizador = window.setTimeout(() => {
            setUsuario(leerUsuarioGuardado());
            setEstadoSesion("lista");
        }, 0);

        return () => window.clearTimeout(temporizador);
    }, []);


    const iniciarSesion = async (
    email: string,
    password: string
    ): Promise<{
        correcto: boolean;
        mensaje?: string;
    }> => {

        const resultado = await solicitarInicioSesion(email, password);
        if (!resultado.correcto) return resultado;

        const usuarioAutenticado: UsuarioAutenticado = {
            ...resultado.usuario,
            rol: resultado.usuario.rol as RolEmpleado
        };
        setUsuario(usuarioAutenticado);
        guardarUsuario(usuarioAutenticado);
        return { correcto: true };
    };


    const cerrarSesion = () => {

        setUsuario(null);
        guardarUsuario(null);

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
                estadoSesion
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
