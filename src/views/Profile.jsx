import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const handleRowClick = (id) => {
    navigate(`/tests/${id}`, { replace: false });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users/profile", {
          withCredentials: true,
        });

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
        setError(err.response?.data?.error || "Failed to fetch profile");
      }
    };

    fetchProfile();
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div>Loading...</div>;

  const { testResults, evaluationsByTest } = profile;

  return (
    <div className="profile-container">
      <h2>My Profile</h2>

      <div className="profile-info">
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
            <table className="results-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Type</th>
                  <th>Band</th>
                  <th>Taken At</th>
                  <th>Evaluation</th>
                </tr>
              </thead>

              <tbody>
                {testResults
                  .sort(
                    (a, b) =>
                      new Date(b.takenAt || b.createdAt) -
                      new Date(a.takenAt || a.createdAt)
                  )
                  .map((t) => {
                    const evalStatus =
                      t.isEvaluated || { requested: false, resultReceived: false };

                    return (
                      <tr
                        key={t._id}
                        className="result-row"
                        onClick={() => handleRowClick(t.testId)}
                      >
                        <td>{t.testName}</td>
                        <td>{t.type}</td>
                        <td>{t.band ?? "-"}</td>
                        <td>
                          {new Date(t.takenAt || t.createdAt).toLocaleString()}
                        </td>

                        <td
                          className="evaluation-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.type === "writing" || t.type === "speaking" ? (
                            <>
                              {!evalStatus.requested && !evalStatus.resultReceived && (
                                <button
                                  className="btn request-btn"
                                  onClick={async () => {
                                    try {
                                      await axios.post(
                                        "http://localhost:5000/api/evaluations/request",
                                        { testResultId: t._id },
                                        { withCredentials: true }
                                      );
                                      alert("Teacher evaluation requested successfully!");
                                    } catch (err) {
                                      alert("Failed to request teacher evaluation");
                                    }
                                  }}
                                >
                                  Request Evaluation
                                </button>
                              )}

                              {evalStatus.requested && !evalStatus.resultReceived && (
                                <button className="btn pending-btn" disabled>
                                  Pending
                                </button>
                              )}

                              {evalStatus.requested && evalStatus.resultReceived && (
                                <button
                                  className="btn result-btn"
                                  onClick={() => navigate(`/tests/${t.testId}`)}
                                >
                                  See Result
                                </button>
                              )}
                            </>
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
