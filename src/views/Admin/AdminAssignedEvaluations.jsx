import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminAssignedEvaluations() {
    const [evaluations, setEvaluations] = useState([]);
    const [teachers, setTeachers] = useState([]);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            // Fetch assigned evaluations
            const evalRes = await axios.get(
                "http://localhost:5000/api/users/admin/requests/evaluations/assigned",
                { withCredentials: true }
            );
            setEvaluations(evalRes.data);

            // Fetch all approved teachers
            const teachersRes = await axios.get(
                "http://localhost:5000/api/users/teachers",
                { withCredentials: true }
            );
            setTeachers(teachersRes.data.filter(t => t.status === "approved"));
        } catch (err) {
            console.error("Failed to load assigned evaluations:", err);
        }
    };

    const assignTeacher = async (evaluationId, teacherId) => {
        try {
            await axios.put(
                `http://localhost:5000/api/users/${evaluationId}/assign`,
                { teacherId },
                { withCredentials: true }
            );
            load(); // reload table
        } catch (err) {
            console.error("Failed to assign teacher:", err);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Assigned Evaluation Requests</h2>

            {evaluations.length === 0 ? (
                <p>No assigned evaluations.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Created At</th>
                            <th>Status</th>
                            <th>Assigned At</th>
                            <th>Assigned Teacher</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evaluations.map(ev => (
                            <tr key={ev._id} style={{ borderBottom: "1px solid #ddd" }}>
                                <td>{ev.student?.username}</td>
                                <td>{new Date(ev.createdAt).toLocaleString()}</td>
                                <td>{ev.status}</td>
                                <td>{ev.assignedAt ? new Date(ev.assignedAt).toLocaleString() : "-"}</td>
                                <td>
                                    <select
                                        value={ev.assignedTeacher?._id || ""}
                                        onChange={(e) => assignTeacher(ev._id, e.target.value)}
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => (
                                            <option key={t._id} value={t._id}>
                                                {t.username}
                                            </option>
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
