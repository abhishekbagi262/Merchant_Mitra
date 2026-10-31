import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Users,
  Megaphone,
  BarChart3,
  TrendingUp,
  Bot,
  Settings,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { t } = useLanguage();

  const navItems = [
    { to: '/', label: t.nav.overview, icon: LayoutDashboard },
    { to: '/pos', label: t.nav.pos, icon: ShoppingCart, badge: 'Counter' },
    { to: '/products', label: t.nav.products, icon: Package },
    { to: '/transactions', label: t.nav.transactions, icon: Receipt },
    { to: '/customers', label: t.nav.customers, icon: Users },
    { to: '/campaigns', label: t.nav.campaigns, icon: Megaphone },
    { to: '/campaign-insights', label: t.nav.campaignInsights, icon: BarChart3, badge: 'Holdout' },
    { to: '/analytics', label: t.nav.analytics, icon: TrendingUp },
    { to: '/assistant', label: t.nav.askMitra, icon: Bot, isAi: true },
    { to: '/settings', label: t.nav.settings, icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="h-16 px-5 sm:px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
              <span>{t.appName}</span>
              <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                v1.0
              </span>
            </div>
            <p className="text-3xs text-slate-400 font-medium tracking-wide truncate max-w-[140px]">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Close button on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-3xs font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>

        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-3xs px-1.5 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700 font-semibold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="px-3 pt-5 pb-2 text-3xs font-bold uppercase tracking-wider text-slate-400">
          Growth & Analytics
        </div>

        {navItems.slice(4, 8).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-3xs px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="px-3 pt-5 pb-2 text-3xs font-bold uppercase tracking-wider text-slate-400">
          Intelligence & Control
        </div>

        {navItems.slice(8).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-xs font-bold'
                    : item.isAi
                    ? 'text-teal-300 hover:bg-slate-800/80 hover:text-teal-200'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${item.isAi ? 'text-teal-400' : ''}`} />
                <span>{item.label}</span>
              </div>
              {item.isAi && (
                <span className="text-3xs px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-extrabold border border-teal-500/30">
                  AI
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-3xs text-slate-400 space-y-1 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Verified Engine</span>
        </div>
        <p className="text-slate-400">Zero Hallucinations • Decimal-Safe</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0 min-h-screen border-r border-slate-800 shadow-xl z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-72 max-w-[85vw] h-full shadow-2xl z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};