import json
import redis
import psutil
import subprocess
import tkinter as tk
import multiprocessing
from tkinter import simpledialog
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk

# Global variable to store the last known position of the dashed line
last_x = None
vline1 = None
vline2 = None

# Global variables to store the old and current state of pod deletion and pod spawning
init_flag = False
old_pod_availability_state = None
curr_pod_availability_state = None

cpu_at_pod_deletion = []
memory_at_pod_deletion = []

cpu_at_pod_spwan = []
memory_at_pod_spwan = []

# Global variables to store the point size and time interval
point_size = 50
time_interval = 0.1

# Declare these at the beginning of your script
stress_start_times = []
stress_stop_times = []

def get_system_resources_utilization(start_event, stop_event, ax1, ax2, cpu_utilizations, memory_utilizations, canvas, root):
    global old_pod_availability_state, curr_pod_availability_state, init_flag
    global cpu_at_pod_deletion, memory_at_pod_deletion, cpu_at_pod_spwan, memory_at_pod_spwan
    global point_size, time_interval

    if start_event.get() and not stop_event.get():
        cpu_utilization = psutil.cpu_percent(interval=time_interval)  # Get average CPU utilization
        memory_utilization = psutil.virtual_memory().percent

        # Append CPU, Memory utilization
        cpu_utilizations.append(cpu_utilization)
        memory_utilizations.append(memory_utilization)

        # Read the status of pod deletion and pod spawning
        tmp_pod_availability_state = redis_db.get('pod_available').decode('utf-8')

        # Init the old and current state of pod deletion and pod spawning
        if not init_flag:
            old_pod_availability_state = tmp_pod_availability_state
            curr_pod_availability_state = tmp_pod_availability_state
            
            init_flag = True
        else:
            old_pod_availability_state = curr_pod_availability_state
            curr_pod_availability_state = tmp_pod_availability_state

        # Check if a pod is deleted or spawned and plot the CPU and memory utilization at that time
        if curr_pod_availability_state != old_pod_availability_state:
            if curr_pod_availability_state == "false":
                cpu_at_pod_deletion.append(cpu_utilization)
                memory_at_pod_deletion.append(memory_utilization)
                cpu_at_pod_spwan.append(0)
                memory_at_pod_spwan.append(0)

            elif curr_pod_availability_state == "true":
                cpu_at_pod_spwan.append(cpu_utilization)
                memory_at_pod_spwan.append(memory_utilization)
                cpu_at_pod_deletion.append(0)
                memory_at_pod_deletion.append(0)
            else:
                pass
        else :
            cpu_at_pod_deletion.append(0)
            memory_at_pod_deletion.append(0)
            cpu_at_pod_spwan.append(0)
            memory_at_pod_spwan.append(0)

        # Clear the plot
        ax1.clear()
        ax2.clear()
        
        # Set title and labels for the plot
        ax1.set_title('CPU Utilization (%)')
        ax2.set_title('Memory Utilization (%)')

        # Set x-axis label of both plots
        ax1.set_xlabel('100 milliseconds')
        ax2.set_xlabel('100 milliseconds')
    
        # Set y-axis limits to 0-105% for CPU and memory utilization
        ax1.set_ylim([0, 105])
        ax2.set_ylim([0, 105])
        
        # Plot CPU utilization
        ax1.plot(cpu_utilizations, color='b')
        
        # Plot memory utilization
        ax2.plot(memory_utilizations, color='magenta')

        # Check if a pod is deleted and plot the CPU and memory utilization at that time
        ax1.scatter(range(len(cpu_at_pod_deletion)), cpu_at_pod_deletion, s=[point_size if cpu > 0 else 0 for cpu in cpu_at_pod_deletion], color='r')
        ax2.scatter(range(len(memory_at_pod_deletion)), memory_at_pod_deletion, s=[point_size if cpu > 0 else 0 for cpu in memory_at_pod_deletion], color='r')

        # Check if a pod is spawned and plot the CPU and memory utilization at that time
        ax1.scatter(range(len(cpu_at_pod_spwan)), cpu_at_pod_spwan, s=[point_size if cpu > 0 else 0 for cpu in cpu_at_pod_spwan], color='g')
        ax2.scatter(range(len(memory_at_pod_spwan)), memory_at_pod_spwan, s=[point_size if cpu > 0 else 0 for cpu in memory_at_pod_spwan], color='g')
        
        for start_time, stop_time in zip(stress_start_times, stress_stop_times):
            # Fill the span between start_time and stop_time with color and opacity
            ax1.axvspan(start_time, stop_time, color='red', alpha=0.15)
            ax2.axvspan(start_time, stop_time, color='red', alpha=0.15)

        canvas.draw()
        root.after(100, get_system_resources_utilization, start_event, stop_event, ax1, ax2, cpu_utilizations, memory_utilizations, canvas, root)

def start_monitoring(start_event, stop_event, ax1, ax2, cpu_utilizations, memory_utilizations, canvas, root):
    start_event.set(True)
    stop_event.set(False)
    get_system_resources_utilization(start_event, stop_event, ax1, ax2, cpu_utilizations, memory_utilizations, canvas, root)

def stop_monitoring(start_event, stop_event):
    start_event.set(False)
    stop_event.set(True)
    
    # Stop the stress test if it is running
    stop_stress()

    # Close the application
    root.quit()

def capture_plot():
    # Dummy plots for legend
    delete_marker, = ax1.plot([], [], linestyle='none', color='red', marker='o', label='QM Pod Deleted')
    create_marker, = ax1.plot([], [], linestyle='none', color='green', marker='o', label='QM Pod Spawned')

    # Show the dummy plots
    delete_marker.set_visible(True)
    create_marker.set_visible(True)    
    
    # Display the legend
    ax1.legend() 

    # Creating a grid background for the plot so that saved image is more readable
    ax1.grid(True)
    ax2.grid(True)
    
    # Set y-axis ticks to 0, 10, 20, ..., 100
    ax1.set_yticks(range(0, 101, 10))
    ax2.set_yticks(range(0, 101, 10))    

    plt.savefig('utilization_graph.png')

class InputDialog(tk.simpledialog.Dialog):
    def body(self, master):
        self.title("Input")
        tk.Label(master, text="Enter CPU load %:").grid(row=0)
        tk.Label(master, text="Enter Memory load %:").grid(row=1)

        self.e1 = tk.Entry(master)
        self.e2 = tk.Entry(master)

        self.e1.grid(row=0, column=1)
        self.e2.grid(row=1, column=1)

        return self.e1  # initial focus

    def apply(self):
        self.result = (self.e1.get(), self.e2.get())

def read_stress_on_pc():
    stress_on_pc = redis_db.get('stress_on_pc')
    return stress_on_pc.decode('utf-8')

def update_stress_on_pc(new_value):
    redis_db.set('stress_on_pc', new_value)

def update_config_file(command_str):
    redis_db.set('stress_request', command_str)

def start_stress(start_event, root):   
    flag = read_stress_on_pc()  # Read the value of "stress_on_pc" from redis database
    if flag == "false":
        # If start_event is not set, show a pop-up message and return
        if not start_event.get():
            tk.messagebox.showinfo("Warning", "Please click on Start Monitoring", parent=root)
            return

        dialog = InputDialog(root)  # Ask the user for cpu_load and memory_load

        stress_start_times.append(len(cpu_utilizations))  # Record the time when the stress starts
        num_cores = multiprocessing.cpu_count()
        
        cpu_load, memory_load = dialog.result
        
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
        
        subprocess.Popen(command)  # Start the stress test
        update_config_file(command_str) # Call the function with the "command" to update json key
        update_stress_on_pc("true")  # Update the value of "stress_on_pc" to "true"
    
    else:
        tk.messagebox.showinfo("Warning", "Stress test is already running", parent=root)

def stop_stress():

    flag = read_stress_on_pc()  # Read the value of "stress_on_pc" from the redis database
    if flag == "true":
        stress_stop_times.append(len(cpu_utilizations))  # Record the time when the stress stops
        subprocess.run(["pkill", "stress"])
        update_config_file("")  # Reset "stress_request" key in config file with empty string
        update_stress_on_pc("false")  # Update the value of "stress_on_pc" to "false"

def on_hover(event):
    global last_x, vline1, vline2  # Declare the variables as global to modify them
    
    if (event.inaxes == ax1 and ax1.get_lines()) or (event.inaxes == ax2 and ax2.get_lines()):
        last_x = event.xdata  # Store the last known position of the dashed line
        
        # Remove the old lines if they exist
        if vline1:
            vline1.remove()
        if vline2:
            vline2.remove()

        # Draw the new lines and store them in the variables
        vline1 = ax1.axvline(x=last_x, color='k', linestyle='--')
        vline2 = ax2.axvline(x=last_x, color='k', linestyle='--')

        cpu_line = ax1.get_lines()[0]
        cpudata = cpu_line.get_ydata()
        memory_line = ax2.get_lines()[0]
        memorydata = memory_line.get_ydata()
        
        try:
            cpu_usage = cpudata[int(event.xdata)]
            cpu_text.set(f'CPU Usage: {cpu_usage}')
            memory_usage = memorydata[int(event.xdata)]
            memory_text.set(f'Memory Usage: {memory_usage}')
        except IndexError:
            pass

    fig.canvas.draw_idle()

if __name__ == "__main__":
    
    redis_db = redis.Redis(host='localhost', port=6379, db=0)  # Create a connection to your Redis server
    
    update_config_file("")  # Initialize redis db for key "stress_request" with empty string
    update_stress_on_pc("false")    # Initialize redis db for key "stress_on_pc" with "false"
    
    cpu_utilizations = []
    memory_utilizations = []

    fig, (ax1, ax2) = plt.subplots(2, 1)  # Create two subplots
    plt.subplots_adjust(hspace=0.5)

    ax1.yaxis.tick_right()
    ax2.yaxis.tick_right()
    
    root = tk.Tk()
    root.title("Resource Utilization Monitor")

    start_event = tk.BooleanVar()
    stop_event = tk.BooleanVar()

    canvas = FigureCanvasTkAgg(fig, master=root)
    canvas.draw()
    canvas.get_tk_widget().pack(side=tk.TOP, fill=tk.BOTH, expand=1)
    
    # Create labels to display CPU and memory utilization
    cpu_text = tk.StringVar()
    memory_text = tk.StringVar()

    label_frame = tk.Frame(root)
    label_frame.pack(side=tk.TOP, fill=tk.X)

    cpu_label = tk.Label(label_frame, textvariable=cpu_text)
    cpu_label.grid(row=0, column=0)
    memory_label = tk.Label(label_frame, textvariable=memory_text)
    memory_label.grid(row=0, column=1)

    fig.canvas.mpl_connect('motion_notify_event', on_hover)

    toolbar = NavigationToolbar2Tk(canvas, root)
    toolbar.update()
    canvas.get_tk_widget().pack(side=tk.TOP, fill=tk.BOTH, expand=1)

    start_button = tk.Button(master=root, text="Start Monitoring", command=lambda: start_monitoring(start_event, stop_event, ax1, ax2, cpu_utilizations, memory_utilizations, canvas, root), bg='green')
    start_button.pack(side=tk.LEFT)

    stop_button = tk.Button(master=root, text="Stop Monitoring", command=lambda: stop_monitoring(start_event, stop_event), bg='red')
    stop_button.pack(side=tk.LEFT)
    
    stop_stress_button = tk.Button(master=root, text="Stop Stress", command=lambda: stop_stress(), bg='red')
    stop_stress_button.pack(side=tk.RIGHT)

    start_stress_button = tk.Button(master=root, text="Start Stress", command=lambda: start_stress(start_event, root), bg='green')
    start_stress_button.pack(side=tk.RIGHT)

    capture_button = tk.Button(master=root, text="Save Image", command=capture_plot, bg='cyan')
    capture_button.pack(side=tk.TOP)

    tk.mainloop()