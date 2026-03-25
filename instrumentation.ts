/**
 * Next.js instrumentation — runs once when the Node.js server starts.
 * Initializes OpenTelemetry with Langfuse so traces are sent to Langfuse.
 * Skips setup if LANGFUSE_SECRET_KEY is not set.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.LANGFUSE_SECRET_KEY) {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { LangfuseSpanProcessor } = await import('@langfuse/otel');

    const processor = new LangfuseSpanProcessor({
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL ?? 'https://us.cloud.langfuse.com',
      // Send spans as soon as they end (recommended for serverless / fast visibility)
      exportMode: 'immediate',
    });

    const sdk = new NodeSDK({
      spanProcessors: [processor],
    });
    sdk.start();
  }
}