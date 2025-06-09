// CommandFactory.hpp
#pragma once
#include <memory>
#include <string>
#include "inc/mco_commands.hpp"

class CommandFactory {
public:
    static std::unique_ptr<Command> CreateCommand(const std::string& container_runtime, const std::string& command_type);
    static std::unique_ptr<Command> CreateCommand(const std::string& container_runtime, const std::string& command_type, const std::string& app_name);
};