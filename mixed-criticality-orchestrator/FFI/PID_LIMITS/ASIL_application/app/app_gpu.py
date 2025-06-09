from flask import Flask, Response
import cv2
import torch
import subprocess
import psutil
import json
import os

app = Flask(__name__)

# Check for GPU availability and set device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Load the YOLOv5 model on the appropriate device
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', device=device)


def generate_frames(video_path):
    while True:  # Infinite loop to keep playing the video
        cap = cv2.VideoCapture(video_path)  # Open the video file

        while True:
            success, frame = cap.read()  # Read a frame from the video
            if not success:
                cap.release()  # Release the capture when done
                break  # Exit inner loop to restart video

            # Perform object detection
            results = model(frame)  # Run inference
            frame = results.render()[0]  # Render results on the frame

            # Encode the frame in JPEG format
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()  # Convert to byte array

            # Yield the frame in a format suitable for streaming
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.route('/video_feed')
def video_feed():
    video_path = './camera_2.mov'  # Replace with your video file path
    return Response(generate_frames(video_path), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/')
def index():
    return '<h1>Live Video Feed with Object Detection</h1><img src="/video_feed">'


def apply_stress(cpu_stress_percentage, mem_stress_percentage):
    """Apply CPU, memory, and GPU stress based on configuration."""
    # Memory stress calculation
    total_mb = psutil.virtual_memory().total / (1024 * 1024)
    mb_per = round(total_mb * mem_stress_percentage / 100)
    str_mem_stress_percentage = f"{mb_per}M"

    print(f"Total Sys Memory - {total_mb}M, Memory Stress - {mem_stress_percentage}% ({str_mem_stress_percentage})")

    # Apply memory stress using stress-ng
    subprocess.Popen(["stress-ng", "--vm", "1", "--vm-bytes", str_mem_stress_percentage, "--vm-hang", "0"])

    # CPU stress calculation
    cpu_count = psutil.cpu_count()
    cpu_cores_to_apply_stress = int(cpu_count * cpu_stress_percentage / 100)
    print(f"Applying CPU stress on {cpu_cores_to_apply_stress} cores.")

    # Apply CPU stress using stress-ng
    subprocess.Popen(["stress-ng", "--cpu", str(cpu_cores_to_apply_stress), "--cpu-load", "100"])

    # GPU stress handling if GPU is available
    if torch.cuda.is_available():
        print("Applying GPU stress...")
        try:
            # Simple GPU stress test by running dummy computations on CUDA
            stress_gpu_script = """
import torch
import time
x = torch.rand((1000, 1000)).cuda()
start = time.time()
for _ in range(100000):
    x = x * x
print("GPU stress completed in", time.time() - start, "seconds")
            """
            subprocess.Popen(["python3", "-c", stress_gpu_script])
        except Exception as e:
            print("GPU stress failed: ", str(e))


if __name__ == '__main__':
    config_filename = 'stress_values.json'

    with open(config_filename, 'r') as file:
        data = json.load(file)

    cpu_stress_percentage = data.get('cpu_stress_percentage', 10)
    mem_stress_percentage = data.get('memory_stress_percentage', 10)

    apply_stress(cpu_stress_percentage, mem_stress_percentage)

    app.run(host='0.0.0.0', port=5000)

