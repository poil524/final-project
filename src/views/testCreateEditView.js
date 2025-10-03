import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

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
    const summaryRef = useRef({})
    const BASE_URL = "http://localhost:5000";
    useEffect(() => {
        if (id) {
            setLoading(true);
            axios
                .get(`${BASE_URL}/api/tests/${id}`)
                .then((res) => {
                    const data = res.data;

                    // Lock questions
                    data.reading.sections.forEach((s) =>
                        s.questions.forEach((q) => (q.locked = true))
                    );

                    data.reading.sections.forEach((section) => {
                        section.questions = section.questions.map((q) => {
                            if (q.type === "matching_headings") {
                                const items = section.passages.map((p, idx) => {
                                    const existing = q.questionItems?.[idx];
                                    return {
                                        index: idx + 1,
                                        headingLabel: p.header,
                                        text: existing ? existing.text : "",
                                        sourceText: existing ? existing.sourceText : "",
                                    };
                                });

                                return {
                                    ...q,
                                    questionItems: items,
                                    shuffle: true, // force preview open
                                    shuffledItems: q.shuffledItems || items.map((item, i) => ({
                                        key: String.fromCharCode(65 + i),
                                        text: item.text,
                                        headingLabel: item.headingLabel
                                    })),
                                };
                            }
                            return q;
                        });
                    });
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
    // Sync question items for "matching_headings" questions in a section
    const syncMatchingHeadingsItems = (section) => {
        const updatedQuestions = section.questions.map((q) => {
            if (q.type === "matching_headings") {
                const items = section.passages.map((p, idx) => {
                    // Keep existing text if it exists, otherwise empty
                    const existing = q.questionItems?.[idx];
                    return {
                        index: idx + 1,
                        headingLabel: p.header, // auto from passage header
                        text: existing ? existing.text : "",
                    };
                });
                return { ...q, questionItems: items };
            }
            return q;
        });
        return { ...section, questions: updatedQuestions };
    };



    const addPassage = (secIdx) => {
        const section = testData.reading.sections[secIdx];
        const nextHeader = String.fromCharCode(65 + section.passages.length);
        section.passages.push({ header: nextHeader, text: "" });
        // Sync matching_headings questions
        const updatedSection = syncMatchingHeadingsItems(section);
        updateSection(secIdx, updatedSection);

    };

    const addQuestion = (secIdx) => {
        const section = testData.reading.sections[secIdx];
        section.questions.push({
            type: "multiple_choice",
            requirement: "",
            questionItems: [],
            shuffle: false,
        });

        updateSection(secIdx, section);
    };


    const addQuestionItem = (secIdx, qIdx) => {
        const section = testData.reading.sections[secIdx];
        const question = section.questions[qIdx];

        let newItem = { id: uuidv4() }; // use id instead of index

        switch (question.type) {
            case "multiple_choice":
                newItem = { ...newItem, text: "", options: [], answer: "" };
                break;
            case "true_false_not_given":
            case "yes_no_not_given":
            case "short_answer":
                newItem = { ...newItem, text: "", answer: "" };
                break;
            case "matching_sentence_endings":
                newItem = { ...newItem, text: "", answer: "" };
                break;
            case "matching_features":
                newItem = { ...newItem, text: "", answer: "" };
                break;
            case "matching_paragraph_information":
                newItem = { ...newItem, text: "", answer: "" };
                break;
            case "matching_headings":
                const headingLabel = section.passages[question.questionItems.length]
                    ? section.passages[question.questionItems.length].header
                    : String.fromCharCode(65 + question.questionItems.length);
                newItem = { ...newItem, text: "", headingLabel };
                break;
            default:
                newItem = { ...newItem, text: "" };
        }

        question.questionItems.push(newItem);
        section.questions[qIdx] = question;
        updateSection(secIdx, section);
    };


    const addImage = (secIdx) => {
        const section = testData.reading.sections[secIdx];
        section.images = section.images || [];
        section.images.push({ url: "" });
        updateSection(secIdx, section);
    };

    // Shuffle Heading
    const shuffleHeadings = (secIdx, qIdx) => {
        const section = testData.reading.sections[secIdx];
        const question = section.questions[qIdx];
        if (question.type !== "matching_headings") return;

        const items = [...question.questionItems];
        const shuffled = items.sort(() => Math.random() - 0.5);

        // Map heading labels A,B,C...
        const labels = shuffled.map((item, i) => ({
            key: String.fromCharCode(65 + i),
            text: item.text,
            headingLabel: item.headingLabel
        }));

        // Generate answers linking question to shuffled heading
        const newAnswers = items.map((item, idx) => {
            const matchIdx = labels.findIndex(l => l.text === item.text);
            return {
                index: item.id,
                value: labels[matchIdx].key,
                sourceText: question.answers?.find(a => a.index === item.id)?.sourceText || ""
            };
        });
        // Save shuffledItems and answers permanently
        const updatedQ = {
            ...question,
            shuffle: true,
            shuffledItems: labels,
            answers: newAnswers,
        };

        const updatedQuestions = [...section.questions];
        updatedQuestions[qIdx] = updatedQ;
        updateSection(secIdx, { ...section, questions: updatedQuestions });
    };

    // Shuffle Paragraph Information
    const shuffleParagraphInfo = async (secIdx, qIdx) => {
        const section = testData.reading.sections[secIdx];
        const question = section.questions[qIdx];
        if (question.type !== "matching_paragraph_information") return;

        const items = [...question.questionItems];
        const shuffled = [...items].sort(() => Math.random() - 0.5);

        const labels = shuffled.map((item, i) => ({
            key: String.fromCharCode(65 + i),
            text: item.text
        }));

        const newAnswers = (question.answers || []).map(a => ({ ...a }));


        const updatedQ = {
            ...question,
            shuffle: true,
            shuffledItems: labels,
            answers: newAnswers,
        };

        const updatedQuestions = [...section.questions];
        updatedQuestions[qIdx] = updatedQ;
        const updatedSection = { ...section, questions: updatedQuestions };
        updateSection(secIdx, updatedSection);

        // persist to backend
        try {
            await axios.put(`http://localhost:5000/api/tests/${testData._id}`, {
                ...testData,
                reading: {
                    ...testData.reading,
                    sections: testData.reading.sections.map((s, i) =>
                        i === secIdx ? updatedSection : s
                    ),
                },
            });
        } catch (err) {
            console.error("Failed to save shuffle:", err);
        }
    };
    // Shuffle matching sentence endings & matching features
    const shuffleSentenceEndings = (secIdx, qIdx) => {
        const section = testData.reading.sections[secIdx];
        const question = section.questions[qIdx];
        if (question.type !== "matching_sentence_endings" && question.type !== "matching_features") return;

        const items = [...question.questionItems];

        // Shuffle endings
        const shuffledEnds = [...items.map(item => item.sentenceEnd)].sort(() => Math.random() - 0.5);

        // Map shuffled ends to letters a,b,c
        const labels = shuffledEnds.map((value, i) => ({
            key: String.fromCharCode(97 + i), // a,b,c
            value
        }));

        // Create permanent answers
        const newAnswers = items.map(item => {
            const matchIdx = labels.find(l => l.value === item.sentenceEnd);
            return {
                index: item.id,
                value: labels[matchIdx]?.key || "",
                sourceText: question.answers?.find(a => a.index === item.id)?.sourceText || ""
            };
        });

        const updatedQ = {
            ...question,
            shuffle: true,
            shuffledEnds: labels,
            answers: newAnswers,
        };

        const updatedQuestions = [...section.questions];
        updatedQuestions[qIdx] = updatedQ;
        updateSection(secIdx, { ...section, questions: updatedQuestions });
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
        testData.reading.sections.forEach((section, secIdx) => {
            section.questions.forEach((q, qIdx) => {
            });
        });
        try {
            if (id) {
                testData.reading.sections.forEach((section, secIdx) => {
                });
                const res = await axios.put(`${BASE_URL}/api/tests/${id}`, testData);
                alert("Test updated successfully");
                console.log("Updated test:", res.data);
            } else {
                testData.reading.sections.forEach((section, secIdx) => {
                });
                const res = await axios.post(`${BASE_URL}/api/tests`, testData);
                alert("Test created successfully");
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
                                        let updatedSection = { ...section, passages: updatedPassages };

                                        // Sync matching_headings questions
                                        updatedSection = syncMatchingHeadingsItems(updatedSection);

                                        updateSection(secIdx, updatedSection);
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
                                        const newType = e.target.value;
                                        let updatedQ = { ...q, type: newType };

                                        if (newType === "matching_headings") {
                                            const updatedSection = syncMatchingHeadingsItems({
                                                ...section,
                                                questions: section.questions.map((qq, idx) =>
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
                                    <option value="matching_paragraph_information">Matching Paragraph Information</option>
                                    <option value="matching_headings">Matching Headings</option>
                                    <option value="matching_sentence_endings">Matching Sentence Endings</option>
                                    <option value="matching_features">Matching Features</option>
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="true_false_not_given">True/False/Not Give</option>
                                    <option value="yes_no_not_given">Yes/No/Not Give</option>
                                    <option value="short_answer">Short Answer</option>
                                    <option value="summary_completion">Summary Completion</option>
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
                                            <div>
                                                <div key={itemIdx} style={{ marginLeft: "15px" }}>
                                                    <b>{item.headingLabel}: </b>
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
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Questions"
                                                    value={item.text || ""}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = {
                                                            ...item,
                                                            text: e.target.value
                                                        };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
style={{ marginRight: "5px", width: "50%" }}
        />
                                                <input
                                                    type="text"
                                                    placeholder="Correct Feature"
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


                                {q.type === "matching_headings" && (
                                    <div style={{ marginTop: "10px" }}>
                                        {/* Shuffle button */}
                                        <button type="button" onClick={() => shuffleHeadings(secIdx, qIdx)}>
                                            Shuffle
                                        </button>

                                        {/* Preview section */}
                                        {q.shuffledItems && (
                                            <div style={{ marginTop: "10px", padding: "5px", border: "1px solid #ccc" }}>
                                                <h5>Preview</h5>

                                                {/* Shuffled items with "Select Paragraph" dropdown */}
                                                {q.shuffledItems.map((item, idx) => (
                                                    <div key={idx} style={{ marginBottom: "8px" }}>
                                                        <label>
                                                            {idx + 1}. {item.text}{" "}
                                                            <select>
                                                                <option value="">-- Select Paragraph --</option>
                                                                {section.passages.map((p) => (
                                                                    <option key={p.header} value={p.header}>
                                                                        {p.header}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {q.type === "matching_paragraph_information" && (
                                    <div style={{ marginTop: "10px" }}>
                                        <button type="button" onClick={() => shuffleParagraphInfo(secIdx, qIdx)}>
                                            Shuffle
                                        </button>
                                        {q.shuffledItems && (
                                            <div style={{ marginTop: "10px", padding: "5px", border: "1px solid #ccc" }}>
                                                <h5>Preview</h5>
                                                {q.shuffledItems.map((item, idx) => (
                                                    <div key={idx}>
                                                        {idx + 1}. {item.text} →
                                                        <select>
                                                            <option value="">-- Select Paragraph --</option>
                                                            {section.passages.map((p) => (
                                                                <option key={p.header} value={p.header}>
                                                                    {p.header}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {q.type === "matching_sentence_endings" && (
                                    <div style={{ marginTop: "10px" }}>
                                        <button type="button" onClick={() => shuffleSentenceEndings(secIdx, qIdx)}>
                                            Shuffle
                                        </button>
                                        {q.shuffledEnds && (
                                            <div style={{ marginTop: "10px", padding: "5px", border: "1px solid #ccc" }}>
                                                <h5>Preview</h5>
                                                {q.questionItems.map((item, idx) => (
                                                    <div key={idx}>
                                                        <b>{item.text}</b> →
                                                        <select value="">
                                                            <option value="">Select Ending</option>
                                                            {q.shuffledEnds.map((opt) => (
                                                                <option key={opt.key} value={opt.key}>
                                                                    {opt.value}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {q.type === "matching_features" && (
                                    <div style={{ marginTop: "10px" }}>
                                        <button type="button" onClick={() => shuffleSentenceEndings(secIdx, qIdx)}>
                                            Shuffle
                                        </button>
                                        {q.shuffledEnds && (
                                            <div style={{ marginTop: "10px", padding: "5px", border: "1px solid #ccc" }}>
                                                <h5>Preview</h5>
                                                {q.questionItems.map((item, idx) => (
                                                    <div key={idx}>
                                                        <b>{item.text}</b>:
                                                        <select value="">
                                                            <option value="">Select Ending</option>
                                                            {q.shuffledEnds.map((opt) => (
                                                                <option key={opt.key} value={opt.key}>
                                                                    {opt.value}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                                
                                            </div>
                                        )}
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

                <br />
                <button type="submit">{id ? "Update Test" : "Save Test"}</button>
            </form >
        </div >
    );
};
export default TestCreateEditView;
