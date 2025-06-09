#ifndef _USER_APP_CONTROL_HANDLER_H_
#define _USER_APP_CONTROL_HANDLER_H_

#include <unistd.h>
#include <iostream>
#include <vector>
#include "inc/mco_common.hpp"

/// @brief UserAppControlHandler is to handle User App control requests from Infotainment and Vehicle State UI
class UserAppControlHandler
{
private:
    /// @brief Define constructor in the private section to make this class as singleton.
    UserAppControlHandler() = default;

    /// @brief Define destructor in private section, so no one can delete the instance of this class.
    ~UserAppControlHandler() = default;

    /// @brief Define copy constructor in the private section, so that no one can voilate the singleton policy of this class
    UserAppControlHandler(const UserAppControlHandler& obj){}

    /// @brief Define assignment operator in the private section, so that no one can voilate the singleton policy of this class
    void operator=(const UserAppControlHandler& obj){}

public:
    /// @brief Public static method getInstance(). This function is
    // responsible for object creation.
    static UserAppControlHandler& GetInstance();

    /// @brief Initialize User App Control Handler
    void Init();

    /// @brief Play QM App selected by User from Infotainment UI
    /// @param app The QM app name to be played
    bool PlayQmApp(const std::string& app);

    /// @brief Stop QM App selected by User from Infotainment UI
    /// @param app The QM app name to be stopped
    bool StopQmApp(const std::string& app);

    /// @brief Unpause ASIL App selected by User from Vehicle State UI
    /// @param app The ASIL app name to be played
    //bool UnpauseAsilApp(const std::string& app);
    bool PlayAsilApp(const std::string& app);

    /// @brief Pause ASIL App selected by User from Vehicle State UI
    /// @param app The ASIL app name to be stopped
    //bool PauseAsilApp(const std::string& app);
    bool StopAsilApp(const std::string& app);

    /// @brief Pause Running ASIL Apps when vehicle is parked
    //bool PauseRunningAsilApps();
};

#endif // End of _USER_APP_CONTROL_HANDLER_H_
