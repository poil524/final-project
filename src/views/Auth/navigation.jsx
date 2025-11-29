import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { BiHome, BiLogIn } from "react-icons/bi";
import { IoLibraryOutline } from "react-icons/io5";
import { AuthContext } from "../../context/authContext.js";
import "./Navigation.css";
import axiosClient from "../../axiosClient.js";

const Navigation = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isExamDropdown, setIsExamDropdown] = useState(false);
  const [isUserDropdown, setIsUserDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await axiosClient.post("/api/users/logout");
    } catch (err) {
      console.log("Logout failed:", err?.response?.data);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  let dashboardLink = "/profile";
  let dashboardLabel = "My Profile";

  return (
    <header className="header">
      <ul className="site-nav_left">
        <li className="site-nav_item">
          <Link className="site-nav_link" to="/">
            <span className="site-nav_label"><BiHome size={15}></BiHome>Home</span>
          </Link>
        </li>
      </ul>

      <nav className="header_nav" aria-label="Primary">
        {/* Left Side */}


        {/* Right Side */}
        <ul className="site-nav_right">
          {(user?.isAdmin || user?.isTeacher) && (
            <li className="site-nav_item">
              <Link
                className="site-nav_link"
                to={user.isAdmin ? "/admin/tests/pending" : "/teacher"}
              >
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
                <IoLibraryOutline size={15}/>Tests Library
              </span>
            </Link>

            {isExamDropdown && (
              <ul className="dropdown_menu">
                <li>
                  <Link to="/tests/listening">Listening Exam</Link>
                </li>
                <li>
                  <Link to="/tests/reading">Reading Exam</Link>
                </li>
                <li>
                  <Link to="/tests/writing">Writing Exam</Link>
                </li>
                <li>
                  <Link to="/tests/speaking">Speaking Exam</Link>
                </li>
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
                    <small>
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </small>
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
                <BiLogIn size={15} /> Log In
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Navigation;
