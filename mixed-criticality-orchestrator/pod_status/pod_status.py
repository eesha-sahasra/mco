import subprocess
import json
import time
import redis
import threading
import re
from datetime import datetime

# Loop frequency settings in milliseconds
pod_status_loop_duration_ms = 50
ui_frontend_request_frequency_ms = 600

# Event to notify data sent to Redis DB
signal_fetch_event = threading.Event()

# Connect to Redis Database
r = redis.Redis(host='localhost', port=6379, db=0)

# Memory conversion factor (KiB to MiB)
Mem_div_factor = 1024

# Log file path
log_file = "../ui/logs/all_logs.csv"

def get_podman_container_stats():
    try:
        # Fetch stats from the host
        output = subprocess.check_output([
            "sudo", "podman", "stats", "--no-stream", "--format", "json", "--cgroup-manager=cgroupfs"
        ])
        # Fetch stats from the `qm` container
        qm_output = subprocess.check_output([
            "sudo", "podman", "exec", "qm", "podman", "stats", "--no-stream", "--format", "json", "--cgroup-manager=cgroupfs"
        ])

        # Parse JSON outputs
        output_stats = json.loads(output)
        qm_stats = json.loads(qm_output)

        # Combine stats from both sources
        combined_stats = output_stats + qm_stats

        # Filter out the `qm` container itself from the stats
        filtered_stats = [container for container in combined_stats if container.get("name") != "qm"]

        return filtered_stats
    except subprocess.CalledProcessError as e:
        print(f"Command failed: {e}")
        return []
    except json.JSONDecodeError as e:
        print(f"Invalid JSON output: {e}")
        return []


def clean_percent(value):
    """Function to clean the percentage string and convert to float."""
    return float(value.strip('%'))

def calculate_container_usage(total_cores, node_memory):
    container_stats = get_podman_container_stats()
    total_pod_cpu_usage_per = 0
    total_pod_mem_usage_per = 0
    avp_cpu_usage = 0
    avp_memory_usage = 0
    pod_usage_list = []

    container_count = len(container_stats)
    if container_count == 0:
        print("No containers are currently running.")
        return

    for container in container_stats:
        pod_name_short = container["name"]
        print(pod_name_short)
        pod_cpu_in_per = clean_percent(container["cpu_percent"])
        pod_mem_in_per = clean_percent(container["mem_percent"])

        # Adjust CPU usage relative to total cores
        pod_cpu_in_per = (pod_cpu_in_per / (total_cores * 100)) * 100

        # Aggregate usage across containers
        total_pod_cpu_usage_per += pod_cpu_in_per
        total_pod_mem_usage_per += pod_mem_in_per

        # Only add to AVP usage if "app" is not in the container name
        if "app" not in pod_name_short:
            avp_cpu_usage += pod_cpu_in_per
            avp_memory_usage += pod_mem_in_per

        # Append adjusted values to pod_usage_list
        str_pod_cpu_in_per = "{:.2f}".format(pod_cpu_in_per)
        str_pod_mem_in_per = "{:.2f}".format(pod_mem_in_per)
        pod_tuple = [pod_name_short, str_pod_cpu_in_per, str_pod_mem_in_per]
        pod_usage_list.append(pod_tuple)

    # Calculate average CPU and memory usage for the pods
    total_pod_cpu_usage_per = total_pod_cpu_usage_per / max(container_count, 1)
    total_pod_mem_usage_per = total_pod_mem_usage_per / max(container_count, 1)

    # Calculate average AVP CPU and memory usage
    avg_avp_cpu_usage = avp_cpu_usage / max(container_count, 1)
    avg_avp_memory_usage = avp_memory_usage / max(container_count, 1)

    # Set values in Redis and signal
    print("".center(35, "-"))
    print(f'''    Total pod cpu       = {total_pod_cpu_usage_per:.2f}%
    Total pod memory    = {total_pod_mem_usage_per:.2f}%
    avp_cpu_usage       = {avp_cpu_usage:.2f}%
    avp_memory_usage    = {avp_memory_usage:.2f}%
    Avg AVP cpu usage   = {avg_avp_cpu_usage:.2f}%
    Avg AVP memory usage= {avg_avp_memory_usage:.2f}%''')

    # Store values in Redis
    r.set("total_pod_cpu_usage_per", "{:.2f}".format(total_pod_cpu_usage_per))
    r.set("total_pod_mem_usage_per", "{:.2f}".format(total_pod_mem_usage_per))
    r.set("avp_cpu", "{:.2f}".format(avp_cpu_usage))
    r.set("avp_mem", "{:.2f}".format(avp_memory_usage))
    r.set("avg_avp_cpu_usage", "{:.2f}".format(avg_avp_cpu_usage))
    r.set("avg_avp_memory_usage", "{:.2f}".format(avg_avp_memory_usage))
    r.set("pod_cpu_usage", "{:.2f}".format(total_pod_cpu_usage_per))  # Retaining for any dependent code
    r.set("pod_memory_usage", "{:.2f}".format(total_pod_mem_usage_per))  # Retaining for any dependent code
    r.set("pod_usage", json.dumps(pod_usage_list))  # Store pod_usage_list as JSON in Redis

    # Signal event for data update
    signal_fetch_event.set()

def main():
    # Fetch CPU cores and memory in MiB
    total_cores = int(subprocess.check_output(["nproc"]).strip().decode())
    mem_info = subprocess.check_output(["free", "-m"]).decode()
    total_memory = int(re.search(r'Mem:\s+(\d+)', mem_info).group(1))

    # Print node CPU and memory details
    print(f"Node CPU: {total_cores * 1000}m, Node Memory: {total_memory}Mi")
    print("-----------------------------------")

    while True:
        try:
            st_time = time.time()
            calculate_container_usage(total_cores, total_memory)
            elapsed_time = (time.time() - st_time) * 1000  # in ms
            time_to_sleep = max(0, pod_status_loop_duration_ms - elapsed_time) / 1000
            print(f"Loop Time : {elapsed_time:.3f} ms")
            #print("-----------------------------------")
            time.sleep(time_to_sleep)
        except KeyboardInterrupt:
            print("\nExiting...")
            break

if __name__ == "__main__":
    main()
