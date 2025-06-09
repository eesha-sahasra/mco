#include "inc/mco_curl_handler.hpp"

#include <sstream>
#include <fstream>
#include <iostream>
// #include <glog/logging.h>
#include <nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

CurlHandler& CurlHandler::GetInstance()
{
    static CurlHandler self{};
    return self;
}

bool CurlHandler::SpawnPod(){
    // Spawn a new pod
    return true;
}