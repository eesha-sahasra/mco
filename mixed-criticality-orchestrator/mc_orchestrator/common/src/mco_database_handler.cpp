#include "inc/mco_database_handler.hpp"
#include <filesystem>
#include <fstream>
#include <iostream>

using namespace std;
using namespace nlohmann;

DatabaseHandler& DatabaseHandler::GetInstance() {
    static DatabaseHandler instance;
    return instance;
}

DatabaseHandler::DatabaseHandler() {
    client_.connect();
}

DatabaseHandler::~DatabaseHandler() {
    client_.disconnect();
}

void DatabaseHandler::Reconnect() {
    client_.disconnect();
    client_.connect();
}

bool DatabaseHandler::IsDatabaseAvailable() {
    bool isAvailable = false;
    client_.ping([&isAvailable](cpp_redis::reply& reply) {
        isAvailable = !reply.is_error();
    });
    client_.sync_commit();
    if (!isAvailable) {
        Reconnect();
        // Recheck after reconnecting
        client_.ping([&isAvailable](cpp_redis::reply& reply) {
            isAvailable = !reply.is_error();
        });
        client_.sync_commit();
    }
    return isAvailable;
}

bool DatabaseHandler::ClearData() {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot clear data." << endl;
        return false;
    }
    client_.flushdb();
    client_.sync_commit();
    return true;
}

void DatabaseHandler::Init() {
    for (int i = 0; i < 3; ++i) {
        if (IsDatabaseAvailable()) {
            return;
        }
        cerr << "Database is not available. Attempting to reconnect (" << i + 1 << "/3)..." << endl;
        Reconnect();
        this_thread::sleep_for(chrono::seconds(3));
    }
    cerr << "Failed to connect to Database after 3 attempts." << endl;
}

bool DatabaseHandler::AddData(const string& key, const string& value) {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot add data." << endl;
        return false;
    }
    client_.set(key, value, [](cpp_redis::reply& reply) {
        if (reply.is_error()) {
            cerr << "Error adding data: " << reply.error() << endl;
            return false;
        }
    });
    client_.sync_commit();
    return true;
}

string DatabaseHandler::ReadStringData(const string& key) {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot read data." << endl;
        return "";
    }
    string value;
    client_.get(key, [&value](cpp_redis::reply& reply) {
        if (reply.is_null()) {
            // cerr << "Key not found" << endl;
        } else if (reply.is_error()) {
            cerr << "Error reading data: " << reply.error() << endl;
        } else {
            value = reply.as_string();
        }
    });
    client_.sync_commit();
    return value;
}

list<string> DatabaseHandler::ReadListData(const string& key) {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot read data." << endl;
        return list<string>();
    }
    list<string> value_list;
    client_.lrange(key, 0, -1, [&value_list](cpp_redis::reply& reply) {
        if (reply.is_null()) {
            std::cerr << "Key not found" << std::endl;
        } else if (reply.is_error()) {
            std::cerr << "Error reading data: " << reply.error() << std::endl;
        } else if (reply.is_array()) {
            for (const auto& element : reply.as_array()) {
                if (element.is_string()) {
                    value_list.push_back(element.as_string());
                }
            }
        }
    });

    client_.sync_commit();
    return value_list;
}

bool DatabaseHandler::UpdateRunningApps(const string& key, const unordered_set<string>& running_apps) {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot update running apps list." << endl;
        return false;
    }
    // Wrap the key in a vector
    vector<string> keys = {key};

    // Delete the existing list in database
    client_.del(keys);

    // Convert the list to a vector
    vector<string> apps(running_apps.begin(), running_apps.end());

    // Add the apps to the database list
    client_.rpush(key, apps);

    // Ensure that all commands are executed before returning
    client_.sync_commit();

    return true;
}

bool DatabaseHandler::AddEvents(const string& key, const string& event) {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot update running apps list." << endl;
        return false;
    }
    // Add the event to the lfo_events list
    client_.rpush("lfo_events", {event});

    // Ensure that all commands are executed before returning
    client_.sync_commit();

    return true;
}

bool DatabaseHandler::DeleteKey(const std::string& key) {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot clear data." << endl;
        return false;
    }

    auto delete_future = client_.del({key});
    client_.sync_commit();

    auto num_deleted = delete_future.get().as_integer();
    if (num_deleted == 0) {
        return false;
    } else {
        return true;
    }
}

bool DatabaseHandler::SaveData(const std::string& key, const nlohmann::json& data) {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot save data." << endl;
        return false;
    }
    // Convert the JSON data to a string
    string data_str = data.dump();
    client_.set(key, data_str);
    client_.sync_commit();
    return true;
}

string DatabaseHandler::ReadData(const std::string& appName, const std::string& field) {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot read data." << endl;
        return "";
    }
    nlohmann::json data;

    client_.get(appName, [&data](cpp_redis::reply& reply){
        if(reply.is_null()) {
            std::cerr << "Key not found" << std::endl;
        } else if(reply.is_error()) {
            std::cerr << "Error reading data: " << reply.error() << std::endl;
        } else {
            data = nlohmann::json::parse(reply.as_string());
        }
    });
    client_.sync_commit();  // Ensure that all commands are executed before returning
    
    std::string value = "";
    // for (auto& element : data) {    // Extract the field value from the JSON data
    //     if (element.find(field) != element.end()) {
    //         value = element[field];
    //         break;
    //     }
    // }
    if (data.contains(field)) {
        value = data[field].get<std::string>();  
    } else {
        std::cerr << "Field '" << field << "' not found in JSON." << std::endl;
    }

    return value;
}

string DatabaseHandler::ReadData(const std::string& appType, const std::string& searchKey, const std::string& valueKey) {
    if (!IsDatabaseAvailable()) {
        std::cerr << "Database is not available. Cannot read data." << std::endl;
        return "";
    }

    nlohmann::json data;
    
    // Fetch JSON data from Redis
    client_.get(appType, [&data](cpp_redis::reply& reply) {
        if (reply.is_null()) {
            std::cerr << "Key not found in Redis" << std::endl;
        } else if (reply.is_error()) {
            std::cerr << "Error reading data from Redis: " << reply.error() << std::endl;
        } else {
            try {
                data = json::parse(reply.as_string());
            } catch (const json::parse_error& e) {
                std::cerr << "JSON parse error from Redis: " << e.what() << std::endl;
            }
        }
    });
    client_.sync_commit();  
    
    // Search for the "downloaded" key in any section of the JSON
    for (auto& [category, value] : data.items()) {
        if (value.contains("downloaded") && value["downloaded"].is_array()) {
            // Iterate through the "downloaded" array
            for (const auto& app : value["downloaded"]) {
                if (app.contains(searchKey) && app[searchKey].is_array()) {
                    for (const auto& obj : app[searchKey]) {
                        if (obj.contains(valueKey)) {
                            if (obj[valueKey].is_object()) {
                                return obj[valueKey].dump(); // Convert JSON object to string
                            } else if (obj[valueKey].is_string()) {
                                return obj[valueKey].get<std::string>(); // Return as string
                            }
                        }
                    }
                }
            }
        }
    }
}

string DatabaseHandler::AppendData(const std::string& appName, const std::string& appCategory, const std::string& appKey, const std::string& path) {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot read data." << endl;
        return "";
    }
    nlohmann::json data;

    client_.get(appName, [&data](cpp_redis::reply& reply){
        if(reply.is_null()) {
            std::cerr << "Key not found" << std::endl;
        } else if(reply.is_error()) {
            std::cerr << "Error reading data: " << reply.error() << std::endl;
        } else {
            data = nlohmann::json::parse(reply.as_string());
        }
    });
    client_.sync_commit();  // Ensure that all commands are executed before returning
    
    // Ensure appCategory appKey array exist in the data
    if (!data.contains(appCategory)) {
        data[appCategory] = json::object();
    }
    if (!data[appCategory].contains(appKey)) {
        data[appCategory][appKey] = json::array();
    }

    // Iterate through the .json files in the specified directory
    for (const auto& entry : std::filesystem::directory_iterator(path)) {
        if (entry.path().extension() == ".json") {
            std::ifstream file(entry.path());
            if (!file.is_open()) {
                std::cerr << "Could not open file: " << entry.path() << std::endl;
                continue;
            }

            json file_data;
            try {
                file >> file_data;
            } catch (const json::parse_error& e) {
                std::cerr << "JSON parse error in file " << entry.path() << ": " << e.what() << std::endl;
                continue;
            }

            // Append the content of each .json file to the appKey array
            for (auto& [key, value] : file_data.items()) {
                json new_entry;
                
                // Check if the key is not already present in data[appCategory][appKey]
                bool key_exists = false;
                for (const auto& item : data[appCategory][appKey]) {
                    if (item.contains(key)) {
                        key_exists = true;
                        break;
                    }
                }

                if (!key_exists) {
                    new_entry[key] = value;
                    data[appCategory][appKey].push_back(new_entry);
                    // SaveData(key, value);
                } else {
                    std::cout << "Key " << key << " already exists in data[" << appCategory << "][" << appKey << "]" << std::endl;
                }
            }
        }
    }

    // Update the key in the Redis database with the new content
    client_.set(appName, data.dump());
    client_.sync_commit();  // Ensure that all commands are executed before returning

    return data.dump();
}

json DatabaseHandler::ReadData(const std::string& key) {
    if (!IsDatabaseAvailable()) {
        cerr << "Database is not available. Cannot read data." << endl;
        return "";
    }
    nlohmann::json data;

    client_.get(key, [&data](cpp_redis::reply& reply){
        if(reply.is_null()) {
            std::cerr << "Key not found" << std::endl;
        } else if(reply.is_error()) {
            std::cerr << "Error reading data: " << reply.error() << std::endl;
        } else {
            data = nlohmann::json::parse(reply.as_string());
        }
    });
    client_.sync_commit();  // Ensure that all commands are executed before returning
    
    return data;
}

bool DatabaseHandler::ModifyValue(const std::string& appName, const std::string& key, const std::string& newValue) {
    // Reading the current JSON data
    json data = ReadData(appName);
    // Parse the JSON data and modify the key value
    for (auto& element : data) {
        if (element.find(key) != element.end()) {
            element[key] = newValue;
            break;
        }
    }
    // Save the modified data back to the database
    SaveData(appName, data);
    return true;
}