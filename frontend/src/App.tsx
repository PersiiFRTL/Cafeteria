import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Mesas from "./pages/Mesas";
import NuevaComanda from "./pages/NuevaComanda";

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

                    </Route>

                </Routes>

            </BrowserRouter>

        </CafeteriaProvider>
    );
}

export default App;