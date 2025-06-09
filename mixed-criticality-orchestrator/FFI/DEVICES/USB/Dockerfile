# Use Ubuntu 20.04 as the base image
FROM ubuntu:20.04

# Set non-interactive mode to avoid tzdata configuration prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install Python
RUN apt update && apt install -y python3

# Set the working directory
WORKDIR /app

# Copy the Python script into the container
COPY usb_test.py /app/script.py

# Set execute permissions for the script
RUN chmod +x /app/script.py

# Run the Python script
CMD ["python3", "/app/script.py"]

