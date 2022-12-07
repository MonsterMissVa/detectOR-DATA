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
    },
  );

  const reviewThreadTotalCount =
    queryData?.repository?.pullRequest?.reviewThreads?.totalCount;
  if (reviewThreadTotalCount !== undefined && reviewThreadTotalCount > 100) {
    error(`There are more than 100 review threads: ${reviewThreadTotalCount}`);
  }

  const reviewThreads =
    queryData?.repository?.pullRequest?.reviewThreads?.nodes;
  if (reviewThreads !== undefined && reviewThreads !== null) {
    for (const reviewThread of reviewThreads) {
      if (reviewThread === null) {
        continue;
      }
      const commentTotalCount = reviewThread?.comments?.totalCount;
      if (commentTotalCount !== undefined && commentTotalCount > 100) {
        error(
          `There are more than 100 review comments in review thread ${reviewThread?.id}: ${commentTotalCount}`,
        );
      }

      const comments = reviewThread?.comments?.nodes;
      if (comments !== undefined && comments !== null) {
        for (const comment of comments) {
          const commentId = comment?.id;
          if (commentId === undefined) {
            continue;
          }
          commentNodeIdToReviewThreadMapping[commentId] = reviewThread;
        }
      }
    }
  }
  return commentNodeIdToReviewThreadMapping;
}

export function getCommentFromFix(source: string, line: number, fix: Rule.Fix) {
  const textRange = source.substring(fix.range[0], fix.range[1]);
  const impactedOriginalLines = textRange.split('\n').length;
  const originalLines = source
    .split('\n')
    .slice(line - 1, line - 1 + impactedOriginalLines);
  const replacedSource =
    source.substring(0, fix.range[0]) +
    fix.text +
    source.substring(fix.range[1]);
  const impactedReplaceLines = fix.text.split('\n').length;
  const replacedLines = replacedSource
    .split('\n')
    .slice(line - 1, line - 1 + impactedReplaceLines);
  info(
    '    Fix:\n' +
      '      ' +
      `@@ -${line},${impactedOriginalLines} +${impactedReplaceLines} @@\n` +
      `${originalLines.map((line) => '      - ' + line).join('\n')}\n` +
      `${replacedLines.map((line) => '      + ' + line).join('\n')}`,
  );
  const reviewSuggestion: ReviewSuggestion = {
    start_side: impactedOriginalLines === 1 ? undefined : 'RIGHT',
    start_line: impactedOriginalLines === 1 ? undefined : line,
    side: 'RIGHT',
    line: line + impactedOriginalLines - 1,
    body: '```suggestion\n' + `${replacedLines.join('\n')}\n` + '```\n',
  };
  return reviewSuggestion;
}

export function matchReviewComments(
  reviewComments: components['schemas']['review-comment'][],
  reviewComment: ReviewComment,
) {
  const matchedNodeIds: string[] = [];
  for (const existingReviewComment of reviewComments) {
    if (
      existingReviewComment.path === reviewComment.path &&
      existingReviewComment.line === reviewComment.line &&
      existingReviewComment.side === reviewComment.side &&
      existingReviewComment.start_line == reviewComment.start_line && // null-undefined comparison
      existingReviewComment.start_side == reviewComment.start_side && // null-undefined comparison
      existingReviewComment.body === reviewComment.body
    ) {
      matchedNodeIds.push(existingReviewComment.node_id);
    }
  }
  return matchedNodeIds;
}

export async function handlePullRequest(
  indexedResults: {
    [file: string]: ESLint.LintResult;
  },
  ruleMetaDatas: {
    [name: string]: Rule.RuleMetaData;
  },
  owner: string,
  repo: string,
  pullRequestNumber: number,
  baseSha: string,
  headSha: string,
) {
  const failCheck = getBooleanInput('fail-check');
  const requestChanges = getBooleanInput('request-changes');

  startGroup('GitHub Pull Request');
  const octokit = getOctokit();
  const files = await getPullRequestFiles(
    owner,
    repo,
    pullRequestNumber,
    octokit,
  );

  const existingReviewComments = await getReviewComments(
    owner,
    repo,
    pullRequestNumber,
    octokit,
  );

  const commentNodeIdToReviewThreadMapping = await g