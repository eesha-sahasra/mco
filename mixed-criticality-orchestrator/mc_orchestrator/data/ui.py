import tkinter as tk
import json

def save_data():
    data = {
        "qm_app_yaml_path": "../data/nginx.yaml",
        "port_number": port_number_entry.get(),

        "resource_monitor_sample_size": sample_size_entry.get(),
        "resource_monitor_time_interval": time_interval_entry.get(),
        "cpu_utilization_threshold": cpu_threshold_entry.get(),
        "memory_utilization_threshold": memory_threshold_entry.get(),

        "qm_pod_1": "qm-pod-1-",
        "qm_pod_1_name":"nginx",
        "qm_pod_1_cpu_limit": cpu_limit_entry.get(),
        "qm_pod_1_memory_limit": memory_limit_entry.get(),
        "qm_pod_1_cpu_request": cpu_request_entry.get(),
        "qm_pod_1_memory_request": memory_request_entry.get()
    }
    with open('config.json', 'w') as f:
        json.dump(data, f)

root = tk.Tk()

tk.Label(root, text="LFO Port Number").grid(row=0)
tk.Label(root, text="Resource Avg Size").grid(row=1)
tk.Label(root, text="Time interval in sec").grid(row=2)
tk.Label(root, text="CPU threshold %").grid(row=3)
tk.Label(root, text="Memory threshold %").grid(row=4)
tk.Label(root, text="CPU request 'm'").grid(row=5)
tk.Label(root, text="Memory request 'Mi'").grid(row=6)
tk.Label(root, text="CPU limit 'm'").grid(row=7)
tk.Label(root, text="Memory limit 'Mi'").grid(row=8)

port_number_entry = tk.Entry(root)
sample_size_entry = tk.Entry(root)
time_interval_entry = tk.Entry(root)
cpu_threshold_entry = tk.Entry(root)
memory_threshold_entry = tk.Entry(root)
cpu_request_entry = tk.Entry(root)
memory_request_entry = tk.Entry(root)
cpu_limit_entry = tk.Entry(root)
memory_limit_entry = tk.Entry(root)

port_number_entry.grid(row=0, column=1)
sample_size_entry.grid(row=1, column=1)
time_interval_entry.grid(row=2, column=1)
cpu_threshold_entry.grid(row=3, column=1)
memory_threshold_entry.grid(row=4, column=1)
cpu_request_entry.grid(row=5, column=1)
memory_request_entry.grid(row=6, column=1)
cpu_limit_entry.grid(row=7, column=1)
memory_limit_entry.grid(row=8, column=1)

tk.Button(root, text='Save', command=save_data).grid(row=9, column=0, sticky=tk.W, pady=4)

root.mainloop()