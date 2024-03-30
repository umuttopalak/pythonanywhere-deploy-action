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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const host = core.getInput("host");
            const username = core.getInput("username");
            const api_token = core.getInput("api_token");
            const domain_name = core.getInput("domain_name");
            const console_id = core.getInput("console_id");
            console.log("Running `git pull`.");
            const console_url = `https://${host}/api/v0/user/{username}/consoles/${console_id}/send_input/`;
            let payload = { input: "git pull\n" };
            let response = yield axios_1.default.post(console_url, payload, {
                headers: { Authorization: `Token ${api_token}` },
            });
            console.log("Success.");
            console.log("Running `pip install -r requirements.txt`.");
            payload = { input: "pip install -r requirements.txt\n" };
            response = yield axios_1.default.post(console_url, payload, {
                headers: { Authorization: `Token ${api_token}` },
            });
            console.log("Success.");
            console.log("Running `python manage.py migrate`.");
            payload = { input: "python manage.py migrate\n" };
            response = yield axios_1.default.post(console_url, payload, {
                headers: { Authorization: `Token ${api_token}` },
            });
            console.log("Success.");
            console.log("Reloading webapp.");
            const url = `https://${host}/api/v0/user/${username}/webapps/${domain_name}/reload/"`;
            response = yield axios_1.default.post(url, null, {
                headers: { Authorization: `Token ${api_token}` },
            });
            console.log("Reloaded webapp successfully.");
        }
        catch (error) {
            core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
        }
    });
}
run();
