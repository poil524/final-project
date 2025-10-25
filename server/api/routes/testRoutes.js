import "dotenv/config";

import express from 'express';
import Test from '../models/testModel.js';
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import OpenAI from "openai";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { authenticate } from '../middlewares/authMiddleware.js';
//import { Deepgram } from "@deepgram/sdk";
import speech from '@google-cloud/speech';


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { pipeline } from "stream";
import { promisify } from "util";
const streamPipeline = promisify(pipeline);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const router = express.Router();
const client = new speech.SpeechClient();
//const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
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

// GET all tests, optional filter by type
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    if (type && ["listening", "reading", "writing", "speaking"].includes(type)) {
      query.type = type;
    }
    const tests = await Test.find(query).sort({ createdAt: -1 });
    res.json(tests);
  } catch (err) {
    console.error("Error fetching tests:", err);
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});

// Get test by ID
router.get("/:id", async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }
    res.json(test);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Failed to fetch test." });
  }
});


// AUDIO UPLOAD

const storage = multer.memoryStorage();
const upload = multer({ storage });

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
});

const bucketName = 'final-project-ielts-test'
/* Add audio
router.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { testId } = req.body;
    const file = req.file;
    const filename = `${testId}-${Date.now()}-${file.originalname}`;

    const params = {
      Bucket: bucketName,
      Key: `audio/${filename}`,
      Body: file.buffer,
      ContentType: file.mimetype || "audio/mpeg",
      ACL: "private",
    };

    await s3.send(new PutObjectCommand(params));

    res.status(200).json({
      message: "Audio uploaded successfully",
      key: `audio/${filename}`,
    });
  } catch (err) {
    console.error("Error uploading audio:", err);
    res.status(500).json({ error: "Failed to upload audio" });
  }
});
*/
router.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { testId, folderType, studentId } = req.body;
    const file = req.file;

    // Choose folder based on context
    const folder =
      folderType === "student-speaking" ? "student-speaking" : "audio";

    // Include studentId safely if provided
    const studentPart = studentId ? `${studentId}-` : "";

    const filename = `${studentPart}${testId}-${Date.now()}-${file.originalname}`;
    const key = `${folder}/${filename}`;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "audio/mpeg",
      ACL: "private",
    };

    await s3.send(new PutObjectCommand(params));

    res.status(200).json({
      message: `Audio uploaded successfully to ${folder}`,
      key,
    });
  } catch (err) {
    console.error("Error uploading audio:", err);
    res.status(500).json({ error: "Failed to upload audio" });
  }
});



/* Load audio
router.get("/audio-url/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    // if you’re storing with "audio/" prefix, include it:
    const key = `audio/${filename}`;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // TODO: Temp URL. Increase expire time
    res.json({ url });
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});
*/

router.get("/audio-url/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    // Detect which folder to look in
    // (the frontend can send either audio/... or student-speaking/...)
    let key = filename;
    if (!key.startsWith("audio/") && !key.startsWith("student-speaking/")) {
      key = `audio/${key}`; // fallback default
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ url });
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(404).json({ error: `${req.params.filename} not found` });
  }
});





const imageUpload = multer({ storage: multer.memoryStorage() });

// IMAGE UPLOAD (unique key per test)
router.post("/upload-image", imageUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const { testId } = req.body; // frontend must send this
    const file = req.file;
    const filename = `${testId}-${Date.now()}-${file.originalname}`;

    const params = {
      Bucket: bucketName,
      Key: `images/${filename}`,
      Body: file.buffer,
      ContentType: file.mimetype || "image/jpeg",
      ACL: "private",
    };

    await s3.send(new PutObjectCommand(params));

    res.status(200).json({
      message: "Image uploaded successfully",
      key: `images/${filename}`,
    });
  } catch (err) {
    console.error("Error uploading image:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
});


// Load image
router.get("/image-url/:filename", async (req, res) => {
  try {
    let { filename } = req.params;
    const key = filename.startsWith("images/") ? filename : `images/${filename}`;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ url });
  } catch (err) {
    console.error("Error generating image URL:", err);
    res.status(500).json({ error: "Failed to generate image URL" });
  }
});

// Update test
router.put("/:id", async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });

    const oldSections = test.sections || [];
    const newSections = req.body.sections || [];

    const keysToDelete = [];

    oldSections.forEach((old, i) => {
      const fresh = newSections[i] || {};

      // Normalize empty values
      const oldAudio = old.audioKey?.trim() || "";
      const newAudio = fresh.audioKey?.trim() || "";
      const oldImage = old.images?.trim() || "";
      const newImage = fresh.images?.trim() || "";

      if (oldAudio && oldAudio !== newAudio) {
        keysToDelete.push(oldAudio);
        console.log(`[DEBUG] Audio changed: ${oldAudio} → ${newAudio}`);
      }
      if (oldImage && oldImage !== newImage) {
        keysToDelete.push(oldImage);
        console.log(`[DEBUG] Image changed: ${oldImage} → ${newImage}`);
      }
    });

    // Apply updates
    test.name = req.body.name;
    test.type = req.body.type;
    test.sections = newSections;
    test.markModified("sections");
    await test.save();

    // Delete obsolete files from S3
    for (const key of keysToDelete) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
        console.log(`[CLEANUP] Deleted old S3 object: ${key}`);
      } catch (err) {
        console.warn(`[WARN] Failed to delete S3 object: ${key}`, err.message);
      }
    }

    res.json(test);
  } catch (err) {
    console.error("[ERROR] Updating test failed:", err);
    res.status(500).json({ error: "Failed to update test" });
  }
});

// Delete test
router.delete("/:id", async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });

    // Collect all S3 keys to remove
    const keys = [];
    test.sections.forEach((s) => {
      if (s.audioKey) keys.push(s.audioKey);
      if (s.images) keys.push(s.images);
    });

    await Test.findByIdAndDelete(req.params.id);

    // Delete each S3 object
    for (const key of keys) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
        console.log("Deleted S3 object:", key);
      } catch (err) {
        console.warn("Failed to delete S3 object:", key, err.message);
      }
    }

    res.json({ message: "Test and associated media deleted" });
  } catch (err) {
    console.error("Error deleting test:", err);
    res.status(500).json({ error: "Failed to delete test" });
  }
});

// Evaluate speaking
router.post("/evaluate-speaking", async (req, res) => {
  try {
    console.log("[DEBUG] /evaluate-speaking called");
    const { sections } = req.body;

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ error: "No speaking sections provided" });
    }

    const results = [];

    for (const section of sections) {
      const { requirement, audioKey } = section;

      if (!audioKey) {
        results.push({
          requirement,
          error: "No audio file provided",
        });
        continue;
      }

      // Download audio from S3
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: audioKey,
      });
      const audioObj = await s3.send(command);

      // Write to temp file
      const tempFilePath = path.join(tmpdir(), `temp_${Date.now()}.mp3`);
      if (audioObj.Body instanceof Buffer) {
        fs.writeFileSync(tempFilePath, audioObj.Body);
      } else if (audioObj.Body.pipe) {
        await streamPipeline(audioObj.Body, fs.createWriteStream(tempFilePath));
      } else {
        throw new Error("Unexpected S3 Body type");
      }

      // Convert to Base64
      const audioBytes = fs.readFileSync(tempFilePath).toString("base64");

      // Transcribe with Google Cloud Speech
      const [response] = await client.recognize({
        audio: { content: audioBytes },
        config: {
          encoding: "MP3",       // MP3 file
          languageCode: "en-US", // English
        },
      });

      const transcript = response.results
        .map((r) => r.alternatives[0].transcript)
        .join(" ");

      console.log("[DEBUG] Transcript:", transcript);

      // Evaluate transcript using OpenAI GPT
      const prompt = `
You are an IELTS Speaking examiner. Evaluate the following student's speaking performance based on IELTS Speaking Band Descriptors.

Task requirement:
"${requirement || "No specific requirement"}"

Student transcript:
${transcript}

Provide JSON output with these fields:
{
  "band": number (0–9),
  "feedback": {
    "fluency_coherence": string,
    "lexical_resource": string,
    "grammatical_range_accuracy": string,
    "pronunciation": string,
    "summary": string
  }
}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const text = completion.choices?.[0]?.message?.content?.trim();
      console.log("[DEBUG] OpenAI response:", text);

      let evaluation;
      try {
        evaluation = JSON.parse(text);
      } catch {
        evaluation = { band: null, feedback: { summary: text } };
      }

      results.push({
        requirement,
        transcript,
        ...evaluation,
      });

      // Clean up temp file
      fs.unlink(tempFilePath, () => {});
    }

    res.json({ evaluations: results });
  } catch (err) {
    console.error("[ERROR] Speaking evaluation failed:", err);
    res.status(500).json({ error: "Failed to evaluate speaking" });
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

// Save test result to student
// Save test result to student
router.post("/:id/save-result", authenticate, async (req, res) => {
  try {
    const testId = req.params.id;
    const {
      score,
      total,
      band,
      feedback,
      speakingAudioKey,
      transcript
    } = req.body; // include speakingAudioKey + transcript
    const user = req.user; // from authMiddleware

    // Only allow if user is NOT admin/teacher
    if (user.isAdmin || user.isTeacher) {
      return res.status(403).json({ error: "Admins/Teachers cannot save test results." });
    }

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: "Test not found" });

    // Create result entry
    const resultEntry = {
      testId,
      testName: test.name,
      type: test.type,
      score,
      total,
      band,
      feedback,
      speakingAudioKey,
      transcript,
      createdAt: new Date()
    };

    // Push or update existing result for the same test
    const existingIndex = user.testResults.findIndex(
      (r) => r.testId.toString() === testId.toString()
    );

    if (existingIndex >= 0) {
      user.testResults[existingIndex] = resultEntry;
    } else {
      user.testResults.push(resultEntry);
    }

    await user.save();

    // Increment test’s studentsTaken count safely
    test.studentsTaken = (test.studentsTaken || 0) + 1;
    await test.save();

    res.json({ message: "Result saved successfully", testResults: user.testResults });
  } catch (err) {
    console.error("Error saving test result:", err);
    res.status(500).json({ error: "Failed to save test result" });
  }
});


export default router;
