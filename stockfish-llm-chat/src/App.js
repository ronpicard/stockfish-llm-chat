import React, { useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newChat = [...chat, { role: "user", content: input }];
    setChat(newChat);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newChat }),
      });

      const data = await response.json();

      // Extract assistant reply from `completion`
      const reply =
        data?.completion?.choices?.[0]?.message?.content ||
        "⚠️ No reply from model";

      // Optionally include retrieved context for debugging
      const debugInfo = data?.retrieved?.length
        ? `\n\n🔎 Context used:\n${data.retrieved.join("\n---\n")}`
        : "";

      setChat([
        ...newChat,
        { role: "assistant", content: reply + debugInfo },
      ]);
    } catch (err) {
      console.error(err);
      setChat([
        ...newChat,
        { role: "assistant", content: "⚠️ Error contacting server" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>🤖 Stockfish Chatbot (Mistral)</h2>

        <div
          className="chat-box"
          style={{ maxWidth: "600px", textAlign: "left", whiteSpace: "pre-wrap" }}
        >
          {chat.map((msg, idx) => (
            <p key={idx}>
              <strong>{msg.role === "user" ? "You" : "Bot"}:</strong>{" "}
              {msg.content}
            </p>
          ))}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            style={{ width: "300px", padding: "8px" }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{ marginLeft: "10px", padding: "8px 16px" }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
