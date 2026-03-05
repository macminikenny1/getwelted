'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { uploadImage } from '@/lib/uploadImage';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Payment info
  const [venmo, setVenmo] = useState('');
  const [cashapp, setCashapp] = useState('');
  const [paypal, setPaypal] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const supabase = createClient();
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setUsername(data.username);
          setDisplayName(data.display_name || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url);
          // Load payment info
          const pi = (data as any).payment_info;
          if (pi) {
            setVenmo(pi.venmo || '');
            setCashapp(pi.cashapp || '');
            setPaypal(pi.paypal || '');
          }
        }
        setLoading(false);
      });
  }, [user, authLoading, router]);

  const validateUsername = (value: string): string => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be at most 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores';
    return '';
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const url = await uploadImage(file, 'avatars', user.id);
    if (url) {
      setAvatarUrl(url);
      showToast('Photo uploaded');
    } else {
      showToast('Failed to upload photo', 'error');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }

    setSaving(true);
    const supabase = createClient();

    // Check username uniqueness if changed
    if (username !== profile.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', user.id)
        .single();

      if (existing) {
        setUsernameError('Username is already taken');
        setSaving(false);
        return;
      }
    }

    // Build payment_info object (only include non-empty values)
    const paymentInfo: Record<string, string> = {};
    if (venmo.trim()) paymentInfo.venmo = venmo.trim();
    if (cashapp.trim()) paymentInfo.cashapp = cashapp.trim();
    if (paypal.trim()) paymentInfo.paypal = paypal.trim();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: username.toLowerCase(),
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        payment_info: Object.keys(paymentInfo).length > 0 ? paymentInfo : null,
      })
      .eq('id', user.id);

    if (updateError) {
      showToast('Failed to save profile', 'error');
    } else {
      showToast('Profile saved');
      router.push('/profile');
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-welted-text-muted hover:text-welted-text transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-welted-text">Edit Profile</h1>
      </div>

      {/* Avatar Upload */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative group"
          disabled={uploading}
        >
          <Avatar url={avatarUrl} name={displayName || username} size="xl" />
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {uploading ? <Spinner size="sm" /> : <Camera size={24} className="text-white" />}
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-welted-text mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            maxLength={20}
            className="w-full rounded-lg border border-welted-border bg-welted-input-bg px-4 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:outline-none focus:ring-1 focus:ring-welted-accent"
            placeholder="username"
          />
          {usernameError && (
            <p className="text-welted-danger text-xs mt-1">{usernameError}</p>
          )}
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-welted-text mb-1.5">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            className="w-full rounded-lg border border-welted-border bg-welted-input-bg px-4 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:outline-none focus:ring-1 focus:ring-welted-accent"
            placeholder="Display Name"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-welted-text mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={300}
            className="w-full rounded-lg border border-welted-border bg-welted-input-bg px-4 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:outline-none focus:ring-1 focus:ring-welted-accent resize-none"
            placeholder="Tell us about your boot journey..."
          />
          <p className="text-welted-text-muted text-xs mt-1 text-right">{bio.length}/300</p>
        </div>
      </div>

      {/* Payment Info Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pt-2">
          <DollarSign size={18} className="text-welted-accent" />
          <h2 className="text-base font-bold text-welted-text">Payment Info</h2>
        </div>
        <p className="text-xs text-welted-text-muted -mt-2">
          Optional. Shown to buyers after you mark a listing as sold so they can pay you.
        </p>

        <div>
          <label className="block text-sm font-medium text-welted-text mb-1.5">Venmo</label>
          <input
            type="text"
            value={venmo}
            onChange={(e) => setVenmo(e.target.value)}
            className="w-full rounded-lg border border-welted-border bg-welted-input-bg px-4 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:outline-none focus:ring-1 focus:ring-welted-accent"
            placeholder="@yourhandle"
            autoCapitalize="none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-welted-text mb-1.5">Cash App</label>
          <input
            type="text"
            value={cashapp}
            onChange={(e) => setCashapp(e.target.value)}
            className="w-full rounded-lg border border-welted-border bg-welted-input-bg px-4 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:outline-none focus:ring-1 focus:ring-welted-accent"
            placeholder="$yourcashtag"
            autoCapitalize="none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-welted-text mb-1.5">PayPal</label>
          <input
            type="text"
            value={paypal}
            onChange={(e) => setPaypal(e.target.value)}
            className="w-full rounded-lg border border-welted-border bg-welted-input-bg px-4 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:outline-none focus:ring-1 focus:ring-welted-accent"
            placeholder="email@example.com"
            autoCapitalize="none"
          />
        </div>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving || !!usernameError} className="w-full">
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
