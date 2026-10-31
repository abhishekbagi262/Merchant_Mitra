import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShoppingBag,
  TrendingDown,
  Sparkles,
  Award,
  Megaphone,
  X,
  ExternalLink,
  Check,
} from 'lucide-react';
import { api } from '../../api/client';
import { NotificationItem } from '../../types/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications({ limit: 40 });
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
      if (onUnreadCountChange) {
        onUnreadCountChange(res.unread_count);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Auto-poll every 10 seconds for new events
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (onUnreadCountChange) {
        onUnreadCountChange(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.is_read) {
      api.markNotificationRead(item.id).catch(console.error);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (onUnreadCountChange) {
        onUnreadCountChange(Math.max(0, unreadCount - 1));
      }
    }

    onClose();
    if (item.link) {
      navigate(item.link);
    } else if (item.related_entity_type === 'PRODUCT') {
      navigate('/products');
    } else if (item.related_entity_type === 'ORDER') {
      navigate('/transactions');
    } else if (item.related_entity_type === 'CAMPAIGN') {
      navigate('/campaign-insights');
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  const getCategoryIcon = (type: string, severity: string) => {
    switch (type) {
      case 'PURCHASE':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'LARGE_SALE':
        return <Sparkles className="w-4 h-4 text-teal-600" />;
      case 'CRITICAL_STOCK':
      case 'OUT_OF_STOCK':
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'PROFIT_DECLINE':
        return <TrendingDown className="w-4 h-4 text-rose-600" />;
      case 'CAMPAIGN':
        return <Megaphone className="w-4 h-4 text-blue-600" />;
      case 'LOYALTY':
        return <Award className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  const filteredList =
    filter === 'UNREAD' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-14 w-84 sm:w-96 max-w-[92vw] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-850 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/10 text-teal-300">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-tight">Notification Center</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-rose-500 text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-3xs text-slate-400 font-medium">Real-time alerts & store telemetry</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs & Mark All as Read */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-2xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filter === 'UNREAD'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={loading}
            className="text-teal-700 hover:text-teal-800 font-extrabold flex items-center gap-1 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {filteredList.length === 0 ? (
          <div className="py-12 px-6 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
            <p className="text-xs font-bold text-slate-700">All caught up!</p>
            <p className="text-3xs text-slate-400">
              {filter === 'UNREAD'
                ? 'No unread notifications at this time'
                : 'Events like sales, stock alerts, and campaign updates will appear here automatically'}
            </p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer text-left relative ${
                item.is_read
                  ? 'bg-white hover:bg-slate-50/80 text-slate-600'
                  : 'bg-teal-50/20 hover:bg-teal-50/40 text-slate-900 font-semibold'
              }`}
            >
              {/* Severity / Category Icon */}
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  item.severity === 'CRITICAL'
                    ? 'bg-rose-100'
                    : item.severity === 'WARNING'
                    ? 'bg-amber-100'
                    : item.severity === 'SUCCESS'
                    ? 'bg-emerald-100'
                    : 'bg-slate-100'
                }`}
              >
                {getCategoryIcon(item.notification_type, item.severity)}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {item.title}
                  </span>
                  <span className="text-3xs text-slate-400 shrink-0 font-medium">
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>

                <p className="text-2xs text-slate-600 leading-snug line-clamp-2 font-normal">
                  {item.message}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`text-3xs px-1.5 py-0.2 rounded font-extrabold uppercase ${
                      item.severity === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : item.severity === 'WARNING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : item.severity === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.notification_type.replace(/_/g, ' ')}
                  </span>

                  {!item.is_read && (
                    <button
                      onClick={(e) => handleMarkAsRead(e, item.id)}
                      className="text-3xs font-extrabold text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
                      title="Mark as read"
                    >
                      <span>Mark read</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Unread dot indicator */}
              {!item.is_read && (
                <span className="w-2 h-2 rounded-full bg-teal-500 absolute top-4 right-3 shrink-0 ring-2 ring-white" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-3xs font-bold text-slate-500">
        <span>Auto-syncing live events</span>
        <span className="font-mono">{notifications.length} total</span>
      </div>
    </div>
  );
};