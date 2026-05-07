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

export type CheckSummary = "pass" | "fail" | "pending" | "running" | "none";
