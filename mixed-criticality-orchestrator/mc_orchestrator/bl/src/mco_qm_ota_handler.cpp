#include "inc/mco_qm_ota_handler.hpp"

#include "inc/mco_database_handler.hpp"
#include "inc/mco_config_handler.hpp"
#include "inc/mco_common.hpp"

#include <iostream>
#include <nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

QmOtaHandler& QmOtaHandler::GetInstance()
{
    static QmOtaHandler self{};
    return self;
}

bool QmOtaHandler::OtaDownloadSuccessful() {
    // Check for successful OTA download
    std::string app_name = DatabaseHandler::GetInstance().ReadStringData(ota_downloaded_qm_app);
    
    if (app_name.empty()) {
        return false;
    }

    std::cout << "OTA Status: " << app_name << std::endl;
    kPath = kQmInfoGames;
    DatabaseHandler::GetInstance().AppendData(infotainment, "games", "downloaded", kPath);
    
    ConfigHandler configHandler;
    configHandler.SaveAppNameToDatabase(qm_infotainment_games_available, DatabaseHandler::GetInstance().qm_infotainment_games_available_, kPath);
    
    DatabaseHandler::GetInstance().AddData(available_qm_app, app_name);
    DatabaseHandler::GetInstance().AddData(ota_downloaded_qm_app, "");

    return true;  
}

void QmOtaHandler::Init() {
    // Check for successful OTA download
    while(true) {
        if(OtaDownloadSuccessful()){
            std::cout << "OTA download successful" << std::endl;
        } else {
            // std::cout << "OTA download failed" << std::endl;
        }
    }
}