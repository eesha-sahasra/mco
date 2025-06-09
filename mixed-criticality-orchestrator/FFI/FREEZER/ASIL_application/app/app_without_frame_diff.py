from flask import Flask, Response
import cv2
import torch
import subprocess
import psutil
import json
import os

app = Flask(__name__)

# Load the YOLOv5 model (make sure to have the model weights available)
model = torch.hub.load('ultralytics/yolov5', 'yolov5s')  # Load the YOLOv5s model

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
    """Apply CPU and memory stress based on configuration."""
    
    # Calculate memory stress value based on percentage
    total_mb = psutil.virtual_memory().total / (1024 * 1024)
    mb_per = round(total_mb * mem_stress_percentage / 100)
    str_mem_stress_percentage = f"{mb_per}M"
    
    print(f"Total Sys Memory - {total_mb}M, Memory Stress - {mem_stress_percentage}% ({str_mem_stress_percentage})")
    
    # Apply memory stress using stress-ng
    subprocess.Popen(["stress-ng", "--vm", "1", "--vm-bytes", str_mem_stress_percentage, "--vm-hang", "0"])

    cpu_count = psutil.cpu_count()
    cpu_cores_to_apply_stress = int(cpu_count * cpu_stress_percentage / 100)
    
    print(f"Applying CPU stress on {cpu_cores_to_apply_stress} cores.")
    
    # Apply CPU stress using stress-ng
    subprocess.Popen(["stress-ng", "--cpu", str(cpu_cores_to_apply_stress), "--cpu-load", "100"])

if __name__ == '__main__':
    config_filename = 'stress_values.json'
    
    with open(config_filename, 'r') as file:
        data = json.load(file)

    cpu_stress_percentage = data.get('cpu_stress_percentage', 10)
    mem_stress_percentage = data.get('memory_stress_percentage', 10)

    #apply_stress(cpu_stress_percentage, mem_stress_percentage)

    app.run(host='0.0.0.0', port=5000)
