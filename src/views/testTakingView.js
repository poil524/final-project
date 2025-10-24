import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import AudioPlayer from "../components/AudioPlayer";
import Image from "../components/Image";
import './TestTakingView.css';
import { GoArrowSwitch } from "react-icons/go";

const QuestionBlock = ({ question: q, section, answers, handleAnswerChange, setHighlightText, questionCounter }) => {
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

  return (
    <div className="question-block">
      <h4>{q.requirement}</h4>

      {q.type === "matching_paragraph_information" &&
        (q.questionItems || []).map((item) => {
          questionCounter.current++;
          return (
            <div key={item.id}>
              <label>
                {questionCounter.current}. {item.text}
              </label>
              <select
                value={answers[q._id]?.[item.id] || ""}
                onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
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
        })}

      {q.type === "matching_headings" &&
        headingDisplayItems.map((disp) => {
          const original = (q.questionItems || []).find((it) => it.id === disp.key) || {};
          const studentAnswer = answers[q._id]?.[original.id] || "";
          questionCounter.current++;
          return (
            <div key={disp.key} style={{ marginBottom: 8 }}>
              <label>
                {questionCounter.current}. {disp.text}
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
        })}

      {q.type === "matching_sentence_endings" &&
        (q.questionItems || []).map((item) => {
          questionCounter.current++;
          const studentAnswer = answers[q._id]?.[item.id] || "";
          return (
            <div key={item.id} style={{ marginBottom: 8 }}>
              <label>
                {questionCounter.current}. {item.text}
              </label>
              <select
                value={studentAnswer}
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
        })}

      {q.type === "matching_features" && (
        <div className="feature-list-box" style={{ marginBottom: 12 }}>
          <div
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "12px",
              borderRadius: "6px",
              background: "#f9f9f9",
            }}
          >
            <strong>{q.featureListTitle || "Feature List"}:</strong>
            <ul style={{ margin: "5px 0 0 0", paddingLeft: "20px" }}>
              {(q.features || []).map((feature, idx) => {
                const label = q.featureLabelType === "i" ? ["i", "ii", "iii", "iv", "v", "vi", "vii"][idx] : String.fromCharCode(65 + idx);
                return <li key={idx}>{label}. {feature}</li>;
              })}
            </ul>
          </div>

          {(q.questionItems || []).map((item) => {
            questionCounter.current++;
            const studentAnswer = answers[q._id]?.[item.id] || "";
            return (
              <div key={item.id} style={{ marginBottom: 8 }}>
                <label>
                  {questionCounter.current}. {item.text}
                </label>
                <select
                  value={studentAnswer}
                  onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
                >
                  <option value="">-- Select Feature --</option>
                  {(q.features || []).map((feature, fIdx) => {
                    const label = q.featureLabelType === "i" ? ["i", "ii", "iii", "iv", "v", "vi", "vii"][fIdx] : String.fromCharCode(65 + fIdx);
                    return (
                      <option key={fIdx} value={feature}>
                        {label}. {feature}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {q.type === "multiple_choice" &&
        (q.questionItems || []).map((item) => {
          questionCounter.current++;
          return (
            <div key={item.id}>
              <p>{questionCounter.current}. {item.text}</p>
              {(item.options || []).map((option, optIdx) => (
                <label key={optIdx} style={{ display: "block" }}>
                  <input
                    type="radio"
                    name={`${q._id}_${item.id}`}
                    value={option}
                    checked={answers[q._id]?.[item.id] === option}
                    onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
                  />
                  {option}
                </label>
              ))}
            </div>
          );
        })}

      {q.type === "true_false_not_given" &&
        (q.questionItems || []).map((item) => {
          questionCounter.current++;
          return (
            <div key={item.id}>
              <label>{questionCounter.current}. {item.text}</label>
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
        })}

      {q.type === "yes_no_not_given" &&
        (q.questionItems || []).map((item) => {
          questionCounter.current++;
          return (
            <div key={item.id}>
              <label>{questionCounter.current}. {item.text}</label>
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
        })}

      {q.type === "short_answer" &&
        (q.questionItems || []).map((item) => {
          questionCounter.current++;
          return (
            <div key={item.id}>
              <label>{questionCounter.current}. {item.text}</label>
              <input
                type="text"
                value={answers[q._id]?.[item.id] || ""}
                onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
              />
            </div>
          );
        })}
      {q.type === "summary_completion" &&
        (q.answers || []).map((ans, idx) => {
          questionCounter.current++;
          const studentAns = answers[q._id]?.[ans.id] || "";
          return (
            <div key={ans.id}>
              <label>{questionCounter.current}. Blank {idx + 1}</label>
              <input
                type="text"
                value={studentAns}
                onChange={(e) => handleAnswerChange(q._id, ans.id, e.target.value)}
              />
            </div>
          );
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
        const res = await axios.get(`${BASE_URL}/api/tests/${testId}`);
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

  const handleSubmit = () => {
    if (!window.confirm("Are you sure you want to finish this test?")) return;

    let score = 0;
    let total = 0;
    if (!test) return;

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
    setResult({ score, total });
  };


  const handleWritingSubmit = async () => {
    if (!test || !test.sections) return;
    const writingSections = test.type === "writing" ? test.sections : [];
    const payload = writingSections.map((section, idx) => ({
      requirement: section.requirement,
      content: answers[`writing_${idx}`] || "",
    }));
    try {
      const res = await axios.post(`${BASE_URL}/api/tests/evaluate-writing`, { sections: payload });
      setResult(res.data);
    } catch (err) {
      console.error("[DEBUG] Evaluation request failed:", err);
      alert("Error evaluating writing");
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (!test) return <div>Loading...</div>;

  const questionCounter = { current: 0 };

  const readingSections = test.type === "reading" ? test.sections : [];
  const listeningSections = test.type === "listening" ? test.sections : [];
  const writingSections = test.type === "writing" ? test.sections : [];

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
                    <h4>{passage.header}</h4>
                    <p>
                      {highlightText && passage.text.includes(highlightText)
                        ? passage.text.split(highlightText).map((part, i, arr) =>
                          i < arr.length - 1 ? (
                            <React.Fragment key={i}>
                              {part}
                              <span className="highlight-active">{highlightText}</span>
                            </React.Fragment>
                          ) : (
                            part
                          )
                        )
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
                        {highlightText && passage.text.includes(highlightText)
                          ? passage.text.split(highlightText).map((part, i, arr) =>
                            i < arr.length - 1 ? (
                              <React.Fragment key={i}>
                                {part}
                                <span className="highlight-active">{highlightText}</span>
                              </React.Fragment>
                            ) : (
                              part
                            )
                          )
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
          <button onClick={handleSubmit}>Submit Answers</button>
          {result && result.score !== undefined && result.total !== undefined && (
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
