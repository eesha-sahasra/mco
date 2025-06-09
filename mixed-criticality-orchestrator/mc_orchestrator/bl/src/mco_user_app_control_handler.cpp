#include "inc/mco_user_app_control_handler.hpp"

#include <ctime>
#include <cstdio>
#include <cstdlib>
#include <string>
#include <vector>
#include <memory>
#include <fstream>
#include <numeric>
#include <sstream>
#include <iostream>
#include <algorithm>
#include <nlohmann/json.hpp>
// #include <glog/logging.h>

#include "inc/mco_database_handler.hpp"
#include "inc/mco_command_factory.hpp"
#include "inc/mco_bluechi_commands.hpp"
#include "inc/mco_utils.hpp"
#include "inc/mco_common.hpp"

using namespace std;
using json = nlohmann::json;

UserAppControlHandler& UserAppControlHandler::GetInstance()
{
    static UserAppControlHandler self{};
    return self;
}

void UserAppControlHandler::Init()
{
    while (true){
        string data = DatabaseHandler::GetInstance().ReadStringData(infotainment_selection);
        if(!data.empty()){
            try {
                json jsonObject = json::parse(data);
                std::string action = jsonObject.value("action", "");
                std::string app = jsonObject.value("app", "");

                if(action == "play"){
                        if (PlayQmApp(app)) {
                            cout << "Successfully played QM App: " << app << endl;
                        } else {
                            cout << "Failed to play QM App: " << app << endl;
                        }
                } else if(action == "stop"){
                    if (StopQmApp(app)) {
                        cout << "Successfully stopped QM App: " << app << endl;
                    } else {
                        cout << "Failed to stop QM App: " << app << endl;
                    }
                }
            } catch (const json::parse_error& e) {
                cout << "JSON parse error: " << e.what() << endl;
            } catch (const json::type_error& e) {
                cout << "JSON type error: " << e.what() << endl;
            } catch (const std::exception& e) {
                cout << "Error: " << e.what() << endl;
            }
        }
        std::this_thread::sleep_for(std::chrono::seconds(1));
  		  
        data = DatabaseHandler::GetInstance().ReadStringData(vehiclestate_selection);
        if(!data.empty()){
            try {
                json jsonObject = json::parse(data);
                std::string action = jsonObject.value("action", "");
                std::string app = jsonObject.value("app", "");

                if(action == "play"){
                    if (PlayAsilApp(app)) {
                        cout << "Successfully started ASIL App: " << app << endl;
                    } else {
                        cout << "Failed to start ASIL App: " << app << endl;
                    }
                } else if(action == "stop"){
                    if (StopAsilApp(app)) {
                        cout << "Successfully stopped ASIL App: " << app << endl;
                    } else {
                        cout << "Failed to stop ASIL App: " << app << endl;
                    }
                }
            } catch (const json::parse_error& e) {
                cout << "JSON parse error: " << e.what() << endl;
            } catch (const json::type_error& e) {
                cout << "JSON type error: " << e.what() << endl;
            } catch (const std::exception& e) {
                cout << "Error: " << e.what() << endl;
            }
        }

        // Monitor vehicle mode
        data = DatabaseHandler::GetInstance().ReadStringData(vehicle_drive_mode);
        if(data == "drive"){
                cout << "Vehicle mode is : " << data << endl;
                allocateQmResources(QM_ALLOCATION_DRIVE_STATE);
                update_qm_available_resource(data);

                //stop all running asil apps to stop rear camera
                list<string> running_apps = DatabaseHandler::GetInstance().ReadListData(kAsilRunningApps);
                for (const auto& app : running_apps) {
                    if(StopAsilApp(app)){
                        cout << "Successfully stopped ASIL App" << endl;
                    } else {
                        cout << "Failed to stop ASIL Apps" << endl;
                    }
                }
                //play driving asil apps
                list<string> available_apps = DatabaseHandler::GetInstance().ReadListData(kAsilBAvailableApps);
                for (const auto& app : available_apps) {
                    if (app == "rearcamera") {
                        continue; // Skip the rearcamera app
                    }

                    if(PlayAsilApp(app)){
                        cout << "Successfully started ASIL App" << endl;
                    } else {
                        cout << "Failed to start ASIL Apps" << endl;
                    }
                }
                // DatabaseHandler::GetInstance().AddData(resource_management_log, global_log_message);
                // usleep(2000000);
                // DatabaseHandler::GetInstance().AddData(resource_management_log, "");

                json jsonObject= json::object();
                DatabaseHandler::GetInstance().SaveData(vehicle_drive_mode, jsonObject);
        } else if(data == "park"){
                cout << "Vehicle mode is : " << data << endl;
                allocateQmResources(QM_ALLOCATION_PARK_STATE);

                update_qm_available_resource(data) ;
                list<string> running_apps = DatabaseHandler::GetInstance().ReadListData(kAsilRunningApps);
                for (const auto& app : running_apps) {
                    if(StopAsilApp(app)){
                        cout << "Successfully stopped ASIL App" << endl;
                    } else {
                        cout << "Failed to stop ASIL Apps" << endl;
                    }
                }
                json jsonObject= json::object();
                DatabaseHandler::GetInstance().SaveData(vehicle_drive_mode, jsonObject);
        } else if(data == "reverse"){
            cout << "Vehicle mode is : " << data << endl;

            allocateQmResources(QM_ALLOCATION_DRIVE_STATE);
            update_qm_available_resource(data);
            
            //Stop all running apps
            list<string> running_apps = DatabaseHandler::GetInstance().ReadListData(kAsilRunningApps);
            for (const auto& app : running_apps) {
                if(StopAsilApp(app)){
                    cout << "Successfully stopped ASIL App" << endl;
                } else {
                    cout << "Failed to stop ASIL Apps" << endl;
                }
            }

             // Start the rearcamera app
            string rearcamera_app = "rearcamera";
            if (PlayAsilApp(rearcamera_app) ) {
                cout << "Successfully started Rear Camera App" << endl;
            } else {
                cout << "Failed to start Rear Camera App" << endl;
            }
            json jsonObject= json::object();
            DatabaseHandler::GetInstance().SaveData(vehicle_drive_mode, jsonObject);
    }
        
    }
}



// Play QM App selected by User from Infotainment UI
bool UserAppControlHandler::PlayQmApp(const std::string& app)
{   
    if(checkResourceAvailability("infotainment", app)){
        Invoker invoker;
        string container_runtime = config_parameters["container_runtime"];
        invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "ApplyQmPod", app));
    
        // Invoke the command and check if it was successful
        if (!invoker.Invoke()) {
            string msg = "Failed to create pod for app: " + app;
            cout << msg << endl;
            // LOG(ERROR) << msg;
            return false;
        }
        cout << "QM Pod created successfully for app: " << app << endl;
        json jsonObject= json::object();
    
        DatabaseHandler::GetInstance().SaveData(infotainment_selection, jsonObject);

        // Deduct the required resources from the available resources
        updateResources("infotainment", app, false);

        // DatabaseHandler::GetInstance().qm_infotainment_games_running_apps_.emplace(app);
        // DatabaseHandler::GetInstance().UpdateRunningApps(kQmInfoGamesRunningApps, DatabaseHandler::GetInstance().qm_infotainment_games_running_apps_);
        
        return true;
    } else {
        cout << "Insufficient resources to run the app: " << app << endl;
        //DatabaseHandler::GetInstance().AddData(lack_of_resources, app);
        json jsonObject= json::object();
        DatabaseHandler::GetInstance().SaveData(infotainment_selection, jsonObject);
        return false;
    }

}

// Stop QM App selected by User from Infotainment UI
bool UserAppControlHandler::StopQmApp(const std::string& app)
{
    Invoker invoker;
    string container_runtime = config_parameters["container_runtime"];
    invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "DeleteQmPod", app));
    
    // Invoke the command and check if it was successful
    if (!invoker.Invoke()) {
        string msg = "Failed to create pod for app: " + app;
        cout << msg << endl;
        // LOG(ERROR) << msg;
        return false;
    }
    cout << "QM Pod successfully deleted: " << app << endl;
    json jsonObject= json::object();

    DatabaseHandler::GetInstance().SaveData(infotainment_selection, jsonObject);

    //Add the stopped resources in the available resources
    updateResources("infotainment", app, true);

    return true;
}

// Play ASIL App selected by User from VS UI
bool UserAppControlHandler::PlayAsilApp(const std::string& app)
{

    if(checkResourceAvailability("asil", app)){

        Invoker invoker;
        string container_runtime = config_parameters["container_runtime"];
        invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "ApplyAsilPod", app));
    
        // Invoke the command and check if it was successful
        if (!invoker.Invoke()) {
            string msg = "Failed to create pod for app: " + app;
            cout << msg << endl;
            // LOG(ERROR) << msg;
            return false;
        }

        cout << "ASIL Pod started successfully for app: " << app << endl;
        json jsonObject= json::object();

        DatabaseHandler::GetInstance().SaveData(vehiclestate_selection, jsonObject);

        // Deduct the required resources from the available resources
        updateResources("asil", app, false);

        return true;
    } 
    cout << "Insufficient resources to run the app: " << app << endl;

    // List of priority levels (low -> medium -> high)
    vector<string> priorityLevels = {kPriorityLowQmRunningApps, kPriorityMediumQmRunningApps, kPriorityHighQmRunningApps};

    // Freeing up resources by stopping lower-priority apps
    for (const auto& priority : priorityLevels) {
        while (!(checkResourceAvailability("asil", app))) {
            cout << "Checking priority level: " << priority << endl;
            list<string> running_apps = DatabaseHandler::GetInstance().ReadListData(priority);
            cout<< "Running apps are "<< running_apps.size()<<endl;
            if (running_apps.empty()) break;
            string app_to_delete = running_apps.front();
            string log_message = "Stopping app: " + app_to_delete + " to free up resources for app: " + app;
            cout<< log_message << endl ;
            DatabaseHandler::GetInstance().AddData(resource_management_log, log_message);
            StopQmApp(app_to_delete);
            usleep(1000000);
            // if (global_log_message == "null") {
            //     global_log_message = log_message;  // Remove "null" and set the message
            // } else {
            //     global_log_message +=log_message + "\n" ;  // Append normally
            // }
        }
    }

    DatabaseHandler::GetInstance().AddData(resource_management_log, "");
    
    // Retry if resources are now available
    if (checkResourceAvailability("asil", app)) {
        return PlayAsilApp(app);
    }

    cout << "Still insufficient resources even after deleting all qm apps!" << endl;
    json jsonObject = json::object();
    DatabaseHandler::GetInstance().SaveData(vehiclestate_selection, jsonObject);

    return false;
}

// Stop ASIL App selected by User from VS UI
bool UserAppControlHandler::StopAsilApp(const std::string& app)
{
    Invoker invoker;
    string container_runtime = config_parameters["container_runtime"];
    invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "DeleteAsilPod", app));
    
    // Invoke the command and check if it was successful
    if (!invoker.Invoke()) {
        string msg = "Failed to create pod for app: " + app;
        cout << msg << endl;
        // LOG(ERROR) << msg;
        return false;
    }
    cout << "ASIL Pod stopped successfully for app: " << app << endl;
    json jsonObject= json::object();

    DatabaseHandler::GetInstance().SaveData(vehiclestate_selection, jsonObject);
   
    //Add the stopped resources in the available resources
    updateResources("asil", app, true);    
    return true;
}


// bool UserAppControlHandler::UnpauseAsilApp(const std::string& app)
// {
//     if(checkResourceAvailability("asil", app)){
//         string command = "sudo podman unpause " + app;
//         int ret = system(command.c_str());

//         if (ret != 0) {
//             cout << "Failed to unpause ASIL pod: " << app << endl;
//             return false;
//         }
//         cout << "ASIL Pod unpaused successfully for app: " << app << endl;
//         json jsonObject= json::object();

//         DatabaseHandler::GetInstance().SaveData(vehiclestate_selection, jsonObject);
//         DatabaseHandler::GetInstance().AddData(resource_management_log, "");

//         DatabaseHandler::GetInstance().asil_b_running_apps_.emplace(app);
//         DatabaseHandler::GetInstance().UpdateRunningApps(kAsilRunningApps, DatabaseHandler::GetInstance().asil_b_running_apps_);

//         DatabaseHandler::GetInstance().asil_b_paused_apps_.erase(app);
//         DatabaseHandler::GetInstance().UpdateRunningApps(kAsilPausedApps, DatabaseHandler::GetInstance().asil_b_paused_apps_);

//         // Deduct the required resources from the available resources
//         updateResources("asil", app, false);

//         return true;
//     } 

//     cout << "Insufficient resources to run the app: " << app << endl;

//     // List of priority levels (low -> medium -> high)
//     vector<string> priorityLevels = {kPriorityLowQmRunningApps, kPriorityMediumQmRunningApps, kPriorityHighQmRunningApps};

//     // Freeing up resources by stopping lower-priority apps
//     for (const auto& priority : priorityLevels) {
//         while (!(checkResourceAvailability("asil", app))) {
//             cout << "Checking priority level: " << priority << endl;
//             list<string> running_apps = DatabaseHandler::GetInstance().ReadListData(priority);
//             cout<< "Running apps are "<< running_apps.size()<<endl;
//             if (running_apps.empty()) break;
//             string app_to_delete = running_apps.front();
//             string log_message = "Stopping app: " + app_to_delete + " to free up resources for app: " + app;
//             cout<< log_message << endl ;
//             DatabaseHandler::GetInstance().AddData(resource_management_log, log_message);
//             StopQmApp(app_to_delete);
//             usleep(1000000);
//         }
//     }

//     // Retry if resources are now available
//     if (checkResourceAvailability("asil", app)) {
//         return UnpauseAsilApp(app);
//     }

//     cout << "Still insufficient resources even after deleting all qm apps!" << endl;
//     json jsonObject = json::object();
//     DatabaseHandler::GetInstance().SaveData(vehiclestate_selection, jsonObject);

//     return false;
// }

// bool UserAppControlHandler::PauseAsilApp(const std::string& app)
// {
//     string command = "sudo podman pause " + app;
//     int ret = system(command.c_str());

//     if (ret != 0) {
//         cout << "Failed to pause ASIL pod: " << app << endl;
//         return false;
//     }

//     cout << "ASIL Pod Paused successfully for app: " << app << endl;
    
//     json jsonObject= json::object();

//     DatabaseHandler::GetInstance().SaveData(vehiclestate_selection, jsonObject);

//     DatabaseHandler::GetInstance().asil_b_paused_apps_.emplace(app);
//     DatabaseHandler::GetInstance().UpdateRunningApps(kAsilPausedApps, DatabaseHandler::GetInstance().asil_b_paused_apps_);

//     DatabaseHandler::GetInstance().asil_b_running_apps_.erase(app);
//     DatabaseHandler::GetInstance().UpdateRunningApps(kAsilRunningApps, DatabaseHandler::GetInstance().asil_b_running_apps_);
    
//     //Add the paused resources in the available resources
//     updateResources("asil", app, true);    
//     return true;
// }