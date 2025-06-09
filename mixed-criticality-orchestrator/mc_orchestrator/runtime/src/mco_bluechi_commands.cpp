
#include "inc/mco_bluechi_commands.hpp"

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

bool BluechiAvailableCommand::Execute() const {
    string command = kBluechiGetNodes + kOutputFile;
    int response = system(command.c_str());

    if (response != kSuccess) {
        cerr << "Failed to execute bluechictl command." << endl;
        return false;
    }

    // Open the file and parse the contents
    ifstream file(kOutputFile);
    if (!file.is_open()) {
        cerr << "Could not open the file: " << endl;
        return false;
    }

    string line;
    getline(file, line); // skip first line
    getline(file, line); // skip separator line

    // Check each line for an "online" status
    while (getline(file, line)) {
        istringstream stream(line);
        string node, state, ip, lastSeen;

        // Parse the fields from each line
        if (stream >> node >> state >> ip >> lastSeen) {
            if (state == "online") {
                cout << "BlueChi is running" << endl;
                return true;
            }
        }
    }

    cout << "No BlueChi nodes are online" << endl;
    return false; 
}

BluechiStarveUnitCommand::BluechiStarveUnitCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool BluechiStarveUnitCommand::Execute() const {
    cout << "Bluechi has starved the pods" << endl;
    return true;
}

BluechiGetUnitNameCommand::BluechiGetUnitNameCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool BluechiGetUnitNameCommand::Execute() const {
    string command = kBluechiGetPods  + kOutputFile;
    system(command.c_str());

    ifstream file(kOutputFile);
    json response_obj;
    file >> response_obj;

    for (const auto& pod : response_obj) {
        string name = pod["Names"][0];
        string status = pod["State"];

        //cout<< "Name of pod is : " << name <<endl;
        //cout<< "Status of pod is : " << status <<endl;
        //cout << "The value of app_name_ is: " << app_name_ << endl;
        
        if (name.rfind(app_name_, 0) == 0) {
            // Update the database with the pod name and status
            DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodName, name);
            DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodRunningStatus, "true");
            return true;
        }
    }
    // If no matching pod is found, return false
    cerr << "Pod matching app name not found." << endl;
    return false;

   // cout << "Bluechi has saved the pod names" << endl;
   // return true;
}

BluechiStartAsilUnitCommand::BluechiStartAsilUnitCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool BluechiStartAsilUnitCommand::Execute() const {
    string container_path = DatabaseHandler::GetInstance().ReadData(asil, this->app_name_, kYamlPath);
    //string container_path = DatabaseHandler::GetInstance().ReadData(this->app_name_, kYamlPath);
    //cout<<container_path<<endl;

    string dest_path = kAsilSystemdPath + container_path.substr(container_path.find_last_of("/\\") + 1);

    cout << "Copying file to: " << dest_path << endl;

    // Using system command to copy the file
    string copy_command = "sudo cp " + container_path + " " + dest_path;
    int result = system(copy_command.c_str());
    
    if (result != kSuccess) {
        cerr << "Failed to copy the file." << endl;
        return 1;
    }
    
    // Reload systemd daemon
    string command = kBluechiGenerateServiceFile + kAsilNodeName;
    result = system(command.c_str());
    if (result != kSuccess) {
        cerr << "Failed to reload systemd daemon." << endl;
        return 1;
    }

    // Start the service (assuming service file name is the same as the container file)
    string service_file = app_name_ + ".service";
    cout << service_file << endl;
    string start_service_cmd = kBluechiApplyPods + kAsilNodeName + " " + service_file;
    
    // Start the service
    result = system(start_service_cmd.c_str());
    if (result != kSuccess) {
        cerr << "Failed to start the service." << endl;
        return 1;      
    }

    DatabaseHandler::GetInstance().asil_b_running_apps_.emplace(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kAsilRunningApps, DatabaseHandler::GetInstance().asil_b_running_apps_);

    DatabaseHandler::GetInstance().asil_b_stopped_apps_.erase(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kAsilStoppedApps, DatabaseHandler::GetInstance().asil_b_stopped_apps_);

    return true;
}

BluechiStopAsilUnitCommand::BluechiStopAsilUnitCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool BluechiStopAsilUnitCommand::Execute() const {

    // string pod_name = DatabaseHandler::GetInstance().ReadData(this->app_name_, kPodName);
    // cout << "POD IS " << pod_name << endl;
    string command = kBluechiDeletePods + kAsilNodeName + " " + this->app_name_ + ".service";
    system(command.c_str());
    
    if (!DatabaseHandler::GetInstance().asil_b_running_apps_.empty()) {
    DatabaseHandler::GetInstance().asil_b_running_apps_.erase(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kAsilRunningApps, DatabaseHandler::GetInstance().asil_b_running_apps_);

    DatabaseHandler::GetInstance().asil_b_stopped_apps_.emplace(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kAsilStoppedApps, DatabaseHandler::GetInstance().asil_b_stopped_apps_);
    } else {
        string msg = "No running services to stop";
        // LOG(INFO) << msg;
        cout << msg << endl;
    }

    // if (!DatabaseHandler::GetInstance().running_apps_.empty()) {
    //   //   Updating the list of running apps and deleted apps in the database
    //     DatabaseHandler::GetInstance().running_apps_.erase(this->app_name_);
    //     DatabaseHandler::GetInstance().UpdateRunningApps(kRunningApps, DatabaseHandler::GetInstance().running_apps_);
    //     DatabaseHandler::GetInstance().deleted_apps_.emplace(this->app_name_);
    //     DatabaseHandler::GetInstance().UpdateRunningApps(kDeletedApps, DatabaseHandler::GetInstance().deleted_apps_);

    //     string app_priority = DatabaseHandler::GetInstance().ReadData(this->app_name_, kAppPriority);
    //     if(app_priority == kHighPriority){
    //         DatabaseHandler::GetInstance().priority_high_apps_.erase(this->app_name_);
    //         DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityHighApps, DatabaseHandler::GetInstance().priority_high_apps_);
    //     } else if(app_priority == kMediumPriority){
    //         DatabaseHandler::GetInstance().priority_medium_apps_.erase(this->app_name_);
    //         DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityMediumApps, DatabaseHandler::GetInstance().priority_medium_apps_);
    //     } else if(app_priority == kLowPriority){
    //         DatabaseHandler::GetInstance().priority_low_apps_.erase(this->app_name_);
    //         DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityLowApps, DatabaseHandler::GetInstance().priority_low_apps_);
    //     } else {}
    // } else {
    //     string msg = "No running services to stop";
    //     // LOG(INFO) << msg;
    //     cout << msg << endl;
    // }
    
    // DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodName, "");  // Reset the pod name
    // DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodRunningStatus, "false");  // Reset the running status
    // string msg = "Service is successfully stopped";
    // // LOG(INFO) << msg;
    // cout << msg << endl;
    return true;

}

BluechiStartQmUnitCommand::BluechiStartQmUnitCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool BluechiStartQmUnitCommand::Execute() const {
    string container_path = DatabaseHandler::GetInstance().ReadData(infotainment, this->app_name_, kYamlPath);
    string category = DatabaseHandler::GetInstance().ReadData(infotainment, this->app_name_, kCategory);

    //string container_path = DatabaseHandler::GetInstance().ReadData(this->app_name_, kYamlPath);
    // cout<<container_path<<endl;

    string dest_path = kQmSystemdPath + container_path.substr(container_path.find_last_of("/\\") + 1);

    cout << "Copying file to: " << dest_path << endl;

    // Using system command to copy the file
    string copy_command = "sudo cp " + container_path + " " + dest_path;
    int result = system(copy_command.c_str());
    
    if (result != kSuccess) {
        cerr << "Failed to copy the file." << endl;
        return 1;
    }
    
    // Reload systemd daemon
    string command = kBluechiGenerateServiceFile + kQmNodeName;
    result = system(command.c_str());
    if (result != kSuccess) {
        cerr << "Failed to reload systemd daemon." << endl;
        return 1;
    }

    // Start the service (assuming service file name is the same as the container file)
    string service_file = app_name_ + ".service";
    cout << service_file << endl;
    string start_service_cmd = kBluechiApplyPods + kQmNodeName + " " + service_file;
    
    // Start the service
    result = system(start_service_cmd.c_str());
    if (result != kSuccess) {
        cerr << "Failed to start the service." << endl;
        return 1;      
    }
    if(category == "games"){
    DatabaseHandler::GetInstance().qm_infotainment_games_stopped_apps_.erase(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kQmInfoGamesStoppedApps, DatabaseHandler::GetInstance().qm_infotainment_games_stopped_apps_);

    DatabaseHandler::GetInstance().qm_infotainment_games_running_apps_.emplace(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kQmInfoGamesRunningApps, DatabaseHandler::GetInstance().qm_infotainment_games_running_apps_);
    } else if(category == "ott"){
    DatabaseHandler::GetInstance().qm_infotainment_ott_stopped_apps_.erase(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kQmInfoOttStoppedApps, DatabaseHandler::GetInstance().qm_infotainment_ott_stopped_apps_);

    DatabaseHandler::GetInstance().qm_infotainment_ott_running_apps_.emplace(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kQmInfoOttRunningApps, DatabaseHandler::GetInstance().qm_infotainment_ott_running_apps_);
    } else {}

    string priority = DatabaseHandler::GetInstance().ReadData(infotainment, this->app_name_, kAppPriority);
    if(priority == "high"){
        DatabaseHandler::GetInstance().priority_high_qm_running_apps_.emplace(this->app_name_);
        DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityHighQmRunningApps, DatabaseHandler::GetInstance().priority_high_qm_running_apps_);
    } else if(priority == "medium"){
        DatabaseHandler::GetInstance().priority_medium_qm_running_apps_.emplace(this->app_name_);
        DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityMediumQmRunningApps, DatabaseHandler::GetInstance().priority_medium_qm_running_apps_);
    } else if(priority == "low"){
        DatabaseHandler::GetInstance().priority_low_qm_running_apps_.emplace(this->app_name_);
        DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityLowQmRunningApps, DatabaseHandler::GetInstance().priority_low_qm_running_apps_);
    } else {}

    // DatabaseHandler::GetInstance().asil_b_running_apps_.emplace(this->app_name_);
    // DatabaseHandler::GetInstance().UpdateRunningApps(kAsilRunningApps, DatabaseHandler::GetInstance().asil_b_running_apps_);

    return true;
}

BluechiStopQmUnitCommand::BluechiStopQmUnitCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool BluechiStopQmUnitCommand::Execute() const {

    // string pod_name = DatabaseHandler::GetInstance().ReadData(this->app_name_, kPodName);
    // cout << "POD IS " << pod_name << endl;
    string command = kBluechiDeletePods + kQmNodeName + " " + this->app_name_ + ".service";
    system(command.c_str());

    // if (!DatabaseHandler::GetInstance().running_apps_.empty()) {
    //   //   Updating the list of running apps and deleted apps in the database
    //     DatabaseHandler::GetInstance().running_apps_.erase(this->app_name_);
    //     DatabaseHandler::GetInstance().UpdateRunningApps(kRunningApps, DatabaseHandler::GetInstance().running_apps_);
    //     DatabaseHandler::GetInstance().deleted_apps_.emplace(this->app_name_);
    //     DatabaseHandler::GetInstance().UpdateRunningApps(kDeletedApps, DatabaseHandler::GetInstance().deleted_apps_);

    //     string app_priority = DatabaseHandler::GetInstance().ReadData(this->app_name_, kAppPriority);
    //     if(app_priority == kHighPriority){
    //         DatabaseHandler::GetInstance().priority_high_apps_.erase(this->app_name_);
    //         DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityHighApps, DatabaseHandler::GetInstance().priority_high_apps_);
    //     } else if(app_priority == kMediumPriority){
    //         DatabaseHandler::GetInstance().priority_medium_apps_.erase(this->app_name_);
    //         DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityMediumApps, DatabaseHandler::GetInstance().priority_medium_apps_);
    //     } else if(app_priority == kLowPriority){
    //         DatabaseHandler::GetInstance().priority_low_apps_.erase(this->app_name_);
    //         DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityLowApps, DatabaseHandler::GetInstance().priority_low_apps_);
    //     } else {}
    // } else {
    //     string msg = "No running services to stop";
    //     // LOG(INFO) << msg;
    //     cout << msg << endl;
    // }
    
    // DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodName, "");  // Reset the pod name
    // DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodRunningStatus, "false");  // Reset the running status
    // string msg = "Service is successfully stopped";
    // // LOG(INFO) << msg;
    // cout << msg << endl;
    string category = DatabaseHandler::GetInstance().ReadData(infotainment, this->app_name_, kCategory);
    if(category == "games"){
    DatabaseHandler::GetInstance().qm_infotainment_games_running_apps_.erase(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kQmInfoGamesRunningApps, DatabaseHandler::GetInstance().qm_infotainment_games_running_apps_);

    DatabaseHandler::GetInstance().qm_infotainment_games_stopped_apps_.emplace(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kQmInfoGamesStoppedApps, DatabaseHandler::GetInstance().qm_infotainment_games_stopped_apps_);
    } else if(category == "ott"){
    DatabaseHandler::GetInstance().qm_infotainment_ott_running_apps_.erase(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kQmInfoOttRunningApps, DatabaseHandler::GetInstance().qm_infotainment_ott_running_apps_);
    DatabaseHandler::GetInstance().qm_infotainment_ott_stopped_apps_.emplace(this->app_name_);
    DatabaseHandler::GetInstance().UpdateRunningApps(kQmInfoOttStoppedApps, DatabaseHandler::GetInstance().qm_infotainment_ott_stopped_apps_);
    } else {}

    string priority = DatabaseHandler::GetInstance().ReadData(infotainment, this->app_name_, "priority");
    
    if(priority == "high"){
        DatabaseHandler::GetInstance().priority_high_qm_running_apps_.erase(this->app_name_);
        DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityHighQmRunningApps, DatabaseHandler::GetInstance().priority_high_qm_running_apps_);
    } else if(priority == "medium"){
        DatabaseHandler::GetInstance().priority_medium_qm_running_apps_.erase(this->app_name_);
        DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityMediumQmRunningApps, DatabaseHandler::GetInstance().priority_medium_qm_running_apps_);
    } else if(priority == "low"){
        DatabaseHandler::GetInstance().priority_low_qm_running_apps_.erase(this->app_name_);
        DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityLowQmRunningApps, DatabaseHandler::GetInstance().priority_low_qm_running_apps_);
    } else {}

    return true;

}

bool BluechiStartAndGetUnitNameCommand::Execute() const {
    // // This method should contain the logic to create a new pod and get the name
    // Invoker invoker_1;
    // invoker_1.SetCommand(make_unique<BluechiStartUnitCommand>());
    
    // Invoker invoker_2;
    // invoker_2.SetCommand(make_unique<BluechiGetUnitNameCommand>());

    // if(invoker_1.invoke() && invoker_2.invoke()){
    //     return true;
    // } else{
    //     string msg = "Failed to create pod";
    //     // LOG(ERROR) << msg;
    // }
    return true;
}

BluechiCheckUnitStatusCommand::BluechiCheckUnitStatusCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool BluechiCheckUnitStatusCommand::Execute() const {

    string command = kBluechiGetPods + kOutputFile;
    system(command.c_str());

    ifstream file(kOutputFile);
    json response_obj;
    file >> response_obj;

    for (const auto& pod : response_obj) {
        string name = pod["Names"][0];
        string status = pod["State"];

        if (name.find(this->app_name_) != string::npos) {  
            DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodStatus, status);
            return true;
        }
    }
    // If no matching pod was found, set the status to "NULL"
    DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodStatus, "NULL");   
    return false;

}
  
BluechiUnitUsageCommand::BluechiUnitUsageCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool BluechiUnitUsageCommand::Execute() const {
   //string pod_name = DatabaseHandler::GetInstance().ReadData(this->app_name_, kPodName);
   static int accumulated_memory = 0;

   string pod_name = this->app_name_;
   string command = kBluechiAsilPodUsage + pod_name + " > " + kOutputFile; 
   int response = system(command.c_str());
   if (response == kSuccess) {
       string msg = "Pod usage details have been generated";
       cout << msg << endl;
    
       ifstream file(kOutputFile);
       string line;

       if (getline(file, line)) {
            istringstream iss(line);
            string name, cpu, memory, temp;

            iss >> name >> cpu >> memory;  // Extract the first 3 fields (name, CPU, memory usage)

            // Combine memory usage if it includes `/`
            while (iss >> temp) {
                memory += " " + temp;
            }

            msg = "Pod name: " + name + " CPU: " + cpu + " Memory: " + memory;
            cout << msg << endl;    

            // Remove "MB" from the memory value and convert to integer
            int memory_value = 0;
            if (memory.find("MB") != string::npos) {
                memory_value = stoi(memory.substr(0, memory.size() - 2)); // Extract only used memory
            }

            accumulated_memory += memory_value; // Accumulate memory usage

            cout << "Accumulated Memory: " << accumulated_memory << " MB" << endl;

            nlohmann::json resourcesUsage = {
                {"cpu", "0%"},
                {"memory", std::to_string(accumulated_memory) + "Mi"}
            };
            DatabaseHandler::GetInstance().SaveData(asil_resource_usage, resourcesUsage);


            DatabaseHandler::GetInstance().AddData("cache", msg);
            return true;
         } else {
            string msg = "Failed to read the pod usage file";
            cout << msg << endl;
            DatabaseHandler::GetInstance().AddData("cache", msg);
            return false; // File read failure
        }
   } else {
    string msg = "Failed to generate pod usage details";
    cout << msg << endl;
    DatabaseHandler::GetInstance().AddData("cache", msg);
    return false;
   }

}
