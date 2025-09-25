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

                    // Ensure previews are open in edit mode
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
            type: "matching_headings",
            requirement: "",
            questionItems: [],
            shuffle: false,
        });
        updateSection(secIdx, section);
    };

    const addQuestionItem = (secIdx, qIdx) => {
        const section = testData.reading.sections[secIdx];
        const question = section.questions[qIdx];

        // compute max index across all questions in this section
        const allItems = section.questions.flatMap(q => q.questionItems);
        const nextIndex = allItems.length + 1;

        let newItem = { index: nextIndex };

        switch (question.type) {
            case "multiple_choice":
                newItem = {
                    ...newItem,
                    text: "",
                    options: [],
                    answer: "",
                };
                break;

            case "matching_sentence_endings":
                newItem = {
                    ...newItem,
                    sentenceBegin: "",
                    sentenceEnd: "",
                    answer: "",
                };
                break;

            case "matching_features":
                newItem = {
                    ...newItem,
                    sentenceBegin: "",  // Questions
                    sentenceEnd: "",    // Features
                    answer: "",
                };
                break;

            case "matching_paragraph_information":
                newItem = {
                    ...newItem,
                    text: "",
                    answer: "",
                };
                break;

            case "matching_headings":
                // Use section passages to generate heading labels
                const headingLabel = section.passages[question.questionItems.length]
                    ? section.passages[question.questionItems.length].header
                    : String.fromCharCode(65 + question.questionItems.length); // fallback
                newItem = {
                    ...newItem,
                    text: "",
                    headingLabel,
                };
                break;

            default:
                newItem = { ...newItem, text: "" }; // safe fallback
        }

        question.questionItems.push(newItem);
        section.questions[qIdx] = question;
        updateSection(secIdx, section);
    };

    // Re-index question item after delete 
    const reindexItems = (section) => {
        let idx = 1;
        section.questions.forEach(q => {
            q.questionItems.forEach(item => {
                item.index = idx++;
            });
        });
        return section;
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
                index: item.index,
                value: labels[matchIdx].key,
                sourceText: question.answers?.find(a => a.index === item.index)?.sourceText || ""
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
    const shuffleParagraphInfo = (secIdx, qIdx) => {
        const section = testData.reading.sections[secIdx];
        const question = section.questions[qIdx];
        if (question.type !== "matching_paragraph_information") return;

        const items = [...question.questionItems];
        const shuffled = [...items].sort(() => Math.random() - 0.5);

        const labels = shuffled.map((item, i) => ({
            key: String.fromCharCode(65 + i),
            text: item.text
        }));

        const newAnswers = items.map(item => {
            const matchIdx = labels.findIndex(l => l.text === item.text);
            return {
                index: item.index,
                value: labels[matchIdx].key,
                sourceText: question.answers?.find(a => a.index === item.index)?.sourceText || ""
            };
        });

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
            index: item.index,
            value: labels[matchIdx]?.key || "",
            sourceText: question.answers?.find(a => a.index === item.index)?.sourceText || ""
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
            console.log(`Section ${secIdx + 1}:`, section.sectionTitle);
            section.questions.forEach((q, qIdx) => {
                console.log(`  Question ${qIdx + 1} (${q.type}):`, q);
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
                                        const updatedQ = { ...q, type: newType };

                                        if (newType === "matching_headings") {
                                            // Auto-generate question items based on section passages
                                            const items = section.passages.map((p, idx) => ({
                                                index: idx + 1,
                                                headingLabel: p.header, // Use passage header as label
                                                text: "", // empty text for the user to fill
                                            }));
                                            updatedQ.questionItems = items;
                                        } else {
                                            updatedQ.questionItems = []; // reset items for other types
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
                                </select>


                                <button
                                    type="button"
                                    style={{ marginLeft: "10px" }}
                                    onClick={() => {
                                        const updatedQuestions = section.questions.filter((_, i) => i !== qIdx);
                                        let updatedSection = { ...section, questions: updatedQuestions };
                                        updatedSection = reindexItems(updatedSection);
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

                                {q.type !== "matching_headings" && (
                                    <button type="button" onClick={() => addQuestionItem(secIdx, qIdx)}>
                                        Add Question Item
                                    </button>
                                )}

                                {q.questionItems.map((item, itemIdx) => (
                                    <div key={itemIdx} style={{ marginLeft: "15px" }}>
                                        <b>{item.index}. </b>
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
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Sentence Begin"
                                                    value={item.sentenceBegin || ""}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = {
                                                            ...item,
                                                            sentenceBegin: e.target.value
                                                        };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}

                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Sentence End"
                                                    value={item.sentenceEnd || ""}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = {
                                                            ...item,
                                                            sentenceEnd: e.target.value
                                                        };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {q.type === "matching_features" && (
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Questions"
                                                    value={item.sentenceBegin || ""}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = {
                                                            ...item,
                                                            sentenceBegin: e.target.value
                                                        };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}

                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Features"
                                                    value={item.sentenceEnd || ""}
                                                    onChange={(e) => {
                                                        const updatedItems = [...q.questionItems];
                                                        updatedItems[itemIdx] = {
                                                            ...item,
                                                            sentenceEnd: e.target.value
                                                        };
                                                        const updatedQ = { ...q, questionItems: updatedItems };
                                                        const updatedQuestions = [...section.questions];
                                                        updatedQuestions[qIdx] = updatedQ;
                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                    }}

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
                                                                else updatedAnswers.push({ index: item.index, value: e.target.value, sourceText: "" });
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

                                        {/* sourceText input */}
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
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updatedItems = q.questionItems.filter((_, i) => i !== itemIdx);
                                                const updatedQ = { ...q, questionItems: updatedItems };

                                                // filter out its answer if one exists
                                                const updatedAnswers = (q.answers || []).filter(a => a.index !== item.index);
                                                updatedQ.answers = updatedAnswers;

                                                const updatedQuestions = [...section.questions];
                                                updatedQuestions[qIdx] = updatedQ;

                                                // reindex after deletion
                                                let updatedSection = { ...section, questions: updatedQuestions };
                                                updatedSection = reindexItems(updatedSection);

                                                updateSection(secIdx, updatedSection);
                                            }}
                                        >
                                            Remove Item
                                        </button>
                                    </div>

                                ))}
                                {/* Outside loop */}
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
                                                {/* Answer key */}
                                                <div style={{ marginTop: "5px" }}>
                                                    <h6>Answer:</h6>
                                                    {q.answers.map((a) => {
                                                        const headingText = q.questionItems.find(item => item.index === a.index)?.text;
                                                        return (
                                                            <div key={a.index}>
                                                                {headingText}: {a.value}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
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
                                                <div style={{ marginTop: "5px" }}>
                                                    <h6>Answer Key:</h6>
                                                    {q.answers?.map((a) => {
                                                        const questionText = q.questionItems.find(it => it.index === a.index)?.text;
                                                        return (
                                                            <div key={a.index}>
                                                                {questionText}: {a.value}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
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
                                                        <b>{item.sentenceBegin}</b> →
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
                                                <div style={{ marginTop: "5px" }}>
                                                    <h6>Answer Key:</h6>
                                                    {q.answers.map(a => {
                                                        const textBegin = q.questionItems.find(item => item.index === a.index)?.sentenceBegin;
                                                        const textEnd = q.shuffledEnds.find(opt => opt.key === a.value)?.value;
                                                        return (
                                                            <div key={a.index}>
                                                                {textBegin} → {textEnd}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
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
                                                        <b>{item.sentenceBegin}</b> →
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
                                                <div style={{ marginTop: "5px" }}>
                                                    <h6>Answer Key:</h6>
                                                    {q.answers.map(a => {
                                                        const textBegin = q.questionItems.find(item => item.index === a.index)?.sentenceBegin;
                                                        const textEnd = q.shuffledEnds.find(opt => opt.key === a.value)?.value;
                                                        return (
                                                            <div key={a.index}>
                                                                {textBegin} → {textEnd}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
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
