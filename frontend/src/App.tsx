import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Mesas from "./pages/Mesas";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route element={<Layout />}>

                    <Route path="/" element={<Dashboard />} />

                    <Route path="/mesas" element={<Mesas />} />

                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default App;