import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import "../Dashboard.css";

export default function TeacherLayout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="admin-container">
            <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#e5e7eb",
                        marginBottom: "20px",
                        cursor: "pointer",
                        fontSize: "18px"
                    }}
                >
                    {collapsed ? "☰" : "×"}
                </button>

                {!collapsed && <h1>Teacher</h1>}

                <NavLink to="/teacher/profile" className="admin-nav-link">
                    {collapsed ? "P" : "My Profile"}
                </NavLink>

                <NavLink to="/teacher/tests" className="admin-nav-link">
                    {collapsed ? "T" : "My Tests"}
                </NavLink>

                <NavLink to="/teacher/requests/evaluations" className="admin-nav-link">
                    {collapsed ? "EV" : "Evaluation Requests"}
                </NavLink>
            </aside>

            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
}
