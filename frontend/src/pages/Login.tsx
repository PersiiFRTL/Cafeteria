import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { emailValido } from "../validaciones";

function Login() {

    const navigate = useNavigate();

    const {
        iniciarSesion
    } = useAuth();


    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

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

        const resultado =
            await iniciarSesion(
                email,
                password
            );


        if (!resultado.correcto) {
            const mensajeError = resultado.mensaje || "Error al iniciar sesión.";
            if (mensajeError === "Email o contraseña incorrectos.") {
                setErrores({ password: mensajeError });
            } else {
                setErrores({ general: mensajeError });
            }

            return;
        }


        navigate("/");
    };


    return (

        <div className="login-container">

            <div className="login-card">

                <div className="login-header">

                    <div className="login-icon">
                        ☕
                    </div>

                    <h1>
                        CAFETERÍA
                    </h1>

                    <p>
                        Sistema de gestión
                    </p>

                </div>


                <form
                    onSubmit={manejarLogin}
                    className="login-form"
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

                        <input
                            id="login-password"
                            type="password"
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


                    <button
                        type="submit"
                        className="primary-button login-button"
                    >
                        Iniciar sesión
                    </button>

                </form>

            </div>

        </div>

    );
}

export default Login;