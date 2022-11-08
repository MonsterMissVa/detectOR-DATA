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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePush = exports.getPushFiles = void 0;
const core_1 = require("@actions/core");
const getIndexedModifiedLines_1 = require("./getIndexedModifiedLines");
const getOctokit_1 = require("./getOctokit");
function getPushFiles(owner, repo, beforeSha, afterSha, octokit) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield octokit.rest.repos.compareCommitsWithBasehead({
            owner,
            repo,
            baseh