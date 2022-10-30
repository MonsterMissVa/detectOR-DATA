"use strict";
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
exports.run = void 0;
const node_path_1 = __importDefault(require("node:path"));
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const changeDirectory_1 = require("./changeDirectory");
const commit_1 = require("./commit");
const getESLint_1 = require("./getESLint");
const getESLintOutput_1 = require("./getESLintOutput");
const getPullRequestMetadata_1 = require("./getPullRequestMetadata");
const getPushMetadata_1 = require("./getPushMetadata");
const pullRequest_1 = require("./pullRequest");
const push_1 = require("./push");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, core_1.startGroup)('ESLint');
        (0, changeDirectory_1.c