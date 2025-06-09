#ifndef _RESOURCE_MONITOR_HANDLER_H_
#define _RESOURCE_MONITOR_HANDLER_H_

#include <vector>
#include <unistd.h>
#include <iostream>
#include "inc/mco_common.hpp"
#include "inc/mco_k3s_commands.hpp"
#include "inc/mco_podman_commands.hpp"
#include "inc/mco_bluechi_commands.hpp"
#include "inc/mco_config_handler.hpp"

/// @brief ResourceMonitorHandler is used to monitor resources of host machine
class ResourceMonitorHandler
{
public:
    /// @brief Public static method getInstance(). This function is responsible for object creation
    static ResourceMonitorHandler& GetInstance();

    /// @brief initialize LFO to check for pods status.
    void Init();
    
private:
    /// @brief Define constructor in the private section to make this class as singleton.
    ResourceMonitorHandler() = default;

    /// @brief Define destructor in private section, so no one can delete the instance of this class.
    ~ResourceMonitorHandler() = default;

    /// @brief Define copy constructor in the private section, so that no one can voilate the singleton policy of this class
    ResourceMonitorHandler(const ResourceMonitorHandler& obj){}

    /// @brief Define assignment operator in the private section, so that no one can voilate the singleton policy of this class
    void operator=(const ResourceMonitorHandler& obj){}
};

#endif // End of _RESOURCE_MONITOR_HANDLER_H_
