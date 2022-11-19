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
    owner,
    repo,
    pull_number: pullRequestNumber,
  });
  const reviewComments = await octokit.rest.pulls.listReviewComments({
    owner,
    repo,
    pull_number: pullRequestNumber,
  });
  const relevantReviews = reviews.data.filter(
    (review) => review.user?.id === 41898282 && review.body === REVIEW_BODY,
  );
  const relevantReviewIds = relevantReviews.map((review) => review.id);
  const relevantReviewComments = reviewComments.data.filter(
    (reviewComment) =>
      reviewComment.user.id === 41898282 &&
      reviewComment.pull_request_review_id !== null &&
      relevantReviewIds.includes(reviewComment.pull_request_review_id),
  );
  info(`Existing review comments: (${relevantReviewComments.length})`);
  return relevantReviewComments;
}

export async function getReviewThreads(
  owner: string,
  repo: string,
  pullRequestNumber: number,
  octokit: Octokit & Api,
) {
  const commentNodeIdToReviewThreadMapping: {
    [id: string]: PullRequestReviewThread;
  } = {};
  const queryData = await octokit.graphql<Query>(
    `
      query ($owner: String!, $repo: String!, $pullRequestNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $pullRequestNumber) {
            reviewThreads(last: 100) {
              totalCount
              nodes {
                id
                isResolved
                comments(last: 100) {
                  totalCount
                  nodes {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `,
    {
      owner,
      repo,
      pullRequestNumber,