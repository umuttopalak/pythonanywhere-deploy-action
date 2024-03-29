import requests
import os

host = os.getenv('HOST')
username = os.getenv('USERNAME')
api_token = os.getenv('API_TOKEN')
console_id = os.getenv('CONSOLE_ID')

try:
    console_url = f"https://{host}/api/v0/user/{username}/consoles/{console_id}/send_input/"
    payload = {'input': "pip install -r requirements.txt\n"}
    headers = {'Authorization': f'Token {api_token}'}
    r = requests.post(url=console_url, headers=headers, data=payload)

    r = requests.post(url=console_url, headers=headers, data=payload)

except Exception:
    exit('ERROR: Couldnt update requirements')