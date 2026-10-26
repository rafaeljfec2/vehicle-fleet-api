import { describe, expect, it } from 'vitest';
import { AsyncMutex } from '../../src/shared/concurrency/async-mutex.js';

describe('AsyncMutex', () => {
  it('runs exclusive sections sequentially', async () => {
    const mutex = new AsyncMutex();
    const order: number[] = [];

    const first = mutex.runExclusive(async () => {
      order.push(1);
      await new Promise((resolve) => setTimeout(resolve, 20));
      order.push(2);
      return 'a';
    });

    const second = mutex.runExclusive(async () => {
      order.push(3);
      return 'b';
    });

    const results = await Promise.all([first, second]);
    expect(results).toEqual(['a', 'b']);
    expect(order).toEqual([1, 2, 3]);
  });
});
