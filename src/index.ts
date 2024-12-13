import * as core from "@actions/core";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * postConsoleInput
 * ----------------
 *
 * @param consoleUrl   
 * @param token        
 * @param input        
 * @param successMsg   
 */
async function postConsoleInput(
  consoleUrl: string,
  token: string,
  input: string,
  successMsg: string
): Promise<void> {
  try {
    const payload = { input: `${input}\n` };
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Token ${token}`,
      },
    };

    console.log(`Running command: ${input}`);
    const response: AxiosResponse = await axios.post(consoleUrl, payload, config);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed with status code: ${response.status}`);
    }

    console.log(successMsg);
  } catch (error: any) {
    const errorMessage = `Error sending command "${input}": ${error.message}`;
    core.error(errorMessage);
    if (error.response) {
      core.error(`Response Status: ${error.response.status}`);
      core.error(`Response Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

async function run() {
  try {
    const host: string = core.getInput("host", { required: true });
    const username: string = core.getInput("username", { required: true });
    const api_token: string = core.getInput("api_token", { required: true });
    const domain_name: string = core.getInput("domain_name", { required: true });
    const console_id: string = core.getInput("console_id", { required: true });
    const virtual_env: string = core.getInput("virtual_env", { required: true });
    const directory: string = core.getInput("directory", { required: true });

    const baseApiUrl: string = `https://${host}/api/v0/user/${username}`;
    const consoleUrl: string = `${baseApiUrl}/consoles/${console_id}/send_input/`;
    const reloadUrl: string = `${baseApiUrl}/webapps/${domain_name}/reload/`;

    await postConsoleInput(consoleUrl, api_token, `cd ${directory}`, "Changed directory.");
    await postConsoleInput(consoleUrl, api_token, `source ${virtual_env}/bin/activate`, "Activated virtual environment.");
    await postConsoleInput(consoleUrl, api_token, "git pull", "Pulled latest code.");
    await postConsoleInput(consoleUrl, api_token, "pip install -r requirements.txt", "Installed requirements.");
    await postConsoleInput(consoleUrl, api_token, "python manage.py migrate", "Database migrated.");

    console.log("Reloading webapp...");
    const reloadResponse: AxiosResponse = await axios.post(
      reloadUrl,
      {},
      {
        headers: { Authorization: `Token ${api_token}` },
      }
    );

    if (reloadResponse.status < 200 || reloadResponse.status >= 300) {
      throw new Error(`Failed to reload webapp. Status code: ${reloadResponse.status}`);
    }

    console.log("Reloaded webapp successfully.");
  } catch (error) {
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}

run();
