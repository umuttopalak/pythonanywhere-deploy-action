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
function setupConsole(baseConsoleUrl, api_token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const consoleListData = yield performGetRequest(baseConsoleUrl, api_token);
            if (Array.isArray(consoleListData) && consoleListData.length > 0) {
                const _console = consoleListData.pop();
                return _console;
            }
            else {
                const _console = yield performPostRequest(baseConsoleUrl, { executable: "bash" }, api_token);
                return _console;
            }
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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
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
            try {
                yield postConsoleInput(consoleRequestUrl, api_token, `source ${web_app.virtualenv_path}/bin/activate`, "Virtual Environment Activated.");
                yield postConsoleInput(consoleRequestUrl, api_token, `pip install -r ${web_app.source_directory}/requirements.txt`, "Requirements Installed.");
                yield postConsoleInput(consoleRequestUrl, api_token, `python ${web_app.source_directory}/manage.py migrate`, "Database Migrated.");
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
