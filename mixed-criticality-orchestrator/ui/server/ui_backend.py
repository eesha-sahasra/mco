
from flask import Flask, Response, render_template, send_from_directory
import redis
import json
from message_pb2 import AppDetails  # Import the generated protobuf Python file

app = Flask(__name__, static_url_path='/proto', static_folder='../proto')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/proto/<path:path>')
def send_proto(path):
    return send_from_directory('../proto', path)

@app.route('/get_apps', methods=['GET'])
def get_apps():
    # Connect to your Redis server
    r = redis.Redis(host='localhost', port=6379, db=0)

    # Get all apps
    running_apps = r.lrange('running_apps', 0, -1)
    deleted_apps = r.lrange('deleted_apps', 0, -1)

    # List to hold all JSON strings
    all_jsons = []

    # Get the timestamp from Redis
    timestamp = r.get('timestamp')
    timestamp = timestamp.decode('utf-8').strip()
    all_jsons.append(timestamp)

    # Iterate over all running apps
    for app in running_apps:
        app = app.decode('utf-8')  # Decode from bytes to string
        # Get the value corresponding to the app
        app_value = r.get(app)
        if app_value is not None:
            app_value = app_value.decode('utf-8')  # Decode from bytes to string
            # Parse the JSON string into a Python object
            app_value = json.loads(app_value)
            # Merge separate objects into one for each application
            merged_app_value = {k: v for d in app_value for k, v in d.items()}
            # Add the merged JSON to the list
            all_jsons.append(merged_app_value)
    
    # Iterate over all deleted apps
    for app in deleted_apps:
        app = app.decode('utf-8')  # Decode from bytes to string
        # Get the value corresponding to the app
        app_value = r.get(app)
        if app_value is not None:
            app_value = app_value.decode('utf-8')  # Decode from bytes to string
            # Parse the JSON string into a Python object
            app_value = json.loads(app_value)
            # Merge separate objects into one for each application
            merged_app_value = {k: v for d in app_value for k, v in d.items()}
            # Add the merged JSON to the list
            all_jsons.append(merged_app_value)

    # Convert the merged dictionaries to a single JSON string
    all_jsons_str = json.dumps(all_jsons)

    # Create a new protobuf message
    app_proto = AppDetails()
    # Populate the protobuf message with data
    app_proto.apps = all_jsons_str
    # Serialize the protobuf message to a string
    serialized_app = app_proto.SerializeToString()
    # Return the serialized protobuf message as a response
    return Response(serialized_app, mimetype='application/octet-stream')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=7654)