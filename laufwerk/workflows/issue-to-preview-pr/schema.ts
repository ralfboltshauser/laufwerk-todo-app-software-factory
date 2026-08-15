import { Schema } from "effect";

export const Issue = Schema.Struct({
  number: Schema.Number,
  title: Schema.String,
  body: Schema.String,
  url: Schema.String,
});

export const Plan = Schema.Struct({
  summary: Schema.String,
  steps: Schema.Array(Schema.String),
  acceptanceCriteria: Schema.Array(Schema.String),
  expectedFiles: Schema.Array(Schema.String),
});

export const Implementation = Schema.Struct({
  summary: Schema.String,
  changedFiles: Schema.Array(Schema.String),
  verification: Schema.Array(Schema.String),
});

export const Verification = Schema.Struct({
  approved: Schema.Boolean,
  summary: Schema.String,
  blockers: Schema.Array(Schema.String),
});

export const WorkflowResult = Schema.Struct({
  status: Schema.Literal(
    "declined",
    "ready-for-merge",
    "merged",
    "merged-verification-failed",
  ),
  issueNumber: Schema.Number,
  prUrl: Schema.NullOr(Schema.String),
  deploymentUrl: Schema.NullOr(Schema.String),
  summary: Schema.String,
});

export type Issue = typeof Issue.Type;
export type Plan = typeof Plan.Type;
export type Implementation = typeof Implementation.Type;
export type Verification = typeof Verification.Type;
