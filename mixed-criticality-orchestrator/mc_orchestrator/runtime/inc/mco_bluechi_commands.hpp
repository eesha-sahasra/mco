#ifndef _BLUECHI_COMMANDS_H
#define _BLUECHI_COMMANDS_H

#include <string>
#include <memory>
#include "inc/mco_commands.hpp"

class BluechiStarveUnitCommand : public Command {
private:
    std::string app_name_;
public:
    BluechiStarveUnitCommand(const std::string& app_name_);
    ~BluechiStarveUnitCommand() = default;

    bool Execute() const override;  // This method should contain the logic to starve pod
};

class BluechiGetUnitNameCommand : public Command {
private:
    std::string app_name_;
public:
    BluechiGetUnitNameCommand(const std::string& app_name_);
    ~BluechiGetUnitNameCommand() = default;

    bool Execute() const override;  // This method should contain the logic to Get name of pod
};

class BluechiStartAndGetUnitNameCommand : public Command {
public:
    BluechiStartAndGetUnitNameCommand() = default;
    ~BluechiStartAndGetUnitNameCommand() = default;

    bool Execute() const override;  // This method should contain the logic to create a new pod and get the name
};

class BluechiAvailableCommand : public Command {
public:
    BluechiAvailableCommand() = default;
    ~BluechiAvailableCommand() = default;

    bool Execute() const override;  // This method should contain the logic to create a new pod and get the name
};

class BluechiStartAsilUnitCommand : public Command {
private:
    std::string app_name_;
public:
    BluechiStartAsilUnitCommand(const std::string& app_name_);
    ~BluechiStartAsilUnitCommand() = default;

    bool Execute() const override;  // This method should contain the logic to create a new pod
};

class BluechiStopAsilUnitCommand : public Command {
private:
    std::string app_name_;
public:
    BluechiStopAsilUnitCommand(const std::string& app_name_);
    ~BluechiStopAsilUnitCommand() = default;

    bool Execute() const override;  // This method should contain the logic to delete a pod
};

class BluechiStartQmUnitCommand : public Command {
private:
    std::string app_name_;
public:
    BluechiStartQmUnitCommand(const std::string& app_name_);
    ~BluechiStartQmUnitCommand() = default;

    bool Execute() const override;  // This method should contain the logic to create a new pod
};

class BluechiStopQmUnitCommand : public Command {
private:
    std::string app_name_;
public:
    BluechiStopQmUnitCommand(const std::string& app_name_);
    ~BluechiStopQmUnitCommand() = default;

    bool Execute() const override;  // This method should contain the logic to delete a pod
};

class BluechiCheckUnitStatusCommand : public Command{
private:
    std::string app_name_;
public:
    BluechiCheckUnitStatusCommand(const std::string& app_name_);
    ~BluechiCheckUnitStatusCommand() = default;

    bool Execute() const override;  // This method should contain the logic to check if pod name matches
};

class BluechiUnitUsageCommand : public Command{
private:
    std::string app_name_;
public:
    BluechiUnitUsageCommand(const std::string& app_name_);
    ~BluechiUnitUsageCommand() = default;

    bool Execute() const override;  // This method should contain the logic to get the usage of a pod
};

// Add other command classes as needed

#endif