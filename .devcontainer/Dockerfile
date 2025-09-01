# Use Node.js official image
FROM node:20-bullseye

# Set working directory
WORKDIR /workspace

# Install sudo and basic tools
USER root
RUN apt-get update && apt-get install -y sudo git curl \
    && rm -rf /var/lib/apt/lists/*

# Give the 'node' user sudo privileges (no password)
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install Python for proxy server
RUN apt-get update && apt-get install -y python3 python3-pip

# Install dependencies for proxy
RUN pip3 install fastapi uvicorn requests


# Switch back to node user (recommended for devcontainers)
USER node
