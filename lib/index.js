"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const axios_1 = __importDefault(require("axios"));
/**
 * getLatestConsoleOutput
 * ----------------
 * @param baseApiUrl
 * @param consoleId
 * @param token
 * @param successMsg
 * @returns
 */
function getLatestConsoleOutput(baseApiUrl, consoleId, token, successMsg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = {
                headers: {
                    Authorization: `Token ${token}`,
                },
            };
            const consoleOutputUrl = `${baseApiUrl}/consoles/${consoleId}/get_latest_output/`;
            const response = yield axios_1.default.get(consoleOutputUrl, config);
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`Request failed with status code: ${response.status}`);
            }
            return response.data;
            console.log(successMsg);
        }
        catch (error) {
            throw new Error(`${error.response.data.error}`);
        }
    });
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
function postConsoleInput(consoleRequestUrl, token, input, successMsg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payload = { input: `${input}\n` };
            const config = {
                headers: {
                    Authorization: `Token ${token}`,
                },
            };
            console.log(`Running command: ${input}`);
            const response = yield axios_1.default.post(consoleRequestUrl, payload, config);
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`Request failed with status code: ${response.status}`);
            }
            console.log(successMsg);
        }
        catch (error) {
            throw new Error(`${error.response.data.error}`);
        }
    });
}
/**
 * performGetRequest
 * -----------------
 *
 * @param requestUrl
 * @param token
 * @returns response.data
 */
function performGetRequest(requestUrl, token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = token
                ? {
                    headers: { Authorization: `Token ${token}` },
                }
                : {};
            console.log(`Sending GET request to: ${requestUrl}`);
            const response = yield axios_1.default.get(requestUrl, config);
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`GET request failed with status code: ${response.status}`);
            }
            return response.data;
        }
        catch (error) {
            throw new Error(`Error in GET request: ${error.message}`);
        }
    });
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
function performPostRequest(requestUrl, payload, token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = token
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
            const response = yield axios_1.default.post(requestUrl, payload, config);
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`POST request failed with status code: ${response.status}`);
            }
            return response.data;
        }
        catch (error) {
            throw new Error(`POST request to ${requestUrl} failed: ${error.message}`);
        }
    });
}
function parseAndCheckAlembic(response, source_directory) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const output = response.output;
            if (!output) {
                console.log("No output found in the response.");
                return { exists: false };
            }
            const lines = output.split(/\r?\n/).filter((line) => line.trim() !== "");
            const alembicIniPath = lines.find((line) => line.includes("alembic.ini"));
            if (alembicIniPath) {
                console.log("Alembic configuration found!");
                return { exists: true, path: alembicIniPath.trim() };
            }
            else {
                console.log("Alembic configuration not found, skipping migrations");
                return { exists: false };
            }
        }
        catch (error) {
            console.error(`Error during Alembic check: ${error.message}`);
            return { exists: false };
        }
    });
}
function setupConsole(baseConsoleUrl, api_token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const consoleListData = yield performGetRequest(baseConsoleUrl, api_token);
            if (Array.isArray(consoleListData) && consoleListData.length > 0) {
                const validConsole = consoleListData.find(console => console.executable === "bash" || console.executable === "sh");
                if (validConsole) {
                    return validConsole;
                }
            }
            const newConsole = yield performPostRequest(baseConsoleUrl, { executable: "bash" }, api_token);
            return newConsole;
        }
        catch (error) {
            throw new Error(`Failed to setup console: ${error.message}`);
        }
    });
}
function setupWebApp(baseWebAppUrl, api_token, domain_name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const webappListData = yield performGetRequest(baseWebAppUrl, api_token);
            if (Array.isArray(webappListData) && webappListData.length > 0) {
                const web_app = domain_name
                    ? webappListData.find((webapp) => webapp.domain_name === domain_name)
                    : webappListData[0];
                if (!web_app) {
                    throw new Error(`No matching web application found for domain: ${domain_name}`);
                }
                return web_app;
            }
            else {
                throw new Error("No web applications found. Check your application or account details!");
            }
        }
        catch (error) {
            throw new Error(`Failed to setup web app: ${error.message}`);
        }
    });
}
function checkGitPullOutput(response) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const output = response.output;
            if (!output) {
                return { success: true };
            }
            const lines = output.split(/\r?\n/).filter((line) => line.trim() !== "");
            if (lines.some(line => line.includes("Already up to date"))) {
                console.log("Repository is already up to date");
                return { success: true };
            }
            const hasLocalChanges = lines.some(line => line.includes("Your local changes to the following files would be overwritten by merge"));
            const hasUntrackedFiles = lines.some(line => line.includes("untracked working tree files would be overwritten by merge"));
            const hasError = lines.some(line => line.startsWith("error:"));
            if (hasLocalChanges) {
                return {
                    success: false,
                    error: "local_changes"
                };
            }
            else if (hasUntrackedFiles) {
                return {
                    success: false,
                    error: "untracked_files"
                };
            }
            else if (hasError) {
                return {
                    success: false,
                    error: "git_error"
                };
            }
            return { success: true };
        }
        catch (error) {
            console.error(`Error during Git pull check: ${error.message}`);
            return { success: false, error: "unknown" };
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const username = core.getInput("username", { required: true });
            const api_token = core.getInput("api_token", { required: true });
            const host = core.getInput("host", { required: true });
            const domain_name = core.getInput("domain_name", { required: false }) || null;
            const framework_type = core.getInput("framework_type", { required: false }) || "django";
            const baseApiUrl = `https://${host}/api/v0/user/${username}`;
            const baseConsoleUrl = `${baseApiUrl}/consoles/`;
            const baseWebAppUrl = `${baseApiUrl}/webapps/`;
            // Console Setup
            let _console = yield setupConsole(baseConsoleUrl, api_token);
            const consoleId = _console.id;
            // WebApp Setup
            let web_app = yield setupWebApp(baseWebAppUrl, api_token, domain_name);
            // Virtual Environment and Database Setup
            const consoleRequestUrl = `${baseApiUrl}/consoles/${consoleId}/send_input/`;
            // Git Pull 
            try {
                yield postConsoleInput(consoleRequestUrl, api_token, `git -C ${web_app.source_directory} pull\n`, "Checking repository status...");
                const pullResponse = yield getLatestConsoleOutput(baseApiUrl, consoleId, api_token, "Git pull completed");
                const pullCheck = yield checkGitPullOutput(pullResponse);
                if (!pullCheck.success) {
                    switch (pullCheck.error) {
                        case "local_changes":
                            console.error(`Git pull failed: Local changes detected in ${web_app.source_directory}. \n` +
                                "Please either: \n1) Commit changes (git add . && git commit -m 'message'), \n" +
                                "2) Stash them (git stash), or \n" +
                                "3) Remove them (git reset --hard origin/main)\n");
                            throw new Error("Git pull failed due to local changes");
                        case "untracked_files":
                            console.error(`Git pull failed: Untracked files detected in ${web_app.source_directory}. ` +
                                "Please either: 1) Add files (git add .) or " +
                                "2) Remove them (git clean -f)");
                            throw new Error("Git pull failed due to untracked files");
                        case "git_error":
                        default:
                            console.error("Git pull failed. Please check your repository configuration and try again.");
                            throw new Error("Git pull failed");
                    }
                }
                console.log("Repository updated successfully.");
            }
            catch (error) {
                if (error.message.includes("Console not yet started")) {
                    const consoleUrl = _console.console_url;
                    throw new Error(`Activate your terminal: ${host}${consoleUrl}`);
                }
                else {
                    throw error;
                }
            }
            if (framework_type == 'django') {
                try {
                    yield postConsoleInput(consoleRequestUrl, api_token, `source ${web_app.virtualenv_path}/bin/activate\n`, "Virtual Environment Activated.");
                    yield postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${web_app.source_directory}/requirements.txt\n`, "Requirements Installed.");
                    yield postConsoleInput(consoleRequestUrl, api_token, `python ${web_app.source_directory}/manage.py migrate\n`, "Database Migrated.");
                }
                catch (error) {
                    if (error.message.includes("Console not yet started")) {
                        const consoleUrl = _console.console_url;
                        throw new Error(`Activate your terminal: ${host}${consoleUrl}`);
                    }
                    else {
                        throw new Error(`Error during console commands: ${error.message}`);
                    }
                }
            }
            else if (framework_type == 'flask') {
                try {
                    yield postConsoleInput(consoleRequestUrl, api_token, `source ${web_app.virtualenv_path}/bin/activate\n`, "Virtual Environment Activated.");
                    yield postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${web_app.source_directory}/requirements.txt\n`, "Requirements Installed.");
                    yield postConsoleInput(consoleRequestUrl, api_token, `find ${web_app.source_directory} -type f -name "alembic.ini" -print\n`, "Checking for alembic.ini");
                    const alembicResponse = yield getLatestConsoleOutput(baseApiUrl, consoleId, api_token, "Alembic check completed");
                    const alembicCheck = yield parseAndCheckAlembic(alembicResponse, web_app.source_directory);
                    if (alembicCheck.exists && alembicCheck.path) {
                        try {
                            console.log("Alembic configuration found, running migrations...");
                            yield postConsoleInput(consoleRequestUrl, api_token, `cd $(dirname $(find ${web_app.source_directory} -type f -name "alembic.ini" -print -quit)) && alembic upgrade head\n`, "Checking alembic status");
                            const alembicUpgradeResponse = yield getLatestConsoleOutput(baseApiUrl, consoleId, api_token, "");
                            if (alembicUpgradeResponse.output && alembicUpgradeResponse.output.includes("FAILED")) {
                                console.error("Alembic migration failed. Please check your alembic configuration.");
                                console.error(alembicUpgradeResponse.output);
                            }
                            else {
                                console.log("Alembic migrations completed successfully");
                            }
                        }
                        catch (error) {
                            console.error(`Error during alembic migration: ${error.message}`);
                        }
                    }
                    else {
                        console.log("No Alembic configuration found, skipping migrations");
                    }
                }
                catch (error) {
                    if (error.message.includes("Console not yet started")) {
                        const consoleUrl = _console.console_url;
                        throw new Error(`Activate your terminal: ${host}${consoleUrl}`);
                    }
                    else {
                        throw new Error(`Error during Flask console commands: ${error.message}`);
                    }
                }
            }
            // WebApp Reload
            const reloadUrl = `${baseApiUrl}/webapps/${web_app.domain_name}/reload/`;
            yield performPostRequest(reloadUrl, {}, api_token);
            core.info("Web application reloaded successfully.");
        }
        catch (error) {
            core.setFailed(`${error.message}`);
        }
    });
}
run();
