import { mkdir, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { Activity } from "@effect/workflow";
import { Effect, Schema } from "effect";
import { Issue } from "../workflows/issue-to-preview-pr/schema";

const repository = "ralfboltshauser/laufwerk-todo-app-software-factory";
const protectedPrefixes = [
  "laufwerk/",
  ".github/",
  ".vercel/",
  ".env",
] as const;

const Worktree = Schema.Struct({ source: Schema.String, branch: Schema.String });
const PullRequest = Schema.Struct({
  number: Schema.Number,
  url: Schema.String,
  sha: Schema.String,
});
const Deployment = Schema.Struct({ url: Schema.String, sha: Schema.String });
const Merge = Schema.Struct({ sha: Schema.String });

export const fetchIssue = (issueNumber: number) =>
  activity("fetch-github-issue", Issue, async () => {
    const issue = JSON.parse(
      await capture([
        "gh",
        "issue",
        "view",
        String(issueNumber),
        "--repo",
        repository,
        "--json",
        "number,title,body,url,state",
      ]),
    ) as Issue & { readonly state: string };
    if (issue.state !== "OPEN") throw new Error(`Issue #${issueNumber} is not open`);
    return {
      number: issue.number,
      title: issue.title,
      body: issue.body ?? "",
      url: issue.url,
    };
  });

export const prepareWorktree = (issueNumber: number) =>
  activity("prepare-issue-worktree", Worktree, async () => {
    const root = process.cwd();
    const branch = `factory/issue-${issueNumber}`;
    const source = `.factory/worktrees/issue-${issueNumber}`;
    const destination = resolve(root, source);
    await mkdir(join(root, ".factory", "worktrees"), { recursive: true });

    if (await isDirectory(destination)) return { source, branch };

    await capture(["git", "fetch", "origin", "main"], root);
    await capture(["git", "worktree", "prune"], root);
    if (await succeeds(["git", "show-ref", "--verify", `refs/heads/${branch}`], root)) {
      await capture(["git", "worktree", "add", destination, branch], root);
    } else if (
      await succeeds(
        ["git", "show-ref", "--verify", `refs/remotes/origin/${branch}`],
        root,
      )
    ) {
      await capture(
        ["git", "worktree", "add", "-b", branch, destination, `origin/${branch}`],
        root,
      );
    } else {
      await capture(
        ["git", "worktree", "add", "-b", branch, destination, "origin/main"],
        root,
      );
    }
    return { source: relative(root, destination), branch };
  });

export const publishChanges = (input: {
  readonly issue: Issue;
  readonly source: string;
  readonly branch: string;
  readonly attempt: number;
}) => activity(`publish-changes-${input.attempt}`, PullRequest, async () => {
  const cwd = resolve(process.cwd(), input.source);
  const files = await changedFiles(cwd);
  if (files.length === 0) throw new Error("The implementation produced no changes");
  const protectedFile = files.find((file) =>
    protectedPrefixes.some((prefix) => file === prefix || file.startsWith(prefix))
  );
  if (protectedFile) throw new Error(`Protected path changed: ${protectedFile}`);

  await capture(["git", "add", "--all"], cwd);
  const commitMessage = input.attempt === 1
    ? `feat: resolve issue #${input.issue.number}`
    : `fix: address review for issue #${input.issue.number}`;
  await capture(["git", "commit", "-m", commitMessage], cwd);
  await capture(["git", "push", "--set-upstream", "origin", input.branch], cwd);
  const sha = (await capture(["git", "rev-parse", "HEAD"], cwd)).trim();

  const existing = JSON.parse(
    await capture([
      "gh",
      "pr",
      "list",
      "--repo",
      repository,
      "--head",
      input.branch,
      "--state",
      "open",
      "--json",
      "number,url",
    ], cwd),
  ) as readonly { readonly number: number; readonly url: string }[];
  const found = existing[0];
  if (found) return { ...found, sha };

  const url = (await capture([
    "gh",
    "pr",
    "create",
    "--repo",
    repository,
    "--draft",
    "--base",
    "main",
    "--head",
    input.branch,
    "--title",
    input.issue.title,
    "--body",
    [
      `Implements #${input.issue.number}.`,
      "",
      "Created by the repository's Laufwerk software factory.",
      "",
      `Closes #${input.issue.number}`,
    ].join("\n"),
  ], cwd)).trim();
  const created = JSON.parse(
    await capture(["gh", "pr", "view", url, "--json", "number,url"], cwd),
  ) as { readonly number: number; readonly url: string };
  return { ...created, sha };
});

export const awaitDeployment = (input: {
  readonly sha: string;
  readonly environment: "Preview" | "Production";
  readonly attempt: number;
}) => activity(
  `await-${input.environment.toLowerCase()}-${input.attempt}`,
  Deployment,
  async () => {
    const deadline = Date.now() + 10 * 60_000;
    while (Date.now() < deadline) {
      const deployments = JSON.parse(
        await capture([
          "gh",
          "api",
          `repos/${repository}/deployments?sha=${input.sha}&per_page=20`,
        ]),
      ) as readonly {
        readonly id: number;
        readonly environment: string;
      }[];
      for (const deployment of deployments) {
        if (deployment.environment.toLowerCase() !== input.environment.toLowerCase()) {
          continue;
        }
        const statuses = JSON.parse(
          await capture([
            "gh",
            "api",
            `repos/${repository}/deployments/${deployment.id}/statuses`,
          ]),
        ) as readonly {
          readonly state: string;
          readonly environment_url?: string;
        }[];
        const latest = statuses[0];
        if (latest?.state === "success" && latest.environment_url) {
          return { url: latest.environment_url, sha: input.sha };
        }
        if (latest?.state === "failure" || latest?.state === "error") {
          throw new Error(`${input.environment} deployment failed for ${input.sha}`);
        }
      }
      await Bun.sleep(5_000);
    }
    throw new Error(`Timed out waiting for ${input.environment} deployment ${input.sha}`);
  },
);

export const mergePullRequest = (prNumber: number) =>
  activity("merge-pull-request", Merge, async () => {
    const before = await pullRequestState(prNumber);
    if (!before.mergedAt) {
      await capture([
        "gh",
        "pr",
        "ready",
        String(prNumber),
        "--repo",
        repository,
      ]);
      await capture([
        "gh",
        "pr",
        "merge",
        String(prNumber),
        "--repo",
        repository,
        "--squash",
      ]);
    }
    const merged = await pullRequestState(prNumber);
    if (!merged.mergeCommit?.oid) throw new Error(`PR #${prNumber} has no merge commit`);
    return { sha: merged.mergeCommit.oid };
  });

export const reportCompletion = (input: {
  readonly issueNumber: number;
  readonly prUrl: string;
  readonly deploymentUrl: string;
}) => activity("report-issue-completion", Schema.Void, async () => {
  const marker = `<!-- laufwerk-factory:${input.issueNumber}:completed -->`;
  const comments = JSON.parse(
    await capture([
      "gh",
      "issue",
      "view",
      String(input.issueNumber),
      "--repo",
      repository,
      "--json",
      "comments",
    ]),
  ) as { readonly comments: readonly { readonly body: string }[] };
  if (comments.comments.some((comment) => comment.body.includes(marker))) return;
  await capture([
    "gh",
    "issue",
    "comment",
    String(input.issueNumber),
    "--repo",
    repository,
    "--body",
    `${marker}\nImplemented in ${input.prUrl} and verified at ${input.deploymentUrl}.`,
  ]);
});

const pullRequestState = async (prNumber: number) => JSON.parse(
  await capture([
    "gh",
    "pr",
    "view",
    String(prNumber),
    "--repo",
    repository,
    "--json",
    "mergedAt,mergeCommit",
  ]),
) as {
  readonly mergedAt: string | null;
  readonly mergeCommit: { readonly oid: string } | null;
};

const changedFiles = async (cwd: string): Promise<readonly string[]> => {
  const [tracked, staged, untracked] = await Promise.all([
    capture(["git", "diff", "--name-only"], cwd),
    capture(["git", "diff", "--cached", "--name-only"], cwd),
    capture(["git", "ls-files", "--others", "--exclude-standard"], cwd),
  ]);
  return [...new Set(`${tracked}\n${staged}\n${untracked}`.split("\n").filter(Boolean))];
};

const activity = <A, I>(
  name: string,
  success: Schema.Schema<A, I, never>,
  execute: () => Promise<A>,
) => Activity.make({
  name,
  success,
  error: Schema.String,
  execute: Effect.tryPromise({
    try: execute,
    catch: (cause) => cause instanceof Error ? cause.message : String(cause),
  }),
});

const capture = async (
  command: readonly string[],
  cwd = process.cwd(),
): Promise<string> => {
  const process = Bun.spawn([...command], { cwd, stdout: "pipe", stderr: "pipe" });
  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]);
  if (exitCode !== 0) {
    throw new Error(`${command[0]} failed (${exitCode}): ${stderr.trim() || stdout.trim()}`);
  }
  return stdout;
};

const succeeds = async (command: readonly string[], cwd: string) => {
  const process = Bun.spawn([...command], { cwd, stdout: "ignore", stderr: "ignore" });
  return (await process.exited) === 0;
};

const isDirectory = async (path: string) =>
  stat(path).then((value) => value.isDirectory()).catch(() => false);
