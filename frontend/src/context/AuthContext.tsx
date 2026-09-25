import {
    createContext,
    useContext,
    useState
} from "react";
import type { ReactNode } from "react";

import { useCafeteria } from "./CafeteriaContext";

import type {
    RolEmpleado
} from "../config/permisos";

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
    ) => boolean;

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

    const {
        empleados
    } = useCafeteria();


    const [
        usuario,
        setUsuario
    ] = useState<UsuarioAutenticado | null>(() =>
        leerUsuarioGuardado()
    );


    const iniciarSesion = (
        email: string,
        password: string
    ): boolean => {

        const emailNormalizado =
            email.trim().toLowerCase();


        const empleado =
            empleados.find(
                (empleado) =>
                    empleado.email
                        .trim()
                        .toLowerCase() ===
                        emailNormalizado &&
                    empleado.password ===
                        password &&
                    empleado.activo
            );


        if (!empleado) {
            return false;
        }


        const usuarioAutenticado: UsuarioAutenticado = {
            id: empleado.id,
            nombre: empleado.nombre,
            email: empleado.email,
            rol: empleado.rol
        };

        setUsuario(usuarioAutenticado);
        guardarUsuario(usuarioAutenticado);

        return true;
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