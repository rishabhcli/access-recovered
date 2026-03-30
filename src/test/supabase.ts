import { vi } from "vitest";

export interface SupabaseResult<T> {
  data: T;
  error: unknown;
}

export function createSupabaseResult<T>(data: T, error: unknown = null): SupabaseResult<T> {
  return { data, error };
}

export function createQueryBuilder<T>(result: SupabaseResult<T>) {
  const promise = Promise.resolve(result);
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  };

  return builder;
}
