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
        console.log("DEBUG fetched test:", res.data); // DEBUG: check test structure
        setTest(res.data);
      } catch (err) {
        console.error("Error fetching test:", err);
        setError(err.response?.data?.message || err.message);
      }
    };

    if (testId) fetchTest();
  }, [testId]);

  const handleAnswerChange = (questionId, itemIndex, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [itemIndex]: value,
      },
    }));
  };

  const handleSubmit = () => {
    let score = 0;
    let total = 0;

    test.reading.sections.forEach((section) => {
      section.questions.forEach((q) => {
        q.answers.forEach((correct) => {
          total++;
          const studentAnswer = answers[q._id]?.[correct.index];
          // No case sensitive for input text type of questions
          if (q.type === "short_answer" || q.type === "summary_completion") {
            if ((studentAnswer || "").trim().toLowerCase() === (correct.value || "").trim().toLowerCase()) {
              score++;
            }
          } else {
            if (studentAnswer === correct.value) {
              score++;
            }
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
              <img
                src={img.url}
                alt={`Section ${secIdx} image ${idx}`}
                style={{ maxWidth: "100%" }}
              />
            </div>
          ))}

          {section.questions?.map((q) => {
            console.log("DEBUG question:", q._id, "type:", q.type, "shuffledItems:", q.shuffledItems); // DEBUG
            return (
              <div key={q._id}>
                <h4>{q.requirement}</h4>
                {/* Matching Paragraph Information */}
                {q.type === "matching_paragraph_information" &&
                  q.questionItems?.map((item) => (
                    <div key={item.index}>
                      <label>
                        {item.index}. {item.text}
                      </label>
                      <select
                        value={answers[q._id]?.[item.index] || ""}
                        onChange={(e) =>
                          handleAnswerChange(q._id, item.index, e.target.value)
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
                  ))}
                {/* Matching Headings */}
                {q.type === "matching_headings" && (
                  <div>
                    {(q.shuffledItems || []).map((shuffledItem, idx) => {
                      const originalItem = q.questionItems?.find(
                        (item) => item.headingLabel === shuffledItem.headingLabel
                      );
                      if (!originalItem) return null; // safety check
                      const studentAnswer = answers[q._id]?.[originalItem.index] || "";
                      return (
                        <div key={shuffledItem.key || idx} style={{ marginBottom: "10px" }}>
                          <label>
                            {idx + 1}. {shuffledItem.text}
                          </label>
                          <select
                            value={studentAnswer}
                            onChange={(e) =>
                              handleAnswerChange(q._id, originalItem.index, e.target.value)
                            }
                          >
                            <option value="">-- Select Paragraph --</option>
                            {section.passages?.map((p) => (
                              <option key={p.header} value={p.header}>
                                {p.header}
                              </option>
                            )) || null}
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
                      const label = item?.sentenceBegin || "";
                      return (
                        <div key={item.index} style={{ marginBottom: "10px" }}>
                          <label>{idx + 1}. {label}</label>
                          <select
                            value={answers[q._id]?.[item.index] || ""}
                            onChange={(e) =>
                              handleAnswerChange(q._id, item.index, e.target.value)
                            }
                          >
                            <option value="">-- Select Ending --</option>
                            {(q.shuffledEnds || []).map((end) => (
                              <option key={end.key} value={end.key}>
                                {end.key}. {end.value}
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
                    {(q.questionItems || []).map((item, idx) => {
                      const label = item?.sentenceBegin || "";
                      return (
                        <div key={item.index} style={{ marginBottom: "10px" }}>
                          <label>{idx + 1}. {label}</label>
                          <select
                            value={answers[q._id]?.[item.index] || ""}
                            onChange={(e) =>
                              handleAnswerChange(q._id, item.index, e.target.value)
                            }
                          >
                            <option value="">-- Select Features --</option>
                            {(q.shuffledEnds || []).map((end) => (
                              <option key={end.key} value={end.key}>
                                {end.key}. {end.value}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Multiple Choice */}
                {q.type === "multiple_choice" &&
                  q.questionItems?.map((item) => (
                    <div key={item.index}>
                      <p>{item.text}</p>
                      {item.options.map((option, optIdx) => (
                        <label key={optIdx} style={{ display: "block" }}>
                          <input
                            type="radio"
                            name={`${q._id}_${item.index}`}
                            value={option}
                            checked={answers[q._id]?.[item.index] === option}
                            onChange={(e) =>
                              handleAnswerChange(q._id, item.index, e.target.value)
                            }
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  ))}
                {/* True / False / Not Given */}
                {q.type === "true_false_not_given" &&
                  q.questionItems?.map((item) => (
                    <div key={item.index}>
                      <label>{item.index}. {item.text}</label>
                      <select
                        value={answers[q._id]?.[item.index] || ""}
                        onChange={(e) => handleAnswerChange(q._id, item.index, e.target.value)}
                      >
                        <option value="">-- Select --</option>
                        <option value="True">True</option>
                        <option value="False">False</option>
                        <option value="Not Given">Not Given</option>
                      </select>
                    </div>
                  ))}
                {/* Yes/ No / Not Given */}
                {q.type === "yes_no_not_given" &&
                  q.questionItems?.map((item) => (
                    <div key={item.index}>
                      <label>{item.index}. {item.text}</label>
                      <select
                        value={answers[q._id]?.[item.index] || ""}
                        onChange={(e) => handleAnswerChange(q._id, item.index, e.target.value)}
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
                  q.questionItems?.map((item) => (
                    <div key={item.index}>
                      <label>{item.index}. {item.text}</label>
                      <input
                        type="text"
                        value={answers[q._id]?.[item.index] || ""}
                        onChange={(e) => handleAnswerChange(q._id, item.index, e.target.value)}
                      />
                    </div>
                  ))}
                {/* Summary Completion */}
                {q.type === "summary_completion" && (
                  <div>
                    <p>
                      {(q.summary || "").split(/\[BLANK\]/).map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <>
                              <b>{i + 1}.</b>
                              <input
                                type="text"
                                style={{ width: "120px", margin: "0 5px" }}
                                value={answers[q._id]?.[i + 1] || ""}
                                onChange={(e) =>
                                  handleAnswerChange(q._id, i + 1, e.target.value)
                                }
                              />
                            </>
                          )}
                        </span>
                      ))}
                    </p>
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
                <div key={q._id}>
                  <h4>{q.requirement}</h4>
                  {(q.questionItems?.length
                    ? q.questionItems
                    : q.begins?.map((b, i) => ({
                      index: i + 1,
                      text: b,
                    })) || []
                  ).map((item) => {
                    const studentAns = answers[q._id]?.[item.index] || "—";
                    const correctAns =
                      q.answers?.find((a) => a.index === item.index)?.value || "—";
                    const isCorrect = studentAns === correctAns;

                    return (
                      <p key={item.index}>
                        {item.text || item.sentenceBegin || ""} <br />
                        Your answer:{" "}
                        <span style={{ color: isCorrect ? "green" : "red" }}>
                          {studentAns}
                        </span>{" "}
                        | Correct:{" "}
                        <span
                          style={{ color: "green", cursor: "pointer" }}
                          onMouseEnter={() =>
                            setHighlightText(
                              q.answers?.find((a) => a.index === item.index)
                                ?.sourceText || null
                            )
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
