import "dotenv/config";

import express from 'express';
import Test from '../models/testModel.js';
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import OpenAI from "openai";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { authenticate } from '../middlewares/authMiddleware.js';
import { createClient } from "@deepgram/sdk";
import { requestEvaluation } from '../controllers/userController.js';

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { pipeline } from "stream";
import { promisify } from "util";
const streamPipeline = promisify(pipeline);

const router = express.Router();

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create new test — only teachers or admins
router.post("/", authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (user.isTeacher && user.status !== "approved") {
      return res.status(403).json({ error: "Teacher approval pending." });
    }
    if (!user.isTeacher && !user.isAdmin) {
      return res.status(403).json({ error: "Only teachers or admins can create tests." });
    }

    const newTest = new Test({
      ...req.body,
      createdBy: user._id, // track creator
    });

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

// Generate TTS audio for speaking test questions
router.post("/:id/generate-speaking-audio", authenticate, async (req, res) => {
  try {
    const testId = req.params.id;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: "Test not found" });
    if (test.type !== "speaking") {
      return res.status(400).json({ error: "Only speaking tests need TTS generation" });
    }

    for (const [secIdx, section] of test.sections.entries()) {
      for (const [qIdx, question] of (section.questions || []).entries()) {
        if (!question.requirement?.trim()) continue;

        // Generate TTS with Deepgram
        const ttsResponse = await deepgram.speak.request(
          { text: question.requirement },
          { model: "aura-asteria-en", encoding: "linear16", container: "wav" }
        );

        const audioStream = await ttsResponse.getStream();
        if (!audioStream) throw new Error("Failed to get TTS audio stream from Deepgram");

        // Save temp file
        const tmpPath = path.join(tmpdir(), `tts_${Date.now()}.wav`);
        await streamPipeline(audioStream, fs.createWriteStream(tmpPath));

        // Upload to S3
        const key = `audio/${testId}_${secIdx}_${qIdx}_${Date.now()}.wav`;
        await s3.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fs.createReadStream(tmpPath),
          ContentType: "audio/wav",
          ACL: "private",
        }));

        fs.unlinkSync(tmpPath);

        // Update the specific TTS key atomically in DB
        await Test.findByIdAndUpdate(
          testId,
          { $set: { [`sections.${secIdx}.questions.${qIdx}.ttsKey`]: key } }
        );
      }
    }

    res.json({ message: "TTS audio generated successfully for all speaking questions." });
  } catch (err) {
    console.error("[ERROR] TTS generation failed:", err);
    res.status(500).json({ error: "Failed to generate TTS audio for speaking test" });
  }
});


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


// Update test — admins can edit any; teachers only their own
router.put("/:id", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });

    // Permission check
    if (!user.isAdmin) {
      if (!user.isTeacher) {
        return res.status(403).json({ error: "Only teachers or admins can edit tests." });
      }
      if (user.isTeacher && user.status !== "approved") {
        return res.status(403).json({ error: "Teacher approval pending." });
      }
      if (test.createdBy?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: "Teachers can only edit their own tests." });
      }
    }

    const oldSections = test.sections || [];
    const newSections = req.body.sections || [];
    const keysToDelete = [];

    oldSections.forEach((old, i) => {
      const fresh = newSections[i] || {};
      const oldAudio = old.audioKey?.trim() || "";
      const newAudio = fresh.audioKey?.trim() || "";

      if (oldAudio && oldAudio !== newAudio) keysToDelete.push(oldAudio);

      // Handle images (arrays)
      const oldImages = Array.isArray(old.images) ? old.images : (old.images ? [old.images] : []);
      const newImages = Array.isArray(fresh.images) ? fresh.images : (fresh.images ? [fresh.images] : []);

      // Find deleted images
      oldImages.forEach(img => {
        if (!newImages.includes(img)) keysToDelete.push(img);
      });


    });

    // Apply updates
    test.name = req.body.name;
    test.type = req.body.type;
    test.sections = newSections;
    test.markModified("sections");
    await test.save();

    // Cleanup S3
    for (const key of keysToDelete) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      } catch (err) {
        console.warn(`Failed to delete S3 object: ${key}`, err.message);
      }
    }

    res.json(test);
  } catch (err) {
    console.error("Updating test failed:", err);
    res.status(500).json({ error: "Failed to update test" });
  }
});

// Delete test — admins can delete any; teachers only their own
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });

    // Permission check
    if (!user.isAdmin) {
      if (!user.isTeacher) {
        return res.status(403).json({ error: "Only teachers or admins can delete tests." });
      }
      if (user.isTeacher && user.status !== "approved") {
        return res.status(403).json({ error: "Teacher approval pending." });
      }
      if (test.createdBy?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: "Teachers can only delete their own tests." });
      }
    }

    // Collect all S3 keys to remove
    const keys = [];

    test.sections.forEach((s) => {
      // section-level audio + images
      if (s.audioKey) keys.push(s.audioKey);
      if (Array.isArray(s.images)) keys.push(...s.images);
      else if (s.images) keys.push(s.images);

      // question-level audio (TTS + student recordings)
      s.questions?.forEach((q) => {
        if (q.ttsKey) keys.push(q.ttsKey);
        if (q.studentAudioKey) keys.push(q.studentAudioKey);
      });
    });



    await Test.findByIdAndDelete(req.params.id);

    // Delete media from S3
    for (const key of keys) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
        console.log("Deleted S3 object:", key);
      } catch (err) {
        console.warn("Failed to delete S3 object:", key, err.message);
      }
    }

    res.json({ message: "Test and media deleted" });
  } catch (err) {
    console.error("Error deleting test:", err);
    res.status(500).json({ error: "Failed to delete test" });
  }
});

router.post("/evaluate-speaking", async (req, res) => {
  try {
    console.log("[DEBUG] /evaluate-speaking called");

    const { sections } = req.body;
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ error: "No speaking sections provided" });
    }

    const fullConversation = []; // we'll collect (question + transcript) pairs
    const bucketName = process.env.AWS_BUCKET_NAME || "final-project-ielts-test";

    for (const section of sections) {
      for (const q of section.questions || []) {
        const audioKey = q.studentAudioKey;
        if (!audioKey) continue;

        console.log(`[DEBUG] Transcribing question: ${q.requirement}`);

        // 1️⃣ Download audio from S3
        const command = new GetObjectCommand({ Bucket: bucketName, Key: audioKey });
        const audioObj = await s3.send(command);

        // Write to temp
        const tmpFile = path.join(tmpdir(), `sp_${Date.now()}.wav`);
        if (audioObj.Body instanceof Buffer) {
          fs.writeFileSync(tmpFile, audioObj.Body);
        } else if (audioObj.Body.pipe) {
          await streamPipeline(audioObj.Body, fs.createWriteStream(tmpFile));
        }

        // 2️⃣ Transcribe with Deepgram
        const audioBuffer = fs.readFileSync(tmpFile);
        const { result } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
          model: "nova-3",
          smart_format: true,
          language: "en-US",
        });

        const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
        fullConversation.push({
          question: q.requirement,
          transcript,
        });

        fs.unlinkSync(tmpFile);
      }
    }

    if (fullConversation.length === 0) {
      return res.status(400).json({ error: "No valid audio found for any speaking question." });
    }

    // Build a unified evaluation prompt
    const prompt = `
You are an IELTS Speaking examiner. Evaluate the student's *entire speaking test* below.
Consider fluency, coherence, lexical resource, grammar, and pronunciation holistically.

Each question and transcript is shown below:

${fullConversation.map(
      (c, i) => `Q${i + 1}: ${c.question}\nStudent: ${c.transcript}\n`
    ).join("\n")}

Provide one combined evaluation as JSON:
{
  "band": number (0–9),
  "feedback": {
    "fluency_coherence": string,
    "lexical_resource": string,
    "grammatical_range_accuracy": string,
    "pronunciation": string
  }
}
`;

    // Send to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    console.log("[DEBUG] Prompt:", prompt);
    const text = completion.choices?.[0]?.message?.content?.trim() || "";
    console.log("[DEBUG] OpenAI response:", text);

    let evaluation;
    try {
      evaluation = JSON.parse(text);
    } catch {
      evaluation = { band: null, feedback: { summary: text } };
    }

    // Return combined evaluation + individual transcripts
    res.json({
      evaluations: [
        {
          band: evaluation.band,
          feedback: evaluation.feedback,
          fullConversation,
        },
      ],
    });
  } catch (err) {
    console.error("[ERROR] Speaking evaluation failed:", err);
    res.status(500).json({ error: "Failed to evaluate speaking test" });
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

      console.log("[DEBUG] Sending prompt to OpenAI for requirement:", prompt);

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

//Save test result to student
router.post("/:id/save-result", authenticate, async (req, res) => {
  try {
    const testId = req.params.id;
    const {
      score,
      total,
      band,
      feedback,
      speakingAudioKey,
      transcript,
      answers
    } = req.body;
    const user = req.user;

    if (user.isAdmin || user.isTeacher) {
      return res.status(403).json({ error: "Admins/Teachers cannot save test results." });
    }

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: "Test not found" });

    const resultEntry = {
      testId,
      testName: test.name,
      type: test.type,
      answers: answers || {},
      score,
      total,
      band,
      feedback,
      speakingAudioKey,
      transcript,
      takenAt: new Date(),
      isSubmitted: true
    };

    let newResult;
    const existingIndex = user.testResults.findIndex(
      (r) => r.testId.toString() === testId.toString()
    );

    if (existingIndex >= 0) {
      // update existing
      user.testResults[existingIndex] = {
        ...resultEntry,
        isSubmitted: true  
      };
      newResult = user.testResults[existingIndex];
    } else {
      // push new
      user.testResults.push(resultEntry);
      newResult = user.testResults[user.testResults.length - 1];
    }

    await user.save();

    // Increment test studentsTaken safely
    test.studentsTaken = (test.studentsTaken || 0) + 1;
    await test.save();

    // Return the newly saved test result (with _id)
    res.json(newResult);
  } catch (err) {
    console.error("Error saving test result:", err);
    res.status(500).json({ error: "Failed to save test result" });
  }
});

router.get("/:id/get-result", authenticate, async (req, res) => {

  const user = req.user;
  const testId = req.params.id;
  user.testResults.forEach((r, index) => {

  });

  const result = user.testResults.find(r => {
    const match = r.testId.toString() === testId.toString();
    return match;
  });

  
  if (!result) {
    return res.json(null);
  }

  return res.json(result);
});


// Student requests evaluation for a test result
router.post("/request-evaluation", authenticate, async (req, res) => {
  const { testId } = req.body;

  if (!testId) {
    return res.status(400).json({ message: "Missing testId" });
  }

  const user = req.user;

  const testResult = user.testResults.find(
    (r) => r.testId.toString() === testId.toString()
  );

  if (!testResult) {
    return res.status(404).json({ error: "Test result not found for this testId" });
  }

  // --- NEW: Add evaluation request flags ---
  testResult.isEvaluated = {
    requested: true,
    resultReceived: false
  };

  await user.save(); // persist changes

  // Pass correct testResultId to controller
  req.body.testResultId = testResult._id;

  return requestEvaluation(req, res);
});




export default router;
