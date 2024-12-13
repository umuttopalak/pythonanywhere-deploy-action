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
            const errorMessage = `Error sending command "${input}": ${error.message}`;
            core.setFailed(errorMessage);
            if (error.response) {
                core.setFailed(`Response Status: ${error.response.status}`);
                core.setFailed(`Response Data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    });
}
/**
 * performGetRequest
 * -----------------
 *
 * @param requestUrl  GET isteği atılacak URL
 * @param token
 * @returns           response.data
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
            const errorMessage = `Error in GET request: ${error.message}`;
            core.setFailed(errorMessage);
            if (error.response) {
                core.setFailed(`Response Status: ${error.response.status}`);
                core.setFailed(`Response Data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
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
            const errorMessage = `POST request failed: ${error.message}`;
            core.setFailed(`POST request to ${requestUrl} failed: ${error.message}`);
            if (error.response) {
                core.setFailed(`Response Status: ${error.response.status}`);
                core.setFailed(`Response Data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let consoleId = null;
            let web_app = null;
            let domain_name = core.getInput("domain_name", { required: false }) || "none";
            const username = core.getInput("username", { required: true });
            const api_token = core.getInput("api_token", { required: true });
            const host = core.getInput("host", { required: true });
            const baseApiUrl = `https://${host}/api/v0/user/${username}`;
            // CONSOLE SETUP
            const baseConsoleUrl = `${baseApiUrl}/consoles/`;
            const consoleListData = yield performGetRequest(baseConsoleUrl, api_token);
            if (Array.isArray(consoleListData) && consoleListData.length > 0) {
                const _console = consoleListData.pop();
                consoleId = _console.id;
            }
            else {
                const _console = yield performPostRequest(baseConsoleUrl, { executable: "bash" }, api_token);
                consoleId = _console.id;
                core.setFailed(`Console created. Please start your terminal: https://${host}/user/${username}/consoles/${consoleId}/`);
                return;
            }
            if (!consoleId) {
                core.setFailed("Console ID could not be retrieved or created.");
                return;
            }
            // WEBAPP SETUP
            const baseWebAppUrl = `${baseApiUrl}/webapps/`;
            const webappListData = yield performGetRequest(baseWebAppUrl, api_token);
            if (Array.isArray(webappListData) && webappListData.length > 0) {
                web_app = domain_name
                    ? webappListData.find((webapp) => webapp.domain_name === domain_name)
                    : webappListData[0];
                if (!web_app) {
                    core.setFailed(`No matching web application found for domain: ${domain_name}`);
                    return;
                }
            }
            else {
                core.setFailed("No web applications found.");
                return;
            }
            domain_name = web_app.domain_name;
            const virtual_env = web_app.virtualenv_path;
            const source_directory = web_app.source_directory;
            const consoleRequestUrl = `${baseApiUrl}/consoles/${consoleId}/send_input/`;
            yield postConsoleInput(consoleRequestUrl, api_token, `source ${virtual_env}/bin/activate`, "Virtual Environment Activated.");
            yield postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${source_directory}/requirements.txt`, "Requirements Installed.");
            yield postConsoleInput(consoleRequestUrl, api_token, `python ${source_directory}/manage.py migrate`, "Database Migrated.");
            const reloadUrl = `${baseApiUrl}/webapps/${domain_name}/reload/`;
            yield performPostRequest(reloadUrl, {}, api_token);
            console.log(`Web application reloaded successfully.`);
        }
        catch (error) {
            core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
        }
    });
}
run();
