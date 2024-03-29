import requests
import os

host = os.getenv('HOST')
username = os.getenv('USERNAME')
api_token = os.getenv('API_TOKEN')
console_id = os.getenv('CONSOLE_ID')
domain_name = os.getenv('DOMAIN_NAME')

try:
    headers = {'Authorization': f'Token {api_token}'}
    reload_url = f"https://{host}/api/v0/user/{username}/webapps/{domain_name}/reload/"
    r = requests.post(url=reload_url, headers=headers)

except Exception:
    exit('ERROR: Couldnt reload app')

