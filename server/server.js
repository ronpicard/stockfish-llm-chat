const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");   // <--- add this
require("dotenv").config();

const app = express();

// Enable CORS (allow React dev server)
app.use(cors({
  origin: "http://localhost:3000",  // allow frontend
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());

const PORT = 8000;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

app.post("/chat", async (req, res) => {
  try {
    const payload = {
      model: req.body.model || "codestral-latest",
      messages: req.body.messages || [],
      max_tokens: req.body.max_tokens || 256,
    };

    const response = await axios.post(MISTRAL_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
