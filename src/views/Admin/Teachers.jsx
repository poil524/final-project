import { useEffect, useState } from "react";
import axios from "axios";
import "./Admin.css";

export default function TeacherTable() {
    const [teachers, setTeachers] = useState([]);

    const fetchTeachers = async () => {
        const res = await axios.get("http://localhost:5000/api/users", { withCredentials: true });
        const filtered = res.data.filter(u => u.isTeacher);
        setTeachers(filtered);
    };

    const approve = async (id) => {
        await axios.put(`http://localhost:5000/api/users/${id}/approve-teacher`, {}, { withCredentials: true });
        fetchTeachers();
    };

    const decline = async (id) => {
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
            <h2 className="title">Teachers</h2>

            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>
                    {teachers.map(t => (
                        <tr key={t._id}>
                            <td>{t.username}</td>
                            <td>{t.email}</td>
                            <td className="actions">
                                {t.status === "pending" && (
                                    <>
                                        <button className="approve" onClick={() => approve(t._id)}>Approve</button>
                                        <button className="decline" onClick={() => decline(t._id)}>Decline</button>
                                    </>
                                )}
                                {t.status === "approved" && (
                                    <button className="delete" onClick={() => deleteTeacher(t._id)}>Delete</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {teachers.length === 0 && (
                        <tr>
                            <td colSpan="3" className="no-teachers">No teachers</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
