#!/bin/bash

xml_file="manifest.xml"
element_path="/xl4_pkg_update_manifest/version"
private="private.pem"
cert="cert.pem"

echo "change version started"

if [ "$#" -ne 4 ]; then
    echo "Usage: $0 <new_value> <json_file_path> <name_of_payload> \n eg : 9.0 update.json file.zip"
    exit 1
fi


new_value="$1"
game_container_file="$2"
payload_to_upload="$3"
game_json_file="$4"

echo $new_value $game_container_file $payload_to_upload $game_json_file

if ! command -v xmlstarlet &> /dev/null; then
    echo "xmlstarlet not found. Please install it."
    exit 1
fi



xmlstarlet ed --inplace --update "$element_path" --value "$new_value" "$xml_file"
echo "Value in $element_path updated to: $new_value"


zip "$payload_to_upload" "$xml_file" "$game_container_file" "$game_json_file"
echo "Files $xml_file and $game_container_file and $game_json_file zipped together as $payload_to_upload."

# signing
# 4096 - Passcode for this certificate
echo '4096' | ./sign_package.sh $payload_to_upload $3 $private $cert



#curl --location 'https://wipro-esync.excelfore.com:9084/snap/omaui/sapi/v1/binary/blind_upload' \
#--header 'Content-Type: application/octet-stream' \
#--header 'Cookie: xl4.sso.okta.okta.sid.v2=1706190476845:MG9hM2VuZzlkOW9Nd0hxNnU1ZDc6MTAyUFFScXVoQ2VSbEtzR291a1JpazgyZw; #JSESSIONID=A5A342FBAC9CA562539A3B3FD1A90747' \
#--data '@/home/prinsha/scripts/result.zip'
