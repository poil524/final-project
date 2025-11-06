import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import AudioPlayer from "../components/AudioPlayer";
import Image from "../components/Image";
import AudioRecorder from "../components/AudioRecorder";
import './TestTakingView.css';
import { GoArrowSwitch } from "react-icons/go";

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

          case "short_answer":
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

  const [test, setTest] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [highlightText, setHighlightText] = useState(null);
  const [twoViewMode, setTwoViewMode] = useState(false);


  const BASE_URL = "http://localhost:5000";


  useEffect(() => {
    let active = true;
    const fetchTest = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/tests/${testId}`, {
          withCredentials: true,
        });

        if (!active) return;
        const fetchedTest = res.data;
        const shuffle = (arr) => (arr ? [...arr].sort(() => Math.random() - 0.5) : []);

        const updatedSections = fetchedTest.sections.map((section) => ({
          ...section,
          questions: section.questions.map((q) => {
            const newQ = { ...q };
            if (q.type === "matching_headings") {
              newQ.shuffledItems = shuffle((q.questionItems || []).map((it) => ({ ...it, key: it.id })));
            } else if (q.type === "matching_sentence_endings" || q.type === "matching_features") {
              newQ.shuffledEnds = shuffle(q.answers || []);
            }
            return newQ;
          }),
        }));

        setTest({ ...fetchedTest, sections: updatedSections });

      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message);
        console.error("Fetch test failed:", err);
      }
    };
    // After setTest(...)
    const fetchExistingResult = async () => {
      try {
        const res2 = await axios.get(`${BASE_URL}/api/tests/${testId}/get-result`, {
          withCredentials: true
        });

        const existing = res2.data;
        if (!existing) return;

        // restore previous answers & score
        setAnswers(existing.answers || {});
        setResult({ score: existing.score, total: existing.total });
        setShowAnswers(true); // auto reveal answers
        console.log("Loaded previous attempt:", existing);
      } catch (err) {
        console.log("No previous result or error:", err.response?.data || err.message);
      }
    };

    fetchExistingResult();


    if (testId) fetchTest();
    return () => {
      active = false;
    };
  }, [testId]);



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

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to finish this test?")) return;

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
        { ...resultData, answers },  // attach full answers
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
      // Evaluate writing using OpenAI 
      const res = await axios.post(
        `${BASE_URL}/api/tests/evaluate-writing`,
        { sections: payload },
        { withCredentials: true }
      );

      setResult(res.data);

      // Extract band and feedback from evaluation result
      const firstEval = res.data?.evaluations?.[0];
      const band = firstEval?.band || null;
      const feedback = firstEval?.feedback || {};

      // Save writing result if user is a student
      const token = localStorage.getItem("token");
      if (token) {

        await axios.post(
          `${BASE_URL}/api/tests/${testId}/save-result`,
          { band, feedback },
          { withCredentials: true }
        );

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
      if (token) {
        await axios.post(
          `${BASE_URL}/api/tests/${testId}/save-result`,
          { band, feedback, transcript },
          { withCredentials: true }
        );
      }

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
      {writingSections.map((section, secIdx) => (
        <div key={secIdx}>
          <h2>{section.sectionTitle}</h2>
          <p><b>Requirement:</b> {section.requirement}</p>
          <div
            className="writing-box"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => handleWritingInput(secIdx, e.currentTarget.innerHTML)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") e.preventDefault();
              if (
                (e.ctrlKey || e.metaKey) &&
                (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))
              )
                e.preventDefault();
            }}
          ></div>
        </div>
      ))}

      {writingSections.length > 0 && (
        <button onClick={handleWritingSubmit}>Submit Writing</button>
      )}

      {/*
  Speaking Sections
  {speakingSections.length > 0 && (
    <div>
      {speakingSections.map((section, secIdx) => (
        <div key={secIdx} className="speaking-section">
          <h3>{section.sectionTitle}</h3>

          {section.requirement && (
            <p><b>Task:</b> {section.requirement}</p>
          )}
          {section.questions?.length > 0 && (
            <div className="speaking-questions">
              <h4>Questions:</h4>
              <ul>
                {section.questions.map((q, qIdx) => (
                  <li key={q._id || qIdx}>
                    <strong>Q{qIdx + 1}:</strong> {q.requirement || q.text || "No question text"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AudioRecorder
            testId={testId}
            sectionIndex={secIdx}
            onUploadComplete={(key, clearLocalPreview) => {
              if (clearLocalPreview) clearLocalPreview();

              setTest((prev) => {
                const updatedSections = [...prev.sections];
                updatedSections[secIdx] = { ...updatedSections[secIdx], audioKey: key };
                return { ...prev, sections: updatedSections };
              });

              const token = localStorage.getItem("token");
              if (token) {
                axios.post(
                  `${BASE_URL}/api/tests/${testId}/save-result`,
                  { speakingAudioKey: key },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              }
            }}
          />

          {section.audioKey && (
            <div style={{ marginTop: "10px" }}>
              <AudioPlayer s3Key={section.audioKey} />
            </div>
          )}
        </div>
      ))}

      <button onClick={handleSpeakingSubmit} style={{ marginTop: "20px" }}>
        Submit Speaking
      </button>

      {result?.evaluations && (
        <div className="speaking-result" style={{ marginTop: "15px" }}>
          <h3>Speaking Evaluation Result</h3>
          {result.evaluations.map((evalData, idx) => (
            <div key={idx}>
              {evalData.transcript && (
                <details>
                  <summary>View Transcript</summary>
                  <p>{evalData.transcript}</p>
                </details>
              )}
              <p><b>Band:</b> {evalData.band || "N/A"}</p>
              {evalData.feedback && (
                <ul>
                  <li><b>Fluency & Coherence:</b> {evalData.feedback.fluency_coherence}</li>
                  <li><b>Lexical Resource:</b> {evalData.feedback.lexical_resource}</li>
                  <li><b>Grammar Range & Accuracy:</b> {evalData.feedback.grammatical_range_accuracy}</li>
                  <li><b>Pronunciation:</b> {evalData.feedback.pronunciation}</li>
                  <li><b>Summary:</b> {evalData.feedback.summary}</li>
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )}
*/}

      {speakingSections.length > 0 && (
        <div>
          {speakingSections.map((section, secIdx) => (
            <div key={secIdx} className="speaking-section">
              <h3>{section.sectionTitle}</h3>

              {section.requirement && (
                <p><b>Task:</b> {section.requirement}</p>
              )}

              {section.questions?.length > 0 && (
                <div className="speaking-questions">
                  <h4>Questions:</h4>
                  <ul>
                    {section.questions.map((q, qIdx) => (
                      <li key={q._id || qIdx} style={{ marginBottom: "25px" }}>
                        <strong>Q{qIdx + 1}:</strong>{" "}
                        {q.requirement || q.text || "No question text"}

                        {/* 🎧 Question Audio */}
                        {q.ttsKey && (
                          <div style={{ marginTop: "8px" }}>
                            <AudioPlayer s3Key={q.ttsKey} autoPlay={false} />
                          </div>
                        )}
                        {/* 🎙️ Individual Recorder for this Question */}
                        {/* 🎙️ Individual Recorder for this Question */}
                        <AudioRecorder
                          testId={testId}
                          sectionIndex={secIdx}
                          questionIndex={qIdx}
                          onUploadComplete={(key, clearLocalPreview) => {
                            if (clearLocalPreview) clearLocalPreview();

                            setTest((prev) => {
                              const updatedSections = [...prev.sections];
                              const updatedQuestions = [...updatedSections[secIdx].questions];
                              updatedQuestions[qIdx] = {
                                ...updatedQuestions[qIdx],
                                studentAudioKey: key, // ✅ save under the new field
                              };
                              updatedSections[secIdx] = {
                                ...updatedSections[secIdx],
                                questions: updatedQuestions,
                              };
                              return { ...prev, sections: updatedSections };
                            });

                            const token = localStorage.getItem("token");
                            if (token) {
                              axios.post(
                                `${BASE_URL}/api/tests/${testId}/save-result`,
                                { speakingAudioKey: key },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                            }
                          }}
                        />

                        {/* ✅ Student's Recorded Answer Playback */}
                        {q.studentAudioKey && (
                          <div style={{ marginTop: "8px" }}>
                            <AudioPlayer s3Key={q.studentAudioKey} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {/* Submit entire speaking test */}
          <button onClick={handleSpeakingSubmit} style={{ marginTop: "20px" }}>
            Submit Speaking
          </button>

          {/* Show result if available */}
          {result?.evaluations && (
            <div className="speaking-result" style={{ marginTop: "15px" }}>
              <h3>Speaking Evaluation Result</h3>
              {result.evaluations.map((evalData, idx) => (
                <div key={idx}>
                  {evalData.transcript && (
                    <details>
                      <summary>View Transcript</summary>
                      <p>{evalData.transcript}</p>
                    </details>
                  )}
                  <p><b>Band:</b> {evalData.band || "N/A"}</p>
                  {evalData.feedback && (
                    <ul>
                      <li><b>Fluency & Coherence:</b> {evalData.feedback.fluency_coherence}</li>
                      <li><b>Lexical Resource:</b> {evalData.feedback.lexical_resource}</li>
                      <li><b>Grammar Range & Accuracy:</b> {evalData.feedback.grammatical_range_accuracy}</li>
                      <li><b>Pronunciation:</b> {evalData.feedback.pronunciation}</li>
                      <li><b>Summary:</b> {evalData.feedback.summary}</li>
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}





      {/* === Toggle Button for Reading/Listening View Mode === */}
      {(readingSections.length > 0 || listeningSections.length > 0) && (
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
          {!result ? (
            <button onClick={handleSubmit}>Submit</button>
          ) : (
            <p><i>You have already completed this test.</i></p>
          )}


          {/* After submission, show result + toggle button */}
          {result && (
            <div>
              <h3>
                Result: {result.score} / {result.total}
              </h3>
              <button onClick={() => setShowAnswers(!showAnswers)}>
                {showAnswers ? "Hide Answers" : "View Answers"}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );

};

export default StudentTestView;
