from flask import Flask, request, jsonify
from flask_cors import CORS
import redis
import json
import os
import threading
import psutil
import time
import subprocess
import webbrowser
import random


app = Flask(__name__)
CORS(app)
# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0,decode_responses=True)
RESOURCE_DIRECTORY = '../../mc_orchestrator/data/asil_apps/'

@app.route('/get_cpu_and_memory', methods=['GET'])
def get_cpu_and_memory():
    # Fetch total and available resources from Redis
    total_resources = r.get('total_system_resources')
    available_resources = r.get('available_resources')
    asil_resource_usage = r.get('asil_resource_usage')
    qm_resource_usage = r.get('qm_resource_usage')
    qm_available_resources = r.get('qm_available_resources')
    vehicle_info = r.get('vehicle_info') 
    asil_running_apps = r.lrange("asil_running_apps", 0, -1)
    asil_stopped_apps = r.lrange("asil_stopped_apps", 0, -1) 
    # If the keys exist in Redis, parse the JSON values
    if total_resources and available_resources and asil_resource_usage and qm_resource_usage and qm_available_resources:
        total_resources = json.loads(total_resources)
        available_resources = json.loads(available_resources)
        # asil_resource_usage = json.loads('asil_resource_usage')
        # qm_resource_usage = json.loads('qm_resource_usage')

        if asil_resource_usage:
            asil_resource_usage = json.loads(asil_resource_usage)
        else:
            asil_resource_usage = {}

        if qm_resource_usage:
            qm_resource_usage = json.loads(qm_resource_usage)
        else:
            qm_resource_usage = {}

        if qm_available_resources:
            qm_available_resources = json.loads(qm_available_resources)
        else:
            qm_available_resources = {}
        vehicle_state = "" 
        if vehicle_info:
            try:
                vehicle_info = json.loads(vehicle_info)
                vehicle_state = vehicle_info.get("vehicle_state", "") 
            except json.JSONDecodeError:
                vehicle_state = "error_parsing_vehicle_info"
        total_memory = int(total_resources.get('memory', "0").replace('Mi', ''))  # Removing "Mi" from memory value
        available_memory = int(available_resources.get('memory', "0").replace('Mi', ''))  # Removing "Mi" from memory value
        asil_memory = int(asil_resource_usage.get('memory', "0").replace('Mi', ''))
        qm_memory = int(qm_resource_usage.get('memory', "0").replace('Mi', ''))
        qm_available_memory = int(qm_available_resources.get('memory', "0").replace('Mi', ''))

        cpu_value = available_resources.get('cpu', "0%").replace('%', '')  
        asil_cpu_value = asil_resource_usage.get('cpu', "0%").replace('%', '')
        qm_cpu_value = qm_resource_usage.get('cpu', "0%").replace('%', '')
        qm_available_cpu_value = qm_available_resources.get('cpu', "0%").replace('%', '')
        try:
            cpu_progress_in_per = float(cpu_value)  # Convert to float for decimal values
            # Convert to int if it's a whole number, otherwise keep as float
            cpu_progress_in_per = int(cpu_progress_in_per) if cpu_progress_in_per.is_integer() else cpu_progress_in_per

            asil_cpu_progress_in_per = float(asil_cpu_value)  # Convert to float for decimal values
            # Convert to int if it's a whole number, otherwise keep as float
            asil_cpu_progress_in_per = int(asil_cpu_progress_in_per) if asil_cpu_progress_in_per.is_integer() else asil_cpu_progress_in_per

            qm_cpu_progress_in_per = float(qm_cpu_value)  # Convert to float for decimal values
            # Convert to int if it's a whole number, otherwise keep as float
            qm_cpu_progress_in_per = int(qm_cpu_progress_in_per) if qm_cpu_progress_in_per.is_integer() else qm_cpu_progress_in_per

            qm_available_cpu_progress_in_per = float(qm_available_cpu_value)  # Convert to float for decimal values
            # Convert to int if it's a whole number, otherwise keep as float
            qm_available_cpu_progress_in_per = int(qm_available_cpu_progress_in_per) if qm_available_cpu_progress_in_per.is_integer() else qm_available_cpu_progress_in_per
        except ValueError:
            cpu_progress_in_per = 0  # Default to 0 if conversion fails   
            asil_cpu_progress_in_per = 0 
            qm_cpu_progress_in_per = 0
            qm_available_cpu_progress_in_per = 0

        # Calculate Memory progress as a percentage
        memory_progress = (available_memory / total_memory) * 100 if total_memory > 0 else 0
        asil_memory_progress = (asil_memory / total_memory) * 100 if total_memory > 0 else 0
        qm_memory_progress = (qm_memory / total_memory) * 100 if total_memory > 0 else 0
        qm_available_memory_progress = (qm_available_memory / total_memory) * 100 if total_memory > 0 else 0
        # Return the progress for both CPU and Memory
        return jsonify({
            "cpu_progress": cpu_progress_in_per,
            "asil_cpu_progress": asil_cpu_progress_in_per,
            "qm_cpu_progress": qm_cpu_progress_in_per,
            "qm_available_cpu_progress": qm_available_cpu_progress_in_per,
            "memory_progress": memory_progress,
            "asil_memory_progress": asil_memory_progress,
            "qm_memory_progress": qm_memory_progress,
            "qm_available_memory_progress": qm_available_memory_progress,
            "asil_running_apps": asil_running_apps,
            "asil_stopped_apps": asil_stopped_apps,
            "vehicle_state": vehicle_state
        }),200
    # If keys are not available in Redis, return an error message
    return jsonify({"message": "Required data not available in Redis"}), 400

@app.route('/update_adas', methods=['POST'])
def update_adas():
    data = request.json
    adas_value = data.get('vehiclestate_selection', None)
    asil_apps_data = r.get('asil')
    if asil_apps_data:
        asil_apps_data = json.loads(asil_apps_data)
        selected_app = adas_value.get("app", "")
        action = adas_value.get("action", "")
        if action == "play":
            if selected_app in ["acc", "laneassist"]:
                # Check if key exists in running array
                is_running = any(selected_app in app for app in asil_apps_data["b"]["running"])
                if is_running:
                    return jsonify({"message": f"{selected_app} already running"}), 200
                # Find app in downloaded array by key
                app_to_move = next((app for app in asil_apps_data["b"]["downloaded"] 
                                  if selected_app in app), None)
                if app_to_move:
                    asil_apps_data["b"]["running"].append(app_to_move)
                    r.set('asil', json.dumps(asil_apps_data))
                    return jsonify({"message": "Success", "data": asil_apps_data}), 200
        elif action == "stop":
            if selected_app in ["acc", "laneassist"]:
                # Find app in running array by key
                app_to_stop = next((app for app in asil_apps_data["b"]["running"] 
                                   if selected_app in app), None)
                if app_to_stop:
                    asil_apps_data["b"]["running"].remove(app_to_stop)
                    asil_apps_data["b"]["stopped"].append(app_to_stop)
                    r.set('asil', json.dumps(asil_apps_data))
                    return jsonify({"message": "Success", "data": asil_apps_data}), 200
                else:
                    return jsonify({"message": f"{selected_app} already in stop state"}), 200
    return jsonify({"message": "Failed"}), 400

@app.route('/clear_lack_of_resources', methods=['POST'])
def clear_lack_of_resources():
    r.set("lack_of_resources","")
    # set "resource_management_log" key to default "null" to handle other use cases
    r.set("resource_management_log","null")
    # resource_log = r.get("resource_management_log")


    #     return jsonify({"resource_management_log": resource_log})
    return jsonify({"message":"lack_of_resources key set to empty string"}),200

@app.route('/park', methods=['POST'])
def stop_the_recent_playing_app():
    data = request.json
    vehicle_state = data.get('vehicle_info', None)

    # r.set("vehicle_drive_mode", "park") 

    redis_data = r.get("vehicle_info")
    
    if redis_data:
        current_vehicle_info = json.loads(redis_data)   
        current_vehicle_info["vehicle_state"] = "park"     
        r.set("vehicle_info", json.dumps(current_vehicle_info))  
        asil_data = r.get("asil")
        if asil_data:
            asil_json = json.loads(asil_data)   
            if "b" in asil_json and "running" in asil_json["b"] and "stopped" in asil_json["b"]:
                # Move all "running" apps to "stopped"
                asil_json["b"]["stopped"].extend(asil_json["b"]["running"])
                asil_json["b"]["running"] = [] 
                r.set("asil", json.dumps(asil_json))
        return jsonify({
            "message": "Vehicle State updated to park, running apps moved to stopped",
            "vehicle_info": current_vehicle_info,
            "asil": asil_json
        }), 200 
    return jsonify({"message": "Check the Park key..."}), 400

@app.route('/drive', methods=['POST'])
def drive():
    data = request.json
    vehicle_state = data.get('vehicle_info', None)
    # r.set("vehicle_drive_mode", "drive") 
    redis_data = r.get("vehicle_info")
    if redis_data:
        # Parse current vehicle info
        current_vehicle_info = json.loads(redis_data)
        # Update vehicle state to "drive"
        current_vehicle_info["vehicle_state"] = "drive"
        # Save updated data back to Redis
        r.set("vehicle_info", json.dumps(current_vehicle_info)) 
        asil_data = r.get("asil")
        if asil_data:
            asil_json = json.loads(asil_data)       
            if "b" in asil_json and "running" in asil_json["b"] and "downloaded" in asil_json["b"]:
                # Copy all "downloaded" apps to "running"
                asil_json["b"]["running"].extend(asil_json["b"]["downloaded"])
                r.set("asil", json.dumps(asil_json))
        return jsonify({
            "message": "Vehicle State updated to park, running apps moved to stopped",
            "vehicle_info": current_vehicle_info,
            "asil": asil_json
        }), 200 
    return jsonify({"message": "Check the Drive key..."}), 400

@app.route('/reverse', methods=['POST'])
def rear_view():
    data = request.json
    # vehicle_state = data.get('vehicle_info', None)
    reverse = data.get('vehicle_info', {}).get('vehicle_state', None)

    print("vehicle_state value ------->",reverse)
    #  {'vehicle_state': 'reverse'}

    redis_data = r.get("vehicle_info")
    if redis_data:
        current_vehicle_info = json.loads(redis_data)
        # update vehicle state to "rear_view"
        current_vehicle_info["vehicle_state"] = reverse
        r.set("vehicle_info", json.dumps(current_vehicle_info))
        return jsonify({
            "message": "Vehicle State updated to rear_view",
            "vehicle_info": current_vehicle_info
        }), 200
    return jsonify({"message": "Check the Rear View key..."}), 400

@app.route('/update_drive_mode', methods=['POST'])
def update_drive_mode():
    try:
        data = request.get_json()
        if not data or "vehicle_drive_mode" not in data:
            return jsonify({"error": "Missing vehicle_drive_mode in request"}), 400

        drive_mode = data["vehicle_drive_mode"].lower()

        if drive_mode in ["drive", "park","reverse"]:
            r.set("vehicle_drive_mode", drive_mode)
            return jsonify({"message": f"Vehicle drive mode updated to {drive_mode}"}), 200
        else:
            return jsonify({"error": "Invalid vehicle_drive_mode. Allowed values: 'drive', 'park','reverse'"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/setAction', methods=['POST'])
def set_action():
    try:
        data = request.json
        app_name = data.get("appName")
        app_action = data.get("appAction")
        print("app_name",app_name)
        print("app_action",app_action)
        if not app_name:
            return jsonify({"error": "Missing appName in request"}), 400
        vehiclestate_selection={"action": app_action, "app": app_name}
        # app_name = data.get('vehiclestate_selection', None)
        r.set("vehiclestate_selection", json.dumps(vehiclestate_selection))
        return jsonify({"message": "Action set successfully", "vehiclestate_selection": vehiclestate_selection}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getQmRunningGames', methods=['GET'])
def get_qm_running_games():
    try:
        # Fetch all elements from the "qm_info_games_running_apps" list
        running_games = r.lrange("qm_info_games_running_apps", 0, -1)
        running_games = [game.decode("utf-8") if isinstance(game, bytes) else game for game in running_games]

        print("running_games", running_games)

        return jsonify({"qm_info_games_running_apps": running_games})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_resource_management_log", methods=["GET"])
def get_resource_management_log():
    try:
        # Fetch the value of "resource_management_log" from Redis
        resource_log = r.get("resource_management_log")

        # If the key does not exist, return an empty string
        if resource_log is None:
            resource_log = ""

        return jsonify({"resource_management_log": resource_log}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getAsilRunningApps', methods=['GET'])
def get_running_asil_apps():
    try:
        # Fetch all elements from the "asil_running_apps" list
        running_asil_apps = r.lrange("asil_running_apps", 0, -1)
        running_asil_apps = [app.decode("utf-8") if isinstance(app, bytes) else app for app in running_asil_apps] 
        lack_of_resources = r.get("lack_of_resources")
        if lack_of_resources:
            lack_of_resources = lack_of_resources.decode("utf-8") if isinstance(lack_of_resources, bytes) else lack_of_resources
            try:
                lack_of_resources = json.loads(lack_of_resources) 
            except json.JSONDecodeError:
                lack_of_resources = {"error": "Invalid JSON format in lack_of_resources"} 
        else:
            lack_of_resources = {}
        
        print("lack_of_resources",lack_of_resources)
        print("running_asil_apps",running_asil_apps)
        return jsonify({"asil_running_apps": running_asil_apps, "lack_of_resources": lack_of_resources})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/setSpeed', methods=['POST'])
def set_speed():
    random_speed = random.randint(50, 60)
    r.set('speed', random_speed)
    return jsonify({"message": "Speed set successfully", "speed": random_speed}), 200

# Endpoint to get the speed from Redis
@app.route('/getSpeed', methods=['GET'])
def get_speed():
    speed = r.get('speed')
    if speed is None:
        return jsonify({"message": "No speed data available"}), 404
    return jsonify({"speed": int(speed)}), 200

if __name__ == '__main__':
    # r.flushdb()
    # r.set("vehiclestate_selection", "none")
    # r.set("vehiclestate_selection", json.dumps("none"))

    # infotainment_data = {"games": {}, "music": {}, "ott": {}}
    # infotainment_data={"games": {"astray": {"cpu": "2", "memory": "2000Mi"}}, "music": {}, "ott": {}}
    # r.set("infotainment", json.dumps(infotainment_data))
    # resource_thread = threading.Thread(target=update_resources_periodically, daemon=True)
    # resource_thread.start()
    
    app.run(host='0.0.0.0', port=5500, debug=True)