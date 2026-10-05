import { useRef } from "react";

interface ModalConfirmacionProps {
    titulo: string;
    mensaje: string;
    confirmar: () => void;
    cerrar: () => void;
    cancelar?: () => void;
    textoConfirmar?: string;
    textoCancelar?: string;
    destructivo?: boolean;
}

function ModalConfirmacion({
    titulo,
    mensaje,
    confirmar,
    cerrar,
    cancelar,
    textoConfirmar = "Aceptar",
    textoCancelar = "Cancelar",
    destructivo = false
}: ModalConfirmacionProps) {
    const dialogRef = useRef<HTMLElement>(null);

    return (
        <div className="sistema-modal-overlay">
            <section
                className="sistema-modal"
                role="alertdialog"
                ref={dialogRef}
                aria-modal="true"
                aria-labelledby="sistema-modal-titulo"
                aria-describedby="sistema-modal-mensaje"
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        if (cancelar) {
                            cancelar();
                        } else {
                            cerrar();
                        }
                    }
                    if (event.key === "Tab") {
                        const controles = dialogRef.current?.querySelectorAll<HTMLElement>(
                            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                        );
                        if (!controles?.length) return;
                        const primero = controles[0];
                        const ultimo = controles[controles.length - 1];
                        if (event.shiftKey && document.activeElement === primero) {
                            event.preventDefault();
                            ultimo.focus();
                        } else if (!event.shiftKey && document.activeElement === ultimo) {
                            event.preventDefault();
                            primero.focus();
                        }
                    }
                }}
            >
                <h2 id="sistema-modal-titulo">{titulo}</h2>
                <p id="sistema-modal-mensaje">{mensaje}</p>
                <div className="sistema-modal-acciones">
                    {cancelar && (
                        <button
                            type="button"
                            className="secondary-button"
                            autoFocus
                            onClick={cancelar}
                        >
                            {textoCancelar}
                        </button>
                    )}
                    <button
                        type="button"
                        autoFocus={!cancelar}
                        className={destructivo ? "sistema-modal-destructivo" : "primary-button"}
                        onClick={confirmar}
                    >
                        {textoConfirmar}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default ModalConfirmacion;
