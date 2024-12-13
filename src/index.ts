import * as core from "@actions/core";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

let host = "www.pythonanywhere.com";
let username = "umuttopalak";
let api_token = "5387ff39f9a03be3e31c47f7ffbf4d8db153008d";
let domain_name = "umuttopalak.pythonanywhere.com";

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
    const response: AxiosResponse = await axios.post(consoleRequestUrl, payload, config);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed with status code: ${response.status}`);
    }

    console.log(successMsg);
  } catch (error: any) {
    throw new Error(`${error.response.data.error}`);
  }
}

/**
 * performGetRequest
 * -----------------
 *
 * @param requestUrl
 * @param token
 * @returns response.data
 */
async function performGetRequest(requestUrl: string, token: string): Promise<any> {
  try {
    const config: AxiosRequestConfig = token
      ? {
          headers: { Authorization: `Token ${token}` },
        }
      : {};

    console.log(`Sending GET request to: ${requestUrl}`);
    const response: AxiosResponse = await axios.get(requestUrl, config);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`GET request failed with status code: ${response.status}`);
    }

    return response.data;
  } catch (error: any) {
    throw new Error(`Error in GET request: ${error.message}`);
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
async function performPostRequest(requestUrl: string, payload: any, token?: string): Promise<any> {
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
    const response: AxiosResponse = await axios.post(requestUrl, payload, config);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`POST request failed with status code: ${response.status}`);
    }

    return response.data;
  } catch (error: any) {
    throw new Error(`POST request to ${requestUrl} failed: ${error.message}`);
  }
}

async function setupConsole(baseConsoleUrl: string, api_token: string): Promise<any> {
  try {
    const consoleListData = await performGetRequest(baseConsoleUrl, api_token);
    if (Array.isArray(consoleListData) && consoleListData.length > 0) {
      const _console = consoleListData.pop();
      return _console;
    } else {
      const _console = await performPostRequest(baseConsoleUrl, { executable: "bash" }, api_token);
      return _console;
    }
  } catch (error: any) {
    throw new Error(`Failed to setup console: ${error.message}`);
  }
}

async function setupWebApp(baseWebAppUrl: string, api_token: string, domain_name: string | null): Promise<any> {
  try {
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
      throw new Error("No web applications found. Check your application or account details!");
    }
  } catch (error: any) {
    throw new Error(`Failed to setup web app: ${error.message}`);
  }
}

async function run() {
  try {
    const baseApiUrl = `https://${host}/api/v0/user/${username}`;
    const baseConsoleUrl = `${baseApiUrl}/consoles/`;
    const baseWebAppUrl = `${baseApiUrl}/webapps/`;

    // Console Setup
    let _console = await setupConsole(baseConsoleUrl, api_token);
    const consoleId = _console.id;

    // WebApp Setup
    let web_app = await setupWebApp(baseWebAppUrl, api_token, domain_name);

    // Virtual Environment and Database Setup
    const consoleRequestUrl = `${baseApiUrl}/consoles/${consoleId}/send_input/`;

    try {
      await postConsoleInput(consoleRequestUrl, api_token, `source ${web_app.virtualenv_path}/bin/activate`, "Virtual Environment Activated.");
      await postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${web_app.source_directory}/requirements.txt`, "Requirements Installed.");
      await postConsoleInput(consoleRequestUrl, api_token, `python ${web_app.source_directory}/manage.py migrate`, "Database Migrated.");
    } catch (error: any) {
      if (error.message.includes("Console not yet started")) {
        const consoleUrl = _console.console_url;
        throw new Error(`Activate your terminal: ${host}${consoleUrl}`);
      } else {
        throw new Error(`Error during console commands: ${error.message}`);
      }
    }

    // WebApp Reload
    const reloadUrl = `${baseApiUrl}/webapps/${web_app.domain_name}/reload/`;
    await performPostRequest(reloadUrl, {}, api_token);

    core.info("Web application reloaded successfully.");
  } catch (error: any) {
    core.setFailed(`${error.message}`);
  }
}

run();
