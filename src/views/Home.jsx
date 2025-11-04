import React from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "./Home.css";

const Home = () => {
    return (
        <div className="home-page">

            <div className="carousel-container">
                <Carousel autoPlay infiniteLoop showThumbs={false} showStatus={false}>
                    <div><img src="/images/slide1.jpg" alt="slide1" /></div>
                    <div><img src="/images/slide2.jpg" alt="slide2" /></div>
                    <div><img src="/images/slide3.jpg" alt="slide3" /></div>
                </Carousel>
            </div>

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



            <div className="skills-section">
                <h2>IELTS Skills</h2>
                <div className="skills-grid">
                    <a href="/tests/listening" className="skill-box">Listening</a>
                    <a href="/tests/speaking" className="skill-box">Speaking</a>
                    <a href="/tests/writing" className="skill-box">Writing</a>
                    <a href="/tests/reading" className="skill-box">Reading</a>
                </div>
            </div>

            <footer className="footer">
                <p>© 2025 IELTS Training System</p>
            </footer>

        </div>
    );
};

export default Home;
