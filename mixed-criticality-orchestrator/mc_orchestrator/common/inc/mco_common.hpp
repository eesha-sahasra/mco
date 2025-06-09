
#ifndef _COMMON_H
#define _COMMON_H

#include <map>
#include <string>
#include <tuple>
#include <vector>

//QM resource allocation percentage for vehicle states
/// @brief The QM Partition resource allocation in percentage during Vehicle's Drive state
#define QM_ALLOCATION_DRIVE_STATE 40
/// @brief The QM Partition resource allocation in percentage during Vehicle's Park state
#define QM_ALLOCATION_PARK_STATE 90

using namespace std;

inline string current_cpu = "";
inline string current_memory = "";

//inline bool asil_initial_memory_updated = false;
//inline string global_log_message="null";

// Status flags
inline bool is_cpu_utilization_high = false;
inline bool is_memory_utilization_high = false;
inline bool is_cpu_utilization_below_pod_respawn_threshold = false;
inline bool is_memory_utilization_below_pod_respawn_threshold = false;

// Tracking events and line numbers
inline string prev_event = "";
inline int logger_line_number = 0;
const string kEvents = "lfo_events";
const string kEventsFile = "../data/logs/events.csv";
const string kAllLogsFile = "../../ui/logs/all_logs.csv";

//cpu and memory buffer
const int kCpuBuffer = 1;   // 1 cpu core
const int kMemoryBuffer = 1000;  // 1000 MiB

// kubernetes commands
const string kK3sGetNodes = "kubectl get nodes -o json > ";
const string kK3sApplyPods = "kubectl apply -f ";
const string kK3sDeletePods = "kubectl delete -f ";
const string kK3sPodUsage = "kubectl top pod ";
const string kK3sGetPods = "kubectl get pods -o json > ";

const string kPodmanGetContainers = "podman ps --format json >";
const string kPodmanApplyPods = "podman play kube ";
const string kPodmanDeletePods = "podman pod rm -f ";
const string kPodmanGetPods = "podman pod ps --format json > ";
const string kPodmanPodUsage = "podman pod stats --no-stream --format json ";

const string kBluechiGenerateServiceFile = "sudo bluechictl daemon-reload ";
const string kBluechiGetNodes = "sudo bluechictl status > ";
const string kBluechiApplyPods = "sudo bluechictl start " ;
const string kBluechiDeletePods = "sudo bluechictl stop " ;
//const string kBluechiGetPods = "sudo podman ps --format json > " ;
const string kBluechiGetAsilPods = "sudo podman ps --format json > " ;
const string kBluechiGetPods = "sudo podman exec qm podman ps --format json > " ;
const string kBluechiAsilPodUsage = "sudo podman stats --no-stream --format \"{{.Name}} {{.CPUPerc}} {{.MemUsage}}\" " ;
const string kBluechiPodUsage = "sudo podman exec qm podman stats --no-stream --format \"{{.Name}} {{.CPUPerc}} {{.MemUsage}}\" " ;

const string kLowPriority = "low";
const string kMediumPriority = "medium";
const string kHighPriority = "high";

//const string kNodeName = "qm.host";
//const string kSystemdPath = "/etc/containers/systemd/";
//const string kSystemdPath = "/etc/qm/containers/systemd/";

const int kSuccess = 0;
inline string kAppFileDownloadPath;
inline string kPath;
const string kYamlFilePath = "../data/apps_yaml";
const string kContainerFilePath = "../data/apps_container";
const string kOutputFile = "../response.json";
const string kApiK3s = "https://127.0.0.1:6443/api/v1/nodes";

inline map<string, string> config_parameters;

// Database keys
const string kRunningApps = "running_apps";                  // running_apps
const string kDeletedApps = "deleted_apps";                  // deleted_apps
const string kPriorityLowApps = "priority_low_apps";         // priority_low_apps
const string kPriorityMediumApps = "priority_medium_apps";   // priority_medium_apps
const string kPriorityHighApps = "priority_high_apps";       // priority_high_apps

// Vehicle information 
const string kVehicleInfoPath = "../../storage";                  // vehicle_info json path

// All ASIL apps information
const string kAsilNodeName = "host";
const string kAsilSystemdPath = "/etc/containers/systemd/";


const string kAsilAllAppsPath = "../../storage/apps/asil";         // asil all apps path

// ASIL B apps
const string kAsilBAvailableApps = "asil_b_available_apps";         // asil b available apps
const string kAsilAvailableApps = "asil_available_apps";            // asil available apps
const string kAsilRunningApps = "asil_running_apps";                // asil running apps
const string kAsilPausedApps = "asil_paused_apps";                  // asil paused apps
const string kAsilStoppedApps = "asil_stopped_apps";                // asil stopped apps

const string kAsilBAppsPath = "../../storage/apps/asil/b";             // asil apps path

// QM Infotainment All apps
const string kQmNodeName = "qm.host";
const string kQmSystemdPath = "/etc/qm/containers/systemd/";

const string kQmInfoAllApps = "../../storage/apps/qm/infotainment";         // qm appstore apps path

// QM Games apps
const string kQmInfoGamesAvailableApps = "qm_infotainment_games_available"; // qm games available apps
const string kQmRecommendedApps = "qm_recommended_apps";                    // qm recommended apps
const string kQmInfoGamesDownloadedApps = "qm_info_games_downloaded_apps";  // qm info games downloaded apps
const string kQmInfoGamesRunningApps = "qm_info_games_running_apps";        // qm info games running apps
const string kQmInfoGamesStoppedApps = "qm_info_games_stopped_apps";        // qm info games stopped apps

const string kQmInfoGames = "../../storage/apps/qm/infotainment/games";     // qm games apps path

// QM OTT apps
const string kQmInfoOttAvailableApps = "qm_infotainment_ott_available"; // qm ott available apps
const string kQmInfoOttDownloadedApps = "qm_info_ott_downloaded_apps";  // qm info ott downloaded apps
const string kQmInfoOttRunningApps = "qm_info_ott_running_apps";        // qm info ott running apps
const string kQmInfoOttStoppedApps = "qm_info_ott_stopped_apps";        // qm info ott stopped apps

const string kQmInfoOtt = "../../storage/apps/qm/infotainment/ott";       // qm ott apps path

// QM Music apps
const string kQmInfoMusic = "../../storage/apps/qm/infotainment/music";       // qm music apps path

//Priority List Keys for Qm Apps
const string kPriorityLowQmRunningApps = "qm_low_priority_running_apps";         // priority_low_apps
const string kPriorityMediumQmRunningApps = "qm_medium_priority_running_apps";   // priority_medium_apps
const string kPriorityHighQmRunningApps = "qm_high_priority_running_apps";       // priority_high_apps

// string for app keys
const string kAppPriority = "priority";                 // app_priority
const string kPodName = "pod_name";                     // pod_name
const string kPodStatus = "pod_status";                 // pod_status
const string kPodRunningStatus = "pod_running_status";  // pod_running_status
const string kCpuLimit = "cpu_limit";                   // cpu_limit
const string kMemoryLimit = "memory_limit";             // memory_limit
const string kCpuRequest = "cpu_request";               // cpu_request
const string kMemoryRequest = "memory_request";         // memory_request
const string kYamlPath = "yaml_path";                   // yaml_path
const string kCategory = "category";                    // category

// MQTT parameters
const int kMqttPort = 1883;
const int kMqttCommLoop = 10;
const int kKeepAliveInSec = 60;
const string kMqttDomain = "localhost";
const string kTopicCpuUtilization = "resource/cpu_usage";
const string kTopicMemoryUtilization = "resource/memory_usage";
const string kTopicAvp = "resource/topic";
// UI commands
const string kUiServerCommand = "python3 ../../ui/server/temp_ui_backend.py";
const string kUiClientCommand = "cd ../../ui/client/src && npm start";

/// @brief The database key to Get the selection from the infotainment selection such as start, stop of the application
const string infotainment_selection="infotainment_selection";

/// @brief The database key to Get the selection from the vehiclestate selection such as start, stop of the application
const string vehiclestate_selection="vehiclestate_selection";

/// @brief The database key to Get the selection from the vehicle drive mode selection such as start, stop of the application
const string vehicle_drive_mode="vehicle_drive_mode";

/// @brief The database key to check the Resource Availability and Freeing up resources by stopping lower-priority apps
const string asil="asil";

/// @brief The database key to manage the logs of resources
const string resource_management_log="resource_management_log";

/// @brief The database key to Check the successful OTA download
const string ota_downloaded_qm_app="ota_downloaded_qm_app";

/// @brief qm games available apps
const string qm_infotainment_games_available="qm_infotainment_games_available";

/// @brief the Database Handler to check available qm app
const string available_qm_app="available_qm_app";

/// @brief The Database handler to add insufficient resources
const string lack_of_resources="lack_of_resources";

///@brief The Database handler to check qm available resources 
const string qm_available_resources="qm_available_resources";

/// @brief The Database handler to check qm resource usage
const string qm_resource_usage="qm_resource_usage";

/// @brief The Database handler to check total system resources
const string total_system_resources="total_system_resources";

/// @brief The Database handler to check available resources
const string available_resources ="available_resources";

/// @brief The Database handler to check asil resource usage
const string asil_resource_usage="asil_resource_usage";

/// @brief The Database handler to check the Resource Availability for the infotainment system
const string infotainment = "infotainment";

#endif
