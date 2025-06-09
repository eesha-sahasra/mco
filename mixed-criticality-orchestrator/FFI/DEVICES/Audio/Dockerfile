# Use Debian latest as base image
FROM debian:latest

# Set environment variables to avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV PULSE_SERVER=unix:/run/user/1000/pulse/native

# Install required dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    alsa-utils \
    libasound2-dev \
    portaudio19-dev \
    pulseaudio \
    pulseaudio-utils \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for audio processing
# Change the default home directory for audio_user
RUN useradd -m -d /opt/audio_home audio_user && \
    usermod -aG audio,pulse,pulse-access audio_user && \
    echo "audio_user ALL=(ALL) NOPASSWD: /usr/bin/pulseaudio" >> /etc/sudoers

# Create PulseAudio config directory in a writable location
RUN mkdir -p /opt/audio_home/.config/pulse && \
    mkdir -p /run/user/1000/pulse && \
    chown -R audio_user:audio_user /opt/audio_home/.config /run/user/1000 && \
    chmod -R 777 /opt/audio_home/.config /run/user/1000


# Switch to root to copy files
USER root

# Set the working directory
WORKDIR /app

# Copy the Python script and audio file into the container
COPY audio.py .
COPY recorded_audio.wav .

# Create a virtual environment & install dependencies inside it
RUN python3 -m venv /app/venv && \
    /app/venv/bin/pip install --no-cache-dir sounddevice numpy wave

# Ensure audio device access
#VOLUME ["/dev/snd", "/run/user/1000/pulse", "/app/audio_data"]

# Switch back to non-root user
USER audio_user

# Start PulseAudio before running the Python script
#CMD pulseaudio --start --log-target=stderr && sleep 2 && /app/venv/bin/python audio_device_testing.py
CMD pulseaudio --start --log-target=stderr && sleep 2 && /app/venv/bin/python audio.py && tail -f /dev/null

