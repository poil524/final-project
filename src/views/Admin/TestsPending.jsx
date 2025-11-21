import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import "./Admin.css";

export default function PendingTests() {
    const [tests, setTests] = useState([]);
const navigate = useNavigate();   

    const fetchTests = async () => {
        const res = await axios.get("http://localhost:5000/api/tests", { withCredentials: true });
        const pending = res.data.filter(t => t.isApproved === false);
        setTests(pending);
    };

const approveTest = async (id) => {
    await axios.put(
        `http://localhost:5000/api/tests/${id}/approve`,
        {},
        { withCredentials: true }
    );
    fetchTests();
};


    const deleteTest = async (id) => {
        await axios.delete(`http://localhost:5000/api/tests/${id}`, { withCredentials: true });
        fetchTests();
    };

    useEffect(() => { fetchTests(); }, []);

    return (
        <div>
            <h2 className="title">Pending Tests</h2>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Created By</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {tests.map(t => (
                        <tr key={t._id}
                        onClick={() => navigate(`/tests/${t._id}`)}   // ← navigate to test
                            className="clickable-row"
                            >
                            <td>{t.name}</td>
                            <td>{t.type}</td>
                            <td>{t.createdBy?.username || "Unknown"}</td>
                            <td
                                className="actions"
                                onClick={(e) => e.stopPropagation()}  // ← prevent row navigation
                            >
                                <button onClick={() => approveTest(t._id)}>Approve</button>
                                <button onClick={() => deleteTest(t._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}

                    {tests.length === 0 && (
                        <tr>
                            <td colSpan="4" className="no-students">No pending tests</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
