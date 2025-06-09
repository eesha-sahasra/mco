import os
import requests
import json
import random
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET
import redis
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
from datetime import date
import base64

app = Flask(__name__)
CORS(app)

r = redis.Redis(host="localhost", port=6379, db=0)

enKey = "0123456789abcdef"
enIv = "abcdef9876543210"

today = date.today()

cert_path = "./cert_api.pem"
key_path = "./private_api.pem"

UPLOAD_FOLDER = "/home/ubuntu/infotainment_server"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

CONTAINER_FILES = {
    "pacman": "pacman.container",
    "spaceinvaders": "spaceinvaders.container",
    "astray": "astray.container",
}

# ENCRYPTED_CONTAINER_FILES={
#     "pacman": "pacman_encr.container",
#     "spaceinvaders": "spaceinvaders_encr.container",
#     "astray": "astray_encr.container",
# }

JSON_FILES = {
    "pacman": "pacman.json",
    "spaceinvaders": "spaceinvaders.json",
    "astray": "astray.json",
}

# ENCRYPTED_JSON_FILES={
#     "pacman": "pacman_encr.json",
#     "spaceinvaders": "spaceinvaders_encr.json",
#     "astray": "astray_encr.json",
# }

CHANGE_VERSION_SCRIPT = "./change_version.sh"
CONFIG_JSON_PATH = "./config.json"

MANIFEST_FILE = "./manifest.xml"


def read_and_update_manifest_version():
    """Reads the manifest version, increments it, updates the XML, and returns the new version."""
    try:
        tree = ET.parse(MANIFEST_FILE)
        root = tree.getroot()

        version_element = root.find("version")
        if version_element is None:
            raise ValueError("No <version> tag found in manifest.xml")

        current_version = version_element.text.strip()

        # Increment version logic
        version_parts = list(map(int, current_version.split(".")))
        version_parts[-1] += 1  # Increment last digit

        # Handle cases like 6.2.9 -> 6.3.0
        for i in range(len(version_parts) - 1, 0, -1):
            if version_parts[i] >= 10:
                version_parts[i] = 0
                version_parts[i - 1] += 1

        new_version = ".".join(map(str, version_parts))

        # Update XML file with new version
        version_element.text = new_version
        tree.write(MANIFEST_FILE)

        return new_version

    except Exception as e:
        print(f"Error updating manifest version: {e}")
        return None


# def encrypt_file(input_file, output_file, key, iv):
#     try:
#         # Read the input file
#         with open(input_file, 'rb') as f:
#             data = f.read()

#         # Create AES cipher
#         cipher = AES.new(key.encode('utf-8'), AES.MODE_CBC, iv.encode('utf-8'))

#         # Encrypt the data
#         encrypted_data = cipher.encrypt(pad(data, AES.block_size))

#         # Write the encrypted data to the output file
#         with open(output_file, 'wb') as f:
#             f.write(encrypted_data)

#         print("File encrypted successfully.")
#     except Exception as e:
#         print(f"Encryption error: {e}")


def deploy_campaign(package_id, game_name, version):
    print("Package id inside deploy campaign:", package_id)

    with open("config.json") as f:
        data = json.load(f)

    # Parameters
    serverDomain = data["parameters"]["serverDomain"]
    okatURL = data["parameters"]["oktaURL"]
    username = data["credentials"]["username"]
    password = data["credentials"]["password"]

    # Get date
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)

    sess = requests.Session()
    # okatURL = None
    # clientId = None
    # login_type_check = sess.get(f"{serverDomain}/snap/omaui/sapi/v1/loginInfo")
    # response_login_check = login_type_check.json()
    # print("response_login_check",response_login_check)
    # for item in response_login_check.get("available", []):
    #         if item.get("type") == "okta" and "authInfo" in item:
    #             okatURL = item["authInfo"].get("oktaURL")
    #             clientId = item["authInfo"].get("clientId")
    #             break
    # okatURL = response_login_check["authInfo"]["oktaURL"]
    # clientId = response_login_check["authInfo"]["clientId"]

    print("oktaURL: ", okatURL)
    # print("clientId: ", clientId)

    # login_info_1 = {"username": username, "password": password}

    # # print(json.dumps(login_info_1))
    # login_step_1 = sess.post(
    #     f"{okatURL}/api/v1/authn",
    #     headers={"Content-Type": "application/json"},
    #     data=json.dumps(login_info_1),
    # )
    # response_sessionToken = login_step_1.json()
    # print("sessionToken: ", response_sessionToken["sessionToken"])

    # login_info_2 = {
    #     "clientId": clientId,
    #     "sessionToken": response_sessionToken["sessionToken"],
    # }

    # # print(json.dumps(login_info_2))

    # login_step_2 = sess.post(
    #     f"{serverDomain}/snap/omaui/sso/okta/v1/session",
    #     headers={"Content-Type": "application/x-www-form-urlencoded"},
    #     data=login_info_2,
    # )
    # print(login_step_2.status_code)

    # if login_step_2.status_code == 204:
    #     # Create Campaign
    #     print("Creating campaign")

    #     campaign_info_step_1 = {
    #         "name": game_name,
    #         "description": "Test by API",
    #         "startDay": "2025-01-16",
    #         "endDay": "2025-01-17",
    #         "packages": [{"id": package_id}],
    #         "deviceSelection2": {
    #             "usesDeviceSelection": "true",
    #             "query": {
    #                 "key": "vin",
    #                 "operation": "IN",
    #                 "value": ["066139B3C96B"],
    #             },
    #             "groups": {"value": "true"},
    #         },
    #         "tenancy": "default",
    #         "installationPolicies": [],
    #         "state": "Draft",
    #     }

    # Create Campaign
    print("Creating campaign")

    campaign_info_step_1 = {
        "name": game_name,
        "description": "Test by API",
        "startDay": "2025-02-27",
        "endDay": "2025-02-28",
        "packages": [{"id": package_id}],
        "deviceSelection2": {
            "usesDeviceSelection": "true",
            "query": {
                "key": "vin",
                "operation": "IN",
                "value": ["066139B3C96B"],
            },
            "groups": {"value": "true"},
        },
        "tenancy": "default",
        "installationPolicies": [],
        "state": "Draft",
    }

    # print(type(campaign_info_step_1))
    campaign_step_1 = sess.post(
        f"{serverDomain}/snap/omaui/sapi/v1/campaigns/campaign/save",
        headers={"Content-Type": "application/json"},
        data=json.dumps(campaign_info_step_1),
        cert=(cert_path, key_path),
    )

    print(json.dumps(campaign_step_1.text))
    print("campaign_step_1", campaign_step_1.json())
    campaign_id = campaign_step_1.json()["id"]
    print("Campaign ID: ", campaign_id)

    campaign_info_step_3 = {
        "id": campaign_id,
        "devices": [
            {
                "vin": data["vehicle"]["vin"],
                "vid": data["vehicle"]["id"],
                "selected": "true",
            }
        ],
    }

    campaign_step_3 = sess.post(
        f"{serverDomain}/snap/omaui/sapi/v1/campaigns/campaign/devices/save",
        headers={"Content-Type": "application/json"},
        data=json.dumps(campaign_info_step_3),
        cert=(cert_path, key_path),
    )
    print("campaign_step_3", campaign_step_3)

    campaign_info_step_5 = {"id": campaign_id, "state": "Running"}

    campaign_step_5 = sess.post(
        f"{serverDomain}/snap/omaui/sapi/v1/campaigns/campaign/save",
        headers={"Content-Type": "application/json"},
        data=json.dumps(campaign_info_step_5),
        cert=(cert_path, key_path),
    )

    if campaign_step_5.status_code == 200:
        print("Campaign deployed successfully!")
    else:
        print("Login unsuccessful")


def create_package_for_game(game_name, game_version, manifest_version):
    container_file = CONTAINER_FILES.get(game_name)
    # encrypt_file(container_file,f"{game_name}_encrypted.container",enKey,enIv)
    json_file = JSON_FILES.get(game_name)
    # encrypt_file(json_file,f"{game_name}_encrypted.json",enKey,enIv)
    version_number = manifest_version
    # container_file=f"{game_name}_encrypted.container"
    # json_file=f"{game_name}_encrypted.json"
    output_zip_file = f"{game_name}_file.zip"
    if not container_file:
        return {"error": f"No container file found for game {game_name}"}, 400

    if not json_file:
        return {"error": f"No json file found for game {game_name}"}, 400

    try:
        # manifest_file_path = "./manifest.xml"
        # try:
        #     tree = ET.parse(manifest_file_path)
        #     root = tree.getroot()
        #     print("root",root)
        #     # Find the <version> element
        #     version_element = root.find("version")
        #     if version_element is not None:
        #         old_version = version_element.text
        #         version_element.text = manifest_version  # Update the version value
        #         tree.write(manifest_file_path)
        #         print(f"Updated version in manifest.xml from {old_version} to {manifest_version}")
        #     else:
        #         print("No <version> tag found in manifest.xml")
        #         return {"error": "No <version> tag found in manifest.xml"}, 500

        # except ET.ParseError as e:
        #     print(f"Error parsing manifest.xml: {e}")
        #     return {"error": "Invalid manifest.xml file"}, 500
        # except FileNotFoundError:
        #     print("manifest.xml file not found")
        #     return {"error": "manifest.xml file not found"}, 500
        # Call the shell script
        result = subprocess.run(
            [
                "bash",
                CHANGE_VERSION_SCRIPT,
                version_number,
                container_file,
                output_zip_file,
                json_file,
            ],
            check=True,
            text=True,
            capture_output=True,
        )
        print(f"Script output: {result.stdout}")

        # Create package
        with open("config.json") as f:
            data = json.load(f)

        serverDomain = data["parameters"]["serverDomain"]
        oktaURL = data["parameters"]["oktaURL"]
        username = data["credentials"]["username"]
        password = data["credentials"]["password"]
        print(f"data: {data}")
        print(f"oktaURL: {oktaURL}")
        print(f"serverDomain: {serverDomain}")
        print(f"username: {username}")
        print(f"password: {password}")

        # login
        sess = requests.Session()
        print(f"sess: {sess}")
        # oktaURL = None
        # clientId = None
        # login_type_check = sess.get(f"{serverDomain}/snap/omaui/sapi/v1/loginInfo")
        # response_login_check = login_type_check.json()
        # print("response_login_check",response_login_check)
        # for item in response_login_check.get("available", []):
        #     if item.get("type") == "okta" and "authInfo" in item:
        #         oktaURL = item["authInfo"].get("oktaURL")
        #         clientId = item["authInfo"].get("clientId")
        #         break
        # # oktaURL = response_login_check["authInfo"]["oktaURL"]
        # # clientId = response_login_check["authInfo"]["clientId"]

        # login_info_1 = {"username": username, "password": password}

        # login_step1 = sess.post(
        #     f"{oktaURL}/api/v1/authn",
        #     headers={"Content-Type": "application/json"},
        #     data=json.dumps(login_info_1),
        # )
        # response_sessionToken = login_step1.json()

        # print(f"test:{response_sessionToken}")

        # print("\n\n\n")

        # print(login_step1.json())
        # print("sessionToken: ", response_sessionToken["sessionToken"])
        # print("\n\n\n")

        # login_info_2 = {
        #     "clientId": clientId,
        #     "sessionToken": response_sessionToken["sessionToken"],
        # }

        # login_step2 = sess.post(
        #     f"{serverDomain}/snap/omaui/sso/okta/v1/session",
        #     headers={"Content-Type": "application/x-www-form-urlencoded"},
        #     data=login_info_2,
        # )

        # ############################################################################################################################################

        #         # Give path to your signed payload zip file
        fileobj = open(output_zip_file, "rb")

        upload_step1 = sess.post(
            "https://wipro-esync.excelfore.com/snap/omaui/sapi/v1/binary/blind_upload",
            headers={"Content-Type": "application/octet-stream"},
            data=fileobj,
            cert=(cert_path, key_path),
        )

        print(upload_step1)
        print(upload_step1.json())

        # component upload step2
        binary = upload_step1.json()
        binary_data = json.dumps(
            {
                "binaryId": binary["id"],
            }
        )
        print("binary data:", binary_data)

        upload_step2 = sess.post(
            "https://wipro-esync.excelfore.com/snap/omaui/sapi/v1/componentItems/create",
            headers={"Content-Type": "application/json"},
            data=binary_data,
            cert=(cert_path, key_path),
        )

        print(upload_step2)
        print("upload_step2", upload_step2.json())

        # ###################################################################

        #         #creating package

        component = upload_step2.json()
        print("Component: ", component)
        random_int = random.randint(100, 999)
        print("Random Integer:", random_int)

        package_data = json.dumps(
            {
                "name": f"{game_name} Package {version_number}",
                "description": "pkg",
                "state": "Complete",
                "components": [{"id": component["id"]}],
            }
        )
        print("package payload", package_data)

        creating_package = sess.post(
            "https://wipro-esync.excelfore.com/snap/omaui/sapi/v1/packages/package/save",
            headers={"Content-Type": "application/json"},
            data=package_data,
            cert=(cert_path, key_path),
        )

        print("package response:", creating_package.json())

        if creating_package.status_code == 200:
            package_id = creating_package.json()["id"]

            # deploy campaign
            deploy_campaign(package_id, game_name, version_number)
            return {"message": f"Package created successfully for {game_name}"}, 200
        else:
            return {"message": f"Failed to create package for {game_name}"}

    except subprocess.CalledProcessError as e:
        print(f"Error while creating package: {e}")
        return {"error": f"Failed to create package for {game_name}"}, 500


@app.route("/gameServer", methods=["POST"])
def game_server():

    payload = request.get_json()
    print("Received payload:", payload)

    if payload:
        game_name = payload.get("game")
        game_version = payload.get("version")
        vin = payload.get("VIN")
        # vin=payload.get("VIN")
        if game_name in CONTAINER_FILES:
            print(f"{game_name.capitalize()} is clicked")

            manifest_version = read_and_update_manifest_version()

            if not manifest_version:
                return {"error": "Failed to fetch manifest version"}, 500

            response, status_code = create_package_for_game(
                game_name, game_version, manifest_version
            )

            if status_code == 200:
                vin_details = r.get("vin_details")

                if vin_details:
                    vin_details = json.loads(vin_details)

                    # Filter the object based on VIN
                    vin_object = next(
                        (obj for obj in vin_details if obj["vin"] == vin), None
                    )

                    if vin_object:
                        games_list = vin_object.get("games", [])

                        # Find the game object inside the list
                        game_object = next(
                            (
                                game[game_name]
                                for game in games_list
                                if game_name in game
                            ),
                            None,
                        )
                        print("game_object", game_object)
                        if game_object:
                            return jsonify(game_object), 200
                        else:
                            return {
                                "error": f"Game {game_name} not found for VIN {vin}"
                            }, 404
                    else:
                        return {"error": f"VIN {vin} not found in Redis"}, 404
                else:
                    return {"error": "VIN details not found in Redis"}, 404
            else:
                # Forward the error from `create_package_for_game`
                return response
        else:
            print("Unknown game clicked")
            response = {"error": "Unsupported game"}, 400

        return response
        # return {"message": "Payload processed successfully!", "gameName": game_name, "VIN": vin}, 200
    else:
        return {"error": "No payload received"}, 400


@app.route("/game_version", methods=["POST"])
def get_game_version():
    try:
        # Parse request payload
        data = request.get_json()
        game_name = data.get("gameName")

        if not game_name:
            return jsonify({"error": "gameName is required"}), 400

        # Fetch game details from Redis
        game_details_json = r.get("game_details")
        if not game_details_json:
            return jsonify({"error": "Game details not found in Redis"}), 404

        game_details = json.loads(game_details_json)

        # Check if the game exists in the stored data
        if game_name not in game_details:
            return jsonify({"error": "Game not found"}), 404

        # Extract the version information
        game_info = game_details[game_name]
        for item in game_info:
            if "version" in item:
                return jsonify({"gameName": game_name, "version": item["version"]})

        return jsonify({"error": "Version not found for the game"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/files", methods=["POST"])
def upload_files():
    container_file = request.files.get("container_file")
    json_file = request.files.get("json_file")

    if not container_file or not json_file:
        return jsonify({"error": "Both files are required"}), 400
    
    json_path = os.path.join(UPLOAD_FOLDER, json_file.filename)

    for file in [container_file, json_file]:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)

        if os.path.exists(file_path):
            os.remove(file_path)  # Replace the file
            action = "Replaced"
        else:
            action = "Added"

        file.save(file_path)

    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
            version = data.get("version", "Version key not found")
            if not version:
                return jsonify({"error": "Version key not found in JSON file"}), 400
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON format"}), 400

    game_name = os.path.splitext(json_file.filename)[0].lower()

    # Retrieve existing game_details from Redis
    game_details_str = r.get("game_details")
    if not game_details_str:
        return jsonify({"error": "game_details key not found in Redis"}), 404

 

    try:
        game_details = json.loads(game_details_str)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON stored in Redis for game_details"}), 500

 

    # Check if the game exists in the stored game_details
    if game_name not in game_details:
        return jsonify({"error": f"Game '{game_name}' not found in game_details"}), 404

 

    # Update the version for the game.
    # The assumption here is that the version is stored in the first element of the game's array.
    if isinstance(game_details[game_name], list) and len(game_details[game_name]) > 0:
        if isinstance(game_details[game_name][0], dict):
            game_details[game_name][0]["version"] = version
        else:
            return jsonify({"error": f"Expected a dictionary at game_details['{game_name}'][0]"}), 500
    else:
        return jsonify({"error": f"Game details for '{game_name}' are not in the expected format"}), 500

 

    # Save the updated game_details back into Redis
    r.set("game_details", json.dumps(game_details))

 

    #return jsonify({"message": f"Files successfully {action} in {UPLOAD_FOLDER}","version": version}), 200
    return jsonify({
        "message": f"Files successfully {action} in {UPLOAD_FOLDER}",
        "updated_game": game_name,
        "version": version,
    }), 200

    # return jsonify({"message": f"Files successfully {action} in {UPLOAD_FOLDER}"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
