import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import StudentTestView from "./views/studentTestView";
import TeacherTestCreateView from "./views/testCreateEditView";
import TestListView from "./views/testListView";
import EditTestView from "./views/testCreateEditView";

const App = () => {
  return (
    <Router>
      <div className="site-root">
        <header className="site-header">
          <div className="site-header__brand">
            <a className="site-brand__link" href="https://brightstarschools.org/" aria-label="Bright Star Schools Home">
              <img
                className="site-brand__logo site-brand__logo--hidden"
                src="https://brightstarschools.org/images/bss-logo.svg"
                alt="Bright Star School"
              />
              <img
                className="site-brand__logo"
                src="https://brightstarschools.org/images/bss-logo-white.svg"
                alt="Bright Star School"
              />
            </a>
          </div>
          <nav className="site-header__nav" aria-label="Primary">
            <ul className="site-nav__list">
              <li className="site-nav__item">
                <a className="site-nav__link" href="https://e72950325aa74e3a916fa52053ea1880-c830ff87a7d840ab8088ed415.fly.dev/tests">
                  <span className="site-nav__label"><p>Exam Library</p></span>
                </a>
              </li>
              <li className="site-nav__item">
                <a className="site-nav__link" href="https://brightstarschools.org/#">
                  <span className="site-nav__label"><p>Live Sessions</p></span>
                </a>
              </li>
              <li className="site-nav__item">
                <a className="site-nav__link" href="https://brightstarschools.org/#">
                  <span className="site-nav__label">Program</span>
                </a>
              </li>
              <li className="site-nav__item site-nav__item--has-sub">
                <div className="site-nav__group">
                  <a className="site-nav__link" href="https://brightstarschools.org/#">
                    <span className="site-nav__label">About</span>
                  </a>
                  <ul className="site-subnav__list">
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/about"><span>About</span></a>
                    </li>
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/Vision-Mission-And-Values"><span>Our Vision, Mission & Values</span></a>
                    </li>
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/Our-Commitment-to-Anti-Racism"><span>Our Commitment to Anti-Racism</span></a>
                    </li>
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/TK-12-Pathway"><span>TK-12th Grade Pathway</span></a>
                    </li>
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/Impact"><span>Our Impact</span></a>
                    </li>
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/Leadership"><span>Our Leadership</span></a>
                    </li>
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/Discover-Our-Staff"><span>Discover Our Staff</span></a>
                    </li>
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/Board-of-Directors"><span>Board of Directors</span></a>
                    </li>
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/Board-Information"><span>Board Meetings</span></a>
                    </li>
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/25-26-School-Year-Information"><span>25-26 School Year Information</span></a>
                    </li>
                    <li className="site-subnav__item">
                      <a className="site-subnav__link" href="https://brightstarschools.org/Community-Schools"><span>Community Schools</span></a>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="site-nav__cta">
                <a className="btn-login" href="https://brightstarschools.org/Enroll"><p>Log In</p></a>
              </li>
            </ul>
          </nav>
        </header>

        <main className="site-content">
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <h1 className="home-title">Welcome</h1>
                  <div className="home-actions">
                    <Link to="/tests"><button>View Test</button></Link>
                    <Link to="/create"><button>Create Test</button></Link>
                  </div>
                </div>
              }
            />

            <Route path="/tests" element={<TestListView />} />
            <Route path="/tests/:id" element={<StudentTestView />} />
            <Route path="/create" element={<TeacherTestCreateView />} />
            <Route path="/edit/:id" element={<EditTestView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
