# Use Ubuntu as the base image
FROM ubuntu:20.04

# Install required dependencies
RUN apt-get update && apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*  # Clean up to reduce image size

RUN pip3 install psutil
# Set the working directory
WORKDIR /app

# Copy the stress script and configuration file
COPY . /app
EXPOSE 8023
# Run both the stress application and the HTTP server concurrently
CMD ["sh", "-c", "python3 mem-stress.py & python3 -m http.server 8023"]


