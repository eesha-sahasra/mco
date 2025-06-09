import multiprocessing
import math
import time

def stress_cpu():
    while True:
        math.sqrt(123456789)  # Perform a CPU-intensive task

if __name__ == "__main__":
    processes = []
    for _ in range(4):  # Stress 4 CPU cores 
        p = multiprocessing.Process(target=stress_cpu)
        p.start()
        processes.append(p)
        time.sleep(2)

    for p in processes:
        p.join()
