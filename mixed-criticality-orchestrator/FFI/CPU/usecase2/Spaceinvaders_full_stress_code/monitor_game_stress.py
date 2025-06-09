import subprocess
import time
import os
import atexit

# Set the stress levels
cpu_stress_level = 20  # 50% CPU usage
mem_stress_level = 20  # 50% memory usage

# Change working directory to /tmp to avoid permission issues
os.chdir("/tmp")

# Apply CPU stress
def apply_cpu_stress():
    cpu_stress_cmd = f"stress-ng -c {cpu_stress_level} -t 999999 --temp-path /tmp"
    process = subprocess.Popen(cpu_stress_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    print("CPU Stress Output:", stdout.decode())
    print("CPU Stress Error:", stderr.decode())

# Apply memory stress
def apply_mem_stress():
    mem_stress_cmd = f"stress-ng -m {mem_stress_level} -t 999999 --temp-path /tmp"
    process = subprocess.Popen(mem_stress_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    print("Memory Stress Output:", stdout.decode())
    print("Memory Stress Error:", stderr.decode())

# Release stress
def release_stress():
    subprocess.Popen("pkill stress-ng", shell=True)

# Apply stress when container starts
apply_cpu_stress()
apply_mem_stress()

# Release stress when container stops
atexit.register(release_stress)

# Keep the container running
while True:
    time.sleep(1)
