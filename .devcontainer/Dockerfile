# .devcontainer/Dockerfile
FROM node:20-bullseye

WORKDIR /workspace

# Install base deps
RUN apt-get update && apt-get install -y sudo git curl python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
RUN pip3 install fastapi uvicorn requests

# Copy everything (frontend/backend will use this context separately)
COPY . .

# Default shell
CMD [ "bash" ]
