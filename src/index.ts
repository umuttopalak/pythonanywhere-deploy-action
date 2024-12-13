import * as core from "@actions/core";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
/**
 * postConsoleInput
 * ----------------
 *
 * @param consoleRequestUrl
 * @param token
 * @param input
 * @param successMsg
 */
async function postConsoleInput(
  consoleRequestUrl: string,
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
    const response: AxiosResponse = await axios.post(
      consoleRequestUrl,
      payload,
      config
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed with status code: ${response.status}`);
    }

    console.log(successMsg);
  } catch (error: any) {
    const errorMessage = `Error sending command "${input}": ${error.message}`;
    core.setFailed(errorMessage);
    if (error.response) {
      core.setFailed(`Response Status: ${error.response.status}`);
      core.setFailed(`Response Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * performGetRequest
 * -----------------
 *
 * @param requestUrl  GET isteği atılacak URL
 * @param token
 * @returns           response.data
 */
async function performGetRequest(
  requestUrl: string,
  token: string
): Promise<any> {
  try {
    const config: AxiosRequestConfig = token
      ? {
          headers: { Authorization: `Token ${token}` },
        }
      : {};

    console.log(`Sending GET request to: ${requestUrl}`);
    const response: AxiosResponse = await axios.get(requestUrl, config);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `GET request failed with status code: ${response.status}`
      );
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = `Error in GET request: ${error.message}`;
    core.setFailed(errorMessage);
    if (error.response) {
      core.setFailed(`Response Status: ${error.response.status}`);
      core.setFailed(`Response Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * performPostRequest
 * ------------------
 *
 * @param requestUrl
 * @param payload
 * @param token
 * @returns
 */
async function performPostRequest(
  requestUrl: string,
  payload: any,
  token?: string
): Promise<any> {
  try {
    const config: AxiosRequestConfig = token
      ? {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      : {
          headers: { "Content-Type": "application/json" },
        };

    console.log(`Sending POST request to: ${requestUrl}`);
    const response: AxiosResponse = await axios.post(
      requestUrl,
      payload,
      config
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `POST request failed with status code: ${response.status}`
      );
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = `POST request failed: ${error.message}`;
    core.setFailed(`POST request to ${requestUrl} failed: ${error.message}`);
    if (error.response) {
      core.setFailed(`Response Status: ${error.response.status}`);
      core.setFailed(`Response Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

async function run() {
  try {
    let consoleId: string | null = null;
    let web_app: any = null;

    let domain_name: string | null = core.getInput("domain_name", { required: false }) || "none";
    const username: string = core.getInput("username", { required: true });
    const api_token: string = core.getInput("api_token", { required: true });
    const host: string = core.getInput("host", { required: true });

    const baseApiUrl: string = `https://${host}/api/v0/user/${username}`;

    // CONSOLE SETUP
    const baseConsoleUrl: string = `${baseApiUrl}/consoles/`;
    const consoleListData = await performGetRequest(baseConsoleUrl, api_token);
    if (Array.isArray(consoleListData) && consoleListData.length > 0) {
      const _console = consoleListData.pop();
      consoleId = _console.id;
    } else {
      const _console = await performPostRequest(baseConsoleUrl, { executable: "bash" }, api_token);
      consoleId = _console.id;
      core.setFailed(`Console created. Please start your terminal: https://${host}/user/${username}/consoles/${consoleId}/`);
      return;
    }

    if (!consoleId) {
      core.setFailed("Console ID could not be retrieved or created.");
      return;
    }

    // WEBAPP SETUP
    const baseWebAppUrl: string = `${baseApiUrl}/webapps/`;
    const webappListData = await performGetRequest(baseWebAppUrl, api_token);

    if (Array.isArray(webappListData) && webappListData.length > 0) {
      web_app = domain_name 
        ? webappListData.find((webapp: any) => webapp.domain_name === domain_name) 
        : webappListData[0];
      
        if (!web_app) {
          core.setFailed(`No matching web application found for domain: ${domain_name}`);
          return;
        }
      } else {
        core.setFailed("No web applications found.");
        return;
      }
      
    domain_name = web_app.domain_name
    const virtual_env = web_app.virtualenv_path;
    const source_directory = web_app.source_directory;

    const consoleRequestUrl: string = `${baseApiUrl}/consoles/${consoleId}/send_input/`;
    await postConsoleInput(consoleRequestUrl, api_token, `source ${virtual_env}/bin/activate`, "Virtual Environment Activated.");
    await postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${source_directory}/requirements.txt`, "Requirements Installed.");
    await postConsoleInput(consoleRequestUrl, api_token, `python ${source_directory}/manage.py migrate`, "Database Migrated.");

    const reloadUrl: string = `${baseApiUrl}/webapps/${domain_name}/reload/`;
    await performPostRequest(reloadUrl, {}, api_token);

    console.log(`Web application reloaded successfully.`);
  } catch (error) {
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}

run();
