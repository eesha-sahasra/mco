#!/bin/bash

echo "Building the docker from dockerfile..."
docker build -t video-streaming-qm .

echo "Tagging the docker image..."
docker tag video-streaming-qm:latest localhost:5000/video-streaming-qm:latest

echo "Pushing the image to local docker registry..."
docker push localhost:5000/video-streaming-qm:latest
