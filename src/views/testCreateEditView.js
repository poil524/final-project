import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const TestCreateEditView = () => {
    const { id } = useParams(); // if test is exist, edit mode
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [testData, setTestData] = useState({
        type: "reading",
        name: "",
        reading: { sections: [] },
    });

    const BASE_URL = "http://localhost:5000";

    // Fetch existing test in edit mode
    useEffect(() => {
        if (id) {
            setLoading(true);
            axios
                .get(`${BASE_URL}/api/tests/${id}`)
                .then((res) => {
                    const data = res.data;
                    // Lock existing questions in edit mode
                    data.reading.sections.forEach((s) =>
                        s.questions.forEach((q) => (q.locked = true))
                    );
                    setTestData(data);
                })
                .catch((err) => {
                    console.error("Error fetching test:", err);
                    alert("Error loading test");
                })
                .finally(() => setLoading(false));
        }
    }, [id]);
    // Helpers
    const addSection = () => {
        const sectionIndex = testData.reading.sections.length + 1;
        setTestData((prev) => ({
            ...prev,
            reading: {
                sections: [
                    ...prev.reading.sections,
                    {
                        sectionTitle: `Section ${sectionIndex}`,
                        passages: [],
                        questions: [],
                    },
                ],
            },
        }));
    };

    const addPassage = (secIdx) => {
        const section = testData.reading.sections[secIdx];
        const nextHeader = String.fromCharCode(65 + section.passages.length);
        section.passages.push({ header: nextHeader, text: "" });

        updateSection(secIdx, section);
    };

    const addQuestion = (secIdx) => {
        const section = testData.reading.sections[secIdx];
        section.questions.push({
            type: "matching_heading",
            requirement: "",
            questionItems: [],
        });
        updateSection(secIdx, section);
    };

    const addQuestionItem = (secIdx, qIdx) => {
        const section = testData.reading.sections[secIdx];
        const question = section.questions[qIdx];
        const nextIndex = question.questionItems.length + 1;
        question.questionItems.push({
            index: nextIndex,
            text: "",
            options: [],
            answer: "",
        });
        section.questions[qIdx] = question;
        updateSection(secIdx, section);
    };

    const addImage = (secIdx) => {
        const section = testData.reading.sections[secIdx];
        section.images = section.images || [];
        section.images.push({ url: "" });
        updateSection(secIdx, section);
    };

    const updateSection = (secIdx, updatedSection) => {
        setTestData((prev) => {
            const sections = [...prev.reading.sections];
            sections[secIdx] = updatedSection;
            return { ...prev, reading: { sections } };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (id) {
                const res = await axios.put(`${BASE_URL}/api/tests/${id}`, testData);
                alert("Test updated successfully");
                console.log("Updated test:", res.data);
            } else {
                const res = await axios.post(`${BASE_URL}/api/tests`, testData);
                alert("Test created successfully");
                console.log("Created test:", res.data);
            }
            navigate("/tests"); // redirect
        } catch (err) {
            console.error("Error saving test:", err);
            alert("Error saving test");
        }
    };

    if (loading) return <div>Loading...</div>;


    return (
        <div>
            <h1>{id ? "Edit Test" : "Create New Test"}</h1>
            <form onSubmit={handleSubmit}>
                <label>Test Type: </label>
                <select value={testData.type} disabled>
                    <option value="reading">Reading</option>
                </select>
                <br />

                <label>Test Name: </label>
                <input
                    type="text"
                    value={testData.name}
                    onChange={(e) => setTestData({ ...testData, name: e.target.value })}
                />
                <br />

                <button type="button" onClick={addSection}>
                    Add Section
                </button>

                {testData.reading.sections.map((section, secIdx) => (
                    <div
                        key={secIdx}
                        style={{ border: "1px solid gray", padding: "10px", margin: "10px" }}
                    >
                        <h2>{section.sectionTitle}</h2>
                        <label>Section Title: </label>
                        <input
                            type="text"
                            value={section.sectionTitle}
                            onChange={(e) => {
                                const updatedSection = { ...section, sectionTitle: e.target.value };
                                updateSection(secIdx, updatedSection);
                            }}
                        />
                        <br />

                        <h3>Passages</h3>

                        {section.passages.map((p, pIdx) => (
                            <div key={pIdx}>
                                <b> {p.header}</b>
                                <textarea
                                    value={p.text}
                                    onChange={(e) => {
                                        const updatedPassages = [...section.passages];
                                        updatedPassages[pIdx] = { ...p, text: e.target.value };
                                        updateSection(secIdx, { ...section, passages: updatedPassages });
                                    }}
                                />
                            </div>
                        ))}
                        <button type="button" onClick={() => addPassage(secIdx)}>
                            Add Passage
                        </button>
                        <h3>Pictures</h3>
                        {section.images?.map((img, imgIdx) => (
                            <div key={imgIdx}>
                                <input
                                    type="text"
                                    placeholder="Image URL"
                                    value={img.url}
                                    onChange={(e) => {
                                        const updatedImages = [...section.images];
                                        updatedImages[imgIdx] = { ...img, url: e.target.value };
                                        updateSection(secIdx, { ...section, images: updatedImages });
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updatedImages = section.images.filter((_, i) => i !== imgIdx);
                                        updateSection(secIdx, { ...section, images: updatedImages });
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addImage(secIdx)}>Add Picture</button>
                        <h3>Questions</h3>
                        {section.questions.map((q, qIdx) => (
                            <div
                                key={qIdx}
                                style={{
                                    border: "1px dashed gray",
                                    margin: "5px",
                                    padding: "5px",
                                }}
                            >
                                <label>Type: </label>
                                <select
                                    value={q.type}
                                    onChange={(e) => {
                                        const updatedQ = { ...q, type: e.target.value };
                                        const updatedQuestions = [...section.questions];
                                        updatedQuestions[qIdx] = updatedQ;
                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                    }}
                                >
                                    <option value="matching_heading">Matching Heading</option>
                                    <option value="multiple_choice">Multiple Choice</option>
                                </select>
                                <br />

                                <label>Requirement: </label>
                                <input
                                    type="text"
                                    value={q.requirement}
                                    onChange={(e) => {
                                        const updatedQ = { ...q, requirement: e.target.value };
                                        const updatedQuestions = [...section.questions];
                                        updatedQuestions[qIdx] = updatedQ;
                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                    }}
                                />
                                <br />

                                <button type="button" onClick={() => addQuestionItem(secIdx, qIdx)}>
                                    Add Question Item
                                </button>

                                {q.questionItems.map((item, itemIdx) => (
                                    <div key={itemIdx} style={{ marginLeft: "15px" }}>
                                        <b>{item.index}. </b>
                                        <input
                                            type="text"
                                            placeholder="Question Text"
                                            value={item.text}
                                            onChange={(e) => {
                                                const updatedItems = [...q.questionItems];
                                                updatedItems[itemIdx] = {
                                                    ...item,
                                                    text: e.target.value,
                                                };
                                                const updatedQ = { ...q, questionItems: updatedItems };
                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;
                                                updateSection(secIdx, {
                                                    ...section,
                                                    questions: updatedQuestions,
                                                });
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updatedItems = q.questionItems.filter((_, i) => i !== itemIdx);
                                                const updatedQ = { ...q, questionItems: updatedItems };

                                                // also filter out its answer if one exists
                                                const updatedAnswers = (q.answers || []).filter(a => a.index !== item.index);
                                                updatedQ.answers = updatedAnswers;

                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;
                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                            }}
                                        >
                                            Remove Item
                                        </button>

                                        {q.type === "multiple_choice" && (
                                            <div>
                                                {item.options.map((opt, optIdx) => (
                                                    <div key={optIdx}>
                                                        <input
                                                            type="text"
                                                            placeholder={`Option ${optIdx + 1}`}
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const updatedOptions = [...item.options];
                                                                updatedOptions[optIdx] = e.target.value;
                                                                const updatedItems = [...q.questionItems];
                                                                updatedItems[itemIdx] = { ...item, options: updatedOptions };
                                                                const updatedQ = { ...q, questionItems: updatedItems };
                                                                const updatedQuestions = [...section.questions];
                                                                updatedQuestions[qIdx] = updatedQ;
                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updatedOptions = item.options.filter((_, i) => i !== optIdx);
                                                                const updatedItems = [...q.questionItems];
                                                                updatedItems[itemIdx] = { ...item, options: updatedOptions };
                                                                const updatedQ = { ...q, questionItems: updatedItems };
                                                                const updatedQuestions = [...section.questions];
                                                                updatedQuestions[qIdx] = updatedQ;
                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = {
                                                            ...item,
                                                            options: [...item.options, ""],
                                                        };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                >
                                                    Add Option
                                                </button>
                                            </div>
                                        )}
                                        {q.type === "multiple_choice" && (
                                            <div>
                                                <label>Select Correct Answer: </label>
                                                {item.options.map((opt, optIdx) => (
                                                    <label key={optIdx}>
                                                        <input
                                                            type="radio"
                                                            name={`correct_${secIdx}_${qIdx}_${item.index}`}
                                                            value={opt}
                                                            checked={q.answers?.find(a => a.index === item.index)?.value === opt}
                                                            onChange={(e) => {
                                                                const updatedAnswers = q.answers ? [...q.answers] : [];
                                                                const existing = updatedAnswers.find(a => a.index === item.index);
                                                                if (existing) existing.value = e.target.value;
                                                                else updatedAnswers.push({ index: item.index, value: e.target.value, sourceText: ""  });
                                                                const updatedQ = { ...q, answers: updatedAnswers };
                                                                const updatedQuestions = [...section.questions];
                                                                updatedQuestions[qIdx] = updatedQ;
                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                            }}
                                                        />
                                                        {opt || `Option ${optIdx + 1}`}
                                                    </label>
                                                ))}
                                            </div>
                                        )}


                                        {q.type === "matching_heading" && (
                                            <>
                                                <select
                                                    value={q.answers?.find(a => a.index === item.index)?.value || ""}
                                                    onChange={(e) => {
                                                        const updatedAnswers = q.answers ? [...q.answers] : [];
                                                        const existing = updatedAnswers.find(a => a.index === item.index);
                                                        if (existing) existing.value = e.target.value;
                                                        else updatedAnswers.push({ index: item.index, value: e.target.value, sourceText: "" });
                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                >
                                                    <option value="">Select Correct Paragraph</option>
                                                    {section.passages.map((p) => (
                                                        <option key={p.header} value={p.header}>
                                                            {p.header}
                                                        </option>
                                                    ))}
                                                </select>        
                                            </>
                                        )}

                                        {/* New sourceText input */}
                                                <input
                                                    type="text"
                                                    placeholder="Answer comes from..."
                                                    value={q.answers?.find(a => a.index === item.index)?.sourceText || ""}
                                                    onChange={(e) => {
                                                        const updatedAnswers = q.answers ? [...q.answers] : [];
                                                        const existing = updatedAnswers.find(a => a.index === item.index);
                                                        if (existing) existing.sourceText = e.target.value;
                                                        else updatedAnswers.push({ index: item.index, value: "", sourceText: e.target.value });
                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                />
                                    </div>
                                ))}
                            </div>
                        ))}
                        <button type="button" onClick={() => addQuestion(secIdx)}>
                            Add Question
                        </button>

                    </div>
                ))
                }

                <br />
                <button type="submit">{id ? "Update Test" : "Save Test"}</button>
            </form >
        </div >
    );
};

export default TestCreateEditView;
