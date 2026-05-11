export interface PullRequest {
  number: number;
  title: string;
  author: {
    login: string;
    name: string;
    is_bot: boolean;
  };
  headRefName: string;
  baseRefName: string;
  reviewDecision: string;
  reviewRequests: { login: string }[];
  statusCheckRollup: StatusCheck[];
  url: string;
  isDraft: boolean;
  createdAt: string;
  labels: Label[];
  assignees: { login: string }[];
  additions: number;
  deletions: number;
}

export interface StatusCheck {
  __typename: "CheckRun" | "StatusContext";
  name: string;
  status: string;
  conclusion: string;
  workflowName: string;
}

export interface Label {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface RepoInfo {
  nameWithOwner: string;
  branch: string;
}

export interface Comment {
  author: { login: string };
  body: string;
  createdAt: string;
}

export interface Issue {
  number: number;
  title: string;
  body: string;
  author: { login: string };
  assignees: { login: string }[];
  milestone: { title: string } | null;
  labels: Label[];
  comments: Comment[];
  createdAt: string;
  url: string;
}

export interface Milestone {
  number: number;
  title: string;
  description: string;
  due_on: string | null;
  open_issues: number;
  closed_issues: number;
  html_url: string;
}

export interface WorkflowRun {
  databaseId: number;
  displayTitle: string;
  workflowName: string;
  status: string;
  conclusion: string;
  headBranch: string;
  createdAt: string;
  url: string;
}

export interface Release {
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  isDraft: boolean;
  isPrerelease: boolean;
  isLatest: boolean;
  url: string;
  author: { login: string };
  downloadCount: number;
}

export interface WorkflowStep {
  name: string;
  conclusion: string;
}

export interface WorkflowJob {
  name: string;
  status: string;
  conclusion: string;
  steps: WorkflowStep[];
}

export interface Commit {
  hash: string;
  author: string;
  message: string;
  body: string;
  date: string;
}

export type CheckSummary = "pass" | "fail" | "pending" | "running" | "none";

export const VIEWS = ["dashboard", "prs", "issues", "actions", "milestones", "releases", "commits"] as const;
export type View = (typeof VIEWS)[number];

export const VIEW_LABELS: Record<View, string> = {
  dashboard: "Dashboard",
  prs: "PRs",
  issues: "Issues",
  actions: "Actions",
  milestones: "Milestones",
  releases: "Releases",
  commits: "Commits",
};
