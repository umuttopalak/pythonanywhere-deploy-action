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
): Promise<{ output: string }> {
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
    return response.data;
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

async function parseAndCheckAlembic(response: any, source_directory: string): Promise<{exists: boolean, path?: string}> {
  try {
    const output: string = response.output;

    if (!output) {
      console.log("No output found in the response.");
      return { exists: false };
    }

    const lines = output.split(/\r?\n/).filter((line) => line.trim() !== "");
    const alembicIniPath = lines.find((line) => line.includes("alembic.ini"));

    if (alembicIniPath) {
      console.log("Alembic configuration found!");
      return { exists: true, path: alembicIniPath.trim() };
    } else {
      console.log("Alembic configuration not found, skipping migrations");
      return { exists: false };
    }
  } catch (error: any) {
    console.error(`Error during Alembic check: ${error.message}`);
    return { exists: false };
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

async function checkGitPullOutput(response: any): Promise<{success: boolean, error?: string}> {
  try {
    const output: string = response.output;
    
    if (!output) {
      return { success: true };
    }

    const lines = output.split(/\r?\n/).filter((line) => line.trim() !== "");
    
    if (lines.some(line => line.includes("Already up to date"))) {
      console.log("Repository is already up to date");
      return { success: true };
    }
    
    const hasLocalChanges = lines.some(line => 
      line.includes("Your local changes to the following files would be overwritten by merge"));
    
    const hasUntrackedFiles = lines.some(line => 
      line.includes("untracked working tree files would be overwritten by merge"));
    
    const hasError = lines.some(line => line.startsWith("error:"));

    if (hasLocalChanges) {
      return {
        success: false,
        error: "local_changes"
      };
    } else if (hasUntrackedFiles) {
      return {
        success: false,
        error: "untracked_files"
      };
    } else if (hasError) {
      return {
        success: false,
        error: "git_error"
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error(`Error during Git pull check: ${error.message}`);
    return { success: false, error: "unknown" };
  }
}

async function run() {
  try {
    const username = core.getInput("username", { required: true });
    const api_token = core.getInput("api_token", { required: true });
    const host = core.getInput("host", { required: true });
    const domain_name = core.getInput("domain_name", { required: false }) || null;
    const framework_type = core.getInput("framework_type", { required: false}) || "django";
    
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
    try {
      await postConsoleInput(consoleRequestUrl, api_token, `git -C ${web_app.source_directory} pull\n`, "Checking repository status...");
      const pullResponse = await getLatestConsoleOutput(baseApiUrl, consoleId, api_token, "Git pull completed");
      const pullCheck = await checkGitPullOutput(pullResponse);

      if (!pullCheck.success) {
        switch(pullCheck.error) {
          case "local_changes":
            console.error(
              `Git pull failed: Local changes detected in ${web_app.source_directory}. \n` +
              "Please either: \n1) Commit changes (git add . && git commit -m 'message'), \n" +
              "2) Stash them (git stash), or \n" +
              "3) Remove them (git reset --hard origin/main)\n"
            );
            throw new Error("Git pull failed due to local changes");
          case "untracked_files":
            console.error(
              `Git pull failed: Untracked files detected in ${web_app.source_directory}. ` +
              "Please either: 1) Add files (git add .) or " +
              "2) Remove them (git clean -f)"
            );
            throw new Error("Git pull failed due to untracked files");
          case "git_error":
          default:
            console.error("Git pull failed. Please check your repository configuration and try again.");
            throw new Error("Git pull failed");
        }
      }
      
      console.log("Repository updated successfully.");
    } catch (error: any) {
      if (error.message.includes("Console not yet started")) {
        const consoleUrl = _console.console_url;
        throw new Error(`Activate your terminal: ${host}${consoleUrl}`);
      } else {
        throw error;
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
        await postConsoleInput(consoleRequestUrl, api_token, `source ${web_app.virtualenv_path}/bin/activate\n`, "Virtual Environment Activated.");
        await postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${web_app.source_directory}/requirements.txt\n`, "Requirements Installed.");
        
        await postConsoleInput(consoleRequestUrl, api_token, `find ${web_app.source_directory} -type f -name "alembic.ini" -print\n`, "Checking for alembic.ini");
        const alembicResponse = await getLatestConsoleOutput(baseApiUrl, consoleId, api_token, "Alembic check completed");
        const alembicCheck = await parseAndCheckAlembic(alembicResponse, web_app.source_directory);

        if (alembicCheck.exists && alembicCheck.path) {
          try {
            console.log("Alembic configuration found, running migrations...");
            await postConsoleInput(
              consoleRequestUrl, 
              api_token, 
              `cd $(dirname $(find ${web_app.source_directory} -type f -name "alembic.ini" -print -quit)) && alembic upgrade head\n`, 
              "Checking alembic status"
            );
            const alembicUpgradeResponse = await getLatestConsoleOutput(baseApiUrl, consoleId, api_token, "");
            
            if (alembicUpgradeResponse.output && alembicUpgradeResponse.output.includes("FAILED")) {
              console.error("Alembic migration failed. Please check your alembic configuration.");
              console.error(alembicUpgradeResponse.output);
            } else {
              console.log("Alembic migrations completed successfully");
            }
          } catch (error: any) {
            console.error(`Error during alembic migration: ${error.message}`);
          }
        } else {
          console.log("No Alembic configuration found, skipping migrations");
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
