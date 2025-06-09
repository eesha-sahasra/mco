set(APP_NAME mco_runtime)

add_library(${APP_NAME} STATIC
	src/mco_command_factory.cpp
	src/mco_podman_commands.cpp
	src/mco_k3s_commands.cpp
	src/mco_bluechi_commands.cpp
)                                         
