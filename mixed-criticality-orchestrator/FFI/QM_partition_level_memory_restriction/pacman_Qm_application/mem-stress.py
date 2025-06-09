# Code to fill complete system memory

import datetime
import os
import sys
import time

import psutil

PROCESS = psutil.Process(os.getpid())
PROCESS_CREATION_TIME = datetime.datetime.now().strftime("%X")

MiB = 1024**2
MEM_CHUNKS = []

class MemoryDump:
    def __init__(self):
        mem = psutil.virtual_memory()
        self.vms = PROCESS.memory_info().vms / MiB
        self.total = mem.total / MiB
        self.available = mem.available / MiB
        self.used = mem.used / MiB
        self.free = mem.free / MiB
        self.percent = mem.percent

    def __str__(self) -> str:
        return (
            f"MemoryDump ({PROCESS_CREATION_TIME}): "
            f"virtual = {self.vms}, total = {self.total}, "
            f"available = {self.available}, used = {self.used}, "
            f"free = {self.free}, percent = {self.percent}"
        )

    def to_bytes(self) -> bytes:
        return self.__str__().encode()

def consume_memory_chunk(chunk_size):
    MEM_CHUNKS.append(" " * chunk_size)

def send_loop():
    chunk_size_mib = 1
    print("Initiating:", MemoryDump())
    sys.stdout.flush()
    while True:
        try:
            mem_dump = MemoryDump()
            # print(mem_dump)
            sys.stdout.flush()

            # Check if memory usage crosses 51%
            if mem_dump.percent > 80:
                print("Memory usage exceeded 80%. Holding for 25 seconds...")
                sys.stdout.flush()
                time.sleep(25)
                print("Resuming memory stress...")
                sys.stdout.flush()

            consume_memory_chunk(chunk_size_mib * MiB)
        except MemoryError:
            # A safeguard, in case QM policy failed to close the service.
            MEM_CHUNKS.clear()
            chunk_size_mib = 1
            continue
        sys.stdout.flush()
        print(MemoryDump())
        chunk_size_mib += 1
        time.sleep(0.5)
# Code to fill complete system memory

import datetime
import os
import sys
import time

import psutil

PROCESS = psutil.Process(os.getpid())
PROCESS_CREATION_TIME = datetime.datetime.now().strftime("%X")

MiB = 1024**2
MEM_CHUNKS = []

class MemoryDump:
    def __init__(self):
        mem = psutil.virtual_memory()
        self.vms = PROCESS.memory_info().vms / MiB
        self.total = mem.total / MiB
        self.available = mem.available / MiB
        self.used = mem.used / MiB
        self.free = mem.free / MiB
        self.percent = mem.percent

    def __str__(self) -> str:
        return (
            f"MemoryDump ({PROCESS_CREATION_TIME}): "
            f"virtual = {self.vms}, total = {self.total}, "
            f"available = {self.available}, used = {self.used}, "
            f"free = {self.free}, percent = {self.percent}"
        )

    def to_bytes(self) -> bytes:
        return self.__str__().encode()

def consume_memory_chunk(chunk_size):
    MEM_CHUNKS.append(" " * chunk_size)

def send_loop():
    chunk_size_mib = 1
    print("Initiating:", MemoryDump())
    sys.stdout.flush()
    while True:
        try:
            mem_dump = MemoryDump()
            # print(mem_dump)
            sys.stdout.flush()

            # Check if memory usage crosses 51%
            if mem_dump.percent > 80:
                print("Memory usage exceeded 80%. Holding for 25 seconds...")
                sys.stdout.flush()
                time.sleep(25)
                print("Resuming memory stress...")
                sys.stdout.flush()

            consume_memory_chunk(chunk_size_mib * MiB)
        except MemoryError:
            # A safeguard, in case QM policy failed to close the service.
            MEM_CHUNKS.clear()
            chunk_size_mib = 1
            continue
        sys.stdout.flush()
        print(MemoryDump())
        chunk_size_mib += 1
        time.sleep(0.5)
# Code to fill complete system memory

import datetime
import os
import sys
import time

import psutil

PROCESS = psutil.Process(os.getpid())
PROCESS_CREATION_TIME = datetime.datetime.now().strftime("%X")

MiB = 1024**2
MEM_CHUNKS = []

class MemoryDump:
    def __init__(self):
        mem = psutil.virtual_memory()
        self.vms = PROCESS.memory_info().vms / MiB
        self.total = mem.total / MiB
        self.available = mem.available / MiB
        self.used = mem.used / MiB
        self.free = mem.free / MiB
        self.percent = mem.percent

    def __str__(self) -> str:
        return (
            f"MemoryDump ({PROCESS_CREATION_TIME}): "
            f"virtual = {self.vms}, total = {self.total}, "
            f"available = {self.available}, used = {self.used}, "
            f"free = {self.free}, percent = {self.percent}"
        )

    def to_bytes(self) -> bytes:
        return self.__str__().encode()

def consume_memory_chunk(chunk_size):
    MEM_CHUNKS.append(" " * chunk_size)

def send_loop():
    chunk_size_mib = 1
    print("Initiating:", MemoryDump())
    sys.stdout.flush()
    while True:
        try:
            mem_dump = MemoryDump()
            # print(mem_dump)
            sys.stdout.flush()

            # Check if memory usage crosses 51%
            if mem_dump.percent > 80:
                print("Memory usage exceeded 80%. Holding for 25 seconds...")
                sys.stdout.flush()
                time.sleep(25)
                print("Resuming memory stress...")
                sys.stdout.flush()

            consume_memory_chunk(chunk_size_mib * MiB)
        except MemoryError:
            # A safeguard, in case QM policy failed to close the service.
            MEM_CHUNKS.clear()
            chunk_size_mib = 1
            continue
        sys.stdout.flush()
        print(MemoryDump())
        chunk_size_mib += 1
        time.sleep(0.5)
if __name__ == "__main__":
    while True:
        try:
            send_loop()
        except OSError as e:
            print("Connection failed:", e)
            print("Retrying")
            sys.stdout.flush()
            time.sleep(5)

