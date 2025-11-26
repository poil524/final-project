import React, { useContext } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "./Home.css";
import { FaChalkboardTeacher } from "react-icons/fa";
import { PiStudentFill } from "react-icons/pi";
import { RiSpeakFill } from "react-icons/ri";
import { FaEarListen } from "react-icons/fa6";
import { FaBookReader } from "react-icons/fa";
import { FaPenNib } from "react-icons/fa";

import { AuthContext } from "../context/authContext";  

const Home = () => {
    const { user } = useContext(AuthContext);           

    return (
        <div className="home-page">

            <div className="carousel-container">
                <Carousel autoPlay infiniteLoop showThumbs={false} showStatus={false}>
                    <div><img src="/images/slide1.jpg" alt="slide1" /></div>
                    <div><img src="/images/slide2.jpg" alt="slide2" /></div>
                    <div><img src="/images/slide3.jpg" alt="slide3" /></div>
                </Carousel>
            </div>

            {/* ⬇️ Hide sign-up options when logged in */}
            {!user && (
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
            )}

            <div className="skills-section">
                <h3>IELTS Skills</h3>
                <div className="skills-grid">
                    <a href="/tests/listening" className="skill-box">
                        <FaEarListen className="skill-box-icon" size={36} />
                        Listening
                    </a>
                    <a href="/tests/speaking" className="skill-box">
                        <RiSpeakFill className="skill-box-icon" size={36} />
                        Speaking
                    </a>
                    <a href="/tests/writing" className="skill-box">
                        <FaPenNib className="skill-box-icon" size={36} />
                        Writing
                    </a>
                    <a href="/tests/reading" className="skill-box">
                        <FaBookReader className="skill-box-icon" size={36} />
                        Reading
                    </a>
                </div>
            </div>

            <footer className="footer">
                <p>2025 IELTS Training System</p>
            </footer>

        </div>
    );
};

export default Home;
