FROM kossnocorp/dev-node:latest

# Ensure directories to mount into.
RUN mkdir -p "$HOME/.config/mothership" && \
  mkdir -p "$HOME/.local" && \
  mkdir -p "$HOME/.cargo" && \
  mkdir -p "$HOME/.codex"

# Install shfmt
RUN sudo apt-get update && \
  sudo apt-get install -y shfmt