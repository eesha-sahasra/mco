
#include "inc/mco_command_factory.hpp"
#include "inc/mco_k3s_commands.hpp"
#include "inc/mco_podman_commands.hpp"
#include "inc/mco_bluechi_commands.hpp"
#include "inc/mco_common.hpp"

//string kAppFileDownloadPath = "";

std::unique_ptr<Command> CommandFactory::CreateCommand(const std::string& container_runtime, const std::string& command_type) {
    if (container_runtime == "k3s") {
        if (command_type == "RuntimeStatus") {
            return std::make_unique<K3sAvailableCommand>();
        }
        //kAppFileDownloadPath = kYamlFilePath ;
        // Add other k3s commands without app_name here...
    } else if (container_runtime == "podman") {
        if (command_type == "RuntimeStatus") {
            return std::make_unique<PodmanAvailableCommand>();
        }
        //kAppFileDownloadPath = kYamlFilePath ;
        // Add other podman commands without app_name here...
    } else if (container_runtime == "bluechi") {
        if (command_type == "RuntimeStatus") {
            return std::make_unique<BluechiAvailableCommand>();
        }
        //kAppFileDownloadPath = kContainerFilePath ;
        // Add other podman commands without app_name here...
    } else {
        // std::cout << "Invalid container runtime" << std::endl;
        // LOG(FATAL) << "Invalid container runtime";
    }
    return nullptr;
}

std::unique_ptr<Command> CommandFactory::CreateCommand(const std::string& container_runtime, const std::string& command_type, const std::string& app_name) {
    if (container_runtime == "k3s") {
        if (command_type == "PodUsage") {
            return std::make_unique<K3sPodUsageCommand>(app_name);
        } else if (command_type == "ApplyPod") {
            return std::make_unique<K3sApplyPodCommand>(app_name);
        } else if (command_type == "DeletePod") {
            return std::make_unique<K3sDeletePodCommand>(app_name);
        } else if (command_type == "CheckPodStatus") {
            return std::make_unique<K3sCheckPodStatusCommand>(app_name);
        } else if (command_type == "StarvePod") {
            return std::make_unique<K3sStarvePodCommand>(app_name);
        }
        // Add other k3s commands with app_name here...
    } else if (container_runtime == "podman") {
        if (command_type == "PodUsage") {
            return std::make_unique<PodmanPodUsageCommand>(app_name);
        } else if (command_type == "ApplyPod") {
            return std::make_unique<PodmanApplyPodCommand>(app_name);
        } else if (command_type == "DeletePod") {
            return std::make_unique<PodmanDeletePodCommand>(app_name);
        } else if (command_type == "CheckPodStatus") {
            return std::make_unique<PodmanCheckPodStatusCommand>(app_name);
        } else if (command_type == "StarvePod") {
            return std::make_unique<PodmanStarvePodCommand>(app_name);
        }
        // Add other podman commands with app_name here...
    } else if (container_runtime == "bluechi") {
        if (command_type == "PodUsage") {
            return std::make_unique<BluechiUnitUsageCommand>(app_name);
        } else if (command_type == "ApplyAsilPod") {
            return std::make_unique<BluechiStartAsilUnitCommand>(app_name);
        } else if (command_type == "DeleteAsilPod") {
            return std::make_unique<BluechiStopAsilUnitCommand>(app_name);
        } else if (command_type == "ApplyQmPod") {
            return std::make_unique<BluechiStartQmUnitCommand>(app_name);
        } else if (command_type == "DeleteQmPod") {
            return std::make_unique<BluechiStopQmUnitCommand>(app_name);
        } else if (command_type == "CheckPodStatus") {
            return std::make_unique<BluechiCheckUnitStatusCommand>(app_name);
        } else if (command_type == "StarvePod") {
            return std::make_unique<BluechiStarveUnitCommand>(app_name);
        } else if (command_type == "AsilPodUsage") {
            return std::make_unique<BluechiUnitUsageCommand>(app_name);
        }
    }

    return nullptr;
}