import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Mesas from "./pages/Mesas";
import NuevaComanda from "./pages/NuevaComanda";
import Comandas from "./pages/Comandas";
import Preparacion from "./pages/Preparacion";
import Productos from "./pages/Productos";
import Stock from "./pages/Stock";
import Recetas from "./pages/Recetas";
import Produccion from "./pages/Produccion";
import { CafeteriaProvider } from "./context/CafeteriaContext";

function App() {
    return (
        <CafeteriaProvider>

            <BrowserRouter>

                <Routes>

                    <Route element={<Layout />}>

                        <Route
                            path="/"
                            element={<Dashboard />}
                        />

                        <Route
                            path="/mesas"
                            element={<Mesas />}
                        />

                        <Route
                            path="/nueva-comanda"
                            element={<NuevaComanda />}
                        />
                        <Route
                            path="/comandas"
                            element={<Comandas />}
                            />
                        <Route
                            path="/preparacion"
                            element={<Preparacion />}
                            />
                            <Route
                            path="/productos"
                            element={<Productos />}
                            />
                            <Route
                            path="/stock"
                            element={<Stock />}
                            />
                        <Route
                            path="/recetas"
                            element={<Recetas />}
                            />
                        <Route
                            path="/produccion"
                            element={<Produccion />}
                            />
                    </Route>

                </Routes>

            </BrowserRouter>

        </CafeteriaProvider>
    );
}

export default App;