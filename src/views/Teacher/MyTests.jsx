import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../../views/TestListView.css";

axios.defaults.withCredentials = true;

const testTypes = ["listening", "reading", "writing", "speaking"];

export default function TeacherMyTests() {
    const [tests, setTests] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [sortOption, setSortOption] = useState("newest");
    const navigate = useNavigate();
    const BASE_URL = "http://localhost:5000";

    useEffect(() => {
        const fetch = async () => {
            const userRes = await axios.get(`${BASE_URL}/api/users/profile`);
            setCurrentUser(userRes.data);

            const testRes = await axios.get(`${BASE_URL}/api/tests?createdBy=${userRes.data._id}`);
            let data = testRes.data || [];

            data.sort((a, b) =>
                sortOption === "newest"
                    ? new Date(b.createdAt) - new Date(a.createdAt)
                    : new Date(a.createdAt) - new Date(b.createdAt)
            );

            setTests(data);
        };
        fetch();
    }, [sortOption]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this test?")) return;
        await axios.delete(`${BASE_URL}/api/tests/${id}`);
        setTests(tests.filter(t => t._id !== id));
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>My Tests</h1>

            {/* Create Test */}
            <button
                className="add-button"
                onClick={() => navigate("/tests")}
            >
                Create New Test
            </button>

            <div className="filters">
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                    <option value="newest">Newest → Oldest</option>
                    <option value="oldest">Oldest → Newest</option>
                </select>
            </div>

            <div className="tests-grid">
                {tests.map(test => (
                    <div key={test._id} className="test-card">
                        <h3>{test.name}</h3>
                        <p>Type: {test.type}</p>
                        <p>Created: {new Date(test.createdAt).toLocaleString()}</p>

                        <div className="card-actions">
                            <button onClick={() => navigate(`/edit/${test._id}`)}>Edit</button>
                            <button onClick={() => handleDelete(test._id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
