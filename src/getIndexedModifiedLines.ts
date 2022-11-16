import type { components } from '@octokit/openapi-types/types';
import { info } from '@actions/core';

const HUNK_HEADER_PATTERN = /^@@ -\d+(,\d+)? \+(\d+)(,(\d+))? @@/;

export function getIndexedModifiedLines(
  file: components['schemas']['diff-entry'],
): {
  [line: string]: true;
} {
  const modifiedLines = [];
  const indexedModifiedLines: { [line: string]: true } = {};
  let currentLine = 0;
  let remainingLinesInHunk = 0;
  const lines = file.patch?.split('\n');
  if (lines) {
    for (const line of lines) {
      if (remaini