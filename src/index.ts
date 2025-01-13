import * as core from "@actions/core";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * getLatestConsoleOutput
 * ----------------
 * @param baseApiUrl
 * @param consoleId
 * @param token
 * @param successMsg
 * @returns 
 */
async function getLatestConsoleOutput(
  baseApiUrl: string,
  consoleId: string,
  token: string,
  successMsg: string
): Promise<object> {
  try {
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Token ${token}`,
      },
    };
    const consoleOutputUrl = `${baseApiUrl}/consoles/${consoleId}/get_latest_output/`;
    const response: AxiosResponse = await axios.get(consoleOutputUrl, config);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed with status code: ${response.status}`);
    }
    return response.data
    console.log(successMsg);
  } catch (error: any) {
    throw new Error(`${error.response.data.error}`);
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

async function parseAndCheckAlembic(response: any, source_directory: string): Promise<boolean> {
  try {
    const output: string = response.output;

    if (!output) {
      console.log("No output found in the response.");
      return false;
    }

    const lines = output.split("\r\n").filter((line) => line.trim() !== "");

    const alembicFound = lines.some((line) => line.includes("****"));

    if (alembicFound) {
      console.log("Alembic found!");
      return true;
    } else {
      console.log("Alembic not found!");
      return false;
    }
  } catch (error: any) {
    console.error(`Error during Alembic check: ${error.message}`);
    return false;
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
    const username = core.getInput("username", { required: true });
    const api_token = core.getInput("api_token", { required: true });
    const host = core.getInput("host", { required: true });
    const domain_name = core.getInput("domain_name", { required: false }) || null;
    const framework_type = core.getInput("framework_type", { required: false}) || "flask";
    
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

    // Git Pull 
    try{
      await postConsoleInput(consoleRequestUrl, api_token, `git -C ${web_app.source_directory} pull\n`, "Repository Pulled.");
    } catch (error: any) {
      if (error.message.includes("Console not yet started")) {
        const consoleUrl = _console.console_url;
        throw new Error(`Activate your terminal: ${host}${consoleUrl}`);
      } else {
        throw new Error(`Error during pulling repository: ${error.message}`);
      }
    }

    if (framework_type == 'django') {
      try {
        await postConsoleInput(consoleRequestUrl, api_token, `source ${web_app.virtualenv_path}/bin/activate\n`, "Virtual Environment Activated.");
        await postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${web_app.source_directory}/requirements.txt\n`, "Requirements Installed.");
        await postConsoleInput(consoleRequestUrl, api_token, `python ${web_app.source_directory}/manage.py migrate\n`, "Database Migrated.");
      } catch (error: any) {
        if (error.message.includes("Console not yet started")) {
          const consoleUrl = _console.console_url;
          throw new Error(`Activate your terminal: ${host}${consoleUrl}`);
        } else {
          throw new Error(`Error during console commands: ${error.message}`);
        }
      }
    }

    else if (framework_type == 'flask') {
      try {
        const alembicIniPath = `${web_app.source_directory}/alembic.ini`;
        await postConsoleInput(consoleRequestUrl, api_token, `find ${web_app.source_directory} -type f -name "alembic.ini" -print\n`, "Alembic configuration check completed.");
        const alembicResponse = await getLatestConsoleOutput(baseApiUrl, consoleId, api_token, "Alembic.ini Checking.") as unknown as string;
        const isAlembicUsing = await parseAndCheckAlembic(alembicResponse, web_app.source_directory);

        await postConsoleInput(consoleRequestUrl, api_token, `source ${web_app.virtualenv_path}/bin/activate\n`, "Virtual Environment Activated.");
        await postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${web_app.source_directory}/requirements.txt\n`, "Requirements Installed.");
        
        if (isAlembicUsing) {
          console.log("Alembic migration starting...");
          await postConsoleInput(consoleRequestUrl, api_token, `alembic upgrade head\n`, "Alembic migrations applied.");
        } 
        
      } catch (error: any) {
        if (error.message.includes("Console not yet started")) {
          const consoleUrl = _console.console_url;
          throw new Error(`Activate your terminal: ${host}${consoleUrl}`);
        } else {
          throw new Error(`Error during Flask console commands: ${error.message}`);
        }
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
