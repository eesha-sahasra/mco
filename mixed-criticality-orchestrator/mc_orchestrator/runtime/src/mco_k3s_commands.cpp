#include "inc/mco_k3s_commands.hpp"

#include <cstdlib>
#include <httplib.h>
#include <fstream>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <array>

// #include <glog/logging.h>
#include <nlohmann/json.hpp>
#include "inc/mco_database_handler.hpp"
#include "inc/mco_common.hpp"

using namespace std;
using json = nlohmann::json;

bool K3sAvailableCommand::Execute() const {
    // This method should contain the logic to check if k3s is running
    string command = kK3sGetNodes + kOutputFile;
    int response = system(command.c_str());

    if (response == kSuccess){
        // Load the JSON file
        ifstream text(kOutputFile);
        json j;
        text >> j;

        // Navigate to the "Ready" condition
        auto items = j["items"];
        for (const auto& item : items) {
            auto conditions = item["status"]["conditions"];
            for (const auto& condition : conditions) {
                if (condition["type"] == "Ready" and condition["reason"] == "KubeletReady" and condition["status"] == "True") {
                    string msg = "K3S is ready";
                    // LOG(INFO) << msg;
                    std::cout << msg << endl;
                    return true;
                }
            }
        }
    }
    return false;
}

K3sStarvePodCommand::K3sStarvePodCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool K3sStarvePodCommand::Execute() const {
    // This method should contain the logic to starve pod
    string database_app_name_value = this->app_name_;
    string database_cpu_limit_value = DatabaseHandler::GetInstance().ReadData(this->app_name_, kCpuLimit);
    string database_memory_limit_value = DatabaseHandler::GetInstance().ReadData(this->app_name_, kMemoryLimit);
    string database_cpu_request_value = DatabaseHandler::GetInstance().ReadData(this->app_name_, kCpuRequest);
    string database_memory_request_value = DatabaseHandler::GetInstance().ReadData(this->app_name_, kMemoryRequest);

    string command = "kubectl patch deployment " + database_app_name_value + " -p " + "'{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"" + database_app_name_value + "\",\"resources\":{\"limits\":{\"cpu\":\"" + database_cpu_limit_value + "\", \"memory\":\"" + database_memory_limit_value + "\"},\"requests\":{\"cpu\":\"" + database_cpu_request_value +"\", \"memory\":\"" + database_memory_request_value + "\"}}}]}}}}'";
    system(command.c_str());

    command = kK3sGetPods + kOutputFile;
    system(command.c_str());

    ifstream file(kOutputFile);

    // Parse the file into a json object
    json response_obj;
    file >> response_obj;

    for (const auto& item : response_obj["items"]) {
        string name = item["metadata"]["name"];
        if (name.rfind(this->app_name_, 0) == 0) {
            DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodName, name);
            DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodRunningStatus, "true");
        }
    }
    return true;
}

K3sGetPodNameCommand::K3sGetPodNameCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool K3sGetPodNameCommand::Execute() const {
    // This method should contain the logic to Get name of pod
    string command = kK3sGetPods + kOutputFile;
    system(command.c_str());

    ifstream file(kOutputFile);

    // Parse the file into a json object
    json response_obj;
    file >> response_obj;

    for (const auto& item : response_obj["items"]) {
        string name = item["metadata"]["name"];
        string status = item["status"]["phase"];
        if (name.rfind(this->app_name_, 0) == 0) {
            DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodName, name);
            DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodRunningStatus, "true");            
            return true;
        }
    }
    return false;
}

K3sApplyPodCommand::K3sApplyPodCommand(const string& app_name) {
    this->app_name_ = app_name;
}

// Concrete command class #1
bool K3sApplyPodCommand::Execute() const {
    // This method should contain the logic to create a new pod
    string command = kK3sApplyPods + DatabaseHandler::GetInstance().ReadData(this->app_name_, kYamlPath) + " -o json > " + kOutputFile;
    system(command.c_str());

    Invoker invoker;
    invoker.SetCommand(make_unique<K3sGetPodNameCommand>(this->app_name_));

    if(invoker.Invoke()){
        // Updating the list of running apps in the database
        DatabaseHandler::GetInstance().running_apps_.emplace(this->app_name_);
        DatabaseHandler::GetInstance().UpdateRunningApps(kRunningApps, DatabaseHandler::GetInstance().running_apps_);
        DatabaseHandler::GetInstance().deleted_apps_.erase(this->app_name_);
        DatabaseHandler::GetInstance().UpdateRunningApps(kDeletedApps, DatabaseHandler::GetInstance().deleted_apps_);

        string app_priority = DatabaseHandler::GetInstance().ReadData(this->app_name_, kAppPriority);
        if(app_priority == kHighPriority){
            DatabaseHandler::GetInstance().priority_high_apps_.emplace(this->app_name_);
            DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityHighApps, DatabaseHandler::GetInstance().priority_high_apps_);
        } else if(app_priority == kMediumPriority){
            DatabaseHandler::GetInstance().priority_medium_apps_.emplace(this->app_name_);
            DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityMediumApps, DatabaseHandler::GetInstance().priority_medium_apps_);
        } else if(app_priority == kLowPriority){
            DatabaseHandler::GetInstance().priority_low_apps_.emplace(this->app_name_);
            DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityLowApps, DatabaseHandler::GetInstance().priority_low_apps_);
        } else {}

        string msg = "Pod name is: " + DatabaseHandler::GetInstance().ReadData(this->app_name_, kPodName);
        // LOG(INFO) << msg;
        std::cout << msg << endl;

        return true;
    } else{
        string msg = "Failed to create pod";
        // LOG(ERROR) << msg;
        cout << msg << endl;
    }
    return true;
}

K3sDeletePodCommand::K3sDeletePodCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool K3sDeletePodCommand::Execute() const {
    // This method should contain the logic to delete a pod
    string command = kK3sDeletePods + DatabaseHandler::GetInstance().ReadData(this->app_name_, kYamlPath) + " --now=true";
    system(command.c_str());

    if(!DatabaseHandler::GetInstance().running_apps_.empty()) {
        // Updating the list of running apps and deleted apps in the database
        DatabaseHandler::GetInstance().running_apps_.erase(this->app_name_);
        DatabaseHandler::GetInstance().UpdateRunningApps(kRunningApps, DatabaseHandler::GetInstance().running_apps_);
        DatabaseHandler::GetInstance().deleted_apps_.emplace(this->app_name_);
        DatabaseHandler::GetInstance().UpdateRunningApps(kDeletedApps, DatabaseHandler::GetInstance().deleted_apps_);

        string app_priority = DatabaseHandler::GetInstance().ReadData(this->app_name_, kAppPriority);
        if(app_priority == kHighPriority){
            DatabaseHandler::GetInstance().priority_high_apps_.erase(this->app_name_);
            DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityHighApps, DatabaseHandler::GetInstance().priority_high_apps_);
        } else if(app_priority == kMediumPriority){
            DatabaseHandler::GetInstance().priority_medium_apps_.erase(this->app_name_);
            DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityMediumApps, DatabaseHandler::GetInstance().priority_medium_apps_);
        } else if(app_priority == kLowPriority){
            DatabaseHandler::GetInstance().priority_low_apps_.erase(this->app_name_);
            DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityLowApps, DatabaseHandler::GetInstance().priority_low_apps_);
        } else {}
    } else {
        string msg = "No running apps to delete";
        // LOG(INFO) << msg;
        std::cout << msg << endl;
    }

    DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodName, "");  // Reset the pod name
    DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodRunningStatus, "false"); // Reset the running status
    string msg = "Pod is successfully deleted";
    // LOG(INFO) << msg;
    std::cout << msg << endl;
    return true;
}

bool K3sApplyAndGetPodNameCommand::Execute() const {
    // // This method should contain the logic to create a new pod and get the name
    // Invoker invoker_1;
    // invoker_1.SetCommand(make_unique<ApplyPodCommand>());
    
    // Invoker invoker_2;
    // invoker_2.SetCommand(make_unique<GetPodNameCommand>());

    // if(invoker_1.invoke() && invoker_2.invoke()){
    //     return true;
    // } else{
    //     string msg = "Failed to create pod";
    //     // LOG(ERROR) << msg;
    // }
    return false;
}

K3sCheckPodStatusCommand::K3sCheckPodStatusCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool K3sCheckPodStatusCommand::Execute() const {
    // This method should contain the logic to check if pod name matches
    string command = kK3sGetPods + kOutputFile;
    system(command.c_str());

    ifstream file(kOutputFile);

    // Parse the file into a json object
    json response_obj;
    file >> response_obj;
    
    for (const auto& item : response_obj["items"]) {
        string name = item["metadata"]["name"];
        string status = item["status"]["phase"];
        if (name.find(this->app_name_) != string::npos) {  // Check pod status
            DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodStatus, status);
            return true;
        }
    }
    DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodStatus, "NULL");
    return false;
}

K3sPodUsageCommand::K3sPodUsageCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool K3sPodUsageCommand::Execute() const {
    // This method should contain the logic to get the usage of a pod
    string pod_name = DatabaseHandler::GetInstance().ReadData(this->app_name_, kPodName);
    string command = kK3sPodUsage + pod_name + " > " + kOutputFile;
    int response = system(command.c_str());
    
    if (response == kSuccess){
        string msg = "Pod usage details have been generated";
        // LOG(INFO) << msg;
        cout << msg << endl;
        ifstream file(kOutputFile);

        string line;
        getline(file, line);  // Skip the header line

        while (getline(file, line)) {
            istringstream iss(line);
            string name, cpu, memory;

            iss >> name >> cpu >> memory;
            current_cpu = cpu;
            current_memory = memory;
        }
        msg = "Pod name: " + pod_name + " CPU: " + current_cpu + " Memory: " + current_memory;
        // LOG(INFO) << msg;
        cout << msg << endl;
        DatabaseHandler::GetInstance().AddData("cache", msg);
        return true;
    } else {
        string msg = "Failed to generate pod usage details";
        // LOG(ERROR) << msg;
        cout << msg << endl;
        DatabaseHandler::GetInstance().AddData("cache", msg);
        return false;
    }
}
