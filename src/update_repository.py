import requests
import os

host = os.getenv('HOST')
username = os.getenv('USERNAME')
api_token = os.getenv('API_TOKEN')
console_id = os.getenv('CONSOLE_ID')

try:
    
    console_url = f"https://{host}/api/v0/user/{username}/consoles/{console_id}/send_input/"
    headers = {'Authorization': f'Token {api_token}'}
    payload = {'input': "git pull\n"}

    r = requests.post(url=console_url, headers=headers, data=payload)

except Exception:
    exit('ERROR: Couldnt run `git pull`')