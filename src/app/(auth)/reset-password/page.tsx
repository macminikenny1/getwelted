'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Redirect to home after a short delay
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-welted-success/20 flex items-center justify-center">
            <CheckCircle size={28} className="text-welted-success" />
          </div>
          <h1 className="text-welted-text font-bold text-xl mb-2">Password updated</h1>
          <p className="text-welted-text-muted text-sm">
            Your password has been successfully reset. Redirecting you to the app...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <h1 className="text-welted-accent font-black tracking-[0.4em] text-3xl mb-2">WELTED</h1>
        <p className="text-welted-text-muted text-sm">Set a new password</p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        {error && (
          <div className="bg-welted-danger/10 border border-welted-danger/30 rounded-lg px-4 py-3 text-welted-danger text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-welted-text-muted text-xs font-semibold uppercase tracking-wider mb-2">New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-welted-text placeholder:text-welted-text-muted/50 focus:border-welted-accent outline-none transition-colors"
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-welted-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-welted-text placeholder:text-welted-text-muted/50 focus:border-welted-accent outline-none transition-colors"
            placeholder="Confirm your new password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-welted-accent hover:bg-welted-accent-dim text-welted-bg font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <p className="text-center mt-6">
        <Link href="/login" className="text-welted-text-muted text-sm hover:text-welted-text transition-colors inline-flex items-center gap-1">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
