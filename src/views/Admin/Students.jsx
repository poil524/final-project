import { useEffect, useState } from "react";
import axios from "axios";

export default function Students() {
    const [students, setStudents] = useState([]);

    const fetchStudents = async () => {
        const res = await axios.get("http://localhost:5000/api/users", {
            withCredentials: true
        });
        // filter only students
        const filtered = res.data.filter(u => u.isTeacher === false);
        setStudents(filtered);
    };

    const handleDelete = async (id) => {
        await axios.delete(`http://localhost:5000/api/users/${id}`, { withCredentials: true });
        fetchStudents();
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Students</h2>

            <table style={{ width: "100%", background: "#fff", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "#e5e7eb" }}>
                        <th style={{ padding: 8, textAlign: "left" }}>Username</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Email</th>
                        <th style={{ padding: 8 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => (
                        <tr key={s._id} style={{ borderBottom: "1px solid #ddd" }}>
                            <td style={{ padding: 8 }}>{s.username}</td>
                            <td style={{ padding: 8 }}>{s.email}</td>
                            <td style={{ padding: 8, textAlign: "center" }}>
                                <button
                                    onClick={() => handleDelete(s._id)}
                                    style={{
                                        background: "#b91c1c",
                                        color: "#fff",
                                        border: "none",
                                        padding: "4px 8px",
                                        borderRadius: 4,
                                        cursor: "pointer"
                                    }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {students.length === 0 && (
                        <tr><td colSpan="3" style={{ padding: 12, textAlign: "center" }}>No students</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
