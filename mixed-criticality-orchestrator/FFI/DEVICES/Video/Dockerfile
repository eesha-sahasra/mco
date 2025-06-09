RUN apt update && \
    apt install -y v4l-utils ffmpeg python3 libv4l-dev libv4l-0 && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container

# Copy all files (including the video file and app.py) from the host to /app inside the container
COPY . /

# Ensure app.py is executable
RUN chmod +x /app.py

# Run the Python script inside the container
CMD ["python3", "app.py"]

