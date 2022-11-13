import type { ESLint, Rule } from 'eslint';
import path from 'node:path';
import {
  endGroup,
  error,
  getBooleanInput,
  info,
  notice,
  startGroup,
  warning,
} from '@actions/core';
import { DEFAULT_WORKING_DIRECTORY } from './changeDirectory';

export async function handleCommit(
  eventName: string,
  results: ESLint.LintResult[],
  ruleMetaDatas: {
    [name: string]: Rule.RuleMetaData;
  },
) {
  const failCheck = getBooleanInput('fail-check');

  startGroup(`GitHub ${eventName}`);
  let warningCounter = 0;
  let errorCounter = 0;

  for (const result of results) {
    const relativePath = path.relative(
      DEFAULT_WORKING_DIRECTORY,
      result.filePath,
    );
    for (const message of result.messages) {
      if (message.ruleId === null || result.source === undefined) {
        continue;
      }
      const rule = ruleMetaDatas