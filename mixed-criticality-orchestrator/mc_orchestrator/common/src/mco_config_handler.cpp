#include "inc/mco_config_handler.hpp"

#include <sstream>
#include <fstream>
#include <iostream>
#include <filesystem>
#include <unistd.h>
// #include <glog/logging.h>
#include <nlohmann/json.hpp>
#include "inc/mco_database_handler.hpp"
#include "inc/mco_command_factory.hpp"
#include "inc/mco_bluechi_commands.hpp"
#include "inc/mco_utils.hpp"
#include "inc/mco_common.hpp"

using namespace std;
using json = nlohmann::json;

bool ConfigHandler::SaveFileContentToDatabase(const std::string& filePath) {
    std::ifstream file(filePath);

    if (!file.is_open()) {
        std::cerr << "Failed to open file: " << filePath << '\n';
        return false;
    }
    std::string jsonString((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    
    // Parse the JSON string and save in database
    nlohmann::json data = nlohmann::json::parse(jsonString);
    string app_name = "";
    for (auto& element : data.items()) {
        app_name = element.key();
    }
    DatabaseHandler::GetInstance().SaveData( app_name, data[app_name]);
    file.close();
    return true;
}

bool ConfigHandler::SaveAppNameToDatabase() {
    string app_name = "";
    for (const auto& entry : std::filesystem::directory_iterator(kAppFileDownloadPath)) {
        if (entry.path().extension() == ".json") {
            // Add the app name to the list of running apps
            app_name = entry.path().filename().string();
            app_name = app_name.substr(0, app_name.find_last_of("."));
            DatabaseHandler::GetInstance().running_apps_.emplace(app_name);
        }
    }
    DatabaseHandler::GetInstance().UpdateRunningApps(kRunningApps, DatabaseHandler::GetInstance().running_apps_);
    return true;
}

bool ConfigHandler::SaveAppNameToDatabase(const std::string& apps_key, std::unordered_set<std::string>& apps_set, const std::string& path) {
    string app_name = "";
    for (const auto& entry : std::filesystem::directory_iterator(path)) {
        if (entry.path().extension() == ".json") {
            // Add the app name to the list of running apps
            app_name = entry.path().filename().string();
            app_name = app_name.substr(0, app_name.find_last_of("."));
            apps_set.emplace(app_name);
        }
    }
    DatabaseHandler::GetInstance().UpdateRunningApps(apps_key, apps_set);
    return true;
}

bool ConfigHandler::UpdateDatabase(const std::string& path) {
    for (const auto& entry : std::filesystem::directory_iterator(path)) {
        if (entry.path().extension() == ".json") {
            std::ifstream file(entry.path());
            if (!file.is_open()) {
                std::cerr << "Could not open file: " << entry.path() << std::endl;
                continue;
            }

            nlohmann::json jsonData;
            try {
                file >> jsonData;
            } catch (const nlohmann::json::parse_error& e) {
                std::cerr << "JSON parse error in file " << entry.path() << ": " << e.what() << std::endl;
                continue;
            }

            // Create a key in Redis with the name of the file (without extension)
            std::string key = entry.path().stem().string();

            // Save the JSON data to the database
            DatabaseHandler::GetInstance().SaveData(key, jsonData);
        }
    }
    return true;
}

bool ConfigHandler::UpdateDatabase(const std::string& app_type, const std::string& app_category, const std::string& app_key, const std::string& path) {
    std::string asil_data_str = DatabaseHandler::GetInstance().AppendData(app_type, app_category, app_key, path);

    if(asil_data_str.empty()) {
        std::cerr << "Failed to append data to the database" << std::endl;
        return false;
    }
    return true;
}


bool ConfigHandler::GetValue()
{
    std::ifstream file("../data/config.json");

    if (!file.is_open()) {
        string msg = "Failed to open config file";
        // LOG(ERROR) << msg;
        return false;
    }

    nlohmann::json jsonObj;
    file >> jsonObj;

    // Reading the json file and storing the values in a map
    for (auto it = jsonObj.begin(); it != jsonObj.end(); ++it) {
        std::string key = it.key();
        std::string value = it.value();
        config_parameters[key] = value;
    }
    file.close();

    if(config_parameters["container_runtime"] == "k3s") {
        kAppFileDownloadPath = kYamlFilePath;
    } else if(config_parameters["container_runtime"] == "podman") {
        kAppFileDownloadPath = kYamlFilePath;
    } else if(config_parameters["container_runtime"] == "bluechi") {
        std::cout << "Bluechi is selected" << std::endl;
    } else {
        // LOG(FATAL) << "Invalid container runtime";
    }

    // Update the database with the ASIL apps template
    kPath = kAsilAllAppsPath;
    UpdateDatabase(kPath);

    // // Save the JSON parameters to the database 
    // for (const auto& entry : std::filesystem::directory_iterator(kAsilBAppsPath)) {
    //     if (entry.path().extension() == ".json") {
    //         // Save the content of the file to the database
    //         SaveFileContentToDatabase(entry.path());
    //     }
    // }

    // Update the database with the QM Infotainment apps based on OEM cloud
    kPath = kQmInfoAllApps;
    UpdateDatabase(kPath);

    // // Save the JSON parameters to the database 
    // for (const auto& entry : std::filesystem::directory_iterator(kQmInfoGames)) {
    //     if (entry.path().extension() == ".json") {
    //         // Save the content of the file to the database
    //         SaveFileContentToDatabase(entry.path());
    //     }
    // }

    // Update the database with vehicle_info details
    kPath = kVehicleInfoPath;
    UpdateDatabase(kPath);

    // Update the database with ASIL B apps
    kPath = kAsilBAppsPath;
    UpdateDatabase(asil, "b", "downloaded", kPath);
    SaveAppNameToDatabase(kAsilBAvailableApps, DatabaseHandler::GetInstance().asil_b_available_, kPath);

     // Update the database with QM Games apps
     kPath = kQmInfoGames;
     UpdateDatabase(infotainment, "games", "downloaded", kPath);
     SaveAppNameToDatabase(kQmInfoGamesAvailableApps, DatabaseHandler::GetInstance().qm_infotainment_games_available_, kPath);

    // Update the database with QM Ott apps
    kPath = kQmInfoOtt;
    UpdateDatabase(infotainment, "ott", "downloaded", kPath);
    SaveAppNameToDatabase(kQmInfoOttAvailableApps, DatabaseHandler::GetInstance().qm_infotainment_ott_available_, kPath);

    DatabaseHandler::GetInstance().AddData(available_qm_app, "");
    DatabaseHandler::GetInstance().AddData(ota_downloaded_qm_app, "");
    DatabaseHandler::GetInstance().AddData(infotainment_selection, "");
    DatabaseHandler::GetInstance().AddData(vehiclestate_selection, "");
    DatabaseHandler::GetInstance().AddData(lack_of_resources, "");
    DatabaseHandler::GetInstance().AddData(vehicle_drive_mode, "");
    DatabaseHandler::GetInstance().AddData(resource_management_log, "null");
    
    // Delete any exisiting ASIL apps
    Invoker invoker;
    list<string> available_apps = DatabaseHandler::GetInstance().ReadListData(kAsilBAvailableApps);
    string container_runtime = config_parameters["container_runtime"];

    for (const auto& app : available_apps) {
        invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "DeleteAsilPod", app));
        
        if(!invoker.Invoke()) {
            string msg = "Failed to spawn pod";
            cout << msg << endl;
            // LOG(ERROR) << msg;
        }
    }

    // for (const auto& app : available_apps) {
    //     invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "ApplyAsilPod", app));
        
    //     if(!invoker.Invoke()) {
    //         string msg = "Failed to spawn pod";
    //         cout << msg << endl;
    //         // LOG(ERROR) << msg;
    //     }

    // }

    // for (const auto& app : available_apps) {
    //     string command = "sudo podman pause " + app;
    //     int ret = system(command.c_str());

    //     if (ret != 0) {
    //         cout << "Failed to pause pod: " << app << endl;
    //     }

        // invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "AsilPodUsage", app));
        // if(!invoker.Invoke()) {
        //     string msg = "Failed to get pod usage";
        //     cout << msg << endl;
        //     // LOG(ERROR) << msg;
        // }
        // updateResources("asil", app, false);

    //     DatabaseHandler::GetInstance().asil_b_paused_apps_.emplace(app);
    //     DatabaseHandler::GetInstance().UpdateRunningApps(kAsilPausedApps, DatabaseHandler::GetInstance().asil_b_paused_apps_);

    //     DatabaseHandler::GetInstance().asil_b_running_apps_.erase(app);
    //     DatabaseHandler::GetInstance().UpdateRunningApps(kAsilRunningApps, DatabaseHandler::GetInstance().asil_b_running_apps_);
    // }

    //asil_initial_memory_updated = true;

    // // Save the JSON parameters to the database 
    // for (const auto& entry : std::filesystem::directory_iterator(kAppFileDownloadPath)) {
    //     if (entry.path().extension() == ".json") {
    //         // Save the content of the file to the database
    //         SaveFileContentToDatabase(entry.path());
    //     }
    // }

    // // Add the app name to the list of running apps
    // SaveAppNameToDatabase();

    //Update database with system resources and available resources
    updateInitialSystemResources();

    allocateQmResources(QM_ALLOCATION_PARK_STATE);
    
    return true;
}
