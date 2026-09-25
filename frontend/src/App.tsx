import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Mesas from "./pages/Mesas";
import NuevaComanda from "./pages/NuevaComanda";
import Comandas from "./pages/Comandas";
import Preparacion from "./pages/Preparacion";
import Productos from "./pages/Productos";
import Stock from "./pages/Stock";
import Recetas from "./pages/Recetas";
import Produccion from "./pages/Produccion";
import Empleados from "./pages/Empleados";
import PermissionRoute from "./components/PermissionRoute";

import { CafeteriaProvider } from "./context/CafeteriaContext";
import { AuthProvider } from "./context/AuthContext";

function App() {
    return (
        <CafeteriaProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>

                        {/* Ruta pública */}
                        <Route
                            path="/login"
                            element={<Login />}
                        />

                        {/* Rutas protegidas */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<Layout />}>

                                <Route element={<PermissionRoute modulo="dashboard" />}>
                                    <Route path="/" element={<Dashboard />} />
                                </Route>

                                <Route element={<PermissionRoute modulo="mesas" />}>
                                    <Route path="/mesas" element={<Mesas />} />
                                </Route>

                                <Route element={<PermissionRoute modulo="comandas" />}>
                                    <Route path="/comandas" element={<Comandas />} />
                                </Route>

                                <Route element={<PermissionRoute modulo="preparacion" />}>
                                    <Route
                                        path="/preparacion"
                                        element={<Preparacion />}
                                    />
                                </Route>

                                <Route element={<PermissionRoute modulo="productos" />}>
                                    <Route
                                        path="/productos"
                                        element={<Productos />}
                                    />
                                </Route>

                                <Route element={<PermissionRoute modulo="recetas" />}>
                                    <Route
                                        path="/recetas"
                                        element={<Recetas />}
                                    />
                                </Route>

                                <Route element={<PermissionRoute modulo="stock" />}>
                                    <Route
                                        path="/stock"
                                        element={<Stock />}
                                    />
                                </Route>

                                <Route element={<PermissionRoute modulo="produccion" />}>
                                    <Route
                                        path="/produccion"
                                        element={<Produccion />}
                                    />
                                </Route>

                                <Route element={<PermissionRoute modulo="empleados" />}>
                                    <Route
                                        path="/empleados"
                                        element={<Empleados />}
                                    />
                                </Route>

                                <Route path="/nueva-comanda" element={<NuevaComanda />} />

                            </Route>
                        </Route>

                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </CafeteriaProvider>
    );
}

export default App;