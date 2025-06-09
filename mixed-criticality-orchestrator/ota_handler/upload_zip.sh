#!/bin/bash

# Set the server URL and ZIP file path
SERVER_URL="http://127.0.0.1:5000/upload"
ZIP_FILE_PATH="./app3_container.zip"

# Make the POST request
curl -X POST "$SERVER_URL" -F "file=@$ZIP_FILE_PATH"
