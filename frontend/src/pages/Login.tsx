import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { emailValido } from "../validaciones";

function Login() {

    const navigate = useNavigate();

    const {
        iniciarSesion,
        errorSesion
    } = useAuth();


    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [iniciandoSesion, setIniciandoSesion] = useState(false);

    const [errores, setErrores] = useState<{
        email?: string;
        password?: string;
        general?: string;
    }>({});


    const manejarLogin = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        const erroresCampos: typeof errores = {};
        if (email.trim() === "") {
            erroresCampos.email = "Ingresá tu email.";
        } else if (!emailValido(email)) {
            erroresCampos.email = "Ingresá un email válido.";
        }
        if (password.trim() === "") {
            erroresCampos.password = "Ingresá tu contraseña.";
        }

        if (Object.keys(erroresCampos).length > 0) {
            setErrores(erroresCampos);

            return;
        }

        setErrores({});
        setIniciandoSesion(true);
        let resultado: Awaited<ReturnType<typeof iniciarSesion>>;
        try {
            resultado = await iniciarSesion(email, password);
        } catch {
            setErrores({ general: "No se pudo conectar con Supabase. Intentá nuevamente." });
            setIniciandoSesion(false);
            return;
        }


        if (!resultado.correcto) {
            const mensajeError = resultado.mensaje || "Error al iniciar sesión.";
            if (mensajeError === "Email o contraseña incorrectos.") {
                setErrores({ password: mensajeError });
            } else {
                setErrores({ general: mensajeError });
            }
            setIniciandoSesion(false);

            return;
        }


        navigate("/");
    };


    return (

        <div className="login-container">

            <div className="login-card">

                <div className="login-header">

                    <div className="login-icon">
                        <img src="/icon-192.png" alt="" aria-hidden="true" />
                    </div>

                    <h1 className="login-brand-name">
                        CAFETERÍA
                    </h1>

                </div>


                <form
                    onSubmit={manejarLogin}
                    className="login-form"
                    aria-busy={iniciandoSesion}
                    noValidate
                >

                    <div className="login-field">

                        <label htmlFor="login-email">
                            Email
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            required
                            placeholder="Ingresá tu email"
                            value={email}
                            aria-invalid={Boolean(errores.email)}
                            aria-describedby={errores.email ? "login-email-error" : undefined}
                            onChange={(e) => {
                                setEmail(
                                    e.target.value
                                );
                                setErrores({});
                            }}
                        />

                        {errores.email && (
                            <p className="login-field-error" id="login-email-error" role="alert">
                                {errores.email}
                            </p>
                        )}

                    </div>


                    <div className="login-field">

                        <label htmlFor="login-password">
                            Contraseña
                        </label>

                        <div className="login-password-input-wrap">
                            <input
                                id="login-password"
                                type={mostrarPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                placeholder="Ingresá tu contraseña"
                                value={password}
                                aria-invalid={Boolean(errores.password)}
                                aria-describedby={errores.password ? "login-password-error" : undefined}
                                onChange={(e) => {
                                    setPassword(
                                        e.target.value
                                    );
                                    setErrores({});
                                }}
                            />
                            <button
                                type="button"
                                className="password-visibility-button"
                                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                aria-controls="login-password"
                                title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                onClick={() => setMostrarPassword((mostrar) => !mostrar)}
                            >
                                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {errores.password && (
                            <p className="login-field-error" id="login-password-error" role="alert">
                                {errores.password}
                            </p>
                        )}

                    </div>


                    {errores.general && (

                        <div className="login-error" role="alert">
                            {errores.general}
                        </div>

                    )}

                    {!errores.general && errorSesion && (
                        <div className="login-error" role="alert">
                            {errorSesion}
                        </div>
                    )}


                    <button
                        type="submit"
                        className="primary-button login-button"
                        disabled={iniciandoSesion}
                        aria-busy={iniciandoSesion}
                    >
                        {iniciandoSesion ? "Iniciando sesión…" : "Iniciar sesión"}
                    </button>

                </form>

            </div>

        </div>

    );
}

export default Login;
