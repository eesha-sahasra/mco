import os
import time
import subprocess

def increase_read_write_operations(device_path):
    """Keep reading and writing data from/to a device, doubling the read/write size each time."""
    read_size = 1024  # Initial read/write size in bytes (1 KB)

    try:
        while True:
            total_bytes_read = 0
            total_bytes_written = 0

            # Start timer for the read operation
            start_time = time.time()

            # Read data from the device using 'dd'
            with subprocess.Popen(['sudo', 'dd', f'if={device_path}', f'bs={read_size}', 'status=none'],
                                  stdout=subprocess.PIPE, stderr=subprocess.PIPE) as proc:
                output, error = proc.communicate()
                if proc.returncode != 0:
                    print(f"Error reading device: {error.decode()}")
                    break

                total_bytes_read = len(output)

            end_time = time.time()
            read_duration = end_time - start_time
            read_speed = total_bytes_read / read_duration if read_duration > 0 else 0

            print(f"Read size: {read_size} bytes, Total bytes read: {total_bytes_read}, Read speed: {read_speed / (1024 * 1024):.2f} MB/s")

            # Start timer for the write operation
            write_start_time = time.time()

            # Write random data to the device using 'dd'
            with subprocess.Popen(['dd', 'if=/dev/urandom', f'of={device_path}', f'bs={read_size}', 'status=none'],
                                  stdout=subprocess.PIPE, stderr=subprocess.PIPE) as proc:
                _, error = proc.communicate()
                if proc.returncode != 0:
                    print(f"Error writing to device: {error.decode()}")
                    break

                total_bytes_written = read_size  # Since we write exactly read_size bytes

            write_end_time = time.time()
            write_duration = write_end_time - write_start_time
            write_speed = total_bytes_written / write_duration if write_duration > 0 else 0

            print(f"Write size: {read_size} bytes, Total bytes written: {total_bytes_written}, Write speed: {write_speed / (1024 * 1024):.2f} MB/s")

            # Double the read/write size
            read_size *= 2

            # Safety limit to avoid reading/writing beyond the device
            if read_size > os.path.getsize(device_path):
                print("Read/Write size exceeded device size. Resetting to 1 KB.")
                read_size = 1024

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    device_path = "/dev/nvme0n1"  # Change this to the correct device path

    # Start increasing read/write operations on the specified device
    increase_read_write_operations(device_path)


