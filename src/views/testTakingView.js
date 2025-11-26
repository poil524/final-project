import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";

import { useContext } from "react";
import { AuthContext } from "../context/authContext.js"; // adjust path

import useNavigationBlocker from "../components/NavigationBlocker.jsx";
import AudioPlayer from "../components/AudioPlayer";
import Image from "../components/Image";
import AudioRecorder from "../components/AudioRecorder";
import './TestTakingView.css';
import { GoArrowSwitch } from "react-icons/go";
import EssayDisplay from "../components/EssayDisplay.jsx";
import FloatingTimer from "../components/FloatingTimer.jsx";


const stripHTML = (str) => str.replace(/<[^>]+>/g, '');
const QuestionBlock = ({
  question: q,
  section,
  answers,
  handleAnswerChange,
  setHighlightText,
  questionCounter,
  showAnswers,
}) => {

  const endingOptions =
    q.shuffledEnds?.length > 0
      ? q.shuffledEnds.map((e) => (typeof e === "string" ? e : e.value))
      : (q.answers || []).map((a) => a.value);

  // Auto-generate questionItems if missing (summary & diagram completion)
  let generatedItems = q.questionItems;
  if (
    (q.type === "summary_completion" ||
      q.type === "diagram_completion" ||
      q.type === "table_completion") &&
    (!generatedItems || generatedItems.length === 0)
  ) {
    generatedItems = (q.answers || []).map((ans, idx) => ({
      id: ans.id,
      text: `[${idx + 1}]`, // same behavior
    }));
  }



  const getCorrectAnswer = (itemId) => {
    const correctObj = (q.answers || []).find((a) => a.id === itemId);
    return correctObj?.value || "";
  };

  const getSourceText = (itemId) => {
    const correctObj = (q.answers || []).find((a) => a.id === itemId);
    return correctObj?.sourceText || "";
  };

  const renderAnswer = (itemId) => {
    const studentAnswer = answers[q._id]?.[itemId] || "";
    const correctAnswer = getCorrectAnswer(itemId);
    const sourceText = getSourceText(itemId);
    const isCorrect = studentAnswer === correctAnswer;

    return (
      <span
        className={isCorrect ? "" : "incorrect-answer"}
        onMouseEnter={() => {
          if (showAnswers && sourceText) {
            const cleanText = stripHTML(sourceText).trim();
            setHighlightText(cleanText);
          }
        }}
        onMouseLeave={() => {
          if (showAnswers) {
            setHighlightText(null);
          }
        }}
      >
        {studentAnswer || <em>(No answer)</em>}
        {!isCorrect && ` → Correct: ${correctAnswer}`}
      </span>
    );
  };
  const itemCount = generatedItems.length;
  const start = questionCounter.current + 1; // first index of this question group
  const end = start + itemCount - 1;        // last index in this question group
  const letterMax = String.fromCharCode(64 + itemCount); // A, B, C, D...

  const requirementText = (q.requirement || "")
    .replace("{START}", start)
    .replace("{END}", end)
    .replace("{LETTER_MAX}", letterMax);


  const renderSummaryText = () => {
    if (q.type !== "summary_completion") return null;
    if (!q.summary) return null;

    const parts = q.summary.split(/\[BLANK\]/g);

    return (
      <p style={{ marginBottom: "15px", whiteSpace: "pre-wrap" }}>
        {parts.map((part, idx) => {
          const item = generatedItems[idx];
          if (!item) return part;

          const studentAnswer = answers[q._id]?.[item.id] || "";

          return (
            <React.Fragment key={idx}>
              {part}
              {/* Add numbering here */}
              <span style={{ marginRight: "4px" }}>{idx + 1}.</span>
              <span
                style={{
                  display: "inline-block",
                  minWidth: "60px",
                  borderBottom: "1px solid black",
                  textAlign: "center",
                  marginRight: "4px"
                }}
              >
                {studentAnswer}
              </span>
            </React.Fragment>
          );
        })}
      </p>
    );
  };

  const renderTableCompletion = () => {
    if (q.type !== "table_completion") return null;

    let blankIndex = 0;

    return (
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
        <tbody>
          {(q.tableData || []).map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => {
                const parts = cell.split(/\[BLANK\]/g);
                return (
                  <td key={cIdx} style={{ border: "1px solid #ccc", padding: "6px" }}>
                    {parts.map((part, i) => {
                      if (i === parts.length - 1) return part;

                      const item = generatedItems[blankIndex];
                      const itemId = item?.id;
                      const studentAnswer = answers[q._id]?.[itemId] || "";

                      blankIndex++;

                      return (
                        <React.Fragment key={i}>
                          {part}
                          {/* numbering + underline (like summary) */}
                          <span style={{ marginRight: "4px" }}>{blankIndex}.</span>
                          <span
                            style={{
                              display: "inline-block",
                              minWidth: "60px",
                              borderBottom: "1px solid black",
                              textAlign: "center",
                              marginRight: "6px"
                            }}
                          >
                            {studentAnswer}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };



  return (
    <div className="question-block">

      <h4>{requirementText}</h4>


      {renderSummaryText()}
      {renderTableCompletion()}
      {generatedItems.map((item) => {
        questionCounter.current++;

        // === Show answers mode ===
        if (showAnswers) {
          return (
            <div key={item.id} style={{ marginBottom: 8 }}>
              <label>
                {questionCounter.current}. {renderAnswer(item.id)}
              </label>
            </div>
          );
        }


        // === Normal input mode ===
        switch (q.type) {
          case "matching_paragraph_information":
            return (
              <div key={item.id}>
                <label>
                  {questionCounter.current}. {item.text}
                </label>
                <select
                  value={answers[q._id]?.[item.id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(q._id, item.id, e.target.value)
                  }
                >
                  <option value="">-- Select Paragraph --</option>
                  {section.passages.map((p) => (
                    <option key={p.header} value={p.header}>
                      {p.header}
                    </option>
                  ))}
                </select>
              </div>
            );

          case "matching_headings":
            const original = (q.questionItems || []).find((it) => it.id === item.id) || {};
            const studentAnswer = answers[q._id]?.[original.id] || "";
            return (
              <div key={item.id} style={{ marginBottom: 8 }}>
                <label>
                  {questionCounter.current}. {item.text}
                </label>
                <select
                  value={studentAnswer}
                  onChange={(e) => handleAnswerChange(q._id, original.id, e.target.value)}
                >
                  <option value="">-- Select Paragraph --</option>
                  {section.passages?.map((p) => (
                    <option key={p.header} value={p.header}>
                      {p.header}
                    </option>
                  ))}
                </select>
              </div>
            );

          case "matching_sentence_endings":
            const studentAns = answers[q._id]?.[item.id] || "";
            return (
              <div key={item.id} style={{ marginBottom: 8 }}>
                <label>
                  {questionCounter.current}. {item.text}
                </label>
                <select
                  value={studentAns}
                  onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
                >
                  <option value="">-- Select Ending --</option>
                  {endingOptions.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );

          case "matching_features":
            const studentFeature = answers[q._id]?.[item.id] || "";
            return (
              <div key={item.id} style={{ marginBottom: 8 }}>
                <label>
                  {questionCounter.current}. {item.text}
                </label>
                <select
                  value={studentFeature}
                  onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
                >
                  <option value="">-- Select Feature --</option>
                  {(q.features || []).map((feature, fIdx) => {
                    const label =
                      q.featureLabelType === "i"
                        ? ["i", "ii", "iii", "iv", "v", "vi", "vii"][fIdx]
                        : String.fromCharCode(65 + fIdx);
                    return (
                      <option key={fIdx} value={feature}>
                        {label}. {feature}
                      </option>
                    );
                  })}
                </select>
              </div>
            );

          case "multiple_choice":
            return (
              <div key={item.id}>
                <p>
                  {questionCounter.current}. {item.text}
                </p>
                {(item.options || []).map((option, optIdx) => (
                  <label key={optIdx} style={{ display: "block" }}>
                    <input
                      type="radio"
                      name={`${q._id}_${item.id}`}
                      value={option}
                      checked={answers[q._id]?.[item.id] === option}
                      onChange={(e) =>
                        handleAnswerChange(q._id, item.id, e.target.value)
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            );

          case "true_false_not_given":
            return (
              <div key={item.id}>
                <label>
                  {questionCounter.current}. {item.text}
                </label>
                <select
                  value={answers[q._id]?.[item.id] || ""}
                  onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
                >
                  <option value="">-- Select --</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                  <option value="Not Given">Not Given</option>
                </select>
              </div>
            );

          case "yes_no_not_given":
            return (
              <div key={item.id}>
                <label>
                  {questionCounter.current}. {item.text}
                </label>
                <select
                  value={answers[q._id]?.[item.id] || ""}
                  onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
                >
                  <option value="">-- Select --</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Not Given">Not Given</option>
                </select>
              </div>
            );
          case "short_question":
            return (
              <div key={item.id} style={{ marginBottom: 8 }}>
                <label>
                  {questionCounter.current}. {item.text}
                </label>
                <input
                  type="text"
                  value={answers[q._id]?.[item.id] || ""}
                  placeholder="Enter your answer"
                  onChange={(e) =>
                    handleAnswerChange(q._id, item.id, e.target.value)
                  }
                />
              </div>
            );

          case "diagram_completion":
            return (
              <div key={item.id} style={{ marginBottom: 8 }}>
                <label>
                  {questionCounter.current}. {item.text}
                </label>
                <input
                  type="text"
                  value={answers[q._id]?.[item.id] || ""}
                  placeholder="Enter your answer"
                  onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
                />
              </div>
            );


          case "summary_completion":
            return (
              <div
                key={item.id}
                style={{
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px" // spacing between number and input
                }}
              >
                <span>{questionCounter.current}.</span>
                <input
                  type="text"
                  value={answers[q._id]?.[item.id] || ""}
                  placeholder="Enter answer"
                  onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
                  style={{ flex: "0 0 200px" }} // optional: sets width
                />
              </div>
            );
          case "table_completion":
            return (
              <div
                key={item.id}
                style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span>{questionCounter.current}.</span>
                {showAnswers ? (
                  renderAnswer(item.id)
                ) : (
                  <input
                    type="text"
                    value={answers[q._id]?.[item.id] || ""}
                    onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
                    style={{ flex: "0 0 200px" }}
                    placeholder="Enter answer"
                  />
                )}
              </div>
            );

          default:
            return (
              <div key={item.id}>
                <label>
                  {questionCounter.current}. {item.text}
                </label>
                <input
                  type="text"
                  value={answers[q._id]?.[item.id] || ""}
                  onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
                />
              </div>
            );
        }
      })}
    </div>
  );
};

const StudentTestView = () => {
  const { id: testId } = useParams();
  const { user } = useContext(AuthContext);
  const [test, setTest] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [highlightText, setHighlightText] = useState(null);
  const [twoViewMode, setTwoViewMode] = useState(false);
  const [evaluationReady, setEvaluationReady] = useState(false);
  const [savedResult, setSavedResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const location = useLocation();
  const passedViewOnly = location.state?.viewOnly || false;

  const isTeacherOrAdmin = user?.isTeacher || user?.isAdmin;

  // Final enforced mode:
  const viewOnly = isTeacherOrAdmin ? true : passedViewOnly;


  // Speaking "running track" progression
  const [speakingStep, setSpeakingStep] = useState(0);


  // If not submitted, warn user on return
  useNavigationBlocker(!viewOnly && !result?.isSubmitted);

  const writingRefs = useRef([]);
  const BASE_URL = "http://localhost:5000";
  const highlightTranscript = (transcript, highlight) => {
  const plain = transcript.replace(/\s+/g, " ").trim();
  const h = highlight.replace(/\s+/g, " ").trim();

  const parts = plain.split(new RegExp(`(${h})`, "gi"));

  return parts.map((part, i) =>
    part.toLowerCase() === h.toLowerCase() ? (
      <span key={i} className="highlight-active">{part}</span>
    ) : (
      part
    )
  );
};

  useEffect(() => {

    let active = true;
    const shuffle = (arr) => (arr ? [...arr].sort(() => Math.random() - 0.5) : []);

    const fetchAll = async () => {
      try {
        // fetch test and existing result in parallel
        const [testRes, resultRes] = await Promise.allSettled([
          axios.get(`${BASE_URL}/api/tests/${testId}`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/tests/${testId}/get-result`, { withCredentials: true }),
        ]);
        console.log("Fetched result:", resultRes.value?.data);
        if (!active) return;

        // --- process test ---
        if (testRes.status !== "fulfilled") {
          throw testRes.reason;
        }
        const fetchedTest = testRes.value.data;

        const updatedSections = fetchedTest.sections.map((section) => ({
          ...section,
          questions: (section.questions || []).map((q) => {
            const newQ = { ...q };
            if (q.type === "matching_headings") {
              newQ.shuffledItems = shuffle((q.questionItems || []).map((it) => ({ ...it, key: it.id })));
            } else if (q.type === "matching_sentence_endings" || q.type === "matching_features") {
              newQ.shuffledEnds = shuffle(q.answers || []);
            }
            return newQ;
          }),
        }));

        let mergedTest = { ...fetchedTest, sections: updatedSections };

        // --- process existing result (if any) ---
        if (resultRes.status === "fulfilled" && resultRes.value?.data) {
          const existing = resultRes.value.data;
          setIsSubmitted(existing.isSubmitted || false);
          setResult(existing);

          setSavedResult(existing);

          // If answers is an array (older format for writing/speaking), convert to keyed object for answers state
          const newAnswersState = {};
          if (Array.isArray(existing.answers)) {
            existing.answers.forEach((secAnswer, sIdx) => {
              // For writing old format
              if (typeof secAnswer.content === "string") {
                newAnswersState[`writing_${sIdx}`] = secAnswer.content;
              }

              // For speaking / structured answers: merge studentAudioKey into test sections/questions
              if (secAnswer.questions && Array.isArray(secAnswer.questions)) {
                // Try to find matching section by title first, else fallback to index
                const targetSectionIndex = mergedTest.sections.findIndex(
                  (sec) => sec.sectionTitle === secAnswer.sectionTitle
                );
                const secIdxToUse = targetSectionIndex >= 0 ? targetSectionIndex : sIdx;

                if (mergedTest.sections[secIdxToUse]) {
                  const updatedQuestions = [...(mergedTest.sections[secIdxToUse].questions || [])];

                  secAnswer.questions.forEach((qAns, qIdx) => {
                    const studentAudioKey = qAns.studentAudioKey || qAns.speakingAudioKey || qAns.audioKey;
                    if (!studentAudioKey) return;

                    // Match question by requirement/text if possible
                    let targetQIndex = updatedQuestions.findIndex(
                      (qq) =>
                        (qq.requirement && qAns.requirement && qq.requirement === qAns.requirement) ||
                        (qq.text && qAns.question && qq.text === qAns.question)
                    );

                    if (targetQIndex === -1) {
                      // fallback to same index
                      targetQIndex = qIdx;
                    }
                    if (!updatedQuestions[targetQIndex]) return;

                    updatedQuestions[targetQIndex] = {
                      ...updatedQuestions[targetQIndex],
                      studentAudioKey,
                    };
                  });

                  mergedTest.sections[secIdxToUse] = {
                    ...mergedTest.sections[secIdxToUse],
                    questions: updatedQuestions,
                  };
                }
              }
            });
          } else if (existing.answers && typeof existing.answers === "object") {
            // If existing.answers is an object keyed by questionId (newer format),
            // keep it for view/rendering of non-speaking answers
            Object.assign(newAnswersState, existing.answers);
          }

          // apply answers state if we collected any
          if (Object.keys(newAnswersState).length > 0) {
            setAnswers((prev) => ({ ...prev, ...newAnswersState }));
          }
        } // end if existing result exists

        // finally set test
        setTest(mergedTest);
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || err.message || "Failed to load test");
        }
        console.error(err);
      }
    };

    if (testId) fetchAll();

    return () => {
      active = false;
    };
  }, [testId]);






  useEffect(() => {
    if (writingRefs.current.length !== (test?.sections?.length || 0)) {
      writingRefs.current = (test?.sections || []).map(
        (_, i) => writingRefs.current[i] || React.createRef()
      );
    }
  }, [test]);

  const handleAnswerChange = (questionId, itemId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], [itemId]: value },
    }));
  };

  const handleWritingInput = (secIdx, content) => {
    setAnswers((prev) => ({
      ...prev,
      [`writing_${secIdx}`]: content,
    }));
  };

  const handleSubmit = async (fromTimer = false) => {
    if (!fromTimer && !window.confirm("Are you sure you want to finish this test?")) return;

    let score = 0;
    let total = 0;
    if (!test) return;

    // ===== Calculate score =====
    if (["reading", "listening"].includes(test.type)) {
      test.sections.forEach((section) => {
        section.questions.forEach((q) => {
          if (!q) return;

          if (q.type === "matching_headings") {
            (q.questionItems || []).forEach((item, idx) => {
              total++;
              const studentAnswer = answers[q._id]?.[item.id];
              if (!studentAnswer) return;
              const correctValue = q.answers?.[idx]?.value || "";
              if (studentAnswer === correctValue) score++;
            });
            return;
          }

          if (q.type === "summary_completion") {
            (q.answers || []).forEach((correct) => {
              total++;
              const studentAnswer = answers[q._id]?.[correct.id];
              if (!studentAnswer) return;
              if (
                studentAnswer.trim().toLowerCase() ===
                (correct.value || "").trim().toLowerCase()
              )
                score++;
            });
            return;
          }

          (q.questionItems && q.questionItems.length > 0
            ? q.questionItems
            : (q.answers || []).map((ans, idx) => ({
              id: ans.id,
              text: `[${idx + 1}]`,
            }))
          ).forEach((item) => {

            total++;
            const correctObj = (q.answers || []).find((a) => a.id === item.id);
            const correctValue = correctObj?.value ?? "";
            const studentAnswer = answers[q._id]?.[item.id];
            if (!studentAnswer) return;
            if (q.type === "short_answer") {
              if (
                studentAnswer.trim().toLowerCase() ===
                (correctValue || "").trim().toLowerCase()
              )
                score++;
            } else {
              if (studentAnswer === correctValue) score++;
            }
          });
        });
      });
    }

    const resultData = { score, total };
    setResult(resultData);

    //Save to backend if user is a student
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found, skipping save result.");
        return;
      }

      await axios.post(
        `${BASE_URL}/api/tests/${testId}/save-result`,
        { ...resultData, answers, isSubmitted: true },  // attach full answers
        { withCredentials: true }
      );


      console.log("Test result saved successfully.");
    } catch (err) {
      console.error("Failed to save test result:", err.response?.data || err);
    }
  };



  const handleWritingSubmit = async () => {
    if (!test || !test.sections) return;

    const writingSections = test.type === "writing" ? test.sections : [];
    const payload = writingSections.map((section, idx) => ({
      requirement: section.requirement,
      content: answers[`writing_${idx}`] || "",
    }));

    try {
      // 1️⃣ AI evaluation
      const aiRes = await axios.post(
        `${BASE_URL}/api/tests/evaluate-writing`,
        { sections: payload },
        { withCredentials: true }
      );

      // Display AI evaluation 
      setResult({ ...aiRes.data, isSubmitted: true });

      const firstEval = aiRes.data?.evaluations?.[0];
      const band = firstEval?.band || null;
      const feedback = firstEval?.feedback || {};

      // 2️⃣ Save result to DB (only if logged in)
      const token = localStorage.getItem("token");
      if (token) {
        const saveRes = await axios.post(
          `${BASE_URL}/api/tests/${testId}/save-result`,
          {
            band,
            feedback,
            isSubmitted: true,
            answers: writingSections.map((section, idx) => ({
              requirement: section.requirement,
              content: answers[`writing_${idx}`] || "",
            })),
          },
          { withCredentials: true }
        );

        // Make sure saveRes.data has an _id
        setSavedResult(saveRes.data);
        setEvaluationReady(true);

        console.log("Writing result saved successfully.");
      } else {
        console.warn("No token found, skipping result save.");
      }
    } catch (err) {
      console.error("Evaluation or saving failed:", err.response?.data || err);
      alert("Error evaluating or saving writing result");
    }
  };

  const handleSpeakingSubmit = async () => {
    if (!test || !test.sections) return;

    // Build payload for backend
    const speakingSections = test.type === "speaking" ? test.sections.map((section) => ({
      sectionTitle: section.sectionTitle,
      questions: section.questions.map((q) => ({
        requirement: q.requirement,
        studentAudioKey: q.studentAudioKey,
      })),
    })) : [];

    try {
      const res = await axios.post(
        `${BASE_URL}/api/tests/evaluate-speaking`,
        { sections: speakingSections },
        { withCredentials: true }
      );

      setResult(res.data);

      const firstEval = res.data?.evaluations?.[0];
      const band = firstEval?.band || null;
      const feedback = firstEval?.feedback || {};
      const transcript = firstEval?.fullConversation?.map(
        (c) => `Q: ${c.question}\nA: ${c.transcript}`
      ).join("\n\n");

      // Save result
      const token = localStorage.getItem("token");
      // Save result
      if (token) {
        const saveRes = await axios.post(
          `${BASE_URL}/api/tests/${testId}/save-result`,
          {
            band,
            feedback,
            transcript,
            answers: speakingSections.map((section) => ({
              sectionTitle: section.sectionTitle,
              questions: section.questions.map((q) => ({
                requirement: q.requirement,
                studentAudioKey: q.studentAudioKey,
              })),
            })),
          },
          { withCredentials: true }
        );

        // Save the result ID
        setSavedResult(saveRes.data);

      }

      setEvaluationReady(true); // mark AI evaluation done
      console.log("Speaking evaluation completed successfully.");
    } catch (err) {
      console.error("Speaking evaluation failed:", err.response?.data || err);
      alert("Error evaluating speaking test");
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (!test) return <div>Loading...</div>;

  const questionCounter = { current: 0 };

  const readingSections = test.type === "reading" ? test.sections : [];
  const listeningSections = test.type === "listening" ? test.sections : [];
  const writingSections = test.type === "writing" ? test.sections : [];
  const speakingSections = test.type === "speaking" ? test.sections : [];

  return (
    <div className={`test-taking-container ${twoViewMode ? "two-view-layout-active" : ""}`}>
      <h1>{test.name}</h1>
      {/* === Writing Sections (Always Shown) === */}
      {writingSections.map((section, secIdx) => {
        const prevContent = answers[`writing_${secIdx}`] || "";

        // If there is an existing answer, show it using EssayDisplay
        if (prevContent) {
          return (
            <div key={secIdx}>
              <h2>{section.sectionTitle}</h2>
              <div className="requirement-card">
                <p><b>Requirement:</b> {section.requirement}</p>
              </div>

              <EssayDisplay content={prevContent} />
            </div>
          );
        }

        // Otherwise, show editable box
        return (
          <div key={secIdx}>
            <h2>{section.sectionTitle}</h2>
            <div className="requirement-card">
              <p><b>Requirement:</b> {section.requirement}</p>
            </div>

            <div
              ref={writingRefs.current[secIdx]}
              className="writing-box"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => handleWritingInput(secIdx, e.currentTarget.innerHTML)}
              style={{
                backgroundColor: "white",
                cursor: "text",
              }}
            />
          </div>
        );
      })}
      {!viewOnly && test.type === "writing" && !evaluationReady && writingSections.length > 0 && !result?.isSubmitted && (
        <button onClick={handleWritingSubmit}>Submit Writing</button>
      )}
      {test.type === "writing" && result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Result (Evaluate by AI)</h3>
          <p>
            <b>Band:</b> {result.band || result.evaluations?.[0]?.band || "N/A"}
          </p>
          {(result.feedback || (result.evaluations && result.evaluations.length > 0)) && (
            <ul>
              <li>
                <b>Task Response:</b> {result.feedback?.task_response ?? result.evaluations?.[0]?.feedback?.task_response ?? "N/A"}
              </li>
              <li>
                <b>Coherence & Cohesion:</b> {result.feedback?.coherence_cohesion ?? result.evaluations?.[0]?.feedback?.coherence_cohesion ?? "N/A"}
              </li>
              <li>
                <b>Lexical Resource:</b> {result.feedback?.lexical_resource ?? result.evaluations?.[0]?.feedback?.lexical_resource ?? "N/A"}
              </li>
              <li>
                <b>Grammar:</b> {result.feedback?.grammar ?? result.evaluations?.[0]?.feedback?.grammar ?? "N/A"}
              </li>
            </ul>
          )}
        </div>
      )}
      {speakingSections.length > 0 && (
        <div>

          {speakingSections.length > 0 && (
            <div className="speaking-running-track">
              {(() => {
                const section = speakingSections[0];
                const q = section.questions[speakingStep];

                if (!q) return <p>All questions completed.</p>;

                return (
                  <div className="speaking-track-item">
                    <h2>Question {speakingStep + 1}</h2>

                    {/* Question audio */}
                    {q.ttsKey && (
                      <AudioPlayer s3Key={q.ttsKey} autoPlay={false} />
                    )}

                    {/* Recorder (hide if student already recorded) */}
                    {!q.studentAudioKey && !viewOnly && (
                      <AudioRecorder
                        testId={testId}
                        sectionIndex={0}
                        questionIndex={speakingStep}
                        onUploadComplete={(key, clearPreview) => {
                          if (clearPreview) clearPreview();

                          setTest(prev => {
                            const updated = { ...prev };
                            updated.sections[0].questions[speakingStep].studentAudioKey = key;
                            return updated;
                          });
                        }}
                      />
                    )}
                    {/* Playback after recording */}
                    {q.studentAudioKey && (
                      <AudioPlayer s3Key={q.studentAudioKey} />
                    )}
                    {/* Previous BUTTON (only when user has authorize to view) */}
                    {viewOnly && speakingStep > 0 && (
                      <button onClick={() => setSpeakingStep(speakingStep - 1)}>
                        Previous Question
                      </button>
                    )}
                    {/* NEXT BUTTON (only when recording done or user has authorize to view) */}
                    {(viewOnly || q.studentAudioKey) && speakingStep < section.questions.length - 1 && (
                      <button onClick={() => setSpeakingStep(speakingStep + 1)}>
                        Next Question
                      </button>
                    )}
                    {/* FINAL SUBMIT BUTTON */}
                    {!viewOnly && q.studentAudioKey && speakingStep === section.questions.length - 1 && (
                      <button onClick={handleSpeakingSubmit}>
                        Submit Speaking
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
      {!viewOnly && test.type === "speaking" && !evaluationReady && speakingSections.length > 0 && !result?.isSubmitted && (
        <button onClick={handleSpeakingSubmit}>Submit Speaking</button>
      )}
      {test.type === "speaking" && result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Result (Evaluate by AI)</h3>
          <p>
            <b>Band:</b> {result.band || result.evaluations?.[0]?.band || "N/A"}
          </p>
          {(result.feedback || (result.evaluations && result.evaluations.length > 0)) && (
            <ul>
              <li>
                <b>Fluency Coherence:</b> {result.feedback?.fluency_coherence ?? result.evaluations?.[0]?.feedback?.fluency_coherence ?? "N/A"}
              </li>
              <li>
                <b>Lexical Resource:</b> {result.feedback?.lexical_resource ?? result.evaluations?.[0]?.feedback?.lexical_resource ?? "N/A"}
              </li>
              <li>
                <b>Grammatical Range Accuracy:</b> {result.feedback?.grammatical_range_accuracy ?? result.evaluations?.[0]?.feedback?.grammatical_range_accuracy ?? "N/A"}
              </li>
              <li>
                <b>Pronunciation:</b> {result.feedback?.pronunciation ?? result.evaluations?.[0]?.feedback?.pronunciation ?? "N/A"}
              </li>
            </ul>
          )}
        </div>
      )}
      {/* === Teacher Feedback Display === */}
      {savedResult?.isEvaluated?.resultReceived && savedResult?.teacherFeedback && (
        <div>
          <h3>Teacher Feedback</h3>

          {typeof savedResult.teacherFeedback === "string" ? (
            <p style={{ whiteSpace: "pre-wrap" }}>{savedResult.teacherFeedback}</p>
          ) : (
            <ul>
              {Object.entries(savedResult.teacherFeedback).map(([k, v]) => (
                <li key={k}>
                  <b>{k.replace(/_/g, " ").toUpperCase()}:</b> {v}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        {savedResult?.feedback && Object.keys(savedResult.feedback).length > 0 && !savedResult?.isEvaluated?.requested && (
          <button
            onClick={async () => {
              try {
                if (!savedResult?._id) {
                  console.log("[DEBUG] No savedResult yet:", savedResult);
                  return alert("No test result to evaluate yet");
                }

                // Send request to backend
                await axios.post(
                  `${BASE_URL}/api/tests/request-evaluation`,
                  { testId: savedResult.testId },
                  { withCredentials: true }
                );

                // Update local state to mark as requested
                setSavedResult(prev => ({
                  ...prev,
                  isEvaluated: {
                    ...prev.isEvaluated,
                    requested: true,
                  },
                }));

                alert("Teacher evaluation requested successfully!");
              } catch (err) {
                console.error(err);
                alert("Failed to request teacher evaluation");
              }
            }}
          >
            Request Evaluation
          </button>
        )}
      </div>





      {/*Toggle Button for Reading Mode */}
      {(readingSections.length > 0) && (
        <div className="toggle-button">
          <button
            onClick={() => setTwoViewMode(!twoViewMode)}
            title={twoViewMode ? "Switch to One View" : "Switch to Two View"}
          >
            <GoArrowSwitch size={20} />
          </button>
        </div>
      )}


      {/* === Two-View Mode (Split Screen) === */}
      {twoViewMode ? (
        <div className="two-view-layout">
          {/* Left: Passages */}
          <div className="passage-container">
            {[...readingSections, ...listeningSections].map((section, secIdx) => (
              <div key={`passage-${secIdx}`} className="section-block">
                <h3>{section.sectionTitle}</h3>
                {section.passages?.map((passage, idx) => (

                  <div key={idx} className="passage-block">
                    <p>
                      {highlightText
                        ? (() => {
                          const plainText = passage.text.replace(/\s+/g, ' ').trim();
                          const highlight = highlightText.replace(/\s+/g, ' ').trim();

                          const parts = plainText.split(new RegExp(`(${highlight})`, 'gi')); // case-insensitive
                          return parts.map((part, i) =>
                            part.toLowerCase() === highlight.toLowerCase() ? (
                              <span key={i} className="highlight-active">{part}</span>
                            ) : (
                              part
                            )
                          );
                        })()
                        : passage.text}
                    </p>



                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Right: Questions */}
          <div className="question-container">
            {[...readingSections, ...listeningSections].map((section, secIdx) => (
              <div key={`question-${secIdx}`} className="section-block">
                <h3>{section.sectionTitle}</h3>
                {section.questions?.map((q) => (
                  <QuestionBlock
                    key={q._id}
                    question={q}
                    section={section}
                    answers={answers}
                    handleAnswerChange={handleAnswerChange}
                    setHighlightText={setHighlightText}
                    questionCounter={questionCounter}
                    showAnswers={showAnswers}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* === One-View Mode (Original Combined Layout) === */
        <>
          {[{ type: "reading", sections: readingSections }, { type: "listening", sections: listeningSections }].map(
            ({ type, sections }) =>
              sections.map((section, secIdx) => (
                <div key={`${type}-${secIdx}`}>
                  <h2 style={{ textTransform: "capitalize" }}>{type} Section</h2>
                  <h3>{section.sectionTitle}</h3>

                  {type === "listening" && section.audioKey && <AudioPlayer s3Key={section.audioKey} />}
                  {showAnswers && section.transcript && (
                    <div className="transcript-container">
                      <h4>Transcript</h4>
                      <p>
                        {highlightText
                          ? highlightTranscript(section.transcript, highlightText)
                          : section.transcript}
                      </p>
                    </div>
                  )}

                  {section.passages?.map((passage, idx) => (
                    <div key={idx}>
                      <h4>{passage.header}</h4>
                      <p>
                        {highlightText
                          ? (() => {
                            const plainText = passage.text.replace(/\s+/g, ' ').trim();
                            const highlight = highlightText.replace(/\s+/g, ' ').trim();

                            const parts = plainText.split(new RegExp(`(${highlight})`, 'gi')); // case-insensitive
                            return parts.map((part, i) =>
                              part.toLowerCase() === highlight.toLowerCase() ? (
                                <span key={i} className="highlight-active">{part}</span>
                              ) : (
                                part
                              )
                            );
                          })()
                          : passage.text}
                      </p>

                    </div>
                  ))}

                  {Array.isArray(section.images) && section.images.length > 0 && (
                    <div className="section-images">
                      {section.images.map((imgKey, idx) => (
                        <div key={idx} className="image-wrapper">
                          <Image img={{ url: imgKey }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {section.questions?.map((q) => (
                    <QuestionBlock
                      key={q._id}
                      question={q}
                      section={section}
                      answers={answers}
                      handleAnswerChange={handleAnswerChange}
                      setHighlightText={setHighlightText}
                      questionCounter={questionCounter}
                      showAnswers={showAnswers}
                    />
                  ))}
                </div>
              ))
          )}
        </>
      )}

      {/* === Result Display === */}
      {(readingSections.length > 0 || listeningSections.length > 0) && (
        <>
          {/* Only show Submit button if test not submitted yet */}
          {!viewOnly && !result?.isSubmitted && (
            <button onClick={handleSubmit}>Submit</button>
          )}
          {/* After submission, show result + toggle button */}
          {result && (
            <div>
              <h3>
                Result: {result.score} / {result.total}
              </h3>
              <button type="button" className="hide-answer-button" onClick={() => setShowAnswers(!showAnswers)}>
                {showAnswers ? "Hide Answers" : "View Answers"}
              </button>
            </div>
          )}
        </>
      )}
      {/* Timer */}

      {!viewOnly && !isSubmitted && (
        <FloatingTimer
          durationMinutes={60}
          onTimeUp={() => {
            alert("Time is up! Your test will be submitted automatically.");
            handleSubmit(true);
          }}
        />
      )}



    </div>
  );
};


export default StudentTestView;
