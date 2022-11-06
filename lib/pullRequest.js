
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePullRequest = exports.matchReviewComments = exports.getCommentFromFix = exports.getReviewThreads = exports.getReviewComments = exports.getPullRequestFiles = void 0;
const core_1 = require("@actions/core");
const getIndexedModifiedLines_1 = require("./getIndexedModifiedLines");
const getOctokit_1 = require("./getOctokit");
const REVIEW_BODY = "ESLint doesn't pass. Please fix all ESLint issues.";
function getPullRequestFiles(owner, repo, pullRequestNumber, octokit) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: pullRequestNumber,
        });
        (0, core_1.info)(`Files: (${response.data.length})`);
        return response.data;
    });
}
exports.getPullRequestFiles = getPullRequestFiles;
function getReviewComments(owner, repo, pullRequestNumber, octokit) {
    return __awaiter(this, void 0, void 0, function* () {
        const reviews = yield octokit.rest.pulls.listReviews({
            owner,
            repo,
            pull_number: pullRequestNumber,
        });
        const reviewComments = yield octokit.rest.pulls.listReviewComments({
            owner,
            repo,
            pull_number: pullRequestNumber,
        });
        const relevantReviews = reviews.data.filter((review) => { var _a; return ((_a = review.user) === null || _a === void 0 ? void 0 : _a.id) === 41898282 && review.body === REVIEW_BODY; });
        const relevantReviewIds = relevantReviews.map((review) => review.id);
        const relevantReviewComments = reviewComments.data.filter((reviewComment) => reviewComment.user.id === 41898282 &&
            reviewComment.pull_request_review_id !== null &&
            relevantReviewIds.includes(reviewComment.pull_request_review_id));
        (0, core_1.info)(`Existing review comments: (${relevantReviewComments.length})`);
        return relevantReviewComments;
    });
}
exports.getReviewComments = getReviewComments;
function getReviewThreads(owner, repo, pullRequestNumber, octokit) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __awaiter(this, void 0, void 0, function* () {
        const commentNodeIdToReviewThreadMapping = {};
        const queryData = yield octokit.graphql(`
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
    `, {
            owner,
            repo,
            pullRequestNumber,
        });
        const reviewThreadTotalCount = (_c = (_b = (_a = queryData === null || queryData === void 0 ? void 0 : queryData.repository) === null || _a === void 0 ? void 0 : _a.pullRequest) === null || _b === void 0 ? void 0 : _b.reviewThreads) === null || _c === void 0 ? void 0 : _c.totalCount;
        if (reviewThreadTotalCount !== undefined && reviewThreadTotalCount > 100) {
            (0, core_1.error)(`There are more than 100 review threads: ${reviewThreadTotalCount}`);
        }
        const reviewThreads = (_f = (_e = (_d = queryData === null || queryData === void 0 ? void 0 : queryData.repository) === null || _d === void 0 ? void 0 : _d.pullRequest) === null || _e === void 0 ? void 0 : _e.reviewThreads) === null || _f === void 0 ? void 0 : _f.nodes;
        if (reviewThreads !== undefined && reviewThreads !== null) {
            for (const reviewThread of reviewThreads) {