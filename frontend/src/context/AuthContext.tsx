import {
    createContext,
    useContext,
    useState
} from "react";
import type { ReactNode } from "react";

import type { RolEmpleado } from "../config/permisos";

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

    const [
        usuario,
        setUsuario
    ] = useState<UsuarioAutenticado | null>(() =>
        leerUsuarioGuardado()
    );


    const iniciarSesion = async (
    email: string,
    password: string
    ): Promise<{
        correcto: boolean;
        mensaje?: string;
    }> => {

        try {

            const respuesta = await fetch(
                "http://localhost:3000/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const datos = await respuesta.json();

            if (respuesta.status === 401) {

                return {
                    correcto: false,
                    mensaje: "Email o contraseña incorrectos."
                };
            }

            if (!respuesta.ok) {

                return {
                    correcto: false,
                    mensaje: "Ocurrió un error en el servidor."
                };
            }

            const usuarioAutenticado: UsuarioAutenticado =
                datos.usuario;

            setUsuario(usuarioAutenticado);

            guardarUsuario(usuarioAutenticado);

            return {
                correcto: true
            };

        } catch (error) {

            console.error(
                "Error al conectar con el backend:",
                error
            );

            return {
                correcto: false,
                mensaje:
                    "No se pudo conectar con el servidor."
            };
        }
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
                estaAutenticado
            }}
        >

            {children}

        </AuthContext.Provider>

    );
}


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