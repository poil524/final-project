import React from "react";
import { FaChalkboardTeacher } from "react-icons/fa";
import { PiStudentFill } from "react-icons/pi";
import "./SignUpTeacherOrStudent.css"; 

const SignUpTeacherOrStudent = () => {
    return (
        <div className="signup-options">
            <a href="/register/student" className="signup-card link-card">
                <PiStudentFill size={40} style={{ color: "var(--color-primary)" }} />
                <h2>Student</h2>
                <p>Take IELTS tests and track your progress.</p>
                <button className="btn-signup">Sign up as student</button>
            </a>

            <a href="/register/teacher" className="signup-card link-card">
                <FaChalkboardTeacher size={40} style={{ color: "var(--color-primary)" }} />
                <h2>Teacher</h2>
                <p>Create tests and monitor students' performance.</p>
                <button className="btn-signup">Enroll as teacher</button>
            </a>
        </div>
    );
};

export default SignUpTeacherOrStudent;
