#ifndef _UTILS_
#define _UTILS_

#include <string>

std::string GetCurrentTime();

void UpdateEvent(std::string msg);

void updateInitialSystemResources();

bool checkResourceAvailability(const std::string& app_type, const std::string& app_name);

void updateResources(const std::string& app_type, const std::string& app_name, bool add);

void update_qm_available_resource(const std::string& mode) ;

void allocateQmResources(const int percentage);

#endif // End of _UTILS_