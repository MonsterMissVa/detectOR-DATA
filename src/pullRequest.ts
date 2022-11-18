import type { Octokit } from '@octokit/core';
import type { PullRequestReviewThread, Query } from '@octokit/graphql-schema';
import type { components } from '@octokit/openapi-types/types';
import type { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
import type { ESLint, Rule } from 'eslint';
import {
  endGroup,
  error,
  getBooleanInput,
  info,
  notice,
  startGroup,
} from '@actions/core';
import { getIndexedModifiedLines } from './getIndexedModifiedLines';
import { getOctokit } from './getOctokit';

type ReviewSuggestion = {
  start_side?: 'RIGHT';
  start_line?: number;
  side: 'RIGHT';
  line: number;
  body: string;
};

type ReviewComment = ReviewSuggestion & { path: string };

const REVIEW_BODY = "ESLint doesn't pass. Please fix all ESLint issues.";

export async function getPullRequestFiles(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  octokit: Octokit & Api,
) {
  const response = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullRequestNumber,
  });
  info(`Files: (${response.data.length})`);
  return response.data;
}

export async function getReviewComments(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  octokit: Octokit & Api,
) {
  const reviews = await octokit.rest.pulls.listReviews({