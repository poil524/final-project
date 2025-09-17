import express from 'express';
import Test from '../models/testModel.js';

const router = express.Router();


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

// Get all tests (for test list)
router.get("/", async (req, res) => {
    try {
        const tests = await Test.find().select("name createdAt");
        // only return basic info for list
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

export default router;
