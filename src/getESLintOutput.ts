import type { ESLint } from 'eslint';
import { getInput } from '@actions/core';
import { getExecOutput } from '@actions/exec';
import { sync } from 'glob';

export async function getESLintOutput(eslintBinPath: string) {
  const targets = getInput('targets');
  const eslintOutput = await getExecOutput(eslintBinPath, [
    ...sync(targets),
    '--no-error-on-unmatched-pattern',
    '--for