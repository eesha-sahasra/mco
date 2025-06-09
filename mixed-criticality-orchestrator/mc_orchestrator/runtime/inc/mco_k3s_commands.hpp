#ifndef _K3S_COMMANDS_H
#define _K3S_COMMANDS_H

#include <string>
#include <memory>
#include "inc/mco_commands.hpp"

class K3sStarvePodCommand : public Command {
private:
    std::string app_name_;
public:
    K3sStarvePodCommand(const std::string& app_name_);
    ~K3sStarvePodCommand() = default;

    bool Execute() const override;  // This method should contain the logic to starve pod
};

class K3sGetPodNameCommand : public Command {
private:
    std::string app_name_;
public:
    K3sGetPodNameCommand(const std::string& app_name_);
    ~K3sGetPodNameCommand() = default;

    bool Execute() const override;  // This method should contain the logic to Get name of pod
};

class K3sApplyAndGetPodNameCommand : public Command {
public:
    K3sApplyAndGetPodNameCommand() = default;
    ~K3sApplyAndGetPodNameCommand() = default;

    bool Execute() const override;  // This method should contain the logic to create a new pod and get the name
};

class K3sAvailableCommand : public Command {
public:
    K3sAvailableCommand() = default;
    ~K3sAvailableCommand() = default;

    bool Execute() const override;  // This method should contain the logic to create a new pod and get the name
};

class K3sApplyPodCommand : public Command {
private:
    std::string app_name_;
public:
    K3sApplyPodCommand(const std::string& app_name_);
    ~K3sApplyPodCommand() = default;

    bool Execute() const override;  // This method should contain the logic to create a new pod
};

class K3sDeletePodCommand : public Command {
private:
    std::string app_name_;
public:
    K3sDeletePodCommand(const std::string& app_name_);
    ~K3sDeletePodCommand() = default;

    bool Execute() const override;  // This method should contain the logic to delete a pod
};

class K3sCheckPodStatusCommand : public Command{
private:
    std::string app_name_;
public:
    K3sCheckPodStatusCommand(const std::string& app_name_);
    ~K3sCheckPodStatusCommand() = default;

    bool Execute() const override;  // This method should contain the logic to check if pod name matches
};

class K3sPodUsageCommand : public Command{
private:
    std::string app_name_;
public:
    K3sPodUsageCommand(const std::string& app_name_);
    ~K3sPodUsageCommand() = default;

    bool Execute() const override;  // This method should contain the logic to get the usage of a pod
};

// Add other command classes as needed

#endif