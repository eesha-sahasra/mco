from flask import Flask, Response, stream_with_context
import cv2
import time
import requests
import subprocess
import psutil
import json
import os

app = Flask(__name__)


config_filename = 'stress_values.json'
HOST_IP = os.environ["HOST_IP"]
VS_CAMFEED_API_ENDPOINT = 'http://'+HOST_IP+':5101/videoStreaming/camFeed'

class VideoStreamer:
    def __init__(self):
        self.stopthread_1 = False

    def stream_video_1(self):
        self.selected_camera = 1

        cap = cv2.VideoCapture('./animated.mp4')
        fps = cap.get(cv2.CAP_PROP_FPS)

        while True:  # Infinite loop for continuous streaming
            start_time = time.time()
            ret, frame = cap.read()
            if frame is None:
                print("!!! Couldn't read frame!")
                continue

            if not ret:
                # Restart the video capture when it reaches the end
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            if self.stopthread_1:
                break

            # Read frames from mp4 in .jpg file format
            retval, jpgframe = cv2.imencode('.jpg', frame)
            jpgframe = jpgframe.tobytes()
            r = requests.post(url=VS_CAMFEED_API_ENDPOINT, data=jpgframe, headers={'Content-type': 'image/jpeg'})

            elapsed_time = time.time() - start_time
            time_to_sleep = max(0, (1 / fps) - elapsed_time)
            time.sleep(round(time_to_sleep, 3))

        cap.release()
        print("Done closed cap")

    def stream_video_replay(self):
        cap = cv2.VideoCapture('./movieDN.mp4')
        fps = cap.get(cv2.CAP_PROP_FPS)

        if not cap.isOpened():
            return b'Error: Unable to open video file'

        while True:  # Infinite loop to handle video replay
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            print(f'Total number of frames: {total_frames}')

            while True:
                start_time = time.time()
                ret, frame = cap.read()
                if not ret:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Reset to the beginning
                    break

                # Encode the frame as JPEG
                _, jpeg = cv2.imencode('.jpg', frame)
                if not _:
                    continue

                # Yield the frame
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

                elapsed_time = time.time() - start_time
                time_to_sleep = max(0, (1 / fps) - elapsed_time)
                time.sleep(round(time_to_sleep, 3))

            cap.release()

    def generate(self):
        return self.stream_video_replay()

@app.route('/video')
def video_feed():
    streamer = VideoStreamer()
    return Response(stream_with_context(streamer.generate()), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    with open(config_filename, 'r') as file:
        data = json.load(file)

    # Percentage of CPU stress to be applied on a scale of 1 to 100
    cpu_stress_percentage = data.get('cpu_stress_percentage', 10)
    # percent of memory stress to be applied on a scale of 1 to 100
    mem_stress_percentage = data.get('memory_stress_percentage', 10)

    # Calculate the memory stress value based on the percentage stress given
    total_mb = psutil.virtual_memory().total / (1024 * 1024)
    mb_per = round(total_mb * mem_stress_percentage / 100)
    str_mem_stress_percentage = "".join(str(mb_per) + 'M')
    print(f"Total Sys Memory    - {total_mb}M, Percentage stress to apply - {mem_stress_percentage}% ({str_mem_stress_percentage}M)")
    print(f"Total Sys CPU Count - {psutil.cpu_count()}, Percentage stress to apply - {cpu_stress_percentage}%")
    cpu_count = str(1)

    # Apply the memory stress
    stress_process_mem = subprocess.Popen(["stress-ng", "--vm", cpu_count, "--vm-bytes", str_mem_stress_percentage, "--vm-hang", "0"])

    # Calculate no. cores to apply cpu stress based on percentage given
    cpu_cores_to_apply_stress = psutil.cpu_count() * cpu_stress_percentage / 100
    print(f"CPU cores to apply stress for {cpu_stress_percentage}% load is : {cpu_cores_to_apply_stress}")
    full_stress_core_count = int(cpu_cores_to_apply_stress)
    remaining_stress_to_apply_in_percentage = int((cpu_cores_to_apply_stress - full_stress_core_count) * 100)
    print(f"No. of cores with 100% stress: {full_stress_core_count}, Single core stress : {remaining_stress_to_apply_in_percentage}%")

    # Apply the CPU Stress
    stress_process_cpu = subprocess.Popen(["stress-ng", "--cpu-method", "int128longdouble", "--cpu", str(full_stress_core_count), "--cpu-load", "100", "--taskset", f"0-{full_stress_core_count - 1}"])

    if remaining_stress_to_apply_in_percentage != 0:
        stress_process_cpu = subprocess.Popen(["stress-ng", "--cpu-method", "int128longdouble", "--cpu", str(1), "--cpu-load", str(remaining_stress_to_apply_in_percentage), "--taskset", str(full_stress_core_count)])

    # Start the flask REST server
    app.run(host='0.0.0.0', debug=True, port=5010)

