import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const StudentTestView = () => {
  const { id: testId } = useParams(); // get testId from route /view/:id
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/tests/${testId}`);
        setTest(res.data);
      } catch (err) {
        console.error("Error fetching test:", err);
        setError(err.response?.data?.message || err.message);
      }
    };

    if (testId) fetchTest();
  }, [testId]);

const handleAnswerChange = (questionId, itemIndex, value) => {
  setAnswers((prev) => {
    const updated = {
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [itemIndex]: value,
      },
    };
  });
};


  const handleSubmit = () => {
    let score = 0;
    let total = 0;

    test.reading.sections.forEach(section => {
      section.questions.forEach(q => {
        q.answers.forEach(correct => {
          total++;
          const studentAnswer = answers[q._id]?.[correct.index];
          if (studentAnswer === correct.value) {
            score++;
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

          {section.passages.map((passage, idx) => (
            <div key={idx}>
              <h3>Paragraph {passage.header}</h3>
              <p>{passage.text}</p>
            </div>
          ))}
          {section.images?.map((img, idx) => (
            <div key={idx}>
              <img src={img.url} alt={`Section ${secIdx} image ${idx}`} style={{ maxWidth: "100%" }} />
            </div>
          ))}
          {section.questions.map((q) => (
            <div key={q._id}>
              <h4>{q.requirement}</h4>

              {/* Matching Heading */}
              {q.type === "matching_heading" &&
                q.questionItems.map((item) => (
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

              {/* Multiple Choice */}
              {q.type === "multiple_choice" &&
                q.questionItems.map((item, idx) => (
                  <div key={idx}>
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
            </div>
          ))}
        </div>
      ))}
      <button onClick={handleSubmit}>Submit Answers</button>
      {result && (
        <div>
          <h3>Result: {result.score} / {result.total}</h3>
        </div>
      )}
    </div>
  );
};

export default StudentTestView;
