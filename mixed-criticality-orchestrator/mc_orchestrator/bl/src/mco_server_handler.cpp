#include "inc/mco_server_handler.hpp"

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
#include "inc/mco_command_factory.hpp"
#include "inc/mco_k3s_commands.hpp"
#include "inc/mco_podman_commands.hpp"
#include "inc/mco_bluechi_commands.hpp"
#include "inc/mco_utils.hpp"

#include <thread>
#include <chrono>
using namespace std;
using json = nlohmann::json;

ServerHandler& ServerHandler::GetInstance()
{
    static ServerHandler self{};
    return self;
}

void ServerHandler::StartMcOrchestratorServer()
{
    string container_runtime = config_parameters["container_runtime"];

    Invoker invoker;
    invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "RuntimeStatus"));

    if(invoker.Invoke()) {
        httplib::Server svr;

        svr.Post("/operation", [&invoker, container_runtime](const httplib::Request& req, httplib::Response& res) {
            json j = json::parse(req.body);
            string command = j["command"];
            string app_name = j["app_name"];
            json response;
            string msg = "";

            if (command == "delete") {
                invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "DeletePod", app_name));
                if(invoker.Invoke()){
                    msg = "Deleted " + app_name + " pod";
                } else {
                    msg = "FAILED to delete " + app_name + " pod";
                }
                response["response"] = msg;
                UpdateEvent(msg);
            } else if (command == "delete_group") {
                bool success = true;
                list<string> running_apps = DatabaseHandler::GetInstance().ReadListData(app_name);
                for (const auto& app : running_apps) {
                    invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "DeletePod", app));                    
                    if(!invoker.Invoke()) {
                        msg = "FAILED to delete pods in group";
                        success = false;
                        break;
                    }
                }
                if (success) {
                    msg = "Deleted all pods in group";
                }
                response["response"] = msg;
                UpdateEvent(msg);
            } else if (command == "starve") {
                invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "StarvePod"));                
                if(invoker.Invoke()){
                    msg = "Starved " + app_name + " pod";
                } else {
                    msg = "FAILED to starve " + app_name + " pod";
                }
                response["response"] = msg;
                UpdateEvent(msg);
            } else if (command == "apply") {
                invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "ApplyPod", app_name));                
                if(invoker.Invoke()){
                    msg = "Applied " + app_name + " pod";
                } else {
                    msg = "FAILED to apply " + app_name + " pod";
                }
                response["response"] = msg;
                UpdateEvent(msg);
            } else if (command == "status") {
                invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "CheckPodStatus", app_name));
                invoker.Invoke();
                response["response"] = DatabaseHandler::GetInstance().ReadData(app_name, kPodStatus);
            } else{}

            res.set_content(response.dump(), "application/json");
        });

        svr.Post("/checkstatus", [&invoker, container_runtime](const httplib::Request& req, httplib::Response& res) {
            json j = json::parse(req.body);
            string command = j["status"];
            string app_name = j["app_name"];
            json response;

            if (command == "pod_usage") {
                invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "PodUsage", app_name));
                invoker.Invoke();
                response["response"] = DatabaseHandler::GetInstance().ReadStringData("cache");
                DatabaseHandler::GetInstance().DeleteKey("cache");
            } else if (command == "runtime_status") {
                invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "RuntimeStatus"));
                if(invoker.Invoke()){
                    response["response"] = "Runtime is running";
                } else {
                    response["response"] = "Runtime is not running";
                }
            } else{}

            res.set_content(response.dump(), "application/json");
        });

        svr.Post("/ota", [&invoker](const httplib::Request& req, httplib::Response& res) {
            auto app_name_file = req.get_file_value("app_name");
            string app_name = app_name_file.content;
            auto json_file = req.get_file_value("json_file");
            auto deployment_file = req.get_file_value("deployment_file");
            json response;
            string msg = "";

            string json_file_location = kAppFileDownloadPath + "/" + json_file.filename; 
            // Save files to disk
            ofstream json_out(json_file_location);
            json_out << json_file.content;
            json_out.close();

            ofstream deployment_out(kAppFileDownloadPath + "/" + deployment_file.filename);
            deployment_out << deployment_file.content;
            deployment_out.close();

            ConfigHandler configHandler;
            if (configHandler.SaveFileContentToDatabase(json_file_location)){
                msg = "OTA success for " + app_name;
            } else {
                msg = "OTA failed for " + app_name;
            }
            response["response"] = msg;
            UpdateEvent(msg);
            res.set_content(response.dump(), "application/json");
        });

     /*   svr.Post("/avp_trigger", [&invoker](const httplib::Request& req, httplib::Response& res) {
            json j = json::parse(req.body);
            string command = j["command"];
            string app_name = j["app_name"];
            json response;
            string msg = "";

            if (command == "delete") {
                // std::this_thread::sleep_for(std::chrono::seconds(5));  // Sleep for 5 seconds
                bool success = true;
                list<string> running_apps = DatabaseHandler::GetInstance().ReadListData(app_name);
                for (const auto& app : running_apps) {
                    invoker.SetCommand(make_unique<DeletePodCommand>(app));
                    if(!invoker.Invoke()) {
                        msg = "FAILED to delete pods in group";
                        success = false;
                        break;
                    }
                }
                if (success) {
                    msg = "Pods requested as per AVP trigger are deleted";
                }
                response["response"] = msg;
                UpdateEvent(msg);
                DatabaseHandler::GetInstance().AddData("avp_trigger", "true");
            } else{}

            res.set_content(response.dump(), "application/json");
        });
        */

        svr.listen("0.0.0.0", stoi(config_parameters["lfo_port_number"]));

        // LOG(INFO) << "LFO server started at port " << config_parameters["lfo_port_number"];
    } else {
        // LOG(FATAL) << "K3S is not running";
    }
}
