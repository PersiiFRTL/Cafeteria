import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import PermissionRoute from "./components/PermissionRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Mesas = lazy(() => import("./pages/Mesas"));
const NuevaComanda = lazy(() => import("./pages/NuevaComanda"));
const Comandas = lazy(() => import("./pages/Comandas"));
const Preparacion = lazy(() => import("./pages/Preparacion"));
const Productos = lazy(() => import("./pages/Productos"));
const Stock = lazy(() => import("./pages/Stock"));
const Recetas = lazy(() => import("./pages/Recetas"));
const Produccion = lazy(() => import("./pages/Produccion"));
const Empleados = lazy(() => import("./pages/Empleados"));
const AccesoDenegado = lazy(() => import("./pages/AccesoDenegado"));
const MapaLocal = lazy(() => import("./pages/MapaLocal"));
const Informes = lazy(() => import("./pages/Informes"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { CafeteriaProvider } from "./context/CafeteriaContext";
import { AuthProvider } from "./context/AuthContext";

function App() {
    return (
        <AuthProvider>
            <CafeteriaProvider>
                <BrowserRouter>
                    <Routes>

                        {/* Ruta pública */}
                        <Route
                            path="/login"
                            element={<Suspense fallback={<main className="estado-carga" role="status" aria-live="polite">Abriendo la pantalla…</main>}><Login /></Suspense>}
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


                                <Route element={<PermissionRoute modulo="mapa" />}>
                                    <Route
                                        path="/mapa"
                                        element={<MapaLocal />}
                                    />
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

                                <Route element={<PermissionRoute modulo="informes" />}>
                                    <Route
                                        path="/informes"
                                        element={<Informes />}
                                    />
                                </Route>

                                <Route element={<PermissionRoute modulo="nueva-comanda" />}>
                                    <Route path="/nueva-comanda" element={<NuevaComanda />} />
                                </Route>
                                    
                                <Route
                                    path="/acceso-denegado"
                                    element={<AccesoDenegado />}
                                    />
                            </Route>
                        </Route>

                        <Route path="*" element={<Suspense fallback={<main className="estado-carga" role="status" aria-live="polite">Abriendo la pantalla…</main>}><NotFound /></Suspense>} />

                    </Routes>
                </BrowserRouter>
            </CafeteriaProvider>
        </AuthProvider>
    );
}

export default App;
