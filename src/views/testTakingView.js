import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

// Reusable question rendering
const QuestionBlock = ({ question: q, section, answers, handleAnswerChange, setHighlightText }) => {
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
    <div style={{ marginBottom: 12 }}>
      <h4>{q.requirement}</h4>

      {/* Matching Paragraph Information */}
      {q.type === "matching_paragraph_information" &&
        (q.questionItems || []).map((item, idx) => (
          <div key={item.id}>
            <label>
              {idx + 1}. {item.text}
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
        ))}

      {/* Matching Headings */}
      {q.type === "matching_headings" && (
        <div>
          {headingDisplayItems.map((disp, idx) => {
            const original = (q.questionItems || []).find((it) => it.id === disp.key) || {};
            const studentAnswer = answers[q._id]?.[original.id] || "";
            return (
              <div key={disp.key || idx} style={{ marginBottom: 8 }}>
                <label>
                  {idx + 1}. {disp.text}
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
        </div>
      )}

      {/* Matching Sentence Endings */}
      {q.type === "matching_sentence_endings" &&
        (q.questionItems || []).map((item, idx) => (
          <div key={item.id} style={{ marginBottom: 8 }}>
            <label>
              {idx + 1}. {item.text}
            </label>
            <select
              value={answers[q._id]?.[item.id] || ""}
              onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
            >
              <option value="">-- Select Ending --</option>
              {endingOptions.map((opt, i) => (
                <option key={opt + i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}

      {/* Matching Features */}
      {q.type === "matching_features" &&
        (q.questionItems || []).map((item, idx) => (
          <div key={item.id} style={{ marginBottom: 8 }}>
            <label>
              {idx + 1}. {item.text}
            </label>
            <select
              value={answers[q._id]?.[item.id] || ""}
              onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
            >
              <option value="">-- Select Feature --</option>
              {endingOptions.map((opt, i) => (
                <option key={opt + i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}

      {/* Multiple Choice */}
      {q.type === "multiple_choice" &&
        (q.questionItems || []).map((item) => (
          <div key={item.id}>
            <p>{item.text}</p>
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
        ))}

      {/* True / False / Not Given */}
      {q.type === "true_false_not_given" &&
        (q.questionItems || []).map((item) => (
          <div key={item.id}>
            <label>{item.text}</label>
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
        ))}

      {/* Yes / No / Not Given */}
      {q.type === "yes_no_not_given" &&
        (q.questionItems || []).map((item) => (
          <div key={item.id}>
            <label>{item.text}</label>
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
        ))}

      {/* Short Answer */}
      {q.type === "short_answer" &&
        (q.questionItems || []).map((item) => (
          <div key={item.id}>
            <label>{item.text}</label>
            <input
              type="text"
              value={answers[q._id]?.[item.id] || ""}
              onChange={(e) => handleAnswerChange(q._id, item.id, e.target.value)}
            />
          </div>
        ))}

      {/* Summary Completion */}
      {q.type === "summary_completion" && (
        <div>
          {(q.summary || "").split("[BLANK]").map((part, idx, arr) => (
            <React.Fragment key={idx}>
              {part}
              {idx < arr.length - 1 && (
                <input
                  type="text"
                  value={answers[q._id]?.[q.answers?.[idx]?.id] || ""}
                  onChange={(e) => handleAnswerChange(q._id, q.answers?.[idx]?.id, e.target.value)}
                  style={{ margin: "0 5px" }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const StudentTestView = () => {
  const { id: testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [highlightText, setHighlightText] = useState(null);

  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/tests/${testId}`);
        setTest(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    };
    if (testId) fetchTest();
  }, [testId]);

  const handleAnswerChange = (questionId, itemId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [itemId]: value,
      },
    }));
  };

  const handleWritingInput = (secIdx, content) => {
    setAnswers((prev) => ({
      ...prev,
      [`writing_${secIdx}`]: content,
    }));
  };

  const handleSubmit = () => {
    let score = 0;
    let total = 0;

    ["reading", "listening"].forEach((type) => {
      test[type]?.sections.forEach((section) => {
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
              if (studentAnswer.trim().toLowerCase() === (correct.value || "").trim().toLowerCase())
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
              if (studentAnswer.trim().toLowerCase() === (correctValue || "").trim().toLowerCase())
                score++;
            } else {
              if (studentAnswer === correctValue) score++;
            }
          });
        });
      });
    });

    setResult({ score, total });
  };

const handleWritingSubmit = async () => {
  const writingSections = test.writing?.sections || [];

  // Extract content and requirement for each writing section
  const payload = writingSections.map((section, idx) => ({
    requirement: section.requirement,
    content: answers[`writing_${idx}`] || "",
  }));

  console.log("[DEBUG] Writing payload:", payload);

  try {
    const res = await axios.post(
      "http://localhost:5000/api/tests/evaluate-writing",
      { sections: payload }
    );
    setResult(res.data);
  } catch (err) {
    console.error("[DEBUG] Evaluation request failed:", err);
    alert("Error evaluating writing");
  }
};




  if (error) return <div>Error: {error}</div>;
  if (!test) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => navigate(-1)}>⬅ Back to test list</button>
      <h1>{test.name}</h1>
      {test.writing?.sections?.length > 0 &&
        test.writing.sections.map((section, secIdx) => (
          <div
            key={secIdx}
            style={{
              border: "1px solid gray",
              padding: "15px",
              margin: "10px 0",
              borderRadius: "8px",
            }}
          >
            <h2>{section.sectionTitle}</h2>
            <p><b>Requirement:</b> {section.requirement}</p>

            {/* Simple Rich Text Editor */}
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => handleWritingInput(secIdx, e.currentTarget.innerHTML)}
              onKeyDown={(e) => {
                // Disable undo (Ctrl+Z / Cmd+Z)
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                  e.preventDefault();
                }
                // Disable redo (Ctrl+Y / Cmd+Shift+Z)
                if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
                  e.preventDefault();
                }
              }}
              style={{
                border: "1px solid #ccc",
                minHeight: "200px",
                padding: "10px",
                marginTop: "10px",
                outline: "none",
                background: "#fff",
                fontSize: "16px",
                lineHeight: "1.6",
              }}
              placeholder="Start typing here..."
            ></div>
          </div>
        ))}
      <button onClick={handleWritingSubmit}>Submit</button>

      {result?.evaluations?.length > 0 && (
  <div style={{ marginTop: 16 }}>
    <h3>AI Marking Results</h3>
    {result.evaluations.map((ev, idx) => (
      <div key={idx} style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "10px",
        marginBottom: "12px",
        background: "#f9f9f9",
      }}>
        {ev.error ? (
          <p style={{ color: "red" }}>{ev.error}</p>
        ) : (
          <>
            <p><b>Overall Band:</b> {ev.band ?? "—"}</p>
            <ul>
              <li><b>Task Response:</b> {ev.feedback?.task_response || "—"}</li>
              <li><b>Coherence & Cohesion:</b> {ev.feedback?.coherence_cohesion || "—"}</li>
              <li><b>Lexical Resource:</b> {ev.feedback?.lexical_resource || "—"}</li>
              <li><b>Grammar:</b> {ev.feedback?.grammar || "—"}</li>
            </ul>
          </>
        )}
      </div>
    ))}
  </div>
)}


      {["reading", "listening"].map((type) => (
        <div key={type}>
          <h2 style={{ textTransform: "capitalize" }}>{type} Section</h2>

          {test[type]?.sections?.map((section, secIdx) => (
            <div key={secIdx}>
              <h3>{section.sectionTitle}</h3>

              {type === "listening" && section.audioUrl && (
                <audio controls src={section.audioUrl} style={{ marginBottom: 12 }} />
              )}
              {/*
              {type === "listening" && section.transcript && (
                <p><strong>Transcript:</strong> {section.transcript}</p>
              )}
*/}
              {section.passages?.map((passage, idx) => (
                <div key={idx}>
                  <h4>Paragraph {passage.header}</h4>
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

              {section.images?.map((img, idx) => (
                <div key={idx}>
                  <img src={img.url} alt={`Section ${secIdx} image ${idx}`} style={{ maxWidth: "100%" }} />
                </div>
              ))}

              {section.questions?.map((q) => (
                <QuestionBlock
                  key={q._id}
                  question={q}
                  section={section}
                  answers={answers}
                  handleAnswerChange={handleAnswerChange}
                  setHighlightText={setHighlightText}
                />
              ))}
            </div>
          ))}
        </div>
      ))}

{/* Only show for reading or listening */}
{(test.reading?.sections?.length > 0 || test.listening?.sections?.length > 0) && (
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



      {showAnswers &&
        ["reading", "listening"].map((type) =>
          test[type]?.sections.map((section, secIdx) => (
            <div key={`${type}-${secIdx}`}>
              {/* Show transcript for listening sections */}
              {type === "listening" && section.transcript && (
                <div style={{ marginBottom: 12, background: "#f1f1f1", padding: "8px" }}>
                  <strong>Transcript:</strong>
                  <p>{section.transcript}</p>
                </div>
              )}
              {section.questions?.map((q) => (
                <div key={q._id} style={{ marginBottom: 12 }}>
                  <h4>{q.requirement}</h4>

                  {/* Summary review */}
                  {q.type === "summary_completion" &&
                    (q.answers || []).map((ans, i) => {
                      const studentAns = answers[q._id]?.[ans.id] || "—";
                      const correctAns = ans.value || "—";
                      const isCorrect =
                        (studentAns || "").trim().toLowerCase() ===
                        (correctAns || "").trim().toLowerCase();
                      return (
                        <p key={ans.id}>
                          Blank {i + 1}: Your answer:{" "}
                          <span style={{ color: isCorrect ? "green" : "red" }}>{studentAns}</span> | Correct:{" "}
                          <span style={{ color: "green" }}>{correctAns}</span>
                        </p>
                      );
                    })}

                  {/* Other types */}
                  {(q.questionItems || []).map((item, idx) => {
                    let correctAns = "—";
                    if (q.type === "matching_headings") {
                      correctAns = q.answers?.[idx]?.value || "—";
                    } else {
                      correctAns = q.answers?.find((a) => a.id === item.id)?.value || "—";
                    }
                    const studentAns = answers[q._id]?.[item.id] || "—";
                    const isCorrect =
                      studentAns === correctAns ||
                      (studentAns || "").trim().toLowerCase() === (correctAns || "").trim().toLowerCase();

                    return (
                      <p key={item.id}>
                        {(item.text || "") + " "}
                        <br />
                        Your answer: <span style={{ color: isCorrect ? "green" : "red" }}>{studentAns}</span> | Correct:{" "}
                        <span
                          style={{ color: "green", cursor: "pointer" }}
                          onMouseEnter={() => setHighlightText(q.answers?.[idx]?.sourceText || null)}
                          onMouseLeave={() => setHighlightText(null)}
                        >
                          {correctAns}
                        </span>
                      </p>
                    );
                  })}
                </div>
              ))}
            </div>
          ))
        )}
    </div>
  );
};

export default StudentTestView;
