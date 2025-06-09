import multiprocessing
import math
from time import sleep
def stress_cpu():
    while True:
        math.sqrt(123456789)  # Perform a CPU-intensive task

 

if __name__ == "__main__":
    processes = []
    for _ in range(3):  # Stress 16 CPU cores
        p = multiprocessing.Process(target=stress_cpu)
        p.start()
        processes.append(p)
        sleep(3)
    for p in processes:
        p.join()
