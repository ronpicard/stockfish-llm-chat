const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// Enable CORS for React frontend
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

const PORT = 8000;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_EMBED_URL = "https://api.mistral.ai/v1/embeddings";

// Path to Stockfish docs JSON
const docsPath = path.join(__dirname, "stockfish_docs.json");

let stockfishDocs = [];
if (fs.existsSync(docsPath)) {
  try {
    stockfishDocs = JSON.parse(fs.readFileSync(docsPath, "utf8"));
    console.log(`✅ Loaded ${stockfishDocs.length} Stockfish doc chunks`);
  } catch (err) {
    console.error("❌ Failed to parse stockfish_docs.json:", err.message);
  }
} else {
  console.warn("⚠️ No stockfish_docs.json found. Retrieval will not work.");
}

/**
 * Get embedding from Mistral API
 */
async function getEmbedding(text) {
  try {
    const res = await axios.post(
      MISTRAL_EMBED_URL,
      { model: "mistral-embed", input: text },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
        },
      }
    );
    return res.data.data?.[0]?.embedding || null;
  } catch (err) {
    console.error("❌ Embedding error:", err.response?.data || err.message);
    return null;
  }
}

/**
 * Compute cosine similarity
 */
function cosineSim(a, b) {
  let dot = 0.0,
    normA = 0.0,
    normB = 0.0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve top-K relevant docs from Stockfish (with keyword boosting)
 */
async function retrieveContext(query, k = 3) {
  if (stockfishDocs.length === 0) return [];
  const queryEmbedding = await getEmbedding(query);
  if (!queryEmbedding) return [];

  const lowerQuery = query.toLowerCase();

  const scored = stockfishDocs.map((doc) => {
    let score = cosineSim(queryEmbedding, doc.embedding);

    // 🔎 Keyword boosting: bump if query matches filename or appears inside text
    if (
      doc.path.toLowerCase().includes("uci.cpp") &&
      lowerQuery.includes("uci")
    ) {
      score += 0.25;
    }
    if (doc.text.toLowerCase().includes("uci::loop")) {
      score += 0.25;
    }

    return { ...doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

/**
 * Chat endpoint (with retrieval + inline snippets)
 */
app.post("/chat", async (req, res) => {
  try {
    const userMsg =
      req.body.messages?.[req.body.messages.length - 1]?.content || "";
    const retrieved = await retrieveContext(userMsg, 3);

    let contextBlock;
    if (retrieved.length) {
      contextBlock =
        "Here are exact snippets from Stockfish source that may answer the user. " +
        "If the code looks relevant, show it directly in your answer before explaining:\n\n" +
        retrieved
          .map(
            (doc, i) =>
              `📄 Snippet ${i + 1} (from \`${doc.path}:${doc.start_line}-${doc.end_line}\`):\n\n\`\`\`cpp\n${doc.text}\n\`\`\``
          )
          .join("\n\n");
    } else {
      contextBlock =
        "No relevant Stockfish context found. Answer from general knowledge.";
    }

    const payload = {
      model: req.body.model || "codestral-latest",
      messages: [
        { role: "system", content: contextBlock },
        ...(req.body.messages || []),
      ],
      max_tokens: req.body.max_tokens || 256,
    };

    const response = await axios.post(MISTRAL_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
    });

    // Return retrieved snippets with code content
    res.json({
      retrieved: retrieved.map(
        (doc, i) =>
          `📄 Snippet ${i + 1} (from ${doc.path}:${doc.start_line}-${doc.end_line}):\n\n\`\`\`cpp\n${doc.text}\n\`\`\``
      ),
      completion: response.data,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
