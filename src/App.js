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
  </>
);

const App = () => {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main layout */}
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                {/* Homepage */}
                <Route
                  path="/"
                  element={
                    <div className="home">
                      <h1>Welcome</h1>
                      <div className="home-actions">
                        <a className="home-link" href="/tests">View Tests</a>
                        <a className="home-link" href="/create/reading">Create Reading Test</a>
                      </div>
                    </div>
                  }
                />

                {/* Test list and taking */}
                <Route path="/tests" element={<TestListView />} />
                <Route path="/tests/listening" element={<TestListView />} />
                <Route path="/tests/reading" element={<TestListView />} />
                <Route path="/tests/writing" element={<TestListView />} />
                <Route path="/tests/speaking" element={<TestListView />} />

                <Route path="/tests/:id" element={<StudentTestView />} />

                {/* Type-specific test creation */}
                <Route path="/create/reading" element={<TeacherTestCreateView />} />
                <Route path="/create/listening" element={<TeacherTestCreateView />} />
                <Route path="/create/writing" element={<TeacherTestCreateView />} />
                <Route path="/create/speaking" element={<TeacherTestCreateView />} />

                {/* Editing existing test */}
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
