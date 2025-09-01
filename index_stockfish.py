#### This file is used to parse the Stockfish source code into symbols that can be used to stick in the 
#### .pkl and .index files. Those files are then used to feed context to the LLM when it responds to questions.

import os
import faiss
import pickle
from sentence_transformers import SentenceTransformer

# ✅ Set this to your Stockfish source folder
CODE_DIR = "Stockfish/src"

CHUNK_SIZE = 300
CHUNK_OVERLAP = 50

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

faiss.write_index(index, "stockfish.index")
with open("stockfish_docs.pkl", "wb") as f:
    pickle.dump((docs, paths), f)

print("✅ Done! Index saved.")
