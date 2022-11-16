import { getInput } from '@actions/core';
import { GitHub, getOctokitOptions } from '@actions/github/lib/utils';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';

export function getOctokit() {
  const githubToken = getInput('github-token');
  const Octokit = GitHub.plugin(throttling, retry);
  const octokit = new Octokit(
    getOctokitOptions(githubToken, {
      throttle: {
        onRateLimit: (
          retryAfter: number,
          options: {
            method: string;
            url: string;
            request: { retryCount: number };
          },