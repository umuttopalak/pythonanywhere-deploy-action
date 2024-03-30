import os

import requests

host = os.getenv('host')
username = os.getenv('username')
api_token = os.getenv('api_token')
console_id = os.getenv('console_id')
domain_name = os.getenv('domain_name')


# Pull Repository
try:

    console_url = f"https://{host}/api/v0/user/{username}/consoles/{console_id}/send_input/"
    headers = {'Authorization': f'Token {api_token}'}
    payload = {'input': "git pull\n"}

    r = requests.post(url=console_url, headers=headers, data=payload)

except Exception:
    exit('ERROR: Couldnt run `git pull`')


# Update Requirements
try:
    console_url = f"https://{host}/api/v0/user/{username}/consoles/{console_id}/send_input/"
    payload = {'input': "pip install -r requirements.txt\n"}
    headers = {'Authorization': f'Token {api_token}'}
    r = requests.post(url=console_url, headers=headers, data=payload)

    r = requests.post(url=console_url, headers=headers, data=payload)

except Exception:
    exit('ERROR: Couldnt update requirements')


# Migrate Database
try:
    console_url = f"https://{host}/api/v0/user/{username}/consoles/{console_id}/send_input/"
    payload = {'input': "python manage.py migrate\n"}
    headers = {'Authorization': f'Token {api_token}'}
    r = requests.post(url=console_url, headers=headers, data=payload)

    r = requests.post(url=console_url, headers=headers, data=payload)

except Exception:
    exit('ERROR: Couldnt run `python manage.py migrate`')

# Reload Host
try:
    headers = {'Authorization': f'Token {api_token}'}
    reload_url = f"https://{host}/api/v0/user/{username}/webapps/{domain_name}/reload/"
    r = requests.post(url=reload_url, headers=headers)

except Exception:
    exit('ERROR: Couldnt reload app')