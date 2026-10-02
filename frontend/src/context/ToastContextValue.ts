import { createContext } from "react";

export type TipoToast = "exito" | "error" | "info";

export interface ToastContextType {
    mostrarToast: (mensaje: string, tipo?: TipoToast) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);
