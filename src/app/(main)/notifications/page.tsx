'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Heart, MessageCircle, UserPlus, Package, ArrowLeftRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { formatTimeAgo } from '@/lib/formatTime';

const ICON_MAP: Record<string, React.ReactNode> = {
  like: <Heart size={14} className="text-welted-danger" />,
  comment: <MessageCircle size={14} className="text-welted-accent" />,
  follow: <UserPlus size={14} className="text-welted-success" />,
  message: <MessageCircle size={14} className="text-welted-text-muted" />,
  trade_offer: <Package size={14} className="text-welted-accent" />,
  trade_accepted: <ArrowLeftRight size={14} className="text-welted-success" />,
};

function getNotificationHref(notification: Notification): string {
  switch (notification.type) {
    case 'like':
    case 'comment':
      return notification.target_id ? `/post/${notification.target_id}` : '#';
    case 'follow':
      return notification.actor?.username ? `/user/${notification.actor.username}` : '#';
    case 'message':
      return notification.target_id ? `/messages/${notification.target_id}` : '/messages';
    case 'trade_offer':
    case 'trade_accepted':
      return notification.target_id ? `/messages/${notification.target_id}` : '/messages';
    default:
      return '#';
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const supabase = createClient();
    supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data as unknown as Notification[]);
        setLoading(false);
      });
  }, [user, authLoading, router]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    setMarkingRead(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read');
    } else {
      showToast('Failed to mark notifications', 'error');
    }
    setMarkingRead(false);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read && user) {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id)
        .eq('user_id', user.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }

    const href = getNotificationHref(notification);
    if (href !== '#') router.push(href);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-welted-text">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingRead}
          >
            <CheckCheck size={16} className="mr-1.5" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="mx-auto text-welted-text-muted/30 mb-4" />
          <p className="text-welted-text-muted text-sm">
            No notifications yet. Interactions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(notification => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleNotificationClick(notification)}
              className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-lg transition-colors ${
                notification.read
                  ? 'hover:bg-welted-card'
                  : 'bg-welted-accent/5 hover:bg-welted-accent/10'
              }`}
            >
              {/* Unread Dot */}
              <div className="pt-2 w-2 shrink-0">
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-welted-accent" />
                )}
              </div>

              {/* Actor Avatar */}
              <Avatar
                url={notification.actor?.avatar_url}
                name={notification.actor?.username || '?'}
                size="md"
              />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-welted-text">
                  <span className="font-semibold">
                    {notification.actor?.username || 'Someone'}
                  </span>{' '}
                  <span className="text-welted-text-muted">{notification.body}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {ICON_MAP[notification.type]}
                  <span className="text-xs text-welted-text-muted">
                    {formatTimeAgo(notification.created_at)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
