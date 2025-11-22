import React from "react";
//import "./SignUpTeacherOrStudent.css"; // optional if you want separate styling

const SignUpTeacherOrStudent = () => {
    return (
        <div className="signup-chooser-container">
            <h1 className="signup-title">Create Your Account</h1>
            <p className="signup-subtitle">Choose how you want to join.</p>

            <div className="signup-options">
                <a href="/register/student" className="signup-card link-card">
                    <h2>Student</h2>
                    <p>Take IELTS tests and track your progress.</p>
                    <button className="btn-primary">Sign up as student</button>
                </a>

                <a href="/register/teacher" className="signup-card link-card">
                    <h2>Teacher</h2>
                    <p>Create tests and monitor students' performance.</p>
                    <button className="btn-primary">Enroll as teacher</button>
                </a>
            </div>
        </div>
    );
};

export default SignUpTeacherOrStudent;
