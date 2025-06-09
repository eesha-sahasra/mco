#ifndef _AVP_TRIGGER_MONITOR_HANDLER_H_
#define _AVP_TRIGGER_MONITOR_HANDLER_H_

#include <vector>
#include <unistd.h>
#include <iostream>
#include "inc/mco_common.hpp"
#include "inc/mco_k3s_commands.hpp"
#include "inc/mco_podman_commands.hpp"
#include "inc/mco_bluechi_commands.hpp"
#include "inc/mco_config_handler.hpp"

/// @brief AvpTriggerMonitorHandler is used to monitor triggers from AVP application
class AvpTriggerMonitorHandler
{
public:
    /// @brief Public static method getInstance(). This function is responsible for object creation
    static AvpTriggerMonitorHandler& GetInstance();

    /// @brief initialize LFO to check for pods status.
    void Init();
    
private:
    /// @brief Define constructor in the private section to make this class as singleton.
    AvpTriggerMonitorHandler() = default;

    /// @brief Define destructor in private section, so no one can delete the instance of this class.
    ~AvpTriggerMonitorHandler() = default;

    /// @brief Define copy constructor in the private section, so that no one can voilate the singleton policy of this class
    AvpTriggerMonitorHandler(const AvpTriggerMonitorHandler& obj){}

    /// @brief Define assignment operator in the private section, so that no one can voilate the singleton policy of this class
    void operator=(const AvpTriggerMonitorHandler& obj){}
};

#endif // End of _AVP_TRIGGER_MONITOR_HANDLER_H_
