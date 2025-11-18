import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminEvaluationRequests() {
    const [requests, setRequests] = useState([]);
    const [teachers, setTeachers] = useState([]);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            // Get pending evaluations (admin)
            const r1 = await axios.get(
                "http://localhost:5000/api/users/admin/requests/evaluations",
                { withCredentials: true }
            );

            // Get all teachers
            const r2 = await axios.get(
                "http://localhost:5000/api/users/teachers",
                { withCredentials: true }
            );

            setRequests(r1.data);
            setTeachers(r2.data.filter(t => t.status === "approved"));
        } catch (err) {
            console.error("Failed to load evaluations:", err);
        }
    };


    const assign = async (evaluationId, teacherId) => {
        await axios.put(
            `http://localhost:5000/api/users/${evaluationId}/assign`,
            { teacherId },
            { withCredentials: true }
        );
        load();
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Evaluation Requests</h2>
            {requests.length === 0 ? (
                <p>No pending evaluations.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Test Result</th>
                            <th>Assign Teacher</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(r => (
                            <tr key={r._id} style={{ borderBottom: "1px solid #ddd" }}>
                                <td>{r.student?.username}</td>
                                <td>{r.testResultId}</td>
                                <td>
                                    <select onChange={(e) => assign(r._id, e.target.value)}>
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => (
                                            <option key={t._id} value={t._id}>{t.username}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
