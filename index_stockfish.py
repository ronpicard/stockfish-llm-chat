#### This file is used to parse the Stockfish source code into symbols that can be used
#### to generate .json and .index files. These files are then used to feed context
#### to the LLM when it responds to questions.

import os
import faiss
import json
from sentence_transformers import SentenceTransformer

# ✅ Path to your Stockfish source folder
CODE_DIR = "Stockfish/src"

# Chunking params (line-based)
CHUNK_SIZE = 40       # number of lines per chunk
CHUNK_OVERLAP = 10    # overlap between chunks

def load_code_files():
    chunks = []
    for root, _, files in os.walk(CODE_DIR):
        for f in files:
            if f.endswith((".cpp", ".h", ".hpp", ".cc")):
                path = os.path.join(root, f)
                with open(path, "r", encoding="utf-8", errors="ignore") as file:
                    lines = file.readlines()

                # Split by lines
                for i in range(0, len(lines), CHUNK_SIZE - CHUNK_OVERLAP):
                    chunk_lines = lines[i:i+CHUNK_SIZE]
                    chunk = "".join(chunk_lines)

                    chunks.append({
                        "text": chunk,
                        "path": path,
                        "start_line": i + 1,
                        "end_line": i + len(chunk_lines)
                    })
    return chunks

print("📂 Loading Stockfish source files...")
docs = load_code_files()
print(f"✅ Loaded {len(docs)} chunks")

print("🔎 Embedding with MiniLM...")
embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
embeddings = embedder.encode([d["text"] for d in docs], convert_to_tensor=False)

print("📦 Building FAISS index...")
dim = embeddings[0].shape[0]
index = faiss.IndexFlatL2(dim)
index.add(embeddings)

faiss.write_index(index, "stockfish.index")

# Store embeddings alongside chunks
for d, emb in zip(docs, embeddings):
    d["embedding"] = emb.tolist()

with open("stockfish_docs.json", "w") as f:
    json.dump(docs, f)

print("✅ Done! Saved stockfish_docs.json + stockfish.index")
