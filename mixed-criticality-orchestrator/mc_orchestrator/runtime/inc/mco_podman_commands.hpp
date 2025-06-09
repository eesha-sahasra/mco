#ifndef _PODMAN_COMMANDS_H
#define _PODMAN_COMMANDS_H

#include <string>
#include <memory>
#include "inc/mco_commands.hpp"

class PodmanStarvePodCommand : public Command {
private:
    std::string app_name_;
public:
    PodmanStarvePodCommand(const std::string& app_name_);
    ~PodmanStarvePodCommand() = default;

    bool Execute() const override;  // This method should contain the logic to starve pod
};

class PodmanGetPodNameCommand : public Command {
private:
    std::string app_name_;
public:
    PodmanGetPodNameCommand(const std::string& app_name_);
    ~PodmanGetPodNameCommand() = default;

    bool Execute() const override;  // This method should contain the logic to Get name of pod
};

class PodmanApplyAndGetPodNameCommand : public Command {
public:
    PodmanApplyAndGetPodNameCommand() = default;
    ~PodmanApplyAndGetPodNameCommand() = default;

    bool Execute() const override;  // This method should contain the logic to create a new pod and get the name
};

class PodmanAvailableCommand : public Command {
public:
    PodmanAvailableCommand() = default;
    ~PodmanAvailableCommand() = default;

    bool Execute() const override;  // This method should contain the logic to create a new pod and get the name
};

class PodmanApplyPodCommand : public Command {
private:
    std::string app_name_;
public:
    PodmanApplyPodCommand(const std::string& app_name_);
    ~PodmanApplyPodCommand() = default;

    bool Execute() const override;  // This method should contain the logic to create a new pod
};

class PodmanDeletePodCommand : public Command {
private:
    std::string app_name_;
public:
    PodmanDeletePodCommand(const std::string& app_name_);
    ~PodmanDeletePodCommand() = default;

    bool Execute() const override;  // This method should contain the logic to delete a pod
};

class PodmanCheckPodStatusCommand : public Command{
private:
    std::string app_name_;
public:
    PodmanCheckPodStatusCommand(const std::string& app_name_);
    ~PodmanCheckPodStatusCommand() = default;

    bool Execute() const override;  // This method should contain the logic to check if pod name matches
};

class PodmanPodUsageCommand : public Command{
private:
    std::string app_name_;
public:
    PodmanPodUsageCommand(const std::string& app_name_);
    ~PodmanPodUsageCommand() = default;

    bool Execute() const override;  // This method should contain the logic to get the usage of a pod
};

// Add other command classes as needed

#endif