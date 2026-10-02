import {
    useRef,
    useState,
    type ReactNode
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { ToastContext, type TipoToast } from "./ToastContextValue";

interface Toast {
    id: number;
    mensaje: string;
    tipo: TipoToast;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const siguienteId = useRef(0);

    const quitarToast = (id: number) => {
        setToasts((actuales) => actuales.filter((toast) => toast.id !== id));
    };

    const mostrarToast = (mensaje: string, tipo: TipoToast = "exito") => {
        const id = ++siguienteId.current;
        setToasts((actuales) => [...actuales, { id, mensaje, tipo }]);
        window.setTimeout(() => quitarToast(id), 4000);
    };

    return (
        <ToastContext.Provider value={{ mostrarToast }}>
            {children}
            <div className="toast-region" aria-label="Notificaciones" aria-live="polite">
                {toasts.map((toast) => {
                    const Icono = toast.tipo === "exito"
                        ? CheckCircle2
                        : toast.tipo === "error"
                            ? AlertCircle
                            : Info;

                    return (
                        <div
                            key={toast.id}
                            className={`toast toast-${toast.tipo}`}
                            role={toast.tipo === "error" ? "alert" : "status"}
                        >
                            <Icono size={20} aria-hidden="true" />
                            <span>{toast.mensaje}</span>
                            <button
                                type="button"
                                aria-label="Cerrar notificación"
                                onClick={() => quitarToast(toast.id)}
                            >
                                <X size={17} aria-hidden="true" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
