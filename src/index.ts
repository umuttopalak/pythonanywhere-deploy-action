import * as core from "@actions/core";
import axios from "axios";

async function run() {
  try {
    const host: string = core.getInput("host");
    const username: string = core.getInput("username");
    const api_token: string = core.getInput("api_token");
    const domain_name: string = core.getInput("domain_name");
    const console_id: string = core.getInput("console_id");

    console.log("Running `git pull`.");
    const console_url: string = `https://${host}/api/v0/user/{username}/consoles/${console_id}/send_input/`;
    let payload = { input: "git pull\n" };
    let response = await axios.post(console_url, payload, {
      headers: { Authorization: `Token ${api_token}` },
    });
    console.log("Success.");

    console.log("Running `pip install -r requirements.txt`.");
    payload = { input: "pip install -r requirements.txt\n" };
    response = await axios.post(console_url, payload, {
      headers: { Authorization: `Token ${api_token}` },
    });
    console.log("Success.");

    console.log("Running `python manage.py migrate`.");
    payload = { input: "python manage.py migrate\n" };
    response = await axios.post(console_url, payload, {
      headers: { Authorization: `Token ${api_token}` },
    });
    console.log("Success.");

    console.log("Reloading webapp.");

    const url: string = `https://${host}/api/v0/user/${username}/webapps/${domain_name}/reload/"`;
    response = await axios.post(url, null, {
      headers: { Authorization: `Token ${api_token}` },
    });
    console.log("Reloaded webapp successfully.");
  } catch (error) {
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
