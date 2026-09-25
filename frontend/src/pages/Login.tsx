import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {

    const navigate = useNavigate();

    const {
        iniciarSesion
    } = useAuth();


    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");


    const manejarLogin = (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        setError("");


        if (
            email.trim() === "" ||
            password.trim() === ""
        ) {

            setError(
                "Completá email y contraseña."
            );

            return;
        }


        const loginCorrecto =
            iniciarSesion(
                email,
                password
            );


        if (!loginCorrecto) {

            setError(
                "Email o contraseña incorrectos."
            );

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
                >

                    <div className="login-field">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            placeholder="Ingresá tu email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <div className="login-field">

                        <label>
                            Contraseña
                        </label>

                        <input
                            type="password"
                            placeholder="Ingresá tu contraseña"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    {error && (

                        <div className="login-error">
                            {error}
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