# Use the official Ubuntu focal image
FROM ubuntu:focal

# Set environment variables
ENV TZ=Asia/Singapore
ENV DEBIAN_FRONTEND=noninteractive
ENV TORCH_HOME=/tmp/torch_cache

# Update package list and install required packages
RUN apt-get update && \
    apt-get install -y \
    stress-ng python3 python3-venv python3-distutils curl git libgl1-mesa-glx libglib2.0-0 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install pip securely using the bootstrap script
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3

# Verify pip installation
RUN python3 -m pip --version

# Install required Python libraries
RUN python3 -m pip install --no-cache-dir numpy==1.24.4 \
    pandas==2.0.3 \
    flask==3.0.3 \
    opencv-python \
    Pillow \
    psutil \
    requests \
    torch \
    torchvision \
    torchaudio \
    tqdm \
    gitpython \
    ultralytics

# Create a directory for the application code
WORKDIR /app

# Copy the application code into the container
COPY ./app /app

# Expose the port that the app runs on
EXPOSE 8026

# Command to run the Flask application
CMD ["python3", "app.py"]

