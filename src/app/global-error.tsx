'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ padding: 40, color: '#F5F0EA', background: '#0F0D0B', fontFamily: 'monospace' }}>
        <h2 style={{ color: '#C84A4A' }}>Global Error</h2>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#C8864A', margin: '20px 0' }}>
          {error.message}
        </pre>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#8A7E72', fontSize: 12 }}>
          {error.stack}
        </pre>
        <button
          onClick={reset}
          style={{ marginTop: 20, padding: '8px 16px', background: '#C8864A', color: '#0F0D0B', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
