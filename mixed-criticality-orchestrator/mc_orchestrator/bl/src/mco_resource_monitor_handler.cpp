#include "inc/mco_resource_monitor_handler.hpp"

#include <ctime>
#include <cstdio>
#include <string>
#include <vector>
#include <thread>
#include <chrono>
#include <memory>
#include <fstream>
#include <numeric>
#include <sstream>
#include <iostream>
#include <algorithm>
#include <mosquittopp.h>
#include <nlohmann/json.hpp>
// #include <glog/logging.h>

#include "inc/mco_database_handler.hpp"
#include "inc/mco_command_factory.hpp"
#include "inc/mco_server_handler.hpp"
#include "inc/mco_mqtt_handler.hpp"
#include "inc/mco_k3s_commands.hpp"
#include "inc/mco_podman_commands.hpp"
#include "inc/mco_bluechi_commands.hpp"
#include "inc/mco_common.hpp"
#include "inc/mco_utils.hpp"

using namespace std;

ResourceMonitorHandler& ResourceMonitorHandler::GetInstance()
{
    static ResourceMonitorHandler self{};
    return self;
}

// Observer interface
class Observer {
public:
    virtual ~Observer() {}
    virtual void Update(int avg_cpuUtilization, int avg_memoryUtilization) = 0;
};

// Subject interface
class Subject {
public:
    virtual ~Subject() {}
    virtual void AddObserver(Observer* o) = 0;
    virtual void RemoveObserver(Observer* o) = 0;
    virtual void NotifyObservers() = 0;
};

// ResourceMonitor acts as the Subject
class ResourceMonitorSubject : public Subject {
private:
    vector<Observer*> observers;
    int avg_cpuUtilization;
    int avg_memoryUtilization;
    bool is_cpu_utilization_high;
    bool is_memory_utilization_high;
    bool is_cpu_utilization_below_pod_respawn_threshold;
    bool is_memory_utilization_below_pod_respawn_threshold;

    std::vector<std::string> topics = {kTopicCpuUtilization, kTopicMemoryUtilization};
    MqttHandler subscriber;    // Create a subscriber by creating MQTT handler and subscribe to topics
    
public:
    ResourceMonitorSubject() : subscriber("subscriber", this->topics) {}
    
    void AddObserver(Observer* o) override {
        observers.push_back(o);
    }

    void RemoveObserver(Observer* o) override {
        observers.erase(remove(observers.begin(), observers.end(), o), observers.end());
    }

    void NotifyObservers() override {
        for (Observer* o : observers) {
            o->Update(avg_cpuUtilization, avg_memoryUtilization);
        }
    }

    void GetResourceUtilization(vector<pair<float, float>>& resource_utilization) {
        // Call the mosquitto loop function to process incoming messages
        for (int j = 0; j < kMqttCommLoop; ++j) {
            subscriber.loop();
            std::this_thread::sleep_for(std::chrono::milliseconds(1));  // Sleep for 1ms for sunscription
            
            // Check if the subscriber has received the CPU and Memory utilization data
            auto cpu_it = subscriber.topic_data.find(kTopicCpuUtilization.c_str());
            auto mem_it = subscriber.topic_data.find(kTopicMemoryUtilization.c_str());

            if (cpu_it != subscriber.topic_data.end() && !cpu_it->second.empty() &&
                mem_it != subscriber.topic_data.end() && !mem_it->second.empty()) {
                resource_utilization.push_back(std::make_pair(std::stof(cpu_it->second), std::stof(mem_it->second)));
                break;
            }
        }
    }

    void AverageResourceUtilization() {        
        // Get resource monitor time interval and sample size from config file
        int sample_size = stoi(config_parameters["resource_monitor_sample_size"]);
        
        vector<float> cpu_utilization;
        vector<float> memory_utilization;
        vector<pair<float, float>> resource_utilization;
        
        while (resource_utilization.size() < sample_size+1) {
            GetResourceUtilization(resource_utilization);

            for (auto& utilization : resource_utilization) {
                cpu_utilization.push_back(utilization.first);
                memory_utilization.push_back(utilization.second);
            }

            // Calculate average resource utilization over a sample size
            if(sample_size == resource_utilization.size()){
                avg_cpuUtilization = 0;
                avg_memoryUtilization = 0;

                // Average CPU and memory utilization
                avg_cpuUtilization = accumulate(cpu_utilization.begin(), cpu_utilization.end(), 0.0)/cpu_utilization.size();
                avg_memoryUtilization = accumulate(memory_utilization.begin(), memory_utilization.end(), 0.0)/memory_utilization.size();

                // Store timestamp in database
                string time = GetCurrentTime();
                DatabaseHandler::GetInstance().AddData("timestamp", time);

                // Store average CPU and memory utilization in database
                DatabaseHandler::GetInstance().AddData("avg_cpu_utilization", to_string(avg_cpuUtilization));
                DatabaseHandler::GetInstance().AddData("avg_memory_utilization", to_string(avg_memoryUtilization));

                // // Save data to file
                // std::ofstream file;
                // file.open(kAllLogsFile.c_str(), std::ios_base::app);
                // // If the file was just created, write the header
                // if (file.tellp() == 0) {
                //     file << "time, avg_cpuUtilization, avg_memoryUtilization\n";
                // }
                // file << time << "," << avg_cpuUtilization << "," << avg_memoryUtilization << "\n";
                // file.close();

               cout << "Average CPU Utilization: " << avg_cpuUtilization << "%" << endl;
               cout << "Average Memory Utilization: " << avg_memoryUtilization << "%" << endl;
               cout << "Time: " << time << "millisec" << endl;
            }
        }
    }

    void Run() {
        while (true) {
            AverageResourceUtilization();
            NotifyObservers();
        }
    }    
};

// DeletePod acts as the Observer
class DeletePodObserver : public Observer {
private:
    int cpu_utilization_threshold = stoi(config_parameters["cpu_utilization_threshold"]);
    int memory_utilization_threshold = stoi(config_parameters["memory_utilization_threshold"]);

public:
    void Update(int avg_cpuUtilization, int avg_memoryUtilization) override {
        // Logic to check if the resource utilization is high
        if(avg_cpuUtilization >= cpu_utilization_threshold){
            cout << "CPU utilization is high" << endl;
            is_cpu_utilization_high = true;
        } else{
            cout<< "CPU utilization is low" << endl;
            is_cpu_utilization_high = false;
        }

        if(avg_memoryUtilization >= memory_utilization_threshold){
            cout << "Memory utilization is high" << endl;
            is_memory_utilization_high = true;
        } else{
            cout<< "Memory utilization is low" << endl;
            is_memory_utilization_high = false;
        }

        // Check if CPU and Memory utilization is below threshold
        if(is_cpu_utilization_high or is_memory_utilization_high){
            string msg = "Resource utilization is above threshold limit";
            cout << msg << endl;
          //  DeleteAllPods();    // Delete QM pod
        }
    }

    void DeleteAllPods() {
        // Logic to delete a pod
        list<string> running_apps = DatabaseHandler::GetInstance().ReadListData(kRunningApps);
        string container_runtime = config_parameters["container_runtime"];
        string msg = "";
        Invoker invoker;

        for (const auto& app : running_apps) {

            invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "DeletePod", app));
            if(!invoker.Invoke()) {
                msg = "Failed to delete pod";
                cout << msg << endl;
                return;
                // LOG(ERROR) << msg;
            }
        }
        msg = "All pods deleted successfully";
        cout << msg << endl;
        // LOG(INFO) << msg;
        UpdateEvent(msg);
    }
};

// Spawn acts as the Observer
class RespawnPodObserver : public Observer {
private:
    int pod_respawn_cpu_threshold = stoi(config_parameters["pod_respawn_cpu_threshold"]);
    int pod_respawn_memory_threshold = stoi(config_parameters["pod_respawn_memory_threshold"]);
    int respawn_counter = 0;

public:
    void Update(int avg_cpuUtilization, int avg_memoryUtilization) override {
        // Logic to check if the resource utilization is high
        if(avg_cpuUtilization < pod_respawn_cpu_threshold){
            cout << "CPU utilization is below threshold" << endl;
            is_cpu_utilization_below_pod_respawn_threshold = true;
        } else{
            cout<< "CPU utilization is above threshold" << endl;
            is_cpu_utilization_below_pod_respawn_threshold = false;
        }

        if(avg_memoryUtilization < pod_respawn_memory_threshold){
            cout << "Memory utilization is below threshold" << endl;
            is_memory_utilization_below_pod_respawn_threshold = true;
        } else{
            cout<< "Memory utilization is above threshold" << endl;
            is_memory_utilization_below_pod_respawn_threshold = false;
        }

        // Check if CPU and Memory utilization is below threshold
        if(!(is_cpu_utilization_high or is_memory_utilization_high)){
            // Check if pod is already running
            if(is_memory_utilization_below_pod_respawn_threshold and is_cpu_utilization_below_pod_respawn_threshold) {
                respawn_counter++;
                if(respawn_counter >= 20) {
                    string msg = "Respawnning QM pod as CPU and Memory utilization is below threshold";
                    cout << msg << endl;
                    respawn_counter = 0;
                    RespawnAllPods();
                }
            } else {
                respawn_counter = 0;
            }
        }
    }

    void RespawnAllPods() {
        // Save existing app name to the database
        ConfigHandler configHandler;
        configHandler.SaveAppNameToDatabase();

        // Call the execute method of ApplyPodCommand
        list<string> running_apps = DatabaseHandler::GetInstance().ReadListData(kRunningApps);
        string container_runtime = config_parameters["container_runtime"];
        string msg = "";
        Invoker invoker;

        for (const auto& app : running_apps) {

            invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "ApplyPod", app));
            
            if(!invoker.Invoke()) {
                msg = "Failed to spawn pod";
                cout << msg << endl;
                // LOG(ERROR) << msg;
                return;
            }
        }
        msg = "All pods respawnned successfully";
        cout << msg << endl;
        // LOG(INFO) << msg;
        UpdateEvent(msg);
    }
};

void ResourceMonitorHandler::Init(){
    // Initialize the mosquitto library
    mosqpp::lib_init(); 

    // Remove old file    
    if (remove(kAllLogsFile.c_str()) != 0) {
        perror("Error deleting file");
    } else {
        puts("File successfully deleted");
    }
    // Spawn all exisiting apps
    Invoker invoker;
    list<string> available_apps = DatabaseHandler::GetInstance().ReadListData(kRunningApps);
    string container_runtime = config_parameters["container_runtime"];

    for (const auto& app : available_apps) {
        invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "ApplyPod", app));
        
        if(!invoker.Invoke()) {
            string msg = "Failed to spawn pod";
            cout << msg << endl;
            // LOG(ERROR) << msg;
        }
    }
    string msg = "Spawnned all pods at start";
    cout << msg << endl;
    // LOG(INFO) << msg;
    UpdateEvent(msg);
    
    ResourceMonitorSubject resourceMonitorSubject;
    DeletePodObserver deletePodObserver;
    RespawnPodObserver respawnPodObserver;
    
    resourceMonitorSubject.AddObserver(&deletePodObserver);
    resourceMonitorSubject.AddObserver(&respawnPodObserver);

    resourceMonitorSubject.Run();
    mosqpp::lib_cleanup(); // Clean up the mosquitto library
}
