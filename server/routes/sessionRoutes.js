const express = require("express");

const {
  createSession,
  getSessions,
} = require("../controllers/sessionController");

const router = express.Router();

// POST /api/sessions
router.post("/", createSession);

// GET /api/sessions
router.get("/", getSessions);

module.exports = router;