import { vi } from 'vitest';

/**
 * Faux BullMQ pour les tests unitaires : aucune connexion Redis, mais on garde la trace des files
 * et des workers créés (nom, processeur, options, gestionnaires d'événements).
 * À utiliser dans `vi.mock('bullmq', async () => (await import('../helpers/bullmq-fake')).bullmqFake)`.
 */
export interface FakeQueue {
  name: string;
  opts: Record<string, unknown>;
  add: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  upsertJobScheduler: ReturnType<typeof vi.fn>;
}
export interface FakeWorker {
  name: string;
  processor: (job: unknown) => Promise<unknown>;
  opts: Record<string, unknown>;
  handlers: Record<string, (...args: unknown[]) => unknown>;
  close: ReturnType<typeof vi.fn>;
}

export const fakeQueues: FakeQueue[] = [];
export const fakeWorkers: FakeWorker[] = [];

class Queue implements FakeQueue {
  add = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
  upsertJobScheduler = vi.fn().mockResolvedValue(undefined);
  constructor(public name: string, public opts: Record<string, unknown> = {}) {
    fakeQueues.push(this);
  }
}

class Worker implements FakeWorker {
  handlers: Record<string, (...args: unknown[]) => unknown> = {};
  close = vi.fn().mockResolvedValue(undefined);
  constructor(public name: string, public processor: (job: unknown) => Promise<unknown>, public opts: Record<string, unknown> = {}) {
    fakeWorkers.push(this);
  }
  on(event: string, handler: (...args: unknown[]) => unknown) {
    this.handlers[event] = handler;
    return this;
  }
}

export const bullmqFake = { Queue, Worker };

export const queueNamed = (name: string) => fakeQueues.find((q) => q.name === name);
export const workerNamed = (name: string) => fakeWorkers.find((w) => w.name === name);
