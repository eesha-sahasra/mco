#include "inc/mco_utils.hpp"
#include <chrono>
#include <iomanip>
#include <sstream>
#include <fstream>
#include <sys/sysinfo.h>
#include <unistd.h>
#include <vector>
#include <numeric>
#include <string>

#include "inc/mco_common.hpp"
#include "inc/mco_database_handler.hpp"
#include "inc/mco_user_app_control_handler.hpp"

#include <nlohmann/json.hpp>

using json = nlohmann::json;

int accumulated_qm_cpu = 0;
int accumulated_qm_memory = 0;
int accumulated_asil_cpu = 0;
int accumulated_asil_memory = 0;

long initial_available_memory ;
long total_memory ;
long initial_available_cpu ;

std::string GetCurrentTime() {
    auto now = std::chrono::system_clock::now();
    auto now_ms = std::chrono::time_point_cast<std::chrono::milliseconds>(now);
    auto epoch = now_ms.time_since_epoch();
    auto value = std::chrono::duration_cast<std::chrono::milliseconds>(epoch);
    std::time_t now_time = std::chrono::system_clock::to_time_t(now);
    std::tm* ttm = std::localtime(&now_time);

    std::stringstream ss;
    ss << std::put_time(ttm, "%Y-%m-%d %H:%M:%S"); // YYYY-MM-DD HH:MM:SS
    ss << '.' << std::setfill('0') << std::setw(3) << value.count() % 1000; // Append milliseconds

    return ss.str();
}

void UpdateEvent(std::string curr_event) {
    if (curr_event != prev_event) {
        prev_event = curr_event;
        string time = GetCurrentTime();
        std::string msg = time + "  ---->  " + curr_event;
        DatabaseHandler::GetInstance().AddEvents(kEvents, msg);
    }
}

void allocateQmResources(const int percentage) {

    int total_cores = sysconf(_SC_NPROCESSORS_ONLN);

    // Calculate QM allocation
    int allocated_cpu = (percentage * initial_available_cpu) / 100; 
    int qm_allocated_cpu = (allocated_cpu * total_cores) / 100;  
    int allocated_memory = initial_available_memory * (percentage / 100.0);
    int qm_allocated_memory = (allocated_memory * 100) / total_memory; 

    // Ensure CPU range is valid
    std::string cpu_range = (qm_allocated_cpu > 1) ? "0-" + std::to_string(qm_allocated_cpu - 1) : "0";

    // Construct systemd command
    std::string systemd_command = "sudo systemctl set-property qm.service "
                                  "AllowedCPUs=" + cpu_range +
                                  " MemoryHigh=" + std::to_string(qm_allocated_memory) + "%";

    // Execute the command
    int ret = system(systemd_command.c_str());
    if (ret != 0) {
        std::cerr << "Failed to allocate QM resources!" << std::endl;
    } else {
        std::cout << "Successfully allocated " << qm_allocated_cpu << " CPU cores and "
                  << qm_allocated_memory << " % memory for QM." << std::endl;
    }
}

void updateInitialSystemResources(){
    
    struct sysinfo sys_info;
    if (sysinfo(&sys_info) != 0) {
        std::cerr << "Failed to retrieve system information." << std::endl;
        return;
    }
    total_memory = sys_info.totalram / (1024 * 1024); // MiB
    std::ifstream meminfo("/proc/meminfo");
    std::string line;
    long availableMemory = 0;

    while (std::getline(meminfo, line)) {
        if (line.find("MemAvailable:") == 0) {
            std::sscanf(line.c_str(), "MemAvailable: %ld kB", &availableMemory);
            break;
        }
    }
    initial_available_memory = availableMemory/ 1024 ; // MiB
    

    // CPU Stats Struct
    struct CpuTimes {
        unsigned long long user, nice, system, idle, iowait, irq, softirq, steal;
        unsigned long long Total() const { return user + nice + system + idle + iowait + irq + softirq + steal; }
        unsigned long long Idle() const { return idle + iowait; }
    };

    // Helper Function to Read CPU Stats
    auto GetCpuTimes = []() -> CpuTimes {
        std::ifstream file("/proc/stat");
        std::string line;
        CpuTimes times{};
        if (file.is_open() && std::getline(file, line)) {
            std::istringstream ss(line);
            std::string cpu;
            ss >> cpu >> times.user >> times.nice >> times.system >> times.idle >> times.iowait >> times.irq >> times.softirq >> times.steal;
        }
        return times;
    };

    // Available CPU Calculation
    std::vector<float> cpu_percentages;
    for (int i = 0; i < 5; ++i) {
        CpuTimes start = GetCpuTimes();
        usleep(300000); // 300ms delay
        CpuTimes end = GetCpuTimes();
        unsigned long long total_diff = end.Total() - start.Total();
        unsigned long long idle_diff = end.Idle() - start.Idle();
        float available_cpu = ((float)idle_diff / total_diff) * 100;
        cpu_percentages.push_back(available_cpu);
    }

    int avg_available_cpu = std::accumulate(cpu_percentages.begin(), cpu_percentages.end(), 0.0f) / cpu_percentages.size();
    initial_available_cpu = avg_available_cpu ;
    std::cout << "Total Memory: " << total_memory << " MiB" << std::endl;
    std::cout << "Available Memory: " << initial_available_memory << " MiB" << std::endl;
    std::cout << "Available CPU Percentage: " << avg_available_cpu << "%" << std::endl;
    
    nlohmann::json total_resources = {
        {"cpu", "100%"},
        {"memory", std::to_string(total_memory) + "Mi"}
    };
    nlohmann::json available_system_resources = {
        {"cpu", std::to_string(avg_available_cpu) + "%"},
        {"memory", std::to_string(initial_available_memory) + "Mi"}
    };
    nlohmann::json default_qm_usage = {
        {"cpu", "0%"},
        {"memory", "0Mi"}
    };
    nlohmann::json default_asil_usage = {
        {"cpu", "0%"},
        {"memory", "0Mi"}
    };
    int qm_available_memory = 0.9 * initial_available_memory ;
    int qm_available_cpu = 0.9 * initial_available_cpu ;

    nlohmann::json qm_available = {
        {"cpu", std::to_string(qm_available_cpu) + "%"},
        {"memory", std::to_string(qm_available_memory) + "Mi"}
    };
    DatabaseHandler::GetInstance().SaveData(qm_available_resources, qm_available);
    DatabaseHandler::GetInstance().SaveData(qm_resource_usage, default_qm_usage );
    DatabaseHandler::GetInstance().SaveData( total_system_resources,total_resources);
    DatabaseHandler::GetInstance().SaveData( available_resources, available_system_resources);
    DatabaseHandler::GetInstance().SaveData( asil_resource_usage, default_asil_usage);
}

bool checkResourceAvailability(const std::string& app_type, const std::string& app_name) {
    int total_cores = sysconf(_SC_NPROCESSORS_ONLN);
    json required_resources_json = json::parse(DatabaseHandler::GetInstance().ReadData(app_type, app_name, "resources"));
    int required_cpu_int = std::stoi(required_resources_json["cpu"].get<std::string>());
    int required_cpu = float(required_cpu_int) / total_cores * 100;
    int required_memory = std::stoi(required_resources_json["memory"].get<std::string>().substr(0, required_resources_json["memory"].get<std::string>().size() - 2));
    // cout << "Required Resources: " << required_resources_json.dump() << std::endl; // debugging
    // cout << "Required CPU: " << required_cpu << endl;   //debugging
    // cout << "Required Memory: " << required_memory << endl;    //debugging
    
    int available_cpu = std::stoi(DatabaseHandler::GetInstance().ReadData(available_resources, "cpu").substr(0, DatabaseHandler::GetInstance().ReadData(available_resources, "cpu").size() - 1));
    int available_memory = std::stoi(DatabaseHandler::GetInstance().ReadData(available_resources, "memory").substr(0, DatabaseHandler::GetInstance().ReadData(available_resources, "memory").size() - 2));
    
    int qm_available_cpu = std::stoi(DatabaseHandler::GetInstance().ReadData(qm_available_resources, "cpu").substr(0, DatabaseHandler::GetInstance().ReadData(qm_available_resources, "cpu").size() - 1));
    int qm_available_memory = std::stoi(DatabaseHandler::GetInstance().ReadData(qm_available_resources, "memory").substr(0, DatabaseHandler::GetInstance().ReadData(qm_available_resources, "memory").size() - 2));
    
    // std::cout << "Available CPU: " << available_cpu << std::endl;   // debugging
    // std::cout << "Available Memory: " << available_memory << std::endl;  // debugging

    json insufficient_resources;
    insufficient_resources["app"] = app_name;
    insufficient_resources["insufficient_resources"] = json::array();
    
    if(app_type == "asil"){
        if (available_cpu <= required_cpu + kCpuBuffer) {
            insufficient_resources["insufficient_resources"].push_back("cpu");
        }
        //if(app_type != "asil"){ //for pause state
        if (available_memory <= required_memory + kMemoryBuffer) {
            insufficient_resources["insufficient_resources"].push_back("memory");
        }
        //} 
        if (!insufficient_resources["insufficient_resources"].empty()) {
            DatabaseHandler::GetInstance().AddData(lack_of_resources, insufficient_resources.dump());
            return false;
        }
    } else{
        if (qm_available_cpu <= required_cpu) {
            insufficient_resources["insufficient_resources"].push_back("cpu");
        }
        if (qm_available_memory <= required_memory) {
            insufficient_resources["insufficient_resources"].push_back("memory");
        }
        if (!insufficient_resources["insufficient_resources"].empty()) {
            DatabaseHandler::GetInstance().AddData(lack_of_resources, insufficient_resources.dump());
            return false;
        }
    }
    
    return true;


}

void updateResources(const std::string& app_type, const std::string& app_name, bool add) {
    int total_cores = sysconf(_SC_NPROCESSORS_ONLN);
    json required_resources_json = json::parse(DatabaseHandler::GetInstance().ReadData(app_type, app_name, "resources"));
    int required_cpu_int = std::stoi(required_resources_json["cpu"].get<std::string>());
    int required_cpu = float(required_cpu_int) / total_cores * 100;
    int required_memory = std::stoi(required_resources_json["memory"].get<std::string>().substr(0, required_resources_json["memory"].get<std::string>().size() - 2));
    // cout << "Required Resources: " << required_resources_json.dump() << std::endl; // debugging
    // cout << "Required CPU: " << required_cpu << endl;   //debugging
    // cout << "Required Memory: " << required_memory << endl;    //debugging
    
    int available_cpu = std::stoi(DatabaseHandler::GetInstance().ReadData(available_resources, "cpu").substr(0, DatabaseHandler::GetInstance().ReadData(available_resources, "cpu").size() - 1));
    int available_memory = std::stoi(DatabaseHandler::GetInstance().ReadData(available_resources, "memory").substr(0, DatabaseHandler::GetInstance().ReadData(available_resources, "memory").size() - 2));

    int qm_available_cpu = std::stoi(DatabaseHandler::GetInstance().ReadData(qm_available_resources, "cpu").substr(0, DatabaseHandler::GetInstance().ReadData(qm_available_resources, "cpu").size() - 1));
    int qm_available_memory = std::stoi(DatabaseHandler::GetInstance().ReadData(qm_available_resources, "memory").substr(0, DatabaseHandler::GetInstance().ReadData(qm_available_resources, "memory").size() - 2));
    
    if(app_type == "infotainment"){
        if(!add){
            accumulated_qm_cpu = accumulated_qm_cpu+required_cpu;
            accumulated_qm_memory = accumulated_qm_memory+required_memory;
          
            available_cpu -= required_cpu;
            available_memory -= required_memory;

            qm_available_cpu -= required_cpu;
            qm_available_memory -= required_memory;
        }
        else{
            accumulated_qm_cpu = accumulated_qm_cpu-required_cpu;
            accumulated_qm_memory = accumulated_qm_memory-required_memory;

            available_cpu += required_cpu;
            available_memory += required_memory;

            qm_available_cpu += required_cpu;
            qm_available_memory += required_memory;
        }

        json available_system_resources = {
            {"cpu", std::to_string(available_cpu) + "%"},
            {"memory", std::to_string(available_memory) + "Mi"}
        };
        DatabaseHandler::GetInstance().SaveData(available_resources, available_system_resources);

        json qm_usage = {
            {"cpu", std::to_string(accumulated_qm_cpu) + "%"},
            {"memory", std::to_string(accumulated_qm_memory) + "Mi"}
        };
        DatabaseHandler::GetInstance().SaveData(qm_resource_usage, qm_usage);

        json qm_resource_available = {
            {"cpu", std::to_string(qm_available_cpu) + "%"},
            {"memory", std::to_string(qm_available_memory) + "Mi"}
        };
        DatabaseHandler::GetInstance().SaveData(qm_available_resources, qm_resource_available);
    } else if(app_type == "asil"){
        if(!add){
            //if(!asil_initial_memory_updated){ //pause modification
            accumulated_asil_memory = accumulated_asil_memory+required_memory;
            available_memory -= required_memory;
          //  }
          //  else{
                accumulated_asil_cpu = accumulated_asil_cpu+required_cpu;
                available_cpu -= required_cpu;
          //  }
        }
        else{
            //if(!asil_initial_memory_updated){
            accumulated_asil_memory = accumulated_asil_memory-required_memory;
            available_memory += required_memory;
           // }
           // else {
                accumulated_asil_cpu = accumulated_asil_cpu-required_cpu;
                available_cpu += required_cpu;
           // }
        }
        // Define ASIL resource limits
        int asil_cpu_limit = 0.6 * initial_available_cpu; // 60% of total CPU cores
        int asil_memory_limit = 0.6 * initial_available_memory ; // 60% of total memory

        // If ASIL exceeds limits, adjust QM resources
        if (accumulated_asil_cpu > asil_cpu_limit) {
            int excess_cpu = accumulated_asil_cpu - asil_cpu_limit;
            qm_available_cpu -= excess_cpu;  // Reduce QM CPU allocation
        }
        if (accumulated_asil_memory > asil_memory_limit) {
            int excess_memory = accumulated_asil_memory - asil_memory_limit;
            qm_available_memory -= excess_memory;  // Reduce QM Memory allocation
        }   
        
        // Update QM available resources
        json qm_resource_available = {
            {"cpu", std::to_string(qm_available_cpu) + "%"},
            {"memory", std::to_string(qm_available_memory) + "Mi"}
        };
        DatabaseHandler::GetInstance().SaveData(qm_available_resources, qm_resource_available);

        json available_system_resources = {
            {"cpu", std::to_string(available_cpu) + "%"},
            {"memory", std::to_string(available_memory) + "Mi"}
        };
        DatabaseHandler::GetInstance().SaveData(available_resources, available_system_resources);

        json asil_resources = {
            {"cpu", std::to_string(accumulated_asil_cpu) + "%"},
            {"memory", std::to_string(accumulated_asil_memory) + "Mi"}
        };
        DatabaseHandler::GetInstance().SaveData(asil_resource_usage, asil_resources);
    }
}

void update_qm_available_resource(const std::string& mode){
    if (mode == "drive" || mode == "reverse") {
        int qm_allocated_memory = 0.4 * initial_available_memory ;
        int qm_allocated_cpu = 0.4 * initial_available_cpu;
        int qm_usage_cpu = std::stoi(DatabaseHandler::GetInstance().ReadData(qm_resource_usage,"cpu").substr(0, DatabaseHandler::GetInstance().ReadData(qm_resource_usage, "cpu").size() - 1));
        int qm_usage_memory = std::stoi(DatabaseHandler::GetInstance().ReadData(qm_resource_usage, "memory").substr(0, DatabaseHandler::GetInstance().ReadData(qm_resource_usage, "memory").size() - 2));

        // List of priority levels (low -> medium -> high)
        vector<string> priorityLevels = {kPriorityLowQmRunningApps, kPriorityMediumQmRunningApps, kPriorityHighQmRunningApps};

        // Freeing up resources by stopping lower-priority apps
        for (const auto& priority : priorityLevels) {
            while (qm_usage_cpu > qm_allocated_cpu || qm_usage_memory > qm_allocated_memory) {
                cout<<"allocated memory" << qm_allocated_memory << endl ; 
                cout << "Checking priority level for partition " << priority << endl;
                DatabaseHandler::GetInstance().SaveData(lack_of_resources, "qm restricted to 40%");
                list<string> running_apps = DatabaseHandler::GetInstance().ReadListData(priority);
                cout<< "Running apps are "<< running_apps.size()<<endl;
                if (running_apps.empty()) break;
                string app_to_delete = running_apps.front();
                UserAppControlHandler::GetInstance().StopQmApp(app_to_delete);
                string log_message = "Stopped app: " + app_to_delete + " for restricting qm partition";
                // cout<< log_message << endl ;
                // if (global_log_message == "null") {
                //     global_log_message = log_message;  // Remove "null" and set the message
                // } else {
                //     global_log_message +=log_message + "\n" ;  // Append normally
                // }
                DatabaseHandler::GetInstance().AddData(resource_management_log, log_message);
                qm_usage_cpu = std::stoi(DatabaseHandler::GetInstance().ReadData(qm_resource_usage,"cpu").substr(0, DatabaseHandler::GetInstance().ReadData(qm_resource_usage, "cpu").size() - 1));
                qm_usage_memory = std::stoi(DatabaseHandler::GetInstance().ReadData(qm_resource_usage, "memory").substr(0, DatabaseHandler::GetInstance().ReadData(qm_resource_usage, "memory").size() - 2));
            }
        }
        
        DatabaseHandler::GetInstance().AddData(resource_management_log, "");

        int qm_available_cpu = qm_allocated_cpu - qm_usage_cpu;
        int qm_available_memory = qm_allocated_memory - qm_usage_memory;

        nlohmann::json qm_available = {
            {"cpu", std::to_string(qm_available_cpu) + "%"},
            {"memory", std::to_string(qm_available_memory) + "Mi"}
        };
        DatabaseHandler::GetInstance().SaveData(qm_available_resources, qm_available);
    } else if(mode == "park"){
        int qm_allocated_memory = 0.9 * initial_available_memory ;
        int qm_allocated_cpu = 0.9 * initial_available_cpu ;
        int qm_usage_cpu = std::stoi(DatabaseHandler::GetInstance().ReadData(qm_resource_usage,"cpu").substr(0, DatabaseHandler::GetInstance().ReadData(qm_resource_usage, "cpu").size() - 1));
        int qm_usage_memory = std::stoi(DatabaseHandler::GetInstance().ReadData(qm_resource_usage, "memory").substr(0, DatabaseHandler::GetInstance().ReadData(qm_resource_usage, "memory").size() - 2)); 
        int qm_available_cpu = qm_allocated_cpu - qm_usage_cpu;
        int qm_available_memory = qm_allocated_memory - qm_usage_memory;

        nlohmann::json qm_available = {
            {"cpu", std::to_string(qm_available_cpu) + "%"},
            {"memory", std::to_string(qm_available_memory) + "Mi"}
        };
        DatabaseHandler::GetInstance().SaveData(qm_available_resources, qm_available);
    }
}
