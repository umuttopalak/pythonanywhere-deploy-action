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
 * @param consoleUrl
 * @param token
 * @param input
 * @param successMsg
 */
function postConsoleInput(consoleUrl, token, input, successMsg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payload = { input: `${input}\n` };
            const config = {
                headers: {
                    Authorization: `Token ${token}`,
                },
            };
            console.log(`Running command: ${input}`);
            const response = yield axios_1.default.post(consoleUrl, payload, config);
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`Request failed with status code: ${response.status}`);
            }
            console.log(successMsg);
        }
        catch (error) {
            const errorMessage = `Error sending command "${input}": ${error.message}`;
            core.error(errorMessage);
            if (error.response) {
                core.error(`Response Status: ${error.response.status}`);
                core.error(`Response Data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const host = core.getInput("host", { required: true });
            const username = core.getInput("username", { required: true });
            const api_token = core.getInput("api_token", { required: true });
            const domain_name = core.getInput("domain_name", { required: true });
            const console_id = core.getInput("console_id", { required: true });
            const virtual_env = core.getInput("virtual_env", { required: true });
            const directory = core.getInput("directory", { required: true });
            const baseApiUrl = `https://${host}/api/v0/user/${username}`;
            const consoleUrl = `${baseApiUrl}/consoles/${console_id}/send_input/`;
            const reloadUrl = `${baseApiUrl}/webapps/${domain_name}/reload/`;
            yield postConsoleInput(consoleUrl, api_token, `cd ${directory}`, "Changed directory.");
            yield postConsoleInput(consoleUrl, api_token, `source ${virtual_env}/bin/activate`, "Activated virtual environment.");
            yield postConsoleInput(consoleUrl, api_token, "git pull", "Pulled latest code.");
            yield postConsoleInput(consoleUrl, api_token, "pip install -r requirements.txt", "Installed requirements.");
            yield postConsoleInput(consoleUrl, api_token, "python manage.py migrate", "Database migrated.");
            console.log("Reloading webapp...");
            const reloadResponse = yield axios_1.default.post(reloadUrl, {}, {
                headers: { Authorization: `Token ${api_token}` },
            });
            if (reloadResponse.status < 200 || reloadResponse.status >= 300) {
                throw new Error(`Failed to reload webapp. Status code: ${reloadResponse.status}`);
            }
            console.log("Reloaded webapp successfully.");
        }
        catch (error) {
            core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
        }
    });
}
run();
