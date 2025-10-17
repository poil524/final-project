import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { BiHome, BiLogIn } from "react-icons/bi";
import { AuthContext } from "../../context/authContext.js";
import "./Navigation.css";

const Navigation = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isExamDropdown, setIsExamDropdown] = useState(false);
  const [isUserDropdown, setIsUserDropdown] = useState(false);

  const handleLogout = () => {
    document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="header">
      <div className="header_brand">
        <a className="brand_link" href="/" aria-label="Home">
          <img
            className="brand_logo"
            src="https://brightstarschools.org/images/bss-logo-white.svg"
            alt="Logo"
          />
        </a>
      </div>

      <nav className="header_nav" aria-label="Primary">
        <ul className="site-nav_list">
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

          {/* User account or login */}
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
                  <li><Link to="/profile">My Profile</Link></li>
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
