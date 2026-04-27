import type { SimulationKind } from '../simulation-kind.js';

export type JobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export type SimulationJob = {
  id: string;
  userId?: string;
  orgId?: string;
  kind: SimulationKind;
  status: JobStatus;
  inputHash: string;
  configHash: string;
  engineVersion: string;
  seed: number;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  failedAt?: Date;
  errorCode?: string;
  errorMessage?: string;
};

export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'PLAN_LIMIT_EXCEEDED'
  | 'JOB_NOT_FOUND'
  | 'JOB_FAILED'
  | 'SIMULATION_TIMEOUT'
  | 'ENGINE_ERROR'
  | 'INTERNAL_ERROR';

export type SimulationErrorCode =
  | 'CORRELATION_MATRIX_INVALID'
  | 'CORRELATION_MATRIX_SINGULAR'
  | 'WEIGHTS_DO_NOT_SUM_TO_ONE'
  | 'NEGATIVE_VOLATILITY'
  | 'STUDENT_T_DF_REQUIRED'
  | 'SIMULATION_NUMERIC_FAILURE'
  | 'PATHS_EXCEED_PLAN_LIMIT'
  | 'UNSUPPORTED_SIMULATION_KIND'
  | 'INVALID_HORIZON';
