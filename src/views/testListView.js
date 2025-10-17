import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";

// enable sending cookies with requests
axios.defaults.withCredentials = true;

const TestListView = () => {
    const [tests, setTests] = useState([]);
    const [error, setError] = useState(null);

    const BASE_URL = "http://localhost:5000";
    const navigate = useNavigate();
    const location = useLocation();
    
    // determine filter type from route
    const path = location.pathname.toLowerCase();
    const filterType =
        path.includes("/tests/listening") ? "listening" :
            path.includes("/tests/reading") ? "reading" :
                path.includes("/tests/writing") ? "writing" :
                    path.includes("/tests/speaking") ? "speaking" :
                        null;

    const fetchTests = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/tests`);
            let data = res.data || [];
console.log("API data:", res.data);

            // filter tests by type if applicable
            if (filterType) data = data.filter((t) => t.type === filterType);

            setTests(data);
        } catch (err) {
            console.error("Error fetching tests:", err);
            setError(err.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        fetchTests();
    }, [filterType, location.pathname]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this test?")) return;
        try {
            await axios.delete(`${BASE_URL}/api/tests/${id}`);
            setTests((prev) => prev.filter((t) => t._id !== id));
        } catch (err) {
            console.error("Error deleting test:", err);
            alert("Failed to delete test.");
        }
    };

    if (error) return <div>Error: {error}</div>;
    if (!tests.length) return <div>No tests found.</div>;

    return (
        <div>
            <h1>
                {filterType
                    ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Tests`
                    : "All Tests"}
            </h1>
            <ul>
                {tests.map((test) => (
                    <li key={test._id} style={{ marginBottom: "12px" }}>
                        <Link to={`/tests/${test._id}`}>{test.name}</Link>
                        <br />
                        <small>{new Date(test.createdAt).toLocaleString()}</small>
                        <br />
                        <button onClick={() => navigate(`/edit/${test._id}`)}>Edit</button>
                        <button
                            style={{ marginLeft: "8px" }}
                            onClick={() => handleDelete(test._id)}
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TestListView;
