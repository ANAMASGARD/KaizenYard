export async function withDbRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message : String(error);
      const transient =
        message.includes("fetch failed") ||
        message.includes("ETIMEDOUT") ||
        message.includes("ECONNRESET");
      if (!transient || i === attempts - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 800 * (i + 1)));
    }
  }
  throw lastError;
}
