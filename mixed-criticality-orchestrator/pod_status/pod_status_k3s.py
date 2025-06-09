#!/usr/bin/env python3

from kubernetes import client, config
from kubernetes.client.rest import ApiException
from datetime import datetime
import time
import subprocess
import re
import math
import redis
import platform
import psutil
import threading
import csv
import json

# Set the calculate_pod_usage loop frequency in milliseconds
pod_status_loop_duration_ms = 50

# Set the request rate of the UI frontend in ms
ui_frontend_request_frequency_ms = 600

# Creating an event object to notify the data sent to redis DB
signal_fetch_event = threading.Event()

# Connect to the Database server
r = redis.Redis(host='localhost', port=6379, db=0)

# Chose whether to use Megabyte(1000) or Mebibyte(1024) for memory representation
Mem_div_factor = 1024


# Set the log file to store the data
log_file = "../ui/logs/all_logs.csv"

def get_current_time():
    # Get the current time
    now = datetime.now()
    # Format the time as a string
    time_string = now.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    return time_string

def fetch_node_cpu_memory(node):
    node_arch = node.metadata.labels['beta.kubernetes.io/arch']
    node_cpu = int(node.status.capacity['cpu']) * 1000
    node_memory = int(node.status.capacity['memory'].strip('Ki')) / Mem_div_factor

    print("System CPU Architecture: ", node_arch)
    return node_arch, node_cpu, node_memory

def get_node_details(client):
    nodes = client.list_node()
    arch = ""
    cpu = ""
    memory = ""
    for node in nodes.items:
        if 'aarch64' == platform.machine():
            if "arm64" == node.metadata.labels['beta.kubernetes.io/arch'].lower():
                arch, cpu, memory = fetch_node_cpu_memory(node)
        elif 'x86_64' == platform.machine():
            if "amd64" == node.metadata.labels['beta.kubernetes.io/arch'].lower():
                arch, cpu, memory = fetch_node_cpu_memory(node)
    return cpu, memory

def calculate_pod_usage(metrics_client, namespace, node_cpu, node_memory):
    pod_usage_list = []
    pod_cpu_in_per = 0
    pod_mem_in_per = 0
    total_pod_cpu_usage_per = 0
    total_pod_mem_usage_per = 0
    avp_cpu_usage = 0
    avp_memory_usage = 0

    # Get pod metrics
    pods_metrics = metrics_client.get_namespaced_custom_object(
        name="",
        group='metrics.k8s.io',
        version='v1beta1',
        namespace=namespace,
        plural='pods'
    )

    for pod in pods_metrics['items']:
        pod_name = pod['metadata']['name']
        containers = pod['containers']
        for container in containers:
            container_name = container['name']
            usage = container['usage']
            cpu_usage = usage['cpu']
            memory_usage = usage['memory']
            #print("** container_name",container_name, "CPU Usage: ", cpu_usage, "Memory: ", memory_usage)

            # Convert the pod cpu and memory usage values to millicores(m) and Mebibytes(Mi)
            cpu_usage_in_m = 0
            memory_usage_in_Mi = 0
            if 'u' in cpu_usage:
                cpu_usage_in_m = cpu_usage.strip('u')
                cpu_usage_in_m = math.ceil(int(cpu_usage_in_m)/1000)
            elif 'n' in cpu_usage:
                cpu_usage_in_m = cpu_usage.strip('n')
                cpu_usage_in_m = math.ceil(int(cpu_usage_in_m)/1000000)
            if 'Ki' in memory_usage:
                memory_usage_in_Mi = memory_usage.strip('Ki')
                memory_usage_in_Mi = math.floor(int(memory_usage_in_Mi)/Mem_div_factor)
            elif 'Mi' in memory_usage:
                memory_usage_in_Mi = memory_usage.strip('Mi')
            pod_name_short = pod_name.split('-')[0]
            #print(f" - Pod: {pod_name_short}, CPU Usage: {cpu_usage_in_m}, Memory Usage: {memory_usage_in_Mi}")

            # % representation of pod usage for cpu and memory
            pod_cpu_in_per = round(int(cpu_usage_in_m)/node_cpu * 100, 3)
            pod_mem_in_per = round(int(memory_usage_in_Mi)/node_memory * 100, 3)
            #print(f" - per_pod_cpu: {pod_cpu_in_per}%, per_pod_memory: {pod_mem_in_per}%")

            # Calculate total pod cpu and memory usage
            total_pod_cpu_usage_per += pod_cpu_in_per
            total_pod_mem_usage_per += pod_mem_in_per

            # Calculate total avp cpu and memory usage
            if "app" not in pod_name_short:
                avp_cpu_usage += pod_cpu_in_per
                avp_memory_usage += pod_mem_in_per

            str_pod_cpu_in_per = "{:.2f}".format(pod_cpu_in_per)
            str_pod_mem_in_per = "{:.2f}".format(pod_mem_in_per)
            pod_tuple = (pod_name_short, str_pod_cpu_in_per, str_pod_mem_in_per)
            pod_usage_list.append(pod_tuple)

    print("".center(35, "-"))
    print(f'''    Total pod cpu       = {total_pod_cpu_usage_per:.2f}%
    Total pod memory    = {total_pod_mem_usage_per:.2f}%
    avp_cpu_usage       = {avp_cpu_usage:.2f}%
    avp_memory_usage    = {avp_memory_usage:.2f}%''')

    r.set("avp_cpu","{:.2f}".format(avp_cpu_usage))
    r.set("avp_mem","{:.2f}".format(avp_memory_usage))
    r.set("pod_cpu_usage", "{:.2f}".format(total_pod_cpu_usage_per))
    r.set("pod_memory_usage", "{:.2f}".format(total_pod_mem_usage_per))
    r.set("pod_usage", str(pod_usage_list).strip("[]") ) # Converting list to string directly messes up the string formatting
    signal_fetch_event.set()

def calculate_avg_pod_usage():
    # total_values_to_average is calculated based on UI request time
    # 600ms -> 600/50 -> 12 values to be averaged
    # 50 represents pod_status_loop_duration_ms of the pod_status function
    frontend_loopfrequency = ui_frontend_request_frequency_ms
    total_values_to_average = int(frontend_loopfrequency/pod_status_loop_duration_ms)
    while True:
        # st_time = time.time()
        count = total_values_to_average
        avg_pod_cpu = 0
        avg_pod_memory = 0
        avg_avp_cpu = 0
        avg_avp_memory = 0
        json_str = {}
        while (count > 0):
            if signal_fetch_event.is_set():
                signal_fetch_event.clear()
                # print(f"count: {count}, time - {get_current_time()}")
                str_pod_cpu = r.get('pod_cpu_usage').decode('utf-8')
                str_pod_memory = r.get('pod_memory_usage').decode('utf-8')
                str_avp_cpu = r.get('avp_cpu').decode('utf-8')
                str_avp_memory = r.get('avp_mem').decode('utf-8')

                avg_pod_cpu += float(str_pod_cpu) if str_pod_cpu else 0
                avg_pod_memory += float(str_pod_memory) if str_pod_memory else 0
                avg_avp_cpu += float(str_avp_cpu) if str_avp_cpu else 0
                avg_avp_memory += float(str_avp_memory) if str_avp_memory else 0

                json_str["time"] = get_current_time()
                json_str["current_pod_cpu"] = float(str_pod_cpu)
                json_str["current_pod_memory"] = float(str_pod_memory)
                json_str["current_avp_cpu"] = float(str_avp_cpu)
                json_str["current_avp_memory"] = float(str_avp_memory)

                r.rpush("ui_data_list", json.dumps(json_str))
                with open(log_file, 'a', newline='') as csvfile:
                    writer = csv.writer(csvfile)
                    writer.writerow([json_str])
                count -= 1
            time.sleep(0.01)

        avg_pod_cpu = avg_pod_cpu/total_values_to_average
        avg_pod_memory = avg_pod_memory/total_values_to_average
        avg_avp_cpu = avg_avp_cpu/total_values_to_average
        avg_avp_memory = avg_avp_memory/total_values_to_average
        r.set("avg_pod_cpu_usage","{:.2f}".format(avg_pod_cpu))
        r.set("avg_pod_memory_usage","{:.2f}".format(avg_pod_memory))
        r.set("avg_avp_cpu_usage","{:.2f}".format(avg_avp_cpu))
        r.set("avg_avp_memory_usage","{:.2f}".format(avg_avp_memory))
        print(f"Avg pod CPU: {avg_pod_cpu:.2f}%, Avg pod Memory: {avg_pod_memory:.2f}%, Avg AVP CPU: {avg_avp_cpu:.2f}%, Avg AVP Memory: {avg_avp_memory:.2f}%")
        # ed_time = time.time() - st_time
        # print(f"Time_Duration for True loop: {ed_time * 1000} ms")

def main():

    node_total_cpu = 0; node_total_memory = 0

    # Thread to log the current pod usage values
    thread_avg_pod_usage = threading.Thread(target=calculate_avg_pod_usage)
    thread_avg_pod_usage.daemon = True
    thread_avg_pod_usage.start()

    # Load kube config from default location
    config.load_kube_config()
    # Create a Metrics API client
    metrics_client = client.CustomObjectsApi()
    # create node_client
    node_client = client.CoreV1Api()
    namespace = 'default'  # Change this to your namespace

    try:
        print("Using Python module".center(50, "-"))
        # get the node cpu and memory info
        node_total_cpu, node_total_memory = get_node_details(client=node_client)
        print(f"Node CPU: {node_total_cpu}m, Node Memory: {node_total_memory}Mi")
        r.set("node_total_cpu", str(node_total_cpu))
        r.set("node_total_memory", str(node_total_memory))
    except ApiException as e:
        print(f"Exception: Kubernetes Core API not available...!")

    while True:
        try:
            st_time = time.time()
            calculate_pod_usage(metrics_client=metrics_client,
                                namespace=namespace,
                                node_cpu = node_total_cpu,
                                node_memory = node_total_memory)
            pod_usage_duration = (time.time() - st_time) * 1000
            # Adjust the sleep time based on the time taken for pod usage computation
            time_to_sleep = round( max(0,pod_status_loop_duration_ms - pod_usage_duration), 3)
            time.sleep(time_to_sleep/1000)
            loop_time = round( (time.time() - st_time) * 1000, 3)
            print(f"Loop Time : {round(loop_time, 3)} ms")
        except ApiException as e:
            print(f"Exception: Kubernetes Metrics {e.reason}: Restart the Kubernetes Service")
            time.sleep(1)
        except KeyboardInterrupt as k:
            print("\nExiting...")
            break

if __name__ == '__main__':
    main()
