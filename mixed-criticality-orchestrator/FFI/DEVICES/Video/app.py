import os

# Path to the video file
video_file = "camera_2.mov"

# Check if the video file exists
if not os.path.exists(video_file):
    print(f"Error: Video file {video_file} not found!")
    exit(1)

# FFmpeg command to stream video to /dev/video0
ffmpeg_cmd = f"ffmpeg -re -stream_loop -1 -i {video_file} -f v4l2 /dev/video0"

# Run the command
os.system(ffmpeg_cmd)

