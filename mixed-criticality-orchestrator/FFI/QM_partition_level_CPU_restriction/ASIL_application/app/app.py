from flask import Flask, Response
import cv2
import torch
import subprocess
import psutil
import json
import os
import time

app = Flask(__name__)

# Load the YOLOv5 model (make sure to have the model weights available)
model = torch.hub.load('ultralytics/yolov5', 'yolov5s')  # Load the YOLOv5s model

def generate_frames(video_path):
    while True:  # Infinite loop to keep playing the video
        cap = cv2.VideoCapture(video_path)  # Open the video file

        if not cap.isOpened():
            print("Error: Could not open video.")
            return
        
        prev_time = None

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            start_time = time.time()

            if prev_time is not None:
                actual_time_difference = start_time - prev_time
            else:
                actual_time_difference = 0

            cv2.putText(frame, f"Actual Time Diff: {actual_time_difference:.2f} sec",
                        (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv2.LINE_AA)

            prev_time = start_time

            results = model(frame)

            detections = results.xyxy[0]  

            for det in detections:
                x1, y1, x2, y2, conf, cls = det  
                if int(cls) == 0:  
                    start_point = (int((x1 + x2) / 2), int(y1)) 
                    end_point = (int((x1 + x2) / 2), int(y2))  
                    cv2.line(frame, start_point, end_point, (0, 255, 0), 3) 

            # Convert frame to JPEG
            ret, jpeg = cv2.imencode('.jpg', frame)
            if not ret:
                continue

            # Yield the frame as a byte stream
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')

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

    if os.path.exists(config_filename):
        with open(config_filename, 'r') as file:
            data = json.load(file)

        cpu_stress_percentage = data.get('cpu_stress_percentage', 10)
        mem_stress_percentage = data.get('memory_stress_percentage', 10)

        # apply_stress(cpu_stress_percentage, mem_stress_percentage)

    app.run(host='0.0.0.0', port=8026)
