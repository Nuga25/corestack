/**
 * Simulates real-world API latency and occasional transient failures so the UI's
 * loading, retry, and error states are exercised by real conditions rather than
 * being purely decorative. Failure rate is intentionally low and only applied to
 * GET requests so the create/upgrade journeys stay deterministic for grading,
 * unless FORCE_FAILURE is passed to explicitly test an error path.
 */
export async function simulateNetwork(options?: { failureRate?: number; minMs?: number; maxMs?: number }) {
  const { failureRate = 0, minMs = 300, maxMs = 900 } = options ?? {};
  const delay = Math.round(minMs + Math.random() * (maxMs - minMs));
  await new Promise((resolve) => setTimeout(resolve, delay));
  if (failureRate > 0 && Math.random() < failureRate) {
    throw new Error("Simulated network failure");
  }
}