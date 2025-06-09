from flask import Flask, request, jsonify
import os
import zipfile
import shutil
import redis
import json

app = Flask(__name__)

# Base storage directory
BASE_TARGET_DIR = "../storage/apps/qm/infotainment/"

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if file:
        # Directories for upload and extraction
        UPLOAD_FOLDER = './uploaded_files'
        EXTRACT_FOLDER = './extracted_files'
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(EXTRACT_FOLDER, exist_ok=True)

        zip_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(zip_path)

        # Extract ZIP file
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(EXTRACT_FOLDER)
            
            # Find relevant files
            json_file = None
            deployment_file = None
            for root, _, files in os.walk(EXTRACT_FOLDER):
                for fname in files:
                    if fname.endswith('.json'):
                        json_file = os.path.join(root, fname)
                    elif fname.endswith(('.yaml', '.yml', '.container')):
                        deployment_file = os.path.join(root, fname)

            # Check required files
            if not json_file or not deployment_file:

                shutil.rmtree(EXTRACT_FOLDER)
                shutil.rmtree(UPLOAD_FOLDER)
                return jsonify({"error": "Required JSON and DEPLOYMENT files not found in the ZIP"}), 400
            
            # Extract app name and category from the JSON file
            with open(json_file, 'r') as jf:
                try:
                    json_data = json.load(jf)
                    print("Extracted JSON Data:", json_data)  # Debug: Print JSON content
                    # Get the first key and corresponding list
                    app_key = next(iter(json_data))
                    app_info_list = json_data[app_key]

                    # Extract category directly
                    app_category = next((item['category'].lower() for item in app_info_list if 'category' in item), '')

                    #print("Extracted Category:", app_category)
                    app_name = app_key  # Use the key as the app name
                    #print("Extracted App Name:", app_name)

                except json.JSONDecodeError as e:
                    print("JSON Decode Error:", str(e))
                    return jsonify({"error": "Invalid JSON format"}), 400

            # Determine target directory based on category
            if app_category == 'games':
                target_dir = os.path.join(BASE_TARGET_DIR, 'games')
            elif app_category == 'ott':
                target_dir = os.path.join(BASE_TARGET_DIR, 'ott')
            elif app_category == 'music':
                target_dir = os.path.join(BASE_TARGET_DIR, 'music')
            else:
                shutil.rmtree(EXTRACT_FOLDER)
                shutil.rmtree(UPLOAD_FOLDER)
                return jsonify({"error": "Unsupported app category specified in JSON"}), 400

            os.makedirs(target_dir, exist_ok=True)

            # Replace or add files in the target directory
            for src_file in [json_file, deployment_file]:
                dest_file = os.path.join(target_dir, os.path.basename(src_file))
                if os.path.exists(dest_file):
                    os.remove(dest_file)  # Replace existing file
                shutil.copy(src_file, dest_file)

            # Update Redis key
            r = redis.Redis(host='localhost', port=6379, decode_responses=True)
            r.set("ota_downloaded_qm_app", app_name)

            # Cleanup
            shutil.rmtree(EXTRACT_FOLDER)
            shutil.rmtree(UPLOAD_FOLDER)

            return jsonify({
                "message": "File uploaded, extracted, and saved successfully"
            }), 200

        except zipfile.BadZipFile:
            return jsonify({"error": "Uploaded file is not a valid ZIP file"}), 400
        except Exception as e:
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    return jsonify({"error": "Unexpected error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5010, debug=True)
