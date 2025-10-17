import "dotenv/config";
import express from 'express';
import Test from '../models/testModel.js';
import multer from "multer";
import path from "path";
import fs from "fs";
import OpenAI from "openai";

const router = express.Router();
//const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create new test
router.post("/", async (req, res) => {
    try {
        const newTest = new Test(req.body);
        await newTest.save();
        res.status(201).json(newTest);
    } catch (err) {
        console.error("Error creating test:", err);
        res.status(500).json({ error: "Failed to create test" });
    }
});

// Get all tests
router.get("/", async (req, res) => {
    try {
        const tests = await Test.find().sort({ createdAt: -1 });
        res.json(tests);
    } catch (err) {
        console.error("Error fetching tests:", err);
        res.status(500).json({ error: "Failed to fetch tests" });
    }
});



// Get test by ID
router.get("/:id", async (req, res) => {
    console.log("Request received for test ID:", req.params.id);
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            console.log("Test not found in DB");
            return res.status(404).json({ error: "Test not found" });
        }
        console.log("Test found, sending to frontend");
        res.json(test);
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ error: "Failed to fetch test." });
    }
});
// Delete test
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Test.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Test not found" });
        res.json({ message: "Test deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete test" });
    }
});

// Update test
router.put("/:id", async (req, res) => {
    try {
        const updated = await Test.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!updated) return res.status(404).json({ error: "Test not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update test" });
    }
});
// Add audio to backend
// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads/audio");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

// Upload audio endpoint
router.post("/upload-audio", upload.single("audio"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Return a URL or relative path
    const audioPath = `/uploads/audio/${req.file.filename}`; 
    res.json({ url: audioPath });
  } catch (err) {
    console.error("Audio upload error:", err);
    res.status(500).json({ error: "Failed to upload audio" });
  }
});



// Evaluate Writing
router.post("/evaluate-writing", async (req, res) => {
  try {
    console.log("[DEBUG] /evaluate-writing called");
    console.log("[DEBUG] Request body:", req.body);

    const { sections } = req.body;

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ error: "No writing sections provided" });
    }

    const results = [];

    // Loop over each writing section
    for (const section of sections) {
      const { requirement, content } = section; // destructure safely

      if (!content?.trim()) {
        results.push({
          requirement: requirement || "No requirement",
          error: "No content provided",
        });
        continue;
      }

      const prompt = `
You are an IELTS writing examiner. Evaluate the following essay according to IELTS Writing Task 2 band descriptors.

Task requirement:
"${requirement || "No specific requirement"}"

Evaluate the student's essay accordingly and give a numeric band (0–9) with short feedback under four criteria:
1. Task Response
2. Coherence and Cohesion
3. Lexical Resource
4. Grammatical Range and Accuracy

Essay:
${content}

Return JSON with fields:
{
  "band": number,
  "feedback": {
    "task_response": string,
    "coherence_cohesion": string,
    "lexical_resource": string,
    "grammar": string
  }
}
`;

      console.log("[DEBUG] Sending prompt to OpenAI for requirement:", requirement);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const text = completion.choices?.[0]?.message?.content?.trim();
      console.log("[DEBUG] Raw OpenAI response:", text);

      let evaluation;
      try {
        evaluation = JSON.parse(text);
      } catch (err) {
        console.error("[DEBUG] JSON parse failed, returning raw text");
        evaluation = { band: null, feedback: { raw: text } };
      }

      results.push({
        requirement,
        ...evaluation,
      });
    }

    res.json({ evaluations: results });
  } catch (err) {
    console.error("[DEBUG] Evaluation error:", err);
    res.status(500).json({ error: "Failed to evaluate writing" });
  }
});



export default router;
