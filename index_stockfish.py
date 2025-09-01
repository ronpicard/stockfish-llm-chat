#### This file is used to parse the Stockfish source code into symbols that can be used
#### to generate .pkl, .index, and .json files. These files are then used to feed context
#### to the LLM when it responds to questions.

import os
import faiss
import pickle
import json
from sentence_transformers import SentenceTransformer

# ✅ Path to Stockfish source folder
CODE_DIR = "Stockfish/src"

CHUNK_SIZE = 800   # keep functions together
CHUNK_OVERLAP = 100


def load_code_files():
    texts = []
    paths = []
    for root, _, files in os.walk(CODE_DIR):
        for f in files:
            if f.endswith((".cpp", ".h", ".hpp", ".cc")):  # only C++ code
                path = os.path.join(root, f)
                with open(path, "r", encoding="utf-8", errors="ignore") as file:
                    text = file.read()
                    # Split into chunks
                    for i in range(0, len(text), CHUNK_SIZE - CHUNK_OVERLAP):
                        chunk = text[i:i+CHUNK_SIZE]
                        texts.append(chunk)
                        paths.append(path)
    return texts, paths

print("📂 Loading Stockfish source files...")
docs, paths = load_code_files()
print(f"Loaded {len(docs)} chunks from {len(paths)} files")

print("🔎 Embedding with MiniLM...")
embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
embeddings = embedder.encode(docs, convert_to_tensor=False)

print("📦 Building FAISS index...")
dim = embeddings[0].shape[0]
index = faiss.IndexFlatL2(dim)
index.add(embeddings)

# Save FAISS index
faiss.write_index(index, "stockfish.index")

# Save PKL (for backup/debugging)
with open("stockfish_docs.pkl", "wb") as f:
    pickle.dump((docs, paths), f)

# Save JSON (for Node.js backend)
docs_json = []
for text, emb, path in zip(docs, embeddings, paths):
    docs_json.append({
        "text": text,
        "embedding": emb.tolist(),  # convert NumPy array → JSON serializable
        "path": path
    })

with open("stockfish_docs.json", "w", encoding="utf-8") as f:
    json.dump(docs_json, f)

print("✅ Done! Saved stockfish.index, stockfish_docs.pkl, and stockfish_docs.json")
