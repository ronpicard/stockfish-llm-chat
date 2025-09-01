
# Live demo!: https://ronpicard.github.io/stockfish-llm-chat/


# ♟️ Stockfish LLM Chatbot  

This is an interactive LLM chatbot that uses **Mistral AI** models with retrieval-augmented generation (RAG) from the **Stockfish** chess engine source code. You can ask it direct questions about the stockfish source code as it is fed direct context from the source files. Frontend is built in **React**, backend in **Express/Node.js**, and deployed with **Render (backend)** + **GitHub Pages (frontend)**.  

---

## 🚀 Features  
- Full-stack monorepo (`frontend/` + `backend/`)  
- Retrieval of Stockfish source snippets via embeddings  
- Chat powered by [Mistral API](https://docs.mistral.ai/)  
- Supports both **local development** and **production** (Render + GitHub Pages)  
- Code snippets are syntax-highlighted with a copy button  
- CORS configured for local + GitHub Pages frontend  

---

## 🗂 General Project Structure  
stockfish-llm-chat/
├── backend/ # Express.js server
│ ├── server.js
│ ├── package.json
│ ├── stockfish_docs.json
│ ├── stockfish_docs.pkl
│ └── stockfish.index
│
├── frontend/ # React app
│ ├── public/
│ ├── src/
│ │ ├── App.js
│ │ ├── App.css
│ │ └── ...
│ └── package.json
│-- stockfish_docs.json
│── stockfish_docs.pkl
│── stockfish.index
|-- index_stockfish.py
└── README.md

---

## ⚙️ Backend Setup (Express + Mistral API)  

### 1. Install dependencies
bash
cd backend
npm install

### 2. Add environment variables

Create a .env file inside backend/:
MISTRAL_API_KEY=your_api_key_here 
PORT=8000
Note: Mistal is currently free for experimentation. 

### 3. Run & test locally
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How does Stockfish handle UCI commands?"}]}'

## 🎨 Frontend Setup (React + GitHub Pages)
### 1. Install dependencies
cd frontend
npm install

### 2. Environment variables

React requires env vars prefixed with REACT_APP_.
Create .env.development for local and .env.production for deploy:

.env.development
REACT_APP_API_URL=http://localhost:8000/chat

.env.production
REACT_APP_API_URL=https://stockfish-llm-chat.onrender.com/chat

## Run locally (for testing)
docker-compose up --build
docker-compose down

(or use npm start in both the front end and back end)

Frontend runs at 👉 http://localhost:3000

It will talk to the backend at http://localhost:8000.

## Deploy remotely (for production)

### Deploy to GitHub Pages

Build and deploy:
npm run deploy

The app will be live at:
👉 https://YOUR_GITHUB_USERNAME.github.io/stockfish-llm-chat

#### ☁️ Deploy Backend to Render

Create a new Render Web Service
Select: Node (instead of Docker)
Root Directory: backend
Environment: Node (or Docker if you use your Dockerfile)
Build Command: npm install
Start Command: npm start
Add MISTRAL_API_KEY in Render’s Environment Variables


Deploy → Backend will be at
👉 https://stockfish-llm-chat.onrender.com

🔧 Useful Commands
Backend
cd backend
npm run dev    # dev mode with auto-reload
npm start      # normal start

Frontend
cd frontend
npm start      # run locally
npm run build  # create production build
npm run deploy # deploy to GitHub Pages

🔒 Security Notes

API key is only stored in backend .env (never exposed in frontend).
.env and .env.production must be gitignored. (always double check)

