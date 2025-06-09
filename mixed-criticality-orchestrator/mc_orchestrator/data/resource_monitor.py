import json
import redis
import psutil
import subprocess
import tkinter as tk
import multiprocessing
from tkinter import ttk, simpledialog

class InputDialog(simpledialog.Dialog):
    def body(self, master):
        tk.Label(master, text="Enter CPU load %:").grid(row=0)
        tk.Label(master, text="Enter Memory load %:").grid(row=1)

        self.e1 = tk.Entry(master)
        self.e2 = tk.Entry(master)

        self.e1.grid(row=0, column=1)
        self.e2.grid(row=1, column=1)

        return self.e1  # initial focus

    def apply(self):
        self.result = (self.e1.get(), self.e2.get())

class App:
    def update_stress_on_pc(self, new_value):
        redis_db.set('stress_on_pc', new_value)
    
    def update_stress_request(self, command_str):
        redis_db.set('stress_request', command_str)
    
    def read_stress_on_pc(self):
        value = self.redis_db.get("stress_on_pc")
        if value is not None:
            value = value.decode("utf-8")
        return value

    def update_values(self):
        self.list_content = [item.decode("utf-8") for item in self.redis_db.lrange('all_apps', 0, -1)]
        for key in self.extra_keys:
            value = self.redis_db.get(key)
            if value is not None:
                value = value.decode("utf-8")
            self.extra_labels[key].config(text=f"{key}: {value}")
        for item in self.tree.get_children():
            self.tree.delete(item)
        for item in self.list_content:
            values = []
            app_value = self.redis_db.get(item)
            # Convert the JSON string into a list of dictionaries
            data = json.loads(app_value)
            # Combine the list of dictionaries into a single dictionary
            combined_data = {k: v for d in data for k, v in d.items()}
            for key in self.keys:
                value = combined_data.get(key)
                if value is not None:
                    if isinstance(value, bytes):
                        value = value.decode("utf-8")
                values.append(value)
            self.tree.insert('', 'end', values=values)
        self.root.after(1000, self.update_values)  # update every second
    
    # Callback functions for the buttons
    def start_stress_callback(self):
        flag = self.read_stress_on_pc()  # Read the value of "stress_on_pc" from redis database
        if flag == "false":
            dialog = InputDialog(self.root)
            cpu_load, memory_load = dialog.result
            
            num_cores = multiprocessing.cpu_count()
            cpu_load = str(int(num_cores*(int(cpu_load)/100)))
            print(f'Total CPU cores loaded: {cpu_load}')

            mem_info = psutil.virtual_memory()
            total_memory = mem_info.total

            # total_memory is in bytes, convert it to MB
            total_memory_mb = total_memory / (1024 * 1024)
            total_memory_mb = int(total_memory_mb/num_cores)
            memory_load = str(int((int(memory_load)/100)*total_memory_mb)) + 'M'
            print(f'Memory load per core in MB: {memory_load}')

            command = ["stress", "--vm", str(cpu_load), "--vm-bytes", memory_load]
            command_str = ' '.join(command)
            print(f"Command: " + command_str)

            # Update the stress label
            display_text = "   " + command_str + "   "
            self.stress_label.config(text=display_text)
            
            subprocess.Popen(command)  # Start the stress test
            self.update_stress_request(command_str) # Call the function with the "command" to update json key
            self.update_stress_on_pc("true")  # Update the value of "stress_on_pc" to "true"
        elif flag == "true":
            tk.messagebox.showinfo("Warning", "Stress test is already running", parent=root)
        else:
            tk.messagebox.showinfo("Error", "Stress test status not found", parent=root)

    def stop_stress_callback(self):
        subprocess.run(["pkill", "stress"])
        self.update_stress_on_pc("false")  # Update the value of "stress_on_pc" to "false"
        self.update_stress_request("")  # Reset "stress_request" key in config file with empty string
        self.stress_label.config(text="                              ")  # Update the stress label
        
    def __init__(self, root, redis_db):
        self.root = root
        self.redis_db = redis_db
        self.update_stress_request("")   # Initialize redis db for key "stress_request" with empty string
        self.update_stress_on_pc("false")    # Initialize redis db for key "stress_on_pc" with "false"
        self.keys = ['name', 'priority', 'pod_name', 'pod_running_status', 'pod_status']  # replace with your keys
        self.extra_keys = ['timestamp', 'avg_cpu_utilization', 'avg_memory_utilization']  # replace with your extra keys
        self.extra_labels = {}
        for key in self.extra_keys:
            self.extra_labels[key] = tk.Label(root, text="")
            self.extra_labels[key].pack()
        self.tree = ttk.Treeview(root, columns=self.keys, show='headings')
        for key in self.keys:
            self.tree.heading(key, text=key)
            self.tree.column(key, width=200)
        self.tree.pack()

        # Create a frame to hold the buttons
        self.button_frame = tk.Frame(root)
        self.button_frame.pack(side=tk.BOTTOM)

        # Add two buttons at the bottom
        self.start_stress = tk.Button(self.button_frame, text="Start Stress", command=self.start_stress_callback, bg='green')
        self.start_stress.pack(side=tk.LEFT)

        # Add a label between the buttons
        self.stress_label = tk.Label(self.button_frame, text="                              ")
        self.stress_label.pack(side=tk.LEFT)

        self.stop_stress = tk.Button(self.button_frame, text="Stop Stress", command=self.stop_stress_callback, bg='red')
        self.stop_stress.pack(side=tk.RIGHT)

        self.list_content = [item.decode("utf-8") for item in redis_db.lrange('all_apps', 0, -1)]
        self.update_values()

redis_db = redis.Redis(host='localhost', port=6379, db=0)
root = tk.Tk()
root.title("Pod Monitor")
app = App(root, redis_db)
root.mainloop()