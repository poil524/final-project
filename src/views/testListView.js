import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./TestListView.css";

axios.defaults.withCredentials = true;

const testTypes = ["listening", "reading", "writing", "speaking"];

const TestListView = () => {
    const [tests, setTests] = useState([]);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [sortOption, setSortOption] = useState("newest");
    const [currentUser, setCurrentUser] = useState(null); // <-- new

    const BASE_URL = "http://localhost:5000";
    const navigate = useNavigate();
    const location = useLocation();

    const path = location.pathname.toLowerCase();
    const filterType =
        path.includes("/tests/listening") ? "listening" :
            path.includes("/tests/reading") ? "reading" :
                path.includes("/tests/writing") ? "writing" :
                    path.includes("/tests/speaking") ? "speaking" :
                        null;

    // Fetch current logged-in user
    const fetchCurrentUser = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/users/profile`, { withCredentials: true });
            setCurrentUser(res.data);
        } catch (err) {
            console.error("Error fetching current user:", err);
        }
    };

    const fetchTests = async () => {
        try {
            const url = filterType
                ? `${BASE_URL}/api/tests?type=${filterType}`
                : `${BASE_URL}/api/tests`;
            const res = await axios.get(url, { withCredentials: true });
            let data = res.data || [];

            data.sort((a, b) => {
                switch (sortOption) {
                    case "newest": return new Date(b.createdAt) - new Date(a.createdAt);
                    case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
                    case "alpha-asc": return a.name.localeCompare(b.name);
                    case "alpha-desc": return b.name.localeCompare(a.name);
                    default: return 0;
                }
            });

            setTests(data);
        } catch (err) {
            console.error("Error fetching tests:", err);
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this test?")) return;
        try {
            await axios.delete(`${BASE_URL}/api/tests/${id}`);
            setTests(prev => prev.filter(t => t._id !== id));
        } catch (err) {
            console.error("Error deleting test:", err);
            alert("Failed to delete test.");
        }
    };

    useEffect(() => {
        fetchCurrentUser();
        fetchTests();
    }, [filterType, sortOption, location.pathname]);

    // Check if the user can add a test
    const canAddTest = currentUser && (currentUser.isAdmin || currentUser.status === "approved");
    return (
        <div style={{ padding: "20px" }}>
            <h1>
                {filterType
                    ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Tests`
                    : "All Tests"}
            </h1>

            {/* Filters */}
            <div className="filters">
                <select
                    value={filterType || ""}
                    onChange={(e) => {
                        const value = e.target.value;
                        navigate(value ? `/tests/${value}` : "/tests");
                    }}
                >
                    <option value="">All Types</option>
                    {testTypes.map(type => (
                        <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                    ))}
                </select>

                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                    <option value="newest">Date: Newest → Oldest</option>
                    <option value="oldest">Date: Oldest → Newest</option>
                    <option value="alpha-asc">Alphabetical: A → Z</option>
                    <option value="alpha-desc">Alphabetical: Z → A</option>
                </select>
            </div>

            {/* Add New Exam (conditional) */}
            {canAddTest && (
                <button
                    className="add-button"
                    onClick={() => {
                        if (filterType) navigate(`/create/${filterType}`);
                        else setModalOpen(true);
                    }}
                >
                    Add New Exam
                </button>
            )}

            {modalOpen && (
                <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Select Exam Type</h2>
                        <div className="card-grid">
                            {testTypes.map(type => (
                                <div
                                    key={type}
                                    className="exam-card"
                                    onClick={() => navigate(`/create/${type}`)}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </div>
                            ))}
                        </div>
                        <button className="close-button" onClick={() => setModalOpen(false)}>Close</button>
                    </div>
                </div>
            )}

            {error && <div style={{ color: "red" }}>Error: {error}</div>}
            {!tests.length && !error && <div>No tests found.</div>}

            <div className="tests-grid">
                {tests.map(test => (
                    <div
                        key={test._id}
                        className="test-card"
                        onClick={() => navigate(`/tests/${test._id}`)}
                    >
                        <h3 className="test-name">{test.name}</h3>
                        <p>Type: {test.type.charAt(0).toUpperCase() + test.type.slice(1)}</p>
                        <p>Created: {new Date(test.createdAt).toLocaleString()}</p>

                        {/* Card actions */}
                        {canAddTest && (
                            <div className="card-actions" onClick={e => e.stopPropagation()}>
                                <button onClick={() => navigate(`/edit/${test._id}`)}>Edit</button>
                                <button onClick={() => handleDelete(test._id)}>Delete</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

        </div>
    );
};

export default TestListView;
