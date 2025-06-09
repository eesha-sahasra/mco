cmake_minimum_required(VERSION 3.10)
project(lfo_unitTest)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories("${PROJECT_SOURCE_DIR}/bl")

# Adding test source files here
set(TEST_SOURCES
    lfo_server_handler_test.cpp
)

# Adding test executable
add_executable(LFO_UNITTEST ${TEST_SOURCES})

# Linking test executable with gtest and gtest_main
target_link_libraries(LFO_UNITTEST
    ${CMAKE_THREAD_LIBS_INIT}
    gtest
    gtest_main
    # glog::glog
    librt.so
    pthread
)
