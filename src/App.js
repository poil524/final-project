import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./views/Auth/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Profile from "./views/Profile.jsx";
import StudentTestView from "./views/testTakingView";
import TeacherTestCreateView from "./views/testCreateEditView";
import TestListView from "./views/testListView";
import EditTestView from "./views/testCreateEditView";
import Login from "./views/Auth/login";
import RegisterStudent from "./views/Auth/registerStudent";
import RegisterTeacher from "./views/Auth/registerTeacher";

import AdminLayout from "./views/Admin/AdminLayout";
import AdminHome from "./views/Admin/Home";
import AdminStudents from "./views/Admin/Students";
import AdminTeachers from "./views/Admin/Teachers";
import AdminTests from "./views/Admin/Tests";
import AdminTeacherRequests from "./views/Admin/TeacherRequests";
import AdminTestEditDeleteRequests from "./views/Admin/TestEditDeleteRequests";
import AdminEvaluationRequests from "./views/Admin/EvaluationRequests";


import "./App.css";
import Home from "./views/Home.jsx";

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
        <Route path="/register/student" element={<RegisterStudent />} />
        <Route path="/register/teacher" element={<RegisterTeacher />} />
        {/* Admin section (separate layout, no Navigation) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="home" element={<AdminHome />} />
          <Route path="users/students" element={<AdminStudents />} />
          <Route path="users/teachers" element={<AdminTeachers />} />
          <Route path="tests" element={<AdminTests />} />
          <Route path="requests/teacher-approval" element={<AdminTeacherRequests />} />
          <Route path="requests/test-edit-delete" element={<AdminTestEditDeleteRequests />} />
          <Route path="requests/evaluations" element={<AdminEvaluationRequests />} />
        </Route>

        {/* Main layout */}
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                {/* Homepage */}
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />


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
