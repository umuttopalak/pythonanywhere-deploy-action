# pythonanywhere-deploy-action
GitHub action to reload a Django Backend webapp on pythonanywhere. The service pythonanywhere can host web apps based on Python (i.e. Django, Flask, ...). The web app can be updated by copying files to the server with various technologies (i.e. Git, SSH, ...) but afterwards the web app has to be restarted manually. Otherwise the web app is not updated.

In order to enable a continuous deployment to pythonanywhere, this GitHub action automatically updates your pythonanywhere web app with the help of their API.

# Note
The pythonanywhere API is currently in beta state. Because of that it is possible that the action might not work anymore after a change in the API interface.

# Usage

```yaml
- name: Re-Deploy Pythonanywhere Django API
        uses: umuttopalak/pythonanywhere-deploy-action@v1.0.0
        with:
          host: <pythonanywhere host>
          username: <your-username>
          api_token: <pythonanywhere-api-token>
          domain_name: <pythonanywhere-web-app-domain>
          console_id: <pythonanywhere-bash-id>
```

## Get API token
In order to get the API token you have

Login into your pythonanywhere account.
Navigate to Account.
Click on section API token.
Generate an API token and save it.
Do not directly paste your api token or other sensitive data in your workflow xml. Create GitHub action secrets and reference those secrets in your workflow xml.

# Example
```yaml
name: Deploy pythonanywhere webapp
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Re-Deploy Pythonanywhere Django API
        uses: umuttopalak/pythonanywhere-deploy-action@v1.0.0
        with:
          host: 'www.pythonanywhere.com' or 'www.eu.pythonanywhere.com'
          username: {{ secrets.USERNAME }}
          api_token: {{ secrets.API_TOKEN }}
          domain_name: {{ secrets.DOMAIN_NAME }}
          console_id:  {{ secrets.CONSOLE_ID }}
```

# License
MIT: See *LICENSE* for detailed license information.
