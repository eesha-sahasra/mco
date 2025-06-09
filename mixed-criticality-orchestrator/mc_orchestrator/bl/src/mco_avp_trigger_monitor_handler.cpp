#include "inc/mco_avp_trigger_monitor_handler.hpp"

#include <cstdlib>
#include <httplib.h>
#include <fstream>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <array>

// #include <glog/logging.h>
#include <mosquittopp.h>
#include <nlohmann/json.hpp>
#include "inc/mco_database_handler.hpp"
#include "inc/mco_command_factory.hpp"
//#include "inc/mco_mqtt_handler.hpp"
#include "inc/mco_k3s_commands.hpp"
#include "inc/mco_podman_commands.hpp"
#include "inc/mco_bluechi_commands.hpp"
#include "inc/mco_utils.hpp"

#include <thread>
#include <chrono>
using namespace std;
using json = nlohmann::json;

// Subscriber class
class Subscriber : public mosqpp::mosquittopp {
public:
   // map<string, string> topic_data;
    string payload;
    Subscriber(const char *id, const char *host, int port) : mosqpp::mosquittopp(id) {
        connect(host, port, 60);
    }

    void on_connect(int rc) override {
        cout << " Connecting to MQTT broker for AVP "<< endl;
        if (rc == 0) {
            subscribe(nullptr, kTopicAvp.c_str());
        }
    }

    void on_message(const struct mosquitto_message *message) override {
       // string topic = message->topic;
        payload = string(static_cast<char*>(message->payload), message->payloadlen);
     //   topic_data[topic] = payload;
    }
};


AvpTriggerMonitorHandler& AvpTriggerMonitorHandler::GetInstance()
{
    static AvpTriggerMonitorHandler self{};
    return self;
}

void AvpTriggerMonitorHandler::Init()
{   
    mosqpp::lib_init();
    Subscriber subscriber("Subscriber", "localhost", 1883);

    Invoker invoker;
    std::string container_runtime = config_parameters["container_runtime"];
    invoker.SetCommand(CommandFactory::CreateCommand(container_runtime, "RuntimeStatus"));
    
    if(invoker.Invoke()) {
        while(true) {        
            subscriber.loop();    // Start the loop to receive messages
            std::this_thread::sleep_for(std::chrono::milliseconds(20));  // Sleep for 20ms for subscription
            if (!subscriber.payload.empty()) {
                json receivedMessage = json::parse(subscriber.payload);
                std::string command = receivedMessage["command"];
                std::string app_name = receivedMessage["app_name"];
                std::cout << "COMMAND is: " << command << std::endl;
                std::cout << "APP_NAME IS: " << app_name<< std::endl;
               // json response;
                string msg = "";
                if (command == "delete") {
                    // std::this_thread::sleep_for(std::chrono::seconds(5));  // Sleep for 5 seconds
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
                        msg = "Pods requested as per AVP trigger are deleted";
                     }
                //    response["response"] = msg;
                    UpdateEvent(msg);
                    DatabaseHandler::GetInstance().AddData("avp_trigger", "true");
                } else{}

            subscriber.payload.clear(); // Clear the payload after processing the message

            } else {
                cout << "No message received from " << kTopicAvp << " yet." << endl;
            }
        }
    }    
      /*       auto avp_it = subscriber.topic_data.find(kTopicAvp);
             if (avp_it != subscriber.topic_data.end() && !avp_it->second.empty()) {
                cout << "Received message from " << kTopicAvp << ": " << avp_it->second << endl;
                subscriber.topic_data.erase(avp_it);
                mosqpp::lib_cleanup();
            } else {
                if (avp_it == subscriber.topic_data.end()) {
                    cout << "No message received from " << kTopicAvp << " yet." << endl;
                } else {
                    cout << "Received message from " << kTopicAvp << " is empty." << endl;
                }
            }
        }
    }    */
    else {
        // LOG(FATAL) << "K3S is not running";
    }
 }
