import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/authContext.js";

const Profile = () => {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const handleRowClick = (id) => navigate(`/tests/${id}`);


    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/users/profile", {
                    withCredentials: true,
                });
                console.log("[DEBUG] Profile fetched from server:", res.data);

                const data = {
                    ...res.data,
                    testResults: Array.isArray(res.data.testResults) ? res.data.testResults : [],
                };
                setProfile(data);
            } catch (err) {
                console.error("[DEBUG] Error fetching profile:", err);
                setError(err.response?.data?.error || "Failed to fetch profile");
            }
        };
        fetchProfile();
    }, []);


    if (error) return <div style={{ color: "red" }}>{error}</div>;
    if (!profile) return <div>Loading...</div>;

    const testResults = profile.testResults;

    return (
        <div style={{ padding: "20px" }}>
            <h2>My Profile</h2>
            <div style={{ marginBottom: 20 }}>
                <p><strong>Username:</strong> {profile.username}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p>
                    <strong>Joined:</strong>{" "}
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                </p>


                {profile.isTeacher && <p><strong>Status:</strong> {profile.status}</p>}
            </div>

            {/* Only show past test attempts for students */}
            {!profile.isTeacher && (
                <div>
                    <h3>Past Test Attempts</h3>
                    {testResults.length === 0 ? (
                        <p>No tests attempted yet.</p>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#e5e7eb" }}>
                                    <th style={{ padding: 8 }}>Test Name</th>
                                    <th style={{ padding: 8 }}>Type</th>
                                    <th style={{ padding: 8 }}>Score</th>
                                    <th style={{ padding: 8 }}>Band</th>
                                    <th style={{ padding: 8 }}>Taken At</th>
                                </tr>
                            </thead>

                            <tbody>
                                {testResults
                                    .sort((a, b) => new Date(b.takenAt || b.createdAt) - new Date(a.takenAt || a.createdAt))
                                    .map((t) => (
                                        <tr
                                            key={t.testId}
                                            onClick={() => handleRowClick(t.testId)}
                                            style={{ borderBottom: "1px solid #ddd", cursor: "pointer" }}
                                        >
                                            <td style={{ padding: 8 }}>{t.testName}</td>
                                            <td style={{ padding: 8 }}>{t.type}</td>
                                            <td style={{ padding: 8 }}>{t.score} / {t.total}</td>
                                            <td style={{ padding: 8 }}>{t.band ?? "-"}</td>
                                            <td style={{ padding: 8 }}>
                                                {new Date(t.takenAt || t.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>

                        </table>

                    )}
                </div>
            )}
        </div>
    );
};

export default Profile;
