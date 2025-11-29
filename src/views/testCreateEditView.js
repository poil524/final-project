import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./TestCreateEditView.css";
import { Reorder, motion } from "framer-motion";

import useNavigationBlocker from "../components/NavigationBlocker";
import BlockingLoader from "../components/BlockingLoader";

import { BiTrash } from "react-icons/bi";
import { IoIosRemoveCircleOutline } from "react-icons/io";
import { MdExpandLess } from "react-icons/md";
import { MdModeEdit } from "react-icons/md";

axios.defaults.withCredentials = true;


const TestCreateEditView = () => {
    const { id } = useParams(); // if test is exist, edit mode
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [isTTSLoading, setIsTTSLoading] = useState(false);

    const [testData, setTestData] = useState({
        type: "",
        name: "",
        sections: [],
    });

    const summaryRef = useRef({});
    const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
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
    }, []); // run only once

    const [collapsedSections, setCollapsedSections] = useState({});
    const [collapsedQuestions, setCollapsedQuestions] = useState({});

    // Helpers
    const sections = testData.sections || [];
    const toggleSection = (secIdx) => {
        setCollapsedSections(prev => ({
            ...prev,
            [secIdx]: !prev[secIdx]
        }));
    };

    const toggleQuestion = (secIdx, qIdx) => {
        const key = `${secIdx}-${qIdx}`;
        setCollapsedQuestions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };


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

            let defaultReq = "";

            if (prev.type !== "speaking" && prev.type !== "writing") {
                defaultReq = defaultRequirements["multiple_choice"] || "";
            }


            section.questions = [
                ...(section.questions || []),
                {
                    id: uuidv4(),
                    type: "multiple_choice",
                    requirement: defaultReq,
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

    const defaultRequirements = {
        matching_paragraph_information:
            "Which paragraph contains the following information? Write the correct letter in boxes {START}-{END}.",

        matching_headings:
            "Choose the correct heading for each paragraph from the list of headings. Write the correct number in boxes {START}-{END}.",

        matching_sentence_endings:
            "Choose the correct ending from the list A–{LETTER_MAX}. Write the correct letter in boxes {START}-{END}.",

        matching_features:
            "Match the statements with the correct feature. Write the correct letter in boxes {START}-{END}.",

        multiple_choice:
            "Choose the correct answer. Write the correct letter in box {START}.",

        true_false_not_given:
            "Do the following statements agree with the information in the text? Write True, False, or Not Given in boxes {START}-{END}.",

        yes_no_not_given:
            "Do the following statements agree with the writer’s views? Write Yes, No, or Not Given in boxes {START}-{END}.",

        short_answer:
            "Answer the questions. Write your answers in boxes {START}-{END}.",

        summary_completion:
            "Complete the summary. Write ONE WORD ONLY for each answer in boxes {START}-{END}.",

        table_completion:
            "Complete the table. Write ONE WORD ONLY for each answer in boxes {START}-{END}.",

        diagram_completion:
            "Label the diagram. Write ONE WORD ONLY in boxes {START}-{END}."
    };
    const validateTest = (data) => {
        if (!data.name || !data.name.trim()) {
            return "Test name cannot be empty.";
        }

        if (data.name.trim().toLowerCase() === "untitled test") {
            return "Test name cannot be 'Untitled Test'. Please rename your test.";
        }

        if (!data.sections || data.sections.length === 0) {
            return "At least one section is required.";
        }

        for (let s = 0; s < data.sections.length; s++) {
            const section = data.sections[s];

            if (!section.sectionTitle || !section.sectionTitle.trim()) {
                return `Section ${s + 1} title cannot be empty.`;
            }

            // Listening section must have audio
            if (data.type === "listening") {
                if (!section.audioKey || !section.audioKey.trim()) {
                    return `Section ${s + 1} is missing an audio file.`;
                }
            }

            // Writing / Speaking: requirement must exist
            if ((data.type === "writing" || data.type === "speaking") && !section.requirement.trim()) {
                return `Section ${s + 1} requirement cannot be empty.`;
            }

            // Questions validation for Reading/Listening only
            if ((data.type === "reading" || data.type === "listening")) {
                if (!section.questions || section.questions.length === 0) {
                    return `Section ${s + 1} must contain at least one question.`;
                }
            }
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validateTest(testData);
        if (error) {
            alert(error);
            return;
        }
        try {
            // Always update since test already exists
            await axios.put(`${BASE_URL}/api/tests/${id}`, testData);

            alert("Test updated successfully");

            if (testData.type === "speaking") {
                try {
                    setIsTTSLoading(true);
                    const res = await axios.post(
                        `${BASE_URL}/api/tests/${id}/generate-speaking-audio`,
                        {},
                        { withCredentials: true }
                    );
                    console.log("TTS audio generated:", res.data);
                    alert("Speaking question audio generated successfully.");
                } catch (ttsErr) {
                    console.error("TTS generation failed:", ttsErr);
                    alert("Test saved, but failed to generate speaking audio.");
                }
                finally {
                    setIsTTSLoading(false);
                }
            }

            navigate(-1);
        } catch (err) {
            console.error("Error saving test:", err);
            alert("Error saving test");
        }
    };

    useNavigationBlocker(true);


    if (loading) return <div>Loading...</div>;


    return (
        <>
            <BlockingLoader visible={isTTSLoading} text="Generating speaking audio..." />

            <div className="test-container">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h1
                            contentEditable
                            suppressContentEditableWarning
                            className="editable"
                            onBlur={(e) => {
                                const newName = e.target.textContent.trim();
                                setTestData({ ...testData, name: newName });
                            }}
                        >
                            {testData.name || "Untitled Test"}
                        </h1>
                        <span className="editable-icon"><MdModeEdit /></span>
                    </div>
                    {sections.map((section, secIdx) => (
                        <div className="section-card">
                            <div className="section-header">

                                {/* LEFT SIDE — SECTION TITLE */}
                                <div className="section-title-wrapper">
                                    <h2
                                        contentEditable
                                        suppressContentEditableWarning
                                        className="editable"
                                        onBlur={(e) => {
                                            const newTitle = e.target.textContent.trim();
                                            updateSection(secIdx, { ...section, sectionTitle: newTitle });
                                        }}
                                    >
                                        {section.sectionTitle}
                                    </h2>
                                    <span className="editable-icon"><MdModeEdit /></span>

                                </div>

                                {/* RIGHT SIDE — BUTTONS */}
                                <div className="section-actions">
                                    <button
                                        type="button"
                                        className={`collapse-button ${collapsedSections[secIdx] ? "expanded" : ""}`}
                                        onClick={() => toggleSection(secIdx)}
                                        title={collapsedSections[secIdx] ? "Expand this section" : "Collapse this section"}
                                    >
                                        <MdExpandLess className="collapse-icon" />
                                    </button>

                                    <button
                                        type="button"
                                        className="remove-button"
                                        onClick={() => removeSection(secIdx)}
                                    >
                                        <BiTrash size={18} />
                                    </button>
                                </div>


                            </div>
                            <div
                                style={{
                                    marginTop: "4px",
                                    fontWeight: "600",
                                    opacity: 0.7
                                }}
                            >
                                Total question items in this section:{" "}
                                {section.questions?.reduce(
                                    (sum, q) => sum + (q.questionItems?.length || 0),
                                    0
                                )}
                            </div>
                            <br />
                            {!collapsedSections[secIdx] && (
                                <div className="section-body">
                                    {/* WRITING + SPEAKING*/}
                                    {(testData.type === "writing" || testData.type === "speaking") && (
                                        <div>
                                            <h3>Requirement</h3>
                                            <textarea
                                                value={section.requirement || ""}
                                                onChange={(e) => {
                                                    const updatedSection = { ...section, requirement: e.target.value };
                                                    updateSection(secIdx, updatedSection);
                                                }}
                                                placeholder={
                                                    testData.type === "writing"
                                                        ? "Enter writing task requirement..."
                                                        : "Enter speaking topic..."
                                                }
                                                rows={5}
                                                style={{ width: "100%" }}
                                            />
                                            <h3>Images</h3>
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
                                                        const updatedSection = { ...section, images: [...(section.images || []), key] };
                                                        updateSection(secIdx, updatedSection);

                                                        // Optionally persist to DB
                                                        await axios.put(`${BASE_URL}/api/tests/${testData._id}`, {
                                                            ...testData,
                                                            sections: testData.sections.map((s, i) => (i === secIdx ? updatedSection : s)),
                                                        });
                                                    } catch (err) {
                                                        console.error("Image upload failed:", err);
                                                    }
                                                }}
                                                className="tfng-file-input"
                                            />
                                        </div>
                                    )}
                                    {/* READING */}
                                    <div className="two-col">
                                        {testData.type === "reading" && (
                                            <div className="left-col">
                                                <div>
                                                    <h3>Passages</h3>
                                                    {section.passages.map((p, pIdx) => (
                                                        <div key={pIdx}>
                                                            <div className="passage-wrapper" key={pIdx}>
                                                                <div className="passage-floating-header">
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
                                                                    className="passage-textarea"
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
                                                        </div>
                                                    ))}
                                                    <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
                                                        <button type="button" className="secondary-button-small" onClick={() => addPassage(secIdx)}>
                                                            + Add Passage
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/*LISTENING*/}
                                        {testData.type === "listening" && (
                                            <div className="left-col">
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
                                                            const updatedSection = { ...section, audioKey: res.data.key };
                                                            updateSection(secIdx, updatedSection);
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
                                        <div className="right-col">
                                            {testData.type !== "writing" && (
                                                <>
                                                    <h3>Questions</h3>
                                                    <Reorder.Group
                                                        axis="y"
                                                        values={section.questions || []}
                                                        onReorder={(newList) => {
                                                            const updatedSection = { ...section, questions: newList };
                                                            updateSection(secIdx, updatedSection);
                                                        }}
                                                        style={{ listStyle: "none", padding: 0, margin: 0 }}
                                                    >
                                                        {(section.questions || []).map((q, qIdx) => (
                                                            <Reorder.Item
                                                                key={q.id || q._id || qIdx}
                                                                value={q}
                                                            >
                                                                <div className="question-card">

                                                                    <div className="question-card-header">
                                                                        {/* Collapse / Expand */}
                                                                        <button
                                                                            type="button"
                                                                            className={`collapse-button ${collapsedQuestions[`${secIdx}-${qIdx}`] ? "collapsed" : "expanded"}`}
                                                                            onClick={() => toggleQuestion(secIdx, qIdx)}
                                                                            title={
                                                                                collapsedQuestions[`${secIdx}-${qIdx}`]
                                                                                    ? "Expand this question"
                                                                                    : "Collapse this question"
                                                                            }
                                                                        >
                                                                            <MdExpandLess className="collapse-icon" />
                                                                        </button>

                                                                        {/* Remove Question */}
                                                                        <button
                                                                            type="button"
                                                                            className="remove-button"
                                                                            onClick={() => {
                                                                                const updatedQuestions = section.questions.filter((_, i) => i !== qIdx);
                                                                                const updatedSection = { ...section, questions: updatedQuestions };
                                                                                updateSection(secIdx, updatedSection);
                                                                            }}
                                                                            title="Remove this question"
                                                                        >
                                                                            <BiTrash size={16} />
                                                                        </button>
                                                                    </div>


                                                                    {testData.type !== "speaking" && (
                                                                        <>

                                                                            <div className="type-requirement">
                                                                                <div className="form-row">
                                                                                    <label>Question Type: </label>
                                                                                    <select
                                                                                        value={q.type}
                                                                                        onChange={(e) => {
                                                                                            const newType = e.target.value;
                                                                                            let updatedQ = { ...q, type: newType };

                                                                                            // Always reset question items when type changes
                                                                                            updatedQ.questionItems = [];

                                                                                            // Always update requirement based on the new type
                                                                                            if (defaultRequirements[newType]) {
                                                                                                updatedQ.requirement = defaultRequirements[newType];
                                                                                            }

                                                                                            // Special sync for matching_headings
                                                                                            if (newType === "matching_headings" && testData.type === "reading") {
                                                                                                const updatedSection = syncMatchingHeadingsItems({
                                                                                                    ...section,
                                                                                                    questions: section.questions.map((qq, idx) =>
                                                                                                        idx === qIdx ? { ...updatedQ } : qq
                                                                                                    ),
                                                                                                });
                                                                                                updateSection(secIdx, updatedSection);
                                                                                                return;
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
                                                                                                <option value="table_completion">Table Completion</option>
                                                                                                <option value="diagram_completion">Diagram Completion</option>
                                                                                            </>
                                                                                        ) : testData.type === "listening" ? (
                                                                                            <>
                                                                                                <option value="matching_features">Matching Features</option>
                                                                                                <option value="multiple_choice">Multiple Choice</option>
                                                                                                <option value="summary_completion">Summary Completion</option>
                                                                                                <option value="table_completion">Table Completion</option>
                                                                                                <option value="short_answer">Short Answer</option>
                                                                                                <option value="diagram_completion">Diagram Completion</option>
                                                                                            </>
                                                                                        ) : null}
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                    <br />
                                                                    {!collapsedQuestions[`${secIdx}-${qIdx}`] && (
                                                                        <div className="question-body">
                                                                            <div className="form-row">
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
                                                                            </div>
                                                                            <br />
                                                                            {/* Outside loop */}
                                                                            {q.type === "matching_headings" && (
                                                                                <div style={{ marginTop: "10px" }}>
                                                                                    <Reorder.Group
                                                                                        axis="y"
                                                                                        values={q.questionItems || []}
                                                                                        onReorder={(newItems) => {
                                                                                            const updatedQ = { ...q, questionItems: newItems };
                                                                                            const updatedQuestions = [...section.questions];
                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                        }}
                                                                                        style={{ listStyle: "none", margin: 0, padding: 0 }}
                                                                                    >
                                                                                        {(q.questionItems || []).map((item, itemIdx) => (
                                                                                            <Reorder.Item key={item.id} value={item}>
                                                                                                <div className="tfng-card">

                                                                                                    <div className="tfng-row">
                                                                                                        <b>{String.fromCharCode(65 + itemIdx)}.&nbsp;</b>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Heading text"
                                                                                                            value={item.text || ""}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedItems = [...q.questionItems];
                                                                                                                updatedItems[itemIdx] = { ...item, text: e.target.value };

                                                                                                                const updatedQ = { ...q, questionItems: updatedItems };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                            className="tfng-statement"
                                                                                                            style={{ flex: 1 }}
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </Reorder.Item>
                                                                                        ))}
                                                                                    </Reorder.Group>
                                                                                </div>
                                                                            )}

                                                                            {q.type === "matching_features" && (
                                                                                <div>
                                                                                    <h4>Matching Features Setup</h4>

                                                                                    {/* Feature List Title */}
                                                                                    <div style={{ display: "flex", alignItems: "center" }}>
                                                                                        <h5 style={{ width: "80px" }}>Title: </h5>
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
                                                                                            style={{ flex: 1 }}
                                                                                        />
                                                                                    </div>

                                                                                    {/* Label Type */}
                                                                                    <div style={{ display: "flex", alignItems: "center" }}>
                                                                                        <h5 style={{ width: "80px" }}>Label Type: </h5>
                                                                                        <select
                                                                                            value={q.featureLabelType || "A"}
                                                                                            onChange={(e) => {
                                                                                                const updatedQ = { ...q, featureLabelType: e.target.value };
                                                                                                const updatedQuestions = [...section.questions];
                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                            }}
                                                                                            style={{ flex: 1 }}
                                                                                        >
                                                                                            <option value="A">A, B, C...</option>
                                                                                            <option value="i">i, ii, iii...</option>
                                                                                        </select>
                                                                                    </div>

                                                                                    {/* Feature List */}
                                                                                    <h5>Feature List</h5>
                                                                                    {(q.features || []).map((feature, fIdx) => {
                                                                                        const label =
                                                                                            q.featureLabelType === "i"
                                                                                                ? ["i", "ii", "iii", "iv", "v", "vi", "vii"][fIdx]
                                                                                                : String.fromCharCode(65 + fIdx);

                                                                                        return (

                                                                                            <div
                                                                                                key={fIdx}

                                                                                                className="feature-row"
                                                                                            >
                                                                                                <b style={{ width: "20px" }}>{label}.</b>

                                                                                                <input
                                                                                                    className="feature-input"
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
                                                                                                    style={{ flex: 1, marginLeft: "6px" }}
                                                                                                />
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="option-remove-button"
                                                                                                    title="Remove this feature"
                                                                                                    onClick={() => {
                                                                                                        const updatedFeatures = q.features.filter((_, i) => i !== fIdx);
                                                                                                        const updatedQ = { ...q, features: updatedFeatures };
                                                                                                        const updatedQuestions = [...section.questions];
                                                                                                        updatedQuestions[qIdx] = updatedQ;
                                                                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                    }}
                                                                                                    style={{ marginLeft: "6px" }}
                                                                                                >
                                                                                                    <BiTrash size={15}></BiTrash>
                                                                                                </button>
                                                                                            </div>

                                                                                        );
                                                                                    })}

                                                                                    <button
                                                                                        type="button"
                                                                                        className="tertiary-button"
                                                                                        onClick={() => {
                                                                                            const updatedFeatures = [...(q.features || []), ""];
                                                                                            const updatedQ = { ...q, features: updatedFeatures };
                                                                                            const updatedQuestions = [...section.questions];
                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                        }}
                                                                                    >
                                                                                        + Add Feature
                                                                                    </button>

                                                                                    {/* Question Items */}
                                                                                    <h5 style={{ marginTop: "12px" }}>Questions</h5>
                                                                                    <Reorder.Group
                                                                                        axis="y"
                                                                                        values={q.questionItems || []}
                                                                                        onReorder={(newItems) => {
                                                                                            const updatedQ = { ...q, questionItems: newItems };
                                                                                            const updatedQuestions = [...section.questions];
                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                        }}
                                                                                        style={{ listStyle: "none", margin: 0, padding: 0 }}
                                                                                    >
                                                                                        {(q.questionItems || []).map((item, itemIdx) => (
                                                                                            <Reorder.Item key={item.id} value={item}>
                                                                                                <div className="tfng-card">
                                                                                                    <div className="tfng-row-right">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="option-remove-button"
                                                                                                            title="Remove this question item"
                                                                                                            onClick={() => {
                                                                                                                const updatedItems = q.questionItems.filter((_, i) => i !== itemIdx);
                                                                                                                const updatedAnswers = (q.answers || []).filter(a => a.id !== item.id);
                                                                                                                const updatedQ = { ...q, questionItems: updatedItems, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                        >
                                                                                                            <BiTrash size={18} />
                                                                                                        </button>
                                                                                                    </div>

                                                                                                    <div className="tfng-row" style={{ display: "flex", alignItems: "center" }}>
                                                                                                        <label style={{ width: "30px" }}>{itemIdx + 1}.</label>
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
                                                                                                            style={{ flex: 1, marginRight: "8px" }}
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
                                                                                                            style={{ flex: 1 }}
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
                                                                                                </div>
                                                                                            </Reorder.Item>
                                                                                        ))}
                                                                                    </Reorder.Group>
                                                                                </div>
                                                                            )}


                                                                            {q.type === "matching_sentence_endings" && (
                                                                                <div style={{ marginTop: "10px" }}>
                                                                                    <Reorder.Group
                                                                                        axis="y"
                                                                                        values={q.questionItems || []}
                                                                                        onReorder={(newItems) => {
                                                                                            const updatedQ = { ...q, questionItems: newItems };
                                                                                            const updatedQuestions = [...section.questions];
                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                        }}
                                                                                        style={{ listStyle: "none", margin: 0, padding: 0 }}
                                                                                    >
                                                                                        {q.type === "matching_sentence_endings" && (
                                                                                            <div style={{ marginTop: "10px" }}>
                                                                                                <Reorder.Group
                                                                                                    axis="y"
                                                                                                    values={q.questionItems || []}
                                                                                                    onReorder={(newItems) => {
                                                                                                        const updatedQ = { ...q, questionItems: newItems };
                                                                                                        const updatedQuestions = [...section.questions];
                                                                                                        updatedQuestions[qIdx] = updatedQ;
                                                                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                    }}
                                                                                                    style={{ listStyle: "none", margin: 0, padding: 0 }}
                                                                                                >
                                                                                                    {(q.questionItems || []).map((item, itemIdx) => (
                                                                                                        <Reorder.Item key={item.id} value={item}>
                                                                                                            <div className="tfng-card">
                                                                                                                <div className="tfng-row-right">
                                                                                                                    <button
                                                                                                                        type="button"
                                                                                                                        className="option-remove-button"
                                                                                                                        title="Remove this item"
                                                                                                                        onClick={() => {
                                                                                                                            const updatedItems = q.questionItems.filter((_, i) => i !== itemIdx);
                                                                                                                            const updatedAnswers = (q.answers || []).filter(a => a.id !== item.id);
                                                                                                                            const updatedQ = { ...q, questionItems: updatedItems, answers: updatedAnswers };
                                                                                                                            const updatedQuestions = [...section.questions];
                                                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        <BiTrash size={18} />
                                                                                                                    </button>
                                                                                                                </div>

                                                                                                                {/* Sentence Begin */}
                                                                                                                <div className="tfng-row">
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
                                                                                                                        style={{ width: "100%" }}
                                                                                                                    />
                                                                                                                </div>

                                                                                                                {/* Correct Sentence End */}
                                                                                                                <div className="tfng-row" style={{ marginTop: "6px" }}>
                                                                                                                    <input
                                                                                                                        type="text"
                                                                                                                        placeholder="Correct Sentence End"
                                                                                                                        value={q.answers?.find(a => a.id === item.id)?.value || ""}
                                                                                                                        onChange={(e) => {
                                                                                                                            const updatedAnswers = [...(q.answers || [])];
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
                                                                                                                        style={{ width: "100%" }}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </Reorder.Item>
                                                                                                    ))}
                                                                                                </Reorder.Group>
                                                                                            </div>
                                                                                        )}

                                                                                    </Reorder.Group>
                                                                                </div>
                                                                            )}

                                                                            {q.type === "matching_paragraph_information" && (
                                                                                <div style={{ marginTop: "10px" }}>
                                                                                    <Reorder.Group
                                                                                        axis="y"
                                                                                        values={q.questionItems || []}
                                                                                        onReorder={(newItems) => {
                                                                                            const updatedQ = { ...q, questionItems: newItems };
                                                                                            const updatedQuestions = [...section.questions];
                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                        }}
                                                                                        style={{ listStyle: "none", margin: 0, padding: 0 }}
                                                                                    >
                                                                                        {(q.questionItems || []).map((item, itemIdx) => (
                                                                                            <Reorder.Item key={item.id} value={item}>
                                                                                                <div className="tfng-card">
                                                                                                    <div className="tfng-row-right">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="option-remove-button"
                                                                                                            title="Remove this question"
                                                                                                            onClick={() => {
                                                                                                                const updatedItems = q.questionItems.filter((_, i) => i !== itemIdx);
                                                                                                                const updatedAnswers = (q.answers || []).filter(a => a.id !== item.id);
                                                                                                                const updatedQ = { ...q, questionItems: updatedItems, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                        >
                                                                                                            <BiTrash size={18} />
                                                                                                        </button>
                                                                                                    </div>

                                                                                                    <div className="tfng-row">
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
                                                                                                            className="tfng-statement"
                                                                                                        />
                                                                                                        <select
                                                                                                            value={q.answers?.find(a => a.id === item.id)?.value || ""}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = [...(q.answers || [])];
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
                                                                                                            className="tfng-select"
                                                                                                        >
                                                                                                            <option value="">-- Select Correct Paragraph --</option>
                                                                                                            {section.passages.map((p) => (
                                                                                                                <option key={p.header} value={p.header}>
                                                                                                                    {p.header}
                                                                                                                </option>
                                                                                                            ))}
                                                                                                        </select>
                                                                                                    </div>

                                                                                                    <div className="tfng-row">
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Answer comes from..."
                                                                                                            value={q.answers?.find(a => a.id === item.id)?.sourceText || ""}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = [...(q.answers || [])];
                                                                                                                const existing = updatedAnswers.find(a => a.id === item.id);
                                                                                                                if (existing) {
                                                                                                                    existing.sourceText = e.target.value;
                                                                                                                } else {
                                                                                                                    updatedAnswers.push({ id: item.id, value: "", sourceText: e.target.value });
                                                                                                                }
                                                                                                                const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                            className="tfng-source"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </Reorder.Item>
                                                                                        ))}
                                                                                    </Reorder.Group>
                                                                                </div>
                                                                            )}

                                                                            {q.type === "short_answer" && (
                                                                                <div style={{ marginTop: "10px" }}>
                                                                                    <Reorder.Group
                                                                                        axis="y"
                                                                                        values={q.questionItems || []}
                                                                                        onReorder={(newItems) => {
                                                                                            const updatedQ = { ...q, questionItems: newItems };
                                                                                            const updatedQuestions = [...section.questions];
                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                        }}
                                                                                        style={{ listStyle: "none", margin: 0, padding: 0 }}
                                                                                    >
                                                                                        {(q.questionItems || []).map((item, itemIdx) => (
                                                                                            <Reorder.Item key={item.id} value={item}>
                                                                                                <div className="tfng-card">
                                                                                                    <div className="tfng-row-right">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="option-remove-button"
                                                                                                            title="Remove this question"
                                                                                                            onClick={() => {
                                                                                                                const updatedItems = q.questionItems.filter((_, i) => i !== itemIdx);
                                                                                                                const updatedAnswers = (q.answers || []).filter(a => a.id !== item.id);
                                                                                                                const updatedQ = { ...q, questionItems: updatedItems, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                        >
                                                                                                            <BiTrash size={18} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                    {/* Question text */}
                                                                                                    <div className="tfng-row">
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
                                                                                                            className="tfng-statement"
                                                                                                        />
                                                                                                    </div>

                                                                                                    {/* Row 2: Correct answer */}
                                                                                                    <div className="tfng-row">
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Correct Answer"
                                                                                                            value={q.answers?.find(a => a.id === item.id)?.value || ""}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = [...(q.answers || [])];
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
                                                                                                            className="tfng-statement"
                                                                                                        />
                                                                                                    </div>

                                                                                                    {/* Row 3: Answer comes from */}
                                                                                                    <div className="tfng-row">
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Answer comes from..."
                                                                                                            value={q.answers?.find(a => a.id === item.id)?.sourceText || ""}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = [...(q.answers || [])];
                                                                                                                const existing = updatedAnswers.find(a => a.id === item.id);
                                                                                                                if (existing) {
                                                                                                                    existing.sourceText = e.target.value;
                                                                                                                } else {
                                                                                                                    updatedAnswers.push({ id: item.id, value: "", sourceText: e.target.value });
                                                                                                                }
                                                                                                                const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                            className="tfng-source"
                                                                                                        />
                                                                                                    </div>



                                                                                                </div>
                                                                                            </Reorder.Item>
                                                                                        ))}
                                                                                    </Reorder.Group>
                                                                                </div>
                                                                            )}
                                                                            {q.type === "multiple_choice" && (
                                                                                <div>
                                                                                    <Reorder.Group
                                                                                        axis="y"
                                                                                        values={q.questionItems || []}
                                                                                        onReorder={(newItems) => {
                                                                                            const updatedQ = { ...q, questionItems: newItems };
                                                                                            const updatedQuestions = [...section.questions];
                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                        }}
                                                                                        style={{ listStyle: "none", margin: 0, padding: 0 }}
                                                                                    >
                                                                                        {(q.questionItems || []).map((item, itemIdx) => (
                                                                                            <Reorder.Item key={item.id} value={item}>
                                                                                                <div className="tfng-card">
                                                                                                    {/* Remove item */}
                                                                                                    <div className="tfng-row-right">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="option-remove-button"
                                                                                                            title="Delete this question"
                                                                                                            onClick={() => {
                                                                                                                const updatedItems = q.questionItems.filter((_, i) => i !== itemIdx);
                                                                                                                const updatedAnswers = (q.answers || []).filter(a => a.id !== item.id);
                                                                                                                const updatedQ = { ...q, questionItems: updatedItems, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                        >
                                                                                                            <BiTrash size={18} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                    {/* Question text */}
                                                                                                    <div className="tfng-row">
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
                                                                                                            className="tfng-statement"
                                                                                                        />
                                                                                                    </div>

                                                                                                    {/* Options with radio buttons */}
                                                                                                    {(item.options || []).map((opt, optIdx) => {
                                                                                                        const selectedAnswer = q.answers?.find(a => a.id === item.id)?.value;
                                                                                                        return (
                                                                                                            <div className="tfng-row" key={optIdx}>
                                                                                                                <input
                                                                                                                    type="radio"

                                                                                                                    name={`mc_correct_${q.id}_${item.id}`}
                                                                                                                    checked={selectedAnswer === opt}
                                                                                                                    onChange={() => {
                                                                                                                        const updatedAnswers = [
                                                                                                                            ...(q.answers || []).filter(a => a.id !== item.id),
                                                                                                                            { id: item.id, value: opt, sourceText: selectedAnswer?.sourceText || "" }
                                                                                                                        ];
                                                                                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                        const updatedQuestions = [...section.questions];
                                                                                                                        updatedQuestions[qIdx] = updatedQ;
                                                                                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                                    }}
                                                                                                                />

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
                                                                                                                    className="tfng-option"
                                                                                                                />
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    className="option-remove-button"
                                                                                                                    title="Delete this option"
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
                                                                                                                    <IoIosRemoveCircleOutline size={18} />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        );
                                                                                                    })}

                                                                                                    {/* Add option button */}
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        className="tertiary-button"
                                                                                                        onClick={() => {
                                                                                                            const updatedItems = [...q.questionItems];
                                                                                                            updatedItems[itemIdx] = { ...item, options: [...item.options, ""] };
                                                                                                            const updatedQ = { ...q, questionItems: updatedItems };
                                                                                                            const updatedQuestions = [...section.questions];
                                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                        }}
                                                                                                        style={{ marginBottom: "6px" }}
                                                                                                    >
                                                                                                        + Add Option
                                                                                                    </button>

                                                                                                    {/* Answer source */}
                                                                                                    <div className="tfng-row">
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Answer comes from..."
                                                                                                            value={q.answers?.find(a => a.id === item.id)?.sourceText || ""}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = [...(q.answers || [])];
                                                                                                                const existing = updatedAnswers.find(a => a.id === item.id);
                                                                                                                if (existing) {
                                                                                                                    existing.sourceText = e.target.value;
                                                                                                                } else {
                                                                                                                    updatedAnswers.push({ id: item.id, value: "", sourceText: e.target.value });
                                                                                                                }
                                                                                                                const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                            className="tfng-source"
                                                                                                        />
                                                                                                    </div>

                                                                                                </div>
                                                                                            </Reorder.Item>
                                                                                        ))}
                                                                                    </Reorder.Group>
                                                                                </div>
                                                                            )}


                                                                            {q.type === "true_false_not_given" && (
                                                                                <div style={{ marginTop: "10px" }}>

                                                                                    <Reorder.Group
                                                                                        axis="y"
                                                                                        values={q.questionItems || []}
                                                                                        onReorder={(newItems) => {
                                                                                            const updatedQ = { ...q, questionItems: newItems };
                                                                                            const updatedQuestions = [...section.questions];
                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                        }}
                                                                                        style={{ listStyle: "none", margin: 0, padding: 0 }}
                                                                                    >
                                                                                        {(q.questionItems || []).map((item, itemIdx) => (
                                                                                            <Reorder.Item key={item.id} value={item}>
                                                                                                <div className="tfng-card">
                                                                                                    <div className="tfng-row-right">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="option-remove-button"
                                                                                                            title="Remove this question"
                                                                                                            onClick={() => {
                                                                                                                const updatedItems = q.questionItems.filter((_, i) => i !== itemIdx);
                                                                                                                const updatedAnswers = (q.answers || []).filter(a => a.id !== item.id);
                                                                                                                const updatedQ = { ...q, questionItems: updatedItems, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                        >
                                                                                                            <BiTrash size={18} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                    <div className="tfng-row">
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
                                                                                                            className="tfng-statement"
                                                                                                        />
                                                                                                        <select
                                                                                                            value={q.answers?.find(a => a.id === item.id)?.value || ""}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = [...(q.answers || [])];
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
                                                                                                            className="tfng-select"
                                                                                                        >
                                                                                                            <option value="">-- Select Answer --</option>
                                                                                                            <option value="True">True</option>
                                                                                                            <option value="False">False</option>
                                                                                                            <option value="Not Given">Not Given</option>
                                                                                                        </select>
                                                                                                    </div>

                                                                                                    <div className="tfng-row">
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Answer comes from..."
                                                                                                            value={q.answers?.find(a => a.id === item.id)?.sourceText || ""}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = [...(q.answers || [])];
                                                                                                                const existing = updatedAnswers.find(a => a.id === item.id);
                                                                                                                if (existing) {
                                                                                                                    existing.sourceText = e.target.value;
                                                                                                                } else {
                                                                                                                    updatedAnswers.push({ id: item.id, value: "", sourceText: e.target.value });
                                                                                                                }
                                                                                                                const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                            className="tfng-source"
                                                                                                        />
                                                                                                    </div>


                                                                                                </div>
                                                                                            </Reorder.Item>
                                                                                        ))}
                                                                                    </Reorder.Group>
                                                                                </div>
                                                                            )}

                                                                            {q.type === "yes_no_not_given" && (
                                                                                <div style={{ marginTop: "10px" }}>

                                                                                    <Reorder.Group
                                                                                        axis="y"
                                                                                        values={q.questionItems || []}
                                                                                        onReorder={(newItems) => {
                                                                                            const updatedQ = { ...q, questionItems: newItems };
                                                                                            const updatedQuestions = [...section.questions];
                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                        }}
                                                                                        style={{ listStyle: "none", margin: 0, padding: 0 }}
                                                                                    >
                                                                                        {(q.questionItems || []).map((item, itemIdx) => (
                                                                                            <Reorder.Item key={item.id} value={item}>
                                                                                                <div className="tfng-card">
                                                                                                    <div className="tfng-row-right">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="option-remove-button"
                                                                                                            title="Remove this question item"
                                                                                                            onClick={() => {
                                                                                                                const updatedItems = q.questionItems.filter((_, i) => i !== itemIdx);
                                                                                                                const updatedAnswers = (q.answers || []).filter(a => a.id !== item.id);
                                                                                                                const updatedQ = { ...q, questionItems: updatedItems, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                        >
                                                                                                            <BiTrash size={15} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                    <div className="tfng-row">
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
                                                                                                            className="tfng-statement"
                                                                                                        />
                                                                                                        <select
                                                                                                            value={q.answers?.find(a => a.id === item.id)?.value || ""}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = [...(q.answers || [])];
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
                                                                                                            className="tfng-select"
                                                                                                        >
                                                                                                            <option value="">-- Select Answer --</option>
                                                                                                            <option value="True">Yes</option>
                                                                                                            <option value="False">No</option>
                                                                                                            <option value="Not Given">Not Given</option>
                                                                                                        </select>
                                                                                                    </div>

                                                                                                    <div className="tfng-row">
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Answer comes from..."
                                                                                                            value={q.answers?.find(a => a.id === item.id)?.sourceText || ""}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = [...(q.answers || [])];
                                                                                                                const existing = updatedAnswers.find(a => a.id === item.id);
                                                                                                                if (existing) {
                                                                                                                    existing.sourceText = e.target.value;
                                                                                                                } else {
                                                                                                                    updatedAnswers.push({ id: item.id, value: "", sourceText: e.target.value });
                                                                                                                }
                                                                                                                const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                            className="tfng-source"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </Reorder.Item>
                                                                                        ))}
                                                                                    </Reorder.Group>
                                                                                </div>
                                                                            )}
                                                                            {q.type === "summary_completion" && (
                                                                                <div style={{ marginTop: "10px" }}>
                                                                                    <h5>Summary Text</h5>
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
                                                                                        className="tertiary-button"
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
                                                                                        + Add Blank
                                                                                    </button>
                                                                                    <Reorder.Group
                                                                                        axis="y"
                                                                                        className="reorder-group"
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
                                                                                            <Reorder.Item key={answer.id} value={answer} className="reorder-item">
                                                                                                <div className="tfng-card">
                                                                                                    <motion.div
                                                                                                        layout
                                                                                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                                                                    />
                                                                                                    <div className="tfng-row-right">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="option-remove-button"
                                                                                                            title="Remove this question item"
                                                                                                            onClick={() => {
                                                                                                                let blankIndex = 0;
                                                                                                                const updatedText = (q.summary || "").replace(/\[BLANK\]/g, () => {
                                                                                                                    blankIndex++;
                                                                                                                    return blankIndex === idx + 1 ? "" : "[BLANK]";
                                                                                                                });
                                                                                                                const updatedAnswers = q.answers.filter(a => a.id !== answer.id);
                                                                                                                const updatedQ = { ...q, summary: updatedText, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                        >
                                                                                                            <BiTrash size={15} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                    <div className="tfng-row">
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
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div className="tfng-row">
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
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </Reorder.Item>
                                                                                        ))}
                                                                                    </Reorder.Group>
                                                                                    <h5>Preview</h5>
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
                                                                            {q.type === "table_completion" && (() => {
                                                                                //const { row, col } = selectedCell;
                                                                                return (
                                                                                    <div style={{ marginTop: "10px" }}>
                                                                                        {/* --- Toolbar --- */}
                                                                                        <div className="table-toolbar">
                                                                                            <button
                                                                                                type="button"
                                                                                                className="toolbar-btn"
                                                                                                title="Insert new row after the last row "
                                                                                                onClick={() => {
                                                                                                    const updatedTable = [...(q.tableData || [])];
                                                                                                    const cols = updatedTable[0]?.length || 1;
                                                                                                    updatedTable.push(Array(cols).fill(""));
                                                                                                    const updatedQ = { ...q, tableData: updatedTable };
                                                                                                    const updatedQuestions = [...section.questions];
                                                                                                    updatedQuestions[qIdx] = updatedQ;
                                                                                                    updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                }}
                                                                                            >
                                                                                                + Add Row
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                className="toolbar-btn"
                                                                                                title="Insert new column after the last column"
                                                                                                onClick={() => {
                                                                                                    const updatedTable = (q.tableData || []).map((row) => [...row, ""]);
                                                                                                    const updatedQ = { ...q, tableData: updatedTable };
                                                                                                    const updatedQuestions = [...section.questions];
                                                                                                    updatedQuestions[qIdx] = updatedQ;
                                                                                                    updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                }}
                                                                                                style={{ marginLeft: "8px" }}
                                                                                            >
                                                                                                + Add Column
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                className="toolbar-btn remove-btn"
                                                                                                title="Remove the last row"
                                                                                                onClick={() => {
                                                                                                    const updatedTable = [...(q.tableData || [])];
                                                                                                    updatedTable.pop(); // remove last row
                                                                                                    const updatedQ = { ...q, tableData: updatedTable };
                                                                                                    const updatedQuestions = [...section.questions];
                                                                                                    updatedQuestions[qIdx] = updatedQ;
                                                                                                    updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                }}
                                                                                                style={{ marginLeft: "8px", color: "red" }}
                                                                                            >
                                                                                                − Remove Row
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                className="toolbar-btn remove-btn"
                                                                                                title="Remove the last column"
                                                                                                onClick={() => {
                                                                                                    const updatedTable = (q.tableData || []).map((row) => row.slice(0, -1)); // remove last col
                                                                                                    const updatedQ = { ...q, tableData: updatedTable };
                                                                                                    const updatedQuestions = [...section.questions];
                                                                                                    updatedQuestions[qIdx] = updatedQ;
                                                                                                    updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                }}
                                                                                                style={{ marginLeft: "8px", color: "red" }}
                                                                                            >
                                                                                                − Remove Column
                                                                                            </button>
                                                                                        </div>

                                                                                        {/* --- Editable table --- */}
                                                                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                                                            <tbody>
                                                                                                {(q.tableData || [[]]).map((rowData, rIdx) => (
                                                                                                    <tr key={rIdx}>
                                                                                                        {rowData.map((cell, cIdx) => (
                                                                                                            <td
                                                                                                                key={cIdx}
                                                                                                                style={{
                                                                                                                    border: "1px solid #ddd",
                                                                                                                    padding: "5px",
                                                                                                                    backgroundColor:
                                                                                                                        selectedCell.row === rIdx && selectedCell.col === cIdx
                                                                                                                            ? "#f0f8ff"
                                                                                                                            : "transparent",
                                                                                                                }}
                                                                                                                onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                                                                                                            >
                                                                                                                <textarea
                                                                                                                    value={cell}
                                                                                                                    onChange={(e) => {
                                                                                                                        const updatedTable = [...(q.tableData || [])];
                                                                                                                        updatedTable[rIdx][cIdx] = e.target.value;
                                                                                                                        const updatedQ = { ...q, tableData: updatedTable };
                                                                                                                        const updatedQuestions = [...section.questions];
                                                                                                                        updatedQuestions[qIdx] = updatedQ;
                                                                                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                                    }}
                                                                                                                    style={{ width: "100%", border: "none", resize: "none" }}
                                                                                                                />
                                                                                                            </td>
                                                                                                        ))}
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
                                                                                        <button
                                                                                            type="button"
                                                                                            className="tertiary-button"
                                                                                            onClick={() => {
                                                                                                const { row, col } = selectedCell;
                                                                                                const updatedTable = [...(q.tableData || [])];
                                                                                                updatedTable[row][col] = (updatedTable[row][col] || "") + " [BLANK]";

                                                                                                // Count blanks
                                                                                                const flat = updatedTable.flat();
                                                                                                const blankCount = flat.join(" ").match(/\[BLANK\]/g)?.length || 0;

                                                                                                // Sync `answers` length
                                                                                                let answers = q.answers ? [...q.answers] : [];
                                                                                                if (blankCount > answers.length) {
                                                                                                    for (let i = answers.length; i < blankCount; i++) {
                                                                                                        answers.push({ id: uuidv4(), value: "", sourceText: "" });
                                                                                                    }
                                                                                                } else if (blankCount < answers.length) {
                                                                                                    answers = answers.slice(0, blankCount);
                                                                                                }

                                                                                                const updatedQ = { ...q, tableData: updatedTable, answers };

                                                                                                const updatedQuestions = [...section.questions];
                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                            }}

                                                                                        >
                                                                                            + Add Blank
                                                                                        </button>
                                                                                        {/* Answer Inputs */}
                                                                                        <div style={{ marginTop: "15px" }}>

                                                                                            <Reorder.Group
                                                                                                axis="y"
                                                                                                className="reorder-group"
                                                                                                values={q.answers || []}
                                                                                                onReorder={(newOrder) => {
                                                                                                    const updatedQ = { ...q, answers: newOrder };
                                                                                                    const updatedQuestions = [...section.questions];
                                                                                                    updatedQuestions[qIdx] = updatedQ;
                                                                                                    updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                }}
                                                                                            >
                                                                                                {(q.answers || []).map((ans, idx) => (
                                                                                                    <Reorder.Item key={ans.id} value={ans} className="reorder-item">
                                                                                                        <div className="tfng-card">
                                                                                                            <motion.div
                                                                                                                layout
                                                                                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                                                                            />
                                                                                                            <div className="tfng-row-right">
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    className="option-remove-button"
                                                                                                                    title="Remove this answer"
                                                                                                                    onClick={() => {
                                                                                                                        const updatedAnswers = q.answers.filter(a => a.id !== ans.id);
                                                                                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                        const updatedQuestions = [...section.questions];
                                                                                                                        updatedQuestions[qIdx] = updatedQ;
                                                                                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                                    }}
                                                                                                                >
                                                                                                                    <BiTrash size={15} />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                            {/* Correct answer */}
                                                                                                            <div className="tfng-row">
                                                                                                                <input
                                                                                                                    type="text"
                                                                                                                    placeholder="Correct answer"
                                                                                                                    value={ans.value}
                                                                                                                    onChange={(e) => {
                                                                                                                        const updatedAnswers = q.answers.map(a =>
                                                                                                                            a.id === ans.id ? { ...a, value: e.target.value } : a
                                                                                                                        );
                                                                                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                        const updatedQuestions = [...section.questions];
                                                                                                                        updatedQuestions[qIdx] = updatedQ;
                                                                                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                                    }}
                                                                                                                />
                                                                                                            </div>
                                                                                                            {/* Source text */}
                                                                                                            <div className="tfng-row">
                                                                                                                <input
                                                                                                                    type="text"
                                                                                                                    placeholder="Answer comes from..."
                                                                                                                    value={ans.sourceText}
                                                                                                                    onChange={(e) => {
                                                                                                                        const updatedAnswers = q.answers.map(a =>
                                                                                                                            a.id === ans.id ? { ...a, sourceText: e.target.value } : a
                                                                                                                        );
                                                                                                                        const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                        const updatedQuestions = [...section.questions];
                                                                                                                        updatedQuestions[qIdx] = updatedQ;
                                                                                                                        updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                                    }}
                                                                                                                />
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </Reorder.Item>
                                                                                                ))}
                                                                                            </Reorder.Group>

                                                                                        </div>

                                                                                        {/* --- Preview --- */}
                                                                                        <h4 style={{ marginTop: "10px" }}>Preview</h4>
                                                                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                                                            <tbody>
                                                                                                {(() => {
                                                                                                    let globalIdx = 0;
                                                                                                    return (q.tableData || [[]]).map((rowData, rIdx) => (
                                                                                                        <tr key={rIdx}>
                                                                                                            {rowData.map((cell, cIdx) => (
                                                                                                                <td key={cIdx} style={{ border: "1px solid #ddd", padding: "5px" }}>
                                                                                                                    {cell.replace(/\[BLANK\]/g, () => {
                                                                                                                        const val = q.answers?.[globalIdx]?.value || "[BLANK]";
                                                                                                                        globalIdx++;
                                                                                                                        return val;
                                                                                                                    })}
                                                                                                                </td>
                                                                                                            ))}
                                                                                                        </tr>
                                                                                                    ));
                                                                                                })()}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                            {q.type === "diagram_completion" && (
                                                                                <div>

                                                                                    {/* Image Upload */}

                                                                                    <div className="tfng-section-settings">

                                                                                        {/* Image Upload */}
                                                                                        <div>
                                                                                            <label>Upload Image:</label>
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

                                                                                                        const updatedSection = {
                                                                                                            ...section,
                                                                                                            images: [...(section.images || []), key],
                                                                                                        };

                                                                                                        updateSection(secIdx, updatedSection);

                                                                                                        // Save to DB
                                                                                                        await axios.put(`${BASE_URL}/api/tests/${testData._id}`, {
                                                                                                            ...testData,
                                                                                                            sections: testData.sections.map((s, i) =>
                                                                                                                i === secIdx ? updatedSection : s
                                                                                                            ),
                                                                                                        });
                                                                                                    } catch (err) {
                                                                                                        console.error("Image upload failed:", err);
                                                                                                    }
                                                                                                }}
                                                                                                className="tfng-file-input"
                                                                                            />

                                                                                            {(section.images || []).length > 0 && (
                                                                                                <div className="tfng-uploaded-images">
                                                                                                    <h5>Uploaded Images:</h5>
                                                                                                    <ul>
                                                                                                        {section.images.map((imgKey, imgIdx) => (
                                                                                                            <li key={imgIdx} className="tfng-image-item">
                                                                                                                <span className="tfng-image-name">{imgKey}</span>
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    className="remove-button"
                                                                                                                    title="Remove this image"
                                                                                                                    onClick={() => {
                                                                                                                        const updatedSection = {
                                                                                                                            ...section,
                                                                                                                            images: section.images.filter((_, i) => i !== imgIdx),
                                                                                                                        };
                                                                                                                        updateSection(secIdx, updatedSection);
                                                                                                                    }}
                                                                                                                >
                                                                                                                    <BiTrash size={15}></BiTrash>
                                                                                                                </button>
                                                                                                            </li>
                                                                                                        ))}
                                                                                                    </ul>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>

                                                                                        {/* Number of Blanks */}
                                                                                        <div className="tfng-blanks-section">
                                                                                            <label className="tfng-label" htmlFor={`numBlanks_${q.id}`}>Number of blanks:</label>
                                                                                            <input
                                                                                                id={`numBlanks_${q.id}`}
                                                                                                type="number"
                                                                                                min="0"
                                                                                                value={q.questionItems?.length || 0}
                                                                                                onChange={(e) => {
                                                                                                    const count = parseInt(e.target.value) || 0;

                                                                                                    let items = q.questionItems ? [...q.questionItems] : [];
                                                                                                    let answers = q.answers ? [...q.answers] : [];

                                                                                                    if (count > items.length) {
                                                                                                        for (let i = items.length; i < count; i++) {
                                                                                                            const newId = uuidv4();
                                                                                                            items.push({ id: newId, text: "" });
                                                                                                            answers.push({ id: newId, value: "", sourceText: "" });
                                                                                                        }
                                                                                                    } else {
                                                                                                        items = items.slice(0, count);
                                                                                                        answers = answers.slice(0, count);
                                                                                                    }

                                                                                                    const updatedQ = { ...q, questionItems: items, answers };
                                                                                                    const updatedQuestions = [...section.questions];
                                                                                                    updatedQuestions[qIdx] = updatedQ;
                                                                                                    updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                }}
                                                                                                className="tfng-number-input"
                                                                                            />
                                                                                        </div>

                                                                                    </div>


                                                                                    {/* Editable blanks + correct answers */}

                                                                                    <Reorder.Group
                                                                                        axis="y"
                                                                                        values={q.answers || []}
                                                                                        className="reorder-group"
                                                                                        onReorder={(newOrder) => {
                                                                                            // Reorder answers array
                                                                                            const updatedAnswers = newOrder;

                                                                                            // Reorder questionItems to match the answers by ID
                                                                                            const updatedItems = updatedAnswers.map(a =>
                                                                                                q.questionItems.find(i => i.id === a.id)
                                                                                            );
                                                                                            const updatedQ = { ...q, answers: updatedAnswers, questionItems: updatedItems };
                                                                                            const updatedQuestions = [...section.questions];
                                                                                            updatedQuestions[qIdx] = updatedQ;
                                                                                            updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                        }}
                                                                                    >
                                                                                        {(q.answers || []).map((ans, idx) => (
                                                                                            <Reorder.Item key={ans.id} value={ans}>
                                                                                                <div className="tfng-card">
                                                                                                    <div style={{
                                                                                                        display: "flex",
                                                                                                        justifyContent: "space-between",
                                                                                                        alignItems: "center",
                                                                                                        marginBottom: "4px"   // space between top row and inputs
                                                                                                    }}>
                                                                                                        <span style={{ fontWeight: "bold" }}>{idx + 1}.</span>

                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="option-remove-button"
                                                                                                            title="Remove this blank"
                                                                                                            onClick={() => {
                                                                                                                const newAnswers = q.answers.filter(a => a.id !== ans.id);
                                                                                                                const newItems = q.questionItems.filter(i => i.id !== ans.id);
                                                                                                                const updatedQ = { ...q, answers: newAnswers, questionItems: newItems };

                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;

                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                        >
                                                                                                            <BiTrash size={14} />
                                                                                                        </button>
                                                                                                    </div>



                                                                                                    {/* Correct answer */}
                                                                                                    <div className="tfng-row">
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Correct Answer"
                                                                                                            value={ans.value}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = q.answers.map((a) =>
                                                                                                                    a.id === ans.id ? { ...a, value: e.target.value } : a
                                                                                                                );
                                                                                                                const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                        />
                                                                                                    </div>
                                                                                                    {/* Source text */}
                                                                                                    <div className="tfng-row">
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Answer comes from..."
                                                                                                            value={ans.sourceText}
                                                                                                            onChange={(e) => {
                                                                                                                const updatedAnswers = q.answers.map((a) =>
                                                                                                                    a.id === ans.id ? { ...a, sourceText: e.target.value } : a
                                                                                                                );
                                                                                                                const updatedQ = { ...q, answers: updatedAnswers };
                                                                                                                const updatedQuestions = [...section.questions];
                                                                                                                updatedQuestions[qIdx] = updatedQ;
                                                                                                                updateSection(secIdx, { ...section, questions: updatedQuestions });
                                                                                                            }}
                                                                                                            style={{ flex: 1 }}
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </Reorder.Item>
                                                                                        ))}
                                                                                    </Reorder.Group>
                                                                                </div>

                                                                            )}

                                                                            {testData.type !== "speaking" &&
                                                                                testData.type !== "writing" &&
                                                                                q.type !== "summary_completion" &&
                                                                                q.type !== "table_completion" &&
                                                                                q.type !== "diagram_completion" &&
                                                                                q.type !== "matching_headings" && (
                                                                                    <button type="button" className="tertiary-button" onClick={() => addQuestionItem(secIdx, qIdx)}>
                                                                                        + Add Question Item
                                                                                    </button>
                                                                                )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Reorder.Item>
                                                        ))}
                                                    </Reorder.Group>
                                                </>

                                            )
                                            }
                                            {testData.type !== "writing" && (
                                                <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
                                                    <button
                                                        type="button"
                                                        className="secondary-button-small"
                                                        title="Add new Question"
                                                        onClick={() => addQuestion(secIdx)}
                                                    >
                                                        + Add Question
                                                    </button>
                                                </div>
                                            )}

                                        </div>

                                    </div>
                                </div>
                            )}

                        </div>
                    ))
                    }
                    <div className="new-section-card" onClick={addSection}>
                        + Add New Section
                    </div>

                    <br />
                    <div className="action-buttons">
                        <button type="submit" className="primary-button" title="Complete">Submit</button>
                        <button
                            type="button"
                            className="secondary-button"
                            title="Cancel create test. Your change will not be saved"
                            onClick={async () => {
                                if (!id) {
                                    navigate("/tests");
                                    return;
                                }

                                const confirmed = window.confirm("Cancel test creation? This test will be deleted.");
                                if (!confirmed) return;

                                try {
                                    await axios.delete(`${BASE_URL}/api/tests/${id}`);
                                } catch (err) {
                                    console.error("Failed to delete test:", err);
                                    alert("Failed to delete temporary test.");
                                }

                                navigate("/tests");
                            }}
                        >
                            Cancel
                        </button>
                    </div>


                </form >
            </div >
        </>
    );
};

export default TestCreateEditView;
