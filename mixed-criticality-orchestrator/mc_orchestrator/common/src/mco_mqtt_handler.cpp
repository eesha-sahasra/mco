
#include "inc/mco_mqtt_handler.hpp"

#include <cstring>
#include <string>
#include <iostream>

#include "inc/mco_common.hpp"

MqttHandler::MqttHandler(const char *id, const std::vector<std::string>& topics)
    : mosquittopp(id)
{       
    // std::cout << "Connecting to MQTT broker..." << std::endl;
    connect(kMqttDomain.c_str(), kMqttPort, kKeepAliveInSec);
    for (const auto& topic : topics) {
        subscribe(NULL, topic.c_str());
    } 
}

void MqttHandler::on_message(const struct mosquitto_message *message) {
    topic_data[message->topic] = std::string(static_cast<char*>(message->payload), message->payloadlen);
} 
