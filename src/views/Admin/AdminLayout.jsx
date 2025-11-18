import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import "../Dashboard.css";

export default function AdminLayout() {
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

        {!collapsed && <h1>Admin</h1>}

        {!collapsed && <p className="admin-nav-group-title">Users</p>}
        <NavLink to="/admin/users/students" className="admin-nav-link">
          {collapsed ? "S" : "Students"}
        </NavLink>
        <NavLink to="/admin/users/teachers" className="admin-nav-link">
          {collapsed ? "T" : "Teachers"}
        </NavLink>

        {!collapsed && <p className="admin-nav-group-title">Test Management</p>}
        <NavLink to="/admin/tests" className="admin-nav-link">
          {collapsed ? "Ts" : "Test Table"}
        </NavLink>

        {!collapsed && <p className="admin-nav-group-title">Request Management</p>}

        <NavLink to="/admin/requests/evaluations" className="admin-nav-link">
          {collapsed ? "EV" : "Evaluation Requests"}
        </NavLink>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
