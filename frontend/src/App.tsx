import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Mesas from "./pages/Mesas";
import NuevaComanda from "./pages/NuevaComanda";
import Comandas from "./pages/Comandas";
import Preparacion from "./pages/Preparacion";
import Productos from "./pages/Productos";
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
                    </Route>

                </Routes>

            </BrowserRouter>

        </CafeteriaProvider>
    );
}

export default App;