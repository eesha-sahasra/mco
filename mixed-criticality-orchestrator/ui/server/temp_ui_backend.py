import os
import re
import csv
import json
import time
import redis
import psutil
import subprocess
import multiprocessing
from flask_cors import CORS
from flask import Flask, jsonify, request
from datetime import datetime
import threading
from werkzeug.utils import secure_filename

import sys
from itertools import zip_longest
from random import randrange

app = Flask(__name__)
CORS(app)

stop_stress = False

# Creating an event object
stop_stress_event = threading.Event()
stop_stress_event.set()

# Turn ON/OFF the logging of values to redis for debugging
log_values_to_db = False

# Connect to your Database server
r = redis.Redis(host='localhost', port=6379, db=0)
network_device = "ens5"
log_file = "../logs/all_logs.csv"
testcase_file = "../logs/testcase.csv"

events_file = "../logs/data.csv"
serial_number = 1
avp_trigger = "false"

def get_current_time():
    # Get the current time
    now = datetime.now()
    # Format the time as a string
    time_string = now.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    return time_string

@app.route('/start_stress', methods=['POST'])
def start_stress():
    flag = r.get('isStressApplied')
    flag = flag.decode('utf-8').strip()
    if flag == "false":
        data = request.get_json()  # Get the JSON data from the request
        cpu_load = int(data.get('cpu'))  # Get the CPU load from the data
        memory_load = int(data.get('memory'))  # Get the memory load from the data

        num_cores = multiprocessing.cpu_count()
        cpu_load = int(num_cores*(cpu_load/100))
        cpu_stress = "{:.2f}".format((cpu_load/num_cores)*100.0)    # Save the CPU stress value to Database
        r.set("cpu_stress", str(cpu_stress))
        #print(f'Total CPU cores loaded: {cpu_load}')
        
        mem_info = psutil.virtual_memory()
        total_memory = mem_info.total
        # total_memory is in bytes, convert it to MB
        total_memory_mb = total_memory / (1024 * 1024)
        total_system_memory = total_memory_mb
        #total_memory_mb = int(total_memory_mb/num_cores)

        memory_load = str(int((memory_load/100)*total_memory_mb)) + 'M'
        memory_stress = "{:.2f}".format(( int(memory_load.replace('M', ''))/total_system_memory)*100.0)    # Save the memory stress value to Database
        r.set("memory_stress", str(memory_stress))

        command = ["stress", "--cpu", str(cpu_load), "--vm", "1", "--vm-bytes", memory_load, "--vm-hang", "0"]
        command_str = ' '.join(command)
        
        #command = ["stress", "--vm", str(cpu_load), "--vm-bytes", memory_load]
        #command_str = ' '.join(command)
        # print(f"Command: " + command_str)

        r.set('stress_command', command_str)  # Save the stress request to Database
        r.set('isStressApplied', "true") # set stress applied flag to false
        r.rpush('lfo_events', f"{get_current_time()} ----> Stress applied with CPU load={data.get('cpu')}%, Memory load={data.get('memory')}% on system")   # Added new event 

        #subprocess.Popen(command_str)  # Start the stress test
        subprocess.Popen(command_str, shell=True)
        return jsonify({'message': 'Stress applied on system'})
    else:
        return jsonify({'message': 'Stress already applied on system'})

@app.route('/stop_stress', methods=['POST'])
def stop_stress():
    global stop_stress
    flag = r.get('isStressApplied')
    flag = flag.decode('utf-8').strip()
    if flag == "true":
        subprocess.Popen(["pkill", "stress"])
        r.set('stress_command', "")  # Reset stress request in Database
        r.set('isStressApplied', "false") # set stress applied flag to false
        r.rpush('lfo_events', f"{get_current_time()} ----> Stress removed from system") # Added new event
        r.set("cpu_stress", "0")
        r.set("memory_stress", "0")
        stop_stress = True
        return jsonify({'message': 'Stress removed on system'})
    else:
        return jsonify({'message': 'Stress already removed on system'})

@app.route('/start_network_delay', methods=['POST'])
def start_network_delay():
    flag = r.get('isNetworkDelayApplied')
    flag = flag.decode('utf-8').strip()
    if flag == "false":
        data = request.get_json()  # Get the JSON data from the request
        time = data.get('delay') + 'ms'  # Get the delay in milliseconds from the data
        command = ["sudo", "tc", "qdisc", "add", "dev", network_device, "root", "netem", "delay", time]
        command_str = ' '.join(command)
        # print(f"Command: " + command_str)
        r.set('network_delay_command', command_str)  # Save the stress request to Database
        r.set('isNetworkDelayApplied', "true") # set stress applied flag to false
        r.rpush('lfo_events', f"{get_current_time()} ----> Network delay applied with {data.get('delay')}ms delay on system") # Added new event 
        subprocess.Popen(command)  # Start the stress test
        return jsonify({'message': 'Network delay applied on system'})
    else:
        return jsonify({'message': 'Network delay already applied on system'})

@app.route('/stop_network_delay', methods=['POST'])
def stop_network_delay():
    flag = r.get('isNetworkDelayApplied')
    flag = flag.decode('utf-8').strip()
    if flag == "true":
        subprocess.Popen(["sudo", "tc", "qdisc", "del", "dev", network_device, "root"])
        r.set('network_delay_command', "")
        r.set('isNetworkDelayApplied', "false")
        r.rpush('lfo_events', f"{get_current_time()} ----> Network delay removed on system") # Added new event 
        return jsonify({'message': 'Network delay removed on system'})
    else:
        return jsonify({'message': 'Network delay already removed on system'})

@app.route('/save_logs', methods=['GET'])
def save_logs():
    # Get all values from the lfo_events list
    events = r.lrange('ui_data_list', 0, -1)
    # Create the directory if it does not exist
    os.makedirs(os.path.dirname(events_file), exist_ok=True)
    # Open the CSV file
    with open(events_file, 'w', newline='') as file:
        writer = csv.writer(file)
        # writer.writerow(['S.No', 'Time', 'Event'])  # Write the header to the CSV file
        # Write the events to the CSV file
        for i, event in enumerate(events, start=1):
            event_str = event.decode('utf-8')  # decode bytes to string
            time, event_text = event_str.split(' ----> ', 1)
            writer.writerow([i, time, event_text])
    return jsonify({'message': 'Logs saved to file'})

@app.route('/get_apps', methods=['GET'])
def get_apps():
    start_time = time.time()
    global serial_number
    print(f"Time when req received: {get_current_time()}")
    # Initialize the Redis connection
    r = redis.Redis(host='localhost', port=6379, db=0)

    # Get all apps and events
    running_apps = r.lrange('running_apps', 0, -1)
    deleted_apps = r.lrange('deleted_apps', 0, -1)
    lfo_events = r.lrange('lfo_events', 0, -1)

    # Dictionary to hold all JSON data
    all_jsons = {}

    # Get the timestamp from Database
    timestamp = r.get('timestamp')
    timestamp = timestamp.decode('utf-8').strip()
    all_jsons["time"] = timestamp

    # Convert the string of tuple to list
    str_pod_usage = r.get('pod_usage').decode('utf-8')
    if not str_pod_usage:
        all_jsons["pod_usage"] = []
    else:
        all_jsons["pod_usage"] = list( eval(str_pod_usage) )

    avg_cpu = r.get('avg_cpu_utilization')
    avg_cpu = avg_cpu.decode('utf-8').strip()
    all_jsons["avg_cpu"] = avg_cpu

    avg_memory = r.get('avg_memory_utilization')
    avg_memory = avg_memory.decode('utf-8').strip()
    all_jsons["avg_memory"] = avg_memory

    stress_applied = r.get('isStressApplied')
    stress_applied = stress_applied.decode('utf-8').strip()
    all_jsons["stress_applied"] = stress_applied

    inc_mem_stress_applied = r.get("isIncMemStressApplied").decode('utf-8').strip()
    all_jsons["inc_mem_stress_applied"] = inc_mem_stress_applied

    inc_cpu_stress_applied = r.get("isIncCpuStressApplied").decode('utf-8').strip()
    all_jsons["inc_cpu_stress_applied"] = inc_cpu_stress_applied

    target_cpu_inc_stress = r.get("target_inc_cpu_stress").decode('utf-8').strip()
    all_jsons["target_inc_cpu_stress"] = target_cpu_inc_stress
    target_mem_inc_stress = r.get("target_inc_mem_stress").decode('utf-8').strip()
    all_jsons["target_inc_mem_stress"] = target_mem_inc_stress

    current_inc_cpu_stress = r.get("current_inc_cpu_stress").decode('utf-8').strip()
    all_jsons["current_inc_cpu_stress"] = current_inc_cpu_stress
    current_inc_mem_stress = r.get("current_inc_mem_stress").decode('utf-8').strip()
    all_jsons["current_inc_mem_stress"] = current_inc_mem_stress

    network_delay_applied = r.get('isNetworkDelayApplied')
    network_delay_applied = network_delay_applied.decode('utf-8').strip()
    all_jsons["network_delay_applied"] = network_delay_applied

    events_list = []
    for event in lfo_events:
        event = event.decode('utf-8')
        events_list.append(event)
    all_jsons["events"] = events_list

    running_apps_list = []
    for app in running_apps:
        app = app.decode('utf-8')
        app_value = r.get(app)
        if app_value is not None:
            app_value = app_value.decode('utf-8')
            app_value = json.loads(app_value)
            merged_app_value = {k: v for d in app_value for k, v in d.items()}
            running_apps_list.append(merged_app_value)
    all_jsons["running_apps"] = running_apps_list

    deleted_apps_list = []
    for app in deleted_apps:
        app = app.decode('utf-8')
        app_value = r.get(app)
        if app_value is not None:
            app_value = app_value.decode('utf-8')
            app_value = json.loads(app_value)
            merged_app_value = {k: v for d in app_value for k, v in d.items()}
            deleted_apps_list.append(merged_app_value)
    all_jsons["deleted_apps"] = deleted_apps_list

    cpu_stress = r.get('cpu_stress')
    cpu_stress = cpu_stress.decode('utf-8').strip()
    all_jsons["cpu_stress"] = cpu_stress

    memory_stress = r.get('memory_stress')
    memory_stress = memory_stress.decode('utf-8').strip()
    all_jsons["memory_stress"] = memory_stress

    all_jsons["avg_avp_cpu_usage"] = r.get('avg_avp_cpu_usage').decode('utf-8').strip()
    all_jsons["avg_avp_memory_usage"] = r.get('avg_avp_memory_usage').decode('utf-8').strip()

    # Serialize and store ui_data in a more readable format
    ui_data = {
        "time": timestamp,
        "pod_usage": all_jsons["pod_usage"],
        "avg_cpu": avg_cpu,
        "avg_memory": avg_memory,
        "stress_applied": stress_applied,
        "inc_mem_stress_applied": inc_mem_stress_applied,
        "inc_cpu_stress_applied": inc_cpu_stress_applied,
        "target_inc_cpu_stress": target_cpu_inc_stress,
        "target_inc_mem_stress": target_mem_inc_stress,
        "current_inc_cpu_stress": current_inc_cpu_stress,
        "current_inc_mem_stress": current_inc_mem_stress,
        "network_delay_applied": network_delay_applied,
        "events": events_list,
        "running_apps": running_apps_list,
        "deleted_apps": deleted_apps_list,
        "cpu_stress": cpu_stress,
        "memory_stress": memory_stress,
    }

    # Store ui_data in Redis list
    r.rpush("ui_data_list", json.dumps(ui_data))

    json_str = json.dumps(all_jsons)

    with open(log_file, 'a', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow([serial_number, json_str])

    serial_number += 1
    end_time = time.time()
    elapsed_time = end_time - start_time
    print(f"Time consumed for \"/get_apps\" API - {elapsed_time* 1000}ms")
    return jsonify(all_jsons)

@app.route('/add_clock_skew', methods=['POST'])
def add_clock_skew():
    data = request.get_json()
    skew_seconds = data.get('skew_seconds')

    try:
        # Run the command to adjust the system time
        subprocess.run(['sudo', 'date', '-s', f'+{skew_seconds} seconds'])
        # print("Clock skew added successfully.")
        return jsonify({'message': 'Clock skew added successfully.'}), 200
    except Exception as e:
        # print("Error:", e)
        return jsonify({'message': 'An error occurred.'}), 500

def run_command_in_thread(command):
    # Define a function to run the command
    def run_command(command):
        subprocess.run(command, shell=True)

    # Create a new thread and start it
    thread = threading.Thread(target=run_command, args=(command,))
    thread.start()

def cpu_stress_test(step_size_percentage_cpu, target_cpu_percentage, cpu_core, single_core, interval_cpu):
    current_value = step_size_percentage_cpu
    while current_value <= target_cpu_percentage:
        if stop_stress_event.is_set():
            print("Stopping CPU stress execution.")
            # stop_stress_event.clear()
            break
        r.set("current_inc_cpu_stress", str(current_value))
        stress_test(cpu_load=target_cpu_percentage, cpu_core=cpu_core, single_core=single_core, interval_cpu=interval_cpu, step_size_percentage_cpu=step_size_percentage_cpu)
        if current_value == target_cpu_percentage:
            print(f"Sustaining CPU Load at: {target_cpu_percentage}%")
            break
        print(f"Current CPU Load: {current_value}%")
        current_value += step_size_percentage_cpu
        if current_value > target_cpu_percentage:
            remaining_cpu_load = target_cpu_percentage - (current_value - step_size_percentage_cpu)
            current_value = target_cpu_percentage
            print(f"Adjusting CPU Load to: {current_value}%")
            r.set("current_inc_cpu_stress", str(current_value))
            if log_values_to_db:
                r.rpush('lfo_events', f"{get_current_time()} - Adjusting CPU Load to: {current_value}%")
            stress_test(cpu_load=remaining_cpu_load, cpu_core=cpu_core,single_core=single_core, interval_cpu=interval_cpu, step_size_percentage_cpu=remaining_cpu_load)
            break

def mem_stress_test(step_size_percentage_mem, target_mem_percentage, interval_mem, total_memory_mb):
    current_value = step_size_percentage_mem
    while current_value <= target_mem_percentage:
        if stop_stress_event.is_set():
            print("Stopping MEMORY stress execution.")
            # stop_stress_event.clear()
            break
        r.set("current_inc_mem_stress", str(current_value))
        stress_test(memory_load=target_mem_percentage, interval_mem=interval_mem, total_memory_mb=total_memory_mb, step_size_percentage_mem=step_size_percentage_mem)
        if current_value == target_mem_percentage:
            print(f"Sustaining Memory Load at: {target_mem_percentage}%")
            break
        print(f"Current Memory Load: {current_value}%")
        current_value += step_size_percentage_mem
        if current_value > target_mem_percentage:
            remaining_mem_load = target_mem_percentage - (current_value - step_size_percentage_mem)
            current_value = target_mem_percentage
            print(f"Adjusting Memory Load to: {current_value}%")
            r.set("current_inc_mem_stress", str(current_value))
            if log_values_to_db:
                r.rpush('lfo_events', f"{get_current_time()} - Adjusting MEM Load to: {current_value}%")
            stress_test(memory_load=remaining_mem_load, interval_mem=interval_mem, total_memory_mb=total_memory_mb, step_size_percentage_mem=remaining_mem_load)
            break

def stress_test(cpu_load=None, memory_load=None, cpu_core=None, single_core=None, interval_cpu=None, interval_mem=None, total_memory_mb=None, step_size_percentage_mem=None, step_size_percentage_cpu=None):
    if cpu_load is not None:
        command_cpu = [
            "stress-ng",
            "--cpu-method", "int128longdouble",
            "--cpu-load", str(step_size_percentage_cpu),
        ]
        if log_values_to_db:
            r.rpush('lfo_events', f"{get_current_time()} - CPU Stress value applied - {step_size_percentage_cpu}")
        if single_core.lower() == "true":
            command_cpu.extend(["--taskset", str(cpu_core), "--cpu", "1"])
        else:
            command_cpu.extend(["--cpu", "0"])
        print(f"--- ## Executing command: {' '.join(command_cpu)}")

        if not stop_stress_event.is_set():
            subprocess.Popen(command_cpu)
            time.sleep(interval_cpu)

    if memory_load is not None:
        memory_stress_arg = str(int((step_size_percentage_mem / 100) * total_memory_mb)) + 'M'
        print(f"--- ## Calculated memory stress val: {memory_stress_arg} - for {step_size_percentage_mem}%")

        command_mem = [
            "stress-ng",
            "--vm", "1",
            "--vm-bytes", str(memory_stress_arg),
            "--vm-hang", "0",
        ]
        if log_values_to_db:
            r.rpush('lfo_events', f"{get_current_time()} - Calculated memory stress val: {memory_stress_arg} - for {step_size_percentage_mem}%")
        print(f"--- ## Executing command: {' '.join(command_mem)}")
        # if not stop_stress_event.is_set():
        if not stop_stress_event.is_set():
            subprocess.Popen(command_mem)
            time.sleep(interval_mem)

def reset_incremental_stress_params_cpu():
    r.set("isIncCpuStressApplied", "false") # Set CPU Incremental stress applied flag to 0
    r.set("target_inc_cpu_stress", "0") # Initalise the target cpu stress value
    r.set("current_inc_cpu_stress", "0") # Initialise the current cpu stress value

def reset_incremental_stress_params_memory():
    r.set("isIncMemStressApplied", "false") # Set Memory Incremental stress applied flag to 0
    r.set("target_inc_mem_stress", "0") # Initialise the target mem stress value
    r.set("current_inc_mem_stress", "0") # Initalise the current mem stress value

@app.route('/execute_testcase', methods=['POST'])
def execute_csv_commands():
    global stop_stress
    flag_cpu = r.get("isIncCpuStressApplied").decode('utf-8').strip()
    flag_mem = r.get("isIncMemStressApplied").decode('utf-8').strip()
    if flag_cpu == "false" and flag_mem == "false":

        # Reset the incremental stress parameters for CPU and memory
        r.set("target_inc_cpu_stress", "0") # Initalise the target cpu stress value
        r.set("current_inc_mem_stress", "0") # Initialise the current mem stress value
        r.set("target_inc_mem_stress", "0") # Initialise the target mem stress value
        r.set("current_inc_cpu_stress", "0") # Initalise the current cpu stress value

        data = request.get_json()
        csv_file_path = data.get('file_path')
        status = data.get('status')

        if not csv_file_path or not os.path.exists(csv_file_path):
            return jsonify({'message': 'CSV file path is invalid.'}), 400

        if status == "true":
            with open(csv_file_path, 'r') as csvfile:
                reader = csv.reader(csvfile)
                next(reader)  # Skip the header row
                rows = list(reader)  # Convert the CSV reader to a list
                delay_in_sec = int(rows[0][7])
                r.set('stop_delay_in_sec', str(delay_in_sec))
                for row in rows:
                    if not row:  # Skip empty rows
                        continue

                    # Parse the data from csv
                    target_cpu_percentage = int(row[0])
                    target_mem_percentage = int(row[1])
                    step_size_percentage_cpu = int(row[2])
                    step_size_percentage_mem = int(row[3])
                    interval_cpu = int(row[4])
                    interval_mem = int(row[5])
                    single_core = str(row[6])

                    # Check if single core is selected and assign a random core based on host core count
                    if single_core.lower() == "true":
                        cpu_core = randrange(0, psutil.cpu_count())
                        print("cpu_core chosen:", cpu_core)
                    else:
                        cpu_core = 0

                    # Calculate the total memory in the system in MB
                    total_memory_in_bytes = psutil.virtual_memory().total
                    total_memory_mb = total_memory_in_bytes / (1024 * 1024)

                    # Remove any previous unfinished execution state flags
                    if stop_stress_event.is_set():
                        stop_stress_event.clear()

                    # Create and start separate threads for CPU and memory stress tests
                    cpu_thread = None
                    mem_thread = None

                    # Set the target stress value fetched from the csv file
                    r.set("target_inc_cpu_stress", str(target_cpu_percentage))
                    r.set("target_inc_mem_stress", str(target_mem_percentage))
                    r.rpush('lfo_events', f"{get_current_time()} - TestCase execution started, Target CPU : {target_cpu_percentage}, Target MEM : {target_mem_percentage}")

                    if target_cpu_percentage > 0:
                        r.set("isIncCpuStressApplied", "true")
                        cpu_thread = threading.Thread(target=cpu_stress_test, args=(step_size_percentage_cpu, target_cpu_percentage, cpu_core, single_core, interval_cpu))
                        cpu_thread.start()

                    if target_mem_percentage > 0:
                        r.set("isIncMemStressApplied", "true")
                        mem_thread = threading.Thread(target=mem_stress_test, args=(step_size_percentage_mem, target_mem_percentage, interval_mem, total_memory_mb))
                        mem_thread.start()

                    if cpu_thread is not None:
                        cpu_thread.join()
                    if mem_thread is not None:
                        mem_thread.join()

        return jsonify({'message': 'TestCase Executed'}), 200
    else:
        return jsonify({'message': 'TestCase already running'}), 200

@app.route('/stop_testcase', methods=['POST'])
def stop_testcase_execution():
    # Stop all the applied stress
    flag_cpu = r.get("isIncCpuStressApplied").decode('utf-8').strip()
    flag_mem = r.get("isIncMemStressApplied").decode('utf-8').strip()
    if flag_cpu == "true" or flag_mem == "true":
        stop_stress_event.set()  # Signal the event to stop the testcase execution
        subprocess.Popen(["pkill", "stress"])
        # subprocess.Popen(["sudo", "pkill", "stress"])
        # Reset the values to initial ones
        reset_incremental_stress_params_cpu()
        reset_incremental_stress_params_memory()
        r.rpush('lfo_events', f"{get_current_time()} ----> TestCase execution stopped")
        return jsonify({'message': 'Testcase execution stopped'}), 200
    else:
        return jsonify({'message': 'No current testcase running'}), 200

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        # return 'No file part', 400
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        # return 'No selected file', 400
        return jsonify({'message': 'No selected file'}), 400
    filename = secure_filename(file.filename)
    file.save(os.path.join('../../ui/logs', filename))

    # return 'File uploaded successfully', 200
    return jsonify({'message': 'File uploaded successfully'}), 200

def fetch_stop_delay():
    str_delay_in_sec = r.get('stop_delay_in_sec')
    delay_in_sec = str_delay_in_sec.decode('utf-8').strip() if str_delay_in_sec is not None else 0
    return int(delay_in_sec)

def reset_stop_delay():
    r.set('stop_delay_in_sec', str(0))

def monitor_avp_trigger():
    while True:
        value = r.get('avp_trigger')
        if value and value.decode('utf-8').strip() == "true":
            print("AVP Trigger applied on system")
            r.rpush('lfo_events', f"{get_current_time()} - LF Trigger applied on system")
            if not stop_stress_event.is_set():
                print("*"*50)
                stop_stress_event.set()  # Signal the event to stop the testcase execution
                r.rpush('lfo_events', f"{get_current_time()} - TestCase execution stopped due to LFAVP trigger")
            print("Starting delay..................")
            print(f"delay given in csv file is : {fetch_stop_delay()}")
            time.sleep((0 + fetch_stop_delay()))  # Sleep for the duration mentioned in testcase csv
            print("stopping delay..................")
            os.system(' '.join(["pkill", "stress"]))
            # subprocess.run(["pkill", "stress"], text=True)
            r.rpush('lfo_events', f"{get_current_time()} - LF trigger processed")
            reset_incremental_stress_params_cpu()
            reset_incremental_stress_params_memory()
            r.set('avp_trigger', "false")
            reset_stop_delay()
        time.sleep(0.01) # Delay to adjust the database operation time

if __name__ == '__main__':
    r.set('isStressApplied', "false") # set stress applied flag to false
    r.set('isNetworkDelayApplied', "false") # set stress applied flag to false
    r.set('stress_command', "")  # Reset stress request in Database
    r.set("cpu_stress", "0")    # Set CPU stress to 0.0
    r.set("memory_stress", "0") # Set memory stress to 0.0
    reset_incremental_stress_params_cpu() # Reset the values for cpu incremental stress
    reset_incremental_stress_params_memory() # Reset the values for memory incremental stress

    if os.path.exists(events_file): # Remove the CSV file if it exists
        os.remove(events_file)
    if os.path.exists(testcase_file): # Remove the CSV file if it exists
        os.remove(testcase_file)
    if os.path.exists(log_file): # Remove the CSV file if it exists
        os.remove(log_file)

    # # Get the node details from the cluster
    # get_node_details()

    # Start monitor_avp_trigger as a separate thread
    thread = threading.Thread(target=monitor_avp_trigger)
    thread.daemon = True  # makes the thread exit when the main program exits
    thread.start()

    # # Thread to monitor pod status and update to DB
    # thread_pod_status = threading.Thread(target=update_pod_status)
    # thread_pod_status.daemon = True
    # thread_pod_status.start()

    app.run(host="0.0.0.0", port=7654,debug=True)
