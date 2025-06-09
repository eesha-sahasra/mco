set(APP_NAME mco_common)

add_library(${APP_NAME} STATIC
	src/mco_database_handler.cpp
	src/mco_config_handler.cpp
	src/mco_mqtt_handler.cpp
	src/mco_curl_handler.cpp
	src/mco_utils.cpp
)                                         
