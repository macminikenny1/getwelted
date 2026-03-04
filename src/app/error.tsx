'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <h2 className="text-welted-danger text-xl font-bold mb-3">Something went wrong</h2>
      <p className="text-welted-text-muted text-sm max-w-md mb-6">
        An unexpected error occurred. Please try again.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="text-left text-xs text-welted-text-muted bg-welted-card rounded-lg p-4 max-w-lg overflow-auto mb-6">
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
      )}
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-welted-accent text-welted-bg font-bold rounded-lg hover:bg-welted-accent-dim transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
