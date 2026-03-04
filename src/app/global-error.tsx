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
      <body style={{ padding: 40, color: '#F5F0EA', background: '#0F0D0B', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h2 style={{ color: '#C84A4A', fontSize: 20, marginBottom: 12 }}>Something went wrong</h2>
        <p style={{ color: '#8A7E72', fontSize: 14, marginBottom: 24 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{ padding: '10px 24px', background: '#C8864A', color: '#0F0D0B', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
