import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import EssayDisplay from "../EssayDisplay";

axios.defaults.withCredentials = true;

export default function EvaluationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const BASE_URL = "http://localhost:5000";

    const [request, setRequest] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/users/teacher`);
                const found = res.data.find((r) => r._id === id);

                if (!found) {
                    alert("Request not found or no longer assigned.");
                    navigate("/teacher/requests/evaluations");
                    return;
                }

                setRequest(found);
            } catch (err) {
                console.error("Error fetching request:", err);
                alert("Failed to load request.");
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [id, navigate]);

    const handleSubmit = async () => {
        if (!feedback.trim()) return alert("Feedback cannot be empty.");

        setSubmitting(true);
        try {
            await axios.put(`${BASE_URL}/api/users/${id}/complete`, {
                feedback,
                requirement: request.requirement || request.testResult?.requirement,
                answers: request.answers || request.testResult?.answers,
            });
            alert("Evaluation submitted successfully.");
            navigate("/teacher/requests");
        } catch (err) {
            console.error("Submit error:", err);
            alert("Failed to submit evaluation.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!request) return <div>Not found.</div>;

    const answers = request.answers || request.testResult?.answers || {};
    const requirement =
        request.requirement ||
        request.testResult?.requirement ||
        (answers[0] && answers[0].requirement);

    return (
        <div style={{ padding: "20px" }}>
            <h1>Evaluate</h1>
            <p><strong>Student:</strong> {request.student?.username || "N/A"}</p>


            <hr style={{ margin: "20px 0" }} />

            {/* Requirement */}
            {requirement && (
                <>
                    <h2>Requirement</h2>
                    <p>{requirement}</p>
                </>
            )}

            {/* Student Answers */}
            <h2>Student Answers</h2>
            {Object.keys(answers).length > 0 ? (
                Object.keys(answers).map((key) => {
                    const answer = answers[key];

                    // If answer is an object with a content field (essay)
                    if (answer && typeof answer === "object" && answer.content) {
                        return (
                            <div key={key} style={{ marginBottom: "15px" }}>
                                <strong>{key}:</strong>
                                <EssayDisplay content={answer.content} />
                            </div>
                        );
                    }

                    // Otherwise render as plain text or JSON
                    return (
                        <div key={key} style={{ marginBottom: "15px" }}>
                            <strong>{key}:</strong> {typeof answer === "string" ? answer : JSON.stringify(answer)}
                        </div>
                    );
                })
            ) : (
                <p>No answers received.</p>
            )}


            <hr style={{ margin: "20px 0" }} />

            <h2>Write Feedback</h2>
            <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                style={{ width: "100%", minHeight: "150px", padding: "10px", fontSize: "15px" }}
                placeholder="Enter constructive evaluation feedback..."
            />

            <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ marginTop: "15px", padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
            >
                {submitting ? "Submitting..." : "Submit Evaluation"}
            </button>
        </div>
    );
}
