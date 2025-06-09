#include "inc/mco_podman_commands.hpp"

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

bool PodmanAvailableCommand::Execute() const {
    cout << "Podman is running" << endl;
    return true; 
}

PodmanStarvePodCommand::PodmanStarvePodCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool PodmanStarvePodCommand::Execute() const {
    cout << "Podman has starved the pods" << endl;
    return true;
}

PodmanGetPodNameCommand::PodmanGetPodNameCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool PodmanGetPodNameCommand::Execute() const {
    // This method should contain the logic to Get name of pod
    string command = kPodmanGetPods + kOutputFile;
    system(command.c_str());

    ifstream file(kOutputFile);
    json response_obj;
    file >> response_obj;

    for (const auto& pod : response_obj) {
        string name = pod["Name"];
        string status = pod["Status"];

        cout<< "Name of pod is : " << name <<endl;
        cout<< "Status of pod is : " << status <<endl;
        cout << "The value of app_name_ is: " << app_name_ << endl;
        
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

  //  cout << "Podman has saved the pod names" << endl;
  //  return true;
}

PodmanApplyPodCommand::PodmanApplyPodCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool PodmanApplyPodCommand::Execute() const {
    string pod_definition = DatabaseHandler::GetInstance().ReadData(this->app_name_, kYamlPath);
    string command = kPodmanApplyPods + pod_definition + " > " + kOutputFile;
    
    // Execute the command using system()
    system(command.c_str()); 

    Invoker invoker;
    invoker.SetCommand(make_unique<PodmanGetPodNameCommand>(this->app_name_));

    if (invoker.Invoke()) {
            // Updating the list of running apps in the database
            DatabaseHandler::GetInstance().running_apps_.emplace(this->app_name_);
            DatabaseHandler::GetInstance().UpdateRunningApps(kRunningApps, DatabaseHandler::GetInstance().running_apps_);
            DatabaseHandler::GetInstance().deleted_apps_.erase(this->app_name_);
            DatabaseHandler::GetInstance().UpdateRunningApps(kDeletedApps, DatabaseHandler::GetInstance().deleted_apps_);

            // Handling app priority updates
            string app_priority = DatabaseHandler::GetInstance().ReadData(this->app_name_, kAppPriority);
            if (app_priority == kHighPriority) {
                DatabaseHandler::GetInstance().priority_high_apps_.emplace(this->app_name_);
                DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityHighApps, DatabaseHandler::GetInstance().priority_high_apps_);
            } else if (app_priority == kMediumPriority) {
                DatabaseHandler::GetInstance().priority_medium_apps_.emplace(this->app_name_);
                DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityMediumApps, DatabaseHandler::GetInstance().priority_medium_apps_);
            } else if (app_priority == kLowPriority) {
                DatabaseHandler::GetInstance().priority_low_apps_.emplace(this->app_name_);
                DatabaseHandler::GetInstance().UpdateRunningApps(kPriorityLowApps, DatabaseHandler::GetInstance().priority_low_apps_);
            } else {}

        string msg = "Pod name is: " + DatabaseHandler::GetInstance().ReadData(this->app_name_, kPodName);
        // LOG(INFO) << msg;
        cout << msg << endl;
        return true;
    } 
    else {
        string msg = "Failed to create pod";
        // LOG(ERROR) << msg;
        cout << msg << endl;
       }
    return true;
}

PodmanDeletePodCommand::PodmanDeletePodCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool PodmanDeletePodCommand::Execute() const {

    // This method should contain the logic to delete a pod
    string command = kPodmanDeletePods + DatabaseHandler::GetInstance().ReadData(this->app_name_, kPodName) ;
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
        cout << msg << endl;
    }

    DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodName, "");  // Reset the pod name
    DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodRunningStatus, "false"); // Reset the running status
    string msg = "Pod is successfully deleted";
    // LOG(INFO) << msg;
    cout << msg << endl;
    return true;

   cout << "Podman has deleted the pods" << endl;
   return true;

}

bool PodmanApplyAndGetPodNameCommand::Execute() const {
    // // This method should contain the logic to create a new pod and get the name
    // Invoker invoker_1;
    // invoker_1.SetCommand(make_unique<PodmanApplyPodCommand>());
    
    // Invoker invoker_2;
    // invoker_2.SetCommand(make_unique<PodmanGetPodNameCommand>());

    // if(invoker_1.invoke() && invoker_2.invoke()){
    //     return true;
    // } else{
    //     string msg = "Failed to create pod";
    //     // LOG(ERROR) << msg;
    // }
    return true;
}

PodmanCheckPodStatusCommand::PodmanCheckPodStatusCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool PodmanCheckPodStatusCommand::Execute() const {
    // This method should contain the logic to check if pod name matches
    string command = kPodmanGetPods + kOutputFile;
    system(command.c_str());

    ifstream file(kOutputFile);

    // Parse the file into a json object
    json response_obj;
    file >> response_obj;
    
    for (const auto& item : response_obj) {
        string name = item["Name"];  
        string status = item["Status"]; 
        
        // Check if the pod name contains the app_name_
        if (name.find(this->app_name_) != string::npos) {
            DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodStatus, status);
            return true;
        }
    }

    // If no matching pod was found, set the status to "NULL"
    DatabaseHandler::GetInstance().ModifyValue(this->app_name_, kPodStatus, "NULL");
    return false;
}
  //  cout << "Podman has checked the pod status" << endl;
  //  return true;
//}

PodmanPodUsageCommand::PodmanPodUsageCommand(const string& app_name) {
    this->app_name_ = app_name;
}

bool PodmanPodUsageCommand::Execute() const {
    // Get pod name from the database
    // Get pod name from the database
    string pod_name = DatabaseHandler::GetInstance().ReadData(this->app_name_, kPodName);
    //cout << "POD NAME"<< pod_name;

    // Using jq to filter pod stats for the specific pod and output in a readable format
    string command = kPodmanPodUsage + "| jq -c '.[] | select(.Name == \"" + pod_name + "-"+ app_name_ +"\")' > " + kOutputFile;
   // string command = "podman pod stats --no-stream --format json | jq '.[] | select(.Name == \"app4-pod-0-app4\")' > " + kOutputFile;

    int response = system(command.c_str());
    if (response == kSuccess) {
        string msg = "Pod usage details have been generated";
        cout << msg << endl;

        // Open the file and read the filtered JSON output
        ifstream file(kOutputFile);
        
        // Read the entire file into a string
        string json_str((istreambuf_iterator<char>(file)), istreambuf_iterator<char>());
        file.close();

        json pod_info;
        // Parse the content as JSON
        try {
            pod_info = json::parse(json_str); // Parse the JSON data directly from the string
        } catch (const json::parse_error& e) {
            cerr << "Error parsing JSON: " << e.what() << endl;
            return false;
        }

        if (!pod_info.is_null()) {
            string cpu = pod_info["CPU"];
            string memory = pod_info["MemUsage"];

            msg = "Pod name: " + pod_name + " CPU: " + cpu + " Memory: " + memory;
            cout << msg << endl;
            DatabaseHandler::GetInstance().AddData("cache", msg); 
            return true;
        } else {
            msg = "Pod name not found in usage details";
            cout << msg << endl;
            DatabaseHandler::GetInstance().AddData("cache", msg); 
            return false;
        }
    } else {
        string msg = "Failed to generate pod usage details";
        cout << msg << endl;
        DatabaseHandler::GetInstance().AddData("cache", msg); 
        return false;
    }
}
