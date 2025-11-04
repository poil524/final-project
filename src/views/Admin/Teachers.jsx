import { useEffect, useState } from "react";
import axios from "axios";

export default function TeacherTable() {
    const [teachers, setTeachers] = useState([]);

    const fetchTeachers = async () => {
        const res = await axios.get("http://localhost:5000/api/users", { withCredentials: true });
        // Only include teachers (ignore status filtering here, deletion handles declined)
        const filtered = res.data.filter(u => u.isTeacher);
        setTeachers(filtered);
    };

    const approve = async (id) => {
        await axios.put(`http://localhost:5000/api/users/${id}/approve-teacher`, {}, { withCredentials: true });
        fetchTeachers();
    };

    const decline = async (id) => {
        // On decline, delete the teacher
        await axios.delete(`http://localhost:5000/api/users/${id}`, { withCredentials: true });
        fetchTeachers();
    };

    const deleteTeacher = async (id) => {
        await axios.delete(`http://localhost:5000/api/users/${id}`, { withCredentials: true });
        fetchTeachers();
    };

    useEffect(() => { fetchTeachers(); }, []);

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Teachers</h2>

            <table style={{ width: "100%", background: "#fff", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "#e5e7eb" }}>
                        <th style={{ padding: 8, textAlign: "left" }}>Username</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Email</th>
                        <th style={{ padding: 8 }}>Action</th>
                    </tr>
                </thead>

                <tbody>
                    {teachers.map(t => (
                        <tr key={t._id} style={{ borderBottom: "1px solid #ddd" }}>
                            <td style={{ padding: 8 }}>{t.username}</td>
                            <td style={{ padding: 8 }}>{t.email}</td>
                            <td style={{ padding: 8, textAlign: "center" }}>
                                {t.status === "pending" && (
                                    <>
                                        <button
                                            onClick={() => approve(t._id)}
                                            style={{
                                                background: "#16a34a",
                                                color: "#fff",
                                                border: "none",
                                                padding: "4px 8px",
                                                borderRadius: 4,
                                                cursor: "pointer"
                                            }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => decline(t._id)}
                                            style={{
                                                background: "#b91c1c",
                                                color: "#fff",
                                                border: "none",
                                                padding: "4px 8px",
                                                borderRadius: 4,
                                                cursor: "pointer",
                                                marginLeft: 8
                                            }}
                                        >
                                            Decline
                                        </button>
                                    </>
                                )}
                                {t.status === "approved" && (
                                    <button
                                        onClick={() => deleteTeacher(t._id)}
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
                                )}
                            </td>
                        </tr>
                    ))}
                    {teachers.length === 0 && (
                        <tr>
                            <td colSpan="3" style={{ padding: 12, textAlign: "center" }}>No teachers</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
