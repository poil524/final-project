import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { BiHome, BiLogIn } from "react-icons/bi";
import { AuthContext } from "../../context/authContext.js";
import "./Navigation.css";
import axiosClient from "../../axiosClient.js";

const Navigation = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isExamDropdown, setIsExamDropdown] = useState(false);
  const [isUserDropdown, setIsUserDropdown] = useState(false);
  console.log("[NAV] user =", user);

  const handleLogout = async () => {
    try {
      console.log("[LOGOUT] Sending request to backend...");
      await axiosClient.post("/api/users/logout"); // <-- Removes httpOnly cookie
    } catch (err) {
      console.log("[LOGOUT] Server logout failed:", err?.response?.data);
    }

    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear context
    setUser(null);

    // Redirect
    window.location.href = "/";
  };


  // Determine dashboard link
  let dashboardLink = "/profile";
  let dashboardLabel = "My Profile";


  return (
    <header className="header">
      <div className="header_brand">
        <a className="brand_link" href="/" aria-label="Home"></a>
      </div>

      <nav className="header_nav" aria-label="Primary">
        <ul className="site-nav_list">
          {(user?.isAdmin || user?.isTeacher) && (
            <li className="site-nav_item">
              <Link className="site-nav_link" to={user.isAdmin ? "/admin" : "/teacher"}>
                <span className="site-nav_label">Dashboard</span>
              </Link>
            </li>
          )}

          <li
            className="site-nav_item dropdown"
            onMouseEnter={() => setIsExamDropdown(true)}
            onMouseLeave={() => setIsExamDropdown(false)}
          >
            <Link className="site-nav_link" to="/tests">
              <span className="site-nav_label">
                <BiHome /> Exam Library
              </span>
            </Link>

            {isExamDropdown && (
              <ul className="dropdown_menu">
                <li><Link to="/tests/listening">Listening Exam</Link></li>
                <li><Link to="/tests/reading">Reading Exam</Link></li>
                <li><Link to="/tests/writing">Writing Exam</Link></li>
                <li><Link to="/tests/speaking">Speaking Exam</Link></li>
              </ul>
            )}
          </li>

          {user ? (
            <li
              className="site-nav_item user-dropdown"
              onMouseEnter={() => setIsUserDropdown(true)}
              onMouseLeave={() => setIsUserDropdown(false)}
            >
              <span className="user-name">{user.username}</span>

              {isUserDropdown && (
                <ul className="user-dropdown_menu">
                  <li className="user-info">
                    <strong>{user.username}</strong>
                    <p>{user.email}</p>
                    <small>Joined: {new Date(user.createdAt).toLocaleDateString()}</small>
                  </li>
                  <hr />
                  <li>
                    <Link to={dashboardLink}>{dashboardLabel}</Link>
                  </li>
                  <hr />
                  <li>
                    <button className="signout-btn" onClick={handleLogout}>
                      Sign Out
                    </button>
                  </li>
                </ul>
              )}
            </li>
          ) : (
            <li className="site-nav_cta">
              <Link className="btn-login" to="/login">
                <BiLogIn /> Log In
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Navigation;
