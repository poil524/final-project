import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./views/Auth/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Outlet } from "react-router-dom";

import Profile from "./views/Profile.jsx";
import StudentTestView from "./views/testTakingView";
import TeacherTestCreateView from "./views/testCreateEditView";
import TestListView from "./views/testListView";
import EditTestView from "./views/testCreateEditView";
import Login from "./views/Auth/login";
import RegisterStudent from "./views/Auth/registerStudent";
import RegisterTeacher from "./views/Auth/registerTeacher";

import TeacherLayout from "./views/Teacher/TeacherLayout.jsx";
import TeacherMyTests from "./views/Teacher/MyTests.jsx";
import EvaluationRequests from "./views/Teacher/EvaluationRequests.jsx";
import EvaluationDetail from "./views/Teacher/EvaluationDetail.jsx";

import AdminLayout from "./views/Admin/AdminLayout";
import AdminHome from "./views/Admin/Home";
import AdminStudents from "./views/Admin/Students";
import AdminTeachers from "./views/Admin/Teachers";
import AdminTestsPending from "./views/Admin/TestsPending";
import AdminTestsApproved from "./views/Admin/TestsApproved";
import AdminEvaluationRequests from "./views/Admin/EvaluationRequests";
import AdminAssignedEvaluations from "./views/Admin/AdminAssignedEvaluations.jsx";


import "./App.css";
import Home from "./views/Home.jsx";

const Layout = () => (
  <>
    <Navigation />
    <main className="site-content">
      <Outlet />
    </main>
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

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="home" element={<AdminHome />} />
          <Route path="users/students" element={<AdminStudents />} />
          <Route path="users/teachers" element={<AdminTeachers />} />
          <Route path="tests/pending" element={<AdminTestsPending />} />
          <Route path="tests/approved" element={<AdminTestsApproved />} />
          <Route path="requests/evaluations" element={<AdminEvaluationRequests />} />
          <Route path="requests/assigned" element={<AdminAssignedEvaluations />} />
        </Route>

        {/* Teacher */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route path="profile" element={<Profile />} />
          <Route path="tests" element={<TeacherMyTests />} />
          <Route path="requests/evaluations" element={<EvaluationRequests />} />
          <Route path="requests/evaluations/:id" element={<EvaluationDetail />} />
        </Route>

        {/* Main layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/tests" element={<TestListView />} />
          <Route path="/tests/listening" element={<TestListView />} />
          <Route path="/tests/reading" element={<TestListView />} />
          <Route path="/tests/writing" element={<TestListView />} />
          <Route path="/tests/speaking" element={<TestListView />} />

          <Route path="/tests/:id" element={<StudentTestView />} />

          <Route path="/create/reading" element={<TeacherTestCreateView />} />
          <Route path="/create/listening" element={<TeacherTestCreateView />} />
          <Route path="/create/writing" element={<TeacherTestCreateView />} />
          <Route path="/create/speaking" element={<TeacherTestCreateView />} />

          <Route path="/edit/:id" element={<EditTestView />} />
        </Route>
      </Routes>
    </Router>


  );
};

export default App;
