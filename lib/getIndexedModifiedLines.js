"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIndexedModifiedLines = void 0;
const core_1 = require("@actions/core");
const HUNK_HEADER_PATTERN = /^@@ -\d+(,\d+)? \+(\d+)(,(\d+))? @@/;
function getIndexedModifiedLines(file) {
    var _a;
    const modifiedLines = [];
    const indexedModifiedLines = {};
    let currentLine = 0;
    let remainingLinesInHunk = 0;
    const lines = (_a = file.patch) === null || _a === void 0 ? void 0 : _a.split('\n');
    if (lines) {
        for (const line of lines) {
            if (remainingLinesInHunk === 0) {
            