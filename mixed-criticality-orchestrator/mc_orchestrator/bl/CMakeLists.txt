set(APP_NAME mco_bl)

add_library(${APP_NAME} STATIC
	src/mco_qm_ota_handler.cpp
	src/mco_server_handler.cpp
	src/mco_user_app_control_handler.cpp
	src/mco_resource_monitor_handler.cpp
	src/mco_avp_trigger_monitor_handler.cpp
)                                         
