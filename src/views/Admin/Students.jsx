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
                        <th>Username</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {students.map(s => (
                        <tr key={s._id}>
                            <td>{s.username}</td>
                            <td>{s.email}</td>
                            <td className="actions">
                                <button onClick={() => handleDelete(s._id)}>Delete</button>
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
