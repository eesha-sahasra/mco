#ifndef _CONFIG_HANDLER_H_
#define _CONFIG_HANDLER_H_

#include <map>
#include <string>
#include <fstream>
#include <iostream>
#include <algorithm>

#include "inc/mco_common.hpp"
#include "inc/mco_database_handler.hpp"

/// @brief ConfigHandler updates all the config paramneters from config.json file
class ConfigHandler
{
private:

public:
    /// @brief get the value from containerManagement.conf file based on key
    /// @return flag status
    bool GetValue();

    /// @brief Save the app name to the database
    /// @return flag status
    bool SaveAppNameToDatabase();

    /// @brief Save the app name to the database
    /// @param app key, app set in datahandler, folder path
    /// @return flag status
    bool SaveAppNameToDatabase(const std::string&, std::unordered_set<std::string>&, const std::string&);

    /// @brief Save app JSON file content to database
    /// @param location of the app JSON file 
    /// @return flag status
    bool SaveFileContentToDatabase(const std::string& );
    
    /// @brief Save the initial JSON file content to the database
    /// @param  location of the JSON file
    /// @return flag status
    bool UpdateDatabase(const std::string& );

    /// @brief Save the initial JSON file content to the database
    /// @param  location of the JSON file
    /// @return flag status
    bool UpdateDatabase(const std::string&, const std::string&, const std::string&, const std::string& );

    /// @brief  Default constructor
    ConfigHandler() = default;

    /// @brief Default destructor
    ~ConfigHandler() = default;
};

#endif // End of _CONFIG_READER_H_