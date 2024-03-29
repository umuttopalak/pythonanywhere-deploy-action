import requests
import sys
import os

host = os.getenv('HOST')
username = os.getenv('USERNAME')
api_token = os.getenv('API_TOKEN')
domain_name = os.getenv('DOMAIN_NAME')
console_id = os.getenv('CONSOLE_ID')

headers = {'Authorization': f'Token {api_token}'}


def update_repository():
    console_url = f"https://{host}/api/v0/user/{username}/consoles/{console_id}/send_input/"
    payload = {'input': "git pull\n"}
    r = requests.post(url=console_url, headers=headers, data=payload)

    if r.status_code == 200:
        return 1


def update_requirements():
    console_url = f"https://{host}/api/v0/user/{username}/consoles/{console_id}/send_input/"
    payload = {'input': "pip install -r requirements.txt\n"}
    r = requests.post(url=console_url, headers=headers, data=payload)

    if r.status_code == 200:
        return 1


def reload_host():
    reload_url = f"https://{host}/api/v0/user/{username}/webapps/{domain_name}/reload/"
    r = requests.post(url=reload_url, headers=headers)

    if r.status_code == 200:
        return 1
    
def main():
    try:
        update_repository_result = update_repository()
        update_requirements_result = update_requirements()
        reload_host_result = reload_host()
    
    except Exception as e:
        sys.exit(1)

if __name__ == "__main__":
    main()

