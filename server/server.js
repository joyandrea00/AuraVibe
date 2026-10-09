const express = require("express");
const cors = require("cors");
require("dotenv").config();

const sessionRoutes = require("./routes/sessionRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "AuraVibe backend is running",
    status: "success",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "AuraVibe API",
  });
});

// Session API
app.use("/api/sessions", sessionRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`AuraVibe backend running on http://localhost:${PORT}`);
});