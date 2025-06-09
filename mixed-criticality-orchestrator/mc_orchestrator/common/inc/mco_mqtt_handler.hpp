#ifndef _MQTT_HANDLER_H_
#define _MQTT_HANDLER_H_

#include <map>
#include <vector>
#include <string>
#include <mosquittopp.h>

class MqttHandler : public mosqpp::mosquittopp {
public:
    /// @brief map to store the topic name as key and data as value
    std::map<std::string, std::string> topic_data;

    /// @brief Construct a new MQTT Handler object
    /// @param id parsing the id, in our case "subscriber"
    /// @param topics topics as vector of string
    MqttHandler(const char *id, const std::vector<std::string>& topics);
    
    /// @brief Callback function for on_message
    void on_message(const struct mosquitto_message *message);
};

#endif // End of _MQTT_HANDLER_H_