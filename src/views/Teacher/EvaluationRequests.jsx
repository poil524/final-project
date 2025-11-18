import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

axios.defaults.withCredentials = true;

export default function TeacherEvaluationRequests() {
    const [requests, setRequests] = useState([]);
    const navigate = useNavigate();
    const BASE_URL = "http://localhost:5000";

    useEffect(() => {
        const fetch = async () => {
            const res = await axios.get(`${BASE_URL}/api/users/teacher`);
            setRequests(res.data);
        };
        fetch();
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h1>Evaluation Requests</h1>

            {!requests.length && <div>No pending evaluations.</div>}

            <ul>
                {requests.map(req => (
                    <li
                        key={req._id}
                        style={{ cursor: "pointer", padding: "10px 0" }}
                        onClick={() => navigate(`/teacher/requests/evaluations/${req._id}`)}
                    >
                        <b>{req.student.username}</b> — Test ID: {req.testResultId}
                    </li>
                ))}
            </ul>

        </div>
    );
}
