export const logError = (context: string, error: unknown) => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  // In production, errors are silently handled or could be sent to an error tracking service
};
