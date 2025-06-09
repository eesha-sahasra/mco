# Use Ubuntu as the base image
FROM ubuntu:20.04

WORKDIR /app

# Copy the stress script and configuration file
COPY . /app
EXPOSE 8021
# Run both the stress application and the HTTP server concurrently
CMD ["sh", "-c", "python3 -m http.server 8021"]

