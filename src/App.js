import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import StudentTestView from "./views/studentTestView";
import TeacherTestCreateView from "./views/testCreateEditView"; 
import TestListView from "./views/testListView";
import EditTestView from "./views/testCreateEditView";

const App = () => {
  return (
    <Router>
      <div style={{ padding: "20px" }}>
        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={
              <div>
                <h1>Welcome</h1>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Link to="/tests"><button>View Test</button></Link>
                  <Link to="/create"><button>Create Test</button></Link>
                </div>
              </div>
            }
          />

          {/* List of tests */}
          <Route path="/tests" element={<TestListView />} />

          {/* Single test by ID */}
          <Route path="/tests/:id" element={<StudentTestView />} />

          {/* Create test*/}
          <Route path="/create" element={<TeacherTestCreateView />} />

          {/* Edit test */}
          <Route path="/edit/:id" element={<EditTestView />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;