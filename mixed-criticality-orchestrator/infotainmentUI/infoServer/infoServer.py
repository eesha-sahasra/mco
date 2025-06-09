import os
import redis
import requests
import json
import random
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

r = redis.Redis(host='localhost', port=6379, db=0)

@app.route("/getGames", methods=["POST"])
def get_game_details():
    payload = request.get_json()
    print("VIN details", payload)

    if not payload:
        return {"error": "No VIN details received"}, 400

    vin = payload.get("vin")
    print("payload received", payload)

    try:
        infotainment_details = r.get("infotainment")
        if infotainment_details:
            infotainment_data = json.loads(infotainment_details.decode('utf-8'))
            games_data = infotainment_data.get("games", {})

            downloaded_games = {list(game.keys())[0] for game in games_data.get("downloaded", [])}
            recommended_games = games_data.get("recommended", [])

            updated_recommended = [game for game in recommended_games if list(game.keys())[0] not in downloaded_games]
            
            if len(updated_recommended) != len(recommended_games):
                games_data["recommended"] = updated_recommended
                infotainment_data["games"] = games_data
                r.set("infotainment", json.dumps(infotainment_data))  # Update Redis

            return jsonify(infotainment_data), 200
        else:
            return {"error": "No game details found in the database"}, 404
    except redis.RedisError as e:
        print("Redis error:", e)
        return {"error": "Internal server error"}, 500
    except Exception as e:
        print("Unexpected error:", e)
        return {"error": "Internal server error"}, 500

@app.route("/setGames", methods=["POST"])
def set_game_details():
    payload = request.get_json()
    print("Payload received:", payload)

    updated_games=payload["games"]

    try:
        # Fetch the current data from Redis
        infotainment_details = r.get("infotainment")
        if infotainment_details:
            # Decode and parse Redis data
            infotainment_details = json.loads(infotainment_details.decode('utf-8'))

            infotainment_details["games"] = updated_games

            r.set("infotainment",json.dumps(infotainment_details))

            return {"message": "Game details updated successfully"}, 200
        else:
            return {"error": "No game details found in the database"}, 404
    except redis.RedisError as e:
        print("Redis error:", e)
        return {"error": "Internal server error"}, 500
    except Exception as e:
        print("Unexpected error:", e)
        return {"error": "Internal server error"}, 500

# @app.route('/setAction', methods=['POST'])
# def set_action():
#     try:
#         data = request.json
#         game_name = data.get("gameName")

#         if not game_name:
#             return jsonify({"error": "Missing gameName in request"}), 400

#         infotainment_selection = {"action": "play", "app": game_name}
#         r.set("infotainment_selection", json.dumps(infotainment_selection))

#         return jsonify({"message": "Action set successfully", "infotainment_selection": infotainment_selection}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/setAction', methods=['POST'])
# def set_action():
#     try:
#         data = request.json
#         app_name = data.get("gameName") or data.get("ottName")
#         if not app_name:
#             return jsonify({"error": "Missing app name in request"}), 400
#         selection = {"action": "play", "app": app_name} 
#         # Use infotainment_selection for both games and OTT
#         r.set("infotainment_selection", json.dumps(selection))
#         return jsonify({
#             "message": "Action set successfully",
#             "infotainment_selection": selection
#         }), 200
        
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/setStopAction', methods=['POST'])
# def set_stop_action():
#     try:
#         data = request.json
#         game_name = data.get("gameName")

#         if not game_name:
#             return jsonify({"error": "Missing gameName in request"}), 400

#         infotainment_selection = {"action": "stop", "app": game_name}
#         r.set("infotainment_selection", json.dumps(infotainment_selection))

#         return jsonify({"message": "Stop Action set successfully", "infotainment_selection": infotainment_selection}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

@app.route('/setAction', methods=['POST'])
def set_action():
    try:
        data = request.json
        app_name = data.get("gameName") or data.get("ottName") or data.get("navigationName")
        if not app_name:
            return jsonify({"error": "Missing app name in request"}), 400
        selection = {"action": "play", "app": app_name} 
        # Use infotainment_selection for both games and OTT
        r.set("infotainment_selection", json.dumps(selection))
        return jsonify({
            "message": "Action set successfully",
            "infotainment_selection": selection
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/setStopAction', methods=['POST'])
def set_stop_action():
    try:
        data = request.json
        app_name = data.get("gameName") or data.get("ottName")
        if not app_name:
            return jsonify({"error": "Missing app name in request"}), 400 
        selection = {"action": "stop", "app": app_name}
        r.set("infotainment_selection", json.dumps(selection))

        return jsonify({"message": "Stop Action set successfully", "infotainment_selection": selection}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/clear_lack_of_resources', methods=['POST'])
def clear_lack_of_resources():
    r.set("lack_of_resources","")
    return jsonify({"message":"lack_of_resources key set to empty string"}),200

@app.route("/playGame", methods=["POST"])
def play_game():
    try:
        # Parse request data
        data = request.json
        game_name = data.get("gameName")
        print("game_name",game_name)

        if not game_name:
            return jsonify({"error": "gameName is required"}), 400

        # Fetch "infotainment" data from Redis
        infotainment_data = r.get("infotainment")
        print("infotainment_data",infotainment_data)
        if not infotainment_data:
            return jsonify({"error": "No infotainment data found"}), 404

        # Convert JSON string to dictionary
        infotainment = json.loads(infotainment_data)

        # Extract downloaded games list
        downloaded_games = infotainment.get("games", {}).get("downloaded", [])
        print("downloaded_games",downloaded_games)
        if not downloaded_games:
            return jsonify({"error": "No downloads data found"}), 404
        # Find the game with matching name
        matching_game = next((game for game in downloaded_games if game_name in game), None)

        if not matching_game:
            return jsonify({"error": f'Game "{game_name}" not found in downloaded_games'}), 404

        # Move game to playing_games if not already there
        playing_games = infotainment["games"].get("running", [])
        
        if matching_game not in playing_games:
            playing_games.append(matching_game)
            infotainment["games"]["running"] = playing_games

            # Update the Redis database
            r.set("infotainment", json.dumps(infotainment))

            # infotainment_selection = {"action": "play", "app": game_name}
    
            # r.set("infotainment_selection", json.dumps(infotainment_selection))

        # Check if game_name is already in "qm_info_games_running_appsing"
        # existing_games = r.lrange("qm_info_games_running_apps", 0, -1)  # Fetch all items in list
        # existing_games = [game.decode("utf-8") for game in existing_games]  # Convert from bytes to string

        # if game_name not in existing_games:
        #     r.rpush("qm_info_games_running_apps", game_name)

        # # Set "qm_play" to "true"
        # r.set("qm_play", "true")

        return jsonify(matching_game), 200
        # return jsonify({"message": f'Game "{game_name}" moved to playing_games', "data": matching_game}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/launchNavigation", methods=["POST"])
def launch_navigation():
    try:
        # Parse request data
        data = request.json
        navigation_app_name = data.get("navigationName")
        print("navigation_app_name",navigation_app_name)

        if not navigation_app_name:
            return jsonify({"error": "navigation app name is required"}), 400

        # Fetch "infotainment" data from Redis
        infotainment_data = r.get("infotainment")
        print("infotainment_data",infotainment_data)
        if not infotainment_data:
            return jsonify({"error": "No infotainment data found"}), 404

        # Convert JSON string to dictionary
        infotainment = json.loads(infotainment_data)

        # Extract downloaded nav apps list
        downloaded_navigation_apps = infotainment.get("navigation", {}).get("downloaded", [])
        print("downloaded_navigation_apps",downloaded_navigation_apps)
        if not downloaded_navigation_apps:
            return jsonify({"error": "No downloads data found"}), 404
        # Find the nav app with matching name
        matching_navigation_app = next((app for app in downloaded_navigation_apps if navigation_app_name in app), None)

        if not matching_navigation_app:
            return jsonify({"error": f'App "{navigation_app_name}" not found in downloaded_navigation_apps'}), 404

        # Move app to playing_navigation_app if not already there
        playing_navigation_app = infotainment["navigation"].get("running", [])
        
        if matching_navigation_app not in playing_navigation_app:
            playing_navigation_app.append(matching_navigation_app)
            infotainment["navigation"]["running"] = playing_navigation_app

            # Update the Redis database
            r.set("infotainment", json.dumps(infotainment))

        return jsonify(matching_navigation_app), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# @app.route('/getQmRunningGames', methods=['GET'])
# def get_qm_running_games():
#     try:
#         # Fetch all elements from the "qm_info_games_running_apps" list
#         running_games = r.lrange("qm_info_games_running_apps", 0, -1)

#         running_games = [game.decode("utf-8") if isinstance(game, bytes) else game for game in running_games]
        
#         lack_of_resources = r.get("lack_of_resources")
#         lack_of_resources = lack_of_resources.decode("utf-8") if lack_of_resources else ""
        
#         print("lack_of_resources",lack_of_resources)
#         print("running_games",running_games)
#         return jsonify({"qm_info_games_running_apps": running_games, "lack_of_resources": lack_of_resources})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

@app.route('/getQmRunningGames', methods=['GET'])
def get_qm_running_games():
    try:
        # Fetch all elements from the "qm_info_games_running_apps" list
        running_games = r.lrange("qm_info_games_running_apps", 0, -1)
        running_games = [game.decode("utf-8") if isinstance(game, bytes) else game for game in running_games]

        # Fetch lack_of_resources from Redis and decode it
        lack_of_resources = r.get("lack_of_resources")
        if lack_of_resources:
            lack_of_resources = lack_of_resources.decode("utf-8") if isinstance(lack_of_resources, bytes) else lack_of_resources
            try:
                lack_of_resources = json.loads(lack_of_resources) 
            except json.JSONDecodeError:
                lack_of_resources = {"error": "Invalid JSON format in lack_of_resources"} 
        else:
            lack_of_resources = {}

        print("lack_of_resources", lack_of_resources)
        print("running_games", running_games)

        return jsonify({"qm_info_games_running_apps": running_games, "lack_of_resources": lack_of_resources})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getQmRunningNavigationApp', methods=['GET'])
def get_qm_running_navigation_apps():
    try:
        # Fetch all elements from the "qm_info_navigation_running_apps" list
        running_navigation_apps = r.lrange("qm_info_navigation_running_apps", 0, -1)
        running_navigation_apps = [app.decode("utf-8") if isinstance(app, bytes) else app for app in running_navigation_apps]

        # Fetch lack_of_resources from Redis and decode it
        lack_of_resources = r.get("lack_of_resources")
        if lack_of_resources:
            lack_of_resources = lack_of_resources.decode("utf-8") if isinstance(lack_of_resources, bytes) else lack_of_resources
            try:
                lack_of_resources = json.loads(lack_of_resources) 
            except json.JSONDecodeError:
                lack_of_resources = {"error": "Invalid JSON format in lack_of_resources"} 
        else:
            lack_of_resources = {}

        print("lack_of_resources", lack_of_resources)
        print("running_navigation_apps", running_navigation_apps)

        return jsonify({"qm_info_navigation_running_apps": running_navigation_apps, "lack_of_resources": lack_of_resources})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/getVehicleInfo', methods=['GET'])
def get_vehicle_info():
    vehicle_info_json = r.get("vehicle_info")
    if vehicle_info_json:
        vehicle_info = json.loads(vehicle_info_json)  
        return jsonify(vehicle_info)
    else:
        return jsonify({"error": "vehicle_info not found"}), 404

 # .................................... Ott Endpoints(no of endpoints - 5) ..............................................................................................
@app.route('/checkOttInRunningArray', methods=['POST'])
def check_ott_in_running_array():
    try:
        data = request.json
        ott_name = data.get("ottName")
        if not ott_name:
            return jsonify({"error": "ottName is required"}), 400

        # Fetch "infotainment" data from Redis
        infotainment_data = r.get("infotainment")
        if not infotainment_data:
            return jsonify({"error": "No infotainment data found"}), 404

        # Convert JSON string to dictionary
        infotainment = json.loads(infotainment_data)

        # Extract running OTT list
        running_ott = infotainment.get("ott", {}).get("running", [])

        print("running array in infotainment key ", running_ott)

        if not running_ott:
            return jsonify({"error": "No running OTT found"}), 404

        # Find the OTT with matching name
        matching_ott = next((ott for ott in running_ott if ott_name in ott), None)

        if not matching_ott:
            return jsonify({"error": f'OTT "{ott_name}" not found in running OTT'}), 404

        return jsonify(matching_ott), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/getOtts", methods=["POST"])
def get_ott_details():
    payload = request.get_json()
    print("VIN details", payload)

    if not payload:
        return {"error": "No VIN details received"}, 400

    vin = payload.get("vin")
    print("payload received", payload)

    try:
        infotainment_details = r.get("infotainment")
        if infotainment_details:
            infotainment_data = json.loads(infotainment_details.decode('utf-8'))
            ott_data = infotainment_data.get("ott", {})

            downloaded_ott = {list(ott.keys())[0] for ott in ott_data.get("downloaded", [])}
            recommended_ott = ott_data.get("recommended", [])

            updated_recommended = [ott for ott in recommended_ott if list(ott.keys())[0] not in downloaded_ott]
            
            if len(updated_recommended) != len(recommended_ott):
                ott_data["recommended"] = updated_recommended
                infotainment_data["ott"] = ott_data
                r.set("infotainment", json.dumps(infotainment_data))  # Update Redis

            return jsonify(infotainment_data), 200
        else:
            return {"error": "No Ott details found in the database"}, 404
    except redis.RedisError as e:
        print("Redis error:", e)
        return {"error": "Internal server error"}, 500
    except Exception as e:
        print("Unexpected error:", e)
        return {"error": "Internal server error"}, 500



@app.route('/moveOttFromRecToRunning',methods =['POST'])
def move_ottapp_from_rec_to_running():
    try:
        data = request.json
        ott_name = data.get("ottName")
        if not ott_name:
            return jsonify({"error":"ottName is required"}),400  
        #fetch infotainment data from Redis
        infotainment_data = r.get("infotainment")
        # print("infotainment_data------>",infotainment_data)
        if not infotainment_data:
            return jsonify({"error":"No infotainment data found"}),404
        #convert JSON string to dictionary
        infotainment = json.loads(infotainment_data)
        # Extract recommened Ott list
        recommended_ott = infotainment.get("ott",{}).get("downloaded",[])
        # print("Recommended Ott ----------> ",recommended_ott  )
        if not recommended_ott:
            return jsonify({"error":"No recommended ott found"}),404
        # Find the ott with matching name
        matching_ott = next((ott for ott in recommended_ott if ott_name in ott),None)
        print("matching_ott--->",matching_ott)
        if not matching_ott:
            return jsonify({"error":f'Ott "{ott_name}" not found in recommended_ott'}),404
        # Move ott from recommended to running []
        running_ott = infotainment["ott"].get("running",[])
        if matching_ott not in running_ott:
            running_ott.append(matching_ott)
            infotainment["ott"]["running"] = running_ott
            # Update the Redis database
            r.set("infotainment",json.dumps(infotainment))
        return jsonify(matching_ott),200
    except Exception as e:
        return jsonify({"Error":str(e)}),500
        
@app.route('/moveOttFromRunningToStopped', methods=['POST'])
def move_ottapp_from_running_to_stopped():
    try:
        data = request.json
        ott_name = data.get("ottName")

        # Ensure ott_name is a string
        if isinstance(ott_name, list) and len(ott_name) > 0:
            ott_name = ott_name[0]  # Extract string from list

        if not ott_name or not isinstance(ott_name, str):
            return jsonify({"error": "Invalid or missing ottName"}), 400

        # Fetch infotainment data from Redis
        infotainment_data = r.get("infotainment")
        if not infotainment_data:
            return jsonify({"error": "No infotainment data found"}), 404

        # Convert JSON string to dictionary
        infotainment = json.loads(infotainment_data)

        # Extract running OTT list
        running_ott = infotainment.get("ott", {}).get("running", [])
        if not running_ott:
            return jsonify({"error": "No running OTT found"}), 404

        # Find the OTT object in running list
        ott_obj = None
        for ott in running_ott:
            ott_key = list(ott.keys())[0]  # Extract the name of the OTT (e.g., "netflix")
            if ott_key == ott_name:
                ott_obj = ott
                break

        if not ott_obj:
            return jsonify({"error": f'Ott "{ott_name}" not found in running OTT'}), 404

        # Remove OTT from running list
        infotainment["ott"]["running"] = [ott for ott in running_ott if list(ott.keys())[0] != ott_name]

        # Ensure "stopped" list exists and is a list
        if "stopped" not in infotainment["ott"]:
            infotainment["ott"]["stopped"] = []

        infotainment["ott"]["stopped"].append(ott_obj)  # Move OTT to "stopped"

        # Save updated infotainment data back to Redis
        r.set("infotainment", json.dumps(infotainment))

        return jsonify({"message": f'Ott "{ott_name}" stopped successfully'}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 27/02/25
@app.route('/getQmRunningOtt', methods=['GET'])
def get_qm_running_ott():
    try:
        running_ott = r.lrange("qm_info_ott_running_apps", 0, -1)
        running_ott = [ott.decode("utf-8") if isinstance(ott, bytes) else ott for ott in running_ott]
        # Fetch lack of resources from Redis
        lack_of_resources = r.get("lack_of_resources")
        print("Lack of resources for OTT", lack_of_resources)

        # lack_of_resources = r.get("lack_of_resources")
        if lack_of_resources:
            lack_of_resources = lack_of_resources.decode("utf-8") if isinstance(lack_of_resources, bytes) else lack_of_resources
            try:
                lack_of_resources = json.loads(lack_of_resources) 
            except json.JSONDecodeError:
                lack_of_resources = {"error": "Invalid JSON format in lack_of_resources"} 
        else:
            lack_of_resources = {}
        return jsonify({"qm_info_ott_running_apps": running_ott, "lack_of_resources": lack_of_resources}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# .............................................. End of Ott Endpoints ...............................................................................

@app.route('/getQmPlayValue', methods=['GET'])
def get_qm_play_value():
    qm_value = r.get("qm_play")
    return jsonify({"qm_play": qm_value.decode("utf-8") if qm_value else ""})

@app.route('/clearQmPlayValue', methods=['POST'])
def clear_qm_play_value():
    r.set("qm_play", "")  # Clear "qm_play in Redis
    return jsonify({"message": "qm_play cleared"}), 200

@app.route('/getAvailableQmApp', methods=['GET'])
def get_available_qm_app():
    available_qm_app = r.get("available_qm_app")
    return jsonify({"available_qm_app": available_qm_app.decode("utf-8") if available_qm_app else ""})

@app.route('/stopGame', methods=['POST'])
def stop_game():
    try:
        data = request.get_json()
        game_name = data.get('gameName')

        if not game_name:
            return jsonify({"error": "Missing gameName"}), 400

        # Fetch the infotainment data from Redis
        infotainment_data = r.get("infotainment")
        if not infotainment_data:
            return jsonify({"error": "infotainment key not found in Redis"}), 404

        infotainment = json.loads(infotainment_data)

        # Check if game is in "running"
        running_games = infotainment["games"]["running"]
        game_obj = None

        for game in running_games:
            if game_name in game:
                game_obj = game
                break
        
        if not game_obj:
            return jsonify({"error": f"{game_name} not found in running games"}), 404

        # Move game from "running" to "stopped"
        infotainment["games"]["running"] = [game for game in running_games if game_name not in game]
        infotainment["games"]["stopped"].append(game_obj)

        # Save updated infotainment data back to Redis
        r.set("infotainment", json.dumps(infotainment))
        #  Remove the game from "qm_info_games_stopped_apps" after stopping it
        # r.lrem("qm_info_games_stopped_apps", 0, game_name)

        # infotainment_selection = {"action": "stop", "app": game_name}
    
        # r.set("infotainment_selection", json.dumps(infotainment_selection))

        # Add game name to "qm_info_games_stopped_apps" list
        # r.rpush("qm_info_games_stopped_apps", game_name)

        # Update "qm_stop" to "true"
        # r.set("qm_stop", "true")

        return jsonify({"message": f"{game_name} stopped successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/checkAndMoveGames', methods=['POST'])
def check_and_move_games():
    try:
        data = request.json
        stopped_games = data.get("games", [])  # List of stopped games

        if not stopped_games:
            return jsonify({"message": "No games provided"}), 400

        # Retrieve infotainment JSON from Redis
        infotainment_str = r.get("infotainment")
        if not infotainment_str:
            return jsonify({"error": "Infotainment data not found"}), 404

        infotainment = json.loads(infotainment_str)

        # Extract running and stopped lists
        running_games = infotainment["games"].get("running", [])
        stopped_list = infotainment["games"].get("stopped", [])

        moved_games = []

        # Iterate over stopped games and move from running to stopped
        for game_obj in running_games[:]:  # Iterate over a copy to modify safely
            game_name = list(game_obj.keys())[0]  # Extract game name
            if game_name in stopped_games:
                running_games.remove(game_obj)  # Remove from running
                stopped_list.append(game_obj)   # Add to stopped
                moved_games.append(game_name)

        # Update the infotainment JSON
        infotainment["games"]["running"] = running_games
        infotainment["games"]["stopped"] = stopped_list

        # Save back to Redis
        r.set("infotainment", json.dumps(infotainment))

        return jsonify({"moved_games": moved_games, "message": "Games moved successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getQmStoppedGames', methods=['GET'])
def get_qm_stopped_games():
    try:
        # Fetch all elements from the "qm_info_games_stopped_apps" list
        stopped_games = r.lrange("qm_info_games_stopped_apps", 0, -1)

        stopped_games = [game.decode("utf-8") if isinstance(game, bytes) else game for game in stopped_games]

        print("stopped_games",stopped_games)
        return jsonify({"qm_info_games_stopped_apps": stopped_games})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getQmStopValue', methods=['GET'])
def get_qm_stop_value():
    qm_value = r.get("qm_stop")
    return jsonify({"qm_stop": qm_value.decode("utf-8") if qm_value else ""})

@app.route('/clearQmStopValue', methods=['POST'])
def clear_qm_stop_value():
    r.delete("qm_info_games_stopped_apps")
    return jsonify({"message": "Removed 'qm_info_games_stopped_apps' key from Redis and cleared qm_stop"}), 200

@app.route('/clearOttQmStopValue', methods=['POST'])
def clear_qm_info_ott_stopped_value():
    r.delete("qm_info_ott_stopped_apps")
    return jsonify({"message": "Removed 'qm_info_ott_stopped_apps' key from Redis and cleared qm_stop"}), 200

@app.route('/getQmStoppedOtt', methods=['GET'])
def get_qm_stopped_ott():
    try:
        stopped_ott = r.lrange("qm_info_ott_stopped_apps", 0, -1)
        stopped_ott = [ott.decode("utf-8") if isinstance(ott, bytes) else ott for ott in stopped_ott]
        return jsonify({"qm_info_ott_stopped_apps": stopped_ott}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/gameVersionUpdate', methods=['POST'])
def game_version_update():
    try:
        data = request.json
        game_name = data.get('gameName')
        new_version = data.get('newVersion')
        
        if not game_name or not new_version:
            return jsonify({'error': 'Missing gameName or newVersion'}), 400
        
        # Fetch infotainment data from Redis
        infotainment_data = r.get("infotainment")
        if not infotainment_data:
            return jsonify({'error': 'infotainment key not found in Redis'}), 404
        
        infotainment_json = json.loads(infotainment_data)
        
        # Locate the game in downloaded list
        downloaded_games = infotainment_json.get("games", {}).get("downloaded", [])
        
        game_found = False
        for game in downloaded_games:
            if game_name in game:
                for item in game[game_name]:
                    if "version" in item:
                        item["version"] = new_version  # Update version
                        game_found = True
                        break
        
        if not game_found:
            return jsonify({'error': f'Game {game_name} not found in downloaded list'}), 404
        
        # Save updated infotainment data back to Redis
        r.set("infotainment", json.dumps(infotainment_json))
        
        return jsonify({'message': f'Updated {game_name} version to {new_version} successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)