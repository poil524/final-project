import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

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

  const handleSubmit = () => {
    let score = 0;
    let total = 0;

    test.reading.sections.forEach((section) => {
      section.questions.forEach((q) => {
        if (!q) return;
        if (q.type === "matching_headings") {
          (q.questionItems || []).forEach((item, idx) => {
            total++;

            // Student's answer
            const studentAnswer = answers[q._id]?.[item.id];
            if (!studentAnswer) return; // skip blank

            // Correct answer corresponds by index in q.answers
            const correctValue = q.answers?.[idx]?.value || "";

            if (studentAnswer === correctValue) score++;
          });
          return; // skip the rest of this question
        }
        // Summary completion: answers array corresponds to blanks
        if (q.type === "summary_completion") {
          (q.answers || []).forEach((correct) => {
            total++;
            const studentAnswer = answers[q._id]?.[correct.id];

            // Skip if student didn’t answer
            if (!studentAnswer) return;

            if (
              studentAnswer.trim().toLowerCase() ===
              (correct.value || "").trim().toLowerCase()
            ) {
              score++;
            }

          });
          return;
        }

        // Other question types: iterate questionItems (each has id)
        (q.questionItems || []).forEach((item) => {
          total++;
          const correctObj = (q.answers || []).find((a) => a.id === item.id);
          const correctValue = correctObj?.value ?? "";
          const studentAnswer = answers[q._id]?.[item.id];

          // Skip if student didn’t answer
          if (studentAnswer === undefined || studentAnswer === "") return;

          if (q.type === "short_answer") {
            if (
              studentAnswer.trim().toLowerCase() ===
              (correctValue || "").trim().toLowerCase()
            ) {
              score++;
            }
          } else {
            if (studentAnswer === correctValue) score++;
          }

        });
      });
    });

    setResult({ score, total });
  };

  if (error) return <div>Error: {error}</div>;
  if (!test) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => navigate(-1)}>⬅ Back to test list</button>
      <h1>{test.name}</h1>

      {test.reading.sections.map((section, secIdx) => (
        <div key={secIdx}>
          <h2>{section.sectionTitle}</h2>

          {section.passages?.map((passage, idx) => (
            <div key={idx}>
              <h3>Paragraph {passage.header}</h3>
              <p>
                {highlightText && passage.text.includes(highlightText)
                  ? passage.text
                    .split(highlightText)
                    .map((part, i, arr) =>
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

          {section.questions?.map((q) => {
            if (!q) return null;

            // Build safe option lists and display items with fallbacks
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
              <div key={q._id} style={{ marginBottom: 12 }}>
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
                {q.type === "matching_sentence_endings" && (
                  <div>
                    {(q.questionItems || []).map((item, idx) => {
                      return (
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
                      );
                    })}
                  </div>
                )}

                {/* Matching Features */}
                {q.type === "matching_features" && (
                  <div>
                    {(q.questionItems || []).map((item, idx) => (
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
                  </div>
                )}

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
                            onChange={(e) =>
                              handleAnswerChange(q._id, q.answers?.[idx]?.id, e.target.value)
                            }
                            style={{ margin: "0 5px" }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <button onClick={handleSubmit}>Submit Answers</button>

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

      {showAnswers && (
        <div>
          {test.reading.sections.map((section, secIdx) => (
            <div key={secIdx}>
              {section.questions?.map((q) => (
                <div key={q._id} style={{ marginBottom: 12 }}>
                  <h4>{q.requirement}</h4>

                  {/* Summary review */}
                  {q.type === "summary_completion" &&
                    (q.answers || []).map((ans, i) => {
                      const studentAns = answers[q._id]?.[ans.id] || "—";
                      const correctAns = ans.value || "—";
                      const isCorrect =
                        (studentAns || "").trim().toLowerCase() === (correctAns || "").trim().toLowerCase();
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
                      correctAns = q.answers?.[idx]?.value || "—"; // match by index
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
                          onMouseEnter={() =>
                            setHighlightText(q.answers?.[idx]?.sourceText || null)
                          }
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
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTestView;
