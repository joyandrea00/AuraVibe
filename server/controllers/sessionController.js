
const { randomUUID } = require("crypto");
const {
  saveSession,
  getSessions: fetchSessions,
} = require("../services/dynamoService");

// Save a focus session to DynamoDB
async function createSession(req, res) {
  try {
    const session = req.body;

    if (
      !session ||
      typeof session !== "object" ||
      Array.isArray(session) ||
      Object.keys(session).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Session data is required",
      });
    }

    const newSession = {
      ...session,
      id: session.id || randomUUID(),
      serverReceivedAt: new Date().toISOString(),
    };

    await saveSession(newSession);

    return res.status(201).json({
      success: true,
      message: "Focus session saved successfully to DynamoDB",
      session: newSession,
    });
  } catch (error) {
    console.error("Error saving focus session:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save focus session",
    });
  }
}

// Retrieve focus sessions from DynamoDB
async function getSessions(req, res) {
  try {
    const sessions = await fetchSessions();

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error("Error retrieving focus sessions:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve focus sessions",
    });
  }
}

module.exports = {
  createSession,
  getSessions,
};