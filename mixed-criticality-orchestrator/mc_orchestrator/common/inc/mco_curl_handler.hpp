#ifndef _CURL_HANDLER_H_
#define _CURL_HANDLER_H_

// C++ Header File(s)
#include "inc/mco_common.hpp"

/// @brief ConfigHandler updates all the config paramneters from config.json file
class CurlHandler
{
  private:

  public:
    /// @brief Public static method getInstance(). This function is responsible for object creation.
    static CurlHandler& GetInstance();

    /// @brief Spawn a new pod
    /// @return bool flag
    bool SpawnPod();

  private:
    /// @brief  Define constructor in the private section to make this class as singleton.
    CurlHandler() = default;

    /// @brief Define destructor in private section, so no one can delete the instance of this class.
    ~CurlHandler() = default;

    /// @brief Define copy constructor in the private section, so that no one can voilate the singleton policy of this class
    CurlHandler(const CurlHandler& obj) {}

    /// @brief Define assignment operator in the private section, so that no one can voilate the singleton policy of this class
    void operator=(const CurlHandler& obj) {}
};

#endif // End of _CURL_HANDLER_H_