import type { PullRequestEvent } from '@octokit/webhooks-definitions/schema';
import { info } from '@actions/core';
import { context } from '@actions/github';
import { getOctokit } from './getOctokit';

export async function getPullRequestMetadata() {
  const pullRequest = (context.payload as PullRequestEvent).pull_request;
  const owner = context.re