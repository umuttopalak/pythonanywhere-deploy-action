import * as core from "@actions/core";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * Custom CustomError Class
 */
class CustomError extends Error {
  public statusCode: number;
  public details?: any;
  public hints?: any;

  constructor(message: string, statusCode: number = 500, details?: any, hints?: any) {
    super(message);
    this.name = "CustomError";
    this.statusCode = statusCode;
    this.details = details;
    this.hints = hints;

    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

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
      throw new CustomError(`Request failed with status code: ${response.status}`, response.status);
    }

    console.log(successMsg);
  } catch (error: any) {
    throw new CustomError(`Error sending command "${input}": ${error.message}`, 500, {
      response: error.response?.data,
    });
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
      throw new CustomError(`GET request failed with status code: ${response.status}`, response.status);
    }

    return response.data;
  } catch (error: any) {
    throw new CustomError(`Error in GET request: ${error.message}`, 500, {
      response: error.response?.data,
    });
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
      throw new CustomError(`POST request failed with status code: ${response.status}`, response.status);
    }

    return response.data;
  } catch (error: any) {
    throw new CustomError(`POST request to ${requestUrl} failed`, 500, {
      message: error.message,
      response: error.response?.data,
    });
  }
}

async function setupConsole(baseConsoleUrl: string, api_token: string): Promise<any> {
  const consoleListData = await performGetRequest(baseConsoleUrl, api_token);
  if (Array.isArray(consoleListData) && consoleListData.length > 0) {
    const _console = consoleListData.pop();
    return _console;
  } else {
    const _console = await performPostRequest(baseConsoleUrl, { executable: "bash" }, api_token);
    return _console;
  }
}

async function setupWebApp(baseWebAppUrl: string, api_token: string, domain_name: string | null): Promise<any> {
  const webappListData = await performGetRequest(baseWebAppUrl, api_token);
  if (Array.isArray(webappListData) && webappListData.length > 0) {
    const web_app = domain_name
      ? webappListData.find((webapp: any) => webapp.domain_name === domain_name)
      : webappListData[0];
    if (!web_app) {
      throw new CustomError(`No matching web application found for domain: ${domain_name}`, 404, `Given domain_name not found in your applications!`);
    }
    return web_app;
  } else {
    throw new CustomError("No web applications found.", 404, `Check your application or account details!`);
  }
}

async function run() {
  try {
    const username = core.getInput("username", { required: true });
    const api_token = core.getInput("api_token", { required: true });
    const host = core.getInput("host", { required: true });
    const domain_name = core.getInput("domain_name", { required: false }) || null;

    const baseApiUrl = `https://${host}/api/v0/user/${username}`;
    const baseConsoleUrl = `${baseApiUrl}/consoles/`;
    const baseWebAppUrl = `${baseApiUrl}/webapps/`;

    // Console Setup
    let _console = await setupConsole(baseConsoleUrl, api_token);
    const consoleId = _console.id

    // WebApp Setup
    let web_app = await setupWebApp(baseWebAppUrl, api_token, domain_name);

    // Virtual Environment and Database Setup
    const consoleRequestUrl = `${baseApiUrl}/consoles/${consoleId}/send_input/`;

    try {
      await postConsoleInput(consoleRequestUrl, api_token, `source ${web_app.virtualenv_path}/bin/activate`, "Virtual Environment Activated.");
      await postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${web_app.source_directory}/requirements.txt`, "Requirements Installed.");
      await postConsoleInput(consoleRequestUrl, api_token, `python ${web_app.source_directory}/manage.py migrate`, "Database Migrated.");
    } catch (error: any) {
      if (error instanceof CustomError) {
        if (error.details?.error?.includes("Console not yet started")) {
          const consoleUrl = _console.console_url
          core.setFailed(`Console not yet started. Please load it in a browser first: ${consoleUrl}`);
        } else {
          core.setFailed(`CustomError: ${error.message}`);
        }
      } else {
        throw error;
      }
    }

    // WebApp Reload
    const reloadUrl = `${baseApiUrl}/webapps/${web_app.domain_name}/reload/`;
    await performPostRequest(reloadUrl, {}, api_token);

    core.info("Web application reloaded successfully.");
  } catch (error: any) {
    if (error instanceof CustomError) {
      core.setFailed(`CustomError: ${error.message} (Status Code: ${error.statusCode})`);
      if (error.details) {
        core.setFailed(`Details: ${JSON.stringify(error.details)}`);
      }
      if (error.hints) {
        core.setFailed(`Hints: ${JSON.stringify(error.hints)}`);
      }
    } else if (error instanceof Error) {
      core.setFailed(`General Error: ${error.message}`);
    } else {
      core.setFailed("An unknown error occurred.");
    }
  }
}
run();
