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
import { getOctokit } fr