import * as core from "@actions/core";
import axios from "axios";

async function run() {
  try {
    const host: string = core.getInput("host");
    const username: string = core.getInput("username");
    const api_token: string = core.getInput("api_token");
    const domain_name: string = core.getInput("domain_name");
    const console_id: string = core.getInput("console_id");
    const virtual_env: string = core.getInput("virtual_env");

    const console_url: string = `https://${host}/api/v0/user/${username}/consoles/${console_id}/send_input/`;
    let payload = {};
    let response = {};

    payload = {
      input: `source /${virtual_env}/bin/activate`,
    };
    response = await axios.post(console_url, payload, {
      headers: { Authorization: `Token ${api_token}` },
    });

    payload = { input: "git pull\n" };
    response = await axios.post(console_url, payload, {
      headers: { Authorization: `Token ${api_token}` },
    });

    payload = { input: "pip install -r requirements.txt\n" };
    response = await axios.post(console_url, payload, {
      headers: { Authorization: `Token ${api_token}` },
    });

    payload = { input: "python manage.py migrate\n" };
    response = await axios.post(console_url, payload, {
      headers: { Authorization: `Token ${api_token}` },
    });

    const url: string = `https://${host}/api/v0/user/${username}/webapps/${domain_name}/reload/`;
    response = await axios.post(
      url,
      {},
      {
        headers: { Authorization: `Token ${api_token}` },
      }
    );
  } catch (error) {
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}

run();
