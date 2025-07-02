const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const audioDirectory = path.join(__dirname, "..", "audio");
router.get("/audio/:filename", (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(audioDirectory,fileName);

    console.log(`📥 Request for /audio/${fileName}`);
    console.log("🔍 Full path:", filePath);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log(`❌ File not found: ${filePath}`);
            return res.status(404).send("Audio file not found");
        }

        res.setHeader("Content-Type", "audio/wav"); // or detect MIME if needed
        const readStream = fs.createReadStream(filePath);
        console.log(`✅ Streaming audio: ${filePath}`);
        readStream.pipe(res);
    });
});


router.get("/list-audio", (req, res) => {
    const audioDir = audioDirectory;

    fs.readdir(audioDir, (err, files) => {
        if (err) {
            console.error("❌ Error reading audio directory:", err);
            return res.status(500).json({ error: true, message: "Unable to read audio folder" });
        }

        // Filter only audio files (optional: .wav or .mp3)
        const audioFiles = files.filter(file => file.endsWith(".wav") || file.endsWith(".mp3"));

        console.log("📁 Audio files found:", audioFiles);
        res.json({ files: audioFiles });
    });
});


router.get("/get-audio", (req, res) => {
    const relativeUrl = req.query.url;
    console.log("📥 GET /get-audio called");
    console.log("👉 Query param url:", relativeUrl);

    if (!relativeUrl || !relativeUrl.startsWith("/audio/")) {
        console.log("❌ Invalid or missing audio URL");
        return res.status(400).json({ error: true, message: "Invalid or missing audio URL" });
    }

    const fileName = relativeUrl.replace("/audio/", "");
    const filePath = path.join(audioDirectory,fileName);

    console.log("🔍 Checking file path:", filePath);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log("❌ File does not exist:", filePath);
            return res.status(404).json({ error: true, message: "Audio file not found" });
        }

        console.log("✅ File found. Streaming:", filePath);
        res.setHeader("Content-Type", "audio/wav");
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});


module.exports = router;