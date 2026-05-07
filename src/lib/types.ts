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
  statusCheckRollup: StatusCheck[];
  url: string;
  isDraft: boolean;
  createdAt: string;
  labels: Label[];
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

export interface Issue {
  number: number;
  title: string;
  author: { login: string };
  labels: Label[];
  createdAt: string;
  url: string;
}

export type CheckSummary = "pass" | "fail" | "pending" | "running" | "none";

export const VIEWS = ["prs", "issues", "actions", "milestones", "releases"] as const;
export type View = (typeof VIEWS)[number];

export const VIEW_LABELS: Record<View, string> = {
  prs: "PRs",
  issues: "Issues",
  actions: "Actions",
  milestones: "Milestones",
  releases: "Releases",
};
