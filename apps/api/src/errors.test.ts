import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  PlanLimitError,
  InternalError,
  toErrorResponse,
} from './errors.js';

describe('AppError', () => {
  it('sets code, statusCode, and message', () => {
    const err = new AppError('INTERNAL_ERROR', 'something broke', 500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('something broke');
  });

  it('stores optional details', () => {
    const details = { field: 'weight', issue: 'must sum to 1' };
    const err = new AppError('VALIDATION_ERROR', 'bad input', 400, details);
    expect(err.details).toEqual(details);
  });

  it('is an instance of Error', () => {
    expect(new AppError('NOT_FOUND', 'x', 404)).toBeInstanceOf(Error);
  });
});

describe('ValidationError', () => {
  it('has statusCode 400 and code VALIDATION_ERROR', () => {
    const err = new ValidationError('bad body');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404 and code NOT_FOUND', () => {
    const err = new NotFoundError('SimulationJob', 'abc123');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toContain('abc123');
    expect(err.message).toContain('SimulationJob');
  });

  it('works without id', () => {
    const err = new NotFoundError('Resource');
    expect(err.message).toContain('Resource');
  });
});

describe('PlanLimitError', () => {
  it('has statusCode 402 and code PLAN_LIMIT_EXCEEDED', () => {
    const err = new PlanLimitError('too many paths');
    expect(err.statusCode).toBe(402);
    expect(err.code).toBe('PLAN_LIMIT_EXCEEDED');
  });
});

describe('InternalError', () => {
  it('has statusCode 500 and code INTERNAL_ERROR', () => {
    const err = new InternalError();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });

  it('accepts custom message', () => {
    const err = new InternalError('db timeout');
    expect(err.message).toBe('db timeout');
  });
});

describe('toErrorResponse', () => {
  it('serialises an AppError correctly', () => {
    const err = new ValidationError('bad field', { field: 'weight' });
    const resp = toErrorResponse(err);
    expect(resp.error.code).toBe('VALIDATION_ERROR');
    expect(resp.error.message).toBe('bad field');
    expect(resp.error.details).toEqual({ field: 'weight' });
  });

  it('omits details when not set', () => {
    const err = new NotFoundError('Job');
    const resp = toErrorResponse(err);
    expect('details' in resp.error).toBe(false);
  });

  it('returns INTERNAL_ERROR for unknown errors in test env', () => {
    // NODE_ENV=test → behaves like development (exposes message)
    const resp = toErrorResponse(new Error('raw internal error'));
    expect(resp.error.code).toBe('INTERNAL_ERROR');
  });

  it('returns generic message in production env', () => {
    const orig = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';
    const resp = toErrorResponse(new Error('secret details'));
    process.env['NODE_ENV'] = orig;
    expect(resp.error.message).toBe('Internal server error');
  });
});
