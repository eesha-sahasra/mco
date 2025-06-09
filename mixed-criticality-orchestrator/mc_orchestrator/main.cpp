#include "inc/mco_qm_ota_handler.hpp"
#include "inc/mco_config_handler.hpp"
#include "inc/mco_server_handler.hpp"
#include "inc/mco_database_handler.hpp"
#include "inc/mco_user_app_control_handler.hpp"
#include "inc/mco_resource_monitor_handler.hpp"
#include "inc/mco_avp_trigger_monitor_handler.hpp"
#include <thread>
// #include <glog/logging.h>
#include <nlohmann/json.hpp>

int main(int argc, char* argv[])
{
    // Initialize Google's logging library
    // google::InitGoogleLogging(argv[0]);

    // Initialize the database and clear old data
    DatabaseHandler::GetInstance().Init();
    DatabaseHandler::GetInstance().ClearData();

    ConfigHandler config_handler;
    if(config_handler.GetValue()){
       //  LOG(INFO) << "Config file loaded successfully";
    } else{
       //  LOG(FATAL) << "Failed to load config file";
        return 0;
    }

    // Start the QM OTA Handler thread
    QmOtaHandler& qm_ota_handler = QmOtaHandler::GetInstance();
    std::thread qm_ota_handler_thread([&]() {
            qm_ota_handler.Init();
            //std::this_thread::sleep_for(std::chrono::seconds(1));
    });

    // std::cout << "QM OTA Handler thread started" << std::endl;

    UserAppControlHandler& user_app_control_handler = UserAppControlHandler::GetInstance();
    std::thread user_app_control_handler_thread([&]() {
            user_app_control_handler.Init();
            //std::this_thread::sleep_for(std::chrono::seconds(1));
    });
    
    qm_ota_handler_thread.join();
    user_app_control_handler_thread.join();

//     // Start the LFO server
//     ServerHandler& server_handler = ServerHandler::GetInstance();
//     std::thread mco_server_thread([&]() {
//             server_handler.StartMcOrchestratorServer();
//     }); 

//     // Start the resource monitor thread
//     ResourceMonitorHandler& resource_monitor_handler = ResourceMonitorHandler::GetInstance();
//     std::thread resource_monitor_thread([&]() {
//             resource_monitor_handler.Init();
//             //std::this_thread::sleep_for(std::chrono::seconds(1));
//     });

//     // Start the avp trigger monitor thread
//     AvpTriggerMonitorHandler& avp_trigger_monitor_handler = AvpTriggerMonitorHandler::GetInstance();
//     std::thread avp_trigger_monitor_thread([&]() {
//             avp_trigger_monitor_handler.Init();
//     });

    // Start the UI server
    // std::thread ui_server_thread([&]() {
    //     system(kUiServerCommand.c_str());
    // });

    // Start the UI client
    // std::thread ui_client_thread([&]() {
    //     system(kUiClientCommand.c_str());
    // });
    
//     mco_server_thread.detach();
//     resource_monitor_thread.join();
//     avp_trigger_monitor_thread.join();
    // ui_server_thread.detach();
    // ui_client_thread.detach();

    return 0;
}
