import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout() {
    return (
        <div className="dashboard">

            <Sidebar />

            <main className="main-content">

                <Topbar />

                <Outlet />

            </main>

        </div>
    );
}

export default Layout;