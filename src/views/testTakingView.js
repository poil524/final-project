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
  const headingDisplayItems =
    q.shuffledItems?.length > 0
      ? q.shuffledItems.map((si) => ({
        key: si.key ?? si.id,
        headingLabel: si.headingLabel,
        text: si.text,
      }))
      : (q.questionItems || []).map((it) => ({
        key: it.id,
        headingLabel: it.headingLabel,
        text: it.text,
      }));

  const endingOptions =
    q.shuffledEnds?.length > 0
      ? q.shuffledEnds.map((e) => (typeof e === "string" ? e : e.value))
      : (q.answers || []).map((a) => a.value);

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
    const sourceText = getSourceText(itemId); // full DB text
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



  return (
    <div className="question-block">
      <h4>{q.requirement}</h4>

      {(q.questionItems || []).map((item) => {
        questionCounter.current++;

        // === Show answers mode ===
        if (showAnswers) {
          return (
            <div key={item.id} style={{ marginBottom: 8 }}>
              <label>
                {questionCounter.current}. {item.text}: {renderAnswer(item.id)}
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

          case "short_answer":
          case "summary_completion":
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

          (q.questionItems || []).forEach((item) => {
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

      /*await axios.post(
        `${BASE_URL}/api/tests/${testId}/save-result`,
        resultData,
        {
          withCredentials: true,
          //headers: { Authorization: `Bearer ${token}` },
        }
      );*/
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
        /*await axios.post(
          `${BASE_URL}/api/tests/${testId}/save-result`,
          { band, feedback },
          { headers: { Authorization: `Bearer ${token}` } }
        );*/
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

    const speakingSections = test.type === "speaking" ? test.sections : [];
    const payload = speakingSections.map((section) => ({
      requirement: section.requirement,
      audioKey: section.audioKey,
    }));

    try {
      const res = await axios.post(
        `${BASE_URL}/api/tests/evaluate-writing`,
        { sections: payload },
        { withCredentials: true }
      );

      setResult(res.data);

      // Extract first evaluation (you can expand for multi-part speaking)
      const firstEval = res.data?.evaluations?.[0];
      const band = firstEval?.band || null;
      const feedback = firstEval?.feedback || {};
      const transcript = firstEval?.transcript || "";

      // Save speaking result to backend
      const token = localStorage.getItem("token");
      if (token) {
        /*await axios.post(
          `${BASE_URL}/api/tests/${testId}/save-result`,
          { band, feedback, transcript },
          { headers: { Authorization: `Bearer ${token}` } }
        );*/
        await axios.post(
          `${BASE_URL}/api/tests/${testId}/save-result`,
          { speakingAudioKey: payload[0]?.audioKey || null },
          { withCredentials: true }
        );



        console.log("Speaking result saved successfully.");
      } else {
        console.warn("No token found, skipping result save.");
      }
    } catch (err) {
      console.error("Evaluation or saving failed:", err.response?.data || err);
      alert("Error evaluating or saving speaking result");
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

      {/* === Speaking Sections === */}
      {speakingSections.length > 0 && (
        <div>
          {speakingSections.map((section, secIdx) => (
            <div key={secIdx} className="speaking-section">
              <h3>{section.sectionTitle}</h3>

              {section.requirement && (
                <p><b>Task:</b> {section.requirement}</p>
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

          {/* Add the Submit button here */}
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

                  {section.images && <Image img={{ url: section.images }} />}

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
