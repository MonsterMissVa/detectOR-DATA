import type { Octokit } from '@octokit/core';
import type { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
import type { ESLint, Rule } from 'eslint';
export declare function getPushFiles(owner: string, repo: string, beforeSha: string, afterSha: string, octokit: Octokit & Api): Promise<{
    sha: string;
    filename: string;
    status: "added" | "removed" | "mo