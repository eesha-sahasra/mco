#ifndef _DATABASE_HANDLER_H_
#define _DATABASE_HANDLER_H_

#include <map>
#include <list>
#include <string>
#include <unordered_set>
#include <nlohmann/json.hpp>
#include <cpp_redis/cpp_redis>

/// @brief DatabaseHandler class handles the interaction with the database.
class DatabaseHandler {
public:
    /// @brief Get the singleton instance of the DatabaseHandler class.
    /// @return The singleton instance.
    static DatabaseHandler& GetInstance();

    /// @brief Get the set of all available apps
    std::unordered_set<std::string> running_apps_;

    /// @brief Get the set of all available qm infotainment apps
    std::unordered_set<std::string> qm_infotainment_games_available_;

    /// @brief Get the set of running qm infotainment apps
    std::unordered_set<std::string> qm_infotainment_games_running_apps_;

    /// @brief Get the set of stopped qm infotainment apps
    std::unordered_set<std::string> qm_infotainment_games_stopped_apps_;

    /// @brief Get the set of all available qm infotainment ott apps
    std::unordered_set<std::string> qm_infotainment_ott_available_;

    /// @brief Get the set of running qm infotainment ott apps
    std::unordered_set<std::string> qm_infotainment_ott_running_apps_;

     /// @brief Get the set of stopped qm infotainment apps
     std::unordered_set<std::string> qm_infotainment_ott_stopped_apps_;

    /// @brief Get the set of all available asil b apps
    std::unordered_set<std::string> asil_b_available_;

    /// @brief Get the set of running asil b apps
    std::unordered_set<std::string> asil_b_running_apps_;

    /// @brief Get the set of paused asil b apps
    std::unordered_set<std::string> asil_b_paused_apps_;

    /// @brief Get the set of stopped asil b apps
    std::unordered_set<std::string> asil_b_stopped_apps_;

    /// @brief Get the set of high priority running qm apps
    std::unordered_set<std::string> priority_high_qm_running_apps_;

    /// @brief Get the set of medium priority running qm apps
    std::unordered_set<std::string> priority_medium_qm_running_apps_;

    /// @brief Get the set of low priority running qm apps
    std::unordered_set<std::string> priority_low_qm_running_apps_;

    /// @brief Get the set of all deleted apps
    std::unordered_set<std::string> deleted_apps_;

    /// @brief Get the set of low priority running apps
    std::unordered_set<std::string> priority_low_apps_;

    /// @brief Get the set of medium priority running apps
    std::unordered_set<std::string> priority_medium_apps_;

    /// @brief Get the set of high priority running apps
    std::unordered_set<std::string> priority_high_apps_;

    /// @brief Initialize the database and connect to the database server. 
    ///        If the connection fails, it will try to reconnect 3 times.
    void Init();

    /// @brief Clear all the data in the database.
    /// @return True if the data is cleared successfully, false otherwise.
    bool ClearData();

    /// @brief Add data to the database.
    /// @param key The key as a string.
    /// @param value The value as a string.
    /// @return True if the data is added successfully, false otherwise.
    bool AddData(const std::string& key, const std::string& value);
    
    /// @brief Read string data from the database.
    /// @param key The key as a string.
    /// @return The value associated with the key as a string.
    std::string ReadStringData(const std::string& key);

    /// @brief Read List data from the database.
    /// @param key The key as a string.
    /// @return List of strings associated with the key.
    std::list<std::string> ReadListData(const std::string& key);

    /// @brief Update the set of running apps in the database.
    bool UpdateRunningApps(const std::string& key, const std::unordered_set<std::string>& running_apps);
    
    /// @brief Add events to the database.
    /// @param key The key as a string.
    /// @param events The events as a string.
    /// @return True if the events are added successfully, false otherwise.
    bool AddEvents(const std::string& key, const std::string& event);

    /// @brief Delete the key from the database.
    bool DeleteKey(const std::string& key);

    /// @brief Save the JSON file data to the database.
    /// @param key app name
    /// @param data JSON value in the form of nlohmann::json
    /// @return true if the data is saved successfully, false otherwise.
    bool SaveData(const std::string& key, const nlohmann::json& data);

    /// @brief Read the data from the database.
    /// @param appName application name as a string.
    /// @param key application parameter which we are interested
    /// @return The value associated with the key as a string.
    std::string ReadData(const std::string& appName, const std::string& key);
    
    /// @brief Read the data from the database.
    /// @param appType application type as a string
    /// @param searchKey application which we are interested
    /// @param valuekey application parameter which we are interested
    /// @return The value associated with the  valuekey as a string.
    std::string ReadData(const std::string& appType, const std::string& searchKey, const std::string& valueKey);

    /// @brief Read the data from the database.
    /// @param appName application name as a string.
    /// @param key application parameter which we are interested
    /// @return The value associated with the key as a string.
    std::string AppendData(const std::string& appType, const std::string& appCategory, const std::string& appKey, const std::string& path);

    /// @brief Modify the value of the key in the database.
    /// @param appName application name as a string.
    /// @param key application parameter which we are interested
    /// @param newValue new value to be updated for the key
    bool ModifyValue(const std::string& appName, const std::string& key, const std::string& newValue);

private:
    /// @brief Reconnect to the database server.
    void Reconnect();

    /// @brief Read the application value from the database.
    /// @param appName application name as a string.
    /// @return The value associated with the key as JSON.
    nlohmann::json ReadData(const std::string& appName);

    /// @brief Check if the database server is available.
    /// @return True if the database server is available, false otherwise.
    bool IsDatabaseAvailable();

    /// @brief Define the constructor in the private section to make this class a singleton.
    DatabaseHandler();

    /// @brief Define destructor in private section, so no one can delete the instance of this class.
    ~DatabaseHandler();

    /// @brief Define copy constructor in the private section, so that no one can voilate the singleton policy of this class
    DatabaseHandler(DatabaseHandler const&) = delete;

    /// @brief Define assignment operator in the private section, so that no one can voilate the singleton policy of this class
    void operator=(DatabaseHandler const&) = delete;

    /// @brief database client object to connect to the database server.
    cpp_redis::client client_;
};

#endif // End of _DATABASE_HANDLER_H_