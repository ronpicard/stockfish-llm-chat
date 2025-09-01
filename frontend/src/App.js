import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./App.css";

// ✅ Automatically choose backend URL (remote or local)
const API_URL = process.env.REACT_APP_API_URL;

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
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newChat }),
      });

      const data = await response.json();
      const reply =
        data?.completion?.choices?.[0]?.message?.content ||
        "⚠️ No reply from model";

      setChat([...newChat, { role: "assistant", content: reply }]);
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

  const renderMessage = (msg, idx) => (
    <div key={idx} className={`msg ${msg.role}`}>
      <strong>{msg.role === "user" ? "You" : "Bot"}:</strong>
      <ReactMarkdown
        children={msg.content}
        components={{
          // ✅ Fix invalid nesting issue
          p: ({ node, ...props }) => <div {...props} />,
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (inline) {
              return <code {...props}>{children}</code>;
            } else {
              return (
                <div className="code-block">
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match?.[1] || "cpp"}
                    PreTag="div"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                  <button
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(codeString)}
                  >
                    Copy
                  </button>
                </div>
              );
            }
          },
        }}
      />
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <h2>🤖 Stockfish Chatbot (Mistral)</h2>

        <div className="chat-box" style={{ maxWidth: "600px", textAlign: "left" }}>
          {chat.map(renderMessage)}
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
