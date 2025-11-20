import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/authContext.js";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const handleRowClick = (id) => {
  // Force absolute path
  navigate(`/tests/${id}`, { replace: false });
};

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users/profile", {
          withCredentials: true,
        });
        console.log("[DEBUG] Profile fetched from server:", res.data);

        // Create a map of evaluations by testResultId
        const evaluationsByTest = {};
        if (res.data.evaluations) {
          res.data.evaluations.forEach((ev) => {
            evaluationsByTest[ev.testResultId] = ev.feedback;
          });
        }

        const data = {
          ...res.data,
          testResults: Array.isArray(res.data.testResults) ? res.data.testResults : [],
          evaluationsByTest,
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

  const { testResults, evaluationsByTest } = profile;

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
                  <th style={{ padding: 8 }}>Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {testResults
                  .sort((a, b) => new Date(b.takenAt || b.createdAt) - new Date(a.takenAt || a.createdAt))
                  .map((t) => {
                    const teacherFeedback = evaluationsByTest[t._id];

                    return (
                      <tr
                        key={t._id}
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
                        <td style={{ padding: 8 }} onClick={(e) => e.stopPropagation()}>
                          {t.type === "writing" || t.type === "speaking" ? (
                            teacherFeedback ? (
                              <button
                                onClick={() => alert(teacherFeedback)}
                                style={{ background: "#4ade80", padding: "6px 12px", borderRadius: "6px" }}
                              >
                                View Feedback
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.post(
                                      "http://localhost:5000/api/evaluations/request",
                                      { testResultId: t._id },
                                      { withCredentials: true }
                                    );
                                    alert("Teacher evaluation requested successfully!");
                                  } catch (err) {
                                    console.error("[DEBUG] Failed to request evaluation:", err);
                                    alert("Failed to request teacher evaluation");
                                  }
                                }}
                                style={{ padding: "6px 12px", borderRadius: "6px" }}
                              >
                                Request Evaluation
                              </button>
                            )
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
