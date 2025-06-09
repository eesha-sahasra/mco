#ifndef _SERVER_HANDLER_H_
#define _SERVER_HANDLER_H_

#include <unistd.h>
#include <iostream>
#include <vector>
#include "inc/mco_common.hpp"
#include "inc/mco_k3s_commands.hpp"
#include "inc/mco_podman_commands.hpp"
#include "inc/mco_bluechi_commands.hpp"
#include "inc/mco_config_handler.hpp"

/// @brief ServerHandler is used to create a LFO REST server and handle the requests
class ServerHandler
{
private:
    /// @brief Define constructor in the private section to make this class as singleton.
    ServerHandler() = default;

    /// @brief Define destructor in private section, so no one can delete the instance of this class.
    ~ServerHandler() = default;

    /// @brief Define copy constructor in the private section, so that no one can voilate the singleton policy of this class
    ServerHandler(const ServerHandler& obj){}

    /// @brief Define assignment operator in the private section, so that no one can voilate the singleton policy of this class
    void operator=(const ServerHandler& obj){}

public:
    /// @brief Public static method getInstance(). This function is
    // responsible for object creation.
    static ServerHandler& GetInstance();

    /// @brief start LFO server
    void StartMcOrchestratorServer();
};

#endif // End of _SERVER_HANDLER_H_
