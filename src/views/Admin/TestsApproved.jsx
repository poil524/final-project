import { useEffect, useState } from "react";
import axios from "axios";
import "./Admin.css";

export default function ApprovedTests() {
    const [tests, setTests] = useState([]);

    const fetchTests = async () => {
        const res = await axios.get("http://localhost:5000/api/tests", { withCredentials: true });
        const approved = res.data.filter(t => t.isApproved === true);
        setTests(approved);
    };

    const deleteTest = async (id) => {
        await axios.delete(`http://localhost:5000/api/tests/${id}`, { withCredentials: true });
        fetchTests();
    };

    useEffect(() => { fetchTests(); }, []);

    return (
        <div>
            <h2 className="title">Approved Tests</h2>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Created By</th>
                        <th>Students Taken</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {tests.map(t => (
                        <tr key={t._id}>
                            <td>{t.name}</td>
                            <td>{t.type}</td>
                            <td>{t.createdBy?.username || "Unknown"}</td>
                            <td>{t.studentsTaken}</td>
                            <td className="actions">
                                <button onClick={() => deleteTest(t._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}

                    {tests.length === 0 && (
                        <tr>
                            <td colSpan="5" className="no-students">No approved tests</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
