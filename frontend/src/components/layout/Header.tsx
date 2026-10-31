import React, { useState } from 'react';
import { Volume2, VolumeX, Store, Globe, Bell, Menu } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useMerchant } from '../../context/MerchantContext';
import { Language } from '../../i18n/translations';
import { DemoBadge } from '../common/DemoBadge';
import { NotificationPanel } from '../common/NotificationPanel';

interface HeaderProps {
  isSoundboxMuted: boolean;
  onToggleSoundboxMute: () => void;
  unreadAlertsCount?: number;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSoundboxMuted,
  onToggleSoundboxMute,
  unreadAlertsCount: initialUnreadCount = 0,
  onToggleMobileMenu,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { merchantName, storeName, location } = useMerchant();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile hamburger & Merchant/Store Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight truncate max-w-[140px] sm:max-w-none">
                {storeName}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t.header.storeOpen}
              </span>
            </div>
            <div className="text-3xs text-slate-500 flex items-center gap-2 font-medium">
              <span>Merchant: {merchantName}</span>
              <span className="hidden xs:inline">•</span>
              <span className="hidden xs:inline">{location}</span>
            </div>
          </div>
        </div>

        <DemoBadge className="hidden lg:inline-flex" />
      </div>

      {/* Right: Soundbox status, Language Selector, Alerts */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Soundbox audio toggle */}
        <button
          onClick={onToggleSoundboxMute}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isSoundboxMuted
              ? 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100'
              : 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
          }`}
          title={isSoundboxMuted ? 'Soundbox muted. Click to enable speech synthesis.' : 'Soundbox active. Click to mute.'}
        >
          {isSoundboxMuted ? (
            <VolumeX className="w-4 h-4 text-amber-600" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-600" />
          )}
          <span className="hidden sm:inline">
            {isSoundboxMuted ? t.header.soundboxMuted : t.header.soundboxActive}
          </span>
        </button>

        {/* Language selector */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1 hidden sm:inline" />
          {(['en', 'hi', 'kn'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-2xs sm:text-xs font-bold transition-all ${
                language === lang
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिंदी' : 'ಕನ್ನಡ'}
            </button>
          ))}
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            className={`relative p-2 rounded-xl transition-all ${
              isNotificationOpen
                ? 'bg-teal-50 text-teal-700 ring-2 ring-teal-500/20'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Merchant Notification Center"
            aria-label="Merchant Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-3xs font-extrabold flex items-center justify-center ring-2 ring-white shadow-xs animate-in fade-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Interactive Notification Panel Drawer */}
          <NotificationPanel
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            onUnreadCountChange={setUnreadCount}
          />
        </div>
      </div>
    </header>
  );
};
