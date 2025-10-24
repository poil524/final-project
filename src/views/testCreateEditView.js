import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./TestCreateEditView.css";
import { Reorder, motion } from "framer-motion";
import { BiTrash } from "react-icons/bi";

axios.defaults.withCredentials = true;

const TestCreateEditView = () => {
    const { id } = useParams(); // if test is exist, edit mode
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const [testData, setTestData] = useState({
        type: "",
        name: "",
        sections: [],
    });

    const summaryRef = useRef({})
    const BASE_URL = "http://localhost:5000";

    useEffect(() => {
        if (!id) return; // skip if creating

        setLoading(true);
        axios
            .get(`${BASE_URL}/api/tests/${id}`)
            .then((res) => {
                const data = res.data;
                data.sections = data.sections || [];
                setTestData(data);
            })
            .catch((err) => {
                console.error("Error fetching test:", err);
                alert("Error loading test");
            })
            .finally(() => setLoading(false));
    }, [id]);

    // Create a blank test automatically based on route type
    useEffect(() => {
        if (id) return; // only for creation mode

        let type = "";
        if (location.pathname.includes("listening")) type = "listening";
        else if (location.pathname.includes("writing")) type = "writing";
        else if (location.pathname.includes("reading")) type = "reading";
        else if (location.pathname.includes("speaking")) type = "speaking";

        if (!type) return;

        let created = false;
        const createEmptyTest = async () => {
            if (created) return; // prevent duplicate runs
            created = true;

            try {
                const res = await axios.post(`${BASE_URL}/api/tests`, {
                    name: "Untitled Test",
                    type,
                    sections: [],
                });
                setTestData(res.data);
                navigate(`/edit/${res.data._id}`, { replace: true });
            } catch (err) {
                console.error("Error creating new test:", err);
            }
        };

        createEmptyTest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run only once



    // Helpers
    const sections = testData.sections || [];


    const addSection = () => {
        setTestData((prev) => {
            const newSectionIndex = (prev.sections?.length || 0) + 1;
            let newSection = { sectionTitle: `Section ${newSectionIndex}` };

            if (prev.type === "reading") {
                newSection = { ...newSection, passages: [], questions: [], images: "" };
            } else if (prev.type === "listening") {
                newSection = {
                    ...newSection,
                    audioKey: "",
                    transcript: "",
                    questions: [],
                    images: "",
                };
            } else if (prev.type === "writing") {
                newSection = {
                    ...newSection,
                    requirement: "",
                    questions: [],
                    images: "",
                };
            } else if (prev.type === "speaking") {
                newSection = {
                    ...newSection,
                    requirement: "",
                    questions: [],
                    images: "",
                };
            }

            return {
                ...prev,
                sections: [...(prev.sections || []), newSection],
            };
        });
    };


    // Sync question items for "matching_headings" questions in a section
    const syncMatchingHeadingsItems = (section) => {
        const updatedQuestions = section.questions?.map((q) => {
            if (q.type === "matching_headings") {
                const items = section.passages.map((p, idx) => {
                    const existing = q.questionItems?.[idx];
                    return {
                        id: existing ? existing.id : uuidv4(),
                        text: existing ? existing.text : "",
                    };
                });

                const answers = section.passages.map((p, idx) => {
                    const existing = q.answers?.[idx];
                    return {
                        id: existing ? existing.id : uuidv4(),
                        value: p.header,
                    };
                });

                return { ...q, questionItems: items, answers };
            }
            return q;
        });
        return { ...section, questions: updatedQuestions };
    };


    const addPassage = (secIdx) => {
        const section = testData.sections[secIdx];
        const nextHeader = String.fromCharCode(65 + (section.passages?.length || 0));
        section.passages = section.passages || [];
        section.passages.push({ header: nextHeader, text: "" });
        const updatedSection = syncMatchingHeadingsItems(section);
        updateSection(secIdx, updatedSection);
    };

    const addQuestion = (secIdx) => {
        setTestData((prev) => {
            const sections = [...(prev.sections || [])];
            const section = { ...sections[secIdx] };
            section.questions = [
                ...(section.questions || []),
                {
                    type: "multiple_choice",
                    requirement: "",
                    questionItems: [],
                },
            ];
            sections[secIdx] = section;
            return { ...prev, sections };
        });
    };

    const addQuestionItem = (secIdx, qIdx) => {
        setTestData((prev) => {
            const sections = [...(prev.sections || [])];
            const section = { ...sections[secIdx] };
            const question = { ...section.questions[qIdx] };
            let newItem = { id: uuidv4() };

            switch (question.type) {
                case "multiple_choice":
                    newItem = { ...newItem, text: "", options: [], answer: "" };
                    break;
                case "true_false_not_given":
                case "yes_no_not_given":
                case "short_answer":
                case "matching_sentence_endings":
                case "matching_features":
                case "matching_paragraph_information":
                    newItem = { ...newItem, text: "", answer: "" };
                    break;
                case "matching_headings":
                    if (prev.type === "reading") {
                        newItem = { ...newItem, text: "" };

                        const headingLabel =
                            section.passages?.[question.questionItems.length]
                                ? section.passages[question.questionItems.length].header
                                : String.fromCharCode(65 + question.questionItems.length);

                        question.answers = question.answers || [];
                        question.answers.push({ id: uuidv4(), value: headingLabel });
                    } else {
                        newItem = { ...newItem, text: "" };
                    }
                    break;
                default:
                    newItem = { ...newItem, text: "" };
            }

            question.questionItems = [...(question.questionItems || []), newItem];
            section.questions[qIdx] = question;
            sections[secIdx] = section;
            return { ...prev, sections };
        });
    };
    const updateSection = (secIdx, updatedSection) => {
        setTestData((prev) => {
            const sections = [...(prev.sections || [])];
            sections[secIdx] = updatedSection;
            return { ...prev, sections };
        });
    };
    const removeSection = (secIdx) => {
        const confirmed = window.confirm("Are you sure you want to delete this section?");
        if (!confirmed) return;

        setTestData((prev) => {
            const updatedSections = prev.sections.filter((_, i) => i !== secIdx);
            return { ...prev, sections: updatedSections };
        });
    };

    const removePassage = (secIdx, passageIdx) => {
        setTestData((prev) => {
            const sections = [...prev.sections];
            const section = { ...sections[secIdx] };
            section.passages = section.passages.filter((_, i) => i !== passageIdx);

            // sync matching_headings questions if needed
            const updatedSection = syncMatchingHeadingsItems(section);

            sections[secIdx] = updatedSection;
            return { ...prev, sections };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Before saving, testData:", JSON.stringify(testData, null, 2));

        try {
            if (id) {
                await axios.put(`${BASE_URL}/api/tests/${id}`, testData);
                alert("Test updated successfully");
            } else {
                await axios.post(`${BASE_URL}/api/tests`, testData);
                alert("Test created successfully");
            }
            navigate("/tests");
        } catch (err) {
            console.error("Error saving test:", err);
            alert("Error saving test");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="test-container">
            <h1 className="test-header">IELTS Test Creation</h1>
            <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ whiteSpace: "nowrap" }}>Test Name:</label>
                    <input
                        type="text"
                        value={testData.name}
                        onChange={(e) => setTestData({ ...testData, name: e.target.value })}
                    />
                </div>





                {sections.map((section, secIdx) => (
                    <div key={secIdx} className="section-card">
                        <div className="section-header">
                            <h2>{section.sectionTitle}</h2>
                            <button className="remove-button" onClick={() => removeSection(secIdx)}>
                                <BiTrash size={20} /> Remove Section
                            </button>
                        </div>

                        <div className="section-title-row">
                            <label>Section Title:</label>
                            <input
                                type="text"
                                value={section.sectionTitle}
                                onChange={(e) => {
                                    const updatedSection = { ...section, sectionTitle: e.target.value };
                                    updateSection(secIdx, updatedSection);
                                }}
                            />
                        </div>
                        <br />
                        {/* READING */}
                        {testData.type === "reading" && (
                            <div>
                                {section.passages.map((p, pIdx) => (
                                    <div key={pIdx}>
                                        <div className="passage-header">
                                            <b>Passage {p.header}</b>
                                            <button
                                                className="remove-button"
                                                onClick={() => removePassage(secIdx, pIdx)}
                                                title="Remove this passage"
                                            >
                                                <BiTrash size={16} />
                                            </button>
                                        </div>

                                        <textarea
                                            value={p.text}
                                            onChange={(e) => {
                                                const updatedPassages = [...section.passages];
                                                updatedPassages[pIdx] = { ...p, text: e.target.value };
                                                let updatedSection = { ...section, passages: updatedPassages };
                                                updatedSection = syncMatchingHeadingsItems(updatedSection);
                                                updateSection(secIdx, updatedSection);
                                            }}
                                        />


                                    </div>
                                ))}

                                <button type="button" onClick={() => addPassage(secIdx)}>
                                    Add Passage
                                </button>
                            </div>
                        )}
                        {/*LISTENING*/}
                        {testData.type === "listening" && (
                            <div>
                                <h3>Audio File</h3>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        const formData = new FormData();
                                        formData.append("audio", file);

                                        try {
                                            const res = await axios.post(
                                                "http://localhost:5000/api/tests/upload-audio",
                                                formData,
                                                { headers: { "Content-Type": "multipart/form-data" } }
                                            );

                                            // S3 returns a public URL in res.data.url
                                            const updatedSection = { ...section, audioKey: res.data.key };
                                            updateSection(secIdx, updatedSection);
                                            //await axios.put(`${BASE_URL}/api/tests/${testId}/sections/${section._id}`, updatedSection);
                                            console.log("Updated section after upload:", updatedSection);

                                        } catch (err) {
                                            console.error("Upload failed:", err);
                                            alert("Audio upload failed");
                                        }
                                    }}
                                />



                                <br />
                                <h3>Transcript</h3>
                                <textarea
                                    value={section.transcript || ""}
                                    onChange={(e) => {
                                        const updatedSection = { ...section, transcript: e.target.value };
                                        updateSection(secIdx, updatedSection);
                                    }}
                                    placeholder="Enter transcript text"
                                    rows={5}
                                    style={{ width: "100%" }}
                                />
                            </div>
                        )}
                        {/* WRITING */}
                        {testData.type === "writing" && (
                            <div>
                                <h3>Requirement</h3>
                                <textarea
                                    value={section.requirement || ""}
                                    onChange={(e) => {
                                        const updatedSection = { ...section, requirement: e.target.value };
                                        updateSection(secIdx, updatedSection);
                                    }}
                                    placeholder="Enter writing task requirement..."
                                    rows={5}
                                    style={{ width: "100%" }}
                                />
                            </div>
                        )}

                        <h3>Image</h3>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;

                                const formData = new FormData();
                                formData.append("image", file);
                                formData.append("testId", testData._id);
                                try {
                                    const res = await axios.post(
                                        "http://localhost:5000/api/tests/upload-image",
                                        formData,
                                        { headers: { "Content-Type": "multipart/form-data" } }
                                    );

                                    const key = res.data.key;

                                    // Update section in local state
                                    const updatedSection = { ...section, images: key };
                                    updateSection(secIdx, updatedSection);

                                    // Immediately persist to MongoDB
                                    await axios.put(`${BASE_URL}/api/tests/${testData._id}`, {
                                        ...testData,
                                        sections: testData.sections.map((s, i) => (i === secIdx ? updatedSection : s)),
                                    });

                                } catch (err) {
                                    console.error("Image upload failed:", err);
                                }
                            }}

                        />

                        {section.images && (
                            <div style={{ marginTop: "10px" }}>
                                <p>Uploaded Image Key: {section.images}</p>
                                <button
                                    type="button"
                                    onClick={() => updateSection(secIdx, { ...section, images: "" })}
                                >
                                    Remove Image
                                </button>
                            </div>
                        )}

                        <h3>Questions</h3>
                        {section.questions?.map((q, qIdx) => (
                            <div key={qIdx} className="question-card">
                                <label>Type: </label>
                                <select
                                    value={q.type}
                                    onChange={(e) => {
                                        const newType = e.target.value;
                                        let updatedQ = { ...q, type: newType };

                                        if (newType === "matching_headings" && testData.type === "reading") {
                                            const updatedSection = syncMatchingHeadingsItems({
                                                ...section,
                                                questions: section.questions?.map((qq, idx) =>
                                                    idx === qIdx ? { ...qq, type: newType } : qq
                                                ),
                                            });
                                            updateSection(secIdx, updatedSection);
                                            return;
                                        } else {
                                            updatedQ.questionItems = [];
                                        }

                                        const updatedQuestions = [...section.questions];
                                        updatedQuestions[qIdx] = updatedQ;
                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                    }}
                                >
                                    {testData.type === "reading" ? (
                                        <>
                                            <option value="matching_paragraph_information">Matching Paragraph Information</option>
                                            <option value="matching_headings">Matching Headings</option>
                                            <option value="matching_sentence_endings">Matching Sentence Endings</option>
                                            <option value="matching_features">Matching Features</option>
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="true_false_not_given">True/False/Not Given</option>
                                            <option value="yes_no_not_given">Yes/No/Not Given</option>
                                            <option value="short_answer">Short Answer</option>
                                            <option value="summary_completion">Summary Completion</option>
                                        </>
                                    ) : testData.type === "listening" ? (
                                        <>
                                            <option value="matching_features">Matching Features</option>
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="summary_completion">Summary Completion</option>
                                            <option value="sentence_completion">Sentence Completion</option>
                                            <option value="short_answer">Short Answer</option>
                                        </>
                                    ) : null}

                                </select>

                                <button
                                    type="button"
                                    style={{ marginLeft: "10px" }}
                                    onClick={() => {
                                        const updatedQuestions = section.questions.filter((_, i) => i !== qIdx);
                                        let updatedSection = { ...section, questions: updatedQuestions };
                                        updateSection(secIdx, updatedSection);
                                    }}
                                >
                                    Remove Question
                                </button>
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

                                {q.type !== "summary_completion" && (
                                    <button type="button" onClick={() => addQuestionItem(secIdx, qIdx)}>
                                        Add Question Item
                                    </button>
                                )}

                                {q.questionItems.map((item, itemIdx) => (
                                    <div key={itemIdx} style={{ marginLeft: "15px" }}>
                                        {q.type === "matching_paragraph_information" && (
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Question Text"
                                                    value={item.text}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = { ...item, text: e.target.value };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                />
                                                <select
                                                    value={q.answers?.find(a => a.id === item.id)?.value || ""}
                                                    onChange={(e) => {
                                                        const updatedAnswers = q.answers ? [...q.answers] : [];
                                                        const existing = updatedAnswers.find(a => a.id === item.id);
                                                        if (existing) {
                                                            existing.value = e.target.value;
                                                        } else {
                                                            updatedAnswers.push({ id: item.id, value: e.target.value, sourceText: "" });
                                                        }
                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                >
                                                    <option value="">-- Select Correct Paragraph --</option>
                                                    {section.passages.map((p) => (
                                                        <option key={p.header} value={p.header}>
                                                            {p.header}
                                                        </option>
                                                    ))}
                                                </select>

                                            </div>
                                        )}
                                        {q.type === "matching_headings" && (
                                            <div style={{ marginLeft: "15px" }}>

                                                <div key={item.id} style={{ marginLeft: "15px" }}>
                                                    <b>{String.fromCharCode(65 + itemIdx)}. </b>
                                                    <input
                                                        type="text"
                                                        placeholder="Question Text"
                                                        value={item.text}
                                                        onChange={(e) => {
                                                            const updatedItems = [...q.questionItems];
                                                            updatedItems[itemIdx] = { ...item, text: e.target.value };
                                                            const updatedQ = { ...q, questionItems: updatedItems };
                                                            const updatedQuestions = [...section.questions];
                                                            updatedQuestions[qIdx] = updatedQ;
                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                        }}
                                                    />
                                                </div>

                                            </div>
                                        )}



                                        {q.type === "matching_sentence_endings" && (
                                            <div key={item.id} style={{ marginBottom: "8px" }}>
                                                <input
                                                    type="text"
                                                    placeholder="Sentence Begin"
                                                    value={item.text || ""}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = { ...item, text: e.target.value };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                    style={{ marginRight: "5px", width: "50%" }}
                                                />

                                                <input
                                                    type="text"
                                                    placeholder="Correct Sentence End"
                                                    value={q.answers?.find(a => a.id === item.id)?.value || ""}
                                                    onChange={(e) => {
                                                        const updatedAnswers = q.answers ? [...q.answers] : [];
                                                        const existing = updatedAnswers.find(a => a.id === item.id);
                                                        if (existing) {
                                                            existing.value = e.target.value;
                                                        } else {
                                                            updatedAnswers.push({ id: item.id, value: e.target.value, sourceText: "" });
                                                        }
                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                    style={{ width: "45%" }}
                                                />
                                            </div>
                                        )}
                                        {q.type === "matching_features" && (
                                            <div style={{ marginBottom: "12px" }}>
                                                <label>{itemIdx + 1}. </label>
                                                <input
                                                    type="text"
                                                    placeholder="Question text"
                                                    value={item.text || ""}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = { ...item, text: e.target.value };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                    style={{ width: "60%", marginRight: "8px" }}
                                                />

                                                <select
                                                    value={q.answers?.find((a) => a.id === item.id)?.value || ""}
                                                    onChange={(e) => {
                                                        const updatedAnswers = [...(q.answers || [])];
                                                        const existing = updatedAnswers.find((a) => a.id === item.id);
                                                        if (existing) existing.value = e.target.value;
                                                        else
                                                            updatedAnswers.push({
                                                                id: item.id,
                                                                value: e.target.value,
                                                                sourceText: "",
                                                            });
                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                >
                                                    <option value="">-- Select Feature --</option>
                                                    {(q.features || []).map((f, i) => {
                                                        const label =
                                                            q.featureLabelType === "i"
                                                                ? ["i", "ii", "iii", "iv", "v", "vi", "vii"][i]
                                                                : String.fromCharCode(65 + i);
                                                        return (
                                                            <option key={i} value={f}>
                                                                {label}. {f}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        )}




                                        {q.type === "multiple_choice" && (
                                            <div>
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
                                                <label> Select Correct Answer: </label>
                                                {item.options.map((opt, idx) => (
                                                    <label key={idx} style={{ display: "block" }}>
                                                        <input
                                                            type="radio"
                                                            name={`mc_correct_${q.id}_${item.id}`}
                                                            value={opt}
                                                            checked={q.answers?.find(a => a.id === item.id)?.value === opt}
                                                            onChange={(e) => {
                                                                const updatedAnswers = [
                                                                    ...(q.answers || []).filter(a => a.id !== item.id),
                                                                    { id: item.id, value: e.target.value, sourceText: "" }
                                                                ];
                                                                const updatedQ = { ...q, answers: updatedAnswers };
                                                                const updatedQuestions = [...section.questions];
                                                                updatedQuestions[qIdx] = updatedQ;
                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                            }}
                                                        />
                                                        {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {q.type === "true_false_not_given" && (
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Statement"
                                                    value={item.text || ""}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = { ...item, text: e.target.value };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                />
                                                <select
                                                    value={q.answers?.find(a => a.id === item.id)?.value || ""}
                                                    onChange={(e) => {
                                                        const updatedAnswers = [
                                                            ...(q.answers || []).filter(a => a.id !== item.id),
                                                            { id: item.id, value: e.target.value, sourceText: "" }
                                                        ];
                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                >
                                                    <option value="">-- Select Answer --</option>
                                                    <option value="True">True</option>
                                                    <option value="False">False</option>
                                                    <option value="Not Given">Not Given</option>
                                                </select>
                                            </div>
                                        )}
                                        {q.type === "yes_no_not_given" && (
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Statement"
                                                    value={item.text || ""}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = { ...item, text: e.target.value };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                />
                                                <select
                                                    value={q.answers?.find(a => a.index === item.index)?.value || ""}
                                                    onChange={(e) => {
                                                        const updatedAnswers = [
                                                            ...(q.answers || []).filter(a => a.index !== item.index),
                                                            { id: uuidv4(), index: item.index, value: e.target.value }
                                                        ];
                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                >
                                                    <option value="">-- Correct Answer --</option>
                                                    <option value="Yes">Yes</option>
                                                    <option value="No">No</option>
                                                    <option value="Not Given">Not Given</option>
                                                </select>

                                            </div>
                                        )}
                                        {q.type === "short_answer" && (
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Question Text"
                                                    value={item.text || ""}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = { ...item, text: e.target.value };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Correct Answer"
                                                    value={q.answers?.find(a => a.id === item.id)?.value || ""}
                                                    onChange={(e) => {
                                                        const updatedAnswers = q.answers ? [...q.answers] : [];
                                                        const existing = updatedAnswers.find(a => a.id === item.id);
                                                        if (existing) {
                                                            existing.value = e.target.value;
                                                        } else {
                                                            updatedAnswers.push({ id: item.id, value: e.target.value, sourceText: "" });
                                                        }
                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Globally Component */}
                                        {/* sourceText input */}
                                        {q.type !== "summary_completion" && (
                                            <input
                                                type="text"
                                                placeholder="Answer comes from..."
                                                value={q.answers?.find(a => a.index === item.id)?.sourceText || ""}
                                                onChange={(e) => {
                                                    const updatedAnswers = q.answers ? [...q.answers] : [];
                                                    const existing = updatedAnswers.find(a => a.index === item.id);
                                                    if (existing) existing.sourceText = e.target.value;
                                                    else updatedAnswers.push({ index: item.id, value: "", sourceText: e.target.value });
                                                    const updatedQ = { ...q, answers: updatedAnswers };
                                                    const updatedQuestions = [...section.questions];
                                                    updatedQuestions[qIdx] = updatedQ;
                                                    updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                }}
                                            />
                                        )}

                                        {q.type !== "summary_completion" && q.type !== "summary_completion_list" && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updatedItems = q.questionItems.filter((_, i) => i !== itemIdx);
                                                    const updatedQ = { ...q, questionItems: updatedItems };

                                                    // filter out its answer if one exists
                                                    const updatedAnswers = (q.answers || []).filter(a => a.index !== item.id);
                                                    updatedQ.answers = updatedAnswers;

                                                    const updatedQuestions = [...section.questions];
                                                    updatedQuestions[qIdx] = updatedQ;

                                                    // reindex after deletion
                                                    let updatedSection = { ...section, questions: updatedQuestions };

                                                    updateSection(secIdx, updatedSection);
                                                }}
                                            >
                                                Remove Item
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {/* Outside loop */}
                                {q.type === "matching_features" && (
                                    <div>
                                        <h4>Matching Features Setup</h4>

                                        <label>Feature List Title: </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. List of countries"
                                            value={q.featureListTitle || ""}
                                            onChange={(e) => {
                                                const updatedQ = { ...q, featureListTitle: e.target.value };
                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;
                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                            }}
                                            style={{ width: "60%", marginBottom: "6px" }}
                                        />

                                        <br />
                                        <label>Label Type: </label>
                                        <select
                                            value={q.featureLabelType || "A"}
                                            onChange={(e) => {
                                                const updatedQ = { ...q, featureLabelType: e.target.value };
                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;
                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                            }}
                                            style={{ marginBottom: "6px" }}
                                        >
                                            <option value="A">A, B, C...</option>
                                            <option value="i">i, ii, iii...</option>
                                        </select>

                                        <h5>Feature List</h5>
                                        {(q.features || []).map((feature, fIdx) => {
                                            const label =
                                                q.featureLabelType === "i"
                                                    ? ["i", "ii", "iii", "iv", "v", "vi", "vii"][fIdx]
                                                    : String.fromCharCode(65 + fIdx);

                                            return (
                                                <div key={fIdx} style={{ marginBottom: "5px" }}>
                                                    <b>{label}.</b>
                                                    <input
                                                        type="text"
                                                        placeholder={`Feature ${label}`}
                                                        value={feature}
                                                        onChange={(e) => {
                                                            const updatedFeatures = [...q.features];
                                                            updatedFeatures[fIdx] = e.target.value;
                                                            const updatedQ = { ...q, features: updatedFeatures };
                                                            const updatedQuestions = [...section.questions];
                                                            updatedQuestions[qIdx] = updatedQ;
                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                        }}
                                                        style={{ width: "80%", marginLeft: "6px" }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedFeatures = q.features.filter((_, i) => i !== fIdx);
                                                            const updatedQ = { ...q, features: updatedFeatures };
                                                            const updatedQuestions = [...section.questions];
                                                            updatedQuestions[qIdx] = updatedQ;
                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                        }}
                                                        style={{ marginLeft: "6px" }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updatedFeatures = [...(q.features || []), ""];
                                                const updatedQ = { ...q, features: updatedFeatures };
                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;
                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                            }}
                                        >
                                            Add Feature
                                        </button>
                                    </div>
                                )}

                                {/*
                                {q.type === "summary_completion" && (
                                    <div style={{ marginTop: "10px" }}>
                                        <h4>Summary Text</h4>
                                        <textarea
                                            ref={summaryRef}
                                            rows={4}
                                            style={{ width: "100%" }}
                                            value={q.summary || ""}
                                            onChange={(e) => {
                                                const newText = e.target.value;
                                                const blankCount = (newText.match(/\[BLANK\]/g) || []).length;

                                                // Sync answers array length
                                                let answers = q.answers || [];
                                                if (blankCount > answers.length) {
                                                    for (let i = answers.length; i < blankCount; i++) {
                                                        answers.push({ id: uuidv4(), value: "", sourceText: "" });
                                                    }
                                                } else if (blankCount < answers.length) {
                                                    answers = answers.slice(0, blankCount);
                                                }

                                                const updatedQ = { ...q, summary: newText, answers };
                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;
                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!summaryRef.current) return;

                                                const textarea = summaryRef.current;
                                                const cursorPos = textarea.selectionStart; // get cursor position

                                                const updatedText =
                                                    (q.summary || "").slice(0, cursorPos) +
                                                    " [BLANK]" +
                                                    (q.summary || "").slice(cursorPos);

                                                // Increment answers array
                                                const updatedAnswers = [...(q.answers || []), { id: uuidv4(), value: "", sourceText: "" }];

                                                const updatedQ = { ...q, summary: updatedText, answers: updatedAnswers };
                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;
                                                updateSection(secIdx, { ...section, questions: updatedQuestions });

                                                // Move cursor after inserted [BLANK]
                                                setTimeout(() => {
                                                    textarea.selectionStart = textarea.selectionEnd = cursorPos + " [BLANK]".length;
                                                    textarea.focus();
                                                }, 0);
                                            }}
                                        >
                                            Add Blank
                                        </button>

                                        <h4>Answers</h4>
                                        
                                        {q.answers?.map((answer, idx) => (
                                            <div key={answer.id} style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                                                
                                                <input
                                                    type="text"
                                                    placeholder={`Answer for blank #${idx + 1}`}
                                                    value={answer.value}
                                                    onChange={(e) => {
                                                        const updatedAnswers = q.answers.map(a =>
                                                            a.id === answer.id ? { ...a, value: e.target.value } : a
                                                        );
                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                    style={{ flex: 1 }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Answer comes from..."
                                                    value={answer.sourceText}
                                                    onChange={(e) => {
                                                        const updatedAnswers = q.answers.map(a =>
                                                            a.id === answer.id ? { ...a, sourceText: e.target.value } : a
                                                        );
                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                    style={{ flex: 1, marginRight: "5px" }}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Remove blank from summary
                                                        let blankIndex = 0;
                                                        const updatedText = (q.summary || "").replace(/\[BLANK\]/g, () => {
                                                            blankIndex++;
                                                            return blankIndex === idx + 1 ? "" : "[BLANK]";
                                                        });

                                                        // Remove the answer
                                                        const updatedAnswers = q.answers.filter(a => a.id !== answer.id);

                                                        const updatedQ = { ...q, summary: updatedText, answers: updatedAnswers };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                    style={{ marginLeft: "5px" }}
                                                >
                                                    Remove Item
                                                </button>
                                            </div>
                                        ))}


                                        <h4>Preview</h4>
                                        <div style={{ border: "1px solid #ccc", padding: "5px", whiteSpace: "pre-wrap" }}>
                                            {(() => {
                                                let idx = 0;
                                                return (q.summary || "").replace(/\[BLANK\]/g, () => {
                                                    const val = q.answers?.[idx]?.value || "[BLANK]";
                                                    idx++;
                                                    return val;
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}
                                     */}
                                {q.type === "summary_completion" && (
                                    <div style={{ marginTop: "10px" }}>
                                        <h4>Summary Text</h4>
                                        <textarea
                                            ref={summaryRef}
                                            rows={4}
                                            style={{ width: "100%" }}
                                            value={q.summary || ""}
                                            onChange={(e) => {
                                                const newText = e.target.value;
                                                const blankCount = (newText.match(/\[BLANK\]/g) || []).length;

                                                // Sync answers array length
                                                let answers = q.answers || [];
                                                if (blankCount > answers.length) {
                                                    for (let i = answers.length; i < blankCount; i++) {
                                                        answers.push({ id: uuidv4(), value: "", sourceText: "" });
                                                    }
                                                } else if (blankCount < answers.length) {
                                                    answers = answers.slice(0, blankCount);
                                                }

                                                const updatedQ = { ...q, summary: newText, answers };
                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;
                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!summaryRef.current) return;

                                                const textarea = summaryRef.current;
                                                const cursorPos = textarea.selectionStart; // get cursor position

                                                const updatedText =
                                                    (q.summary || "").slice(0, cursorPos) +
                                                    " [BLANK]" +
                                                    (q.summary || "").slice(cursorPos);

                                                // Increment answers array
                                                const updatedAnswers = [...(q.answers || []), { id: uuidv4(), value: "", sourceText: "" }];

                                                const updatedQ = { ...q, summary: updatedText, answers: updatedAnswers };
                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;
                                                updateSection(secIdx, { ...section, questions: updatedQuestions });

                                                // Move cursor after inserted [BLANK]
                                                setTimeout(() => {
                                                    textarea.selectionStart = textarea.selectionEnd = cursorPos + " [BLANK]".length;
                                                    textarea.focus();
                                                }, 0);
                                            }}
                                        >
                                            Add Blank
                                        </button>

                                        <h4>Answers (drag to reorder)</h4>
                                        <Reorder.Group
                                            axis="y"
                                            values={q.answers || []}
                                            onReorder={(newOrder) => {
                                                const updatedQ = { ...q, answers: newOrder };
                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;
                                                updateSection(secIdx, { ...section, questions: updatedQuestions });

                                                // Keep [BLANK] count consistent
                                                let newSummary = q.summary || "";
                                                const blanks = newSummary.match(/\[BLANK\]/g) || [];
                                                if (blanks.length > 0) {
                                                    newSummary = newSummary.replace(/\[BLANK\]/g, () => "[TMP]");
                                                    newOrder.forEach(() => {
                                                        newSummary = newSummary.replace("[TMP]", "[BLANK]");
                                                    });
                                                }
                                                updatedQ.summary = newSummary;
                                            }}
                                        >
                                            {(q.answers || []).map((answer, idx) => (
                                                <Reorder.Item
                                                    key={answer.id}
                                                    value={answer}

                                                >
                                                    <motion.div
                                                        layout
                                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            marginBottom: "8px",
                                                            background: "#f9f9f9",
                                                            padding: "6px",
                                                            borderRadius: "5px",
                                                        }}
                                                    ></motion.div>
                                                    <input
                                                        type="text"
                                                        placeholder={`Answer for blank #${idx + 1}`}
                                                        value={answer.value}
                                                        onChange={(e) => {
                                                            const updatedAnswers = q.answers.map(a =>
                                                                a.id === answer.id ? { ...a, value: e.target.value } : a
                                                            );
                                                            const updatedQ = { ...q, answers: updatedAnswers };
                                                            const updatedQuestions = [...section.questions];
                                                            updatedQuestions[qIdx] = updatedQ;
                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                        }}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Answer comes from..."
                                                        value={answer.sourceText}
                                                        onChange={(e) => {
                                                            const updatedAnswers = q.answers.map(a =>
                                                                a.id === answer.id ? { ...a, sourceText: e.target.value } : a
                                                            );
                                                            const updatedQ = { ...q, answers: updatedAnswers };
                                                            const updatedQuestions = [...section.questions];
                                                            updatedQuestions[qIdx] = updatedQ;
                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                        }}
                                                        style={{ flex: 1, marginRight: "5px" }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            // Remove blank from summary
                                                            let blankIndex = 0;
                                                            const updatedText = (q.summary || "").replace(/\[BLANK\]/g, () => {
                                                                blankIndex++;
                                                                return blankIndex === idx + 1 ? "" : "[BLANK]";
                                                            });

                                                            // Remove the answer
                                                            const updatedAnswers = q.answers.filter(a => a.id !== answer.id);

                                                            const updatedQ = { ...q, summary: updatedText, answers: updatedAnswers };
                                                            const updatedQuestions = [...section.questions];
                                                            updatedQuestions[qIdx] = updatedQ;
                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                        }}
                                                        style={{ marginLeft: "5px" }}
                                                    >
                                                        Remove Item
                                                    </button>
                                                    <span style={{ cursor: "grab", padding: "4px 8px" }}>☰</span>
                                                </Reorder.Item>
                                            ))}
                                        </Reorder.Group>

                                        <h4>Preview</h4>
                                        <div
                                            style={{
                                                border: "1px solid #ccc",
                                                padding: "5px",
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {(() => {
                                                let idx = 0;
                                                return (q.summary || "").replace(/\[BLANK\]/g, () => {
                                                    const val = q.answers?.[idx]?.value || "[BLANK]";
                                                    idx++;
                                                    return val;
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                        ))}

                        <button type="button" onClick={() => addQuestion(secIdx)}>
                            Add Question
                        </button>
                    </div>
                ))
                }
                <div className="new-section-card" onClick={addSection}>
                    + Add New Section
                </div>

                <br />
                <button type="submit" className="save-button">Complete Creation</button>
            </form >
        </div >
    );
};

export default TestCreateEditView;
