import os

device_path = '/dev/stdin'

# Check if the device is readable
try:
    with open(device_path, 'r') as f:
        print("Device is readable")
except Exception as e:
    print(f"Error reading device: {e}")

# Check if the device is writable
try:
    with open(device_path, 'w') as f:
        f.write('Hello, World!')
    print("Device is writable")
except Exception as e:
    print(f"Error writing to device: {e}")

# Write a single byte to the device
data = b'\x00'
try:
    with open(device_path, 'wb') as f:
        f.write(data)
except Exception as e:
    print(f"Error writing to device: {e}")
    exit(1)

# Read a single byte from the device
try:
    with open(device_path, 'rb') as f:
        read_data = f.read(1)
except Exception as e:
    print(f"Error reading from device: {e}")
    exit(1)

# Verify data integrity
if read_data == data:
    print("Data integrity verified")
else:
    print("Data integrity failed")



