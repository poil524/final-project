import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./views/Auth/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import StudentTestView from "./views/testTakingView";
import TeacherTestCreateView from "./views/testCreateEditView";
import TestListView from "./views/testListView";
import EditTestView from "./views/testCreateEditView";
import Login from "./views/Auth/login";
import Register from "./views/Auth/register";

import "./App.css";

const Layout = ({ children }) => (
  <>
    <Navigation />
    <main className="site-content">{children}</main>

    <section className="feature-rail">
      <div className="feature-rail__inner">
        <div className="feature-grid">
          <a className="feature-card" href="https://brightstarschools.org/enroll">
            <div className="feature-card__icon">
              <img
                className="feature-card__image"
                src="https://brightstarschools.org/images/icon-enroll-with-us.svg"
                alt="Enroll With Us"
              />
            </div>
            <div className="feature-card__titles">
              <h4 className="feature-card__title">Enroll</h4>
              <h5 className="feature-card__subtitle">With Us</h5>
            </div>
          </a>
          {/* Other cards... */}
        </div>
      </div>
    </section>
  </>
);

const App = () => {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* Login page: isolated, no navigation or footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Everything else uses Layout */}
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={
                    <div>
                      <h1 className="home-title">Welcome</h1>
                      <div className="home-actions">
                        <a
                          className="home-link"
                          href="https://e72950325aa74e3a916fa52053ea1880-c830ff87a7d840ab8088ed415.fly.dev/tests"
                        >
                          View Test
                        </a>
                        <a
                          className="home-link"
                          href="https://e72950325aa74e3a916fa52053ea1880-c830ff87a7d840ab8088ed415.fly.dev/create"
                        >
                          Create Test
                        </a>
                      </div>
                    </div>
                  }
                />
                <Route path="/tests" element={<TestListView />} />
                <Route path="/tests/:id" element={<StudentTestView />} />
                <Route path="/create" element={<TeacherTestCreateView />} />
                <Route path="/edit/:id" element={<EditTestView />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
