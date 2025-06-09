#include <iostream>
#include <vector>
#include <thread>
#include <chrono>
#include <atomic>
#include <cmath>
#include <iomanip>
#include <string>
#include <csignal>
#include <memory>
#include <algorithm>
#include <sstream>
#include <cstring>
#include <mutex>
#include <condition_variable>

#ifdef _WIN32
#include <windows.h>
#include <psapi.h>
#include <pdh.h>
#include <pdhmsg.h>
#pragma comment(lib, "pdh.lib")
#else
// Linux
#include <sys/resource.h>
#include <unistd.h>
#include <pthread.h>
#include <sys/sysinfo.h>
#endif

// Global variables
std::atomic<bool> stopRequested(false);
std::mutex consoleMutex;

// Function to handle Ctrl+C
void signalHandler(int signal) {
    if (signal == SIGINT) {
        std::cout << "\nInterrupted by user. Releasing resources..." << std::endl;
        stopRequested.store(true);
    }
}

// Function to format bytes to human-readable form
std::string formatSize(size_t bytesSize) {
    const char* units[] = {"B", "KB", "MB", "GB"};
    double size = static_cast<double>(bytesSize);
    int unitIndex = 0;
    
    while (size >= 1024.0 && unitIndex < 3) {
        size /= 1024.0;
        unitIndex++;
    }
    
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2) << size << " " << units[unitIndex];
    return oss.str();
}

// Function to convert GB to bytes
size_t convertToBytes(double gbAmount) {
    return static_cast<size_t>(gbAmount * 1024 * 1024 * 1024);
}

// Get current process memory usage
size_t getProcessMemoryUsage() {
#ifdef _WIN32
    PROCESS_MEMORY_COUNTERS_EX pmc;
    GetProcessMemoryInfo(GetCurrentProcess(), (PROCESS_MEMORY_COUNTERS*)&pmc, sizeof(pmc));
    return pmc.WorkingSetSize;
#else
    // Linux
    FILE* file = fopen("/proc/self/statm", "r");
    if (file) {
        long rss;
        if (fscanf(file, "%*s %ld", &rss) == 1) {
            fclose(file);
            return rss * sysconf(_SC_PAGESIZE);
        }
        fclose(file);
    }
    return 0;
#endif
}

// Get number of CPU cores
int getCpuCount() {
    return std::thread::hardware_concurrency();
}

// Set thread CPU affinity
void setThreadAffinity(int coreId) {
#ifdef _WIN32
    SetThreadAffinityMask(GetCurrentThread(), (1ULL << coreId));
#else
    // Linux
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(coreId, &cpuset);
    pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
#endif
}

// CPU worker function
void singleCoreWorker(int cpuPercent, int processId) {
    try {
        // Set thread affinity to pin to a specific core
        int coreId = processId % getCpuCount();
        setThreadAffinity(coreId);
        
        // Calculate work/sleep ratio based on target percentage
        const double cycleTime = 0.01; // Total cycle time in seconds
        const double workTime = cycleTime * (cpuPercent / 100.0);
        const double sleepTime = cycleTime - workTime;
        
        // Get high-resolution timing
        using Clock = std::chrono::high_resolution_clock;
        using Duration = std::chrono::duration<double>;
        
        while (!stopRequested.load()) {
            // Work phase - busy loop to consume CPU
            auto startTime = Clock::now();
            while (Duration(Clock::now() - startTime).count() < workTime) {
                // Busy loop
                // Add a small calculation to prevent compiler optimization
                volatile double x = std::sin(static_cast<double>(Clock::now().time_since_epoch().count()));
            }
            
            // Sleep phase - release CPU
            if (sleepTime > 0) {
                std::this_thread::sleep_for(std::chrono::duration<double>(sleepTime));
            }
        }
    } catch (const std::exception& e) {
        std::lock_guard<std::mutex> lock(consoleMutex);
        std::cerr << "Error in CPU worker thread " << processId << ": " << e.what() << std::endl;
    }
}

// Memory allocation function
std::vector<std::unique_ptr<std::vector<char>>> fillMemory(
    double targetGb, 
    int stepMb = 100, 
    double delaySec = 1.0
) {
    std::vector<std::unique_ptr<std::vector<char>>> memoryBlocks;
    
    std::cout << "Starting memory filler. Target: " << targetGb << " GB" << std::endl;
    
    if (targetGb != static_cast<int>(targetGb)) {
        // Show fractional breakdown for clarity
        int gbPart = static_cast<int>(targetGb);
        int mbPart = static_cast<int>((targetGb - gbPart) * 1024);
        std::cout << "  (" << gbPart << " GB and " << mbPart << " MB)" << std::endl;
    }
    
    // Calculate target in bytes
    size_t targetBytes = convertToBytes(targetGb);
    size_t stepBytes = static_cast<size_t>(stepMb) * 1024 * 1024;
    
    try {
        // Initial memory usage
        size_t initialUsage = getProcessMemoryUsage();
        size_t currentUsage = initialUsage;
        
        // Main allocation loop
        while (currentUsage < targetBytes && !stopRequested.load()) {
            // Create a new memory block
            auto memoryBlock = std::make_unique<std::vector<char>>(stepBytes, 1);
            memoryBlocks.push_back(std::move(memoryBlock));
            
            // Update current usage
            currentUsage = getProcessMemoryUsage();
            
            // Calculate and display progress
            size_t allocated = currentUsage - initialUsage;
            double progressPercent = std::min(100.0, (static_cast<double>(allocated) / 
                                             (targetBytes - initialUsage)) * 100.0);
            
            // Print progress
            std::cout << "\rAllocated: " << formatSize(allocated) << " / " 
                      << targetGb << " GB (" << std::fixed << std::setprecision(1) 
                      << progressPercent << "%)";
            std::cout.flush();
            
            // Slow down to make the increase gradual
            std::this_thread::sleep_for(std::chrono::duration<double>(delaySec));
        }
        
        if (!stopRequested.load()) {
            std::cout << "\nReached target memory usage." << std::endl;
        }
    } catch (const std::bad_alloc&) {
        std::cout << "\nMemory Error: Cannot allocate more memory. System limit reached." << std::endl;
    } catch (const std::exception& e) {
        std::cout << "\nError during memory allocation: " << e.what() << std::endl;
    }
    
    return memoryBlocks;
}

// Main resource utilization function
void utilizeResources(
    double targetGb = 0, 
    int cpuCores = 0, 
    int cpuPercent = 100, 
    int stepMb = 100, 
    double delaySec = 1.0
) {
    std::vector<std::thread> cpuThreads;
    std::vector<std::unique_ptr<std::vector<char>>> memoryBlocks;
    
    std::cout << "Press Ctrl+C to stop the program at any time" << std::endl;
    
    // Start CPU utilization if requested
    if (cpuCores > 0) {
        int maxCores = getCpuCount();
        int coresToUse = std::min(cpuCores, maxCores);
        
        // Ensure CPU percentage is valid
        cpuPercent = std::max(1, std::min(100, cpuPercent));
        
        std::cout << "Starting CPU utilization on " << coresToUse << " cores at " 
                  << cpuPercent << "% per core" << std::endl;
        std::cout << "Each thread will be pinned to a specific CPU core" << std::endl;
        
        // Start a thread for each core we want to utilize
        for (int i = 0; i < coresToUse; ++i) {
            cpuThreads.emplace_back(singleCoreWorker, cpuPercent, i);
        }
    }
    
    // Start memory utilization if requested
    if (targetGb > 0) {
        memoryBlocks = fillMemory(targetGb, stepMb, delaySec);
    }
    
    // Keep running if either CPU or memory is being utilized
    if (cpuCores > 0 || targetGb > 0) {
        std::cout << "\nResources allocated. Press Ctrl+C to exit and release resources." << std::endl;
        
        // Keep the program running until interrupted
        while (!stopRequested.load()) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    } else {
        std::cout << "No resources were requested to be utilized." << std::endl;
    }
    
    // Signal and wait for all threads to complete
    stopRequested.store(true);
    for (auto& thread : cpuThreads) {
        if (thread.joinable()) {
            thread.join();
        }
    }
    
    // Release memory explicitly
    memoryBlocks.clear();
    std::cout << "Resources released." << std::endl;
}

// Show usage information
void printUsage(const char* programName) {
    std::cout << "Usage:\n\n";
    std::cout << "# CPU only: Use 2 cores at 70% each\n";
    std::cout << programName << " --cpu 2 --cpu-percent 70\n\n";
    
    std::cout << "# Memory only: Allocate 3.2GB of memory\n";
    std::cout << programName << " --memory 3.2\n\n";
    
    std::cout << "# Both: Use 1 core at 100% and 1GB of memory\n";
    std::cout << programName << " --cpu 1 --memory 1\n\n";
    
    std::cout << "# Full options example\n";
    std::cout << programName << " --cpu 2 --cpu-percent 80 --memory 4.5 --step 50 --delay 0.5\n";
}

int main(int argc, char* argv[]) {
    // Default values
    double memory = 0;
    int cpu = 0;
    int cpuPercent = 100;
    int step = 100;
    double delay = 1.0;
    bool memorySpecified = false;
    
    // Parse command line arguments
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        
        if (arg == "--memory" && i + 1 < argc) {
            memory = std::stod(argv[++i]);
            memorySpecified = true;
        } else if (arg == "--cpu" && i + 1 < argc) {
            cpu = std::stoi(argv[++i]);
        } else if (arg == "--cpu-percent" && i + 1 < argc) {
            cpuPercent = std::stoi(argv[++i]);
        } else if (arg == "--step" && i + 1 < argc) {
            step = std::stoi(argv[++i]);
        } else if (arg == "--delay" && i + 1 < argc) {
            delay = std::stod(argv[++i]);
        } else if (arg == "--help") {
            printUsage(argv[0]);
            return 0;
        } else {
            std::cerr << "Unknown option: " << arg << std::endl;
            printUsage(argv[0]);
            return 1;
        }
    }
    
    // Validate arguments
    if (memorySpecified && memory <= 0) {
        std::cerr << "Error: Memory target must be greater than 0 GB" << std::endl;
        return 1;
    }
    
    if (cpuPercent < 1 || cpuPercent > 100) {
        std::cerr << "Error: CPU percentage must be between 1 and 100" << std::endl;
        return 1;
    }
    
    if (cpu == 0 && !memorySpecified) {
        std::cerr << "Error: Must specify at least one resource to utilize (--memory and/or --cpu)" << std::endl;
        return 1;
    }
    
    // Set up signal handling for Ctrl+C
    std::signal(SIGINT, signalHandler);
    
    // Run the resource utilization
    utilizeResources(memory, cpu, cpuPercent, step, delay);
    
    return 0;
}
