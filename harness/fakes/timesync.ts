/** No server round trip in the harness; the local clock is the truth. */
export const MIN_RESYNC_MS = 5 * 60_000;

export const now = () => Date.now();

export class SyncFailed extends Error {
  readonly name = 'SyncFailed';
}

export async function syncTime(): Promise<void> {
  return;
}
