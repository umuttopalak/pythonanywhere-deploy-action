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


async function setupConsole(baseConsoleUrl: string, api_token: string, host: string, username: string): Promise<string> {
  const consoleListData = await performGetRequest(baseConsoleUrl, api_token);
  if (Array.isArray(consoleListData) && consoleListData.length > 0) {
    const _console = consoleListData.pop();
    return _console.id;
  } else {
    const _console = await performPostRequest(baseConsoleUrl, { executable: "bash" }, api_token);
    core.setFailed(`Console created. Please start your terminal: ${_console.console_url}`);
    return _console.id;
  }
}

async function setupWebApp(baseWebAppUrl: string, api_token: string, domain_name: string | null): Promise<any> {
  const webappListData = await performGetRequest(baseWebAppUrl, api_token);
  if (Array.isArray(webappListData) && webappListData.length > 0) {
    const web_app = domain_name
      ? webappListData.find((webapp: any) => webapp.domain_name === domain_name)
      : webappListData[0];
    if (!web_app) {
      throw new Error(`No matching web application found for domain: ${domain_name}`);
    }
    return web_app;
  } else {
    throw new Error("No web applications found.");
  }
}


async function run() {
  try {
    const username = core.getInput("username", { required: true });
    const api_token = core.getInput("api_token", { required: true });
    const host = core.getInput("host", { required: true });
    const domain_name = core.getInput("domain_name", { required: false }) || "none";

    if (!username || !api_token || !host) {
      core.setFailed("Required inputs (username, api_token, host) are missing.");
      return;
    }

    const baseApiUrl = `https://${host}/api/v0/user/${username}`;
    const baseConsoleUrl = `${baseApiUrl}/consoles/`;
    const baseWebAppUrl = `${baseApiUrl}/webapps/`;

    // Console Setup
    const consoleId = await setupConsole(baseConsoleUrl, api_token, host, username);
    if (!consoleId) throw new Error("Console ID could not be retrieved or created.");

    // WebApp Setup
    const web_app = await setupWebApp(baseWebAppUrl, api_token, domain_name);

    // Virtual Environment and Database Setup
    const consoleRequestUrl = `${baseApiUrl}/consoles/${consoleId}/send_input/`;
    await postConsoleInput(consoleRequestUrl, api_token, `source ${web_app.virtualenv_path}/bin/activate`, "Virtual Environment Activated.");
    await postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${web_app.source_directory}/requirements.txt`, "Requirements Installed.");
    await postConsoleInput(consoleRequestUrl, api_token, `python ${web_app.source_directory}/manage.py migrate`, "Database Migrated.");

    // WebApp Reload
    const reloadUrl = `${baseApiUrl}/webapps/${web_app.domain_name}/reload/`;
    await performPostRequest(reloadUrl, {}, api_token);

    core.info("Web application reloaded successfully.");
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : "Unknown error occurred.");
  }
}


run();
