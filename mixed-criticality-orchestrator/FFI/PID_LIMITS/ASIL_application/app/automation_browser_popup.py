import subprocess
import webbrowser
import time

# Configuration
expected_string = "your_expected_string"
url_to_open = "http://localhost:5000/video_feed"
remote_machine_ip = "192.168.x.x"  # Replace with the remote machine IP
ssh_user = "your_ssh_user"
pem_file = "/path/to/your-key.pem"  # Update with the correct path
container_command = "sudo podman run -it --rm --network=host localhost/yolo-app:latest"

def check_incoming_string():
    """Simulate receiving the string from a server."""
    # Replace this with actual communication logic
    received_string = input("Enter received string: ")
    return received_string

def deploy_container():
    """Deploy the container on the local machine."""
    print("Deploying container...")
    subprocess.run(container_command, shell=True)

def open_browser_remotely():
    """Open a browser tab on the remote machine using SSH."""
    ssh_command = f"ssh -i {pem_file} {ssh_user}@{remote_machine_ip} 'DISPLAY=:0 nohup xdg-open {url_to_open} > /dev/null 2>&1 &'"
    print("Opening browser tab on remote machine...")
    subprocess.run(ssh_command, shell=True)

if __name__ == "__main__":
    while True:
        received_string = check_incoming_string()
        if received_string == expected_string:
            deploy_container()
            open_browser_remotely()
            break
        else:
            print("No match, waiting...")

