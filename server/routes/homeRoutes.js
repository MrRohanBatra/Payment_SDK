const express = require("express");
const path = require("path");
const router = express.Router();


router.get("/", async (req, res) => {
    console.log("Home route accessed");
    res.sendFile(path.join(__dirname, "../html/index.html"));
});
router.get("/TDD/:filename", (req, res) => {
    const fileName=req.params.filename;
    const filePath=path.join(__dirname,"../html/TDD/",fileName);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error sending file:", err);
            res.status(404).send("File not found");
        } else {
            console.log(`Sent file: ${fileName}`);
        }
    })
});
module.exports = router;