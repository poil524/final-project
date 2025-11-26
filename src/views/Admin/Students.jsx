import { useEffect, useState } from "react";
import axios from "axios";
import "./Admin.css";

export default function Students() {
    const [students, setStudents] = useState([]);

    const fetchStudents = async () => {
        const res = await axios.get("http://localhost:5000/api/users", { withCredentials: true });
        const filtered = res.data.filter(u => u.isTeacher === false);
        setStudents(filtered);
    };

    const handleDelete = async (id) => {
        await axios.delete(`http://localhost:5000/api/users/${id}`, { withCredentials: true });
        fetchStudents();
    };

    useEffect(() => { fetchStudents(); }, []);

    return (
        <div>
            <h2 className="title">Students</h2>

            <table>
                <thead>
                    <tr>
                        <th className="name-col">Username</th>
                        <th className="mail-col">Email</th>
                        <th className="empty-col"></th>
                        <th className="actions">Action</th>
                    </tr>
                </thead>

                <tbody>
                    {students.map(s => (
                        <tr key={s._id}>
                            <td className="name-col">{s.username}</td>
                            <td className="mail-col">{s.email}</td>
                            <td className="empty-col"></td>
                            <td className="actions">
                                <button className="delete" onClick={() => handleDelete(s._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                    {students.length === 0 && (
                        <tr>
                            <td colSpan="3" className="no-students">No students</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
