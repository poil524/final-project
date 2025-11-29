import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/authContext.js";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./Login.css";
import { BiShow } from "react-icons/bi";
import { BiHide } from "react-icons/bi";

const LoginForm = () => {
    const { setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await axios.post(
                "http://localhost:5000/api/users/login",
                { email, password },
                { withCredentials: true }
            );

            // Save token for authenticated requests
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            // Update global context
            setUser(res.data.user);

            // Redirect
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Check credentials.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-header">LOG IN</h1>
                {error && <p className="error-text">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label>Email</label>
                        <input
                            className="loginInput"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login-field password-wrapper">
                        <label>Password</label>
                        <input
                            className="loginInput"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
    type="button"
    className="password-toggle"
    onClick={() => setShowPassword((prev) => !prev)}
    style={{
        padding: '0px',
        marginTop: '15px',
        marginRight: '15px', 
        fontSize: '16px',     
    }}
    title={showPassword ? "Hide Password" : "Show Password"} // 
>
    {showPassword ? <BiShow /> : <BiHide />}
</button>


                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                </form>

                <div className="signup-text">
                    Don't have an account? <Link to="/register/sign-up-select">Sign up</Link>
                </div>

            </div>
        </div>
    );
};

export default LoginForm;
