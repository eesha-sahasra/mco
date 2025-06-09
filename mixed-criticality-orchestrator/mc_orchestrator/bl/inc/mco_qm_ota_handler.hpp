#ifndef _QM_OTA_HANDLER_H_
#define _QM_OTA_HANDLER_H_

#include <unistd.h>
#include <iostream>
#include <vector>
#include "inc/mco_common.hpp"
#include "inc/mco_k3s_commands.hpp"
#include "inc/mco_podman_commands.hpp"
#include "inc/mco_bluechi_commands.hpp"
#include "inc/mco_config_handler.hpp"

/// @brief QmOtaHandler is handle OTA download of QM Infotainment apps
class QmOtaHandler
{
private:
    /// @brief Define constructor in the private section to make this class as singleton.
    QmOtaHandler() = default;

    /// @brief Define destructor in private section, so no one can delete the instance of this class.
    ~QmOtaHandler() = default;

    /// @brief Define copy constructor in the private section, so that no one can voilate the singleton policy of this class
    QmOtaHandler(const QmOtaHandler& obj){}

    /// @brief Define assignment operator in the private section, so that no one can voilate the singleton policy of this class
    void operator=(const QmOtaHandler& obj){}

public:
    /// @brief Public static method getInstance(). This function is
    // responsible for object creation.
    static QmOtaHandler& GetInstance();

    /// @brief Initialize QM Pod Handler
    void Init();

    /// @brief Check for successful OTA download
    bool OtaDownloadSuccessful();
};

#endif // End of _QM_OTA_HANDLER_H_
